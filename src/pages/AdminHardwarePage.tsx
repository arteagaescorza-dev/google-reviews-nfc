import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { HardwareInventoryItem, PrintBatch, Tag, Restaurant } from '../types';
import { HardwareInventoryBento } from '../components/admin/HardwareInventoryBento';
import { PrintBatchModal } from '../components/admin/PrintBatchModal';
import { InSituActivatorModal } from '../components/admin/InSituActivatorModal';
import { TagReplacementModal } from '../components/admin/TagReplacementModal';
import { PlatePairingModal } from '../components/admin/PlatePairingModal';
import { Link2 } from 'lucide-react';
import {
  Printer,
  Smartphone,
  RefreshCw,
  Plus,
  Download,
  History,
  QrCode,
} from 'lucide-react';

export const AdminHardwarePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<HardwareInventoryItem[]>([]);
  const [batches, setBatches] = useState<PrintBatch[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Modales
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isInSituModalOpen, setIsInSituModalOpen] = useState(false);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [isPlatePairingOpen, setIsPlatePairingOpen] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    const [invData, batchData, tagData, resData] = await Promise.all([
      api.getHardwareInventory(),
      api.getPrintBatches(),
      api.getTags(),
      api.getRestaurants(),
    ]);
    setInventory(invData);
    setBatches(batchData);
    setTags(tagData);
    setRestaurants(resData);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleDownloadExistingBatchSvg = (batch: PrintBatch) => {
    const svg = api.generatePrintSheetSvg({
      prefix: batch.prefix || 'TAG-',
      start: batch.range_start,
      end: batch.range_end,
      batchNumber: batch.batch_number,
    });
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pliego_Imprenta_${batch.batch_number}_${batch.prefix}${batch.range_start}-${batch.range_end}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Métricas de trazabilidad física
  const installedCount = tags.filter((t) => t.is_active && t.restaurant_id).length;
  const replacedCount = tags.filter((t) => (t as any).physical_condition === 'reemplazado').length;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Cargando inventario de hardware y lotes de imprenta...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Principal Bento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Capa 1: Hardware & Bodega
            </span>
            <span className="text-xs text-slate-400 font-mono">POL-003 Trazabilidad Física</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock de Hardware & Imprenta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de chips NTAG213, lotes de viniles 3M para imprenta y activador express in-situ.
          </p>
        </div>

        {/* Acciones Ejecutivas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPlatePairingOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Vincular Placa In-Situ
          </button>
          <button
            onClick={() => setIsInSituModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/20 flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Activador In-Situ (Mesa)
          </button>
          <button
            onClick={() => setIsReplacementModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            Reposición por Desgaste
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-blue-600/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Nuevo Pliego Imprenta
          </button>
        </div>
      </div>

      {/* Fila 1: Bento Cards de Insumos (UI-HW-01) */}
      <HardwareInventoryBento
        items={inventory}
        onRefresh={loadAllData}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
      />

      {/* Fila 2: Bento Grid con Trazabilidad en Campo y Lotes de Imprenta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tarjeta Bento de Trazabilidad en Sala */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Campo & Mesas
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">Trazabilidad de Placas Físicas</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado operativo de placas vinculadas en restaurantes
            </p>

            <div className="mt-6 space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-slate-700">Placas Activas en Mesa</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{installedCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-slate-700">Placas Virgenes en Stock</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {inventory.find((i) => i.category === 'vinyl_sticker')?.stock_available || 0}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-slate-700">Reposiciones por Desgaste</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{replacedCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Garantía de chip:</span>
            <span className="font-medium text-slate-800">10 años / 100,000 ciclos</span>
          </div>
        </div>

        {/* Columna Derecha (Col-Span-2): Historial de Lotes de Imprenta (UI-HW-02) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Historial de Lotes de Imprenta</h3>
                <p className="text-xs text-slate-500">
                  Control de folios emitidos y reimpresión de pliegos vectoriales
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Lote
            </button>
          </div>

          {batches.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No hay lotes de imprenta registrados aún. Pulsa en "Nuevo Pliego Imprenta" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Lote</th>
                    <th className="pb-3 font-semibold">Proveedor</th>
                    <th className="pb-3 font-semibold">Rango de Folios</th>
                    <th className="pb-3 font-semibold">Tiraje</th>
                    <th className="pb-3 font-semibold">Estado</th>
                    <th className="pb-3 font-semibold">Costo Total</th>
                    <th className="pb-3 font-semibold text-right">Pliego</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const rangeText = `${batch.prefix || 'TAG-'}${String(batch.range_start).padStart(4, '0')} a ${batch.prefix || 'TAG-'}${String(batch.range_end).padStart(4, '0')}`;
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">
                          {batch.batch_number}
                        </td>
                        <td className="py-3 text-slate-700">{batch.supplier_name}</td>
                        <td className="py-3 font-mono text-slate-600">{rangeText}</td>
                        <td className="py-3 font-mono font-bold text-slate-800">
                          {batch.total_units} uds
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                            {batch.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-900">
                          ${(batch.cost_total_mxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDownloadExistingBatchSvg(batch)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descargar Vector SVG"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modales de Control */}
      <PrintBatchModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onBatchCreated={loadAllData}
        existingBatches={batches}
      />

      <InSituActivatorModal
        isOpen={isInSituModalOpen}
        onClose={() => setIsInSituModalOpen(false)}
        restaurants={restaurants}
        onTagActivated={loadAllData}
      />

      <TagReplacementModal
        isOpen={isReplacementModalOpen}
        onClose={() => setIsReplacementModalOpen(false)}
        tags={tags}
        restaurants={restaurants}
        onReplacementCompleted={loadAllData}
      />

      <PlatePairingModal
        isOpen={isPlatePairingOpen}
        onClose={() => setIsPlatePairingOpen(false)}
        restaurants={restaurants}
        onPairingCompleted={async () => {
          await loadAllData();
        }}
      />
    </div>
  );
};
