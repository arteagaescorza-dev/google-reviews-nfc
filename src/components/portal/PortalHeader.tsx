import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Restaurant, Organization } from '../../types';
import type { PortalTab } from './PortalBottomNav';
import { Store, LogOut, ChevronDown, ShieldAlert, Link2, BarChart3, Settings } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Identidad de la Marca / Organización */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {activeLogo ? (
              <img
                src={normalizeImageUrl(activeLogo)}
                alt={organization.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Store className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-tight">
              {currentRestaurant?.brand_name || organization.name}
            </h1>

            {/* Selector de sucursal */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {restaurants.length > 1 ? (
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => onSelectRestaurant(e.target.value)}
                    className="appearance-none bg-slate-800/90 text-blue-400 font-semibold text-[11px] py-0.5 pl-2 pr-5 rounded-md border border-slate-700/80 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todas ({restaurants.length})</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.branch_name || r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-blue-400 absolute right-1.5 pointer-events-none" />
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 truncate">
                  {currentRestaurant?.branch_name || 'Sucursal Principal'}
                </p>
              )}

              {onAddBranch && (
                <button
                  type="button"
                  onClick={onAddBranch}
                  title="Dar de alta o solicitar nueva sucursal"
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/30 flex items-center gap-0.5 transition-colors"
                >
                  <span>+ Sucursal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación de Escritorio (Desktop Navigation) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 shadow-inner">
          <button
            onClick={() => onChangeTab('quejas')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'quejas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Quejas Privadas</span>
            {pendingFeedbackCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-sm">
                {pendingFeedbackCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('enlaces')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'enlaces'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Mis Enlaces & Wi-Fi</span>
          </button>

          <button
            onClick={() => onChangeTab('metricas')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'metricas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas & ROI</span>
          </button>

          <button
            onClick={() => onChangeTab('cuenta')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cuenta'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Mi Cuenta & Equipo</span>
          </button>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="p-2 px-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all flex-shrink-0 flex items-center gap-1.5"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Salir</span>
        </button>
      </div>
    </header>
  );
};

