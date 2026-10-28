import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Feedback, FeedbackStatus } from '../types';
import {
  MessageSquareWarning,
  Star,
  Phone,
  Mail,
  Filter,
  MessageCircle,
} from 'lucide-react';

export const AdminFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    const list = await api.getFeedbacks();
    setFeedbacks(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: FeedbackStatus) => {
    await api.updateFeedbackStatus(id, status);
    loadData();
  };

  const filtered = feedbacks.filter((f) => {
    if (filterStatus === 'all') return true;
    return f.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buzón de Quejas Privadas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Opiniones de 1 a 3 estrellas contenidas internamente antes de dañar la reputación pública en Google
          </p>
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 text-xs rounded-xl border border-slate-200 bg-white font-medium shadow-sm"
          >
            <option value="all">Todas ({feedbacks.length})</option>
            <option value="new">Nuevas / Pendientes ({feedbacks.filter((f) => f.status === 'new').length})</option>
            <option value="reviewed">Revisadas</option>
            <option value="contacted">Cliente Contactado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Cargando buzón de quejas...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay quejas registradas con este filtro</h3>
          <p className="text-xs text-slate-500 mt-1">
            Los clientes que han calificado están completamente satisfechos o el filtro está vacío.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fb) => {
            const cleanPhone = fb.customer_phone?.replace(/[^0-9]/g, '');
            const whatsappUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(
                  fb.customer_name || 'estimado cliente'
                )},%20te%20escribimos%20de%20parte%20de%20la%20gerencia%20respecto%20a%20tu%20reciente%20visita.`
              : null;

            return (
              <div
                key={fb.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{fb.rating} Estrellas</span>
                    </span>

                    <div>
                      <span className="font-bold text-sm text-slate-900">
                        {fb.restaurant?.name || 'Local'}
                      </span>
                      {fb.tag_code && (
                        <span className="ml-2 text-xs font-mono text-slate-400">
                          (Tag: {fb.tag_code})
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(fb.created_at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {/* Comentario del cliente */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed italic">
                  "{fb.comments}"
                </div>

                {/* Contacto del cliente y acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {fb.customer_name || 'Comensal Anónimo'}
                    </span>

                    {fb.customer_phone && (
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {fb.customer_phone}
                      </span>
                    )}

                    {fb.customer_email && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {fb.customer_email}
                      </span>
                    )}
                  </div>

                  {/* Acciones de atención */}
                  <div className="flex items-center gap-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contactar por WhatsApp</span>
                      </a>
                    )}

                    <select
                      value={fb.status}
                      onChange={(e) => handleUpdateStatus(fb.id, e.target.value as FeedbackStatus)}
                      className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 focus:outline-none transition-colors ${
                        fb.status === 'new'
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : fb.status === 'contacted'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <option value="new">Pendiente</option>
                      <option value="reviewed">Revisado</option>
                      <option value="contacted">Contactado</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
