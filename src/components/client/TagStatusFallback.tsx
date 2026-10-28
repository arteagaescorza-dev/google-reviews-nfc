import React from 'react';
import { QrCode, AlertCircle, ShieldAlert } from 'lucide-react';

interface TagStatusFallbackProps {
  tagCode: string | null;
  reason?: 'not_found' | 'unassigned' | 'inactive';
}

export const TagStatusFallback: React.FC<TagStatusFallbackProps> = ({ tagCode, reason = 'not_found' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
          {reason === 'not_found' ? (
            <QrCode className="w-8 h-8" />
          ) : reason === 'inactive' ? (
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-500" />
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-800 mb-2">
          {reason === 'not_found' && 'Tag NFC no encontrado'}
          {reason === 'unassigned' && 'Tag en proceso de activación'}
          {reason === 'inactive' && 'Servicio temporalmente inactivo'}
        </h1>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {reason === 'not_found' &&
            `El código ${tagCode ? `"${tagCode}"` : ''} no está registrado en el sistema.`}
          {reason === 'unassigned' &&
            `Este tag (${tagCode || 'NFC'}) aún no ha sido vinculado a una sucursal o mesa en el panel de control.`}
          {reason === 'inactive' &&
            'Este local tiene el servicio pausado en este momento. Por favor, consulta al personal del establecimiento.'}
        </p>

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
