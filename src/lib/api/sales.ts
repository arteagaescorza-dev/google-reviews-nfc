import { supabase, isSupabaseConfigured } from '../supabase';
import type { SalesLead, SalesLeadStage } from '../../types';
import { getLocalItem, setLocalItem, sanitizeSupabasePayload } from './core';

const DEMO_SALES_LEADS: SalesLead[] = [
  {
    id: 'lead-1',
    restaurant_name: 'Parrilla Argentina La Boca',
    business_type: 'restaurant',
    contact_name: 'Rodrigo Méndez',
    contact_role: 'Socio Operador',
    phone: '55 1234 5678',
    email: 'contacto@labocaparrilla.mx',
    address: 'Av. Sonora 180, Condesa',
    city: 'CDMX',
    estimated_tables: 24,
    stage: 'cotizacion_enviada',
    deal_mrr_mxn: 499.00,
    hardware_kit_fee_mxn: 2400.00,
    assigned_sales_rep: 'Carlos Vega',
    next_follow_up: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Interesado en escudo de 5 estrellas y comanda en mesa. Kit de 24 placas.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-2',
    restaurant_name: 'Cafetería & Matcha Studio',
    business_type: 'restaurant',
    contact_name: 'Ana Sofía Ruiz',
    contact_role: 'Fundadora',
    phone: '55 9876 5432',
    email: 'anasofia@matchastudio.com',
    address: 'Colima 220, Roma Norte',
    city: 'CDMX',
    estimated_tables: 12,
    stage: 'demo_realizada',
    deal_mrr_mxn: 299.00,
    hardware_kit_fee_mxn: 1200.00,
    assigned_sales_rep: 'Laura Domínguez',
    next_follow_up: new Date(Date.now() + 2 * 86400000).toISOString(),
    notes: 'Quedó encantada con la velocidad del NFC sin descargar app.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-3',
    restaurant_name: 'Taquería Los Güeros del Valle',
    business_type: 'restaurant',
    contact_name: 'Don Ignacio Ramos',
    contact_role: 'Dueño',
    phone: '55 4567 8901',
    email: 'losguerosvalle@gmail.com',
    address: 'Pilares 410, Del Valle',
    city: 'CDMX',
    estimated_tables: 18,
    stage: 'cierre_ganado',
    deal_mrr_mxn: 299.00,
    hardware_kit_fee_mxn: 1800.00,
    assigned_sales_rep: 'Carlos Vega',
    notes: 'Pago recibido. Pendiente agendar visita de técnico para instalación de placas.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lead-4',
    restaurant_name: 'Bistro Francés L’Étoile',
    business_type: 'restaurant',
    contact_name: 'Chef Pierre Dumont',
    contact_role: 'Chef Propietario',
    phone: '55 6789 0123',
    email: 'pierre@letoilecdmx.com',
    address: 'Julio Verne 88, Polanco',
    city: 'CDMX',
    estimated_tables: 30,
    stage: 'prospeccion',
    deal_mrr_mxn: 499.00,
    hardware_kit_fee_mxn: 3000.00,
    assigned_sales_rep: 'Laura Domínguez',
    notes: 'Contacto inicial en frío. Se agendó visita de demostración para el jueves.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export interface WinbackCampaignRecord {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  owner_name: string;
  owner_email: string;
  day_step: number; // 3 o 14
  offer_type: string;
  status: 'programada' | 'enviada' | 'reactivado' | 'expirada';
  sent_at?: string | null;
  created_at: string;
}

export interface WinbackStats {
  totalCampaigns: number;
  activeCampaigns: number;
  rescuedCount: number;
  rescueRatePercent: number;
}

const DEMO_WINBACK_CAMPAIGNS: WinbackCampaignRecord[] = [
  {
    id: 'wb-1',
    restaurant_id: 'rest-demo-1',
    restaurant_name: 'Parrilla La Estancia',
    owner_name: 'Roberto Gómez',
    owner_email: 'roberto@laestancia.mx',
    day_step: 3,
    offer_type: 'perdida_escudo',
    status: 'enviada',
    sent_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'wb-2',
    restaurant_id: 'rest-demo-2',
    restaurant_name: 'Marisquería El Timón',
    owner_name: 'Clara Estrada',
    owner_email: 'clara@eltimon.com',
    day_step: 14,
    offer_type: 'descuento_30_vitalicio',
    status: 'reactivado',
    sent_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'wb-3',
    restaurant_id: 'rest-demo-3',
    restaurant_name: 'Trattoria Bella Napoli',
    owner_name: 'Gianluca Conti',
    owner_email: 'gianluca@bellanapoli.mx',
    day_step: 3,
    offer_type: 'perdida_escudo',
    status: 'programada',
    sent_at: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export interface SalesPipelineSummary {
  totalLeads: number;
  activeProspects: number;
  totalPipelineMrr: number;
  totalHardwareUpfront: number;
  wonLeads: number;
  wonMrr: number;
  conversionRatePercent: number;
  byStage: Record<SalesLeadStage, number>;
}

export const salesApi = {
  /**
   * Obtiene la lista completa de prospectos en el pipeline comercial B2B
   */
  async getSalesLeads(): Promise<SalesLead[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sales_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as SalesLead[];
        }
      } catch (err) {
        console.warn('Error consultando sales_leads en Supabase, utilizando fallback local:', err);
      }
    }

    return getLocalItem<SalesLead[]>('crm_sales_leads', DEMO_SALES_LEADS);
  },

  /**
   * Obtiene el resumen consolidado de métricas del pipeline de ventas
   */
  async getSalesPipelineSummary(): Promise<SalesPipelineSummary> {
    const leads = await salesApi.getSalesLeads();

    const byStage: Record<SalesLeadStage, number> = {
      prospeccion: 0,
      demo_agendada: 0,
      demo_realizada: 0,
      cotizacion_enviada: 0,
      cierre_ganado: 0,
      instalacion_pendiente: 0,
      instalado_activo: 0,
      cerrado_perdido: 0,
    };

    let totalPipelineMrr = 0;
    let totalHardwareUpfront = 0;
    let wonLeads = 0;
    let wonMrr = 0;
    let activeProspects = 0;

    for (const lead of leads) {
      if (byStage[lead.stage] !== undefined) {
        byStage[lead.stage]++;
      }

      if (['prospeccion', 'demo_agendada', 'demo_realizada', 'cotizacion_enviada'].includes(lead.stage)) {
        activeProspects++;
        totalPipelineMrr += Number(lead.deal_mrr_mxn) || 0;
        totalHardwareUpfront += Number(lead.hardware_kit_fee_mxn) || 0;
      }

      if (['cierre_ganado', 'instalacion_pendiente', 'instalado_activo'].includes(lead.stage)) {
        wonLeads++;
        wonMrr += Number(lead.deal_mrr_mxn) || 0;
      }
    }

    const totalResolved = wonLeads + (byStage.cerrado_perdido || 0);
    const conversionRatePercent = totalResolved > 0
      ? parseFloat(((wonLeads / totalResolved) * 100).toFixed(1))
      : (leads.length > 0 ? parseFloat(((wonLeads / leads.length) * 100).toFixed(1)) : 25.0);

    return {
      totalLeads: leads.length,
      activeProspects,
      totalPipelineMrr,
      totalHardwareUpfront,
      wonLeads,
      wonMrr,
      conversionRatePercent,
      byStage,
    };
  },

  /**
   * Crea un nuevo prospecto de venta en el pipeline
   */
  async createSalesLead(leadData: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>): Promise<SalesLead> {
    const newLead: SalesLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = sanitizeSupabasePayload(newLead);
        const { data, error } = await supabase
          .from('sales_leads')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return data as SalesLead;
        }
      } catch (err) {
        console.warn('Error insertando lead en Supabase, guardando en local:', err);
      }
    }

    const current = getLocalItem<SalesLead[]>('crm_sales_leads', DEMO_SALES_LEADS);
    const updated = [newLead, ...current];
    setLocalItem('crm_sales_leads', updated);
    return newLead;
  },

  /**
   * Actualiza la etapa de un prospecto (Kanban drag & drop o selección manual)
   */
  async updateSalesLeadStage(leadId: string, newStage: SalesLeadStage, notes?: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {
          stage: newStage,
          updated_at: new Date().toISOString(),
        };
        if (notes) updatePayload.notes = notes;

        const { error } = await supabase
          .from('sales_leads')
          .update(updatePayload)
          .eq('id', leadId);

        if (!error) return true;
      } catch (err) {
        console.warn('Error actualizando lead en Supabase, aplicando local:', err);
      }
    }

    const current = getLocalItem<SalesLead[]>('crm_sales_leads', DEMO_SALES_LEADS);
    const updated = current.map((l) => (l.id === leadId ? { ...l, stage: newStage, notes: notes || l.notes, updated_at: new Date().toISOString() } : l));
    setLocalItem('crm_sales_leads', updated);
    return true;
  },

  /**
   * Obtiene la lista de campañas de Win-Back activas e históricas
   */
  async getWinbackCampaigns(): Promise<WinbackCampaignRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('winback_campaign_logs')
          .select('*')
          .order('sent_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as WinbackCampaignRecord[];
        }
      } catch (err) {
        console.warn('Error consultando winback_campaign_logs en Supabase, usando local:', err);
      }
    }

    return getLocalItem<WinbackCampaignRecord[]>('crm_winback_campaigns', DEMO_WINBACK_CAMPAIGNS);
  },

  /**
   * Obtiene las métricas de recaptura y efectividad de Win-Back
   */
  async getWinbackStats(): Promise<WinbackStats> {
    const campaigns = await salesApi.getWinbackCampaigns();
    const rescuedCount = campaigns.filter((c) => c.status === 'reactivado').length;
    const total = campaigns.length;
    const rescueRatePercent = total > 0 ? parseFloat(((rescuedCount / total) * 100).toFixed(1)) : 33.3;

    return {
      totalCampaigns: total,
      activeCampaigns: campaigns.filter((c) => ['programada', 'enviada'].includes(c.status)).length,
      rescuedCount,
      rescueRatePercent,
    };
  },

  /**
   * Dispara o registra el envío manual o automatizado de un correo de Win-Back
   */
  async triggerWinbackEmail(campaignId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('winback_campaign_logs')
          .update({
            status: 'enviada',
            sent_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        if (!error) return true;
      } catch (err) {
        console.warn('Error actualizando winback_campaign_logs en Supabase, usando local:', err);
      }
    }

    const current = getLocalItem<WinbackCampaignRecord[]>('crm_winback_campaigns', DEMO_WINBACK_CAMPAIGNS);
    const updated = current.map((c) =>
      c.id === campaignId
        ? { ...c, status: 'enviada' as const, sent_at: new Date().toISOString() }
        : c
    );
    setLocalItem('crm_winback_campaigns', updated);
    return true;
  },

  /**
   * Registra una nueva campaña de Win-back tras la baja de un restaurante
   */
  async scheduleWinbackCampaign(
    restaurantId: string,
    restaurantName: string,
    ownerName: string,
    ownerEmail: string,
    dayStep: 3 | 14 = 3
  ): Promise<WinbackCampaignRecord> {
    const newCampaign: WinbackCampaignRecord = {
      id: `wb-${Date.now()}`,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      owner_name: ownerName,
      owner_email: ownerEmail,
      day_step: dayStep,
      offer_type: dayStep === 3 ? 'perdida_escudo' : 'descuento_30_vitalicio',
      status: 'programada',
      sent_at: null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = sanitizeSupabasePayload(newCampaign);
        const { data, error } = await supabase
          .from('winback_campaign_logs')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return data as WinbackCampaignRecord;
        }
      } catch (err) {
        console.warn('Error insertando winback_campaign_log en Supabase, guardando local:', err);
      }
    }

    const current = getLocalItem<WinbackCampaignRecord[]>('crm_winback_campaigns', DEMO_WINBACK_CAMPAIGNS);
    const updated = [newCampaign, ...current];
    setLocalItem('crm_winback_campaigns', updated);
    return newCampaign;
  },
};
