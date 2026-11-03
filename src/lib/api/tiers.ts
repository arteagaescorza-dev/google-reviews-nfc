import { supabase, isSupabaseConfigured } from '../supabase';
import type { CustomTierDefinition, TierType, Restaurant, Organization } from '../../types';
import { DEFAULT_CUSTOM_TIERS } from '../constants';
import { STORAGE_KEYS, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

const TIERS_STORAGE_KEY = 'nfc_custom_tier_definitions_v1';

export const tiersApi = {
  /**
   * Obtiene las definiciones configuradas de los Tiers
   * Soporta filtrado por giro comercial y estado de archivado (POL-008, POL-010)
   */
  async getTierDefinitions(options?: {
    verticalSlug?: string;
    includeArchived?: boolean;
  }): Promise<CustomTierDefinition[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    let results: CustomTierDefinition[] = [];

    if (!isDemo && isSupabaseConfigured) {
      try {
        let query = supabase
          .from('tier_definitions')
          .select('*')
          .order('tier', { ascending: true });

        if (!options?.includeArchived) {
          query = query.eq('is_archived', false);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          results = data as CustomTierDefinition[];
        }
      } catch (err) {
        console.warn('Error cargando tier_definitions de Supabase, usando respaldo local:', err);
      }
    }

    if (results.length === 0) {
      const rawTiers = getLocalItem<CustomTierDefinition[]>(TIERS_STORAGE_KEY, DEFAULT_CUSTOM_TIERS);
      results = rawTiers.map((t) => {
        const def = DEFAULT_CUSTOM_TIERS.find((d) => d.tier === t.tier);
        if (!def) return t;
        const features = Array.from(new Set([...t.included_features]));
        if (def.included_features.includes('feat_digital_menu') && !features.includes('feat_digital_menu')) {
          features.push('feat_digital_menu');
        }
        const allowedCategories = t.allowed_categories && t.allowed_categories.length > 0 ? t.allowed_categories : def.allowed_categories;
        return {
          ...t,
          id: t.id || `tier-local-${t.tier}`,
          vertical_slug: t.vertical_slug || def.vertical_slug || 'all',
          is_archived: t.is_archived ?? false,
          included_features: features,
          allowed_categories: allowedCategories,
        };
      });

      if (!options?.includeArchived) {
        results = results.filter((t) => !t.is_archived);
      }
    }

    if (options?.verticalSlug && options.verticalSlug !== 'all') {
      results = results.filter(
        (t) => !t.vertical_slug || t.vertical_slug === 'all' || t.vertical_slug === options.verticalSlug
      );
    }

    return results;
  },

  /**
   * Crea una nueva definicion de Tier en el catalogo maestro
   */
  async createTierDefinition(
    tierDef: Partial<CustomTierDefinition>
  ): Promise<{ success: boolean; data?: CustomTierDefinition; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const id =
      tierDef.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tier-${Date.now()}`);

    const newTier: CustomTierDefinition = {
      id,
      tier: tierDef.tier ?? 1,
      name: tierDef.name || `Nuevo Tier ${tierDef.tier ?? 1}`,
      badge_label: tierDef.badge_label || `Tier ${tierDef.tier ?? 1}`,
      price_mxn: tierDef.price_mxn ?? 0,
      description: tierDef.description || '',
      vertical_slug: tierDef.vertical_slug || 'all',
      vertical_id: tierDef.vertical_id || null,
      is_archived: false,
      included_features: tierDef.included_features || ['feat_redirect', 'feat_viral_seeds'],
      included_stations: tierDef.included_stations || [],
      client_visible_features:
        tierDef.client_visible_features || tierDef.included_features || ['feat_redirect', 'feat_viral_seeds'],
      client_visible_stations:
        tierDef.client_visible_stations || tierDef.included_stations || [],
      allowed_categories: tierDef.allowed_categories || [1, 2],
      client_visible_categories: tierDef.client_visible_categories || [1, 2],
    };

    if (!isDemo && isSupabaseConfigured) {
      try {
        const payload = sanitizeSupabasePayload(newTier, false);
        const { error } = await supabase.from('tier_definitions').insert([payload]);
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error insertando tier_definition en Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const currentTiers = getLocalItem<CustomTierDefinition[]>(TIERS_STORAGE_KEY, DEFAULT_CUSTOM_TIERS);
    const updatedTiers = [...currentTiers, newTier];
    setLocalItem(TIERS_STORAGE_KEY, updatedTiers);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nfc_tier_definitions_updated', { detail: updatedTiers }));
    }

    return { success: true, data: newTier };
  },

  /**
   * Actualiza una definicion de Tier existente
   */
  async updateTierDefinition(
    id: string,
    updates: Partial<CustomTierDefinition>
  ): Promise<{ success: boolean; data?: CustomTierDefinition; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';

    if (!isDemo && isSupabaseConfigured && !id.startsWith('tier-local-')) {
      try {
        const payload = sanitizeSupabasePayload(updates, false);
        const { error } = await supabase
          .from('tier_definitions')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error actualizando tier_definition en Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const currentTiers = getLocalItem<CustomTierDefinition[]>(TIERS_STORAGE_KEY, DEFAULT_CUSTOM_TIERS);
    let updatedItem: CustomTierDefinition | undefined;
    const updatedTiers = currentTiers.map((t) => {
      if (t.id === id || (t.id === undefined && String(t.tier) === id)) {
        updatedItem = { ...t, ...updates };
        return updatedItem;
      }
      return t;
    });

    setLocalItem(TIERS_STORAGE_KEY, updatedTiers);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nfc_tier_definitions_updated', { detail: updatedTiers }));
    }

    return { success: true, data: updatedItem };
  },

  /**
   * Archiva o desarchiva un Tier
   */
  async archiveTierDefinition(
    id: string,
    isArchived: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateTierDefinition(id, { is_archived: isArchived });
  },

  /**
   * Elimina un Tier del catalogo
   */
  async deleteTierDefinition(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';

    if (!isDemo && isSupabaseConfigured && !id.startsWith('tier-local-')) {
      try {
        const { error } = await supabase
          .from('tier_definitions')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.warn('Error eliminando tier_definition en Supabase:', err.message);
        return { success: false, error: err.message };
      }
    }

    const currentTiers = getLocalItem<CustomTierDefinition[]>(TIERS_STORAGE_KEY, DEFAULT_CUSTOM_TIERS);
    const updatedTiers = currentTiers.filter((t) => t.id !== id && String(t.tier) !== id);
    setLocalItem(TIERS_STORAGE_KEY, updatedTiers);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nfc_tier_definitions_updated', { detail: updatedTiers }));
    }

    return { success: true };
  },

  /**
   * Guarda o actualiza un lote completo de definiciones de Tiers
   */
  async saveTierDefinitions(
    tiers: CustomTierDefinition[]
  ): Promise<{ success: boolean; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    if (!isDemo && isSupabaseConfigured) {
      try {
        const payload = tiers.map((t) => {
          const item = {
            ...t,
            id: t.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined),
          };
          return sanitizeSupabasePayload(item, false);
        });
        const { error } = await supabase.from('tier_definitions').upsert(payload, { onConflict: 'id' });
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
   * Inicia un periodo de prueba de 7, 14 o 28 dias para una Organizacion o Sucursal
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

    // 1. Si es a nivel Organizacion: impacta a la organizacion y a todas sus sucursales
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

    // 2. Si es a nivel Sucursal especifica
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
