import { describe, it, expect, beforeEach } from 'vitest';
import { financesApi } from '../api/finances';

// Mock de localStorage para entorno Node/Vitest
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  length: 0,
  key: () => null,
};

describe('Módulo 3: Finanzas Reales, Cobranza Stripe/MP y EBITDA (Bento Grid Light)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('UI-FN-01: debe auditar la tasa de cobranza y locales al corriente', async () => {
    const metrics = await financesApi.getFinancialMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.collectionRate).toBeGreaterThan(90);
    expect(metrics.payingLocations).toBeGreaterThan(0);
    expect(metrics.totalLocations).toBeGreaterThanOrEqual(metrics.payingLocations);
  });

  it('UI-FN-02: debe calcular el EBITDA operativo con la fórmula Ingresos - COGS', async () => {
    const metrics = await financesApi.getFinancialMetrics();

    // Verificación de entradas
    const expectedGross = metrics.mrr + metrics.adRevenue + metrics.hardwareRevenue;
    expect(metrics.grossRevenue).toBe(expectedGross);

    // Verificación de costos directos
    const expectedCosts = Math.round(
      metrics.cogsHardware + metrics.gatewayFees + metrics.cloudCost + metrics.whatsappCost
    );
    expect(metrics.totalDirectCosts).toBe(expectedCosts);

    // Verificación de EBITDA
    const expectedEbitda = Math.round(metrics.grossRevenue - metrics.totalDirectCosts);
    expect(metrics.ebitda).toBe(expectedEbitda);

    // Margen operativo
    expect(metrics.ebitdaMargin).toBeGreaterThan(60);
  });

  it('UI-FN-03: debe verificar el saldo disponible en bóveda de pasarela para dispersión SPEI', async () => {
    const metrics = await financesApi.getFinancialMetrics();

    expect(metrics.stripeBalance).toBeDefined();
    expect(metrics.stripeBalance).toBeGreaterThan(0);
  });
});
