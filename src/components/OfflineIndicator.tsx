import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, HardDrive } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-slate-950 font-semibold px-4 py-2 text-xs shadow-2xl border border-amber-300 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="p-1 rounded-lg bg-amber-600/30">
        <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold leading-tight">Offline Mode Active</span>
        <span className="text-[11px] font-medium text-slate-900 flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          Full offline caching &amp; local SM-2 reviews enabled
        </span>
      </div>
    </div>
  );
};
