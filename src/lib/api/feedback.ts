import { supabase, isSupabaseConfigured } from '../supabase';
import type { Feedback, FeedbackStatus, SupportTicket, SupportCategory, SupportStatus, Restaurant } from '../../types';
import { STORAGE_KEYS, INITIAL_DEMO_DATA, getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';
import { organizationsApi } from './organizations';
import { restaurantsApi } from './restaurants';

export const feedbackApi = {
/**
   * Registra una queja o feedback privado (1 a 3 estrellas)
   */
  async submitFeedback(data: {
    restaurant_id: string;
    tag_code?: string | null;
    rating: 1 | 2 | 3;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    comments: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('feedback').insert([{
          ...data,
          status: 'new',
          notified_to_owner: false,
        }]);

        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        console.error('Error al enviar feedback a Supabase:', e);
        return { success: false, error: e.message || 'Error al enviar feedback' };
      }
    }

    // Fallback Modo Demo
    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const newEntry: Feedback = {
      id: 'fb-' + Date.now(),
      restaurant_id: data.restaurant_id,
      tag_code: data.tag_code || null,
      rating: data.rating,
      customer_name: data.customer_name || null,
      customer_phone: data.customer_phone || null,
      customer_email: data.customer_email || null,
      comments: data.comments,
      status: 'new',
      notified_to_owner: false,
      created_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.FEEDBACK, [newEntry, ...current]);
    return { success: true };
  },

async getFeedbacks(): Promise<Feedback[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('feedback').select('*, restaurant:restaurants(*)').order('created_at', { ascending: false });
      return data || [];
    }
    const feedbacks = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const restaurants = getLocalItem<Restaurant[]>(STORAGE_KEYS.RESTAURANTS, INITIAL_DEMO_DATA.restaurants);
    return feedbacks.map((f) => ({
      ...f,
      restaurant: restaurants.find((r) => r.id === f.restaurant_id),
    }));
  },

async getMyFeedbacks(restaurantId?: string): Promise<Feedback[]> {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (isSupabaseConfigured && !isDemo) {
      let query = supabase
        .from('feedback')
        .select('*, restaurant:restaurants(*)')
        .order('created_at', { ascending: false });

      if (restaurantId && restaurantId !== 'all') {
        query = query.eq('restaurant_id', restaurantId);
      } else {
        const myRestaurants = await restaurantsApi.getMyRestaurants();
        const ids = myRestaurants.map((r) => r.id);
        if (ids.length === 0) return [];
        query = query.in('restaurant_id', ids);
      }

      const { data } = await query;
      return data || [];
    }

    const myRests = await restaurantsApi.getMyRestaurants();
    const ids = new Set(myRests.map((r) => r.id));
    const all = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const filtered = all.filter((f) => ids.has(f.restaurant_id));
    if (restaurantId && restaurantId !== 'all') {
      return filtered.filter((f) => f.restaurant_id === restaurantId);
    }
    return filtered;
  },

async updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('feedback').update({ status }).eq('id', id);
      return;
    }

    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const updated = current.map((f) => (f.id === id ? { ...f, status } : f));
    setLocalItem(STORAGE_KEYS.FEEDBACK, updated);
  },

async updateFeedbackStatusAndNotes(id: string, status: FeedbackStatus, internal_notes?: string): Promise<void> {
    if (isSupabaseConfigured) {
      const payload: any = { status };
      if (internal_notes !== undefined) payload.internal_notes = internal_notes;
      await supabase.from('feedback').update(payload).eq('id', id);
      return;
    }

    const current = getLocalItem<Feedback[]>(STORAGE_KEYS.FEEDBACK, INITIAL_DEMO_DATA.feedback);
    const updated = current.map((f) => (f.id === id ? { ...f, status, internal_notes } : f));
    setLocalItem(STORAGE_KEYS.FEEDBACK, updated);
  },

/**
   * Obtiene todos los tickets de soporte levantados por locatarios (Superadmin)
   */
  async getSupportTickets(): Promise<SupportTicket[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*, organization:organizations(*), restaurant:restaurants(*)')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.error('Error al cargar tickets de soporte de Supabase:', e);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const orgs = await organizationsApi.getOrganizations();
    const rests = await restaurantsApi.getRestaurants();

    return tickets.map((t) => ({
      ...t,
      organization: orgs.find((o) => o.id === t.organization_id),
      restaurant: rests.find((r) => r.id === t.restaurant_id),
    }));
  },

/**
   * Obtiene los tickets de soporte exclusivos de la organización del locatario
   */
  async getMySupportTickets(): Promise<SupportTicket[]> {
    const membership = await organizationsApi.getMyMembership();
    if (!membership) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*, restaurant:restaurants(*)')
          .eq('organization_id', membership.organization.id)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.error('Error al cargar mis tickets de soporte de Supabase:', e);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const rests = await restaurantsApi.getRestaurants();

    return tickets
      .filter((t) => t.organization_id === membership.organization.id)
      .map((t) => ({
        ...t,
        organization: membership.organization,
        restaurant: rests.find((r) => r.id === t.restaurant_id),
      }));
  },

/**
   * Levanta un nuevo ticket de soporte desde el portal del suscriptor
   */
  async createSupportTicket(data: {
    organization_id: string;
    restaurant_id?: string | null;
    category: SupportCategory;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
    const now = new Date().toISOString();
    const isPortalDemo = typeof window !== 'undefined' && localStorage.getItem('nfc_portal_demo_auth') === 'true';

    if (!isPortalDemo && isSupabaseConfigured) {
      try {
        const payload = sanitizeSupabasePayload({
          ...data,
          status: 'pending',
          created_at: now,
          updated_at: now,
        }, true);

        const { data: inserted, error } = await supabase
          .from('support_tickets')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: inserted };
      } catch (err: any) {
        console.warn('Error al crear ticket en Supabase, aplicando fallback local:', err.message);
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const newTicket: SupportTicket = {
      id: 'ticket-' + Date.now(),
      organization_id: data.organization_id,
      restaurant_id: data.restaurant_id || null,
      category: data.category,
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    setLocalItem(STORAGE_KEYS.SUPPORT_TICKETS, [newTicket, ...tickets]);
    return { success: true, data: newTicket };
  },

/**
   * Actualiza el estado o respuesta del Superadmin a un ticket de soporte
   */
  async updateSupportTicketStatus(
    id: string,
    status: SupportStatus,
    admin_reply?: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const updates: any = { status, updated_at: now };
        if (admin_reply !== undefined) {
          updates.admin_reply = admin_reply.trim() || null;
        }
        const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const tickets = getLocalItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_DEMO_DATA.supportTickets);
    const updated = tickets.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status,
          admin_reply: admin_reply !== undefined ? admin_reply.trim() || null : t.admin_reply,
          updated_at: now,
        };
      }
      return t;
    });

    setLocalItem(STORAGE_KEYS.SUPPORT_TICKETS, updated);
    return { success: true };
  }
};
