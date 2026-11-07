import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type {
  FoodCourt,
  FoodCourtBranchLink,
  Organization,
  Restaurant,
} from '../../types';
import {
  Building2,
  X,
  Plus,
  Trash2,
  Tv,
  Volume2,
  Bell,
  Megaphone,
  ExternalLink,
  Check,
  Store,
  Layers,
  Copy,
  Edit2,
} from 'lucide-react';

interface FoodCourtConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodCourtBranch: Restaurant | null;
  allRestaurants: Restaurant[];
  organizations: Organization[];
  initialTab?: 'tenants' | 'turnero';
  onUpdated: () => Promise<void> | void;
}

export const FoodCourtConfigModal: React.FC<FoodCourtConfigModalProps> = ({
  isOpen,
  onClose,
  foodCourtBranch,
  allRestaurants,
  organizations,
  initialTab = 'tenants',
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'turnero'>(initialTab);
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [links, setLinks] = useState<FoodCourtBranchLink[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para vincular sucursal existente (Cross-Org) o crear nueva sucursal en 1 paso
  const [onboardingMode, setOnboardingMode] = useState<'existing' | 'create_new' | 'preregister'>('existing');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [spaceNumber, setSpaceNumber] = useState('Local FC-04');
  const [pickupCounter, setPickupCounter] = useState('Barra 1');
  const [newBrandName, setNewBrandName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [createOrgId, setCreateOrgId] = useState('');
  const [createNewOrgName, setCreateNewOrgName] = useState('');
  const [createBranchName, setCreateBranchName] = useState('');
  const [createGoogleUrl, setCreateGoogleUrl] = useState('');
  const [creatingTenantBranch, setCreatingTenantBranch] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Edición en línea de un vínculo existente
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editSpaceDraft, setEditSpaceDraft] = useState('');
  const [editCounterDraft, setEditCounterDraft] = useState('');

  // Configuración del Turnero 4K
  const [fcName, setFcName] = useState('');
  const [mallName, setMallName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [enableVoiceTts, setEnableVoiceTts] = useState(true);
  const [enableBuzzerChime, setEnableBuzzerChime] = useState(true);
  const [autoHideReadyMinutes, setAutoHideReadyMinutes] = useState(3);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || !foodCourtBranch) return;
    let mounted = true;

    const loadFcData = async () => {
      setLoading(true);
      setStatusMsg(null);
      setGeneratedInviteUrl(null);
      const fc = await api.ensureFoodCourtForBranch(foodCourtBranch);
      const branchLinks = await api.getFoodCourtBranches(fc.id);
      if (!mounted) return;
      setFoodCourt(fc);
      setLinks(branchLinks);
      setFcName(fc.name);
      setMallName(fc.mall_name);
      if (!createBranchName) {
        setCreateBranchName(fc.mall_name || foodCourtBranch.brand_name || 'Plaza Comercial');
      }
      setPrimaryColor(fc.turnero_config?.primaryColor || '#2563eb');
      setEnableVoiceTts(fc.turnero_config?.enableVoiceTts !== false);
      setEnableBuzzerChime(fc.turnero_config?.enableBuzzerChime !== false);
      setAutoHideReadyMinutes(fc.turnero_config?.autoHideReadyMinutes || 3);
      setLoading(false);
    };

    loadFcData();
    return () => {
      mounted = false;
    };
  }, [isOpen, foodCourtBranch]);

  if (!isOpen || !foodCourtBranch) return null;

  // Sucursales elegibles para federar (que no sean Plazas Comerciales y no estén ya vinculadas)
  const linkedRestIds = new Set(links.map((l) => l.restaurant_id).filter(Boolean));
  const candidateRestaurants = allRestaurants.filter(
    (r) =>
      r.id !== foodCourtBranch.id &&
      r.business_type !== 'food_court' &&
      !linkedRestIds.has(r.id)
  );

  const getOrgName = (orgId?: string | null) => {
    if (!orgId) return 'Local Independiente';
    const found = organizations.find((o) => o.id === orgId);
    return found ? found.name : 'Organización Externa';
  };

  const handleLinkExistingBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt || !selectedRestaurantId) return;
    setStatusMsg(null);

    const res = await api.linkBranchToFoodCourt(
      foodCourt.id,
      selectedRestaurantId,
      spaceNumber,
      pickupCounter
    );

    if (res.success && res.data) {
      const refreshed = await api.getFoodCourtBranches(foodCourt.id);
      setLinks(refreshed);
      setSelectedRestaurantId('');
      setSpaceNumber(`Local FC-0${refreshed.length + 1}`);
      setStatusMsg({
        type: 'ok',
        text: 'Sucursal federada exitosamente al Food Court.',
      });
      await onUpdated();
    } else {
      setStatusMsg({
        type: 'err',
        text: res.error || 'No se pudo federar la sucursal seleccionada.',
      });
    }
  };

  const handlePreRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt || !newBrandName.trim()) return;
    setStatusMsg(null);

    const res = await api.preRegisterFoodCourtTenant(foodCourt.id, {
      brandName: newBrandName,
      spaceNumber,
      pickupCounter,
      contactEmail: newContactEmail,
    });

    if (res.success && res.data) {
      const refreshed = await api.getFoodCourtBranches(foodCourt.id);
      setLinks(refreshed);
      setNewBrandName('');
      setNewContactEmail('');
      setGeneratedInviteUrl(res.activationUrl || null);
      setStatusMsg({
        type: 'ok',
        text: 'Locatario pre-registrado con enlace de activación generado.',
      });
      await onUpdated();
    } else {
      setStatusMsg({
        type: 'err',
        text: res.error || 'Error al pre-registrar el locatario.',
      });
    }
  };

  const handleCreateAndFederateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt || !newBrandName.trim()) return;
    setCreatingTenantBranch(true);
    setStatusMsg(null);

    const res = await api.createAndFederateTenantBranch(foodCourt.id, {
      organizationId: createOrgId || null,
      newOrganizationName: !createOrgId ? createNewOrgName.trim() || newBrandName.trim() : undefined,
      ownerEmail: newContactEmail.trim() || undefined,
      brandName: newBrandName.trim(),
      branchName: createBranchName.trim() || foodCourt.mall_name || 'Plaza Comercial',
      businessType: 'restaurant',
      spaceNumber: spaceNumber.trim() || 'Local FC-01',
      pickupCounter: pickupCounter.trim() || 'Barra 1',
      googleReviewUrl: createGoogleUrl.trim() || undefined,
    });

    setCreatingTenantBranch(false);

    if (res.success && res.link) {
      const refreshed = await api.getFoodCourtBranches(foodCourt.id);
      setLinks(refreshed);
      setNewBrandName('');
      setCreateNewOrgName('');
      setCreateGoogleUrl('');
      setSpaceNumber(`Local FC-0${refreshed.length + 1}`);
      setStatusMsg({
        type: 'ok',
        text: `Sucursal "${res.restaurant?.name || newBrandName}" dada de alta y federada al Turnero 4K en un solo paso.`,
      });
      await onUpdated();
    } else {
      setStatusMsg({
        type: 'err',
        text: res.error || 'No se pudo crear y federar la nueva sucursal.',
      });
    }
  };

  const handleSaveInlineLinkEdit = async (linkId: string) => {
    if (!foodCourt) return;
    await api.updateFoodCourtBranchLink(linkId, {
      commercial_space_number: editSpaceDraft.trim() || 'Local FC-01',
      pickup_counter_label: editCounterDraft.trim() || 'Barra 1',
    });
    const refreshed = await api.getFoodCourtBranches(foodCourt.id);
    setLinks(refreshed);
    setEditingLinkId(null);
    await onUpdated();
  };

  const handleRemoveLink = async (linkId: string, label: string) => {
    if (!foodCourt) return;
    if (!window.confirm(`¿Deseas desvincular "${label}" de esta Plaza Comercial?`)) return;
    await api.removeBranchFromFoodCourt(linkId);
    const refreshed = await api.getFoodCourtBranches(foodCourt.id);
    setLinks(refreshed);
    await onUpdated();
  };

  const handleSaveTurneroConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt) return;
    setSavingConfig(true);
    setStatusMsg(null);

    const res = await api.updateFoodCourtConfig(
      foodCourt.id,
      {
        primaryColor,
        enableVoiceTts,
        enableBuzzerChime,
        autoHideReadyMinutes,
        splitRatio: '70_30',
      },
      {
        name: fcName.trim() || foodCourt.name,
        mall_name: mallName.trim() || foodCourt.mall_name,
      }
    );

    setSavingConfig(false);
    if (res.success && res.data) {
      setFoodCourt(res.data);
      setStatusMsg({
        type: 'ok',
        text: 'Configuración del Turnero 4K guardada correctamente.',
      });
      await onUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-4xl overflow-hidden my-8">
        {/* Cabecera Bento Light */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  Configuración de Plaza Comercial: {foodCourtBranch.branch_name || foodCourtBranch.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  Giro: Plaza Comercial / Food Court
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Federación Cross-Organization de sucursales locatarias y control del Turnero 4K 70/30.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {foodCourt && (
              <>
                <a
                  href={`#/turnero-plaza/${foodCourt.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors"
                >
                  <Tv className="w-3.5 h-3.5 text-rose-600" />
                  <span>Turnero 4K</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`#/food-court?fc=${foodCourt.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Consola Plaza</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="px-6 pt-3 bg-slate-50/60 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tenants');
              setStatusMsg(null);
            }}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-extrabold border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>1. Locatarios Federados ({links.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('turnero');
              setStatusMsg(null);
            }}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-extrabold border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'turnero'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>2. Turnero 4K & Red de Anuncios 70/30</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {statusMsg && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span>{statusMsg.text}</span>
              <button
                type="button"
                onClick={() => setStatusMsg(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Cargando configuración de la Plaza Comercial...
            </div>
          ) : activeTab === 'tenants' ? (
            <div className="space-y-5">
              {/* Formulario de Federación de Locatarios (Doble Vía) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Adherir Sucursal al Comedor (Federación Cross-Organization)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vincula una sucursal de otra Organización existente en el directorio o pre-registra un nuevo inquilino.
                    </p>
                  </div>

                  <div className="inline-flex flex-wrap rounded-xl bg-white p-0.5 border border-slate-200 self-start gap-0.5">
                    <button
                      type="button"
                      onClick={() => setOnboardingMode('existing')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        onboardingMode === 'existing'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sucursal Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingMode('create_new')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        onboardingMode === 'create_new'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Crear Nueva Sucursal en Plaza
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingMode('preregister')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        onboardingMode === 'preregister'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Invitación por Link
                    </button>
                  </div>
                </div>

                {onboardingMode === 'existing' ? (
                  <form onSubmit={handleLinkExistingBranch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Sucursal de Otra Organización
                      </label>
                      <select
                        value={selectedRestaurantId}
                        onChange={(e) => setSelectedRestaurantId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Seleccionar sucursal del directorio...</option>
                        {candidateRestaurants.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({getOrgName(r.organization_id)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Número de Local / Isla
                      </label>
                      <input
                        type="text"
                        value={spaceNumber}
                        onChange={(e) => setSpaceNumber(e.target.value)}
                        placeholder="Ej. Local FC-04"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Barra / Mostrador
                      </label>
                      <input
                        type="text"
                        value={pickupCounter}
                        onChange={(e) => setPickupCounter(e.target.value)}
                        placeholder="Barra 1"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={!selectedRestaurantId}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Federar</span>
                      </button>
                    </div>
                  </form>
                ) : onboardingMode === 'create_new' ? (
                  <form onSubmit={handleCreateAndFederateBranch} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Organización Dueña del Local
                        </label>
                        <select
                          value={createOrgId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateOrgId(val);
                            const foundOrg = organizations.find((o) => o.id === val);
                            if (foundOrg && !newBrandName) {
                              setNewBrandName(foundOrg.name);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                        >
                          <option value="">+ Crear Nueva Organización...</option>
                          {organizations
                            .filter((o) => o.id !== foodCourtBranch.organization_id)
                            .map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name} ({org.owner_name})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Marca Comercial del Locatario *
                        </label>
                        <input
                          type="text"
                          required
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          placeholder="Ej. Lorde Lunch, Tacos El Pastor"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nombre de la Sucursal en Plaza *
                        </label>
                        <input
                          type="text"
                          required
                          value={createBranchName}
                          onChange={(e) => setCreateBranchName(e.target.value)}
                          placeholder={`Ej. ${foodCourt?.mall_name || 'Plaza Oriente'}`}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Número de Local / Isla *
                        </label>
                        <input
                          type="text"
                          required
                          value={spaceNumber}
                          onChange={(e) => setSpaceNumber(e.target.value)}
                          placeholder="Local FC-01"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Barra de Entrega *
                        </label>
                        <input
                          type="text"
                          required
                          value={pickupCounter}
                          onChange={(e) => setPickupCounter(e.target.value)}
                          placeholder="Barra 1"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Link Google Reseñas (Opcional)
                        </label>
                        <input
                          type="text"
                          value={createGoogleUrl}
                          onChange={(e) => setCreateGoogleUrl(e.target.value)}
                          placeholder="https://g.page/r/... (o se autogenera)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          disabled={creatingTenantBranch || !newBrandName.trim()}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {creatingTenantBranch ? 'Creando...' : 'Crear y Federar Local'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePreRegisterTenant} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Marca Comercial del Locatario
                      </label>
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Ej. Burger Lab Express"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Correo del Titular
                      </label>
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="gerencia@marca.com"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Local / Isla
                      </label>
                      <input
                        type="text"
                        value={spaceNumber}
                        onChange={(e) => setSpaceNumber(e.target.value)}
                        placeholder="Local FC-05"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generar Invitación</span>
                      </button>
                    </div>
                  </form>
                )}

                {generatedInviteUrl && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-2 text-xs text-indigo-950">
                    <div className="truncate">
                      <span className="font-extrabold block">Enlace de Onboarding para el Locatario:</span>
                      <span className="font-mono text-[11px] text-indigo-700">{generatedInviteUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(generatedInviteUrl)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 text-[11px] font-bold hover:bg-indigo-100 flex-shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tabla de Sucursales Federadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Directorio de Sucursales Adheridas al Food Court ({links.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aislamiento estricto: cada locatario conserva su propia Organización Matriz.
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Local / Isla</th>
                        <th className="py-2.5 px-3">Barra</th>
                        <th className="py-2.5 px-3">Sucursal / Marca Locataria</th>
                        <th className="py-2.5 px-3">Organización Matriz Dueña</th>
                        <th className="py-2.5 px-3">Estado Turnero</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {links.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Aún no hay sucursales federadas en esta Plaza Comercial.
                          </td>
                        </tr>
                      ) : (
                        links.map((link) => {
                          const targetRest = allRestaurants.find((r) => r.id === link.restaurant_id);
                          const isEditing = editingLinkId === link.id;

                          return (
                            <tr key={link.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editSpaceDraft}
                                    onChange={(e) => setEditSpaceDraft(e.target.value)}
                                    className="w-28 px-2 py-1 rounded-lg border border-blue-300 text-xs"
                                  />
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-extrabold">
                                    {link.commercial_space_number}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 font-semibold">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editCounterDraft}
                                    onChange={(e) => setEditCounterDraft(e.target.value)}
                                    className="w-24 px-2 py-1 rounded-lg border border-blue-300 text-xs"
                                  />
                                ) : (
                                  link.pickup_counter_label
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-extrabold text-slate-900 block">
                                  {targetRest ? targetRest.name : link.tenant_brand_name}
                                </span>
                                {targetRest && (
                                  <span className="text-[10px] text-slate-500">
                                    Marca: {targetRest.brand_name}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                                  {targetRest
                                    ? getOrgName(targetRest.organization_id)
                                    : 'Pendiente de Activación'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    link.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {link.status === 'active' ? 'Activo en Turnero 4K' : 'Invitación Enviada'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {isEditing ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineLinkEdit(link.id)}
                                      className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Guardar</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLinkId(link.id);
                                        setEditSpaceDraft(link.commercial_space_number);
                                        setEditCounterDraft(link.pickup_counter_label);
                                      }}
                                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                      title="Editar número de local o barra"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveLink(
                                        link.id,
                                        (targetRest ? targetRest.name : link.tenant_brand_name) ||
                                          'Locatario'
                                      )
                                    }
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Desvincular sucursal de la Plaza Comercial"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveTurneroConfig} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título en Pantalla del Comedor
                  </label>
                  <input
                    type="text"
                    value={fcName}
                    onChange={(e) => setFcName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Oficial de la Plaza / Inmueble
                  </label>
                  <input
                    type="text"
                    value={mallName}
                    onChange={(e) => setMallName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Color Corporativo de Acento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Controles de Audio TTS, Campana y Auto-Ocultado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Voz Sintetizada TTS
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Anuncia turno, marca y barra
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVoiceTts}
                    onChange={(e) => setEnableVoiceTts(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Tono Acústico Buzzer
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Campana previa al anuncio
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBuzzerChime}
                    onChange={(e) => setEnableBuzzerChime(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Retiro Automático (Min)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Minutos en columna Listos
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={autoHideReadyMinutes}
                    onChange={(e) => setAutoHideReadyMinutes(Number(e.target.value) || 3)}
                    className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Bloque Informativo de Red Publicitaria 70/30 */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <span className="font-extrabold block">
                      Distribución Fija Split-Screen 70% Turnos / 30% Red Publicitaria SaaS
                    </span>
                    <span className="text-amber-800 text-[11px]">
                      La columna derecha (30% vertical) proyecta pauta patrocinada administrada por nuestra red, subsidiando la infraestructura 4K de la Plaza Comercial.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold whitespace-nowrap">
                  Split 70 / 30 Activo
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingConfig ? 'Guardando...' : 'Guardar Configuración 4K'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
