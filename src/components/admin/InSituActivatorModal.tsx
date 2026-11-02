import React, { useState } from 'react';
import type { Restaurant } from '../../types';
import { api } from '../../lib/api';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Scan,
  ArrowRight,
  Check,
  Plus,
} from 'lucide-react';

interface InSituActivatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onTagActivated: () => void;
}

export const InSituActivatorModal: React.FC<InSituActivatorModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  onTagActivated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tagCode, setTagCode] = useState<string>('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [tableIdentifier, setTableIdentifier] = useState<string>('');
  const [installerName, setInstallerName] = useState<string>('Técnico de Campo');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nfcScanning, setNfcScanning] = useState(false);

  if (!isOpen) return null;

  const handleStartNfcScan = async () => {
    if ('NDEFReader' in window) {
      try {
        setNfcScanning(true);
        setErrorMsg(null);
        // @ts-ignore
        const ndef = new window.NDEFReader();
        await ndef.scan();
        // @ts-ignore
        ndef.onreading = (event: any) => {
          const serial = event.serialNumber;
          for (const record of event.message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              const url = decoder.decode(record.data);
              const match = url.match(/[?&]tag=([^&]+)/) || url.match(/\/r\/([^/?]+)/);
              if (match) {
                setTagCode(match[1].toUpperCase());
                setStep(2);
                setNfcScanning(false);
                return;
              }
            }
          }
          if (serial) {
            setTagCode(`NFC-${serial.slice(-6).toUpperCase()}`);
            setStep(2);
            setNfcScanning(false);
          }
        };
      } catch (err: any) {
        setNfcScanning(false);
        setErrorMsg('No se pudo acceder a la antena NFC: ' + (err.message || 'Permiso denegado'));
      }
    } else {
      setErrorMsg('La API Web NFC no está disponible en este navegador. Digita el código impreso en el vinil.');
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagCode.trim()) {
      setErrorMsg('Por favor ingresa o escanea el código del tag.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinalActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) {
      setErrorMsg('Selecciona el restaurante o sucursal.');
      return;
    }
    if (!tableIdentifier.trim()) {
      setErrorMsg('Ingresa el identificador de mesa (ej. Mesa 04).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await api.activateTableTagInSitu({
      tag_code: tagCode.trim().toUpperCase(),
      restaurant_id: selectedRestaurantId,
      table_identifier: tableIdentifier.trim(),
      installer_name: installerName.trim() || 'Técnico de Campo',
    });

    setSubmitting(false);

    if (res.success) {
      setStep(3);
      onTagActivated();
    } else {
      setErrorMsg(res.error || 'Error al activar la placa en mesa.');
    }
  };

  const handleResetForNextTable = () => {
    setTagCode('');
    setTableIdentifier('');
    setErrorMsg(null);
    setStep(1);
  };

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 overflow-hidden relative">
        {/* Cabecera Bento */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Activador Express en Mesa (In-Situ)
              </h3>
              <p className="text-xs text-slate-500">
                Paso a paso de campo: escanea, vincula el local y descuenta stock en 1 clic
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

        {/* Indicador de Pasos Bento */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <div
            className={`py-2 px-1 rounded-xl font-bold border transition-colors ${
              step === 1
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : step > 1
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            1. Escanear Tag
          </div>
          <div
            className={`py-2 px-1 rounded-xl font-bold border transition-colors ${
              step === 2
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : step > 2
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            2. Local & Mesa
          </div>
          <div
            className={`py-2 px-1 rounded-xl font-bold border transition-colors ${
              step === 3
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            3. Verificación
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Paso 1: Escaneo o captura de Tag */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código del Vinil Físico
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ej. TAG-0142 o NFC-098"
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 uppercase tracking-wider"
                  autoFocus
                />
                <div className="absolute right-3 top-3 text-slate-400">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartNfcScan}
                disabled={nfcScanning}
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Scan className={`w-4 h-4 ${nfcScanning ? 'animate-spin text-blue-600' : ''}`} />
                {nfcScanning ? 'Acerca el chip NFC al teléfono...' : 'Escanear con Antena Web NFC'}
              </button>
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
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                Continuar a Asignación
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Paso 2: Selección de Restaurante y Mesa */}
        {step === 2 && (
          <form onSubmit={handleFinalActivation} className="mt-6 space-y-4">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Tag a Vincular:</span>
              <span className="font-mono font-bold text-blue-700 text-sm bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                {tagCode}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurante / Sucursal
              </label>
              <select
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                required
              >
                <option value="">-- Selecciona el Restaurante --</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.branch_name ? `(${r.branch_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Número o Nombre de la Mesa
              </label>
              <input
                type="text"
                placeholder="ej. Mesa 04, Terraza 2, Barra Norte"
                value={tableIdentifier}
                onChange={(e) => setTableIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Técnico Instalador
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
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Activando...' : 'Activar y Descontar Stock'}
              </button>
            </div>
          </form>
        )}

        {/* Paso 3: Confirmación de Éxito */}
        {step === 3 && (
          <div className="mt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                ¡Placa Activada Exitosamente en Mesa!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                El stock de bodega se actualizó (-1 chip, -1 vinil) y la placa ya redirige en vivo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tag Físico:</span>
                <span className="font-mono font-bold text-slate-900">{tagCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Restaurante:</span>
                <span className="font-bold text-slate-900">{selectedRestaurant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mesa:</span>
                <span className="font-bold text-slate-900">{tableIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Instalador:</span>
                <span className="text-slate-700">{installerName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cerrar Asistente
              </button>
              <button
                type="button"
                onClick={handleResetForNextTable}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Vincular Siguiente Mesa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
