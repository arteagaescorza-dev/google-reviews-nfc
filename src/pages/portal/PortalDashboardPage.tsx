import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { PortalContextType } from '../../components/portal/PortalAuthGuard';
import type { Restaurant, Feedback } from '../../types';
import { api } from '../../lib/api';
import { setupRealtimeAlerts } from '../../lib/notifications';
import { PortalHeader } from '../../components/portal/PortalHeader';
import { PortalSidebar } from '../../components/portal/PortalSidebar';
import { PortalBottomNav, type PortalTab } from '../../components/portal/PortalBottomNav';
import { PwaInstallBanner } from '../../components/portal/PwaInstallBanner';
import { PortalFeedbackTab } from './PortalFeedbackTab';
import { PortalLinksTab } from './PortalLinksTab';
import { PortalMetricsTab } from './PortalMetricsTab';
import { PortalAccountTab } from './PortalAccountTab';
import { NewBranchModal } from '../../components/portal/NewBranchModal';
import { Loader2 } from 'lucide-react';

export const PortalDashboardPage: React.FC = () => {
  const { organization, member, refreshMembership } = useOutletContext<PortalContextType>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<PortalTab>('quejas');
  const [loading, setLoading] = useState(true);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);

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

  // Conectar alertas push en tiempo real (quejas de 1-3 estrellas y llamadas urgentes)
  useEffect(() => {
    if (organization?.id) {
      const cleanup = setupRealtimeAlerts(
        organization.id,
        (newFb) => {
          setFeedbacks((prev) => [newFb, ...prev]);
        }
      );
      return cleanup;
    }
  }, [organization?.id]);


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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Barra Lateral Bento Light Fija en Escritorio (Estilo Admin) */}
      <PortalSidebar
        organization={organization}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingFeedbackCount={pendingFeedbackCount}
        onAddBranch={() => setShowNewBranchModal(true)}
        memberEmail={member?.user_email || undefined}
      />

      {/* Área Principal de Contenido Fluida */}
      <div className="flex-1 min-w-0 flex flex-col bg-slate-50 pb-20 md:pb-8">
        {/* Banner de Instalación PWA */}
        <PwaInstallBanner />

        {/* Encabezado Responsive (Solo en pantallas móviles/tablets) */}
        <div className="md:hidden">
          <PortalHeader
            organization={organization}
            restaurants={restaurants}
            selectedRestaurantId={selectedRestaurantId}
            onSelectRestaurant={setSelectedRestaurantId}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            pendingFeedbackCount={pendingFeedbackCount}
            onAddBranch={() => setShowNewBranchModal(true)}
          />
        </div>

        {/* Contenido Principal Bento Grid Fluido */}
        <main className="flex-1 w-full p-4 md:p-6 lg:p-8 animate-fadeIn max-w-7xl mx-auto">
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

          {activeTab === 'cuenta' && (
            <PortalAccountTab
              organization={organization}
              restaurants={restaurants}
              member={member}
              onRefreshOrg={refreshMembership}
              onRefreshRestaurants={loadData}
              onAddBranch={() => setShowNewBranchModal(true)}
            />
          )}
        </main>

        {/* Modal para solicitar / registrar nueva sucursal */}
        <NewBranchModal
          isOpen={showNewBranchModal}
          onClose={() => setShowNewBranchModal(false)}
          organization={organization}
          onSuccess={loadData}
        />

        {/* Barra de Navegación Inferior Fija (Solo en móviles) */}
        <div className="md:hidden">
          <PortalBottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            pendingFeedbackCount={pendingFeedbackCount}
          />
        </div>
      </div>
    </div>
  );
};
