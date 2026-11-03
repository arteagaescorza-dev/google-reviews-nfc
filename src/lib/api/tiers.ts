import { supabase, isSupabaseConfigured } from '../supabase';
import type { CustomTierDefinition, TierType, Restaurant, Organization } from '../../types';
import { DEFAULT_CUSTOM_TIERS } from '../constants';
import { STORAGE_KEYS, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

const TIERS_STORAGE_KEY = 'nfc_custom_tier_definitions_v1';

export const tiersApi = {
  /**
   * Obtiene las definiciones configuradas de los Tiers
   */
  async getTierDefinitions(): Promise<CustomTierDefinition[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tier_definitions')
          .select('*')
          .order('tier', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as CustomTierDefinition[];
        }
      } catch (err) {
        console.warn('Error cargando tier_definitions de Supabase, usando respaldo local:', err);
      }
    }

    return getLocalItem<CustomTierDefinition[]>(TIERS_STORAGE_KEY, DEFAULT_CUSTOM_TIERS);
  },

  /**
   * Guarda o actualiza las definiciones de los Tiers
   */
  async saveTierDefinitions(
    tiers: CustomTierDefinition[]
  ): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const payload = tiers.map((t) => sanitizeSupabasePayload(t, false));
        const { error } = await supabase.from('tier_definitions').upsert(payload, { onConflict: 'tier' });
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error guardando en Supabase tier_definitions:', err.message);
      }
    }

    setLocalItem(TIERS_STORAGE_KEY, tiers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nfc_tier_definitions_updated', { detail: tiers }));
    }
    return { success: true };
  },

  /**
   * Inicia un periodo de prueba de 7, 14 o 28 días para una Organización o Sucursal
   */
  async startTrialPeriod(params: {
    organizationId?: string;
    restaurantId?: string;
    trialTier: TierType;
    trialDays: 7 | 14 | 28;
  }): Promise<{ success: boolean; error?: string }> {
    const { organizationId, restaurantId, trialTier, trialDays } = params;
    const now = new Date();
    const endDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const trialData = {
      trial_tier: trialTier,
      trial_start_date: now.toISOString(),
      trial_end_date: endDate.toISOString(),
      trial_days: trialDays,
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';

    // 1. Si es a nivel Organización: impacta a la organización y a todas sus sucursales
    if (organizationId) {
      if (!isDemo && isSupabaseConfigured && !organizationId.startsWith('org-')) {
        try {
          await supabase.from('organizations').update(trialData).eq('id', organizationId);
          await supabase
            .from('restaurants')
            .update(trialData)
            .eq('organization_id', organizationId);
        } catch (err: any) {
          console.warn('Error actualizando trial en Supabase:', err.message);
        }
      }

      // Local / Demo fallback
      const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, []);
      setLocalItem(
        STORAGE_KEYS.ORGANIZATIONS,
        orgs.map((o) => (o.id === organizationId ? { ...o, ...trialData } : o))
      );

      const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
      setLocalItem(
        STORAGE_KEYS.RESTAURANTS,
        rests.map((r) =>
          r.organization_id === organizationId ? { ...r, ...trialData } : r
        )
      );

      return { success: true };
    }

    // 2. Si es a nivel Sucursal específica
    if (restaurantId) {
      if (!isDemo && isSupabaseConfigured && !restaurantId.startsWith('res-')) {
        try {
          await supabase.from('restaurants').update(trialData).eq('id', restaurantId);
        } catch (err: any) {
          console.warn('Error actualizando trial de sucursal en Supabase:', err.message);
        }
      }

      const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
      setLocalItem(
        STORAGE_KEYS.RESTAURANTS,
        rests.map((r) => (r.id === restaurantId ? { ...r, ...trialData } : r))
      );

      return { success: true };
    }

    return { success: false, error: 'Se requiere organizationId o restaurantId.' };
  },

  /**
   * Cancela o finaliza anticipadamente el periodo de prueba
   */
  async cancelTrialPeriod(params: {
    organizationId?: string;
    restaurantId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { organizationId, restaurantId } = params;
    const cleanTrial = {
      trial_tier: null,
      trial_start_date: null,
      trial_end_date: null,
      trial_days: null,
    };

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';

    if (organizationId) {
      if (!isDemo && isSupabaseConfigured && !organizationId.startsWith('org-')) {
        try {
          await supabase.from('organizations').update(cleanTrial).eq('id', organizationId);
          await supabase.from('restaurants').update(cleanTrial).eq('organization_id', organizationId);
        } catch (err) {
          console.warn('Error cancelando trial en Supabase:', err);
        }
      }

      const orgs = getLocalItem<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, []);
      setLocalItem(
        STORAGE_KEYS.ORGANIZATIONS,
        orgs.map((o) => (o.id === organizationId ? { ...o, ...cleanTrial } : o))
      );

      const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
      setLocalItem(
        STORAGE_KEYS.RESTAURANTS,
        rests.map((r) =>
          r.organization_id === organizationId ? { ...r, ...cleanTrial } : r
        )
      );

      return { success: true };
    }

    if (restaurantId) {
      if (!isDemo && isSupabaseConfigured && !restaurantId.startsWith('res-')) {
        try {
          await supabase.from('restaurants').update(cleanTrial).eq('id', restaurantId);
        } catch (err) {
          console.warn('Error cancelando trial en Supabase:', err);
        }
      }

      const rests = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, []);
      setLocalItem(
        STORAGE_KEYS.RESTAURANTS,
        rests.map((r) => (r.id === restaurantId ? { ...r, ...cleanTrial } : r))
      );

      return { success: true };
    }

    return { success: false, error: 'Se requiere organizationId o restaurantId.' };
  },
};

