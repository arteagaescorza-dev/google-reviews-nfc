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
    setUrgentFeedbacks(
      allFeedback.filter(
        (f) =>
          f.rating <= 3 &&
          (f.status === 'new' || f.status === 'reviewed') &&
          (!f.restaurant_id || f.restaurant_id === selectedRestaurantId)
      )
    );
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedRestaurantId]);

  // Manejar Login con PIN
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (pinInput.length !== 4) {
      setPinError('El PIN debe contener 4 dígitos numéricos.');
      return;
    }

    const res = await api.loginStaffWithPin(pinInput, selectedRestaurantId);
    if (res.success && res.staff) {
      setCurrentStaff(res.staff);
      setIsInterBranchShift(Boolean(res.isInterBranchShift));
      setPinInput('');
    } else {
      setPinError(res.error || 'PIN incorrecto o no autorizado para esta sucursal.');
    }
  };

  // Resolver llamada de mesa
  const handleResolveCall = async (callId: string) => {
    if (!currentStaff) return;
    await api.resolveTableCall(callId, currentStaff.name);
    loadData();
  };

  // Marcar orden entregada a mesa
  const handleDeliverOrder = async (orderId: string) => {
    await api.updateTableOrderStatus(orderId, 'delivered');
    loadData();
  };

  // Canjear cupón de retención o fidelidad
  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim() || !currentStaff) return;

    const res = await api.redeemCouponByStaff(
      couponCodeInput.trim(),
      selectedRestaurantId,
      currentStaff.name
    );

    setCouponRedeemResult({
      success: res.success,
      message: res.success
        ? `Cupón ${res.coupon?.coupon_code || ''} quemado con éxito: ${res.coupon?.title || ''}`
        : res.error || 'Error al canjear cupón',
    });
    if (res.success) {
      setCouponCodeInput('');
    }
  };

  // Pantalla de Login con PIN para Meseros Bento Light
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-orange-600 text-slate-900 font-sans">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Terminal de Sala & Meseros
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Ingresa tu PIN de 4 dígitos para atender mesas y solicitudes de Hostess
          </p>

          {sameOrgBranches.length > 1 && (
            <div className="mb-4 text-left">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sucursal de Turno (Misma Organización)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Store className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {sameOrgBranches.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.brand_name || r.name} ({r.branch_name || 'Principal'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {pinError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
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
              className="w-full py-4 text-center text-3xl font-mono tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => pinInput.length < 4 && setPinInput((p) => p + num)}
                  className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-lg font-black text-slate-900 transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 transition-colors cursor-pointer"
              >
                BORRAR
              </button>
              <button
                type="button"
                onClick={() => pinInput.length < 4 && setPinInput((p) => p + '0')}
                className="py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-lg font-black text-slate-900 transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="submit"
                disabled={pinInput.length < 4}
                className="py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                ENTRAR
              </button>
            </div>
          </form>

          <div className="mt-5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            PIN Demo predeterminado: <strong className="font-mono text-slate-900">1234</strong>
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

  // Dashboard de Sala del Mesero Bento Light
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 font-sans max-w-3xl mx-auto space-y-6 pb-12">
      {/* Barra de Encabezado Bento Light */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold shadow-2xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 leading-tight">
                {currentStaff.name}
              </h1>
              {isInterBranchShift && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase">
                  Turno Inter-Sucursal
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Terminal de Sala • {restaurants.find((r) => r.id === selectedRestaurantId)?.brand_name || 'Restaurante'} ({restaurants.find((r) => r.id === selectedRestaurantId)?.branch_name || 'Principal'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/portal/hostess?branch=${selectedRestaurantId}`}
            className="p-2 rounded-xl bg-violet-50 border border-violet-200 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Vista Hostess</span>
          </Link>

          <button
            onClick={() => setCurrentStaff(null)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar Turno</span>
          </button>
        </div>
      </div>

      {/* Barra de Asignación de Mesas y Filtro de Alertas (SPEC-ZONING) Bento Light */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Tus Mesas Asignadas:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignedTables.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-mono text-[11px] font-bold">
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTableAssignModal(true)}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-bold underline ml-1 cursor-pointer"
            >
              Cambiar mesas
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTableFilterTab('my_tables')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tableFilterTab === 'my_tables'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mis Mesas ({calls.filter((c) => assignedTables.includes(c.table_number) || c.call_type === 'cleaning').length})
            </button>
            <button
              type="button"
              onClick={() => setTableFilterTab('all_tables')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tableFilterTab === 'all_tables'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todo el Salón ({calls.length})
            </button>
          </div>
        </div>
      </div>

      {/* Sección Destacada: Solicitudes de Limpieza enviadas por Hostess Bento Light */}
      {cleaningCalls.length > 0 && (
        <div className="p-4 rounded-3xl bg-violet-50/60 border border-violet-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
              <h3 className="font-black text-xs uppercase tracking-wider text-violet-900">
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
                className="p-3.5 rounded-2xl bg-white border border-violet-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{cleanCall.table_number}</h4>
                    <p className="text-xs text-violet-700 font-semibold">
                      Hostess solicita limpieza para asignar comensales
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleResolveCall(cleanCall.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
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

      {/* Sección 1: Alertas Críticas de Inconformidad en Mesa (1 a 3 estrellas) Bento Light */}
      {urgentFeedbacks.length > 0 && (
        <div className="p-4 rounded-3xl bg-rose-50/60 border border-rose-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-black text-xs uppercase tracking-wider text-rose-900">
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
                className="p-3.5 rounded-2xl bg-white border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                      {fb.rating} Estrellas
                    </span>
                    <span className="font-black text-xs text-slate-900">
                      Mesa {fb.tag_code?.slice(-2) || '4'}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {fb.customer_name || 'Comensal en mesa'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic">
                    "{fb.comments}"
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {fb.customer_phone && (
                    <a
                      href={`tel:${fb.customer_phone}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Llamar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                    Acercarse a Mesa
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección 2: Llamadas Activas de Mesa Bento Light */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-600" />
            <h3 className="font-black text-sm text-slate-900">
              Llamadas Activas de Mesa ({displayCalls.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Peticiones de comensales y Hostess en vivo</span>
        </div>

        {displayCalls.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-center text-xs text-slate-500 shadow-2xs">
            No hay llamadas de mesa pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayCalls.map((call) => {
              const isCleaning = call.call_type === 'cleaning';
              return (
                <div
                  key={call.id}
                  className={`p-4 rounded-3xl bg-white border flex items-center justify-between gap-3 shadow-2xs transition-all ${
                    isCleaning
                      ? 'border-violet-200 hover:border-violet-300'
                      : 'border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border ${
                        isCleaning
                          ? 'bg-violet-50 text-violet-600 border-violet-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      {isCleaning ? (
                        <Sparkles className="w-5 h-5" />
                      ) : call.call_type === 'waiter' ? (
                        <BellRing className="w-5 h-5" />
                      ) : (
                        <Receipt className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">
                          {call.table_number}
                        </h4>
                        {getMinutesAgo(call.created_at) >= 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                            SLA +1m
                          </span>
                        )}
                        {isCleaning ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            Hostess
                          </span>
                        ) : assignedTables.includes(call.table_number) ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            Tu Mesa
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Apoyo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-semibold">
                        {isCleaning
                          ? 'Solicita Limpieza de Mesa'
                          : call.call_type === 'waiter'
                          ? 'Solicita Asistencia'
                          : 'Pide la Cuenta con Terminal'}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Hace pocos minutos
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveCall(call.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                      isCleaning
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
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

      {/* Sección 3: Platillos Listos en Barra / Cocina Bento Light */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-900">
              Listos para Servir de Cocina ({readyOrders.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Pasa a recoger a la barra</span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 text-center text-xs text-slate-500 shadow-2xs">
            No hay comandas esperando entrega en este momento.
          </div>
        ) : (
          <div className="space-y-2.5">
            {readyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-3xl bg-white border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-emerald-800">
                      {ord.table_number}
                    </span>
                    <span className="text-xs text-slate-400">
                      • #{ord.id.slice(-4)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <button
                  onClick={() => handleDeliverOrder(ord.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Entregado a Mesa</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 4: Validador Rápido de Cupones Bento Light */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-sm text-slate-900">
            Canjear Cupón de Descuento en Cuenta
          </h3>
        </div>

        <form onSubmit={handleRedeemCoupon} className="flex gap-2">
          <input
            type="text"
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
            placeholder="Ej. PROMO-CUPON"
            className="flex-1 p-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Validar
          </button>
        </form>

        {couponRedeemResult && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              couponRedeemResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {couponRedeemResult.message}
          </div>
        )}
      </div>
    
      {/* MODAL: Asignación Rápida de Mesas por Turno Bento Light */}
      {showTableAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Asignar Mesas de Turno</h3>
              <button
                type="button"
                onClick={() => setShowTableAssignModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-500">
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
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Todas las mesas
              </button>
              <button
                type="button"
                onClick={() => setShowTableAssignModal(false)}
                className="flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs cursor-pointer"
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
