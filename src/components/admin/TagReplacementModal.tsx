import React, { useState } from 'react';
import type { Tag, Restaurant } from '../../types';
import { api } from '../../lib/api';
import {
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';

interface TagReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  restaurants: Restaurant[];
  onReplacementCompleted: () => void;
}

export const TagReplacementModal: React.FC<TagReplacementModalProps> = ({
  isOpen,
  onClose,
  tags,
  restaurants,
  onReplacementCompleted,
}) => {
  const [oldTagCode, setOldTagCode] = useState<string>('');
  const [newTagCode, setNewTagCode] = useState<string>('');
  const [reason, setReason] = useState<string>('Desgaste por uso y desengrasante químico');
  const [installerName, setInstallerName] = useState<string>('Técnico de Campo');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const activeTags = tags.filter((t) => t.is_active && t.restaurant_id);
  const selectedOldTag = tags.find((t) => t.tag_code === oldTagCode);
  const tagRestaurant = selectedOldTag
    ? restaurants.find((r) => r.id === selectedOldTag.restaurant_id)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldTagCode) {
      setErrorMsg('Selecciona la placa antigua que será sustituida.');
      return;
    }
    if (!newTagCode.trim()) {
      setErrorMsg('Ingresa o escanea el nuevo código de placa física.');
      return;
    }
    if (oldTagCode.trim().toUpperCase() === newTagCode.trim().toUpperCase()) {
      setErrorMsg('El nuevo código no puede ser igual al código antiguo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await api.replaceDamagedTableTag({
      old_tag_code: oldTagCode.trim().toUpperCase(),
      new_tag_code: newTagCode.trim().toUpperCase(),
      installer_name: installerName.trim() || 'Técnico de Campo',
      reason: reason,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      onReplacementCompleted();
    } else {
      setErrorMsg(res.error || 'Error al ejecutar la sustitución de la placa.');
    }
  };

  const handleReset = () => {
    setOldTagCode('');
    setNewTagCode('');
    setErrorMsg(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 overflow-hidden relative">
        {/* Cabecera Bento */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Gestor de Reposición por Desgaste
              </h3>
              <p className="text-xs text-slate-500">
                Sustituye viniles dañados sin perder el histórico de escaneos de la mesa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                ¡Reposición Completada con Trazabilidad!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                La mesa fue transferida a la nueva placa y el stock de viniles fue actualizado (-1).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Placa antigua (Retirada):</span>
                <span className="font-mono text-slate-500 line-through">{oldTagCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nueva Placa (En Mesa):</span>
                <span className="font-mono font-bold text-emerald-600">{newTagCode.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mesa:</span>
                <span className="font-bold text-slate-900">{selectedOldTag?.table_identifier || 'Mesa'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Restaurante:</span>
                <span className="font-bold text-slate-900">{tagRestaurant?.name || 'Local'}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all mt-3"
            >
              Finalizar y Volver
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Placa Dañada o Desgastada (Retirar)
              </label>
              <select
                value={oldTagCode}
                onChange={(e) => setOldTagCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono text-slate-900 bg-white"
                required
              >
                <option value="">-- Seleccionar Placa a Sustituir --</option>
                {activeTags.map((t) => {
                  const rest = restaurants.find((r) => r.id === t.restaurant_id);
                  return (
                    <option key={t.id} value={t.tag_code}>
                      {t.tag_code} &bull; {rest?.name || 'Sin Asignar'} &bull; {t.table_identifier || 'Sin mesa'}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedOldTag && (
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ubicación física:</span>
                  <span className="font-bold text-slate-900">
                    {tagRestaurant?.name} ({selectedOldTag.table_identifier})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Histórico de escaneos:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedOldTag.scan_count || 0} visitas</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nuevo Código de Placa Física
              </label>
              <input
                type="text"
                placeholder="ej. TAG-0820 o NFC-105"
                value={newTagCode}
                onChange={(e) => setNewTagCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono font-bold text-slate-900 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Causa del Reemplazo
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
              >
                <option value="Desgaste por uso y desengrasante químico">
                  Desgaste por uso / desengrasante químico
                </option>
                <option value="Daño por sol / decoloración UV">Daño solar / decoloración UV</option>
                <option value="Desprendimiento adhesivo de mesa">Desprendimiento de superficie</option>
                <option value="Fallo de lectura de chip NFC">Fallo de antena NFC</option>
                <option value="Cambio o renovación de mobiliario">Cambio o renovación de mesa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Instalador Responsable
              </label>
              <input
                type="text"
                value={installerName}
                onChange={(e) => setInstallerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                {submitting ? 'Procesando...' : 'Reemplazar y Preservar Mesa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
