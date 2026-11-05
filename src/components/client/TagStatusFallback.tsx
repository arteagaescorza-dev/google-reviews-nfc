import React, { useState } from 'react';
import { QrCode, AlertCircle, ShieldAlert, BellRing, Check } from 'lucide-react';

interface TagStatusFallbackProps {
  tagCode: string | null;
  reason?: 'not_found' | 'unassigned' | 'inactive' | 'maintenance_retired';
  tableIdentifier?: string | null;
}

export const TagStatusFallback: React.FC<TagStatusFallbackProps> = ({
  tagCode,
  reason = 'not_found',
  tableIdentifier,
}) => {
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const handleRequestAssistance = () => {
    setAssistanceRequested(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            reason === 'maintenance_retired'
              ? 'bg-slate-100 border border-slate-200 text-slate-600'
              : reason === 'inactive'
              ? 'bg-rose-50 border border-rose-100 text-rose-500'
              : 'bg-amber-50 border border-amber-100 text-amber-600'
          }`}
        >
          {reason === 'not_found' ? (
            <QrCode className="w-8 h-8" />
          ) : reason === 'maintenance_retired' ? (
            <ShieldAlert className="w-8 h-8 text-slate-600" />
          ) : reason === 'inactive' ? (
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-500" />
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {reason === 'not_found' && 'Tag NFC no encontrado'}
          {reason === 'unassigned' && 'Tag en proceso de activación'}
          {reason === 'inactive' && 'Servicio temporalmente inactivo'}
          {reason === 'maintenance_retired' && 'Placa Retirada por Mantenimiento'}
        </h1>

        {tableIdentifier && (
          <div className="inline-block mb-3 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
            {tableIdentifier}
          </div>
        )}

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {reason === 'not_found' &&
            `El código ${tagCode ? `"${tagCode}"` : ''} no está registrado en el sistema.`}
          {reason === 'unassigned' &&
            `Este tag (${tagCode || 'NFC'}) aún no ha sido vinculado a una sucursal o mesa en el panel de control.`}
          {reason === 'inactive' &&
            'Este local tiene el servicio pausado en este momento. Por favor, consulta al personal del establecimiento.'}
          {reason === 'maintenance_retired' &&
            'Esta placa ha sido retirada y sustituida por mantenimiento. Por favor utiliza el código activo en tu mesa.'}
        </p>

        {reason === 'maintenance_retired' && (
          <div className="mb-4">
            {assistanceRequested ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Asistencia en camino a tu mesa</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestAssistance}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4 text-slate-300" />
                <span>Llamar al Mesero / Asistencia en Sala</span>
              </button>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          <p>¿Eres el administrador del local?</p>
          <a
            href="#/admin"
            className="inline-block mt-2 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Acceder al Panel de Control →
          </a>
        </div>
      </div>
    </div>
  );
};
