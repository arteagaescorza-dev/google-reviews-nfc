import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { FinancialMetrics, Restaurant } from '../types';
import { EbitdaConsoleBento } from '../components/admin/EbitdaConsoleBento';
import { StripePayoutSettlementBento } from '../components/admin/StripePayoutSettlementBento';
import { SubscriptionBillingTrafficLightBento } from '../components/admin/SubscriptionBillingTrafficLightBento';

export const AdminFinancesPage: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [financesData, restaurantsData] = await Promise.all([
        api.getFinancialMetrics(),
        api.getRestaurants(),
      ]);
      setMetrics(financesData);
      setRestaurants(restaurantsData);
    } catch (e) {
      console.error('Error cargando métricas financieras:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInstantPayout = async (amount: number): Promise<boolean> => {
    try {
      // Simulación de dispersión SPEI inmediata
      setMetrics((prev) => (prev ? { ...prev, stripeBalance: Math.max(0, prev.stripeBalance - amount) } : prev));
      return true;
    } catch (err) {
      console.error('Error en dispersión SPEI:', err);
      return false;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        <p>Cargando Consola de Finanzas, Cobranza & EBITDA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Encabezado General Bento Light */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase border border-emerald-100">
            Arquitectura Financiera & Rentabilidad
          </span>
          <span className="text-xs text-slate-400">Modelo Zero-Custody (POL-001)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Finanzas, Cobranza & EBITDA
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Supervisión de suscripciones SaaS, dispersión de saldos Stripe SPEI y estado de resultados en vivo
        </p>
      </div>

      {/* Fila 1 Bento: Bóveda de Liquidación (UI-FN-03) + Consola EBITDA (UI-FN-02) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col-Span-4: Liquidación Stripe Bóveda */}
        <div className="lg:col-span-4 flex flex-col">
          <StripePayoutSettlementBento
            stripeBalance={metrics.stripeBalance}
            onInstantPayout={handleInstantPayout}
          />
        </div>

        {/* Col-Span-8: Consola EBITDA y COGS */}
        <div className="lg:col-span-8 flex flex-col">
          <EbitdaConsoleBento metrics={metrics} />
        </div>
      </div>

      {/* Fila 2 Bento: Semáforo de Cobranza y Dunning de Sucursales (UI-FN-01) */}
      <div className="grid grid-cols-1 gap-6">
        <SubscriptionBillingTrafficLightBento
          restaurants={restaurants}
          collectionRate={metrics.collectionRate}
        />
      </div>
    </div>
  );
};
