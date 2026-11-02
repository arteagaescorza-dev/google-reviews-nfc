import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type { Restaurant, Organization, Tag } from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { NewOrganizationModal } from '../components/admin/NewOrganizationModal';
import { TIERS } from '../lib/constants';
import {
  calculateRestaurantKpis,
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
  ChevronRight,
  User,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda y segmentación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Estado de colapsado en el Árbol Tabular (Nivel 1 Organizaciones y Nivel 2 Sucursales)
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

  const kpis = useMemo(() => {
    return calculateRestaurantKpis(restaurants, tags);
  }, [restaurants, tags]);

  // Construcción del Árbol Jerárquico en 3 Niveles
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
              Capa 2: Directorio de Cuentas & Árbol de Clientes
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-002</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Cuentas & Sucursales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Estructura jerárquica en filas de 3 niveles: Empresa Matriz &rarr; Sucursal Física &rarr; Placas NFC en Mesa.
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

      {/* Barra de Filtros, Selector de Organización y Expansión */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Campo de búsqueda reactivo */}
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
            <option value="active">Solo Locales Activos</option>
            <option value="paused">Solo Locales Pausados</option>
          </select>

          {/* Botones de Expansión del Árbol */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              title="Expandir todas las empresas, sucursales y placas"
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
          Cargando estructura jerárquica de cuentas...
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
                  <th className="py-3.5 px-4 min-w-[280px]">Entidad & Jerarquía</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Titular / Ubicación</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Paquete & Pauta</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Hardware NFC</th>
                  <th className="py-3.5 px-4 min-w-[200px] text-right">Acciones Ejecutivas</th>
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

                        {/* Col 3: Paquete y Estado Corporativo */}
                        <td className="py-3.5 px-4">
                          {node.branches.length === 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold inline-flex items-center gap-1">
                              <span>0 Sucursales Asignadas</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold inline-block">
                                {node.branches.length} Sucursales Físicas
                              </span>
                            </div>
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
                                    Registra su primera sucursal para vincular su ficha de Google Reviews y asignar placas NFC a las mesas.
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
                          const areTagsExpanded = !!expandedBranchTags[res.id];

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
                                      <span className="text-[10px] text-slate-400 font-semibold block">
                                        Nivel 2: Sucursal Física
                                      </span>
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

                                {/* Col 3: Paquete y Modalidad Ad-Free */}
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                    <span className={`px-2 py-0.5 rounded-lg border ${tierInfo.badgeColor}`}>
                                      {tierInfo.name}
                                    </span>
                                    {res.is_ad_free ? (
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>Ad-Free</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                        Red Ads
                                      </span>
                                    )}
                                    {res.is_active === false && (
                                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                        Pausado
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Col 4: Toggle de Placas NFC (Nivel 3) */}
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => toggleBranchTags(res.id)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                      areTagsExpanded
                                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                    }`}
                                    title="Desplegar hardware NFC asignado en mesas"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                                    <span>{branchTags.length} Placas en Mesa</span>
                                    {areTagsExpanded ? (
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

                              {/* Filas Nivel 3: Placas NFC en Mesa (Sub-filas de hardware) */}
                              {areTagsExpanded && (
                                <>
                                  {branchTags.length === 0 ? (
                                    <tr className="bg-purple-50/15 border-b border-purple-100/60">
                                      <td colSpan={5} className="py-2.5 px-4 pl-16 sm:pl-20 text-[11px] text-slate-400 italic">
                                        No hay placas asignadas a este local. Asigna códigos NFC desde el Activador In-Situ en{' '}
                                        <Link
                                          to={`/admin/tags?restaurant=${res.id}`}
                                          className="text-blue-600 font-bold hover:underline"
                                        >
                                          /admin/tags
                                        </Link>
                                        .
                                      </td>
                                    </tr>
                                  ) : (
                                    branchTags.map((tag) => (
                                      <tr
                                        key={tag.id}
                                        className="bg-purple-50/20 hover:bg-purple-50/40 border-b border-purple-100/50 transition-colors text-xs"
                                      >
                                        {/* Col 1: Indentación de Tag */}
                                        <td className="py-2 px-4 pl-14 sm:pl-16">
                                          <div className="flex items-center gap-2">
                                            <span className="text-purple-300 font-mono text-xs select-none">└──</span>
                                            <QrCode className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                            <span className="font-mono font-bold text-slate-800">
                                              {tag.tag_code}
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                                              Nivel 3: Hardware
                                            </span>
                                          </div>
                                        </td>

                                        {/* Col 2: Mesa asignada */}
                                        <td className="py-2 px-4 text-slate-700 font-semibold text-[11px]">
                                          {tag.table_identifier ? (
                                            <span>Mesa: {tag.table_identifier}</span>
                                          ) : (
                                            <span className="text-slate-400 italic">Sin mesa especificada</span>
                                          )}
                                        </td>

                                        {/* Col 3: Estado del chip */}
                                        <td className="py-2 px-4 text-slate-500 text-[11px]">
                                          {tag.is_active !== false ? (
                                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              <span>Activo en mesa</span>
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">Desactivado</span>
                                          )}
                                        </td>

                                        {/* Col 4: Escaneos acumulados */}
                                        <td className="py-2 px-4 text-slate-600 font-bold text-[11px]">
                                          {tag.scan_count || 0} escaneos
                                        </td>

                                        {/* Col 5: Acción Probar */}
                                        <td className="py-2 px-4 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <a
                                              href={`/?t=${tag.tag_code}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                              title="Probar resolución del chip en navegador"
                                            >
                                              <span>Probar ?t=</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>

                                            <Link
                                              to={`/admin/tags?restaurant=${res.id}`}
                                              className="text-[10px] text-slate-400 hover:text-slate-600"
                                              title="Ver en gestión de tags"
                                            >
                                              Configurar
                                            </Link>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </>
                              )}
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

                      return (
                        <tr key={res.id} className="bg-white hover:bg-slate-50 border-b border-slate-100">
                          <td className="py-3 px-4 pl-8">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">&bull;</span>
                              <span className="font-bold text-slate-900">{res.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{res.address || 'Sin dirección'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${tierInfo.badgeColor}`}>
                              {tierInfo.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                              {branchTags.length} Placas
                            </span>
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
