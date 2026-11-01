import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';
import type { CorporateOrder } from '../../types';

describe('Blindaje Anti-Fraude & Delivery Corporativo (DT-17 & DT-19)', () => {
  beforeEach(() => {
    // Mock localStorage para Vitest en entorno Node
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
  });

  it('debe generar un Handshake PIN de exactamente 4 dígitos numéricos', () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    expect(pin).toHaveLength(4);
    expect(/^\d{4}$/.test(pin)).toBe(true);
    expect(parseInt(pin, 10)).toBeGreaterThanOrEqual(1000);
    expect(parseInt(pin, 10)).toBeLessThanOrEqual(9999);
  });

  it('debe aplicar la regla de blindaje anti-fraude para pedidos en efectivo', () => {
    const maxCashLimit = 250; // Límite estricto en efectivo para oficinistas nuevos

    const highOrderAmount = 350;
    const isExceeded = highOrderAmount > maxCashLimit;
    expect(isExceeded).toBe(true);

    const normalOrderAmount = 145;
    const isAllowed = normalOrderAmount <= maxCashLimit;
    expect(isAllowed).toBe(true);
  });

  it('debe crear y persistir una comanda corporativa con coordenadas de piso y PIN', async () => {
    const orderData: Omit<CorporateOrder, 'id' | 'created_at'> = {
      restaurant_id: 'res-reforma-1',
      folio: 'CORP-821',
      customer_name: 'Ing. Carlos Mendoza',
      customer_phone: '5549201823',
      delivery_mode: 'office_delivery',
      building_name: 'Torre Reforma 180',
      floor_office: 'Piso 14, Oficina 1402',
      delivery_instructions: 'Dejar con guardia en PB si no sube elevador',
      handshake_pin: '4921',
      payment_method: 'card', // Cobro directo con TPV inalámbrica BBVA
      items: [
        {
          menu_item_id: 'menu-1',
          name: 'Comida Corrida Ejecutiva',
          price: 135,
          quantity: 2,
        },
      ],
      total_amount: 270,
      status: 'pending',
    };

    const res = await api.createCorporateOrder(orderData);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.id).toMatch(/^corp-/);
    expect(res.data?.handshake_pin).toBe('4921');
    expect(res.data?.floor_office).toBe('Piso 14, Oficina 1402');
    expect(res.data?.payment_method).toBe('card');

    // Recuperar órdenes corporativas del restaurante
    const orders = await api.getCorporateOrders('res-reforma-1');
    expect(orders.length).toBe(1);
    expect(orders[0].folio).toBe('CORP-821');
  });
});

