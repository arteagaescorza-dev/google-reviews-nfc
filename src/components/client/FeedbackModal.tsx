import React, { useState } from 'react';
import { api } from '../../lib/api';
import { ensureAbsoluteUrl } from '../../lib/utils';
import { Star, CheckCircle, X, Send, AlertTriangle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  googleReviewUrl: string;
  tagCode?: string | null;
  rating: 1 | 2 | 3;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  googleReviewUrl,
  tagCode,
  rating,
}) => {
  const [comments, setComments] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setErrorMsg('Por favor escribe tu comentario para ayudarnos a mejorar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await api.submitFeedback({
      restaurant_id: restaurantId,
      tag_code: tagCode,
      rating,
      customer_name: name.trim() || undefined,
      customer_phone: phone.trim() || undefined,
      comments: comments.trim(),
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsSubmitted(true);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al enviar. Intenta nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Encabezado con botón de cerrar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Buzón Directo a Gerencia
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-scaleUp">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Mensaje Enviado a Gerencia!</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
              Apreciamos sinceramente tu honestidad. La administración de {restaurantName} revisará tu caso para tomar acciones de inmediato.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-2">
                  ({rating} de 5 estrellas)
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {rating === 1
                  ? 'Lamentamos mucho tu mala experiencia'
                  : '¿Cómo podemos mejorar tu visita?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu mensaje es 100% privado y llegará directamente al encargado del establecimiento.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ¿Qué ocurrió o qué debemos cambiar? <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Cuéntanos con detalle (comida, servicio, tiempo de espera, etc.)..."
                className="w-full p-3.5 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tu nombre (opcional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Para que gerencia te contacte"
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enviando reporte...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar mensaje a gerencia</span>
                </>
              )}
            </button>

            {/* Enlace de escape por política de Google */}
            <div className="text-center pt-2">
              <a
                href={ensureAbsoluteUrl(googleReviewUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                ¿Aún así prefieres publicar tu opinión en Google? Continuar a Google
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
