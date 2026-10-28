import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Store,
  QrCode,
  Scan,
  MessageSquareWarning,
  Megaphone,
  ArrowRight,
  Plus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { Feedback } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalRestaurants: 0,
    activeTags: 0,
    totalTags: 0,
    activeAds: 0,
    totalScans: 0,
    pendingFeedback: 0,
    totalFeedback: 0,
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const metrics = await api.getDashboardKpis();
      const allFeedback = await api.getFeedbacks();
      setKpis(metrics);
      setRecentFeedbacks(allFeedback.slice(0, 5));
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Cargando métricas del panel...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel General</h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas clave de operación de tags, reputación y publicidad
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Restaurante</span>
          </Link>
          <Link
            to="/admin/tags"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Generar Tags</span>
          </Link>
        </div>
      </div>

      {/* Alerta de configuración de Supabase */}
      {!isSupabaseConfigured && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Operando en Modo Demo Local</h4>
              <p className="text-xs text-amber-700/90 mt-0.5">
                Los datos se guardan en el navegador. Cuando estés listo para producción, añade tus variables de Supabase en el archivo <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-[11px]">.env</code> para sincronizar con la nube PostgreSQL.
              </p>
            </div>
          </div>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            <span>Crear Supabase Gratis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Tarjetas de métricas (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Restaurantes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sucursales</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.totalRestaurants}</p>
          <p className="text-[11px] text-slate-500 mt-1">Locales activos</p>
        </div>

        {/* Tags NFC */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tags NFC</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.activeTags}</p>
          <p className="text-[11px] text-slate-500 mt-1">{kpis.totalTags} registrados en total</p>
        </div>

        {/* Escaneos Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Escaneos Totales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Scan className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.totalScans}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Interacciones de clientes</p>
        </div>

        {/* Quejas Retenidas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quejas Privadas</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{kpis.pendingFeedback}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {kpis.totalFeedback} quejas contenidas sin ir a Google
          </p>
        </div>
      </div>

      {/* Sección inferior: Quejas recientes contenidas y Red publicitaria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de quejas recientes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Quejas Recientes Capturadas en Privado</h2>
              <p className="text-xs text-slate-400">Calificaciones de 1 a 3 estrellas que no dañaron la ficha de Google</p>
            </div>
            <Link
              to="/admin/feedback"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentFeedbacks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay quejas registradas aún. ¡Excelente servicio!
            </div>
          ) : (
            <div className="space-y-3">
              {recentFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        ★ {fb.rating} Estrellas
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {fb.customer_name || 'Comensal Anónimo'}
                      </span>
                      {fb.customer_phone && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {fb.customer_phone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 italic">
                      "{fb.comments}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        fb.status === 'new'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {fb.status === 'new' ? 'Pendiente' : 'Revisado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tarjeta de estado de la red de anuncios */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Red Publicitaria</h2>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Monetiza mostrando anuncios en las pantallas de los restaurantes que no pagaron por eliminarlos.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Campañas activas:</span>
                <span className="font-bold text-slate-800">{kpis.activeAds}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Segmentación soportada:</span>
                <span className="font-bold text-slate-800">Por tag / local</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/ads"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Gestionar Campañas de Anuncios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
