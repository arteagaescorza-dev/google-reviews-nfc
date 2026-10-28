import React, { useState, useEffect } from 'react';
import type { Restaurant, LinkItem, LinkType, Organization } from '../../types';
import { api } from '../../lib/api';
import { TIERS } from '../../lib/constants';
import { normalizeImageUrl } from '../../lib/utils';
import { X, Plus, Trash2, Store, Check, ExternalLink } from 'lucide-react';

interface RestaurantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  restaurant?: Restaurant | null;
  organizations: Organization[];
}

export const RestaurantFormModal: React.FC<RestaurantFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  restaurant,
  organizations,
}) => {
  const [brandName, setBrandName] = useState('');
  const [branchName, setBranchName] = useState('Principal');
  const [slug, setSlug] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tier, setTier] = useState<1 | 2 | 3>(2);
  const [isAdFree, setIsAdFree] = useState(false);
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [address, setAddress] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReviewUrlChange = (val: string) => {
    const trimmed = val.trim();
    // Si pega un Place ID directamente (ej. ChIJ...)
    if (/^ChIJ[a-zA-Z0-9_-]+$/i.test(trimmed)) {
      setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${trimmed}`);
      return;
    }
    // Si pega una URL que contiene query_place_id o placeid
    const placeIdMatch = trimmed.match(/[?&](?:query_place_id|placeid)=([a-zA-Z0-9_-]+)/i);
    if (placeIdMatch && placeIdMatch[1]) {
      setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${placeIdMatch[1]}`);
      return;
    }
    setGoogleReviewUrl(val);
  };

  useEffect(() => {
    if (restaurant) {
      setBrandName(restaurant.brand_name || '');
      setBranchName(restaurant.branch_name || 'Principal');
      setSlug(restaurant.slug || '');
      setGoogleReviewUrl(restaurant.google_review_url || '');
      setLogoUrl(restaurant.logo_url || '');
      setTier((restaurant.tier as 1 | 2 | 3) || 2);
      setIsAdFree(restaurant.is_ad_free || false);
      setBrandColor(restaurant.brand_color || '#2563eb');
      setAddress(restaurant.address || '');
      setManagerPhone(restaurant.manager_phone || '');
      setOrganizationId(restaurant.organization_id || '');
      setLinks(restaurant.links || []);
    } else {
      setBrandName('');
      setBranchName('Principal');
      setSlug('');
      setGoogleReviewUrl('');
      setLogoUrl('');
      setTier(2);
      setIsAdFree(false);
      setBrandColor('#2563eb');
      setAddress('');
      setManagerPhone('');
      setOrganizationId(organizations[0]?.id || '');
      setLinks([]);
    }
    setErrorMsg('');
  }, [restaurant, isOpen, organizations]);

  if (!isOpen) return null;

  // Auto-generar slug
  const handleBrandChange = (val: string) => {
    setBrandName(val);
    if (!restaurant) {
      const generated = `${val} ${branchName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleBranchChange = (val: string) => {
    setBranchName(val);
    if (!restaurant) {
      const generated = `${brandName} ${val}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Manejo de links para Tier 3
  const addLink = () => {
    setLinks([
      ...links,
      { id: Date.now().toString(), title: 'Nuevo Acceso', url: 'https://', icon: 'menu' },
    ]);
  };

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !googleReviewUrl.trim()) {
      setErrorMsg('Nombre de marca y enlace de Google Reseñas son obligatorios.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const fullName = branchName ? `${brandName.trim()} - ${branchName.trim()}` : brandName.trim();
    const cleanLogo = normalizeImageUrl(logoUrl);

    const payload: Partial<Restaurant> = {
      brand_name: brandName.trim(),
      branch_name: branchName.trim() || 'Principal',
      name: fullName,
      slug: slug.trim() || `sucursal-${Date.now()}`,
      google_review_url: googleReviewUrl.trim(),
      logo_url: cleanLogo || null,
      tier,
      is_ad_free: isAdFree,
      brand_color: brandColor,
      address: address.trim() || null,
      manager_phone: managerPhone.trim() || null,
      organization_id: organizationId || null,
      links,
      is_active: true,
    };

    if (restaurant?.id) {
      payload.id = restaurant.id;
    }

    const res = await api.saveRestaurant(payload);

    setIsSaving(false);
    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al guardar el restaurante.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {restaurant ? 'Editar Sucursal / Local' : 'Dar de Alta Nuevo Local'}
              </h2>
              <p className="text-xs text-slate-500">Configuración de reputación, paquete y publicidad</p>
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
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos de marca y sucursal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Marca / Nombre del Negocio *
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => handleBrandChange(e.target.value)}
                placeholder="Ej. Tacos El Pastorcito"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sucursal *
              </label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => handleBranchChange(e.target.value)}
                placeholder="Ej. Sucursal Centro o Norte"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slug único (URL) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej: tacos-pastorcito-centro"
                className="w-full p-3 text-sm font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enlace de Google Reseñas *
              </label>
              <input
                type="text"
                required
                value={googleReviewUrl}
                onChange={(e) => handleReviewUrlChange(e.target.value)}
                placeholder="https://g.page/r/.../review o link de Google Maps"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pega aquí el enlace de <strong>Pedir opiniones</strong> (<code className="text-blue-600 font-mono">g.page/r/...</code>) o el enlace de Google Maps.
              </p>
            </div>
          </div>

          {/* Selección de Paquete (Tier) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Paquete Contratado (Nivel de Servicio)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([1, 2, 3] as const).map((tNum) => (
                <div
                  key={tNum}
                  onClick={() => setTier(tNum)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                    tier === tNum
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{TIERS[tNum].name}</span>
                    {tier === tNum && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{TIERS[tNum].description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opciones de monetización y diseño */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Modalidad Ad-Free (Sin Anuncios)
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={isAdFree}
                  onChange={(e) => setIsAdFree(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-800 font-semibold">
                  {isAdFree ? 'Pagó por quitar anuncios' : 'Mostrar publicidad local'}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color de Marca
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-600">{brandColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono del Gerente (Alertas)
              </label>
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+52 55..."
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Logo y dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                URL del Logo o Imagen de Portada
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dirección Física
                </label>
                {googleReviewUrl && (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    title="Abrir ficha en Google Maps para copiar la dirección exacta"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Hidalgo #120, Col. Centro"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Copia la dirección que figura en la tarjeta de Google Maps de tu cliente para que coincida exactamente con su GPS.
              </p>
            </div>
          </div>

          {/* Sección de Linktree para Tier 3 */}
          {tier === 3 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Botones de Linktree (Menú, Redes, Wi-Fi)
                  </h4>
                  <p className="text-[11px] text-slate-500">Aparecerán debajo del widget de estrellas</p>
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Botón</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {links.map((link, idx) => (
                  <div
                    key={link.id || idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <select
                      value={link.icon}
                      onChange={(e) => updateLink(idx, 'icon', e.target.value as LinkType)}
                      className="p-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="menu">Menú Digital</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="wifi">Wi-Fi Clientes</option>
                      <option value="website">Sitio Web</option>
                      <option value="other">Otro</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Título del botón"
                      value={link.title}
                      onChange={(e) => updateLink(idx, 'title', e.target.value)}
                      className="flex-1 p-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />

                    <input
                      type="text"
                      placeholder="URL o texto de Wi-Fi"
                      value={link.url}
                      onChange={(e) => updateLink(idx, 'url', e.target.value)}
                      className="flex-1 p-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : restaurant ? 'Actualizar Local' : 'Guardar y Activar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
