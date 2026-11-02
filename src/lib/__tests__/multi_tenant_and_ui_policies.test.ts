import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatTextMax25,
  parsePhoneWithCountry,
  COUNTRY_DIAL_OPTIONS,
} from '../../components/common/PhoneInputWithCountry';
import {
  ordersApi,
  isSameOrganizationAccessAllowed,
  filterBranchesBySameOrganization,
} from '../api/orders';
import { STORAGE_KEYS, setLocalItem } from '../api/core';
import type { Restaurant, StaffMember } from '../../types';

describe('UI Policies & Multi-Tenant Isolation / Inter-Branch Mobility (POL-009)', () => {
  beforeEach(() => {
    const store: Record<string, string> = { nfc_demo_auth: 'true' };
    const mockStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
        store.nfc_demo_auth = 'true';
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage, dispatchEvent: () => true },
      configurable: true,
      writable: true,
    });
  });

  it('trunca cadenas de dirección y teléfono a máximo 25 caracteres visibles (Punto 1)', () => {
    const longAddress = 'Av. Sur 8 347, Agrícola Oriental, Iztacalco, 08500 Ciudad de México, CDMX';
    const formatted = formatTextMax25(longAddress);
    expect(formatted).toBe('Av. Sur 8 347, Agrícola O...');
    expect(formatted.replace('...', '').length).toBe(25);

    const shortPhone = '+52 55354851';
    expect(formatTextMax25(shortPhone)).toBe('+52 55354851');
  });

  it('parsea código de área internacional (+52, +1, +34) y número local (Punto 2)', () => {
    expect(COUNTRY_DIAL_OPTIONS.some((c) => c.code === '+52')).toBe(true);
    expect(COUNTRY_DIAL_OPTIONS.some((c) => c.code === '+1')).toBe(true);

    const parsedMx = parsePhoneWithCountry('+52 5512345678');
    expect(parsedMx.countryCode).toBe('+52');
    expect(parsedMx.localNumber).toBe('5512345678');

    const parsedEs = parsePhoneWithCountry('+34 600112233');
    expect(parsedEs.countryCode).toBe('+34');
    expect(parsedEs.localNumber).toBe('600112233');
  });

  it('Reglas 1 y 2 (POL-009): una organización y una sucursal no tienen acceso a datos ni configuraciones de otras organizaciones', () => {
    expect(isSameOrganizationAccessAllowed('org-alpha', 'org-alpha')).toBe(true);
    expect(isSameOrganizationAccessAllowed('org-alpha', 'org-beta')).toBe(false);
    expect(isSameOrganizationAccessAllowed(null, 'org-beta')).toBe(false);

    const allBranches = [
      {
        id: 'branch-a1',
        organization_id: 'org-alpha',
        name: 'Sucursal Norte Alpha',
        google_review_url: 'https://g.page/r/1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'branch-a2',
        organization_id: 'org-alpha',
        name: 'Sucursal Sur Alpha',
        google_review_url: 'https://g.page/r/2',
        created_at: new Date().toISOString(),
      },
      {
        id: 'branch-b1',
        organization_id: 'org-beta',
        name: 'Sucursal Ajena Beta',
        google_review_url: 'https://g.page/r/3',
        created_at: new Date().toISOString(),
      },
    ] as Restaurant[];

    const isolatedForA1 = filterBranchesBySameOrganization(allBranches, 'branch-a1');
    expect(isolatedForA1.map((b) => b.id)).toEqual(['branch-a1', 'branch-a2']);
    expect(isolatedForA1.some((b) => b.organization_id === 'org-beta')).toBe(false);
  });

  it('Regla 3 (POL-009): todo el personal operativo puede iniciar sesión en otras sucursales de su misma organización, pero rechaza personal de otra organización', async () => {
    const staffFixtures: StaffMember[] = [
      {
        id: 'st-alpha-1',
        restaurant_id: 'branch-a1',
        name: 'Carlos Mesero Alpha',
        role: 'waiter',
        pin_code: '5566',
        is_active: true,
        allowed_stations: ['all'],
        created_at: new Date().toISOString(),
      },
      {
        id: 'st-beta-1',
        restaurant_id: 'branch-b1',
        name: 'Elena Mesera Beta (Otra Org)',
        role: 'waiter',
        pin_code: '7788',
        is_active: true,
        allowed_stations: ['all'],
        created_at: new Date().toISOString(),
      },
    ];
    setLocalItem(STORAGE_KEYS.STAFF_MEMBERS, staffFixtures);

    // Carlos pertenece a branch-a1 (org-alpha) e inicia sesión en branch-a2 (misma org-alpha) para cubrir su turno
    const interBranchLogin = await ordersApi.loginStaffWithPin('branch-a2', '5566', [
      'branch-a1',
      'branch-a2',
    ]);
    expect(interBranchLogin.success).toBe(true);
    expect(interBranchLogin.staff?.name).toBe('Carlos Mesero Alpha');
    expect(interBranchLogin.isInterBranchShift).toBe(true);
    expect(interBranchLogin.homeBranchId).toBe('branch-a1');

    // Elena pertenece a branch-b1 (org-beta) e intenta iniciar sesión en branch-a2 (org-alpha) -> Rechazado
    const crossOrgLogin = await ordersApi.loginStaffWithPin('branch-a2', '7788', [
      'branch-a1',
      'branch-a2',
    ]);
    expect(crossOrgLogin.success).toBe(false);
    expect(crossOrgLogin.error).toContain('otra organización');
  });

  it('Regla 4 (POL-009): entre gerentes pueden hacer movimientos de personal entre sucursales de la misma organización y dejarlo en la planeación de turnos', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Movimiento válido entre branch-a1 y branch-a2 (misma org-alpha)
    const moveRes = await ordersApi.scheduleInterBranchStaffShift({
      sourceBranchId: 'branch-a1',
      targetBranchId: 'branch-a2',
      organizationId: 'org-alpha',
      allowedBranchIds: ['branch-a1', 'branch-a2'],
      shift: {
        staff_id: 'st-alpha-1',
        staff_name: 'Carlos Mesero Alpha',
        staff_role: 'waiter',
        shift_date: todayStr,
        shift_type: 'vespertino',
        start_time: '14:00',
        end_time: '22:00',
        assigned_station: 'all',
        assigned_tables: ['Mesa 1', 'Mesa 2'],
        notes: 'Apoyo de fin de semana en terraza',
        created_by_manager: 'Gerente Norte',
      },
    });

    expect(moveRes.success).toBe(true);
    expect(moveRes.data?.restaurant_id).toBe('branch-a2');
    expect(moveRes.data?.notes).toContain('[Movimiento Inter-Sucursal: branch-a1 -> branch-a2]');

    // Movimiento inválido hacia una sucursal de otra organización (branch-b1) -> Rechazado
    const crossOrgMove = await ordersApi.scheduleInterBranchStaffShift({
      sourceBranchId: 'branch-a1',
      targetBranchId: 'branch-b1',
      organizationId: 'org-alpha',
      allowedBranchIds: ['branch-a1', 'branch-a2'],
      shift: {
        staff_id: 'st-alpha-1',
        staff_name: 'Carlos Mesero Alpha',
        staff_role: 'waiter',
        shift_date: todayStr,
        shift_type: 'matutino',
        start_time: '08:00',
        end_time: '16:00',
      },
    });

    expect(crossOrgMove.success).toBe(false);
    expect(crossOrgMove.error).toContain('otra organización');
  });
});
