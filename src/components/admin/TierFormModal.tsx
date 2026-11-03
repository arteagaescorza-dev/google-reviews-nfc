import React, { useState, useEffect } from 'react';
import type { CustomTierDefinition, BusinessVertical } from '../../types';
import {
  MASTER_TIER_FEATURES,
  MASTER_TIER_STATIONS,
  MASTER_TIER_CATEGORIES,
} from '../../lib/constants';
import {
  X,
  Layers,
  Save,
  DollarSign,
  Briefcase,
  Type,
  ShieldCheck,
  Monitor,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tier: CustomTierDefinition) => void;
  tierToEdit?: CustomTierDefinition | null;
  verticals: BusinessVertical[];
}

export const TierFormModal: React.FC<TierFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tierToEdit,
  verticals,
}) => {
  const isEditing = !!tierToEdit;

  const [tierNumber, setTierNumber] = useState<number>(1);
  const [badgeLabel, setBadgeLabel] = useState('Tier 1');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMxn, setPriceMxn] = useState<number>(0);
  const [verticalSlug, setVerticalSlug] = useState<string>('restaurant');
  const [includedFeatures, setIncludedFeatures] = useState<string[]>([
    'feat_redirect',
    'feat_viral_seeds',
  ]);
  const [includedStations, setIncludedStations] = useState<string[]>([]);
  const [allowedCategories, setAllowedCategories] = useState<number[]>([1, 2]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tierToEdit) {
      setTierNumber(typeof tierToEdit.tier === 'number' ? tierToEdit.tier : 1);
      setBadgeLabel(tierToEdit.badge_label || `Tier ${tierToEdit.tier}`);
      setName(tierToEdit.name || '');
      setDescription(tierToEdit.description || '');
      setPriceMxn(tierToEdit.price_mxn ?? 0);
      setVerticalSlug(tierToEdit.vertical_slug || 'all');
      setIncludedFeatures(tierToEdit.included_features || []);
      setIncludedStations(tierToEdit.included_stations || []);
      setAllowedCategories(tierToEdit.allowed_categories || [1, 2]);
    } else {
      setTierNumber(1);
      setBadgeLabel('Tier 1');
      setName('');
      setDescription('');
      setPriceMxn(0);
      setVerticalSlug('restaurant');
      setIncludedFeatures(['feat_redirect', 'feat_viral_seeds']);
      setIncludedStations([]);
      setAllowedCategories([1, 2]);
    }
    setErrorMsg('');
  }, [tierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleFeature = (id: string) => {
    setIncludedFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleStation = (id: string) => {
    setIncludedStations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCategory = (id: number) => {
    setAllowedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre comercial del Tier es requerido.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const selectedVertical = verticals.find((v) => v.slug === verticalSlug);
      const tierPayload: CustomTierDefinition = {
        id: tierToEdit?.id,
        tier: tierNumber,
        name: name.trim(),
        badge_label: badgeLabel.trim() || `Tier ${tierNumber}`,
        price_mxn: Number(priceMxn) || 0,
        description: description.trim(),
        vertical_slug: verticalSlug,
        vertical_id: selectedVertical ? selectedVertical.id : null,
        is_archived: tierToEdit?.is_archived ?? false,
        included_features: includedFeatures,
        included_stations: includedStations,
        client_visible_features: includedFeatures,
        client_visible_stations: includedStations,
        allowed_categories: allowedCategories,
        client_visible_categories: allowedCategories,
      };

      onSuccess(tierPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error guardando el Tier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-8">
        {/* Cabecera Bento */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-200">
                  {isEditing ? 'Edición de Tier' : 'Nuevo Tier'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">POL-008 / POL-010</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                {isEditing ? 'Modificar Definición de Tier' : 'Crear Nuevo Tier Comercial'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Bloque 1: Identidad y Tarifa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Nivel Numérico (Tier) *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={tierNumber}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setTierNumber(val);
                  if (!isEditing) {
                    setBadgeLabel(`Tier ${val}`);
                  }
                }}
                className="w-full px-3.5 py-2 text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Ej: 1, 2, 3, 4, 5...</span>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Etiqueta Badge *
              </label>
              <input
                type="text"
                required
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Ej: Tier 1, Plan Básico"
                className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Visible en fichas y tablas</span>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Precio Mensual (MXN) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={priceMxn}
                  onChange={(e) => setPriceMxn(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-16 py-2 text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                  MXN/mes
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">0 = Gratuito o Incluido</span>
            </div>
          </div>

          {/* Bloque 2: Giro Comercial */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Giro Comercial Objetivo *
            </label>
            <select
              value={verticalSlug}
              onChange={(e) => setVerticalSlug(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Universal (Aplica a todos los giros comerciales)</option>
              {verticals.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1.5 block">
              Al seleccionar un giro específico, este Tier solo estará disponible para sucursales de dicho sector.
            </span>
          </div>

          {/* Bloque 3: Nombre y Descripción */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                Nombre Comercial del Tier *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tier 2: Filtro de Reputación (Cliente Fundador)"
                className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Subtítulo & Propuesta de Valor Comercial
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Calificaciones de 4-5 estrellas van a Google; 1-3 a buzón privado con cupones de gerente y menú digital."
                className="w-full px-3.5 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Bloque 4: Funcionalidades Clave */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Funcionalidades Habilitadas ({includedFeatures.length})
              </label>
              <span className="text-[10px] text-indigo-700 font-bold">
                {includedFeatures.length} de {MASTER_TIER_FEATURES.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MASTER_TIER_FEATURES.map((feat) => {
                const checked = includedFeatures.includes(feat.id);
                return (
                  <label
                    key={feat.id}
                    onClick={() => handleToggleFeature(feat.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="truncate">{feat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bloque 5: Pantallas Operativas KDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-amber-600" />
                Pantallas Operativas KDS ({includedStations.length})
              </label>
              <span className="text-[10px] text-amber-700 font-bold">
                {includedStations.length} de {MASTER_TIER_STATIONS.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MASTER_TIER_STATIONS.map((station) => {
                const checked = includedStations.includes(station.id);
                return (
                  <label
                    key={station.id}
                    onClick={() => handleToggleStation(station.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950 font-bold shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <span className="truncate">{station.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bloque 6: Categorías Operativas Habilitadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Categorías Operativas Habilitadas ({allowedCategories.length})
              </label>
              <span className="text-[10px] text-purple-700 font-bold">
                {allowedCategories.length} de {MASTER_TIER_CATEGORIES.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MASTER_TIER_CATEGORIES.map((cat) => {
                const checked = allowedCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-purple-50/60 border-purple-200 text-purple-950 font-bold shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                    />
                    <span className="truncate">{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Pie con Acciones */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Tier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
