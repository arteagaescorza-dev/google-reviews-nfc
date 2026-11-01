import React, { useEffect, useState } from 'react';
import { ChefHat, Bell, CheckCircle2, VolumeX, Sparkles, MapPin } from 'lucide-react';
import { playBuzzerChime, triggerHapticBuzzer } from '../../lib/beeper';

interface BeeperDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  folio: string;
  restaurantName: string;
  isReady: boolean;
  onOrderDelivered?: () => void;
}

export const BeeperDigitalModal: React.FC<BeeperDigitalModalProps> = ({
  isOpen,
  onClose,
  folio,
  restaurantName,
  isReady,
  onOrderDelivered,
}) => {
  const [alarmActive, setAlarmActive] = useState(false);

  useEffect(() => {
    if (isReady && isOpen) {
      setAlarmActive(true);
      playBuzzerChime();
      triggerHapticBuzzer();

      // Repetir alerta cada 5 segundos hasta que el usuario la silencie
      const interval = setInterval(() => {
        playBuzzerChime();
        triggerHapticBuzzer();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setAlarmActive(false);
    }
  }, [isReady, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center transition-all duration-300 ${
          isReady
            ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white animate-pulse'
            : 'bg-white text-slate-900 border border-slate-100'
        }`}
      >
        {isReady ? (
          /* ESTADO 2: ORDEN LISTA PARA RECOGER */
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white shadow-inner">
              <Bell className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="inline-block py-1 px-3 rounded-full bg-white/25 text-xs font-black tracking-widest uppercase mb-1">
                ¡ORDEN LISTA EN BARRA!
              </span>
              <h2 className="text-4xl font-black tracking-tight">{folio}</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Pasa al mostrador de <strong>{restaurantName}</strong> a recoger tu comida.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs text-white/90 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Muestra este número en la barra</span>
            </div>

            <div className="space-y-2 pt-2">
              {alarmActive && (
                <button
                  onClick={() => setAlarmActive(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <VolumeX className="w-4 h-4" />
                  Silenciar alarma sonora
                </button>
              )}

              <button
                onClick={() => {
                  if (onOrderDelivered) onOrderDelivered();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ¡Ya tengo mi comida!
              </button>
            </div>
          </div>
        ) : (
          /* ESTADO 1: EN PREPARACIÓN / COCINANDO */
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ChefHat className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                Cocinando con amor
              </span>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{folio}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu orden se está preparando en <strong>{restaurantName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Beeper Digital Activo</span>
              </div>
              <p className="text-slate-400">
                Puedes pasear o buscar lugar en la plaza. Tu teléfono vibrará y sonará cuando tu platillo esté listo.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cerrar esta ventana (Seguirá sonando)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

