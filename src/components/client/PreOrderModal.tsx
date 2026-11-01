import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, QrCode, CheckCircle, ArrowRight, X } from 'lucide-react';
import type { OrderItem } from '../../types';

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folio: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  onPaymentConfirmed: () => void;
}

export const PreOrderModal: React.FC<PreOrderModalProps> = ({
  isOpen,
  onClose,
  folio,
  restaurantName,
  items,
  totalAmount,
  onPaymentConfirmed,
}) => {
  // Temporizador de 15 minutos (900 segundos)
  const [secondsLeft, setSecondsLeft] = useState(900);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(900);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-900 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Paga en caja antes de: {formattedTime}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
              Pre-Comanda de Mostrador
            </span>
            <h2 className="text-3xl font-black text-slate-900">{folio}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acércate a la caja de <strong>{restaurantName}</strong> para pagar.
            </p>
          </div>

          {/* Código QR Fast-Pass para escaneo por el cajero */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
            <QRCodeSVG
              value={`PREORDER:${folio}:${totalAmount}`}
              size={150}
              level="M"
              className="mx-auto"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>El cajero escaneará este código en 1 segundo</span>
          </div>

          {/* Desglose rápido */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1">
            <div className="text-xs font-bold text-slate-700 flex justify-between">
              <span>{items.length} platillo(s) en orden:</span>
              <span className="text-blue-600">${totalAmount.toFixed(2)} MXN</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Aceptan efectivo, terminal bancaria (BBVA, Santander) o tarjeta de crédito.
            </p>
          </div>

          {/* Botón de acción */}
          <button
            onClick={onPaymentConfirmed}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirmar Pago en Caja</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
