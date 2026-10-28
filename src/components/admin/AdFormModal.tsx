import React, { useState, useEffect } from 'react';
import type { Ad, Restaurant } from '../../types';
import { api } from '../../lib/api';
import { normalizeImageUrl } from '../../lib/utils';
import { X, Megaphone } from 'lucide-react';

interface AdFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  ad?: Ad | null;
  restaurants: Restaurant[];
}

export const AdFormModal: React.FC<AdFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  ad,
  restaurants,
}) => {
  const [title, setTitle] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific_restaurants' | 'specific_tags'>('all');
  const [targetRestaurantIds, setTargetRestaurantIds] = useState<string[]>([]);
  const [targetTagCodesText, setTargetTagCodesText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (ad) {
      setTitle(ad.title || '');
      setAdvertiserName(ad.advertiser_name || '');
      setBannerUrl(ad.banner_url || '');
      setDestinationUrl(ad.destination_url || '');
      setTargetType(ad.target_type || 'all');
      setTargetRestaurantIds(ad.target_restaurant_ids || []);
      setTargetTagCodesText((ad.target_tag_codes || []).join(', '));
      setIsActive(ad.is_active ?? true);
    } else {
      setTitle('');
      setAdvertiserName('');
      setBannerUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80');
      setDestinationUrl('https://');
      setTargetType('all');
      setTargetRestaurantIds([]);
      setTargetTagCodesText('');
      setIsActive(true);
    }
    setErrorMsg('');
  }, [ad, isOpen]);

  if (!isOpen) return null;

  const toggleRestaurantSelection = (id: string) => {
    if (targetRestaurantIds.includes(id)) {
      setTargetRestaurantIds(targetRestaurantIds.filter((rId) => rId !== id));
    } else {
      setTargetRestaurantIds([...targetRestaurantIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !advertiserName.trim() || !destinationUrl.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const tagCodes = targetTagCodesText
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const payload: Partial<Ad> = {
      title: title.trim(),
      advertiser_name: advertiserName.trim(),
      banner_url: normalizeImageUrl(bannerUrl),
      destination_url: destinationUrl.trim(),
      placement_type: 'bottom_banner',
      target_type: targetType,
      target_restaurant_ids: targetType === 'specific_restaurants' ? targetRestaurantIds : [],
      target_tag_codes: targetType === 'specific_tags' ? tagCodes : [],
      is_active: isActive,
    };

    if (ad?.id) {
      payload.id = ad.id;
    }

    const res = await api.saveAd(payload);

    setIsSaving(false);
    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al guardar el anuncio.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {ad ? 'Editar Campaña Publicitaria' : 'Nueva Campaña Publicitaria'}
              </h3>
              <p className="text-xs text-slate-500">Muestra micro-anuncios en los tags activos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Anunciante *
              </label>
              <input
                type="text"
                required
                value={advertiserName}
                onChange={(e) => setAdvertiserName(e.target.value)}
                placeholder="Ej. Clínica DentalPro"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título / Oferta Destacada *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. 20% de descuento en tu consulta"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              URL del Banner (Imagen JPG/PNG/WebP)
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Enlace de Destino (Al pulsar el anuncio) *
            </label>
            <input
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://wa.me/... o https://tuanunciante.com"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Segmentación */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Segmentación de Audiencia
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                  targetType === 'all'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Todos los Locales
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific_restaurants')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                  targetType === 'specific_restaurants'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Locales Específicos
              </button>
              <button
                type="button"
                onClick={() => setTargetType('specific_tags')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                  targetType === 'specific_tags'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Por Tag Único
              </button>
            </div>

            {targetType === 'specific_restaurants' && (
              <div className="pt-2">
                <p className="text-[11px] text-slate-500 mb-2">Selecciona en qué restaurantes mostrar este anuncio:</p>
                <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                  {restaurants.map((res) => (
                    <label key={res.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetRestaurantIds.includes(res.id)}
                        onChange={() => toggleRestaurantSelection(res.id)}
                        className="rounded text-purple-600"
                      />
                      <span>{res.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {targetType === 'specific_tags' && (
              <div className="pt-2">
                <label className="block text-[11px] text-slate-500 mb-1">
                  Códigos de Tags separados por comas:
                </label>
                <input
                  type="text"
                  value={targetTagCodesText}
                  onChange={(e) => setTargetTagCodesText(e.target.value)}
                  placeholder="Ej. NFC-001, NFC-005, MESA-10"
                  className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Campaña Activa en Circulación</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
