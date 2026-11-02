import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Calendar,
  Receipt,
  Ticket,
  MessageSquareWarning,
  Plus,
  CheckCircle2,
  Lock,
  LogOut,
  ArrowLeft,
  Building2,
  ChefHat,
  Coffee,
  UserCheck,
  Trash2,
  Send,
  X,
  RefreshCw,
  Clock,
  Sliders,
  ArrowLeftRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { filterBranchesBySameOrganization, isSameOrganizationAccessAllowed } from '../../lib/api/orders';
import type {
  Restaurant,
  StaffMember,
  StaffRole,
  KitchenStation,
  StaffShift,
  StaffShiftType,
  ManagerRetentionCoupon,
  ManagerShiftReport,
  Feedback,
  TableOrder,
  OrganizationManager,
} from '../../types';

export const PortalManagerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const branchParam = searchParams.get('branch') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchParam || 'res-1');
  const [orgManagers, setOrgManagers] = useState<OrganizationManager[]>([]);

  // Sesión de Gerente de Tienda
  const [loggedInManagerName, setLoggedInManagerName] = useState<string | null>(null);
  const [loggedInManagerRole, setLoggedInManagerRole] = useState<'gerente_tienda' | 'capitan_piso'>('gerente_tienda');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'staff' | 'shifts' | 'cash_metrics' | 'complaints_coupons'>('staff');

  // Datos operativos de la sucursal y de su misma organización (POL-009)
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [orgStaffList, setOrgStaffList] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [coupons, setCoupons] = useState<ManagerRetentionCoupon[]>([]);
  const [shiftReports, setShiftReports] = useState<ManagerShiftReport[]>([]);
  const [complaints, setComplaints] = useState<Feedback[]>([]);
  const [orders, setOrders] = useState<TableOrder[]>([]);

  // Notificación visual
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado Pestaña 1: Crear Empleado y Asignar Rol + Estación
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('waiter');
  const [newStaffPin, setNewStaffPin] = useState('1234');
  const [newStaffStation, setNewStaffStation] = useState<string>('all');

  // Estado Pestaña 2: Programar Turno (hasta 2 meses / 60 días de anticipación)
  const todayIso = new Date().toISOString().slice(0, 10);
  const maxDateIso = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [shiftStaffId, setShiftStaffId] = useState('');
  const [shiftTargetBranchId, setShiftTargetBranchId] = useState<string>(branchParam || 'res-1');
  const [shiftDate, setShiftDate] = useState(todayIso);
  const [shiftType, setShiftType] = useState<StaffShiftType>('matutino');
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('16:00');
  const [shiftStation, setShiftStation] = useState<KitchenStation>('all');
  const [shiftNotes, setShiftNotes] = useState('');

  // Estado Pestaña 3: Corte de Caja por Turno de Mesero y Métricas al Dueño
  const [selectedWaiterForClose, setSelectedWaiterForClose] = useState('');
  const [closeShiftType, setCloseShiftType] = useState<StaffShiftType>('matutino');
  const [closeCashSales, setCloseCashSales] = useState(3200);
  const [closeCardSales, setCloseCardSales] = useState(5800);
  const [closeTips, setCloseTips] = useState(1250);
  const [closeDiscounts, setCloseDiscounts] = useState(0);

  // Estado Pestaña 4: Crear Cupón de Retención con Límite Mensual y Autorizar Queja
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState(20);
  const [newCouponMonthlyLimit, setNewCouponMonthlyLimit] = useState(20);

  const [authorizingFeedback, setAuthorizingFeedback] = useState<Feedback | null>(null);
  const [selectedCouponForComplaint, setSelectedCouponForComplaint] = useState('');
  const [customDiscountNote, setCustomDiscountNote] = useState('20% de descuento directo en cuenta por incidencia');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    const init = async () => {
      const [allRes, managers] = await Promise.all([
        api.getRestaurants(),
        api.getOrganizationManagers(),
      ]);
      setRestaurants(allRes);
      setOrgManagers(managers);
      if (branchParam && allRes.some((r) => r.id === branchParam)) {
        setSelectedBranchId(branchParam);
      } else if (allRes.length > 0 && !branchParam) {
        setSelectedBranchId(allRes[0].id);
      }
    };
    init();
  }, [branchParam]);

  // POL-009: Aislamiento estricto por Organización — una sucursal jamás ve sucursales ni datos de otra organización
  const currentBranch = restaurants.find((r) => r.id === selectedBranchId) || restaurants[0];
  const currentOrgId = currentBranch?.organization_id || 'org-1';
  const sameOrgBranches = React.useMemo(
    () => filterBranchesBySameOrganization(restaurants, selectedBranchId),
    [restaurants, selectedBranchId]
  );
  const sameOrgBranchIds = React.useMemo(
    () => sameOrgBranches.map((b) => b.id),
    [sameOrgBranches]
  );
  const sameOrgManagers = React.useMemo(
    () =>
      orgManagers.filter((m) =>
        isSameOrganizationAccessAllowed(m.organization_id || 'org-1', currentOrgId)
      ),
    [orgManagers, currentOrgId]
  );

  const loadBranchData = async () => {
    const branchIds = sameOrgBranchIds.length > 0 ? sameOrgBranchIds : [selectedBranchId];
    const [staffData, orgStaffData, shiftsData, couponsData, reportsData, allFeedback, ordersData] = await Promise.all([
      api.getStaffMembers(selectedBranchId),
      api.getOrganizationStaffMembers(currentOrgId, branchIds),
      api.getStaffShifts(selectedBranchId),
      api.getManagerRetentionCoupons(selectedBranchId),
      api.getManagerShiftReports(selectedBranchId, currentOrgId),
      api.getFeedbacks(),
      api.getTableOrders(selectedBranchId),
    ]);
    setStaffList(staffData);
    setOrgStaffList(orgStaffData.length > 0 ? orgStaffData : staffData);
    setShifts(shiftsData);
    setCoupons(couponsData);
    setShiftReports(reportsData);
    setComplaints(allFeedback.filter((f) => (!selectedBranchId || f.restaurant_id === selectedBranchId) && f.rating <= 3));
    setOrders(ordersData);
    setShiftTargetBranchId(selectedBranchId);

    const combinedPool = orgStaffData.length > 0 ? orgStaffData : staffData;
    if (!shiftStaffId && combinedPool.length > 0) {
      setShiftStaffId(combinedPool[0].id);
    }
    const firstWaiter = staffData.find((s) => s.role === 'waiter');
    if (!selectedWaiterForClose && firstWaiter) {
      setSelectedWaiterForClose(firstWaiter.name);
    }
    if (!selectedCouponForComplaint && couponsData.length > 0) {
      setSelectedCouponForComplaint(couponsData[0].id);
    }
  };

  useEffect(() => {
    loadBranchData();
  }, [selectedBranchId, sameOrgBranchIds.length]);

  const handleBranchChange = (branchId: string) => {
    if (sameOrgBranchIds.length > 0 && !sameOrgBranchIds.includes(branchId)) {
      showToast('Acceso denegado: No tienes acceso a sucursales de otra organización.');
      return;
    }
    setSelectedBranchId(branchId);
    setShiftTargetBranchId(branchId);
    setSearchParams({ branch: branchId });
  };

  const handleManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    // Verificar únicamente en la tabla de gerentes de la MISMA organización (POL-009)
    const matchedOrgMgr = sameOrgManagers.find(
      (m) => m.is_active && (m.pin_code === pinInput || pinInput === '8888' || pinInput === '9999' || pinInput === '1234')
    );
    if (matchedOrgMgr) {
      setLoggedInManagerName(matchedOrgMgr.name);
      const roleInBranch = matchedOrgMgr.branch_roles?.[selectedBranchId] || matchedOrgMgr.manager_role;
      setLoggedInManagerRole(roleInBranch === 'capitan_piso' ? 'capitan_piso' : 'gerente_tienda');
      setPinInput('');
      return;
    }

    const res = await api.loginStaffWithPin(selectedBranchId, pinInput, sameOrgBranchIds);
    if (res.success && res.staff) {
      setLoggedInManagerName(res.staff.name);
      setLoggedInManagerRole('gerente_tienda');
      setPinInput('');
    } else {
      setPinError(res.error || 'PIN de Gerente inválido. Usa 8888, 9999 o 1234 en modo demo.');
    }
  };

  // Pestaña 1: Crear empleado con su rol y pantalla/estación asignada
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const allowedStations: KitchenStation[] =
      newStaffStation === 'cocina'
        ? ['cocina']
        : newStaffStation === 'barista'
        ? ['barra', 'postres']
        : newStaffStation === 'barra'
        ? ['barra']
        : newStaffStation === 'postres'
        ? ['postres']
        : ['all'];

    await api.createStaffMember({
      restaurant_id: selectedBranchId,
      name: newStaffName.trim(),
      role: newStaffRole,
      pin_code: newStaffPin.trim() || '1234',
      is_active: true,
      allowed_stations: allowedStations,
    });

    setNewStaffName('');
    setNewStaffPin(Math.floor(1000 + Math.random() * 9000).toString());
    await loadBranchData();
    showToast(`Empleado registrado y asignado a su estación operativa.`);
  };

  const handleUpdateStaffRoleAndStation = async (
    member: StaffMember,
    nextRole: StaffRole,
    stationGroup: string
  ) => {
    const allowedStations: KitchenStation[] =
      stationGroup === 'cocina'
        ? ['cocina']
        : stationGroup === 'barista'
        ? ['barra', 'postres']
        : stationGroup === 'barra'
        ? ['barra']
        : stationGroup === 'postres'
        ? ['postres']
        : ['all'];

    await api.updateStaffMember(member.id, {
      role: nextRole,
      allowed_stations: allowedStations,
    });
    await loadBranchData();
    showToast(`Permisos de rol y estación actualizados para ${member.name}.`);
  };

  // Pestaña 2: Crear turno (hasta 60 días de anticipación) y movimientos de personal entre sucursales de la misma organización (POL-009)
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const pool = orgStaffList.length > 0 ? orgStaffList : staffList;
    const staffObj = pool.find((s) => s.id === shiftStaffId) || pool[0];
    if (!staffObj) return;

    const targetBranch = shiftTargetBranchId || selectedBranchId;
    const allowedIds = sameOrgBranchIds.length > 0 ? sameOrgBranchIds : [selectedBranchId];

    const res = await api.scheduleInterBranchStaffShift({
      sourceBranchId: staffObj.restaurant_id || selectedBranchId,
      targetBranchId: targetBranch,
      organizationId: currentOrgId,
      allowedBranchIds: allowedIds,
      shift: {
        staff_id: staffObj.id,
        staff_name: staffObj.name,
        staff_role: staffObj.role,
        shift_date: shiftDate,
        shift_type: shiftType,
        start_time: shiftStartTime,
        end_time: shiftEndTime,
        assigned_station: shiftStation,
        assigned_tables: ['Mesa 1', 'Mesa 2', 'Mesa 3'],
        notes: shiftNotes.trim() || null,
        created_by_manager: loggedInManagerName || 'Gerente de Tienda',
      },
    });

    if (!res.success) {
      showToast(res.error || 'No se pudo programar el turno.');
      return;
    }

    setShiftNotes('');
    await loadBranchData();
    const destBranchName = sameOrgBranches.find((b) => b.id === targetBranch)?.name || 'Sucursal Destino';
    const isInterBranch = (staffObj.restaurant_id || selectedBranchId) !== targetBranch;
    showToast(
      isInterBranch
        ? `Movimiento Inter-Sucursal registrado: ${staffObj.name} asignado a ${destBranchName} el ${shiftDate}.`
        : `Turno programado para ${staffObj.name} el ${shiftDate}.`
    );
  };

  const handleDeleteShift = async (shiftId: string) => {
    await api.deleteStaffShift(shiftId);
    await loadBranchData();
    showToast('Turno eliminado del calendario.');
  };

  // Pestaña 3: Generar corte de caja por turno de mesero y enviar métricas al dueño

  const computedTableMetrics = React.useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    orders.forEach((o) => {
      const prev = map.get(o.table_number) || { count: 0, total: 0 };
      map.set(o.table_number, {
        count: prev.count + 1,
        total: prev.total + (Number(o.total_amount) || 0),
      });
    });
    if (map.size === 0) {
      return [
        { table_number: 'Mesa 1', orders_count: 4, total_amount: 2450, average_ticket: 612 },
        { table_number: 'Mesa 2', orders_count: 3, total_amount: 1900, average_ticket: 633 },
        { table_number: 'Mesa 4', orders_count: 5, total_amount: 4650, average_ticket: 930 },
      ];
    }
    return Array.from(map.entries()).map(([table_number, val]) => ({
      table_number,
      orders_count: val.count,
      total_amount: val.total,
      average_ticket: Math.round(val.total / Math.max(1, val.count)),
    }));
  }, [orders]);

  const computedEmployeeMetrics = React.useMemo(() => {
    const totalSales = Number(closeCashSales) + Number(closeCardSales);
    return staffList.map((s) => ({
      staff_name: s.name,
      role: s.role,
      tables_served: s.role === 'waiter' ? 12 : s.role === 'hostess' ? 18 : 10,
      sales_generated: s.role === 'waiter' ? totalSales : Math.round(totalSales * 0.6),
      tips_estimated: s.role === 'waiter' ? Number(closeTips) : Math.round(Number(closeTips) * 0.15),
      calls_attended: s.role === 'waiter' ? 16 : 9,
    }));
  }, [staffList, closeCashSales, closeCardSales, closeTips]);

  const handleGenerateShiftCloseAndSendMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalSales = Number(closeCashSales) + Number(closeCardSales);

    await api.submitDailyCashClose({
      restaurant_id: selectedBranchId,
      shift_date: todayIso,
      closed_by_name: `${loggedInManagerName} (Turno: ${selectedWaiterForClose || 'Mesero en Sala'})`,
      initial_cash_float: 1500,
      gross_sales: totalSales,
      net_sales: Math.max(0, totalSales - Number(closeDiscounts)),
      cash_sales: Number(closeCashSales),
      card_sales: Number(closeCardSales),
      discounts_total: Number(closeDiscounts),
      tips_total: Number(closeTips),
      cash_counted: 1500 + Number(closeCashSales),
      cash_difference: 0,
      status: 'balanced',
    });

    await api.createManagerShiftReport({
      organization_id: currentBranch?.organization_id || 'org-1',
      restaurant_id: selectedBranchId,
      branch_name: currentBranch?.name || 'Sucursal Principal',
      manager_name: loggedInManagerName || 'Gerente de Tienda',
      waiter_name: selectedWaiterForClose || 'Marco Antonio (Mesero)',
      shift_type: closeShiftType,
      shift_date: todayIso,
      tables_served: computedTableMetrics.reduce((acc, m) => acc + m.orders_count, 0),
      total_sales: totalSales,
      cash_sales: Number(closeCashSales),
      card_sales: Number(closeCardSales),
      tips_collected: Number(closeTips),
      discounts_authorized: Number(closeDiscounts),
      table_metrics: computedTableMetrics,
      employee_metrics: computedEmployeeMetrics,
      sent_to_owner: true,
    });

    await loadBranchData();
    showToast('Corte de caja generado y métricas por mesa y empleado enviadas a la pantalla del Dueño.');
  };

  // Pestaña 4: Crear cupón propio del gerente con límite mensual y autorizar descuento por queja
  const handleCreateManagerCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponTitle.trim()) return;

    await api.createManagerRetentionCoupon({
      restaurant_id: selectedBranchId,
      manager_name: loggedInManagerName || 'Gerente de Tienda',
      coupon_code: newCouponCode.trim().toUpperCase(),
      title: newCouponTitle.trim(),
      discount_description: newCouponDesc.trim() || `${newCouponPercent}% de descuento autorizado por Gerencia`,
      discount_percentage: Number(newCouponPercent) || 20,
      monthly_limit: Math.max(1, Number(newCouponMonthlyLimit) || 20),
      is_active: true,
    });

    setNewCouponCode('');
    setNewCouponTitle('');
    setNewCouponDesc('');
    await loadBranchData();
    showToast('Cupón de gerencia creado con límite mensual configurado.');
  };

  const handleConfirmAuthorizeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorizingFeedback) return;

    const res = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: authorizingFeedback.id,
      restaurantId: selectedBranchId,
      couponId: selectedCouponForComplaint || undefined,
      customDiscountText: customDiscountNote,
      managerName: loggedInManagerName || 'Gerente de Tienda',
    });

    if (!res.success) {
      showToast(res.error || 'No se pudo autorizar el cupón.');
      return;
    }

    setAuthorizingFeedback(null);
    await loadBranchData();
    showToast('Descuento y cupón de retención autorizados por Gerencia para la queja.');
  };

  if (!loggedInManagerName) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Portal del Dueño
            </Link>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              Gerencia de Sucursal
            </span>
          </div>

          <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-400">
            <Lock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-center mb-1">Consola de Gerente de Tienda</h1>
          <p className="text-slate-400 text-xs text-center mb-6">
            Gestión de empleados y estaciones KDS, turnos a 2 meses, cortes de caja por mesero y autorización de cupones por quejas
          </p>

          {sameOrgBranches.length > 0 && (
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sucursal Asignada (Misma Organización)
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                {sameOrgBranches.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.branch_name || 'Principal'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleManagerLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                PIN de Gerente / Capitán de Piso
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                autoFocus
                className="w-full text-center text-3xl tracking-[0.8em] font-black py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {pinError && (
              <p className="text-rose-400 text-xs font-bold text-center bg-rose-950/50 border border-rose-800/50 py-2 px-3 rounded-xl">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Entrar a Consola de Gerente
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-500">
              PIN Demo Gerente de Tienda: <strong className="text-slate-300">8888</strong> • Capitán de Piso:{' '}
              <strong className="text-slate-300">9999</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStationSelectValue = (member: StaffMember): string => {
    const st = member.allowed_stations || [];
    if (st.includes('cocina') && st.length === 1) return 'cocina';
    if (st.includes('barra') && st.includes('postres')) return 'barista';
    if (st.includes('barra') && st.length === 1) return 'barra';
    if (st.includes('postres') && st.length === 1) return 'postres';
    return 'all';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Encabezado de Gerente de Tienda */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/portal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Ir al Portal General"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h1 className="text-lg font-black tracking-tight">
                  Consola Operativa de Gerente de Tienda
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase">
                  {loggedInManagerRole === 'capitan_piso' ? 'Capitán de Piso' : 'Gerente de Tienda'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Responsable en turno: <strong className="text-white">{loggedInManagerName}</strong> • Sucursal:{' '}
                <strong className="text-indigo-300">{currentBranch?.name || 'Sucursal Principal'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {sameOrgBranches.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none"
                >
                  {sameOrgBranches.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              to={`/portal/hostess?branch=${selectedBranchId}`}
              className="px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 text-xs font-bold flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Pantalla Hostess
            </Link>

            <Link
              to={`/portal/mesero?branch=${selectedBranchId}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Pantalla Mesero
            </Link>

            <Link
              to={`/portal/cocina?branch=${selectedBranchId}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" /> KDS Cocina & Barra
            </Link>

            <button
              onClick={loadBranchData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Sincronizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setLoggedInManagerName(null)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex-1 p-6 space-y-6">
        {toastMsg && (
          <div className="bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              {toastMsg}
            </span>
            <button onClick={() => setToastMsg(null)} className="text-indigo-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navegación de las 4 Funciones del Gerente de Tienda */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('staff')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">1. Personal & Estaciones</span>
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Crear empleados, roles y asignar pantalla KDS (Cocina vs Barista)
            </p>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'shifts'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">2. Turnos (Hasta 2 Meses)</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Programación anticipada de turnos hasta 60 días ({shifts.length} activos)
            </p>
          </button>

          <button
            onClick={() => setActiveTab('cash_metrics')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'cash_metrics'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">3. Cortes & Métricas</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Corte de caja por turno de mesero y envío de métricas al Dueño
            </p>
          </button>

          <button
            onClick={() => setActiveTab('complaints_coupons')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'complaints_coupons'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">4. Quejas & Cupones</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Autorizar descuentos por quejas y cupones con límite mensual
            </p>
          </button>
        </div>

        {/* PESTAÑA 1: EMPLEADOS, ROLES Y ASIGNACIÓN DE PANTALLAS / ESTACIONES KDS */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario: Alta de Empleado */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 h-fit">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Crear Empleado en Sucursal
              </h2>
              <p className="text-xs text-slate-400">
                Define el puesto del colaborador y gestiona directamente sobre cuál pantalla operativa o estación KDS incide.
              </p>

              <form onSubmit={handleCreateEmployee} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nombre del Empleado *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Ej. Luis Fernando (Barista)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rol Operativo *
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => {
                      const r = e.target.value as StaffRole;
                      setNewStaffRole(r);
                      if (r === 'kitchen') setNewStaffStation('cocina');
                      else if (r === 'barista') setNewStaffStation('barista');
                      else setNewStaffStation('all');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="waiter">Mesero en Sala</option>
                    <option value="kitchen">Jefe de Cocina (Acceso exclusivo Cocina KDS)</option>
                    <option value="barista">Barista (Barra, Coctelería, Repostería y Café)</option>
                    <option value="hostess">Hostess (Recepción, Mesas y Solicitud de Limpieza)</option>
                    <option value="manager">Capitán o Gerente de Piso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pantalla / Estación KDS Asignada por el Gerente *
                  </label>
                  <select
                    value={newStaffStation}
                    onChange={(e) => setNewStaffStation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Todas las Pantallas de su Rol</option>
                    <option value="cocina">Exclusivo: Estación Cocina Caliente (Jefe de Cocina)</option>
                    <option value="barista">Exclusivo: Barra, Coctelería, Repostería & Café (Barista)</option>
                    <option value="barra">Exclusivo: Solo Barra & Coctelería</option>
                    <option value="postres">Exclusivo: Solo Repostería & Café</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    PIN de Acceso (4 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Dar de Alta Empleado
                </button>
              </form>
            </div>

            {/* Lista de Empleados y Control de Estaciones del Gerente */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">
                    Plantilla de la Sucursal ({staffList.length} colaboradores)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cambia el puesto o la pantalla KDS sobre la que incide cada empleado en tiempo real
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden">
                {staffList.map((member) => {
                  const currentStationVal = getStationSelectValue(member);
                  return (
                    <div
                      key={member.id}
                      className="p-4 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{member.name}</span>
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            PIN: {member.pin_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          {member.role === 'kitchen' ? (
                            <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                          ) : member.role === 'barista' ? (
                            <Coffee className="w-3.5 h-3.5 text-teal-400" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          Estaciones habilitadas:{' '}
                          <strong className="text-slate-200">
                            {(member.allowed_stations || ['all']).join(', ').toUpperCase()}
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateStaffRoleAndStation(
                              member,
                              e.target.value as StaffRole,
                              currentStationVal
                            )
                          }
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          <option value="hostess">Hostess / Recepción</option>
                          <option value="waiter">Mesero en Sala</option>
                          <option value="barista">Barista (Barra & Café)</option>
                          <option value="kitchen">Jefe de Cocina</option>
                          <option value="manager">Capitán / Gerente Piso</option>
                        </select>

                        <select
                          value={currentStationVal}
                          onChange={(e) =>
                            handleUpdateStaffRoleAndStation(member, member.role, e.target.value)
                          }
                          className="bg-slate-900 border border-indigo-500/40 rounded-xl px-2.5 py-1.5 text-xs font-bold text-indigo-200"
                          title="Pantalla KDS sobre la que incide este empleado"
                        >
                          <option value="all">Pantalla: General según Rol</option>
                          <option value="cocina">Pantalla: Solo Cocina Caliente KDS</option>
                          <option value="barista">Pantalla: Barra, Coctelería, Repostería & Café</option>
                          <option value="barra">Pantalla: Solo Barra & Coctelería</option>
                          <option value="postres">Pantalla: Solo Repostería & Café</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: ORGANIZADOR DE TURNOS CON HASTA 2 MESES (60 DÍAS) DE ANTICIPACIÓN */}
        {activeTab === 'shifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Programar Turno
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Hasta +2 Meses
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organiza los turnos de meseros, hostess, baristas, jefe de cocina y capitanes desde hoy ({todayIso}) hasta el{' '}
                <strong className="text-emerald-300">{maxDateIso}</strong>.
              </p>

              {/* Tarjeta de Información de Horario Operativo de la Sucursal */}
              {(() => {
                const targetBranchObj = sameOrgBranches.find(
                  (b) => b.id === (shiftTargetBranchId || selectedBranchId)
                );
                const opOpen = targetBranchObj?.opening_time || '08:00';
                const opClose = targetBranchObj?.closing_time || '23:00';
                const opDays = targetBranchObj?.operating_days || 'Lun - Dom';

                return (
                  <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-300 uppercase tracking-wider text-[10px]">
                        Horario Oficial de la Sucursal
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-bold text-[10px]">
                        {opDays}
                      </span>
                    </div>
                    <p className="text-white font-black text-sm">
                      {opOpen} — {opClose}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Al seleccionar un turno, los horarios de entrada y salida se ajustan a la apertura y cierre de esta sucursal.
                    </p>
                  </div>
                );
              })()}

              <form onSubmit={handleCreateShift} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Colaborador de la Organización *
                  </label>
                  <select
                    value={shiftStaffId}
                    onChange={(e) => setShiftStaffId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    {(orgStaffList.length > 0 ? orgStaffList : staffList).map((s) => {
                      const homeBranchName =
                        sameOrgBranches.find((b) => b.id === s.restaurant_id)?.name || 'Sucursal Base';
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role.toUpperCase()}) — {homeBranchName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Sucursal Destino del Turno</span>
                    <span className="text-[10px] font-black text-indigo-300 flex items-center gap-1">
                      <ArrowLeftRight className="w-3 h-3" /> Movimiento entre Sucursales
                    </span>
                  </label>
                  <select
                    value={shiftTargetBranchId || selectedBranchId}
                    onChange={(e) => setShiftTargetBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs font-bold text-indigo-200"
                  >
                    {sameOrgBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.branch_name || 'Sucursal de la Organización'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Permite entre gerentes mover personal a otra sucursal de la misma organización y dejarlo en la planeación.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Fecha del Turno (Máx. 2 meses de anticipación) *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayIso}
                    max={maxDateIso}
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tipo de Turno *
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => {
                      const t = e.target.value as StaffShiftType;
                      setShiftType(t);
                      const targetBranchObj = sameOrgBranches.find(
                        (b) => b.id === (shiftTargetBranchId || selectedBranchId)
                      );
                      const opOpen = targetBranchObj?.opening_time || '08:00';
                      const opClose = targetBranchObj?.closing_time || '23:00';

                      if (t === 'matutino') {
                        setShiftStartTime(opOpen);
                        setShiftEndTime('16:00');
                      } else if (t === 'vespertino') {
                        setShiftStartTime('14:00');
                        setShiftEndTime('22:00');
                      } else if (t === 'nocturno_cierre') {
                        setShiftStartTime('18:00');
                        setShiftEndTime(opClose);
                      } else {
                        setShiftStartTime(opOpen);
                        setShiftEndTime(opClose);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="matutino">Matutino (Apertura)</option>
                    <option value="vespertino">Vespertino (Comida / Tarde)</option>
                    <option value="nocturno_cierre">Nocturno / Cierre</option>
                    <option value="completo">Turno Completo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Hora Entrada</label>
                    <input
                      type="time"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Hora Salida</label>
                    <input
                      type="time"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Estación / Zona Asignada en el Turno
                  </label>
                  <select
                    value={shiftStation}
                    onChange={(e) => setShiftStation(e.target.value as KitchenStation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                  >
                    <option value="all">Salón General / Recepción</option>
                    <option value="cocina">Estación Cocina Caliente KDS</option>
                    <option value="barista">Estación Barista (Barra, Coctelería, Repostería y Café)</option>
                    <option value="barra">Estación Barra de Bebidas</option>
                    <option value="postres">Estación Repostería y Café</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Notas del Turno
                  </label>
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="Ej. Encargado de terraza o cierre de barra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Guardar Turno en Calendario
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">
                    Calendario de Turnos Programados ({shifts.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Horarios asignados por el Gerente de Tienda (horizonte de hasta 2 meses)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {shifts.map((sh) => (
                  <div
                    key={sh.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-black">
                          {sh.shift_date}
                        </span>
                        <span className="font-black text-sm text-white">{sh.staff_name}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sh.shift_type} ({sh.start_time} - {sh.end_time})
                        </span>
                        {sh.notes?.includes('[Movimiento Inter-Sucursal') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase">
                            <ArrowLeftRight className="w-3 h-3" /> Movimiento Inter-Sucursal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Estación: <strong className="text-slate-200">{sh.assigned_station || 'all'}</strong>
                        {sh.notes && <span>• Nota: {sh.notes}</span>}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteShift(sh.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 self-end sm:self-center cursor-pointer"
                      title="Eliminar turno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: CORTES DE CAJA POR TURNO DE MESEROS Y ENVÍO DE MÉTRICAS AL DUEÑO */}
        {activeTab === 'cash_metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 h-fit">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" /> Generar Corte por Turno de Mesero
              </h2>
              <p className="text-xs text-slate-400">
                Cierra el turno del mesero y envía las métricas detalladas de cada mesa y cada empleado a la pantalla general del Dueño.
              </p>

              <form onSubmit={handleGenerateShiftCloseAndSendMetrics} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mesero / Turno a Cortar *
                  </label>
                  <select
                    value={selectedWaiterForClose}
                    onChange={(e) => setSelectedWaiterForClose(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    {staffList
                      .filter((s) => s.role === 'waiter' || s.role === 'manager')
                      .map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Turno Operativo
                  </label>
                  <select
                    value={closeShiftType}
                    onChange={(e) => setCloseShiftType(e.target.value as StaffShiftType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                  >
                    <option value="matutino">Turno Matutino</option>
                    <option value="vespertino">Turno Vespertino</option>
                    <option value="nocturno_cierre">Turno Nocturno / Cierre</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Ventas Efectivo ($ MXN)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={closeCashSales}
                      onChange={(e) => setCloseCashSales(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Ventas Tarjeta ($ MXN)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={closeCardSales}
                      onChange={(e) => setCloseCardSales(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Propinas del Turno ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={closeTips}
                      onChange={(e) => setCloseTips(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Descuentos por Queja ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={closeDiscounts}
                      onChange={(e) => setCloseDiscounts(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Generar Corte y Enviar Métricas al Dueño
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Vista previa de Métricas por Mesa y por Empleado */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                  Métricas por Mesa y por Empleado en este Turno (Se sincronizan con el Dueño)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-white uppercase">Rendimiento por Mesa</h4>
                    {computedTableMetrics.map((tm) => (
                      <div
                        key={tm.table_number}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900 last:border-0"
                      >
                        <span className="font-bold text-slate-200">
                          {tm.table_number} ({tm.orders_count} comandas)
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          ${tm.total_amount.toLocaleString('es-MX')} MXN
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-white uppercase">Rendimiento por Empleado</h4>
                    {computedEmployeeMetrics.map((em) => (
                      <div
                        key={em.staff_name}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900 last:border-0"
                      >
                        <span className="font-bold text-slate-200 truncate max-w-[170px]">
                          {em.staff_name}
                        </span>
                        <span className="font-mono font-bold text-indigo-300">
                          {em.tables_served} mesas • ${em.sales_generated.toLocaleString('es-MX')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Historial de Cortes Enviados al Dueño */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                <h3 className="text-sm font-black text-white">
                  Historial de Cortes de Turno Enviados al Dueño ({shiftReports.length})
                </h3>
                <div className="space-y-2.5">
                  {shiftReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{rep.waiter_name}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold text-[10px] uppercase">
                            Turno {rep.shift_type} • {rep.shift_date}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
                            Enviado al Dueño
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">
                          Mesas atendidas: <strong className="text-white">{rep.tables_served}</strong> • Efectivo: $
                          {Number(rep.cash_sales).toLocaleString('es-MX')} • Tarjeta: $
                          {Number(rep.card_sales).toLocaleString('es-MX')} • Propinas: $
                          {Number(rep.tips_collected).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400">
                          ${Number(rep.total_sales).toLocaleString('es-MX')} MXN
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Autorizó: {rep.manager_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: NOTIFICACIONES DE QUEJAS, AUTORIZACIÓN DE DESCUENTOS Y CUPONES CON LÍMITE MENSUAL */}
        {activeTab === 'complaints_coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Creador de Cupones de Retención del Gerente con Límite Mensual */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-400" /> Crear Cupón de Gerente
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Límite Mensual
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Crea tus propios cupones para compensar quejas o incentivar próximas visitas y establece el límite máximo de usos al mes.
              </p>

              <form onSubmit={handleCreateManagerCoupon} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Código del Cupón *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej. GERENTE-CORTESIA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Título del Beneficio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCouponTitle}
                    onChange={(e) => setNewCouponTitle(e.target.value)}
                    placeholder="Ej. 25% OFF en Próxima Visita por Garantía de Servicio"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      % Descuento
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newCouponPercent}
                      onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Límite Mensual *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={newCouponMonthlyLimit}
                      onChange={(e) => setNewCouponMonthlyLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-black text-purple-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Condiciones / Descripción
                  </label>
                  <input
                    type="text"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="Válido en consumo en sala o próxima visita"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  Guardar Cupón con Límite Mensual
                </button>
              </form>

              {/* Lista de Cupones del Gerente y su Consumo Mensual */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tus Cupones Activos y Cupo del Mes
                </h3>
                {coupons.map((c) => {
                  const pct = Math.min(100, Math.round((c.used_this_month / Math.max(1, c.monthly_limit)) * 100));
                  return (
                    <div key={c.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-purple-300">{c.coupon_code}</span>
                        <span className="text-[11px] font-bold text-slate-300">
                          Usados este mes: <strong>{c.used_this_month}</strong> / {c.monthly_limit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{c.title}</p>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : 'bg-purple-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bandeja de Notificaciones de Quejas y Autorización del Gerente */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <MessageSquareWarning className="w-5 h-5 text-rose-400" />
                    Notificaciones de Quejas en Sucursal ({complaints.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Autoriza descuentos directos por quejas o asigna un cupón de gerencia para su próxima visita
                  </p>
                </div>
              </div>

              {complaints.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold bg-slate-950/50 rounded-2xl border border-slate-800">
                  No hay quejas registradas en esta sucursal.
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black">
                            Calificación: {fb.rating} / 5
                          </span>
                          <span className="font-black text-sm text-white">
                            {fb.customer_name || 'Comensal en Mesa'}
                          </span>
                          {fb.tag_code && (
                            <span className="font-mono text-[11px] text-slate-400">
                              Tag: {fb.tag_code}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              fb.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {fb.status === 'resolved' ? 'Atendida / Autorizada' : 'Pendiente de Autorización'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 italic">"{fb.comments}"</p>
                        {fb.internal_notes && (
                          <p className="text-[11px] text-emerald-300 font-bold pt-1">
                            {fb.internal_notes}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setAuthorizingFeedback(fb)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shrink-0 cursor-pointer"
                      >
                        Autorizar Descuento / Cupón
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Autorizar Descuento o Cupón de Próxima Visita por Queja */}
      {authorizingFeedback && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                Autorizar Compensación por Queja
              </h3>
              <button
                onClick={() => setAuthorizingFeedback(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-1">
              <span className="font-black text-rose-300">
                Queja de {authorizingFeedback.customer_name || 'Comensal'} ({authorizingFeedback.rating} estrellas):
              </span>
              <p className="text-slate-200 italic">"{authorizingFeedback.comments}"</p>
            </div>

            <form onSubmit={handleConfirmAuthorizeComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cupón de Retención / Próxima Visita (Descuenta de tu límite mensual)
                </label>
                <select
                  value={selectedCouponForComplaint}
                  onChange={(e) => setSelectedCouponForComplaint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                >
                  <option value="">Solo descuento directo en cuenta actual (sin cupón)</option>
                  {coupons.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      disabled={c.used_this_month >= c.monthly_limit}
                    >
                      {c.coupon_code} — {c.title} ({c.used_this_month}/{c.monthly_limit} mes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descuento Autorizado en Cuenta / Nota de Resolución
                </label>
                <input
                  type="text"
                  required
                  value={customDiscountNote}
                  onChange={(e) => setCustomDiscountNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthorizingFeedback(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                >
                  Confirmar Autorización de Gerente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
