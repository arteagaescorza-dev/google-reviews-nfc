import React, { useState, useEffect } from 'react';
import type { Organization } from '../../types';
import { api } from '../../lib/api';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';
import {
  X,
  Building2,
  User,
  Mail,
  FileText,
  Check,
  Loader2,
} from 'lucide-react';

interface OrganizationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onUpdated: (updatedOrg: Organization) => void;
}

const TAX_REGIMES = [
  { code: '601', label: '601 - General de Ley Personas Morales' },
  { code: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { code: '626', label: '626 - Régimen Simplificado de Confianza (RESICO)' },
  { code: '621', label: '621 - Incorporación Fiscal' },
  { code: '606', label: '606 - Arrendamiento' },
];

export const OrganizationEditModal: React.FC<OrganizationEditModalProps> = ({
  isOpen,
  onClose,
  organization,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [notifyNegativeFeedback, setNotifyNegativeFeedback] = useState(true);

  // Datos fiscales
  const [taxName, setTaxName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxRegime, setTaxRegime] = useState('601');
  const [taxZip, setTaxZip] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (organization && isOpen) {
      setName(organization.name || '');
      setOwnerName(organization.owner_name || '');
      setOwnerPhone(organization.owner_phone || '');
      setOwnerEmail(organization.owner_email || '');
      setNotifyNegativeFeedback(organization.notify_negative_feedback ?? true);

      const b = organization.billing_info || {};
      setTaxName(b.tax_name || '');
      setTaxId(b.tax_id || '');
      setTaxRegime(b.tax_regime || '601');
      setTaxZip(b.tax_zip || '');
      setBillingEmail(b.billing_email || '');
      setErrorMsg('');
    }
  }, [organization, isOpen]);

  if (!isOpen || !organization) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la organización es obligatorio.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('El nombre del dueño o representante es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const updates: Partial<Organization> = {
      name: name.trim(),
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim() || null,
      owner_email: ownerEmail.trim() || null,
      notify_negative_feedback: notifyNegativeFeedback,
      billing_info: taxId.trim()
        ? {
            tax_name: taxName.trim() || name.trim(),
            tax_id: taxId.trim().toUpperCase(),
            tax_regime: taxRegime,
            tax_zip: taxZip.trim(),
            billing_email: billingEmail.trim() || ownerEmail.trim(),
          }
        : organization.billing_info || null,
    };

    const res = await api.updateOrganization(organization.id, updates);
    setSaving(false);

    if (res.success) {
      onUpdated({ ...organization, ...updates });
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo actualizar la organización.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Editar Organización Matriz</h2>
              <p className="text-xs text-slate-500">ID: {organization.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Bloque 1: Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Datos Generales de la Cuenta</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nombre Comercial de la Organización Matriz *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Grupo Gastronómico Gourmet"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre del Dueño o Representante *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo Electrónico del Titular
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="carlos@grupogourmet.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Teléfono del Dueño (Con selector de Lada y WhatsApp)
              </label>
              <PhoneInputWithCountry
                value={ownerPhone}
                onChange={setOwnerPhone}
                placeholder="55 1234 5678"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={notifyNegativeFeedback}
                onChange={(e) => setNotifyNegativeFeedback(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium">
                Notificar por correo al dueño sobre quejas retenidas (1-3 estrellas)
              </span>
            </label>
          </div>

          {/* Bloque 2: Facturación CFDI 4.0 */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Datos Fiscales para Facturación (CFDI 4.0)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="Ej. Operadora de Restaurantes SA de CV"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  RFC
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                  placeholder="ORE120415AA1"
                  maxLength={13}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Régimen Fiscal
                </label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {TAX_REGIMES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Código Postal Fiscal
                </label>
                <input
                  type="text"
                  value={taxZip}
                  onChange={(e) => setTaxZip(e.target.value)}
                  placeholder="06600"
                  maxLength={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Correo de Recepción de Facturas
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="facturacion@grupogourmet.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
