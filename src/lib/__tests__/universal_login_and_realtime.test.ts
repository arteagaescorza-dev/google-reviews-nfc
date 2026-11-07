import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ordersApi } from '../api/orders';
import {
  subscribeToRestaurantOrders,
  subscribeToRestaurantCalls,
  type RealtimeConnectionStatus,
} from '../realtimeSubscriptions';

// Helper de resolución de rutas por rol operativo (POL-008)
export function resolveTargetRouteByStaffRole(role: string): string {
  switch (role) {
    case 'manager':
      return '/portal/gerente';
    case 'hostess':
      return '/portal/hostess';
    case 'waiter':
      return '/portal/mesero';
    case 'kitchen':
    case 'barista':
      return '/portal/cocina';
    case 'cashier':
      return '/portal/pickup';
    default:
      return '/portal';
  }
}

describe('POL-008 & SaaS Multi-Tenant: Unificación de Accesos y Motor Realtime', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = { nfc_demo_auth: 'true' };
    const mockStorage = {
      getItem: (key: string) => (key in mockStore ? mockStore[key] : null),
      setItem: (key: string, value: string) => {
        mockStore[key] = String(value);
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage, location: { hash: '#/login' } },
      writable: true,
      configurable: true,
    });
  });

  describe('1. Resolución Inteligente de Rutas por PIN y Rol', () => {
    it('PIN 1111 resuelve rol hostess y enruta a /portal/hostess', async () => {
      const res = await ordersApi.loginStaffWithPin('res-1', '1111');
      expect(res.success).toBe(true);
      expect(res.staff?.role).toBe('hostess');
      expect(resolveTargetRouteByStaffRole(res.staff!.role)).toBe('/portal/hostess');
    });

    it('PIN 1234 resuelve rol waiter y enruta a /portal/mesero', async () => {
      const res = await ordersApi.loginStaffWithPin('res-1', '1234');
      expect(res.success).toBe(true);
      expect(res.staff?.role).toBe('waiter');
      expect(resolveTargetRouteByStaffRole(res.staff!.role)).toBe('/portal/mesero');
    });

    it('PIN 8888 o 9999 resuelve rol manager y enruta a /portal/gerente', async () => {
      const res8888 = await ordersApi.loginStaffWithPin('res-1', '8888');
      expect(res8888.success).toBe(true);
      expect(res8888.staff?.role).toBe('manager');
      expect(resolveTargetRouteByStaffRole(res8888.staff!.role)).toBe('/portal/gerente');

      const res9999 = await ordersApi.loginStaffWithPin('res-1', '9999');
      expect(res9999.success).toBe(true);
      expect(res9999.staff?.role).toBe('manager');
      expect(resolveTargetRouteByStaffRole(res9999.staff!.role)).toBe('/portal/gerente');
    });

    it('PIN 4321 resuelve rol kitchen y enruta a /portal/cocina', async () => {
      const res = await ordersApi.loginStaffWithPin('res-1', '4321');
      expect(res.success).toBe(true);
      expect(res.staff?.role).toBe('kitchen');
      expect(resolveTargetRouteByStaffRole(res.staff!.role)).toBe('/portal/cocina');
    });

    it('rol cashier enruta a /portal/pickup', () => {
      expect(resolveTargetRouteByStaffRole('cashier')).toBe('/portal/pickup');
    });

    it('PIN inválido rechaza la autenticación sin enrutar', async () => {
      const res = await ordersApi.loginStaffWithPin('res-1', '0000');
      expect(res.success).toBe(false);
      expect(res.staff).toBeUndefined();
      expect(res.error).toBeDefined();
    });
  });

  describe('2. Persistencia de Sesión de Dispositivo y Turno Operativo', () => {
    it('almacena y recupera la sucursal enrolada en la tablet', () => {
      localStorage.setItem('nfc_enrolled_branch_id', 'branch-roma-1');
      expect(localStorage.getItem('nfc_enrolled_branch_id')).toBe('branch-roma-1');
    });

    it('guarda la sesión de turno y la remueve limpiamente al cambiar turno', () => {
      const staffSession = {
        id: 'staff-123',
        name: 'Carlos Ruiz',
        role: 'waiter',
        restaurant_id: 'res-1',
      };

      localStorage.setItem('nfc_active_staff_session', JSON.stringify(staffSession));
      const saved = JSON.parse(localStorage.getItem('nfc_active_staff_session') || '{}');
      expect(saved.id).toBe('staff-123');
      expect(saved.name).toBe('Carlos Ruiz');

      // Simular botón Cambiar Turno / Cerrar Sesión
      localStorage.removeItem('nfc_active_staff_session');
      expect(localStorage.getItem('nfc_active_staff_session')).toBeNull();
    });
  });

  describe('3. Motor de Suscripciones Realtime (WebSockets & Resiliencia)', () => {
    it('subscribeToRestaurantOrders se ejecuta de forma segura y devuelve función de desuscripción', () => {
      let statusEmitted: RealtimeConnectionStatus | null = null;
      const onUpdate = vi.fn();

      const unsubscribe = subscribeToRestaurantOrders(
        'res-1',
        onUpdate,
        (st) => {
          statusEmitted = st;
        }
      );

      expect(typeof unsubscribe).toBe('function');
      expect(statusEmitted).toBe('connected');

      // Desuscribir sin errores
      expect(() => unsubscribe()).not.toThrow();
    });

    it('subscribeToRestaurantCalls se ejecuta de forma segura y devuelve función de desuscripción', () => {
      let statusEmitted: RealtimeConnectionStatus | null = null;
      const onUpdate = vi.fn();

      const unsubscribe = subscribeToRestaurantCalls(
        'res-1',
        onUpdate,
        (st) => {
          statusEmitted = st;
        }
      );

      expect(typeof unsubscribe).toBe('function');
      expect(statusEmitted).toBe('connected');

      // Desuscribir sin errores
      expect(() => unsubscribe()).not.toThrow();
    });

    it('maneja sucursal vacía sin generar excepciones', () => {
      const unsubscribe = subscribeToRestaurantOrders('', () => {});
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
