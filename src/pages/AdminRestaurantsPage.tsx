import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type {
  Restaurant,
  Organization,
  OrganizationBrand,
  BusinessVertical,
  Tag,
  StaffMember,
  StaffRole,
  Feedback,
  TierType,
  OrganizationManager,
  StoreManagerRole,
  RestaurantTable,
  RestaurantTableStatus,
  ManagerRetentionCoupon,
  ManagerShiftReport,
  KitchenStation,
  CustomTierDefinition,
} from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { NewOrganizationModal } from '../components/admin/NewOrganizationModal';
import { OrganizationEditModal } from '../components/admin/OrganizationEditModal';
import { TrialPeriodModal } from '../components/admin/TrialPeriodModal';
import { ManagerEditModal } from '../components/admin/ManagerEditModal';
import { MenuManagementModal } from '../components/admin/MenuManagementModal';
import { ManagerCouponModal } from '../components/admin/ManagerCouponModal';
import { TIERS, DEFAULT_CUSTOM_TIERS } from '../lib/constants';
import {
  calculateRestaurantKpis,
  buildOrganizationTree,
  isBranchTrialActive,
  type BranchNode,
  type TierFeatureConfig,
} from '../lib/restaurants_bento';
import {
  Store,
  Plus,
  ExternalLink,
  Edit2,
  Sparkles,
  QrCode,
  MapPin,
  Phone,
  KeyRound,
  Building2,
  Search,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Mail,
  UserCheck,
  Sliders,
  Monitor,
  Layers,
  MessageSquareWarning,
  Tag as TagIcon,
  Check,
  Trash2,
  Filter,
  RotateCcw,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  Ticket,
  BarChart2,
  SlidersHorizontal,
  ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PhoneInputWithCountry,
  formatTextMax25,
} from '../components/common/PhoneInputWithCountry';

const KDS_STORAGE_KEY = 'nfc_kds_stations_state_v1';
const WAITER_TERM_STORAGE_KEY = 'nfc_waiter_terminal_state_v1';
const TIER_FEATURES_STORAGE_KEY = 'nfc_tier_features_overrides_v1';
const MASTER_CATEGORIES_STORAGE_KEY = 'nfc_branch_master_categories_v1';

const filterByDateWindow = (
  dateStr: string | undefined,
  windowType: 'hoy' | '7dias' | '30dias' | 'historico'
): boolean => {
  if (windowType === 'historico' || !dateStr) return true;
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (windowType === 'hoy') {
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    return isToday || diffDays <= 1;
  }
  if (windowType === '7dias') {
    return diffDays <= 7;
  }
  if (windowType === '30dias') {
    return diffDays <= 30;
  }
  return true;
};

interface StatusBadgeAndSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
  title?: string;
}

const StatusBadgeAndSwitch: React.FC<StatusBadgeAndSwitchProps> = ({
  isOn,
  onToggle,
  disabled = false,
  labelOn = 'Prendido',
  labelOff = 'Apagado',
  title,
}) => {
  return (
    <div className="inline-flex items-center gap-2.5">
      {/* Badge de Estado Actual */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-colors ${
          isOn
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span>{isOn ? labelOn : labelOff}</span>
      </span>

      {/* Switch Interactivo Prendido / Apagado */}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={onToggle}
        title={title || (isOn ? 'Cambiar a Apagado' : 'Cambiar a Prendido')}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${isOn ? 'bg-emerald-600' : 'bg-slate-300'}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            isOn ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

interface InlineEditableTooltipFieldProps {
  value?: string | null;
  emptyLabel: string;
  icon: 'address' | 'phone';
  href?: string;
  onSave: (newValue: string) => Promise<void>;
}

const InlineEditableTooltipField: React.FC<InlineEditableTooltipFieldProps> = ({
  value,
  emptyLabel,
  icon,
  href,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const rawText = (value || '').trim();
  const display25 = rawText ? formatTextMax25(rawText) : emptyLabel;

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-2 rounded-xl bg-white border border-blue-200 shadow-sm space-y-1.5 z-20 max-w-[290px]">
        {icon === 'phone' ? (
          <PhoneInputWithCountry
            value={draft}
            onChange={setDraft}
            hasWhatsapp={hasWhatsapp}
            onWhatsappChange={setHasWhatsapp}
            compact
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dirección física completa..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        )}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setDraft(value || '');
              setIsEditing(false);
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold"
          >
            <Check className="w-3 h-3" />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group inline-flex items-center gap-1.5 max-w-full">
      {icon === 'address' ? (
        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      ) : (
        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
      )}

      {rawText && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={rawText}
          className="text-[11px] text-slate-600 hover:text-blue-600 font-medium truncate"
        >
          {display25}
        </a>
      ) : (
        <span
          title={rawText || emptyLabel}
          className={`text-[11px] truncate ${
            rawText ? 'text-slate-600 font-medium' : 'text-slate-400 italic'
          }`}
        >
          {display25}
        </span>
      )}

      {/* Botón de acceso directo a edición del campo */}
      <button
        type="button"
        onClick={() => {
          setDraft(value || '');
          setIsEditing(true);
        }}
        title={`Editar ${icon === 'address' ? 'dirección' : 'teléfono'}`}
        className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-80 group-hover:opacity-100 transition-all flex-shrink-0"
      >
        <Edit2 className="w-3 h-3" />
      </button>

      {/* Tooltip flotante con el contenido completo cuando supera 25 caracteres */}
      {rawText.length > 25 && (
        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-medium shadow-lg whitespace-normal max-w-[280px] z-30">
          {rawText}
        </div>
      )}
    </div>
  );
};

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationBrands, setOrganizationBrands] = useState<OrganizationBrand[]>([]);
  const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [organizationManagers, setOrganizationManagers] = useState<OrganizationManager[]>([]);
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>([]);
  const [managerCoupons, setManagerCoupons] = useState<ManagerRetentionCoupon[]>([]);
  const [managerShiftReports, setManagerShiftReports] = useState<ManagerShiftReport[]>([]);
  const [newMgrNameByOrg, setNewMgrNameByOrg] = useState<Record<string, string>>({});
  const [newMgrEmailByOrg, setNewMgrEmailByOrg] = useState<Record<string, string>>({});
  const [newMgrPinByOrg, setNewMgrPinByOrg] = useState<Record<string, string>>({});
  const [newMgrRoleByOrg, setNewMgrRoleByOrg] = useState<Record<string, StoreManagerRole>>({});
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado persistente de Pantallas KDS, Terminales de Meseros y Overrides de Funcionalidades Tier
  const [kdsStateByBranch, setKdsStateByBranch] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const raw = localStorage.getItem(KDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [waiterTerminalByBranch, setWaiterTerminalByBranch] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(WAITER_TERM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [tierFeatureOverridesByBranch, setTierFeatureOverridesByBranch] = useState<
    Record<string, Record<string, boolean>>
  >(() => {
    try {
      const raw = localStorage.getItem(TIER_FEATURES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Filtros de búsqueda y segmentación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [selectedVerticalFilter, setSelectedVerticalFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'paused' | 'with_complaints'>('all');

  // Estado de colapsado en el Árbol Tabular
  const [collapsedOrgs, setCollapsedOrgs] = useState<Record<string, boolean>>({});
  const [expandedBranchPanels, setExpandedBranchPanels] = useState<Record<string, boolean>>({});
  // Estado de expansión por categoría dentro de cada panel de sucursal (Categoría 1 a 6) (Requerimiento 2: colapsado por defecto)
  const [expandedCategoriesByBranch, setExpandedCategoriesByBranch] = useState<
    Record<string, Record<number, boolean>>
  >({});

  // Modales y Asistente de 3 Pasos (Organización -> Marca -> Sucursal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [preselectedOrgForNewBranch, setPreselectedOrgForNewBranch] = useState<string | undefined>(undefined);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedOrgForUserModal, setSelectedOrgForUserModal] = useState<string | undefined>(undefined);
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [wizardInitialOrg, setWizardInitialOrg] = useState<Organization | null>(null);
  const [wizardInitialBrand, setWizardInitialBrand] = useState<OrganizationBrand | null>(null);

  // Modal para Editar Organización Matriz
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Definición de Tiers Personalizados y Periodos de Prueba (Políticas 2, 3, 4, 5)
  const [customTiers, setCustomTiers] = useState<CustomTierDefinition[]>([]);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialModalTargetOrg, setTrialModalTargetOrg] = useState<Organization | null>(null);
  const [trialModalTargetBranch, setTrialModalTargetBranch] = useState<Restaurant | null>(null);
  const [trialModalDefaultTier, setTrialModalDefaultTier] = useState<TierType>(3);
  const [expandedTierSections, setExpandedTierSections] = useState<Record<string, Record<string, boolean>>>({});

  // Edición de Gerentes (Requerimiento 4)
  const [editingManager, setEditingManager] = useState<OrganizationManager | null>(null);
  const [isManagerEditModalOpen, setIsManagerEditModalOpen] = useState(false);

  // Agente Creador de Cupones por Gerente (Requerimiento 8)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponModalManager, setCouponModalManager] = useState<OrganizationManager | null>(null);
  const [couponModalRestaurantId, setCouponModalRestaurantId] = useState<string>('');
  const [couponModalBranchName, setCouponModalBranchName] = useState<string>('');

  // Estados de Colapso Inteligente y Renderizado Suave
  const [isTopKpisExpanded, setIsTopKpisExpanded] = useState<boolean>(true);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

  // Interruptores Maestros de Categorías por Sucursal (Cat 3, 4, 5, 6) (Requerimiento 3)
  const [branchMasterCategoriesState, setBranchMasterCategoriesState] = useState<
    Record<string, Record<number, boolean>>
  >(() => {
    try {
      const raw = localStorage.getItem(MASTER_CATEGORIES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleToggleBranchCategoryMaster = (branchId: string, categoryNum: number) => {
    setBranchMasterCategoriesState((prev) => {
      const branchState = prev[branchId] || {};
      const currentVal = branchState[categoryNum] !== false;
      const updated = {
        ...prev,
        [branchId]: {
          ...branchState,
          [categoryNum]: !currentVal,
        },
      };
      try {
        localStorage.setItem(MASTER_CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar error de guardado
      }
      return updated;
    });
  };

  const getBranchCategoryAllowed = (branch: Restaurant, catNum: number): boolean => {
    const branchTier = branch.tier || 1;
    const tierDef =
      customTiers.find((t) => t.tier === branchTier) ||
      DEFAULT_CUSTOM_TIERS.find((t) => t.tier === branchTier);
    if (!tierDef || !tierDef.allowed_categories) return true;
    return tierDef.allowed_categories.includes(catNum);
  };

  // Métricas Consolidadas de Organización (Requerimiento 6)
  const [expandedOrgMetrics, setExpandedOrgMetrics] = useState<Record<string, boolean>>({});
  const [orgMetricsTemporalFilter, setOrgMetricsTemporalFilter] = useState<
    Record<string, 'hoy' | '7dias' | '30dias' | 'historico'>
  >({});
  const [orgMetricsBranchFilter, setOrgMetricsBranchFilter] = useState<Record<string, string>>({});

  // Modal de Administración de Menú y Platillos (Requerimientos 3, 4)
  const [selectedMenuRestaurant, setSelectedMenuRestaurant] = useState<Restaurant | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  const getTierName = (tier: TierType | number) => {
    const custom = customTiers.find((t) => t.tier === tier);
    if (custom && custom.name) return custom.name;
    return TIERS[tier as TierType]?.name || `Tier ${tier}`;
  };

  const toggleOrgMetrics = (orgId: string) => {
    setExpandedOrgMetrics((prev) => ({
      ...prev,
      [orgId]: !prev[orgId],
    }));
  };

  // Filtros Temporales para Categoría 6 de Sucursal (Requerimiento 5)
  const [branchMetricsTemporalFilter, setBranchMetricsTemporalFilter] = useState<
    Record<string, 'hoy' | '7dias' | '30dias' | 'historico'>
  >({});

  const loadData = async () => {
    setLoading(true);
    const [
      resList,
      orgList,
      brandList,
      verticalList,
      tagList,
      staffList,
      fbList,
      mgrList,
      tablesList,
      couponsList,
      reportsList,
      tierDefsList,
    ] = await Promise.all([
      api.getRestaurants(),
      api.getOrganizations(),
      api.getOrganizationBrands(),
      api.getBusinessVerticals(),
      api.getTags(),
      api.getStaffMembers(),
      api.getFeedbacks(),
      api.getOrganizationManagers(),
      api.getRestaurantTables(),
      api.getManagerRetentionCoupons(),
      api.getManagerShiftReports(),
      api.getTierDefinitions(),
    ]);
    setRestaurants(resList);
    setOrganizations(orgList);
    setOrganizationBrands(brandList);
    setBusinessVerticals(verticalList);
    setTags(tagList);
    setStaffMembers(staffList);
    setFeedbacks(fbList);
    setOrganizationManagers(mgrList);
    setRestaurantTables(tablesList);
    setManagerCoupons(couponsList);
    setManagerShiftReports(reportsList);
    setCustomTiers(tierDefsList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleTiersUpdate = () => {
      api.getTierDefinitions().then((updated) => setCustomTiers(updated));
    };
    window.addEventListener('nfc_tier_definitions_updated', handleTiersUpdate);
    return () => {
      window.removeEventListener('nfc_tier_definitions_updated', handleTiersUpdate);
    };
  }, []);

  const kpis = useMemo(() => {
    return calculateRestaurantKpis(restaurants, tags);
  }, [restaurants, tags]);

  // Construcción del Árbol Jerárquico (Organización -> Marca Comercial -> Sucursal -> Panel de Control)
  const treeData = useMemo(() => {
    return buildOrganizationTree(
      organizations,
      restaurants,
      tags,
      searchQuery,
      selectedOrgFilter,
      selectedTierFilter,
      staffMembers,
      kdsStateByBranch,
      feedbacks,
      tierFeatureOverridesByBranch,
      organizationBrands,
      businessVerticals,
      selectedVerticalFilter,
      selectedStatusFilter
    );
  }, [
    organizations,
    restaurants,
    tags,
    searchQuery,
    selectedOrgFilter,
    selectedTierFilter,
    staffMembers,
    kdsStateByBranch,
    feedbacks,
    tierFeatureOverridesByBranch,
    organizationBrands,
    businessVerticals,
    selectedVerticalFilter,
    selectedStatusFilter,
  ]);

  const handleEdit = (r: Restaurant) => {
    setEditingRestaurant(r);
    setPreselectedOrgForNewBranch(r.organization_id || undefined);
    setIsModalOpen(true);
  };

  const handleOpenNewOrganizationWizard = () => {
    setWizardInitialOrg(null);
    setWizardInitialBrand(null);
    setIsNewOrgModalOpen(true);
  };

  const handleOpenAddBrandForOrg = (org: Organization) => {
    setWizardInitialOrg(org);
    setWizardInitialBrand(null);
    setIsNewOrgModalOpen(true);
  };

  const handleOpenAddBranchForBrand = (org: Organization, brand: OrganizationBrand) => {
    setWizardInitialOrg(org);
    setWizardInitialBrand(brand);
    setIsNewOrgModalOpen(true);
  };

  const handleCreateNewBranch = (orgId?: string) => {
    setEditingRestaurant(null);
    setPreselectedOrgForNewBranch(orgId);
    setIsModalOpen(true);
  };

  const toggleOrgCollapse = (orgId: string) => {
    setCollapsedOrgs((prev) => {
      const willBeExpanded = !!prev[orgId];
      if (willBeExpanded) {
        setIsTopKpisExpanded(false);
      }
      return {
        ...prev,
        [orgId]: !prev[orgId],
      };
    });
  };

  const toggleBranchPanel = (restaurantId: string) => {
    setExpandedBranchPanels((prev) => {
      const willBeExpanded = !prev[restaurantId];
      if (willBeExpanded) {
        setIsTopKpisExpanded(false);
      }
      return {
        ...prev,
        [restaurantId]: willBeExpanded,
      };
    });
  };

  const toggleBranchCategory = (restaurantId: string, categoryNum: number) => {
    setExpandedCategoriesByBranch((prev) => {
      const branchCats = prev[restaurantId] || {};
      return {
        ...prev,
        [restaurantId]: {
          ...branchCats,
          [categoryNum]: !branchCats[categoryNum],
        },
      };
    });
  };

  const toggleAllCategoriesForBranch = (restaurantId: string, expand: boolean) => {
    setExpandedCategoriesByBranch((prev) => ({
      ...prev,
      [restaurantId]: {
        1: expand,
        2: expand,
        3: expand,
        4: expand,
        5: expand,
        6: expand,
      },
    }));
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setIsEditOrgModalOpen(true);
  };

  const handleOpenTrialModalForOrg = (org: Organization) => {
    setTrialModalTargetOrg(org);
    setTrialModalTargetBranch(null);
    setTrialModalDefaultTier(3);
    setIsTrialModalOpen(true);
  };

  const handleOpenTrialModalForBranch = (branch: Restaurant, defaultTier?: TierType) => {
    setTrialModalTargetBranch(branch);
    setTrialModalTargetOrg(null);
    setTrialModalDefaultTier(defaultTier || 3);
    setIsTrialModalOpen(true);
  };

  const handleCancelBranchTrial = async (branchId: string) => {
    if (!window.confirm('¿Deseas finalizar anticipadamente el periodo de prueba de esta sucursal?')) {
      return;
    }
    const res = await api.cancelTrialPeriod({ restaurantId: branchId });
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || 'No se pudo cancelar el periodo de prueba.');
    }
  };

  const toggleTierSection = (branchId: string, tierId: string) => {
    setExpandedTierSections((prev) => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [tierId]: !prev[branchId]?.[tierId],
      },
    }));
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    const confirmation = window.confirm(
      `¿Estás seguro de ELIMINAR la organización "${orgName}"?\n\n¡ATENCIÓN! Esta acción es irreversible y eliminará todas sus marcas comerciales y sucursales supeditadas.`
    );
    if (!confirmation) return;

    const res = await api.deleteOrganization(orgId);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || 'No se pudo eliminar la organización.');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedOrgFilter('all');
    setSelectedTierFilter('all');
    setSelectedVerticalFilter('all');
    setSelectedStatusFilter('all');
  };

  const handleDeleteRestaurantPermanent = async (restaurantId: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de dar de baja definitiva y eliminar "${name}"?`)) {
      return;
    }
    const res = await api.deleteRestaurant(restaurantId, true);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || 'No se pudo eliminar la sucursal.');
    }
  };

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la marca comercial "${brandName}"?`)) {
      return;
    }
    const res = await api.deleteOrganizationBrand(brandId);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || 'No se pudo eliminar la marca.');
    }
  };

  const handleExpandAll = () => {
    setIsTopKpisExpanded(false);
    setCollapsedOrgs({});
    const branchMap: Record<string, boolean> = {};
    restaurants.forEach((r) => {
      branchMap[r.id] = true;
    });
    setExpandedBranchPanels(branchMap);
  };

  const handleCollapseAll = () => {
    const orgCollapseMap: Record<string, boolean> = {};
    organizations.forEach((o) => {
      orgCollapseMap[o.id] = true;
    });
    setCollapsedOrgs(orgCollapseMap);
    setExpandedBranchPanels({});
  };

  // ==========================================
  // Controladores de Selector de Tier y Switches Prendido / Apagado
  // ==========================================

  const handleChangeBranchTier = async (res: Restaurant, newTier: TierType) => {
    setRestaurants((prev) =>
      prev.map((item) => (item.id === res.id ? { ...item, tier: newTier } : item))
    );
    // Limpiar overrides manuales de tier para esta sucursal para que refleje limpiamente el nuevo nivel contratado
    setTierFeatureOverridesByBranch((prev) => {
      const next = { ...prev };
      delete next[res.id];
      try {
        localStorage.setItem(TIER_FEATURES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return next;
    });
    await api.saveRestaurant({ id: res.id, tier: newTier });
  };

  const handleToggleBranchActive = async (res: Restaurant) => {
    const nextState = res.is_active === false;
    setRestaurants((prev) =>
      prev.map((item) => (item.id === res.id ? { ...item, is_active: nextState } : item))
    );
    await api.toggleRestaurantActive(res.id, nextState);
  };

  const handleToggleTierFeature = async (res: Restaurant, feature: TierFeatureConfig) => {
    const nextVal = !feature.isActive;

    if (feature.key === 'addon_ad_free') {
      setRestaurants((prev) =>
        prev.map((item) => (item.id === res.id ? { ...item, is_ad_free: nextVal } : item))
      );
      await api.saveRestaurant({ id: res.id, is_ad_free: nextVal });
      return;
    }

    if (feature.key === 'tier_3_digital_menu') {
      setRestaurants((prev) =>
        prev.map((item) => (item.id === res.id ? { ...item, has_digital_menu: nextVal } : item))
      );
      await api.saveRestaurant({ id: res.id, has_digital_menu: nextVal });
    }

    setTierFeatureOverridesByBranch((prev) => {
      const currentBranchOverrides = prev[res.id] || {};
      const updated = {
        ...prev,
        [res.id]: {
          ...currentBranchOverrides,
          [feature.key]: nextVal,
        },
      };
      try {
        localStorage.setItem(TIER_FEATURES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return updated;
    });
  };

  const handleToggleTagActive = async (tag: Tag) => {
    const nextActive = tag.is_active === false;
    setTags((prev) =>
      prev.map((item) => (item.id === tag.id ? { ...item, is_active: nextActive } : item))
    );
    await api.saveTag({ id: tag.id, is_active: nextActive });
  };

  const handleToggleKdsStation = (restaurantId: string, stationId: string, currentVal: boolean) => {
    setKdsStateByBranch((prev) => {
      const branchStations = prev[restaurantId] || {};
      const updated = {
        ...prev,
        [restaurantId]: {
          ...branchStations,
          [stationId]: !currentVal,
        },
      };
      try {
        localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return updated;
    });
  };

  const handleToggleWaiterTerminal = (restaurantId: string, currentVal: boolean) => {
    setWaiterTerminalByBranch((prev) => {
      const updated = {
        ...prev,
        [restaurantId]: !currentVal,
      };
      try {
        localStorage.setItem(WAITER_TERM_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return updated;
    });
  };

  const handleToggleStaffActive = async (staff: StaffMember) => {
    const nextActive = !staff.is_active;
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, is_active: nextActive } : s))
    );
    await api.toggleStaffMemberActive(staff.id, nextActive);
  };

  const handleChangeStaffRole = async (staff: StaffMember, newRole: StaffRole) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, role: newRole } : s))
    );
    await api.updateStaffMember(staff.id, { role: newRole });
  };

  const handleToggleStaffStation = async (staff: StaffMember, station: KitchenStation) => {
    const currentStations: KitchenStation[] =
      staff.allowed_stations && staff.allowed_stations.length > 0
        ? staff.allowed_stations
        : staff.role === 'barista'
        ? ['barista']
        : ['cocina'];
    const exists = currentStations.includes(station);
    const nextStations: KitchenStation[] = exists
      ? currentStations.filter((st) => st !== station)
      : [...currentStations, station];
    const safeStations: KitchenStation[] = nextStations.length > 0 ? nextStations : ['cocina'];

    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, allowed_stations: safeStations } : s))
    );
    await api.updateStaffMember(staff.id, { allowed_stations: safeStations });
  };

  const handleChangeHostessTableStatus = async (
    table: RestaurantTable,
    newStatus: RestaurantTableStatus
  ) => {
    if (newStatus === 'en_limpieza') {
      await api.requestTableCleaning(table.restaurant_id, table);
    } else {
      await api.updateRestaurantTableStatus(table.id, newStatus);
    }
    const refreshedTables = await api.getRestaurantTables();
    setRestaurantTables(refreshedTables);
  };

  // ==========================================
  // Renderizador del Panel de Control de Sucursal (Nivel 3 por Categorías)
  // ==========================================
  const renderBranchControlPanel = (branchNode: BranchNode) => {
    const res = branchNode.restaurant;
    const branchTags = branchNode.tags;
    const { capabilities, kdsStations, staff, tierFeatures, feedbacksCount, pendingFeedbacksCount } = branchNode;
    const isWaiterTerminalOn =
      waiterTerminalByBranch[res.id] !== undefined ? waiterTerminalByBranch[res.id] : true;

    // Datos cruzados de Fase B y Fase C para esta sucursal
    const branchTables = restaurantTables.filter(
      (t) => t.restaurant_id === res.id || (res.id === restaurants[0]?.id && t.restaurant_id === 'res-1')
    );
    const totalBranchCapacity = branchTables.reduce((acc, t) => acc + (t.capacity || 0), 0);
    const freeTablesCount = branchTables.filter((t) => t.status === 'libre').length;
    const occupiedTablesCount = branchTables.filter((t) => t.status === 'ocupada').length;
    const cleaningTablesCount = branchTables.filter((t) => t.status === 'en_limpieza').length;


    const branchCoupons = managerCoupons.filter(
      (cp) => cp.restaurant_id === res.id || (res.id === restaurants[0]?.id && cp.restaurant_id === 'res-1')
    );
    const branchReports = managerShiftReports.filter(
      (rp) => rp.restaurant_id === res.id || (res.id === restaurants[0]?.id && rp.restaurant_id === 'res-1')
    );
    const branchFeedbacks = feedbacks.filter(
      (fb) => fb.restaurant_id === res.id || (res.id === restaurants[0]?.id && fb.restaurant_id === 'res-1')
    );
    const latestReport = branchReports[0];

    // Ordenar personal por categoría de rol: Hostess -> Cajero -> Meseros -> Barista -> Jefe de Cocina -> Capitán
    const roleOrder: Record<string, number> = {
      hostess: 1,
      cashier: 2,
      waiter: 3,
      barista: 4,
      kitchen: 5,
      manager: 6,
    };
    const sortedStaff = [...staff].sort(
      (a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9)
    );

    const roleSelectColors: Record<string, string> = {
      hostess: 'bg-violet-50 text-violet-700 border-violet-200',
      cashier: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      waiter: 'bg-blue-50 text-blue-700 border-blue-200',
      barista: 'bg-teal-50 text-teal-800 border-teal-200',
      kitchen: 'bg-amber-50 text-amber-800 border-amber-200',
      manager: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const tierBadgeColors: Record<string, string> = {
      'Tier 1': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Tier 2': 'bg-blue-50 text-blue-700 border-blue-200',
      'Tier 3': 'bg-purple-50 text-purple-700 border-purple-200',
      'Tier 4': 'bg-amber-50 text-amber-800 border-amber-200',
      'Add-On': 'bg-slate-900 text-white border-slate-900',
    };

    const orgKey = res.organization_id || 'org-1';
    const matchedBrand = organizationBrands.find(
      (b) => b.id === res.brand_id || (b.organization_id === res.organization_id && b.name === res.brand_name)
    );

    return (
      <tr className="bg-slate-50/80 border-b-2 border-slate-200">
        <td colSpan={5} className="p-0">
          <div className="py-4 px-4 sm:px-8 lg:px-12 space-y-4 animate-fadeIn transition-all duration-300">
            {/* Cabecera del Panel de Control de la Sucursal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                {matchedBrand?.logo_url ? (
                  <img
                    src={matchedBrand.logo_url}
                    alt={res.brand_name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Panel de Control Operativo — {res.brand_name} ({res.branch_name})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                      Giro: {capabilities.verticalLabel}
                    </span>
                    {latestReport && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        Último Corte ({latestReport.shift_type}): ${Number(latestReport.total_sales).toFixed(0)} MXN · {latestReport.tables_served} mesas
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Controles ordenados por categoría con interruptores en tiempo real, aforo de Hostess, estaciones KDS, turnos a 60 días y gerencia.
                  </p>
                </div>
              </div>

              {/* Acceso Rápido a Solicitudes de Quejas y Botones de Colapso de Categorías */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => toggleAllCategoriesForBranch(res.id, false)}
                    className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    title="Desplegar todas las categorías"
                  >
                    Desplegar Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllCategoriesForBranch(res.id, true)}
                    className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    title="Colapsar todas las categorías"
                  >
                    Colapsar Todo
                  </button>
                </div>

                <Link
                  to={`/admin/feedback?restaurant=${res.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5 text-rose-600" />
                  <span>Solicitudes de Quejas ({feedbacksCount})</span>
                  {pendingFeedbacksCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-extrabold">
                      {pendingFeedbacksCount} nuevas
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* CATEGORÍA 1: FUNCIONALIDADES DE CADA TIER & CUPONES DE QUEJAS */}
            {(() => {
              const isCat1Expanded = !!expandedCategoriesByBranch[res.id]?.[1];
              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 1)}
                    className="bg-blue-50/70 px-4 py-2 border-b border-blue-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-blue-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat1Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
                      )}
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider">
                        Cat 1: Nivel Contratado (Tier {res.tier || 2}) & Periodo de Prueba
                      </span>
                      {(() => {
                        const trial = isBranchTrialActive(res);
                        if (!trial.isActive) return null;
                        return (
                          <span className="px-2 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-extrabold flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Prueba Tier {trial.trialTier} ({trial.daysRemaining}d)</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-blue-700">
                        {tierFeatures.filter((f) => f.isActive).length} de {tierFeatures.length} funciones activas
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                        {isCat1Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  {isCat1Expanded && (
                    <div className="p-3.5 space-y-3 bg-slate-50/40">
                  {/* Banner de Periodo de Prueba Activo (si aplica) */}
                  {(() => {
                    const trialInfo = isBranchTrialActive(res);
                    if (!trialInfo.isActive) return null;
                    return (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-purple-950">
                                Periodo de Prueba Activo: Tier {trialInfo.trialTier}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold">
                                {trialInfo.daysRemaining} días restantes ({trialInfo.hoursRemaining}h)
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-700 mt-0.5">
                              Vence el {trialInfo.endDate?.toLocaleDateString()} a las {trialInfo.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Al expirar revierte automáticamente al plan contratado (Tier {res.tier || 2}).
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenTrialModalForBranch(res, trialInfo.trialTier || 3)}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors shadow-2xs"
                          >
                            Modificar Días
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBranchTrial(res.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors shadow-2xs"
                          >
                            Finalizar Prueba
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Listado de Tiers Configurables con Acordeones Desplegables (Política 4) */}
                  {(customTiers.length > 0 ? customTiers : DEFAULT_CUSTOM_TIERS).map((tierDef) => {
                    const tierKey = String(tierDef.tier);
                    const isTierCollapsed = !expandedTierSections[res.id]?.[tierKey];
                    const contractedTier = res.tier || 2;
                    const trialInfo = isBranchTrialActive(res);

                    const isBaseContract = typeof tierDef.tier === 'number' && contractedTier >= tierDef.tier;
                    const isTrialActiveThisTier = trialInfo.isActive && trialInfo.trialTier && (
                      typeof tierDef.tier === 'number' && trialInfo.trialTier >= tierDef.tier
                    );
                    const isAddonActive = tierDef.tier === 'addon' && Boolean(res.is_ad_free);

                    // Filtrar las funcionalidades de la sucursal que corresponden a este tier
                    const assignedFeatures = tierFeatures.filter((f) => {
                      if (tierDef.tier === 'addon') {
                        return f.tierLevel === 'addon' && (tierDef.included_features ? tierDef.included_features.includes(f.key) : true);
                      }
                      return tierDef.included_features ? tierDef.included_features.includes(f.key) : f.tierLevel === tierDef.tier;
                    });

                    const activeCount = assignedFeatures.filter((f) => f.isActive).length;

                    return (
                      <div
                        key={tierKey}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isTrialActiveThisTier && !isBaseContract
                            ? 'bg-purple-50/20 border-purple-200'
                            : isBaseContract
                            ? 'bg-white border-blue-200/80 shadow-2xs'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Cabecera del Tier */}
                        <div
                          onClick={() => toggleTierSection(res.id, tierKey)}
                          className={`px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                            isTrialActiveThisTier && !isBaseContract
                              ? 'bg-purple-100/60 hover:bg-purple-100/80 border-b border-purple-200'
                              : isBaseContract
                              ? 'bg-blue-50/50 hover:bg-blue-100/50 border-b border-blue-100'
                              : 'bg-slate-50/70 hover:bg-slate-100/60 border-b border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isTierCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                tierBadgeColors[tierDef.badge_label] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {tierDef.badge_label}
                            </span>

                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {tierDef.name}
                            </span>

                            {isBaseContract ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                Plan Base Contratado
                              </span>
                            ) : isTrialActiveThisTier ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold animate-pulse">
                                Prueba Activa · {trialInfo.daysRemaining}d restantes
                              </span>
                            ) : isAddonActive ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                                Add-on Activo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium">
                                Nivel Superior No Contratado
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                            {/* Botón Periodo de Prueba por Tier (Políticas 3.1 y 4) */}
                            {typeof tierDef.tier === 'number' && tierDef.tier > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTrialModalForBranch(res, tierDef.tier as TierType);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                                  isTrialActiveThisTier
                                    ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                                    : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                                }`}
                                title={`Otorgar 7, 14 o 28 días de prueba para ${tierDef.name}`}
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>{isTrialActiveThisTier ? 'Gestionar Prueba' : 'Periodo de Prueba'}</span>
                              </button>
                            )}

                            <span className="text-[10px] font-bold text-slate-500">
                              {activeCount} de {assignedFeatures.length} activas
                            </span>

                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {isTierCollapsed ? 'Expandir' : 'Colapsar'}
                            </span>
                          </div>
                        </div>

                        {/* Contenido Desglosado del Tier (Política 1 & 4) */}
                        {!isTierCollapsed && (
                          <div className="divide-y divide-slate-100 text-xs bg-white">
                            {assignedFeatures.map((feature) => (
                              <div
                                key={feature.key}
                                className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-blue-50/20"
                              >
                                {(() => {
                                  const isVisibleToClient =
                                    !tierDef.client_visible_features ||
                                    tierDef.client_visible_features.includes(feature.key);
                                  return (
                                    <>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-slate-900">{feature.name}</span>
                                          {isVisibleToClient ? (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title="Visible para el dueño del local">
                                              Visible en Nivel
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200" title="Oculto para el dueño del local">
                                              Oculto a Dueño
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-slate-500 block mt-0.5">
                                          {feature.description}
                                        </span>

                                        {/* Desglose en vivo de Cupones de Quejas dentro de Tier 2 */}
                                        {feature.key === 'tier_2_reputation_shield' && branchCoupons.length > 0 && (
                                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] font-extrabold uppercase text-rose-700">
                                              Cupones del Gerente por Quejas:
                                            </span>
                                            {branchCoupons.map((cp) => (
                                              <span
                                                key={cp.id}
                                                className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold"
                                                title={`Creado por ${cp.manager_name}: ${cp.discount_description}`}
                                              >
                                                {cp.coupon_code} ({cp.discount_percentage}% · Uso mensual: {cp.used_this_month}/{cp.monthly_limit})
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
                                        {feature.key === 'tier_2_reputation_shield' && (
                                          <Link
                                            to={`/admin/feedback?restaurant=${res.id}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors"
                                            title="Abrir buzón de quejas retenidas de esta sucursal"
                                          >
                                            <MessageSquareWarning className="w-3 h-3 text-rose-600" />
                                            <span>Ver Quejas ({feedbacksCount})</span>
                                          </Link>
                                        )}

                                        {feature.key === 'tier_3_digital_menu' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedMenuRestaurant(res);
                                              setIsMenuModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold transition-colors shadow-2xs"
                                            title="Administrar categorías, platillos y disponibilidad (86) de la carta"
                                          >
                                            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
                                            <span>Administrar Carta & Platillos</span>
                                          </button>
                                        )}

                                        <StatusBadgeAndSwitch
                                          isOn={feature.isActive}
                                          onToggle={() => handleToggleTierFeature(res, feature)}
                                          title={`Prender o apagar ${feature.name}`}
                                        />
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))}

                            {/* Indicador de pantallas operativas de la categoría 3 vinculadas a este tier */}
                            {tierDef.included_stations && tierDef.included_stations.length > 0 && (
                              <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                                <Monitor className="w-3 h-3 text-slate-400" />
                                <span>
                                  Pantallas operativas incluidas: {tierDef.included_stations.join(', ').toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

            {/* CATEGORÍA 2: HARDWARE NFC & MESAS */}
            {(() => {
              const isCat2Expanded = !!expandedCategoriesByBranch[res.id]?.[2];
              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 2)}
                    className="bg-purple-50/70 px-4 py-2 border-b border-purple-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-purple-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat2Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-purple-700" />
                      )}
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[11px] font-extrabold text-purple-950 uppercase tracking-wider">
                        Cat 2: Hardware NFC & {capabilities.unitPlural}
                      </span>
                      {branchTables.length > 0 && (
                        <span
                          title={`Aforo total: ${branchTables.length} mesas (${totalBranchCapacity} comensales) · ${freeTablesCount} Libres · ${occupiedTablesCount} Ocupadas · ${cleaningTablesCount} En Limpieza`}
                          className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-900 text-[10px] font-extrabold cursor-help"
                        >
                          Aforo: {branchTables.length} mesas ({totalBranchCapacity} comensales)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-purple-700">
                        {branchTags.filter((t) => t.is_active !== false).length} de {branchTags.length} placas
                      </span>
                      <a
                        href={`#/portal/hostess?branch=${res.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-colors"
                      >
                        <span>Abrir Hostess</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                        {isCat2Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  {isCat2Expanded && (
                <>
                  {branchTags.length === 0 && branchTables.length === 0 ? (
                <div className="px-4 py-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>No hay placas físicas ni mesas registradas en esta sucursal todavía.</span>
                  <Link
                    to={`/admin/tags?restaurant=${res.id}`}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100"
                  >
                    + Asignar Placas NFC
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {branchTags.map((tag, idx) => {
                    const isTagOn = tag.is_active !== false;
                    // Cruzar con la mesa de Hostess por identificador o posición
                    const matchedTable =
                      branchTables.find(
                        (tb) =>
                          tag.table_identifier &&
                          (tb.table_number.toLowerCase() === tag.table_identifier.toLowerCase() ||
                            tag.table_identifier.toLowerCase().includes(tb.table_number.toLowerCase()))
                      ) || branchTables[idx];

                    const matchedTableMetric = latestReport?.table_metrics?.find(
                      (tm) =>
                        (tag.table_identifier &&
                          tm.table_number.toLowerCase() === tag.table_identifier.toLowerCase()) ||
                        (matchedTable &&
                          tm.table_number.toLowerCase() === matchedTable.table_number.toLowerCase())
                    );

                    return (
                      <div
                        key={tag.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-purple-50/20"
                      >
                        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                          <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {tag.tag_code}
                          </span>
                          <span className="font-bold text-slate-800">
                            {tag.table_identifier
                              ? `${capabilities.unitLabel}: ${tag.table_identifier}`
                              : matchedTable
                              ? matchedTable.table_number
                              : `${capabilities.unitLabel} General`}
                          </span>

                          {/* Capacidad de comensales y Estado en vivo desde Hostess */}
                          {matchedTable && (
                            <>
                              <span className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-800 text-[10px] font-bold">
                                {matchedTable.capacity} comensales
                              </span>
                              <select
                                value={matchedTable.status}
                                onChange={(e) =>
                                  handleChangeHostessTableStatus(
                                    matchedTable,
                                    e.target.value as RestaurantTableStatus
                                  )
                                }
                                title="Cambiar estado de la mesa en Hostess o solicitar limpieza al mesero"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border cursor-pointer ${
                                  matchedTable.status === 'libre'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : matchedTable.status === 'ocupada'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : matchedTable.status === 'en_limpieza'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                <option value="libre">Estado: Desocupada / Libre</option>
                                <option value="ocupada">Estado: Ocupada</option>
                                <option value="en_limpieza">Estado: En Limpieza (Notifica a Mesero)</option>
                                <option value="desactivada">Estado: Desactivada</option>
                              </select>
                            </>
                          )}

                          <span className="text-[11px] text-slate-400">
                            ({tag.scan_count || 0} escaneos)
                          </span>

                          {matchedTableMetric && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                              Turno: {matchedTableMetric.orders_count} órd · ${Number(matchedTableMetric.total_amount).toFixed(0)} MXN
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadgeAndSwitch
                            isOn={isTagOn}
                            onToggle={() => handleToggleTagActive(tag)}
                            title={`Prender o apagar placa ${tag.tag_code}`}
                          />

                          <a
                            href={`#/?t=${tag.tag_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isTagOn
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                            }`}
                          >
                            <span>Probar ?t=</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
                </>
              )}
            </div>
          );
        })()}

            {/* CATEGORÍA 3: PANTALLAS OPERATIVAS KDS */}
            {(capabilities.supportsKds || capabilities.supportsFloorStaff) && (() => {
              const isCat3Expanded = !!expandedCategoriesByBranch[res.id]?.[3];
              const trialInfo = isBranchTrialActive(res);
              const effectiveTier = trialInfo.isActive && trialInfo.trialTier ? trialInfo.trialTier : (res.tier || 1);
              const tierDef = customTiers.find((t) => t.tier === effectiveTier) || DEFAULT_CUSTOM_TIERS.find((t) => t.tier === effectiveTier);

              const isCat3Allowed = tierDef?.allowed_categories ? tierDef.allowed_categories.includes(3) : true;
              const isCat3MasterOn = isCat3Allowed && branchMasterCategoriesState[res.id]?.[3] !== false;

              const rawScreensOn = (isWaiterTerminalOn ? 1 : 0) +
                (kdsStateByBranch[res.id]?.hostess !== false ? 1 : 0) +
                (kdsStateByBranch[res.id]?.gerente !== false ? 1 : 0) +
                kdsStations.filter((s) => s.isActive).length;
              const totalScreens = kdsStations.length + 3;
              const activeScreensCount = isCat3MasterOn ? rawScreensOn : 0;

              // Menú Digital según tabla de tiers mandatoria:
              const hasDigitalMenuInTier = tierDef?.included_features ? tierDef.included_features.includes('tier_3_digital_menu') : false;
              const isDigitalMenuBranchActive = hasDigitalMenuInTier && res.has_digital_menu !== false && (tierFeatureOverridesByBranch[res.id]?.tier_3_digital_menu !== false);

              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 3)}
                    className="bg-orange-50/80 px-4 py-2 border-b border-orange-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-orange-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat3Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-orange-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-orange-700" />
                      )}
                      <Monitor className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-[11px] font-extrabold text-orange-950 uppercase tracking-wider">
                        Cat 3: Pantallas Operativas KDS
                      </span>
                    </div>

                    {/* Orden estricto de controles (Requerimiento 4):
                        (1. Resumen) -> (2. Funcionalidad) -> (3. Links consolas) -> (4 & 5. Badge + Switch) -> (6. Expandir/Contraer) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 1. Resumen */}
                      <span className="text-[10px] font-bold text-orange-700">
                        {activeScreensCount} de {totalScreens} prendidas
                      </span>

                      {/* 2. Botón de Funcionalidad: Solo si la tabla de Tiers mandatoria lo autoriza */}
                      {isDigitalMenuBranchActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMenuRestaurant(res);
                            setIsMenuModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                          title="Administrar categorías y platillos del menú digital de esta sucursal"
                        >
                          <UtensilsCrossed className="w-3 h-3 text-orange-600" />
                          <span>Gestionar Carta & Menú</span>
                        </button>
                      )}

                      {/* 4 & 5. Badge de estado + Switch de categoría */}
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <StatusBadgeAndSwitch
                          isOn={isCat3MasterOn}
                          onToggle={() => handleToggleBranchCategoryMaster(res.id, 3)}
                          disabled={!isCat3Allowed}
                          title={
                            !isCat3Allowed
                              ? `Categoría 3 no autorizada en la configuración del Tier ${res.tier || 1}. Requiere upgrade de Tier o Periodo de Prueba.`
                              : `Prender o apagar Categoría 3 en esta sucursal`
                          }
                        />
                      </div>

                      {/* 6. Botón expandir y contraer */}
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-700 bg-white px-1.5 py-0.5 rounded border border-orange-200">
                        {isCat3Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  {isCat3Expanded && (
                    <>
                    {(() => {
                      const isAllowed = getBranchCategoryAllowed(res, 3);
                      const isMasterOn =
                        isAllowed && branchMasterCategoriesState[res.id]?.[3] !== false;
                      if (!isMasterOn) {
                        return (
                          <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              {!isAllowed
                                ? `Esta categoría no está incluida en el Tier ${res.tier || 1} contratado. Solicita un Periodo de Prueba o realiza un Upgrade.`
                                : 'Esta categoría se encuentra actualmente APAGADA en esta sucursal. Activa el interruptor para habilitar las pantallas operativas.'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {getBranchCategoryAllowed(res, 3) &&
                      branchMasterCategoriesState[res.id]?.[3] !== false && (
                  <div className="divide-y divide-slate-100 text-xs">
                  {/* Pantalla 1: Consola de Gerente de Tienda & Capitán de Piso */}
                  {(() => {
                    const isManagerScreenOn =
                      kdsStateByBranch[res.id]?.gerente !== undefined
                        ? kdsStateByBranch[res.id].gerente
                        : true;
                    const assignedBranchManagers = organizationManagers.filter(
                      (m) =>
                        m.assigned_branch_ids?.includes(res.id) &&
                        m.branch_roles?.[res.id] !== 'sin_acceso'
                    );
                    const floorCaptains = sortedStaff.filter((s) => s.role === 'manager');
                    const managerNames = [
                      ...assignedBranchManagers.map((m) => m.name),
                      ...floorCaptains.map((c) => c.name),
                    ];

                    return (
                      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-indigo-50/20">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span className="font-bold text-slate-900">
                              Consola Operativa de Gerente de Tienda & Capitán de Piso
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border bg-indigo-50 text-indigo-800 border-indigo-200">
                              Rol Exclusivo: Gerente de Tienda & Capitán de Piso
                            </span>
                            {managerNames.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Operadores: {managerNames.join(', ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block pl-5 mt-0.5">
                            Gestión de empleados y estaciones, programación de turnos (hasta 2 meses), cortes de caja al dueño, quejas y cupones con límite mensual.
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadgeAndSwitch
                            isOn={isManagerScreenOn}
                            onToggle={() =>
                              handleToggleKdsStation(res.id, 'gerente', isManagerScreenOn)
                            }
                            title="Prender o apagar la Consola Operativa de Gerente de Tienda en esta sucursal"
                          />

                          <a
                            href={`#/portal/gerente?branch=${res.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isManagerScreenOn
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                                : 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                            }`}
                          >
                            <span>Abrir Gerencia</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pantalla 2: Pantalla de Hostess & Recepción */}
                  {(() => {
                    const isHostessScreenOn =
                      kdsStateByBranch[res.id]?.hostess !== undefined
                        ? kdsStateByBranch[res.id].hostess
                        : true;
                    const hostessOperators = sortedStaff.filter((s) => s.role === 'hostess');

                    return (
                      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-violet-50/20">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Users className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                            <span className="font-bold text-slate-900">
                              Pantalla de Hostess & Recepción (Gestión de Mesas, Aforo y Solicitud de Limpieza)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border bg-violet-50 text-violet-800 border-violet-200">
                              Rol Exclusivo: Hostess / Recepción
                            </span>
                            {hostessOperators.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Operadores: {hostessOperators.map((o) => o.name).join(', ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block pl-5 mt-0.5">
                            Permite crear mesas por sucursal con número de comensales, dar seguimiento a libres/ocupadas y enviar solicitud de limpieza al mesero.
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadgeAndSwitch
                            isOn={isHostessScreenOn}
                            onToggle={() =>
                              handleToggleKdsStation(res.id, 'hostess', isHostessScreenOn)
                            }
                            title="Prender o apagar la Pantalla de Hostess de esta sucursal"
                          />

                          <a
                            href={`#/portal/hostess?branch=${res.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isHostessScreenOn
                                ? 'bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100'
                                : 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                            }`}
                          >
                            <span>Abrir Hostess</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pantalla 3: Terminal Móvil de Sala (Meseros) */}
                  {(() => {
                    const waiterOperators = sortedStaff.filter(
                      (s) => s.role === 'waiter' || s.role === 'manager'
                    );

                    return (
                      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-emerald-50/20">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-bold text-slate-900">
                              Terminal Móvil de Sala (Recepción de Llamadas de Mesa, Alertas de Limpieza & Quejas)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border bg-emerald-50 text-emerald-800 border-emerald-200">
                              Rol Exclusivo: Mesero en Sala & Capitán de Piso
                            </span>
                            {waiterOperators.length > 0 && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Operadores: {waiterOperators.map((o) => o.name).join(', ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block pl-5 mt-0.5">
                            Recibe llamadas de cuenta, platos listos de cocina y solicitudes de limpieza enviadas por la Hostess.
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadgeAndSwitch
                            isOn={isWaiterTerminalOn}
                            onToggle={() => handleToggleWaiterTerminal(res.id, isWaiterTerminalOn)}
                            title="Prender o apagar la Terminal Móvil de Meseros de esta sucursal"
                          />

                          <a
                            href={`#/portal/mesero?branch=${res.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isWaiterTerminalOn
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                            }`}
                          >
                            <span>Abrir Terminal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pantallas 4 a 9: Estaciones KDS, Turnero 4K & Pick Up & Collect */}
                  {capabilities.supportsKds &&
                    kdsStations.map((station) => {
                      const isBaristaStation =
                        station.id.includes('barra') ||
                        station.id.includes('barista') ||
                        station.name.toLowerCase().includes('barra') ||
                        station.name.toLowerCase().includes('café') ||
                        station.name.toLowerCase().includes('repostería');
                      const isPickupStation = station.id === 'pickup';
                      const isTurneroStation = station.id === 'turnero';

                      const assignedOperators = sortedStaff.filter((op) => {
                        if (isPickupStation) {
                          return op.role === 'cashier' || op.allowed_stations?.includes('pickup');
                        }
                        const opStations =
                          op.allowed_stations && op.allowed_stations.length > 0
                            ? op.allowed_stations
                            : op.role === 'barista'
                            ? ['barista']
                            : op.role === 'kitchen'
                            ? ['cocina']
                            : [];
                        return isBaristaStation
                          ? opStations.includes('barista') || op.role === 'barista'
                          : opStations.includes('cocina') || op.role === 'kitchen';
                      });

                      return (
                        <div
                          key={station.id}
                          className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-orange-50/20"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isPickupStation ? (
                                <ShoppingBag className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                              )}
                              <span className="font-bold text-slate-900">{station.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                  isPickupStation
                                    ? 'bg-orange-50 text-orange-800 border-orange-200'
                                    : isTurneroStation
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : isBaristaStation
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {isPickupStation
                                  ? 'Rol Exclusivo: Cajero / Despachador de Mostrador & Pick Up'
                                  : isTurneroStation
                                  ? 'Pantalla Pública: Turnero 4K en Sala'
                                  : isBaristaStation
                                  ? 'Rol Exclusivo: Barista (Barra, Coctelería, Repostería & Café)'
                                  : 'Rol Exclusivo: Jefe de Cocina (Estaciones KDS)'}
                              </span>
                              {assignedOperators.length > 0 && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  Operadores: {assignedOperators.map((o) => o.name).join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block pl-5 mt-0.5">
                              {station.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <StatusBadgeAndSwitch
                              isOn={station.isActive}
                              onToggle={() =>
                                handleToggleKdsStation(res.id, station.id, station.isActive)
                              }
                              title={`Prender o apagar ${station.name}`}
                            />

                            <a
                              href={station.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                station.isActive
                                  ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                              }`}
                            >
                              <span>
                                {isPickupStation
                                  ? 'Abrir Pick Up'
                                  : isTurneroStation
                                  ? 'Abrir Turnero'
                                  : 'Abrir KDS'}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

            {/* CATEGORÍA 4: PERSONAL OPERATIVO & TURNOS */}
            {capabilities.supportsFloorStaff && (() => {
              const isCat4Expanded = !!expandedCategoriesByBranch[res.id]?.[4];
              const isAllowed = getBranchCategoryAllowed(res, 4);
              const isMasterOn = isAllowed && branchMasterCategoriesState[res.id]?.[4] !== false;

              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 4)}
                    className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-emerald-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat4Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                        Cat 4: Personal Operativo & Turnos (60 Días)
                      </span>
                    </div>

                    {/* Orden estricto de controles (Requerimiento 4):
                        (1. Resumen) -> (4 & 5. Badge + Switch) -> (6. Expandir/Contraer) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700">
                        {sortedStaff.filter((s) => s.is_active).length} de {sortedStaff.length} operadores
                      </span>

                      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <StatusBadgeAndSwitch
                          isOn={isMasterOn}
                          onToggle={() => handleToggleBranchCategoryMaster(res.id, 4)}
                          disabled={!isAllowed}
                          title={
                            !isAllowed
                              ? `Categoría 4 bloqueada en Tier ${res.tier || 1}. Requiere upgrade de Tier o Periodo de Prueba.`
                              : `Prender o apagar Categoría 4 en esta sucursal`
                          }
                        />
                      </div>

                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        {isCat4Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isCat4Expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                    {(() => {
                      const isAllowed = getBranchCategoryAllowed(res, 4);
                      const isMasterOn =
                        isAllowed && branchMasterCategoriesState[res.id]?.[4] !== false;
                      if (!isMasterOn) {
                        return (
                          <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              {!isAllowed
                                ? `Esta categoría no está incluida en el Tier ${res.tier || 1} contratado. Solicita un Periodo de Prueba o realiza un Upgrade.`
                                : 'Esta categoría se encuentra actualmente APAGADA en esta sucursal. Activa el interruptor para habilitar la plantilla y turnos.'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {getBranchCategoryAllowed(res, 4) &&
                      branchMasterCategoriesState[res.id]?.[4] !== false && (
                  <div className="divide-y divide-slate-100 text-xs">
                  {/* Filas de Personal Operativo con Rol, Incidencia en Pantallas KDS, Turno a 60 días y Métricas */}
                  {sortedStaff.map((member) => {
                    const memberStations: KitchenStation[] =
                      member.allowed_stations && member.allowed_stations.length > 0
                        ? member.allowed_stations
                        : member.role === 'barista'
                        ? ['barista']
                        : ['cocina'];



                    return (
                      <div
                        key={member.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-emerald-50/20"
                      >
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-900">{member.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                            ID: {member.id}
                          </span>

                          {/* Selector Interactivo de Rol / Puesto Operativo */}
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeStaffRole(member, e.target.value as StaffRole)
                            }
                            title={`Cambiar puesto operativo de ${member.name}`}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                              roleSelectColors[member.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="hostess" className="bg-white text-slate-900 font-bold">
                              Hostess / Recepción de Mesas
                            </option>
                            <option value="waiter" className="bg-white text-slate-900 font-bold">
                              Mesero de Sala
                            </option>
                            <option value="barista" className="bg-white text-slate-900 font-bold">
                              Barista (Barra, Coctelería, Repostería & Café)
                            </option>
                            <option value="kitchen" className="bg-white text-slate-900 font-bold">
                              Jefe de Cocina (KDS Cocina)
                            </option>
                            <option value="cashier" className="bg-white text-slate-900 font-bold">
                              Cajero / Despachador (Mostrador & Pick Up)
                            </option>
                            <option value="manager" className="bg-white text-slate-900 font-bold">
                              Capitán / Gerente de Piso
                            </option>
                          </select>

                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            PIN: {member.pin_code}
                          </span>

                          {/* Selector de incidencia sobre pantallas KDS (Cocina vs Barra/Barista vs Pick Up) */}
                          {(member.role === 'kitchen' || member.role === 'barista' || member.role === 'cashier' || member.role === 'manager') && (
                            <div className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase">
                                Pantallas:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleStaffStation(member, 'cocina')}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors ${
                                  memberStations.includes('cocina')
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                Cocina KDS
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStaffStation(member, 'barista')}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors ${
                                  memberStations.includes('barista')
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                Barra & Café
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStaffStation(member, 'pickup')}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors ${
                                  memberStations.includes('pickup')
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                Pick Up
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <StatusBadgeAndSwitch
                            isOn={member.is_active}
                            onToggle={() => handleToggleStaffActive(member)}
                            title={`Prender o apagar acceso PIN de ${member.name}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                    )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CATEGORÍA 5: GERENCIA & CORTES DE TURNO */}
            {(() => {
              const isCat5Expanded = !!expandedCategoriesByBranch[res.id]?.[5];
              const isAllowed = getBranchCategoryAllowed(res, 5);
              const isMasterOn =
                isAllowed && branchMasterCategoriesState[res.id]?.[5] !== false;
              const branchManagers = organizationManagers.filter(
                (m) =>
                  !res.organization_id ||
                  m.organization_id === res.organization_id ||
                  m.organization_id === 'org-1'
              );

              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 5)}
                    className="bg-indigo-50/80 px-4 py-2 border-b border-indigo-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-indigo-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat5Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-700" />
                      )}
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
                        Cat 5: Gerencia & Cortes de Turno
                      </span>
                    </div>

                    {/* Orden estricto de controles (Requerimiento 4):
                        (1. Resumen) -> (3. Link Consola) -> (4 & 5. Badge + Switch) -> (6. Expandir/Contraer) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-indigo-700">
                        {branchManagers.length} gerentes
                      </span>

                      <a
                        href={`#/portal/gerente?branch=${res.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 transition-colors"
                      >
                        <span>Abrir Consola</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <StatusBadgeAndSwitch
                          isOn={isMasterOn}
                          onToggle={() => handleToggleBranchCategoryMaster(res.id, 5)}
                          disabled={!isAllowed}
                          title={
                            !isAllowed
                              ? `Categoría 5 bloqueada en Tier ${res.tier || 1}. Requiere upgrade de Tier o Periodo de Prueba.`
                              : `Prender o apagar Categoría 5 en esta sucursal`
                          }
                        />
                      </div>

                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                        {isCat5Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isCat5Expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      {(() => {
                        const isAllowed = getBranchCategoryAllowed(res, 5);
                    const isMasterOn =
                      isAllowed && branchMasterCategoriesState[res.id]?.[5] !== false;
                    if (!isMasterOn) {
                      return (
                        <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                          <p className="text-xs font-bold text-slate-500">
                            {!isAllowed
                              ? `Esta categoría no está incluida en el Tier ${res.tier || 1} contratado. Solicita un Periodo de Prueba o realiza un Upgrade.`
                              : 'Esta categoría se encuentra actualmente APAGADA en esta sucursal. Activa el interruptor para habilitar la consola de gerente.'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {getBranchCategoryAllowed(res, 5) &&
                    branchMasterCategoriesState[res.id]?.[5] !== false && (
                    <>
                  {/* Alta rápida de Gerente en la Tabla de la Organización */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/70 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">
                  + Nuevo Gerente en Organización:
                </span>
                <input
                  type="text"
                  value={newMgrNameByOrg[orgKey] || ''}
                  onChange={(e) =>
                    setNewMgrNameByOrg((prev) => ({ ...prev, [orgKey]: e.target.value }))
                  }
                  placeholder="Nombre completo"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                />
                <input
                  type="email"
                  value={newMgrEmailByOrg[orgKey] || ''}
                  onChange={(e) =>
                    setNewMgrEmailByOrg((prev) => ({ ...prev, [orgKey]: e.target.value }))
                  }
                  placeholder="correo@empresa.com"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
                />
                <select
                  value={newMgrRoleByOrg[orgKey] || 'gerente_tienda'}
                  onChange={(e) =>
                    setNewMgrRoleByOrg((prev) => ({
                      ...prev,
                      [orgKey]: e.target.value as StoreManagerRole,
                    }))
                  }
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="gerente_tienda">Gerente de Tienda</option>
                  <option value="capitan_piso">Capitán / Gerente de Piso</option>
                </select>
                <input
                  type="text"
                  maxLength={4}
                  value={newMgrPinByOrg[orgKey] || ''}
                  onChange={(e) =>
                    setNewMgrPinByOrg((prev) => ({
                      ...prev,
                      [orgKey]: e.target.value.replace(/\D/g, ''),
                    }))
                  }
                  placeholder="PIN 4"
                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const mgrName = (newMgrNameByOrg[orgKey] || '').trim();
                    if (!mgrName) return;
                    const role = newMgrRoleByOrg[orgKey] || 'gerente_tienda';
                    await api.saveOrganizationManager({
                      organization_id: orgKey,
                      name: mgrName,
                      email:
                        (newMgrEmailByOrg[orgKey] || '').trim() ||
                        `${mgrName.toLowerCase().replace(/\s+/g, '.')}@gerencia.local`,
                      pin_code: newMgrPinByOrg[orgKey] || '1234',
                      manager_role: role,
                      assigned_branch_ids: [res.id],
                      branch_roles: { [res.id]: role },
                      is_active: true,
                    });
                    const refreshed = await api.getOrganizationManagers();
                    setOrganizationManagers(refreshed);
                    setNewMgrNameByOrg((prev) => ({ ...prev, [orgKey]: '' }));
                    setNewMgrEmailByOrg((prev) => ({ ...prev, [orgKey]: '' }));
                    setNewMgrPinByOrg((prev) => ({ ...prev, [orgKey]: '' }));
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                  Registrar y Asignar
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {organizationManagers
                  .filter(
                    (m) =>
                      !res.organization_id ||
                      m.organization_id === res.organization_id ||
                      m.organization_id === 'org-1'
                  )
                  .map((mgr) => {
                    const currentBranchRole =
                      mgr.branch_roles?.[res.id] ||
                      (mgr.assigned_branch_ids?.includes(res.id) ? mgr.manager_role : 'sin_acceso');

                    return (
                      <div
                        key={mgr.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-indigo-50/20"
                      >
                        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                          <span className="font-extrabold text-slate-900">{mgr.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                            ID: {mgr.id}
                          </span>
                          {mgr.email && (
                            <span className="text-[11px] text-slate-500">({mgr.email})</span>
                          )}
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            PIN: {mgr.pin_code}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-[11px] text-slate-500 font-bold">
                            Rol en esta sucursal:
                          </span>
                          <select
                            value={currentBranchRole}
                            onChange={async (e) => {
                              const nextRole = e.target.value as StoreManagerRole | 'sin_acceso';
                              await api.assignManagerToBranch(
                                mgr.id,
                                res.id,
                                nextRole,
                                res.organization_id || undefined
                              );
                              const refreshed = await api.getOrganizationManagers();
                              setOrganizationManagers(refreshed);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer focus:outline-none ${
                              currentBranchRole === 'gerente_tienda'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : currentBranchRole === 'capitan_piso'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <option value="gerente_tienda">Gerente de Tienda (Acceso Total)</option>
                            <option value="capitan_piso">Capitán / Gerente de Piso</option>
                            <option value="sin_acceso">Sin Acceso en esta Sucursal</option>
                          </select>

                          {/* Botón Agente Creador de Cupones (Requerimiento 8) */}
                          <button
                            type="button"
                            onClick={() => {
                              setCouponModalManager(mgr);
                              setCouponModalRestaurantId(res.id);
                              setCouponModalBranchName(res.name);
                              setIsCouponModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition-colors shadow-2xs"
                            title={`Agente Creador de Cupones de Retención de ${mgr.name}`}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>
                              Agente de Cupones ({branchCoupons.filter((c) => c.manager_id === mgr.id || c.manager_name === mgr.name).length})
                            </span>
                          </button>

                          {/* Botón Editar Gerente (Requerimiento 4) */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingManager(mgr);
                              setIsManagerEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                            title={`Editar credenciales, PIN y rol de ${mgr.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar Gerente (Requerimiento 4) */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `¿Deseas eliminar al gerente "${mgr.name}" y revocar todos sus accesos?`
                                )
                              ) {
                                await api.deleteOrganizationManager(mgr.id);
                                const refreshed = await api.getOrganizationManagers();
                                setOrganizationManagers(refreshed);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            title={`Eliminar a ${mgr.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Sub-bloque B: Últimos Cortes de Caja por Turno enviados al Dueño */}
              {branchReports.length > 0 && (
                <div className="px-4 py-3 bg-indigo-50/30 border-t border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-950">
                      Últimos Cortes de Caja por Turno Enviados al Dueño ({branchReports.length})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      Sincronizado con Pantalla General del Dueño
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {branchReports.slice(0, 2).map((rep) => (
                      <div
                        key={rep.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            Turno {rep.shift_type.toUpperCase()} ({rep.shift_date}) · Gerente: {rep.manager_name}
                          </span>
                          <span className="text-slate-500">
                            Mesero en corte: {rep.waiter_name} · {rep.tables_served} mesas atendidas
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-700 block">
                            ${Number(rep.total_sales).toFixed(2)} MXN
                          </span>
                          <span className="text-[10px] font-bold text-amber-700">
                            Propinas: ${Number(rep.tips_collected).toFixed(0)} · Desc: ${Number(rep.discounts_authorized).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                    </>
                  )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CATEGORÍA 6: MÉTRICAS & ANALÍTICA DE SUCURSAL (Requerimiento 5) */}
            {(() => {
              const isCat6Expanded = !!expandedCategoriesByBranch[res.id]?.[6];
              const isAllowed = getBranchCategoryAllowed(res, 6);
              const isMasterOn =
                isAllowed && branchMasterCategoriesState[res.id]?.[6] !== false;
              const currentBranchTemporal = branchMetricsTemporalFilter[res.id] || 'historico';

              // Filtrado temporal de métricas de esta sucursal
              const filteredFeedbacks = branchFeedbacks.filter((f) =>
                filterByDateWindow(f.created_at, currentBranchTemporal)
              );
              const filteredReports = branchReports.filter((r) =>
                filterByDateWindow(r.shift_date, currentBranchTemporal)
              );

              const avgRating =
                filteredFeedbacks.length > 0
                  ? (
                      filteredFeedbacks.reduce((sum: number, f: Feedback) => sum + (f.rating || 5), 0) /
                      filteredFeedbacks.length
                    ).toFixed(1)
                  : '5.0';
              const goodRatings = filteredFeedbacks.filter((f: Feedback) => (f.rating || 5) >= 4).length;
              const shieldedRatings = filteredFeedbacks.filter((f: Feedback) => (f.rating || 5) < 4).length;
              const totalSales = filteredReports.reduce(
                (sum, r) => sum + Number(r.total_sales || 0),
                0
              );
              const totalTips = filteredReports.reduce(
                (sum, r) => sum + Number(r.tips_collected || 0),
                0
              );
              const totalTablesServed = filteredReports.reduce(
                (sum, r) => sum + Number(r.tables_served || 0),
                0
              );
              const branchActiveCoupons = branchCoupons.filter((c) => c.used_this_month < c.monthly_limit);

              return (
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleBranchCategory(res.id, 6)}
                    className="bg-sky-50/80 px-4 py-2 border-b border-sky-200/70 flex items-center justify-between gap-3 whitespace-nowrap overflow-x-auto no-scrollbar cursor-pointer hover:bg-sky-100/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isCat6Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-700" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
                      )}
                      <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-[11px] font-extrabold text-sky-950 uppercase tracking-wider">
                        Cat 6: Métricas & Analítica de Sucursal
                      </span>
                    </div>

                    {/* Orden estricto de controles (Requerimiento 4):
                        (1. Resumen) -> (4 & 5. Badge + Switch) -> (6. Expandir/Contraer) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-sky-700">
                        {filteredReports.length} cortes · {filteredFeedbacks.length} reseñas
                      </span>

                      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                        <StatusBadgeAndSwitch
                          isOn={isMasterOn}
                          onToggle={() => handleToggleBranchCategoryMaster(res.id, 6)}
                          disabled={!isAllowed}
                          title={
                            !isAllowed
                              ? `Categoría 6 bloqueada en Tier ${res.tier || 1}. Requiere upgrade de Tier o Periodo de Prueba.`
                              : `Prender o apagar Categoría 6 en esta sucursal`
                          }
                        />
                      </div>

                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200">
                        {isCat6Expanded ? 'Colapsar' : 'Expandir'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isCat6Expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      {!isMasterOn ? (
                        <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
                          <p className="text-xs font-bold text-slate-500">
                            {!isAllowed
                              ? `Esta categoría no está incluida en el Tier ${res.tier || 1} contratado. Solicita un Periodo de Prueba o realiza un Upgrade.`
                              : 'Esta categoría se encuentra actualmente APAGADA en esta sucursal. Activa el interruptor para habilitar la analítica de sucursal.'}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          {/* Selector de Ventana Temporal */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                              Ventana de Análisis Temporal:
                            </span>
                            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                              {(
                                [
                                  { key: 'hoy', label: 'Hoy' },
                                  { key: '7dias', label: 'Últimos 7 Días' },
                                  { key: '30dias', label: 'Este Mes (30 Días)' },
                                  { key: 'historico', label: 'Histórico Completo' },
                                ] as const
                              ).map((filterOpt) => (
                                <button
                                  key={filterOpt.key}
                                  type="button"
                                  onClick={() =>
                                    setBranchMetricsTemporalFilter((prev) => ({
                                      ...prev,
                                      [res.id]: filterOpt.key,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    currentBranchTemporal === filterOpt.key
                                      ? 'bg-white text-indigo-700 shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {filterOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 4 Bento Cards de KPIs de la Sucursal */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* KPI 1: Reputación & Google Reviews */}
                            <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-sky-800 tracking-wider">
                                Reputación & Reseñas
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-900">
                                  {avgRating}
                                </span>
                                <span className="text-xs font-bold text-sky-700">★ Google</span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {goodRatings} excelentes (4-5★) · {filteredFeedbacks.length} totales
                              </span>
                            </div>

                            {/* KPI 2: Escudo de Quejas & Cupones */}
                            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                                Escudo Reputacional
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-900">
                                  {shieldedRatings}
                                </span>
                                <span className="text-xs font-bold text-amber-700">
                                  quejas retenidas
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {branchActiveCoupons.length} cupones activos
                              </span>
                            </div>

                            {/* KPI 3: Ventas en Cortes de Turno */}
                            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                                Ventas en Cortes
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-900">
                                  $
                                  {totalSales.toLocaleString('es-MX', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                                <span className="text-xs font-bold text-emerald-700">MXN</span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {totalTablesServed} mesas · ${totalTips.toFixed(0)} propinas
                              </span>
                            </div>

                            {/* KPI 4: Aforo & Hardware NFC */}
                            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-purple-800 tracking-wider">
                                Aforo & Placas NFC
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-900">
                                  {branchTags.length}
                                </span>
                                <span className="text-xs font-bold text-purple-700">
                                  placas en mesa
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {branchTables.length} mesas (
                                {branchTables.reduce((s, t) => s + (t.capacity || 4), 0)} comensales)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </td>
      </tr>
    );
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedOrgFilter !== 'all' ? 1 : 0) +
    (selectedVerticalFilter !== 'all' ? 1 : 0) +
    (selectedTierFilter !== 'all' ? 1 : 0) +
    (selectedStatusFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Encabezado Bento Light */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Capa 2: Directorio de Organizaciones, Marcas & Sucursales
              </span>
              <span className="text-xs text-slate-400 font-mono">POL-002</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Directorio de Cuentas & Sucursales
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estructura jerárquica: Organización Matriz &rarr; Marca Comercial (Giro Universal) &rarr; Sucursal Física &rarr; Panel de Control.
            </p>
          </div>

          {/* Acciones Superiores */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenNewOrganizationWizard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Dar de alta una nueva organización con sus datos fiscales, marcas comerciales y sucursales"
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Dar de Alta Organización</span>
            </button>

            <button
              onClick={() => {
                setSelectedOrgForUserModal(undefined);
                setIsUserModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Accesos al Portal</span>
            </button>

            <button
              onClick={() => handleCreateNewBranch()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dar de Alta Sucursal</span>
            </button>
          </div>
        </div>

        {/* Micro-Comentarios Coloridos de KPIs debajo del Título y Subtítulo (Requerimiento 1) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Micro-KPI 1: Empresas & Sucursales (Azul) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/90 border border-blue-200/80 text-[11px] text-blue-950 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="font-extrabold">{organizations.length} empresas</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {kpis.activeBranches} sucursales prendidas
            </span>
          </div>

          {/* Micro-KPI 2: Placas en Mesas (Púrpura) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50/90 border border-purple-200/80 text-[11px] text-purple-950 shadow-2xs">
            <QrCode className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span className="font-extrabold">{kpis.totalTagsDeployed} placas NFC</span>
            <span className="text-slate-300">·</span>
            <span className="text-purple-700 font-semibold">Promedio: {kpis.avgTagsPerBranch} / local</span>
          </div>

          {/* Micro-KPI 3: Ad-Free vs Red (Ámbar) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-950 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="font-extrabold">{kpis.adFreePercentage}% Ad-Free</span>
            <span className="text-slate-400 font-medium">({kpis.adFreeCount} locales)</span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-800 font-bold">{kpis.networkAdsCount} con Red de Anuncios</span>
          </div>

          {/* Micro-KPI 4: Escudo Reputacional (Esmeralda) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-emerald-950 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="font-extrabold">Escudo:</span>
            <span className="font-mono text-[10px] text-slate-700">T1: {kpis.tierBreakdown.tier1} · T2: {kpis.tierBreakdown.tier2} · T3+: {kpis.tierBreakdown.tier3}</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-bold">{kpis.tierBreakdown.tier2 + kpis.tierBreakdown.tier3} con filtro</span>
          </div>

          {/* Botón para Alternar Tarjetas de Métricas Detalladas */}
          <button
            type="button"
            onClick={() => setIsTopKpisExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title={isTopKpisExpanded ? 'Contraer tarjetas de métricas detalladas' : 'Desplegar tarjetas de métricas detalladas'}
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isTopKpisExpanded ? 'Ocultar KPIs Detallados' : 'Ver KPIs Detallados'}</span>
            {isTopKpisExpanded ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Botón Pequeño para Filtros (a lado de Ver KPIs Detallados) */}
          <button
            type="button"
            onClick={() => setIsFiltersExpanded((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-bold transition-all shadow-2xs cursor-pointer ${
              isFiltersExpanded
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={isFiltersExpanded ? 'Ocultar filtros y búsqueda' : 'Desplegar filtros y búsqueda'}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${isFiltersExpanded ? 'text-white' : 'text-slate-500'}`} />
            <span>{isFiltersExpanded ? 'Ocultar Filtros' : 'Filtros'}</span>
            {activeFiltersCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isFiltersExpanded ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
            {isFiltersExpanded ? (
              <ChevronUp className={`w-3 h-3 ${isFiltersExpanded ? 'text-white/80' : 'text-slate-400'}`} />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Fila Superior de KPIs Bento con Animación Suave (CSS Grid) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isTopKpisExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-1">
            {/* KPI 1: Empresas & Locales Operativos */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas Corporativas</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {organizations.length}{' '}
                  <span className="text-sm font-semibold text-slate-400">empresas</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{kpis.activeBranches} sucursales físicas prendidas</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Parque de Placas NFC en Mesa */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placas en Mesas</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {kpis.totalTagsDeployed}{' '}
                  <span className="text-sm font-semibold text-slate-400">antenas</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] font-semibold text-slate-500">
                  <span>Promedio: {kpis.avgTagsPerBranch} / local</span>
                  <Link to="/admin/tags" className="text-blue-600 hover:underline">
                    Ver Tags
                  </Link>
                </div>
              </div>
            </div>

            {/* KPI 3: Penetración Ad-Free */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca Blanca Ad-Free</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {kpis.adFreePercentage}%{' '}
                  <span className="text-sm font-semibold text-slate-400">({kpis.adFreeCount} locales)</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-amber-700">
                  <span>{kpis.networkAdsCount} con Red de Anuncios</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Desglose de Paquetes */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Escudo Reputacional</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs">T1: {kpis.tierBreakdown.tier1}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs">T2: {kpis.tierBreakdown.tier2}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs">T3+: {kpis.tierBreakdown.tier3}</span>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  {kpis.tierBreakdown.tier2 + kpis.tierBreakdown.tier3} locales con filtro 5 estrellas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Bento Light Colapsable con Animación Suave (Requerimiento 1) */}
      {(() => {
        return (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300">
            {/* Barra de Conmutación Superior de Filtros */}
            <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFiltersExpanded((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all shadow-2xs cursor-pointer ${
                    isFiltersExpanded
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isFiltersExpanded ? 'Ocultar barra de filtros y búsqueda' : 'Desplegar barra de filtros y búsqueda'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isFiltersExpanded ? 'Ocultar Filtros' : 'Filtros'}</span>
                  {activeFiltersCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isFiltersExpanded ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {isFiltersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Resumen Compacto cuando los Filtros están Contraídos */}
                {!isFiltersExpanded && activeFiltersCount > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    {searchQuery && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        &quot;{searchQuery}&quot;
                      </span>
                    )}
                    {selectedOrgFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        Empresa
                      </span>
                    )}
                    {selectedVerticalFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                        Giro
                      </span>
                    )}
                    {selectedTierFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        Paquete
                      </span>
                    )}
                    {selectedStatusFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        Estado: {selectedStatusFilter}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>

              {/* Conteo de Resultados y Botones de Expansión del Árbol */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-medium">
                  Mostrando <strong className="text-slate-900">{treeData.stats.totalBranches}</strong> sucursales en{' '}
                  <strong className="text-slate-900">{treeData.stats.totalOrganizations}</strong> organizaciones
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white transition-all shadow-2xs cursor-pointer"
                    title="Expandir todas las empresas, sucursales y paneles de control"
                  >
                    Expandir Todo
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white transition-all shadow-2xs cursor-pointer"
                    title="Colapsar todas las empresas"
                  >
                    Colapsar Todo
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Desplegable con Animación Suave (CSS Grid) */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isFiltersExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-4 pt-2 border-t border-slate-100 space-y-3">
                  {/* Fila 1: Buscador Reactivo Flexible + Selectores */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Campo de búsqueda flexible al 100% de su espacio */}
                    <div className="relative flex-1 min-w-[280px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por empresa, marca, sucursal, dueño, mesero, tag o teléfono..."
                        className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Limpiar búsqueda"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Selectores de Segmentación */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Selector de Empresa */}
                      <select
                        value={selectedOrgFilter}
                        onChange={(e) => setSelectedOrgFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="all">Todas las Empresas ({organizations.length})</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                        <option value="independent">Locales Independientes</option>
                      </select>

                      {/* Selector de Giro Comercial Universal */}
                      <select
                        value={selectedVerticalFilter}
                        onChange={(e) => setSelectedVerticalFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="all">Todos los Giros</option>
                        {businessVerticals.map((v) => (
                          <option key={v.id} value={v.slug}>
                            {v.name}
                          </option>
                        ))}
                      </select>

                      {/* Selector de Paquete / Modalidad */}
                      <select
                        value={selectedTierFilter}
                        onChange={(e) => setSelectedTierFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="all">Todos los Paquetes</option>
                        <option value="tier_1">Tier 1: Enlace Directo</option>
                        <option value="tier_2">Tier 2: Filtro Inteligente</option>
                        <option value="tier_3">Tier 3: Menú Digital + Wi-Fi</option>
                        <option value="tier_4">Tier 4: Red Publicitaria</option>
                        <option value="ad_free">Marca Blanca (Ad-Free)</option>
                        <option value="with_ads">Red de Anuncios</option>
                      </select>
                    </div>
                  </div>

                  {/* Fila 2: Píldoras de Estado Rápido + Resumen de Coincidencias & Reset */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span>Estado:</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedStatusFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Todas ({restaurants.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('active')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          selectedStatusFilter === 'active'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Prendidas ({kpis.activeBranches})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('paused')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          selectedStatusFilter === 'paused'
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Apagadas ({kpis.pausedBranches})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('with_complaints')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          selectedStatusFilter === 'with_complaints'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                        }`}
                      >
                        <MessageSquareWarning className="w-3 h-3 text-rose-600" />
                        <span>Con Quejas ({feedbacks.length})</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {(searchQuery ||
                        selectedOrgFilter !== 'all' ||
                        selectedTierFilter !== 'all' ||
                        selectedVerticalFilter !== 'all' ||
                        selectedStatusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Restablecer todos los filtros y términos de búsqueda"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Limpiar Filtros</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TABLA JERÁRQUICA EN FILAS (TREE TABLE - 3 NIVELES) */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Cargando estructura jerárquica y paneles de control...
        </div>
      ) : treeData.organizations.length === 0 && treeData.independentBranches.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">No se encontraron cuentas</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Intenta ajustar los términos de búsqueda o registra una nueva empresa.
          </p>
          <button
            onClick={() => setIsNewOrgModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
          >
            Crear Primera Empresa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[290px]">Entidad, Jerarquía & Nivel Contratado</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Titular / Ubicación</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Estado & Interruptor</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Panel de Control (Nivel 3)</th>
                  <th className="py-3.5 px-4 min-w-[240px] text-right">Acciones & Quejas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* NIVEL 1: Organizaciones / Empresas Matrices */}
                {treeData.organizations.map((node) => {
                  const org = node.organization;
                  const isOrgCollapsed = !!collapsedOrgs[org.id];

                  return (
                    <React.Fragment key={org.id}>
                      {/* Fila Nivel 1: Empresa Matriz */}
                      <tr className="bg-slate-50/70 hover:bg-slate-100/60 border-t-2 border-slate-200 transition-colors">
                        {/* Col 1: Entidad y Chevron */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleOrgCollapse(org.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex-shrink-0"
                              title={isOrgCollapsed ? 'Desplegar marcas y sucursales' : 'Colapsar marcas y sucursales'}
                            >
                              {isOrgCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                              <Building2 className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
                                  {org.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                                  Organización Matriz
                                </span>
                                {org.billing_info?.tax_id && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold">
                                    RFC: {org.billing_info.tax_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Titular y Contacto (Truncado a 25 caracteres con Tooltip y Edición Directa) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 text-xs text-slate-600">
                            {org.owner_name && (
                              <div className="flex items-center gap-1 font-bold text-slate-800">
                                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{org.owner_name}</span>
                              </div>
                            )}
                            <div>
                              <InlineEditableTooltipField
                                value={org.owner_phone}
                                emptyLabel="Sin teléfono"
                                icon="phone"
                                onSave={async (newPhone) => {
                                  await api.updateOrganization(org.id, { owner_phone: newPhone });
                                  setOrganizations((prev) =>
                                    prev.map((item) =>
                                      item.id === org.id ? { ...item, owner_phone: newPhone } : item
                                    )
                                  );
                                }}
                              />
                            </div>
                            {org.owner_email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span title={org.owner_email} className="truncate">
                                  {formatTextMax25(org.owner_email)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Resumen de Marcas y Sucursales */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                              {node.brands.length} {node.brands.length === 1 ? 'Marca' : 'Marcas'}
                            </span>
                            {node.branches.length === 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                                0 Sucursales
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                                {node.branches.filter((b) => b.restaurant.is_active !== false).length}/
                                {node.branches.length} Sucursales
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 4: Hardware NFC Total */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold inline-flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-purple-600" />
                            <span>{node.totalTagsCount} Placas en Total</span>
                          </span>
                        </td>

                        {/* Col 5: Acciones de Organización */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => toggleOrgMetrics(org.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all ${
                                expandedOrgMetrics[org.id]
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                              }`}
                              title="Ver métricas consolidadas de la organización con filtros temporales y por sucursal"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>
                                {expandedOrgMetrics[org.id]
                                  ? 'Ocultar Métricas'
                                  : 'Métricas de Empresa'}
                              </span>
                            </button>

                            <button
                              onClick={() => handleOpenTrialModalForOrg(org)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold shadow-2xs transition-all"
                              title="Otorgar periodo de prueba de 7, 14 o 28 días a todas las sucursales de esta organización"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              <span>+ Periodo de Prueba</span>
                            </button>

                            <button
                              onClick={() => handleOpenAddBrandForOrg(org)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold shadow-2xs transition-all"
                              title="Añadir una nueva marca comercial y giro a esta organización"
                            >
                              <TagIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>+ Añadir Marca</span>
                            </button>

                            <button
                              onClick={() => handleCreateNewBranch(org.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-all"
                              title="Registrar una nueva sucursal bajo esta organización"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Sucursal</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedOrgForUserModal(org.id);
                                setIsUserModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
                              title="Gestionar usuarios del portal"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                              <span>Accesos</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditOrg(org)}
                              className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 hover:border-blue-200 text-xs font-bold shadow-2xs transition-all"
                              title={`Editar datos de la organización "${org.name}" y fiscales`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteOrganization(org.id, org.name)}
                              className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 text-xs font-bold shadow-2xs transition-all"
                              title={`Eliminar organización "${org.name}" y todas sus sucursales`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila colapsable de Métricas Consolidadas de Toda la Organización (Requerimiento 6) */}
                      {expandedOrgMetrics[org.id] && (
                        <tr className="bg-indigo-50/20 border-b border-indigo-100">
                          <td colSpan={5} className="p-4 sm:p-6">
                            {(() => {
                              const orgBranches = node.branches.map((b) => b.restaurant);
                              const selectedBranchId = orgMetricsBranchFilter[org.id] || 'all';
                              const targetBranches =
                                selectedBranchId === 'all'
                                  ? orgBranches
                                  : orgBranches.filter((b) => b.id === selectedBranchId);
                              const targetBranchIds = targetBranches.map((b) => b.id);
                              const temporal = orgMetricsTemporalFilter[org.id] || 'historico';

                              const filteredFeedbacks = feedbacks.filter(
                                (f) =>
                                  targetBranchIds.includes(f.restaurant_id) &&
                                  filterByDateWindow(f.created_at, temporal)
                              );
                              const filteredReports = managerShiftReports.filter(
                                (r) =>
                                  targetBranchIds.includes(r.restaurant_id) &&
                                  filterByDateWindow(r.shift_date, temporal)
                              );

                              const avgRating =
                                filteredFeedbacks.length > 0
                                  ? (
                                      filteredFeedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) /
                                      filteredFeedbacks.length
                                    ).toFixed(1)
                                  : '5.0';
                              const goodRatings = filteredFeedbacks.filter(
                                (f) => (f.rating || 5) >= 4
                              ).length;
                              const shieldedRatings = filteredFeedbacks.filter(
                                (f) => (f.rating || 5) < 4
                              ).length;
                              const totalSales = filteredReports.reduce(
                                (sum, r) => sum + Number(r.total_sales || 0),
                                0
                              );
                              const totalTips = filteredReports.reduce(
                                (sum, r) => sum + Number(r.tips_collected || 0),
                                0
                              );
                              const totalTablesServed = filteredReports.reduce(
                                (sum, r) => sum + Number(r.tables_served || 0),
                                0
                              );
                              const targetTables = restaurantTables.filter(
                                (t) => t.restaurant_id && targetBranchIds.includes(t.restaurant_id)
                              );
                              const totalCapacity = targetTables.reduce(
                                (sum, t) => sum + (t.capacity || 4),
                                0
                              );
                              const targetTags = tags.filter(
                                (t) => t.restaurant_id && targetBranchIds.includes(t.restaurant_id)
                              );
                              const orgMgrs = organizationManagers.filter(
                                (m) =>
                                  m.organization_id === org.id || m.organization_id === 'org-1'
                              );

                              return (
                                <div className="bg-white rounded-3xl border border-indigo-200 p-5 shadow-xs space-y-5">
                                  {/* Cabecera del Panel Consolidado */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                                        <BarChart3 className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                                            Métricas Consolidadas de Organización: {org.name}
                                          </h3>
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            Consolidado Multi-Sucursal
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          Visión ejecutiva consolidada de {node.branches.length}{' '}
                                          sucursales físicas y {node.brands.length} marcas
                                          registradas.
                                        </p>
                                      </div>
                                    </div>

                                    {/* Botón Colapsar Panel */}
                                    <button
                                      type="button"
                                      onClick={() => toggleOrgMetrics(org.id)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all self-end sm:self-center"
                                    >
                                      Colapsar Métricas
                                    </button>
                                  </div>

                                  {/* Barra de Filtros: Filtro Temporal y Filtro de Sucursal */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                                    {/* Filtro Temporal */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                        Periodo:
                                      </span>
                                      <div className="inline-flex items-center rounded-xl bg-white p-0.5 border border-slate-200 shadow-2xs">
                                        {(
                                          [
                                            { key: 'hoy', label: 'Hoy' },
                                            { key: '7dias', label: 'Últimos 7 Días' },
                                            { key: '30dias', label: 'Este Mes (30 Días)' },
                                            { key: 'historico', label: 'Histórico Completo' },
                                          ] as const
                                        ).map((opt) => (
                                          <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() =>
                                              setOrgMetricsTemporalFilter((prev) => ({
                                                ...prev,
                                                [org.id]: opt.key,
                                              }))
                                            }
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                              temporal === opt.key
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Selector de Sucursal */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                        Filtrar Sucursal:
                                      </span>
                                      <select
                                        value={selectedBranchId}
                                        onChange={(e) =>
                                          setOrgMetricsBranchFilter((prev) => ({
                                            ...prev,
                                            [org.id]: e.target.value,
                                          }))
                                        }
                                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      >
                                        <option value="all">
                                          Todas las Sucursales ({orgBranches.length})
                                        </option>
                                        {orgBranches.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            {b.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Grid Bento de KPIs Consolidados */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                    {/* KPI 1: Facturación Total en Cortes */}
                                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                                        Facturación Consolidada
                                      </span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900">
                                          $
                                          {totalSales.toLocaleString('es-MX', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                          })}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-700">
                                          MXN
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">
                                        {totalTablesServed} mesas en cortes · ${totalTips.toFixed(0)}{' '}
                                        propinas
                                      </span>
                                    </div>

                                    {/* KPI 2: Reputación Consolidada Google */}
                                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-1">
                                      <span className="text-[10px] font-extrabold uppercase text-sky-800 tracking-wider">
                                        Reputación Corporativa
                                      </span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900">
                                          {avgRating}
                                        </span>
                                        <span className="text-xs font-bold text-sky-700">
                                          ★ Google Media
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">
                                        {goodRatings} opiniones 4-5★ · {filteredFeedbacks.length}{' '}
                                        totales
                                      </span>
                                    </div>

                                    {/* KPI 3: Escudo Reputacional & Retención */}
                                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                                      <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                                        Escudo de Quejas
                                      </span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900">
                                          {shieldedRatings}
                                        </span>
                                        <span className="text-xs font-bold text-amber-700">
                                          quejas retenidas
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">
                                        Retenidas confidencialmente antes de llegar a Google
                                      </span>
                                    </div>

                                    {/* KPI 4: Aforo, Antenas & Plantilla */}
                                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                                      <span className="text-[10px] font-extrabold uppercase text-purple-800 tracking-wider">
                                        Capacidad & Antenas
                                      </span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900">
                                          {targetTags.length}
                                        </span>
                                        <span className="text-xs font-bold text-purple-700">
                                          placas en mesa
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">
                                        {targetTables.length} mesas ({totalCapacity} comensales) ·{' '}
                                        {orgMgrs.length} gerentes
                                      </span>
                                    </div>
                                  </div>

                                  {/* Tabla Comparativa de Rendimiento por Sucursal */}
                                  <div className="space-y-2">
                                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                                      Rendimiento Desglosado por Sucursal ({targetBranches.length})
                                    </span>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                      <table className="w-full text-left text-xs divide-y divide-slate-200">
                                        <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                          <tr>
                                            <th className="py-2.5 px-3">Sucursal Física</th>
                                            <th className="py-2.5 px-3">Marca Comercial</th>
                                            <th className="py-2.5 px-3">Tier</th>
                                            <th className="py-2.5 px-3">Placas NFC</th>
                                            <th className="py-2.5 px-3">Reseñas / Rating</th>
                                            <th className="py-2.5 px-3">Ventas Turno</th>
                                            <th className="py-2.5 px-3 text-right">Estado</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {targetBranches.map((br) => {
                                            const brTags = tags.filter(
                                              (t) => t.restaurant_id === br.id
                                            );
                                            const brFbs = filteredFeedbacks.filter(
                                              (f) => f.restaurant_id === br.id
                                            );
                                            const brReps = filteredReports.filter(
                                              (r) => r.restaurant_id === br.id
                                            );
                                            const brSales = brReps.reduce(
                                              (s, r) => s + Number(r.total_sales || 0),
                                              0
                                            );
                                            const brRating =
                                              brFbs.length > 0
                                                ? (
                                                    brFbs.reduce(
                                                      (s, f) => s + (f.rating || 5),
                                                      0
                                                    ) / brFbs.length
                                                  ).toFixed(1)
                                                : '5.0';
                                            const brBrand = organizationBrands.find(
                                              (b) => b.id === br.brand_id
                                            );

                                            return (
                                              <tr key={br.id} className="hover:bg-slate-50/60">
                                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                                  {br.name}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                  {brBrand ? brBrand.name : 'Marca Matriz'}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                                    Tier {br.tier || 1}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-3 font-medium text-slate-700">
                                                  {brTags.length} placas
                                                </td>
                                                <td className="py-2.5 px-3">
                                                  <span className="font-bold text-slate-900">
                                                    {brRating} ★
                                                  </span>
                                                  <span className="text-[10px] text-slate-500 ml-1">
                                                    ({brFbs.length})
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-3 font-extrabold text-emerald-700">
                                                  $
                                                  {brSales.toLocaleString('es-MX', {
                                                    minimumFractionDigits: 0,
                                                  })}{' '}
                                                  MXN
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                  <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                                      br.is_active !== false
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}
                                                  >
                                                    {br.is_active !== false ? 'Activa' : 'Pausada'}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}

                      {/* Sub-fila de alerta para Organizaciones sin marcas ni sucursales */}
                      {!isOrgCollapsed && node.brands.length === 0 && node.branches.length === 0 && (
                        <tr className="bg-amber-50/40 border-b border-amber-200/60">
                          <td colSpan={5} className="py-3.5 px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                              <div className="flex items-center gap-2.5">
                                <TagIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                  <span className="font-extrabold block">
                                    Organización registrada sin marcas ni sucursales activas.
                                  </span>
                                  <span className="text-[11px] text-amber-700 block">
                                    Añade primero una marca comercial con su giro y logo para vincular sus sucursales.
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleOpenAddBrandForOrg(org)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs flex-shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir Primera Marca para {org.name}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* NIVEL 2: Marcas Comerciales de la Organización (con Sucursales Supeditadas) */}
                      {!isOrgCollapsed &&
                        node.brands.map((brandNode) => {
                          const brand = brandNode.brand;

                          return (
                            <React.Fragment key={brand.id}>
                              {/* Fila de Marca Comercial */}
                              <tr className="bg-indigo-50/30 hover:bg-indigo-50/60 border-b border-indigo-100/80 transition-colors">
                                <td className="py-2.5 px-4 pl-6 sm:pl-8">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-indigo-300 font-mono text-xs select-none">
                                      &#9492;
                                    </span>

                                    {brand.logo_url ? (
                                      <img
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        className="w-7 h-7 rounded-xl object-cover border border-indigo-200 bg-white flex-shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className="w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0 shadow-2xs"
                                        style={{ backgroundColor: brand.brand_color || '#4f46e5' }}
                                      >
                                        {brand.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-extrabold text-xs text-slate-900">
                                          {brand.name}
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded-md bg-indigo-100/80 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold">
                                          Marca Comercial
                                        </span>
                                        <span className="px-2 py-0.2 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                                          Giro: {brandNode.verticalLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-4 text-[11px] text-slate-500">
                                  Supeditada a <span className="font-bold text-slate-700">{org.name}</span>
                                </td>

                                <td className="py-2.5 px-4">
                                  <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                                    {brandNode.branches.length}{' '}
                                    {brandNode.branches.length === 1
                                      ? 'Sucursal Supeditada'
                                      : 'Sucursales Supeditadas'}
                                  </span>
                                </td>

                                <td className="py-2.5 px-4">
                                  <span className="text-[11px] font-bold text-purple-700">
                                    {brandNode.totalTagsCount} Tags en marca
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenAddBranchForBrand(org, brand)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold shadow-2xs transition-colors"
                                      title={`Añadir nueva sucursal supeditada a la marca ${brand.name}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>+ Añadir Sucursal a {brand.name}</span>
                                    </button>
                                    {brandNode.branches.length === 0 && (
                                      <button
                                        onClick={() => handleDeleteBrand(brand.id, brand.name)}
                                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                                        title={`Eliminar marca "${brand.name}" (0 sucursales activas)`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Filas de Sucursales Físicas supeditadas a esta Marca */}
                              {brandNode.branches.map((branchNode) => {
                                const res = branchNode.restaurant;
                                const branchTags = branchNode.tags;
                                const tierInfo = TIERS[res.tier || 2];
                                const isPanelExpanded = !!expandedBranchPanels[res.id];
                                const isBranchOn = res.is_active !== false;

                                return (
                                  <React.Fragment key={res.id}>
                                    {/* Fila de Sucursal Física */}
                                    <tr className="bg-white hover:bg-blue-50/20 border-b border-slate-100 transition-colors">
                                      {/* Col 1: Conector de árbol, Identidad y Selector del Nivel Contratado (Tier) */}
                                      <td className="py-3 px-4 pl-10 sm:pl-14">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-slate-300 font-mono text-sm select-none">
                                            &bull;
                                          </span>

                                          {res.logo_url || brand.logo_url ? (
                                            <img
                                              src={res.logo_url || brand.logo_url || ''}
                                              alt={res.name}
                                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                            />
                                          ) : (
                                            <div
                                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  res.brand_color || brand.brand_color || '#2563eb',
                                              }}
                                            >
                                              {res.brand_name.charAt(0)}
                                            </div>
                                          )}

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-extrabold text-slate-900 text-xs truncate">
                                                {res.branch_name || 'Sucursal Principal'}
                                              </span>
                                              <span className="text-slate-400 font-semibold text-[11px] truncate">
                                                ({res.brand_name})
                                              </span>
                                            </div>

                                            {/* Selector Interactivo del Nivel Contratado (Tier 1 a 4) */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                              <select
                                                value={res.tier || 2}
                                                onChange={(e) =>
                                                  handleChangeBranchTier(
                                                    res,
                                                    Number(e.target.value) as TierType
                                                  )
                                                }
                                                title="Cambiar el nivel de paquete contratado por esta sucursal"
                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${tierInfo.badgeColor}`}
                                              >
                                                <option
                                                  value={1}
                                                  className="bg-white text-slate-900 font-bold"
                                                >
                                                  {getTierName(1)}
                                                </option>
                                                <option
                                                  value={2}
                                                  className="bg-white text-slate-900 font-bold"
                                                >
                                                  {getTierName(2)}
                                                </option>
                                                <option
                                                  value={3}
                                                  className="bg-white text-slate-900 font-bold"
                                                >
                                                  {getTierName(3)}
                                                </option>
                                                <option
                                                  value={4}
                                                  className="bg-white text-slate-900 font-bold"
                                                >
                                                  {getTierName(4)}
                                                </option>
                                              </select>

                                              <span className="text-[10px] text-slate-400 font-semibold">
                                                • {branchNode.capabilities.verticalLabel}
                                              </span>

                                              {(() => {
                                                const trial = isBranchTrialActive(res);
                                                if (!trial.isActive) return null;
                                                return (
                                                  <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold animate-pulse"
                                                    title={`Prueba Tier ${trial.trialTier} activa hasta el ${trial.endDate?.toLocaleDateString()}`}
                                                  >
                                                    <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                                    <span>Prueba Tier {trial.trialTier} ({trial.daysRemaining}d)</span>
                                                  </span>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Col 2: Dirección y Teléfono de la Sucursal (Primeros 25 caracteres + Tooltip + Edición) */}
                                      <td className="py-3 px-4">
                                        <div className="space-y-1 text-xs text-slate-600">
                                          <div>
                                            <InlineEditableTooltipField
                                              value={res.address}
                                              emptyLabel="Sin dirección"
                                              icon="address"
                                              href={
                                                res.address
                                                  ? res.google_review_url ||
                                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                      res.name + ' ' + res.address
                                                    )}`
                                                  : undefined
                                              }
                                              onSave={async (newAddress) => {
                                                await api.saveRestaurant({
                                                  id: res.id,
                                                  address: newAddress,
                                                });
                                                setRestaurants((prev) =>
                                                  prev.map((item) =>
                                                    item.id === res.id
                                                      ? { ...item, address: newAddress }
                                                      : item
                                                  )
                                                );
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <InlineEditableTooltipField
                                              value={res.manager_phone}
                                              emptyLabel="Sin teléfono"
                                              icon="phone"
                                              onSave={async (newPhone) => {
                                                await api.saveRestaurant({
                                                  id: res.id,
                                                  manager_phone: newPhone,
                                                });
                                                setRestaurants((prev) =>
                                                  prev.map((item) =>
                                                    item.id === res.id
                                                      ? { ...item, manager_phone: newPhone }
                                                      : item
                                                  )
                                                );
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </td>

                                      {/* Col 3: Badge de Estado Actual + Switch Maestro de la Sucursal */}
                                      <td className="py-3 px-4">
                                        <StatusBadgeAndSwitch
                                          isOn={isBranchOn}
                                          onToggle={() => handleToggleBranchActive(res)}
                                          title="Prender o apagar servicio general de esta sucursal"
                                        />
                                      </td>

                                      {/* Col 4: Botón Desplegable del Panel de Control de Sucursal */}
                                      <td className="py-3 px-4">
                                        <button
                                          onClick={() => toggleBranchPanel(res.id)}
                                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                            isPanelExpanded
                                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/80'
                                          }`}
                                          title="Abrir Panel de Control por Categorías (Funcionalidades Tier, Placas NFC, Pantallas KDS y Meseros)"
                                        >
                                          <Sliders className="w-3.5 h-3.5" />
                                          <span>Panel de Control</span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                                              isPanelExpanded
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white text-slate-600 border border-slate-200'
                                            }`}
                                          >
                                            {branchTags.length} Tags
                                            {branchNode.capabilities.supportsKds ? ' • KDS' : ''}
                                          </span>
                                          {isPanelExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </td>

                                      {/* Col 5: Botonera de Sucursal + Botón Directo a Solicitudes de Quejas */}
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <Link
                                            to={`/admin/feedback?restaurant=${res.id}`}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                              branchNode.pendingFeedbacksCount > 0
                                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                            title="Ver solicitudes de quejas retenidas (1 a 3 estrellas) de esta sucursal"
                                          >
                                            <MessageSquareWarning className="w-3 h-3" />
                                            <span>Quejas ({branchNode.feedbacksCount})</span>
                                          </Link>

                                          <a
                                            href={res.google_review_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                                            title="Abrir ficha en Google Maps"
                                          >
                                            <span>Google</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>

                                          <button
                                            onClick={() => handleOpenTrialModalForBranch(res)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors shadow-2xs"
                                            title="Otorgar o modificar periodo de prueba para esta sucursal"
                                          >
                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                            <span>Prueba</span>
                                          </button>

                                          <Link
                                            to={`/portal?restaurantId=${res.id}`}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-2xs"
                                            title="Abrir portal del cliente para este local"
                                          >
                                            <Store className="w-3 h-3" />
                                            <span>Portal</span>
                                          </Link>

                                          <button
                                            onClick={() => handleEdit(res)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                            title="Editar Sucursal"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            onClick={() => handleDeleteRestaurantPermanent(res.id, res.name)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            title="Dar de baja definitiva y eliminar esta sucursal"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Fila Panel de Control de la Sucursal por Categorías */}
                                    {isPanelExpanded && renderBranchControlPanel(branchNode)}
                                  </React.Fragment>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

                {/* SECCIÓN ESPECIAL: Locales Independientes (Sin Organización Matriz) */}
                {treeData.independentBranches.length > 0 && (
                  <>
                    <tr className="bg-slate-100/70 border-t-2 border-slate-300">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-slate-600" />
                            <span className="font-extrabold text-sm text-slate-800">
                              Locales Comerciales Independientes (Sin Organización Asignada)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-bold">
                            {treeData.independentBranches.length} Locales
                          </span>
                        </div>
                      </td>
                    </tr>

                    {treeData.independentBranches.map((branchNode) => {
                      const res = branchNode.restaurant;
                      const branchTags = branchNode.tags;
                      const tierInfo = TIERS[res.tier || 2];
                      const isPanelExpanded = !!expandedBranchPanels[res.id];
                      const isBranchOn = res.is_active !== false;

                      return (
                        <React.Fragment key={res.id}>
                          <tr className="bg-white hover:bg-slate-50 border-b border-slate-100">
                            <td className="py-3 px-4 pl-8">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="font-bold text-slate-900">{res.name}</span>
                                </div>
                                <div className="pl-3">
                                  <select
                                    value={res.tier || 2}
                                    onChange={(e) =>
                                      handleChangeBranchTier(res, Number(e.target.value) as TierType)
                                    }
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border cursor-pointer ${tierInfo.badgeColor}`}
                                  >
                                    <option value={1} className="bg-white text-slate-900 font-bold">
                                      {getTierName(1)}
                                    </option>
                                    <option value={2} className="bg-white text-slate-900 font-bold">
                                      {getTierName(2)}
                                    </option>
                                    <option value={3} className="bg-white text-slate-900 font-bold">
                                      {getTierName(3)}
                                    </option>
                                    <option value={4} className="bg-white text-slate-900 font-bold">
                                      {getTierName(4)}
                                    </option>
                                  </select>

                                  {(() => {
                                    const trial = isBranchTrialActive(res);
                                    if (!trial.isActive) return null;
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold animate-pulse ml-1.5"
                                        title={`Prueba Tier ${trial.trialTier} activa hasta el ${trial.endDate?.toLocaleDateString()}`}
                                      >
                                        <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                        <span>Prueba Tier {trial.trialTier} ({trial.daysRemaining}d)</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              <div className="space-y-1">
                                <div>
                                  <InlineEditableTooltipField
                                    value={res.address}
                                    emptyLabel="Sin dirección"
                                    icon="address"
                                    onSave={async (newAddress) => {
                                      await api.saveRestaurant({ id: res.id, address: newAddress });
                                      setRestaurants((prev) =>
                                        prev.map((item) =>
                                          item.id === res.id ? { ...item, address: newAddress } : item
                                        )
                                      );
                                    }}
                                  />
                                </div>
                                <div>
                                  <InlineEditableTooltipField
                                    value={res.manager_phone}
                                    emptyLabel="Sin teléfono"
                                    icon="phone"
                                    onSave={async (newPhone) => {
                                      await api.saveRestaurant({ id: res.id, manager_phone: newPhone });
                                      setRestaurants((prev) =>
                                        prev.map((item) =>
                                          item.id === res.id ? { ...item, manager_phone: newPhone } : item
                                        )
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadgeAndSwitch
                                isOn={isBranchOn}
                                onToggle={() => handleToggleBranchActive(res)}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleBranchPanel(res.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Panel ({branchTags.length} Tags)</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/admin/feedback?restaurant=${res.id}`}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                                >
                                  Quejas ({branchNode.feedbacksCount})
                                </Link>
                                <button
                                  onClick={() => handleOpenTrialModalForBranch(res)}
                                  className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors shadow-2xs inline-flex items-center gap-1"
                                  title="Otorgar o modificar periodo de prueba para esta sucursal"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  <span>Prueba</span>
                                </button>
                                <button
                                  onClick={() => handleEdit(res)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                                >
                                  Vincular Empresa
                                </button>
                                <button
                                  onClick={() => handleDeleteRestaurantPermanent(res.id, res.name)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                                  title={`Dar de baja definitiva y eliminar "${res.name}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isPanelExpanded && renderBranchControlPanel(branchNode)}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asistente de 3 Pasos: Dar de Alta Organización -> Añadir Marca -> Añadir Sucursal */}
      <NewOrganizationModal
        isOpen={isNewOrgModalOpen}
        onClose={() => {
          setIsNewOrgModalOpen(false);
          setWizardInitialOrg(null);
          setWizardInitialBrand(null);
        }}
        initialOrganization={wizardInitialOrg}
        initialBrand={wizardInitialBrand}
        onCreated={(newOrg) => {
          setOrganizations((prev) => [newOrg, ...prev]);
        }}
        onBrandCreated={(newBrand) => {
          setOrganizationBrands((prev) => [...prev, newBrand]);
          api.getBusinessVerticals().then(setBusinessVerticals);
        }}
        onBranchCreated={(newBranch) => {
          setRestaurants((prev) => [newBranch, ...prev]);
          loadData();
        }}
      />

      {/* Modal de Alta / Edición de Restaurante */}
      <RestaurantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        restaurant={editingRestaurant}
        organizations={organizations}
        preselectedOrgId={preselectedOrgForNewBranch}
        onOrganizationCreated={(newOrg) => {
          setOrganizations((prev) => [newOrg, ...prev]);
        }}
      />

      {/* Modal de Accesos al Portal de Suscriptores */}
      <OrganizationUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        organizations={organizations}
        preselectedOrgId={selectedOrgForUserModal}
        onOrganizationCreated={(newOrg) => {
          setOrganizations((prev) => [newOrg, ...prev]);
        }}
      />

      {/* Modal de Edición de Organización Matriz y Datos Fiscales */}
      <OrganizationEditModal
        isOpen={isEditOrgModalOpen}
        onClose={() => {
          setIsEditOrgModalOpen(false);
          setEditingOrg(null);
        }}
        organization={editingOrg}
        onUpdated={(updatedOrg) => {
          setOrganizations((prev) =>
            prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
          );
        }}
      />

      {/* Modal de Periodo de Prueba para Organización o Sucursal (Políticas 3, 3.1, 4 y 5) */}
      <TrialPeriodModal
        isOpen={isTrialModalOpen}
        onClose={() => {
          setIsTrialModalOpen(false);
          setTrialModalTargetOrg(null);
          setTrialModalTargetBranch(null);
        }}
        onSuccess={loadData}
        targetOrg={trialModalTargetOrg}
        targetBranch={trialModalTargetBranch}
        defaultTier={trialModalDefaultTier}
      />

      {/* Modal de Edición de Gerentes (Requerimiento 4) */}
      <ManagerEditModal
        isOpen={isManagerEditModalOpen}
        onClose={() => {
          setIsManagerEditModalOpen(false);
          setEditingManager(null);
        }}
        manager={editingManager}
        onSuccess={async () => {
          const refreshed = await api.getOrganizationManagers();
          setOrganizationManagers(refreshed);
          setIsManagerEditModalOpen(false);
          setEditingManager(null);
        }}
      />

      {/* Modal de Administración de Menú y Platillos (Requerimientos 3, 4) */}
      <MenuManagementModal
        isOpen={isMenuModalOpen}
        onClose={() => {
          setIsMenuModalOpen(false);
          setSelectedMenuRestaurant(null);
        }}
        restaurant={selectedMenuRestaurant}
      />

      {/* Modal de Agente Creador de Cupones por Gerente (Requerimiento 8) */}
      <ManagerCouponModal
        isOpen={isCouponModalOpen}
        onClose={() => {
          setIsCouponModalOpen(false);
          setCouponModalManager(null);
        }}
        manager={couponModalManager}
        restaurantId={couponModalRestaurantId}
        branchName={couponModalBranchName}
        onCouponCreated={loadData}
      />
    </div>
  );
};
