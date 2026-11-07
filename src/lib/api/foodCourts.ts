import { supabase, isSupabaseConfigured } from '../supabase';
import type {
  FoodCourt,
  FoodCourtBranchLink,
  FoodCourtTurneroConfig,
  FoodCourtAggregatedMetrics,
  FoodCourtTenantMetric,
  Restaurant,
  TableOrder,
} from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem } from './core';
import { ordersApi } from './orders';
import { restaurantsApi } from './restaurants';
import { organizationsApi } from './organizations';

const FC_STORAGE_KEYS = {
  FOOD_COURTS: 'nfc_demo_food_courts',
  FOOD_COURT_BRANCHES: 'nfc_demo_food_court_branches',
};

const DEFAULT_FOOD_COURTS: FoodCourt[] = [
  {
    id: 'fc-galerias-1',
    name: 'Food Court Galerías Reforma',
    slug: 'galerias-reforma',
    mall_name: 'Centro Comercial Galerías Reforma',
    logo_url: null,
    admin_email: 'admin@galeriasreforma.com',
    turnero_config: {
      enableVoiceTts: true,
      enableBuzzerChime: true,
      autoHideReadyMinutes: 3,
      adRotationSeconds: 20,
      primaryColor: '#10b981',
      splitRatio: '70_30',
    },
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_FC_BRANCHES: FoodCourtBranchLink[] = [
  {
    id: 'fcb-1',
    food_court_id: 'fc-galerias-1',
    restaurant_id: 'res-1',
    commercial_space_number: 'Local FC-01',
    pickup_counter_label: 'Barra 1',
    tenant_brand_name: 'La Parrilla de Don Carlos',
    status: 'active',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'fcb-2',
    food_court_id: 'fc-galerias-1',
    restaurant_id: 'res-2',
    commercial_space_number: 'Local FC-02',
    pickup_counter_label: 'Barra 2',
    tenant_brand_name: 'Sushi Koi Express',
    status: 'active',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'fcb-3',
    food_court_id: 'fc-galerias-1',
    restaurant_id: 'res-3',
    commercial_space_number: 'Local FC-03',
    pickup_counter_label: 'Barra 3',
    tenant_brand_name: 'Trattoria Bella Italia',
    status: 'active',
    joined_at: new Date().toISOString(),
  },
];

export const foodCourtsApi = {
  async getFoodCourts(): Promise<FoodCourt[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_courts')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as FoodCourt[];
        }
      } catch (e) {
        console.warn('Fallback local para getFoodCourts:', e);
      }
    }
    return getLocalItem<FoodCourt[]>(FC_STORAGE_KEYS.FOOD_COURTS, DEFAULT_FOOD_COURTS);
  },

  async getFoodCourtDetails(idOrSlug?: string): Promise<FoodCourt | null> {
    const all = await foodCourtsApi.getFoodCourts();
    if (!idOrSlug) return all[0] || null;
    const normalized = idOrSlug.trim().toLowerCase();
    return (
      all.find(
        (fc) =>
          fc.id.toLowerCase() === normalized ||
          fc.slug.toLowerCase() === normalized
      ) || all[0] || null
    );
  },

  async getFoodCourtBranches(foodCourtId: string): Promise<FoodCourtBranchLink[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_court_branches')
          .select('*')
          .eq('food_court_id', foodCourtId)
          .order('commercial_space_number', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as FoodCourtBranchLink[];
        }
      } catch (e) {
        console.warn('Fallback local para getFoodCourtBranches:', e);
      }
    }
    const allLinks = getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );
    return allLinks.filter((b) => b.food_court_id === foodCourtId);
  },

  /**
   * Vincula una sucursal existente (incluso de otra organización independiente) al Food Court
   */
  async linkBranchToFoodCourt(
    foodCourtId: string,
    restaurantId: string,
    spaceNumber: string,
    pickupCounter: string = 'Barra 1'
  ): Promise<{ success: boolean; data?: FoodCourtBranchLink; error?: string }> {
    if (!foodCourtId || !restaurantId || !spaceNumber.trim()) {
      return { success: false, error: 'Datos incompletos para vincular local al Food Court.' };
    }

    const allLinks = getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );

    const existing = allLinks.find(
      (l) => l.food_court_id === foodCourtId && l.restaurant_id === restaurantId
    );
    if (existing) {
      return { success: false, error: 'Esta sucursal ya se encuentra vinculada al Food Court.' };
    }

    const storedRests = getLocalItem<Restaurant[]>(
      STORAGE_KEYS.RESTAURANTS,
      INITIAL_DEMO_DATA.restaurants
    );
    const targetRest = storedRests.find((r) => r.id === restaurantId);

    const newLink: FoodCourtBranchLink = {
      id: `fcb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      food_court_id: foodCourtId,
      restaurant_id: restaurantId,
      commercial_space_number: spaceNumber.trim(),
      pickup_counter_label: pickupCounter.trim() || 'Barra 1',
      tenant_brand_name: targetRest ? targetRest.brand_name || targetRest.name : 'Locatario Vinculado',
      status: 'active',
      joined_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_court_branches')
          .insert([
            {
              food_court_id: foodCourtId,
              restaurant_id: restaurantId,
              commercial_space_number: newLink.commercial_space_number,
              pickup_counter_label: newLink.pickup_counter_label,
              tenant_brand_name: newLink.tenant_brand_name,
              status: 'active',
            },
          ])
          .select()
          .single();
        if (!error && data) {
          setLocalItem(FC_STORAGE_KEYS.FOOD_COURT_BRANCHES, [...allLinks, data as FoodCourtBranchLink]);
          return { success: true, data: data as FoodCourtBranchLink };
        }
      } catch (e) {
        console.warn('Guardando vinculación Food Court localmente:', e);
      }
    }

    const updated = [...allLinks, newLink];
    setLocalItem(FC_STORAGE_KEYS.FOOD_COURT_BRANCHES, updated);
    return { success: true, data: newLink };
  },

  /**
   * Pre-registra un nuevo locatario en el Food Court y genera un enlace de activación
   */
  async preRegisterFoodCourtTenant(
    foodCourtId: string,
    payload: {
      brandName: string;
      spaceNumber: string;
      pickupCounter?: string;
      contactEmail?: string;
      contactPhone?: string;
    }
  ): Promise<{
    success: boolean;
    data?: FoodCourtBranchLink;
    activationUrl?: string;
    error?: string;
  }> {
    if (!foodCourtId || !payload.brandName.trim() || !payload.spaceNumber.trim()) {
      return { success: false, error: 'El nombre de marca y el número de local son obligatorios.' };
    }

    const token = `fc-inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const newLink: FoodCourtBranchLink = {
      id: `fcb-pre-${Date.now()}`,
      food_court_id: foodCourtId,
      restaurant_id: null,
      commercial_space_number: payload.spaceNumber.trim(),
      pickup_counter_label: (payload.pickupCounter || 'Barra Principal').trim(),
      tenant_brand_name: payload.brandName.trim(),
      tenant_contact_email: payload.contactEmail?.trim() || null,
      tenant_contact_phone: payload.contactPhone?.trim() || null,
      invitation_token: token,
      status: 'pending_activation',
      joined_at: new Date().toISOString(),
    };

    const allLinks = getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );
    setLocalItem(FC_STORAGE_KEYS.FOOD_COURT_BRANCHES, [...allLinks, newLink]);

    const activationUrl = `${window.location.origin}${window.location.pathname}#/login?type=portal&fc_invite=${token}&space=${encodeURIComponent(newLink.commercial_space_number)}`;

    return {
      success: true,
      data: newLink,
      activationUrl,
    };
  },

  async removeBranchFromFoodCourt(linkId: string): Promise<{ success: boolean }> {
    const allLinks = getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );
    const filtered = allLinks.filter((l) => l.id !== linkId);
    setLocalItem(FC_STORAGE_KEYS.FOOD_COURT_BRANCHES, filtered);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('food_court_branches').delete().eq('id', linkId);
      } catch (e) {
        console.warn('Error al eliminar vínculo en Supabase:', e);
      }
    }
    return { success: true };
  },

  async updateFoodCourtConfig(
    foodCourtId: string,
    configUpdates: Partial<FoodCourtTurneroConfig>,
    generalUpdates?: Partial<Pick<FoodCourt, 'name' | 'mall_name' | 'logo_url'>>
  ): Promise<{ success: boolean; data?: FoodCourt }> {
    const all = getLocalItem<FoodCourt[]>(FC_STORAGE_KEYS.FOOD_COURTS, DEFAULT_FOOD_COURTS);
    let updatedItem: FoodCourt | undefined;

    const updatedList = all.map((fc) => {
      if (fc.id === foodCourtId) {
        updatedItem = {
          ...fc,
          ...(generalUpdates || {}),
          turnero_config: {
            ...fc.turnero_config,
            ...configUpdates,
          },
          updated_at: new Date().toISOString(),
        };
        return updatedItem;
      }
      return fc;
    });

    setLocalItem(FC_STORAGE_KEYS.FOOD_COURTS, updatedList);

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase
          .from('food_courts')
          .update({
            name: updatedItem.name,
            mall_name: updatedItem.mall_name,
            logo_url: updatedItem.logo_url,
            turnero_config: updatedItem.turnero_config,
            updated_at: updatedItem.updated_at,
          })
          .eq('id', foodCourtId);
      } catch (e) {
        console.warn('Actualización local de configuración de Food Court:', e);
      }
    }

    return { success: true, data: updatedItem };
  },

  /**
   * Obtiene todas las comandas en vivo de los locales federados para el Turnero Maestro 4K
   */
  async getFoodCourtLiveOrders(
    foodCourtId: string
  ): Promise<
    Array<
      TableOrder & {
        space_number: string;
        pickup_counter: string;
        brand_name: string;
      }
    >
  > {
    const links = await foodCourtsApi.getFoodCourtBranches(foodCourtId);
    const activeLinks = links.filter((l) => l.status === 'active' && l.restaurant_id);
    const remoteOrders = await ordersApi.getTableOrders();
    const localOrders = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLE_ORDERS, []);
    const seenIds = new Set<string>();
    const allOrders: TableOrder[] = [];
    for (const o of [...localOrders, ...remoteOrders]) {
      if (o && o.id && !seenIds.has(o.id)) {
        seenIds.add(o.id);
        allOrders.push(o);
      }
    }
    const storedRests = getLocalItem<Restaurant[]>(
      STORAGE_KEYS.RESTAURANTS,
      INITIAL_DEMO_DATA.restaurants
    );

    const federatedOrders: Array<
      TableOrder & {
        space_number: string;
        pickup_counter: string;
        brand_name: string;
      }
    > = [];

    for (const order of allOrders) {
      if (order.status === 'cancelled') continue;
      const link = activeLinks.find((l) => l.restaurant_id === order.restaurant_id);
      if (link) {
        const rest = storedRests.find((r) => r.id === order.restaurant_id);
        federatedOrders.push({
          ...order,
          space_number: link.commercial_space_number,
          pickup_counter: link.pickup_counter_label,
          brand_name:
            link.tenant_brand_name ||
            rest?.brand_name ||
            rest?.name ||
            'Locatario Food Court',
        });
      }
    }

    return federatedOrders;
  },

  /**
   * Calcula las métricas del comedor y la estimación superficial de ingresos (ticket medio y venta bruta)
   * para auditoría de renta variable, ocultando estrictamente costos, recetas, nóminas y quejas internas.
   */
  async getFoodCourtMetrics(foodCourtId: string): Promise<FoodCourtAggregatedMetrics> {
    const links = await foodCourtsApi.getFoodCourtBranches(foodCourtId);
    const remoteOrders = await ordersApi.getTableOrders();
    const localOrders = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLE_ORDERS, []);
    const seenIds = new Set<string>();
    const allOrders: TableOrder[] = [];
    for (const o of [...localOrders, ...remoteOrders]) {
      if (o && o.id && !seenIds.has(o.id)) {
        seenIds.add(o.id);
        allOrders.push(o);
      }
    }
    const storedRests = getLocalItem<Restaurant[]>(
      STORAGE_KEYS.RESTAURANTS,
      INITIAL_DEMO_DATA.restaurants
    );

    const tenantMetrics: FoodCourtTenantMetric[] = links.map((link) => {
      const rest = storedRests.find((r) => r.id === link.restaurant_id);
      const branchOrders = allOrders.filter(
        (o) =>
          o.restaurant_id &&
          o.restaurant_id === link.restaurant_id &&
          o.status !== 'cancelled'
      );

      // Si no hay órdenes en demo para algún local federado, usar base realista o las órdenes reales
      const ordersCount = branchOrders.length;
      const grossSales = branchOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const avgTicket = ordersCount > 0 ? Math.round((grossSales / ordersCount) * 100) / 100 : 0;

      return {
        branch_link_id: link.id,
        restaurant_id: link.restaurant_id,
        commercial_space_number: link.commercial_space_number,
        pickup_counter_label: link.pickup_counter_label,
        brand_name:
          link.tenant_brand_name ||
          rest?.brand_name ||
          rest?.name ||
          'Local En Proceso',
        organization_id: rest?.organization_id || null,
        status: link.status,
        orders_count: ordersCount,
        avg_prep_minutes: ordersCount > 0 ? 12 : 0,
        average_ticket: avgTicket,
        gross_revenue_estimated: Math.round(grossSales * 100) / 100,
      };
    });

    const totalOrders = tenantMetrics.reduce((acc, t) => acc + t.orders_count, 0);
    const totalGross = tenantMetrics.reduce((acc, t) => acc + t.gross_revenue_estimated, 0);
    const globalAvgTicket =
      totalOrders > 0 ? Math.round((totalGross / totalOrders) * 100) / 100 : 0;
    const activeTenantsCount = tenantMetrics.filter((t) => t.status === 'active').length;

    return {
      food_court_id: foodCourtId,
      total_orders_count: totalOrders,
      avg_wait_minutes: activeTenantsCount > 0 ? 11 : 0,
      global_average_ticket: globalAvgTicket,
      total_gross_revenue_estimated: Math.round(totalGross * 100) / 100,
      active_tenants_count: activeTenantsCount,
      peak_hours_distribution: [
        { hour: '12:00', orders: Math.max(4, Math.round(totalOrders * 0.1)) },
        { hour: '13:00', orders: Math.max(8, Math.round(totalOrders * 0.18)) },
        { hour: '14:00', orders: Math.max(15, Math.round(totalOrders * 0.28)) },
        { hour: '15:00', orders: Math.max(12, Math.round(totalOrders * 0.22)) },
        { hour: '16:00', orders: Math.max(6, Math.round(totalOrders * 0.12)) },
        { hour: '19:00', orders: Math.max(5, Math.round(totalOrders * 0.1)) },
      ],
      tenants: tenantMetrics,
    };
  },

  /**
   * Obtiene todos los vínculos de sucursales federadas de todas las plazas comerciales
   */
  async getAllFoodCourtBranchLinks(): Promise<FoodCourtBranchLink[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_court_branches')
          .select('*')
          .order('commercial_space_number', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as FoodCourtBranchLink[];
        }
      } catch (e) {
        console.warn('Fallback local para getAllFoodCourtBranchLinks:', e);
      }
    }
    return getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );
  },

  /**
   * Sincroniza o crea automáticamente un registro FoodCourt a partir de una unidad Nivel 3 de giro food_court
   */
  async ensureFoodCourtForBranch(restaurant: Restaurant): Promise<FoodCourt> {
    const all = await foodCourtsApi.getFoodCourts();
    const matched = all.find(
      (fc) =>
        fc.slug.toLowerCase() === (restaurant.slug || '').toLowerCase() ||
        fc.id === restaurant.id ||
        fc.id === `fc-${restaurant.id}` ||
        fc.name.toLowerCase() === (restaurant.branch_name || restaurant.name).toLowerCase()
    );
    if (matched) {
      return matched;
    }

    const newFcPayload = {
      name: restaurant.branch_name || restaurant.name,
      slug: restaurant.slug || `plaza-${Date.now()}`,
      mall_name: restaurant.brand_name || restaurant.name,
      logo_url: restaurant.logo_url || null,
      admin_email: null,
      turnero_config: {
        enableVoiceTts: true,
        enableBuzzerChime: true,
        autoHideReadyMinutes: 3,
        adRotationSeconds: 20,
        primaryColor: restaurant.brand_color || '#2563eb',
        splitRatio: '70_30' as const,
      },
      is_active: restaurant.is_active !== false,
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_courts')
          .insert([newFcPayload])
          .select()
          .single();
        if (!error && data) {
          const remoteFc = data as FoodCourt;
          setLocalItem(FC_STORAGE_KEYS.FOOD_COURTS, [...all, remoteFc]);
          return remoteFc;
        }
      } catch (e) {
        console.warn('Fallback local para ensureFoodCourtForBranch:', e);
      }
    }

    const newFc: FoodCourt = {
      id: `fc-${restaurant.id}`,
      ...newFcPayload,
      created_at: new Date().toISOString(),
    };

    const updated = [...all, newFc];
    setLocalItem(FC_STORAGE_KEYS.FOOD_COURTS, updated);
    return newFc;
  },

  /**
   * Crea una nueva sucursal gastronómica (y su organización/marca si aplica) y la federa en el Food Court en un solo paso
   */
  async createAndFederateTenantBranch(
    foodCourtId: string,
    payload: {
      organizationId?: string | null;
      newOrganizationName?: string;
      ownerName?: string;
      ownerEmail?: string;
      brandName: string;
      branchName: string;
      businessType?: string;
      spaceNumber: string;
      pickupCounter?: string;
      googleReviewUrl?: string;
    }
  ): Promise<{
    success: boolean;
    restaurant?: Restaurant;
    link?: FoodCourtBranchLink;
    error?: string;
  }> {
    if (!foodCourtId || !payload.brandName.trim() || !payload.branchName.trim() || !payload.spaceNumber.trim()) {
      return {
        success: false,
        error: 'Marca comercial, nombre de sucursal y número de local son obligatorios.',
      };
    }

    let targetOrgId = payload.organizationId || null;

    if (!targetOrgId && payload.newOrganizationName?.trim()) {
      const orgRes = await organizationsApi.createOrganization({
        name: payload.newOrganizationName.trim(),
        owner_name: payload.ownerName?.trim() || 'Titular Locatario',
        notify_negative_feedback: true,
      });
      if (orgRes.success && orgRes.data) {
        targetOrgId = orgRes.data.id;
      }
    }

    let targetBrandId: string | null = null;
    if (targetOrgId) {
      const brandRes = await organizationsApi.createOrganizationBrand({
        organization_id: targetOrgId,
        name: payload.brandName.trim(),
        vertical_slug: 'restaurant',
        brand_color: '#ea580c',
      });
      if (brandRes.success && brandRes.data) {
        targetBrandId = brandRes.data.id;
      }
    }

    const fullName = `${payload.brandName.trim()} - ${payload.branchName.trim()}`;
    const generatedSlug =
      fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const restRes = await restaurantsApi.saveRestaurant({
      organization_id: targetOrgId,
      brand_id: targetBrandId,
      brand_name: payload.brandName.trim(),
      branch_name: payload.branchName.trim(),
      business_type: 'restaurant',
      name: fullName,
      slug: generatedSlug,
      google_review_url:
        payload.googleReviewUrl?.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullName)}`,
      tier: 3,
      is_ad_free: false,
      brand_color: '#ea580c',
      links: [],
      is_active: true,
    });

    if (!restRes.success || !restRes.data) {
      return {
        success: false,
        error: restRes.error || 'No se pudo dar de alta la sucursal del locatario.',
      };
    }

    const linkRes = await foodCourtsApi.linkBranchToFoodCourt(
      foodCourtId,
      restRes.data.id,
      payload.spaceNumber.trim(),
      (payload.pickupCounter || 'Barra 1').trim()
    );

    if (!linkRes.success) {
      return {
        success: false,
        restaurant: restRes.data,
        error: linkRes.error || 'Se creó la sucursal pero no se pudo vincular al Food Court.',
      };
    }

    return {
      success: true,
      restaurant: restRes.data,
      link: linkRes.data,
    };
  },

  /**
   * Actualiza el número de local comercial o barra de entrega de una sucursal federada
   */
  async updateFoodCourtBranchLink(
    linkId: string,
    updates: Partial<Pick<FoodCourtBranchLink, 'commercial_space_number' | 'pickup_counter_label' | 'status'>>
  ): Promise<{ success: boolean; data?: FoodCourtBranchLink }> {
    const allLinks = getLocalItem<FoodCourtBranchLink[]>(
      FC_STORAGE_KEYS.FOOD_COURT_BRANCHES,
      DEFAULT_FC_BRANCHES
    );
    let updatedItem: FoodCourtBranchLink | undefined;
    const updatedList = allLinks.map((l) => {
      if (l.id === linkId) {
        updatedItem = {
          ...l,
          ...updates,
        };
        return updatedItem;
      }
      return l;
    });
    setLocalItem(FC_STORAGE_KEYS.FOOD_COURT_BRANCHES, updatedList);

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase
          .from('food_court_branches')
          .update(updates)
          .eq('id', linkId);
      } catch (e) {
        console.warn('Actualización local de vínculo Food Court:', e);
      }
    }

    return { success: true, data: updatedItem };
  },
};
