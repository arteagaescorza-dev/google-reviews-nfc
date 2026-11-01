import { supabase, isSupabaseConfigured } from '../supabase';
import type { Ad, Restaurant } from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem, sanitizeSupabasePayload, VIRAL_SEED_AD } from './core';

export const adsApi = {
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
  }
};
