import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { api } from '../../lib/api';
import { Loader2 } from 'lucide-react';
import type { Organization, OrganizationMember } from '../../types';

export interface PortalContextType {
  organization: Organization;
  member: OrganizationMember;
  refreshMembership: () => Promise<void>;
}

export const PortalAuthGuard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [membershipData, setMembershipData] = useState<{
    organization: Organization;
    member: OrganizationMember;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const checkAuth = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const data = await api.getMyMembership();
        if (data) {
          setMembershipData(data);
          setIsAuthenticated(true);
        } else {
          // Usuario autenticado pero sin organización asignada
          setIsAuthenticated(false);
        }
      } else {
        // Modo Demo
        const demoAuth = localStorage.getItem('nfc_portal_demo_auth');
        if (demoAuth === 'true') {
          const data = await api.getMyMembership();
          setMembershipData(data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (e) {
      console.error('Error comprobando sesión del portal:', e);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs text-slate-400">Accediendo a tu local...</p>
      </div>
    );
  }

  if (!isAuthenticated || !membershipData) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return (
    <Outlet
      context={{
        organization: membershipData.organization,
        member: membershipData.member,
        refreshMembership: checkAuth,
      }}
    />
  );
};

