import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Restaurant, Organization } from '../../types';
import type { PortalTab } from './PortalBottomNav';
import {
  ShieldAlert,
  Link2,
  BarChart3,
  Settings,
  Store,
  LogOut,
  ChevronDown,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { normalizeImageUrl } from '../../lib/utils';

interface PortalSidebarProps {
  organization: Organization;
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
  activeTab: PortalTab;
  onChangeTab: (tab: PortalTab) => void;
  pendingFeedbackCount: number;
  onAddBranch?: () => void;
  memberEmail?: string;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  organization,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  activeTab,
  onChangeTab,
  pendingFeedbackCount,
  onAddBranch,
  memberEmail,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isExpanded = !isCollapsed || isHovered;

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const activeLogo = currentRestaurant?.logo_url || null;

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión en este dispositivo?')) {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('nfc_portal_demo_auth');
      navigate('/portal/login');
    }
  };

  const navItems = [
    {
      id: 'quejas' as PortalTab,
      label: 'Buzón de Quejas',
      icon: ShieldAlert,
      badge: pendingFeedbackCount > 0 ? pendingFeedbackCount : null,
    },
    {
      id: 'enlaces' as PortalTab,
      label: 'Enlaces & QR de Mesa',
      icon: Link2,
      badge: null,
    },
    {
      id: 'metricas' as PortalTab,
      label: 'Métricas & Analítica',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'cuenta' as PortalTab,
      label: 'Mi Cuenta & Equipo',
      icon: Settings,
      badge: null,
    },
  ];

  return (
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
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center font-bold text-blue-700 shadow-xs flex-shrink-0 overflow-hidden">
              {activeLogo ? (
                <img
                  src={normalizeImageUrl(activeLogo)}
                  alt={organization.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Store className="w-5 h-5 text-blue-600" />
              )}
            </div>
            {isExpanded && (
              <div className="min-w-0 truncate animate-fadeIn">
                <h2 className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                  {currentRestaurant?.brand_name || organization.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wide border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Propietario</span>
                  </span>
                </div>
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

        {/* Selector de Sucursales en Desktop */}
        {isExpanded ? (
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
              <span>Sucursal Activa</span>
              {onAddBranch && (
                <button
                  type="button"
                  onClick={onAddBranch}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Dar de alta nueva sucursal"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedRestaurantId}
                onChange={(e) => onSelectRestaurant(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="all">Todas las sucursales ({restaurants.length})</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.branch_name || r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-center">
            <div
              title={`Sucursal: ${currentRestaurant?.branch_name || 'Todas'}`}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Enlaces de navegación central */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              title={!isExpanded ? item.label : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5 justify-start' : 'justify-center px-2'
              } py-2.5 rounded-2xl font-semibold text-xs tracking-tight transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                {!isExpanded && item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pie fijo de la barra lateral */}
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
          } py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer`}
        >
          {isExpanded && (
            <span className="truncate">
              {isCollapsed ? 'Modo Hover Activo' : 'Contraer Barra Lateral'}
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
          title="Ver pantalla de comensal en mesa"
          className={`flex items-center ${
            isExpanded ? 'justify-between px-3.5' : 'justify-center px-2'
          } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Store className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {isExpanded && <span className="truncate">Vista Comensal</span>}
          </div>
          {isExpanded && <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
        </a>

        {isExpanded && memberEmail && (
          <div className="px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100 truncate">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cuenta Activa</p>
            <p className="text-xs font-bold text-slate-700 truncate">{memberEmail}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`w-full flex items-center ${
            isExpanded ? 'gap-2.5 px-3.5' : 'justify-center px-2'
          } py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

