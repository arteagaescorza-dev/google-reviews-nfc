import React from 'react';
import { ShieldAlert, Link2, BarChart3, Settings } from 'lucide-react';

export type PortalTab = 'quejas' | 'enlaces' | 'metricas' | 'cuenta';

interface PortalBottomNavProps {
  activeTab: PortalTab;
  onChangeTab: (tab: PortalTab) => void;
  pendingFeedbackCount: number;
}

export const PortalBottomNav: React.FC<PortalBottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingFeedbackCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 pb-safe shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {/* Pestaña 1: Quejas Privadas */}
        <button
          onClick={() => onChangeTab('quejas')}
          className={`flex flex-col items-center justify-center gap-1 relative transition-all active:scale-95 ${
            activeTab === 'quejas'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            {pendingFeedbackCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/40 animate-pulse">
                {pendingFeedbackCount > 9 ? '9+' : pendingFeedbackCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Quejas</span>
          {activeTab === 'quejas' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Pestaña 2: Mis Enlaces / Linktree */}
        <button
          onClick={() => onChangeTab('enlaces')}
          className={`flex flex-col items-center justify-center gap-1 relative transition-all active:scale-95 ${
            activeTab === 'enlaces'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Link2 className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Enlaces</span>
          {activeTab === 'enlaces' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Pestaña 3: Métricas de ROI */}
        <button
          onClick={() => onChangeTab('metricas')}
          className={`flex flex-col items-center justify-center gap-1 relative transition-all active:scale-95 ${
            activeTab === 'metricas'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Métricas</span>
          {activeTab === 'metricas' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Pestaña 4: Mi Cuenta & Equipo */}
        <button
          onClick={() => onChangeTab('cuenta')}
          className={`flex flex-col items-center justify-center gap-1 relative transition-all active:scale-95 ${
            activeTab === 'cuenta'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Mi Cuenta</span>
          {activeTab === 'cuenta' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

