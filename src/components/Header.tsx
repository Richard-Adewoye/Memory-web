import React from 'react';
import { AppSettings, AppStats } from '../types';
import { Sparkles, Sun, Moon, Volume2, VolumeX, Flame, BookOpen } from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  stats: AppStats;
  dueTodayCount: number;
  totalCardsCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  stats,
  dueTodayCount,
  totalCardsCount,
  activeTab,
  onTabChange,
  onToggleSound,
  onToggleTheme,
}) => {
  return (
    <header className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('tab-review')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Spaced Repetition <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">SM-2 Journal</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Memory Retention & Daily Learning Hub</p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold"
              title="Daily Active Streak"
            >
              <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
              <span>{stats.streak} day{stats.streak === 1 ? '' : 's'}</span>
            </div>

            {/* Queue Badge */}
            <button
              onClick={() => onTabChange('tab-review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                dueTodayCount > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title="Cards ready for review today"
            >
              <BookOpen className="w-4 h-4" />
              <span>{dueTodayCount} Due</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title={settings.soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
              aria-label="Toggle Sound"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {settings.theme === 'light' ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 py-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'tab-review', label: '🧠 Spaced Review', count: dueTodayCount },
            { id: 'tab-daily', label: '📝 Daily Learning Log' },
            { id: 'tab-notebook', label: '📋 Paste from Notebook' },
            { id: 'tab-cards', label: `📚 Flashcards (${totalCardsCount})` },
            { id: 'tab-reminders', label: '📊 Retention & Settings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
