import { describe, it, expect, beforeEach } from 'vitest';

// Mock de localStorage y window para entorno Node
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
} as any;
(globalThis as any).window = globalThis;

import { api } from '../api';

describe('Modulo 1: Hardware, Bodega e Imprenta (POL-003)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe obtener las existencias iniciales de chips NTAG213 y viniles 3M', async () => {
    const inventory = await api.getHardwareInventory();
    expect(inventory).toBeDefined();
    expect(inventory.length).toBeGreaterThanOrEqual(2);

    const chip = inventory.find((i) => i.category === 'nfc_chip');
    expect(chip).toBeDefined();
    expect(chip?.stock_available).toBeGreaterThan(0);
    expect(chip?.unit_cost_mxn).toBe(4.50);

    const vinyl = inventory.find((i) => i.category === 'vinyl_sticker');
    expect(vinyl).toBeDefined();
    expect(vinyl?.stock_available).toBeGreaterThan(0);
    expect(vinyl?.unit_cost_mxn).toBe(12.00);
  });

  it('debe registrar una entrada de almacen e incrementar el stock disponible', async () => {
    const beforeInv = await api.getHardwareInventory();
    const chipBefore = beforeInv.find((i) => i.sku === 'CHIP-NTAG213-RAW');
    const prevStock = chipBefore?.stock_available || 0;

    const res = await api.updateHardwareStock('CHIP-NTAG213-RAW', 150);
    expect(res.success).toBe(true);
    expect(res.data?.stock_available).toBe(prevStock + 150);
  });

  it('debe crear un lote de imprenta con rango correlativo y calcular costo total', async () => {
    const res = await api.createPrintBatch({
      supplier_name: 'Imprenta Central CDMX',
      total_units: 250,
      prefix: 'TAG-',
      range_start: 501,
      range_end: 750,
      unit_cost_mxn: 12.00,
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.total_units).toBe(250);
    expect(res.data?.range_start).toBe(501);
    expect(res.data?.range_end).toBe(750);
    expect(res.data?.cost_total_mxn).toBe(3000.00);
    expect(res.data?.batch_number).toContain('LOT-');
  });

  it('debe generar el pliego vectorial SVG con marcas de registro y suaje circular de 60mm', () => {
    const svg = api.generatePrintSheetSvg({
      prefix: 'TAG-',
      start: 501,
      end: 504,
      batchNumber: 'LOT-2026-TEST',
    });

    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
    expect(svg).toContain('LOT-2026-TEST');
    expect(svg).toContain('TAG-0501');
    expect(svg).toContain('TAG-0504');
    expect(svg).toContain('PLIEGO DE PRODUCCIÓN PARA IMPRENTA');
    expect(svg).toContain('Suaje Redondo 60mm');
  });

  it('debe activar un tag express en mesa in-situ y descontar 1 chip y 1 vinil del stock', async () => {
    const restaurants = await api.getRestaurants();
    const testRestaurantId = restaurants[0]?.id || '11111111-1111-1111-1111-111111111111';

    const beforeInv = await api.getHardwareInventory();
    const chipBefore = beforeInv.find((i) => i.category === 'nfc_chip')?.stock_available || 0;
    const vinylBefore = beforeInv.find((i) => i.category === 'vinyl_sticker')?.stock_available || 0;

    const res = await api.activateTableTagInSitu({
      tag_code: 'TAG-9901',
      restaurant_id: testRestaurantId,
      table_identifier: 'Mesa 10 Terraza',
      installer_name: 'Tecnico Pruebas',
    });

    expect(res.success).toBe(true);

    // Verificar tag creado
    const tags = await api.getTags();
    const activatedTag = tags.find((t) => t.tag_code === 'TAG-9901');
    expect(activatedTag).toBeDefined();
    expect(activatedTag?.table_identifier).toBe('Mesa 10 Terraza');

    // Verificar descuento de stock
    const afterInv = await api.getHardwareInventory();
    const chipAfter = afterInv.find((i) => i.category === 'nfc_chip')?.stock_available || 0;
    const vinylAfter = afterInv.find((i) => i.category === 'vinyl_sticker')?.stock_available || 0;
    expect(chipAfter).toBe(chipBefore - 1);
    expect(vinylAfter).toBe(vinylBefore - 1);
  });

  it('debe sustituir una placa desgastada preservando la mesa y trazabilidad', async () => {
    const restaurants = await api.getRestaurants();
    const testRestaurantId = restaurants[0]?.id || '11111111-1111-1111-1111-111111111111';

    // 1. Activar placa inicial
    await api.activateTableTagInSitu({
      tag_code: 'TAG-OLD-01',
      restaurant_id: testRestaurantId,
      table_identifier: 'Mesa 5 Interior',
    });

    // 2. Reemplazar por desgaste
    const replaceRes = await api.replaceDamagedTableTag({
      old_tag_code: 'TAG-OLD-01',
      new_tag_code: 'TAG-NEW-02',
      reason: 'Desgaste químico por desengrasante',
    });

    expect(replaceRes.success).toBe(true);

    const tags = await api.getTags();
    const oldTag = tags.find((t) => t.tag_code === 'TAG-OLD-01');
    const newTag = tags.find((t) => t.tag_code === 'TAG-NEW-02');

    expect((oldTag as any)?.physical_condition).toBe('reemplazado');
    expect(oldTag?.is_active).toBe(false);
    expect((oldTag as any)?.replaced_by_tag_code).toBe('TAG-NEW-02');

    expect(newTag).toBeDefined();
    expect(newTag?.table_identifier).toBe('Mesa 5 Interior');
    expect((newTag as any)?.physical_condition).toBe('instalado');
    expect(newTag?.is_active).toBe(true);
  });
});
