import React, { useState } from 'react';
import { api } from '../../lib/api';
import { X, QrCode, Sparkles } from 'lucide-react';

interface TagBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export const TagBatchModal: React.FC<TagBatchModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const [prefix, setPrefix] = useState('NFC-');
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startNum > endNum) {
      setErrorMsg('El número inicial no puede ser mayor al final.');
      return;
    }
    if (endNum - startNum > 200) {
      setErrorMsg('Por favor genera un máximo de 200 tags por lote.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');

    try {
      await api.createBatchTags(prefix, startNum, endNum);
      setIsGenerating(false);
      onGenerated();
      onClose();
    } catch (e: any) {
      setIsGenerating(false);
      setErrorMsg(e.message || 'Error al generar tags');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generador de Tags en Lote</h3>
              <p className="text-xs text-slate-500">Crea códigos para programar chips NFC físicamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Prefijo del Código
            </label>
            <input
              type="text"
              required
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="Ej. NFC- o MESA-"
              className="w-full p-3 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Desde (#)
              </label>
              <input
                type="number"
                min={1}
                required
                value={startNum}
                onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hasta (#)
              </label>
              <input
                type="number"
                min={1}
                required
                value={endNum}
                onChange={(e) => setEndNum(parseInt(e.target.value) || 1)}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>
              Se generarán <strong>{Math.max(0, endNum - startNum + 1)}</strong> códigos ({prefix}
              {String(startNum).padStart(3, '0')} al {prefix}
              {String(endNum).padStart(3, '0')}).
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generando...' : 'Crear Lote de Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
