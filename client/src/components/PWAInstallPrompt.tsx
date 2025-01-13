import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay to let user explore first
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual install instructions for iOS/other browsers
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = 'Para instalar no iOS:\n1. Toque no botão "Compartilhar" (□↑)\n2. Role para baixo e toque em "Adicionar à Tela Inicial"\n3. Toque em "Adicionar"';
    } else if (isAndroid) {
      instructions = 'Para instalar no Android:\n1. Toque no menu do navegador (⋮)\n2. Selecione "Adicionar à tela inicial" ou "Instalar app"\n3. Toque em "Adicionar"';
    } else {
      instructions = 'Para instalar no desktop:\n1. Clique no ícone de instalação na barra de endereços\n2. Ou vá no menu do navegador > "Instalar wPanel"';
    }
    
    alert(instructions);
  };

  const getBrowserInfo = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    return { isIOS, isAndroid, isMobile };
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  const { isIOS, isMobile } = getBrowserInfo();

  return (
    <div className="install-prompt">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-white/20 p-2 rounded-lg">
            <Smartphone className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Instalar wPanel
            </h3>
            <p className="text-xs opacity-90 leading-relaxed">
              {isMobile 
                ? 'Instale como um app para acesso rápido e melhor experiência.' 
                : 'Adicione à sua tela inicial para acesso rápido.'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstallClick}
          className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors flex-1"
        >
          <Download className="w-4 h-4" />
          {isIOS ? 'Ver instruções' : 'Instalar'}
        </button>
        
        <button
          onClick={handleDismiss}
          className="text-white/80 px-3 py-2 text-sm hover:text-white transition-colors"
        >
          Agora não
        </button>
      </div>
    </div>
  );
};