import React, { useState } from 'react';
import { api } from '../lib/api';
import type { Coupon } from '../types';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  Store,
  Calendar,
  User,
  Clock,
  Sparkles,
  Ticket,
} from 'lucide-react';

export const RedeemCouponPage: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketAmount, setTicketAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setRedeemSuccess(false);
    setErrorMessage('');
    setCoupon(null);

    try {
      const found = await api.getCouponByCode(clean);
      setCoupon(found);
      if (!found) {
        setErrorMessage('No existe ningún cupón registrado con ese código.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error buscando cupón');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!coupon) return;
    setIsRedeeming(true);
    setErrorMessage('');

    try {
      const amountNum = ticketAmount ? parseFloat(ticketAmount) : undefined;
      const res = await api.redeemCoupon(coupon.coupon_code, amountNum, 'Cajero Mostrador');

      if (res.success && res.coupon) {
        setCoupon(res.coupon);
        setRedeemSuccess(true);
      } else {
        if (res.error === 'CUPON_YA_CANJEADO') {
          setErrorMessage('¡Alerta de Fraude! Este cupón ya fue canjeado con anterioridad.');
        } else if (res.error === 'CUPON_EXPIRADO') {
          setErrorMessage('Este cupón ya expiró y no es válido.');
        } else {
          setErrorMessage(res.error || 'Error al validar el cupón.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando canje');
    } finally {
      setIsRedeeming(false);
    }
  };

  const isExpired = coupon && new Date(coupon.expires_at).getTime() < Date.now();
  const isAlreadyRedeemed = coupon && coupon.status === 'redeemed';
  const isActive = coupon && coupon.status === 'active' && !isExpired;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Cabecera para Recepción / Caja */}
      <header className="p-4 sm:p-6 border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
                  Recepción & Caja
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider border border-blue-200">
                  Validador
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Canje seguro de cupones digitales (Single-Use)</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Punto de Venta</span>
          </div>
        </div>
      </header>

      {/* Contenido Central */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* Formulario de Búsqueda / Escaneo */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ingresa o Escanea el Código del Comensal
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ej: DENTAL-20 o IRON-7D"
                className="w-full pl-9 pr-3 py-3 text-sm font-mono font-bold tracking-wider rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? '...' : 'Buscar'}</span>
            </button>
          </form>

          {/* Accesos rápidos de prueba */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-400 font-semibold">Probar con:</span>
            <button
              type="button"
              onClick={() => {
                setCouponCode('DENTAL-20');
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold cursor-pointer transition-colors"
            >
              DENTAL-20
            </button>
            <button
              type="button"
              onClick={() => {
                setCouponCode('IRON-7D');
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold cursor-pointer transition-colors"
            >
              IRON-7D
            </button>
            <button
              type="button"
              onClick={() => {
                setCouponCode('DENTAL-USADO');
              }}
              className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-mono font-bold border border-rose-200 cursor-pointer transition-colors"
            >
              DENTAL-USADO
            </button>
          </div>
        </div>

        {/* Alerta de Error si no existe */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error en la validación</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Resultados del Cupón */}
        {coupon && (
          <div className="space-y-4 animate-fadeIn">
            {/* ESTADO 1: CUPÓN ACTIVO Y VÁLIDO */}
            {isActive && (
              <div className="bg-white border-2 border-emerald-400 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                      Cupón Válido & Activo
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-800 text-base tracking-widest bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {coupon.coupon_code}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{coupon.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{coupon.discount_description}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Comensal:</span>
                    </span>
                    <strong className="text-slate-900">{coupon.customer_name || 'Comensal en Mesa'}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>Comercio Anunciante:</span>
                    </span>
                    <strong className="text-slate-900">{coupon.advertiser_name}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Vigencia:</span>
                    </span>
                    <strong className="text-emerald-700">
                      Vence: {new Date(coupon.expires_at).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                {/* Formulario de Canje con Monto de Venta Opcional (SPEC-006) */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Monto Cobrado en Ticket ($ MXN) <span className="text-slate-400 lowercase">(opcional)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        value={ticketAmount}
                        onChange={(e) => setTicketAmount(e.target.value)}
                        placeholder="Ej: 350.00"
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Permite calcular el Retorno de Inversión (ROI) de tu publicidad local.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isRedeeming}
                    onClick={handleRedeem}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRedeeming ? 'Validando...' : 'Quemar y Aplicar Beneficio'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ESTADO 2: YA CANJEADO (BLOQUEO ATÓMICO SINGLE-USE SPEC-006) */}
            {isAlreadyRedeemed && (
              <div className="bg-white border-2 border-rose-300 rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                      Cupón Ya Utilizado
                    </span>
                  </div>
                  <span className="font-mono font-black text-rose-700 text-base tracking-widest bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                    {coupon.coupon_code}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 line-through">{coupon.title}</h3>
                  <p className="text-xs text-rose-700 mt-1">
                    Este cupón ya fue canjeado con anterioridad y ha sido invalidado. No es aplicable para un segundo uso.
                  </p>
                </div>

                <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200 text-xs space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Fecha de Canje Previo:</span>
                    </span>
                    <strong className="text-rose-700">
                      {coupon.redeemed_at ? new Date(coupon.redeemed_at).toLocaleString() : 'Previamente quemado'}
                    </strong>
                  </div>
                  {coupon.ticket_amount && (
                    <div className="flex justify-between">
                      <span>Monto registrado en venta:</span>
                      <strong className="text-slate-900">${coupon.ticket_amount} MXN</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ESTADO 3: EXPIRADO */}
            {isExpired && !isAlreadyRedeemed && (
              <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Cupón Expirado
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  La fecha límite de vigencia ({new Date(coupon.expires_at).toLocaleDateString()}) fue superada.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de Éxito al redimir en este instante */}
        {redeemSuccess && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-emerald-900 text-xs space-y-1 animate-fadeIn">
            <p className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>¡Beneficio Aplicado Exitosamente!</span>
            </p>
            <p className="text-[11px] text-emerald-700">
              El cupón ha sido quemado atómicamente y ya no podrá ser reutilizado por otro comensal.
            </p>
          </div>
        )}
      </main>

      {/* Pie de pantalla */}
      <footer className="p-4 border-t border-slate-200 text-center text-xs text-slate-400">
        Sistema Antifraude de Cupones • Google Reseñas Red Publicitaria
      </footer>
    </div>
  );
};
