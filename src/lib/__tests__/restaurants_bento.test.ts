import { describe, it, expect } from 'vitest';
import {
  calculateRestaurantKpis,
  filterRestaurants,
  buildOrganizationTree,
  getTierFeaturesForBranch,
  getDefaultKdsStations,
} from '../restaurants_bento';
import type { Restaurant, Tag, Organization } from '../../types';

describe('UI-EX-01: Sucursales & Restaurantes en Bento Grid Light', () => {
  const mockOrganizations: Organization[] = [
    {
      id: 'org-1',
      name: 'Grupo Gastronómico Gourmet',
      owner_name: 'Carlos Mendoza',
      owner_email: 'carlos@grupogourmet.com',
      owner_phone: '+525512345678',
      notify_negative_feedback: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'org-2',
      name: 'Berman y pizzs',
      owner_name: 'Sabrina Spellman',
      owner_phone: '+525525784565',
      notify_negative_feedback: true,
      created_at: new Date().toISOString(),
    },
  ];

  const mockRestaurants: Restaurant[] = [
    {
      id: 'res-1',
      name: 'Pizzería Napolitana - Centro',
      brand_name: 'Pizzería Napolitana',
      branch_name: 'Centro Histórico',
      slug: 'napolitana-centro',
      organization_id: 'org-1',
      google_review_url: 'https://g.page/napolitana-centro',
      tier: 3,
      links: [],
      is_active: true,
      is_ad_free: true,
      brand_color: '#EF4444',
      address: 'Av. Juárez 101, Centro',
      manager_phone: '+525511223344',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-2',
      name: 'Pizzería Napolitana - Roma Norte',
      brand_name: 'Pizzería Napolitana',
      branch_name: 'Roma Norte',
      slug: 'napolitana-roma',
      organization_id: 'org-1',
      google_review_url: 'https://g.page/napolitana-roma',
      tier: 2,
      links: [],
      is_active: true,
      is_ad_free: false,
      brand_color: '#EF4444',
      address: 'Colima 45, Roma Norte',
      manager_phone: '+525599887766',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-3',
      name: 'Café Del Ángel - Independiente',
      brand_name: 'Café Del Ángel',
      branch_name: 'Polanco',
      slug: 'cafe-del-angel-polanco',
      organization_id: null,
      google_review_url: 'https://g.page/cafe-del-angel',
      tier: 1,
      links: [],
      is_active: false,
      is_ad_free: false,
      brand_color: '#3B82F6',
      address: 'Masaryk 200, Polanco',
      manager_phone: '+525544332211',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockTags: Tag[] = [
    { id: 'tag-1', tag_code: 'TAG-001', table_identifier: 'Mesa 1', restaurant_id: 'res-1', scan_count: 5, is_active: true, created_at: '' },
    { id: 'tag-2', tag_code: 'TAG-002', table_identifier: 'Mesa 2', restaurant_id: 'res-1', scan_count: 8, is_active: true, created_at: '' },
    { id: 'tag-3', tag_code: 'TAG-003', table_identifier: 'Terraza 1', restaurant_id: 'res-2', scan_count: 2, is_active: true, created_at: '' },
    { id: 'tag-4', tag_code: 'TAG-004', table_identifier: 'Barra', restaurant_id: 'res-3', scan_count: 0, is_active: true, created_at: '' },
    { id: 'tag-5', tag_code: 'TAG-005', table_identifier: null, restaurant_id: null, scan_count: 0, is_active: true, created_at: '' }, // Sin asignar
  ];

  it('debe calcular correctamente los KPIs ejecutivos superiores', () => {
    const kpis = calculateRestaurantKpis(mockRestaurants, mockTags);

    expect(kpis.totalBranches).toBe(3);
    expect(kpis.activeBranches).toBe(2);
    expect(kpis.pausedBranches).toBe(1);
    expect(kpis.totalTagsDeployed).toBe(4);
    expect(kpis.avgTagsPerBranch).toBe(2);
    expect(kpis.adFreeCount).toBe(1);
    expect(kpis.networkAdsCount).toBe(2);
    expect(kpis.adFreePercentage).toBe(33);
    expect(kpis.tierBreakdown.tier1).toBe(1);
    expect(kpis.tierBreakdown.tier2).toBe(1);
    expect(kpis.tierBreakdown.tier3).toBe(1);
  });

  it('debe filtrar restaurantes por búsqueda de texto (nombre, sucursal o teléfono)', () => {
    const porMarca = filterRestaurants(mockRestaurants, 'napolitana');
    expect(porMarca.length).toBe(2);

    const porSucursal = filterRestaurants(mockRestaurants, 'polanco');
    expect(porSucursal.length).toBe(1);
    expect(porSucursal[0].id).toBe('res-3');

    const porTelefono = filterRestaurants(mockRestaurants, '99887766');
    expect(porTelefono.length).toBe(1);
    expect(porTelefono[0].id).toBe('res-2');
  });

  it('debe construir el árbol jerárquico de 3 niveles e incluir organizaciones con 0 sucursales', () => {
    const tree = buildOrganizationTree(mockOrganizations, mockRestaurants, mockTags);

    // Debe mostrar ambas organizaciones, incluyendo Berman y pizzs (org-2) con 0 sucursales
    expect(tree.organizations.length).toBe(2);

    const orgGourmet = tree.organizations.find((o) => o.organization.id === 'org-1');
    expect(orgGourmet).toBeDefined();
    expect(orgGourmet?.branches.length).toBe(2);
    expect(orgGourmet?.totalTagsCount).toBe(3); // 2 de res-1 + 1 de res-2
    // Nivel 3 en sucursal 1
    expect(orgGourmet?.branches[0].tags.length).toBe(2);
    expect(orgGourmet?.branches[0].tags[0].tag_code).toBe('TAG-001');

    // Berman y pizzs debe estar visible con 0 sucursales
    const orgBerman = tree.organizations.find((o) => o.organization.id === 'org-2');
    expect(orgBerman).toBeDefined();
    expect(orgBerman?.branches.length).toBe(0);
    expect(orgBerman?.totalTagsCount).toBe(0);

    // Sucursal independiente (sin org asignada)
    expect(tree.independentBranches.length).toBe(1);
    expect(tree.independentBranches[0].restaurant.id).toBe('res-3');
    expect(tree.independentBranches[0].tags.length).toBe(1);

    // Estadísticas agregadas del árbol
    expect(tree.stats.totalOrganizations).toBe(2);
    expect(tree.stats.emptyOrganizations).toBe(1);
    expect(tree.stats.totalBranches).toBe(3);
    expect(tree.stats.totalTags).toBe(4);
  });

  it('debe filtrar el árbol al buscar por nombre de organización vacía (ej. Berman)', () => {
    const tree = buildOrganizationTree(mockOrganizations, mockRestaurants, mockTags, 'Berman');

    expect(tree.organizations.length).toBe(1);
    expect(tree.organizations[0].organization.name).toBe('Berman y pizzs');
    expect(tree.independentBranches.length).toBe(0);
  });

  it('debe habilitar categorías de KDS y Meseros únicamente en sucursales donde aplique por giro', () => {
    const mixedRestaurants: Restaurant[] = [
      {
        ...mockRestaurants[0],
        id: 'res-gastro',
        business_type: 'restaurant',
      },
      {
        ...mockRestaurants[1],
        id: 'res-dental',
        business_type: 'dental',
      },
    ];

    const tree = buildOrganizationTree(
      mockOrganizations,
      mixedRestaurants,
      mockTags,
      '',
      'all',
      'all',
      [
        {
          id: 'st-1',
          restaurant_id: 'res-gastro',
          name: 'Marco Antonio',
          role: 'waiter',
          pin_code: '1234',
          is_active: true,
          created_at: '',
        },
      ],
      {
        'res-gastro': { postres: true },
      }
    );

    const org1 = tree.organizations.find((o) => o.organization.id === 'org-1');
    const gastroBranch = org1?.branches.find((b) => b.restaurant.id === 'res-gastro');
    const dentalBranch = org1?.branches.find((b) => b.restaurant.id === 'res-dental');

    // Giro Restaurante: KDS y Meseros activos (6 estaciones incluyendo Pick Up & Collect)
    expect(gastroBranch?.capabilities.supportsKds).toBe(true);
    expect(gastroBranch?.capabilities.supportsFloorStaff).toBe(true);
    expect(gastroBranch?.kdsStations.length).toBe(6);
    expect(gastroBranch?.kdsStations.find((s) => s.id === 'postres')?.isActive).toBe(true);
    expect(gastroBranch?.staff.length).toBe(1);

    // Giro Clínica Dental: KDS y Meseros no aplican
    expect(dentalBranch?.capabilities.supportsKds).toBe(false);
    expect(dentalBranch?.capabilities.supportsFloorStaff).toBe(false);
    expect(dentalBranch?.kdsStations.length).toBe(0);
    expect(dentalBranch?.staff.length).toBe(0);
  });

  it('debe calcular los switches de funcionalidades de cada Tier y el conteo de solicitudes de quejas por sucursal', () => {
    const tree = buildOrganizationTree(
      mockOrganizations,
      mockRestaurants,
      mockTags,
      '',
      'all',
      'all',
      [],
      {},
      [
        {
          id: 'fb-1',
          restaurant_id: 'res-1',
          rating: 2,
          comments: 'Tardó la pizza',
          status: 'new',
          notified_to_owner: true,
          created_at: '',
        },
        {
          id: 'fb-2',
          restaurant_id: 'res-1',
          rating: 1,
          comments: 'Fría',
          status: 'reviewed',
          notified_to_owner: true,
          created_at: '',
        },
      ],
      {
        'res-2': { tier_3_digital_menu_wifi: true }, // Override manual en sucursal Tier 2
      }
    );

    const org1 = tree.organizations.find((o) => o.organization.id === 'org-1');
    const branch1 = org1?.branches.find((b) => b.restaurant.id === 'res-1'); // Tier 3, Ad-Free true
    const branch2 = org1?.branches.find((b) => b.restaurant.id === 'res-2'); // Tier 2, con override de Tier 3

    // Sucursal 1 (Tier 3): tiene 2 quejas (1 nueva) y prendidos Tier 1, Tier 2, Tier 3 y Add-On Ad-Free
    expect(branch1?.feedbacksCount).toBe(2);
    expect(branch1?.pendingFeedbacksCount).toBe(1);
    expect(branch1?.tierFeatures.find((f) => f.key === 'tier_1_redirect')?.isActive).toBe(true);
    expect(branch1?.tierFeatures.find((f) => f.key === 'tier_2_reputation_shield')?.isActive).toBe(true);
    expect(branch1?.tierFeatures.find((f) => f.key === 'tier_3_digital_menu_wifi')?.isActive).toBe(true);
    expect(branch1?.tierFeatures.find((f) => f.key === 'tier_4_ad_network_analytics')?.isActive).toBe(false);
    expect(branch1?.tierFeatures.find((f) => f.key === 'addon_ad_free')?.isActive).toBe(true);

    // Sucursal 2 (Tier 2 con override manual en Tier 3):
    expect(branch2?.feedbacksCount).toBe(0);
    expect(branch2?.tierFeatures.find((f) => f.key === 'tier_2_reputation_shield')?.isActive).toBe(true);
    expect(branch2?.tierFeatures.find((f) => f.key === 'tier_3_digital_menu_wifi')?.isActive).toBe(true);
  });

  it('debe supeditar las sucursales a las marcas comerciales de cada organización y sincronizar giros universales', () => {
    const customVerticals = [
      {
        id: 'vert-barber',
        slug: 'barberia-vip',
        name: 'Barbería & Grooming VIP',
        unit_label: 'Sillón',
        unit_plural: 'Sillones',
        show_kds: false,
        show_floor_staff: true,
        show_hostess: true,
        created_at: '',
      },
    ];

    const explicitBrands = [
      {
        id: 'brand-pizza',
        organization_id: 'org-1',
        name: 'Pizzería Napolitana',
        vertical_slug: 'restaurant',
        logo_url: 'https://ejemplo.com/pizza.webp',
        brand_color: '#EF4444',
        created_at: '',
      },
      {
        id: 'brand-barber',
        organization_id: 'org-1',
        name: 'Barbería Royal',
        vertical_id: 'vert-barber',
        vertical_slug: 'barberia-vip',
        logo_url: 'https://ejemplo.com/barber.webp',
        brand_color: '#1E293B',
        created_at: '',
      },
    ];

    const restaurantsWithBrands: Restaurant[] = [
      {
        ...mockRestaurants[0],
        brand_id: 'brand-pizza',
      },
      {
        ...mockRestaurants[1],
        brand_id: 'brand-pizza',
      },
    ];

    const tree = buildOrganizationTree(
      mockOrganizations,
      restaurantsWithBrands,
      mockTags,
      '',
      'all',
      'all',
      [],
      {},
      [],
      {},
      explicitBrands,
      customVerticals
    );

    const org1 = tree.organizations.find((o) => o.organization.id === 'org-1');
    expect(org1?.brands.length).toBe(2);

    const pizzaBrand = org1?.brands.find((b) => b.brand.id === 'brand-pizza');
    expect(pizzaBrand?.branches.length).toBe(2);
    expect(pizzaBrand?.totalTagsCount).toBe(3);

    const barberBrand = org1?.brands.find((b) => b.brand.id === 'brand-barber');
    expect(barberBrand?.verticalLabel).toBe('Barbería & Grooming VIP');
    expect(barberBrand?.branches.length).toBe(0);
  });

  it('POL-008: Reactividad de Menu Digital desde Tier 2 y Tier 4 con paridad en customTiers', () => {
    const branchTier2: Restaurant = {
      ...mockRestaurants[1],
      tier: 2,
    };
    const branchTier4: Restaurant = {
      ...mockRestaurants[0],
      tier: 4,
    };
    const branchTier1: Restaurant = {
      ...mockRestaurants[2],
      tier: 1,
      is_active: true,
    };

    // 1. En Tier 2 con DEFAULT_CUSTOM_TIERS (que incluye feat_digital_menu), el menu digital esta activo
    const featuresTier2 = getTierFeaturesForBranch(branchTier2);
    const menuFeatureT2 = featuresTier2.find((f) => f.key === 'tier_3_digital_menu');
    expect(menuFeatureT2?.isActive).toBe(true);

    // 2. En Tier 4 con DEFAULT_CUSTOM_TIERS, el menu digital esta activo
    const featuresTier4 = getTierFeaturesForBranch(branchTier4);
    const menuFeatureT4 = featuresTier4.find((f) => f.key === 'tier_3_digital_menu');
    expect(menuFeatureT4?.isActive).toBe(true);

    // 3. En Tier 1, el menu digital esta apagado
    const featuresTier1 = getTierFeaturesForBranch(branchTier1);
    const menuFeatureT1 = featuresTier1.find((f) => f.key === 'tier_3_digital_menu');
    expect(menuFeatureT1?.isActive).toBe(false);

    // 4. Con override manual apagado, se respeta el override
    const featuresWithOverride = getTierFeaturesForBranch(branchTier4, { feat_digital_menu: false });
    const overriddenMenu = featuresWithOverride.find((f) => f.key === 'tier_3_digital_menu');
    expect(overriddenMenu?.isActive).toBe(false);
  });

  it('POL-008: Permeacion automatica de estaciones KDS en Tier 2 a cada sucursal (1 de 9 prendidas)', () => {
    // En Tier 2, la matriz solo incluye station_manager (Consola Operativa de Gerente)
    const tier2Stations = ['station_manager'];

    const kdsStationsTier2 = getDefaultKdsStations('res-2', {}, tier2Stations);
    expect(kdsStationsTier2.length).toBe(6);
    // Ninguna de las 6 estaciones de cocina/barra/turnero/pickup debe estar prendida en Tier 2 por defecto
    const activeKdsStationsTier2 = kdsStationsTier2.filter((s) => s.isActive);
    expect(activeKdsStationsTier2.length).toBe(0);

    // En Tier 4, las estaciones autorizadas si estan prendidas por defecto
    const tier4Stations = [
      'station_manager',
      'station_hostess',
      'station_waiter',
      'station_kds_general',
      'station_kds_cocina',
      'station_kds_barra',
      'station_kds_postres',
      'station_turnero',
      'station_pickup',
    ];
    const kdsStationsTier4 = getDefaultKdsStations('res-1', {}, tier4Stations);
    const activeKdsStationsTier4 = kdsStationsTier4.filter((s) => s.isActive);
    expect(activeKdsStationsTier4.length).toBe(6);
  });
});
