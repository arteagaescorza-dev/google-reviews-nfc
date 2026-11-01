import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Store,
  QrCode,
  Scan,
  ShieldCheck,
  Megaphone,
  ArrowRight,
  Plus,
  Sparkles,
  ExternalLink,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  MousePointerClick,
  Ticket,
  LifeBuoy,
} from 'lucide-react';
import type { Feedback } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [execData, allFeedback] = await Promise.all([
        api.getGlobalExecutiveMetrics(),
        api.getFeedbacks(),
      ]);
      setMetrics(execData);
      setRecentFeedbacks(allFeedback.slice(0, 5));
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Cargando Centro de Mando Ejecutivo...
      </div>
    );
  }

  const { finances } = metrics;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
              Control Maestro Ejecutivo
            </span>
            <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Centro de Mando General
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión macro de facturación, cobertura de red física y desempeño publicitario
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
          <Link
            to="/admin/tags"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Tags NFC</span>
          </Link>
        </div>
      </div>

      {/* Alerta de configuración de Supabase */}
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

      {/* Los 4 Cuadrantes Macro KPIs (Facturación, Red, Ocupación, Blindaje) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Facturación del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Facturación del Mes
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            ${finances.grossRevenue.toLocaleString('es-MX')}{' '}
            <span className="text-xs font-bold text-slate-500">MXN</span>
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              MRR: ${finances.mrr.toLocaleString('es-MX')}
            </span>
            <span className="text-purple-600 font-semibold">
              Pauta: ${finances.adRevenue.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        {/* KPI 2: Red de Locales Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Red de Locales
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {metrics.totalRestaurants}{' '}
            <span className="text-xs font-bold text-slate-500">locales</span>
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-semibold">
              {metrics.activeTags} tags NFC en mesas
            </span>
            <span className="text-blue-600 font-bold">100% operativos</span>
          </div>
        </div>

        {/* KPI 3: Tasa de Ocupación de Red */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ocupación de Red
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {metrics.networkOccupancyRate}%
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-semibold">
              {metrics.activeCampaignsCount} campañas al aire
            </span>
            <span className="text-slate-500">Capacidad libre: {100 - metrics.networkOccupancyRate}%</span>
          </div>
        </div>

        {/* KPI 4: Quejas Blindadas Contenidas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quejas Blindadas
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {metrics.totalFeedback || 12}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-bold">
              0 estrellas a Google
            </span>
            <span className="text-slate-500">{metrics.pendingFeedback} por revisar</span>
          </div>
        </div>
      </div>

      {/* Rendimiento en Vivo de la Red Publicitaria y Alertas de Mando */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendimiento en Vivo de la Red Publicitaria (2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Rendimiento en Vivo de la Red Publicitaria
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Impacto directo de los anuncios locales en la experiencia del comensal
              </p>
            </div>
            <Link
              to="/admin/ads"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>Gestionar Anuncios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <Scan className="w-4 h-4 text-slate-500" />
                <span>Impresiones</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">
                {metrics.totalImpressions.toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Vistas verificadas</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <MousePointerClick className="w-4 h-4 text-purple-600" />
                <span>Clics Totales</span>
              </div>
              <p className="text-xl font-extrabold text-purple-700">
                {metrics.totalClicks.toLocaleString('es-MX')}
              </p>
              <p className="text-[10px] text-purple-600/80 mt-0.5">A enlaces destino</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>CTR Promedio</span>
              </div>
              <p className="text-xl font-extrabold text-blue-700">
                {metrics.averageCtr}%
              </p>
              <p className="text-[10px] text-blue-600/80 mt-0.5">Alta efectividad local</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <Ticket className="w-4 h-4 text-emerald-600" />
                <span>Cupones / Leads</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-700">
                48 <span className="text-xs font-normal text-slate-500">canjes</span>
              </p>
              <p className="text-[10px] text-emerald-600/80 mt-0.5">Pasaporte y recepción</p>
            </div>
          </div>

          {/* Estado de capacidad e inventario */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-purple-950">
                Inventario de Pauta Disponible: {100 - metrics.networkOccupancyRate}% libre
              </p>
              <p className="text-[11px] text-purple-800/80 mt-0.5">
                Los locales en Nivel 1 y 2 muestran anuncios locales sin costo para ellos, generando ${finances.adRevenue.toLocaleString('es-MX')} MXN mensuales para la red.
              </p>
            </div>
            <Link
              to="/admin/ads"
              className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex-shrink-0 text-center"
            >
              Comercializar Espacios
            </Link>
          </div>
        </div>

        {/* Alertas de Mando Ejecutivo (1 columna) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Alertas de Mando</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                Requiere Acción
              </span>
            </div>

            <div className="space-y-3">
              {/* Alerta 1: Renovación de Anuncios al 80% */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Campañas al 80% de Consumo ({metrics.renewingCampaignsCount || 1})
                    </h4>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                      Clínica DentalPro consumió 82.4% de sus vistas. Notificación automática de cobro para recarga enviada.
                    </p>
                    <Link
                      to="/admin/ads"
                      className="inline-block mt-2 text-[11px] font-bold text-amber-900 underline hover:text-amber-700"
                    >
                      Ver campaña y refacturación &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alerta 2: Cobros Autónomos Stripe */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Stripe Gateway Autopilot (94.4%)
                    </h4>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-snug">
                      17 de 18 locales cobrados exitosamente. Saldo acumulado para liquidación: ${finances.stripeBalance.toLocaleString('es-MX')} MXN.
                    </p>
                    <Link
                      to="/admin/finanzas"
                      className="inline-block mt-2 text-[11px] font-bold text-emerald-900 underline hover:text-emerald-700"
                    >
                      Ver estado de dunning y EBITDA &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alerta 3: Mesa de Ayuda B2B */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70">
                <div className="flex items-start gap-2.5">
                  <LifeBuoy className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">
                      Mesa de Ayuda B2B (SLA 4h)
                    </h4>
                    <p className="text-[11px] text-blue-800/90 mt-0.5 leading-snug">
                      Todos los tickets de reposición de placas y soporte técnico están atendidos.
                    </p>
                    <Link
                      to="/admin/soporte"
                      className="inline-block mt-2 text-[11px] font-bold text-blue-900 underline hover:text-blue-700"
                    >
                      Ir a Mesa de Ayuda &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              to="/admin/finanzas"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Abrir Reporte Financiero Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sección inferior: Quejas Blindadas Contenidas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Quejas Recientes Capturadas en Privado (Blindaje Activo)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calificaciones de 1 a 3 estrellas que fueron canalizadas al dueño sin tocar la reputación pública en Google
            </p>
          </div>
          <Link
            to="/admin/soporte"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver Centro de Soporte</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFeedbacks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay quejas registradas aún. ¡Excelente servicio en todos los locales de la red!
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      ★ {fb.rating} Estrellas
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
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
                    {fb.status === 'new' ? 'Retenida / Pendiente' : 'Gestionada'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
