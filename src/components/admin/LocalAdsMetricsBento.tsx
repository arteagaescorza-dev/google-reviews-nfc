import React from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  ArrowRight,
  Scan,
  MousePointerClick,
  TrendingUp,
  Ticket,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface LocalAdsMetricsProps {
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  activeCampaigns: number;
  couponsRedeemed: number;
  adRevenue: number;
}

export const LocalAdsMetricsBento: React.FC<LocalAdsMetricsProps> = ({
  totalImpressions,
  totalClicks,
  averageCtr,
  activeCampaigns,
  couponsRedeemed,
  adRevenue,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Rendimiento de Pauta Local B2B
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60">
                  {activeCampaigns} Campañas Activas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Impacto directo de marcas y patrocinadores en las mesas de la red
              </p>
            </div>
          </div>

          <Link
            to="/admin/ads"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors self-start sm:self-auto"
          >
            <span>Gestionar Pauta</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Métricas Cuadrantes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
              <Scan className="w-3.5 h-3.5 text-slate-500" />
              <span>Impresiones</span>
            </div>
            <p className="text-xl font-black text-slate-900">
              {totalImpressions.toLocaleString('es-MX')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">En menú de mesas</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
              <MousePointerClick className="w-3.5 h-3.5 text-purple-600" />
              <span>Clics Directos</span>
            </div>
            <p className="text-xl font-black text-purple-700">
              {totalClicks.toLocaleString('es-MX')}
            </p>
            <p className="text-[10px] text-purple-600/70 mt-0.5">A enlaces destino</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>CTR Promedio</span>
            </div>
            <p className="text-xl font-black text-blue-700">{averageCtr}%</p>
            <p className="text-[10px] text-blue-600/70 mt-0.5">Alta efectividad</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cupones / Leads</span>
            </div>
            <p className="text-xl font-black text-emerald-700">{couponsRedeemed}</p>
            <p className="text-[10px] text-emerald-600/70 mt-0.5">Canjes en mostrador</p>
          </div>
        </div>
      </div>

      {/* Banner de Subsidio Zero-Custody (POL-001) */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-950">
                Subsidio Publicitario de la Red
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-900 text-[10px] font-black">
                ${adRevenue.toLocaleString('es-MX')} MXN/mes
              </span>
            </div>
            <p className="text-[11px] text-purple-800/80 mt-0.5">
              Los patrocinadores financian el costo del software y el mantenimiento de las placas físicas en sala.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-purple-900 font-bold flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>POL-001 Cumplida</span>
        </div>
      </div>
    </div>
  );
};

