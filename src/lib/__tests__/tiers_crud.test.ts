import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';
import type { CustomTierDefinition } from '../../types';
import { TIERS } from '../constants';

describe('POL-008 & POL-010: Gestion Integral de Tiers Multivertical (CRUD y Archivado)', () => {
  beforeEach(() => {
    const store: Record<string, string> = { nfc_demo_auth: 'true' };
    const mockStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage, dispatchEvent: () => true },
      writable: true,
      configurable: true,
    });
  });

  it('debe contener Tier 5 (Escudo Marca Blanca / Ad-Free) en las definiciones maestras', async () => {
    const tierDefs = await api.getTierDefinitions({ includeArchived: true });
    const tier5 = tierDefs.find((t) => t.tier === 5 || t.badge_label === 'Tier 5');

    expect(tier5).toBeDefined();
    expect(tier5?.price_mxn).toBe(299);
    expect(tier5?.included_features).toContain('feat_ad_free');
    expect(TIERS[5]).toBeDefined();
    expect(TIERS[5].name).toContain('Tier 5');
  });

  it('debe filtrar tiers por giro comercial (vertical_slug)', async () => {
    // 1. Obtener giros de restaurante
    const restaurantTiers = await api.getTierDefinitions({ verticalSlug: 'restaurant' });
    expect(restaurantTiers.length).toBeGreaterThan(0);
    restaurantTiers.forEach((t) => {
      expect(['restaurant', 'all']).toContain(t.vertical_slug);
    });

    // 2. Giro sin tiers especificos todavia retorna tiers universales (vertical_slug === 'all')
    const dentalTiers = await api.getTierDefinitions({ verticalSlug: 'dental' });
    const universalInDental = dentalTiers.filter((t) => t.vertical_slug === 'all');
    expect(universalInDental.length).toBeGreaterThan(0);
  });

  it('debe permitir crear un nuevo Tier comercial enfocado a una vertical (POL-008)', async () => {
    const newDentalTier: Partial<CustomTierDefinition> = {
      tier: 1,
      name: 'Tier 1 Dental: Reseñas & Recepción Ágil',
      badge_label: 'Tier 1 Dental',
      price_mxn: 350,
      description: 'Filtrado inteligente y atención en consultorios médicos y dentales.',
      vertical_slug: 'dental',
      included_features: ['feat_redirect', 'feat_reputation_shield'],
      included_stations: [],
      allowed_categories: [1, 2],
    };

    const createRes = await api.createTierDefinition(newDentalTier);
    expect(createRes.success).toBe(true);
    expect(createRes.data?.id).toBeDefined();
    expect(createRes.data?.vertical_slug).toBe('dental');

    // Comprobar que aparece en el filtrado por giro dental
    const dentalTiers = await api.getTierDefinitions({ verticalSlug: 'dental' });
    const createdFound = dentalTiers.find((t) => t.name === newDentalTier.name);
    expect(createdFound).toBeDefined();
    expect(createdFound?.price_mxn).toBe(350);
  });

  it('debe permitir editar un Tier existente (nombre, precio, funciones)', async () => {
    const allTiers = await api.getTierDefinitions();
    const firstTier = allTiers[0];
    expect(firstTier).toBeDefined();

    const targetId = firstTier.id || String(firstTier.tier);
    const updateRes = await api.updateTierDefinition(targetId, {
      price_mxn: 150,
      description: 'Descripción actualizada para pruebas automatizadas.',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.data?.price_mxn).toBe(150);

    const reloaded = await api.getTierDefinitions();
    const updatedTier = reloaded.find((t) => (t.id ? t.id === targetId : String(t.tier) === targetId));
    expect(updatedTier?.price_mxn).toBe(150);
    expect(updatedTier?.description).toBe('Descripción actualizada para pruebas automatizadas.');
  });

  it('debe permitir archivar y desarchivar un Tier comercial', async () => {
    const allTiers = await api.getTierDefinitions();
    const target = allTiers[1];
    const targetId = target.id || String(target.tier);

    // Archivar
    const archiveRes = await api.archiveTierDefinition(targetId, true);
    expect(archiveRes.success).toBe(true);

    // Sin includeArchived, no debe aparecer
    const activeTiers = await api.getTierDefinitions({ includeArchived: false });
    const notFoundInActive = activeTiers.find((t) => (t.id ? t.id === targetId : String(t.tier) === targetId));
    expect(notFoundInActive).toBeUndefined();

    // Con includeArchived, debe aparecer con is_archived = true
    const withArchived = await api.getTierDefinitions({ includeArchived: true });
    const foundArchived = withArchived.find((t) => (t.id ? t.id === targetId : String(t.tier) === targetId));
    expect(foundArchived?.is_archived).toBe(true);

    // Desarchivar
    await api.archiveTierDefinition(targetId, false);
    const activeAgain = await api.getTierDefinitions({ includeArchived: false });
    const foundAgain = activeAgain.find((t) => (t.id ? t.id === targetId : String(t.tier) === targetId));
    expect(foundAgain).toBeDefined();
    expect(foundAgain?.is_archived).toBe(false);
  });

  it('debe permitir eliminar permanentemente un Tier', async () => {
    // 1. Crear un tier temporal
    const tempTier: Partial<CustomTierDefinition> = {
      tier: 99,
      name: 'Tier Temporal a Eliminar',
      badge_label: 'Tier 99',
      price_mxn: 50,
      vertical_slug: 'general',
    };
    const created = await api.createTierDefinition(tempTier);
    expect(created.success).toBe(true);
    const tempId = created.data?.id!;

    // 2. Eliminar
    const delRes = await api.deleteTierDefinition(tempId);
    expect(delRes.success).toBe(true);

    // 3. Verificar que ya no existe
    const allTiers = await api.getTierDefinitions({ includeArchived: true });
    const found = allTiers.find((t) => t.id === tempId);
    expect(found).toBeUndefined();
  });
});
