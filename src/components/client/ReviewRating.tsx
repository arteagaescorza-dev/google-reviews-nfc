import React, { useState } from 'react';
import type { Restaurant } from '../../types';
import { Star, CheckCircle2 } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../lib/utils';

interface ReviewRatingProps {
  restaurant: Restaurant;
  tableIdentifier?: string | null;
  onNegativeRating: (rating: 1 | 2 | 3) => void;
}

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Mala experiencia', color: 'text-rose-600' },
  2: { text: 'Regular', color: 'text-amber-600' },
  3: { text: 'Aceptable', color: 'text-amber-500' },
  4: { text: '¡Muy buena!', color: 'text-emerald-600' },
  5: { text: '¡Excelente experiencia!', color: 'text-emerald-600' },
};

export const ReviewRating: React.FC<ReviewRatingProps> = ({
  restaurant,
  tableIdentifier,
  onNegativeRating,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [isRedirectingGoogle, setIsRedirectingGoogle] = useState(false);

  const activeStar = hoveredStar || selectedStar;

  const handleStarClick = (star: number) => {
    setSelectedStar(star);

    if (star >= 4) {
      // 4 o 5 Estrellas: Experiencia positiva -> Redirigir a Google
      setIsRedirectingGoogle(true);
      const url = ensureAbsoluteUrl(restaurant.google_review_url);
      setTimeout(() => {
        window.location.href = url;
      }, 700);
    } else {
      // 1, 2 o 3 Estrellas: Queja / sugerencia -> Abrir feedback privado
      onNegativeRating(star as 1 | 2 | 3);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
      {/* Detalle sutil de color de marca en la parte superior */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: restaurant.brand_color || '#2563eb' }}
      />

      {/* Logo o inicial */}
      <div className="relative inline-block mb-3 mt-1">
        {restaurant.logo_url ? (
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-sm border-2 border-white ring-2 ring-slate-100 mx-auto"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm mx-auto"
            style={{ backgroundColor: restaurant.brand_color || '#2563eb' }}
          >
            {restaurant.name.charAt(0)}
          </div>
        )}
      </div>

      <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
        {restaurant.name}
      </h1>

      {tableIdentifier && (
        <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {tableIdentifier}
        </span>
      )}

      <p className="text-sm text-slate-500 mt-2 mb-6">
        ¿Cómo calificarías tu experiencia hoy?
      </p>

      {/* Selector interactivo de estrellas */}
      {isRedirectingGoogle ? (
        <div className="py-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">¡Muchísimas gracias!</p>
          <p className="text-xs text-slate-500 mt-1">Abriendo Google Reseñas para compartir tu opinión...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => handleStarClick(star)}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl star-touch focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label={`Calificar con ${star} estrellas`}
              >
                <Star
                  className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors duration-150 ${
                    activeStar && star <= activeStar
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                      : 'text-slate-200 fill-slate-50 hover:text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Etiqueta dinámica de la calificación */}
          <div className="h-6 mt-2 flex items-center justify-center">
            {activeStar ? (
              <span className={`text-xs font-bold uppercase tracking-wider animate-fadeIn ${RATING_LABELS[activeStar].color}`}>
                {RATING_LABELS[activeStar].text}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Toca una estrella para calificar</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
