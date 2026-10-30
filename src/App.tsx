import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResolverPage } from './pages/ResolverPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminAuthGuard } from './components/admin/AdminAuthGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRestaurantsPage } from './pages/AdminRestaurantsPage';
import { AdminTagsPage } from './pages/AdminTagsPage';
import { AdminAdsPage } from './pages/AdminAdsPage';
import { AdminFeedbackPage } from './pages/AdminFeedbackPage';
import { PortalLoginPage } from './pages/portal/PortalLoginPage';
import { PortalAuthGuard } from './components/portal/PortalAuthGuard';
import { PortalDashboardPage } from './pages/portal/PortalDashboardPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rutas Públicas de Comensal / NFC Tag */}
        <Route path="/" element={<ResolverPage />} />
        <Route path="/t/:tagCode" element={<ResolverPage />} />

        {/* Portal Móvil del Suscriptor / Dueño del Local */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal" element={<PortalAuthGuard />}>
          <Route index element={<PortalDashboardPage />} />
        </Route>

        {/* Autenticación Administrativa */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Panel Administrativo Protegido */}
        <Route path="/admin" element={<AdminAuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="ads" element={<AdminAdsPage />} />
            <Route path="feedback" element={<AdminFeedbackPage />} />
          </Route>
        </Route>

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;

