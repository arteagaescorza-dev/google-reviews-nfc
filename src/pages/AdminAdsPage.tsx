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
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
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

  // Métricas agregadas de pauta
  const totalBudget = ads.reduce((acc, a) => acc + (a.budget_amount || 2500), 0);
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions_count || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const renewingCount = ads.filter(
    (a) => a.max_impressions && (a.impressions_count / a.max_impressions) >= 0.8
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold tracking-wider uppercase">
              SPEC-007 • SPEC-010
            </span>
            <span className="text-xs text-slate-400">Inventario comercial de la red física</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Red de Publicidad Local
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comercializa impresiones en pantallas móviles de comensales en toda la zona metropolitana
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refrescar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Campaña Publicitaria</span>
          </button>
        </div>
      </div>

      {/* Barra de Mando: Resumen de Pauta y Alertas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Facturado en Pauta</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">${totalBudget.toLocaleString('es-MX')} <span className="text-xs font-semibold text-slate-500">MXN</span></p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{ads.length} contratos vigentes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Impresiones Totales</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalImpressions.toLocaleString('es-MX')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{totalClicks.toLocaleString('es-MX')} clics directos</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">CTR Promedio</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">{avgCtr}%</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Retención física en mesa</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Alertas de Renovación</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{renewingCount} <span className="text-xs font-bold text-slate-500">al 80%+</span></p>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">Disparo automático de recarga</p>
        </div>
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
            const maxImp = ad.max_impressions || 5000;
            const budget = ad.budget_amount || 2500;
            const consumptionPercent = Math.min(100, Math.round((impressions / maxImp) * 100));
            const isAtOrAbove80 = consumptionPercent >= 80;
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={ad.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group ${
                  isAtOrAbove80 ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Banner de muestra */}
                  <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
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

                    {/* Badge de Renovación al 80% */}
                    {isAtOrAbove80 && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md flex items-center gap-1 animate-pulse">
                          <span>🟡</span>
                          <span>80% RENOVANDO</span>
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
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

                    {/* Barra de progreso de consumo de presupuesto */}
                    <div className="mb-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-500">Consumo de Vistas:</span>
                        <span className="font-bold text-slate-800">
                          {impressions.toLocaleString('es-MX')} / {maxImp.toLocaleString('es-MX')} ({consumptionPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAtOrAbove80 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${consumptionPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                        <span>Pautado: ${budget.toLocaleString('es-MX')} MXN</span>
                        {isAtOrAbove80 ? (
                          <span className="text-amber-700 font-bold">Aviso enviado al anunciante</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Ritmo saludable</span>
                        )}
                      </div>
                    </div>

                    {/* Segmentación y Fricción de Veto */}
                    <div className="space-y-1.5 text-xs text-slate-500 mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {ad.target_type === 'all' && 'Todos los locales activos de la red'}
                          {ad.target_type === 'specific_restaurants' &&
                            `${ad.target_restaurant_ids?.length || 0} locales seleccionados`}
                          {ad.target_type === 'specific_tags' &&
                            `Tags: ${ad.target_tag_codes?.join(', ') || 'Ninguno'}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-600">
                          Protección Anti-Canibalización: <strong>Cero vetos de giro</strong>
                        </span>
                      </div>
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
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-purple-600 truncate max-w-[190px]"
                  >
                    <span className="truncate">{ad.destination_url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>

                  <button
                    onClick={() => handleEdit(ad)}
                    className="font-bold text-purple-600 hover:text-purple-700"
                  >
                    Editar & Mockup
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Anuncio con Mockup iPhone y Validador Técnico */}
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
