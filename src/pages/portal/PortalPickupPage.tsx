import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { subscribeToRestaurantOrders, type RealtimeConnectionStatus } from '../../lib/realtimeSubscriptions';
import type { TableOrder, StaffMember, Restaurant } from '../../types';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  User,
  ShieldCheck,
  PackageCheck,
  Bike,
  Store,
  Printer,
  X,
  Volume2,
  VolumeX,
  LogOut,
} from 'lucide-react';

export const PortalPickupPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | 'takeout' | 'delivery'>('all');
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connStatus, setConnStatus] = useState<RealtimeConnectionStatus>('connected');

  // Sesión de Cajero / Despachador en Mostrador
  const [activeCashier, setActiveCashier] = useState<StaffMember | null>(() => {
    const saved = localStorage.getItem('nfc_active_staff_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [branchInfo, setBranchInfo] = useState<Restaurant | null>(null);

  const getBranchId = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return params.get('branch') || '';
  };

  const loadData = async () => {
    const branchId = getBranchId();
    const [allOrders, rests, staffList] = await Promise.all([
      api.getTableOrders(branchId || undefined),
      api.getRestaurants(),
      api.getStaffMembers(branchId || undefined),
    ]);

    if (branchId) {
      const match = rests.find((r) => r.id === branchId);
      if (match) setBranchInfo(match);
    } else if (rests.length > 0) {
      setBranchInfo(rests[0]);
    }

    // Filtrar comandas que estén listas para recoger o recién preparadas
    setOrders(allOrders);
    setLoading(false);

    // Auto-asignar cajero demo si no hay sesión
    if (!activeCashier) {
      const cashierFound = staffList.find((s) => s.role === 'cashier' || s.role === 'manager');
      if (cashierFound) {
        setActiveCashier(cashierFound);
      }
    }
  };

  useEffect(() => {
    loadData();

    const branchId = getBranchId() || 'res-1';

    // Suscripción Realtime por WebSockets (POL-008)
    const unsubOrders = subscribeToRestaurantOrders(
      branchId,
      () => {
        loadData();
      },
      (st) => setConnStatus(st)
    );

    // Latido pasivo cada 45 segundos para contingencias de red
    const passiveHeartbeat = setInterval(loadData, 45000);

    return () => {
      unsubOrders();
      clearInterval(passiveHeartbeat);
    };
  }, []);

  const handleDeliverOrder = async (orderId: string) => {
    await api.updateTableOrderStatus(orderId, 'delivered');
    await loadData();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const branchId = getBranchId() || branchInfo?.id || 'res-1';
    const res = await api.loginStaffWithPin(branchId, pinInput.trim());
    if (res.success && res.staff) {
      setActiveCashier(res.staff);
      setIsPinModalOpen(false);
      setPinInput('');
    } else {
      setPinError(res.error || 'PIN incorrecto o no autorizado para esta sucursal.');
    }
  };

  const getMinutesAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  // Filtrado de órdenes
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const recentDelivered = orders.filter((o) => o.status === 'delivered').slice(0, 10);

  const filteredOrders = readyOrders.filter((order) => {
    const matchesSearch =
      !searchQuery.trim() ||
      order.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tag_code.toLowerCase().includes(searchQuery.toLowerCase());

    const isDelivery = /ubereats|rappi|didi|delivery|repartidor/i.test(
      `${order.table_number} ${order.customer_name || ''}`
    );

    if (filterChannel === 'delivery' && !isDelivery) return false;
    if (filterChannel === 'takeout' && isDelivery) return false;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      {/* Cabecera Superior Pick Up Bento Light */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Estación Pick Up & Collect
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                  Despacho & Delivery
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        connStatus === 'connected'
                          ? 'bg-emerald-400'
                          : connStatus === 'reconnecting'
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        connStatus === 'connected'
                          ? 'bg-emerald-500'
                          : connStatus === 'reconnecting'
                          ? 'bg-amber-500'
                          : 'bg-slate-500'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      connStatus === 'connected'
                        ? 'text-emerald-700'
                        : connStatus === 'reconnecting'
                        ? 'text-amber-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {connStatus === 'connected'
                      ? 'En Vivo'
                      : connStatus === 'reconnecting'
                      ? 'Reconectando...'
                      : 'Offline'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {branchInfo ? `${branchInfo.name} · Mostrador de Entrega Rápida` : 'Mostrador de Entrega'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Indicador de Sonido */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={soundEnabled ? 'Silenciar alertas' : 'Activar alertas sonoras'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Identidad del Cajero */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              title="Cambiar turno de cajero o ingresar con PIN"
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>{activeCashier ? activeCashier.name : 'Iniciar Sesión con PIN'}</span>
            </button>

            {/* Refrescar */}
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Actualizar pedidos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Cerrar Turno */}
            <button
              onClick={() => {
                localStorage.removeItem('nfc_active_staff_session');
                setActiveCashier(null);
                const branchId = getBranchId() || branchInfo?.id || 'res-1';
                navigate(`/login?type=staff&branch=${branchId}`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Cambiar turno de caja y salir al login con PIN"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Turno</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ticket, nombre de cliente o código de comanda..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterChannel('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                filterChannel === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({readyOrders.length})
            </button>
            <button
              onClick={() => setFilterChannel('takeout')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                filterChannel === 'takeout'
                  ? 'bg-teal-600 text-white'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Mostrador</span>
            </button>
            <button
              onClick={() => setFilterChannel('delivery')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                filterChannel === 'delivery'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery / Apps</span>
            </button>
          </div>
        </div>

        {/* Rejilla de Pedidos Listos para Entrega */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-teal-600" />
              <span>Comandas Listas para Despachar ({filteredOrders.length})</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">
              Auto-actualizable en tiempo real
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Cargando comandas listas para mostrador...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-2" />
              <h3 className="text-sm font-extrabold text-slate-800">
                No hay pedidos pendientes de entrega
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Todas las comandas han sido entregadas a los comensales y repartidores.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => {
                const minsAgo = getMinutesAgo(order.created_at);
                const isUrgent = minsAgo > 10;
                const isDelivery = /ubereats|rappi|didi|delivery|repartidor/i.test(
                  `${order.table_number} ${order.customer_name || ''}`
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-teal-300 transition-all"
                  >
                    {/* Encabezado de la Tarjeta */}
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-slate-900 font-mono">
                            {order.table_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isDelivery
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}
                          >
                            {isDelivery ? 'Delivery' : 'Para Llevar'}
                          </span>
                        </div>
                        {order.customer_name && (
                          <p className="text-xs font-bold text-slate-600 mt-0.5">
                            Cliente: {order.customer_name}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            isUrgent
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Listo hace {minsAgo} min</span>
                        </span>
                      </div>
                    </div>

                    {/* Lista de Platillos */}
                    <div className="p-4 space-y-2 flex-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 font-extrabold text-slate-700 flex items-center justify-center text-[11px]">
                              {item.quantity}
                            </span>
                            <span className="font-bold text-slate-800">{item.name}</span>
                          </div>
                          {item.notes && (
                            <span className="text-[10px] text-amber-700 italic bg-amber-50 px-1.5 py-0.2 rounded">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botón de Despacho y Entrega */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Ver detalle del ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeliverOrder(order.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Entregado</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historial Reciente de Entregados */}
        {recentDelivered.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Últimos Pedidos Despachados en este Turno</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {recentDelivered.map((order) => (
                <div key={order.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {order.table_number}
                    </span>
                    <span className="font-bold text-slate-700">
                      {order.customer_name || 'Comensal Mostrador'}
                    </span>
                    <span className="text-slate-400">
                      ({order.items.reduce((acc, i) => acc + i.quantity, 0)} platillos)
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Entregado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalle de Ticket */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900">Detalle de Comanda Mostrador</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="font-mono text-xs space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-center font-bold text-sm text-slate-900 pb-2 border-b border-dashed border-slate-300">
                {branchInfo?.name || 'SUCURSAL PRINCIPAL'}
              </div>
              <div className="flex justify-between">
                <span>Comanda:</span>
                <span className="font-bold">{selectedOrder.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-bold">{selectedOrder.customer_name || 'Mostrador'}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span>${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span>${selectedOrder.total_amount.toFixed(2)} MXN</span>
              </div>
            </div>
            <button
              onClick={() => handleDeliverOrder(selectedOrder.id)}
              className="mt-4 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Confirmar Entrega y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de PIN de Cajero */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900">PIN de Cajero / Despacho</h3>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePinLogin} className="space-y-4">
              {pinError && (
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                  {pinError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ingresa tu PIN de 4 dígitos
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center text-2xl font-mono tracking-widest px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Ingresar a Mostrador
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

