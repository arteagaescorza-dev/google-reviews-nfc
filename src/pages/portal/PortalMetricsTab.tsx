import React, { useEffect, useState } from 'react';
import type { Restaurant, Feedback, Tag } from '../../types';
import { api } from '../../lib/api';
import {
  ShieldAlert,
  Star,
  QrCode,
  Award,
  Sparkles,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface PortalMetricsTabProps {
  restaurants: Restaurant[];
  feedbacks: Feedback[];
  selectedRestaurantId: string;
}

export const PortalMetricsTab: React.FC<PortalMetricsTabProps> = ({
  restaurants,
  feedbacks,
  selectedRestaurantId,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    async function loadTags() {
      const allTags = await api.getTags();
      setTags(allTags);
    }
    loadTags();
  }, []);

  // Filtrar según sucursal seleccionada
  const targetRestaurants =
    selectedRestaurantId && selectedRestaurantId !== 'all'
      ? restaurants.filter((r) => r.id === selectedRestaurantId)
      : restaurants;

  const targetRestaurantIds = new Set(targetRestaurants.map((r) => r.id));

  // Filtrar tags y quejas
  const relevantTags = tags.filter((t) => t.restaurant_id && targetRestaurantIds.has(t.restaurant_id));
  const relevantFeedbacks = feedbacks.filter((f) => targetRestaurantIds.has(f.restaurant_id));

  // Cálculos de métricas clave para la selección actual
  const totalScans = relevantTags.reduce((acc, t) => acc + (t.scan_count || 0), 0);
  const badReviewsPrevented = relevantFeedbacks.length;
  // Clientes felices estimados: escaneos totales que no generaron queja privada
  const happyClientsEstimated = Math.max(0, totalScans - badReviewsPrevented);
  const satisfactionRate =
    totalScans > 0 ? Math.round((happyClientsEstimated / totalScans) * 100) : 100;

  // Mesa más activa
  const sortedTags = [...relevantTags].sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0));
  const topTag = sortedTags[0];

  // ============================================================================
  // CÁLCULOS PONDERADOS PARA COMPARATIVA DE CADENA (Múltiples Sucursales)
  // ============================================================================
  const allChainRestaurantIds = new Set(restaurants.map((r) => r.id));
  const chainTags = tags.filter((t) => t.restaurant_id && allChainRestaurantIds.has(t.restaurant_id));
  const chainFeedbacks = feedbacks.filter((f) => allChainRestaurantIds.has(f.restaurant_id));

  const chainTotalScans = chainTags.reduce((acc, t) => acc + (t.scan_count || 0), 0);
  const chainTotalBad = chainFeedbacks.length;
  const chainTotalToGoogle = Math.max(0, chainTotalScans - chainTotalBad);
  const chainWeightedSat =
    chainTotalScans > 0 ? Math.round((chainTotalToGoogle / chainTotalScans) * 100) : 100;

  const branchStats = restaurants.map((rest) => {
    const branchTags = tags.filter((t) => t.restaurant_id === rest.id);
    const branchFbs = feedbacks.filter((f) => f.restaurant_id === rest.id);
    const scans = branchTags.reduce((acc, t) => acc + (t.scan_count || 0), 0);
    const bad = branchFbs.length;
    const toGoogle = Math.max(0, scans - bad);
    const satRate = scans > 0 ? Math.round((toGoogle / scans) * 100) : 100;
    return {
      restaurant: rest,
      scans,
      bad,
      toGoogle,
      satRate,
    };
  }).sort((a, b) => b.scans - a.scans);

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Retorno de Inversión & Métricas
        </h2>
        <p className="text-xs text-slate-500">
          Impacto en tiempo real de tus tags NFC y protección de reputación.
        </p>
      </div>

      {/* Banner de Valor de Marca */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Filtro de Reputación Activo</span>
        </div>

        <h3 className="text-lg font-black tracking-tight text-white mt-1">
          {badReviewsPrevented} Malas Reseñas Evitadas
        </h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Tu sistema contuvo estas opiniones de 1 a 3 estrellas internamente antes de que pudieran dañar el promedio de tu negocio en Google Maps.
        </p>

        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">Índice de comensales satisfechos:</span>
          <span className="font-black text-emerald-400 text-sm">{satisfactionRate}%</span>
        </div>
      </div>

      {/* Grid de Métricas Principales (Responsive: 2 columnas en móvil, 4 en desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Métrica 1: Enviados a Google */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {happyClientsEstimated}
            </span>
            <span className="text-[11px] font-bold text-slate-500 block leading-tight">
              A Google Reseñas (4-5 ⭐)
            </span>
          </div>
        </div>

        {/* Métrica 2: Total de Escaneos */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {totalScans}
            </span>
            <span className="text-[11px] font-bold text-slate-500 block leading-tight">
              Escaneos en tus Mesas
            </span>
          </div>
        </div>

        {/* Métrica 3: Quejas en Buzón */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {badReviewsPrevented}
            </span>
            <span className="text-[11px] font-bold text-slate-500 block leading-tight">
              Quejas en Buzón Privado
            </span>
          </div>
        </div>

        {/* Métrica 4: Mesa Más Activa */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 truncate block">
              {topTag ? (topTag.table_identifier || topTag.tag_code) : '—'}
            </span>
            <span className="text-[11px] font-bold text-slate-500 block leading-tight">
              Mesa Más Activa ({topTag?.scan_count || 0} scans)
            </span>
          </div>
        </div>
      </div>

      {/* Ranking de Mesas / Tags */}
      {relevantTags.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Actividad por Mesa Física
          </h4>
          <div className="divide-y divide-slate-100">
            {sortedTags.slice(0, 5).map((t, idx) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-slate-400 text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {t.table_identifier || t.tag_code}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {t.tag_code}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">{t.scan_count || 0}</span>
                  <span className="text-[10px] text-slate-400 block">escaneos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================================
          COMPARATIVA DE CADENA Y PONDERADOS (Visible si tiene 2 o más sucursales)
      ============================================================================ */}
      {restaurants.length > 1 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Comparativa de Cadena (Ponderado vs. Sucursales)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Desempeño relativo entre sucursales y tasa de retención de quejas
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Ponderado Cadena:</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-black inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{chainWeightedSat}% Satisfacción</span>
              </span>
            </div>
          </div>

          {/* Tarjeta de Resumen Ponderado */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Escaneos Totales Cadena
              </span>
              <span className="text-lg font-black text-slate-800">{chainTotalScans}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Quejas Contenidas (Cadena)
              </span>
              <span className="text-lg font-black text-rose-600">{chainTotalBad}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Enviados a Google
              </span>
              <span className="text-lg font-black text-emerald-600">{chainTotalToGoogle}</span>
            </div>
          </div>

          {/* Tabla Comparativa de Sucursales */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Sucursal</th>
                  <th className="py-2.5 px-3 text-center">Escaneos</th>
                  <th className="py-2.5 px-3 text-center">Quejas Privadas</th>
                  <th className="py-2.5 px-3 text-center">A Google (4-5 ⭐)</th>
                  <th className="py-2.5 px-3 text-center">Índice Satisfacción</th>
                  <th className="py-2.5 px-3 text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchStats.map((b) => (
                  <tr key={b.restaurant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {b.restaurant.branch_name || b.restaurant.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {b.restaurant.address || 'Ubicación registrada'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {b.scans}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-rose-600">
                      {b.bad}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {b.toGoogle}
                    </td>

                    <td className="py-3 px-3">
                      <div className="w-32 mx-auto">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-slate-600">{b.satRate}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${b.satRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          b.satRate >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.satRate >= 75
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.satRate >= 90 ? '🟢 Óptimo' : b.satRate >= 75 ? '🟡 Estable' : '🔴 Atención'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
