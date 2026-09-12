import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'badge' | 'card' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already installed as a standalone PWA, render a subtle installed badge or nothing
  if (isInstalled) {
    if (variant === 'settings' || variant === 'card') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>PWA App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      try {
        setIsInstalling(true);
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers where prompt hasn't fired yet or desktop manual instructions
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          id="pwa-install-header-btn"
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95 ${className}`}
          title="Install Spaced Repetition Journal as a standalone Progressive Web App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'card' && (
        <div
          id="pwa-install-card"
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Install Spaced Repetition App</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </h4>
                <p className="text-[11px] text-slate-400">
                  Instant offline access, full-screen study mode, and home screen launch
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? 'iOS Guide' : 'Install PWA'}</span>
            </button>
          </div>
        </div>
      )}

      {variant === 'settings' && (
        <button
          id="pwa-install-settings-btn"
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition ${className}`}
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>{isIOS ? 'Install on iPhone / iPad' : 'Install PWA on Device'}</span>
        </button>
      )}

      {/* iOS & Browser Installation Modal Guide */}
      {showIOSGuide && (
        <div
          id="pwa-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install Application'}
                  </h3>
                  <p className="text-xs text-slate-400">Add to Home Screen for Offline Spaced Repetition</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 text-xs text-slate-300">
                <p className="text-slate-400">
                  Apple iOS Safari does not allow automatic install prompts. Follow these 2 simple steps:
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Step 1: Tap Share Button</span>
                    <p className="text-[11px] text-slate-400">
                      Tap the <strong>Share</strong> icon in your Safari bottom navigation bar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">Step 2: Add to Home Screen</span>
                    <p className="text-[11px] text-slate-400">
                      Scroll down the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <p className="text-slate-400">
                  To install this Progressive Web App on your browser or device:
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Desktop Chrome / Edge / Brave:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Look for the <strong>Install</strong> icon in the right side of your browser URL address bar, or open your browser menu and select <strong>Install App</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
