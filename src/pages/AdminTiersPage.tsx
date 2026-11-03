import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CustomTierDefinition, TierType } from '../types';
import {
  MASTER_TIER_FEATURES,
  MASTER_TIER_STATIONS,
  MASTER_TIER_CATEGORIES,
  DEFAULT_CUSTOM_TIERS,
} from '../lib/constants';
import {
  Layers,
  Check,
  Save,
  RotateCcw,
  DollarSign,
  Monitor,
  ChevronDown,
  ChevronRight,
  Info,
  ShieldCheck,
  Eye,
  Type,
} from 'lucide-react';

export const AdminTiersPage: React.FC = () => {
  const [tiers, setTiers] = useState<CustomTierDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

  const loadTiers = async () => {
    setLoading(true);
    const data = await api.getTierDefinitions();
    setTiers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleToggleFeature = (tierKey: TierType | 'addon', featureId: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const exists = t.included_features.includes(featureId);
        const nextFeatures = exists
          ? t.included_features.filter((id) => id !== featureId)
          : [...t.included_features, featureId];

        // Regla: si se apaga, el checkbox se anula y se remueve de client_visible.
        // Si se activa, por defecto se activa como marcado.
        const currentVis =
          t.client_visible_features !== undefined ? t.client_visible_features : t.included_features;
        const nextVis = exists
          ? currentVis.filter((id) => id !== featureId)
          : [...currentVis.filter((id) => id !== featureId), featureId];

        return { ...t, included_features: nextFeatures, client_visible_features: nextVis };
      })
    );
  };

  const handleToggleStation = (tierKey: TierType | 'addon', stationId: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const exists = t.included_stations.includes(stationId);
        const nextStations = exists
          ? t.included_stations.filter((id) => id !== stationId)
          : [...t.included_stations, stationId];

        const currentVis =
          t.client_visible_stations !== undefined ? t.client_visible_stations : t.included_stations;
        const nextVis = exists
          ? currentVis.filter((id) => id !== stationId)
          : [...currentVis.filter((id) => id !== stationId), stationId];

        return { ...t, included_stations: nextStations, client_visible_stations: nextVis };
      })
    );
  };

  const handleToggleCategory = (tierKey: TierType | 'addon', catId: number) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const current = t.allowed_categories || [3, 4, 5, 6];
        const exists = current.includes(catId);
        const next = exists ? current.filter((id) => id !== catId) : [...current, catId];

        const currentVis =
          t.client_visible_categories !== undefined
            ? t.client_visible_categories
            : t.allowed_categories || [3, 4, 5, 6];
        const nextVis = exists
          ? currentVis.filter((id) => id !== catId)
          : [...currentVis.filter((id) => id !== catId), catId];

        return { ...t, allowed_categories: next, client_visible_categories: nextVis };
      })
    );
  };

  const handleToggleFeatureVisibility = (tierKey: TierType | 'addon', featId: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const current =
          t.client_visible_features !== undefined ? t.client_visible_features : t.included_features;
        const exists = current.includes(featId);
        const next = exists ? current.filter((id) => id !== featId) : [...current, featId];
        return { ...t, client_visible_features: next };
      })
    );
  };

  const handleToggleStationVisibility = (tierKey: TierType | 'addon', stationId: string) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const current =
          t.client_visible_stations !== undefined ? t.client_visible_stations : t.included_stations;
        const exists = current.includes(stationId);
        const next = exists ? current.filter((id) => id !== stationId) : [...current, stationId];
        return { ...t, client_visible_stations: next };
      })
    );
  };

  const handleToggleCategoryVisibility = (tierKey: TierType | 'addon', catId: number) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.tier !== tierKey) return t;
        const current =
          t.client_visible_categories !== undefined
            ? t.client_visible_categories
            : t.allowed_categories || [3, 4, 5, 6];
        const exists = current.includes(catId);
        const next = exists ? current.filter((id) => id !== catId) : [...current, catId];
        return { ...t, client_visible_categories: next };
      })
    );
  };

  const handleUpdateTierField = (
    tierKey: TierType | 'addon',
    field: 'name' | 'description' | 'price_mxn',
    value: any
  ) => {
    setTiers((prev) =>
      prev.map((t) => (t.tier === tierKey ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await api.saveTierDefinitions(tiers);
    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Restablecer la configuración de Tiers a los valores por defecto del sistema?')) {
      setTiers(DEFAULT_CUSTOM_TIERS);
    }
  };

  const toggleTierCollapse = (tierKey: string) => {
    setCollapsedTiers((prev) => ({
      ...prev,
      [tierKey]: !prev[tierKey],
    }));
  };

  const getTierColor = (tier: TierType | 'addon') => {
    if (tier === 1) return { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', border: 'border-emerald-200', light: 'bg-emerald-50/40' };
    if (tier === 2) return { badge: 'bg-blue-50 text-blue-800 border-blue-200', border: 'border-blue-200', light: 'bg-blue-50/40' };
    if (tier === 3) return { badge: 'bg-purple-50 text-purple-800 border-purple-200', border: 'border-purple-200', light: 'bg-purple-50/40' };
    if (tier === 4) return { badge: 'bg-amber-50 text-amber-800 border-amber-200', border: 'border-amber-200', light: 'bg-amber-50/40' };
    return { badge: 'bg-slate-900 text-white border-slate-900', border: 'border-slate-300', light: 'bg-slate-50' };
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16 w-full min-w-0">
      {/* Encabezado Bento Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Configuración Maestra de Tiers & Escalera Comercial
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-010</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catálogo & Armador de Tiers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Modela qué funcionalidades desglosadas y qué pantallas operativas (KDS, Mostrador Pick Up, Sala y Hostess) se desbloquean en cada escalón.
          </p>
        </div>

        {/* Acciones Globales */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
            title="Restablecer Tiers a los valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Éxito Flotante */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configuración de Tiers guardada exitosamente y sincronizada en tiempo real con todas las sucursales.</span>
        </div>
      )}

      {/* Tarjeta Informativa de Política */}
      <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold block">Sincronización Automática con la Categoría 1 y 3 del Panel de Sucursal</span>
          <p className="text-slate-600 leading-relaxed">
            Cada checkbox que marques o desmarques actualiza automáticamente los servicios y pantallas permitidas en todas las sucursales suscritas o con periodos de prueba activos de dicho Tier.
          </p>
        </div>
      </div>

      {/* Listado de Tiers */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          Cargando catálogo maestro de Tiers...
        </div>
      ) : (
        <div className="space-y-6">
          {tiers.map((tierDef) => {
            const isCollapsed = !!collapsedTiers[String(tierDef.tier)];
            const color = getTierColor(tierDef.tier);

            return (
              <div
                key={String(tierDef.tier)}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Cabecera del Tier */}
                <div
                  onClick={() => toggleTierCollapse(String(tierDef.tier))}
                  className={`p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none ${color.light} hover:brightness-95 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    )}
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${color.badge}`}>
                      {tierDef.badge_label}
                    </span>
                    <div>
                      <h2 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                        {tierDef.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{tierDef.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        value={tierDef.price_mxn}
                        onChange={(e) =>
                          handleUpdateTierField(tierDef.tier, 'price_mxn', Math.max(0, Number(e.target.value)))
                        }
                        className="w-16 font-extrabold text-slate-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-right"
                      />
                      <span>MXN/mes</span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200">
                      {tierDef.included_features.length} funciones · {tierDef.included_stations.length} pantallas
                    </span>
                  </div>
                </div>

                {/* Contenido Desplegable: 3 Secciones con Switches y Visibilidad */}
                {!isCollapsed && (
                  <div>
                    {/* Barra de Edición de Identidad Comercial (Requerimiento 1) */}
                    <div className="bg-slate-50/90 p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                          <Type className="w-3 h-3 text-indigo-600" />
                          Nombre Comercial del Tier (Visible a Dueños / Marketing)
                        </label>
                        <input
                          type="text"
                          value={tierDef.name}
                          onChange={(e) => handleUpdateTierField(tierDef.tier, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ej: Tier 1: Enlace Directo (Etapa 1 - Siembra)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                          Subtítulo & Propuesta de Valor Comercial
                        </label>
                        <input
                          type="text"
                          value={tierDef.description}
                          onChange={(e) => handleUpdateTierField(tierDef.tier, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ej: Redirección instantánea a Google Reviews con semillero viral..."
                        />
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
                      {/* Columna 1: Funcionalidades Desglosadas con Switch y Visibilidad */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                              Funcionalidades Clave
                            </h3>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-700">
                            {tierDef.included_features.length} de {MASTER_TIER_FEATURES.length}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {MASTER_TIER_FEATURES.map((feat) => {
                            const isChecked = tierDef.included_features.includes(feat.id);
                            const isVisibleToClient =
                              tierDef.client_visible_features !== undefined
                                ? tierDef.client_visible_features.includes(feat.id)
                                : isChecked;

                            return (
                              <div
                                key={feat.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isChecked
                                    ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className={`text-xs font-bold block ${
                                        isChecked ? 'text-slate-900' : 'text-slate-600'
                                      }`}
                                    >
                                      {feat.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                                      {feat.description}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFeature(tierDef.tier, feat.id)}
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isChecked ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span
                                      className={`text-[10px] font-extrabold uppercase w-14 ${
                                        isChecked ? 'text-emerald-700' : 'text-slate-400'
                                      }`}
                                    >
                                      {isChecked ? 'Prendido' : 'Apagado'}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <label
                                    className={`inline-flex items-center gap-1.5 select-none text-[10px] font-bold ${
                                      isChecked
                                        ? 'cursor-pointer text-slate-600 hover:text-slate-800'
                                        : 'cursor-not-allowed text-slate-300 opacity-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={!isChecked}
                                      checked={isChecked && isVisibleToClient}
                                      onChange={() =>
                                        isChecked && handleToggleFeatureVisibility(tierDef.tier, feat.id)
                                      }
                                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3 text-slate-400" />
                                      Mostrar a Dueño
                                    </span>
                                  </label>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      !isChecked
                                        ? 'bg-slate-50 text-slate-300 border-slate-200'
                                        : isVisibleToClient
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {!isChecked ? 'Anulado (Apagado)' : isVisibleToClient ? 'Visible' : 'Oculto'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Columna 2: Acceso a Pantallas Operativas con Switch y Visibilidad */}
                      <div className="space-y-4 pt-6 xl:pt-0 xl:pl-6">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-orange-600" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                              Pantallas Operativas KDS
                            </h3>
                          </div>
                          <span className="text-[11px] font-bold text-orange-700">
                            {tierDef.included_stations.length} de {MASTER_TIER_STATIONS.length}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {MASTER_TIER_STATIONS.map((station) => {
                            const isChecked = tierDef.included_stations.includes(station.id);
                            const isVisibleToClient =
                              tierDef.client_visible_stations !== undefined
                                ? tierDef.client_visible_stations.includes(station.id)
                                : isChecked;

                            return (
                              <div
                                key={station.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isChecked
                                    ? 'bg-orange-50/40 border-orange-200 shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-xs font-bold ${
                                          isChecked ? 'text-slate-900' : 'text-slate-600'
                                        }`}
                                      >
                                        {station.name}
                                      </span>
                                      <span className="text-[10px] font-extrabold bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                                        Rol: {station.roleName}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                                      {station.description}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStation(tierDef.tier, station.id)}
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isChecked ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span
                                      className={`text-[10px] font-extrabold uppercase w-14 ${
                                        isChecked ? 'text-emerald-700' : 'text-slate-400'
                                      }`}
                                    >
                                      {isChecked ? 'Prendido' : 'Apagado'}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <label
                                    className={`inline-flex items-center gap-1.5 select-none text-[10px] font-bold ${
                                      isChecked
                                        ? 'cursor-pointer text-slate-600 hover:text-slate-800'
                                        : 'cursor-not-allowed text-slate-300 opacity-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={!isChecked}
                                      checked={isChecked && isVisibleToClient}
                                      onChange={() =>
                                        isChecked && handleToggleStationVisibility(tierDef.tier, station.id)
                                      }
                                      className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3 text-slate-400" />
                                      Mostrar a Dueño
                                    </span>
                                  </label>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      !isChecked
                                        ? 'bg-slate-50 text-slate-300 border-slate-200'
                                        : isVisibleToClient
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {!isChecked ? 'Anulado (Apagado)' : isVisibleToClient ? 'Visible' : 'Oculto'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Columna 3: Categorías Operativas Maestras (Requerimiento 3) */}
                      <div className="space-y-4 pt-6 xl:pt-0 xl:pl-6">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                              Categorías Operativas
                            </h3>
                          </div>
                          <span className="text-[11px] font-bold text-purple-700">
                            {(tierDef.allowed_categories || [3, 4, 5, 6]).length} de{' '}
                            {MASTER_TIER_CATEGORIES.length}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {MASTER_TIER_CATEGORIES.map((cat) => {
                            const isChecked = (tierDef.allowed_categories || [3, 4, 5, 6]).includes(
                              cat.id
                            );
                            const isVisibleToClient =
                              tierDef.client_visible_categories !== undefined
                                ? tierDef.client_visible_categories.includes(cat.id)
                                : isChecked;

                            return (
                              <div
                                key={cat.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isChecked
                                    ? 'bg-purple-50/40 border-purple-200 shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-xs font-bold ${
                                          isChecked ? 'text-slate-900' : 'text-slate-600'
                                        }`}
                                      >
                                        {cat.name}
                                      </span>
                                      <span className="text-[10px] font-extrabold bg-white border border-purple-200 px-1.5 py-0.2 rounded text-purple-700">
                                        {cat.badgeLabel}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                                      {cat.description}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCategory(tierDef.tier, cat.id)}
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isChecked ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span
                                      className={`text-[10px] font-extrabold uppercase w-14 ${
                                        isChecked ? 'text-emerald-700' : 'text-slate-400'
                                      }`}
                                    >
                                      {isChecked ? 'Prendido' : 'Apagado'}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <label
                                    className={`inline-flex items-center gap-1.5 select-none text-[10px] font-bold ${
                                      isChecked
                                        ? 'cursor-pointer text-slate-600 hover:text-slate-800'
                                        : 'cursor-not-allowed text-slate-300 opacity-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={!isChecked}
                                      checked={isChecked && isVisibleToClient}
                                      onChange={() =>
                                        isChecked && handleToggleCategoryVisibility(tierDef.tier, cat.id)
                                      }
                                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 disabled:cursor-not-allowed"
                                    />
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3 text-slate-400" />
                                      Mostrar a Dueño
                                    </span>
                                  </label>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      !isChecked
                                        ? 'bg-slate-50 text-slate-300 border-slate-200'
                                        : isVisibleToClient
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {!isChecked ? 'Anulado (Apagado)' : isVisibleToClient ? 'Visible' : 'Oculto'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
