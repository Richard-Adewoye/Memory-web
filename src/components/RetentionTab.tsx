import React from 'react';
import { AppSettings, AppStats, Flashcard, UserProfile } from '../types';
import { getTodayDateString, addDays, formatDateHuman } from '../lib/sm2';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
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
} from 'lucide-react';

interface RetentionTabProps {
  cards: Flashcard[];
  stats: AppStats;
  settings: AppSettings;
  user: UserProfile | null;
  isSyncing: boolean;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetSeedData: () => void;
  onTestReminder: () => void;
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

  const totalCards = cards.length;
  const dueTodayCount = cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today).length;
  const masteredCount = cards.filter((c) => (c.repetition || 0) >= 4).length;
  const totalReviews = stats.totalReviewsCompleted || 0;

  const totalReferencedCards = cards.filter((c) => c.references && c.references.length > 0).length;
  const totalReferencesCount = cards.reduce((acc, c) => acc + (c.references?.length || 0), 0);

  // 7-day review forecast calculation
  const forecastDays = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(today, i);
    const count = cards.filter((c) => c.nextReviewDate === dateStr).length;
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateHuman(dateStr).split(',')[0];
    return { dateStr, label, count, dayIndex: i };
  });

  const maxForecast = Math.max(1, ...forecastDays.map((d) => d.count));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Firebase Cloud Sync Banner & Status */}
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
                  ? `Signed in as ${user.displayName || user.email}. Flashcards, knowledge citations, and daily logs are stored in Firestore.`
                  : 'Sign in with Google to persistently synchronize your flashcards and references across all your devices.'}
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

      {/* 7-Day Spaced Review Forecast */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              7-Day Spaced Repetition Workload Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Anticipate upcoming memory test loads based on SM-2 interval calculations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Algorithm: SuperMemo SM-2</span>
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
                <div className="w-full h-32 sm:h-40 bg-slate-950/80 rounded-2xl p-1.5 flex flex-col justify-end border border-slate-800/80">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ease-out flex items-center justify-center ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
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

      {/* Reminder Alerts & Preferences */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Spaced Repetition Reminders &amp; Alerts</h3>
            <p className="text-xs text-slate-400">Configure daily habit alerts to prevent forgetting curve decay</p>
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
                <div className="text-sm font-semibold text-white">Enable Daily Spaced Review Alerts</div>
                <div className="text-xs text-slate-400">Shows reminder banner and browser notifications when cards are due</div>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Preferred Daily Time:</label>
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
              onClick={onTestReminder}
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
            <p className="text-xs text-slate-400">Export your flashcards and references for spreadsheets or backup your entire study journal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CSV Export */}
          <button
            onClick={onExportCsv}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Flashcards &amp; Citations (CSV)</div>
            <div className="text-[11px] text-slate-400">Formatted for Excel &amp; Google Sheets</div>
          </button>

          {/* JSON Backup */}
          <button
            onClick={onExportJson}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileCode className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Full Backup (JSON)</div>
            <div className="text-[11px] text-slate-400">Full journal, stats &amp; references archive</div>
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
            <div className="font-bold text-xs text-white">Reset to Seed Data</div>
            <div className="text-[11px] text-slate-400">Restore learning psychology starter decks</div>
          </button>
        </div>
      </div>
    </div>
  );
};
