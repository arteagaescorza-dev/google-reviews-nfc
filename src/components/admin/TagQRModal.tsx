import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Tag } from '../../types';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface TagQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
}

export const TagQRModal: React.FC<TagQRModalProps> = ({ isOpen, onClose, tag }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !tag) return null;

  // URL absoluta que se graba en el NFC o se lee con el QR
  const baseUrl = window.location.origin + window.location.pathname;
  const tagUrl = `${baseUrl}?t=${tag.tag_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tagUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPng = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${tag.tag_code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Código QR / Enlace NFC
            </span>
            <h3 className="text-base font-bold text-slate-900">{tag.tag_code}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas del Código QR */}
        <div
          ref={qrRef}
          className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm inline-block mb-4"
        >
          <QRCodeCanvas
            value={tagUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
          {tag.restaurant ? (
            <span>
              Asignado a <strong>{tag.restaurant.name}</strong>
              {tag.table_identifier && ` (${tag.table_identifier})`}
            </span>
          ) : (
            <span className="text-amber-600">Tag sin asignar a ningún local</span>
          )}
        </p>

        {/* Input con URL para copiar */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left mb-4 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-600 truncate">{tagUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex-shrink-0"
            title="Copiar URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadPng}
            className="py-2.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PNG</span>
          </button>

          <a
            href={tagUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Probar Tag</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
