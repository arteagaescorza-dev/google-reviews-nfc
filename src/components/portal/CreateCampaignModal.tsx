import React, { useState } from 'react';
import type { Restaurant } from '../../types';
import { api } from '../../lib/api';
import {
  Megaphone,
  X,
  Sparkles,
    Image,
  ExternalLink,
  Ticket,
  AlertCircle,
} from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onSuccess: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [advertiserName, setAdvertiserName] = useState(restaurant.name || restaurant.brand_name || '');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
  );
  const [destinationUrl, setDestinationUrl] = useState(
    restaurant.manager_phone
      ? `https://wa.me/${restaurant.manager_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          'Hola, vi su anuncio en mesa y me interesa su promoción.'
        )}`
      : 'https://wa.me/'
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentBalance = restaurant.ad_credit_balance || (restaurant.tier >= 3 ? 500 : 0);
  const hasCredit = currentBalance >= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !advertiserName || !destinationUrl) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.createAdCampaign({
        title,
        advertiser_name: advertiserName,
        banner_url: bannerUrl,
        destination_url: destinationUrl,
        restaurant_id: restaurant.id,
        useCredit: hasCredit,
        coupon_code: couponCode.trim().toUpperCase() || undefined,
        coupon_description: couponDescription || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al crear la campaña');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Pautar Anuncio en la Red Local
              </h3>
              <p className="text-xs text-slate-500">
                Tu anuncio rotará en las mesas de comercios aliados en tu zona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saldo Publicitario Disponible */}
        <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-amber-900">
              Saldo Publicitario Disponible:
            </span>
          </div>
          <span className="font-black text-amber-900 text-sm">
            ${currentBalance} MXN
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título de la Promoción u Oferta *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: 2x1 en Pizzas Artesanales los martes"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Comercial de tu Negocio *
            </label>
            <input
              type="text"
              required
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Enlace de Destino (WhatsApp o Sitio Web) *
            </label>
            <div className="relative">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://wa.me/5255... o https://..."
                className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Imagen del Banner (1200 x 628 px)
            </label>
            <div className="relative">
              <Image className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 text-slate-600"
              />
            </div>
            {bannerUrl && (
              <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={bannerUrl} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Cupón Opcional */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-blue-600" />
              <span>Cupón Digital en Mesa (Opcional)</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Código Único:</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ej: PIZZA-2X1"
                  className="w-full p-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Beneficio al canjear:</label>
                <input
                  type="text"
                  value={couponDescription}
                  onChange={(e) => setCouponDescription(e.target.value)}
                  placeholder="Ej: 2x1 en pizza mediana"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Resumen de cobro */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">
                {hasCredit ? 'Cubierto con tu Saldo Publicitario' : 'Pago de Campaña Mensual'}
              </span>
              <span className="text-[11px] text-emerald-700">
                {hasCredit ? 'Se descontarán $500 MXN de tu saldo disponible' : 'Costo regular: $499 MXN / mes'}
              </span>
            </div>
            <strong className="text-sm font-black text-emerald-800">
              {hasCredit ? '$0 MXN' : '$499 MXN'}
            </strong>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>{isSubmitting ? 'Publicando...' : 'Lanzar Campaña en Mesas Aliadas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
