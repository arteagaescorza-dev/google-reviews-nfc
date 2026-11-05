import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Restaurant, Organization } from '../../types';
import type { PortalTab } from './PortalBottomNav';
import { Store, LogOut, ChevronDown, ShieldAlert, Link2, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { normalizeImageUrl } from '../../lib/utils';

interface PortalHeaderProps {
  organization: Organization;
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
  activeTab: PortalTab;
  onChangeTab: (tab: PortalTab) => void;
  pendingFeedbackCount: number;
  onAddBranch?: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  organization,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  activeTab,
  onChangeTab,
  pendingFeedbackCount,
  onAddBranch,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión en este dispositivo?')) {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('nfc_portal_demo_auth');
      navigate('/portal/login');
    }
  };

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const activeLogo = currentRestaurant?.logo_url || null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-900 px-4 py-3 shadow-2xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Identidad de la Marca / Organización */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {currentRestaurant?.brand_name || organization.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wide border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cliente Fundador</span>
              </span>
            </div>

            {/* Selector de sucursal */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {restaurants.length > 1 ? (
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => onSelectRestaurant(e.target.value)}
                    className="appearance-none bg-slate-100 text-slate-800 font-semibold text-[11px] py-0.5 pl-2 pr-5 rounded-md border border-slate-200 focus:outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="all">Todas ({restaurants.length})</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.branch_name || r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 truncate">
                  {currentRestaurant?.branch_name || 'Sucursal Principal'}
                </p>
              )}

              <span className="inline-flex sm:hidden items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Filtro Gratis</span>
              </span>

              {onAddBranch && (
                <button
                  type="button"
                  onClick={onAddBranch}
                  title="Dar de alta o solicitar nueva sucursal"
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>+ Sucursal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación de Escritorio (Desktop Navigation) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => onChangeTab('quejas')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quejas'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Quejas Privadas</span>
            {pendingFeedbackCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-xs">
                {pendingFeedbackCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('enlaces')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'enlaces'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Mis Enlaces & Wi-Fi</span>
          </button>

          <button
            onClick={() => onChangeTab('metricas')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'metricas'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas & ROI</span>
          </button>

          <button
            onClick={() => onChangeTab('cuenta')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cuenta'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Mi Cuenta & Equipo</span>
          </button>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="p-2 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Salir</span>
        </button>
      </div>
    </header>
  );
};

