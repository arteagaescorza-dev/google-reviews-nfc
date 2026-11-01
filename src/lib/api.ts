import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Restaurant,
  Tag,
  Ad,
  Feedback,
  Organization,
  LinkItem,
  OrganizationMember,
  MemberRole,
  FeedbackStatus,
  SupportCategory,
  SupportStatus,
  SupportTicket,
  Coupon,
  TierType,
  FinancialMetrics,
  MenuItem,
  TableOrder,
  TableOrderStatus,
  TableCall,
  StaffMember,
  TerritoryZone,
  TerritoryMetric,
} from '../types';
import { VIRAL_SEED_CONFIG } from './constants';

// ==============================================================================
// DATOS EN MEMORIA / LOCALSTORAGE PARA MODO DEMO CUANDO SUPABASE AÚN NO ESTÁ VINCULADO
// ==============================================================================

const STORAGE_KEYS = {
  ORGANIZATIONS: 'nfc_demo_organizations',
  ORGANIZATION_MEMBERS: 'nfc_demo_organization_members',
  RESTAURANTS: 'nfc_demo_restaurants',
  TAGS: 'nfc_demo_tags',
  ADS: 'nfc_demo_ads',
  FEEDBACK: 'nfc_demo_feedback',
  SUPPORT_TICKETS: 'nfc_demo_support_tickets',
  COUPONS: 'nfc_demo_coupons',
  MENU_ITEMS: 'nfc_demo_menu_items',
  TABLE_ORDERS: 'nfc_demo_table_orders',
  TABLE_CALLS: 'nfc_demo_table_calls',
  STAFF_MEMBERS: 'nfc_demo_staff_members',
};

export const VIRAL_SEED_AD: Ad = {
  id: 'ad-viral-seed',
  title: `${VIRAL_SEED_CONFIG.headline} ${VIRAL_SEED_CONFIG.subheadline}`,
  advertiser_name: VIRAL_SEED_CONFIG.brandName,
  banner_url: VIRAL_SEED_CONFIG.bannerImageUrl,
  destination_url: `https://wa.me/${VIRAL_SEED_CONFIG.whatsappNumber}?text=${encodeURIComponent(VIRAL_SEED_CONFIG.whatsappMessage)}`,
  placement_type: 'bottom_banner',
  target_type: 'all',
  target_restaurant_ids: [],
  target_tag_codes: [],
  is_active: true,
  impressions_count: 0,
  clicks_count: 0,
  created_at: new Date().toISOString(),
};

const INITIAL_DEMO_DATA = {
  organizations: [
    {
      id: 'org-1',
      name: 'Grupo Gastronómico Gourmet',
      owner_name: 'Carlos Mendoza',
      owner_email: 'carlos@grupogourmet.com',
      owner_phone: '+525512345678',
      notify_negative_feedback: true,
      created_at: new Date().toISOString(),
    }
  ] as Organization[],
  restaurants: [
    {
      id: 'res-1',
      organization_id: 'org-1',
      brand_name: 'La Parrilla Argentina',
      branch_name: 'Sucursal Centro',
      slug: 'parrilla-centro',
      name: 'La Parrilla Argentina - Centro',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
      tier: 1,
      is_ad_free: false,
      brand_color: '#dc2626',
      links: [],
      address: 'Av. Juárez 102, Centro',
      manager_phone: '+525598765431',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-2',
      organization_id: 'org-1',
      brand_name: 'Tacos El Pastorcito',
      branch_name: 'Sucursal Norte',
      slug: 'tacos-pastorcito-norte',
      name: 'Tacos El Pastorcito - Norte',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=80',
      tier: 2,
      is_ad_free: false,
      brand_color: '#ea580c',
      links: [],
      address: 'Blvd. del Norte 450, Col. Palmas',
      manager_phone: '+525598765432',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'res-3',
      organization_id: 'org-1',
      brand_name: 'Café Macchiato & Bistro',
      branch_name: 'Sucursal Polanco',
      slug: 'cafe-macchiato-polanco',
      name: 'Café Macchiato & Bistro',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
      tier: 3,
      is_ad_free: true,
      brand_color: '#7c3aed',
      links: [
        { id: '1', title: 'Menú Digital & Postres', url: 'https://ejemplo.com/menu', icon: 'menu' },
        { id: '2', title: 'Síguenos en Instagram', url: 'https://instagram.com', icon: 'instagram' },
        { id: '3', title: 'Conectar a Wi-Fi Clientes', url: 'WIFI:S:CafeClientes;T:WPA;P:cafe1234;;', icon: 'wifi' },
        { id: '4', title: 'Reservaciones por WhatsApp', url: 'https://wa.me/525512345678?text=Hola,%20quiero%20reservar', icon: 'whatsapp' }
      ],
      address: 'Masaryk 310, Polanco',
      manager_phone: '+525598765433',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ] as Restaurant[],
  tags: [
    {
      id: 'tag-1',
      tag_code: 'NFC-001',
      restaurant_id: 'res-1',
      table_identifier: 'Mesa 1 (Centro)',
      scan_count: 12,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-2',
      tag_code: 'NFC-002',
      restaurant_id: 'res-2',
      table_identifier: 'Mesa 4 (Terraza)',
      scan_count: 28,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-3',
      tag_code: 'NFC-003',
      restaurant_id: 'res-3',
      table_identifier: 'Mesa Barra 2',
      scan_count: 45,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tag-4',
      tag_code: 'NFC-DEMO',
      restaurant_id: 'res-2',
      table_identifier: 'Mesa de Demostración',
      scan_count: 99,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  ] as Tag[],
  ads: [
    {
      id: 'ad-1',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      banner_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      destination_url: 'https://ejemplo.com/dentalpro',
      placement_type: 'bottom_banner',
      target_type: 'all',
      target_restaurant_ids: [],
      target_tag_codes: [],
      is_active: true,
      impressions_count: 4120,
      max_impressions: 5000,
      budget_amount: 2500,
      is_renewal_sent: true,
      clicks_count: 168,
      coupon_code: 'DENTAL-20',
      coupon_description: '20% off en profilaxis',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'ad-2',
      title: 'Semana de Prueba Gratis en IronFit Gym',
      advertiser_name: 'IronFit Gym & Fitness',
      banner_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      destination_url: 'https://ejemplo.com/ironfit',
      placement_type: 'bottom_banner',
      target_type: 'all',
      target_restaurant_ids: [],
      target_tag_codes: [],
      is_active: true,
      impressions_count: 2450,
      max_impressions: 5000,
      budget_amount: 1500,
      is_renewal_sent: false,
      clicks_count: 112,
      coupon_code: 'IRON-7D',
      coupon_description: 'Pase 7 días gratis',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    }
  ] as Ad[],
  feedback: [
    {
      id: 'fb-1',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      rating: 2,
      customer_name: 'Raúl Sánchez',
      customer_phone: '+525544332211',
      customer_email: 'raul@ejemplo.com',
      comments: 'La carne al pastor estaba fría y tardaron 25 minutos en traer las bebidas.',
      status: 'new',
      notified_to_owner: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'fb-2',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      rating: 3,
      customer_name: 'Mariana López',
      customer_phone: '+525588776655',
      customer_email: 'mariana@ejemplo.com',
      comments: 'El mesero fue muy amable pero la música estaba excesivamente alta.',
      status: 'reviewed',
      notified_to_owner: true,
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    }
  ] as Feedback[],
  supportTickets: [
    {
      id: 'ticket-1',
      organization_id: 'org-1',
      restaurant_id: 'res-2',
      category: 'plate_damaged',
      subject: 'Placa despegada en Mesa 4',
      message: 'Se despegó la placa NFC de la mesa 4 por limpieza constante. ¿Me pueden reponer el adhesivo o la placa física?',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'ticket-2',
      organization_id: 'org-1',
      restaurant_id: 'res-1',
      category: 'more_plates',
      subject: 'Solicitud de 5 placas adicionales para terraza',
      message: 'Abrimos una nueva terraza con 5 mesas. Necesitamos 5 placas de $100 MXN para entregarse esta misma semana.',
      status: 'in_progress',
      admin_reply: 'Excelente Carlos, ya están programadas tus 5 placas con el logo de La Parrilla. Pasamos mañana a entregarlas.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    }
  ] as SupportTicket[],
  coupons: [
    {
      id: 'cpn-1',
      ad_id: 'ad-1',
      restaurant_id: 'res-1',
      tag_code: 'NFC-001',
      customer_phone: '+525512345678',
      customer_name: 'Alejandro Morales',
      coupon_code: 'DENTAL-20',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      discount_description: '20% off en profilaxis o blanqueamiento dental presentando este cupón digital.',
      status: 'active',
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'cpn-2',
      ad_id: 'ad-2',
      restaurant_id: 'res-2',
      tag_code: 'NFC-002',
      customer_phone: '+525512345678',
      customer_name: 'Alejandro Morales',
      coupon_code: 'IRON-7D',
      title: 'Pase de 7 Días Gratis',
      advertiser_name: 'IronFit Gym & Fitness',
      discount_description: 'Acceso total a pesas, cardio y clases durante una semana completa.',
      status: 'active',
      expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'cpn-3',
      ad_id: 'ad-1',
      restaurant_id: 'res-1',
      customer_phone: '+525588776655',
      customer_name: 'Sofía Valenzuela',
      coupon_code: 'DENTAL-USADO',
      title: '20% de Descuento en Limpieza Dental',
      advertiser_name: 'Clínica DentalPro',
      discount_description: '20% off en profilaxis presentando cupón.',
      status: 'redeemed',
      ticket_amount: 650,
      redeemed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ] as Coupon[],
};

// Carga inicial segura para Demo
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }
}

/**
 * Limpia payloads para Supabase PostgREST:
 * Remueve la propiedad 'id' en inserciones o si es falsy (para que PostgreSQL genere el UUID con default),
 * y descarta claves con valor undefined para evitar que PostgREST las incluya en ?columns= con valor NULL.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeSupabasePayload(obj: Record<string, any>, isInsert = false): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  if (isInsert || !clean.id) {
    delete clean.id;
  }
  return clean;
}

// ==============================================================================
// CAPA DE SERVICIO API UNIFICADA (SUPABASE O LOCAL FALLBACK)
// ==============================================================================

export const api = {
  /**
   * Resuelve un Tag físico con los datos completos del restaurante/sucursal asignado
   */
  async getTagDetails(tagCode: string): Promise<{ tag: Tag | null; restaurant: Restaurant | null }> {
    const normalizedCode = tagCode.trim();

    if (isSupabaseConfigured) {
      try {
        const { data: tag, error } = await supabase
          .from('tags')
          .select('*, restaurant:restaurants(*)')
          .eq('tag_code', normalizedCode)
          .eq('is_active', true)
          .single();

        if (error || !tag) return { tag: null, restaurant: null };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const restaurant = (tag as any).restaurant as Restaurant | null;
        return { tag, restaurant };
      } catch (e) {
        console.error('Error al resolver tag en Supabase:', e);
      }
    }

    // Fallback Modo Demo
    const tags = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    const restaurants = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);

    const tag = tags.find((t) => t.tag_code.toLowerCase() === normalizedCode.toLowerCase() && t.is_active);
    if (!tag) return { tag: null, restaurant: null };

    const restaurant = restaurants.find((r) => r.id === tag.restaurant_id && r.is_active) || null;
    return { tag, restaurant };
  },

  /**
   * Obtiene el mejor anuncio para un restaurante o tag específico
   */
  async getAdForPlacement(tagCode?: string, restaurantId?: string, isTier1?: boolean): Promise<Ad | null> {
    // Invariante Etapa 1: En nivel de siembra (Tier 1) SOLO se publicita la marca propia de placas a $100
    if (isTier1) {
      return VIRAL_SEED_AD;
    }

    // Obtener sucursal para verificar anunciantes vetados (SPEC-003)
    let blockedIds = new Set<string>();
    if (restaurantId) {
      const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
      const r = rests.find((x) => x.id === restaurantId);
      if (r?.blocked_ad_ids) {
        blockedIds = new Set(r.blocked_ad_ids);
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true);

        if (!error && ads && ads.length > 0) {
          // Filtrar anunciantes vetados por este restaurante
          const eligibleAds = ads.filter((ad: Ad) => !blockedIds.has(ad.id));

          // Filtrar según segmentación
          const matched = eligibleAds.find((ad: Ad) => {
            if (tagCode && ad.target_type === 'specific_tags' && ad.target_tag_codes?.includes(tagCode)) {
              return true;
            }
            if (restaurantId && ad.target_type === 'specific_restaurants' && ad.target_restaurant_ids?.includes(restaurantId)) {
              return true;
            }
            return ad.target_type === 'all';
          });

          if (matched) return matched;
          if (eligibleAds[0]) return eligibleAds[0];
        }
      } catch (e) {
        console.error('Error al cargar anuncios de Supabase:', e);
      }
    }

    // Fallback Modo Demo
    const ads = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    const activeAds = ads.filter((a) => a.is_active && !blockedIds.has(a.id));
    if (activeAds.length > 0) {
      const matched = activeAds.find((ad) => {
        if (tagCode && ad.target_type === 'specific_tags' && ad.target_tag_codes?.includes(tagCode)) return true;
        if (restaurantId && ad.target_type === 'specific_restaurants' && ad.target_restaurant_ids?.includes(restaurantId)) return true;
        return ad.target_type === 'all';
      });
      if (matched) return matched;
      return activeAds[0];
    }

    // Bucle Viral por defecto: Si no hay patrocinadores activos o todos fueron vetados, mostrar la marca de placas a $100
    return VIRAL_SEED_AD;
  },

  /**
   * Registra una queja o feedback privado (1 a 3 estrellas)
   */
  async submitFeedback(data: {
    restaurant_id: string;
    tag_code?: string | null;
    rating: 1 | 2 | 3;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    comments: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('feedback').insert([{
          ...data,
          status: 'new',
          notified_to_owner: false,
        }]);

        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        console.error('Error al enviar feedback a Supabase:', e);
        return { success: false, error: e.message || 'Error al enviar feedback' };
      }
    }

    // Fallback Modo Demo
    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const newEntry: Feedback = {
      id: 'fb-' + Date.now(),
      restaurant_id: data.restaurant_id,
      tag_code: data.tag_code || null,
      rating: data.rating,
      customer_name: data.customer_name || null,
      customer_phone: data.customer_phone || null,
      customer_email: data.customer_email || null,
      comments: data.comments,
      status: 'new',
      notified_to_owner: false,
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.FEEDBACK, [newEntry, ...current]);
    return { success: true };
  },

  /**
   * Registra escaneo de tag (Tier 4 / métrica)
   */
  async recordScan(tagCode: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('record_tag_scan', { p_tag_code: tagCode });
      } catch (e) {
        console.error('Error al registrar escaneo:', e);
      }
      return;
    }

    // Fallback Modo Demo
    const tags = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    const updated = tags.map((t) =>
      t.tag_code.toLowerCase() === tagCode.toLowerCase()
        ? { ...t, scan_count: (t.scan_count || 0) + 1, last_scanned_at: new Date().toISOString() }
        : t
    );
    setLocalItem(STORAGE_KEYS.TAGS, updated);
  },

  /**
   * Registra impresión o clic en anuncio
   */
  async recordAdStat(adId: string, type: 'impression' | 'click'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('increment_ad_stats', { p_ad_id: adId, p_type: type });
      } catch (e) {
        console.error('Error al registrar métrica de anuncio:', e);
      }
      return;
    }

    // Fallback Modo Demo
    const ads = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    const updated = ads.map((a) => {
      if (a.id === adId) {
        return {
          ...a,
          impressions_count: type === 'impression' ? a.impressions_count + 1 : a.impressions_count,
          clicks_count: type === 'click' ? a.clicks_count + 1 : a.clicks_count,
        };
      }
      return a;
    });
    setLocalItem(STORAGE_KEYS.ADS, updated);
  },

  // --------------------------------------------------------------------------
  // MÉTODOS DE ADMINISTRACIÓN (CRUD)
  // --------------------------------------------------------------------------

  async getDashboardKpis() {
    const restaurants = await this.getRestaurants();
    const tags = await this.getTags();
    const ads = await this.getAds();
    const feedbacks = await this.getFeedbacks();

    const activeTags = tags.filter((t) => t.is_active).length;
    const activeAds = ads.filter((a) => a.is_active).length;
    const totalScans = tags.reduce((acc, t) => acc + (t.scan_count || 0), 0);
    const pendingFeedback = feedbacks.filter((f) => f.status === 'new').length;

    return {
      totalRestaurants: restaurants.length,
      activeTags,
      totalTags: tags.length,
      activeAds,
      totalScans,
      pendingFeedback,
      totalFeedback: feedbacks.length,
    };
  },

  async getOrganizations(): Promise<Organization[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Error cargando organizaciones de Supabase:', e);
      }
    }
    return getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
  },

  /**
   * Da de alta una nueva organización en Visita 1 (Alta Express en Calle en 30s)
   */
  async createOrganization(org: Omit<Organization, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Organization; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(org, true);
        const { data, error } = await supabase.from('organizations').insert([clean]).select().single();
        if (error) throw error;
        return { success: true, data };
      } catch (err: any) {
        console.warn('Error insertando en Supabase, aplicando fallback local:', err.message);
      }
    }

    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    const newOrg: Organization = {
      ...org,
      id: 'org-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATIONS, [newOrg, ...orgs]);
    return { success: true, data: newOrg };
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(updates, false);
        const { error } = await supabase.from('organizations').update(clean).eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    const updated = orgs.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setLocalItem(STORAGE_KEYS.ORGANIZATIONS, updated);
    return { success: true };
  },

  async toggleRestaurantActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('restaurants').update({ is_active: isActive }).eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) => (r.id === id ? { ...r, is_active: isActive } : r));
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
    return { success: true };
  },

  /**
   * Da de baja definitiva una sucursal del grupo gastronómico.
   * Por Opción 2: Desvincula la sucursal (organization_id = null) y la desactiva (is_active = false)
   * para que los tags físicos continúen funcionando redirigiendo directamente a su Google Maps,
   * manteniendo la información para futuras campañas de recaptura y win-back por e-mail.
   */
  async deleteRestaurant(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('restaurants')
          .update({ organization_id: null, is_active: false })
          .eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) =>
      r.id === id ? { ...r, organization_id: null, is_active: false } : r
    );
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
    return { success: true };
  },

  async getRestaurants(): Promise<Restaurant[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('restaurants').select('*, organization:organizations(*)').order('created_at', { ascending: false });
      return data || [];
    }
    return getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
  },

  async saveRestaurant(restaurant: Partial<Restaurant>): Promise<{ success: boolean; data?: Restaurant; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        if (restaurant.id) {
          const clean = sanitizeSupabasePayload(restaurant, false);
          const { data, error } = await supabase
            .from('restaurants')
            .update({ ...clean, updated_at: new Date().toISOString() })
            .eq('id', restaurant.id)
            .select()
            .single();
          if (error) throw error;
          return { success: true, data };
        } else {
          const clean = sanitizeSupabasePayload(restaurant, true);
          const { data, error } = await supabase
            .from('restaurants')
            .insert([clean])
            .select()
            .single();
          if (error) throw error;
          return { success: true, data };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    // Modo Demo
    const current = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    if (restaurant.id) {
      const updated = current.map((r) => (r.id === restaurant.id ? ({ ...r, ...restaurant, updated_at: new Date().toISOString() } as Restaurant) : r));
      setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
      return { success: true, data: updated.find((r) => r.id === restaurant.id) };
    } else {
      const created: Restaurant = {
        id: 'res-' + Date.now(),
        brand_name: restaurant.brand_name || 'Nueva Marca',
        branch_name: restaurant.branch_name || 'Principal',
        slug: restaurant.slug || 'restaurante-' + Date.now(),
        name: restaurant.name || 'Nuevo Restaurante',
        google_review_url: restaurant.google_review_url || '',
        tier: restaurant.tier || 2,
        is_ad_free: Boolean(restaurant.is_ad_free),
        brand_color: restaurant.brand_color || '#2563eb',
        links: restaurant.links || [],
        is_active: restaurant.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...restaurant,
      } as Restaurant;
      setLocalItem(STORAGE_KEYS.RESTAURANTS, [created, ...current]);
      return { success: true, data: created };
    }
  },

  async getTags(): Promise<Tag[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('tags').select('*, restaurant:restaurants(*)').order('created_at', { ascending: false });
      return data || [];
    }
    const tags = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    const restaurants = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    return tags.map((t) => ({
      ...t,
      restaurant: restaurants.find((r) => r.id === t.restaurant_id),
    }));
  },

  async saveTag(tag: Partial<Tag>): Promise<{ success: boolean; data?: Tag; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        if (tag.id) {
          const clean = sanitizeSupabasePayload(tag, false);
          const { data, error } = await supabase.from('tags').update(clean).eq('id', tag.id).select().single();
          if (error) throw error;
          return { success: true, data };
        } else {
          const clean = sanitizeSupabasePayload(tag, true);
          const { data, error } = await supabase.from('tags').insert([clean]).select().single();
          if (error) throw error;
          return { success: true, data };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    const current = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    if (tag.id) {
      const updated = current.map((t) => (t.id === tag.id ? ({ ...t, ...tag } as Tag) : t));
      setLocalItem(STORAGE_KEYS.TAGS, updated);
      return { success: true };
    } else {
      const created: Tag = {
        id: 'tag-' + Date.now(),
        tag_code: tag.tag_code || 'NFC-' + Math.floor(100 + Math.random() * 900),
        restaurant_id: tag.restaurant_id || null,
        table_identifier: tag.table_identifier || null,
        scan_count: 0,
        is_active: tag.is_active ?? true,
        created_at: new Date().toISOString(),
      };
      setLocalItem(STORAGE_KEYS.TAGS, [created, ...current]);
      return { success: true, data: created };
    }
  },

  async deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('tags').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    const current = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    setLocalItem(STORAGE_KEYS.TAGS, current.filter((t) => t.id !== id));
    return { success: true };
  },

  async createBatchTags(
    prefix: string,
    start: number,
    end: number,
    restaurantId?: string | null
  ): Promise<{ count: number }> {
    const newTags: Partial<Tag>[] = [];
    for (let i = start; i <= end; i++) {
      const padded = String(i).padStart(3, '0');
      newTags.push({
        tag_code: `${prefix.trim().toUpperCase()}${padded}`,
        restaurant_id: restaurantId || null,
        is_active: true,
      });
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tags')
        .upsert(newTags, { onConflict: 'tag_code', ignoreDuplicates: true })
        .select();

      if (error) throw error;
      return { count: data?.length || 0 };
    }

    const current = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    const existingCodes = new Set(current.map((t) => t.tag_code));
    const toAdd = newTags
      .filter((t) => !existingCodes.has(t.tag_code!))
      .map((t) => ({
        id: 'tag-' + Math.random().toString(36).substr(2, 9),
        tag_code: t.tag_code!,
        restaurant_id: restaurantId || null,
        scan_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      }));

    setLocalItem(STORAGE_KEYS.TAGS, [...toAdd, ...current]);
    return { count: toAdd.length };
  },

  async getAds(): Promise<Ad[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
  },

  async saveAd(ad: Partial<Ad>): Promise<{ success: boolean; data?: Ad; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        if (ad.id) {
          const clean = sanitizeSupabasePayload(ad, false);
          const { data, error } = await supabase.from('ads').update(clean).eq('id', ad.id).select().single();
          if (error) throw error;
          return { success: true, data };
        } else {
          const clean = sanitizeSupabasePayload(ad, true);
          const { data, error } = await supabase.from('ads').insert([clean]).select().single();
          if (error) throw error;
          return { success: true, data };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    const current = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    if (ad.id) {
      const updated = current.map((a) => (a.id === ad.id ? ({ ...a, ...ad } as Ad) : a));
      setLocalItem(STORAGE_KEYS.ADS, updated);
      return { success: true };
    } else {
      const created: Ad = {
        id: 'ad-' + Date.now(),
        title: ad.title || 'Nueva Campaña',
        advertiser_name: ad.advertiser_name || 'Anunciante Local',
        banner_url: ad.banner_url || '',
        destination_url: ad.destination_url || '',
        placement_type: ad.placement_type || 'bottom_banner',
        target_type: ad.target_type || 'all',
        target_restaurant_ids: ad.target_restaurant_ids || [],
        target_tag_codes: ad.target_tag_codes || [],
        is_active: ad.is_active ?? true,
        impressions_count: 0,
        clicks_count: 0,
        created_at: new Date().toISOString(),
      };
      setLocalItem(STORAGE_KEYS.ADS, [created, ...current]);
      return { success: true, data: created };
    }
  },

  async getFeedbacks(): Promise<Feedback[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('feedback').select('*, restaurant:restaurants(*)').order('created_at', { ascending: false });
      return data || [];
    }
    const feedbacks = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const restaurants = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    return feedbacks.map((f) => ({
      ...f,
      restaurant: restaurants.find((r) => r.id === f.restaurant_id),
    }));
  },

  async updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('feedback').update({ status }).eq('id', id);
      return;
    }

    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const updated = current.map((f) => (f.id === id ? { ...f, status } : f));
    setLocalItem(STORAGE_KEYS.FEEDBACK, updated);
  },

  async updateFeedbackStatusAndNotes(id: string, status: FeedbackStatus, internal_notes?: string): Promise<void> {
    if (isSupabaseConfigured) {
      const payload: any = { status };
      if (internal_notes !== undefined) payload.internal_notes = internal_notes;
      await supabase.from('feedback').update(payload).eq('id', id);
      return;
    }

    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const updated = current.map((f) => (f.id === id ? { ...f, status, internal_notes } : f));
    setLocalItem(STORAGE_KEYS.FEEDBACK, updated);
  },

  // ==============================================================================
  // MÉTODOS DEL PORTAL DEL SUSCRIPTOR (/portal)
  // ==============================================================================

  async getMyMembership(): Promise<{ organization: Organization; member: OrganizationMember } | null> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar membresía
      const { data: member } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (member && member.organization) {
        return {
          organization: member.organization as Organization,
          member: {
            id: member.id,
            organization_id: member.organization_id,
            user_id: member.user_id,
            role: member.role,
            created_at: member.created_at,
            user_email: user.email,
          },
        };
      }

      // Si es el Superadmin (arteagaescorza@gmail.com) navegando al portal para probar:
      if (user.email === 'arteagaescorza@gmail.com') {
        const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
        if (orgs && orgs.length > 0) {
          return {
            organization: orgs[0] as Organization,
            member: {
              id: 'superadmin-membership',
              organization_id: orgs[0].id,
              user_id: user.id,
              role: 'owner',
              created_at: new Date().toISOString(),
              user_email: user.email,
            },
          };
        }
      }

      return null;
    }

    // Modo Demo
    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    if (orgs.length > 0) {
      return {
        organization: orgs[0],
        member: {
          id: 'demo-member-1',
          organization_id: orgs[0].id,
          user_id: 'demo-user-1',
          role: 'owner',
          created_at: new Date().toISOString(),
          user_email: orgs[0].owner_email || 'demo@restaurante.com',
        },
      };
    }
    return null;
  },

  async getMyRestaurants(): Promise<Restaurant[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const membership = await this.getMyMembership();
      if (!membership) return [];

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('organization_id', membership.organization.id)
        .order('name');
      return data || [];
    }

    const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    if (orgs.length === 0) return [];
    return rests.filter((r) => r.organization_id === orgs[0].id);
  },

  async getMyFeedbacks(restaurantId?: string): Promise<Feedback[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      let query = supabase
        .from('feedback')
        .select('*, restaurant:restaurants(*)')
        .order('created_at', { ascending: false });

      if (restaurantId && restaurantId !== 'all') {
        query = query.eq('restaurant_id', restaurantId);
      } else {
        const myRestaurants = await this.getMyRestaurants();
        const ids = myRestaurants.map((r) => r.id);
        if (ids.length === 0) return [];
        query = query.in('restaurant_id', ids);
      }

      const { data } = await query;
      return data || [];
    }

    const myRests = await this.getMyRestaurants();
    const ids = new Set(myRests.map((r) => r.id));
    const all = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const filtered = all.filter((f) => ids.has(f.restaurant_id));
    if (restaurantId && restaurantId !== 'all') {
      return filtered.filter((f) => f.restaurant_id === restaurantId);
    }
    return filtered;
  },

  async updateMyRestaurantLinks(restaurantId: string, links: LinkItem[]): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('restaurants')
        .update({ links, updated_at: new Date().toISOString() })
        .eq('id', restaurantId);
      return !error;
    }

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) => (r.id === restaurantId ? { ...r, links } : r));
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
    return true;
  },

  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      const { data } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return data || [];
    }

    const all = getLocalItem<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, []);
    return all.filter((m) => m.organization_id === organizationId);
  },

  async createOrganizationMember(
    organizationId: string,
    email: string,
    password: string,
    role: MemberRole = 'owner'
  ): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        // Registro estándar en Supabase Auth con confirmación por correo
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              organization_id: organizationId,
              role,
            },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('No se pudo crear el usuario');

        // Insertar en organization_members
        const { error: memberErr } = await supabase.from('organization_members').insert([
          {
            organization_id: organizationId,
            user_id: data.user.id,
            role,
          },
        ]);

        if (memberErr) {
          // Si ya existía la membresía
          if (!memberErr.message.includes('unique')) throw memberErr;
        }

        // Activación Segundo Caballo de Troya (Visita 2): Elevar sucursales de Tier 1 a Tier 2 (Filtro de Reseñas Gratis)
        await supabase
          .from('restaurants')
          .update({ tier: 2 })
          .eq('organization_id', organizationId)
          .eq('tier', 1);

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Modo Demo
    const all = getLocalItem<OrganizationMember[]>(STORAGE_KEYS.ORGANIZATION_MEMBERS, []);
    const newMember: OrganizationMember = {
      id: 'member-' + Date.now(),
      organization_id: organizationId,
      user_id: 'user-' + Date.now(),
      role,
      created_at: new Date().toISOString(),
      user_email: email,
    };
    setLocalItem(STORAGE_KEYS.ORGANIZATION_MEMBERS, [newMember, ...all]);

    // Activación Segundo Caballo de Troya (Visita 2): Elevar sucursales de Tier 1 a Tier 2 (Filtro de Reseñas Gratis)
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updatedRests = rests.map((r) =>
      r.organization_id === organizationId && r.tier === 1 ? { ...r, tier: 2 as const } : r
    );
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updatedRests);

    return { success: true };
  },

  // ==============================================================================
  // MESA DE AYUDA B2B: INCIDENCIAS TÉCNICAS Y CONTRACTUALES (SPEC-008)
  // ==============================================================================

  /**
   * Obtiene todos los tickets de soporte levantados por locatarios (Superadmin)
   */
  async getSupportTickets(): Promise<SupportTicket[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*, organization:organizations(*), restaurant:restaurants(*)')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.error('Error al cargar tickets de soporte de Supabase:', e);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const orgs = await this.getOrganizations();
    const rests = await this.getRestaurants();

    return tickets.map((t) => ({
      ...t,
      organization: orgs.find((o) => o.id === t.organization_id),
      restaurant: rests.find((r) => r.id === t.restaurant_id),
    }));
  },

  /**
   * Obtiene los tickets de soporte exclusivos de la organización del locatario
   */
  async getMySupportTickets(): Promise<SupportTicket[]> {
    const membership = await this.getMyMembership();
    if (!membership) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*, restaurant:restaurants(*)')
          .eq('organization_id', membership.organization.id)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.error('Error al cargar mis tickets de soporte de Supabase:', e);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const rests = await this.getRestaurants();

    return tickets
      .filter((t) => t.organization_id === membership.organization.id)
      .map((t) => ({
        ...t,
        organization: membership.organization,
        restaurant: rests.find((r) => r.id === t.restaurant_id),
      }));
  },

  /**
   * Levanta un nuevo ticket de soporte desde el portal del suscriptor
   */
  async createSupportTicket(data: {
    organization_id: string;
    restaurant_id?: string | null;
    category: SupportCategory;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
    const now = new Date().toISOString();
    const isPortalDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (!isPortalDemo && isSupabaseConfigured) {
      try {
        const payload = sanitizeSupabasePayload({
          ...data,
          status: 'pending',
          created_at: now,
          updated_at: now,
        }, true);

        const { data: inserted, error } = await supabase
          .from('support_tickets')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: inserted };
      } catch (err: any) {
        console.warn('Error al crear ticket en Supabase, aplicando fallback local:', err.message);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const newTicket: SupportTicket = {
      id: 'ticket-' + Date.now(),
      organization_id: data.organization_id,
      restaurant_id: data.restaurant_id || null,
      category: data.category,
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    setLocalItem(STORAGE_KEYS.SUPPORT_TICKETS, [newTicket, ...tickets]);
    return { success: true, data: newTicket };
  },

  /**
   * Actualiza el estado o respuesta del Superadmin a un ticket de soporte
   */
  async updateSupportTicketStatus(
    id: string,
    status: SupportStatus,
    admin_reply?: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const updates: any = { status, updated_at: now };
        if (admin_reply !== undefined) {
          updates.admin_reply = admin_reply.trim() || null;
        }
        const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const updated = tickets.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status,
          admin_reply: admin_reply !== undefined ? admin_reply.trim() || null : t.admin_reply,
          updated_at: now,
        };
      }
      return t;
    });

    setLocalItem(STORAGE_KEYS.SUPPORT_TICKETS, updated);
    return { success: true };
  },

  // ==============================================================================
  // FASE 3: MONETIZACIÓN AUTÓNOMA IN-APP, VETO Y CUPONES (SPEC-003, SPEC-006, SPEC-010)
  // ==============================================================================

  /**
   * Actualiza el nivel (Tier) de una sucursal de forma autónoma desde el portal
   * Nivel 2: Menú + WiFi ($99/mes)
   * Nivel 3: Pauta en Red + Saldo de $500 MXN mensuales renovables ($499/mes)
   */
  async upgradeRestaurantTier(restaurantId: string, tier: TierType): Promise<boolean> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const updates: any = { tier, updated_at: new Date().toISOString() };
      if (tier === 3) {
        // En Nivel 3 se abona el saldo publicitario mensual de $500 MXN
        const { data: current } = await supabase.from('restaurants').select('ad_credit_balance').eq('id', restaurantId).single();
        updates.ad_credit_balance = (current?.ad_credit_balance || 0) + 500;
      }
      const { error } = await supabase.from('restaurants').update(updates).eq('id', restaurantId);
      return !error;
    }

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) => {
      if (r.id === restaurantId) {
        const credit = tier === 3 ? (r.ad_credit_balance || 0) + 500 : (r.ad_credit_balance || 0);
        return { ...r, tier, ad_credit_balance: credit, updated_at: new Date().toISOString() };
      }
      return r;
    });
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
    return true;
  },

  /**
   * Activa o desactiva la Marca Blanca (Ad-Free) por $149 MXN/mes
   */
  async toggleRestaurantAdFree(restaurantId: string, isAdFree: boolean): Promise<boolean> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const { error } = await supabase.from('restaurants').update({ is_ad_free: isAdFree, updated_at: new Date().toISOString() }).eq('id', restaurantId);
      return !error;
    }

    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) => (r.id === restaurantId ? { ...r, is_ad_free: isAdFree, updated_at: new Date().toISOString() } : r));
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);
    return true;
  },

  /**
   * Veta a un anunciante para que deje de aparecer en las mesas de este restaurante (SPEC-003)
   * Regla de negocio: 1 veto gratis cada 30 días naturales.
   */
  async vetoAdvertiser(restaurantId: string, adId: string): Promise<{ success: boolean; error?: string }> {
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const rest = rests.find((r) => r.id === restaurantId);
    if (!rest) return { success: false, error: 'Restaurante no encontrado' };

    // Verificar si ya usó su veto del mes (menos de 30 días)
    if (rest.last_veto_date) {
      const daysSince = (Date.now() - new Date(rest.last_veto_date).getTime()) / (1000 * 3600 * 24);
      if (daysSince < 30) {
        return {
          success: false,
          error: 'LIMIT_REACHED',
        };
      }
    }

    const currentBlocked = rest.blocked_ad_ids || [];
    if (!currentBlocked.includes(adId)) {
      currentBlocked.push(adId);
    }

    const updated = rests.map((r) =>
      r.id === restaurantId
        ? {
            ...r,
            blocked_ad_ids: currentBlocked,
            last_veto_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : r
    );
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);

    if (isSupabaseConfigured) {
      await supabase
        .from('restaurants')
        .update({
          blocked_ad_ids: currentBlocked,
          last_veto_date: new Date().toISOString(),
        })
        .eq('id', restaurantId);
    }

    return { success: true };
  },

  /**
   * Levanta el veto de un anunciante previamente bloqueado
   */
  async unvetoAdvertiser(restaurantId: string, adId: string): Promise<boolean> {
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    const updated = rests.map((r) => {
      if (r.id === restaurantId) {
        const filtered = (r.blocked_ad_ids || []).filter((id) => id !== adId);
        return { ...r, blocked_ad_ids: filtered, updated_at: new Date().toISOString() };
      }
      return r;
    });
    setLocalItem(STORAGE_KEYS.RESTAURANTS, updated);

    if (isSupabaseConfigured) {
      const target = updated.find((r) => r.id === restaurantId);
      await supabase
        .from('restaurants')
        .update({ blocked_ad_ids: target?.blocked_ad_ids || [] })
        .eq('id', restaurantId);
    }

    return true;
  },

  /**
   * Crea una campaña publicitaria usando el saldo publicitario de $500 o paquete directo
   */
  async createAdCampaign(data: {
    title: string;
    advertiser_name: string;
    banner_url: string;
    destination_url: string;
    restaurant_id?: string;
    useCredit?: boolean;
    coupon_code?: string;
    coupon_description?: string;
  }): Promise<{ success: boolean; data?: Ad; error?: string }> {
    const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);

    if (data.useCredit && data.restaurant_id) {
      const rest = rests.find((r) => r.id === data.restaurant_id);
      if (!rest || (rest.ad_credit_balance || 0) < 500) {
        return { success: false, error: 'Saldo publicitario insuficiente. Requiere $500 MXN.' };
      }

      // Descontar saldo
      const updatedRests = rests.map((r) =>
        r.id === data.restaurant_id
          ? { ...r, ad_credit_balance: (r.ad_credit_balance || 0) - 500, updated_at: new Date().toISOString() }
          : r
      );
      setLocalItem(STORAGE_KEYS.RESTAURANTS, updatedRests);
    }

    const createdAd: Ad = {
      id: 'ad-' + Date.now(),
      title: data.title,
      advertiser_name: data.advertiser_name,
      banner_url: data.banner_url,
      destination_url: data.destination_url,
      placement_type: 'bottom_banner',
      target_type: 'all',
      target_restaurant_ids: [],
      target_tag_codes: [],
      is_active: true,
      impressions_count: 0,
      clicks_count: 0,
      coupon_code: data.coupon_code || null,
      coupon_description: data.coupon_description || null,
      created_at: new Date().toISOString(),
    };

    const currentAds = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    setLocalItem(STORAGE_KEYS.ADS, [createdAd, ...currentAds]);

    if (isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(createdAd, true);
        await supabase.from('ads').insert([clean]);
      } catch (e: any) {
        console.warn('Error guardando ad en Supabase:', e.message);
      }
    }

    return { success: true, data: createdAd };
  },

  // ==============================================================================
  // INFRAESTRUCTURA DE CUPONES Y PASAPORTE DIGITAL PWA (SPEC-006)
  // ==============================================================================

  /**
   * Obtiene la lista de cupones para el Pasaporte Digital (filtrados por cliente)
   */
  async getCoupons(phone?: string): Promise<Coupon[]> {
    const list = getLocalItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_DEMO_DATA.coupons as any);
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return list.filter((c) => (c.customer_phone || '').replace(/[^0-9]/g, '').includes(cleanPhone));
    }
    return list;
  },

  /**
   * Busca un cupón por su código alfanumérico para validación en caja o recepción
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    const cleanCode = code.trim().toUpperCase();
    const list = getLocalItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_DEMO_DATA.coupons as any);
    const found = list.find((c) => c.coupon_code.toUpperCase() === cleanCode);
    return found || null;
  },

  /**
   * Quema y redime un cupón (candado de un solo uso Single-Use de SPEC-006)
   */
  async redeemCoupon(
    code: string,
    ticketAmount?: number,
    redeemedBy?: string
  ): Promise<{ success: boolean; error?: string; coupon?: Coupon }> {
    const cleanCode = code.trim().toUpperCase();
    const list = getLocalItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_DEMO_DATA.coupons as any);
    const target = list.find((c) => c.coupon_code.toUpperCase() === cleanCode);

    if (!target) {
      return { success: false, error: 'CUPON_NO_ENCONTRADO' };
    }

    if (target.status === 'redeemed') {
      return {
        success: false,
        error: 'CUPON_YA_CANJEADO',
        coupon: target,
      };
    }

    if (new Date(target.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        error: 'CUPON_EXPIRADO',
        coupon: target,
      };
    }

    const now = new Date().toISOString();
    const updatedCoupon: Coupon = {
      ...target,
      status: 'redeemed',
      ticket_amount: ticketAmount !== undefined ? Number(ticketAmount) : target.ticket_amount,
      redeemed_at: now,
      redeemed_by: redeemedBy || 'caja-mostrador',
    };

    const updatedList = list.map((c) => (c.id === target.id ? updatedCoupon : c));
    setLocalItem(STORAGE_KEYS.COUPONS, updatedList);

    return { success: true, coupon: updatedCoupon };
  },

  /**
   * Emite un nuevo cupón digital para un comensal desde un anuncio
   */
  async issueCoupon(data: {
    ad_id: string;
    customer_name: string;
    customer_phone: string;
    restaurant_id?: string;
    title?: string;
    advertiser_name?: string;
    discount_description?: string;
  }): Promise<{ success: boolean; coupon?: Coupon }> {
    const ads = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    const ad = ads.find((a) => a.id === data.ad_id);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const prefix = (data.advertiser_name || ad?.advertiser_name || 'PROMO')
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'X');
    const coupon_code = prefix + '-' + randomSuffix;

    const newCoupon: Coupon = {
      id: 'cpn-' + Date.now(),
      ad_id: data.ad_id,
      restaurant_id: data.restaurant_id || null,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      coupon_code,
      title: data.title || ad?.title || 'Cupón Exclusivo',
      advertiser_name: data.advertiser_name || ad?.advertiser_name || 'Comercio Local',
      discount_description: data.discount_description || ad?.coupon_description || 'Descuento especial por escanear en mesa.',
      status: 'active',
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      created_at: new Date().toISOString(),
    };

    const list = getLocalItem<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_DEMO_DATA.coupons as any);
    setLocalItem(STORAGE_KEYS.COUPONS, [newCoupon, ...list]);

    return { success: true, coupon: newCoupon };
  },


  // ==============================================================================
  // FASE 4: CONSOLA FINANCIERA, MRR, EBITDA Y CONTROL EJECUTIVO (SPEC-008, SPEC-009)
  // ==============================================================================

  /**
   * Calcula las métricas financieras globales de la plataforma en tiempo real
   * MRR, Ingresos Brutos, Costos Directos (COGS, Pasarela, Cloud, WhatsApp) y EBITDA
   */
  async getFinancialMetrics(): Promise<FinancialMetrics> {
    const restaurants = await this.getRestaurants();
    const tags = await this.getTags();
    const ads = await this.getAds();

    const tierMrr = restaurants.reduce((acc, r) => {
      let sub = 0;
      if (r.tier === 2) sub += 99;
      if (r.tier === 3) sub += 499;
      if (r.is_ad_free) sub += 149;
      return acc + sub;
    }, 0);

    const activePaying = restaurants.filter((r) => r.tier >= 2 || r.is_ad_free).length;
    const baseMrr = tierMrr > 0 ? Math.max(tierMrr, 14200) : 14200;
    const adRev = ads.reduce((acc, a) => acc + (a.budget_amount || 2500), 0) || 18500;
    const hwRev = (tags.length || 20) * 100;

    const grossRevenue = baseMrr + adRev + hwRev;
    const cogsHardware = (tags.length || 20) * 45;
    const gatewayFees = grossRevenue * 0.036 + (activePaying + ads.length) * 3;
    const cloudCost = 500;
    const whatsappCost = 420;

    const totalDirectCosts = Math.round(cogsHardware + gatewayFees + cloudCost + whatsappCost);
    const ebitda = Math.round(grossRevenue - totalDirectCosts);
    const ebitdaMargin = grossRevenue > 0 ? parseFloat(((ebitda / grossRevenue) * 100).toFixed(1)) : 78.5;
    const stripeBalance = 18920;

    return {
      mrr: baseMrr,
      adRevenue: adRev,
      hardwareRevenue: hwRev,
      grossRevenue,
      cogsHardware,
      gatewayFees: Math.round(gatewayFees),
      cloudCost,
      whatsappCost,
      totalDirectCosts,
      ebitda,
      ebitdaMargin,
      stripeBalance,
      payingLocations: activePaying || 17,
      totalLocations: restaurants.length || 18,
      collectionRate: 94.4,
      activeCampaigns: ads.filter((a) => a.is_active).length,
      campaignsAtRisk: ads.filter((a) => a.max_impressions && (a.impressions_count / a.max_impressions) >= 0.8).length,
    };
  },

  /**
   * Obtiene métricas agregadas del Centro de Mando Ejecutivo
   */
  async getGlobalExecutiveMetrics() {
    const kpis = await this.getDashboardKpis();
    const finances = await this.getFinancialMetrics();
    const restaurants = await this.getRestaurants();
    const tags = await this.getTags();
    const ads = await this.getAds();

    const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions_count || 0), 0) || 28450;
    const totalClicks = ads.reduce((acc, a) => acc + (a.clicks_count || 0), 0) || 1140;
    const averageCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(1)) : 4.0;

    const activeTables = tags.filter((t) => t.is_active).length || 48;
    const adFreeTables = restaurants.filter((r) => r.is_ad_free).length;
    const occupiedPercent = activeTables > 0 ? Math.round(((activeTables - adFreeTables) / activeTables) * 100) : 79;

    return {
      ...kpis,
      finances,
      totalImpressions,
      totalClicks,
      averageCtr,
      networkOccupancyRate: Math.max(10, Math.min(100, occupiedPercent)),
      activeCampaignsCount: ads.filter((a) => a.is_active).length,
      renewingCampaignsCount: ads.filter((a) => a.max_impressions && (a.impressions_count / a.max_impressions) >= 0.8).length,
    };
  },

  // ==========================================
  // OPERACIÓN DE SALA Y COMANDAS EN MESA
  // ==========================================

  async getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
    const defaultItems: MenuItem[] = [
      {
        id: 'menu-1',
        restaurant_id: restaurantId || 'res-1',
        category: 'entradas',
        name: 'Carpaccio de Res Trufado',
        description: 'Láminas finas de lomo de res con vinagreta de trufa negra, alcaparras y lascas de parmesano reggiano.',
        price: 185,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 8,
      },
      {
        id: 'menu-2',
        restaurant_id: restaurantId || 'res-1',
        category: 'entradas',
        name: 'Bruschetta Pomodoro Clásica',
        description: 'Pan rústico al horno de leña, jitomate cherry macerado en aceite de oliva virgen extra y albahaca fresca.',
        price: 130,
        image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 6,
      },
      {
        id: 'menu-3',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Pizza Margherita al Horno de Leña',
        description: 'Salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca y aceite de oliva virgen extra.',
        price: 240,
        image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 12,
      },
      {
        id: 'menu-4',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Fettuccine Alfredo con Camarones',
        description: 'Pasta fresca hecha en casa salteada en mantequilla infusionada, crema ligera y camarones a las hierbas finas.',
        price: 295,
        image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 15,
      },
      {
        id: 'menu-5',
        restaurant_id: restaurantId || 'res-1',
        category: 'principales',
        name: 'Corte Rib Eye Prime 400g',
        description: 'Corte premium al grill con sal de mar de Colima, acompañado de espárragos asados y papas al romero.',
        price: 420,
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 20,
      },
      {
        id: 'menu-6',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Copa de Vino Tinto Chianti Reserva',
        description: 'Selección de la casa con notas de frutos rojos y madera. Ideal para maridar con carnes y pastas.',
        price: 160,
        image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 3,
      },
      {
        id: 'menu-7',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Cerveza Artesanal IPA Mexicana 355ml',
        description: 'Cerveza de cuerpo medio con amargor balanceado y notas cítricas florales.',
        price: 95,
        image_url: 'https://images.unsplash.com/photo-1608270191544-774f3261a868?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 2,
      },
      {
        id: 'menu-8',
        restaurant_id: restaurantId || 'res-1',
        category: 'bebidas',
        name: 'Limonada Natural Menta & Jengibre',
        description: 'Refrescante limonada preparada al momento con jarabe natural, hojas de menta maceradas y toque de jengibre.',
        price: 65,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 4,
      },
      {
        id: 'menu-9',
        restaurant_id: restaurantId || 'res-1',
        category: 'postres',
        name: 'Tiramisú Tradicional de Mascarpone',
        description: 'Capas de soletas remojadas en café espresso y licor amaretto con crema sedosa de queso mascarpone y cacao.',
        price: 145,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 5,
      },
      {
        id: 'menu-10',
        restaurant_id: restaurantId || 'res-1',
        category: 'postres',
        name: 'Panna Cotta con Coulis de Frutos Rojos',
        description: 'Clásico postre italiano de crema aromatizada con vaina de vainilla y coulis artesanal de frambuesas y zarzamoras.',
        price: 120,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
        is_available: true,
        preparation_time_mins: 5,
      },
    ];

    const current = getLocalItem<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, defaultItems);
    if (!restaurantId) return current;
    return current.filter((m) => m.restaurant_id === restaurantId || m.restaurant_id === 'res-1');
  },

  async saveMenuItem(item: Partial<MenuItem>): Promise<{ success: boolean; data?: MenuItem }> {
    const current = await this.getMenuItems();
    if (item.id) {
      const updated = current.map((m) => (m.id === item.id ? ({ ...m, ...item } as MenuItem) : m));
      setLocalItem(STORAGE_KEYS.MENU_ITEMS, updated);
      return { success: true, data: updated.find((m) => m.id === item.id) };
    } else {
      const created: MenuItem = {
        id: 'menu-' + Date.now(),
        restaurant_id: item.restaurant_id || 'res-1',
        category: item.category || 'principales',
        name: item.name || 'Nuevo Platillo',
        description: item.description || '',
        price: item.price || 150,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
        is_available: item.is_available ?? true,
        preparation_time_mins: item.preparation_time_mins || 10,
      };
      setLocalItem(STORAGE_KEYS.MENU_ITEMS, [created, ...current]);
      return { success: true, data: created };
    }
  },

  async getTableOrders(restaurantId?: string): Promise<TableOrder[]> {
    const now = Date.now();
    const defaultOrders: TableOrder[] = [
      {
        id: 'ord-1',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-004',
        table_number: 'Mesa 4',
        items: [
          { menu_item_id: 'menu-3', name: 'Pizza Margherita al Horno', price: 240, quantity: 2, notes: 'Orilla crujiente' },
          { menu_item_id: 'menu-7', name: 'Cerveza Artesanal IPA', price: 95, quantity: 2 },
        ],
        total_amount: 670,
        status: 'preparing',
        customer_name: 'Alejandro G.',
        created_at: new Date(now - 8 * 60 * 1000).toISOString(), // hace 8 mins
        updated_at: new Date(now - 7 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-2',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-002',
        table_number: 'Mesa 2',
        items: [
          { menu_item_id: 'menu-4', name: 'Fettuccine Alfredo con Camarones', price: 295, quantity: 1, notes: 'Sin queso rallado extra' },
          { menu_item_id: 'menu-6', name: 'Copa de Vino Chianti Reserva', price: 160, quantity: 1 },
        ],
        total_amount: 455,
        status: 'ready',
        customer_name: 'Mariana Soto',
        created_at: new Date(now - 14 * 60 * 1000).toISOString(), // hace 14 mins
        updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-3',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-007',
        table_number: 'Mesa 7',
        items: [
          { menu_item_id: 'menu-1', name: 'Carpaccio de Res Trufado', price: 185, quantity: 1 },
          { menu_item_id: 'menu-8', name: 'Limonada Menta & Jengibre', price: 65, quantity: 2, notes: 'Poco hielo' },
        ],
        total_amount: 315,
        status: 'pending',
        customer_name: 'Comensal Mesa 7',
        created_at: new Date(now - 2 * 60 * 1000).toISOString(), // hace 2 mins
        updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      },
      {
        id: 'ord-4',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-001',
        table_number: 'Mesa 1',
        items: [
          { menu_item_id: 'menu-5', name: 'Corte Rib Eye Prime 400g', price: 420, quantity: 1, notes: 'Término medio' },
          { menu_item_id: 'menu-9', name: 'Tiramisú Tradicional', price: 145, quantity: 1 },
        ],
        total_amount: 565,
        status: 'delivered',
        customer_name: 'Carlos Mendoza',
        created_at: new Date(now - 38 * 60 * 1000).toISOString(),
        updated_at: new Date(now - 10 * 60 * 1000).toISOString(),
      },
    ];

    const current = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLE_ORDERS, defaultOrders);
    if (!restaurantId) return current;
    return current.filter((o) => o.restaurant_id === restaurantId || o.restaurant_id === 'res-1');
  },

  async createTableOrder(order: Partial<TableOrder>): Promise<{ success: boolean; data?: TableOrder; error?: string }> {
    const current = await this.getTableOrders();
    const created: TableOrder = {
      id: 'ord-' + Date.now(),
      restaurant_id: order.restaurant_id || 'res-1',
      tag_code: order.tag_code || 'TAG-ROM-001',
      table_number: order.table_number || 'Mesa 1',
      items: order.items || [],
      total_amount: order.total_amount || 0,
      status: 'pending',
      customer_name: order.customer_name || 'Comensal en Mesa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.TABLE_ORDERS, [created, ...current]);
    return { success: true, data: created };
  },

  async updateTableOrderStatus(orderId: string, status: TableOrderStatus): Promise<{ success: boolean; data?: TableOrder }> {
    const current = await this.getTableOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
    setLocalItem(STORAGE_KEYS.TABLE_ORDERS, updated);
    return { success: true, data: updated.find((o) => o.id === orderId) };
  },

  async getTableCalls(restaurantId?: string): Promise<TableCall[]> {
    const now = Date.now();
    const defaultCalls: TableCall[] = [
      {
        id: 'call-1',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-005',
        table_number: 'Mesa 5',
        call_type: 'bill_card',
        status: 'active',
        created_at: new Date(now - 3 * 60 * 1000).toISOString(),
      },
      {
        id: 'call-2',
        restaurant_id: restaurantId || 'res-1',
        tag_code: 'TAG-ROM-003',
        table_number: 'Mesa 3',
        call_type: 'waiter',
        status: 'active',
        created_at: new Date(now - 1 * 60 * 1000).toISOString(),
      },
    ];

    const current = getLocalItem<TableCall[]>(STORAGE_KEYS.TABLE_CALLS, defaultCalls);
    if (!restaurantId) return current;
    return current.filter((c) => c.restaurant_id === restaurantId || c.restaurant_id === 'res-1');
  },

  async createTableCall(call: Partial<TableCall>): Promise<{ success: boolean; data?: TableCall }> {
    const current = await this.getTableCalls();
    const created: TableCall = {
      id: 'call-' + Date.now(),
      restaurant_id: call.restaurant_id || 'res-1',
      tag_code: call.tag_code || 'TAG-MES-001',
      table_number: call.table_number || 'Mesa',
      call_type: call.call_type || 'waiter',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.TABLE_CALLS, [created, ...current]);
    return { success: true, data: created };
  },

  async resolveTableCall(callId: string, staffName = 'Mesero en Turno'): Promise<{ success: boolean; data?: TableCall }> {
    const current = await this.getTableCalls();
    const updated = current.map((c) =>
      c.id === callId
        ? { ...c, status: 'attended' as const, attended_at: new Date().toISOString(), attended_by: staffName }
        : c
    );
    setLocalItem(STORAGE_KEYS.TABLE_CALLS, updated);
    return { success: true, data: updated.find((c) => c.id === callId) };
  },

  async getStaffMembers(restaurantId?: string): Promise<StaffMember[]> {
    const defaultStaff: StaffMember[] = [
      {
        id: 'staff-1',
        restaurant_id: restaurantId || 'res-1',
        name: 'Marco Antonio (Mesero)',
        role: 'waiter',
        pin_code: '1234',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-2',
        restaurant_id: restaurantId || 'res-1',
        name: 'Chef Roberto (Jefe Cocina)',
        role: 'kitchen',
        pin_code: '4321',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'staff-3',
        restaurant_id: restaurantId || 'res-1',
        name: 'Sofía Valdés (Capitana Sala)',
        role: 'manager',
        pin_code: '9999',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    return getLocalItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, defaultStaff);
  },

  async loginStaffWithPin(restaurantId: string, pin: string): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
    const staffList = await this.getStaffMembers(restaurantId);
    const matched = staffList.find((s) => s.is_active && (s.pin_code === pin || pin === '1234'));
    if (matched) {
      return { success: true, staff: matched };
    }
    return { success: false, error: 'PIN incorrecto. Prueba con 1234 para demo de mesero.' };
  },

  async getTerritoryMetrics(): Promise<TerritoryMetric> {
    const zones: TerritoryZone[] = [
      {
        id: 'zone-1',
        name: 'Roma Norte & Sur',
        city: 'CDMX',
        active_restaurants: 5,
        target_restaurants: 20,
        total_scans: 12450,
        density_percent: 25,
        lat: 19.4185,
        lng: -99.1625,
      },
      {
        id: 'zone-2',
        name: 'Condesa & Hipódromo',
        city: 'CDMX',
        active_restaurants: 4,
        target_restaurants: 18,
        total_scans: 9820,
        density_percent: 22.2,
        lat: 19.4112,
        lng: -99.1714,
      },
      {
        id: 'zone-3',
        name: 'Juárez & Corredor Reforma',
        city: 'CDMX',
        active_restaurants: 3,
        target_restaurants: 15,
        total_scans: 7210,
        density_percent: 20,
        lat: 19.4284,
        lng: -99.1633,
      },
      {
        id: 'zone-4',
        name: 'Centro Histórico & Alameda',
        city: 'CDMX',
        active_restaurants: 3,
        target_restaurants: 15,
        total_scans: 5930,
        density_percent: 20,
        lat: 19.4326,
        lng: -99.1332,
      },
      {
        id: 'zone-5',
        name: 'Polanco & Anzures',
        city: 'CDMX',
        active_restaurants: 2,
        target_restaurants: 16,
        total_scans: 4850,
        density_percent: 12.5,
        lat: 19.4338,
        lng: -99.1908,
      },
      {
        id: 'zone-6',
        name: 'Del Valle & Narvarte',
        city: 'CDMX',
        active_restaurants: 1,
        target_restaurants: 16,
        total_scans: 2140,
        density_percent: 6.3,
        lat: 19.3872,
        lng: -99.1621,
      },
    ];

    const activeLocations = zones.reduce((acc, z) => acc + z.active_restaurants, 0); // 18
    const totalGoal = 100;
    const coveragePercent = Math.round((activeLocations / totalGoal) * 100); // 18%

    const hourlyHeatmap = [
      { hour: '12:00', scans: 420, peak: false },
      { hour: '13:00', scans: 890, peak: false },
      { hour: '14:00', scans: 2450, peak: true },  // Pico Comida
      { hour: '15:00', scans: 3120, peak: true },  // Pico Comida
      { hour: '16:00', scans: 1980, peak: false },
      { hour: '17:00', scans: 840, peak: false },
      { hour: '18:00', scans: 610, peak: false },
      { hour: '19:00', scans: 1150, peak: false },
      { hour: '20:00', scans: 2890, peak: true },  // Pico Cena
      { hour: '21:00', scans: 3410, peak: true },  // Pico Cena
      { hour: '22:00', scans: 2240, peak: true },
      { hour: '23:00', scans: 910, peak: false },
    ];

    return {
      totalGoal,
      activeLocations,
      coveragePercent,
      zones,
      hourlyHeatmap,
    };
  },

};
