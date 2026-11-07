import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type {
  FoodCourt,
  FoodCourtBranchLink,
  FoodCourtAggregatedMetrics,
  Restaurant,
  Ad,
} from '../../types';
import {
  Building2,
  BarChart3,
  Store,
  Tv,
  Megaphone,
  Plus,
  Link2,
  Copy,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Trash2,
  Download,
  LogOut,
  ShieldCheck,
  Volume2,
  Sparkles,
} from 'lucide-react';

export const FoodCourtDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'metrics' | 'tenants' | 'turnero_config' | 'ads'>('metrics');

  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [metrics, setMetrics] = useState<FoodCourtAggregatedMetrics | null>(null);
  const [branches, setBranches] = useState<FoodCourtBranchLink[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Estados para Vía A: Vincular sucursal existente de otra organización
  const [selectedExistingRestId, setSelectedExistingRestId] = useState('');
  const [linkSpaceNumber, setLinkSpaceNumber] = useState('Local FC-04');
  const [linkCounterLabel, setLinkCounterLabel] = useState('Barra 4');

  // Estados para Vía B: Pre-registrar nuevo locatario
  const [newBrandName, setNewBrandName] = useState('');
  const [newSpaceNumber, setNewSpaceNumber] = useState('Local FC-05');
  const [newCounterLabel, setNewCounterLabel] = useState('Barra 5');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [generatedActivationUrl, setGeneratedActivationUrl] = useState('');

  // Estados de configuración del Turnero 4K
  const [fcNameInput, setFcNameInput] = useState('');
  const [mallNameInput, setMallNameInput] = useState('');
  const [enableVoiceTts, setEnableVoiceTts] = useState(true);
  const [enableBuzzerChime, setEnableBuzzerChime] = useState(true);
  const [autoHideMinutes, setAutoHideMinutes] = useState(3);
  const [adRotationSecs, setAdRotationSecs] = useState(20);

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    const fc = await api.getFoodCourtDetails('galerias-reforma');
    if (fc) {
      setFoodCourt(fc);
      setFcNameInput(fc.name);
      setMallNameInput(fc.mall_name);
      setEnableVoiceTts(fc.turnero_config.enableVoiceTts);
      setEnableBuzzerChime(fc.turnero_config.enableBuzzerChime);
      setAutoHideMinutes(fc.turnero_config.autoHideReadyMinutes);
      setAdRotationSecs(fc.turnero_config.adRotationSeconds);

      const [fcBranches, fcMetrics, rests, adsList] = await Promise.all([
        api.getFoodCourtBranches(fc.id),
        api.getFoodCourtMetrics(fc.id),
        api.getRestaurants(),
        api.getAds(),
      ]);

      setBranches(fcBranches);
      setMetrics(fcMetrics);
      setAllRestaurants(rests);
      setAds(adsList.filter((a) => a.is_active));

      const linkedIds = new Set(fcBranches.map((b) => b.restaurant_id));
      const unlinked = rests.find((r) => !linkedIds.has(r.id));
      if (unlinked) {
        setSelectedExistingRestId(unlinked.id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Vía A: Vincular sucursal existente (Cross-Organization)
  const handleLinkExistingBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt || !selectedExistingRestId) return;

    const res = await api.linkBranchToFoodCourt(
      foodCourt.id,
      selectedExistingRestId,
      linkSpaceNumber,
      linkCounterLabel
    );

    if (res.success) {
      showNotice('Sucursal vinculada exitosamente al Food Court.');
      await loadAll();
    } else {
      showNotice(res.error || 'No se pudo vincular la sucursal.');
    }
  };

  // Vía B: Pre-registrar nuevo locatario por contrato de plaza
  const handlePreRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt || !newBrandName.trim()) return;

    const res = await api.preRegisterFoodCourtTenant(foodCourt.id, {
      brandName: newBrandName,
      spaceNumber: newSpaceNumber,
      pickupCounter: newCounterLabel,
      contactEmail: newContactEmail,
    });

    if (res.success && res.activationUrl) {
      setGeneratedActivationUrl(res.activationUrl);
      setNewBrandName('');
      setNewContactEmail('');
      showNotice('Pre-registro creado. Comparte el enlace de activación con el locatario.');
      await loadAll();
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    await api.removeBranchFromFoodCourt(linkId);
    showNotice('Local desvinculado del Food Court.');
    await loadAll();
  };

  const handleSaveTurneroConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodCourt) return;

    const res = await api.updateFoodCourtConfig(
      foodCourt.id,
      {
        enableVoiceTts,
        enableBuzzerChime,
        autoHideReadyMinutes: Number(autoHideMinutes) || 3,
        adRotationSeconds: Number(adRotationSecs) || 20,
      },
      {
        name: fcNameInput.trim() || foodCourt.name,
        mall_name: mallNameInput.trim() || foodCourt.mall_name,
      }
    );

    if (res.success && res.data) {
      setFoodCourt(res.data);
      showNotice('Configuración del Turnero Maestro 4K actualizada.');
    }
  };

  const handleExportCsv = () => {
    if (!metrics) return;
    const headers = [
      'Espacio Comercial',
      'Marca Locatario',
      'Mostrador',
      'Ordenes Despachadas',
      'Tiempo Promedio Prep (min)',
      'Ticket Promedio Estimado (MXN)',
      'Facturacion Bruta Estimada (MXN)',
    ];
    const rows = metrics.tenants.map((t) => [
      t.commercial_space_number,
      `"${t.brand_name}"`,
      t.pickup_counter_label,
      t.orders_count,
      t.avg_prep_minutes,
      t.average_ticket.toFixed(2),
      t.gross_revenue_estimated.toFixed(2),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_comedor_${foodCourt?.slug || 'plaza'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Reporte CSV de comedor y renta variable descargado.');
  };

  if (loading && !foodCourt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-600 text-xs font-bold">
        Cargando Consola de Administración de Plaza Comercial...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Cabecera Ejecutiva Bento Light */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-20 px-4 sm:px-8 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {foodCourt?.name || 'Administración de Food Court'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  Operador de Plaza Comercial
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {foodCourt?.mall_name} • Federación Multi-Organización & Turnero 4K
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={`/turnero-plaza?food_court=${foodCourt?.slug || 'galerias-reforma'}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Tv className="w-4 h-4" />
              <span>Abrir Turnero Maestro 4K</span>
            </Link>

            <button
              onClick={() => navigate('/login')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {toastMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Navegación de 4 Pestañas Ejecutivas */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs inline-flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas de Comedor & Renta Variable</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Directorio de Locatarios ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('turnero_config')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'turnero_config'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Personalización del Turnero 4K</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ads'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Publicidad en Pantalla (Split 30%)</span>
          </button>
        </div>

        {/* PESTAÑA 1: MÉTRICAS DE COMEDOR & RENTA VARIABLE */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            {/* Aviso de Gobernanza y Aislamiento Multi-Tenant */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Gobernanza de Datos de Comedor y Renta Variable
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Como administrador del Food Court, visualizas la afluencia del comedor común, tiempos de entrega y la estimación de ticket promedio y venta bruta de tus locatarios. Las recetas, costos internos, nóminas y buzón de quejas privadas permanecen confidenciales en la cuenta de cada organización.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* Tarjetas KPI Globales del Comedor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Órdenes en Comedor
                  </span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics.total_orders_count}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  En {metrics.active_tenants_count} locales activos
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tiempo Medio de Espera
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics.avg_wait_minutes} min
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Dentro del estándar de plaza (&lt;15m)
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Ticket Promedio Comedor
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ${metrics.global_average_ticket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Promedio ponderado por comanda
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Venta Bruta Estimada
                  </span>
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ${metrics.total_gross_revenue_estimated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Base referencial para renta variable
                </p>
              </div>
            </div>

            {/* Tabla de Desempeño y Renta Variable por Locatario */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Auditoría Operativa y Estimación de Ingresos por Local
                  </h2>
                  <p className="text-xs text-slate-500">
                    Indicadores superficiales de actividad comercial de cada locatario federado
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Espacio</th>
                      <th className="py-3 px-4">Locatario / Marca</th>
                      <th className="py-3 px-4">Mostrador Turnero</th>
                      <th className="py-3 px-4 text-right">Órdenes</th>
                      <th className="py-3 px-4 text-right">SLA Cocina</th>
                      <th className="py-3 px-4 text-right">Ticket Promedio</th>
                      <th className="py-3 px-4 text-right">Venta Bruta Estimada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {metrics.tenants.map((t) => (
                      <tr key={t.branch_link_id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {t.commercial_space_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{t.brand_name}</span>
                          <span className="text-[10px] text-slate-400">
                            Org: {t.organization_id || 'Independiente'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {t.pickup_counter_label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {t.orders_count}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600">
                          {t.avg_prep_minutes} min
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          ${t.average_ticket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                          ${t.gross_revenue_estimated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: DIRECTORIO DE LOCATARIOS FEDERADOS (CROSS-ORGANIZACIÓN) */}
        {activeTab === 'tenants' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Formularios de Incorporación Doble Vía */}
            <div className="lg:col-span-5 space-y-6">
              {/* Vía A: Vincular sucursal existente */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Vincular Sucursal Existente
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Añade una sucursal de otra organización al Turnero del Food Court
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLinkExistingBranch} className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Seleccionar Sucursal en Plataforma
                    </label>
                    <select
                      value={selectedExistingRestId}
                      onChange={(e) => setSelectedExistingRestId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
                    >
                      {allRestaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.brand_name || r.name} ({r.branch_name || 'Principal'}) - Org: {r.organization_id || 'Ext'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Número de Local
                      </label>
                      <input
                        type="text"
                        required
                        value={linkSpaceNumber}
                        onChange={(e) => setLinkSpaceNumber(e.target.value)}
                        placeholder="Local FC-04"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Barra / Mostrador
                      </label>
                      <input
                        type="text"
                        required
                        value={linkCounterLabel}
                        onChange={(e) => setLinkCounterLabel(e.target.value)}
                        placeholder="Barra 4"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Vincular al Food Court</span>
                  </button>
                </form>
              </div>

              {/* Vía B: Pre-registrar nuevo locatario */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Pre-registrar Nuevo Locatario
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Genera un enlace de adopción obligatoria para un nuevo inquilino
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePreRegisterTenant} className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Marca o Nombre Comercial del Locatario
                    </label>
                    <input
                      type="text"
                      required
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Ej. Helados Santa Clara"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Espacio Comercial
                      </label>
                      <input
                        type="text"
                        required
                        value={newSpaceNumber}
                        onChange={(e) => setNewSpaceNumber(e.target.value)}
                        placeholder="Local FC-05"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mostrador Asignado
                      </label>
                      <input
                        type="text"
                        required
                        value={newCounterLabel}
                        onChange={(e) => setNewCounterLabel(e.target.value)}
                        placeholder="Barra 5"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Correo del Responsable del Local
                    </label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      placeholder="gerente@locatario.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generar Invitación de Locatario</span>
                  </button>
                </form>

                {generatedActivationUrl && (
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Enlace de Activación Generado:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedActivationUrl}
                        className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedActivationUrl);
                          showNotice('Enlace copiado al portapapeles.');
                        }}
                        className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                        title="Copiar enlace"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Lista de Locales Federados */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
              <h3 className="text-base font-black text-slate-900 mb-1">
                Locales Federados en el Food Court
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Sucursales de distintas organizaciones conectadas en tiempo real al Turnero Maestro 4K
              </p>

              <div className="space-y-3">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                          {b.commercial_space_number}
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {b.tenant_brand_name || 'Local Federado'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status === 'active' ? 'Sincronizado' : 'Pendiente Activación'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Mostrador en Turnero: <strong>{b.pickup_counter_label}</strong> • ID Sucursal: {b.restaurant_id || 'Pre-registro'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveLink(b.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Desvincular local del Food Court"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: PERSONALIZACIÓN EXCLUSIVA DEL TURNERO 4K */}
        {activeTab === 'turnero_config' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Configuración del Turnero Maestro 4K
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Ajusta el comportamiento visual y acústico de las pantallas del comedor común
            </p>

            <form onSubmit={handleSaveTurneroConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título en Pantalla del Turnero
                </label>
                <input
                  type="text"
                  value={fcNameInput}
                  onChange={(e) => setFcNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial de la Plaza Comercial
                </label>
                <input
                  type="text"
                  value={mallNameInput}
                  onChange={(e) => setMallNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Voz Sintética (TTS)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Anuncia turno y local por altavoz
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVoiceTts}
                    onChange={(e) => setEnableVoiceTts(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>

                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Timbre Acústico
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Campanilla previa al anuncio
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableBuzzerChime}
                    onChange={(e) => setEnableBuzzerChime(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Retiro Automático de Turnos Listos (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={autoHideMinutes}
                    onChange={(e) => setAutoHideMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rotación de Anuncios en Columna 30% (seg)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={adRotationSecs}
                    onChange={(e) => setAdRotationSecs(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Ajustes del Turnero
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PESTAÑA 4: RENDIMIENTO PUBLICITARIO EN LA PANTALLA 4K */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Red Publicitaria Exhibida en Pantalla 4K (Columna 30%)
                </h2>
                <p className="text-xs text-slate-500">
                  Anuncios activos de nuestra red que se proyectan de forma rotativa en el comedor de la plaza
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                {ads.length} Campañas Activas en Rotación
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50 flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={ad.banner_url}
                      alt={ad.title}
                      className="w-full h-36 object-cover border-b border-slate-200"
                    />
                    <div className="p-4">
                      <span className="text-[10px] font-black uppercase text-blue-600">
                        {ad.advertiser_name}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-0.5">{ad.title}</h3>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Impresiones: <strong className="text-slate-900">{ad.impressions_count}</strong>
                    </span>
                    <span className="text-slate-500">
                      Interacciones: <strong className="text-emerald-700">{ad.clicks_count}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
