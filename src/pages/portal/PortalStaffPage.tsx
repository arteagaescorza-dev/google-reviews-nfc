import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { filterBranchesBySameOrganization } from '../../lib/api/orders';
import type { TableCall, TableOrder, Feedback, StaffMember, Restaurant, RestaurantTable } from '../../types';
import {
  BellRing,
  Receipt,
  CheckCircle2,
  Lock,
  UserCheck,
  LogOut,
  UtensilsCrossed,
  Ticket,
  Phone,
  Store,
  Sparkles,
  AlertTriangle,
  Users,
} from 'lucide-react';

export const PortalStaffPage: React.FC = () => {
  const getMinutesAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('res-1');
  const [branchTables, setBranchTables] = useState<RestaurantTable[]>([]);
  const [isInterBranchShift, setIsInterBranchShift] = useState(false);

  const sameOrgBranches = React.useMemo(
    () => filterBranchesBySameOrganization(restaurants, selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );
  const sameOrgBranchIds = React.useMemo(
    () => sameOrgBranches.map((b) => b.id),
    [sameOrgBranches]
  );

  useEffect(() => {
    api.getRestaurants().then((rests) => {
      if (rests && rests.length > 0) {
        setRestaurants(rests);
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const branchParam = params.get('branch');
        if (branchParam && rests.some((r) => r.id === branchParam)) {
          setSelectedRestaurantId(branchParam);
        } else {
          setSelectedRestaurantId(rests[0].id);
        }
      }
    });
  }, []);

  const [calls, setCalls] = useState<TableCall[]>([]);
  const [readyOrders, setReadyOrders] = useState<TableOrder[]>([]);
  const [urgentFeedbacks, setUrgentFeedbacks] = useState<Feedback[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponRedeemResult, setCouponRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [assignedTables, setAssignedTables] = useState<string[]>(['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6']);
  const [tableFilterTab, setTableFilterTab] = useState<'my_tables' | 'all_tables'>('my_tables');
  const [showTableAssignModal, setShowTableAssignModal] = useState(false);

  // Cargar datos operativos
  const loadData = async () => {
    const [allCalls, allOrders, allFeedback, tablesData] = await Promise.all([
      api.getTableCalls(selectedRestaurantId),
      api.getTableOrders(selectedRestaurantId),
      api.getFeedbacks(),
      api.getRestaurantTables(selectedRestaurantId),
    ]);

    setCalls(allCalls.filter((c) => c.status === 'active'));
    setReadyOrders(allOrders.filter((o) => o.status === 'ready'));
    setBranchTables(tablesData);
    // Quejas nuevas o no atendidas de 1 a 3 estrellas
    setUrgentFeedbacks(allFeedback.filter((f) => f.rating <= 3 && f.status === 'new').slice(0, 3));
  };

  useEffect(() => {
    if (currentStaff) {
      loadData();
      const interval = setInterval(loadData, 5000); // Polling cada 5s para notificaciones de Hostess y comensales
      return () => clearInterval(interval);
    }
  }, [currentStaff, selectedRestaurantId]);

  // Autenticación con PIN (POL-009: Permite iniciar sesión en otras sucursales de la misma organización para cubrir turno)
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError('');
    const res = await api.loginStaffWithPin(selectedRestaurantId, pinInput, sameOrgBranchIds);
    if (res.success && res.staff) {
      setCurrentStaff(res.staff);
      setIsInterBranchShift(Boolean(res.isInterBranchShift));
      setPinInput('');
    } else {
      setPinError(res.error || 'PIN incorrecto.');
    }
  };

  const handleResolveCall = async (callId: string) => {
    await api.resolveTableCall(callId, currentStaff?.name);
    loadData();
  };

  const handleDeliverOrder = async (orderId: string) => {
    await api.updateTableOrderStatus(orderId, 'delivered');
    loadData();
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponRedeemResult(null);

    const res = await api.redeemCoupon(
      couponCodeInput.trim().toUpperCase(),
      undefined,
      currentStaff?.name || 'Mesero'
    );

    if (res.success) {
      setCouponRedeemResult({
        success: true,
        message: `Cupón válido. Descuento: ${res.coupon?.discount_description || '20% OFF'}.`,
      });
      setCouponCodeInput('');
    } else {
      setCouponRedeemResult({
        success: false,
        message: res.error || 'Cupón inválido o ya canjeado.',
      });
    }
  };

  // Pantalla de Login con PIN para Meseros
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-orange-600 text-slate-100 font-sans">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Terminal de Sala & Meseros
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Ingresa tu PIN de 4 dígitos para atender mesas y solicitudes de Hostess
          </p>

          {sameOrgBranches.length > 1 && (
            <div className="mb-4 text-left">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Sucursal de Turno (Misma Organización)
              </label>
              <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <Store className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                >
                  {sameOrgBranches.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.brand_name || r.name} ({r.branch_name || 'Principal'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {pinError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full py-4 text-center text-3xl font-mono tracking-[0.5em] bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => pinInput.length < 4 && setPinInput((p) => p + num)}
                  className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-400 transition-colors"
              >
                BORRAR
              </button>
              <button
                type="button"
                onClick={() => pinInput.length < 4 && setPinInput((p) => p + '0')}
                className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white transition-colors"
              >
                0
              </button>
              <button
                type="submit"
                disabled={pinInput.length < 4}
                className="py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-xs font-bold text-white transition-colors"
              >
                ENTRAR
              </button>
            </div>
          </form>

          <div className="mt-5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
            PIN Demo predeterminado: <strong className="font-mono text-white">1234</strong>
          </div>
        </div>
      </div>
    );
  }

  const cleaningCalls = calls.filter((c) => c.call_type === 'cleaning');

  // Filtrado de llamadas por zonificación y regla de escalamiento anti-abandono (SLA 60s)
  const displayCalls = calls.filter((c) => {
    if (c.call_type === 'cleaning') return true;
    if (tableFilterTab === 'all_tables') return true;
    const isAssigned = assignedTables.includes(c.table_number);
    const isEscalated = getMinutesAgo(c.created_at) >= 1;
    return isAssigned || isEscalated;
  });

  const selectableTableNames =
    branchTables.length > 0
      ? branchTables.map((t) => t.table_number)
      : ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8', 'Mesa 9', 'Mesa 10', 'Mesa 11', 'Mesa 12'];

  // Dashboard de Sala del Mesero
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans max-w-3xl mx-auto space-y-6">
      {/* Barra de Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white leading-tight">
                {currentStaff.name}
              </h1>
              {isInterBranchShift && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase">
                  Turno Inter-Sucursal
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Terminal de Sala • {restaurants.find((r) => r.id === selectedRestaurantId)?.brand_name || 'Restaurante'} ({restaurants.find((r) => r.id === selectedRestaurantId)?.branch_name || 'Principal'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/portal/hostess?branch=${selectedRestaurantId}`}
            className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Vista Hostess</span>
          </Link>

          <button
            onClick={() => setCurrentStaff(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar Turno</span>
          </button>
        </div>
      </div>

      {/* Barra de Asignación de Mesas y Filtro de Alertas (SPEC-ZONING) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-300">Tus Mesas Asignadas:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignedTables.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-lg bg-orange-600/20 border border-orange-500/40 text-orange-300 font-mono text-[11px] font-bold">
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTableAssignModal(true)}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline ml-1"
            >
              Cambiar mesas
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTableFilterTab('my_tables')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tableFilterTab === 'my_tables'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mis Mesas ({calls.filter((c) => assignedTables.includes(c.table_number) || c.call_type === 'cleaning').length})
            </button>
            <button
              type="button"
              onClick={() => setTableFilterTab('all_tables')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tableFilterTab === 'all_tables'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todo el Salón ({calls.length})
            </button>
          </div>
        </div>
      </div>

      {/* Sección Destacada: Solicitudes de Limpieza enviadas por Hostess */}
      {cleaningCalls.length > 0 && (
        <div className="p-4 rounded-2xl bg-violet-950/40 border-2 border-violet-500/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
              <h3 className="font-black text-xs uppercase tracking-wider text-violet-200">
                Solicitudes de Limpieza de Mesa (Enviadas por Hostess)
              </h3>
            </div>
            <span className="text-[10px] bg-violet-600 text-white font-black px-2.5 py-0.5 rounded-full">
              {cleaningCalls.length} Pendiente{cleaningCalls.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cleaningCalls.map((cleanCall) => (
              <div
                key={cleanCall.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-violet-500/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">{cleanCall.table_number}</h4>
                    <p className="text-xs text-violet-300 font-bold">
                      Hostess solicita limpieza para asignar comensales
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveCall(cleanCall.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                  title="Marca la mesa como limpia y la libera automáticamente en la pantalla de Hostess"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mesa Limpia</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección 1: Alertas Críticas de Inconformidad en Mesa (1 a 3 estrellas) */}
      {urgentFeedbacks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-black text-xs uppercase tracking-wider text-rose-300">
                Alerta de Servicio en Mesa (Retención Inmediata)
              </h3>
            </div>
            <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
              Prioridad 1
            </span>
          </div>

          <div className="space-y-2.5">
            {urgentFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3 rounded-xl bg-slate-900 border border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                      {fb.rating} Estrellas
                    </span>
                    <span className="font-extrabold text-xs text-white">
                      Mesa {fb.tag_code?.slice(-2) || '4'}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {fb.customer_name || 'Comensal en mesa'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 italic">
                    "{fb.comments}"
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {fb.customer_phone && (
                    <a
                      href={`tel:${fb.customer_phone}`}
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Llamar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-lg">
                    Acercarse a Mesa
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección 2: Llamadas Activas de Mesa */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-sm text-white">
              Llamadas Activas de Mesa ({displayCalls.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Peticiones de comensales y Hostess en vivo</span>
        </div>

        {displayCalls.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
            No hay llamadas de mesa pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayCalls.map((call) => {
              const isCleaning = call.call_type === 'cleaning';
              return (
                <div
                  key={call.id}
                  className={`p-4 rounded-2xl bg-slate-900 border flex items-center justify-between gap-3 shadow-sm transition-all ${
                    isCleaning
                      ? 'border-violet-500/40 hover:border-violet-400'
                      : 'border-amber-500/30 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isCleaning ? 'bg-violet-500/15 text-violet-300' : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {isCleaning ? (
                        <Sparkles className="w-5 h-5" />
                      ) : call.call_type === 'waiter' ? (
                        <BellRing className="w-5 h-5" />
                      ) : (
                        <Receipt className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">
                          {call.table_number}
                        </h4>
                        {getMinutesAgo(call.created_at) >= 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                            SLA +1m
                          </span>
                        )}
                        {isCleaning ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-600/30 text-violet-300">
                            Hostess
                          </span>
                        ) : assignedTables.includes(call.table_number) ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-600/30 text-orange-300">
                            Tu Mesa
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                            Apoyo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">
                        {isCleaning
                          ? 'Solicita Limpieza de Mesa'
                          : call.call_type === 'waiter'
                          ? 'Solicita Asistencia'
                          : 'Pide la Cuenta con Terminal'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Hace pocos minutos
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveCall(call.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
                      isCleaning
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCleaning ? 'Mesa Limpia' : 'Atendido'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 3: Platillos Listos en Barra / Cocina */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <h3 className="font-black text-sm text-white">
              Listos para Servir de Cocina ({readyOrders.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Pasa a recoger a la barra</span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
            No hay comandas esperando entrega en este momento.
          </div>
        ) : (
          <div className="space-y-2.5">
            {readyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-emerald-300">
                      {ord.table_number}
                    </span>
                    <span className="text-xs text-slate-400">
                      • #{ord.id.slice(-4)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">
                    {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <button
                  onClick={() => handleDeliverOrder(ord.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Entregado a Mesa</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 4: Validador Rápido de Cupones */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-white">
            Canjear Cupón de Descuento en Cuenta
          </h3>
        </div>

        <form onSubmit={handleRedeemCoupon} className="flex gap-2">
          <input
            type="text"
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
            placeholder="Ej. PROMO-CUPON"
            className="flex-1 p-2.5 text-xs font-mono uppercase bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
          >
            Validar
          </button>
        </form>

        {couponRedeemResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              couponRedeemResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {couponRedeemResult.message}
          </div>
        )}
      </div>
    
      {/* MODAL: Asignación Rápida de Mesas por Turno */}
      {showTableAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Asignar Mesas de Turno</h3>
              <button
                type="button"
                onClick={() => setShowTableAssignModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selecciona las mesas que atenderás hoy para recibir sus timbres directamente:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {selectableTableNames.map((tableNum) => {
                const isSelected = assignedTables.includes(tableNum);
                return (
                  <button
                    key={tableNum}
                    type="button"
                    onClick={() => {
                      setAssignedTables((prev) =>
                        isSelected ? prev.filter((t) => t !== tableNum) : [...prev, tableNum]
                      );
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {tableNum}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAssignedTables(selectableTableNames)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Todas las mesas
              </button>
              <button
                type="button"
                onClick={() => setShowTableAssignModal(false)}
                className="flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl"
              >
                Listo ({assignedTables.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
