import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Check } from 'lucide-react';

export interface CountryDialOption {
  code: string;
  country: string;
  label: string;
}

export const COUNTRY_DIAL_OPTIONS: CountryDialOption[] = [
  { code: '+52', country: 'MX', label: '+52 (MX)' },
  { code: '+1', country: 'US', label: '+1 (US/CA)' },
  { code: '+34', country: 'ES', label: '+34 (ES)' },
  { code: '+57', country: 'CO', label: '+57 (CO)' },
  { code: '+54', country: 'AR', label: '+54 (AR)' },
  { code: '+56', country: 'CL', label: '+56 (CL)' },
  { code: '+51', country: 'PE', label: '+51 (PE)' },
  { code: '+502', country: 'GT', label: '+502 (GT)' },
  { code: '+506', country: 'CR', label: '+506 (CR)' },
];

export function parsePhoneWithCountry(rawPhone?: string | null): {
  countryCode: string;
  localNumber: string;
} {
  const cleaned = (rawPhone || '').trim();
  if (!cleaned) {
    return { countryCode: '+52', localNumber: '' };
  }

  // Ordenar por longitud de código descendente para coincidir primero +502/+506 antes que +5
  const sortedOptions = [...COUNTRY_DIAL_OPTIONS].sort((a, b) => b.code.length - a.code.length);
  for (const opt of sortedOptions) {
    if (cleaned.startsWith(opt.code)) {
      const rest = cleaned.slice(opt.code.length).replace(/^\s+/, '');
      return { countryCode: opt.code, localNumber: rest };
    }
  }

  // Si no empieza con +, asumir +52 por defecto
  return { countryCode: '+52', localNumber: cleaned.replace(/^\+/, '') };
}

export function formatTextMax25(text?: string | null): string {
  const val = (text || '').trim();
  if (val.length <= 25) return val;
  return `${val.slice(0, 25)}...`;
}

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhone: string) => void;
  hasWhatsapp?: boolean;
  onWhatsappChange?: (hasWhatsapp: boolean) => void;
  placeholder?: string;
  required?: boolean;
  compact?: boolean;
  className?: string;
  inputClassName?: string;
  showWhatsappCheckbox?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  hasWhatsapp: externalHasWhatsapp,
  onWhatsappChange,
  placeholder = '55 1234 5678',
  required = false,
  compact = false,
  className = '',
  inputClassName = '',
  showWhatsappCheckbox = true,
}) => {
  const parsed = parsePhoneWithCountry(value);
  const [countryCode, setCountryCode] = useState<string>(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState<string>(parsed.localNumber);
  const [internalWhatsapp, setInternalWhatsapp] = useState<boolean>(
    externalHasWhatsapp !== undefined ? externalHasWhatsapp : true
  );

  useEffect(() => {
    const nextParsed = parsePhoneWithCountry(value);
    setCountryCode(nextParsed.countryCode);
    setLocalNumber(nextParsed.localNumber);
  }, [value]);

  useEffect(() => {
    if (externalHasWhatsapp !== undefined) {
      setInternalWhatsapp(externalHasWhatsapp);
    }
  }, [externalHasWhatsapp]);

  const isWhatsappChecked =
    externalHasWhatsapp !== undefined ? externalHasWhatsapp : internalWhatsapp;

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    const digits = localNumber.trim();
    onChange(digits ? `${newCode}${digits}` : '');
  };

  const handleLocalNumberChange = (rawDigits: string) => {
    const sanitized = rawDigits.replace(/[^\d\s-]/g, '');
    setLocalNumber(sanitized);
    const cleanDigits = sanitized.replace(/\s+/g, '');
    onChange(cleanDigits ? `${countryCode}${cleanDigits}` : '');
  };

  const handleToggleWhatsapp = (checked: boolean) => {
    setInternalWhatsapp(checked);
    if (onWhatsappChange) {
      onWhatsappChange(checked);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div
        className={`flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden transition-all ${inputClassName}`}
      >
        <div className="flex items-center pl-2.5 pr-1 border-r border-slate-200 bg-slate-100/80 h-full py-2">
          <Phone className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Código de área telefónico"
            className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            {COUNTRY_DIAL_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-white text-slate-900 font-bold">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <input
          type="tel"
          required={required}
          value={localNumber}
          onChange={(e) => handleLocalNumberChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent px-3 ${
            compact ? 'py-1.5 text-xs' : 'py-2 text-xs sm:text-sm'
          } text-slate-900 font-medium focus:outline-none min-w-0`}
        />
      </div>

      {showWhatsappCheckbox && (
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={isWhatsappChecked}
            onChange={(e) => handleToggleWhatsapp(e.target.checked)}
            className="sr-only"
          />
          <span
            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
              isWhatsappChecked
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-slate-300 text-transparent group-hover:border-slate-400'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 group-hover:text-slate-900">
            <MessageCircle
              className={`w-3 h-3 ${isWhatsappChecked ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <span>Cuenta con WhatsApp</span>
          </span>
        </label>
      )}
    </div>
  );
};

