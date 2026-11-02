import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { TableOrder, TableOrderStatus, KitchenStation, OrderItem } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RefreshCw,
  ArrowRight,
  Flame,
  ChefHat,
  X,
  Wine,
  Cookie,
  Layers,
  Coffee,
} from 'lucide-react';

export const PortalKitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TableOrder | null>(null);

  const loadOrders = async () => {
    const data = await api.getTableOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
    // Actualizar cada 20 segundos
    const interval = setInterval(() => {
      api.getTableOrders().then((data) => setOrders(data));
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: TableOrderStatus) => {
    await api.updateTableOrderStatus(orderId, newStatus);
    loadOrders();
  };

  const getMinutesAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  const [station, setStation] = useState<KitchenStation>(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const s = params.get('station') as KitchenStation;
    const roleParam = params.get('role');
    if (roleParam === 'kitchen') return 'cocina';
    if (roleParam === 'barista') return 'barista';
    return s && ['cocina', 'barra', 'postres', 'barista', 'all'].includes(s) ? s : 'all';
  });

  const inferItemCategory = (item: OrderItem): 'entradas' | 'principales' | 'bebidas' | 'postres' => {
    if (item.category) return item.category;
    const lower = item.name.toLowerCase();
    if (
      lower.includes('cerveza') ||
      lower.includes('vino') ||
      lower.includes('limonada') ||
      lower.includes('bebida') ||
      lower.includes('refresco') ||
      lower.includes('café') ||
      lower.includes('cafe') ||
      lower.includes('cocktail') ||
      lower.includes('gin') ||
      lower.includes('ipa') ||
      lower.includes('chianti')
    ) {
      return 'bebidas';
    }
    if (
      lower.includes('tiramisú') ||
      lower.includes('panna cotta') ||
      lower.includes('postre') ||
      lower.includes('pastel') ||
      lower.includes('helado') ||
      lower.includes('dulce')
    ) {
      return 'postres';
    }
    return 'principales';
  };

  const filterOrderByStation = (order: TableOrder, currentStation: KitchenStation): TableOrder | null => {
    if (currentStation === 'all') return order;
    const filteredItems = order.items.filter((item) => {
      const cat = inferItemCategory(item);
      if (currentStation === 'barra') return cat === 'bebidas';
      if (currentStation === 'postres') return cat === 'postres';
      if (currentStation === 'barista') return cat === 'bebidas' || cat === 'postres';
      if (currentStation === 'cocina') return cat === 'entradas' || cat === 'principales';
      return true;
    });
    if (filteredItems.length === 0) return null;
    return {
      ...order,
      items: filteredItems,
    };
  };

  const visibleOrders = orders
    .map((o) => filterOrderByStation(o, station))
    .filter((o): o is TableOrder => o !== null);

  const pendingOrders = visibleOrders.filter((o) => o.status === 'pending');
  const preparingOrders = visibleOrders.filter((o) => o.status === 'preparing');
  const readyOrders = visibleOrders.filter((o) => o.status === 'ready');
  const deliveredOrders = visibleOrders.filter((o) => o.status === 'delivered');

  const delayedOrders = visibleOrders.filter(
    (o) => (o.status === 'pending' || o.status === 'preparing') && getMinutesAgo(o.created_at) > 15
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      {/* Barra Superior KDS Cocina & Barra */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-lg">
            {station === 'barista' || station === 'barra' || station === 'postres' ? (
              <Coffee className="w-7 h-7" />
            ) : (
              <ChefHat className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {station === 'cocina'
                  ? 'Estación Jefe de Cocina (KDS)'
                  : station === 'barista'
                  ? 'Estación Barista: Barra, Coctelería, Repostería & Café'
                  : 'KDS Cocina & Barra en Vivo'}
              </h1>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                Sincronizado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recepción automatizada de pedidos por estación (asignada por Gerencia)
            </p>
          </div>
        </div>

        {/* Contadores KDS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-slate-400">En Preparación:</span>
            <span className="font-extrabold text-white">
              {pendingOrders.length + preparingOrders.length}
            </span>
          </div>

          {delayedOrders.length > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-700/80 flex items-center gap-2 text-xs text-rose-300 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{delayedOrders.length} con retraso (&gt;15m)</span>
            </div>
          )}

          <button
            onClick={loadOrders}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refrescar órdenes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Estación KDS (Cocina / Barista / Barra / Postres / Todas) */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStation('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            station === 'all'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Todas las Estaciones</span>
        </button>

        <button
          type="button"
          onClick={() => setStation('cocina')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            station === 'cocina'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Cocina Caliente (Jefe de Cocina)</span>
        </button>

        <button
          type="button"
          onClick={() => setStation('barista')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            station === 'barista'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Barista (Barra, Coctelería, Repostería & Café)</span>
        </button>

        <button
          type="button"
          onClick={() => setStation('barra')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            station === 'barra'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>Barra & Coctelería</span>
        </button>

        <button
          type="button"
          onClick={() => setStation('postres')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            station === 'postres'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Cookie className="w-4 h-4" />
          <span>Repostería & Café</span>
        </button>
      </div>

      {/* Tablero Kanban KDS (4 Columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Columna 1: Pendientes (Nuevas) */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <h3 className="font-black text-xs uppercase tracking-wider text-amber-300">
                1. Pendientes ({pendingOrders.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Nuevas órdenes</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {pendingOrders.map((ord) => {
              const mins = getMinutesAgo(ord.created_at);
              const isDelayed = mins > 15;
              return (
                <div
                  key={ord.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDelayed
                      ? 'bg-rose-950/40 border-rose-700'
                      : 'bg-slate-800/90 border-slate-700 hover:border-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <span className="font-black text-sm text-white block">
                        {ord.table_number}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ord.customer_name || 'Comensal'} • #{ord.id.slice(-4)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isDelayed ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {mins}m
                    </span>
                  </div>

                  {/* Lista de platillos */}
                  <div className="space-y-1.5 py-2 border-t border-b border-slate-700/60 my-2 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-extrabold text-amber-300 mr-1.5">{it.quantity}x</span>
                          <span className="font-semibold text-slate-200">{it.name}</span>
                          {it.notes && (
                            <span className="block text-[10px] text-amber-400/90 italic pl-5">
                              Nota: "{it.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => setSelectedTicket(ord)}
                      className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-xs"
                      title="Imprimir comanda"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(ord.id, 'preparing')}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <span>Preparar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 2: En Preparación */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="font-black text-xs uppercase tracking-wider text-orange-400">
                2. En Fuego ({preparingOrders.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Cocinando</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {preparingOrders.map((ord) => {
              const mins = getMinutesAgo(ord.created_at);
              const isDelayed = mins > 15;
              return (
                <div
                  key={ord.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDelayed
                      ? 'bg-rose-950/50 border-rose-600 shadow-md shadow-rose-950'
                      : 'bg-slate-800/90 border-orange-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <span className="font-black text-sm text-white block">
                        {ord.table_number}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ord.customer_name || 'Comensal'} • #{ord.id.slice(-4)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isDelayed ? 'bg-rose-600 text-white animate-pulse' : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {mins}m
                    </span>
                  </div>

                  <div className="space-y-1.5 py-2 border-t border-b border-slate-700/60 my-2 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-extrabold text-orange-400 mr-1.5">{it.quantity}x</span>
                          <span className="font-semibold text-slate-100">{it.name}</span>
                          {it.notes && (
                            <span className="block text-[10px] text-amber-300/90 italic pl-5">
                              Nota: "{it.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => setSelectedTicket(ord)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs"
                      title="Imprimir comanda"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(ord.id, 'ready')}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <span>Platillo Listo</span>
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 3: Listo para Servir */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400">
                3. Listos para Servir ({readyOrders.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Pasa mesero</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {readyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-slate-800/90 border border-emerald-500/40"
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <span className="font-black text-sm text-emerald-300 block">
                      {ord.table_number}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      #{ord.id.slice(-4)} • Terminado
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    Avisado
                  </span>
                </div>

                <div className="space-y-1 py-1.5 text-xs text-slate-300">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-400">{it.quantity}x</span>
                      <span>{it.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleStatusChange(ord.id, 'delivered')}
                  className="w-full mt-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Marcar Entregado</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 4: Historial Reciente de Entregados */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">
              4. Entregados ({deliveredOrders.length})
            </h3>
            <span className="text-[10px] text-slate-500">Servidos</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 opacity-70">
            {deliveredOrders.slice(0, 6).map((ord) => (
              <div
                key={ord.id}
                className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{ord.table_number}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Entregado</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Simulador de Ticket Térmico de Comanda */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-300 mb-3">
              <div>
                <h4 className="font-extrabold text-sm uppercase">Comanda de Cocina</h4>
                <p className="text-[10px] text-slate-500">Ticket 80mm ESC/POS</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span>MESA:</span>
                <span className="font-black text-sm">{selectedTicket.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDEN:</span>
                <span>#{selectedTicket.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span>HORA:</span>
                <span>{new Date(selectedTicket.created_at).toLocaleTimeString('es-MX')}</span>
              </div>
              {selectedTicket.customer_name && (
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span>{selectedTicket.customer_name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 my-3 space-y-2">
              {selectedTicket.items.map((it, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold">
                    <span>{it.quantity}x {it.name}</span>
                    <span>${it.price * it.quantity}</span>
                  </div>
                  {it.notes && (
                    <p className="text-[10px] text-slate-600 italic pl-3">
                      * NOTA: {it.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between font-black text-sm mb-4">
              <span>TOTAL:</span>
              <span>${selectedTicket.total_amount.toLocaleString('es-MX')} MXN</span>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket de Cocina</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
