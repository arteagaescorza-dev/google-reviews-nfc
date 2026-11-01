import { describe, it, expect, beforeEach } from 'vitest';

// Mock de localStorage y window para entorno Node
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
} as any;
(globalThis as any).window = globalThis;

import { api } from '../api';

describe('Gestión de Comandas, Split Bill y Arqueo Z (DT-12, DT-13, DT-17)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('nfc_demo_auth', 'true');
  });

  describe('Sesiones de Mesa y Split Bill (DT-12)', () => {
    it('debe crear una nueva sesión de mesa al unirse el primer comensal', async () => {
      const session = await api.joinOrCreateTableSession('res-demo', 4, 'Carlos', 'token-carlos');
      expect(session).toBeDefined();
      expect(session.table_number).toBe(4);
      expect(session.status).toBe('open');
      expect(session.participants.length).toBe(1);
      expect(session.participants[0].guest_name).toBe('Carlos');
    });

    it('debe agregar a un segundo comensal a la misma sesión de mesa sin duplicar', async () => {
      await api.joinOrCreateTableSession('res-demo', 4, 'Carlos', 'token-carlos');
      const updatedSession = await api.joinOrCreateTableSession('res-demo', 4, 'Sofía', 'token-sofia');

      expect(updatedSession.table_number).toBe(4);
      expect(updatedSession.participants.length).toBe(2);
      expect(updatedSession.participants.map((p) => p.guest_name)).toContain('Carlos');
      expect(updatedSession.participants.map((p) => p.guest_name)).toContain('Sofía');
    });
  });

  describe('Arqueo Ciego y Corte Z Diario (DT-13)', () => {
    it('debe registrar un corte de caja con balance cuadrado', async () => {
      const result = await api.submitDailyCashClose({
        restaurant_id: 'res-demo',
        shift_date: '2026-11-01',
        closed_by_name: 'Marcos Silva',
        initial_cash_float: 2000,
        gross_sales: 42850,
        net_sales: 36939.65,
        cash_sales: 9650,
        card_sales: 31400,
        discounts_total: 1800,
        tips_total: 4285,
        cash_counted: 11650, // 2000 inicial + 9650 ventas
        cash_difference: 0,
        status: 'balanced',
      });

      expect(result.success).toBe(true);
      expect(result.data?.closed_by_name).toBe('Marcos Silva');
      expect(result.data?.status).toBe('balanced');

      const closes = await api.getDailyCashCloses('res-demo');
      expect(closes.length).toBe(1);
      expect(closes[0].cash_difference).toBe(0);
    });
  });

  describe('Pedidos Corporativos con PIN Anti-Fraude (DT-17 & DT-19)', () => {
    it('debe crear un pedido de oficina con PIN de 4 dígitos', async () => {
      const result = await api.createCorporateOrder({
        restaurant_id: 'res-demo',
        folio: 'OFF-101',
        customer_name: 'Ana López',
        customer_phone: '5512345678',
        delivery_mode: 'office_delivery',
        building_name: 'Torre Reforma 222',
        floor_office: 'Piso 8, Despacho 802',
        handshake_pin: '4821',
        payment_method: 'card',
        items: [
          {
            menu_item_id: 'menu-1',
            name: 'Carpaccio de Res Trufado',
            price: 185,
            quantity: 1,
          },
        ],
        total_amount: 185,
        status: 'pending',
      });

      expect(result.success).toBe(true);
      expect(result.data?.folio).toBe('OFF-101');
      expect(result.data?.handshake_pin).toBe('4821');

      const orders = await api.getCorporateOrders('res-demo');
      expect(orders.length).toBe(1);
      expect(orders[0].delivery_mode).toBe('office_delivery');
    });
  });
});
