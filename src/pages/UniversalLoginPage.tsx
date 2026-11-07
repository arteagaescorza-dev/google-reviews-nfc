import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';
import type { Restaurant } from '../types';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Delete,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const UniversalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determinar pestaña inicial según parámetros de URL
  const initialType = searchParams.get('type');
  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>(
    initialType === 'staff' || initialType === 'pin' ? 'staff' : 'admin'
  );

  // Estados para Acceso Administrativo (Correo / Contraseña)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Estados para Terminal Operativa (PIN 4 Dígitos)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isChangingBranch, setIsChangingBranch] = useState(false);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Cargar sucursales y restaurar sucursal fijada
  useEffect(() => {
    async function loadBranches() {
      const list = await api.getRestaurants();
      setRestaurants(list);

      const urlBranch = searchParams.get('branch');
      const savedBranch = localStorage.getItem('nfc_enrolled_branch_id');

      if (urlBranch && list.some((r) => r.id === urlBranch)) {
        setSelectedBranchId(urlBranch);
        localStorage.setItem('nfc_enrolled_branch_id', urlBranch);
      } else if (savedBranch && list.some((r) => r.id === savedBranch)) {
        setSelectedBranchId(savedBranch);
      } else if (list.length > 0) {
        setSelectedBranchId(list[0].id);
        localStorage.setItem('nfc_enrolled_branch_id', list[0].id);
      }
    }
    loadBranches();
  }, [searchParams]);

  // Manejar Login Administrativo
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');

    const targetRedirect =
      searchParams.get('redirect') || (location.state as any)?.from?.pathname;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAdminError(error.message || 'Credenciales incorrectas');
        setAdminLoading(false);
        return;
      }

      // Detectar si es Superadmin, Admin de Food Court o Dueño
      const user = data.user;
      const lowerEmail = user?.email?.toLowerCase() || '';
      const isSuperadminEmail =
        lowerEmail === 'arteagaescorza@gmail.com' ||
        user?.app_metadata?.role === 'superadmin';
      const isFoodCourtAdmin =
        lowerEmail.includes('plaza') ||
        lowerEmail.includes('foodcourt') ||
        lowerEmail.includes('galerias') ||
        user?.app_metadata?.role === 'food_court_admin';

      setAdminLoading(false);
      if (targetRedirect) {
        navigate(targetRedirect);
      } else if (isSuperadminEmail) {
        navigate('/admin');
      } else if (isFoodCourtAdmin) {
        navigate('/food-court');
      } else {
        navigate('/portal');
      }
    } else {
      // Modo Demo Local
      setAdminLoading(false);
      const lowerInput = email.toLowerCase();
      if (lowerInput.includes('admin')) {
        localStorage.setItem('nfc_demo_auth', 'true');
        navigate(targetRedirect || '/admin');
      } else if (
        lowerInput.includes('plaza') ||
        lowerInput.includes('foodcourt') ||
        lowerInput.includes('galerias')
      ) {
        localStorage.setItem('nfc_foodcourt_demo_auth', 'true');
        navigate(targetRedirect || '/food-court');
      } else {
        localStorage.setItem('nfc_portal_demo_auth', 'true');
        navigate(targetRedirect || '/portal');
      }
    }
  };

  // Demo directos
  const handleInstantAdminDemo = () => {
    localStorage.setItem('nfc_demo_auth', 'true');
    navigate('/admin');
  };

  const handleInstantPortalDemo = () => {
    localStorage.setItem('nfc_portal_demo_auth', 'true');
    navigate('/portal');
  };

  const handleInstantFoodCourtDemo = () => {
    localStorage.setItem('nfc_foodcourt_demo_auth', 'true');
    navigate('/food-court');
  };

  // Manejar ingreso de dígitos PIN
  const handleKeyClick = (digit: string) => {
    if (pinDigits.length < 4) {
      const newPin = pinDigits + digit;
      setPinDigits(newPin);
      setPinError('');

      if (newPin.length === 4) {
        verifyPinAndRedirect(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pinDigits.length > 0) {
      setPinDigits(pinDigits.slice(0, -1));
      setPinError('');
    }
  };

  const handleClearPin = () => {
    setPinDigits('');
    setPinError('');
  };

  // Verificar PIN y enrutar
  const verifyPinAndRedirect = async (pinToVerify: string) => {
    if (!selectedBranchId) {
      setPinError('Selecciona una sucursal antes de ingresar.');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      // Obtener sucursales hermanas de la misma organización para validar movilidad inter-sucursal
      const allRests = await api.getRestaurants();
      const currentRest = allRests.find((r) => r.id === selectedBranchId);
      const sameOrgBranchIds = currentRest
        ? allRests
            .filter((r) => r.organization_id === currentRest.organization_id)
            .map((r) => r.id)
        : [selectedBranchId];

      const res = await api.loginStaffWithPin(selectedBranchId, pinToVerify, sameOrgBranchIds);

      if (res.success && res.staff) {
        // Almacenar sesión de colaborador en turno
        localStorage.setItem('nfc_active_staff_session', JSON.stringify(res.staff));
        localStorage.setItem('nfc_enrolled_branch_id', selectedBranchId);

        const staffRole = res.staff.role;
        const roleLabel =
          staffRole === 'manager'
            ? 'Gerente / Capitán'
            : staffRole === 'hostess'
            ? 'Hostess'
            : staffRole === 'waiter'
            ? 'Mesero'
            : staffRole === 'kitchen'
            ? 'Cocina'
            : staffRole === 'cashier'
            ? 'Cajero / Mostrador'
            : 'Personal';

        setPinSuccessMsg(`Bienvenido/a, ${res.staff.name} (${roleLabel}). Redirigiendo a tu estación...`);

        setTimeout(() => {
          if (staffRole === 'manager') {
            navigate('/portal/gerente');
          } else if (staffRole === 'hostess') {
            navigate('/portal/hostess');
          } else if (staffRole === 'waiter') {
            navigate('/portal/mesero');
          } else if (staffRole === 'kitchen') {
            navigate('/portal/cocina');
          } else if (staffRole === 'cashier') {
            navigate('/portal/pickup');
          } else {
            navigate('/portal');
          }
        }, 600);
      } else {
        setPinError(res.error || 'PIN incorrecto o no autorizado para esta sucursal.');
        setPinDigits('');
        setPinLoading(false);
      }
    } catch (err: any) {
      console.error('Error al validar PIN:', err);
      setPinError('Error de conexión al validar PIN.');
      setPinDigits('');
      setPinLoading(false);
    }
  };

  const currentBranch = restaurants.find((r) => r.id === selectedBranchId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white relative">
      {/* Acentos de fondo Bento sutiles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            {activeTab === 'admin' ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <KeyRound className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Acceso al Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de gestión comercial y terminales de piso
          </p>
        </div>

        {/* Conmutador de Pestañas Bento */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Administrativo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Terminal con PIN</span>
          </button>
        </div>

        {/* PESTAÑA 1: ACCESO ADMINISTRATIVO (Correo / Contraseña) */}
        {activeTab === 'admin' && (
          <div>
            {!isSupabaseConfigured && (
              <div className="mb-5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Modo Demo Local</p>
                  <p className="text-amber-800/80 mt-0.5 leading-relaxed">
                    Puedes ingresar con cualquier correo o usar los botones de acceso directo para explorar.
                  </p>
                </div>
              </div>
            )}

            {adminError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dueño@restaurante.com o admin@sistema.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{adminLoading ? 'Comprobando...' : 'Entrar al Panel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleInstantAdminDemo}
                className="w-full py-2 px-3 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceso Rápido Administrador Global (Demo)</span>
              </button>
              <button
                type="button"
                onClick={handleInstantPortalDemo}
                className="w-full py-2 px-3 text-[11px] font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Acceso Rápido Dueño de Restaurante (Demo)</span>
              </button>
              <button
                type="button"
                onClick={handleInstantFoodCourtDemo}
                className="w-full py-2 px-3 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Acceso Rápido Administración Plaza / Food Court (Demo)</span>
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TERMINAL OPERATIVA CON PIN */}
        {activeTab === 'staff' && (
          <div>
            {/* Selector o Vista de Sucursal Fijada */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold">Sucursal:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingBranch(!isChangingBranch)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {isChangingBranch ? 'Fijar actual' : 'Cambiar sucursal'}
                </button>
              </div>

              {isChangingBranch ? (
                <div className="mt-2.5">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      localStorage.setItem('nfc_enrolled_branch_id', e.target.value);
                      setIsChangingBranch(false);
                    }}
                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.brand_name || r.name} - {r.branch_name || 'Principal'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                  {currentBranch
                    ? `${currentBranch.brand_name || currentBranch.name} (${currentBranch.branch_name || 'Principal'})`
                    : 'Cargando sucursales...'}
                </p>
              )}
            </div>

            {/* Mensajes de Alerta / Éxito */}
            {pinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccessMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pinSuccessMsg}</span>
              </div>
            )}

            {/* Indicador visual de 4 Puntos de Seguridad */}
            <div className="flex items-center justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((index) => {
                const filled = pinDigits.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-blue-600 scale-110 shadow-xs'
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Teclado Numérico Bento Light */}
            <div className="grid grid-cols-3 gap-2.5 my-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyClick(digit)}
                  disabled={pinLoading}
                  className="py-3.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-800 font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                disabled={pinDigits.length === 0 || pinLoading}
                className="py-3.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs rounded-2xl active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-30"
              >
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                disabled={pinLoading}
                className="py-3.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-800 font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                disabled={pinDigits.length === 0 || pinLoading}
                className="py-3.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 flex items-center justify-center rounded-2xl active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              PINs de prueba: 1234 (Mesero), 1111 (Hostess), 8888 (Gerente), 4321 (Cocina)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
