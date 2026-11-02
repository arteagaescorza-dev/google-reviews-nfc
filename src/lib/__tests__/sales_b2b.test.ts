import { describe, it, expect, beforeEach } from 'vitest';
import { salesApi } from '../api/sales';
import { generateWinbackEmail } from '../winback';
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

describe('Módulo 2: Ventas y Pipeline Comercial B2B (Bento Grid Light)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('UI-VT-01: debe obtener prospectos y permitir moverlos a través de las 4 etapas del Kanban', async () => {
    const leads = await salesApi.getSalesLeads();
    expect(leads.length).toBeGreaterThan(0);

    const targetLead = leads[0];
    expect(targetLead.id).toBeDefined();

    // Mover a Demo Agendada
    const move1 = await salesApi.updateSalesLeadStage(targetLead.id, 'demo_agendada', 'Visita pactada');
    expect(move1).toBe(true);

    // Mover a Cotización Enviada
    const move2 = await salesApi.updateSalesLeadStage(targetLead.id, 'cotizacion_enviada', 'Propuesta de 24 placas');
    expect(move2).toBe(true);

    // Mover a Cierre Ganado
    const move3 = await salesApi.updateSalesLeadStage(targetLead.id, 'cierre_ganado', 'Contrato firmado');
    expect(move3).toBe(true);

    const updatedLeads = await salesApi.getSalesLeads();
    const verified = updatedLeads.find((l) => l.id === targetLead.id);
    expect(verified?.stage).toBe('cierre_ganado');
  });

  it('UI-VT-01: debe calcular el resumen de pipeline con MRR y Kits Upfront', async () => {
    const summary = await salesApi.getSalesPipelineSummary();
    expect(summary.totalLeads).toBeGreaterThan(0);
    expect(summary.totalPipelineMrr).toBeGreaterThanOrEqual(0);
    expect(summary.totalHardwareUpfront).toBeGreaterThanOrEqual(0);
    expect(summary.byStage).toBeDefined();
    expect(typeof summary.conversionRatePercent).toBe('number');
  });

  it('UI-VT-02: debe registrar y consultar campañas de Win-Back en 2 etapas (Día 3 y Día 14)', async () => {
    const campaigns = await salesApi.getWinbackCampaigns();
    expect(campaigns.length).toBeGreaterThan(0);

    // Crear nueva campaña programada para Día 3
    const newCamp = await salesApi.scheduleWinbackCampaign(
      'rest-test-1',
      'Cantina Mexicana Tradicional',
      'Lic. Javier Morales',
      'javier@cantinamorales.mx',
      3
    );

    expect(newCamp.id).toBeDefined();
    expect(newCamp.day_step).toBe(3);
    expect(newCamp.status).toBe('programada');

    // Disparar envío
    const sent = await salesApi.triggerWinbackEmail(newCamp.id);
    expect(sent).toBe(true);

    const stats = await salesApi.getWinbackStats();
    expect(stats.totalCampaigns).toBeGreaterThan(0);
    expect(stats.rescueRatePercent).toBeGreaterThanOrEqual(0);
  });

  it('UI-VT-02: debe generar el correo persuasivo de Win-Back sin errores', () => {
    const emailDay3 = generateWinbackEmail('day_3', 'Parrilla La Estancia', 'Roberto Gómez');
    expect(emailDay3.subject).toContain('Roberto Gómez');
    expect(emailDay3.plainText).toContain('Parrilla La Estancia');
    expect(emailDay3.plainText).toContain('1 a 3 estrellas');

    const emailDay14 = generateWinbackEmail('day_14', 'Parrilla La Estancia', 'Roberto Gómez');
    expect(emailDay14.subject).toContain('30%');
    expect(emailDay14.plainText).toContain('$209 MXN/mes');
  });

  it('UI-VT-03: debe obtener las métricas de pauta local y aportación al subsidio de la red', async () => {
    const execMetrics = await financesApi.getGlobalExecutiveMetrics();
    expect(execMetrics.totalImpressions).toBeGreaterThan(0);
    expect(execMetrics.totalClicks).toBeGreaterThan(0);
    expect(execMetrics.averageCtr).toBeGreaterThan(0);
    expect(execMetrics.finances.adRevenue).toBeGreaterThan(0);
  });
});
