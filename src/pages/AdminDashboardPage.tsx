import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Plus,
  Package,
  DollarSign,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ExecutiveRevenueBento } from '../components/admin/ExecutiveRevenueBento';
import { ExecutiveMiniWidgetsBento } from '../components/admin/ExecutiveMiniWidgetsBento';
import { ExecutiveLiveFeedBento } from '../components/admin/ExecutiveLiveFeedBento';
import type { ExecutiveEvent } from '../lib/api/events';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<ExecutiveEvent[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [execData, liveEvents] = await Promise.all([
        api.getGlobalExecutiveMetrics(),
        api.getLiveEventsFeed(25),
      ]);
      setMetrics(execData);
      setEvents(liveEvents);
    } catch (err) {
      console.error('Error cargando métricas ejecutivas:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Suscripción reactiva a eventos en vivo (Supabase Realtime)
    const unsubscribe = api.subscribeToLiveEvents((newEvent) => {
      setEvents((prev) => [newEvent, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [loadDashboardData]);

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  if (loading || !metrics) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        <p>Cargando Centro de Mando Ejecutivo...</p>
      </div>
    );
  }

  const {
    revenueBreakdown,
    hardwareSummary,
    salesSummary,
    totalRestaurants,
    activeTags,
    networkOccupancyRate,
  } = metrics;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Encabezado Principal Bento Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold tracking-wider uppercase border border-blue-100">
              Control Maestro Ejecutivo
            </span>
            <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Mando General
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión macro de facturación consolidada, stock de hardware físico y pipeline de ventas B2B
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/hardware"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all"
          >
            <Package className="w-4 h-4 text-slate-600" />
            <span>Bodega & Insumos</span>
          </Link>
          <Link
            to="/admin/finanzas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas & EBITDA</span>
          </Link>
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Sucursal</span>
          </Link>
        </div>
      </div>

      {/* Alerta de Modo de Operación Supabase */}
      {!isSupabaseConfigured && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Operando en Modo Demo Local Reactivo</h4>
              <p className="text-xs text-amber-700/90 mt-0.5">
                Datos persistidos localmente. La consola ejecutiva emula métricas consolidadas de cobro autónomo y red de pauta.
              </p>
            </div>
          </div>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            <span>Conectar Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Rejilla Bento Box: Fila 1 (Facturación Asimétrica + Mini-Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col-Span-7: UI-RS-01 Facturación Consolidada */}
        <div className="lg:col-span-7 flex flex-col">
          <ExecutiveRevenueBento breakdown={revenueBreakdown} />
        </div>

        {/* Col-Span-5: UI-RS-02 Mini-Widgets de Stock, Pipeline y Red */}
        <div className="lg:col-span-5 flex flex-col">
          <ExecutiveMiniWidgetsBento
            hardware={hardwareSummary}
            sales={salesSummary}
            totalRestaurants={totalRestaurants}
            activeTags={activeTags}
            networkOccupancyRate={networkOccupancyRate}
          />
        </div>
      </div>

      {/* Rejilla Bento Box: Fila 2 (Feed Operativo en Tiempo Real) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Col-Span-12: UI-RS-03 Feed de Eventos */}
        <ExecutiveLiveFeedBento
          events={events}
          onRefresh={handleRefreshFeed}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};
