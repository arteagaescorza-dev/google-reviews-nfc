import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  ShieldCheck,
  CreditCard,
  Banknote,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { CorporateOrder, CorporatePaymentMethod, OrderItem } from '../../types';
import { api } from '../../lib/api';

interface CorporateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  onOrderSuccess: (order: CorporateOrder) => void;
}

export const CorporateDeliveryModal: React.FC<CorporateDeliveryModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  items,
  totalAmount,
  onOrderSuccess,
}) => {
  // Datos del formulario
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [buildingName, setBuildingName] = useState('Torre Corporativa 1');
  const [floorOffice, setFloorOffice] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'office_delivery' | 'pickup'>('office_delivery');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CorporatePaymentMethod>('card');
  const [cashAmount, setCashAmount] = useState<string>('500');

  // Estado del flujo
  const [step, setStep] = useState<'form' | 'security_pin' | 'confirmed'>('form');
  const [createdOrder, setCreatedOrder] = useState<CorporateOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generador de PIN de Seguridad Anti-Fraude (DT-19)
  const [generatedPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  if (!isOpen) return null;

  // Validación de Límite de Crédito y Fraude
  const handleProceedToPin = () => {
    setErrorMsg(null);
    if (!customerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Por favor ingresa un teléfono celular válido a 10 dígitos.');
      return;
    }
    if (deliveryMode === 'office_delivery' && !floorOffice.trim()) {
      setErrorMsg('Por favor indica tu piso y número de oficina o cubículo.');
      return;
    }

    // Regla de Negocio Anti-Fraude: Clientes nuevos en efectivo máximo $250 MXN
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (paymentMethod === 'cash' && totalAmount > 250 && cleanPhone) {
      setErrorMsg(
        'Por seguridad de pedidos en efectivo a oficinas, el monto máximo es de $250 MXN. Para pedidos mayores, selecciona pago con Terminal Bancaria al entregar.'
      );
      return;
    }

    setStep('security_pin');
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const folio = 'CORP-' + Math.floor(100 + Math.random() * 900);
    const cashNum = paymentMethod === 'cash' ? parseFloat(cashAmount) || totalAmount : null;

    try {
      const res = await api.createCorporateOrder({
        restaurant_id: restaurantId,
        folio,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_mode: deliveryMode,
        building_name: buildingName,
        floor_office: floorOffice,
        delivery_instructions: deliveryInstructions,
        handshake_pin: generatedPin,
        payment_method: paymentMethod,
        cash_change_for: cashNum,
        items,
        total_amount: totalAmount,
        status: 'pending',
      });

      if (res.success && res.data) {
        setCreatedOrder(res.data);
        setStep('confirmed');
        onOrderSuccess(res.data);
      } else {
        setErrorMsg('No se pudo procesar la comanda corporativa. Intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-900 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PASO 1: FORMULARIO DE ENTREGA Y PAGO DIRECTO */}
        {step === 'form' && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Delivery Vecinal a Oficinas</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Pide a {restaurantName}
              </h2>
              <p className="text-xs text-slate-500">
                Cero comisiones de apps (Rappi/DiDi). Cobro 100% directo.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selector de Modalidad */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setDeliveryMode('office_delivery')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  deliveryMode === 'office_delivery'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>A mi Oficina</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('pickup')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  deliveryMode === 'pickup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Paso a Recoger</span>
              </button>
            </div>

            {/* Datos de Entrega */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tu Nombre
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  WhatsApp (Para notificarte llegada)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {deliveryMode === 'office_delivery' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Torre / Edificio
                      </label>
                      <select
                        value={buildingName}
                        onChange={(e) => setBuildingName(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium bg-white"
                      >
                        <option value="Torre Corporativa 1">Torre Reforma 1</option>
                        <option value="Torre Corporativa 2">Torre Virreyes</option>
                        <option value="Torre Corporativa 3">Corporativo Antara</option>
                        <option value="Otro Edificio Vecino">Otro (Indicar abajo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Piso y Oficina
                      </label>
                      <input
                        type="text"
                        value={floorOffice}
                        onChange={(e) => setFloorOffice(e.target.value)}
                        placeholder="Piso 7, Ofic. 702"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Instrucciones de entrega
                    </label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Ej. Dejar con guardia en recepción o subir a recepción interna"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Método de Pago Directo */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Método de Cobro en Oficina
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600 mb-1" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Terminal Bancaria</p>
                    <p className="text-[10px] text-slate-500">BBVA / Santander inalámbrica</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 mb-1" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Efectivo</p>
                    <p className="text-[10px] text-slate-500">Con cambio exacto</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">¿Con cuánto billete pagas?</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <span>$</span>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total y Botón Continuar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                  Total de Orden
                </span>
                <span className="text-xl font-black text-slate-900">${totalAmount.toFixed(2)} MXN</span>
              </div>
              <button
                type="button"
                onClick={handleProceedToPin}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <span>Generar PIN Anti-Fraude</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: BLINDAJE ANTI-FRAUDE CON PIN DE 4 DÍGITOS (DT-19) */}
        {step === 'security_pin' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Blindaje Anti-Fraude Activo
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Tu PIN de Entrega Obligatorio
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Para evitar pedidos fantasma y entregas erróneas en tu torre de oficinas, dicta este PIN al repartidor.
              </p>
            </div>

            {/* Tarjeta del PIN */}
            <div className="p-4 rounded-3xl bg-slate-900 text-white border-2 border-blue-500 shadow-xl max-w-xs mx-auto">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                Handshake PIN de Seguridad
              </span>
              <div className="text-4xl font-mono font-black text-amber-400 tracking-widest">
                {generatedPin}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>La comida no se liberará sin este PIN</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Garantía de Entrega Segura:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                El repartidor te esperará en <strong>{deliveryMode === 'office_delivery' ? floorOffice : 'Recepción/Lobby'}</strong> y validará este código antes de cobrar los <strong>${totalAmount.toFixed(2)} MXN</strong>.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Modificar datos
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando comanda...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CONFIRMACIÓN EXITOSA */}
        {step === 'confirmed' && createdOrder && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                ¡Pedido Enviado a Cocina!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Folio: <strong>{createdOrder.folio}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Destino:</span>
                <span className="font-bold text-slate-900">{createdOrder.building_name} ({createdOrder.floor_office})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Método de cobro:</span>
                <span className="font-bold text-slate-900">
                  {createdOrder.payment_method === 'card' ? 'Terminal Bancaria Física' : `Efectivo (cambio de $${createdOrder.cash_change_for})`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PIN Handshake:</span>
                <span className="font-mono font-bold text-blue-600">{createdOrder.handshake_pin}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                <span>Total a pagar:</span>
                <span className="font-bold text-emerald-600 text-sm">${createdOrder.total_amount.toFixed(2)} MXN</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Te avisaremos por WhatsApp al <strong>{createdOrder.customer_phone}</strong> en cuanto el repartidor salga rumbo a tu torre.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Cerrar y Ver Estatus
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
