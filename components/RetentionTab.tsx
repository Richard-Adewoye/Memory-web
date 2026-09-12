'use client';

import React, { useState } from 'react';
import { AppSettings, AppStats, Flashcard } from '@/types';
import { getTodayDateString, addDays, formatDateHuman } from '@/lib/sm2';
import { playSound } from '@/lib/audio';
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
  ShieldAlert,
} from 'lucide-react';

interface RetentionTabProps {
  cards: Flashcard[];
  stats: AppStats;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetSeedData: () => void;
  onTestReminder: () => void;
}

export const RetentionTab: React.FC<RetentionTabProps> = ({
  cards,
  stats,
  settings,
  onUpdateSettings,
  onExportCsv,
  onExportJson,
  onImportJson,
  onResetSeedData,
  onTestReminder,
}) => {
  const today = getTodayDateString();

  const totalCards = cards.length;
  const dueTodayCount = cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today).length;
  const masteredCount = cards.filter((c) => (c.repetition || 0) >= 4).length;
  const totalReviews = stats.totalReviewsCompleted || 0;

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
            <span className="text-xs font-semibold uppercase tracking-wider">Due for Review</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">{dueTodayCount}</div>
          <div className="text-xs text-slate-400">Cards ready for active recall</div>
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
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">{totalReviews}</div>
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
            <h3 className="text-base font-bold text-white">Spaced Repetition Reminders & Alerts</h3>
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
            <h3 className="text-base font-bold text-white">Data Portability, Backup & Reset</h3>
            <p className="text-xs text-slate-400">Export your flashcards for spreadsheets or backup your entire study journal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CSV Export */}
          <button
            onClick={onExportCsv}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Flashcards (CSV)</div>
            <div className="text-[11px] text-slate-400">Download formatted for Excel & Google Sheets</div>
          </button>

          {/* JSON Backup */}
          <button
            onClick={onExportJson}
            className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left space-y-2 transition group shadow-sm"
          >
            <FileCode className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Export Backup (JSON)</div>
            <div className="text-[11px] text-slate-400">Full journal, stats & review history archive</div>
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
