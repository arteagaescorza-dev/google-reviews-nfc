import { supabase, isSupabaseConfigured } from './supabase';

export type RealtimeConnectionStatus = 'connected' | 'reconnecting' | 'offline';

/**
 * Suscribe una estación operativa a los cambios de comandas de su restaurante vía Supabase Realtime (WebSockets)
 */
export function subscribeToRestaurantOrders(
  restaurantId: string,
  onUpdate: () => void | Promise<void>,
  onStatusChange?: (status: RealtimeConnectionStatus) => void
): () => void {
  if (!isSupabaseConfigured || !supabase || !restaurantId) {
    if (onStatusChange) onStatusChange('connected');
    return () => {};
  }

  try {
    if (onStatusChange) onStatusChange('connected');
    const channelName = `realtime_orders_${restaurantId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe((status) => {
        if (!onStatusChange) return;
        if (status === 'SUBSCRIBED') {
          onStatusChange('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          onStatusChange('reconnecting');
        } else if (status === 'CLOSED') {
          onStatusChange('offline');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error al remover canal de comandas Realtime:', err);
      }
    };
  } catch (err) {
    console.warn('Error al inicializar suscripción Realtime de órdenes:', err);
    if (onStatusChange) onStatusChange('offline');
    return () => {};
  }
}

/**
 * Suscribe una estación operativa a los llamados de mesero y solicitudes de cuenta vía Supabase Realtime
 */
export function subscribeToRestaurantCalls(
  restaurantId: string,
  onUpdate: (call?: any) => void | Promise<void>,
  onStatusChange?: (status: RealtimeConnectionStatus) => void
): () => void {
  if (!isSupabaseConfigured || !supabase || !restaurantId) {
    if (onStatusChange) onStatusChange('connected');
    return () => {};
  }

  try {
    if (onStatusChange) onStatusChange('connected');
    const channelName = `realtime_calls_${restaurantId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_calls',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload: any) => {
          onUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        if (!onStatusChange) return;
        if (status === 'SUBSCRIBED') {
          onStatusChange('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          onStatusChange('reconnecting');
        } else if (status === 'CLOSED') {
          onStatusChange('offline');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('Error al remover canal de llamados Realtime:', err);
      }
    };
  } catch (err) {
    console.warn('Error al inicializar suscripción Realtime de llamados:', err);
    if (onStatusChange) onStatusChange('offline');
    return () => {};
  }
}
