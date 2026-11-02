import type { Restaurant, Tag, Organization } from '../types';

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

export interface BranchNode {
  restaurant: Restaurant;
  tags: Tag[];
}

export interface OrganizationNode {
  organization: Organization;
  branches: BranchNode[];
  totalTagsCount: number;
}

export interface TreeViewData {
  organizations: OrganizationNode[];
  independentBranches: BranchNode[];
  stats: {
    totalOrganizations: number;
    emptyOrganizations: number;
    totalBranches: number;
    totalTags: number;
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
 * Filtra la lista plana de sucursales por búsqueda textual, organización matriz y modalidad
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

/**
 * Construye la estructura jerárquica en Árbol de 3 Niveles:
 * Nivel 1: Organización (Empresa Matriz / Corporativo)
 * Nivel 2: Sucursales (Locales Físicos con dirección y menús)
 * Nivel 3: Placas NFC en Mesa (Hardware físico con folios y escaneos)
 */
export function buildOrganizationTree(
  organizations: Organization[],
  restaurants: Restaurant[],
  tags: Tag[],
  searchQuery: string = '',
  selectedOrgFilter: string = 'all',
  selectedTierFilter: string = 'all'
): TreeViewData {
  // Mapa de tags agrupados por restaurant_id
  const tagsByRestaurant: Record<string, Tag[]> = {};
  tags.forEach((tag) => {
    if (tag.restaurant_id) {
      if (!tagsByRestaurant[tag.restaurant_id]) {
        tagsByRestaurant[tag.restaurant_id] = [];
      }
      tagsByRestaurant[tag.restaurant_id].push(tag);
    }
  });

  // Mapa de sucursales agrupadas por organization_id y lista de independientes
  const branchesByOrg: Record<string, BranchNode[]> = {};
  const independentBranches: BranchNode[] = [];

  restaurants.forEach((res) => {
    if (selectedTierFilter !== 'all') {
      if (selectedTierFilter === 'ad_free' && !res.is_ad_free) return;
      if (selectedTierFilter === 'with_ads' && res.is_ad_free) return;
      if (selectedTierFilter === 'tier_1' && (res.tier || 2) !== 1) return;
      if (selectedTierFilter === 'tier_2' && (res.tier || 2) !== 2) return;
      if (selectedTierFilter === 'tier_3' && (res.tier || 2) !== 3) return;
      if (selectedTierFilter === 'active' && res.is_active === false) return;
      if (selectedTierFilter === 'paused' && res.is_active !== false) return;
    }

    const branchNode: BranchNode = {
      restaurant: res,
      tags: tagsByRestaurant[res.id] || [],
    };

    if (res.organization_id) {
      if (!branchesByOrg[res.organization_id]) {
        branchesByOrg[res.organization_id] = [];
      }
      branchesByOrg[res.organization_id].push(branchNode);
    } else {
      independentBranches.push(branchNode);
    }
  });

  // Construir nodos de organización (incluye organizaciones con 0 sucursales)
  let orgNodes: OrganizationNode[] = organizations.map((org) => {
    const branches = branchesByOrg[org.id] || [];
    const totalTagsCount = branches.reduce((acc, b) => acc + b.tags.length, 0);
    return {
      organization: org,
      branches,
      totalTagsCount,
    };
  });

  // Filtrado por Organización seleccionada en el combo
  if (selectedOrgFilter !== 'all') {
    if (selectedOrgFilter === 'independent') {
      orgNodes = [];
    } else {
      orgNodes = orgNodes.filter((node) => node.organization.id === selectedOrgFilter);
    }
  }

  // Filtrado reactivo por texto de búsqueda
  const cleanQuery = searchQuery.trim().toLowerCase();
  if (cleanQuery) {
    orgNodes = orgNodes
      .map((node) => {
        const orgMatch =
          (node.organization.name || '').toLowerCase().includes(cleanQuery) ||
          (node.organization.owner_name || '').toLowerCase().includes(cleanQuery) ||
          (node.organization.owner_email || '').toLowerCase().includes(cleanQuery) ||
          (node.organization.owner_phone || '').toLowerCase().includes(cleanQuery);

        if (orgMatch) {
          return node;
        }

        const matchingBranches = node.branches.filter((b) => {
          const matchBranch =
            (b.restaurant.name || '').toLowerCase().includes(cleanQuery) ||
            (b.restaurant.brand_name || '').toLowerCase().includes(cleanQuery) ||
            (b.restaurant.branch_name || '').toLowerCase().includes(cleanQuery) ||
            (b.restaurant.address || '').toLowerCase().includes(cleanQuery) ||
            (b.restaurant.manager_phone || '').toLowerCase().includes(cleanQuery);

          const matchTag = b.tags.some(
            (t) =>
              (t.tag_code || '').toLowerCase().includes(cleanQuery) ||
              (t.table_identifier || '').toLowerCase().includes(cleanQuery)
          );

          return matchBranch || matchTag;
        });

        if (matchingBranches.length > 0) {
          return {
            ...node,
            branches: matchingBranches,
            totalTagsCount: matchingBranches.reduce((acc, b) => acc + b.tags.length, 0),
          };
        }

        return null;
      })
      .filter((n): n is OrganizationNode => n !== null);
  }

  // Filtrado de locales independientes
  let filteredIndependents = independentBranches;
  if (selectedOrgFilter !== 'all' && selectedOrgFilter !== 'independent') {
    filteredIndependents = [];
  } else if (cleanQuery) {
    filteredIndependents = independentBranches.filter((b) => {
      const matchBranch =
        (b.restaurant.name || '').toLowerCase().includes(cleanQuery) ||
        (b.restaurant.brand_name || '').toLowerCase().includes(cleanQuery) ||
        (b.restaurant.branch_name || '').toLowerCase().includes(cleanQuery) ||
        (b.restaurant.address || '').toLowerCase().includes(cleanQuery) ||
        (b.restaurant.manager_phone || '').toLowerCase().includes(cleanQuery);

      const matchTag = b.tags.some(
        (t) =>
          (t.tag_code || '').toLowerCase().includes(cleanQuery) ||
          (t.table_identifier || '').toLowerCase().includes(cleanQuery)
      );

      return matchBranch || matchTag;
    });
  }

  const emptyOrganizations = orgNodes.filter((o) => o.branches.length === 0).length;

  return {
    organizations: orgNodes,
    independentBranches: filteredIndependents,
    stats: {
      totalOrganizations: orgNodes.length,
      emptyOrganizations,
      totalBranches: orgNodes.reduce((acc, o) => acc + o.branches.length, 0) + filteredIndependents.length,
      totalTags:
        orgNodes.reduce((acc, o) => acc + o.totalTagsCount, 0) +
        filteredIndependents.reduce((acc, b) => acc + b.tags.length, 0),
    },
  };
}
