import React, { useState, useMemo } from 'react';
import { AppSettings, AppStats, Flashcard, UserProfile, KnowledgeTier, TierSettings } from '../types';
import { getTodayDateString, addDays, formatDateHuman, getTier1Progress, DEFAULT_TIER_SETTINGS } from '../lib/sm2';
import { TierBadge, getTierMeta } from './TierBadge';
import { PWAInstallButton } from './PWAInstallButton';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Bell,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Cloud,
  LogIn,
  LogOut,
  Bookmark,
  ShieldCheck,
  Zap,
  Sprout,
  Star,
  Sliders,
  Calendar,
  Layers,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

interface RetentionTabProps {
  cards: Flashcard[];
  stats: AppStats;
  settings: AppSettings;
  user: UserProfile | null;
  isSyncing: boolean;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onUpdateCardTier?: (cardId: string, tier: KnowledgeTier, customIntervalDays?: number) => void;
  onBatchGraduateTier1?: (targetTier: KnowledgeTier, customDays?: number) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetSeedData: () => void;
  onTestReminder: (tier?: KnowledgeTier) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onManualCloudSync: () => void;
}

export const RetentionTab: React.FC<RetentionTabProps> = ({
  cards,
  stats,
  settings,
  user,
  isSyncing,
  onUpdateSettings,
  onUpdateCardTier,
  onBatchGraduateTier1,
  onExportCsv,
  onExportJson,
  onImportJson,
  onResetSeedData,
  onTestReminder,
  onSignIn,
  onSignOut,
  onManualCloudSync,
}) => {
  const today = getTodayDateString();
  const tierSettings: TierSettings = settings.tierSettings || DEFAULT_TIER_SETTINGS;

  const totalCards = cards.length;
  const masteredCount = cards.filter((c) => (c.repetition || 0) >= 4).length;
  const totalReviews = stats.totalReviewsCompleted || 0;

  const totalReferencedCards = cards.filter((c) => c.references && c.references.length > 0).length;
  const totalReferencesCount = cards.reduce((acc, c) => acc + (c.references?.length || 0), 0);

  // Knowledge Tier Counts & Stats
  const tierStats = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    let custom = 0;
    let t1GradReady = 0;

    cards.forEach((c) => {
      const t = c.tier || 'tier1';
      if (t === 'tier1') {
        t1 += 1;
        if (getTier1Progress(c, tierSettings.tier1MonthDays).isMonthCompleted) {
          t1GradReady += 1;
        }
      } else if (t === 'tier2') t2 += 1;
      else if (t === 'tier3') t3 += 1;
      else if (t === 'custom') custom += 1;
    });

    return { t1, t2, t3, custom, t1GradReady };
  }, [cards, tierSettings]);

  // 7-day review forecast calculation
  const forecastDays = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(today, i);
    const dayCards = cards.filter((c) => c.nextReviewDate === dateStr);
    const count = dayCards.length;
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateHuman(dateStr).split(',')[0];

    const t1Count = dayCards.filter((c) => (c.tier || 'tier1') === 'tier1').length;
    const t2Count = dayCards.filter((c) => c.tier === 'tier2').length;
    const t3Count = dayCards.filter((c) => c.tier === 'tier3').length;
    const customCount = dayCards.filter((c) => c.tier === 'custom').length;

    return { dateStr, label, count, dayIndex: i, t1Count, t2Count, t3Count, customCount };
  });

  const maxForecast = Math.max(1, ...forecastDays.map((d) => d.count));

  const handleTierSettingChange = (field: keyof TierSettings, val: unknown) => {
    const updated = {
      ...tierSettings,
      [field]: val,
    };
    onUpdateSettings({ tierSettings: updated });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Firebase Cloud Sync Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-500/30 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Firebase Firestore Cloud Synchronization
                {user && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Cloud Synced
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                {user
                  ? `Signed in as ${user.displayName || user.email}. Spaced schedules, tiers, and citations are securely stored in Firestore.`
                  : 'Sign in with Google to persistently synchronize your flashcards and knowledge tiers across all your devices.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onManualCloudSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={onSignOut}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Retention Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Library</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{totalCards}</div>
          <div className="text-xs text-slate-400">Spaced memory flashcards</div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Citations</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
            {totalReferencesCount}
          </div>
          <div className="text-xs text-slate-400">Across {totalReferencedCards} cards &amp; notes</div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mastered Cards</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">{masteredCount}</div>
          <div className="text-xs text-slate-400">Repetition level 4+ (Long-term)</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Lifetime Reviews</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 tracking-tight">{totalReviews}</div>
          <div className="text-xs text-slate-400">SM-2 test completions</div>
        </div>
      </div>

      {/* CORE FEATURE: Knowledge Tier Spaced Reminder Scheduling & Cadence Engine */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Knowledge Tier Spaced Reminder Engine</h3>
              <p className="text-xs text-slate-400">
                Automated multi-tier recall intervals: Tier 1 (every 2d for 1 month), Tier 2 (every 3d), Tier 3 (twice a week), and custom ongoing frequencies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTestReminder()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-purple-400" />
              <span>Test Tier Alert</span>
            </button>
          </div>
        </div>

        {/* 4 Tier Cards Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tier 1 Card */}
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">Tier 1</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                  {tierStats.t1} cards
                </span>
              </div>

              <div className="text-xs font-semibold text-amber-300">
                Every 2 Days • 1 Month (30d)
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                High-frequency active recall every 2-day interval for 30 days to build rapid foundation neural pathways.
              </p>
            </div>

            <div className="pt-2 border-t border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Interval setting:</span>
                <span className="font-bold text-white font-mono">2 days</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Duration:</span>
                <span className="font-bold text-white font-mono">30 days (1 mo)</span>
              </div>
              {tierStats.t1GradReady > 0 && (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center justify-between">
                  <span>{tierStats.t1GradReady} cards completed 1 month!</span>
                  <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Tier 2 Card */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">Tier 2</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                  {tierStats.t2} cards
                </span>
              </div>

              <div className="text-xs font-semibold text-emerald-300">
                Every 3-Day Interval
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Intermediate steady spaced testing every 3 days for sustained synaptic consolidation.
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Interval setting:</span>
                <span className="font-bold text-white font-mono">3 days</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Cadence:</span>
                <span className="font-bold text-white font-mono">Ongoing</span>
              </div>
            </div>
          </div>

          {/* Tier 3 Card */}
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">Tier 3</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[11px] font-bold">
                  {tierStats.t3} cards
                </span>
              </div>

              <div className="text-xs font-semibold text-purple-300">
                Twice a Week Cadence
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Long-term recall maintenance scheduled twice weekly (alternating 3 and 4 days) to prevent forgetting.
              </p>
            </div>

            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Frequency:</span>
                <span className="font-bold text-white font-mono">Twice / week (3–4d)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Cadence:</span>
                <span className="font-bold text-white font-mono">Ongoing</span>
              </div>
            </div>
          </div>

          {/* Custom Tier ("From Then On") */}
          <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-white text-sm">Custom Cadence</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold">
                  {tierStats.custom} cards
                </span>
              </div>

              <div className="text-xs font-semibold text-blue-300">
                User-Decided Reminders
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Freely choose reminder intervals (Weekly, Bi-weekly, Monthly, or N days) from then on.
              </p>
            </div>

            <div className="pt-2 border-t border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Default custom interval:</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={tierSettings.defaultCustomDays || 7}
                  onChange={(e) => handleTierSettingChange('defaultCustomDays', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white text-center font-bold"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Post-1-month default:</span>
                <select
                  value={tierSettings.defaultPostMonthFrequency || 'tier2'}
                  onChange={(e) => handleTierSettingChange('defaultPostMonthFrequency', e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white"
                >
                  <option value="tier2">Tier 2 (3d)</option>
                  <option value="tier3">Tier 3 (2x/wk)</option>
                  <option value="weekly">Weekly (7d)</option>
                  <option value="monthly">Monthly (30d)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Graduate Tier 1 Cards if any have completed 1 month */}
        {tierStats.t1GradReady > 0 && onBatchGraduateTier1 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-emerald-950/60 to-blue-950/60 border border-amber-500/40 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{tierStats.t1GradReady} cards have reached their 1-Month Foundation Milestone!</span>
              </div>
              <span className="text-amber-300 font-mono text-[11px] font-semibold">Tier 1 Graduation Ready</span>
            </div>
            <p className="text-slate-300">
              Batch update these graduated items to an ongoing spaced interval of your choice:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onBatchGraduateTier1('tier2')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <span>Graduate All to Tier 2 (Every 3 Days)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBatchGraduateTier1('tier3')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <span>Graduate All to Tier 3 (Twice a Week)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBatchGraduateTier1('custom', 7)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Graduate All to Weekly (Every 7 Days)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7-Day Spaced Review Forecast with Tier Breakdown */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              7-Day Spaced Repetition Workload &amp; Tier Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Anticipate upcoming memory test loads scheduled across Tier 1, Tier 2, Tier 3, and Custom intervals
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>T1 (2d)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>T2 (3d)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>T3 (2x/wk)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Custom</span>
          </div>
        </div>

        {/* Forecast Bars Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4">
          {forecastDays.map((day) => {
            const heightPercent = Math.max(12, Math.round((day.count / maxForecast) * 100));
            const isToday = day.dayIndex === 0;

            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">{day.count}</span>

                {/* Vertical Bar Container */}
                <div className="w-full h-32 sm:h-40 bg-slate-950/80 rounded-2xl p-1.5 flex flex-col justify-end border border-slate-800/80 overflow-hidden">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ease-out flex flex-col justify-end overflow-hidden ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Tier Mini Striping within bar */}
                    {day.count > 0 && (
                      <div className="w-full flex flex-col text-[8px] text-center font-bold text-white py-0.5">
                        {day.t1Count > 0 && <span className="bg-amber-500/60 py-0.2">{day.t1Count} T1</span>}
                        {day.t2Count > 0 && <span className="bg-emerald-500/60 py-0.2">{day.t2Count} T2</span>}
                        {day.t3Count > 0 && <span className="bg-purple-500/60 py-0.2">{day.t3Count} T3</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className={`text-xs font-semibold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                    {day.label}
                  </div>
                  <div className="text-[10px] text-slate-500 hidden sm:block font-mono">
                    {day.dateStr.slice(5)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PWA App Installation Card */}
      <PWAInstallButton variant="card" />

      {/* Reminder Alerts & Preferences */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Spaced Repetition Reminders &amp; Daily Alerts</h3>
            <p className="text-xs text-slate-400">Configure daily habit alerts to prevent forgetting curve decay across all knowledge tiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <div>
                <div className="text-sm font-semibold text-white">Enable Spaced Recall Alerts &amp; Browser Notifications</div>
                <div className="text-xs text-slate-400">Notifies you when Tier 1 (2d), Tier 2 (3d), Tier 3 (twice a week), or Custom cards are due</div>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Preferred Daily Notification Time:</label>
              <input
                type="time"
                value={settings.dailyReminderTime || '19:00'}
                onChange={(e) => onUpdateSettings({ dailyReminderTime: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:items-end">
            <button
              onClick={() => onTestReminder()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-purple-400" />
              Trigger Test Reminder Alert
            </button>
            <span className="text-[11px] text-slate-500">
              Notification cues respect your browser permission settings
            </span>
          </div>
        </div>
      </div>

      {/* Data Portability & Backup */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Portability, Backup &amp; Reset</h3>
            <p className="text-xs text-slate-400">Export your flashcards, knowledge tier schedules, citations, and daily logs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CSV Export */}
          <button
            onClick={onExportCsv}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Flashcards &amp; Tiers (CSV)</div>
            <div className="text-[11px] text-slate-400">Includes tier intervals &amp; citations</div>
          </button>

          {/* JSON Backup */}
          <button
            onClick={onExportJson}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileCode className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Full Backup (JSON)</div>
            <div className="text-[11px] text-slate-400">Full journal, tiers &amp; references archive</div>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group cursor-pointer shadow-sm">
            <Upload className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Import Backup (JSON)</div>
            <div className="text-[11px] text-slate-400">Restore from a previous backup file</div>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Reset Seed Data */}
          <button
            onClick={onResetSeedData}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700/60 text-left space-y-2 transition group shadow-sm"
          >
            <RefreshCw className="w-5 h-5 text-rose-400 group-hover:rotate-180 transition-transform" />
            <div className="font-bold text-xs text-white">Reset to Starter Tiers</div>
            <div className="text-[11px] text-slate-400">Restore default Tier 1, 2, 3 starter decks</div>
          </button>
        </div>
      </div>
    </div>
  );
};
