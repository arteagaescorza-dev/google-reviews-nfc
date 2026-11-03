import React, { useState, useEffect } from 'react';
import type { BusinessVertical, VerticalFeatureItem, VerticalStationItem } from '../../types';
import { organizationsApi } from '../../lib/api/organizations';
import {
  X,
  Briefcase,
  Plus,
  Trash2,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface BusinessVerticalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerticalsChanged?: () => void;
}

export const BusinessVerticalsModal: React.FC<BusinessVerticalsModalProps> = ({
  isOpen,
  onClose,
  onVerticalsChanged,
}) => {
  const [verticals, setVerticals] = useState<BusinessVertical[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Vertical en edición o creación
  const [selectedVerticalId, setSelectedVerticalId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [unitLabel, setUnitLabel] = useState('Mesa');
  const [unitPlural, setUnitPlural] = useState('Mesas');
  const [showKds, setShowKds] = useState(false);
  const [showFloorStaff, setShowFloorStaff] = useState(false);
  const [showHostess, setShowHostess] = useState(false);

  const [catalogTitle, setCatalogTitle] = useState('');
  const [catalogSubtitle, setCatalogSubtitle] = useState('');
  const [actionPrimary, setActionPrimary] = useState('');
  const [actionSecondary, setActionSecondary] = useState('');
  const [feedbackQuestion, setFeedbackQuestion] = useState('');

  const [features, setFeatures] = useState<VerticalFeatureItem[]>([]);
  const [stations, setStations] = useState<VerticalStationItem[]>([]);

  // Agregador de funcionalidad
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [newFeatName, setNewFeatName] = useState('');
  const [newFeatDesc, setNewFeatDesc] = useState('');

  // Agregador de estación
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationRole, setNewStationRole] = useState('');
  const [newStationDesc, setNewStationDesc] = useState('');

  // Pestaña activa en el detalle
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'stations'>('general');

  useEffect(() => {
    if (isOpen) {
      loadVerticals();
    }
  }, [isOpen]);

  const loadVerticals = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await organizationsApi.getBusinessVerticals();
      setVerticals(data);
      if (data.length > 0 && !selectedVerticalId && !isCreatingNew) {
        selectVertical(data[0]);
      } else if (selectedVerticalId) {
        const current = data.find((v) => v.id === selectedVerticalId || v.slug === selectedVerticalId);
        if (current) selectVertical(current);
      }
    } catch (err: any) {
      setErrorMsg('Error al cargar catálogo de giros comerciales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectVertical = (v: BusinessVertical) => {
    setIsCreatingNew(false);
    setSelectedVerticalId(v.id);
    setName(v.name || '');
    setSlug(v.slug || '');
    setUnitLabel(v.unit_label || 'Mesa');
    setUnitPlural(v.unit_plural || 'Mesas');
    setShowKds(!!v.show_kds);
    setShowFloorStaff(!!v.show_floor_staff);
    setShowHostess(!!v.show_hostess);

    setCatalogTitle(v.catalog_title || '');
    setCatalogSubtitle(v.catalog_subtitle || '');
    setActionPrimary(v.action_primary || '');
    setActionSecondary(v.action_secondary || '');
    setFeedbackQuestion(v.feedback_question || '');

    setFeatures(v.available_features && Array.isArray(v.available_features) ? [...v.available_features] : []);
    setStations(v.available_stations && Array.isArray(v.available_stations) ? [...v.available_stations] : []);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const startCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedVerticalId(null);
    setName('');
    setSlug('');
    setUnitLabel('Punto / Estación');
    setUnitPlural('Puntos de Atención');
    setShowKds(false);
    setShowFloorStaff(false);
    setShowHostess(false);

    setCatalogTitle('Catálogo de Servicios');
    setCatalogSubtitle('Promociones, horarios y contacto directo');
    setActionPrimary('Solicitar Asistencia');
    setActionSecondary('Contacto WhatsApp');
    setFeedbackQuestion('¿Cómo calificarías nuestra atención hoy?');

    setFeatures([
      { id: 'direct_redirect', name: 'Enlace Directo a Google Reviews', description: 'Redirección instantánea a Google Reviews.' },
      { id: 'smart_feedback', name: 'Filtro Inteligente de Reputación', description: 'Canalización de quejas de forma privada.' },
      { id: 'digital_catalog', name: 'Catálogo Digital de Servicios / Productos', description: 'Folleto interactivo digital en el punto de atención.' },
      { id: 'wifi_portal', name: 'Acceso Wi-Fi en 1-Toque', description: 'Conexión a internet rápida sin dictar contraseñas.' },
      { id: 'white_label', name: 'Escudo de Marca Blanca (0% Anuncios)', description: 'Elimina publicidad externa en el negocio.' },
    ]);
    setStations([
      { id: 'station-principal', name: 'Mostrador Principal de Atención', roleName: 'Atención al Cliente', description: 'Terminal de recepción y cobro.' },
    ]);
    setActiveTab('general');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del giro comercial es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isCreatingNew) {
        const res = await organizationsApi.createBusinessVertical({
          name: name.trim(),
          slug: slug.trim() || undefined,
          unit_label: unitLabel.trim(),
          unit_plural: unitPlural.trim(),
          show_kds: showKds,
          show_floor_staff: showFloorStaff,
          show_hostess: showHostess,
          available_features: features,
          available_stations: stations,
          catalog_title: catalogTitle.trim(),
          catalog_subtitle: catalogSubtitle.trim(),
          action_primary: actionPrimary.trim(),
          action_secondary: actionSecondary.trim(),
          feedback_question: feedbackQuestion.trim(),
        });

        if (!res.success || !res.data) {
          throw new Error(res.error || 'No se pudo crear el giro comercial');
        }

        setSuccessMsg('Giro comercial creado con éxito');
        await loadVerticals();
        selectVertical(res.data);
      } else if (selectedVerticalId) {
        const res = await organizationsApi.updateBusinessVertical(selectedVerticalId, {
          name: name.trim(),
          unit_label: unitLabel.trim(),
          unit_plural: unitPlural.trim(),
          show_kds: showKds,
          show_floor_staff: showFloorStaff,
          show_hostess: showHostess,
          available_features: features,
          available_stations: stations,
          catalog_title: catalogTitle.trim(),
          catalog_subtitle: catalogSubtitle.trim(),
          action_primary: actionPrimary.trim(),
          action_secondary: actionSecondary.trim(),
          feedback_question: feedbackQuestion.trim(),
        });

        if (!res.success) {
          throw new Error(res.error || 'No se pudo actualizar el giro comercial');
        }

        setSuccessMsg('Giro comercial actualizado con éxito');
        await loadVerticals();
      }

      if (onVerticalsChanged) {
        onVerticalsChanged();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVerticalId) return;
    const isCore = ['restaurant', 'barberia', 'dental', 'gym', 'spa', 'cafeteria', 'general'].includes(slug);
    const confirmPrompt = isCore
      ? 'Este giro es parte de los perfiles base del sistema. ¿Deseas eliminarlo de todos modos?'
      : '¿Estás seguro de eliminar este giro comercial? Las sucursales o tiers que lo usen quedarán sin giro asignado.';

    if (!window.confirm(confirmPrompt)) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await organizationsApi.deleteBusinessVertical(selectedVerticalId);
      if (!res.success) throw new Error(res.error || 'No se pudo eliminar el giro comercial');
      setSuccessMsg('Giro comercial eliminado correctamente');
      setSelectedVerticalId(null);
      await loadVerticals();
      if (onVerticalsChanged) onVerticalsChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el giro.');
    } finally {
      setSaving(false);
    }
  };

  // Funciones para agregar/quitar features
  const handleAddFeature = () => {
    if (!newFeatName.trim()) return;
    const id =
      'feat_' +
      newFeatName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 30) +
      '_' +
      Date.now().toString().slice(-4);

    const newItem: VerticalFeatureItem = {
      id,
      name: newFeatName.trim(),
      description: newFeatDesc.trim() || 'Funcionalidad configurada para este giro comercial.',
    };

    setFeatures((prev) => [...prev, newItem]);
    setNewFeatName('');
    setNewFeatDesc('');
    setShowAddFeature(false);
  };

  const handleRemoveFeature = (featureId: string) => {
    setFeatures((prev) => prev.filter((f) => f.id !== featureId));
  };

  // Funciones para agregar/quitar stations
  const handleAddStation = () => {
    if (!newStationName.trim()) return;
    const id =
      'station-' +
      (slug || 'giro') +
      '-' +
      newStationName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 25) +
      '-' +
      Date.now().toString().slice(-4);

    const newItem: VerticalStationItem = {
      id,
      name: newStationName.trim(),
      roleName: newStationRole.trim() || 'Personal de Estación',
      description: newStationDesc.trim() || 'Pantalla operativa para el personal del área.',
    };

    setStations((prev) => [...prev, newItem]);
    setNewStationName('');
    setNewStationRole('');
    setNewStationDesc('');
    setShowAddStation(false);
  };

  const handleRemoveStation = (stationId: string) => {
    setStations((prev) => prev.filter((s) => s.id !== stationId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Catálogo de Giros Comerciales</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Tipificación & Tiers
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Define sectores comerciales, nombres de unidades físicas y las funcionalidades que hidratan los Tiers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cuerpo Principal Dividido (Lista Izquierda / Editor Derecho) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Columna Izquierda: Listado de Giros */}
          <div className="w-full md:w-80 border-r border-slate-100 bg-slate-50/40 p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Giros Registrados ({verticals.length})
              </span>
              <button
                type="button"
                onClick={startCreateNew}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Giro</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Cargando giros...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {verticals.map((v) => {
                  const isSelected = !isCreatingNew && (selectedVerticalId === v.id || selectedVerticalId === v.slug);
                  const featsCount = v.available_features?.length || 0;
                  const stationsCount = v.available_stations?.length || 0;

                  return (
                    <button
                      key={v.id || v.slug}
                      type="button"
                      onClick={() => selectVertical(v)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="font-extrabold text-xs text-slate-900 truncate">{v.name}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                            {v.unit_label || 'Unidad'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {featsCount} func. • {stationsCount} pant.
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Formulario & Configurador */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-5">
              {/* Navegación por pestañas */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'general'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    1. Datos & Unidades
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('features')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'features'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>2. Funcionalidades del Giro</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-current">
                      {features.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stations')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'stations'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>3. Pantallas Operativas / KDS</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-current">
                      {stations.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isCreatingNew && selectedVerticalId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isCreatingNew ? 'Crear Giro' : 'Guardar Giro'}</span>
                  </button>
                </div>
              </div>

              {/* Pestaña 1: General & Unidades */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Nombre del Giro Comercial *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Clínica Dental / Médico, Veterinaria..."
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                        Identificador Slug (Código único)
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={!isCreatingNew}
                        placeholder="Ej. dental, veterinaria, barberia..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
                      />
                    </div>
                  </div>

                  {/* Unidades Físicas */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-extrabold text-indigo-950">
                        Tipificación de Unidad Física en Sucursal
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-900/70">
                      Define cómo se nombran las ubicaciones físicas en las placas NFC de este negocio (ej. Mesa en restaurantes, Gabinete en consultorios, Sillón en barberías, Máquina en gimnasios).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Etiqueta Singular (Placa individual)
                        </label>
                        <input
                          type="text"
                          value={unitLabel}
                          onChange={(e) => setUnitLabel(e.target.value)}
                          placeholder="Ej. Gabinete / Consultorio, Mesa, Sillón..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Etiqueta Plural (Agrupación)
                        </label>
                        <input
                          type="text"
                          value={unitPlural}
                          onChange={(e) => setUnitPlural(e.target.value)}
                          placeholder="Ej. Consultorios, Mesas, Sillones..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banderas Operativas */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Banderas Operativas Base del Giro
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={showKds}
                          onChange={(e) => setShowKds(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">Pantallas KDS</div>
                          <div className="text-[10px] text-slate-400">Cocina o preparación</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={showFloorStaff}
                          onChange={(e) => setShowFloorStaff(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">Personal de Piso</div>
                          <div className="text-[10px] text-slate-400">Meseros / Asistentes</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={showHostess}
                          onChange={(e) => setShowHostess(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800">Recepción / Hostess</div>
                          <div className="text-[10px] text-slate-400">Control de acceso</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Textos de Cara al Cliente (Linktree & PWA) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-extrabold text-slate-800">
                        Textos Predeterminados de Cara al Cliente (Placa NFC / Móvil)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Título del Catálogo en Placa
                        </label>
                        <input
                          type="text"
                          value={catalogTitle}
                          onChange={(e) => setCatalogTitle(e.target.value)}
                          placeholder="Ej. Cuidados Post-Atención & Recetas"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Subtítulo Descriptivo
                        </label>
                        <input
                          type="text"
                          value={catalogSubtitle}
                          onChange={(e) => setCatalogSubtitle(e.target.value)}
                          placeholder="Ej. Indicaciones médicas y citas..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Botón de Acción Primaria
                        </label>
                        <input
                          type="text"
                          value={actionPrimary}
                          onChange={(e) => setActionPrimary(e.target.value)}
                          placeholder="Ej. Asistencia en Recepción"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Botón de Acción Secundaria
                        </label>
                        <input
                          type="text"
                          value={actionSecondary}
                          onChange={(e) => setActionSecondary(e.target.value)}
                          placeholder="Ej. WhatsApp Urgencias"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Pregunta del Filtro de Reputación
                      </label>
                      <input
                        type="text"
                        value={feedbackQuestion}
                        onChange={(e) => setFeedbackQuestion(e.target.value)}
                        placeholder="Ej. ¿Cómo fue tu atención médica y trato profesional hoy?"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña 2: Funcionalidades del Giro */}
              {activeTab === 'features' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-800">
                        Funcionalidades Disponibles para este Giro
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Estas son las opciones que aparecerán en la columna de funcionalidades al modelar un Tier para {name || 'este giro'}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddFeature(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Funcionalidad</span>
                    </button>
                  </div>

                  {/* Formulario Inline para Nueva Funcionalidad */}
                  {showAddFeature && (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-900">
                          Nueva Funcionalidad Especializada
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddFeature(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Nombre de la funcionalidad *
                        </label>
                        <input
                          type="text"
                          value={newFeatName}
                          onChange={(e) => setNewFeatName(e.target.value)}
                          placeholder="Ej. Recetas Digitales & Convenios con Farmacias..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Descripción o propuesta de valor
                        </label>
                        <input
                          type="text"
                          value={newFeatDesc}
                          onChange={(e) => setNewFeatDesc(e.target.value)}
                          placeholder="Ej. Envío automático de receta y descuentos a WhatsApp del paciente."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Insertar Funcionalidad
                      </button>
                    </div>
                  )}

                  {/* Listado de Funcionalidades */}
                  <div className="space-y-2">
                    {features.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                        No hay funcionalidades registradas para este giro. Haz clic en "Añadir Funcionalidad".
                      </div>
                    ) : (
                      features.map((feat, idx) => (
                        <div
                          key={feat.id || idx}
                          className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{feat.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {feat.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{feat.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(feat.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                            title="Eliminar funcionalidad"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Pestaña 3: Pantallas Operativas / KDS */}
              {activeTab === 'stations' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-800">
                        Pantallas Operativas / Estaciones del Giro
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Estas estaciones de trabajo se desbloquean en los Tiers de este giro (ej. KDS, Recepción, Terminal de Gabinete).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddStation(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Pantalla</span>
                    </button>
                  </div>

                  {/* Formulario Inline para Nueva Pantalla */}
                  {showAddStation && (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-900">
                          Nueva Pantalla Operativa
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddStation(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Nombre de la Pantalla / Estación *
                          </label>
                          <input
                            type="text"
                            value={newStationName}
                            onChange={(e) => setNewStationName(e.target.value)}
                            placeholder="Ej. Terminal de Gabinete para Doctor / Asistente"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Rol de Usuario Responsable
                          </label>
                          <input
                            type="text"
                            value={newStationRole}
                            onChange={(e) => setNewStationRole(e.target.value)}
                            placeholder="Ej. Médico / Asistente Dental"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Descripción o responsabilidades
                        </label>
                        <input
                          type="text"
                          value={newStationDesc}
                          onChange={(e) => setNewStationDesc(e.target.value)}
                          placeholder="Ej. Solicitud de recetas, insumos y pase de paciente al consultorio."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStation}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Insertar Pantalla
                      </button>
                    </div>
                  )}

                  {/* Listado de Pantallas */}
                  <div className="space-y-2">
                    {stations.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                        No hay pantallas operativas configuradas para este giro. Haz clic en "Añadir Pantalla".
                      </div>
                    ) : (
                      stations.map((st, idx) => (
                        <div
                          key={st.id || idx}
                          className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{st.name}</span>
                              {st.roleName && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold">
                                  {st.roleName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{st.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStation(st.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                            title="Eliminar pantalla"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
