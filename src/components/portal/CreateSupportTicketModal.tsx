import React, { useState } from 'react';
import type { Restaurant, SupportCategory } from '../../types';
import { api } from '../../lib/api';
import { SUPPORT_CATEGORIES } from '../../lib/constants';
import {
  X,
  LifeBuoy,
  Wrench,
  Receipt,
  PlusCircle,
  HelpCircle,
  Store,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  restaurants: Restaurant[];
  onCreated: () => void;
}

const CATEGORY_ICONS: Record<SupportCategory, React.ComponentType<{ className?: string }>> = {
  plate_damaged: Wrench,
  billing: Receipt,
  more_plates: PlusCircle,
  general: HelpCircle,
};

export const CreateSupportTicketModal: React.FC<CreateSupportTicketModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  restaurants,
  onCreated,
}) => {
  const [restaurantId, setRestaurantId] = useState<string>(restaurants[0]?.id || '');
  const [category, setCategory] = useState<SupportCategory>('plate_damaged');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Por favor completa el asunto y detalle de tu solicitud.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await api.createSupportTicket({
      organization_id: organizationId,
      restaurant_id: restaurantId || null,
      category,
      subject: subject.trim(),
      message: message.trim(),
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onCreated();
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Error enviando ticket.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mesa de Ayuda & Soporte B2B</h2>
              <p className="text-xs text-slate-500">Reporta placas dañadas, solicita más tags o apoyo de cuenta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¡Solicitud Enviada con Éxito!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tu ticket ha sido recibido por el equipo técnico. Te responderemos directamente en tu portal y por WhatsApp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Selección de Sucursal */}
            {restaurants.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sucursal Relacionada
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-white"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Selección de Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Motivo de tu Solicitud
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['plate_damaged', 'more_plates', 'billing', 'general'] as SupportCategory[]).map((cat) => {
                  const cfg = SUPPORT_CATEGORIES[cat];
                  const Icon = CATEGORY_ICONS[cat];
                  const isSelected = category === cat;

                  return (
                    <div
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-900">{cfg.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{cfg.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asunto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Asunto Corto *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Placa despegada en Mesa 3, o Pedido de 4 placas extra"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium"
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detalle de lo que necesitas *
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explícanos la situación (ej. El adhesivo se aflojó por la limpieza; necesitamos reposición de placa física para entregarse este viernes)..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium"
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
