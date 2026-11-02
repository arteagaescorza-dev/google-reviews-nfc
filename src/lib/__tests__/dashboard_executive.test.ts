import { describe, it, expect, beforeEach } from 'vitest';
import { financesApi } from '../api/finances';
import { salesApi } from '../api/sales';
import { eventsApi } from '../api/events';

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

describe('Módulo 4: Centro de Mando Ejecutivo (Bento Grid Light)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('UI-RS-01: debe calcular la facturación consolidada y desglose tripartito (SaaS, Ads, Hardware)', async () => {
    const metrics = await financesApi.getGlobalExecutiveMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.revenueBreakdown).toBeDefined();

    const { revenueBreakdown } = metrics;
    expect(revenueBreakdown.grossRevenue).toBeGreaterThan(0);
    expect(revenueBreakdown.saasAmount).toBeGreaterThan(0);
    expect(revenueBreakdown.adsAmount).toBeGreaterThan(0);
    expect(revenueBreakdown.hardwareAmount).toBeGreaterThan(0);

    // Suma de porcentajes debe ser consistente
    const totalPercent = revenueBreakdown.saasPercent + revenueBreakdown.adsPercent + revenueBreakdown.hardwarePercent;
    expect(totalPercent).toBeGreaterThanOrEqual(98);
    expect(totalPercent).toBeLessThanOrEqual(102);

    // EBITDA debe ser positivo y reflejar alta rentabilidad
    expect(revenueBreakdown.ebitda).toBeGreaterThan(0);
    expect(revenueBreakdown.ebitdaMargin).toBeGreaterThan(50);
  });

  it('UI-RS-02: debe reportar el resumen de insumos de bodega y semáforo de reorden', async () => {
    const metrics = await financesApi.getGlobalExecutiveMetrics();

    expect(metrics.hardwareSummary).toBeDefined();
    expect(metrics.hardwareSummary.chipsAvailable).toBeGreaterThan(0);
    expect(metrics.hardwareSummary.vinylsAvailable).toBeGreaterThan(0);
    expect(typeof metrics.hardwareSummary.needsReorder).toBe('boolean');
  });

  it('UI-RS-02: debe calcular el resumen del pipeline comercial B2B', async () => {
    const summary = await salesApi.getSalesPipelineSummary();

    expect(summary).toBeDefined();
    expect(summary.totalLeads).toBeGreaterThan(0);
    expect(summary.activeProspects).toBeGreaterThanOrEqual(0);
    expect(summary.totalPipelineMrr).toBeGreaterThan(0);
    expect(summary.wonLeads).toBeGreaterThanOrEqual(0);
    expect(summary.conversionRatePercent).toBeGreaterThanOrEqual(0);
  });

  it('UI-RS-02: debe permitir crear un nuevo prospecto comercial y actualizar su etapa', async () => {
    const newLead = await salesApi.createSalesLead({
      restaurant_name: 'Pizzería Napolitana Bella Vista',
      business_type: 'restaurant',
      contact_name: 'Marco Rossi',
      contact_role: 'Propietario',
      phone: '55 1122 3344',
      address: 'Ámsterdam 140, Condesa',
      city: 'CDMX',
      estimated_tables: 16,
      stage: 'prospeccion',
      deal_mrr_mxn: 399.00,
      hardware_kit_fee_mxn: 1600.00,
      assigned_sales_rep: 'Laura Domínguez',
    });

    expect(newLead.id).toBeDefined();
    expect(newLead.restaurant_name).toBe('Pizzería Napolitana Bella Vista');

    const updated = await salesApi.updateSalesLeadStage(newLead.id, 'demo_agendada', 'Demo programada para el martes');
    expect(updated).toBe(true);

    const leads = await salesApi.getSalesLeads();
    const found = leads.find((l) => l.id === newLead.id);
    expect(found?.stage).toBe('demo_agendada');
  });

  it('UI-RS-03: debe alimentar el feed de eventos en vivo y permitir registrar nuevos eventos', async () => {
    const initialEvents = await eventsApi.getLiveEventsFeed(10);
    expect(initialEvents.length).toBeGreaterThan(0);

    const createdEvent = await eventsApi.recordLiveEvent({
      type: 'scan',
      title: 'Escaneo de Prueba en Mesa 9',
      description: 'Lectura verificada por comensal en local piloto.',
      restaurant_name: 'Pizzería Napolitana Bella Vista',
      badge_text: 'Escaneo NFC',
      badge_variant: 'blue',
    });

    expect(createdEvent.id).toBeDefined();

    const refreshedEvents = await eventsApi.getLiveEventsFeed(10);
    expect(refreshedEvents[0].id).toBe(createdEvent.id);
    expect(refreshedEvents[0].title).toBe('Escaneo de Prueba en Mesa 9');
  });
});

