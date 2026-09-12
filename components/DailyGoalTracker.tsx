'use client';

import React from 'react';
import { AppSettings, DailyGoalSettings } from '@/types';
import { Target, CheckCircle2, Zap, Trophy, Sparkles } from 'lucide-react';

interface DailyGoalTrackerProps {
  goalSettings: DailyGoalSettings;
  createdTodayCount: number;
  reviewedTodayCount: number;
  onUpdateGoalSettings: (newSettings: Partial<DailyGoalSettings>) => void;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  goalSettings,
  createdTodayCount,
  reviewedTodayCount,
  onUpdateGoalSettings,
}) => {
  const target = Math.max(1, goalSettings.target || 10);
  const mode = goalSettings.mode || 'combined';

  let currentVal = 0;
  let metricLabel = 'cards completed today';
  if (mode === 'created') {
    currentVal = createdTodayCount;
    metricLabel = 'cards created today';
  } else if (mode === 'reviewed') {
    currentVal = reviewedTodayCount;
    metricLabel = 'cards reviewed today';
  } else {
    currentVal = createdTodayCount + reviewedTodayCount;
    metricLabel = 'cards created or reviewed today';
  }

  const progressPercent = Math.min(100, Math.round((currentVal / target) * 100));
  const remaining = Math.max(0, target - currentVal);
  const isCompleted = currentVal >= target;

  const quickPresets = [5, 10, 15, 25];

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        isCompleted
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
          : 'bg-slate-900/90 border-slate-800 shadow-md'
      }`}
    >
      {/* Top Header & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Daily Learning Goal
              {isCompleted && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Reached!
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Track and reinforce your daily active recall consistency</p>
          </div>
        </div>

        {/* Controls: Mode & Target Stepper */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Track:</span>
            <select
              value={mode}
              onChange={(e) => onUpdateGoalSettings({ mode: e.target.value as DailyGoalSettings['mode'] })}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="combined" className="bg-slate-800 text-white">Combined (Created + Reviewed)</option>
              <option value="reviewed" className="bg-slate-800 text-white">Cards Reviewed</option>
              <option value="created" className="bg-slate-800 text-white">Cards Created</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Target:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={target}
              onChange={(e) => {
                const val = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1));
                onUpdateGoalSettings({ target: val });
              }}
              className="w-12 bg-transparent text-white font-bold text-center focus:outline-none border-b border-slate-600 focus:border-blue-400"
            />
            <span className="text-slate-400">cards</span>
          </div>
        </div>
      </div>

      {/* Progress & Numbers Grid */}
      <div className="mt-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{currentVal}</span>
            <span className="text-sm font-medium text-slate-400">/ {target} {metricLabel}</span>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {progressPercent}% Completed
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${currentVal === 0 ? 0 : Math.max(progressPercent, 4)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Breakdown Pills & Motivational Hints */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
              ✨ Created: <strong className="text-white">{createdTodayCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
              🧠 Reviewed: <strong className="text-white">{reviewedTodayCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
              ⏳ Remaining: <strong className={remaining === 0 ? 'text-emerald-400' : 'text-amber-400'}>{remaining}</strong>
            </span>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Presets:</span>
            {quickPresets.map((chipVal) => (
              <button
                key={chipVal}
                onClick={() => onUpdateGoalSettings({ target: chipVal })}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  target === chipVal
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                }`}
              >
                {chipVal}
              </button>
            ))}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          {isCompleted ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                🎉 <strong className="text-emerald-300 font-semibold">Daily goal unlocked!</strong> Active recall and spaced repetition habits are locked in for today.
              </span>
            </>
          ) : currentVal === 0 ? (
            <>
              <Target className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Create cards from daily logs or complete due reviews to hit your {target}-card target!</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Great progress! Just <strong className="text-amber-300 font-semibold">{remaining} more</strong> card{remaining > 1 ? 's' : ''} to complete today&apos;s goal.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
