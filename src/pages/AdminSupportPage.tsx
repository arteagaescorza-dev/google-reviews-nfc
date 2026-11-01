import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { SupportTicket, SupportStatus, SupportCategory } from '../types';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../lib/constants';
import {
  LifeBuoy,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  Building2,
  Store,
  Calendar,
  Send,
  Loader2,
  Wrench,
  Receipt,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

const CATEGORY_ICONS: Record<SupportCategory, React.ComponentType<{ className?: string }>> = {
  plate_damaged: Wrench,
  billing: Receipt,
  more_plates: PlusCircle,
  general: HelpCircle,
};

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingReply, setEditingReply] = useState<Record<string, string>>({});
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const list = await api.getSupportTickets();
    setTickets(list);
    // Inicializar replies en estado local
    const replies: Record<string, string> = {};
    list.forEach((t) => {
      replies[t.id] = t.admin_reply || '';
    });
    setEditingReply(replies);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: SupportStatus) => {
    setSavingTicketId(id);
    const replyText = editingReply[id];
    await api.updateSupportTicketStatus(id, newStatus, replyText);
    setSavingTicketId(null);
    loadData();
  };

  const handleSaveReply = async (id: string, currentStatus: SupportStatus) => {
    setSavingTicketId(id);
    const replyText = editingReply[id];
    await api.updateSupportTicketStatus(id, currentStatus, replyText);
    setSavingTicketId(null);
    loadData();
  };

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mesa de Ayuda B2B</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold">
              Locatarios
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Incidencias técnicas de placas físicas, reposiciones, facturación y soporte directo para dueños de negocio
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Todos los Estados ({tickets.length})</option>
              <option value="pending">Pendientes ({pendingCount})</option>
              <option value="in_progress">En Proceso ({inProgressCount})</option>
              <option value="resolved">Resueltos ({resolvedCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="plate_damaged">🛠️ Placa Dañada / Despegada</option>
              <option value="more_plates">🏷️ Solicitud de Más Placas</option>
              <option value="billing">💰 Facturación</option>
              <option value="general">💬 General / Técnico</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Solicitudes</span>
            <LifeBuoy className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{tickets.length}</p>
          <span className="text-[10px] text-slate-400">Tickets registrados</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-amber-700">Por Atender</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{pendingCount}</p>
          <span className="text-[10px] text-amber-700">Requieren respuesta</span>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-blue-700">En Proceso</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900">{inProgressCount}</p>
          <span className="text-[10px] text-blue-700">En entrega o revisión</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Resueltos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{resolvedCount}</p>
          <span className="text-[10px] text-emerald-700">Casos concluidos</span>
        </div>
      </div>

      {/* Lista de Tickets */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Cargando mesa de ayuda B2B...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay tickets con los filtros aplicados</h3>
          <p className="text-xs text-slate-500 mt-1">
            Todos los locatarios tienen sus placas y servicios operando sin incidencias.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const catConfig = SUPPORT_CATEGORIES[ticket.category] || SUPPORT_CATEGORIES.general;
            const statusConfig = SUPPORT_STATUSES[ticket.status] || SUPPORT_STATUSES.pending;
            const CategoryIcon = CATEGORY_ICONS[ticket.category] || HelpCircle;
            const cleanPhone = ticket.organization?.owner_phone?.replace(/[^0-9]/g, '');

            const waMessage = `¡Hola ${ticket.organization?.owner_name || 'estimado locatario'}! 👋 Te escribo de soporte respecto a tu solicitud: "${ticket.subject}".`;
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
              : null;

            const isSaving = savingTicketId === ticket.id;

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
              >
                {/* Cabecera del ticket */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${catConfig.badge}`}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{catConfig.label}</span>
                    </span>

                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ticket.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Info del Locatario & Sucursal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>{ticket.organization?.name || 'Organización no vinculada'}</span>
                    </div>
                    {ticket.restaurant && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sucursal: <strong>{ticket.restaurant.name}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end justify-center gap-1">
                    <div className="text-slate-700">
                      Dueño: <strong className="text-slate-900">{ticket.organization?.owner_name || 'N/A'}</strong>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors w-fit"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contactar por WhatsApp ({ticket.organization?.owner_phone})</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Asunto y Mensaje */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{ticket.subject}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    {ticket.message}
                  </p>
                </div>

                {/* Respuesta Administrativa & Cambio de Estado */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Respuesta del Superadmin (Visible para el Locatario en su Portal)
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={editingReply[ticket.id] || ''}
                        onChange={(e) =>
                          setEditingReply({ ...editingReply, [ticket.id]: e.target.value })
                        }
                        placeholder="Escribe tu resolución o nota para el locatario (ej. Ya se enviaron 3 placas con el repartidor)..."
                        className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveReply(ticket.id, ticket.status)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-end transition-all disabled:opacity-50"
                        title="Guardar respuesta"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Guardar Nota</span>
                      </button>
                    </div>
                  </div>

                  {/* Selector rápido de estado */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cambiar Estado:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSaving || ticket.status === 'pending'}
                        onClick={() => handleStatusChange(ticket.id, 'pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          ticket.status === 'pending'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800'
                        }`}
                      >
                        Pendiente
                      </button>

                      <button
                        type="button"
                        disabled={isSaving || ticket.status === 'in_progress'}
                        onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          ticket.status === 'in_progress'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800'
                        }`}
                      >
                        En Proceso
                      </button>

                      <button
                        type="button"
                        disabled={isSaving || ticket.status === 'resolved'}
                        onClick={() => handleStatusChange(ticket.id, 'resolved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          ticket.status === 'resolved'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                        }`}
                      >
                        Resuelto
                      </button>
                    </div>
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
