import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  LayoutDashboard,
  Store,
  QrCode,
  Cpu,
  Megaphone,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  DollarSign,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/hardware', label: 'Hardware & Bodega', icon: Cpu },
  { to: '/admin/tags', label: 'Tags NFC & Mesas', icon: QrCode },
  { to: '/admin/restaurants', label: 'Restaurantes', icon: Store },
  { to: '/admin/finanzas', label: 'Finanzas & EBITDA', icon: DollarSign },
  { to: '/admin/ads', label: 'Red de Anuncios', icon: Megaphone },
  { to: '/admin/cobertura', label: 'Cobertura Territorial', icon: MapPin },
  { to: '/admin/soporte', label: 'Mesa de Ayuda B2B', icon: LifeBuoy },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('nfc_demo_auth');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Sidebar Bento Light para pantallas medianas y grandes */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-800 border-r border-slate-200/90 flex-shrink-0 z-30 shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/20 text-xs tracking-wider">
              NFC
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-slate-900">Google Reseñas</h2>
              <p className="text-[10px] text-slate-500 font-medium">Panel Superadministrador</p>
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <div className="mt-4 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Modo Demo Local</span>
            </div>
          ) : (
            <div className="mt-4 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Supabase Cloud Conectado</span>
            </div>
          )}
        </div>

        {/* Enlaces de navegación en Bento Light */}
        <nav className="flex-1 p-3.5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs tracking-tight transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Enlace a vista comensal y botón Salir */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <a
            href="#/?t=NFC-002"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>Ver pantalla de cliente</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Header móvil Bento Light */}
      <header className="md:hidden bg-white text-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
            NFC
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-slate-900 leading-none">Google Reseñas</h2>
            <p className="text-[10px] text-slate-400">Admin Control</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú desplegable móvil Bento Light */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-md animate-fadeIn">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal del módulo con fondo luminoso slate-50 */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
