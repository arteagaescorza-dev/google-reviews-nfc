import React, { useState, useEffect } from 'react';
import type { Organization, Restaurant, OrganizationMember, MemberRole, BillingInfo } from '../../types';
import { api } from '../../lib/api';
import { TIERS } from '../../lib/constants';
import {
  Building2,
  FileText,
  Users,
  CreditCard,
  AlertTriangle,
  Save,
  Check,
  UserPlus,
  Copy,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  X,
  Store,
  Pause,
  Play,
  Trash2,
  Loader2,
} from 'lucide-react';

interface PortalAccountTabProps {
  organization: Organization;
  restaurants: Restaurant[];
  member: OrganizationMember;
  onRefreshOrg: () => Promise<void>;
  onRefreshRestaurants: () => Promise<void>;
  onAddBranch?: () => void;
}

export const PortalAccountTab: React.FC<PortalAccountTabProps> = ({
  organization,
  restaurants,
  member,
  onRefreshOrg,
  onRefreshRestaurants,
  onAddBranch,
}) => {
  const isOwner = member?.role === 'owner';

  // Estado Perfil
  const [name, setName] = useState(organization.name || '');
  const [ownerName, setOwnerName] = useState(organization.owner_name || '');
  const [ownerPhone, setOwnerPhone] = useState(organization.owner_phone || '');
  const [ownerEmail, setOwnerEmail] = useState(organization.owner_email || '');
  const [notifyNegative, setNotifyNegative] = useState(organization.notify_negative_feedback ?? true);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSaveSuccess, setOrgSaveSuccess] = useState(false);

  // Estado Facturación
  const billing: BillingInfo = organization.billing_info || {};
  const [taxName, setTaxName] = useState(billing.tax_name || '');
  const [taxId, setTaxId] = useState(billing.tax_id || '');
  const [taxRegime, setTaxRegime] = useState(billing.tax_regime || '');
  const [taxZip, setTaxZip] = useState(billing.tax_zip || '');
  const [billingEmail, setBillingEmail] = useState(billing.billing_email || '');
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [billingSaveSuccess, setBillingSaveSuccess] = useState(false);

  // Estado Equipo
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('manager');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [invitedCredentials, setInvitedCredentials] = useState<{ email: string; pass: string; role: MemberRole } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Estado Cancelación / Zona de Peligro
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  // Modales Checkout / Upgrades
  const [showAdFreeModal, setShowAdFreeModal] = useState(false);
  const [showAdsPromoModal, setShowAdsPromoModal] = useState(false);

  // Estado Gestión de Sucursales (Pausar / Reactivar / Eliminar)
  const [togglingBranchId, setTogglingBranchId] = useState<string | null>(null);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Restaurant | null>(null);
  const [confirmBranchWord, setConfirmBranchWord] = useState('');
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);
  const [branchActionToast, setBranchActionToast] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoadingMembers(true);
    const list = await api.getOrganizationMembers(organization.id);
    setMembers(list);
    setLoadingMembers(false);
  };

  useEffect(() => {
    loadMembers();
  }, [organization.id]);

  // Guardar perfil de negocio
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    setOrgSaveSuccess(false);

    const res = await api.updateOrganization(organization.id, {
      name,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      notify_negative_feedback: notifyNegative,
    });

    setIsSavingOrg(false);
    if (res.success) {
      setOrgSaveSuccess(true);
      await onRefreshOrg();
      setTimeout(() => setOrgSaveSuccess(false), 3000);
    }
  };

  // Guardar datos fiscales
  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBilling(true);
    setBillingSaveSuccess(false);

    const updatedBilling: BillingInfo = {
      tax_name: taxName,
      tax_id: taxId,
      tax_regime: taxRegime,
      tax_zip: taxZip,
      billing_email: billingEmail,
    };

    const res = await api.updateOrganization(organization.id, {
      billing_info: updatedBilling,
    });

    setIsSavingBilling(false);
    if (res.success) {
      setBillingSaveSuccess(true);
      await onRefreshOrg();
      setTimeout(() => setBillingSaveSuccess(false), 3000);
    }
  };

  // Invitar Gerente
  const handleInviteManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setIsInviting(true);
    setInviteError('');

    const res = await api.createOrganizationMember(organization.id, newEmail, newPassword, newRole);
    setIsInviting(false);

    if (res.success) {
      setInvitedCredentials({ email: newEmail, pass: newPassword, role: newRole });
      loadMembers();
    } else {
      setInviteError(res.error || 'Error al invitar usuario');
    }
  };

  const getManagerCopyMessage = () => {
    if (!invitedCredentials) return '';
    const portalUrl = `${window.location.origin}${window.location.pathname}#/portal/login`;
    return `¡Hola! 👋\nTe comparto tu acceso como ${invitedCredentials.role === 'owner' ? 'Dueño' : 'Gerente'} para gestionar las quejas y enlaces del restaurante:\n\n🔗 Entra aquí: ${portalUrl}\n✉️ Correo: ${invitedCredentials.email}\n🔑 Contraseña: ${invitedCredentials.pass}\n\n(Revisa tu correo para confirmar tu cuenta y entrar).`;
  };

  const handleCopyCredentials = () => {
    const text = getManagerCopyMessage();
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  // Cancelar servicio (Fallback directo a Google Maps)
  const handleConfirmCancel = async () => {
    if (confirmWord !== 'PAUSAR') return;
    setIsCanceling(true);

    // Pausar todos los restaurantes de la organización
    for (const r of restaurants) {
      await api.toggleRestaurantActive(r.id, false);
    }

    setIsCanceling(false);
    setShowCancelModal(false);
    await onRefreshRestaurants();
    alert('Tu servicio ha sido pausado. Tus tags físicos en las mesas ahora redirigen directamente a tu ficha de Google Maps oficial sin filtro de quejas.');
  };

  // Pausar o Reactivar Sucursal Individual
  const handleToggleBranch = async (r: Restaurant) => {
    setTogglingBranchId(r.id);
    const newStatus = !r.is_active;
    const res = await api.toggleRestaurantActive(r.id, newStatus);
    setTogglingBranchId(null);
    if (res.success) {
      await onRefreshRestaurants();
      setBranchActionToast(
        newStatus
          ? `¡Sucursal "${r.branch_name || r.name}" reactivada!`
          : `Sucursal "${r.branch_name || r.name}" pausada. Sus tags ahora van directo a Google Maps.`
      );
      setTimeout(() => setBranchActionToast(null), 4000);
    }
  };

  // Solicitar eliminación de sucursal
  const handleOpenDeleteBranch = (r: Restaurant) => {
    if (restaurants.length <= 1) {
      alert(
        'No puedes eliminar tu única sucursal registrada. Si deseas pausar o dar de baja el servicio completo de tu negocio, utiliza la Zona de Peligro al final de esta página.'
      );
      return;
    }
    setBranchToDelete(r);
    setConfirmBranchWord('');
    setShowDeleteBranchModal(true);
  };

  // Confirmar eliminación de sucursal (Baja permanente / Opción 2: Desvincular + Fallback directo)
  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    const targetWord = (branchToDelete.branch_name || branchToDelete.name).trim().toUpperCase();
    if (confirmBranchWord.trim().toUpperCase() !== targetWord) return;

    setIsDeletingBranch(true);
    const res = await api.deleteRestaurant(branchToDelete.id);
    setIsDeletingBranch(false);

    if (res.success) {
      setShowDeleteBranchModal(false);
      setBranchToDelete(null);
      await onRefreshRestaurants();
      setBranchActionToast(
        'Sucursal dada de baja. Sus tags físicos en las mesas continuarán funcionando redirigiendo directamente a su ficha de Google Maps.'
      );
      setTimeout(() => setBranchActionToast(null), 5000);
    }
  };

  // Restaurante activo representativo
  const mainRestaurant = restaurants[0];
  const tierInfo = mainRestaurant ? TIERS[mainRestaurant.tier || 2] : null;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>Mi Cuenta & Configuración</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Datos de la empresa, facturación fiscal, equipo de gerentes y suscripción.
        </p>
      </div>

      {/* Grid Responsivo de 2 Columnas en Pantallas Grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* BLOQUE 1: Perfil de la Organización */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perfil del Negocio</h3>
              <p className="text-[11px] text-slate-400">Identidad de la marca y contacto de gerencia</p>
            </div>
          </div>

          {orgSaveSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Datos guardados correctamente.</span>
            </div>
          )}

          <form onSubmit={handleSaveOrg} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Empresa / Marca
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Dueño
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono de Alertas (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+52 55..."
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico de Contacto
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyNegative}
                  onChange={(e) => setNotifyNegative(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-medium">
                  Notificar de inmediato a mi teléfono cuando un cliente marque 1-3 estrellas
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSavingOrg}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingOrg ? 'Guardando...' : 'Guardar Perfil'}</span>
            </button>
          </form>
        </div>

        {/* BLOQUE 2: Datos Fiscales de Facturación */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Datos Fiscales (Facturación)</h3>
              <p className="text-[11px] text-slate-400">Para la emisión automática de tus comprobantes y facturas</p>
            </div>
          </div>

          {billingSaveSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Datos fiscales actualizados con éxito.</span>
            </div>
          )}

          <form onSubmit={handleSaveBilling} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Razón Social / Nombre Fiscal
              </label>
              <input
                type="text"
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                placeholder="Ej: Grupo Gastronómico del Norte S.A. de C.V."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  RFC / Tax ID
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código Postal Fiscal
                </label>
                <input
                  type="text"
                  value={taxZip}
                  onChange={(e) => setTaxZip(e.target.value)}
                  placeholder="06000"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Régimen Fiscal
              </label>
              <input
                type="text"
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value)}
                placeholder="Ej: Régimen Simplificado de Confianza (RESICO)"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico para Facturas
              </label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="facturacion@mirestaurante.com"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingBilling}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingBilling ? 'Guardando...' : 'Guardar Datos Fiscales'}</span>
            </button>
          </form>
        </div>

        {/* BLOQUE 3: Gestión de Equipo & Gerentes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Equipo & Gerentes</h3>
                <p className="text-[11px] text-slate-400">Personal con acceso a este portal</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteError('');
                setNewEmail('');
                setNewPassword('');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Invitar</span>
            </button>
          </div>

          {loadingMembers ? (
            <p className="text-xs text-slate-400 py-4 text-center">Cargando equipo...</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl border border-slate-100">
              Solo tú tienes acceso a esta organización actualmente.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              {members.map((m) => (
                <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                      {m.user_email || `Usuario: ${m.user_id.slice(0, 8)}...`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Alta: {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                    m.role === 'owner'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {m.role === 'owner' ? '👑 Dueño' : '🧑‍💼 Gerente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 4: Plan, Suscripción y Red de Ads */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Plan & Red Publicitaria</h3>
              <p className="text-[11px] text-slate-400">Nivel de servicio contratado y patrocinadores</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Paquete de Reputación:</span>
              <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {tierInfo ? tierInfo.name : 'Tier 2 (Filtro Activo)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado de Publicidad:</span>
              {mainRestaurant?.is_ad_free ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Marca Blanca (0% Anuncios)</span>
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Mostrando Patrocinadores
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sucursales Activas:</span>
              <span className="font-bold text-slate-900">{restaurants.length} locales</span>
            </div>
          </div>

          {/* Botones de Upgrades / Checkout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {!mainRestaurant?.is_ad_free && (
              <button
                type="button"
                onClick={() => setShowAdFreeModal(true)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quitar Anuncios (Marca Blanca)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAdsPromoModal(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Promocionar mi Negocio en la Red</span>
            </button>
          </div>
        </div>

        {/* BLOQUE 5: Sucursales de la Cadena */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sucursales de la Cadena ({restaurants.length})</h3>
                <p className="text-[11px] text-slate-400">Puntos de venta vinculados a tu grupo gastronómico</p>
              </div>
            </div>

            {onAddBranch && isOwner && (
              <button
                type="button"
                onClick={onAddBranch}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span>+ Nueva Sucursal</span>
              </button>
            )}
          </div>

          {branchActionToast && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-2xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{branchActionToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {r.branch_name || r.name}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        r.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.is_active ? 'Activa' : 'Pausada'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {r.address || 'Sin dirección registrada'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <a
                      href={r.google_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ficha Google</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Tier {r.tier || 2}
                    </span>
                  </div>

                  {/* Acciones de Gestión de Sucursal */}
                  {isOwner && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5 text-[11px]">
                      <button
                        type="button"
                        disabled={togglingBranchId === r.id}
                        onClick={() => handleToggleBranch(r)}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                          r.is_active
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={
                          r.is_active
                            ? 'Pausar temporalmente el servicio interactivo en esta sucursal'
                            : 'Reactivar servicio interactivo en esta sucursal'
                        }
                      >
                        {togglingBranchId === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : r.is_active ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Reactivar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteBranch(r)}
                        className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1 transition-colors"
                        title="Dar de baja definitiva esta sucursal"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE 6: Zona de Peligro / Pausa de Servicio */}
      <div className="bg-rose-50/60 rounded-3xl p-5 border border-rose-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-sm font-bold">Zona de Peligro: Pausar o Cancelar Servicio</h3>
        </div>

        <p className="text-xs text-rose-800 leading-relaxed">
          Al pausar o cancelar tu suscripción, <strong>tus tags NFC y códigos QR físicos en las mesas continuarán funcionando pero pasarán inmediatamente y sin filtro a redirigir a Google Maps</strong>. Perderás el filtro de retención de quejas de 1 a 3 estrellas y tus botones de Linktree.
        </p>

        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setShowCancelModal(true);
              setConfirmWord('');
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Pausar o Cancelar Suscripción
          </button>
        ) : (
          <p className="text-[11px] font-semibold text-rose-600 italic">
            * Solo el Propietario de la cuenta puede pausar el servicio.
          </p>
        )}
      </div>

      {/* MODAL 1: Invitar Gerente */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Invitar a Miembro de Equipo</span>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInvitedCredentials(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {invitedCredentials ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Usuario registrado con éxito!</span>
                  </div>
                  <p className="text-emerald-700 text-[11px] leading-relaxed">
                    Comparte estas credenciales provisionales con tu {invitedCredentials.role === 'owner' ? 'Co-Dueño' : 'Gerente'}:
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-700 font-mono text-[11px] space-y-1">
                    <div><strong>Email:</strong> {invitedCredentials.email}</div>
                    <div><strong>Pass:</strong> {invitedCredentials.pass}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>¡Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Mensaje para WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInvitedCredentials(null);
                      setNewEmail('');
                      setNewPassword('');
                    }}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    + Registrar otro miembro
                  </button>
                </div>
              </div>
            ) : (
              <>
                {inviteError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInviteManager} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="gerente@mirestaurante.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Contraseña Provisional</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rol Asignado</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as MemberRole)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    >
                      <option value="manager">🧑‍💼 Gerente de Turno (Quejas y Enlaces)</option>
                      {isOwner && <option value="owner">👑 Co-Propietario (Acceso Completo)</option>}
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
                    >
                      {isInviting ? 'Registrando...' : 'Registrar y Generar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Confirmar Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">¿Pausar tu servicio?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tus tags en las mesas no se romperán: <strong>enviarán a los comensales directamente a Google Maps sin filtrar quejas</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              Para confirmar, escribe la palabra <strong className="text-rose-600 font-mono">PAUSAR</strong> abajo:
              <input
                type="text"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value.toUpperCase())}
                placeholder="PAUSAR"
                className="w-full mt-2 p-2 text-center font-bold tracking-widest text-xs rounded-lg border border-slate-300 uppercase"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={confirmWord !== 'PAUSAR' || isCanceling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isCanceling ? 'Pausando...' : 'Confirmar Pausa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Checkout Ad-Free */}
      {showAdFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Activar Marca Blanca (0% Ads)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Elimina todos los anuncios patrocinados de terceros en tus mesas. Tus comensales solo verán tu logo, tus estrellas y tus enlaces.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs text-slate-400 block uppercase font-bold">Cuota Mensual</span>
              <span className="text-2xl font-black text-slate-900">$299 MXN</span>
              <span className="text-[11px] text-slate-500 block">por sucursal al mes</span>
            </div>

            <a
              href="https://wa.me/525557510201?text=Hola,%20deseo%20activar%20Marca%20Blanca%20(Ad-Free)%20para%20mis%20sucursales"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Solicitar Activación por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setShowAdFreeModal(false)}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Pauta Publicitaria */}
      {showAdsPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <ExternalLink className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Promocionar mi Negocio en la Red</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Muestra banners de tus promociones (ej. 2x1, eventos) en las mesas de comercios aliados no competidores en tu zona.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span>Banner 16:9 / 3:1 (Móvil):</span>
                <strong className="text-slate-800">1200 x 628 px</strong>
              </div>
              <div className="flex justify-between">
                <span>Peso máximo:</span>
                <strong className="text-slate-800">500 KB (WebP/JPG)</strong>
              </div>
              <div className="flex justify-between">
                <span>Enlace de destino:</span>
                <strong className="text-slate-800">Tu WhatsApp o Web</strong>
              </div>
            </div>

            <a
              href="https://wa.me/525557510201?text=Hola,%20quiero%20pautar%20anuncios%20de%20mi%20restaurante%20en%20la%20red%20local"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Configurar Pauta con Soporte</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setShowAdsPromoModal(false)}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Eliminar Sucursal (Baja Definitiva / Opción 2) */}
      {showDeleteBranchModal && branchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ¿Dar de baja {branchToDelete.branch_name || branchToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Esta acción desvinculará esta sucursal de tu panel de control y de los reportes de métricas.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Efecto en los Tags NFC de las mesas:</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Tus tags físicos instalados en las mesas <strong>no se romperán</strong>: continuarán funcionando redirigiendo directamente a su ficha de <strong>Google Maps oficial</strong> sin escalas.
              </p>
              <p className="text-[11px] text-amber-700 italic">
                * Se desactivará el filtro de contención de malas opiniones de 1 a 3 estrellas y el Linktree.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <span>Para confirmar la baja definitiva, escribe el nombre de la sucursal:</span>
              <div className="font-mono font-bold text-slate-900 bg-white p-1.5 rounded-lg border border-slate-200 text-center select-all">
                {(branchToDelete.branch_name || branchToDelete.name).trim().toUpperCase()}
              </div>
              <input
                type="text"
                value={confirmBranchWord}
                onChange={(e) => setConfirmBranchWord(e.target.value.toUpperCase())}
                placeholder="Escribe el nombre aquí"
                className="w-full mt-1 p-2 text-center font-bold tracking-wider text-xs rounded-lg border border-slate-300 uppercase bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteBranchModal(false);
                  setBranchToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  confirmBranchWord.trim().toUpperCase() !==
                    (branchToDelete.branch_name || branchToDelete.name).trim().toUpperCase() ||
                  isDeletingBranch
                }
                onClick={handleConfirmDeleteBranch}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isDeletingBranch ? 'Eliminando...' : 'Confirmar Baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
