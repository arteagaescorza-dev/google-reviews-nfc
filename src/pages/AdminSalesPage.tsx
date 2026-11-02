import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { SalesKanbanBento } from '../components/admin/SalesKanbanBento';
import { WinbackCampaignsBento } from '../components/admin/WinbackCampaignsBento';
import { LocalAdsMetricsBento } from '../components/admin/LocalAdsMetricsBento';
import type { SalesLead, SalesLeadStage } from '../types';
import type { WinbackCampaignRecord, WinbackStats } from '../lib/api/sales';

export const AdminSalesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [campaigns, setCampaigns] = useState<WinbackCampaignRecord[]>([]);
  const [winbackStats, setWinbackStats] = useState<WinbackStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    rescuedCount: 0,
    rescueRatePercent: 0,
  });
  const [adsMetrics, setAdsMetrics] = useState({
    totalImpressions: 28450,
    totalClicks: 1140,
    averageCtr: 4.0,
    activeCampaigns: 4,
    couponsRedeemed: 48,
    adRevenue: 18500,
  });

  const loadData = useCallback(async () => {
    try {
      const [leadsData, campaignsData, statsData, execMetrics] = await Promise.all([
        api.getSalesLeads(),
        api.getWinbackCampaigns(),
        api.getWinbackStats(),
        api.getGlobalExecutiveMetrics(),
      ]);

      setLeads(leadsData);
      setCampaigns(campaignsData);
      setWinbackStats(statsData);

      if (execMetrics) {
        setAdsMetrics({
          totalImpressions: execMetrics.totalImpressions || 28450,
          totalClicks: execMetrics.totalClicks || 1140,
          averageCtr: execMetrics.averageCtr || 4.0,
          activeCampaigns: execMetrics.activeCampaignsCount || 4,
          couponsRedeemed: 48,
          adRevenue: execMetrics.finances?.adRevenue || 18500,
        });
      }
    } catch (err) {
      console.error('Error cargando datos del módulo de ventas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMoveStage = async (leadId: string, newStage: SalesLeadStage) => {
    try {
      await api.updateSalesLeadStage(leadId, newStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
      );
    } catch (err) {
      console.error('Error actualizando etapa del lead:', err);
    }
  };

  const handleCreateLead = async (
    newLeadData: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const created = await api.createSalesLead(newLeadData);
      setLeads((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error registrando lead:', err);
    }
  };

  const handleTriggerEmail = async (campaignId: string) => {
    try {
      await api.triggerWinbackEmail(campaignId);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, status: 'enviada', sent_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Error disparando correo de winback:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        <p>Cargando Pipeline de Ventas y Recaptura...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Encabezado General Bento Light */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold tracking-wider uppercase border border-blue-100">
            Pipeline Comercial & Retención
          </span>
          <span className="text-xs text-slate-400">Embudos B2B y Recaptura Automatizada</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ventas & Pipeline Comercial B2B
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitoreo de prospección, demostraciones de placas NFC, cotizaciones de kit y campañas Win-Back
        </p>
      </div>

      {/* Fila 1: Tablero Kanban (UI-VT-01) */}
      <SalesKanbanBento
        leads={leads}
        onMoveStage={handleMoveStage}
        onCreateLead={handleCreateLead}
      />

      {/* Fila 2: Win-Back (UI-VT-02) y Métricas de Pauta (UI-VT-03) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinbackCampaignsBento
          campaigns={campaigns}
          stats={winbackStats}
          onTriggerEmail={handleTriggerEmail}
        />

        <LocalAdsMetricsBento
          totalImpressions={adsMetrics.totalImpressions}
          totalClicks={adsMetrics.totalClicks}
          averageCtr={adsMetrics.averageCtr}
          activeCampaigns={adsMetrics.activeCampaigns}
          couponsRedeemed={adsMetrics.couponsRedeemed}
          adRevenue={adsMetrics.adRevenue}
        />
      </div>
    </div>
  );
};
