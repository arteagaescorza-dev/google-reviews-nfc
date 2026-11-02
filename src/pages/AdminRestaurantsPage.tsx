import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type { Restaurant, Organization, Tag, StaffMember } from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { NewOrganizationModal } from '../components/admin/NewOrganizationModal';
import { TIERS } from '../lib/constants';
import {
  calculateRestaurantKpis,
  buildOrganizationTree,
  type BranchNode,
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
  Mail,
  ChefHat,
  UserCheck,
  Sliders,
  Monitor,
  Power,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const KDS_STORAGE_KEY = 'nfc_kds_stations_state_v1';
const WAITER_TERM_STORAGE_KEY = 'nfc_waiter_terminal_state_v1';

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

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado persistente de Pantallas KDS y Terminales de Meseros por sucursal
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

  // Filtros de búsqueda y segmentación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Estado de colapsado en el Árbol Tabular (Nivel 1 Organizaciones y Nivel 2 Sucursales)
  const [collapsedOrgs, setCollapsedOrgs] = useState<Record<string, boolean>>({});
  const [expandedBranchPanels, setExpandedBranchPanels] = useState<Record<string, boolean>>({});

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [preselectedOrgForNewBranch, setPreselectedOrgForNewBranch] = useState<string | undefined>(undefined);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedOrgForUserModal, setSelectedOrgForUserModal] = useState<string | undefined>(undefined);
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [resList, orgList, tagList, staffList] = await Promise.all([
      api.getRestaurants(),
      api.getOrganizations(),
      api.getTags(),
      api.getStaffMembers(),
    ]);
    setRestaurants(resList);
    setOrganizations(orgList);
    setTags(tagList);
    setStaffMembers(staffList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = useMemo(() => {
    return calculateRestaurantKpis(restaurants, tags);
  }, [restaurants, tags]);

  // Construcción del Árbol Jerárquico en 3 Niveles con Panel de Control por Sucursal
  const treeData = useMemo(() => {
    return buildOrganizationTree(
      organizations,
      restaurants,
      tags,
      searchQuery,
      selectedOrgFilter,
      selectedTierFilter,
      staffMembers,
      kdsStateByBranch
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
  ]);

  const handleEdit = (r: Restaurant) => {
    setEditingRestaurant(r);
    setPreselectedOrgForNewBranch(r.organization_id || undefined);
    setIsModalOpen(true);
  };

  const handleCreateNewBranch = (orgId?: string) => {
    setEditingRestaurant(null);
    setPreselectedOrgForNewBranch(orgId);
    setIsModalOpen(true);
  };

  const toggleOrgCollapse = (orgId: string) => {
    setCollapsedOrgs((prev) => ({
      ...prev,
      [orgId]: !prev[orgId],
    }));
  };

  const toggleBranchPanel = (restaurantId: string) => {
    setExpandedBranchPanels((prev) => ({
      ...prev,
      [restaurantId]: !prev[restaurantId],
    }));
  };

  const handleExpandAll = () => {
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
  // Controladores de Switches Prendido / Apagado
  // ==========================================

  const handleToggleBranchActive = async (res: Restaurant) => {
    const nextState = res.is_active === false;
    setRestaurants((prev) =>
      prev.map((item) => (item.id === res.id ? { ...item, is_active: nextState } : item))
    );
    await api.toggleRestaurantActive(res.id, nextState);
  };

  const handleToggleBranchAdFree = async (res: Restaurant) => {
    const nextAdFree = !res.is_ad_free;
    setRestaurants((prev) =>
      prev.map((item) => (item.id === res.id ? { ...item, is_ad_free: nextAdFree } : item))
    );
    await api.saveRestaurant({ id: res.id, is_ad_free: nextAdFree });
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

  // ==========================================
  // Renderizador del Panel de Control de Sucursal (Nivel 3 por Categorías)
  // ==========================================
  const renderBranchControlPanel = (branchNode: BranchNode) => {
    const res = branchNode.restaurant;
    const branchTags = branchNode.tags;
    const { capabilities, kdsStations, staff } = branchNode;
    const isBranchOn = res.is_active !== false;
    const isWaiterTerminalOn =
      waiterTerminalByBranch[res.id] !== undefined ? waiterTerminalByBranch[res.id] : true;

    // Ordenar personal por categoría de rol: Meseros -> Cocina -> Capitán
    const roleOrder: Record<string, number> = { waiter: 1, kitchen: 2, manager: 3 };
    const sortedStaff = [...staff].sort(
      (a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9)
    );

    const roleLabelMap: Record<string, string> = {
      waiter: 'Mesero de Sala',
      kitchen: 'Jefe de Cocina / KDS',
      manager: 'Capitán / Gerente de Piso',
    };

    return (
      <tr className="bg-slate-50/80 border-b-2 border-slate-200">
        <td colSpan={5} className="p-0">
          <div className="py-4 px-4 sm:px-8 lg:px-12 space-y-4">
            {/* Cabecera del Panel de Control de la Sucursal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Panel de Control Operativo — {res.brand_name} ({res.branch_name})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                      Giro: {capabilities.verticalLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Controles ordenados por categoría con interruptores en tiempo real (solo se muestran las categorías que aplican a esta sucursal).
                  </p>
                </div>
              </div>
            </div>

            {/* CATEGORÍA 1: MÓDULOS Y SERVICIOS GENERALES DE LA SUCURSAL (Aplica a todas) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                    Categoría 1: Servicios & Módulos de la Sucursal
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">2 controles aplicables</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {/* Fila 1.1: Estado Operativo General de la Sucursal */}
                <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block">
                      Servicio Interactivo en {capabilities.unitPlural} (Filtro Reputacional & Menú)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Si se apaga, las placas NFC redirigen directo a Google Maps sin pasar por el filtro de quejas.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadgeAndSwitch
                      isOn={isBranchOn}
                      onToggle={() => handleToggleBranchActive(res)}
                      title="Prender o apagar el servicio interactivo de la sucursal"
                    />
                  </div>
                </div>

                {/* Fila 1.2: Modalidad Marca Blanca Ad-Free */}
                <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block">
                      Escudo Marca Blanca (Ad-Free • Sin Publicidad Cruzada)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prendido bloquea anuncios de terceros en las mesas; apagado permite pauta subsidiada de la red.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <StatusBadgeAndSwitch
                      isOn={Boolean(res.is_ad_free)}
                      onToggle={() => handleToggleBranchAdFree(res)}
                      title="Prender o apagar Marca Blanca sin anuncios"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORÍA 2: HARDWARE NFC & PLACAS EN MESA */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="bg-purple-50/70 px-4 py-2 border-b border-purple-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[11px] font-extrabold text-purple-950 uppercase tracking-wider">
                    Categoría 2: Hardware NFC & Placas en {capabilities.unitPlural}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-purple-700">
                  {branchTags.filter((t) => t.is_active !== false).length} de {branchTags.length} prendidas
                </span>
              </div>

              {branchTags.length === 0 ? (
                <div className="px-4 py-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>No hay placas físicas asignadas a esta sucursal todavía.</span>
                  <Link
                    to={`/admin/tags?restaurant=${res.id}`}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100"
                  >
                    + Asignar Placas NFC
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {branchTags.map((tag) => {
                    const isTagOn = tag.is_active !== false;
                    return (
                      <div
                        key={tag.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-purple-50/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {tag.tag_code}
                          </span>
                          <span className="font-bold text-slate-700">
                            {tag.table_identifier
                              ? `${capabilities.unitLabel}: ${tag.table_identifier}`
                              : `${capabilities.unitLabel} General`}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({tag.scan_count || 0} escaneos acumulados)
                          </span>
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
            </div>

            {/* CATEGORÍA 3: PANTALLAS DE COCINA / KDS (Solo aplica si capabilities.supportsKds === true) */}
            {capabilities.supportsKds && (
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div className="bg-orange-50/80 px-4 py-2 border-b border-orange-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                    <span className="text-[11px] font-extrabold text-orange-950 uppercase tracking-wider">
                      Categoría 3: Pantallas de Cocina Activas & Estaciones KDS
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-orange-700">
                    {kdsStations.filter((s) => s.isActive).length} de {kdsStations.length} estaciones prendidas
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {kdsStations.map((station) => (
                    <div
                      key={station.id}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-orange-50/20"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                          <span className="font-bold text-slate-900">{station.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block pl-5">
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
                          <span>Abrir KDS</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORÍA 4: PANTALLAS DE MESEROS & PERSONAL CON PIN (Solo aplica si capabilities.supportsFloorStaff === true) */}
            {capabilities.supportsFloorStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                      Categoría 4: Pantallas de Meseros & Personal Operativo con PIN
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {sortedStaff.filter((s) => s.is_active).length} de {sortedStaff.length} operadores prendidos
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Fila Principal: Terminal Móvil General de Meseros */}
                  <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40 hover:bg-emerald-50/20">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-extrabold text-slate-900">
                          Terminal Móvil de Sala (Recepción de Llamadas de Mesa & Alertas)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block pl-5">
                        Pantalla de piso para atender llamados de cuenta, platos listos de cocina y quejas 1-3 estrellas.
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

                  {/* Filas de Personal Operativo ordenadas por categoría de rol */}
                  {sortedStaff.map((member) => (
                    <div
                      key={member.id}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-emerald-50/20"
                    >
                      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                        <span className="font-bold text-slate-900">{member.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                          {roleLabelMap[member.role] || member.role}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          PIN: {member.pin_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <StatusBadgeAndSwitch
                          isOn={member.is_active}
                          onToggle={() => handleToggleStaffActive(member)}
                          title={`Prender o apagar acceso PIN de ${member.name}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Encabezado Bento Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Capa 2: Directorio de Cuentas & Panel de Control por Sucursal
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-002</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Cuentas & Sucursales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Estructura jerárquica en filas de 3 niveles: Empresa Matriz &rarr; Sucursal Física &rarr; Panel de Control por Categorías.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewOrgModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition-all"
            title="Alta express en calle para registrar un nuevo corporativo en 30 segundos"
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>+ Empresa en Calle</span>
          </button>

          <button
            onClick={() => {
              setSelectedOrgForUserModal(undefined);
              setIsUserModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Accesos al Portal</span>
          </button>

          <button
            onClick={() => handleCreateNewBranch()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Sucursal</span>
          </button>
        </div>
      </div>

      {/* Fila Superior de KPIs Bento (Col-Span-4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs">T3: {kpis.tierBreakdown.tier3}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-slate-500">
              {kpis.tierBreakdown.tier2 + kpis.tierBreakdown.tier3} locales con filtro 5 estrellas
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Selector de Organización y Expansión */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Campo de búsqueda reactivo */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa, dueño, sucursal, mesero, tag o teléfono..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles de Filtros y Expansión */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todas las Empresas ({organizations.length})</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
            <option value="independent">Locales Independientes</option>
          </select>

          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todos los Paquetes</option>
            <option value="tier_1">Tier 1: Enlace Directo</option>
            <option value="tier_2">Tier 2: Filtro Inteligente</option>
            <option value="tier_3">Tier 3: Linktree de Marca</option>
            <option value="ad_free">Marca Blanca (Ad-Free)</option>
            <option value="with_ads">Red de Anuncios</option>
            <option value="active">Solo Locales Prendidos</option>
            <option value="paused">Solo Locales Apagados</option>
          </select>

          {/* Botones de Expansión del Árbol */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              title="Expandir todas las empresas, sucursales y paneles de control"
            >
              Expandir Todo
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              title="Colapsar todas las empresas"
            >
              Colapsar Todo
            </button>
          </div>
        </div>
      </div>

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
                  <th className="py-3.5 px-4 min-w-[270px]">Entidad & Jerarquía</th>
                  <th className="py-3.5 px-4 min-w-[210px]">Titular / Ubicación</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Estado & Interruptor</th>
                  <th className="py-3.5 px-4 min-w-[190px]">Panel de Control (Nivel 3)</th>
                  <th className="py-3.5 px-4 min-w-[190px] text-right">Acciones Ejecutivas</th>
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
                              title={isOrgCollapsed ? 'Desplegar sucursales' : 'Colapsar sucursales'}
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
                                  Nivel 1: Empresa Matriz
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Titular y Contacto */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-xs text-slate-600">
                            {org.owner_name && (
                              <div className="flex items-center gap-1 font-bold text-slate-800">
                                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{org.owner_name}</span>
                              </div>
                            )}
                            {org.owner_phone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{org.owner_phone}</span>
                              </div>
                            )}
                            {org.owner_email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{org.owner_email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col 3: Resumen de Sucursales */}
                        <td className="py-3.5 px-4">
                          {node.branches.length === 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold inline-flex items-center gap-1">
                              <span>0 Sucursales Asignadas</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold inline-block">
                              {node.branches.filter((b) => b.restaurant.is_active !== false).length} de{' '}
                              {node.branches.length} Sucursales Prendidas
                            </span>
                          )}
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCreateNewBranch(org.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-all"
                              title="Registrar una nueva sucursal bajo esta empresa"
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
                          </div>
                        </td>
                      </tr>

                      {/* Sub-fila de alerta para Organizaciones con 0 sucursales (caso Berman y pizzs) */}
                      {!isOrgCollapsed && node.branches.length === 0 && (
                        <tr className="bg-amber-50/40 border-b border-amber-200/60">
                          <td colSpan={5} className="py-4 px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                              <div className="flex items-center gap-2.5">
                                <Store className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div>
                                  <span className="font-extrabold block">
                                    Empresa matriz registrada sin locales comerciales activos.
                                  </span>
                                  <span className="text-[11px] text-amber-700 block">
                                    Registra su primera sucursal para habilitar su panel de control, KDS y placas NFC.
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleCreateNewBranch(org.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs flex-shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Registrar Primera Sucursal para {org.name}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Filas Nivel 2: Sucursales Físicas de esta Empresa */}
                      {!isOrgCollapsed &&
                        node.branches.map((branchNode) => {
                          const res = branchNode.restaurant;
                          const branchTags = branchNode.tags;
                          const tierInfo = TIERS[res.tier || 2];
                          const isPanelExpanded = !!expandedBranchPanels[res.id];
                          const isBranchOn = res.is_active !== false;

                          return (
                            <React.Fragment key={res.id}>
                              {/* Fila Nivel 2: Sucursal */}
                              <tr className="bg-white hover:bg-blue-50/20 border-b border-slate-100 transition-colors">
                                {/* Col 1: Conector de árbol e Identidad de Sucursal */}
                                <td className="py-3 px-4 pl-8 sm:pl-10">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-slate-300 font-mono text-sm select-none">&bull;</span>

                                    {res.logo_url ? (
                                      <img
                                        src={res.logo_url}
                                        alt={res.name}
                                        className="w-7 h-7 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                        style={{ backgroundColor: res.brand_color || '#2563eb' }}
                                      >
                                        {res.brand_name.charAt(0)}
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-900 text-xs truncate">
                                          {res.brand_name}
                                        </span>
                                        <span className="text-slate-500 font-semibold text-[11px] truncate">
                                          ({res.branch_name})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${tierInfo.badgeColor}`}>
                                          {tierInfo.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">
                                          • {branchNode.capabilities.verticalLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Col 2: Dirección y Teléfono de la Sucursal */}
                                <td className="py-3 px-4">
                                  <div className="space-y-0.5 text-xs text-slate-600">
                                    {res.address ? (
                                      <a
                                        href={
                                          res.google_review_url ||
                                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            res.name + ' ' + res.address
                                          )}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 truncate hover:text-blue-600"
                                      >
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{res.address}</span>
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">Sin dirección</span>
                                    )}
                                    {res.manager_phone && (
                                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        <span>{res.manager_phone}</span>
                                      </div>
                                    )}
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

                                {/* Col 4: Botón Desplegable del Panel de Control de Sucursal (Nivel 3) */}
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => toggleBranchPanel(res.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                      isPanelExpanded
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                        : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/80'
                                    }`}
                                    title="Abrir Panel de Control por Categorías (Placas NFC, Pantallas KDS y Meseros)"
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

                                {/* Col 5: Botonera de Sucursal */}
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
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
                                  </div>
                                </td>
                              </tr>

                              {/* Fila Nivel 3: Panel de Control de la Sucursal por Categorías */}
                              {isPanelExpanded && renderBranchControlPanel(branchNode)}
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
                      const isPanelExpanded = !!expandedBranchPanels[res.id];
                      const isBranchOn = res.is_active !== false;

                      return (
                        <React.Fragment key={res.id}>
                          <tr className="bg-white hover:bg-slate-50 border-b border-slate-100">
                            <td className="py-3 px-4 pl-8">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300">&bull;</span>
                                <span className="font-bold text-slate-900">{res.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{res.address || 'Sin dirección'}</td>
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
                              <button
                                onClick={() => handleEdit(res)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                              >
                                Vincular Empresa
                              </button>
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

      {/* Modal de Alta Express de Organización */}
      <NewOrganizationModal
        isOpen={isNewOrgModalOpen}
        onClose={() => setIsNewOrgModalOpen(false)}
        onCreated={(newOrg) => {
          setOrganizations((prev) => [newOrg, ...prev]);
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
    </div>
  );
};
