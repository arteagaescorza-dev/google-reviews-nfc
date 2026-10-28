import React, { useState } from 'react';
import type { LinkItem } from '../../types';
import {
  UtensilsCrossed,
  Instagram,
  Facebook,
  Music2,
  MessageCircle,
  Wifi,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ensureAbsoluteUrl } from '../../lib/utils';

interface LinkTreeSectionProps {
  links: LinkItem[];
  brandColor?: string;
}

export const LinkTreeSection: React.FC<LinkTreeSectionProps> = ({
  links,
}) => {
  const [copiedWifi, setCopiedWifi] = useState(false);

  if (!links || links.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'menu':
        return <UtensilsCrossed className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'tiktok':
        return <Music2 className="w-5 h-5 text-slate-800" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5 text-emerald-600" />;
      case 'wifi':
        return <Wifi className="w-5 h-5 text-indigo-600" />;
      case 'website':
        return <Globe className="w-5 h-5 text-cyan-600" />;
      default:
        return <ExternalLink className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleLinkClick = (e: React.MouseEvent, link: LinkItem) => {
    // Si es un string de Wi-Fi tipo WIFI:S:Red;T:WPA;P:pass;;
    if (link.icon === 'wifi' && link.url.startsWith('WIFI:')) {
      e.preventDefault();
      const passMatch = link.url.match(/P:([^;]+)/);
      const pass = passMatch ? passMatch[1] : '';

      if (pass) {
        navigator.clipboard.writeText(pass);
        setCopiedWifi(true);
        setTimeout(() => setCopiedWifi(false), 3000);
      }
    }
  };

  return (
    <div className="w-full mt-4 space-y-2.5">
      <div className="text-left px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Accesos Rápidos & Redes
        </span>
      </div>

      {copiedWifi && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-fadeIn">
          <span>¡Contraseña de Wi-Fi copiada al portapapeles!</span>
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      )}

      {links.map((link) => {
        const isWifi = link.icon === 'wifi' && link.url.startsWith('WIFI:');
        return (
          <a
            key={link.id}
            href={isWifi ? '#' : ensureAbsoluteUrl(link.url)}
            target={isWifi ? '_self' : '_blank'}
            rel="noopener noreferrer"
            onClick={(e) => handleLinkClick(e, link)}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-150 flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                {getIcon(link.icon)}
              </div>
              <span className="text-sm font-bold text-slate-800 truncate group-hover:text-slate-950">
                {link.title}
              </span>
            </div>

            <div className="flex-shrink-0 pl-2">
              {isWifi ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Clave</span>
                </div>
              ) : (
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
};
