import { Capacitor } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from './supabase';

export type NotificationPlatform = 'web' | 'ios' | 'android';

export interface PushSubscriptionRecord {
  id?: string;
  organization_id: string;
  user_id?: string;
  device_token: string;
  platform: NotificationPlatform;
  is_active: boolean;
}

/**
 * Verifica si el navegador o entorno móvil soporta notificaciones
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Obtiene el estado actual de los permisos de notificación
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Solicita permisos de notificación al sistema operativo del teléfono
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('nfc_push_enabled', 'true');
    }
    return permission;
  } catch (err) {
    console.warn('Error solicitando permisos de notificación:', err);
    return 'denied';
  }
}

/**
 * Reproduce una señal acústica distintiva usando el sintetizador Web Audio API (Cero dependencias externas)
 */
export function playAlertSound(type: 'warning' | 'chime' = 'warning'): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'warning') {
      // Tono de alarma urgente bitonal (880Hz -> 440Hz -> 880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.12);
      osc.frequency.setValueAtTime(880, now + 0.24);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Tono suave de confirmación
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('AudioContext no disponible o bloqueado por política de interacción:', e);
  }
}

/**
 * Dispara un patrón de vibración táctil en el teléfono móvil
 */
export function triggerVibration(pattern: number[] = [200, 100, 200, 100, 400]): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.warn('Vibración no soportada:', e);
  }
}

/**
 * Envía una notificación local directa al sistema operativo con sonido y vibración
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  options?: { tag?: string; isUrgent?: boolean; icon?: string }
): Promise<boolean> {
  // Ejecutar vibración y audio
  if (options?.isUrgent) {
    triggerVibration([300, 100, 300, 100, 500]);
    playAlertSound('warning');
  } else {
    triggerVibration([150, 80, 150]);
    playAlertSound('chime');
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Si tenemos Service Worker activo, preferir registration.showNotification
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: options?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: options?.tag || 'nfc-alert',
          data: { url: window.location.href },
        });
        return true;
      }
    }

    // Fallback a constructor directo
    new Notification(title, {
      body,
      icon: options?.icon || '/icons/icon-192x192.png',
      tag: options?.tag || 'nfc-alert',
    });
    return true;
  } catch (err) {
    console.warn('Error mostrando notificación del S.O.:', err);
    return false;
  }
}

/**
 * Escucha en tiempo real quejas de 1-3 estrellas y llamadas urgentes desde Supabase
 */
export function setupRealtimeAlerts(
  organizationId: string,
  onFeedbackAlert?: (data: any) => void,
  onCallAlert?: (data: any) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel(`org-alerts-${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload) => {
          const fb = payload.new;
          if (fb && fb.rating <= 3) {
            playAlertSound('warning');
            sendLocalNotification(
              `🚨 Queja en Mesa (★ ${fb.rating})`,
              `Comensal en mesa reporta: "${fb.comments?.slice(0, 70)}..." Atiéndelo de inmediato.`,
              { isUrgent: true, tag: `feedback-${fb.id}` }
            );
            if (onFeedbackAlert) onFeedbackAlert(fb);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'table_calls' },
        (payload) => {
          const call = payload.new;
          if (call && call.status === 'active') {
            playAlertSound('chime');
            const callTypeLabel = call.call_type === 'waiter' ? 'solicita mesero' : 'pide la cuenta';
            sendLocalNotification(
              `🔔 Llamada de Servicio: ${call.table_number}`,
              `La ${call.table_number} ${callTypeLabel}.`,
              { isUrgent: false, tag: `call-${call.id}` }
            );
            if (onCallAlert) onCallAlert(call);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Error conectando realtime alerts:', err);
    return () => {};
  }
}
