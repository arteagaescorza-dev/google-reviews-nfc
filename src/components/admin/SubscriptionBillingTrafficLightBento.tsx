import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Send,
  CreditCard,
  MessageCircle,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import type { Restaurant } from '../../types';

export interface BillingRecord {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  tier: number;
  is_ad_free: boolean;
  monthly_fee_mxn: number;
  gateway: 'stripe' | 'mercadopago';
  status: 'al_corriente' | 'dunning_dia_3' | 'pausado_dia_7';
  next_billing_date: string;
  last_attempt_date?: string;
}

const DEMO_BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'bil-1',
    restaurant_id: 'rest-califa-1',
    restaurant_name: 'Taquería El Califa Central',
    owner_name: 'Don Rodolfo Garza',
    owner_phone: '55 1234 5678',
    owner_email: 'rodolfo@elcalifa.mx',
    tier: 3,
    is_ad_free: true,
    monthly_fee_mxn: 648,
    gateway: 'stripe',
    status: 'al_corriente',
    next_billing_date: '15 Nov 2026',
  },
  {
    id: 'bil-2',
    restaurant_id: 'rest-boca-2',
    restaurant_name: 'Parrilla Argentina La Boca',
    owner_name: 'Rodrigo Méndez',
    owner_phone: '55 2345 6789',
    owner_email: 'rodrigo@labocaparrilla.mx',
    tier: 3,
    is_ad_free: false,
    monthly_fee_mxn: 499,
    gateway: 'stripe',
    status: 'al_corriente',
    next_billing_date: '18 Nov 2026',
  },
  {
    id: 'bil-3',
    restaurant_id: 'rest-sushi-3',
    restaurant_name: 'Sushi Zen Condesa',
    owner_name: 'Kenji Takahashi',
    owner_phone: '55 3456 7890',
    owner_email: 'kenji@sushizen.mx',
    tier: 2,
    is_ad_free: true,
    monthly_fee_mxn: 248,
    gateway: 'stripe',
    status: 'al_corriente',
    next_billing_date: '20 Nov 2026',
  },
  {
    id: 'bil-4',
    restaurant_id: 'rest-bistro-4',
    restaurant_name: 'Bistro Gourmet Roma',
    owner_name: 'Valeria Serna',
    owner_phone: '55 4567 8901',
    owner_email: 'valeria@bistrogourmet.mx',
    tier: 2,
    is_ad_free: false,
    monthly_fee_mxn: 99,
    gateway: 'mercadopago',
    status: 'dunning_dia_3',
    next_billing_date: '02 Nov 2026',
    last_attempt_date: 'Ayer (Fondo insuficiente)',
  },
  {
    id: 'bil-5',
    restaurant_id: 'rest-fogon-5',
    restaurant_name: 'El Fogón Urbano',
    owner_name: 'Ignacio Ramos',
    owner_phone: '55 5678 9012',
    owner_email: 'ignacio@elfogon.mx',
    tier: 1,
    is_ad_free: false,
    monthly_fee_mxn: 0,
    gateway: 'stripe',
    status: 'al_corriente',
    next_billing_date: 'N/A (Gratuito con Pauta)',
  },
  {
    id: 'bil-6',
    restaurant_id: 'rest-mariscos-6',
    restaurant_name: 'Marisquería El Timón',
    owner_name: 'Clara Estrada',
    owner_phone: '55 6789 0123',
    owner_email: 'clara@eltimon.com',
    tier: 2,
    is_ad_free: false,
    monthly_fee_mxn: 99,
    gateway: 'stripe',
    status: 'pausado_dia_7',
    next_billing_date: '26 Oct 2026',
    last_attempt_date: '28 Oct 2026 (Tarjeta expirada)',
  },
];

interface SubscriptionBillingTrafficLightBentoProps {
  restaurants?: Restaurant[];
  collectionRate?: number;
}

export const SubscriptionBillingTrafficLightBento: React.FC<
  SubscriptionBillingTrafficLightBentoProps
> = ({ collectionRate = 94.4 }) => {
  const [filter, setFilter] = useState<'all' | 'al_corriente' | 'dunning' | 'pausado'>('all');
  const [dunningModal, setDunningModal] = useState<BillingRecord | null>(null);
  const [sentToast, setSentToast] = useState<string | null>(null);

  const filteredRecords = DEMO_BILLING_RECORDS.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'al_corriente') return rec.status === 'al_corriente';
    if (filter === 'dunning') return rec.status === 'dunning_dia_3';
    if (filter === 'pausado') return rec.status === 'pausado_dia_7';
    return true;
  });

  const handleSendDunningWhatsApp = (record: BillingRecord) => {
    setDunningModal(null);
    setSentToast(`Enlace de cobro y recordatorio enviado por WhatsApp a ${record.owner_name}`);
    setTimeout(() => setSentToast(null), 5000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Semáforo de Cobranza & Suscripciones Mensuales
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200/60">
                {collectionRate}% al Corriente
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría de cobros automáticos en Stripe/MercadoPago y protocolo de recuperación Dunning
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos ({DEMO_BILLING_RECORDS.length})
          </button>
          <button
            onClick={() => setFilter('al_corriente')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              filter === 'al_corriente'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Al Corriente
          </button>
          <button
            onClick={() => setFilter('dunning')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              filter === 'dunning'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dunning (Día 3)
          </button>
          <button
            onClick={() => setFilter('pausado')}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              filter === 'pausado'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pausados
          </button>
        </div>
      </div>

      {/* Tabla Ejecutiva Bento */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3.5 font-bold">Sucursal / Razón Social</th>
              <th className="py-2.5 px-3.5 font-bold">Plan & Tarifa</th>
              <th className="py-2.5 px-3.5 font-bold">Pasarela</th>
              <th className="py-2.5 px-3.5 font-bold">Estatus de Cobro</th>
              <th className="py-2.5 px-3.5 font-bold">Próximo Cobro / Último Intento</th>
              <th className="py-2.5 px-3.5 font-bold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRecords.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3.5">
                  <p className="font-bold text-slate-900">{rec.restaurant_name}</p>
                  <p className="text-[11px] text-slate-400">{rec.owner_name} · {rec.owner_phone}</p>
                </td>

                <td className="py-3 px-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900">
                      ${rec.monthly_fee_mxn}
                    </span>
                    <span className="text-[10px] text-slate-400">MXN/mes</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Nivel {rec.tier} {rec.is_ad_free ? '(Sin Ads)' : ''}
                  </span>
                </td>

                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <CreditCard className="w-3 h-3 text-slate-500" />
                    <span>{rec.gateway}</span>
                  </span>
                </td>

                <td className="py-3 px-3.5">
                  {rec.status === 'al_corriente' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Al Corriente</span>
                    </span>
                  ) : rec.status === 'dunning_dia_3' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/70">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Dunning (Día 3)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/70">
                      <X className="w-3 h-3 text-rose-600" />
                      <span>Pausado (Día 7)</span>
                    </span>
                  )}
                </td>

                <td className="py-3 px-3.5">
                  <p className="font-medium text-slate-800">{rec.next_billing_date}</p>
                  {rec.last_attempt_date && (
                    <p className="text-[10px] text-amber-700 mt-0.5">{rec.last_attempt_date}</p>
                  )}
                </td>

                <td className="py-3 px-3.5 text-right">
                  {rec.status === 'dunning_dia_3' ? (
                    <button
                      onClick={() => setDunningModal(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Dunning WhatsApp</span>
                    </button>
                  ) : rec.status === 'pausado_dia_7' ? (
                    <button
                      onClick={() => setDunningModal(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reactivar Cobro</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 flex items-center justify-end gap-1">
                      <FileText className="w-3 h-3 text-slate-300" />
                      <span>CFDI Emitido</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Disparo Dunning por WhatsApp */}
      {dunningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Recordatorio de Pago WhatsApp
                  </h3>
                  <p className="text-xs text-slate-400">
                    {dunningModal.restaurant_name} · {dunningModal.owner_phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDunningModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <p className="text-slate-600">
                Se enviará el siguiente mensaje persuasivo directamente al WhatsApp de{' '}
                <strong>{dunningModal.owner_name}</strong> para actualizar su tarjeta sin romper el servicio físico:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                {`Hola ${dunningModal.owner_name}, detectamos que el cargo mensual de tu suscripción en ${dunningModal.restaurant_name} ($${dunningModal.monthly_fee_mxn} MXN) no pudo completarse.

Para evitar que tu escudo anti-reseñas y menú digital se pausen, actualiza tu método de pago con 1 clic en este enlace seguro:
https://app.tuplataforma.mx/#/portal/login?billing_retry=true

Tus placas NFC siguen activas.`}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDunningModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSendDunningWhatsApp(dunningModal)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Notificación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de confirmación */}
      {sentToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-3 animate-slideUp">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-xs font-bold">{sentToast}</p>
        </div>
      )}
    </div>
  );
};
