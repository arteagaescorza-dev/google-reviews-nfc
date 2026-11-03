import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';
import type { BusinessVertical } from '../../types';

describe('POL-008 & POL-010: CRUD de Giros Comerciales (Business Verticals) e Hidratación Dinámica de Tiers', () => {
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

  it('debe obtener el catálogo universal de giros comerciales con sus features y estaciones tipificadas', async () => {
    const verticals = await api.getBusinessVerticals();
    expect(verticals.length).toBeGreaterThanOrEqual(7);

    // Verificar giro de restaurante
    const restaurant = verticals.find((v) => v.slug === 'restaurant');
    expect(restaurant).toBeDefined();
    expect(restaurant?.unit_label).toBe('Mesa');
    expect(restaurant?.show_kds).toBe(true);
    expect(restaurant?.available_features?.length).toBeGreaterThanOrEqual(10);
    expect(restaurant?.available_stations?.length).toBeGreaterThanOrEqual(8);

    // Verificar giro médico / dental
    const dental = verticals.find((v) => v.slug === 'dental');
    expect(dental).toBeDefined();
    expect(dental?.unit_label).toBe('Gabinete / Consultorio');
    expect(dental?.unit_plural).toBe('Consultorios');
    expect(dental?.show_kds).toBe(false);
    expect(dental?.available_features?.length).toBeGreaterThanOrEqual(8);
    expect(dental?.available_stations?.length).toBeGreaterThanOrEqual(2);

    const featIds = dental?.available_features?.map((f) => f.id) || [];
    expect(featIds).toContain('post_care_catalog');
    expect(featIds).toContain('emergency_whatsapp');

    const stationIds = dental?.available_stations?.map((s) => s.id) || [];
    expect(stationIds).toContain('station-doctor-gabinete');
  });

  it('debe permitir crear un nuevo giro comercial personalizado (ej. Veterinaria) con unidades y features', async () => {
    const createRes = await api.createBusinessVertical({
      name: 'Clínica Veterinaria & Hospital de Mascotas',
      slug: 'veterinaria',
      unit_label: 'Consultorio / Jaula',
      unit_plural: 'Consultorios & Jaulas',
      show_kds: false,
      show_floor_staff: false,
      show_hostess: true,
      catalog_title: 'Carnet de Vacunación & Cuidados',
      catalog_subtitle: 'Historial médico veterinario y farmacia pet',
      action_primary: 'Llamar Veterinario',
      action_secondary: 'WhatsApp Urgencias 24h',
      feedback_question: '¿Cómo fue la atención a tu mascota hoy?',
      available_features: [
        { id: 'pet_vaccine_card', name: 'Carnet Digital de Vacunas', description: 'Registro de vacunas y desparasitaciones.' },
        { id: 'vet_emergency', name: 'WhatsApp Urgencias Veterinarias 24h', description: 'Atención a intoxicaciones o accidentes.' },
        { id: 'direct_redirect', name: 'Enlace Directo a Google Reviews', description: 'Reseñas de dueños de mascotas felices.' }
      ],
      available_stations: [
        { id: 'station-vet-recepcion', name: 'Recepción & Triaje Pet', roleName: 'Recepcionista Veterinario', description: 'Pesaje y asignación de consultorio.' },
        { id: 'station-vet-quirofano', name: 'Consultorio / Quirófano', roleName: 'Médico Veterinario', description: 'Terminal de atención y recetas pet.' }
      ]
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    expect(createRes.data?.slug).toBe('veterinaria');
    expect(createRes.data?.unit_label).toBe('Consultorio / Jaula');
    expect(createRes.data?.available_features?.length).toBe(3);
    expect(createRes.data?.available_stations?.length).toBe(2);

    const all = await api.getBusinessVerticals();
    const found = all.find((v) => v.slug === 'veterinaria');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Clínica Veterinaria & Hospital de Mascotas');
  });

  it('debe permitir actualizar un giro comercial (modificar unidades y añadir features)', async () => {
    const verticals = await api.getBusinessVerticals();
    const gym = verticals.find((v) => v.slug === 'gym');
    expect(gym).toBeDefined();

    const updateRes = await api.updateBusinessVertical(gym!.id, {
      unit_label: 'Estación de Entrenamiento',
      unit_plural: 'Estaciones de Entrenamiento',
      available_features: [
        ...(gym!.available_features || []),
        { id: 'crossfit_timer', name: 'Cronómetro WOD & Tabata', description: 'Temporizador oficial de series en la placa de la estación.' }
      ]
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.data?.unit_label).toBe('Estación de Entrenamiento');
    expect(updateRes.data?.available_features?.some((f) => f.id === 'crossfit_timer')).toBe(true);
  });

  it('debe permitir eliminar un giro comercial sin romper el catálogo general', async () => {
    const createRes = await api.createBusinessVertical({
      name: 'Giro Temporal para Prueba',
      slug: 'giro-temporal-test'
    });
    expect(createRes.success).toBe(true);

    const deleteRes = await api.deleteBusinessVertical(createRes.data!.id);
    expect(deleteRes.success).toBe(true);

    const remaining = await api.getBusinessVerticals();
    expect(remaining.some((v) => v.id === createRes.data!.id)).toBe(false);
  });

  it('debe verificar la hidratación dinámica de features y estaciones según el giro comercial', async () => {
    const verticals = await api.getBusinessVerticals();
    
    // Función de resolución de características por vertical (simula la lógica de AdminTiersPage y TierFormModal)
    const resolveVerticalCapabilities = (verticalSlug: string, list: BusinessVertical[]) => {
      const v = list.find((item) => item.slug === verticalSlug) || list.find((item) => item.slug === 'restaurant');
      return {
        features: v?.available_features || [],
        stations: v?.available_stations || [],
        unitLabel: v?.unit_label || 'Unidad'
      };
    };

    // 1. Hidratación para Dental
    const dentalCaps = resolveVerticalCapabilities('dental', verticals);
    expect(dentalCaps.unitLabel).toBe('Gabinete / Consultorio');
    expect(dentalCaps.features.some((f) => f.id === 'emergency_whatsapp')).toBe(true);
    // Un consultorio dental NO debe tener pantallas de cocina KDS por defecto
    expect(dentalCaps.stations.some((s) => s.id === 'station-cocina-caliente')).toBe(false);
    expect(dentalCaps.stations.some((s) => s.id === 'station-doctor-gabinete')).toBe(true);

    // 2. Hidratación para Restaurante
    const restCaps = resolveVerticalCapabilities('restaurant', verticals);
    expect(restCaps.unitLabel).toBe('Mesa');
    expect(restCaps.features.some((f) => f.id === 'digital_menu')).toBe(true);
    expect(restCaps.stations.some((s) => s.id === 'station-cocina-caliente')).toBe(true);

    // 3. Hidratación para Barbería
    const barberCaps = resolveVerticalCapabilities('barberia', verticals);
    expect(barberCaps.unitLabel).toBe('Sillón / Estación');
    expect(barberCaps.features.some((f) => f.id === 'haircut_catalog')).toBe(true);
    expect(barberCaps.stations.some((s) => s.id === 'station-barber-sillon')).toBe(true);
  });
});
