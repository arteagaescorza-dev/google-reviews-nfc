import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Utensils,
  Clock,
  CheckCircle2,
  Flame,
  ArrowLeft,
  Megaphone,
  QrCode,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { playBuzzerChime, speakOrderReady } from '../lib/beeper';
import { api } from '../lib/api';
import { subscribeToRestaurantOrders, type RealtimeConnectionStatus } from '../lib/realtimeSubscriptions';
import type { FoodCourt, Ad } from '../types';

export interface TurneroItem {
  id: string;
  folio: string;
  stationName: string;
  spaceNumber: string;
  status: 'ready' | 'cooking';
  readySince?: string;
  readyTimestamp?: number;
  pickupCounter: string;
}

const INITIAL_DEMO_ORDERS: TurneroItem[] = [
  {
    id: 'ord-fc-382',
    folio: '382',
    stationName: 'La Parrilla de Don Carlos',
    spaceNumber: 'Local FC-01',
    status: 'ready',
    readySince: 'Hace 1 min',
    readyTimestamp: Date.now() - 60000,
    pickupCounter: 'Barra 1',
  },
  {
    id: 'ord-fc-385',
    folio: '385',
    stationName: 'Sushi Koi Express',
    spaceNumber: 'Local FC-02',
    status: 'ready',
    readySince: 'Hace 2 min',
    readyTimestamp: Date.now() - 120000,
    pickupCounter: 'Barra 2',
  },
  {
    id: 'ord-fc-389',
    folio: '389',
    stationName: 'Trattoria Bella Italia',
    spaceNumber: 'Local FC-03',
    status: 'ready',
    readySince: 'Hace 2 min',
    readyTimestamp: Date.now() - 140000,
    pickupCounter: 'Barra 3',
  },
  {
    id: 'ord-fc-391',
    folio: '391',
    stationName: 'La Parrilla de Don Carlos',
    spaceNumber: 'Local FC-01',
    status: 'cooking',
    pickupCounter: 'Barra 1',
  },
  {
    id: 'ord-fc-392',
    folio: '392',
    stationName: 'Sushi Koi Express',
    spaceNumber: 'Local FC-02',
    status: 'cooking',
    pickupCounter: 'Barra 2',
  },
  {
    id: 'ord-fc-394',
    folio: '394',
    stationName: 'Trattoria Bella Italia',
    spaceNumber: 'Local FC-03',
    status: 'cooking',
    pickupCounter: 'Barra 3',
  },
  {
    id: 'ord-fc-396',
    folio: '396',
    stationName: 'Burgers & Shakes Mall',
    spaceNumber: 'Local FC-04',
    status: 'cooking',
    pickupCounter: 'Barra 4',
  },
];

export const TurneroPlazaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fcParam = searchParams.get('food_court') || searchParams.get('fc') || 'galerias-reforma';

  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [orders, setOrders] = useState<TurneroItem[]>(INITIAL_DEMO_ORDERS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-MX'));
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [connStatus, setConnStatus] = useState<RealtimeConnectionStatus>('connected');

  // Red Publicitaria Local (30% Split Derecha)
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Cargar datos del Food Court, comandas federadas y anuncios activos
  const loadFoodCourtData = async () => {
    const fc = await api.getFoodCourtDetails(fcParam);
    if (fc) {
      setFoodCourt(fc);
      setSoundEnabled(fc.turnero_config.enableBuzzerChime || fc.turnero_config.enableVoiceTts);

      const liveOrders = await api.getFoodCourtLiveOrders(fc.id);
      if (liveOrders.length > 0) {
        const mappedLive: TurneroItem[] = liveOrders
          .filter((o) => o.status === 'ready' || o.status === 'preparing' || o.status === 'pending')
          .map((o) => ({
            id: o.id,
            folio: o.id.slice(-3).toUpperCase(),
            stationName: o.brand_name,
            spaceNumber: o.space_number,
            status: o.status === 'ready' ? 'ready' : 'cooking',
            readySince: o.status === 'ready' ? 'Ahora mismo' : undefined,
            readyTimestamp: o.status === 'ready' ? new Date(o.updated_at).getTime() : undefined,
            pickupCounter: o.pickup_counter,
          }));

        // Combinar órdenes en vivo con las de demostración evitando duplicados
        setOrders((prev) => {
          const liveIds = new Set(mappedLive.map((m) => m.id));
          const remainingDemo = prev.filter((p) => !liveIds.has(p.id));
          return [...mappedLive, ...remainingDemo];
        });
      }
    }

    const adsList = await api.getAds();
    const filteredAds = adsList.filter((a) => a.is_active);
    setActiveAds(filteredAds);
  };

  useEffect(() => {
    loadFoodCourtData();

    // Suscripción en tiempo real a las sucursales federadas
    const unsub1 = subscribeToRestaurantOrders('res-1', loadFoodCourtData, setConnStatus);
    const unsub2 = subscribeToRestaurantOrders('res-2', loadFoodCourtData);
    const unsub3 = subscribeToRestaurantOrders('res-3', loadFoodCourtData);

    const passiveHeartbeat = setInterval(loadFoodCourtData, 45000);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      clearInterval(passiveHeartbeat);
    };
  }, [fcParam]);

  // Reloj digital en vivo y auto-retiro de órdenes listas tras X minutos (default 3 min)
  useEffect(() => {
    const autoHideMinutes = foodCourt?.turnero_config?.autoHideReadyMinutes || 3;
    const maxAgeMs = autoHideMinutes * 60 * 1000;

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-MX'));
      const now = Date.now();
      setOrders((prev) =>
        prev.filter((o) => {
          if (o.status === 'ready' && o.readyTimestamp && now - o.readyTimestamp > maxAgeMs + 120000) {
            return false;
          }
          return true;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [foodCourt]);

  // Rotación automática de anuncios en la columna lateral del 30% y registro de impresiones
  useEffect(() => {
    if (activeAds.length === 0) return;
    const rotationSecs = foodCourt?.turnero_config?.adRotationSeconds || 20;

    const adInterval = setInterval(() => {
      setCurrentAdIndex((prev) => {
        const nextIdx = (prev + 1) % activeAds.length;
        const nextAd = activeAds[nextIdx];
        if (nextAd) {
          api.recordAdStat(nextAd.id, 'impression');
        }
        return nextIdx;
      });
    }, rotationSecs * 1000);

    return () => clearInterval(adInterval);
  }, [activeAds, foodCourt]);

  // Lista de estaciones únicas
  const stations = ['all', ...Array.from(new Set(orders.map((o) => o.stationName)))];

  const filteredOrders =
    selectedStation === 'all'
      ? orders
      : orders.filter((o) => o.stationName === selectedStation);

  const readyOrders = filteredOrders.filter((o) => o.status === 'ready');
  const cookingOrders = filteredOrders.filter((o) => o.status === 'cooking');

  // Acción para llamar turno con timbre acústico y síntesis de voz (TTS)
  const handleSimulateCall = (folio: string, station: string, counter?: string) => {
    if (!soundEnabled) return;
    const cfg = foodCourt?.turnero_config;
    if (!cfg || cfg.enableBuzzerChime) {
      playBuzzerChime();
    }
    if (!cfg || cfg.enableVoiceTts) {
      const targetLabel = counter ? `${station}, en ${counter}` : station;
      speakOrderReady(folio, targetLabel);
    }
  };

  // Simular orden nueva que pasa a Lista
  const handlePromoteNextCooking = () => {
    const nextCooking = orders.find((o) => o.status === 'cooking');
    if (nextCooking) {
      const updated = orders.map((o) =>
        o.folio === nextCooking.folio
          ? {
              ...o,
              status: 'ready' as const,
              readySince: 'Ahora mismo',
              readyTimestamp: Date.now(),
            }
          : o
      );
      setOrders(updated);
      handleSimulateCall(nextCooking.folio, nextCooking.stationName, nextCooking.pickupCounter);
    }
  };

  const currentAd = activeAds[currentAdIndex] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans p-4 sm:p-6">
      {/* BARRA SUPERIOR: ENCABEZADO DEL FOOD COURT */}
      <header className="bg-white rounded-3xl border border-slate-200/90 px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          <Link
            to="/food-court"
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Ir a Consola de Administración del Food Court"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    connStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                {foodCourt ? foodCourt.name : 'Turnero Maestro de Plaza'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black uppercase tracking-wider">
                Food Court 4K • Split 70/30
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {foodCourt?.mall_name || 'Pantalla unificada de comedor y área común'} • Retiro automático: {foodCourt?.turnero_config?.autoHideReadyMinutes || 3} min
            </p>
          </div>
        </div>

        {/* CONTROLES Y RELOJ */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            {stations.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStation === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Todos los Locales' : st}
              </button>
            ))}
          </div>

          <button
            onClick={handlePromoteNextCooking}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Simular orden recién terminada con aviso de voz"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Avanzar Turno + Voz</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Audio y Voz Activos' : 'Audio Silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-mono text-sm sm:text-base font-bold tracking-wider">
            {currentTime}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL: DISTRIBUCIÓN 70% TURNOS (IZQUIERDA) / 30% PUBLICIDAD DE RED (DERECHA) */}
      <main className="grid grid-cols-1 lg:grid-cols-10 gap-5 flex-1 my-1">
        {/* 70% IZQUIERDA: COLUMNAS DE ÓRDENES EN VIVO (7 DE 10 COLUMNAS) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* SUBCOLUMNA 1: LISTO PARA RECOGER (7 DE 12) */}
          <section className="md:col-span-7 bg-white border-2 border-emerald-500/30 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-emerald-950">
                      Listo para Recoger
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pasa al mostrador indicado con tu número de turno
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs">
                  {readyOrders.length} LISTOS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
                {readyOrders.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-slate-400">
                    <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No hay pedidos pendientes de entrega</p>
                  </div>
                ) : (
                  readyOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() =>
                        handleSimulateCall(order.folio, order.stationName, order.pickupCounter)
                      }
                      className="group cursor-pointer bg-emerald-50/50 hover:bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                          {order.pickupCounter}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {order.readySince || 'Listo'}
                        </span>
                      </div>

                      <div className="my-2">
                        <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold block">
                          Turno Confirmado
                        </span>
                        <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                          #{order.folio}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-800 block truncate">
                            {order.stationName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {order.spaceNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">
                          Repetir Voz
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* SUBCOLUMNA 2: EN PREPARACIÓN (5 DE 12) */}
          <section className="md:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                      En Preparación
                    </h2>
                    <p className="text-[11px] text-slate-500">Cocinando tu orden al momento</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-black text-xs">
                  {cookingOrders.length} EN COCINA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                {cookingOrders.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400">
                    <p className="text-xs font-semibold">Sin comandas en preparación</p>
                  </div>
                ) : (
                  cookingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col justify-between text-center shadow-2xs"
                    >
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {order.spaceNumber}
                      </span>
                      <div className="text-3xl font-black text-slate-800 my-1">
                        #{order.folio}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {order.stationName}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 30% DERECHA: COLUMNA VERTICAL DE RED PUBLICITARIA LOCAL (3 DE 10 COLUMNAS) */}
        <aside className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  Red de Anuncios
                </span>
                <span className="text-xs font-bold text-slate-700">Destacados de la Plaza</span>
              </div>
              {activeAds.length > 1 && (
                <span className="text-[11px] font-semibold text-slate-400">
                  {currentAdIndex + 1} / {activeAds.length}
                </span>
              )}
            </div>

            {currentAd ? (
              <div className="mt-4 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
                  <img
                    src={currentAd.banner_url}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                    {currentAd.advertiser_name}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {currentAd.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Escanea o presenta el código en mostrador de{' '}
                    <strong className="text-slate-900">{currentAd.advertiser_name}</strong> para hacer válida esta promoción exclusiva del comedor.
                  </p>
                </div>

                {/* Tarjeta QR Interactiva para Comensales esperando su turno */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                      Beneficio en Comedor
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      Obtén tu cupón directo en el celular
                    </p>
                    <Link
                      to="/pasaporte"
                      onClick={() => api.recordAdStat(currentAd.id, 'click')}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:underline pt-1"
                    >
                      <span>Abrir Pasaporte Digital</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center text-slate-900 shrink-0 shadow-2xs">
                    <QrCode className="w-9 h-9 text-blue-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Cargando pauta de la plaza...</p>
              </div>
            )}
          </div>

          {/* Pie de Columna Publicitaria */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold text-slate-800">
                ¿Tienes un local en {foodCourt?.mall_name || 'la plaza'}?
              </p>
              <p className="text-[10px] text-slate-500">
                Anúnciate en esta pantalla 4K ante miles de comensales
              </p>
            </div>
            <Link
              to="/food-court"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Admin Plaza</span>
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
};
