import React, { useState } from 'react';
import { AppSettings, AppStats, UserProfile } from '../types';
import {
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Flame,
  BookOpen,
  LogIn,
  LogOut,
  Cloud,
  CloudCheck,
  User as UserIcon,
  Bookmark,
} from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  stats: AppStats;
  dueTodayCount: number;
  totalCardsCount: number;
  user: UserProfile | null;
  isSyncing: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  stats,
  dueTodayCount,
  totalCardsCount,
  user,
  isSyncing,
  activeTab,
  onTabChange,
  onToggleSound,
  onToggleTheme,
  onSignIn,
  onSignOut,
}) => {
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

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
                Spaced Repetition <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">SM-2 &amp; Firestore</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Memory Retention &amp; Knowledge References Journal</p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* Firebase Google Auth Profile / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-xs text-slate-200"
                  title={`Signed in as ${user.displayName || user.email}`}
                >
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden md:inline font-mono">Synced</span>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover border border-slate-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 z-50">
                    <div className="pb-2 border-b border-slate-800">
                      <div className="font-bold text-xs text-white truncate">{user.displayName || 'Learner'}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Firestore Cloud Sync Active</span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 text-xs text-rose-300 font-semibold transition flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                title="Sign in with Google to enable Firestore cloud sync across devices"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 py-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'tab-review', label: '🧠 Spaced Review', count: dueTodayCount },
            { id: 'tab-daily', label: '📝 Daily Learning & Citations' },
            { id: 'tab-notebook', label: '📋 Paste from Notebook' },
            { id: 'tab-cards', label: `📚 Flashcards (${totalCardsCount})` },
            { id: 'tab-reminders', label: '📊 Retention & Cloud Sync' },
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
