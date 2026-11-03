import React, { useState } from 'react';
import type { TierType, Organization, Restaurant } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface TrialPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetOrg?: Organization | null;
  targetBranch?: Restaurant | null;
  defaultTier?: TierType;
}

export const TrialPeriodModal: React.FC<TrialPeriodModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetOrg,
  targetBranch,
  defaultTier = 3,
}) => {
  const [selectedTier, setSelectedTier] = useState<TierType>(defaultTier);
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 28>(14);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await api.startTrialPeriod({
      organizationId: targetOrg?.id,
      restaurantId: targetBranch?.id,
      trialTier: selectedTier,
      trialDays: selectedDays,
    });

    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo iniciar el periodo de prueba.');
    }
  };

  const isOrgMode = !!targetOrg;
  const title = isOrgMode
    ? `Periodo de Prueba para Organización: ${targetOrg.name}`
    : `Periodo de Prueba para Sucursal: ${targetBranch?.name || 'Sucursal'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Iniciar Periodo de Prueba</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isOrgMode && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
              <span className="font-bold block mb-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Impacto en toda la cuenta corporativa:</span>
              </span>
              Este periodo de prueba elevará temporalmente a <strong>todas las sucursales</strong> supeditadas a esta organización matriz sin alterar sus contratos base.
            </div>
          )}

          {/* Selector de Nivel (Tier) en Prueba */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Selecciona el Nivel (Tier) a Probar</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { tier: 2 as const, label: 'Tier 2', name: 'Escudo Reputacional', color: 'border-blue-200 hover:border-blue-500' },
                { tier: 3 as const, label: 'Tier 3', name: 'Menú Digital + KDS', color: 'border-purple-200 hover:border-purple-500' },
                { tier: 4 as const, label: 'Tier 4', name: 'Red Ads & Analítica', color: 'border-amber-200 hover:border-amber-500' },
              ].map((t) => (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => setSelectedTier(t.tier)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedTier === t.tier
                      ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                      : `bg-slate-50/80 border-slate-200 ${t.color}`
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-900 block">{t.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-1 leading-snug">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Duración: 7, 14 o 28 Días */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Duración del Periodo de Prueba</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 7 as const, label: '7 Días', desc: 'Prueba Express' },
                { days: 14 as const, label: '14 Días', desc: 'Recomendado' },
                { days: 28 as const, label: '28 Días', desc: 'Mes Completo' },
              ].map((d) => (
                <button
                  key={d.days}
                  type="button"
                  onClick={() => setSelectedDays(d.days)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedDays === d.days
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-extrabold text-xs block">{d.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${selectedDays === d.days ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Activar Prueba de {selectedDays} Días</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
