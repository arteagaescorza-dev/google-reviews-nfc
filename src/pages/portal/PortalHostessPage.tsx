import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  LogOut,
  RefreshCw,
  ArrowLeft,
  Power,
  UserCheck,
  Edit2,
  Trash2,
  X,
  BellRing,
  Utensils,
  Building2,
} from 'lucide-react';
import { api } from '../../lib/api';
import type {
  Restaurant,
  RestaurantTable,
  RestaurantTableStatus,
  StaffMember,
  TableCall,
} from '../../types';

export const PortalHostessPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const branchParam = searchParams.get('branch') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchParam || 'res-1');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [activeCalls, setActiveCalls] = useState<TableCall[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado de sesión por PIN (Hostess / Capitán de Piso / Gerente)
  const [loggedInStaff, setLoggedInStaff] = useState<StaffMember | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Filtro de estado de mesas
  const [statusFilter, setStatusFilter] = useState<'todas' | RestaurantTableStatus>('todas');

  // Modal para crear / editar mesa
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [capacityInput, setCapacityInput] = useState(4);
  const [assignedWaiterInput, setAssignedWaiterInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savingTable, setSavingTable] = useState(false);

  // Modal rápido para ocupar mesa con número de comensales
  const [seatingTable, setSeatingTable] = useState<RestaurantTable | null>(null);
  const [guestsToSeat, setGuestsToSeat] = useState(2);
  const [waiterForSeating, setWaiterForSeating] = useState('');

  // Notificación visual temporal
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    const initBranches = async () => {
      const allRes = await api.getRestaurants();
      setRestaurants(allRes);
      if (branchParam && allRes.some((r) => r.id === branchParam)) {
        setSelectedBranchId(branchParam);
      } else if (allRes.length > 0 && !branchParam) {
        setSelectedBranchId(allRes[0].id);
      }
    };
    initBranches();
  }, [branchParam]);

  const loadOperationalData = async () => {
    const [tablesData, staffData, callsData] = await Promise.all([
      api.getRestaurantTables(selectedBranchId),
      api.getStaffMembers(selectedBranchId),
      api.getTableCalls(selectedBranchId),
    ]);
    setTables(tablesData);
    setStaffList(staffData);
    setActiveCalls(callsData.filter((c) => c.status === 'active'));
    setLoading(false);
  };

  useEffect(() => {
    loadOperationalData();
    const interval = setInterval(loadOperationalData, 4000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    setSearchParams({ branch: newBranchId });
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const res = await api.loginStaffWithPin(selectedBranchId, pinInput);
    if (res.success && res.staff) {
      setLoggedInStaff(res.staff);
      setPinInput('');
    } else {
      setPinError(res.error || 'PIN inválido');
    }
  };

  const openNewTableModal = () => {
    setEditingTable(null);
    setTableNumberInput(`Mesa ${tables.length + 1}`);
    setCapacityInput(4);
    const defaultWaiter = staffList.find((s) => s.role === 'waiter' && s.is_active)?.name || '';
    setAssignedWaiterInput(defaultWaiter);
    setNotesInput('');
    setIsTableModalOpen(true);
  };

  const openEditTableModal = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableNumberInput(table.table_number);
    setCapacityInput(table.capacity);
    setAssignedWaiterInput(table.assigned_waiter_name || '');
    setNotesInput(table.notes || '');
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim()) return;
    setSavingTable(true);
    try {
      await api.saveRestaurantTable({
        id: editingTable?.id,
        restaurant_id: selectedBranchId,
        table_number: tableNumberInput.trim(),
        capacity: Math.max(1, Number(capacityInput) || 4),
        current_guests: editingTable ? editingTable.current_guests : 0,
        status: editingTable ? editingTable.status : 'libre',
        assigned_waiter_name: assignedWaiterInput || null,
        notes: notesInput.trim() || null,
      });
      setIsTableModalOpen(false);
      await loadOperationalData();
      showToast(editingTable ? `Configuración de ${tableNumberInput} actualizada.` : `${tableNumberInput} creada en la sucursal.`);
    } finally {
      setSavingTable(false);
    }
  };

  const handleDeleteTable = async (table: RestaurantTable) => {
    await api.deleteRestaurantTable(table.id);
    await loadOperationalData();
    showToast(`${table.table_number} eliminada de la sucursal.`);
  };

  const handleOpenSeatModal = (table: RestaurantTable) => {
    setSeatingTable(table);
    setGuestsToSeat(Math.min(2, table.capacity));
    setWaiterForSeating(
      table.assigned_waiter_name ||
        staffList.find((s) => s.role === 'waiter' && s.is_active)?.name ||
        ''
    );
  };

  const handleConfirmSeating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatingTable) return;
    await api.updateRestaurantTableStatus(
      seatingTable.id,
      'ocupada',
      Math.max(1, Math.min(seatingTable.capacity, Number(guestsToSeat) || 1)),
      waiterForSeating || undefined
    );
    const tableName = seatingTable.table_number;
    setSeatingTable(null);
    await loadOperationalData();
    showToast(`${tableName} marcada como Ocupada (${guestsToSeat} comensales).`);
  };

  const handleRequestCleaning = async (table: RestaurantTable) => {
    await api.requestTableCleaning(selectedBranchId, table);
    await loadOperationalData();
    showToast(`Solicitud de limpieza enviada al mesero para ${table.table_number}.`);
  };

  const handleSetTableStatus = async (table: RestaurantTable, newStatus: RestaurantTableStatus) => {
    await api.updateRestaurantTableStatus(
      table.id,
      newStatus,
      newStatus === 'ocupada' ? Math.max(1, table.current_guests || 2) : 0
    );

    // Si la hostess marca manualmente la mesa como libre y había un llamado de limpieza activo, resolverlo también
    if (newStatus === 'libre') {
      const cleaningCall = activeCalls.find(
        (c) =>
          c.call_type === 'cleaning' &&
          c.table_number.trim().toLowerCase() === table.table_number.trim().toLowerCase()
      );
      if (cleaningCall) {
        await api.resolveTableCall(cleaningCall.id, loggedInStaff?.name || 'Hostess');
      }
    }

    await loadOperationalData();
    const statusLabels: Record<RestaurantTableStatus, string> = {
      libre: 'Desocupada (Libre)',
      ocupada: 'Ocupada',
      en_limpieza: 'En Limpieza',
      desactivada: 'Desactivada',
    };
    showToast(`${table.table_number} cambiada a estado: ${statusLabels[newStatus]}.`);
  };

  const currentBranch = restaurants.find((r) => r.id === selectedBranchId);
  const waiters = staffList.filter((s) => (s.role === 'waiter' || s.role === 'manager') && s.is_active);

  // Métricas en vivo de la sucursal
  const freeTablesCount = tables.filter((t) => t.status === 'libre').length;
  const occupiedTablesCount = tables.filter((t) => t.status === 'ocupada').length;
  const cleaningTablesCount = tables.filter((t) => t.status === 'en_limpieza').length;
  const disabledTablesCount = tables.filter((t) => t.status === 'desactivada').length;
  const totalCapacity = tables
    .filter((t) => t.status !== 'desactivada')
    .reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
  const totalSeatedGuests = tables
    .filter((t) => t.status === 'ocupada')
    .reduce((acc, t) => acc + (Number(t.current_guests) || 0), 0);

  const filteredTables =
    statusFilter === 'todas' ? tables : tables.filter((t) => t.status === statusFilter);

  if (!loggedInStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Portal
            </Link>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-black uppercase tracking-wider">
              Recepción & Hostess
            </span>
          </div>

          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-violet-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-center mb-1">Terminal de Hostess</h1>
          <p className="text-slate-400 text-xs text-center mb-6">
            Control de mesas por sucursal, aforo de comensales y solicitud de limpieza a meseros en sala
          </p>

          {restaurants.length > 1 && (
            <div className="mb-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sucursal Operativa
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.branch_name || 'Principal'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                PIN de Acceso (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-[0.8em] font-black py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-rose-400 text-xs font-bold text-center bg-rose-950/50 border border-rose-800/50 py-2 px-3 rounded-xl">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              Ingresar a Recepción de Mesas
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-500">
              PIN Demo Hostess: <strong className="text-slate-300">1111</strong> o{' '}
              <strong className="text-slate-300">1234</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              PIN Capitán / Gerente: <strong className="text-slate-300">9999</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Barra Superior de Hostess */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/portal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Volver al Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                <h1 className="text-lg font-black tracking-tight">
                  Hostess & Recepción — Control de Mesas
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Operador activo: <strong className="text-slate-200">{loggedInStaff.name}</strong> •{' '}
                Sucursal: <strong className="text-violet-300">{currentBranch?.name || 'Sucursal Principal'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {restaurants.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Building2 className="w-4 h-4 text-violet-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={openNewTableModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear Mesa en Sucursal
            </button>

            <Link
              to={`/portal/mesero?branch=${selectedBranchId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" /> Ver Terminal Mesero
            </Link>

            <button
              onClick={loadOperationalData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Sincronizar estado de mesas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setLoggedInStaff(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex-1 p-6 space-y-6">
        {toastMessage && (
          <div className="bg-violet-950/90 border border-violet-500/40 text-violet-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-violet-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPIs de Estado de Mesas y Aforo de Comensales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Desocupadas (Libres)</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white">{freeTablesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Listas para asignar comensales</p>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-blue-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Mesas Ocupadas</span>
              <Utensils className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white">{occupiedTablesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">En servicio activo</p>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">En Limpieza</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white">{cleaningTablesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Notificadas a mesero en sala</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Desactivadas</span>
              <Power className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white">{disabledTablesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Fuera de servicio / reservadas</p>
          </div>

          <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-4 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-violet-400 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Comensales / Aforo</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-3xl font-black text-white">
              {totalSeatedGuests} <span className="text-base font-bold text-slate-400">/ {totalCapacity}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Capacidad total activa en sala</p>
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'todas', label: `Todas (${tables.length})` },
                { id: 'libre', label: `Desocupadas (${freeTablesCount})` },
                { id: 'ocupada', label: `Ocupadas (${occupiedTablesCount})` },
                { id: 'en_limpieza', label: `En Limpieza (${cleaningTablesCount})` },
                { id: 'desactivada', label: `Desactivadas (${disabledTablesCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Al solicitar limpieza, el mesero recibe una alerta en vivo en su terminal
          </span>
        </div>

        {/* Cuadrícula de Mesas de la Sucursal */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm font-bold">
            Cargando plano de mesas de la sucursal...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-base font-bold text-slate-300">
              No hay mesas registradas en este filtro para la sucursal
            </p>
            <button
              onClick={openNewTableModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear Primera Mesa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTables.map((table) => {
              const hasActiveCleaningCall = activeCalls.some(
                (c) =>
                  c.call_type === 'cleaning' &&
                  c.table_number.trim().toLowerCase() === table.table_number.trim().toLowerCase()
              );

              const statusStyles: Record<
                RestaurantTableStatus,
                { badge: string; border: string; label: string }
              > = {
                libre: {
                  badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  border: 'border-emerald-500/30 hover:border-emerald-500/60',
                  label: 'DESOCUPADA / LIBRE',
                },
                ocupada: {
                  badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                  border: 'border-blue-500/40 hover:border-blue-500/70',
                  label: 'OCUPADA',
                },
                en_limpieza: {
                  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
                  border: 'border-amber-500/50 hover:border-amber-400',
                  label: 'EN LIMPIEZA',
                },
                desactivada: {
                  badge: 'bg-slate-800 text-slate-400 border-slate-700',
                  border: 'border-slate-800 opacity-75',
                  label: 'DESACTIVADA',
                },
              };

              const style = statusStyles[table.status];

              return (
                <div
                  key={table.id}
                  className={`bg-slate-900 border-2 ${style.border} rounded-3xl p-5 flex flex-col justify-between transition-all shadow-lg`}
                >
                  <div>
                    {/* Cabecera de la tarjeta de mesa */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {table.table_number}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-violet-400" />
                          Capacidad total:{' '}
                          <strong className="text-slate-200">{table.capacity} comensales</strong>
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    {/* Detalle de comensales actuales y mesero asignado */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 mb-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Comensales sentados:</span>
                        <span className="font-black text-white">
                          {table.status === 'ocupada' ? `${table.current_guests} / ${table.capacity}` : `0 / ${table.capacity}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mesero asignado:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[170px]">
                          {table.assigned_waiter_name || 'Cualquier mesero en turno'}
                        </span>
                      </div>
                      {table.notes && (
                        <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                          Ubicación / Nota: <span className="text-slate-300">{table.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Alerta en vivo si ya se notificó limpieza al mesero */}
                    {(table.status === 'en_limpieza' || hasActiveCleaningCall) && (
                      <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 animate-spin" />
                          Limpieza solicitada a mesero
                        </span>
                        <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-md">
                          En espera
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botonera de Acciones Operativas de Hostess */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      {table.status !== 'ocupada' && table.status !== 'desactivada' && (
                        <button
                          onClick={() => handleOpenSeatModal(table)}
                          className="col-span-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" /> Asignar Comensales (Ocupar)
                        </button>
                      )}

                      {table.status !== 'desactivada' && (
                        <button
                          onClick={() => handleRequestCleaning(table)}
                          className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Cambia la mesa a En Limpieza y envía alerta inmediata a la pantalla del mesero"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Solicitar Limpieza
                        </button>
                      )}

                      {table.status !== 'libre' && (
                        <button
                          onClick={() => handleSetTableStatus(table, 'libre')}
                          className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Libre
                        </button>
                      )}
                    </div>

                    {/* Fila secundaria: Activar/Desactivar, Editar y Eliminar */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() =>
                          handleSetTableStatus(
                            table,
                            table.status === 'desactivada' ? 'libre' : 'desactivada'
                          )
                        }
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          table.status === 'desactivada'
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {table.status === 'desactivada' ? 'Activar Mesa' : 'Desactivar Mesa'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTableModal(table)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Editar capacidad o nombre de mesa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Eliminar mesa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Crear o Editar Mesa en la Sucursal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">
                {editingTable ? `Editar ${editingTable.table_number}` : 'Crear Nueva Mesa en Sucursal'}
              </h2>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Identificador o Número de Mesa *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  placeholder="Ej. Mesa 7, Terraza 2, Privado VIP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número Total de Comensales (Capacidad Máxima) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mesero Asignado a la Mesa (Opcional)
                </label>
                <select
                  value={assignedWaiterInput}
                  onChange={(e) => setAssignedWaiterInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-violet-500"
                >
                  <option value="">Cualquier mesero en turno</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Zona / Notas de Ubicación
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ej. Junto a ventanal, Terraza techada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTable}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  {savingTable ? 'Guardando...' : editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Sentar Comensales y Ocupar Mesa */}
      {seatingTable && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">
                Ocupar {seatingTable.table_number}
              </h2>
              <button
                onClick={() => setSeatingTable(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSeating} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Número de comensales a sentar (Máx. {seatingTable.capacity})
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: seatingTable.capacity }, (_, i) => i + 1).map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setGuestsToSeat(num)}
                      className={`w-10 h-10 rounded-xl font-black text-sm transition-all cursor-pointer ${
                        guestsToSeat === num
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mesero encargado de la mesa
                </label>
                <select
                  value={waiterForSeating}
                  onChange={(e) => setWaiterForSeating(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="">Cualquier mesero en turno</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSeatingTable(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  Confirmar Mesa Ocupada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

