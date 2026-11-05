import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Restaurant } from '../../types';
import {
  ShieldCheck,
  Users,
  Calendar,
  Receipt,
  MessageSquareWarning,
  Sliders,
  UtensilsCrossed,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChefHat,
  UserCheck,
  ShoppingBag,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface PortalManagerSidebarProps {
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
  sameOrgBranches: Restaurant[];
  currentBranch: Restaurant | undefined;
  loggedInManagerName: string | null;
  loggedInManagerRole: 'gerente_tienda' | 'capitan_piso';
  activeTab: 'staff' | 'shifts' | 'cash_metrics' | 'complaints_coupons';
  onChangeTab: (tab: 'staff' | 'shifts' | 'cash_metrics' | 'complaints_coupons') => void;
  pendingComplaintsCount: number;
  onOpenMenuModal: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export const PortalManagerSidebar: React.FC<PortalManagerSidebarProps> = ({
  selectedBranchId,
  onSelectBranch,
  sameOrgBranches,
  currentBranch,
  loggedInManagerName,
  loggedInManagerRole,
  activeTab,
  onChangeTab,
  pendingComplaintsCount,
  onOpenMenuModal,
  onRefresh,
  onLogout,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isExpanded = !isCollapsed || isHovered;

  const tabs = [
    {
      id: 'staff' as const,
      label: 'Personal & Estaciones',
      shortLabel: 'Personal',
      icon: Sliders,
      description: 'Gestión KDS y roles',
    },
    {
      id: 'shifts' as const,
      label: 'Turnos a 2 Meses',
      shortLabel: 'Turnos',
      icon: Calendar,
      description: 'Programación 60 días',
    },
    {
      id: 'cash_metrics' as const,
      label: 'Cortes & Métricas Dueño',
      shortLabel: 'Cortes',
      icon: Receipt,
      description: 'Cierres de caja y ventas',
    },
    {
      id: 'complaints_coupons' as const,
      label: 'Quejas & Cupones Límite',
      shortLabel: 'Quejas',
      icon: MessageSquareWarning,
      badge: pendingComplaintsCount > 0 ? pendingComplaintsCount : null,
      description: 'Autorizaciones y cupones',
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
      {/* Cabecera de la barra lateral del Gerente */}
      <div className={`border-b border-slate-100 flex-shrink-0 transition-all ${isExpanded ? 'p-5' : 'p-3.5'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-3 min-w-0 ${!isExpanded ? 'mx-auto' : ''}`}>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center font-bold text-indigo-700 shadow-xs flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            {isExpanded && (
              <div className="min-w-0 truncate animate-fadeIn">
                <h2 className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                  Consola Gerencial
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wide border border-indigo-200">
                    {loggedInManagerRole === 'capitan_piso' ? 'Capitán de Piso' : 'Gerente de Tienda'}
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
                <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Selector de Sucursal Asignada */}
        {isExpanded ? (
          <div className="mt-3.5 space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
              Sucursal Asignada
            </label>
            {sameOrgBranches.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  {sameOrgBranches.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.branch_name || 'Principal'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 truncate">
                {currentBranch?.name || 'Sucursal Principal'}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 flex justify-center">
            <div
              title={`Sucursal: ${currentBranch?.name || 'Principal'}`}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        )}
      </div>

      {/* Navegación de las 4 Funciones Maestras del Gerente */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {isExpanded && (
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Funciones Operativas
          </p>
        )}

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              title={!isExpanded ? tab.label : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5 justify-start' : 'justify-center px-2'
              } py-2.5 rounded-2xl font-semibold text-xs tracking-tight transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                {!isExpanded && tab.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="truncate text-left">
                    <p className="truncate font-bold">{tab.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal truncate">{tab.description}</p>
                  </div>
                  {tab.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black shadow-2xs flex-shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Separador hacia Pantallas de Sucursal */}
        <div className="pt-2 my-2 border-t border-slate-100">
          {isExpanded && (
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Terminales de Sala y Cocina
            </p>
          )}

          <div className="space-y-1">
            <Link
              to={`/portal/hostess?branch=${selectedBranchId}`}
              title={!isExpanded ? 'Pantalla Hostess' : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
              } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors`}
            >
              <Users className="w-4 h-4 text-violet-600 flex-shrink-0" />
              {isExpanded && <span className="truncate">Pantalla Hostess</span>}
            </Link>

            <Link
              to={`/portal/mesero?branch=${selectedBranchId}`}
              title={!isExpanded ? 'Pantalla Mesero' : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
              } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {isExpanded && <span className="truncate">Pantalla Mesero</span>}
            </Link>

            <Link
              to={`/portal/cocina?branch=${selectedBranchId}`}
              title={!isExpanded ? 'KDS Cocina & Barra' : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
              } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors`}
            >
              <ChefHat className="w-4 h-4 text-amber-600 flex-shrink-0" />
              {isExpanded && <span className="truncate">KDS Cocina & Barra</span>}
            </Link>

            <Link
              to={`/portal/pickup?branch=${selectedBranchId}`}
              title={!isExpanded ? 'Pantalla Pick Up' : undefined}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
              } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-orange-700 hover:bg-orange-50 transition-colors`}
            >
              <ShoppingBag className="w-4 h-4 text-orange-600 flex-shrink-0" />
              {isExpanded && <span className="truncate">Pantalla Pick Up</span>}
            </Link>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <button
            type="button"
            onClick={onOpenMenuModal}
            title={!isExpanded ? 'Carta & Menú Digital' : undefined}
            className={`w-full flex items-center ${
              isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
            } py-2 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 border border-amber-200/60 bg-amber-50/50 transition-colors cursor-pointer`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-600 flex-shrink-0" />
            {isExpanded && <span className="truncate">Carta & Menú Digital</span>}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title={!isExpanded ? 'Sincronizar datos' : undefined}
            className={`w-full flex items-center ${
              isExpanded ? 'gap-3 px-3.5' : 'justify-center px-2'
            } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer`}
          >
            <RefreshCw className="w-4 h-4 text-slate-500 flex-shrink-0" />
            {isExpanded && <span className="truncate">Sincronizar Datos</span>}
          </button>
        </div>
      </nav>

      {/* Pie fijo de la barra lateral del Gerente */}
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
              {isCollapsed ? 'Modo Hover Activo' : 'Contraer Menú'}
            </span>
          )}
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          ) : (
            <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        <Link
          to="/portal"
          title={!isExpanded ? 'Volver al Portal del Dueño' : undefined}
          className={`w-full flex items-center ${
            isExpanded ? 'gap-2.5 px-3.5' : 'justify-center px-2'
          } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors`}
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {isExpanded && <span className="truncate">Portal del Dueño</span>}
        </Link>

        {isExpanded && loggedInManagerName && (
          <div className="px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100 truncate">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Turno Activo</p>
            <p className="text-xs font-bold text-slate-800 truncate">{loggedInManagerName}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          title="Salir del turno / Bloquear consola"
          className={`w-full flex items-center ${
            isExpanded ? 'gap-2.5 px-3.5' : 'justify-center px-2'
          } py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span>Salir del Turno</span>}
        </button>
      </div>
    </aside>
  );
};

