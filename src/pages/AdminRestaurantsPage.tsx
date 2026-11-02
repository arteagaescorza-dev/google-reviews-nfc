import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import type { Restaurant, Organization, Tag } from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { NewOrganizationModal } from '../components/admin/NewOrganizationModal';
import { TIERS } from '../lib/constants';
import { calculateRestaurantKpis, filterRestaurants } from '../lib/restaurants_bento';
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
  Filter,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
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

  const filteredList = useMemo(() => {
    return filterRestaurants(restaurants, searchQuery, selectedOrgFilter, selectedTierFilter);
  }, [restaurants, searchQuery, selectedOrgFilter, selectedTierFilter]);

  const handleEdit = (r: Restaurant) => {
    setEditingRestaurant(r);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Encabezado Bento Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Capa 2: Gestión de Locales & Clientes
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-002</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sucursales & Restaurantes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directorio de cuentas corporativas, asignación de hardware físico, nivel de servicio y accesos al portal.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewOrgModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition-all"
            title="Alta express en calle para registrar un nuevo negocio en 30 segundos"
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
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Sucursal</span>
          </button>
        </div>
      </div>

      {/* Fila Superior de KPIs Bento (Col-Span-4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Locales Activos */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Locales Operativos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.activeBranches}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {kpis.totalBranches}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{kpis.activeBranches} sucursales activas en calle</span>
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

      {/* Barra de Filtros y Búsqueda en Vivo */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Campo de búsqueda */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por marca, sucursal, dirección o teléfono..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
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

        {/* Selectores de filtrado */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Filtros:</span>
          </div>

          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todas las Empresas</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
            <option value="independent">Sin Organización (Independientes)</option>
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
            <option value="with_ads">Con Red de Anuncios</option>
            <option value="active">Solo Locales Activos</option>
            <option value="paused">Solo Locales en Pausa</option>
          </select>

          <span className="text-[11px] font-bold text-slate-400 ml-auto md:ml-2">
            {filteredList.length} de {restaurants.length}
          </span>
        </div>
      </div>

      {/* Grid de Tarjetas Bento de Restaurantes */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Cargando directorio de sucursales...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">No se encontraron sucursales</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {searchQuery || selectedOrgFilter !== 'all' || selectedTierFilter !== 'all'
              ? 'Intenta ajustar los criterios de búsqueda o filtros seleccionados.'
              : 'Registra tu primer cliente para comenzar a asignar placas NFC en mesa.'}
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            Crear Primera Sucursal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((res) => {
            const tierInfo = TIERS[res.tier || 2];
            const tagsCount = tagsCountByRes[res.id] || 0;
            const orgName = res.organization_id ? orgMap[res.organization_id] : null;

            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Borde superior con acento del color de marca */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: res.brand_color || '#2563eb' }}
                />

                <div>
                  {/* Cabecera de la Tarjeta */}
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
                          {res.is_active === false && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold">
                              Pausado
                            </span>
                          )}
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
                      title="Editar Sucursal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pastillas de Estado y Hardware */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${tierInfo.badgeColor}`}>
                      {tierInfo.name}
                    </span>

                    {res.is_ad_free ? (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Ad-Free (Marca Blanca)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Red de Anuncios
                      </span>
                    )}

                    <Link
                      to={`/admin/tags?restaurant=${res.id}`}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 hover:bg-blue-100 transition-colors"
                      title="Ver placas asignadas a este local"
                    >
                      <QrCode className="w-3 h-3 text-blue-600" />
                      <span>{tagsCount} Placas en Mesa</span>
                    </Link>
                  </div>

                  {/* Detalles de Ubicación y Contacto */}
                  <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
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
                        className="flex items-center gap-2 truncate hover:text-blue-600 transition-colors group"
                        title="Ver en Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                        <span className="truncate group-hover:underline">{res.address}</span>
                      </a>
                    )}
                    {res.manager_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{res.manager_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Ejecutivas al Pie */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <a
                    href={res.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <span>Ficha Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrgForUserModal(res.organization_id || undefined);
                        setIsUserModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                      title="Gestionar usuarios y accesos al portal"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Accesos</span>
                    </button>

                    <Link
                      to={`/admin/tags?restaurant=${res.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Tags</span>
                    </Link>

                    <Link
                      to={`/portal?restaurantId=${res.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs"
                      title="Abrir el portal del suscriptor para este local"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Portal</span>
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
