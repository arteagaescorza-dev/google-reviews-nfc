import React, { useEffect, useState } from 'react';
import type { Ad } from '../../types';
import { api } from '../../lib/api';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdBannerProps {
  ad: Ad | null;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, className = '' }) => {
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (ad && !recorded) {
      api.recordAdStat(ad.id, 'impression');
      setRecorded(true);
    }
  }, [ad, recorded]);

  if (!ad) return null;

  const handleClick = () => {
    api.recordAdStat(ad.id, 'click');
  };

  return (
    <div className={`w-full max-w-md mx-auto mt-6 pt-4 border-t border-slate-200/80 ${className}`}>
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Espacio Patrocinado
        </span>
        <span className="text-[10px] text-slate-400 font-medium">Anuncio Local</span>
      </div>

      <a
        href={ad.destination_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group block overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99]"
      >
        {ad.banner_url && (
          <div className="relative h-28 w-full overflow-hidden bg-slate-100">
            <img
              src={ad.banner_url}
              alt={ad.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-white">
              <p className="text-xs font-semibold leading-tight drop-shadow-sm line-clamp-1">{ad.title}</p>
            </div>
          </div>
        )}

        <div className="p-3 flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{ad.advertiser_name}</p>
            <p className="text-[11px] text-slate-500 truncate">Toca para conocer promociones</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <span>Ver más</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </a>
    </div>
  );
};
