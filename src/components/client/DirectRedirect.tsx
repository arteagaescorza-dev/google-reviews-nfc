import React, { useEffect, useState } from 'react';
import type { Restaurant, Ad } from '../../types';
import { AdBanner } from './AdBanner';
import { ExternalLink, Loader2, Star } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../lib/utils';

interface DirectRedirectProps {
  restaurant: Restaurant;
  ad: Ad | null;
  tableIdentifier?: string | null;
}

export const DirectRedirect: React.FC<DirectRedirectProps> = ({
  restaurant,
  ad,
  tableIdentifier,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(restaurant.is_ad_free ? 0 : 3);
  const targetUrl = ensureAbsoluteUrl(restaurant.google_review_url);

  useEffect(() => {
    // Si pagó por eliminar publicidad, salto inmediato
    if (restaurant.is_ad_free) {
      window.location.href = targetUrl;
      return;
    }

    // Cuenta regresiva de 3 a 0
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restaurant.is_ad_free, targetUrl]);

  const handleManualSkip = () => {
    window.location.href = targetUrl;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Cabecera y tarjeta principal */}
      <div className="flex-1 flex flex-col items-center justify-center text-center pt-6">
        {/* Logo o icono del restaurante */}
        <div className="relative mb-5">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-24 h-24 rounded-3xl object-cover shadow-md border-2 border-white ring-4 ring-slate-100"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-md"
              style={{ backgroundColor: restaurant.brand_color || '#2563eb' }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow">
            <Star className="w-4 h-4 fill-amber-950" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
          {restaurant.name}
        </h1>
        {tableIdentifier && (
          <span className="inline-block px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-medium mb-3">
            {tableIdentifier}
          </span>
        )}

        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          Agradecemos mucho tu visita. Te estamos dirigiendo a nuestra ficha de Google para dejar tu reseña.
        </p>

        {/* Indicador de carga y botón de avance */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-4">
          <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-semibold mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Redirigiendo a Google en {secondsLeft}s...</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-5">
            <div
              className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${((3 - secondsLeft) / 3) * 100}%` }}
            />
          </div>

          <button
            onClick={handleManualSkip}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: restaurant.brand_color || '#2563eb' }}
          >
            <span>Continuar a Google ahora</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner publicitario si no es ad-free */}
      {!restaurant.is_ad_free && <AdBanner ad={ad} />}
    </div>
  );
};

