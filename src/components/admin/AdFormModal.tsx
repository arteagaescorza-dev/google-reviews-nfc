import React, { useState, useEffect } from 'react';
import type { Ad, Restaurant } from '../../types';
import { api } from '../../lib/api';
import { normalizeImageUrl } from '../../lib/utils';
import {
  X,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  DollarSign,
  Eye,
  Star,
  Sparkles,
} from 'lucide-react';

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
  const [budgetAmount, setBudgetAmount] = useState<number>(2500);
  const [maxImpressions, setMaxImpressions] = useState<number>(5000);
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
      setBudgetAmount(ad.budget_amount || 2500);
      setMaxImpressions(ad.max_impressions || 5000);
      setTargetType(ad.target_type || 'all');
      setTargetRestaurantIds(ad.target_restaurant_ids || []);
      setTargetTagCodesText((ad.target_tag_codes || []).join(', '));
      setIsActive(ad.is_active ?? true);
    } else {
      setTitle('20% de Descuento en tu Consulta Dental');
      setAdvertiserName('Clínica DentalPro');
      setBannerUrl('https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80');
      setDestinationUrl('https://dentalpro.example.com/promo');
      setBudgetAmount(2500);
      setMaxImpressions(5000);
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
      setErrorMsg('Por favor completa los campos obligatorios (*).');
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
      budget_amount: Number(budgetAmount) || 2500,
      max_impressions: Number(maxImpressions) || 5000,
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

  const isImageValid = Boolean(bannerUrl && bannerUrl.startsWith('http'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 max-h-[94vh] overflow-y-auto flex flex-col my-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {ad ? 'Editar Campaña Publicitaria' : 'Nueva Campaña Publicitaria'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                  Auto-Aprobación WYSIWYG
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pauta local segmentada con previsualización en vivo en iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Layout 2 Columnas: Formulario + Mockup iPhone */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Formulario (7 columnas) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
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
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título / Gancho Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. 20% de Descuento en Consulta"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Presupuesto y Tope de Impresiones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Presupuesto Contratado ($ MXN)
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  step={100}
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(Number(e.target.value))}
                  placeholder="2500"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Facturación al anunciante</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  Tope de Impresiones (Vistas)
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  step={500}
                  value={maxImpressions}
                  onChange={(e) => setMaxImpressions(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
                <p className="text-[10px] text-amber-700 font-semibold mt-1">Dispara alerta al 80% ({Math.round(maxImpressions * 0.8).toLocaleString('es-MX')} vistas)</p>
              </div>
            </div>

            {/* URL del Banner + Validador Técnico */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  URL del Banner Publicitario
                </label>
                <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Estándar: 1200 x 628 px (≤ 2MB)
                </span>
              </div>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />

              {/* Banner de Validación Técnica */}
              <div className="mt-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isImageValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className="text-[11px] text-slate-700">
                    {isImageValid
                      ? 'Formato válido • Optimizado para display móvil en mesa'
                      : 'Proporciona una URL válida (JPG, PNG o WebP)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 font-bold border border-slate-200">
                  1.91 : 1
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enlace de Destino (Al pulsar el banner) *
              </label>
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://wa.me/... o https://tusitio.com"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Segmentación */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Segmentación Territorial de Audiencia
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                    targetType === 'all'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Toda la Red
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific_restaurants')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                    targetType === 'specific_restaurants'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
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
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Por Tag Único
                </button>
              </div>

              {targetType === 'specific_restaurants' && (
                <div className="pt-2">
                  <p className="text-[11px] text-slate-500 mb-2">Selecciona en qué sucursales pautar:</p>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
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
                    Códigos de Tags NFC separados por comas:
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">Campaña Activa en Circulación Inmediata</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Megaphone className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Aprobar y Pautar Anuncio'}</span>
              </button>
            </div>
          </form>

          {/* Columna Derecha: Mockup iPhone en Vivo (5 columnas) */}
          <div className="lg:col-span-5 bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-slate-400 text-xs">
              <span className="flex items-center gap-1 font-bold text-white">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                Simulador Móvil en Mesa
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-purple-300 font-mono">
                iPhone 15 Pro
              </span>
            </div>

            {/* Carcasa del iPhone */}
            <div className="w-full max-w-[270px] bg-black p-3 rounded-[40px] shadow-2xl border-4 border-slate-700 relative overflow-hidden">
              {/* Dynamic Island / Bocina */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center relative z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                <div className="w-2 h-2 rounded-full bg-blue-950" />
              </div>

              {/* Pantalla del teléfono */}
              <div className="bg-slate-50 rounded-[28px] overflow-hidden min-h-[440px] flex flex-col justify-between text-slate-800 text-[11px] relative border border-slate-200">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-4 py-1 text-[9px] font-bold text-slate-600 bg-white">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-4 h-2 rounded-sm border border-slate-600 p-0.5 flex items-center">
                      <div className="w-full h-full bg-slate-800 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Contenido de la Pantalla: Simulación del Restaurante */}
                <div className="p-3 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-sm">
                    LT
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 leading-tight">
                      Restaurante La Toscana
                    </h5>
                    <p className="text-[9px] text-slate-500">Mesa 4 • Sucursal Roma</p>
                  </div>

                  {/* Estrellas interactivas */}
                  <div className="py-2 px-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-700 mb-1.5">
                      ¿Cómo fue tu experiencia hoy?
                    </p>
                    <div className="flex justify-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <div className="py-2 rounded-xl bg-blue-600 text-white font-bold text-[10px] shadow-xs flex items-center justify-center gap-1">
                    <span>Calificar en Google</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Banner Ad Móvil Pegado al Pie (Lo que verá el comensal) */}
                <div className="p-2 bg-white border-t border-purple-100 shadow-lg relative">
                  <div className="flex items-center justify-between text-[8px] text-purple-700 font-bold uppercase tracking-wider mb-1 px-1">
                    <span>Espacio Patrocinado</span>
                    <span>Anuncio Local</span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt="Preview"
                        className="w-full h-18 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-18 bg-purple-50 flex items-center justify-center text-purple-400 text-[10px]">
                        Banner 1200 x 628 px
                      </div>
                    )}

                    <div className="p-2 bg-white">
                      <span className="block text-[8px] font-bold uppercase text-purple-600">
                        {advertiserName || 'Nombre del Anunciante'}
                      </span>
                      <p className="text-[9px] font-extrabold text-slate-900 line-clamp-1 leading-snug">
                        {title || 'Título de la Oferta Destacada'}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[8px] text-slate-400 truncate max-w-[100px]">
                          {destinationUrl ? destinationUrl.replace(/^https?:\/\//, '') : 'enlace-destino.com'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[8px] font-bold">
                          Ver Oferta &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3 leading-snug">
              Este mockup reproduce de forma exacta la experiencia del comensal al escanear la placa NFC en mesa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
