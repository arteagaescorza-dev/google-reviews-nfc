import { describe, it, expect, beforeEach } from 'vitest';
import { ordersApi, getDefaultStationsForRole } from '../api/orders';

describe('Fase B: Roles Operativos (Hostess y Barista) y Gestión de Mesas con Solicitud de Limpieza', () => {
  beforeEach(() => {
    const store: Record<string, string> = { nfc_demo_auth: 'true' };
    const mockStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage },
      writable: true,
      configurable: true,
    });
  });

  it('asigna estaciones KDS predeterminadas según el rol operativo (Jefe de Cocina vs Barista)', () => {
    expect(getDefaultStationsForRole('kitchen')).toEqual(['cocina']);
    expect(getDefaultStationsForRole('barista')).toEqual(['barra', 'postres']);
    expect(getDefaultStationsForRole('hostess')).toEqual(['all']);
    expect(getDefaultStationsForRole('waiter')).toEqual(['all']);
    expect(getDefaultStationsForRole('manager')).toEqual(['all']);
  });

  it('permite crear una mesa por sucursal con número total de comensales y cambiar su estado', async () => {
    const createRes = await ordersApi.saveRestaurantTable({
      restaurant_id: 'res-1',
      table_number: 'Mesa VIP 10',
      capacity: 10,
      status: 'libre',
      notes: 'Salón privado',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data?.table_number).toBe('Mesa VIP 10');
    expect(createRes.data?.capacity).toBe(10);
    expect(createRes.data?.status).toBe('libre');

    const tableId = createRes.data!.id;

    // Ocupar mesa con 7 comensales
    const occupyRes = await ordersApi.updateRestaurantTableStatus(tableId, 'ocupada', 7, 'Marco Antonio (Mesero)');
    expect(occupyRes.success).toBe(true);
    expect(occupyRes.data?.status).toBe('ocupada');
    expect(occupyRes.data?.current_guests).toBe(7);

    // Desactivar mesa temporalmente
    const disableRes = await ordersApi.updateRestaurantTableStatus(tableId, 'desactivada');
    expect(disableRes.success).toBe(true);
    expect(disableRes.data?.status).toBe('desactivada');
    expect(disableRes.data?.current_guests).toBe(0);
  });

  it('notifica al mesero cuando la Hostess solicita limpieza y libera la mesa automáticamente cuando el mesero atiende el llamado', async () => {
    const tables = await ordersApi.getRestaurantTables('res-1');
    const targetTable = tables[0];
    expect(targetTable).toBeDefined();

    // 1. Hostess solicita limpieza de la mesa al mesero
    const cleaningRes = await ordersApi.requestTableCleaning('res-1', targetTable);
    expect(cleaningRes.success).toBe(true);
    expect(cleaningRes.table?.status).toBe('en_limpieza');
    expect(cleaningRes.call?.call_type).toBe('cleaning');
    expect(cleaningRes.call?.status).toBe('active');
    expect(cleaningRes.call?.table_number).toBe(targetTable.table_number);

    // 2. Verificar que en la terminal del mesero aparece la alerta activa de limpieza
    const activeCalls = await ordersApi.getTableCalls('res-1');
    const cleaningCallInWaiterPage = activeCalls.find(
      (c) => c.id === cleaningRes.call?.id && c.status === 'active'
    );
    expect(cleaningCallInWaiterPage).toBeDefined();
    expect(cleaningCallInWaiterPage?.call_type).toBe('cleaning');

    // 3. El mesero marca la mesa como limpia en su terminal
    const resolveRes = await ordersApi.resolveTableCall(cleaningRes.call!.id, 'Marco Antonio (Mesero)');
    expect(resolveRes.success).toBe(true);
    expect(resolveRes.data?.status).toBe('attended');

    // 4. La mesa vuelve automáticamente al estado 'libre' (desocupada) en la pantalla de Hostess
    const updatedTables = await ordersApi.getRestaurantTables('res-1');
    const freedTable = updatedTables.find((t) => t.id === targetTable.id);
    expect(freedTable?.status).toBe('libre');
    expect(freedTable?.current_guests).toBe(0);
  });

  it('permite iniciar sesión con PINs universales y detecta automáticamente parámetros permutados', async () => {
    // 1. Login con orden estándar (restaurantId, pin)
    const waiterLogin = await ordersApi.loginStaffWithPin('res-1', '1234');
    expect(waiterLogin.success).toBe(true);
    expect(waiterLogin.staff).toBeDefined();

    const hostessLogin = await ordersApi.loginStaffWithPin('res-1', '1111');
    expect(hostessLogin.success).toBe(true);
    expect(hostessLogin.staff?.role).toBe('hostess');

    const managerLogin = await ordersApi.loginStaffWithPin('res-1', '8888');
    expect(managerLogin.success).toBe(true);
    expect(managerLogin.staff?.role).toBe('manager');

    // 2. Login con orden permutado defensivo (pin, restaurantId)
    const swappedLogin = await ordersApi.loginStaffWithPin('1111', 'res-1');
    expect(swappedLogin.success).toBe(true);
    expect(swappedLogin.staff?.role).toBe('hostess');
  });
});
