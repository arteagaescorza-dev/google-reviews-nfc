import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  LayoutDashboard,
  Store,
  QrCode,
  Cpu,
  Briefcase,
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/hardware', label: 'Hardware & Bodega', icon: Cpu },
  { to: '/admin/ventas', label: 'Ventas & Pipeline', icon: Briefcase },
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
  // Estado para contraer/expandir barra lateral reactiva al hover
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isExpanded = !isCollapsed || isHovered;

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('nfc_demo_auth');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Sidebar Bento Light Fija (h-screen sticky top-0), sin scroll de página y reactiva al hover */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex flex-col h-screen sticky top-0 overflow-hidden bg-white text-slate-800 border-r border-slate-200/90 flex-shrink-0 z-30 shadow-xs transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Cabecera fija de la barra lateral */}
        <div className={`border-b border-slate-100 flex-shrink-0 transition-all ${isExpanded ? 'p-5' : 'p-3.5'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-3 min-w-0 ${!isExpanded ? 'mx-auto' : ''}`}>
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/20 text-xs tracking-wider flex-shrink-0">
                NFC
              </div>
              {isExpanded && (
                <div className="min-w-0 truncate animate-fadeIn">
                  <h2 className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                    Google Reseñas
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    Panel Superadministrador
                  </p>
                </div>
              )}
            </div>

            {isExpanded && (
              <button
                type="button"
                onClick={() => {
                  const nextCollapsed = !isCollapsed;
                  setIsCollapsed(nextCollapsed);
                  if (nextCollapsed) {
                    setIsHovered(false);
                  }
                }}
                title={
                  isCollapsed
                    ? 'Fijar barra lateral expandida'
                    : 'Contraer barra lateral (se expandirá automáticamente al pasar el cursor)'
                }
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-blue-600" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {isExpanded ? (
            !isSupabaseConfigured ? (
              <div className="mt-3.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-medium flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate">Modo Demo Local</span>
              </div>
            ) : (
              <div className="mt-3.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Supabase Cloud Conectado</span>
              </div>
            )
          ) : (
            <div className="mt-3 flex justify-center">
              <span
                title={isSupabaseConfigured ? 'Supabase Cloud Conectado' : 'Modo Demo Local'}
                className={`w-2.5 h-2.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
          )}
        </div>

        {/* Enlaces de navegación central (sin desplazar el pie fijo) */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={!isExpanded ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isExpanded ? 'gap-3 px-3.5 justify-start' : 'justify-center px-2'
                  } py-2.5 rounded-2xl font-semibold text-xs tracking-tight transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Pie fijo de la barra lateral: Botón contraer/expandir, Vista comensal y Cerrar Sesión */}
        <div className="p-3 border-t border-slate-100 space-y-1.5 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={() => {
              const nextCollapsed = !isCollapsed;
              setIsCollapsed(nextCollapsed);
              if (nextCollapsed) {
                setIsHovered(false);
              }
            }}
            title={
              isCollapsed
                ? 'Fijar barra lateral abierta'
                : 'Modo auto-contraer (reactivo al hover)'
            }
            className={`w-full flex items-center ${
              isExpanded ? 'justify-between px-3.5' : 'justify-center px-2'
            } py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors`}
          >
            {isExpanded && (
              <span className="truncate">
                {isCollapsed ? 'Modo Hover Activo' : 'Contraer Menú'}
              </span>
            )}
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
            ) : (
              <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          <a
            href="#/?t=NFC-002"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver pantalla de cliente"
            className={`flex items-center ${
              isExpanded ? 'justify-between px-3.5' : 'justify-center px-2'
            } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors`}
          >
            {isExpanded && <span className="truncate">Ver pantalla de cliente</span>}
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </a>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`w-full flex items-center ${
              isExpanded ? 'gap-2.5 px-3.5 justify-start' : 'justify-center px-2'
            } py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isExpanded && <span className="truncate">Cerrar Sesión</span>}
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
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
