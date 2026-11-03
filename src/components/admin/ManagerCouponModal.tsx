import React, { useState, useEffect } from 'react';
import type { OrganizationManager, ManagerRetentionCoupon } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  Ticket,
  Plus,
  Percent,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface ManagerCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: OrganizationManager | null;
  restaurantId: string;
  branchName?: string;
  onCouponCreated?: () => void;
}

export const ManagerCouponModal: React.FC<ManagerCouponModalProps> = ({
  isOpen,
  onClose,
  manager,
  restaurantId,
  branchName = 'Sucursal',
  onCouponCreated,
}) => {
  const [coupons, setCoupons] = useState<ManagerRetentionCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Formulario de creación
  const [couponCode, setCouponCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const [discountDescription, setDiscountDescription] = useState('Cortesía de gerencia por inconformidad o queja');
  const [formError, setFormError] = useState('');

  const loadCoupons = async () => {
    if (!manager) return;
    setLoading(true);
    const all = await api.getManagerRetentionCoupons(restaurantId);
    // Filtrar por este gerente
    const mgrCoupons = all.filter(
      (c) => c.manager_name === manager.name || c.restaurant_id === restaurantId
    );
    setCoupons(mgrCoupons);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && manager) {
      loadCoupons();
      generateRandomCode();
    }
  }, [isOpen, manager, restaurantId]);

  const generateRandomCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCouponCode(`DISC-${discountPercentage}-${randomSuffix}`);
  };

  const handleToggleCouponActive = async (cp: ManagerRetentionCoupon) => {
    const nextVal = !cp.is_active;
    await api.updateManagerRetentionCoupon(cp.id, { is_active: nextVal });
    setCoupons((prev) =>
      prev.map((c) => (c.id === cp.id ? { ...c, is_active: nextVal } : c))
    );
    setToastMsg(`Cupón "${cp.coupon_code}" ${nextVal ? 'activado' : 'desactivado'}.`);
    onCouponCreated?.();
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`¿Eliminar el cupón ${code}?`)) return;
    await api.deleteManagerRetentionCoupon(couponId);
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    setToastMsg(`Cupón "${code}" eliminado.`);
    onCouponCreated?.();
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manager) return;

    if (!couponCode.trim()) {
      setFormError('Ingresa un código de cupón válido.');
      return;
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      setFormError('El porcentaje debe estar entre 1% y 100%.');
      return;
    }

    if (!discountDescription.trim()) {
      setFormError('Escribe una breve descripción o motivo del descuento.');
      return;
    }

    setFormError('');
    setIsCreating(true);

    const res = await api.createManagerRetentionCoupon({
      organization_id: manager.organization_id || 'org-1',
      restaurant_id: restaurantId,
      manager_id: manager.id,
      manager_name: manager.name,
      title: `Cupón ${discountPercentage}% - ${manager.name}`,
      coupon_code: couponCode.trim().toUpperCase(),
      discount_percentage: Number(discountPercentage),
      discount_description: discountDescription.trim(),
      monthly_limit: 1, // Requerimiento 1: Cada cupón es de 1 solo uso estricto
      is_active: true,
    });

    setIsCreating(false);

    if (res.success && res.data) {
      setCoupons((prev) => [res.data!, ...prev]);
      setToastMsg(`Cupón ${res.data.coupon_code} de 1 solo uso creado exitosamente.`);
      generateRandomCode();
      onCouponCreated?.();
      setTimeout(() => setToastMsg(null), 3500);
    } else {
      setFormError(res.error || 'Error creando el cupón.');
    }
  };

  if (!isOpen || !manager) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera Bento */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Agente Creador de Cupones de Retención
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {manager.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Emisión de descuentos de 1 solo uso del gerente para contención de quejas en {branchName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notificación Toast */}
        {toastMsg && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Formulario de Alta de Cupón de 1 Solo Uso */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Emitir Nuevo Cupón de Gerente (1 Solo Uso)
                </h3>
              </div>
              <button
                type="button"
                onClick={generateRandomCode}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                Autogenerar código
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Código del Cupón
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="DISCULPA15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Descuento (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDiscountPercentage(val);
                        setCouponCode(`DISC-${val}-${Math.floor(100 + Math.random() * 900)}`);
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Modalidad de Uso
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 font-bold text-xs text-indigo-900 flex items-center justify-between">
                    <span>1 solo uso por cupón</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white">Único</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Motivo de Retención / Descripción
                </label>
                <input
                  type="text"
                  value={discountDescription}
                  onChange={(e) => setDiscountDescription(e.target.value)}
                  placeholder="Cortesía por demora o platillo en cocina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Guardando...' : 'Crear y Habilitar Cupón'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Listado de Cupones Emitidos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Cupones Vigentes de este Gerente ({coupons.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">
                Mes actual ({new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })})
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Cargando cupones...</div>
            ) : coupons.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                Este gerente no tiene cupones de retención creados para esta sucursal.
              </div>
            ) : (
              <div className="space-y-2.5">
                {coupons.map((cp) => {
                  const isUsed = (cp.used_this_month || 0) >= (cp.monthly_limit || 1);

                  return (
                    <div
                      key={cp.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isUsed
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : cp.is_active
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono font-black text-sm tracking-wide px-2 py-0.5 rounded-lg border ${
                              isUsed
                                ? 'line-through text-slate-400 bg-slate-100 border-slate-200'
                                : 'text-slate-900 bg-slate-100 border-slate-200'
                            }`}
                          >
                            {cp.coupon_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-black text-[11px] border ${
                              isUsed
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            {cp.discount_percentage}% OFF
                          </span>
                          {isUsed ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
                              Canjeado (1/1 Usado)
                            </span>
                          ) : cp.is_active ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Disponible (1 Solo Uso)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Pausado
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                          {cp.discount_description}
                        </p>

                        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                          {isUsed ? (
                            <span className="font-semibold text-slate-500">
                              Este cupón ya fue canjeado en una queja o cortesía.
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-700">
                              Válido para un único canje en cuenta o buzón de quejas.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isUsed && (
                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(cp)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                              cp.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {cp.is_active ? 'Habilitado' : 'Pausado'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(cp.id, cp.coupon_code)}
                          title="Eliminar este cupón"
                          className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Los cupones de 1 solo uso quedan vinculados a la queja autorizada en el buzón.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
