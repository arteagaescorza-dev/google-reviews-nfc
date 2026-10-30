import React, { useState } from 'react';
import type { Organization } from '../../types';
import { api } from '../../lib/api';
import {
  Store,
  MapPin,
  Link,
  Phone,
  QrCode,
  X,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onSuccess: () => Promise<void>;
}

export const NewBranchModal: React.FC<NewBranchModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess,
}) => {
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [tagCount, setTagCount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBranch, setCreatedBranch] = useState<{ name: string; tagCount: number } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !googleReviewUrl.trim()) {
      setErrorMessage('Por favor completa el nombre de la sucursal y el enlace de Google Reviews.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const cleanSlug = `${organization.name}-${branchName}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

      const res = await api.saveRestaurant({
        organization_id: organization.id,
        brand_name: organization.name,
        branch_name: branchName.trim(),
        name: `${organization.name} - ${branchName.trim()}`,
        slug: cleanSlug,
        google_review_url: googleReviewUrl.trim(),
        address: address.trim() || undefined,
        manager_phone: branchPhone.trim() || undefined,
        tier: 3,
        is_active: true,
        is_ad_free: false,
        links: [],
      });

      if (res.success) {
        setCreatedBranch({ name: branchName.trim(), tagCount });
        await onSuccess();
      } else {
        setErrorMessage(res.error || 'No se pudo crear la sucursal. Revisa los datos.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al crear la sucursal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppOrderUrl = () => {
    if (!createdBranch) return '';
    const msg = `¡Hola Soporte! 👋 Acabo de dar de alta la sucursal "${createdBranch.name}" de mi grupo "${organization.name}".\n\nRequiero solicitar ${createdBranch.tagCount} tags NFC físicos para las mesas.\nDirección de envío: ${address || 'Por confirmar'}.\n\n¿Me apoyan con la activación y envío?`;
    return `https://wa.me/525557510201?text=${encodeURIComponent(msg)}`;
  };

  const handleResetAndClose = () => {
    setCreatedBranch(null);
    setBranchName('');
    setAddress('');
    setGoogleReviewUrl('');
    setBranchPhone('');
    setTagCount(10);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <span>Dar de Alta Nueva Sucursal</span>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vista de Éxito con Solicitud de Tags NFC */}
        {createdBranch ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-900">
                ¡Sucursal "{createdBranch.name}" Creada!
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Ya está vinculada a tu portal. Para recibir los <strong>{createdBranch.tagCount} tags NFC físicos</strong> listos y programados para tus mesas, solicita el envío con un clic:
              </p>
            </div>

            <div className="space-y-2">
              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Solicitar Tags NFC por WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center"
              >
                Listo, volver al portal
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Alta */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Sucursal *
              </label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Ej: Sucursal Polanco / Centro"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enlace a Google Reviews de esta Sucursal *
              </label>
              <div className="relative">
                <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/.../review o https://maps.app.goo.gl/..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección Física
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, No., Colonia"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono de Sucursal
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="+52 55 ..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mesas estimadas (Tags NFC requeridos)
              </label>
              <div className="relative">
                <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={tagCount}
                  onChange={(e) => setTagCount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Al crear la sucursal, podrás solicitar los stickers/placas NFC preconfiguradas directamente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Crear Sucursal</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
