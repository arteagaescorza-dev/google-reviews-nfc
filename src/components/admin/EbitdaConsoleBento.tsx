import React from 'react';
import {
  TrendingUp,
  Cpu,
  CreditCard,
  Server,
  MessageCircle,
  Sparkles,
  Info,
  Megaphone,
} from 'lucide-react';
import type { FinancialMetrics } from '../../types';

interface EbitdaConsoleBentoProps {
  metrics: FinancialMetrics;
}

export const EbitdaConsoleBento: React.FC<EbitdaConsoleBentoProps> = ({ metrics }) => {
  const {
    mrr,
    adRevenue,
    hardwareRevenue,
    grossRevenue,
    cogsHardware,
    gatewayFees,
    cloudCost,
    whatsappCost,
    totalDirectCosts,
    ebitda,
    ebitdaMargin,
  } = metrics;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Consola EBITDA & Estado de Resultados en Vivo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60">
                  {ebitdaMargin}% Margen
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresos reales de la plataforma menos costos directos de entrega (COGS y servidores)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Ecuación:</span>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
              EBITDA = Ingresos - COGS
            </span>
          </div>
        </div>

        {/* 3 Cuadrantes Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Ingresos Brutos
            </span>
            <p className="text-xl font-black text-slate-900">
              ${grossRevenue.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">SaaS + Pauta + Hardware</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
              Costos Directos (COGS)
            </span>
            <p className="text-xl font-black text-rose-600">
              -${totalDirectCosts.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Chips, Stripe y Servidores</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Utilidad Neta (EBITDA)
            </span>
            <p className="text-xl font-black text-emerald-700">
              ${ebitda.toLocaleString('es-MX')}{' '}
              <span className="text-[11px] font-normal text-slate-500">MXN</span>
            </p>
            <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">{ebitdaMargin}% de margen neto</p>
          </div>
        </div>

        {/* Tabla Desglosada Bento */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3.5 font-bold">Concepto Financiero</th>
                <th className="py-2.5 px-3.5 font-bold">Tipo</th>
                <th className="py-2.5 px-3.5 font-bold">Detalle Unitario</th>
                <th className="py-2.5 px-3.5 font-bold text-right">Monto ($ MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Entradas */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold flex items-center gap-2 text-slate-900">
                  <div className="p-1 rounded bg-blue-50 text-blue-600">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span>Suscripciones Mensuales de Software (MRR)</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-500">Recurrente</td>
                <td className="py-2.5 px-3.5 text-slate-500">Niveles 2, 3 y Marca Blanca</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-slate-900">
                  +${mrr.toLocaleString('es-MX')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3.5 font-bold flex items-center gap-2 text-slate-900">
                  <div className="p-1 rounded bg-purple-50 text-purple-600">
                    <Megaphone className="w-3 h-3" />
                  </div>
                  <span>Pautas Publicitarias de Comercios Locales</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-500">Publicidad</td>
                <td className="py-2.5 px-3.5 text-slate-500">Campañas activas en mesas</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-purple-700">
                  +${adRevenue.toLocaleString('es-MX')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3.5 font-bold flex items-center gap-2 text-slate-900">
                  <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                    <Cpu className="w-3 h-3" />
                  </div>
                  <span>Venta Inicial de Hardware Físico (Upfront)</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-500">Producto</td>
                <td className="py-2.5 px-3.5 text-slate-500">Placas acrílicas NTAG213</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-emerald-700">
                  +${hardwareRevenue.toLocaleString('es-MX')}
                </td>
              </tr>

              {/* Salidas / Costos Directos */}
              <tr className="bg-slate-50/40">
                <td className="py-2.5 px-3.5 font-medium flex items-center gap-2 text-slate-700">
                  <Cpu className="w-3.5 h-3.5 text-rose-500" />
                  <span>Fabricación de Placas NFC (COGS)</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-400">Costo Directo</td>
                <td className="py-2.5 px-3.5 text-slate-400">Chips e impresión UV ($45 c/u)</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-rose-600">
                  -${cogsHardware.toLocaleString('es-MX')}
                </td>
              </tr>

              <tr className="bg-slate-50/40">
                <td className="py-2.5 px-3.5 font-medium flex items-center gap-2 text-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                  <span>Comisiones de Pasarela Bancaria (Stripe)</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-400">Transacción</td>
                <td className="py-2.5 px-3.5 text-slate-400">3.6% + $3 MXN por cobro</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-rose-600">
                  -${gatewayFees.toLocaleString('es-MX')}
                </td>
              </tr>

              <tr className="bg-slate-50/40">
                <td className="py-2.5 px-3.5 font-medium flex items-center gap-2 text-slate-700">
                  <Server className="w-3.5 h-3.5 text-rose-500" />
                  <span>Infraestructura Cloud (Supabase Pro)</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-400">OpEx Servidor</td>
                <td className="py-2.5 px-3.5 text-slate-400">PostgreSQL, Auth & Storage</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-rose-600">
                  -${cloudCost.toLocaleString('es-MX')}
                </td>
              </tr>

              <tr className="bg-slate-50/40">
                <td className="py-2.5 px-3.5 font-medium flex items-center gap-2 text-slate-700">
                  <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mensajería WhatsApp Cloud API</span>
                </td>
                <td className="py-2.5 px-3.5 text-slate-400">OpEx Alertas</td>
                <td className="py-2.5 px-3.5 text-slate-400">Dunning & entrega de cupones</td>
                <td className="py-2.5 px-3.5 font-bold text-right text-rose-600">
                  -${whatsappCost.toLocaleString('es-MX')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota de Política Zero-Custody */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-[11px]">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Garantía POL-001:</strong> Los importes de comidas pagados por comensales no ingresan a este estado de resultados, ya que van directo a las cuentas bancarias de los restaurantes.
        </span>
      </div>
    </div>
  );
};
