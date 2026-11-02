import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Feedback, FeedbackStatus, Restaurant } from '../types';
import {
  MessageSquareWarning,
  Star,
  Phone,
  Mail,
  Filter,
  MessageCircle,
  ArrowLeft,
  Store,
} from 'lucide-react';

export const AdminFeedbackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRestaurantParam = searchParams.get('restaurant') || 'all';

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRestaurant, setFilterRestaurant] = useState<string>(initialRestaurantParam);

  const loadData = async () => {
    setLoading(true);
    const [list, resList] = await Promise.all([api.getFeedbacks(), api.getRestaurants()]);
    setFeedbacks(list);
    setRestaurants(resList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const param = searchParams.get('restaurant');
    if (param) {
      setFilterRestaurant(param);
    }
  }, [searchParams]);

  const handleUpdateStatus = async (id: string, status: FeedbackStatus) => {
    await api.updateFeedbackStatus(id, status);
    loadData();
  };

  const handleRestaurantChange = (resId: string) => {
    setFilterRestaurant(resId);
    if (resId === 'all') {
      searchParams.delete('restaurant');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ restaurant: resId });
    }
  };

  const filtered = feedbacks.filter((f) => {
    if (filterRestaurant !== 'all' && f.restaurant_id !== filterRestaurant) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const activeBranch = restaurants.find((r) => r.id === filterRestaurant);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/restaurants"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Volver a Directorio de Sucursales</span>
            </Link>
            {activeBranch && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Sucursal: {activeBranch.brand_name} ({activeBranch.branch_name})
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Solicitudes & Buzón de Quejas Privadas (1 a 3 Estrellas)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Opiniones negativas retenidas por el Escudo Reputacional antes de llegar a Google Maps
          </p>
        </div>

        {/* Filtros por sucursal y estado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterRestaurant}
              onChange={(e) => handleRestaurantChange(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">Todas las Sucursales ({feedbacks.length})</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.brand_name} ({r.branch_name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">Todos los Estados ({filtered.length})</option>
              <option value="new">
                Nuevas / Pendientes ({filtered.filter((f) => f.status === 'new').length})
              </option>
              <option value="reviewed">Revisadas</option>
              <option value="contacted">Cliente Contactado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
          Cargando buzón de quejas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            No hay solicitudes de quejas registradas para esta selección
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeBranch
              ? `La sucursal ${activeBranch.brand_name} (${activeBranch.branch_name}) tiene 0 quejas pendientes en este filtro.`
              : 'Los comensales que han calificado están satisfechos o el filtro seleccionado está vacío.'}
          </p>
          {filterRestaurant !== 'all' && (
            <button
              onClick={() => handleRestaurantChange('all')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Ver Quejas de Todas las Sucursales
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fb) => {
            const cleanPhone = fb.customer_phone?.replace(/[^0-9]/g, '');
            const whatsappUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(
                  fb.customer_name || 'estimado cliente'
                )},%20te%20escribimos%20de%20parte%20de%20la%20gerencia%20respecto%20a%20tu%20reciente%20visita.`
              : null;

            return (
              <div
                key={fb.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{fb.rating} Estrellas</span>
                    </span>

                    <div>
                      <span className="font-bold text-sm text-slate-900">
                        {fb.restaurant?.name || activeBranch?.name || 'Sucursal'}
                      </span>
                      {fb.tag_code && (
                        <span className="ml-2 text-xs font-mono text-slate-400">
                          (Tag: {fb.tag_code})
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(fb.created_at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {/* Comentario del cliente */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed italic">
                  "{fb.comments}"
                </div>

                {/* Contacto del cliente y acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {fb.customer_name || 'Comensal Anónimo'}
                    </span>

                    {fb.customer_phone && (
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {fb.customer_phone}
                      </span>
                    )}

                    {fb.customer_email && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {fb.customer_email}
                      </span>
                    )}
                  </div>

                  {/* Acciones de atención */}
                  <div className="flex items-center gap-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contactar por WhatsApp</span>
                      </a>
                    )}

                    <select
                      value={fb.status}
                      onChange={(e) => handleUpdateStatus(fb.id, e.target.value as FeedbackStatus)}
                      className={`text-xs font-bold rounded-xl border px-2.5 py-1.5 focus:outline-none transition-colors ${
                        fb.status === 'new'
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : fb.status === 'contacted'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <option value="new">Pendiente</option>
                      <option value="reviewed">Revisado</option>
                      <option value="contacted">Contactado</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
