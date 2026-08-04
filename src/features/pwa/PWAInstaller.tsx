import React, { useState, useEffect } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState<boolean>(false);
  const [showIosSheet, setShowIosSheet] = useState<boolean>(false);

  useEffect(() => {
    // Check dismissal cooldown (30 days)
    const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Android / Chrome beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari Detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIos && !isStandalone) {
      // Delay showing iOS instructions sheet slightly for good UX
      const timer = setTimeout(() => {
        setShowIosSheet(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowAndroidBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowAndroidBanner(false);
    setShowIosSheet(false);
    // Dismiss for 30 days
    const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_install_dismissed_until', String(thirtyDays));
  };

  return (
    <>
      {/* Android / Chrome Install Banner */}
      {showAndroidBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:max-w-sm z-50 p-3.5 bg-ink text-paper rounded-[28px] shadow-xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 border border-ink-2">
          <div className="flex items-center gap-3 pl-1">
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center font-bold text-white shrink-0">
              📲
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-paper leading-snug">Install KGP Bazaar</span>
              <span className="text-[11px] text-ink-3">Add to home screen</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="primary" size="sm" onClick={handleInstallAndroid} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 text-ink-3 hover:text-paper rounded-full"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Instruction Sheet */}
      <Sheet isOpen={showIosSheet} onClose={handleDismiss} title="Install KGP Bazaar on iPhone">
        <div className="flex flex-col gap-4 text-left py-2">
          <p className="text-xs text-ink-3">
            Install KGP Bazaar as a phone app for full screen browsing and fast offline access.
          </p>

          <div className="flex flex-col gap-3 text-xs bg-slate-50 p-3.5 border border-line rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white border border-line flex items-center justify-center shrink-0">
                <Share className="w-4 h-4 text-brand" />
              </div>
              <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white border border-line flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4 text-brand" />
              </div>
              <span>2. Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
            </div>
          </div>

          <Button variant="primary" className="w-full mt-2" onClick={handleDismiss}>
            Got it
          </Button>
        </div>
      </Sheet>
    </>
  );
};
