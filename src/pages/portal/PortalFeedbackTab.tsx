import React, { useState } from 'react';
import type { Feedback, FeedbackStatus, Restaurant } from '../../types';
import { api } from '../../lib/api';
import {
  Star,
  MessageCircle,
  Clock,
  CheckCircle2,
  FileText,
  Save,
} from 'lucide-react';

interface PortalFeedbackTabProps {
  feedbacks: Feedback[];
  restaurants: Restaurant[];
  onRefresh: () => void;
}

export const PortalFeedbackTab: React.FC<PortalFeedbackTabProps> = ({
  feedbacks,
  restaurants,
  onRefresh,
}) => {
  // Por defecto mostrar 'new' (Pendientes) para Inbox Zero
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('new');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [resolvedToast, setResolvedToast] = useState<string | null>(null);

  const filtered = feedbacks.filter((f) => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    await api.updateFeedbackStatusAndNotes(id, newStatus);
    if (newStatus === 'resolved') {
      setResolvedToast('¡Queja resuelta y archivada! La puedes consultar en el filtro de Resueltas.');
      setTimeout(() => setResolvedToast(null), 4000);
    }
    onRefresh();
  };

  const handleStartEditNote = (f: Feedback) => {
    setEditingNotesId(f.id);
    setNotesDraft(f.internal_notes || '');
  };

  const handleSaveNote = async (id: string, currentStatus: FeedbackStatus) => {
    setIsSavingNote(true);
    await api.updateFeedbackStatusAndNotes(id, currentStatus, notesDraft);
    setIsSavingNote(false);
    setEditingNotesId(null);
    onRefresh();
  };

  const getCleanPhone = (phone?: string | null) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  const getWhatsAppLink = (f: Feedback) => {
    const cleanPhone = getCleanPhone(f.customer_phone);
    if (!cleanPhone) return '';

    const restaurant = restaurants.find((r) => r.id === f.restaurant_id) || f.restaurant;
    const restName = restaurant?.brand_name || restaurant?.name || 'nuestro restaurante';
    const customerName = f.customer_name ? f.customer_name.trim() : 'Estimado cliente';
    const mesaText = f.tag_code ? ` en la mesa (${f.tag_code})` : '';

    const message = `Hola ${customerName}, te saluda la gerencia de ${restName}. Leímos tu opinión sobre tu visita${mesaText} y lamentamos mucho lo ocurrido con tu experiencia. Queremos ofrecerte una disculpa sincera y platicar contigo para compensarte. ¿En qué momento podríamos llamarte?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-4">
      {/* Encabezado y Filtros */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Buzón de Quejas Privadas</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
            {feedbacks.length}
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Calificaciones de 1 a 3 estrellas contenidas internamente antes de dañar tu ficha en Google.
        </p>
      </div>

      {/* Mensaje de Toast al Resolver */}
      {resolvedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{resolvedToast}</span>
          <button
            onClick={() => setFilter('resolved')}
            className="text-emerald-700 underline font-bold ml-2 hover:text-emerald-900"
          >
            Ver Resueltas
          </button>
        </div>
      )}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Todas ({feedbacks.length})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            filter === 'new'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-600 border border-rose-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Pendientes ({feedbacks.filter((f) => f.status === 'new').length})</span>
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filter === 'contacted'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-blue-600 border border-blue-200'
          }`}
        >
          Contactadas ({feedbacks.filter((f) => f.status === 'contacted').length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-600 border border-emerald-200'
          }`}
        >
          Resueltas ({feedbacks.filter((f) => f.status === 'resolved').length})
        </button>
      </div>

      {/* Lista de Quejas (Responsive: 1 columna en móvil, 2 columnas en desktop) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filter === 'all' ? '¡Sin quejas registradas!' : 'Sin quejas en este filtro'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {filter === 'all'
              ? 'Tus comensales están teniendo una excelente experiencia en tus mesas.'
              : 'No hay reportes con este estado actualmente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f) => {
            const waLink = getWhatsAppLink(f);
            const isEditingThisNote = editingNotesId === f.id;
            const restaurant = restaurants.find((r) => r.id === f.restaurant_id) || f.restaurant;

            return (
              <div
                key={f.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all space-y-3 ${
                  f.status === 'new'
                    ? 'border-rose-200 ring-2 ring-rose-500/10'
                    : f.status === 'resolved'
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Cabecera de la queja */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {/* Estrellas */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= f.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1">
                        {f.rating} de 5 ⭐
                      </span>
                    </div>

                    {/* Fecha y sucursal */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(f.created_at).toLocaleDateString()} a las {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {restaurant && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                            {restaurant.branch_name || restaurant.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Estado Badge */}
                  <div>
                    <select
                      value={f.status}
                      onChange={(e) => handleStatusChange(f.id, e.target.value as FeedbackStatus)}
                      className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none ${
                        f.status === 'new'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : f.status === 'contacted'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      <option value="new">🔴 Pendiente</option>
                      <option value="contacted">🔵 Contactado</option>
                      <option value="resolved">🟢 Resuelto</option>
                    </select>
                  </div>
                </div>

                {/* Comentario del comensal */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 italic leading-relaxed">
                  "{f.comments}"
                </div>

                {/* Datos del comensal y Mesa */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Comensal</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {f.customer_name || 'Anónimo'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ubicación / Mesa</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {f.tag_code ? `Tag: ${f.tag_code}` : 'No registrada'}
                    </span>
                  </div>
                </div>

                {/* Botón directo a WhatsApp si tiene teléfono */}
                {f.customer_phone ? (
                  <div className="pt-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (f.status === 'new') {
                          handleStatusChange(f.id, 'contacted');
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Contactar por WhatsApp ({f.customer_phone})</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic text-center py-1">
                    El cliente no proporcionó número de teléfono
                  </div>
                )}

                {/* Sección de Notas Internas de Gerencia */}
                <div className="pt-2 border-t border-slate-100">
                  {isEditingThisNote ? (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Notas Internas de Seguimiento:
                      </label>
                      <textarea
                        rows={2}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Ej: Se le contactó y se le ofreció cortesía de postre para su próxima visita..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSavingNote}
                          onClick={() => handleSaveNote(f.id, f.status)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingNote ? 'Guardando...' : 'Guardar Nota'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex items-center gap-1.5 text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-[11px]">
                          {f.internal_notes ? (
                            <strong className="text-slate-800">Nota: {f.internal_notes}</strong>
                          ) : (
                            <span className="text-slate-400">Sin notas de gerencia</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditNote(f)}
                        className="text-[11px] text-blue-600 font-bold hover:underline flex-shrink-0"
                      >
                        {f.internal_notes ? 'Editar nota' : '+ Agregar nota'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
