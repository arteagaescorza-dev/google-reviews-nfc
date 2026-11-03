import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';

describe('Fase C: Tabla de Gerentes por Organización, Turnos a 60 Días, Cortes de Caja y Cupones con Límite Mensual', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
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
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    if (typeof window === 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: mockStorage, dispatchEvent: () => true },
        configurable: true,
        writable: true,
      });
    }
  });

  it('permite gestionar la tabla de gerentes por organización y asignarlos a sucursales como Gerente de Tienda o Capitán de Piso', async () => {
    const initialManagers = await api.getOrganizationManagers('org-1');
    expect(initialManagers.length).toBeGreaterThanOrEqual(2);

    const newMgrRes = await api.saveOrganizationManager({
      organization_id: 'org-1',
      name: 'Roberto Mendoza (Gerente Norte)',
      email: 'roberto.norte@ejemplo.com',
      phone: '+525599887766',
      pin_code: '4321',
      manager_role: 'gerente_tienda',
      assigned_branch_ids: ['res-1'],
      is_active: true,
    });

    expect(newMgrRes.success).toBe(true);
    expect(newMgrRes.data?.manager_role).toBe('gerente_tienda');

    // Asignar a una segunda sucursal (res-2) como Capitán de Piso
    const assignedRes = await api.assignManagerToBranch(newMgrRes.data!.id, 'res-2', 'capitan_piso');
    expect(assignedRes.success).toBe(true);

    const updatedManagers = await api.getOrganizationManagers('org-1');
    const found = updatedManagers.find((m) => m.id === newMgrRes.data!.id);
    expect(found?.assigned_branch_ids).toContain('res-1');
    expect(found?.assigned_branch_ids).toContain('res-2');
    expect(found?.branch_roles?.['res-2']).toBe('capitan_piso');
  });

  it('permite programar turnos con hasta 2 meses (60 días) de anticipación y rechaza fechas mayores a 2 meses', async () => {
    const future45 = new Date();
    future45.setDate(future45.getDate() + 45);
    const date45Str = future45.toISOString().split('T')[0];

    const okShift = await api.createStaffShift({
      restaurant_id: 'res-1',
      staff_id: 'staff-1',
      staff_name: 'Carlos (Mesero)',
      staff_role: 'waiter',
      shift_date: date45Str,
      shift_type: 'vespertino',
      start_time: '15:00',
      end_time: '23:00',
      assigned_station: 'cocina',
    });

    expect(okShift.success).toBe(true);
    expect(okShift.data?.shift_date).toBe(date45Str);

    // Intentar agendar a 75 días (> 2 meses)
    const future75 = new Date();
    future75.setDate(future75.getDate() + 75);
    const date75Str = future75.toISOString().split('T')[0];

    const rejectedShift = await api.createStaffShift({
      restaurant_id: 'res-1',
      staff_id: 'staff-1',
      staff_name: 'Carlos (Mesero)',
      staff_role: 'waiter',
      shift_date: date75Str,
      shift_type: 'matutino',
      start_time: '08:00',
      end_time: '16:00',
    });

    expect(rejectedShift.success).toBe(false);
    expect(rejectedShift.error).toContain('2 meses');
  });

  it('permite al gerente crear cupones de retención con límite mensual y bloquea autorizaciones cuando se alcanza el tope', async () => {
    const couponRes = await api.createManagerRetentionCoupon({
      restaurant_id: 'res-1',
      manager_name: 'Laura Méndez',
      coupon_code: 'CORTESIA-TOPE2',
      title: 'Postre de Cortesía por Queja',
      discount_description: '100% en postre de la casa',
      discount_percentage: 100,
      monthly_limit: 2,
      is_active: true,
    });

    expect(couponRes.success).toBe(true);
    const couponId = couponRes.data!.id;

    // 1ra autorización
    const auth1 = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: 'fb-101',
      restaurantId: 'res-1',
      couponId,
      managerName: 'Laura Méndez',
    });
    expect(auth1.success).toBe(true);
    expect(auth1.coupon?.used_this_month).toBe(1);

    // 2da autorización (alcanza el límite mensual de 2)
    const auth2 = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: 'fb-102',
      restaurantId: 'res-1',
      couponId,
      managerName: 'Laura Méndez',
    });
    expect(auth2.success).toBe(true);
    expect(auth2.coupon?.used_this_month).toBe(2);

    // 3ra autorización debe ser rechazada por límite mensual agotado
    const auth3 = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: 'fb-103',
      restaurantId: 'res-1',
      couponId,
      managerName: 'Laura Méndez',
    });
    expect(auth3.success).toBe(false);
    expect(auth3.error).toContain('límite mensual');
  });

  it('genera cortes de caja por turno enviando métricas por mesa y por empleado a la pantalla general del dueño', async () => {
    const reportRes = await api.createManagerShiftReport({
      restaurant_id: 'res-1',
      branch_name: 'Pizza Norte (Principal)',
      manager_name: 'Laura Méndez (Gerente de Tienda)',
      waiter_name: 'Carlos (Mesero)',
      shift_date: '2026-11-04',
      shift_type: 'vespertino',
      tables_served: 14,
      total_sales: 4850,
      cash_sales: 1850,
      card_sales: 3000,
      tips_collected: 620,
      discounts_authorized: 150,
      table_metrics: [
        { table_number: 'Mesa 1', orders_count: 6, total_amount: 2100, average_ticket: 350 },
        { table_number: 'Mesa 4', orders_count: 8, total_amount: 2750, average_ticket: 343.75 },
      ],
      employee_metrics: [
        {
          staff_name: 'Carlos (Mesero)',
          role: 'waiter',
          tables_served: 14,
          sales_generated: 4850,
          tips_estimated: 620,
          calls_attended: 9,
        },
      ],
      sent_to_owner: true,
    });

    expect(reportRes.success).toBe(true);
    expect(reportRes.data?.sent_to_owner).toBe(true);

    const ownerReports = await api.getManagerShiftReports('res-1');
    expect(ownerReports.length).toBeGreaterThanOrEqual(1);
    expect(ownerReports[0].total_sales).toBe(4850);
    expect(ownerReports[0].table_metrics.length).toBe(2);
    expect(ownerReports[0].employee_metrics[0].staff_name).toBe('Carlos (Mesero)');
  });

  it('permite crear cupones de retención de 1 solo uso, agotarse tras su primer canje y eliminarlos', async () => {
    // 1. Crear cupón con límite de 1 solo uso
    const createRes = await api.createManagerRetentionCoupon({
      organization_id: 'org-1',
      restaurant_id: 'res-1',
      manager_id: 'mgr-1',
      manager_name: 'Lic. Mauricio Salinas',
      title: 'Cupón 25% Cortesía Queja',
      coupon_code: 'UNICO-25',
      discount_percentage: 25,
      discount_description: 'Cortesía de 1 solo uso por demora en mesa',
      monthly_limit: 1,
      is_active: true,
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data?.monthly_limit).toBe(1);
    expect(createRes.data?.used_this_month).toBe(0);
    const couponId = createRes.data!.id;

    // 2. Canjear el cupón en una queja (primer y único uso)
    const auth1 = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: 'fb-test-1',
      restaurantId: 'res-1',
      couponId,
      managerName: 'Lic. Mauricio Salinas',
    });
    expect(auth1.success).toBe(true);
    expect(auth1.coupon?.used_this_month).toBe(1);

    // 3. Intentar un segundo uso debe ser rechazado
    const auth2 = await api.authorizeComplaintDiscountOrCoupon({
      feedbackId: 'fb-test-2',
      restaurantId: 'res-1',
      couponId,
      managerName: 'Lic. Mauricio Salinas',
    });
    expect(auth2.success).toBe(false);
    expect(auth2.error).toContain('límite mensual');

    // 4. Eliminar el cupón quemado
    const delRes = await api.deleteManagerRetentionCoupon(couponId);
    expect(delRes.success).toBe(true);
    const allAfterDel = await api.getManagerRetentionCoupons('res-1');
    expect(allAfterDel.some((c) => c.id === couponId)).toBe(false);
  });

  it('permite dar de alta, editar y eliminar empleados de Categoría 4 desde la sucursal', async () => {
    // 1. Crear nuevo empleado
    const newStaff = await api.createStaffMember({
      restaurant_id: 'res-1',
      name: 'Esteban Garibay',
      role: 'waiter',
      pin_code: '7788',
      allowed_stations: ['cocina'],
      is_active: true,
    });

    expect(newStaff.success).toBe(true);
    expect(newStaff.data?.name).toBe('Esteban Garibay');
    expect(newStaff.data?.pin_code).toBe('7788');
    const staffId = newStaff.data!.id;

    // 2. Editar empleado (cambiar puesto y PIN)
    const updateRes = await api.updateStaffMember(staffId, {
      role: 'barista',
      pin_code: '9900',
      allowed_stations: ['barista', 'pickup'],
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.data?.role).toBe('barista');
    expect(updateRes.data?.pin_code).toBe('9900');
    expect(updateRes.data?.allowed_stations).toContain('barista');

    // 3. Eliminar empleado
    const deleteRes = await api.deleteStaffMember(staffId);
    expect(deleteRes.success).toBe(true);
    const staffList = await api.getStaffMembers('res-1');
    expect(staffList.some((s) => s.id === staffId)).toBe(false);
  });
});
