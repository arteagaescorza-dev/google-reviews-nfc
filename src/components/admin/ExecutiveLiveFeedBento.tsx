import React, { useState } from 'react';
import {
  Scan,
  Cpu,
  Briefcase,
  ShieldAlert,
  DollarSign,
  Filter,
  Clock,
  Store,
  RefreshCw,
} from 'lucide-react';
import type { ExecutiveEvent, ExecutiveEventType } from '../../lib/api/events';

interface ExecutiveLiveFeedBentoProps {
  events: ExecutiveEvent[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ExecutiveLiveFeedBento: React.FC<ExecutiveLiveFeedBentoProps> = ({
  events,
  onRefresh,
  isRefreshing,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | ExecutiveEventType>('all');

  const filteredEvents = events.filter((evt) => {
    if (selectedFilter === 'all') return true;
    return evt.type === selectedFilter;
  });

  const getEventIcon = (type: ExecutiveEventType) => {
    switch (type) {
      case 'scan':
        return <Scan className="w-4 h-4 text-blue-600" />;
      case 'hardware':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      case 'sale':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'feedback_shield':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeClass = (variant: ExecutiveEvent['badge_variant']) => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200/70';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200/70';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200/70';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200/70';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatEventTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Hace unos momentos';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Feed Operativo en Tiempo Real
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              Supabase Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Escaneos en mesa, movimientos de bodega, pipeline comercial y blindaje reputacional activo
          </p>
        </div>

        {/* Acciones y Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({events.length})
            </button>
            <button
              onClick={() => setSelectedFilter('scan')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'scan'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Escaneos NFC
            </button>
            <button
              onClick={() => setSelectedFilter('hardware')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'hardware'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hardware & Bodega
            </button>
            <button
              onClick={() => setSelectedFilter('sale')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'sale'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setSelectedFilter('feedback_shield')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'feedback_shield'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Blindaje
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Refrescar eventos"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Eventos Bento */}
      {filteredEvents.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-semibold">No se encontraron eventos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex-shrink-0 mt-0.5">
                  {getEventIcon(evt.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(
                        evt.badge_variant
                      )}`}
                    >
                      {evt.badge_text}
                    </span>

                    {evt.restaurant_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 truncate">
                        <Store className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{evt.restaurant_name}</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-medium ml-auto sm:ml-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatEventTime(evt.created_at)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
