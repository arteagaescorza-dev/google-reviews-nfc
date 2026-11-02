import React, { useState } from 'react';
import type { HardwareInventoryItem } from '../../types';
import { api } from '../../lib/api';
import {
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Box,
  Package,
} from 'lucide-react';

interface HardwareInventoryBentoProps {
  items: HardwareInventoryItem[];
  onRefresh: () => void;
  onOpenPrintModal: () => void;
}

export const HardwareInventoryBento: React.FC<HardwareInventoryBentoProps> = ({
  items,
  onRefresh,
  onOpenPrintModal,
}) => {
  const [restockingSku, setRestockingSku] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const chipItem = items.find((i) => i.category === 'nfc_chip') || {
    sku: 'CHIP-NTAG213-RAW',
    item_name: 'Chips NFC NTAG213 Circulares 25mm Virgenes',
    category: 'nfc_chip' as const,
    stock_available: 350,
    stock_allocated: 45,
    stock_min_threshold: 100,
    unit_cost_mxn: 4.5,
    updated_at: new Date().toISOString(),
    id: 'default-chip',
  };

  const vinylItem = items.find((i) => i.category === 'vinyl_sticker') || {
    sku: 'VINYL-3M-GLOSS',
    item_name: 'Viniles Adhesivos 3M 6x6cm Impresos UV Mate',
    category: 'vinyl_sticker' as const,
    stock_available: 420,
    stock_allocated: 45,
    stock_min_threshold: 150,
    unit_cost_mxn: 12.0,
    updated_at: new Date().toISOString(),
    id: 'default-vinyl',
  };

  const standItem = items.find((i) => i.category === 'acrylic_stand');

  const chipNeedsReorder = chipItem.stock_available <= chipItem.stock_min_threshold;
  const vinylNeedsReorder = vinylItem.stock_available <= vinylItem.stock_min_threshold;

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingSku || restockAmount <= 0) return;

    setSubmitting(true);
    const res = await api.updateHardwareStock(restockingSku, restockAmount);
    setSubmitting(false);
    if (res.success) {
      setRestockingSku(null);
      setRestockAmount(100);
      onRefresh();
    } else {
      alert('Error actualizando stock: ' + res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cuadrícula Bento de 3 Columnas en Modo Claro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Bento Card 1: Chips NFC NTAG213 */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  chipNeedsReorder
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {chipNeedsReorder ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Punto de Reorden
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Stock Óptimo
                  </>
                )}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Insumo Base</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{chipItem.item_name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {chipItem.sku}</p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                {chipItem.stock_available.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-600">unidades virgenes</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-600 block">En mesas activas:</span>
                <span className="font-bold text-slate-800 font-mono">{chipItem.stock_allocated} uds</span>
              </div>
              <div>
                <span className="text-slate-600 block">Costo unitario:</span>
                <span className="font-bold text-slate-800 font-mono">${chipItem.unit_cost_mxn.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <button
              onClick={() => setRestockingSku(chipItem.sku)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Ingresar Lote de Chips
            </button>
          </div>
        </div>

        {/* Bento Card 2: Viniles Adhesivos Impresos 3M */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  vinylNeedsReorder
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {vinylNeedsReorder ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Punto de Reorden
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Stock Disponible
                  </>
                )}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Impresión Física</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{vinylItem.item_name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {vinylItem.sku}</p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                {vinylItem.stock_available.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-600">calcomanias en stock</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-600 block">Instaladas en sala:</span>
                <span className="font-bold text-slate-800 font-mono">{vinylItem.stock_allocated} uds</span>
              </div>
              <div>
                <span className="text-slate-600 block">Costo imprenta:</span>
                <span className="font-bold text-slate-800 font-mono">${vinylItem.unit_cost_mxn.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <button
              onClick={() => setRestockingSku(vinylItem.sku)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Ingresar Lote de Viniles
            </button>
          </div>
        </div>

        {/* Bento Card 3: Semáforo de Producción y Reorden Óptimo */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                <Box className="w-6 h-6" />
              </div>
              <button
                onClick={onRefresh}
                className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Actualizar existencias"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logística de Bodega</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Semáforo de Reabastecimiento</h3>

            <div className="mt-5 space-y-4">
              {/* Barra de nivel Chips */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Chips NTAG213</span>
                  <span className="text-slate-800 font-mono">
                    {chipItem.stock_available} / {chipItem.stock_min_threshold} min
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      chipNeedsReorder ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{
                      width: `${Math.min(100, (chipItem.stock_available / (chipItem.stock_min_threshold * 2)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barra de nivel Viniles */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Viniles 3M 6x6cm</span>
                  <span className="text-slate-800 font-mono">
                    {vinylItem.stock_available} / {vinylItem.stock_min_threshold} min
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      vinylNeedsReorder ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (vinylItem.stock_available / (vinylItem.stock_min_threshold * 2)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bases Acrílicas si existen */}
              {standItem && (
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Bases Acrílico A6</span>
                    <span className="text-slate-800 font-mono">
                      {standItem.stock_available} / {standItem.stock_min_threshold} min
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (standItem.stock_available / (standItem.stock_min_threshold * 2)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-3">
            <button
              onClick={onOpenPrintModal}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              Generar Pliego para Imprenta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Ingreso Rápido de Stock */}
      {restockingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Entrada de Almacén</h4>
                <p className="text-xs text-slate-500 font-mono">{restockingSku}</p>
              </div>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad a Ingresar (Unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-mono text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-2">
                {[50, 100, 250, 500].map((quick) => (
                  <button
                    type="button"
                    key={quick}
                    onClick={() => setRestockAmount(quick)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    +{quick}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockingSku(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
