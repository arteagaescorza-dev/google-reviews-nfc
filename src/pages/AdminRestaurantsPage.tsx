import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type { Restaurant, Organization, Tag } from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { NewOrganizationModal } from '../components/admin/NewOrganizationModal';
import { TIERS } from '../lib/constants';
import {
  calculateRestaurantKpis,
  filterRestaurants,
  buildOrganizationTree,
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
  ChevronUp,
  User,
  Mail,
  ListTree,
  LayoutGrid,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualización: Árbol Jerárquico de 3 Niveles (default) vs Cuadrícula Plana
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Estado de colapsado en el Árbol
  const [collapsedOrgs, setCollapsedOrgs] = useState<Record<string, boolean>>({});
  const [expandedBranchTags, setExpandedBranchTags] = useState<Record<string, boolean>>({});

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [preselectedOrgForNewBranch, setPreselectedOrgForNewBranch] = useState<string | undefined>(undefined);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedOrgForUserModal, setSelectedOrgForUserModal] = useState<string | undefined>(undefined);
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [resList, orgList, tagList] = await Promise.all([
      api.getRestaurants(),
      api.getOrganizations(),
      api.getTags(),
    ]);
    setRestaurants(resList);
    setOrganizations(orgList);
    setTags(tagList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tagsCountByRes = useMemo(() => {
    const map: Record<string, number> = {};
    tags.forEach((t) => {
      if (t.restaurant_id) {
        map[t.restaurant_id] = (map[t.restaurant_id] || 0) + 1;
      }
    });
    return map;
  }, [tags]);

  const orgMap = useMemo(() => {
    const map: Record<string, string> = {};
    organizations.forEach((o) => {
      map[o.id] = o.name;
    });
    return map;
  }, [organizations]);

  const kpis = useMemo(() => {
    return calculateRestaurantKpis(restaurants, tags);
  }, [restaurants, tags]);

  // Estructura de Árbol Jerárquico de 3 Niveles
  const treeData = useMemo(() => {
    return buildOrganizationTree(
      organizations,
      restaurants,
      tags,
      searchQuery,
      selectedOrgFilter,
      selectedTierFilter
    );
  }, [organizations, restaurants, tags, searchQuery, selectedOrgFilter, selectedTierFilter]);

  // Lista plana filtrada (para modo grid alternativo)
  const filteredFlatList = useMemo(() => {
    return filterRestaurants(restaurants, searchQuery, selectedOrgFilter, selectedTierFilter);
  }, [restaurants, searchQuery, selectedOrgFilter, selectedTierFilter]);

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

  const toggleBranchTags = (restaurantId: string) => {
    setExpandedBranchTags((prev) => ({
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
    setExpandedBranchTags(branchMap);
  };

  const handleCollapseAll = () => {
    const orgCollapseMap: Record<string, boolean> = {};
    organizations.forEach((o) => {
      orgCollapseMap[o.id] = true;
    });
    setCollapsedOrgs(orgCollapseMap);
    setExpandedBranchTags({});
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16">
      {/* Encabezado Bento Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Capa 2: Gestión de Cuentas & Árbol de Clientes
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-002</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Cuentas & Sucursales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Estructura corporativa en 3 niveles: Empresa Matriz &rarr; Sucursales Físicas &rarr; Hardware NFC en Mesa.
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
              <span>{kpis.activeBranches} sucursales físicas activas</span>
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

      {/* Barra de Filtros, Selector de Modo y Expansión */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Campo de búsqueda */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por empresa, dueño, sucursal, tag o teléfono..."
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

        {/* Controles de Filtros y Vistas */}
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
            <option value="active">Solo Locales Activos</option>
            <option value="paused">Solo Locales Pausados</option>
          </select>

          {/* Selector de Modo: Árbol vs Grid */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'tree'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ver jerarquía en Árbol de 3 Niveles (Empresa > Sucursal > Placas)"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Árbol (3 Niveles)</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ver en cuadrícula plana de sucursales"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula</span>
            </button>
          </div>

          {/* Botones de Expansión (Solo en Árbol) */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                title="Expandir todas las empresas y tags"
              >
                Expandir
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                title="Colapsar todas las empresas"
              >
                Colapsar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Cargando estructura jerárquica de cuentas...
        </div>
      ) : viewMode === 'tree' ? (
        /* ========================================================================= */
        /* VISTA EN ÁRBOL DE 3 NIVELES (Organización -> Sucursales -> Placas NFC)      */
        /* ========================================================================= */
        <div className="space-y-6">
          {treeData.organizations.length === 0 && treeData.independentBranches.length === 0 ? (
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
            <>
              {/* Nivel 1: Lista de Organizaciones / Empresas Matrices */}
              {treeData.organizations.map((node) => {
                const org = node.organization;
                const isCollapsed = !!collapsedOrgs[org.id];

                return (
                  <div
                    key={org.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* NIVEL 1: Encabezado Corporativo de la Empresa */}
                    <div className="p-5 sm:p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                              {org.name}
                            </h2>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                              Nivel 1: Empresa Matriz
                            </span>
                            {node.branches.length === 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                                Sin Sucursales Asignadas
                              </span>
                            )}
                          </div>

                          {/* Metadatos del Dueño/Titular */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            {org.owner_name && (
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{org.owner_name}</span>
                              </div>
                            )}
                            {org.owner_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{org.owner_phone}</span>
                              </div>
                            )}
                            {org.owner_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{org.owner_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pastillas de Métricas y Acciones de Organización */}
                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                            {node.branches.length} Sucursales
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                            {node.totalTagsCount} Placas en Mesa
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCreateNewBranch(org.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-2xs"
                            title="Dar de alta una nueva sucursal bajo esta empresa"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Sucursal</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrgForUserModal(org.id);
                              setIsUserModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                            title="Gestionar accesos al portal para esta empresa"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span>Accesos</span>
                          </button>

                          <button
                            onClick={() => toggleOrgCollapse(org.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title={isCollapsed ? 'Desplegar sucursales' : 'Colapsar sucursales'}
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CUERPO DEL NIVEL 1: Sucursales y Placas */}
                    {!isCollapsed && (
                      <div className="p-5 sm:p-6 bg-white space-y-4">
                        {node.branches.length === 0 ? (
                          /* Estado Vacío de la Empresa (Resuelve el caso de Berman y pizzs) */
                          <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                            <Store className="w-8 h-8 text-slate-400 mb-2" />
                            <h4 className="text-sm font-extrabold text-slate-800">
                              Esta empresa aún no tiene sucursales físicas registradas
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md">
                              Registra su primer local comercial para vincular su ficha de Google Reviews y asignar placas NFC en mesas.
                            </p>
                            <button
                              onClick={() => handleCreateNewBranch(org.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Registrar Primera Sucursal para {org.name}</span>
                            </button>
                          </div>
                        ) : (
                          /* NIVEL 2: Sucursales Físicas de la Empresa */
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {node.branches.map((branchNode) => {
                              const res = branchNode.restaurant;
                              const branchTags = branchNode.tags;
                              const tierInfo = TIERS[res.tier || 2];
                              const areTagsExpanded = !!expandedBranchTags[res.id];

                              return (
                                <div
                                  key={res.id}
                                  className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden group"
                                >
                                  {/* Acento lateral/superior de color de marca */}
                                  <div
                                    className="absolute top-0 left-0 right-0 h-1"
                                    style={{ backgroundColor: res.brand_color || '#2563eb' }}
                                  />

                                  {/* Cabecera de la Sucursal (Nivel 2) */}
                                  <div className="flex items-start justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {res.logo_url ? (
                                        <img
                                          src={res.logo_url}
                                          alt={res.name}
                                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                        />
                                      ) : (
                                        <div
                                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                                          style={{ backgroundColor: res.brand_color || '#2563eb' }}
                                        >
                                          {res.brand_name.charAt(0)}
                                        </div>
                                      )}

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                            {res.brand_name}
                                          </h4>
                                          <span className="text-xs text-slate-500 font-semibold truncate">
                                            &bull; {res.branch_name}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 block">
                                          Nivel 2: Sucursal Física
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleEdit(res)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                                      title="Editar Sucursal"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Badges de Paquete y Pauta */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                    <span className={`px-2 py-0.5 rounded-lg border ${tierInfo.badgeColor}`}>
                                      {tierInfo.name}
                                    </span>

                                    {res.is_ad_free ? (
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        <span>Ad-Free</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                        Red de Anuncios
                                      </span>
                                    )}

                                    {res.is_active === false && (
                                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                        Pausado
                                      </span>
                                    )}
                                  </div>

                                  {/* Dirección y Teléfono */}
                                  <div className="text-xs text-slate-500 space-y-1">
                                    {res.address && (
                                      <a
                                        href={
                                          res.google_review_url ||
                                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            res.name + ' ' + res.address
                                          )}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 truncate hover:text-blue-600"
                                      >
                                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{res.address}</span>
                                      </a>
                                    )}
                                  </div>

                                  {/* Botonera de Sucursal */}
                                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 flex-wrap text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={res.google_review_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600"
                                      >
                                        <span>Ficha Google</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        to={`/portal?restaurantId=${res.id}`}
                                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold"
                                      >
                                        Portal
                                      </Link>

                                      <button
                                        onClick={() => toggleBranchTags(res.id)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                          areTagsExpanded
                                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                                            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                        }`}
                                        title="Ver placas NFC en mesa (Nivel 3)"
                                      >
                                        <QrCode className="w-3 h-3" />
                                        <span>{branchTags.length} Placas en Mesa</span>
                                        {areTagsExpanded ? (
                                          <ChevronUp className="w-3 h-3" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* NIVEL 3: Placas NFC & Mesas Físicas Desplegadas */}
                                  {areTagsExpanded && (
                                    <div className="mt-3 pt-3 border-t border-purple-100 bg-white/90 p-3 rounded-xl border border-purple-100/80 space-y-2">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-extrabold text-purple-900 uppercase tracking-wider">
                                          Nivel 3: Hardware Desplegado en Mesas
                                        </span>
                                        <Link
                                          to={`/admin/tags?restaurant=${res.id}`}
                                          className="text-blue-600 hover:underline font-bold text-[10px]"
                                        >
                                          + Administrar Tags
                                        </Link>
                                      </div>

                                      {branchTags.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic py-1">
                                          No hay placas físicas asignadas a este local. Graba una antena NFC desde el Activador In-Situ.
                                        </p>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                          {branchTags.map((tag) => (
                                            <div
                                              key={tag.id}
                                              className="p-2 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <QrCode className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                  <span className="font-mono font-bold text-slate-900 block truncate">
                                                    {tag.tag_code}
                                                  </span>
                                                  <span className="text-[10px] text-slate-500 block truncate">
                                                    {tag.table_identifier || 'Sin mesa asignada'}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="text-right flex-shrink-0 pl-2">
                                                <span className="text-[10px] font-bold text-slate-600 block">
                                                  {tag.scan_count || 0} esc.
                                                </span>
                                                <a
                                                  href={`/?t=${tag.tag_code}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-[9px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                                  title="Probar resolución del tag"
                                                >
                                                  <span>Probar</span>
                                                  <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                              </div>
                                            </div>
                                          ))}
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
                    )}
                  </div>
                );
              })}

              {/* SECCIÓN ESPECIAL: Locales Independientes (Sin Organización Asignada) */}
              {treeData.independentBranches.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Store className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight">
                          Locales Comerciales Independientes
                        </h2>
                        <p className="text-xs text-slate-500">
                          Sucursales dadas de alta en frío sin una empresa matriz vinculada.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                      {treeData.independentBranches.length} Locales
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    {treeData.independentBranches.map((branchNode) => {
                      const res = branchNode.restaurant;
                      const branchTags = branchNode.tags;
                      const tierInfo = TIERS[res.tier || 2];

                      return (
                        <div
                          key={res.id}
                          className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">{res.name}</h4>
                              <span className="text-xs text-slate-500">{res.address || 'Sin dirección'}</span>
                            </div>
                            <button
                              onClick={() => handleEdit(res)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded-lg border ${tierInfo.badgeColor}`}>
                              {tierInfo.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                              {branchTags.length} Placas en Mesa
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA EN CUADRÍCULA PLANA ALTERNATIVA                                     */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFlatList.map((res) => {
            const tierInfo = TIERS[res.tier || 2];
            const tagsCount = tagsCountByRes[res.id] || 0;
            const orgName = res.organization_id ? orgMap[res.organization_id] : null;

            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: res.brand_color || '#2563eb' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {res.logo_url ? (
                        <img
                          src={res.logo_url}
                          alt={res.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 flex-shrink-0 shadow-xs"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: res.brand_color || '#2563eb' }}
                        >
                          {res.brand_name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
                            {res.brand_name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                          {res.branch_name}
                        </span>
                        {orgName && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{orgName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEdit(res)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${tierInfo.badgeColor}`}>
                      {tierInfo.name}
                    </span>
                    <Link
                      to={`/admin/tags?restaurant=${res.id}`}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3 text-blue-600" />
                      <span>{tagsCount} Placas en Mesa</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <a
                    href={res.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600"
                  >
                    <span>Ficha Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/portal?restaurantId=${res.id}`}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      Portal
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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
