import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { extractTagCodeFromUrl } from '../lib/utils';
import type { Restaurant, Tag, Ad } from '../types';
import { DirectRedirect } from '../components/client/DirectRedirect';
import { ReviewRating } from '../components/client/ReviewRating';
import { FeedbackModal } from '../components/client/FeedbackModal';
import { LinkTreeSection } from '../components/client/LinkTreeSection';
import { AdBanner } from '../components/client/AdBanner';
import { TagStatusFallback } from '../components/client/TagStatusFallback';
import { Loader2 } from 'lucide-react';

export const ResolverPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<Tag | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [negativeRatingSelected, setNegativeRatingSelected] = useState<(1 | 2 | 3) | null>(null);

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
          const matchedAd = await api.getAdForPlacement(loadedTag.tag_code, loadedRestaurant.id);
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

  // ============================================================================
  // TIER 1: ENLACE DIRECTO (Con o sin transición de anuncio)
  // ============================================================================
  if (restaurant.tier === 1) {
    return (
      <DirectRedirect
        restaurant={restaurant}
        ad={ad}
        tableIdentifier={tag.table_identifier}
      />
    );
  }

  // ============================================================================
  // TIER 2 & TIER 3: FILTRO DE SATISFACCIÓN (+ LINKTREE EN TIER 3)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center pt-2 sm:pt-4">
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

