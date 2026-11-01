import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export const AdminAuthGuard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      // 1. Si el usuario activó Modo Demo, dar acceso inmediato sin requerir Supabase session
      const demoAuth = localStorage.getItem('nfc_demo_auth');
      if (demoAuth === 'true') {
        setIsAuthenticated(true);
        return;
      }

      // 2. Si no es Demo y Supabase está configurado, verificar sesión real
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(Boolean(session));
        return;
      }

      setIsAuthenticated(false);
    }

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

