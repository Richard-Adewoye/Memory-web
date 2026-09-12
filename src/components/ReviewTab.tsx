import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard, SM2Result, KnowledgeTier, TierSettings } from '../types';
import { getTodayDateString, calculateSM2, getSM2Previews, getTier1Progress, DEFAULT_TIER_SETTINGS } from '../lib/sm2';
import { playSound } from '../lib/audio';
import { getRefTypeIcon, getRefTypeLabel } from './ReferenceManager';
import { TierBadge } from './TierBadge';
import {
  RotateCw,
  CheckCircle2,
  Zap,
  BookOpen,
  Bookmark,
  ExternalLink,
  Quote,
  Layers,
  Award,
  ArrowRight,
  Sliders,
  Calendar,
} from 'lucide-react';

interface ReviewTabProps {
  cards: Flashcard[];
  tierSettings?: TierSettings;
  soundEnabled: boolean;
  onCardReviewed: (cardId: string, result: SM2Result, quality: number) => void;
  onUpdateCardTier?: (cardId: string, tier: KnowledgeTier, customIntervalDays?: number) => void;
  onNavigateToNotebook: () => void;
  onNavigateToDailyLog: () => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  cards,
  tierSettings = DEFAULT_TIER_SETTINGS,
  soundEnabled,
  onCardReviewed,
  onUpdateCardTier,
  onNavigateToNotebook,
  onNavigateToDailyLog,
}) => {
  const today = getTodayDateString();

  // Cards that are due today or overdue
  const dueCards = useMemo(() => {
    return cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today);
  }, [cards, today]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState<number>(0);
  const [showGraduationModal, setShowGraduationModal] = useState<boolean>(false);
  const [selectedCustomDays, setSelectedCustomDays] = useState<number>(7);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= dueCards.length && dueCards.length > 0) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [dueCards.length, currentIndex]);

  const currentCard = dueCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    playSound('flip', soundEnabled);
  };

  const handleRate = (quality: number) => {
    if (!currentCard) return;

    playSound('rate', soundEnabled);
    const sm2Result = calculateSM2(currentCard, quality, tierSettings);
    onCardReviewed(currentCard.id, sm2Result, quality);

    setSessionCompletedCount((prev) => prev + 1);
    setIsFlipped(false);
  };

  const handleGraduate = (newTier: KnowledgeTier, customDays = 7) => {
    if (!currentCard || !onUpdateCardTier) return;
    playSound('complete', soundEnabled);
    onUpdateCardTier(currentCard.id, newTier, customDays);
    setShowGraduationModal(false);
  };

  // Keyboard shortcuts (Space = flip, 1-4 = rating)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard]);

  // If no cards are due
  if (!currentCard || dueCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              All Caught Up for Today!
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              No flashcards are currently due. Your knowledge tier spaced schedules (Tier 1 2-day, Tier 2 3-day, Tier 3 twice a week) are actively maintaining memory retention.
            </p>
          </div>

          {sessionCompletedCount > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              Reviewed {sessionCompletedCount} card{sessionCompletedCount === 1 ? '' : 's'} in this session
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateToDailyLog}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Write Daily Learning Log
            </button>
            <button
              onClick={onNavigateToNotebook}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Paste Notebook Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const previews = getSM2Previews(currentCard, tierSettings);
  const references = currentCard.references || [];
  const tier1Progress = currentCard.tier === 'tier1' ? getTier1Progress(currentCard, tierSettings.tier1MonthDays) : null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Session Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Spaced Review Session</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold">
            {currentIndex + 1} of {dueCards.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TierBadge
            tier={currentCard.tier || 'tier1'}
            card={currentCard}
            customIntervalDays={currentCard.customIntervalDays}
            showProgress={true}
            size="sm"
          />
          <span className="hidden sm:inline">Deck: <strong className="text-slate-200">{currentCard.deck || 'General'}</strong></span>
        </div>
      </div>

      {/* Tier 1 1-Month Milestone Reached Banner */}
      {currentCard.tier === 'tier1' && tier1Progress?.isMonthCompleted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-purple-950/70 to-blue-950/70 border border-amber-500/40 text-amber-200 text-xs shadow-lg space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Award className="w-5 h-5 text-amber-400" />
              <span>🎉 1-Month Foundation Phase Completed!</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              30 Days of 2-Day Recall Done
            </span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            This card has completed its 1-month 2-day recall schedule. You can now decide your ongoing reminder frequency for long-term memory maintenance:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleGraduate('tier2')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <span>Graduate to Tier 2 (Every 3 Days)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleGraduate('tier3')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <span>Graduate to Tier 3 (Twice a Week)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleGraduate('custom', 7)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Weekly Cadence (Every 7d)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Flashcard View */}
      <div
        onClick={handleFlip}
        className="relative min-h-[360px] sm:min-h-[400px] rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-10 flex flex-col justify-between shadow-2xl cursor-pointer hover:border-slate-600 transition group select-none overflow-hidden"
      >
        {/* Card Top Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {currentCard.deck || 'General Memory'}
            </span>
            <TierBadge
              tier={currentCard.tier || 'tier1'}
              card={currentCard}
              customIntervalDays={currentCard.customIntervalDays}
              size="sm"
            />
            {references.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                <span>{references.length} Ref</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-200 transition">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Click or Space to {isFlipped ? 'Show Front' : 'Reveal Answer'}</span>
          </div>
        </div>

        {/* Card Content (Front vs Back) */}
        <div className="my-auto py-6 text-center space-y-4">
          {!isFlipped ? (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Question / Recall Prompt</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed max-w-xl mx-auto">
                {currentCard.question}
              </h3>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Target Answer</div>
              <div className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed max-w-xl mx-auto whitespace-pre-wrap">
                {currentCard.answer}
              </div>

              {currentCard.notes && (
                <div className="pt-3 text-xs text-slate-400 italic max-w-md mx-auto border-t border-slate-800">
                  💡 {currentCard.notes}
                </div>
              )}

              {/* Display References / Citations */}
              {references.length > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="pt-4 mt-3 border-t border-slate-800 text-left max-w-xl mx-auto space-y-2 cursor-default"
                >
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    <span>Knowledge References &amp; Proof:</span>
                  </div>

                  <div className="space-y-1.5">
                    {references.map((ref) => (
                      <div
                        key={ref.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {getRefTypeIcon(ref.type)}
                            <span>{getRefTypeLabel(ref.type)}</span>
                          </span>
                          <span className="font-bold text-white">{ref.title}</span>
                          {ref.author && <span className="text-slate-400">({ref.author})</span>}
                          {ref.locator && (
                            <span className="text-blue-300 font-mono text-[11px]">[{ref.locator}]</span>
                          )}
                        </div>

                        {ref.quote && (
                          <div className="text-slate-300 italic text-[11px] flex items-center gap-1 pl-1">
                            <Quote className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>&ldquo;{ref.quote}&rdquo;</span>
                          </div>
                        )}

                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline pt-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Open Source Link</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Bottom Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-mono">Repetition: #{currentCard.repetition || 0}</span>
            {currentCard.tier === 'tier1' && tier1Progress && (
              <span className="text-amber-400/90 font-mono">
                • Tier 1: Day {Math.min(30, tier1Progress.daysElapsed)}/30 ({tier1Progress.cyclesCompleted} cycles)
              </span>
            )}
          </div>
          <span>Interval: {currentCard.interval || 0}d</span>
        </div>
      </div>

      {/* SM-2 Recall Rating Buttons */}
      {isFlipped ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="text-xs font-semibold text-slate-400 text-center">
            How well did you recall this item? (Keyboard: 1 - 4)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Rating 1: Again */}
            <button
              onClick={() => handleRate(1)}
              className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold transition flex flex-col items-center gap-1 group shadow-sm"
            >
              <span className="text-xs font-mono text-rose-400 group-hover:scale-110 transition">[1] Again</span>
              <span className="text-sm text-white">Reset (1d)</span>
              <span className="text-[11px] text-rose-300/80 font-normal">Next: {previews.again}</span>
            </button>

            {/* Rating 2: Hard */}
            <button
              onClick={() => handleRate(2)}
              className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition flex flex-col items-center gap-1 group shadow-sm"
            >
              <span className="text-xs font-mono text-amber-400 group-hover:scale-110 transition">[2] Hard</span>
              <span className="text-sm text-white">Difficult</span>
              <span className="text-[11px] text-amber-300/80 font-normal">Next: {previews.hard}</span>
            </button>

            {/* Rating 3: Good */}
            <button
              onClick={() => handleRate(3)}
              className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold transition flex flex-col items-center gap-1 group shadow-sm"
            >
              <span className="text-xs font-mono text-blue-400 group-hover:scale-110 transition">[3] Good</span>
              <span className="text-sm text-white">Tier Cadence</span>
              <span className="text-[11px] text-blue-300/80 font-normal">Next: {previews.good}</span>
            </button>

            {/* Rating 4: Easy */}
            <button
              onClick={() => handleRate(4)}
              className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold transition flex flex-col items-center gap-1 group shadow-sm"
            >
              <span className="text-xs font-mono text-emerald-400 group-hover:scale-110 transition">[4] Easy</span>
              <span className="text-sm text-white">Mastered</span>
              <span className="text-[11px] text-emerald-300/80 font-normal">Next: {previews.easy}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleFlip}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCw className="w-4 h-4" />
            Show Target Answer (Spacebar)
          </button>
        </div>
      )}
    </div>
  );
};
