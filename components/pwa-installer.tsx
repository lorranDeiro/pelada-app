'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(detectIOS);

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Android/Desktop: usar beforeinstallprompt
    if (!detectIOS) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else {
      // iOS: mostrar instruções se não estiver instalado
      // Pequeno delay para não aparecer logo na primeira visita
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  // iOS: Mostrar instruções
  if (isIOS) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 border-2 border-blue-400 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-start gap-3">
          <Share2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-blue-900">Instalar Pelada App</p>
            <ol className="text-xs text-blue-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Toque o ícone <strong>Compartilhar</strong> (caixa com seta)</li>
              <li>Procure por <strong>"Add to Home Screen"</strong></li>
              <li>Toque e confirme</li>
            </ol>
            <p className="text-xs text-blue-700 mt-2 font-medium">✓ App para usar offline!</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Android/Desktop: Prompt automático
  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 border-2 border-green-400 shadow-lg">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Instalar Pelada App</p>
          <p className="text-xs text-gray-600">Acesse como um app nativo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Depois
          </Button>
          <Button
            size="sm"
            onClick={handleInstallAndroid}
            className="text-xs bg-green-600 hover:bg-green-700"
          >
            Instalar
          </Button>
        </div>
      </div>
    </Card>
  );
}
