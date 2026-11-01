import { supabase, isSupabaseConfigured } from '../supabase';
import type { Restaurant, Tag, LinkItem, Organization } from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';
import { organizationsApi } from './organizations';

export const restaurantsApi = {
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

async getMyRestaurants(): Promise<Restaurant[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      const membership = await organizationsApi.getMyMembership();
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
  }
};
