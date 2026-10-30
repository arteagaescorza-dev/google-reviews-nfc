import React, { useEffect, useState } from 'react';
import type { Restaurant, Feedback, Tag } from '../../types';
import { api } from '../../lib/api';
import {
  ShieldAlert,
  Star,
  QrCode,
  Award,
  Sparkles,
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

  // Cálculos de métricas clave
  const totalScans = relevantTags.reduce((acc, t) => acc + (t.scan_count || 0), 0);
  const badReviewsPrevented = relevantFeedbacks.length;
  // Clientes felices estimados: escaneos totales que no generaron queja privada
  const happyClientsEstimated = Math.max(0, totalScans - badReviewsPrevented);
  const satisfactionRate =
    totalScans > 0 ? Math.round((happyClientsEstimated / totalScans) * 100) : 100;

  // Mesa más activa
  const sortedTags = [...relevantTags].sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0));
  const topTag = sortedTags[0];

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

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};
