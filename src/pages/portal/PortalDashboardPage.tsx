import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { PortalContextType } from '../../components/portal/PortalAuthGuard';
import type { Restaurant, Feedback } from '../../types';
import { api } from '../../lib/api';
import { PortalHeader } from '../../components/portal/PortalHeader';
import { PortalBottomNav, type PortalTab } from '../../components/portal/PortalBottomNav';
import { PwaInstallBanner } from '../../components/portal/PwaInstallBanner';
import { PortalFeedbackTab } from './PortalFeedbackTab';
import { PortalLinksTab } from './PortalLinksTab';
import { PortalMetricsTab } from './PortalMetricsTab';
import { Loader2 } from 'lucide-react';

export const PortalDashboardPage: React.FC = () => {
  const { organization } = useOutletContext<PortalContextType>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<PortalTab>('quejas');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [rests, fbs] = await Promise.all([
        api.getMyRestaurants(),
        api.getMyFeedbacks(selectedRestaurantId),
      ]);
      setRestaurants(rests);
      setFeedbacks(fbs);
    } catch (e) {
      console.error('Error cargando datos del portal:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRestaurantId]);

  const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'new').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-semibold">Cargando tu sucursal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white pb-20 md:pb-8">
      {/* Banner de Instalación PWA */}
      <PwaInstallBanner />

      {/* Encabezado Responsive (Móvil y Escritorio) */}
      <PortalHeader
        organization={organization}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingFeedbackCount={pendingFeedbackCount}
      />

      {/* Contenido Principal Adaptable a Pantallas Grandes */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8 animate-fadeIn">
        {activeTab === 'quejas' && (
          <PortalFeedbackTab
            feedbacks={feedbacks}
            restaurants={restaurants}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'enlaces' && (
          <PortalLinksTab
            restaurants={restaurants}
            selectedRestaurantId={selectedRestaurantId}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'metricas' && (
          <PortalMetricsTab
            restaurants={restaurants}
            feedbacks={feedbacks}
            selectedRestaurantId={selectedRestaurantId}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior Fija (Solo en móviles/tablets) */}
      <div className="md:hidden">
        <PortalBottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingFeedbackCount={pendingFeedbackCount}
        />
      </div>
    </div>
  );
};
