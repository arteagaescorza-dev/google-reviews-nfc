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
      impressions_count: 142,
      clicks_count: 18,
      created_at: new Date().toISOString(),
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
      impressions_count: 89,
      clicks_count: 7,
      created_at: new Date().toISOString(),
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

    if (isSupabaseConfigured) {
      try {
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true);

        if (!error && ads && ads.length > 0) {
          // Filtrar según segmentación
          const matched = ads.find((ad: Ad) => {
            if (tagCode && ad.target_type === 'specific_tags' && ad.target_tag_codes?.includes(tagCode)) {
              return true;
            }
            if (restaurantId && ad.target_type === 'specific_restaurants' && ad.target_restaurant_ids?.includes(restaurantId)) {
              return true;
            }
            return ad.target_type === 'all';
          });

          if (matched) return matched;
          if (ads[0]) return ads[0];
        }
      } catch (e) {
        console.error('Error al cargar anuncios de Supabase:', e);
      }
    }

    // Fallback Modo Demo
    const ads = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    const activeAds = ads.filter((a) => a.is_active);
    if (activeAds.length > 0) {
      const matched = activeAds.find((ad) => {
        if (tagCode && ad.target_type === 'specific_tags' && ad.target_tag_codes?.includes(tagCode)) return true;
        if (restaurantId && ad.target_type === 'specific_restaurants' && ad.target_restaurant_ids?.includes(restaurantId)) return true;
        return ad.target_type === 'all';
      });
      if (matched) return matched;
      return activeAds[0];
    }

    // Bucle Viral por defecto: Si no hay patrocinadores activos, mostrar la marca de placas a $100
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
};

