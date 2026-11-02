import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldAlert,
  Tag,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import type { WinbackCampaignRecord, WinbackStats } from '../../lib/api/sales';
import { generateWinbackEmail } from '../../lib/winback';

interface WinbackCampaignsBentoProps {
  campaigns: WinbackCampaignRecord[];
  stats: WinbackStats;
  onTriggerEmail: (campaignId: string) => Promise<void>;
}

export const WinbackCampaignsBento: React.FC<WinbackCampaignsBentoProps> = ({
  campaigns,
  stats,
  onTriggerEmail,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<{
    campaign: WinbackCampaignRecord;
    email: ReturnType<typeof generateWinbackEmail>;
  } | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const handleOpenPreview = (campaign: WinbackCampaignRecord) => {
    const step = campaign.day_step === 3 ? 'day_3' : 'day_14';
    const emailData = generateWinbackEmail(step, campaign.restaurant_name, campaign.owner_name);
    setSelectedPreview({ campaign, email: emailData });
  };

  const handleTrigger = async (campaignId: string) => {
    setTriggeringId(campaignId);
    try {
      await onTriggerEmail(campaignId);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Recaptura Automatizada (Win-Back)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/60">
                  Protocolo POL-004
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Secuencia en 2 etapas: Día 3 (Pérdida de Escudo) y Día 14 (30% OFF Vitalicio)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tasa de Rescate:</span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200/60">
              {stats.rescueRatePercent}% Reactivados
            </span>
          </div>
        </div>

        {/* Resumen Superior de Indicadores */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              En Campaña
            </span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{stats.activeCampaigns}</p>
            <p className="text-[10px] text-slate-500">Locales en seguimiento</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Reactivados
            </span>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{stats.rescuedCount}</p>
            <p className="text-[10px] text-slate-500">Rescatados con éxito</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Histórico
            </span>
            <p className="text-lg font-black text-slate-700 mt-0.5">{stats.totalCampaigns}</p>
            <p className="text-[10px] text-slate-500">Bajas gestionadas</p>
          </div>
        </div>

        {/* Lista de Campañas */}
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {camp.restaurant_name}
                  </span>
                  <span className="text-[11px] text-slate-500">({camp.owner_name})</span>

                  {camp.day_step === 3 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/60">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Día 3: Pérdida Escudo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60">
                      <Tag className="w-3 h-3 text-purple-600" />
                      <span>Día 14: 30% OFF</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Correo destinatario: <span className="font-mono text-slate-700">{camp.owner_email}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {camp.status === 'reactivado' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reactivado</span>
                  </span>
                ) : camp.status === 'enviada' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enviado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Programada</span>
                  </span>
                )}

                <button
                  onClick={() => handleOpenPreview(camp)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                  title="Ver plantilla de correo"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {camp.status === 'programada' && (
                  <button
                    onClick={() => handleTrigger(camp.id)}
                    disabled={triggeringId === camp.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{triggeringId === camp.id ? 'Enviando...' : 'Enviar'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Previsualización de Correo Persuasivo */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Previsualización de Correo Win-Back
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedPreview.campaign.restaurant_name} · Paso {selectedPreview.campaign.day_step === 3 ? 'Día 3' : 'Día 14'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px]">ASUNTO:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPreview.email.subject}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                {selectedPreview.email.plainText}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Copia redactada para máxima conversión</span>
              </span>
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

