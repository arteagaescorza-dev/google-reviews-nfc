import { supabase, isSupabaseConfigured } from './supabase';
import type { Restaurant, Tag, Ad, Feedback, Organization } from '../types';

// ==============================================================================
// DATOS EN MEMORIA / LOCALSTORAGE PARA MODO DEMO CUANDO SUPABASE AÚN NO ESTÁ VINCULADO
// ==============================================================================

const STORAGE_KEYS = {
  ORGANIZATIONS: 'nfc_demo_organizations',
  RESTAURANTS: 'nfc_demo_restaurants',
  TAGS: 'nfc_demo_tags',
  ADS: 'nfc_demo_ads',
  FEEDBACK: 'nfc_demo_feedback',
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
  async getAdForPlacement(tagCode?: string, restaurantId?: string): Promise<Ad | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true);

        if (error || !ads || ads.length === 0) return null;

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

        return matched || ads[0] || null;
      } catch (e) {
        console.error('Error al cargar anuncios de Supabase:', e);
      }
    }

    // Fallback Modo Demo
    const ads = getLocalItem<Ad[]>(STORAGE_KEYS.ADS, INITIAL_DEMO_DATA.ads);
    const activeAds = ads.filter((a) => a.is_active);
    if (activeAds.length === 0) return null;

    const matched = activeAds.find((ad) => {
      if (tagCode && ad.target_type === 'specific_tags' && ad.target_tag_codes?.includes(tagCode)) return true;
      if (restaurantId && ad.target_type === 'specific_restaurants' && ad.target_restaurant_ids?.includes(restaurantId)) return true;
      return ad.target_type === 'all';
    });

    return matched || activeAds[0];
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
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_DEMO_DATA.organizations);
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

  async updateFeedbackStatus(id: string, status: 'new' | 'reviewed' | 'contacted'): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('feedback').update({ status }).eq('id', id);
      return;
    }

    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const updated = current.map((f) => (f.id === id ? { ...f, status } : f));
    setLocalItem(STORAGE_KEYS.FEEDBACK, updated);
  },
};

