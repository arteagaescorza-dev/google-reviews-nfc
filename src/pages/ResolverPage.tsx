import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { extractTagCodeFromUrl, ensureAbsoluteUrl } from '../lib/utils';
import type { Restaurant, Tag, Ad } from '../types';
import { DirectRedirect } from '../components/client/DirectRedirect';
import { ReviewRating } from '../components/client/ReviewRating';
import { FeedbackModal } from '../components/client/FeedbackModal';
import { LinkTreeSection } from '../components/client/LinkTreeSection';
import { AdBanner } from '../components/client/AdBanner';
import { TagStatusFallback } from '../components/client/TagStatusFallback';
import { CartModal } from '../components/resolver/CartModal';
import {
  Loader2,
  BellRing,
  Receipt,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const ResolverPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<Tag | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [negativeRatingSelected, setNegativeRatingSelected] = useState<(1 | 2 | 3) | null>(null);

  // Estados operativos de mesa (Fase Producto)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [callToast, setCallToast] = useState<{ message: string; type: 'waiter' | 'bill' } | null>(null);
  const [activeOrderNotification, setActiveOrderNotification] = useState<{ id: string; itemsCount: number } | null>(null);

  // Obtener código de tag de la URL (?t=NFC-001 o #/t/NFC-001)
  const tagCode = searchParams.get('t') || searchParams.get('tag') || extractTagCodeFromUrl() || 'NFC-002';

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      const { tag: loadedTag, restaurant: loadedRestaurant } = await api.getTagDetails(tagCode);

      if (!isMounted) return;

      setTag(loadedTag);
      setRestaurant(loadedRestaurant);

      if (loadedTag && loadedRestaurant) {
        // Registrar escaneo en segundo plano (Tier 4)
        api.recordScan(loadedTag.tag_code);

        // Si el restaurante no ha pagado por eliminar anuncios, buscar el anuncio correspondiente
        if (!loadedRestaurant.is_ad_free) {
          const matchedAd = await api.getAdForPlacement(loadedTag.tag_code, loadedRestaurant.id, loadedRestaurant.tier === 1);
          if (isMounted) {
            setAd(matchedAd);
          }
        }
      }

      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tagCode]);

  // Manejo de llamada a mesero en mesa
  const handleCallWaiter = async () => {
    if (!restaurant || !tag) return;
    await api.createTableCall({
      restaurant_id: restaurant.id,
      tag_code: tag.tag_code,
      table_number: tag.table_identifier || 'Mesa 4',
      call_type: 'waiter',
    });
    setCallToast({ message: 'Mesero notificado a tu mesa. En camino...', type: 'waiter' });
    setTimeout(() => setCallToast(null), 4000);
  };

  // Manejo de pedir la cuenta en mesa
  const handleRequestBill = async () => {
    if (!restaurant || !tag) return;
    await api.createTableCall({
      restaurant_id: restaurant.id,
      tag_code: tag.tag_code,
      table_number: tag.table_identifier || 'Mesa 4',
      call_type: 'bill_card',
    });
    setCallToast({ message: 'Solicitud de cuenta enviada a sala con terminal.', type: 'bill' });
    setTimeout(() => setCallToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Cargando...</p>
      </div>
    );
  }

  // Si el tag no existe o no tiene restaurante asignado
  if (!tag || !restaurant) {
    return <TagStatusFallback tagCode={tagCode} reason={!tag ? 'not_found' : 'unassigned'} />;
  }

  // Si la sucursal o el tag están pausados o inactivos:
  if (restaurant.is_active === false || tag.is_active === false) {
    if (restaurant.google_review_url) {
      const safeRedirectUrl = ensureAbsoluteUrl(restaurant.google_review_url);
      if (safeRedirectUrl && safeRedirectUrl !== '#') {
        window.location.replace(safeRedirectUrl);
      }
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <h2 className="text-base font-bold text-slate-800 mb-1">Redirigiendo a Google Reviews...</h2>
        <p className="text-xs text-slate-500 max-w-xs">
          Serás transferido directamente a la ficha oficial para dejar tu opinión.
        </p>
      </div>
    );
  }

  // TIER 1: ENLACE DIRECTO
  if (restaurant.tier === 1) {
    return (
      <DirectRedirect
        restaurant={restaurant}
        ad={ad}
        tableIdentifier={tag.table_identifier}
      />
    );
  }

  // TIER 2 & TIER 3: FILTRO DE SATISFACCIÓN + OPERACIÓN EN MESA
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto relative pb-24">
      {/* Notificación Toast Flotante de Asistencia en Mesa */}
      {callToast && (
        <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-50 p-3 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-2.5 animate-fadeIn border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-bold">{callToast.message}</p>
        </div>
      )}

      {/* Notificación de Comanda Activa en Cocina */}
      {activeOrderNotification && (
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            <div>
              <p className="text-xs font-black">Comanda #{activeOrderNotification.id.slice(-4)} en Cocina</p>
              <p className="text-[10px] opacity-90">{activeOrderNotification.itemsCount} platillos en preparación</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
            ~15 min
          </span>
        </div>
      )}

      {/* Botones de Utilidad de Servicio en Mesa (Llamar Mesero / Pedir Cuenta) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={handleCallWaiter}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <BellRing className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold">Llamar Mesero</span>
        </button>

        <button
          type="button"
          onClick={handleRequestBill}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold">Pedir la Cuenta</span>
        </button>
      </div>

      {/* Botón Principal: Menú & Comanda Digital en Mesa */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsCartModalOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs shadow-md hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/20">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="block font-black text-sm">Menú & Pedir en Mesa</span>
              <span className="block text-[10px] text-orange-100">Envía tus platillos directo a cocina</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white text-orange-700 font-black text-[11px] shadow-xs">
            Ver Carta &rarr;
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-1">
        {/* Widget interactivo de calificación con estrellas */}
        <ReviewRating
          restaurant={restaurant}
          tableIdentifier={tag.table_identifier}
          onNegativeRating={(rating) => setNegativeRatingSelected(rating)}
        />

        {/* En Tier 3: Linktree de la marca (Menú, Instagram, Wi-Fi, etc.) */}
        {restaurant.tier >= 3 && (
          <LinkTreeSection
            links={restaurant.links}
            brandColor={restaurant.brand_color}
          />
        )}
      </div>

      {/* Modal de Carrito y Comanda en Mesa */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        restaurant={restaurant}
        tagCode={tag.tag_code}
        tableIdentifier={tag.table_identifier}
        onOrderPlaced={(orderId, count) => {
          setActiveOrderNotification({ id: orderId, itemsCount: count });
        }}
      />

      {/* Modal de queja privada cuando pulsa 1, 2 o 3 estrellas */}
      <FeedbackModal
        isOpen={negativeRatingSelected !== null}
        onClose={() => setNegativeRatingSelected(null)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        googleReviewUrl={restaurant.google_review_url}
        tagCode={tag.tag_code}
        rating={negativeRatingSelected || 2}
      />

      {/* Banner publicitario si no es ad-free */}
      {!restaurant.is_ad_free && <AdBanner ad={ad} />}
    </div>
  );
};
