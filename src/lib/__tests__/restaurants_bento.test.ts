import { describe, it, expect } from 'vitest';
import { calculateRestaurantKpis, filterRestaurants } from '../restaurants_bento';
import type { Restaurant, Tag } from '../../types';

describe('UI-EX-01: Sucursales & Restaurantes en Bento Grid Light', () => {
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
      name: 'Café Del Ángel - Polanco',
      brand_name: 'Café Del Ángel',
      branch_name: 'Polanco',
      slug: 'cafe-del-angel-polanco',
      organization_id: 'org-2',
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
    { id: 'tag-1', tag_code: 'TAG-001', restaurant_id: 'res-1', scan_count: 5, is_active: true, created_at: '' },
    { id: 'tag-2', tag_code: 'TAG-002', restaurant_id: 'res-1', scan_count: 8, is_active: true, created_at: '' },
    { id: 'tag-3', tag_code: 'TAG-003', restaurant_id: 'res-2', scan_count: 2, is_active: true, created_at: '' },
    { id: 'tag-4', tag_code: 'TAG-004', restaurant_id: 'res-3', scan_count: 0, is_active: true, created_at: '' },
    { id: 'tag-5', tag_code: 'TAG-005', restaurant_id: null, scan_count: 0, is_active: true, created_at: '' }, // Sin asignar
  ];

  it('debe calcular correctamente los KPIs ejecutivos superiores', () => {
    const kpis = calculateRestaurantKpis(mockRestaurants, mockTags);

    expect(kpis.totalBranches).toBe(3);
    expect(kpis.activeBranches).toBe(2);
    expect(kpis.pausedBranches).toBe(1);
    expect(kpis.totalTagsDeployed).toBe(4); // Solo las asignadas a estos restaurantes
    expect(kpis.avgTagsPerBranch).toBe(2); // 4 tags / 2 activas
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

  it('debe filtrar por organización matriz y modalidad de pauta', () => {
    const org1 = filterRestaurants(mockRestaurants, '', 'org-1', 'all');
    expect(org1.length).toBe(2);

    const soloAdFree = filterRestaurants(mockRestaurants, '', 'all', 'ad_free');
    expect(soloAdFree.length).toBe(1);
    expect(soloAdFree[0].id).toBe('res-1');

    const soloActivos = filterRestaurants(mockRestaurants, '', 'all', 'active');
    expect(soloActivos.length).toBe(2);
  });
});
