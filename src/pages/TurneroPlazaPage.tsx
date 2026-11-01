import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Utensils, Clock, CheckCircle2, Flame, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playBuzzerChime, speakOrderReady } from '../lib/beeper';

interface TurneroItem {
  folio: string;
  stationName: string;
  status: 'ready' | 'cooking';
  readySince?: string;
  pickupCounter: string;
}

const INITIAL_ORDERS: TurneroItem[] = [
  { folio: '382', stationName: 'Tacos Don Güero', status: 'ready', readySince: 'Hace 1 min', pickupCounter: 'Barra 1' },
  { folio: '385', stationName: 'Wok & Roll Asiático', status: 'ready', readySince: 'Hace 2 min', pickupCounter: 'Barra 4' },
  { folio: '389', stationName: 'Pizzas La Nonna', status: 'ready', readySince: 'Hace 3 min', pickupCounter: 'Barra 2' },
  { folio: '391', stationName: 'Burgers & Fries Plaza', status: 'cooking', pickupCounter: 'Barra 3' },
  { folio: '392', stationName: 'Tacos Don Güero', status: 'cooking', pickupCounter: 'Barra 1' },
  { folio: '394', stationName: 'Sushi Express', status: 'cooking', pickupCounter: 'Barra 5' },
  { folio: '396', stationName: 'Café & Churros', status: 'cooking', pickupCounter: 'Barra 6' },
];

export const TurneroPlazaPage: React.FC = () => {
  const [orders, setOrders] = useState<TurneroItem[]>(INITIAL_ORDERS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-MX'));
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-MX'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lista de estaciones únicas
  const stations = ['all', ...Array.from(new Set(orders.map((o) => o.stationName)))];

  const filteredOrders = selectedStation === 'all'
    ? orders
    : orders.filter((o) => o.stationName === selectedStation);

  const readyOrders = filteredOrders.filter((o) => o.status === 'ready');
  const cookingOrders = filteredOrders.filter((o) => o.status === 'cooking');

  // Acción para simular llamado de orden en plaza
  const handleSimulateCall = (folio: string, station: string) => {
    if (soundEnabled) {
      playBuzzerChime();
      speakOrderReady(folio, station);
    }
  };

  // Simular orden nueva que pasa a Lista
  const handlePromoteNextCooking = () => {
    const nextCooking = orders.find((o) => o.status === 'cooking');
    if (nextCooking) {
      const updated = orders.map((o) =>
        o.folio === nextCooking.folio
          ? { ...o, status: 'ready' as const, readySince: 'Ahora mismo' }
          : o
      );
      setOrders(updated);
      handleSimulateCall(nextCooking.folio, nextCooking.stationName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans p-4 sm:p-6 lg:p-8">
      {/* BARRA SUPERIOR: ENCABEZADO Y CONFIGURACIÓN */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            to="/portal"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Volver al Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Turnero Maestro de Plaza
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Food Court 4K
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Pantalla unificada para comensales en áreas comunes y terrazas
            </p>
          </div>
        </div>

        {/* CONTROLES Y HORA */}
        <div className="flex items-center gap-3">
          {/* Selector de estación */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">🍽️ Todas las Estaciones</option>
            {stations.filter((s) => s !== 'all').map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Toggle de voz / audio */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition-colors flex items-center gap-2 text-xs font-bold ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Audio y Voz Activados' : 'Audio Silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Voz Activa' : 'Mudo'}</span>
          </button>

          {/* Botón de Demostración para Jurados o Clientes */}
          <button
            onClick={handlePromoteNextCooking}
            className="px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            title="Simula que sale un nuevo pedido de cocina"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Simular Llamado</span>
          </button>

          {/* Reloj Digital Gigante */}
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 font-mono text-base sm:text-lg font-black tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL TURNERO: 2 COLUMNAS DE ALTA VISIBILIDAD */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* COLUMNA IZQUIERDA: LISTOS PARA RECOGER (7 COLUMNAS EN DESKTOP) */}
        <section className="lg:col-span-7 flex flex-col bg-slate-900/40 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-tight">
                  Listos para Recoger
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Pasa a la barra con tu charola al ver tu número
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-sm animate-pulse">
              {readyOrders.length} LISTOS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-slate-500">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold">Todas las charolas han sido entregadas</p>
                <p className="text-xs text-slate-600 mt-1">Los nuevos pedidos listos sonarán aquí</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.folio}
                  onClick={() => handleSimulateCall(order.folio, order.stationName)}
                  className="bg-gradient-to-br from-emerald-950/70 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-xl hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      {order.pickupCounter}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.readySince}
                    </span>
                  </div>

                  <div className="my-3 text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block">
                      Folio / Turno
                    </span>
                    <div className="text-5xl sm:text-6xl font-black text-white group-hover:scale-105 transition-transform tracking-tight text-emerald-400">
                      #{order.folio}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {order.stationName}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                      title="Volver a llamar por voz"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMNA DERECHA: EN PREPARACIÓN (5 COLUMNAS EN DESKTOP) */}
        <section className="lg:col-span-5 flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-tight">
                  En Cocina
                </h2>
                <p className="text-xs text-slate-400">Preparando tus alimentos al momento</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-black text-sm">
              {cookingOrders.length} EN FUEGO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto">
            {cookingOrders.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-slate-500">
                <p className="text-base font-semibold">Sin comandas pendientes en cocina</p>
              </div>
            ) : (
              cookingOrders.map((order) => (
                <div
                  key={order.folio}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-center"
                >
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Turno
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-200 my-1">
                    #{order.folio}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 truncate">
                    {order.stationName}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* FOOTER: BANNER PATROCINADO (DT-15 MONETIZACIÓN) */}
      <footer className="mt-4 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
            AD
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white">
              ¿Quieres anunciarte en las pantallas de este Food Court?
            </p>
            <p className="text-[11px] text-slate-400">
              Impacta a más de 3,500 comensales diarios en horas pico con anuncios digitales en turneros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 font-bold">Desde $499 MXN / mes</span>
          <Link
            to="/admin/ads"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
          >
            Contratar Pauta
          </Link>
        </div>
      </footer>
    </div>
  );
};
