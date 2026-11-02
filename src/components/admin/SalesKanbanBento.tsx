import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Phone,
  MapPin,
  QrCode,
  X,
  Building,
} from 'lucide-react';
import type { SalesLead, SalesLeadStage, BusinessType } from '../../types';
import { PhoneInputWithCountry } from '../common/PhoneInputWithCountry';

interface SalesKanbanBentoProps {
  leads: SalesLead[];
  onMoveStage: (leadId: string, newStage: SalesLeadStage) => Promise<void>;
  onCreateLead: (lead: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

interface KanbanColumn {
  id: string;
  title: string;
  subtitle: string;
  stages: SalesLeadStage[];
  accentColor: string;
  headerBg: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'prospectos',
    title: '1. Contactados',
    subtitle: 'Prospección inicial en frío',
    stages: ['prospeccion'],
    accentColor: 'border-slate-300 text-slate-700',
    headerBg: 'bg-slate-100',
  },
  {
    id: 'demos',
    title: '2. Demo Placa NFC',
    subtitle: 'Demostración de lectura en mesa',
    stages: ['demo_agendada', 'demo_realizada'],
    accentColor: 'border-blue-400 text-blue-700',
    headerBg: 'bg-blue-50',
  },
  {
    id: 'cotizacion',
    title: '3. Cotización / Cierre',
    subtitle: 'Propuesta de MRR y Kits',
    stages: ['cotizacion_enviada'],
    accentColor: 'border-purple-400 text-purple-700',
    headerBg: 'bg-purple-50',
  },
  {
    id: 'ganados',
    title: '4. Cerrados este mes',
    subtitle: 'Contrato firmado / Instalación',
    stages: ['cierre_ganado', 'instalacion_pendiente', 'instalado_activo'],
    accentColor: 'border-emerald-400 text-emerald-700',
    headerBg: 'bg-emerald-50',
  },
];

export const SalesKanbanBento: React.FC<SalesKanbanBentoProps> = ({
  leads,
  onMoveStage,
  onCreateLead,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario nuevo prospecto
  const [restaurantName, setRestaurantName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Dueño / Gerente');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('CDMX');
  const [estimatedTables, setEstimatedTables] = useState(12);
  const [dealMrr, setDealMrr] = useState(299);
  const [hardwareFee, setHardwareFee] = useState(1200);
  const [salesRep, setSalesRep] = useState('Carlos Vega');
  const [notes, setNotes] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !contactName || !phone) return;

    setSubmitting(true);
    try {
      await onCreateLead({
        restaurant_name: restaurantName,
        business_type: businessType,
        contact_name: contactName,
        contact_role: contactRole,
        phone,
        email: email || null,
        address: address || 'CDMX',
        city,
        estimated_tables: Number(estimatedTables) || 10,
        stage: 'prospeccion',
        deal_mrr_mxn: Number(dealMrr) || 299,
        hardware_kit_fee_mxn: Number(hardwareFee) || 1200,
        assigned_sales_rep: salesRep,
        notes: notes || null,
      });

      // Limpiar formulario
      setRestaurantName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setModalOpen(false);
    } catch (err) {
      console.error('Error al registrar prospecto:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
      {/* Encabezado del Tablero Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Tablero Kanban Comercial B2B
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {leads.length} Oportunidades
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión visual de prospectos, valor MRR recurrente y kits de placas iniciales
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Prospecto</span>
        </button>
      </div>

      {/* Las 4 Columnas Bento Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => col.stages.includes(l.stage));
          const colMrr = colLeads.reduce((acc, l) => acc + (Number(l.deal_mrr_mxn) || 0), 0);
          const colKits = colLeads.reduce((acc, l) => acc + (Number(l.hardware_kit_fee_mxn) || 0), 0);

          return (
            <div
              key={col.id}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between"
            >
              <div>
                {/* Cabecera de Columna */}
                <div className={`p-3 rounded-xl ${col.headerBg} border border-slate-200/70 mb-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900">{col.title}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-black shadow-2xs">
                      {colLeads.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{col.subtitle}</p>

                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 pt-2 mt-2 border-t border-slate-200/60">
                    <span>MRR: ${colMrr.toLocaleString('es-MX')}</span>
                    <span>Kits: ${colKits.toLocaleString('es-MX')}</span>
                  </div>
                </div>

                {/* Lista de Tarjetas de Prospectos */}
                <div className="space-y-2.5 min-h-[140px]">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      Sin prospectos en esta etapa
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h5 className="text-xs font-bold text-slate-900 leading-snug">
                            {lead.restaurant_name}
                          </h5>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 flex-shrink-0">
                            {lead.business_type || 'Restaurante'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium">
                          {lead.contact_name}
                          {lead.contact_role && (
                            <span className="text-slate-400 font-normal"> · {lead.contact_role}</span>
                          )}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.phone}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lead.city}
                          </span>
                        </div>

                        {/* Indicadores Financieros de la Oferta */}
                        <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 my-2 text-[10px]">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Suscripción</span>
                            <span className="font-bold text-slate-900">
                              ${lead.deal_mrr_mxn}/mes
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Kit Inicial</span>
                            <span className="font-bold text-emerald-700">
                              ${lead.hardware_kit_fee_mxn}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-blue-600" />
                            {lead.estimated_tables} placas estimadas
                          </span>
                          <span className="text-slate-400">{lead.assigned_sales_rep}</span>
                        </div>

                        {lead.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded mb-2 border border-slate-100 line-clamp-2">
                            "{lead.notes}"
                          </p>
                        )}

                        {/* Selector de Movimiento de Etapa */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            Avanzar a:
                          </span>
                          <select
                            value={lead.stage}
                            onChange={(e) =>
                              onMoveStage(lead.id, e.target.value as SalesLeadStage)
                            }
                            className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 border-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="prospeccion">Prospección</option>
                            <option value="demo_agendada">Demo Agendada</option>
                            <option value="demo_realizada">Demo Realizada</option>
                            <option value="cotizacion_enviada">Cotización Enviada</option>
                            <option value="cierre_ganado">Cierre Ganado</option>
                            <option value="cerrado_perdido">Cerrado Perdido</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Bento: Registrar Nuevo Prospecto Comercial */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Nuevo Prospecto B2B
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ingresar restaurante al embudo comercial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Taquería El Pastor Norteño"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giro
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="restaurant">Restaurante</option>
                    <option value="gym">Gimnasio</option>
                    <option value="dental">Clínica</option>
                    <option value="spa">Spa</option>
                    <option value="general">Comercio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Lic. Fernando Ruiz"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol / Cargo
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Socio Operador"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <PhoneInputWithCountry
                    value={phone}
                    onChange={setPhone}
                    required
                    compact
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@restaurante.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mesas / Placas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={estimatedTables}
                    onChange={(e) => setEstimatedTables(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MRR ($ MXN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dealMrr}
                    onChange={(e) => setDealMrr(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kit Upfront ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={hardwareFee}
                    onChange={(e) => setHardwareFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad / Zona
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ejecutivo Asignado
                  </label>
                  <select
                    value={salesRep}
                    onChange={(e) => setSalesRep(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Carlos Vega">Carlos Vega</option>
                    <option value="Laura Domínguez">Laura Domínguez</option>
                    <option value="Dirección">Dirección General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Calificación
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre interés en menú digital, quejas o necesidad de placas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Crear Prospecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
