import React, { useState, useEffect } from 'react';
import type { Organization, Restaurant, OrganizationMember, MemberRole, BillingInfo, SupportTicket, Ad, StaffMember, StaffRole } from '../../types';
import { CreateCampaignModal } from '../../components/portal/CreateCampaignModal';
import { api } from '../../lib/api';
import { getNotificationPermission, requestNotificationPermission, sendLocalNotification, playAlertSound } from '../../lib/notifications';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../../lib/constants';
import { CreateSupportTicketModal } from '../../components/portal/CreateSupportTicketModal';
import {
  Building2,
  FileText,
  Users,
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
  LifeBuoy,
  PlusCircle,
  MessageSquare,
  Layers,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  UserCheck,
  Megaphone,
  Ban,
  Bell,
  Volume2,
  Eye,
  EyeOff,
  Key,
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

  // Estado Revocar Miembro Web (Gerente)
  const [memberToRevoke, setMemberToRevoke] = useState<OrganizationMember | null>(null);
  const [isRevokingMember, setIsRevokingMember] = useState(false);

  // Estado Personal Operativo de Sala y Cocina (PIN 4 Dígitos)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffBranchId, setSelectedStaffBranchId] = useState<string>(restaurants[0]?.id || '');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('waiter');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffBranchId, setNewStaffBranchId] = useState<string>(restaurants[0]?.id || '');
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [createdStaffCreds, setCreatedStaffCreds] = useState<{ name: string; role: StaffRole; pin: string; branchName: string } | null>(null);
  const [staffActionToast, setStaffActionToast] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Editar PIN
  const [staffToEditPin, setStaffToEditPin] = useState<StaffMember | null>(null);
  const [editPinValue, setEditPinValue] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Eliminar Personal
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  // Estado Notificaciones Push Nativas (Fase 4)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermission());
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [pushTestSuccess, setPushTestSuccess] = useState(false);

  const handleEnablePush = async () => {
    setIsRequestingPush(true);
    const perm = await requestNotificationPermission();
    setPushPermission(perm);
    setIsRequestingPush(false);
    if (perm === 'granted') {
      sendLocalNotification(
        '🔔 ¡Notificaciones Push Activadas!',
        'Tu teléfono vibrará y sonará de inmediato ante cualquier queja de 1 a 3 estrellas en tus mesas.',
        { isUrgent: false }
      );
    }
  };

  const handleTestPushAlarm = async () => {
    setPushTestSuccess(true);
    playAlertSound('warning');
    await sendLocalNotification(
      '🚨 Alerta Urgente: Mesa 4 (★ 2)',
      'Comensal reporta: "El servicio tardó demasiado". Atiéndelo en vivo antes de que pida la cuenta.',
      { isUrgent: true }
    );
    setTimeout(() => setPushTestSuccess(false), 3000);
  };

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

  // Estado Mesa de Ayuda B2B
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Estado Cancelación / Zona de Peligro
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  // Modales Checkout / Upgrades / Fase 3
  const [showAdFreeModal, setShowAdFreeModal] = useState(false);
  const [showAdsPromoModal, setShowAdsPromoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<2 | 3 | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [vetoSuccessMsg, setVetoSuccessMsg] = useState('');
  const [upgradeSuccessMsg, setUpgradeSuccessMsg] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isTogglingAdFree, setIsTogglingAdFree] = useState(false);
  const [adFreeFromVeto, setAdFreeFromVeto] = useState(false);

  // Estado Gestión de Sucursales (Pausar / Reactivar / Eliminar)
  const [togglingBranchId, setTogglingBranchId] = useState<string | null>(null);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Restaurant | null>(null);
  const [confirmBranchWord, setConfirmBranchWord] = useState('');
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);
  const [branchActionToast, setBranchActionToast] = useState<string | null>(null);

  const loadStaff = async (branchId?: string) => {
    setLoadingStaff(true);
    const targetBranch = branchId || selectedStaffBranchId || restaurants[0]?.id;
    const list = await api.getStaffMembers(targetBranch);
    setStaffMembers(list);
    setLoadingStaff(false);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim()) return;
    if (newStaffPin.trim().length < 4) {
      alert('El PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    setIsSavingStaff(true);
    const branch = restaurants.find((r) => r.id === newStaffBranchId) || restaurants[0];
    const res = await api.createStaffMember({
      restaurant_id: branch?.id || 'res-1',
      name: newStaffName.trim(),
      role: newStaffRole,
      pin_code: newStaffPin.trim(),
      is_active: true,
    });
    setIsSavingStaff(false);

    if (res.success && res.data) {
      setCreatedStaffCreds({
        name: res.data.name,
        role: res.data.role,
        pin: res.data.pin_code,
        branchName: branch ? `${branch.brand_name} (${branch.branch_name})` : 'Sucursal Principal',
      });
      loadStaff(selectedStaffBranchId);
      setStaffActionToast(`Personal ${res.data.name} registrado con éxito.`);
      setTimeout(() => setStaffActionToast(null), 4000);
    } else {
      alert(res.error || 'Error al registrar personal');
    }
  };

  const handleToggleStaffActive = async (s: StaffMember) => {
    const newStatus = !s.is_active;
    const res = await api.toggleStaffMemberActive(s.id, newStatus);
    if (res.success) {
      setStaffMembers((prev) => prev.map((item) => (item.id === s.id ? { ...item, is_active: newStatus } : item)));
      setStaffActionToast(`Personal ${s.name} ${newStatus ? 'reactivado' : 'pausado'}.`);
      setTimeout(() => setStaffActionToast(null), 3000);
    }
  };

  const handleConfirmUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToEditPin || editPinValue.length < 4) return;
    setIsUpdatingPin(true);
    const res = await api.updateStaffMember(staffToEditPin.id, { pin_code: editPinValue });
    setIsUpdatingPin(false);
    if (res.success) {
      setStaffMembers((prev) => prev.map((s) => (s.id === staffToEditPin.id ? { ...s, pin_code: editPinValue } : s)));
      setStaffActionToast(`PIN de ${staffToEditPin.name} actualizado correctamente.`);
      setStaffToEditPin(null);
      setEditPinValue('');
      setTimeout(() => setStaffActionToast(null), 3000);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeletingStaff(true);
    const res = await api.deleteStaffMember(staffToDelete.id);
    setIsDeletingStaff(false);
    if (res.success) {
      setStaffMembers((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      setStaffActionToast(`Personal ${staffToDelete.name} eliminado.`);
      setStaffToDelete(null);
      setTimeout(() => setStaffActionToast(null), 3000);
    }
  };

  const handleRevokeMember = async () => {
    if (!memberToRevoke) return;
    setIsRevokingMember(true);
    const res = await api.deleteOrganizationMember(organization.id, memberToRevoke.id);
    setIsRevokingMember(false);
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberToRevoke.id));
      setStaffActionToast(`Acceso del gerente revocado exitosamente.`);
      setMemberToRevoke(null);
      setTimeout(() => setStaffActionToast(null), 3000);
    } else {
      alert(res.error || 'Error al revocar miembro');
    }
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewStaffPin(pin);
  };

  const getStaffCopyMessage = () => {
    if (!createdStaffCreds) return '';
    const roleTitle =
      createdStaffCreds.role === 'waiter'
        ? 'Mesero de Sala'
        : createdStaffCreds.role === 'kitchen'
        ? 'Cocinero / KDS'
        : 'Capitán de Sala';
    const terminalUrl =
      createdStaffCreds.role === 'kitchen'
        ? `${window.location.origin}${window.location.pathname}#/portal/cocina`
        : `${window.location.origin}${window.location.pathname}#/portal/mesero`;

    return `¡Hola ${createdStaffCreds.name}! 🍽️\nTu acceso al sistema operativo de ${createdStaffCreds.branchName} está listo:\n\nRol: ${roleTitle}\n🔗 Enlace de tu terminal: ${terminalUrl}\n🔑 Tu PIN de 4 dígitos: ${createdStaffCreds.pin}\n\nIngresa tu PIN en la pantalla para comenzar tu turno.`;
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    const list = await api.getOrganizationMembers(organization.id);
    setMembers(list);
    setLoadingMembers(false);
  };

  const loadSupportTickets = async () => {
    setLoadingTickets(true);
    const list = await api.getMySupportTickets();
    setSupportTickets(list);
    setLoadingTickets(false);
  };

  const loadAds = async () => {
    try {
      const list = await api.getAds();
      setAds(list.filter((a) => a.is_active && a.id !== 'ad-viral-seed'));
    } catch (e) {
      console.error('Error cargando ads:', e);
    }
  };

  useEffect(() => {
    loadMembers();
    loadSupportTickets();
    loadAds();
    loadStaff();
  }, [organization.id]);

  const handleConfirmUpgrade = async (tier: 2 | 3) => {
    if (!mainRestaurant) return;
    setIsUpgrading(true);
    const ok = await api.upgradeRestaurantTier(mainRestaurant.id, tier);
    setIsUpgrading(false);
    if (ok) {
      setShowUpgradeModal(null);
      setUpgradeSuccessMsg(
        tier === 2
          ? '¡Nivel 2 Activado ( MXN)! Ya puedes gestionar tu Menú Digital y Wi-Fi en 1 Toque en la pestaña Enlaces.'
          : '¡Nivel 3 Activado ( MXN)! Se han acreditado  MXN en saldo mensual para pautar anuncios en mesas aliadas.'
      );
      await onRefreshRestaurants();
      setTimeout(() => setUpgradeSuccessMsg(''), 5000);
    }
  };

  const handleToggleAdFree = async (isAdFree: boolean) => {
    if (!mainRestaurant) return;
    setIsTogglingAdFree(true);
    const ok = await api.toggleRestaurantAdFree(mainRestaurant.id, isAdFree);
    setIsTogglingAdFree(false);
    if (ok) {
      setShowAdFreeModal(false);
      setUpgradeSuccessMsg(
        isAdFree
          ? '¡Marca Blanca Activada ( MXN/mes)! Tus mesas están 100% libres de publicidad de terceros.'
          : 'Marca Blanca desactivada. Tus mesas mostrarán anuncios patrocinados de la red local.'
      );
      await onRefreshRestaurants();
      setTimeout(() => setUpgradeSuccessMsg(''), 5000);
    }
  };

  const handleVeto = async (adId: string) => {
    if (!mainRestaurant) return;
    const res = await api.vetoAdvertiser(mainRestaurant.id, adId);
    if (res.success) {
      setVetoSuccessMsg('¡Anunciante vetado con éxito! Ha dejado de rotar en tus mesas durante 30 días.');
      await onRefreshRestaurants();
      setTimeout(() => setVetoSuccessMsg(''), 4000);
    } else if (res.error === 'LIMIT_REACHED') {
      setAdFreeFromVeto(true);
      setShowAdFreeModal(true);
    }
  };

  const handleUnveto = async (adId: string) => {
    if (!mainRestaurant) return;
    await api.unvetoAdvertiser(mainRestaurant.id, adId);
    setVetoSuccessMsg('Se ha levantado el veto del anunciante. Volverá a rotar en tus mesas.');
    await onRefreshRestaurants();
    setTimeout(() => setVetoSuccessMsg(''), 4000);
  };

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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      m.role === 'owner'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {m.role === 'owner' ? '👑 Dueño' : '🧑‍💼 Gerente'}
                    </span>
                    {isOwner && m.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => setMemberToRevoke(m)}
                        title="Revocar acceso al gerente"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 3B: Personal de Sala y Cocina (PIN de 4 Dígitos) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal de Sala & Cocina</h3>
                <p className="text-[11px] text-slate-400">Meseros y cocineros con PIN de 4 dígitos</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddStaffModal(true);
                setNewStaffName('');
                setNewStaffPin('');
                setCreatedStaffCreds(null);
                setNewStaffRole('waiter');
                setNewStaffBranchId(selectedStaffBranchId || restaurants[0]?.id || '');
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Alta Personal</span>
            </button>
          </div>

          {/* Selector de Sucursal para Personal si hay más de 1 */}
          {restaurants.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <Store className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] font-bold text-slate-600">Sucursal:</span>
              <select
                value={selectedStaffBranchId}
                onChange={(e) => {
                  setSelectedStaffBranchId(e.target.value);
                  loadStaff(e.target.value);
                }}
                className="flex-1 bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.brand_name} - {r.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Links directos a las pantallas */}
          <div className="flex items-center gap-2 text-[11px]">
            <a
              href="#/portal/mesero"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Terminal Mesero ↗</span>
            </a>
            <a
              href="#/portal/cocina"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-orange-600" />
              <span>Pantalla Cocina KDS ↗</span>
            </a>
          </div>

          {/* Lista de Personal */}
          {loadingStaff ? (
            <p className="text-xs text-slate-400 py-4 text-center">Cargando personal de piso...</p>
          ) : staffMembers.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-xs text-slate-500 font-medium">No hay meseros ni cocineros registrados.</p>
              <p className="text-[11px] text-slate-400">
                Registra a tu equipo de turno para que puedan ingresar a las pantallas de servicio con su PIN.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowAddStaffModal(true);
                  setNewStaffName('');
                  setNewStaffPin('');
                  setCreatedStaffCreds(null);
                }}
                className="mt-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                + Registrar Primer Colaborador
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              {staffMembers.map((s) => {
                const isRevealed = revealedPins[s.id] || false;
                return (
                  <div key={s.id} className="p-3 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        s.role === 'kitchen'
                          ? 'bg-amber-100 text-amber-700'
                          : s.role === 'manager'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.role === 'kitchen' ? (
                          <ChefHat className="w-4 h-4" />
                        ) : s.role === 'manager' ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold block truncate max-w-[140px] ${
                            s.is_active ? 'text-slate-900' : 'text-slate-400 line-through'
                          }`}>
                            {s.name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {s.is_active ? 'Activo' : 'Pausado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-medium">
                          <select value={s.role} onChange={async (e) => { const nextRole = e.target.value as StaffRole; setStaffMembers((prev) => prev.map((item) => (item.id === s.id ? { ...item, role: nextRole } : item))); await api.updateStaffMember(s.id, { role: nextRole }); }} className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-orange-500">
                            <option value="waiter">Mesero de Sala</option>
                            <option value="kitchen">Jefe de Cocina / KDS</option>
                            <option value="manager">Capitán de Piso</option>
                          </select>
                          </span>
                          <span>•</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700 flex items-center gap-1">
                            PIN: {isRevealed ? s.pin_code : '••••'}
                            <button
                              type="button"
                              onClick={() => setRevealedPins((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                              className="text-slate-400 hover:text-slate-600 ml-0.5"
                              title={isRevealed ? 'Ocultar PIN' : 'Ver PIN'}
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Staff: Cambiar PIN, Pausar/Reanudar, Eliminar */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setStaffToEditPin(s);
                          setEditPinValue(s.pin_code);
                        }}
                        title="Cambiar PIN de acceso"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStaffActive(s)}
                        title={s.is_active ? 'Pausar acceso' : 'Reactivar acceso'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          s.is_active
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {s.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffToDelete(s)}
                        title="Eliminar del equipo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {upgradeSuccessMsg && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-3xl text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fadeIn md:col-span-2">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{upgradeSuccessMsg}</span>
          </div>
        )}

                {/* BLOQUE PUSH: Notificaciones Nativas & Alertas en Teléfono (FASE 4) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notificaciones Push & Alertas Nativas en Vivo</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    pushPermission === 'granted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : pushPermission === 'denied'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {pushPermission === 'granted' ? '🔔 Activas' : pushPermission === 'denied' ? '🔕 Bloqueadas' : '⚠️ Pendientes'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Despierta tu celular con sonido y vibración inmediata ante quejas de 1-3 estrellas o llamadas de mesa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {pushPermission !== 'granted' ? (
                <button
                  type="button"
                  disabled={isRequestingPush}
                  onClick={handleEnablePush}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isRequestingPush ? 'Activando...' : 'Activar en este Teléfono'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestPushAlarm}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{pushTestSuccess ? '¡Alarma Sonando!' : 'Probar Alarma en mi Celular'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-700 block">🚨 Contención en Vivo</span>
              <p className="text-[11px] text-slate-500">
                Tu teléfono suena al instante cuando una mesa califica mal, para que puedas levantarte y solucionar el problema antes de que se vayan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-700 block">📱 Soporte S.O. Nativo</span>
              <p className="text-[11px] text-slate-500">
                Funciona en Android (Chrome/PWA/APK) e iOS (Safari PWA/App Store). No requiere tener la pantalla del portal encendida.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-700 block">📍 Geocercas GPS 200m</span>
              <p className="text-[11px] text-slate-500">
                Integrado con Apple Wallet y Google Wallet para despertar cupones en la pantalla bloqueada cuando el cliente camina cerca.
              </p>
            </div>
          </div>
        </div>


        {/* BLOQUE 4: Escalera de Valor & Niveles de Servicio (SPEC-010) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Escalera de Niveles de Servicio</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
                    Cliente Fundador
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Beneficios activos en tus mesas y próximas herramientas desbloqueables in-app
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!mainRestaurant?.is_ad_free && (
                <button
                  type="button"
                  onClick={() => setShowAdFreeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quitar Ads (Marca Blanca)</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjetas de los 3 Niveles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* NIVEL 1 / FUNDADOR (ACTIVO) */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/40 relative overflow-hidden space-y-3 flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider">
                    Nivel 1 • Activo
                  </span>
                  <span className="text-xs font-black text-emerald-800">$0 MXN / mes</span>
                </div>

                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Filtro de Reputación</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Calificaciones de 4-5 estrellas van a Google Maps. Las quejas de 1-3 estrellas se desvían de forma privada a tu celular.
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Incluido gratis de por vida</span>
              </div>
            </div>

            {/* NIVEL 2: MENÚ + LINKTREE + WIFI */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              (mainRestaurant?.tier || 1) >= 2
                ? 'border-blue-400 bg-blue-50/40 shadow-sm'
                : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                    (mainRestaurant?.tier || 1) >= 2
                      ? 'bg-blue-600 text-white font-black'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {(mainRestaurant?.tier || 1) >= 2 ? 'Nivel 2 • Activo' : 'Nivel 2 • Siguiente Paso'}
                  </span>
                  <span className="text-xs font-black text-slate-800">$99 MXN / mes</span>
                </div>

                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <UtensilsCrossed className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Menú Digital + WiFi 1-Toque</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todo el Nivel 1 más: carta digital con fotos, redes sociales y conexión directa a tu red WiFi sin pedir contraseñas a meseros.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                {(mainRestaurant?.tier || 1) >= 2 ? (
                  <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[11px]">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Habilitado en tus mesas</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(2)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Activar Nivel 2 ($99 MXN)
                  </button>
                )}
              </div>
            </div>

            {/* NIVEL 3: SALDO DE PAUTA Y COMANDAS */}
            <div className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              (mainRestaurant?.tier || 1) >= 3
                ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                    (mainRestaurant?.tier || 1) >= 3
                      ? 'bg-amber-600 text-slate-950 font-black'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {(mainRestaurant?.tier || 1) >= 3 ? 'Nivel 3 • Activo' : 'Nivel 3 • Alto Impacto'}
                  </span>
                  <span className="text-xs font-black text-amber-900">$499 MXN / mes</span>
                </div>

                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Red de Anuncios Local</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todo lo anterior + <strong>$500 MXN mensuales en saldo publicitario</strong> para pautar tu negocio en mesas aliadas de tu zona.
                </p>

                {(mainRestaurant?.tier || 1) >= 3 && (
                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950 font-bold">
                    <span>Tu Saldo de Pauta Disponible:</span>
                    <span className="text-sm font-black">${mainRestaurant?.ad_credit_balance || 500} MXN</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                {(mainRestaurant?.tier || 1) >= 3 ? (
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(true)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crear Anuncio con mi Saldo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(3)}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all"
                  >
                    Activar Nivel 3 ($499 MXN)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 4.5: Red Publicitaria y Veto Autónomo (SPEC-003) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Patrocinadores en tus Mesas & Veto Autónomo
                </h3>
                <p className="text-[11px] text-slate-400">
                  Controla la publicidad local que ven tus comensales (1 veto gratuito al mes)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mainRestaurant?.is_ad_free ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Marca Blanca Activa (0% Ads)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAdFreeFromVeto(false);
                    setShowAdFreeModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quitar Todos los Anuncios ($149 MXN)</span>
                </button>
              )}
            </div>
          </div>

          {vetoSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{vetoSuccessMsg}</span>
            </div>
          )}

          {mainRestaurant?.is_ad_free ? (
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">
                Tus mesas están 100% limpias de publicidad de terceros
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Has contratado el módulo Marca Blanca. Ningún comercio ni patrocinador rotará en tus pantallas.
              </p>
              <button
                type="button"
                disabled={isTogglingAdFree}
                onClick={() => handleToggleAdFree(false)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline pt-1"
              >
                Desactivar Marca Blanca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                <Ban className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Política de Veto (SPEC-003):</strong> Tienes derecho a bloquear <strong>1 anunciante por mes</strong> sin costo para que no aparezca en tus mesas durante 30 días. Para bloquear a todos sin límites, activa Marca Blanca.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ads.map((ad) => {
                  const isVetoed = (mainRestaurant?.blocked_ad_ids || []).includes(ad.id);
                  return (
                    <div
                      key={ad.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isVetoed
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                          {ad.advertiser_name}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 truncate">{ad.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {isVetoed ? '🚫 Vetado en tus mesas' : 'Rotando actualmente'}
                        </span>
                      </div>

                      <div>
                        {isVetoed ? (
                          <button
                            type="button"
                            onClick={() => handleUnveto(ad.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold"
                          >
                            Desbloquear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVeto(ad.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Vetar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {r.branch_name || r.name}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {r.business_type === 'gym' ? '🏋️ Gym' : r.business_type === 'dental' ? '🦷 Dental' : r.business_type === 'spa' ? '💆 Spa' : '🍽️ Gastro'}
                      </span>
                    </div>
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

      {/* BLOQUE 5A-2: TERMINALES OPERATIVAS DE SALA Y COCINA */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Terminales de Operación en Sala & Cocina</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase border border-orange-200">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantallas dedicadas para que cocineros y meseros operen las mesas sin tocar tu cuenta administrativa
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card KDS Cocina */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-orange-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-orange-600 tracking-wider">Pantalla de Cocina / KDS</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">Activo</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <span>KDS Cocina & Barra</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tablero Kanban para tablets o monitores de cocina. Muestra pedidos de mesas en tiempo real con temporizadores SLA y formato de ticket térmico.
              </p>
            </div>
            <a
              href="#/portal/cocina"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Abrir KDS Cocina</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card Terminal Mesero */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">App de Sala para Meseros</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-bold font-mono">PIN: 1234</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Terminal Móvil de Mesero</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Acceso con PIN de 4 dígitos. Recibe llamadas de mesa (*pedir cuenta, asistencia*), alertas inmediatas de quejas de 1 a 3 estrellas y canje de cupones.
              </p>
            </div>
            <a
              href="#/portal/mesero"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Abrir Terminal Mesero</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* BLOQUE 5B: MESA DE AYUDA B2B */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Mesa de Ayuda B2B</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase border border-blue-200">
                  Soporte Directo
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ¿Placas físicas dañadas o despegadas? ¿Nuevas placas ($100 c/u) o dudas de facturación?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateTicketModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Levantar Solicitud</span>
          </button>
        </div>

        {loadingTickets ? (
          <div className="py-6 text-center text-slate-400 text-xs">Cargando tus solicitudes de soporte...</div>
        ) : supportTickets.length === 0 ? (
          <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-center space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No tienes incidencias ni solicitudes abiertas</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Todas tus placas físicas y servicios están activos. Si requieres repuestos o placas adicionales para nuevas mesas, da clic en el botón superior.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {supportTickets.map((t) => {
              const catCfg = SUPPORT_CATEGORIES[t.category] || SUPPORT_CATEGORIES.general;
              const statusCfg = SUPPORT_STATUSES[t.status] || SUPPORT_STATUSES.pending;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${catCfg.badge}`}>
                        {catCfg.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>
                      {t.restaurant && (
                        <span className="text-[11px] font-medium text-slate-500">
                          • {t.restaurant.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.subject}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{t.message}</p>
                  </div>

                  {/* Respuesta del Superadmin */}
                  {t.admin_reply && (
                    <div className="mt-2 p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1 animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Respuesta de Soporte Técnico:</span>
                      </div>
                      <p className="text-xs text-blue-950 font-medium whitespace-pre-wrap pl-5">
                        {t.admin_reply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

      {/* MODAL 3: Checkout Ad-Free (Marca Blanca $149 MXN) */}
        {showAdFreeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Activar Marca Blanca (0% Ads)</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Elimina el 100% de los anuncios de terceros en tus mesas. Tus comensales solo verán tu logo, tus estrellas y tu menú.
                </p>
              </div>

              {adFreeFromVeto && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <strong>⚠️ Límite de veto alcanzado:</strong> Ya utilizaste tu bloqueo mensual gratuito (1 anunciante cada 30 días). Si deseas eliminar todos los anuncios sin restricciones, activa Marca Blanca.
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold">Cuota Mensual</span>
                <span className="text-2xl font-black text-slate-900">$149 MXN</span>
                <span className="text-[11px] text-slate-500 block">por sucursal al mes</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isTogglingAdFree}
                  onClick={() => handleToggleAdFree(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isTogglingAdFree ? 'Activando...' : 'Activar Marca Blanca In-App ($149)'}</span>
                </button>

                <a
                  href="https://wa.me/525557510201?text=Hola,%20deseo%20activar%20Marca%20Blanca%20(Ad-Free)%20por%20$149%20MXN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Pedir Factura por WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                onClick={() => {
                  setShowAdFreeModal(false);
                  setAdFreeFromVeto(false);
                }}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL UPGRADE NIVEL (Fase 3) */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                showUpgradeModal === 2 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {showUpgradeModal === 2 ? <UtensilsCrossed className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">
                  {showUpgradeModal === 2
                    ? 'Desbloquear Nivel 2: Menú + WiFi'
                    : 'Desbloquear Nivel 3: Saldo de Pauta $500'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {showUpgradeModal === 2
                    ? 'Habilita tu carta digital, tus redes sociales y la conexión WiFi con 1 toque en las mesas de tus sucursales.'
                    : 'Obtén $500 MXN mensuales en saldo publicitario para promocionar tu restaurante en mesas de negocios aliados.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-400 block uppercase font-bold">Inversión Mensual</span>
                <span className="text-2xl font-black text-slate-900">
                  {showUpgradeModal === 2 ? '$99 MXN' : '$499 MXN'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {showUpgradeModal === 2 ? 'Cancelación libre en cualquier momento' : 'Incluye $500 MXN en saldo renovable'}
                </span>
              </div>

              <button
                type="button"
                disabled={isUpgrading}
                onClick={() => handleConfirmUpgrade(showUpgradeModal)}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all ${
                  showUpgradeModal === 2
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isUpgrading
                    ? 'Procesando activación...'
                    : `Confirmar y Activar Nivel ${showUpgradeModal}`}
                </span>
              </button>

              <button
                onClick={() => setShowUpgradeModal(null)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* MODAL CREAR CAMPAÑA CON SALDO (Fase 3) */}
        {showCampaignModal && mainRestaurant && (
          <CreateCampaignModal
            isOpen={showCampaignModal}
            onClose={() => setShowCampaignModal(false)}
            restaurant={mainRestaurant}
            onSuccess={() => {
              onRefreshRestaurants();
              loadAds();
    loadStaff();
              setUpgradeSuccessMsg('¡Campaña publicada exitosamente! Tu anuncio ya está rotando en mesas aliadas.');
              setTimeout(() => setUpgradeSuccessMsg(''), 5000);
            }}
          />
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

      {/* Modal de Creación de Ticket de Soporte B2B */}
      {showCreateTicketModal && (
        <CreateSupportTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => setShowCreateTicketModal(false)}
          organizationId={organization.id}
          restaurants={restaurants}
          onCreated={loadSupportTickets}
        />
      )}
    
      {/* Toast de Notificación de Staff */}
      {staffActionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fadeIn border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{staffActionToast}</span>
        </div>
      )}

      {/* MODAL: Alta de Personal Operativo (PIN) */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Registrar Personal de Servicio</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddStaffModal(false);
                  setCreatedStaffCreds(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdStaffCreds ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">¡Personal Dado de Alta!</h4>
                  <p className="text-xs text-emerald-700">
                    Las credenciales operativas para <strong>{createdStaffCreds.name}</strong> están listas.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Colaborador:</span>
                    <strong className="text-slate-800">{createdStaffCreds.name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Rol:</span>
                    <span className="font-bold text-orange-600 uppercase text-[10px]">
                      {createdStaffCreds.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sucursal:</span>
                    <span className="font-bold text-slate-700 text-[11px]">{createdStaffCreds.branchName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold">PIN de Acceso:</span>
                    <span className="font-mono text-base font-black text-indigo-600 tracking-widest bg-white px-2 py-0.5 rounded border border-indigo-200">
                      {createdStaffCreds.pin}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const text = getStaffCopyMessage();
                    navigator.clipboard.writeText(text);
                    setStaffActionToast('Mensaje de credenciales copiado para WhatsApp');
                    setTimeout(() => setStaffActionToast(null), 3000);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Mensaje para WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedStaffCreds(null);
                    setNewStaffName('');
                    setNewStaffPin('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  + Registrar otro colaborador
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Ej. Rodrigo Morales (Mesero)"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rol Operativo</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white"
                  >
                    <option value="waiter">🍽️ Mesero de Sala (Llamadas y Comandas)</option>
                    <option value="kitchen">👨‍🍳 Cocinero / Barra (Pantalla KDS Kanban)</option>
                    <option value="manager">🛡️ Capitán de Sala (PIN de Autorización)</option>
                  </select>
                </div>

                {restaurants.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sucursal Asignada</label>
                    <select
                      value={newStaffBranchId}
                      onChange={(e) => setNewStaffBranchId(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white"
                    >
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.brand_name} - {r.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">PIN de Acceso (4 dígitos)</label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[10px] text-orange-600 font-bold hover:underline"
                    >
                      Generar PIN aleatorio
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 1234"
                    className="w-full p-2.5 text-xs font-mono tracking-widest rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    El colaborador usará este PIN para identificarse en su terminal de piso.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStaff || !newStaffName.trim() || newStaffPin.length < 4}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isSavingStaff ? 'Guardando...' : 'Crear Colaborador'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Cambiar PIN de Staff */}
      {staffToEditPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Key className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Cambiar PIN de Acceso</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualizar clave para <strong>{staffToEditPin.name}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmUpdatePin} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={editPinValue}
                  onChange={(e) => setEditPinValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nuevo PIN (4 dígitos)"
                  className="w-full p-2.5 text-center text-sm font-mono tracking-widest rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStaffToEditPin(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPin || editPinValue.length < 4}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {isUpdatingPin ? 'Actualizando...' : 'Guardar PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Eliminación de Personal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Eliminar personal?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Se dará de baja definitiva a <strong>{staffToDelete.name}</strong>. Ya no podrá autenticarse en ninguna terminal de sala o cocina.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingStaff}
                onClick={handleConfirmDeleteStaff}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isDeletingStaff ? 'Eliminando...' : 'Dar de Baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Revocación de Gerente Web */}
      {memberToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Revocar acceso al Gerente?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Se cancelará el acceso al portal para <strong>{memberToRevoke.user_email || memberToRevoke.user_id}</strong>. Ya no podrá consultar métricas ni responder quejas.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRevoke(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRevokingMember}
                onClick={handleRevokeMember}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isRevokingMember ? 'Revocando...' : 'Revocar Acceso'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
