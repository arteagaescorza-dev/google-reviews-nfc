import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { exportApplePassJson, generateGoogleWalletUrl } from '../lib/wallet';
import type { Coupon } from '../types';
import {
  Ticket,
  Calendar,
  MessageCircle,
  Share2,
  Check,
  Smartphone,
  ArrowLeft,
  Sparkles,
  MapPin,
  Download,
  ExternalLink,
  User,
} from 'lucide-react';

export const WebPassportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phoneParam = searchParams.get('tel') || searchParams.get('phone') || '';
  const [phone] = useState(phoneParam);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showPwaTip, setShowPwaTip] = useState(false);

  const loadCoupons = async (filterPhone?: string) => {
    setLoading(true);
    try {
      const data = await api.getCoupons(filterPhone || phone);
      setCoupons(data);
      if (data.length > 0 && !selectedCoupon) {
        setSelectedCoupon(data[0]);
      }
    } catch (e) {
      console.error('Error cargando cupones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activeCoupons = coupons.filter((c) => c.status === 'active');
  const historyCoupons = coupons.filter((c) => c.status !== 'active');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Cabecera Pasaporte */}
      <header className="p-4 sm:p-6 border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
                  Pasaporte Digital
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Tus beneficios y cupones de mesa activos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/mi-cuenta"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors"
              title="Mi Cuenta y Monedero"
            >
              <User className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Mi Cuenta</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowPwaTip(!showPwaTip)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
              title="Guardar en Pantalla de Inicio"
            >
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Guardar App</span>
            </button>
          </div>
        </div>

        {/* Tip de instalación en pantalla de inicio */}
        {showPwaTip && (
          <div className="max-w-md mx-auto mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 animate-fadeIn space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Instalar en tu celular sin App Store:</span>
            </p>
            <p className="text-[11px] text-slate-700">
              En iPhone: Toca el botón <strong>Compartir (⎋)</strong> en Safari y selecciona <strong>"Agregar al inicio"</strong>.
            </p>
            <p className="text-[11px] text-slate-700">
              En Android: Toca los <strong>tres puntos (⋮)</strong> en Chrome y selecciona <strong>"Instalar aplicación"</strong>.
            </p>
          </div>
        )}
      </header>

      {/* Cuerpo Principal */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* Selector de pestañas */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Activos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
              {activeCoupons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Historial</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
              {historyCoupons.length}
            </span>
          </button>
        </div>

        {/* Lista de Cupones */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Cargando tus beneficios...</div>
        ) : (activeTab === 'active' ? activeCoupons : historyCoupons).length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/90 p-6 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600">
              {activeTab === 'active'
                ? 'No tienes cupones activos en este momento.'
                : 'No tienes cupones canjeados en tu historial.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Escanea los tags NFC en las mesas de nuestros comercios aliados para desbloquear promociones exclusivas.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {(activeTab === 'active' ? activeCoupons : historyCoupons).map((cpn) => {
              const isSelected = selectedCoupon?.id === cpn.id;
              const isRedeemed = cpn.status === 'redeemed';
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(cpn.expires_at).getTime() - Date.now()) / (1000 * 3600 * 24))
              );

              return (
                <div
                  key={cpn.id}
                  onClick={() => setSelectedCoupon(cpn)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-2 border-amber-500 shadow-md'
                      : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        {cpn.advertiser_name}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{cpn.title}</h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isRedeemed
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {isRedeemed ? 'Canjeado' : `${daysLeft}d vigencia`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {cpn.discount_description}
                  </p>

                  {/* Bloque del Código de Canje Único (SPEC-006) */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">
                        Código de Canje en Mostrador
                      </span>
                      <span className="font-mono font-black text-slate-900 text-base tracking-widest">
                        {cpn.coupon_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(cpn.coupon_code);
                        }}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copiar Código"
                      >
                        {copiedCode === cpn.coupon_code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `¡Hola! Quiero hacer válido mi cupón *${cpn.coupon_code}* para la promoción: ${cpn.title}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        title="Canjear por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Botones de Billetera Digital Nativa (Apple Wallet & Google Wallet) con Geocerca GPS */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-amber-800 font-bold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>Geocerca GPS activa: despierta a &lt;200m</span>
                      </span>
                      <span className="text-slate-400 text-[9px] font-normal">Billetera del S.O.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportApplePassJson(cpn);
                          alert('Manifiesto de Apple Wallet (.pkpass) generado con coordenadas GPS de locales aliados.');
                        }}
                        className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-300" />
                        <span>Apple Wallet</span>
                      </button>

                      <a
                        href={generateGoogleWalletUrl(cpn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>Google Wallet</span>
                      </a>
                    </div>
                  </div>

                  {/* Pie de cupón */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Vence: {new Date(cpn.expires_at).toLocaleDateString()}</span>
                    </span>
                    <span className="text-slate-500 italic">Válido en sucursal</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pie de página con enlace de retorno */}
      <footer className="p-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
        <p>Red de Comercios Aliados • Google Reseñas & Cupones NFC</p>
        <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[11px]">
          <ArrowLeft className="w-3 h-3" />
          <span>Volver al inicio</span>
        </Link>
      </footer>
    </div>
  );
};
