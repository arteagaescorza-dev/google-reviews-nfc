import { describe, it, expect, beforeEach } from 'vitest';
import { foodCourtsApi } from '../api/foodCourts';
import { ordersApi } from '../api/orders';
import { STORAGE_KEYS, INITIAL_DEMO_DATA } from '../api/core';
import { getBranchCapabilities } from '../restaurants_bento';

describe('Federación de Food Courts en Plazas Comerciales y Turnero 4K (POL-008)', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {
      nfc_demo_auth: 'true',
      [STORAGE_KEYS.RESTAURANTS]: JSON.stringify([
        ...INITIAL_DEMO_DATA.restaurants,
        {
          id: 'res-external-org-99',
          organization_id: 'org-independiente-99',
          brand_name: 'Wok & Roll Oriental',
          branch_name: 'Sucursal Plaza Galerías',
          slug: 'wok-roll-galerias',
          name: 'Wok & Roll Oriental - Galerías',
          google_review_url: 'https://g.page/r/wokroll',
          tier: 3,
          is_ad_free: true,
          brand_color: '#e11d48',
          links: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]),
    };

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
      value: {
        localStorage: mockStorage,
        location: {
          origin: 'https://arteagaescorza-dev.github.io',
          pathname: '/google-reviews-nfc/',
          hash: '#/food-court',
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it('1. permite federar sucursales de distintas organizaciones independientes sin mezclar su organization_id', async () => {
    const fc = await foodCourtsApi.getFoodCourtDetails('galerias-reforma');
    expect(fc).not.toBeNull();
    expect(fc?.turnero_config.splitRatio).toBe('70_30');

    // Vincular la sucursal externa perteneciente a 'org-independiente-99'
    const linkRes = await foodCourtsApi.linkBranchToFoodCourt(
      fc!.id,
      'res-external-org-99',
      'Local FC-09',
      'Barra 9'
    );

    expect(linkRes.success).toBe(true);
    expect(linkRes.data?.commercial_space_number).toBe('Local FC-09');
    expect(linkRes.data?.tenant_brand_name).toBe('Wok & Roll Oriental');

    // Verificar que la sucursal original mantiene intacta su propia organización legal
    const storedRests = JSON.parse(mockStore[STORAGE_KEYS.RESTAURANTS]);
    const externalRest = storedRests.find((r: any) => r.id === 'res-external-org-99');
    expect(externalRest.organization_id).toBe('org-independiente-99');

    // Impedir duplicidad de vinculación en el mismo Food Court
    const duplicateRes = await foodCourtsApi.linkBranchToFoodCourt(
      fc!.id,
      'res-external-org-99',
      'Local FC-10',
      'Barra 10'
    );
    expect(duplicateRes.success).toBe(false);
  });

  it('2. permite pre-registrar un nuevo locatario por contrato de plaza y genera su URL de activación', async () => {
    const preReg = await foodCourtsApi.preRegisterFoodCourtTenant('fc-galerias-1', {
      brandName: 'Crepas & Café Francés',
      spaceNumber: 'Local FC-12',
      pickupCounter: 'Barra 12',
      contactEmail: 'contacto@crepascafe.com',
    });

    expect(preReg.success).toBe(true);
    expect(preReg.data?.status).toBe('pending_activation');
    expect(preReg.data?.commercial_space_number).toBe('Local FC-12');
    expect(preReg.activationUrl).toContain('fc_invite=');
    expect(preReg.activationUrl).toContain('Local%20FC-12');
  });

  it('3. calcula métricas de comedor, ticket promedio y venta bruta estimada para renta variable ocultando datos privados', async () => {
    // Crear dos comandas en la sucursal federada 'res-1'
    await ordersApi.createTableOrder({
      restaurant_id: 'res-1',
      tag_code: 'tag-fc-1',
      table_number: 'Comedor FC',
      customer_name: 'Ana',
      total_amount: 250,
      items: [{ menu_item_id: 'm1', name: 'Corte', price: 250, quantity: 1 }],
    });
    await ordersApi.createTableOrder({
      restaurant_id: 'res-1',
      tag_code: 'tag-fc-1',
      table_number: 'Comedor FC',
      customer_name: 'Luis',
      total_amount: 350,
      items: [{ menu_item_id: 'm2', name: 'Paquete', price: 350, quantity: 1 }],
    });

    const metrics = await foodCourtsApi.getFoodCourtMetrics('fc-galerias-1');
    expect(metrics.food_court_id).toBe('fc-galerias-1');
    expect(metrics.total_orders_count).toBeGreaterThanOrEqual(2);
    expect(metrics.total_gross_revenue_estimated).toBeGreaterThanOrEqual(600);

    const tenantRes1 = metrics.tenants.find((t) => t.restaurant_id === 'res-1');
    expect(tenantRes1).toBeDefined();
    expect(tenantRes1!.average_ticket).toBeGreaterThan(0);
    expect(tenantRes1!.gross_revenue_estimated).toBeGreaterThanOrEqual(600);

    // Garantizar aislamiento: el objeto de métrica de locatario NO expone costos, nómina ni quejas privadas
    expect((tenantRes1 as any).private_feedback).toBeUndefined();
    expect((tenantRes1 as any).payroll_costs).toBeUndefined();
    expect((tenantRes1 as any).recipes).toBeUndefined();
  });

  it('4. sincroniza comandas de locales federados hacia el agregador del Turnero Maestro 4K y permite configurar el turnero', async () => {
    const orderCreated = await ordersApi.createTableOrder({
      restaurant_id: 'res-2',
      tag_code: 'tag-fc-2',
      table_number: 'Mostrador',
      customer_name: 'Pedro',
      total_amount: 180,
      items: [{ menu_item_id: 'm3', name: 'Rollo Sushi', price: 180, quantity: 1 }],
    });

    expect(orderCreated.success).toBe(true);
    expect(orderCreated.data).toBeDefined();
    await ordersApi.updateTableOrderStatus(orderCreated.data!.id, 'ready');

    const liveOrders = await foodCourtsApi.getFoodCourtLiveOrders('fc-galerias-1');
    const matched = liveOrders.find((o) => o.id === orderCreated.data!.id);
    expect(matched).toBeDefined();
    expect(matched?.status).toBe('ready');
    expect(matched?.space_number).toBe('Local FC-02');
    expect(matched?.pickup_counter).toBe('Barra 2');

    // Actualizar configuración exclusiva del Turnero 4K
    const cfgUpdate = await foodCourtsApi.updateFoodCourtConfig(
      'fc-galerias-1',
      { autoHideReadyMinutes: 5, adRotationSeconds: 15 },
      { name: 'Food Court Galerías VIP' }
    );
    expect(cfgUpdate.success).toBe(true);
    expect(cfgUpdate.data?.name).toBe('Food Court Galerías VIP');
    expect(cfgUpdate.data?.turnero_config.autoHideReadyMinutes).toBe(5);
    expect(cfgUpdate.data?.turnero_config.adRotationSeconds).toBe(15);
  });

  it('5. expresa correctamente el giro Plaza Comercial / Food Court en el árbol de Cuentas & Sucursales y sincroniza ensureFoodCourtForBranch', async () => {
    const fcUnit = INITIAL_DEMO_DATA.restaurants.find((r) => r.business_type === 'food_court');
    expect(fcUnit).toBeDefined();

    const caps = getBranchCapabilities(fcUnit!, INITIAL_DEMO_DATA.businessVerticals);
    expect(caps.isFoodCourtUnit).toBe(true);
    expect(caps.verticalLabel).toBe('Plaza Comercial / Food Court');
    expect(caps.unitLabel).toBe('Local Federado');
    expect(caps.supportsKds).toBe(false);

    // Sincronizar o crear automáticamente entidad FoodCourt desde una unidad Nivel 3 nueva
    const ensuredFc = await foodCourtsApi.ensureFoodCourtForBranch({
      ...fcUnit!,
      id: 'res-fc-nueva-plaza',
      branch_name: 'Food Court Antara Polanco',
      slug: 'antara-polanco-fc',
      name: 'Food Court Antara Polanco',
    });
    expect(ensuredFc.slug).toBe('antara-polanco-fc');
    expect(ensuredFc.turnero_config.splitRatio).toBe('70_30');

    // Verificar edición en línea del número de local y barra para la vista bidireccional
    const allLinks = await foodCourtsApi.getAllFoodCourtBranchLinks();
    expect(allLinks.length).toBeGreaterThanOrEqual(3);

    const updatedLink = await foodCourtsApi.updateFoodCourtBranchLink(allLinks[0].id, {
      commercial_space_number: 'Local FC-01A',
      pickup_counter_label: 'Barra Central 1',
    });
    expect(updatedLink.success).toBe(true);
    expect(updatedLink.data?.commercial_space_number).toBe('Local FC-01A');
    expect(updatedLink.data?.pickup_counter_label).toBe('Barra Central 1');
  });
});
