import { describe, it, expect } from 'vitest';
import { calculateRestaurantKpis, filterRestaurants, buildOrganizationTree } from '../restaurants_bento';
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
          restaurant_id: 'res-1',
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

    // Giro Restaurante: KDS y Meseros activos
    expect(gastroBranch?.capabilities.supportsKds).toBe(true);
    expect(gastroBranch?.capabilities.supportsFloorStaff).toBe(true);
    expect(gastroBranch?.kdsStations.length).toBe(5);
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
});
