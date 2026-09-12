import React from 'react';
import { KnowledgeTier, Flashcard } from '../types';
import { getTier1Progress } from '../lib/sm2';
import { Zap, Sprout, Star, Sliders, CheckCircle2, Clock } from 'lucide-react';

interface TierBadgeProps {
  tier?: KnowledgeTier | string;
  card?: Flashcard;
  customIntervalDays?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const getTierMeta = (tier?: KnowledgeTier | string, customDays = 7) => {
  switch (tier) {
    case 'tier1':
      return {
        label: 'Tier 1',
        subtitle: '2-Day Interval (1 Mo)',
        cadence: 'Every 2 days',
        duration: '1 Month (30d)',
        icon: Zap,
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        accentColor: 'from-amber-500 to-orange-500',
        description: 'High-frequency foundation reinforcement every 2 days for 1 month.',
      };
    case 'tier2':
      return {
        label: 'Tier 2',
        subtitle: '3-Day Interval',
        cadence: 'Every 3 days',
        duration: 'Ongoing',
        icon: Sprout,
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        accentColor: 'from-emerald-500 to-teal-500',
        description: 'Intermediate reinforcement every 3-day interval.',
      };
    case 'tier3':
      return {
        label: 'Tier 3',
        subtitle: 'Twice a Week',
        cadence: 'Twice a week (3–4d)',
        duration: 'Ongoing',
        icon: Star,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        accentColor: 'from-purple-500 to-indigo-500',
        description: 'Long-term mastery reinforcement scheduled twice weekly.',
      };
    case 'custom':
      return {
        label: 'Custom',
        subtitle: `Every ${customDays}d`,
        cadence: `Every ${customDays} day${customDays === 1 ? '' : 's'}`,
        duration: 'User-defined',
        icon: Sliders,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        accentColor: 'from-blue-500 to-cyan-500',
        description: `Custom reminder frequency set to every ${customDays} days.`,
      };
    default:
      return {
        label: 'Tier 1',
        subtitle: '2-Day Interval (1 Mo)',
        cadence: 'Every 2 days',
        duration: '1 Month',
        icon: Zap,
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        accentColor: 'from-amber-500 to-orange-500',
        description: 'High-frequency foundation reinforcement every 2 days for 1 month.',
      };
  }
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier = 'tier1',
  card,
  customIntervalDays = 7,
  showProgress = false,
  size = 'sm',
  onClick,
}) => {
  const meta = getTierMeta(tier, customIntervalDays);
  const Icon = meta.icon;

  const tier1Progress = card && tier === 'tier1' ? getTier1Progress(card) : null;

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`inline-flex items-center gap-1.5 rounded-lg border transition font-semibold ${meta.bgColor} ${meta.textColor} ${meta.borderColor} ${
          onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        } ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[11px]'
            : size === 'md'
            ? 'px-2.5 py-1 text-xs'
            : 'px-3 py-1.5 text-sm'
        }`}
        title={meta.description}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{meta.label}</span>
        {size !== 'sm' && <span className="opacity-70 text-[10px]">({meta.subtitle})</span>}
      </button>

      {showProgress && tier1Progress && (
        <div className="space-y-1 w-full max-w-[130px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Day {tier1Progress.daysElapsed}/30
            </span>
            <span>{tier1Progress.percent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                tier1Progress.isMonthCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${tier1Progress.percent}%` }}
            />
          </div>
          {tier1Progress.isMonthCompleted && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Foundation complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
