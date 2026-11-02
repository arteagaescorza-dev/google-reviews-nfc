import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResolverPage } from './pages/ResolverPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminAuthGuard } from './components/admin/AdminAuthGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRestaurantsPage } from './pages/AdminRestaurantsPage';
import { AdminTagsPage } from './pages/AdminTagsPage';
import { AdminHardwarePage } from './pages/AdminHardwarePage';
import { AdminSalesPage } from './pages/AdminSalesPage';
import { AdminAdsPage } from './pages/AdminAdsPage';
import { AdminFinancesPage } from './pages/AdminFinancesPage';
import { AdminSupportPage } from './pages/AdminSupportPage';
import { AdminCoveragePage } from './pages/AdminCoveragePage';
import { PortalKitchenPage } from './pages/portal/PortalKitchenPage';
import { PortalStaffPage } from './pages/portal/PortalStaffPage';
import { PortalLoginPage } from './pages/portal/PortalLoginPage';
import { PortalAuthGuard } from './components/portal/PortalAuthGuard';
import { PortalDashboardPage } from './pages/portal/PortalDashboardPage';
import { WebPassportPage } from './pages/WebPassportPage';
import { RedeemCouponPage } from './pages/RedeemCouponPage';
import { TurneroPlazaPage } from './pages/TurneroPlazaPage';
import { ClientHubPage } from './pages/ClientHubPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rutas Públicas de Comensal / NFC Tag */}
        <Route path="/" element={<ResolverPage />} />
        <Route path="/t/:tagCode" element={<ResolverPage />} />

        {/* Hub del Comensal PWA, 1-Click Reorder y Autofacturacion (DT-18) */}
        <Route path="/mi-cuenta" element={<ClientHubPage />} />
        <Route path="/club" element={<ClientHubPage />} />

        {/* Turnero Maestro de Plaza Publica / Food Court 4K (DT-15) */}
        <Route path="/turnero-plaza" element={<TurneroPlazaPage />} />

        {/* Pasaporte Web PWA para Comensales (SPEC-006) */}
        <Route path="/pasaporte" element={<WebPassportPage />} />

        {/* Validador de Cupones en Recepción / Mostrador (SPEC-006) */}
        <Route path="/canjear" element={<RedeemCouponPage />} />

        {/* Portal Móvil del Suscriptor / Dueño del Local */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal" element={<PortalAuthGuard />}>
          <Route index element={<PortalDashboardPage />} />
        </Route>

        {/* Terminales de Sala y Cocina */}
        <Route path="/portal/cocina" element={<PortalKitchenPage />} />
        <Route path="/portal/mesero" element={<PortalStaffPage />} />

        {/* Autenticación Administrativa */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Panel Administrativo Protegido */}
        <Route path="/admin" element={<AdminAuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="hardware" element={<AdminHardwarePage />} />
            <Route path="ventas" element={<AdminSalesPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="ads" element={<AdminAdsPage />} />
            <Route path="finanzas" element={<AdminFinancesPage />} />
            <Route path="cobertura" element={<AdminCoveragePage />} />
            <Route path="soporte" element={<AdminSupportPage />} />
            {/* Alias de retrocompatibilidad */}
            <Route path="feedback" element={<Navigate to="/admin/soporte" replace />} />
          </Route>
        </Route>

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
