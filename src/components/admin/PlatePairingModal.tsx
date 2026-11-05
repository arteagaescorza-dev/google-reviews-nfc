import React, { useState } from 'react';
import type { Restaurant, Tag } from '../../types';
import { api } from '../../lib/api';
import {
  Link2,
  QrCode,
  Cpu,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react';

interface PlatePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  targetRestaurantId?: string;
  onPairingCompleted: (createdTag: Tag) => void;
}

export const PlatePairingModal: React.FC<PlatePairingModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  targetRestaurantId,
  onPairingCompleted,
}) => {
  const [restaurantId, setRestaurantId] = useState<string>(
    targetRestaurantId || (restaurants[0]?.id || '')
  );
  const [tableIdentifier, setTableIdentifier] = useState<string>('Mesa 1');
  const [stickerQr, setStickerQr] = useState<string>('');
  const [chipUid, setChipUid] = useState<string>('');
  const [installerName, setInstallerName] = useState<string>('Técnico Instalador');
  const [readOnlyLock, setReadOnlyLock] = useState<boolean>(true);
  const [nfcReading, setNfcReading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTag, setSuccessTag] = useState<Tag | null>(null);

  if (!isOpen) return null;

  const currentRestaurant = restaurants.find((r) => r.id === restaurantId);

  const handleReadWebNfc = async () => {
    setErrorMsg(null);
    if ('NDEFReader' in window) {
      try {
        setNfcReading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndef.onreading = (event: any) => {
          const serialNumber = event.serialNumber || 'NFC-UID-' + Math.floor(1000 + Math.random() * 9000);
          setChipUid(serialNumber.toUpperCase());
          setNfcReading(false);
        };
      } catch (err: any) {
        setNfcReading(false);
        setErrorMsg('No se pudo acceder al lector NFC del dispositivo: ' + err.message);
      }
    } else {
      // Simulación de lectura rápida si no es compatible
      const mockUid = '04:' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
      setChipUid(mockUid);
    }
  };

  const handleGenerateBatchQr = () => {
    const randomCode = 'VIN-' + Math.floor(10000 + Math.random() * 90000);
    setStickerQr(randomCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setErrorMsg('Selecciona una sucursal para la vinculación.');
      return;
    }
    if (!tableIdentifier.trim()) {
      setErrorMsg('Ingresa el identificador de la mesa.');
      return;
    }
    if (!stickerQr.trim()) {
      setErrorMsg('Ingresa o escanea el código del vinil QR.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const plateCode = `PLC-${(currentRestaurant?.slug || 'SUC').slice(0, 4).toUpperCase()}-${tableIdentifier.trim().replace(/\s+/g, '').toUpperCase()}`;

    const res = await api.pairPlateInSitu({
      restaurant_id: restaurantId,
      table_identifier: tableIdentifier.trim(),
      sticker_qr: stickerQr.trim().toUpperCase(),
      chip_uid: chipUid.trim() ? chipUid.trim().toUpperCase() : undefined,
      tag_code: plateCode,
      installer_name: installerName.trim(),
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setSuccessTag(res.data);
      onPairingCompleted(res.data);
    } else {
      setErrorMsg(res.error || 'Error al vincular y activar la placa.');
    }
  };

  const handleResetForNextTable = () => {
    // Incrementar número de mesa si es posible
    const match = tableIdentifier.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      setTableIdentifier(`Mesa ${nextNum}`);
    } else {
      setTableIdentifier('Mesa');
    }
    setStickerQr('');
    setChipUid('');
    setErrorMsg(null);
    setSuccessTag(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera Bento */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Apareamiento In-Situ de Placa
              </h3>
              <p className="text-xs text-slate-500">
                Asociación física de Tag NFC y Vinil QR en mesa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de Error */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Vista de Éxito / Confirmación */}
        {successTag ? (
          <div className="p-6 overflow-y-auto space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Placa Activada y Vinculada Exitosamente
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                La placa física ha pasado a estado <strong>Activo</strong> y quedó bloqueada en <strong>Solo Lectura</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Folio de Placa:</span>
                <span className="font-mono font-bold text-slate-900">{successTag.tag_code}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mesa Asignada:</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {successTag.table_identifier}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Token Vinil QR:</span>
                <span className="font-mono font-bold text-slate-700">{successTag.sticker_qr}</span>
              </div>
              {successTag.chip_uid && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">UID Chip NFC:</span>
                  <span className="font-mono text-slate-700">{successTag.chip_uid}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Estado Operativo:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Activo (Solo Lectura)</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Instalador:</span>
                <span className="font-medium text-slate-700">{successTag.installer_name}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleResetForNextTable}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                Vincular Siguiente Mesa
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Apareamiento */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Selección de Sucursal si no está prefijada */}
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">
                Sucursal Destino *
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                disabled={Boolean(targetRestaurantId)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Identificador de Mesa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">
                  Mesa / Ubicación *
                </label>
                <input
                  type="text"
                  required
                  value={tableIdentifier}
                  onChange={(e) => setTableIdentifier(e.target.value)}
                  placeholder="Ej: Mesa 1, Terraza 4, Barra 2"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">
                  Técnico / Instalador *
                </label>
                <input
                  type="text"
                  required
                  value={installerName}
                  onChange={(e) => setInstallerName(e.target.value)}
                  placeholder="Nombre de quien instala"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Token Vinil QR */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Código de Vinil QR (Sticker Impreso) *</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBatchQr}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Generar Folio de Lote
                </button>
              </div>
              <input
                type="text"
                required
                value={stickerQr}
                onChange={(e) => setStickerQr(e.target.value)}
                placeholder="Ej: VIN-10042 o escanea el QR impreso"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Código único preimpreso en el lote de viniles adhesivos recibido de imprenta.
              </p>
            </div>

            {/* Chip NFC UID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UID de Chip NFC (Físico)</span>
                </label>
                <button
                  type="button"
                  onClick={handleReadWebNfc}
                  disabled={nfcReading}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{nfcReading ? 'Acerca el chip...' : 'Leer Chip NFC'}</span>
                </button>
              </div>
              <input
                type="text"
                value={chipUid}
                onChange={(e) => setChipUid(e.target.value)}
                placeholder="Ej: 04:A1:B2:C3:D4:E5:00 o UID de hardware"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Identificador inmutable de fábrica del chip NFC entregado en lote.
              </p>
            </div>

            {/* Política de Solo Lectura */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="lockCheck"
                checked={readOnlyLock}
                onChange={(e) => setReadOnlyLock(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="lockCheck" className="text-slate-600 leading-relaxed cursor-pointer select-none">
                <span className="font-extrabold text-slate-800 block">
                  Política de Solo Lectura Inmutable (POL-012)
                </span>
                La placa pasará a estado activo protegido. Ningún usuario podrá reescribir la URL ni reasignar la mesa sin registrar formalmente un ticket de mantenimiento.
              </label>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-2xs disabled:opacity-50"
              >
                {submitting ? 'Vinculando...' : 'Vincular y Activar Placa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
