import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';

interface StripePayoutSettlementBentoProps {
  stripeBalance: number;
  onInstantPayout?: (amount: number) => Promise<boolean>;
}

export const StripePayoutSettlementBento: React.FC<StripePayoutSettlementBentoProps> = ({
  stripeBalance,
  onInstantPayout,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const handleExecutePayout = async () => {
    setTransferring(true);
    try {
      if (onInstantPayout) {
        await onInstantPayout(stripeBalance);
      }
      setModalOpen(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 5000);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {/* Fondo resplandor sutil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-50/60 via-emerald-50/20 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Bóveda de Pasarela & Liquidación
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60">
                  PCI-DSS Nivel 1
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saldo acumulado de suscripciones y pauta publicitaria listo para dispersión
              </p>
            </div>
          </div>
        </div>

        {/* Saldo Disponible */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Saldo Listo para Dispersión SPEI
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ${stripeBalance.toLocaleString('es-MX')}
            </span>
            <span className="text-xs font-bold text-slate-500">MXN</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] gap-2">
            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Corte automático: <strong>Lunes 00:00 hrs</strong></span>
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sin comisiones por dispersión</span>
            </span>
          </div>
        </div>

        {/* Datos de Cuenta Bancaria Registrada */}
        <div className="space-y-2 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400" />
              <div>
                <p className="font-bold text-slate-900">BBVA Bancomer</p>
                <p className="text-[10px] text-slate-400 font-mono">CLABE: 012 180 00412384729 1</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
              Verificada
            </span>
          </div>
        </div>
      </div>

      {/* Botón de Acción Dispersión Anticipada */}
      <div className="pt-2">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Solicitar Dispersión Anticipada SPEI</span>
        </button>
      </div>

      {/* Modal de Confirmación SPEI */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Dispersión Anticipada SPEI
                  </h3>
                  <p className="text-xs text-slate-400">Transferencia interbancaria directa</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 mb-5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Monto a Transferir
                </span>
                <p className="text-2xl font-black text-slate-900">
                  ${stripeBalance.toLocaleString('es-MX')} MXN
                </p>
                <p className="text-[10px] text-slate-500">
                  Destino: BBVA Bancomer (CLABE terminación 7291)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Liquidación Inmediata</span>
                </div>
                <p className="text-blue-800/90 leading-relaxed">
                  El retiro no afectará la facturación recurrente de los restaurantes ni la operación del escudo anti-reseñas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={transferring}
                onClick={handleExecutePayout}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{transferring ? 'Procesando SPEI...' : 'Confirmar Transferencia'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de Éxito */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold">Dispersión SPEI enviada a Banco</p>
            <p className="text-[11px] text-emerald-200 mt-0.5">
              ${stripeBalance.toLocaleString('es-MX')} MXN en tránsito a tu cuenta BBVA.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
