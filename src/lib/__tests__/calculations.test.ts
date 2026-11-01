import { describe, it, expect } from 'vitest';
import {
  calculateWeightedChainSatisfaction,
  calculateEqualSplit,
  calculateItemizedSplit,
  calculateCashReconciliation,
} from '../calculations';
import { ensureAbsoluteUrl, normalizeImageUrl } from '../utils';

describe('Cálculos de Negocio y Finanzas (Fase 1)', () => {
  describe('calculateWeightedChainSatisfaction (Satisfacción Ponderada)', () => {
    it('debe devolver 100% si no hay sucursales', () => {
      expect(calculateWeightedChainSatisfaction([])).toBe(100);
    });

    it('debe ponderar correctamente según el volumen de escaneos de cada sucursal', () => {
      const branches = [
        { satPct: 90, totalScans: 100 }, // Sucursal grande
        { satPct: 60, totalScans: 10 },  // Sucursal pequeña
      ];
      // (90 * 100 + 60 * 10) / 110 = (9000 + 600) / 110 = 9600 / 110 = 87.27 -> 87.3
      const result = calculateWeightedChainSatisfaction(branches);
      expect(result).toBe(87.3);
    });
  });

  describe('calculateEqualSplit (División Equitativa en Mesa)', () => {
    it('debe dividir la cuenta en partes iguales con propina del 10%', () => {
      const split = calculateEqualSplit(600, 3, 10);
      expect(split.subtotalPerDiner).toBe(200);
      expect(split.tipPerDiner).toBe(20);
      expect(split.totalPerDiner).toBe(220);
    });

    it('debe manejar 1 comensal si se pasa 0 o negativo', () => {
      const split = calculateEqualSplit(150, 0, 0);
      expect(split.totalPerDiner).toBe(150);
    });
  });

  describe('calculateItemizedSplit (División por Consumo y Platos Compartidos)', () => {
    it('debe prorratear platillos al centro entre los comensales seleccionados', () => {
      const items = [
        { id: '1', name: 'Hamburguesa', price: 150, sharedBy: ['Carlos'] },
        { id: '2', name: 'Ensalada', price: 120, sharedBy: ['Sofía'] },
        { id: '3', name: 'Pizza al centro', price: 200, sharedBy: ['Carlos', 'Sofía'] },
      ];

      const split = calculateItemizedSplit(items, 10); // 10% propina

      // Carlos: 150 + 100 (mitad pizza) = 250 subtotal + 25 propina = 275
      expect(split['Carlos'].subtotal).toBe(250);
      expect(split['Carlos'].tip).toBe(25);
      expect(split['Carlos'].total).toBe(275);

      // Sofía: 120 + 100 (mitad pizza) = 220 subtotal + 22 propina = 242
      expect(split['Sofía'].subtotal).toBe(220);
      expect(split['Sofía'].tip).toBe(22);
      expect(split['Sofía'].total).toBe(242);
    });
  });

  describe('calculateCashReconciliation (Arqueo Ciego y Corte Z)', () => {
    it('debe marcar balanced si el conteo físico coincide exactamente', () => {
      const result = calculateCashReconciliation({
        initialFloat: 1000,
        cashSales: 4500,
        cashTips: 400,
        authorizedWithdrawals: 200,
        physicalCount: 5700, // 1000 + 4500 + 400 - 200 = 5700
      });

      expect(result.expected).toBe(5700);
      expect(result.difference).toBe(0);
      expect(result.status).toBe('balanced');
    });

    it('debe detectar faltante (shortage) cuando el efectivo físico es menor', () => {
      const result = calculateCashReconciliation({
        initialFloat: 1000,
        cashSales: 4500,
        cashTips: 0,
        authorizedWithdrawals: 0,
        physicalCount: 5400, // Falta $100
      });

      expect(result.difference).toBe(-100);
      expect(result.status).toBe('shortage');
    });

    it('debe detectar sobrante (surplus) cuando el efectivo físico es mayor', () => {
      const result = calculateCashReconciliation({
        initialFloat: 500,
        cashSales: 1000,
        cashTips: 0,
        authorizedWithdrawals: 0,
        physicalCount: 1550, // Sobran $50
      });

      expect(result.difference).toBe(50);
      expect(result.status).toBe('surplus');
    });
  });

  describe('Seguridad de URLs (Blindaje XSS / Phishing)', () => {
    it('debe bloquear scripts maliciosos en javascript:', () => {
      expect(ensureAbsoluteUrl('javascript:alert("hacked")')).toBe('#');
      expect(ensureAbsoluteUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    });

    it('debe anteponer https:// a dominios limpios', () => {
      expect(ensureAbsoluteUrl('facebook.com/trattoria')).toBe('https://facebook.com/trattoria');
      expect(ensureAbsoluteUrl('https://maps.google.com')).toBe('https://maps.google.com');
    });

    it('debe normalizar imágenes de Google Drive a URLs directas', () => {
      const gDrive = 'https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing';
      expect(normalizeImageUrl(gDrive)).toBe('https://lh3.googleusercontent.com/d/1a2b3c4d5e');
    });
  });
});

