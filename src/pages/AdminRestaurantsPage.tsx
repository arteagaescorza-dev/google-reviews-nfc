import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Restaurant, Organization } from '../types';
import { RestaurantFormModal } from '../components/admin/RestaurantFormModal';
import { OrganizationUserModal } from '../components/admin/OrganizationUserModal';
import { TIERS } from '../lib/constants';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedOrgForUserModal, setSelectedOrgForUserModal] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    const [resList, orgList] = await Promise.all([
      api.getRestaurants(),
      api.getOrganizations(),
    ]);
    setRestaurants(resList);
    setOrganizations(orgList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (r: Restaurant) => {
    setEditingRestaurant(r);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sucursales & Restaurantes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de perfiles de clientes, paquetes de reputación y enlaces a Google
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedOrgForUserModal(undefined);
              setIsUserModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Accesos al Portal</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Sucursal</span>
          </button>
        </div>
      </div>

      {/* Lista de restaurantes */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Cargando sucursales...</div>
      ) : restaurants.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aún no hay sucursales registradas</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Crea tu primer cliente para comenzar a asignar tags NFC.</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Crear Primer Restaurante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((res) => {
            const tierInfo = TIERS[res.tier || 2];
            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Borde superior con color de marca */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: res.brand_color || '#2563eb' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {res.logo_url ? (
                        <img
                          src={res.logo_url}
                          alt={res.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0"
                          style={{ backgroundColor: res.brand_color || '#2563eb' }}
                        >
                          {res.brand_name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{res.brand_name}</h3>
                        <span className="text-xs text-slate-500 block truncate">{res.branch_name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEdit(res)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges de estado */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${tierInfo.badgeColor}`}>
                      {tierInfo.name}
                    </span>

                    {res.is_ad_free ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Ad-Free (Marca Blanca)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Con Anuncios
                      </span>
                    )}
                  </div>

                  {/* Detalles adicionales */}
                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    {res.address && (
                      <a
                        href={res.google_review_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.name + ' ' + res.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 truncate hover:text-blue-600 transition-colors group"
                        title="Ver ubicación en Google Maps"
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

                {/* Acciones del pie de la tarjeta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <a
                    href={res.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                      title="Gestionar usuarios del portal para esta organización"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Acceso Portal</span>
                    </button>

                    <Link
                      to={`/admin/tags?restaurant=${res.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Ver Tags</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Alta / Edición de Restaurante */}
      <RestaurantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        restaurant={editingRestaurant}
        organizations={organizations}
      />

      {/* Modal de Accesos al Portal de Suscriptores */}
      <OrganizationUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        organizations={organizations}
        preselectedOrgId={selectedOrgForUserModal}
      />
    </div>
  );
};
