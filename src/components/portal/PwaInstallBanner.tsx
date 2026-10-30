import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Si ya lo descartó en esta sesión, no molestar
    if (sessionStorage.getItem('pwa_prompt_dismissed') === 'true') {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 px-4 shadow-md flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Instalar App en tu Celular</p>
          <p className="text-[10px] text-blue-100 truncate">Accede al instante desde tu pantalla de inicio</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-lg bg-white text-blue-700 text-xs font-bold shadow-sm hover:bg-blue-50 active:scale-95 transition-all"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

