import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    // Check if user is on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

    // Check if user has dismissed the prompt before
    const hasSeenPrompt = localStorage.getItem('installPromptDismissed');

    if (isIOS && isSafari && !isStandalone && !hasSeenPrompt) {
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-primary-bg text-primary-fg p-4 rounded-2xl shadow-xl z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="bg-white/20 p-2 rounded-lg">
          <Share className="size-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Easy CSP</h3>
          <p className="text-sm opacity-90 mb-2">
            Add to your home screen for a better experience without Safari's toolbar
          </p>
          <ol className="text-xs opacity-80 space-y-1">
            <li>1. Tap the Share button <Share className="inline size-3" /> in Safari</li>
            <li>2. Scroll down and tap "Add to Home Screen"</li>
            <li>3. Tap "Add" to confirm</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
