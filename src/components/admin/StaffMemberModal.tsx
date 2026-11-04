import React, { useState, useEffect } from 'react';
import type { StaffMember, StaffRole, KitchenStation } from '../../types';
import { api, getDefaultStationsForRole } from '../../lib/api';
import {
  X,
  UserCheck,
  KeyRound,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface StaffMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  restaurantId: string;
  branchName?: string;
  initialRole?: StaffRole;
  onSaved: (savedStaff: StaffMember) => void;
}

export const StaffMemberModal: React.FC<StaffMemberModalProps> = ({
  isOpen,
  onClose,
  staff,
  restaurantId,
  branchName = 'Sucursal',
  initialRole,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>(initialRole || 'waiter');
  const [pinCode, setPinCode] = useState('');
  const [allowedStations, setAllowedStations] = useState<KitchenStation[]>(['cocina']);
  const [zoneName, setZoneName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setRole(staff.role || 'waiter');
      setPinCode(staff.pin_code || '');
      setAllowedStations(staff.allowed_stations && staff.allowed_stations.length > 0 ? staff.allowed_stations : getDefaultStationsForRole(staff.role));
      setZoneName(staff.zone_name || '');
      setIsActive(staff.is_active !== false);
    } else {
      setName('');
      const defaultRole = initialRole || 'waiter';
      setRole(defaultRole);
      generateRandomPin();
      setAllowedStations(getDefaultStationsForRole(defaultRole));
      setZoneName('');
      setIsActive(true);
    }
    setErrorMsg('');
  }, [staff, isOpen, initialRole]);

  const generateRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setPinCode(random);
  };

  const handleToggleStation = (st: KitchenStation) => {
    setAllowedStations((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPin = pinCode.trim();

    if (cleanName.length < 2) {
      setErrorMsg('Ingresa el nombre completo del empleado.');
      return;
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('El PIN debe ser exactamente de 4 dígitos numéricos.');
      return;
    }

    setErrorMsg('');
    setIsSaving(true);

    try {
      if (staff?.id) {
        // Actualización de empleado existente
        const res = await api.updateStaffMember(staff.id, {
          name: cleanName,
          role,
          pin_code: cleanPin,
          allowed_stations: allowedStations,
          zone_name: zoneName.trim() || undefined,
          is_active: isActive,
        });

        setIsSaving(false);
        if (res.success && res.data) {
          onSaved(res.data);
          onClose();
        } else {
          setErrorMsg(res.error || 'Error al actualizar al empleado.');
        }
      } else {
        // Creación de nuevo empleado
        const res = await api.createStaffMember({
          restaurant_id: restaurantId,
          name: cleanName,
          role,
          pin_code: cleanPin,
          allowed_stations: allowedStations,
          zone_name: zoneName.trim() || undefined,
          is_active: isActive,
        });

        setIsSaving(false);
        if (res.success && res.data) {
          onSaved(res.data);
          onClose();
        } else {
          setErrorMsg(res.error || 'Error al dar de alta al empleado.');
        }
      }
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Error inesperado procesando la solicitud.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {staff ? 'Editar Empleado Operativo' : 'Alta de Nuevo Empleado'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Cat 4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {branchName} &middot; Credenciales y permisos en piso & KDS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1">
              Nombre Completo del Empleado
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Méndez"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          {/* Puesto / Rol */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1">
              Puesto Operativo (Rol en Sistema)
            </label>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as StaffRole;
                setRole(newRole);
                if (!staff) {
                  setAllowedStations(getDefaultStationsForRole(newRole));
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="hostess">Hostess / Recepción de Mesas</option>
              <option value="waiter">Mesero de Sala</option>
              <option value="barista">Barista (Barra, Coctelería, Repostería & Café)</option>
              <option value="kitchen">Jefe de Cocina (KDS Cocina)</option>
              <option value="cashier">Cajero / Despachador (Mostrador & Pick Up)</option>
              <option value="manager">Capitán / Gerente de Piso</option>
              <option value="employee">Empleado Operativo / General</option>
            </select>
          </div>

          {/* PIN de Acceso */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  PIN de Acceso (4 dígitos)
                </label>
              </div>
              <button
                type="button"
                onClick={generateRandomPin}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Autogenerar</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-black text-sm text-center text-blue-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <p className="text-[10px] text-slate-500 text-center">
              Se utiliza para iniciar sesión instantáneo en terminales móviles de mesero y pantallas KDS.
            </p>
          </div>

          {/* Estaciones KDS Autorizadas */}
          {(role === 'kitchen' || role === 'barista' || role === 'cashier' || role === 'manager') && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <label className="block text-xs font-extrabold uppercase text-amber-950 tracking-wider">
                Estaciones KDS Autorizadas
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleStation('cocina')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    allowedStations.includes('cocina')
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Cocina KDS
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStation('barista')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    allowedStations.includes('barista')
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Barra & Café
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStation('pickup')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    allowedStations.includes('pickup')
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pick Up & Collect
                </button>
              </div>
            </div>
          )}

          {/* Zona de Piso Opcional */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-1">
              Zona de Piso Asignada (Opcional)
            </label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="Ej. Terraza Exterior, Salón Principal, Mezzanine"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Estado Activo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="block text-xs font-bold text-slate-900">Estado del Empleado</span>
              <span className="text-[10px] text-slate-500">
                {isActive ? 'Acceso PIN habilitado' : 'Acceso PIN pausado temporalmente'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {isActive ? 'Activo' : 'Inactivo'}
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : staff ? 'Guardar Cambios' : 'Dar de Alta Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
