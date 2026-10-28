import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Ad, Restaurant } from '../types';
import { AdFormModal } from '../components/admin/AdFormModal';
import {
  Megaphone,
  Plus,
  Edit2,
  ExternalLink,
  Target,
} from 'lucide-react';

export const AdminAdsPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [adList, resList] = await Promise.all([api.getAds(), api.getRestaurants()]);
    setAds(adList);
    setRestaurants(resList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingAd(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (ad: Ad) => {
    await api.saveAd({
      id: ad.id,
      is_active: !ad.is_active,
    });
    loadData();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Red de Publicidad Local</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monetiza espacios en las pantallas de los restaurantes con anunciantes locales
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Anuncio</span>
        </button>
      </div>

      {/* Lista de campañas */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Cargando campañas...</div>
      ) : ads.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay anuncios configurados</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Crea tu primera campaña para comenzar a comercializar espacios.</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
          >
            Crear Primer Anuncio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad) => {
            const impressions = ad.impressions_count || 0;
            const clicks = ad.clicks_count || 0;
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={ad.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  {/* Banner de muestra */}
                  <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                    {ad.banner_url ? (
                      <img
                        src={ad.banner_url}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => handleToggleStatus(ad)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md transition-colors ${
                          ad.is_active
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-800/90 text-slate-300'
                        }`}
                      >
                        {ad.is_active ? 'Activo' : 'Pausado'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                        {ad.advertiser_name}
                      </span>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1 mb-2">
                      {ad.title}
                    </h3>

                    {/* Badge de segmentación */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {ad.target_type === 'all' && 'Todos los locales activos'}
                        {ad.target_type === 'specific_restaurants' &&
                          `${ad.target_restaurant_ids?.length || 0} locales seleccionados`}
                        {ad.target_type === 'specific_tags' &&
                          `Tags: ${ad.target_tag_codes?.join(', ') || 'Ninguno'}`}
                      </span>
                    </div>

                    {/* Métricas de rendimiento */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">Vistas</span>
                        <span className="font-bold text-xs text-slate-800">{impressions}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">Clics</span>
                        <span className="font-bold text-xs text-slate-800">{clicks}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">CTR</span>
                        <span className="font-bold text-xs text-purple-600">{ctr}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={ad.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-purple-600 truncate max-w-[200px]"
                  >
                    <span className="truncate">{ad.destination_url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>

                  <button
                    onClick={() => handleEdit(ad)}
                    className="font-bold text-purple-600 hover:text-purple-700"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Anuncio */}
      <AdFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        ad={editingAd}
        restaurants={restaurants}
      />
    </div>
  );
};
