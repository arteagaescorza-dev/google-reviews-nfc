import React, { useState, useEffect } from 'react';
import type { PrintBatch } from '../../types';
import { api } from '../../lib/api';
import {
  Download,
  X,
  Printer,
} from 'lucide-react';

interface PrintBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: () => void;
  existingBatches: PrintBatch[];
}

export const PrintBatchModal: React.FC<PrintBatchModalProps> = ({
  isOpen,
  onClose,
  onBatchCreated,
  existingBatches,
}) => {
  const [totalUnits, setTotalUnits] = useState<number>(250);
  const [prefix, setPrefix] = useState<string>('TAG-');
  const [supplierName, setSupplierName] = useState<string>('Imprenta Central');
  const unitCost = 12.0;
  const [startRange, setStartRange] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Calcular el siguiente rango inicial a partir del lote con mayor número final
  useEffect(() => {
    if (existingBatches && existingBatches.length > 0) {
      const maxEnd = Math.max(...existingBatches.map((b) => b.range_end || 0), 0);
      setStartRange(maxEnd + 1);
    } else {
      setStartRange(1);
    }
  }, [existingBatches, isOpen]);

  if (!isOpen) return null;

  const endRange = startRange + totalUnits - 1;
  const totalCost = totalUnits * unitCost;

  const handleCreateAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await api.createPrintBatch({
      supplier_name: supplierName.trim() || 'Imprenta Central',
      total_units: totalUnits,
      prefix: prefix.trim().toUpperCase(),
      range_start: startRange,
      range_end: endRange,
      unit_cost_mxn: unitCost,
      specifications: {
        tamano: '6x6cm (60x60mm)',
        material: 'vinil_adhesivo_3m',
        laminado: 'mate_uv',
        corte: 'suaje_redondo_diametro_60mm',
        marcas_corte: 'registro_cruz_optica',
      },
    });

    setSubmitting(false);

    if (res.success && res.data) {
      // Generar archivo SVG para imprenta
      const svgContent = api.generatePrintSheetSvg({
        prefix: prefix.trim().toUpperCase(),
        start: startRange,
        end: endRange,
        batchNumber: res.data.batch_number,
      });

      // Disparar descarga automática en navegador
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pliego_Imprenta_${res.data.batch_number}_${prefix}${startRange}-${endRange}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onBatchCreated();
    } else {
      alert('Error registrando lote: ' + (res.error || 'Desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 overflow-hidden relative">
        {/* Cabecera Bento */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Generador de Pliegos para Imprenta
              </h3>
              <p className="text-xs text-slate-500">
                Vector SVG con guías de corte, marcas de registro y suaje circular de 6x6cm
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

        <form onSubmit={handleCreateAndDownload} className="mt-6 space-y-5">
          {/* Selector de Unidades */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tiraje de Producción (Unidades)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[100, 250, 500].map((qty) => (
                <button
                  type="button"
                  key={qty}
                  onClick={() => setTotalUnits(qty)}
                  className={`py-3 px-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                    totalUnits === qty
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base font-mono">{qty}</span>
                  <span className={`text-[10px] ${totalUnits === qty ? 'text-blue-100' : 'text-slate-400'}`}>
                    placas físicas
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rango y Prefijo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prefijo de Folio
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proveedor / Imprenta
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900"
                required
              />
            </div>
          </div>

          {/* Ficha Resumen de Producción */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Rango correlativo calculado:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {prefix}{String(startRange).padStart(4, '0')} &rarr; {prefix}{String(endRange).padStart(4, '0')}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Especificación física:</span>
              <span className="font-medium text-slate-800">Vinil Adhesivo 3M + Laminado UV Mate</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Guía de suaje:</span>
              <span className="font-medium text-slate-800">Corte circular 60mm de diámetro</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-sm">
              <span>Costo estimado de producción:</span>
              <span className="font-mono text-blue-600">${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
            </div>
          </div>

          {/* Botones de Acción */}
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {submitting ? 'Generando Vector...' : 'Generar y Descargar Pliego SVG'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
