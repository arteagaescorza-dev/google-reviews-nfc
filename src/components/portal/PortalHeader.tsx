import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Restaurant, Organization } from '../../types';
import { Store, LogOut, ChevronDown } from 'lucide-react';
import { normalizeImageUrl } from '../../lib/utils';

interface PortalHeaderProps {
  organization: Organization;
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  organization,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
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
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
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

            {/* Selector de sucursal si tiene 2 o más */}
            {restaurants.length > 1 ? (
              <div className="relative inline-flex items-center mt-0.5">
                <select
                  value={selectedRestaurantId}
                  onChange={(e) => onSelectRestaurant(e.target.value)}
                  className="appearance-none bg-slate-800/90 text-blue-400 font-semibold text-[11px] py-0.5 pl-2 pr-5 rounded-md border border-slate-700/80 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas las sucursales ({restaurants.length})</option>
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
          </div>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all flex-shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
