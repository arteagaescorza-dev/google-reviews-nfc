import { supabase, isSupabaseConfigured } from '../supabase';
import type { Tag, Restaurant, TagScan } from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

export const tagsApi = {
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

  async getTagScans(restaurantId?: string): Promise<TagScan[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('tag_scans').select('*').order('created_at', { ascending: false });
        if (restaurantId && !restaurantId.startsWith('res-')) {
          query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as TagScan[];
        }
      } catch (e) {
        console.warn('Error obteniendo tag_scans de Supabase:', e);
      }
    }

    const now = Date.now();
    const defaultScans: TagScan[] = [
      // Hoy
      { id: 'scan-1', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 1000 * 60 * 30).toISOString() },
      { id: 'scan-2', tag_code: 'NFC-002', restaurant_id: restaurantId || 'res-1', scan_method: 'qr', created_at: new Date(now - 1000 * 60 * 90).toISOString() },
      // 7 dias
      { id: 'scan-3', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 1).toISOString() },
      { id: 'scan-4', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 1.5).toISOString() },
      { id: 'scan-5', tag_code: 'NFC-002', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 2).toISOString() },
      { id: 'scan-6', tag_code: 'NFC-003', restaurant_id: restaurantId || 'res-1', scan_method: 'qr', created_at: new Date(now - 86400000 * 3).toISOString() },
      { id: 'scan-7', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 4).toISOString() },
      { id: 'scan-8', tag_code: 'NFC-002', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 5).toISOString() },
      { id: 'scan-9', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'qr', created_at: new Date(now - 86400000 * 6).toISOString() },
      // 30 dias
      { id: 'scan-10', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 12).toISOString() },
      { id: 'scan-11', tag_code: 'NFC-002', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 18).toISOString() },
      { id: 'scan-12', tag_code: 'NFC-003', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 25).toISOString() },
      // Historico
      { id: 'scan-13', tag_code: 'NFC-001', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 35).toISOString() },
      { id: 'scan-14', tag_code: 'NFC-002', restaurant_id: restaurantId || 'res-1', scan_method: 'nfc', created_at: new Date(now - 86400000 * 45).toISOString() },
    ];
    return defaultScans;
  },

  async pairPlateInSitu(params: {
    restaurant_id: string;
    table_identifier: string;
    sticker_qr: string;
    chip_uid?: string;
    tag_code?: string;
    installer_name?: string;
  }): Promise<{ success: boolean; data?: Tag; error?: string }> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_demo_auth') === 'true';
    const tagCode = (params.tag_code || params.sticker_qr || ('PLC-' + Date.now().toString().slice(-4))).trim().toUpperCase();
    const cleanSticker = params.sticker_qr.trim().toUpperCase();
    const cleanChip = params.chip_uid ? params.chip_uid.trim().toUpperCase() : null;

    if (isSupabaseConfigured && !isDemo) {
      try {
        const payload = {
          tag_code: tagCode,
          restaurant_id: params.restaurant_id,
          table_identifier: params.table_identifier.trim(),
          sticker_qr: cleanSticker,
          chip_uid: cleanChip,
          status: 'activo',
          is_active: true,
          installer_name: params.installer_name?.trim() || 'Técnico Instalador',
          installed_at: new Date().toISOString(),
          physical_condition: 'instalado',
        };
        const { data, error } = await supabase.from('tags').insert([payload]).select().single();
        if (error) throw error;
        return { success: true, data: data as Tag };
      } catch (e: any) {
        console.warn('Error en pairPlateInSitu Supabase, usando respaldo local:', e.message);
      }
    }

    const current = getLocalItem<Tag[]>(STORAGE_KEYS.TAGS, INITIAL_DEMO_DATA.tags);
    const existingActive = current.find(
      (t) =>
        t.is_active &&
        t.status !== 'retirado_mantenimiento' &&
        ((t.sticker_qr && t.sticker_qr.toUpperCase() === cleanSticker) ||
          (t.tag_code && t.tag_code.toUpperCase() === tagCode))
    );
    if (existingActive) {
      return {
        success: false,
        error: 'El código QR ' + cleanSticker + ' ya está vinculado a la mesa ' + (existingActive.table_identifier || 'otra mesa') + '.',
      };
    }

    const newTag: Tag = {
      id: 'tag-' + Date.now(),
      tag_code: tagCode,
      restaurant_id: params.restaurant_id,
      table_identifier: params.table_identifier.trim(),
      sticker_qr: cleanSticker,
      chip_uid: cleanChip,
      status: 'activo',
      is_active: true,
      physical_condition: 'instalado',
      installer_name: params.installer_name?.trim() || 'Técnico Instalador',
      installed_at: new Date().toISOString(),
      scan_count: 0,
      created_at: new Date().toISOString(),
    };

    setLocalItem(STORAGE_KEYS.TAGS, [newTag, ...current]);
    return { success: true, data: newTag };
  },

  async resolvePlate(code: string): Promise<{
    found: boolean;
    tag?: Tag;
    restaurant?: Restaurant;
    isMaintenanceRetired?: boolean;
    tableIdentifier?: string;
  }> {
    const cleanCode = code.trim().toUpperCase();
    const allTags = await tagsApi.getTags();
    const tag = allTags.find(
      (t) =>
        (t.tag_code && t.tag_code.toUpperCase() === cleanCode) ||
        (t.sticker_qr && t.sticker_qr.toUpperCase() === cleanCode) ||
        (t.chip_uid && t.chip_uid.toUpperCase() === cleanCode)
    );

    if (!tag) {
      return { found: false };
    }

    const isMaintenanceRetired =
      tag.status === 'retirado_mantenimiento' ||
      tag.physical_condition === 'reemplazado';

    return {
      found: true,
      tag,
      restaurant: tag.restaurant,
      isMaintenanceRetired,
      tableIdentifier: tag.table_identifier || undefined,
    };
  },
};
