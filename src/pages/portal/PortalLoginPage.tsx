import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Store, Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const PortalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Credenciales incorrectas');
        setLoading(false);
        return;
      }
    } else {
      // Modo Demo
      localStorage.setItem('nfc_portal_demo_auth', 'true');
    }

    setLoading(false);
    navigate('/portal');
  };

  const handleDemoLogin = () => {
    localStorage.setItem('nfc_portal_demo_auth', 'true');
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Store className="w-7 h-7" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white text-center tracking-tight">
            Portal del Negocio
          </h1>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6">
            Buzón de quejas, enlaces y reputación de tus mesas
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerente@mirestaurante.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Entrando...' : 'Ingresar a mi Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Acceso demo rápido */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center space-y-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Probar como <span className="text-blue-400 font-semibold underline">Carlos Mendoza (Demo)</span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-[11px] text-slate-500 hover:text-slate-400 inline-flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                <span>¿Eres Superadministrador? Entrar a /admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
