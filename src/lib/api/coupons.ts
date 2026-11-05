import { supabase, isSupabaseConfigured } from '../supabase';
import type { Coupon, Ad } from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem } from './core';

export const couponsApi = {
/**
   * Obtiene la lista de cupones para el Pasaporte Digital (filtrados por cliente)
   */
  async getCoupons(phone?: string): Promise<Coupon[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('coupons').select('*, ad:ads(*), restaurant:restaurants(*)').order('created_at', { ascending: false });
        if (phone) {
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          query = query.ilike('customer_phone', `%${cleanPhone}%`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as Coupon[];
        }
      } catch (err) {
        console.warn('Fallo al obtener cupones de Supabase, usando respaldo local:', err);
      }
    }

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
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*, ad:ads(*), restaurant:restaurants(*)')
          .ilike('coupon_code', cleanCode)
          .maybeSingle();
        if (!error && data) {
          return data as Coupon;
        }
      } catch (err) {
        console.warn('Fallo al buscar cupón en Supabase, usando respaldo local:', err);
      }
    }

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

    if (isSupabaseConfigured) {
      try {
        const existing = await couponsApi.getCouponByCode(cleanCode);
        if (existing) {
          if (existing.status === 'redeemed') {
            return { success: false, error: 'CUPON_YA_CANJEADO', coupon: existing };
          }
          if (new Date(existing.expires_at).getTime() < Date.now()) {
            return { success: false, error: 'CUPON_EXPIRADO', coupon: existing };
          }
          const now = new Date().toISOString();
          const { data, error } = await supabase
            .from('coupons')
            .update({
              status: 'redeemed',
              ticket_amount: ticketAmount !== undefined ? Number(ticketAmount) : existing.ticket_amount,
              redeemed_at: now,
              redeemed_by: redeemedBy || 'caja-mostrador',
            })
            .eq('coupon_code', cleanCode)
            .select('*, ad:ads(*), restaurant:restaurants(*)')
            .single();

          if (!error && data) {
            return { success: true, coupon: data as Coupon };
          }
        }
      } catch (err) {
        console.warn('Fallo al canjear cupón en Supabase, usando respaldo local:', err);
      }
    }

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

  /**
   * Quema y redime un cupón desde la terminal de mesero
   */
  async redeemCouponByStaff(
    code: string,
    _restaurantId?: string,
    staffName?: string
  ): Promise<{ success: boolean; error?: string; coupon?: Coupon }> {
    return couponsApi.redeemCoupon(code, undefined, staffName || 'Mesero en Sala');
  }
};
