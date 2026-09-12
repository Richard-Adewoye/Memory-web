import React from 'react';
import { KnowledgeTier } from '../types';
import { Zap, Sprout, Star, Sliders, Calendar } from 'lucide-react';

interface TierSelectorProps {
  selectedTier: KnowledgeTier;
  customIntervalDays: number;
  onSelectTier: (tier: KnowledgeTier) => void;
  onChangeCustomDays: (days: number) => void;
}

export const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  customIntervalDays,
  onSelectTier,
  onChangeCustomDays,
}) => {
  const tiers: {
    id: KnowledgeTier;
    title: string;
    intervalText: string;
    durationText: string;
    description: string;
    icon: React.ElementType;
    activeBorder: string;
    activeBg: string;
    badgeColor: string;
  }[] = [
    {
      id: 'tier1',
      title: 'Tier 1',
      intervalText: 'Every 2 Days',
      durationText: 'For 1 Month',
      description: 'High-frequency foundation reinforcement every 2 days for 30 days before customizing.',
      icon: Zap,
      activeBorder: 'border-amber-500',
      activeBg: 'bg-amber-500/10',
      badgeColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    },
    {
      id: 'tier2',
      title: 'Tier 2',
      intervalText: 'Every 3 Days',
      durationText: 'Steady Pace',
      description: 'Intermediate recall intervals scheduled every 3 days for steady memory reinforcement.',
      icon: Sprout,
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-500/10',
      badgeColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    },
    {
      id: 'tier3',
      title: 'Tier 3',
      intervalText: 'Twice a Week',
      durationText: '3–4 Day Cadence',
      description: 'Long-term maintenance scheduled twice weekly (alternating 3 & 4 days) to prevent forgetting.',
      icon: Star,
      activeBorder: 'border-purple-500',
      activeBg: 'bg-purple-500/10',
      badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    },
    {
      id: 'custom',
      title: 'Custom',
      intervalText: `Every ${customIntervalDays} Days`,
      durationText: 'User Decided',
      description: 'Define your own exact spaced recall interval and reminder frequency from now on.',
      icon: Sliders,
      activeBorder: 'border-blue-500',
      activeBg: 'bg-blue-500/10',
      badgeColor: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Knowledge Tier &amp; Reminder Cadence</span>
        </label>
        <span className="text-[11px] text-slate-400">Determines spaced repetition intervals</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tiers.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTier === t.id;

          return (
            <div
              key={t.id}
              onClick={() => onSelectTier(t.id)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? `${t.activeBorder} ${t.activeBg} shadow-md`
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      isSelected ? t.badgeColor : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white">{t.title}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                    isSelected ? t.badgeColor : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {t.intervalText}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 leading-snug">{t.description}</div>
                <div className="text-[10px] font-mono text-slate-500 font-semibold">
                  Cadence: {t.durationText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Frequency Sub-Controls when Custom Tier is selected */}
      {selectedTier === 'custom' && (
        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold text-blue-200">
              Customize Reminder Frequency &quot;From Then On&quot;:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Weekly (7d)', days: 7 },
                { label: 'Bi-Weekly (14d)', days: 14 },
                { label: 'Monthly (30d)', days: 30 },
                { label: 'Quarterly (90d)', days: 90 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => onChangeCustomDays(preset.days)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    customIntervalDays === preset.days
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300">Repeat recall test every:</label>
            <input
              type="number"
              min={1}
              max={365}
              value={customIntervalDays}
              onChange={(e) => onChangeCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">day(s)</span>
          </div>
        </div>
      )}
    </div>
  );
};
