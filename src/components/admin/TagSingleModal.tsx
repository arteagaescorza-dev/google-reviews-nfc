import React, { useState, useEffect } from 'react';
import type { Restaurant, Tag } from '../../types';
import { api } from '../../lib/api';
import { X, QrCode } from 'lucide-react';

interface TagSingleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  restaurants: Restaurant[];
  defaultRestaurantId?: string;
  existingTags: Tag[];
}

export const TagSingleModal: React.FC<TagSingleModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  restaurants,
  defaultRestaurantId,
  existingTags,
}) => {
  const [tagCode, setTagCode] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [tableIdentifier, setTableIdentifier] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRestaurantId(defaultRestaurantId || '');
      setTableIdentifier('');
      setErrorMsg('');

      // Auto-sugerir siguiente código NFC disponible
      const nfcNumbers = existingTags
        .map((t) => {
          const match = t.tag_code.match(/NFC-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);

      const maxNum = nfcNumbers.length > 0 ? Math.max(...nfcNumbers) : 0;
      const nextNum = maxNum + 1;
      const padded = String(nextNum).padStart(3, '0');
      setTagCode(`NFC-${padded}`);
    }
  }, [isOpen, defaultRestaurantId, existingTags]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagCode.trim()) {
      setErrorMsg('El código del tag es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const res = await api.saveTag({
      tag_code: tagCode.trim().toUpperCase(),
      restaurant_id: restaurantId || null,
      table_identifier: tableIdentifier.trim() || null,
      is_active: true,
    });

    setIsSaving(false);
    if (res.success) {
      onCreated();
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al crear el tag.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Crear Tag NFC / QR</h3>
              <p className="text-xs text-slate-500">Asigna un nuevo código para chip o QR</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Código del Tag *
            </label>
            <input
              type="text"
              required
              value={tagCode}
              onChange={(e) => setTagCode(e.target.value.toUpperCase())}
              placeholder="Ej. NFC-005 o MIKE-01"
              className="w-full p-3 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Este es el código que se grabará en el chip NFC o código QR físico.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Restaurante / Sucursal Asignada
            </label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            >
              <option value="">-- Sin Asignar (Stock Disponible) --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Identificador de Ubicación o Mesa (Opcional)
            </label>
            <input
              type="text"
              value={tableIdentifier}
              onChange={(e) => setTableIdentifier(e.target.value)}
              placeholder="Ej. Mesa 1, Terraza 4, Caja Principal"
              className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Crear Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

