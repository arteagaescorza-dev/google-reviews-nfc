import type { Restaurant, Tag } from '../types';

export interface RestaurantKpiMetrics {
  totalBranches: number;
  activeBranches: number;
  pausedBranches: number;
  totalTagsDeployed: number;
  avgTagsPerBranch: number;
  adFreeCount: number;
  adFreePercentage: number;
  networkAdsCount: number;
  tierBreakdown: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

/**
 * Calcula los KPIs consolidados para la fila superior Bento de sucursales
 */
export function calculateRestaurantKpis(restaurants: Restaurant[], tags: Tag[]): RestaurantKpiMetrics {
  const totalBranches = restaurants.length;
  const activeBranches = restaurants.filter((r) => r.is_active !== false).length;
  const pausedBranches = totalBranches - activeBranches;

  const restaurantIds = new Set(restaurants.map((r) => r.id));
  const assignedTags = tags.filter(
    (t) => t.restaurant_id && restaurantIds.has(t.restaurant_id) && t.is_active !== false
  );
  const totalTagsDeployed = assignedTags.length;
  const avgTagsPerBranch = activeBranches > 0 ? Math.round((totalTagsDeployed / activeBranches) * 10) / 10 : 0;

  const adFreeCount = restaurants.filter((r) => r.is_ad_free).length;
  const networkAdsCount = totalBranches - adFreeCount;
  const adFreePercentage = totalBranches > 0 ? Math.round((adFreeCount / totalBranches) * 100) : 0;

  const tierBreakdown = {
    tier1: restaurants.filter((r) => (r.tier || 2) === 1).length,
    tier2: restaurants.filter((r) => (r.tier || 2) === 2).length,
    tier3: restaurants.filter((r) => (r.tier || 2) === 3).length,
  };

  return {
    totalBranches,
    activeBranches,
    pausedBranches,
    totalTagsDeployed,
    avgTagsPerBranch,
    adFreeCount,
    adFreePercentage,
    networkAdsCount,
    tierBreakdown,
  };
}

/**
 * Filtra la lista de sucursales por búsqueda textual, organización matriz y modalidad
 */
export function filterRestaurants(
  restaurants: Restaurant[],
  searchQuery: string,
  selectedOrgId: string = 'all',
  selectedTier: string = 'all'
): Restaurant[] {
  const cleanQuery = searchQuery.trim().toLowerCase();

  return restaurants.filter((r) => {
    // Filtro por organización
    if (selectedOrgId !== 'all') {
      if (selectedOrgId === 'independent') {
        if (r.organization_id) return false;
      } else if (r.organization_id !== selectedOrgId) {
        return false;
      }
    }

    // Filtro por Tier / Estado Publicitario
    if (selectedTier !== 'all') {
      if (selectedTier === 'ad_free' && !r.is_ad_free) return false;
      if (selectedTier === 'with_ads' && r.is_ad_free) return false;
      if (selectedTier === 'tier_1' && (r.tier || 2) !== 1) return false;
      if (selectedTier === 'tier_2' && (r.tier || 2) !== 2) return false;
      if (selectedTier === 'tier_3' && (r.tier || 2) !== 3) return false;
      if (selectedTier === 'active' && r.is_active === false) return false;
      if (selectedTier === 'paused' && r.is_active !== false) return false;
    }

    // Filtro por texto libre
    if (!cleanQuery) return true;

    const matchName = (r.name || '').toLowerCase().includes(cleanQuery);
    const matchBrand = (r.brand_name || '').toLowerCase().includes(cleanQuery);
    const matchBranch = (r.branch_name || '').toLowerCase().includes(cleanQuery);
    const matchAddress = (r.address || '').toLowerCase().includes(cleanQuery);
    const matchPhone = (r.manager_phone || '').toLowerCase().includes(cleanQuery);

    return matchName || matchBrand || matchBranch || matchAddress || matchPhone;
  });
}

