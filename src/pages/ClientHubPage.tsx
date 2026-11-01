import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Repeat,
  Receipt,
  Wallet,
  CheckCircle2,
  Ticket,
  Flame,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TaxProfileCFDI40, FoodieFavorite } from '../types';
import { CorporateDeliveryModal } from '../components/client/CorporateDeliveryModal';

const DEFAULT_TAX_PROFILE: TaxProfileCFDI40 = {
  rfc: 'XAXX010101000',
  legal_name: 'PÚBLICO EN GENERAL',
  zip_code: '06600',
  tax_regime: '612',
  use_cfdi: 'G03',
  email: 'usuario@empresa.com',
};

const DEFAULT_FAVORITES: FoodieFavorite[] = [
  {
    id: 'fav-1',
    restaurant_id: 'res-1',
    restaurant_name: 'Tacos Don Güero Express',
    item_name: 'Paquete Godín: 4 Tacos de Pastor con Piña + Refresco',
    price: 135,
    order_count: 8,
    last_ordered_at: 'Ayer, 14:15 hrs',
  },
  {
    id: 'fav-2',
    restaurant_id: 'res-1',
    restaurant_name: 'La Trattoria Pasta & Pizza',
    item_name: 'Menú Ejecutivo: Lasagna Bolognese + Ensalada Verde',
    price: 175,
    order_count: 5,
    last_ordered_at: 'Jueves pasado',
  },
  {
    id: 'fav-3',
    restaurant_id: 'res-1',
    restaurant_name: 'Wok Asiático Plaza',
    item_name: 'Bowl Teriyaki de Pollo con Arroz Jazmín',
    price: 155,
    order_count: 3,
    last_ordered_at: 'Hace 1 semana',
  },
];

export const ClientHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reorder' | 'cashback' | 'cfdi' | 'vip'>('reorder');
  const [phone] = useState('55 4920 1823');
  const [userName] = useState('Carlos Mendoza');
  const [cashbackBalance] = useState(68.50);
  const [isVipMember, setIsVipMember] = useState(false);

  // Formulario CFDI 4.0
  const [taxProfile, setTaxProfile] = useState<TaxProfileCFDI40>(() => {
    const saved = localStorage.getItem('nfc_client_tax_profile');
    return saved ? JSON.parse(saved) : DEFAULT_TAX_PROFILE;
  });
  const [taxSavedSuccess, setTaxSavedSuccess] = useState(false);

  // Modal de Delivery Corporativo para 1-clic reorder
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [selectedFav, setSelectedFav] = useState<FoodieFavorite | null>(null);

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nfc_client_tax_profile', JSON.stringify(taxProfile));
    setTaxSavedSuccess(true);
    setTimeout(() => setTaxSavedSuccess(false), 3000);
  };

  const handleTriggerReorder = (fav: FoodieFavorite) => {
    setSelectedFav(fav);
    setReorderModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* HEADER PRINCIPAL */}
      <header className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  Portal del Comensal
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30 uppercase tracking-widest">
                  {isVipMember ? 'Socio VIP' : 'Club Foodie'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{userName} • {phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pasaporte"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Cupones</span>
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENIDO CENTRAL */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* RESUMEN DE BENEFICIOS Y SALDO CASHBACK */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/40 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Wallet className="w-4 h-4" />
                Monedero Electrónico de Barrio
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white">
                ${cashbackBalance.toFixed(2)}{' '}
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  MXN Acumulados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ganas el <strong>5% de cashback</strong> en cada consumo en restaurantes afiliados de la zona.
              </p>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Ahorro del Mes: $142 MXN
              </span>
            </div>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('reorder')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reorder'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">El de Siempre</span>
            <span className="sm:hidden">Repetir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cfdi')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cfdi'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Factura CFDI</span>
            <span className="sm:hidden">Factura</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashback')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cashback'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Monedero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vip')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'vip'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Club VIP</span>
          </button>
        </div>

        {/* PESTAÑA 1: RE-ORDENAR EN 1-CLIC */}
        {activeTab === 'reorder' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Tus Platillos Favoritos de Oficina</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pide con 1 solo clic y te lo llevamos a tu piso sin comisión de Rappi
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {DEFAULT_FAVORITES.map((fav) => (
                <div
                  key={fav.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {fav.restaurant_name}
                    </span>
                    <h4 className="text-sm font-bold text-white">{fav.item_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Pedido {fav.order_count} veces • Última vez: {fav.last_ordered_at}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-base font-black text-white">${fav.price.toFixed(2)} MXN</span>
                    <button
                      type="button"
                      onClick={() => handleTriggerReorder(fav)}
                      className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Pedir en 1 Clic</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: AUTOFACTURACIÓN CFDI 4.0 */}
        {activeTab === 'cfdi' && (
          <form onSubmit={handleSaveTax} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Datos Fiscales para Autofacturación CFDI 4.0
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guárdalos una vez y timbra tus consumos al instante sin hacer filas en caja
              </p>
            </div>

            {taxSavedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Datos fiscales guardados con éxito para todas tus comandas.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  RFC del Receptor
                </label>
                <input
                  type="text"
                  required
                  value={taxProfile.rfc}
                  onChange={(e) => setTaxProfile({ ...taxProfile, rfc: e.target.value.toUpperCase() })}
                  maxLength={13}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                  placeholder="XAXX010101000"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Código Postal Fiscal
                </label>
                <input
                  type="text"
                  required
                  value={taxProfile.zip_code}
                  onChange={(e) => setTaxProfile({ ...taxProfile, zip_code: e.target.value })}
                  maxLength={5}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="06600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre o Razón Social (Sin régimen societario)
                </label>
                <input
                  type="text"
                  required
                  value={taxProfile.legal_name}
                  onChange={(e) => setTaxProfile({ ...taxProfile, legal_name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white uppercase focus:border-amber-500 focus:outline-none"
                  placeholder="CARLOS MENDOZA LOPEZ"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Régimen Fiscal SAT
                </label>
                <select
                  value={taxProfile.tax_regime}
                  onChange={(e) => setTaxProfile({ ...taxProfile, tax_regime: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="605">605 - Sueldos y Salarios</option>
                  <option value="612">612 - Personas Físicas Actividades Empresariales</option>
                  <option value="626">626 - RESICO (Régimen Simplificado)</option>
                  <option value="601">601 - General de Ley Personas Morales</option>
                  <option value="606">606 - Arrendamiento</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Uso del CFDI
                </label>
                <select
                  value={taxProfile.use_cfdi}
                  onChange={(e) => setTaxProfile({ ...taxProfile, use_cfdi: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="G03">G03 - Gastos en general</option>
                  <option value="G01">G01 - Adquisición de mercancías</option>
                  <option value="S01">S01 - Sin efectos fiscales</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Correo para recibir XML y PDF
                </label>
                <input
                  type="email"
                  required
                  value={taxProfile.email}
                  onChange={(e) => setTaxProfile({ ...taxProfile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="facturacion@empresa.com"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Guardar Perfil Fiscal
              </button>
            </div>
          </form>
        )}

        {/* PESTAÑA 3: MONEDERO Y MOVIMIENTOS */}
        {activeTab === 'cashback' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Historial de Bonificaciones</h3>
                <p className="text-xs text-slate-400">Tus reembolsos automáticos del 5%</p>
              </div>
              <span className="text-xs text-amber-400 font-bold">Saldo: ${cashbackBalance.toFixed(2)} MXN</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Tacos Don Güero Express</p>
                  <p className="text-[10px] text-slate-400">Consumo de $180 MXN • Ayer</p>
                </div>
                <span className="font-black text-emerald-400">+$9.00 MXN</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">La Trattoria Pasta & Pizza</p>
                  <p className="text-[10px] text-slate-400">Consumo de $350 MXN • 28 Oct</p>
                </div>
                <span className="font-black text-emerald-400">+$17.50 MXN</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Canje en mostrador</p>
                  <p className="text-[10px] text-slate-400">Descuento aplicado • 20 Oct</p>
                </div>
                <span className="font-black text-rose-400">-$25.00 MXN</span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: MONETIZACIÓN VIP */}
        {activeTab === 'vip' && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-amber-500/20 border border-amber-500/40 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Star className="w-6 h-6 fill-slate-950" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Membresía B2C
                </span>
                <h3 className="text-xl font-black text-white">Club Foodie VIP</h3>
                <p className="text-xs text-slate-400">$49 MXN / mes (Cancela cuando quieras)</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Envíos gratis ilimitados</strong> a tu piso u oficina vecina.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>10% de Cashback</strong> en monedero (el doble del plan normal).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Bebida o postre de cortesía</strong> cada viernes en tu primer pedido.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVipMember(!isVipMember)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {isVipMember ? 'Gestionar Membresía Activa' : 'Activar Membresía VIP por $49 MXN/mes'}
            </button>
          </div>
        )}
      </main>

      {/* MODAL DE RE-ORDENAR CORPORATIVO EN 1 CLIC */}
      {selectedFav && (
        <CorporateDeliveryModal
          isOpen={reorderModalOpen}
          onClose={() => setReorderModalOpen(false)}
          restaurantId={selectedFav.restaurant_id}
          restaurantName={selectedFav.restaurant_name}
          items={[
            {
              menu_item_id: selectedFav.id,
              name: selectedFav.item_name,
              price: selectedFav.price,
              quantity: 1,
            },
          ]}
          totalAmount={selectedFav.price}
          onOrderSuccess={(order) => {
            console.log('Orden corporativa creada con éxito:', order);
          }}
        />
      )}
    </div>
  );
};
