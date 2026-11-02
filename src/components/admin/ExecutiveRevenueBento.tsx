import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Megaphone,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface RevenueBreakdown {
  saasAmount: number;
  saasPercent: number;
  adsAmount: number;
  adsPercent: number;
  hardwareAmount: number;
  hardwarePercent: number;
  grossRevenue: number;
  ebitda: number;
  ebitdaMargin: number;
}

interface ExecutiveRevenueBentoProps {
  breakdown: RevenueBreakdown;
}

export const ExecutiveRevenueBento: React.FC<ExecutiveRevenueBentoProps> = ({ breakdown }) => {
  const {
    grossRevenue,
    saasAmount,
    saasPercent,
    adsAmount,
    adsPercent,
    hardwareAmount,
    hardwarePercent,
    ebitda,
    ebitdaMargin,
  } = breakdown;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      {/* Fondo de resplandor sutil ejecutivo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-50/50 via-emerald-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

      <div>
        {/* Cabecera de la Tarjeta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Facturación Consolidada del Mes
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                  Zero-Custody Activo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresos directos de la plataforma por software, pauta y hardware (POL-001)
              </p>
            </div>
          </div>

          <Link
            to="/admin/finanzas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-colors self-start sm:self-auto"
          >
            <span>Auditoría Financiera</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Indicador Numérico Principal */}
        <div className="flex flex-wrap items-baseline gap-3 mb-5">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            ${grossRevenue.toLocaleString('es-MX')}
          </span>
          <span className="text-base font-bold text-slate-400">MXN / mes</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 ml-auto">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.8% vs mes previo</span>
          </span>
        </div>

        {/* Barra Proporcional Segmentada Tripartita */}
        <div className="space-y-2 mb-6">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${saasPercent}%` }}
              className="bg-blue-600 h-full transition-all duration-500"
              title={`Suscripción SaaS: ${saasPercent}%`}
            />
            <div
              style={{ width: `${adsPercent}%` }}
              className="bg-purple-600 h-full transition-all duration-500"
              title={`Pauta Publicitaria: ${adsPercent}%`}
            />
            <div
              style={{ width: `${hardwarePercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Hardware Físico: ${hardwarePercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>SaaS Recurrente ({saasPercent}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
              <span>Red Publicitaria ({adsPercent}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Kits de Hardware ({hardwarePercent}%)</span>
            </span>
          </div>
        </div>

        {/* Las 3 Tarjetas de Fuentes de Ingreso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Vía 1: SaaS */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Suscripciones SaaS
              </span>
              <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900">
              ${saasAmount.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Mensualidades recurrentes</p>
          </div>

          {/* Vía 2: Publicidad */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Red de Anuncios
              </span>
              <div className="p-1.5 rounded-lg bg-purple-100/70 text-purple-700">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-black text-purple-700">
              ${adsAmount.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Campañas locales pagadas</p>
          </div>

          {/* Vía 3: Hardware Upfront */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Kits de Hardware
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
                <Cpu className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-lg font-black text-emerald-700">
              ${hardwareAmount.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Placas NFC + Viniles 3M</p>
          </div>
        </div>
      </div>

      {/* Pie: EBITDA Neto y Margen de Utilidad */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 p-4 sm:p-5 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">EBITDA Neto Proyectado</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {ebitdaMargin}% Margen
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Utilidad operativa descontando costos de COGS, cloud y comisiones de pasarela
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xl font-black text-slate-950">
            ${ebitda.toLocaleString('es-MX')} <span className="text-xs font-bold text-slate-500">MXN</span>
          </span>
          <div className="flex items-center sm:justify-end gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Negocio altamente rentable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

