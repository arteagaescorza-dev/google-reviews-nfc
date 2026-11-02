import { supabase, isSupabaseConfigured } from '../supabase';
import { getLocalItem, setLocalItem } from './core';

export type ExecutiveEventType = 'scan' | 'hardware' | 'sale' | 'feedback_shield' | 'payment';

export interface ExecutiveEvent {
  id: string;
  type: ExecutiveEventType;
  title: string;
  description: string;
  restaurant_name?: string;
  badge_text: string;
  badge_variant: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
  created_at: string;
  meta?: Record<string, any>;
}

const DEMO_EXECUTIVE_EVENTS: ExecutiveEvent[] = [
  {
    id: 'evt-1',
    type: 'scan',
    title: 'Escaneo NFC en Mesa 12',
    description: 'Comensal abrió menú digital y turnero de mesa vía placa de aluminio.',
    restaurant_name: 'Taquería El Califa Central',
    badge_text: 'Escaneo NFC',
    badge_variant: 'blue',
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: 'evt-2',
    type: 'feedback_shield',
    title: 'Blindaje Activo: Calificación Retenida',
    description: 'Comensal calificó con 2 estrellas por retraso en bebidas. Retenido en buzón privado sin tocar Google Maps.',
    restaurant_name: 'Mariscos La Perla Roma',
    badge_text: 'Blindaje Reputacional',
    badge_variant: 'amber',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: 'evt-3',
    type: 'hardware',
    title: 'Activación In-Situ Exitosa',
    description: 'Técnico de campo vinculó TAG-0342 a Mesa 7. Stock descontado en bodega.',
    restaurant_name: 'Parrilla Argentina La Boca',
    badge_text: 'Hardware In-Situ',
    badge_variant: 'purple',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
  },
  {
    id: 'evt-4',
    type: 'sale',
    title: 'Nuevo Cierre Comercial Ganado',
    description: 'Contrato firmado: Plan Restaurante Pro + Kit 18 Placas NFC.',
    restaurant_name: 'Taquería Los Güeros del Valle',
    badge_text: 'Cierre Comercial',
    badge_variant: 'emerald',
    created_at: new Date(Date.now() - 75 * 60000).toISOString(),
  },
  {
    id: 'evt-5',
    type: 'payment',
    title: 'Pago Recibido en Pasarela Stripe',
    description: 'Suscripción mensual recurrente de $499 MXN liquidada exitosamente.',
    restaurant_name: 'Sushi Zen Condesa',
    badge_text: 'Cobro Stripe',
    badge_variant: 'emerald',
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
  },
  {
    id: 'evt-6',
    type: 'scan',
    title: 'Escaneo QR de Respaldado en Mesa 3',
    description: 'Comensal utilizó cámara QR del vinil 3M para calificar el servicio.',
    restaurant_name: 'Bistro Gourmet Roma',
    badge_text: 'Lectura QR',
    badge_variant: 'blue',
    created_at: new Date(Date.now() - 140 * 60000).toISOString(),
  },
  {
    id: 'evt-7',
    type: 'hardware',
    title: 'Sustitución de Placa por Desgaste',
    description: 'Tag TAG-0018 reemplazado por TAG-0412 en Mesa 2 debido a limpieza química.',
    restaurant_name: 'El Fogón Urbano',
    badge_text: 'Reposición Física',
    badge_variant: 'rose',
    created_at: new Date(Date.now() - 210 * 60000).toISOString(),
  },
];

const STORAGE_EVENTS_KEY = 'superadmin_executive_events_feed';

export const eventsApi = {
  /**
   * Obtiene la lista de eventos ejecutivos recientes para el feed del dashboard
   */
  async getLiveEventsFeed(limit: number = 20): Promise<ExecutiveEvent[]> {
    const localEvents = getLocalItem<ExecutiveEvent[]>(STORAGE_EVENTS_KEY, DEMO_EXECUTIVE_EVENTS);
    return localEvents.slice(0, limit);
  },

  /**
   * Registra un nuevo evento en el feed en vivo
   */
  async recordLiveEvent(event: Omit<ExecutiveEvent, 'id' | 'created_at'>): Promise<ExecutiveEvent> {
    const newEvent: ExecutiveEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const current = getLocalItem<ExecutiveEvent[]>(STORAGE_EVENTS_KEY, DEMO_EXECUTIVE_EVENTS);
    const updated = [newEvent, ...current].slice(0, 50);
    setLocalItem(STORAGE_EVENTS_KEY, updated);

    return newEvent;
  },

  /**
   * Suscribe un callback a eventos en tiempo real si Supabase Realtime está habilitado
   */
  subscribeToLiveEvents(callback: (event: ExecutiveEvent) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel('executive_feed_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'feedback' },
          (payload: any) => {
            const fb = payload.new;
            if (fb && fb.rating < 4) {
              const event: ExecutiveEvent = {
                id: `evt-fb-${fb.id}`,
                type: 'feedback_shield',
                title: 'Alerta de Blindaje: Queja Retenida',
                description: `Calificación de ${fb.rating} estrellas capturada internamente: "${fb.comments || 'Sin comentarios'}"`,
                badge_text: 'Blindaje Activo',
                badge_variant: 'amber',
                created_at: fb.created_at || new Date().toISOString(),
              };
              callback(event);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Error suscribiendo a canal Realtime:', err);
      return () => {};
    }
  },
};

