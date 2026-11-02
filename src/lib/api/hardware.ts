import { supabase, isSupabaseConfigured } from '../supabase';
import type { HardwareInventoryItem, PrintBatch } from '../../types';
import { STORAGE_KEYS, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

const DEMO_HARDWARE_INVENTORY: HardwareInventoryItem[] = [
  {
    id: 'hw-chip-1',
    sku: 'CHIP-NTAG213-RAW',
    item_name: 'Chips NFC NTAG213 Circulares 25mm Virgenes',
    category: 'nfc_chip',
    stock_available: 350,
    stock_allocated: 45,
    stock_min_threshold: 100,
    unit_cost_mxn: 4.50,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hw-vinyl-1',
    sku: 'VINYL-3M-GLOSS',
    item_name: 'Viniles Adhesivos 3M 6x6cm Impresos UV Mate',
    category: 'vinyl_sticker',
    stock_available: 420,
    stock_allocated: 45,
    stock_min_threshold: 150,
    unit_cost_mxn: 12.00,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hw-stand-1',
    sku: 'ACRYLIC-STAND-A6',
    item_name: 'Bases Acrilico Cristal A6 para Mesas',
    category: 'acrylic_stand',
    stock_available: 85,
    stock_allocated: 15,
    stock_min_threshold: 30,
    unit_cost_mxn: 45.00,
    updated_at: new Date().toISOString(),
  },
];

const DEMO_PRINT_BATCHES: PrintBatch[] = [
  {
    id: 'batch-1',
    batch_number: 'LOT-2026-001',
    supplier_name: 'Imprenta Central CDMX',
    total_units: 500,
    prefix: 'TAG-',
    range_start: 1,
    range_end: 500,
    status: 'en_uso',
    cost_total_mxn: 6000.00,
    specifications: { tamano: '6x6cm', material: 'vinil_adhesivo_3m', laminado: 'mate_uv', corte: 'redondo' },
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    received_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
];

const HARDWARE_STORAGE_KEY = 'nfc_hardware_inventory';
const PRINT_BATCHES_STORAGE_KEY = 'nfc_print_batches';

export const hardwareApi = {
  async getInventory(): Promise<HardwareInventoryItem[]> {
    return hardwareApi.getHardwareInventory();
  },

  async getHardwareInventory(): Promise<HardwareInventoryItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('hardware_inventory')
          .select('*')
          .order('category', { ascending: true });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Error cargando hardware_inventory desde Supabase, usando fallback local', err);
      }
    }
    return getLocalItem<HardwareInventoryItem[]>(HARDWARE_STORAGE_KEY, DEMO_HARDWARE_INVENTORY);
  },

  async updateHardwareStock(sku: string, addedStock: number): Promise<{ success: boolean; data?: HardwareInventoryItem; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data: current } = await supabase
          .from('hardware_inventory')
          .select('*')
          .eq('sku', sku)
          .single();

        if (current) {
          const newStock = Math.max(0, current.stock_available + addedStock);
          const { data, error } = await supabase
            .from('hardware_inventory')
            .update({ stock_available: newStock, last_restocked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('sku', sku)
            .select()
            .single();
          if (error) throw error;
          return { success: true, data };
        }
      } catch (e: any) {
        // Fallback si la conexión remota falla
        console.warn('Error en updateHardwareStock remoto, usando local', e.message);
      }
    }

    const current = getLocalItem<HardwareInventoryItem[]>(HARDWARE_STORAGE_KEY, DEMO_HARDWARE_INVENTORY);
    const item = current.find((i) => i.sku === sku);
    if (item) {
      item.stock_available = Math.max(0, item.stock_available + addedStock);
      item.updated_at = new Date().toISOString();
      setLocalItem(HARDWARE_STORAGE_KEY, current);
      return { success: true, data: item };
    }
    return { success: false, error: 'SKU no encontrado' };
  },

  async getPrintBatches(): Promise<PrintBatch[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('print_batches')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Error cargando print_batches desde Supabase, usando fallback local', err);
      }
    }
    return getLocalItem<PrintBatch[]>(PRINT_BATCHES_STORAGE_KEY, DEMO_PRINT_BATCHES);
  },

  async createPrintBatch(params: {
    supplier_name: string;
    total_units: number;
    prefix: string;
    range_start: number;
    range_end: number;
    unit_cost_mxn: number;
    specifications?: Record<string, any>;
  }): Promise<{ success: boolean; data?: PrintBatch; error?: string }> {
    const batchNumber = `LOT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const costTotal = params.total_units * params.unit_cost_mxn;

    const newBatchPayload: Partial<PrintBatch> = {
      batch_number: batchNumber,
      supplier_name: params.supplier_name,
      total_units: params.total_units,
      prefix: params.prefix.toUpperCase(),
      range_start: params.range_start,
      range_end: params.range_end,
      status: 'generado',
      cost_total_mxn: costTotal,
      specifications: params.specifications || {
        tamano: '6x6cm',
        material: 'vinil_adhesivo_3m',
        laminado: 'mate_uv',
        corte: 'suaje_redondo_diametro_60mm',
      },
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const clean = sanitizeSupabasePayload(newBatchPayload, true);
        const { data, error } = await supabase.from('print_batches').insert([clean]).select().single();
        if (error) throw error;
        return { success: true, data };
      } catch (e: any) {
        console.warn('Error en createPrintBatch remoto, usando fallback local', e.message);
      }
    }

    const current = getLocalItem<PrintBatch[]>(PRINT_BATCHES_STORAGE_KEY, DEMO_PRINT_BATCHES);
    const createdBatch: PrintBatch = {
      ...(newBatchPayload as PrintBatch),
      id: 'batch-' + Date.now(),
    };
    setLocalItem(PRINT_BATCHES_STORAGE_KEY, [createdBatch, ...current]);
    return { success: true, data: createdBatch };
  },

  async activateTableTagInSitu(params: {
    tag_code: string;
    restaurant_id: string;
    table_identifier: string;
    installer_name?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.restaurant_id);

    if (isSupabaseConfigured && isUUID) {
      try {
        const { data, error } = await supabase.rpc('activate_table_tag_in_situ', {
          p_tag_code: params.tag_code.trim().toUpperCase(),
          p_restaurant_id: params.restaurant_id,
          p_table_identifier: params.table_identifier.trim(),
          p_installer_name: params.installer_name?.trim() || 'Técnico de Campo',
        });
        if (!error && data) {
          return { success: true, data };
        }
      } catch (e: any) {
        console.warn('RPC activate_table_tag_in_situ falló, recurriendo a local:', e.message);
      }
    }

    // Fallback local garantizado
    const tags = getLocalItem<any[]>(STORAGE_KEYS.TAGS, []);
    const existingIndex = tags.findIndex((t) => t.tag_code === params.tag_code.toUpperCase());
    const newTag = {
      id: existingIndex >= 0 ? tags[existingIndex].id : 'tag-' + Date.now(),
      tag_code: params.tag_code.toUpperCase(),
      restaurant_id: params.restaurant_id,
      table_identifier: params.table_identifier,
      physical_condition: 'instalado',
      installer_name: params.installer_name || 'Técnico de Campo',
      installed_at: new Date().toISOString(),
      is_active: true,
      scan_count: existingIndex >= 0 ? tags[existingIndex].scan_count : 0,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      tags[existingIndex] = { ...tags[existingIndex], ...newTag };
    } else {
      tags.unshift(newTag);
    }
    setLocalItem(STORAGE_KEYS.TAGS, tags);

    // Descontar inventario local
    const currentHw = getLocalItem<HardwareInventoryItem[]>(HARDWARE_STORAGE_KEY, DEMO_HARDWARE_INVENTORY);
    currentHw.forEach((item) => {
      if (item.category === 'nfc_chip' || item.category === 'vinyl_sticker') {
        item.stock_available = Math.max(0, item.stock_available - 1);
        item.stock_allocated += 1;
      }
    });
    setLocalItem(HARDWARE_STORAGE_KEY, currentHw);

    return {
      success: true,
      data: {
        success: true,
        tag_code: params.tag_code,
        message: 'Tag activado localmente en mesa y stock descontado.',
      },
    };
  },

  async replaceDamagedTableTag(params: {
    old_tag_code: string;
    new_tag_code: string;
    installer_name?: string;
    reason?: string;
    ticket_id?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('replace_damaged_table_tag', {
          p_old_tag_code: params.old_tag_code.trim().toUpperCase(),
          p_new_tag_code: params.new_tag_code.trim().toUpperCase(),
          p_installer_name: params.installer_name?.trim() || 'Técnico de Campo',
          p_reason: params.reason || 'Desgaste por uso / desengrasante',
          p_ticket_id: params.ticket_id || null,
        });
        if (!error && data) {
          return { success: true, data };
        }
      } catch (e: any) {
        console.warn('RPC replace_damaged_table_tag falló, recurriendo a local:', e.message);
      }
    }

    // Fallback local garantizado
    const tags = getLocalItem<any[]>(STORAGE_KEYS.TAGS, []);
    const oldTag = tags.find((t) => t.tag_code === params.old_tag_code.toUpperCase());
    if (!oldTag) {
      return { success: false, error: 'El tag antiguo no existe en el registro local.' };
    }

    oldTag.physical_condition = 'reemplazado';
    oldTag.is_active = false;
    oldTag.replaced_by_tag_code = params.new_tag_code.toUpperCase();
    oldTag.replacement_reason = params.reason || 'Desgaste por uso';

    const newTag = {
      id: 'tag-' + Date.now(),
      tag_code: params.new_tag_code.toUpperCase(),
      restaurant_id: oldTag.restaurant_id,
      table_identifier: oldTag.table_identifier,
      physical_condition: 'instalado',
      installer_name: params.installer_name || 'Técnico de Campo',
      installed_at: new Date().toISOString(),
      is_active: true,
      scan_count: 0,
      created_at: new Date().toISOString(),
    };
    tags.unshift(newTag);
    setLocalItem(STORAGE_KEYS.TAGS, tags);

    return {
      success: true,
      data: {
        success: true,
        old_tag_code: params.old_tag_code,
        new_tag_code: params.new_tag_code,
        message: 'Reemplazo completado localmente con trazabilidad.',
      },
    };
  },

  /**
   * Genera el archivo vectorial SVG con especificaciones de imprenta:
   * Pliego con marcas de corte, folios correlativos y suaje circular de 60mm
   */
  generatePrintSheetSvg(params: {
    prefix: string;
    start: number;
    end: number;
    batchNumber: string;
  }): string {
    const count = params.end - params.start + 1;
    const cols = 4;
    const itemSizeMm = 60;
    const gapMm = 10;
    const paddingMm = 20;
    const rows = Math.ceil(count / cols);
    const widthMm = paddingMm * 2 + cols * itemSizeMm + (cols - 1) * gapMm;
    const heightMm = paddingMm * 2 + rows * itemSizeMm + (rows - 1) * gapMm + 30;

    let circlesSvg = '';
    let currentNum = params.start;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentNum > params.end) break;
        const x = paddingMm + c * (itemSizeMm + gapMm);
        const y = paddingMm + 30 + r * (itemSizeMm + gapMm);
        const cx = x + itemSizeMm / 2;
        const cy = y + itemSizeMm / 2;
        const tagFolio = `${params.prefix}${String(currentNum).padStart(4, '0')}`;

        circlesSvg += `
          <!-- Item ${tagFolio} -->
          <g id="${tagFolio}">
            <rect x="${x - 2}" y="${y - 2}" width="${itemSizeMm + 4}" height="${itemSizeMm + 4}" fill="#0f172a" rx="4" />
            <circle cx="${cx}" cy="${cy}" r="${itemSizeMm / 2}" fill="#1e293b" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="2,2" />
            <circle cx="${cx}" cy="${cy}" r="27" fill="#0f172a" stroke="#64748b" stroke-width="0.3" />
            <circle cx="${cx}" cy="${cy - 7}" r="11" fill="#2563eb" />
            <path d="M ${cx - 5} ${cy - 7} A 5 5 0 0 1 ${cx + 5} ${cy - 7}" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round" />
            <path d="M ${cx - 8} ${cy - 7} A 8 8 0 0 1 ${cx + 8} ${cy - 7}" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round" />
            <text x="${cx}" y="${cy + 10}" font-family="system-ui, sans-serif" font-size="3.2" font-weight="700" fill="#ffffff" text-anchor="middle">GOOGLE RESEÑAS</text>
            <text x="${cx}" y="${cy + 14}" font-family="system-ui, sans-serif" font-size="2.4" font-weight="500" fill="#94a3b8" text-anchor="middle">ACERCA TU CELULAR</text>
            <rect x="${cx - 14}" y="${cy + 18}" width="28" height="5" rx="1.5" fill="#1e293b" stroke="#334155" stroke-width="0.4" />
            <text x="${cx}" y="${cy + 21.6}" font-family="monospace" font-size="2.6" font-weight="700" fill="#38bdf8" text-anchor="middle">${tagFolio}</text>
            <line x1="${cx - 32}" y1="${cy}" x2="${cx - 29}" y2="${cy}" stroke="#ef4444" stroke-width="0.3" />
            <line x1="${cx + 29}" y1="${cy}" x2="${cx + 32}" y2="${cy}" stroke="#ef4444" stroke-width="0.3" />
            <line x1="${cx}" y1="${cy - 32}" x2="${cx}" y2="${cy - 29}" stroke="#ef4444" stroke-width="0.3" />
            <line x1="${cx}" y1="${cy + 29}" x2="${cx}" y2="${cy + 32}" stroke="#ef4444" stroke-width="0.3" />
          </g>
        `;
        currentNum++;
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm} ${heightMm}" width="${widthMm}mm" height="${heightMm}mm">
  <rect width="100%" height="100%" fill="#ffffff" />
  <g transform="translate(${paddingMm}, 15)">
    <text x="0" y="0" font-family="system-ui, sans-serif" font-size="6" font-weight="800" fill="#0f172a">PLIEGO DE PRODUCCIÓN PARA IMPRENTA - ${params.batchNumber}</text>
    <text x="0" y="6" font-family="system-ui, sans-serif" font-size="3" fill="#64748b">Especificación: Vinil Adhesivo 3M | Suaje Redondo 60mm | Rango: ${params.prefix}${String(params.start).padStart(4, '0')} a ${params.prefix}${String(params.end).padStart(4, '0')} (${count} unidades)</text>
    <text x="0" y="10" font-family="system-ui, sans-serif" font-size="2.6" fill="#0284c7">Línea discontinua azul: Línea de corte / suaje | Cruz roja: Registro de corte óptico</text>
  </g>
  ${circlesSvg}
</svg>`;
  },
};
