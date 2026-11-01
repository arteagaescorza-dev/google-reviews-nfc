import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { TerritoryMetric, TerritoryZone } from '../types';
import {
  MapPin,
  Target,
  Scan,
  Store,
  Flame,
  Clock,
} from 'lucide-react';

export const AdminCoveragePage: React.FC = () => {
  const [data, setData] = useState<TerritoryMetric | null>(null);
  const [selectedZone, setSelectedZone] = useState<TerritoryZone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      const metrics = await api.getTerritoryMetrics();
      setData(metrics);
      if (metrics.zones.length > 0) {
        setSelectedZone(metrics.zones[0]);
      }
      setLoading(false);
    }
    loadMetrics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Cargando mapa de cobertura territorial...
      </div>
    );
  }

  const totalScans = data.zones.reduce((acc, z) => acc + z.total_scans, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
              Expansión Territorial GTM
            </span>
            <span className="text-xs text-slate-400">Meta: 100 Locales en la Zona</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cobertura & Densidad de Red Física
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión geoespacial de locales sembrados y mapa de calor de tráfico en mesas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/restaurants"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>+ Sembrar Local en Zona</span>
          </Link>
        </div>
      </div>

      {/* Termómetro de Meta: 18 / 100 Locales (18%) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-400" />
              Progreso de Siembra en Territorio (Fase 1 GTM)
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              {data.activeLocations} <span className="text-xl font-normal text-slate-400">/ {data.totalGoal} Restaurantes Sembrados</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Al alcanzar los 100 locales en la zona se activará la red de anuncios de patrocinadores locales a gran escala sin canibalización.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[160px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Cobertura de Zona
            </span>
            <p className="text-3xl font-black text-emerald-400 my-0.5">
              {data.coveragePercent}%
            </p>
            <span className="text-[11px] text-slate-300">
              82 locales restantes
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mt-5 border border-slate-700/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${data.coveragePercent}%` }}
          />
        </div>
      </div>

      {/* Métricas macro de cobertura */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Locales Activos</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{data.activeLocations}</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Operando en 6 colonias</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Escaneos Acumulados</span>
            <Scan className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalScans.toLocaleString('es-MX')}</p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Interacciones físicas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Zona con Mayor Tráfico</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">Roma Norte</p>
          <p className="text-[11px] text-orange-600 font-semibold mt-0.5">12,450 escaneos (29.3%)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Horario Pico de Escaneo</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">21:00 hrs</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Turno de Cenas (3,410 scans)</p>
        </div>
      </div>

      {/* Mapa Geoespacial Interactivo y Desglose de Colonias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mapa Interactivo (7 columnas) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Mapa Geoespacial de Colonias
              </h3>
            </div>
            <span className="text-xs text-slate-400">CDMX Centro & Poniente</span>
          </div>

          {/* Lienzo Visual del Mapa Vectorial */}
          <div className="relative w-full h-[360px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-4 flex items-center justify-center">
            {/* Rejilla de fondo */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Marcadores de Colonias en el Mapa */}
            <div className="relative w-full h-full">
              {data.zones.map((zone, idx) => {
                // Coordenadas simuladas relativas en el viewport
                const positions = [
                  { top: '48%', left: '46%' }, // Roma Norte
                  { top: '56%', left: '38%' }, // Condesa
                  { top: '38%', left: '50%' }, // Juárez
                  { top: '30%', left: '68%' }, // Centro Histórico
                  { top: '32%', left: '26%' }, // Polanco
                  { top: '75%', left: '52%' }, // Del Valle
                ];
                const pos = positions[idx] || { top: '50%', left: '50%' };
                const isSelected = selectedZone?.id === zone.id;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    style={{ top: pos.top, left: pos.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    <div className="relative flex items-center justify-center">
                      {isSelected && (
                        <span className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shadow-lg transition-all group-hover:scale-110 ${
                          isSelected
                            ? 'bg-blue-600 text-white ring-4 ring-blue-400/30 scale-110'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {zone.active_restaurants}
                      </div>
                    </div>
                    <span
                      className={`block text-[10px] font-extrabold whitespace-nowrap mt-1 px-2 py-0.5 rounded-full shadow-md transition-colors text-center ${
                        isSelected
                          ? 'bg-white text-slate-900 font-black'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {zone.name.split('&')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
              Puntos indican cantidad de locales activos sembrados
            </div>
          </div>

          {/* Tarjeta de detalle de la zona seleccionada */}
          {selectedZone && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Zona Seleccionada:
                </span>
                <h4 className="text-base font-extrabold text-blue-950">
                  {selectedZone.name} ({selectedZone.city})
                </h4>
                <p className="text-xs text-blue-900/80 mt-0.5">
                  {selectedZone.active_restaurants} de {selectedZone.target_restaurants} locales sembrados • {selectedZone.total_scans.toLocaleString('es-MX')} escaneos en mesa
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/restaurants"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all text-center flex-shrink-0"
                >
                  Ver Locales de la Zona
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Colonias y Cuadrantes (5 columnas) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">
              Desglose por Colonias
            </h3>
            <span className="text-xs text-slate-400">6 Zonas de Siembra</span>
          </div>

          <div className="space-y-3">
            {data.zones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-slate-900">
                      {zone.name}
                    </span>
                    <span className="font-bold text-xs text-blue-600">
                      {zone.active_restaurants} / {zone.target_restaurants} locales
                    </span>
                  </div>

                  {/* Barra de progreso de la colonia */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${zone.density_percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{zone.total_scans.toLocaleString('es-MX')} escaneos en mesa</span>
                    <span className="font-semibold text-slate-700">{zone.density_percent}% meta</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mapa de Calor por Horarios de Servicio (Comidas vs Cenas) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-base text-slate-900">
                Mapa de Calor de Escaneos por Horario (Tráfico Físico en Mesa)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifica los dos picos físicos masivos de interacción: Comidas (14:00 - 16:00) y Cenas (20:00 - 22:00)
            </p>
          </div>
        </div>

        {/* Gráfico de barras de calor */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2 items-end">
          {data.hourlyHeatmap.map((h) => {
            const maxScans = 3500;
            const heightPercent = Math.min(100, Math.round((h.scans / maxScans) * 100));

            return (
              <div key={h.hour} className="flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">
                  {h.scans}
                </span>
                <div className="w-full h-36 bg-slate-100 rounded-xl flex items-end p-1 overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      h.peak
                        ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-sm'
                        : 'bg-blue-600/70'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    h.peak ? 'text-orange-600 font-extrabold' : 'text-slate-500'
                  }`}
                >
                  {h.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
