import {
  VERTICAL_CONFIG,
  type Restaurant,
  type Tag,
  type Organization,
  type OrganizationBrand,
  type BusinessVertical,
  type StaffMember,
  type BusinessType,
  type TierType,
  type Feedback,
} from '../types';

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

export interface KdsStationConfig {
  id: 'all' | 'cocina' | 'barra' | 'postres' | 'turnero';
  name: string;
  description: string;
  url: string;
  isActive: boolean;
}

export type TierFeatureKey =
  | 'tier_1_redirect'
  | 'tier_2_reputation_shield'
  | 'tier_3_digital_menu_wifi'
  | 'tier_4_ad_network_analytics'
  | 'addon_ad_free';

export interface TierFeatureConfig {
  key: TierFeatureKey;
  tierLevel: TierType | 'addon';
  badgeLabel: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface BranchControlCapabilities {
  businessType: BusinessType;
  verticalLabel: string;
  unitLabel: string;
  unitPlural: string;
  supportsKds: boolean;
  supportsFloorStaff: boolean;
}

export interface BranchNode {
  restaurant: Restaurant;
  tags: Tag[];
  staff: StaffMember[];
  capabilities: BranchControlCapabilities;
  kdsStations: KdsStationConfig[];
  tierFeatures: TierFeatureConfig[];
  feedbacksCount: number;
  pendingFeedbacksCount: number;
}

export interface BrandNode {
  brand: OrganizationBrand;
  verticalLabel: string;
  branches: BranchNode[];
  totalTagsCount: number;
}

export interface OrganizationNode {
  organization: Organization;
  brands: BrandNode[];
  branches: BranchNode[];
  totalTagsCount: number;
}

export interface TreeViewData {
  organizations: OrganizationNode[];
  independentBranches: BranchNode[];
  stats: {
    totalOrganizations: number;
    emptyOrganizations: number;
    totalBrands: number;
    totalBranches: number;
    totalTags: number;
  };
}

/**
 * Determina las capacidades operativas que aplican a una sucursal según su giro (VERTICAL_CONFIG o business_verticals)
 */
export function getBranchCapabilities(
  restaurant: Restaurant,
  customVerticals: BusinessVertical[] = []
): BranchControlCapabilities {
  const businessType: BusinessType = restaurant.business_type || 'restaurant';

  const verticalNames: Record<string, string> = {
    restaurant: 'Gastronomía / Restaurante',
    barberia: 'Barbería & Peluquería',
    cafeteria: 'Cafetería & Repostería',
    gym: 'Gimnasio / Fitness',
    dental: 'Clínica Dental',
    spa: 'Spa & Bienestar',
    general: 'Comercio General',
  };

  const matchedCustom = customVerticals.find(
    (v) => v.slug === businessType || v.id === businessType
  );
  if (matchedCustom) {
    return {
      businessType: matchedCustom.slug,
      verticalLabel: matchedCustom.name,
      unitLabel: matchedCustom.unit_label,
      unitPlural: matchedCustom.unit_plural,
      supportsKds: matchedCustom.show_kds,
      supportsFloorStaff: matchedCustom.show_floor_staff,
    };
  }

  const cfg = VERTICAL_CONFIG[businessType] || VERTICAL_CONFIG.restaurant;

  return {
    businessType,
    verticalLabel: verticalNames[businessType] || businessType || 'Gastronomía / Restaurante',
    unitLabel: cfg.unitLabel,
    unitPlural: cfg.unitPlural,
    supportsKds: cfg.showKds,
    supportsFloorStaff: cfg.showFloorStaff,
  };
}

/**
 * Construye la matriz de funcionalidades por Tier (1 a 4 + Add-On Marca Blanca) para el Panel de Control de la sucursal.
 * Por defecto se prenden las funcionalidades cuyo nivel sea <= al Tier contratado de la sucursal,
 * permitiendo además overrides individuales mediante los switches del panel.
 */
export function getTierFeaturesForBranch(
  restaurant: Restaurant,
  overrides: Record<string, boolean> = {}
): TierFeatureConfig[] {
  const currentTier: TierType = restaurant.tier || 2;
  const isBranchActive = restaurant.is_active !== false;

  const definitions: Omit<TierFeatureConfig, 'isActive'>[] = [
    {
      key: 'tier_1_redirect',
      tierLevel: 1,
      badgeLabel: 'Tier 1',
      name: 'Enlace Directo & Bucle Viral en Mesa',
      description: 'Redirección instantánea a Google Reviews con semillero viral de placas ($100 MXN).',
    },
    {
      key: 'tier_2_reputation_shield',
      tierLevel: 2,
      badgeLabel: 'Tier 2',
      name: 'Filtro Inteligente de Reputación (Escudo 1 a 3 Estrellas)',
      description: 'Calificaciones de 4-5 estrellas van a Google; quejas de 1-3 estrellas se retienen en buzón privado.',
    },
    {
      key: 'tier_3_digital_menu_wifi',
      tierLevel: 3,
      badgeLabel: 'Tier 3',
      name: 'Menú Digital Interactivo + Linktree + Wi-Fi 1-Toque',
      description: 'Carta digital con carrito a cocina, botones de redes sociales y conexión Wi-Fi automática.',
    },
    {
      key: 'tier_4_ad_network_analytics',
      tierLevel: 4,
      badgeLabel: 'Tier 4',
      name: 'Bolsa Publicitaria Local ($500 MXN) & Analítica por Mesa',
      description: 'Saldo mensual para pautar cupones cruzados en comercios aliados y mapa de calor por mesa.',
    },
    {
      key: 'addon_ad_free',
      tierLevel: 'addon',
      badgeLabel: 'Add-On',
      name: 'Escudo Marca Blanca (Ad-Free • 0% Anuncios)',
      description: 'Bloquea toda publicidad de terceros en las pantallas de las mesas de esta sucursal.',
    },
  ];

  return definitions.map((def) => {
    if (def.key === 'addon_ad_free') {
      return {
        ...def,
        isActive: overrides[def.key] !== undefined ? overrides[def.key] : Boolean(restaurant.is_ad_free),
      };
    }

    const defaultByTier = isBranchActive && typeof def.tierLevel === 'number' && currentTier >= def.tierLevel;
    return {
      ...def,
      isActive: overrides[def.key] !== undefined ? overrides[def.key] : defaultByTier,
    };
  });
}

/**
 * Construye la configuración de estaciones de pantalla de cocina (KDS) para una sucursal
 */
export function getDefaultKdsStations(
  restaurantId: string,
  overrides: Record<string, boolean> = {}
): KdsStationConfig[] {
  const stations: Omit<KdsStationConfig, 'isActive'>[] = [
    {
      id: 'all',
      name: 'Monitor Maestro KDS (General)',
      description: 'Todas las comandas de mesas en tiempo real con alerta SLA 15 min',
      url: `#/portal/cocina?station=all&branch=${restaurantId}`,
    },
    {
      id: 'cocina',
      name: 'Estación Cocina Caliente',
      description: 'Filtra únicamente entradas y platos fuertes al grill/horno',
      url: `#/portal/cocina?station=cocina&branch=${restaurantId}`,
    },
    {
      id: 'barra',
      name: 'Estación Barra & Coctelería',
      description: 'Filtra bebidas, vinos, cervezas y mixología',
      url: `#/portal/cocina?station=barra&branch=${restaurantId}`,
    },
    {
      id: 'postres',
      name: 'Estación Repostería & Café',
      description: 'Filtra postres, digestivos y cafetería',
      url: `#/portal/cocina?station=postres&branch=${restaurantId}`,
    },
    {
      id: 'turnero',
      name: 'Turnero Público 4K (Food Court)',
      description: 'Pantalla para comensales con estado En Preparación / Listo para Recoger',
      url: `#/turnero-plaza?branch=${restaurantId}`,
    },
  ];

  const defaultActive: Record<string, boolean> = {
    all: true,
    cocina: true,
    barra: true,
    postres: false,
    turnero: false,
  };

  return stations.map((st) => ({
    ...st,
    isActive: overrides[st.id] !== undefined ? overrides[st.id] : defaultActive[st.id],
  }));
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
    tier3: restaurants.filter((r) => (r.tier || 2) >= 3).length,
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
      if (selectedTier === 'tier_4' && (r.tier || 2) !== 4) return false;
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
 * Construye la estructura jerárquica en Árbol:
 * Nivel 1: Organización (Empresa Matriz / Corporativo)
 * Nivel 2: Marca Comercial (organization_brands con giro comercial universal y logo)
 * Nivel 3: Sucursales (Locales Físicos supeditados a la marca con selector de Tier y acceso a quejas)
 * Nivel 4: Panel de Control de Sucursal por Categorías
 */
export function buildOrganizationTree(
  organizations: Organization[],
  restaurants: Restaurant[],
  tags: Tag[],
  searchQuery: string = '',
  selectedOrgFilter: string = 'all',
  selectedTierFilter: string = 'all',
  staffMembers: StaffMember[] = [],
  kdsStateByBranch: Record<string, Record<string, boolean>> = {},
  feedbacks: Feedback[] = [],
  tierFeatureOverridesByBranch: Record<string, Record<string, boolean>> = {},
  organizationBrands: OrganizationBrand[] = [],
  businessVerticals: BusinessVertical[] = []
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

  // Mapa de quejas agrupadas por restaurant_id
  const feedbacksByRestaurant: Record<string, Feedback[]> = {};
  feedbacks.forEach((fb) => {
    if (fb.restaurant_id) {
      if (!feedbacksByRestaurant[fb.restaurant_id]) {
        feedbacksByRestaurant[fb.restaurant_id] = [];
      }
      feedbacksByRestaurant[fb.restaurant_id].push(fb);
    }
  });

  // Mapa de personal operativo agrupado por restaurant_id
  const staffByRestaurant: Record<string, StaffMember[]> = {};
  const genericStaff: StaffMember[] = [];
  staffMembers.forEach((member) => {
    if (member.restaurant_id && member.restaurant_id !== 'res-1') {
      if (!staffByRestaurant[member.restaurant_id]) {
        staffByRestaurant[member.restaurant_id] = [];
      }
      staffByRestaurant[member.restaurant_id].push(member);
    } else {
      genericStaff.push(member);
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
      if (selectedTierFilter === 'tier_4' && (res.tier || 2) !== 4) return;
      if (selectedTierFilter === 'active' && res.is_active === false) return;
      if (selectedTierFilter === 'paused' && res.is_active !== false) return;
    }

    const capabilities = getBranchCapabilities(res, businessVerticals);
    const branchStaff = staffByRestaurant[res.id] || (capabilities.supportsFloorStaff ? genericStaff : []);
    const kdsStations = capabilities.supportsKds
      ? getDefaultKdsStations(res.id, kdsStateByBranch[res.id] || {})
      : [];
    const tierFeatures = getTierFeaturesForBranch(res, tierFeatureOverridesByBranch[res.id] || {});
    const branchFeedbacks = feedbacksByRestaurant[res.id] || [];

    const branchNode: BranchNode = {
      restaurant: res,
      tags: tagsByRestaurant[res.id] || [],
      staff: branchStaff,
      capabilities,
      kdsStations,
      tierFeatures,
      feedbacksCount: branchFeedbacks.length,
      pendingFeedbacksCount: branchFeedbacks.filter((f) => f.status === 'new').length,
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

  const buildBrandsForOrg = (orgId: string, orgBranches: BranchNode[]): BrandNode[] => {
    const explicitBrands = organizationBrands.filter((b) => b.organization_id === orgId);
    const brandMap = new Map<string, BrandNode>();

    const resolveVerticalLabel = (slug: string): string => {
      const custom = businessVerticals.find((v) => v.slug === slug || v.id === slug);
      if (custom) return custom.name;
      const defaultLabels: Record<string, string> = {
        restaurant: 'Gastronomía / Restaurante',
        barberia: 'Barbería & Peluquería',
        cafeteria: 'Cafetería & Repostería',
        gym: 'Gimnasio / Fitness',
        dental: 'Clínica Dental',
        spa: 'Spa & Bienestar',
        general: 'Comercio General',
      };
      return defaultLabels[slug] || slug || 'Gastronomía / Restaurante';
    };

    explicitBrands.forEach((b) => {
      brandMap.set(b.id, {
        brand: b,
        verticalLabel: resolveVerticalLabel(b.vertical_slug),
        branches: [],
        totalTagsCount: 0,
      });
    });

    orgBranches.forEach((bNode) => {
      const res = bNode.restaurant;
      let targetBrandNode: BrandNode | undefined;

      if (res.brand_id && brandMap.has(res.brand_id)) {
        targetBrandNode = brandMap.get(res.brand_id);
      } else {
        // Buscar por coincidencia de nombre de marca en la organización
        const matchByName = Array.from(brandMap.values()).find(
          (bn) => bn.brand.name.trim().toLowerCase() === (res.brand_name || '').trim().toLowerCase()
        );
        if (matchByName) {
          targetBrandNode = matchByName;
        } else {
          // Sintetizar nodo de marca automático para sucursales previas sin registro explícito
          const syntheticId = res.brand_id || `synth-brand-${orgId}-${(res.brand_name || 'marca').toLowerCase()}`;
          const vSlug = res.business_type || 'restaurant';
          targetBrandNode = {
            brand: {
              id: syntheticId,
              organization_id: orgId,
              name: res.brand_name || res.name,
              vertical_slug: vSlug,
              logo_url: res.logo_url || null,
              brand_color: res.brand_color || '#2563eb',
              created_at: res.created_at,
            },
            verticalLabel: bNode.capabilities.verticalLabel,
            branches: [],
            totalTagsCount: 0,
          };
          brandMap.set(syntheticId, targetBrandNode);
        }
      }

      if (targetBrandNode) {
        targetBrandNode.branches.push(bNode);
        targetBrandNode.totalTagsCount += bNode.tags.length;
      }
    });

    return Array.from(brandMap.values());
  };

  // Construir nodos de organización (incluye organizaciones con 0 sucursales y sus marcas)
  let orgNodes: OrganizationNode[] = organizations.map((org) => {
    const branches = branchesByOrg[org.id] || [];
    const brands = buildBrandsForOrg(org.id, branches);
    const totalTagsCount = branches.reduce((acc, b) => acc + b.tags.length, 0);
    return {
      organization: org,
      brands,
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

          const matchStaff = b.staff.some((s) =>
            (s.name || '').toLowerCase().includes(cleanQuery)
          );

          return matchBranch || matchTag || matchStaff;
        });

        const matchingBrandsWithoutBranches = node.brands.filter(
          (bn) =>
            bn.branches.length === 0 &&
            ((bn.brand.name || '').toLowerCase().includes(cleanQuery) ||
              (bn.verticalLabel || '').toLowerCase().includes(cleanQuery))
        );

        if (matchingBranches.length > 0 || matchingBrandsWithoutBranches.length > 0) {
          const rebuiltBrands = buildBrandsForOrg(node.organization.id, matchingBranches).filter(
            (bn) =>
              bn.branches.length > 0 ||
              (bn.brand.name || '').toLowerCase().includes(cleanQuery) ||
              (bn.verticalLabel || '').toLowerCase().includes(cleanQuery)
          );
          return {
            ...node,
            brands: rebuiltBrands,
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
      totalBrands: orgNodes.reduce((acc, o) => acc + o.brands.length, 0),
      totalBranches: orgNodes.reduce((acc, o) => acc + o.branches.length, 0) + filteredIndependents.length,
      totalTags:
        orgNodes.reduce((acc, o) => acc + o.totalTagsCount, 0) +
        filteredIndependents.reduce((acc, b) => acc + b.tags.length, 0),
    },
  };
}
