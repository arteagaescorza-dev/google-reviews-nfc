import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Store,
  QrCode,
  Megaphone,
} from 'lucide-react';

interface HardwareSummary {
  chipsAvailable: number;
  vinylsAvailable: number;
  standsAvailable: number;
  needsReorder: boolean;
}

interface SalesSummary {
  totalLeads: number;
  activeProspects: number;
  totalPipelineMrr: number;
  totalHardwareUpfront: number;
  wonLeads: number;
  wonMrr: number;
  conversionRatePercent: number;
}

interface ExecutiveMiniWidgetsBentoProps {
  hardware: HardwareSummary;
  sales: SalesSummary;
  totalRestaurants: number;
  activeTags: number;
  networkOccupancyRate: number;
}

export const ExecutiveMiniWidgetsBento: React.FC<ExecutiveMiniWidgetsBentoProps> = ({
  hardware,
  sales,
  totalRestaurants,
  activeTags,
  networkOccupancyRate,
}) => {
  return (
    <div className="flex flex-col gap-4 justify-between">
      {/* Mini-Widget 1: Stock de Bodega & Hardware */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Insumos en Bodega (POL-003)
              </h4>
              <p className="text-[11px] text-slate-400">Chips NTAG213 y Viniles 3M</p>
            </div>
          </div>

          {hardware.needsReorder ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/80">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Reorden Necesario</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Stock Saludable</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Chips NFC</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{hardware.chipsAvailable}</span>
              <span className="text-[10px] font-medium text-slate-400">uds vírgenes</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Viniles 3M</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{hardware.vinylsAvailable}</span>
              <span className="text-[10px] font-medium text-slate-400">uds con QR</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px]">Bases acrílicas: {hardware.standsAvailable}</span>
          <Link
            to="/admin/hardware"
            className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1"
          >
            <span>Gestionar Bodega</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mini-Widget 2: Pipeline Comercial B2B */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pipeline Comercial B2B
              </h4>
              <p className="text-[11px] text-slate-400">Embudo de restaurantes</p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-100">
            {sales.conversionRatePercent}% Cierre
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">En Negociación</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{sales.activeProspects}</span>
              <span className="text-[10px] font-medium text-slate-400">prospectos</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">MRR Potencial</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-700">
                ${sales.totalPipelineMrr.toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] font-medium text-slate-400">MXN</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px]">{sales.wonLeads} cerrados este mes</span>
          <span className="text-slate-600 font-semibold text-[11px]">
            Kits Upfront: ${sales.totalHardwareUpfront.toLocaleString('es-MX')}
          </span>
        </div>
      </div>

      {/* Mini-Widget 3: Red de Locales & Ocupación */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Red Física Operativa ({totalRestaurants} Locales)
              </h4>
              <p className="text-[11px] text-slate-400">Locales y tags en mesa</p>
            </div>
          </div>

          <Link
            to="/admin/restaurants"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <span>Ver Locales</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-black text-slate-900">{activeTags} Tags NFC</p>
              <p className="text-[10px] text-slate-400">100% operativos en sala</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-100" />

          <div className="flex items-center gap-2.5">
            <Megaphone className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm font-black text-purple-700">{networkOccupancyRate}% Ocupación</p>
              <p className="text-[10px] text-slate-400">Red publicitaria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
