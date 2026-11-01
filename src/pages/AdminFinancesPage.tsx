import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { FinancialMetrics } from '../types';
import {
  DollarSign,
  TrendingUp,
  Percent,
  CreditCard,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Server,
  MessageCircle,
  Cpu,
} from 'lucide-react';

export const AdminFinancesPage: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFinancialMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Error cargando métricas financieras:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Cargando consola financiera y cálculo de EBITDA...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Consola de Finanzas & EBITDA
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              EBITDA en Vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría de ingresos recurrentes (MRR), costos de operación y utilidad neta operativa (SPEC-009)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Liquidación Stripe: Lunes (SPEI)</span>
          </div>
        </div>
      </div>

      {/* 4 CUADRANTES EJECUTIVOS (SPEC-009) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR ACTUAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                MRR Actual (Software)
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ${metrics.mrr.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MXN</span>
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18% vs mes anterior</span>
            </span>
            <span className="text-slate-400 font-medium">Suscripciones puras</span>
          </div>
        </div>

        {/* EBITDA DEL MES */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white via-white to-emerald-50/30">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                EBITDA Operativo
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">
              ${metrics.ebitda.toLocaleString()} <span className="text-xs font-semibold text-emerald-600">MXN</span>
            </p>
          </div>
          <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-bold">Utilidad Operativa Neta</span>
            <span className="text-emerald-600 font-mono text-[10px] font-bold">Antes de ISR</span>
          </div>
        </div>

        {/* MARGEN EBITDA % */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Margen EBITDA
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-600">
              {metrics.ebitdaMargin}%
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-bold">Eficiencia SaaS / Red</span>
            <span className="text-slate-400 font-medium">Benchmark: &gt;70%</span>
          </div>
        </div>

        {/* SALDO EN STRIPE / BANCO */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Saldo en Pasarela (Stripe)
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ${metrics.stripeBalance.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MXN</span>
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Corte 48 horas</span>
            </span>
            <span className="text-slate-400 font-medium">Bóveda PCI-DSS</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MONITOR DE COBRANZA RECURRENTE & INVENTARIO DE PAUTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitor de Cobranza (Suscripciones de Locales) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Monitor de Cobranza Recurrente
                </h3>
                <p className="text-[11px] text-slate-400">
                  Estado de pago mensual de las sucursales afiliadas
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
              {metrics.collectionRate}% al corriente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Locales con Cobro Exitoso
              </span>
              <strong className="text-lg font-black text-slate-900">
                {metrics.payingLocations} de {metrics.totalLocations}
              </strong>
              <span className="text-[11px] text-emerald-600 block font-semibold">
                Suscripciones al día
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Dunning Automático (Reintentos)
              </span>
              <strong className="text-lg font-black text-amber-900">
                1 local
              </strong>
              <span className="text-[11px] text-amber-700 block font-semibold">
                Reintento día 3 programado
              </span>
            </div>
          </div>

          {/* Protocolo Dunning Explicativo */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Protocolo Antirretención y Cobranza Autónoma:</span>
            </span>
            <ul className="text-[11px] space-y-1 text-slate-500 list-disc list-inside">
              <li><strong>Día 1:</strong> Reintento silencioso con la pasarela bancaria.</li>
              <li><strong>Día 3:</strong> Disparo automático por WhatsApp al dueño con link de actualización de tarjeta.</li>
              <li><strong>Día 7:</strong> Si no se regulariza, la sucursal se pausa automáticamente (los tags NFC siguen redirigiendo a Google Reviews sin romper el servicio físico).</li>
            </ul>
          </div>
        </div>

        {/* Inventario de Facturación Publicitaria (Anunciantes) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Inventario de Pauta Publicitaria
                </h3>
                <p className="text-[11px] text-slate-400">
                  Campañas activas en mesas y renovaciones al 80%
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-black border border-purple-200">
              ${metrics.adRevenue.toLocaleString()} MXN pautados
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Campañas en Rotación
              </span>
              <strong className="text-lg font-black text-slate-900">
                {metrics.activeCampaigns} Activas
              </strong>
              <span className="text-[11px] text-purple-600 block font-semibold">
                Mesas monetizadas
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Al 80% con Checkout Enviado
              </span>
              <strong className="text-lg font-black text-amber-900">
                {metrics.campaignsAtRisk} Campaña
              </strong>
              <span className="text-[11px] text-amber-700 block font-semibold">
                Clínica DentalPro ($2,500 MXN)
              </span>
            </div>
          </div>

          {/* Estado de Facturación CFDI 4.0 */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Facturación Fiscal Mexicana (CFDI 4.0):</span>
              </span>
              <span className="text-emerald-700 text-[11px]">PAC Conectado</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Timbrado automático al cobrar: Si la empresa capturó RFC en su portal, el sistema genera PDF y XML validados ante el SAT y los envía por correo.
            </p>
          </div>
        </div>
      </div>

      {/* ESTADO DE RESULTADOS OPERATIVO — CÁLCULO DESGLOSADO DE EBITDA (SPEC-009) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Estado de Resultados Operativo & Desglose de EBITDA
            </h3>
            <p className="text-xs text-slate-400">
              Ecuación real de entradas brutas menos costos directos de entrega
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Fórmula de Utilidad
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              EBITDA = Ingresos - COGS
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-bold">Concepto Financiero</th>
                <th className="py-2.5 font-bold">Tipo</th>
                <th className="py-2.5 font-bold">Detalle / Supuesto Unitario</th>
                <th className="py-2.5 font-bold text-right">Monto ($ MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* INGRESOS */}
              <tr className="text-slate-800">
                <td className="py-3 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Suscripciones Mensuales de Software (MRR)</span>
                </td>
                <td className="py-3 text-slate-500">Ingreso Recurrente</td>
                <td className="py-3 text-slate-500">Tiers 2, 3 y Módulos Marca Blanca</td>
                <td className="py-3 font-bold text-right text-slate-900">
                  +${metrics.mrr.toLocaleString()} MXN
                </td>
              </tr>

              <tr className="text-slate-800">
                <td className="py-3 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Pautas Publicitarias de Comercios Locales</span>
                </td>
                <td className="py-3 text-slate-500">Ingreso Publicitario</td>
                <td className="py-3 text-slate-500">Campañas activas en mesas afiliadas</td>
                <td className="py-3 font-bold text-right text-slate-900">
                  +${metrics.adRevenue.toLocaleString()} MXN
                </td>
              </tr>

              <tr className="text-slate-800">
                <td className="py-3 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Venta Inicial de Hardware Físico (Siembra $100)</span>
                </td>
                <td className="py-3 text-slate-500">Ingreso por Producto</td>
                <td className="py-3 text-slate-500">Placas acrílicas NTAG213 vendidas en calle</td>
                <td className="py-3 font-bold text-right text-slate-900">
                  +${metrics.hardwareRevenue.toLocaleString()} MXN
                </td>
              </tr>

              {/* TOTAL INGRESOS */}
              <tr className="bg-slate-50/70 font-extrabold text-slate-900">
                <td className="py-3 pl-2" colSpan={3}>
                  TOTAL INGRESOS BRUTOS OPERATIVOS
                </td>
                <td className="py-3 pr-2 text-right text-sm text-blue-700 font-black">
                  ${metrics.grossRevenue.toLocaleString()} MXN
                </td>
              </tr>

              {/* COSTOS DIRECTOS */}
              <tr className="text-slate-600">
                <td className="py-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-rose-500" />
                  <span>Fabricación de Placas NFC (COGS)</span>
                </td>
                <td className="py-3 text-slate-400">Costo Directo</td>
                <td className="py-3 text-slate-400">~$45 MXN costo unitario por chip e impresión UV</td>
                <td className="py-3 font-bold text-right text-rose-600">
                  -${metrics.cogsHardware.toLocaleString()} MXN
                </td>
              </tr>

              <tr className="text-slate-600">
                <td className="py-3 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                  <span>Comisiones de Pasarela Bancaria (Stripe)</span>
                </td>
                <td className="py-3 text-slate-400">Comisión Cobro</td>
                <td className="py-3 text-slate-400">3.6% sobre transacciones + $3 MXN por intento</td>
                <td className="py-3 font-bold text-right text-rose-600">
                  -${metrics.gatewayFees.toLocaleString()} MXN
                </td>
              </tr>

              <tr className="text-slate-600">
                <td className="py-3 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-rose-500" />
                  <span>Infraestructura Cloud (Supabase Pro)</span>
                </td>
                <td className="py-3 text-slate-400">OpEx Servidores</td>
                <td className="py-3 text-slate-400">Base de datos PostgreSQL, Auth & Storage ($25 USD)</td>
                <td className="py-3 font-bold text-right text-rose-600">
                  -${metrics.cloudCost.toLocaleString()} MXN
                </td>
              </tr>

              <tr className="text-slate-600">
                <td className="py-3 flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mensajería WhatsApp Cloud API</span>
                </td>
                <td className="py-3 text-slate-400">OpEx Mensajería</td>
                <td className="py-3 text-slate-400">~$0.60 MXN por conversación de entrega de cupón / alerta</td>
                <td className="py-3 font-bold text-right text-rose-600">
                  -${metrics.whatsappCost.toLocaleString()} MXN
                </td>
              </tr>

              {/* TOTAL COSTOS */}
              <tr className="bg-rose-50/50 font-bold text-rose-900">
                <td className="py-2.5 pl-2" colSpan={3}>
                  TOTAL COSTOS DIRECTOS DE OPERACIÓN
                </td>
                <td className="py-2.5 pr-2 text-right font-black">
                  -${metrics.totalDirectCosts.toLocaleString()} MXN
                </td>
              </tr>

              {/* EBITDA FINAL */}
              <tr className="bg-emerald-500/10 border-t-2 border-emerald-500 text-emerald-950 font-black">
                <td className="py-4 pl-3" colSpan={2}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm uppercase tracking-wider">
                      UTILIDAD OPERATIVA NETA (EBITDA)
                    </span>
                  </div>
                </td>
                <td className="py-4 text-xs font-bold text-emerald-800">
                  Margen Operativo: {metrics.ebitdaMargin}%
                </td>
                <td className="py-4 pr-3 text-right text-base font-black text-emerald-700">
                  ${metrics.ebitda.toLocaleString()} MXN
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
