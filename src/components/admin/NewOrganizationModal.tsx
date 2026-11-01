import React, { useState } from 'react';
import type { Organization } from '../../types';
import { api } from '../../lib/api';
import { X, Building2, User, Phone, Mail, Sparkles, Check, Loader2 } from 'lucide-react';

interface NewOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newOrg: Organization) => void;
}

export const NewOrganizationModal: React.FC<NewOrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [notifyNegativeFeedback, setNotifyNegativeFeedback] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la empresa o negocio es obligatorio.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('El nombre del dueño o encargado es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const res = await api.createOrganization({
      name: name.trim(),
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim() || null,
      owner_email: ownerEmail.trim() || null,
      notify_negative_feedback: notifyNegativeFeedback,
      billing_info: null,
    });

    setIsSaving(false);

    if (res.success && res.data) {
      onCreated(res.data);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al dar de alta la organización.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Alta Express en Calle</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-200">
                  Visita 1
                </span>
              </div>
              <p className="text-xs text-slate-500">Registra al cliente en 30s para vincular placas al instante</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Comercial del Negocio *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Taquería Los Güeros o Grupo Gourmet"
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre del Dueño o Encargado *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej. Roberto Gómez o Carlos Mendoza"
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp del Dueño
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+52 55..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Servirá para enviar sus credenciales en la Visita 2.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="contacto@ejemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="notifyNeg"
              checked={notifyNegativeFeedback}
              onChange={(e) => setNotifyNegativeFeedback(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="notifyNeg" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Notificar al dueño por WhatsApp/Correo ante quejas privadas de 1-3 estrellas
            </label>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-slate-600 leading-snug">
              <span className="font-bold text-slate-800">Estrategia GTM Siembra:</span> Al guardar este registro se crea la cuenta base. En la Visita 2 podrás invitarlo por WhatsApp a su portal con su <strong>Filtro de Reseñas gratis</strong> ya configurado.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Crear Organización</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
