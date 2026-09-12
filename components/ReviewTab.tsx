'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard, SM2Result } from '@/types';
import { calculateSM2, getSM2Previews, getTodayDateString } from '@/lib/sm2';
import { playSound } from '@/lib/audio';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

interface ReviewTabProps {
  cards: Flashcard[];
  soundEnabled: boolean;
  onCardReviewed: (cardId: string, updatedMetrics: SM2Result, quality: number) => void;
  onNavigateToNotebook: () => void;
  onNavigateToDailyLog: () => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  cards,
  soundEnabled,
  onCardReviewed,
  onNavigateToNotebook,
  onNavigateToDailyLog,
}) => {
  const today = getTodayDateString();

  // Due queue
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isReviewEarlyMode, setIsReviewEarlyMode] = useState<boolean>(false);

  // Initialize or update queue
  useEffect(() => {
    if (!isReviewEarlyMode) {
      const due = cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today);
      setReviewQueue(due);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [cards, today, isReviewEarlyMode]);

  const handleStartReviewEarly = () => {
    setIsReviewEarlyMode(true);
    setReviewQueue([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleFlipCard = useCallback(() => {
    setIsFlipped((prev) => {
      playSound('flip', soundEnabled);
      return !prev;
    });
  }, [soundEnabled]);

  const handleRate = useCallback(
    (quality: number) => {
      const currentCard = reviewQueue[currentIndex];
      if (!currentCard) return;

      const updatedMetrics = calculateSM2(currentCard, quality);
      playSound('rate', soundEnabled);
      onCardReviewed(currentCard.id, updatedMetrics, quality);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= reviewQueue.length) {
        playSound('complete', soundEnabled);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }

      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    },
    [currentIndex, reviewQueue, soundEnabled, onCardReviewed]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlipCard();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlipCard, handleRate]);

  const totalInSession = reviewQueue.length;
  const isSessionComplete = currentIndex >= totalInSession || totalInSession === 0;
  const currentCard = !isSessionComplete ? reviewQueue[currentIndex] : null;
  const sm2Previews = currentCard ? getSM2Previews(currentCard) : null;

  // Session Completed or All Caught Up View
  if (isSessionComplete) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isReviewEarlyMode ? 'Review Early Session Completed!' : 'You Are All Caught Up!'}
            </h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base">
              {cards.length === 0
                ? 'Your library is empty. Start by logging a daily entry or pasting your study notebook to build flashcards.'
                : 'No cards are due right now. The SM-2 spaced repetition engine will schedule your next reviews at optimal intervals.'}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {cards.length > 0 && !isReviewEarlyMode && (
              <button
                onClick={handleStartReviewEarly}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition flex items-center gap-2 shadow-sm"
              >
                <Clock className="w-4 h-4 text-blue-400" />
                Review Early ({cards.length} Total Cards)
              </button>
            )}

            <button
              onClick={onNavigateToDailyLog}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md shadow-blue-600/30"
            >
              <BookOpen className="w-4 h-4" />
              Write Daily Learning Log
            </button>

            <button
              onClick={onNavigateToNotebook}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Import from Notebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Card {currentIndex + 1} of {totalInSession}
          </span>
          {isReviewEarlyMode && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Review Early Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline">Shortcuts:</span>
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">Space</kbd> Flip
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">1-4</kbd> Rate
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalInSession) * 100}%` }}
        />
      </div>

      {/* Flashcard 3D Perspective Card */}
      <div
        onClick={handleFlipCard}
        className="w-full min-h-[360px] sm:min-h-[420px] rounded-3xl p-6 sm:p-10 cursor-pointer select-none transition-all duration-300 relative border flex flex-col justify-between shadow-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/95 border-slate-700/80 hover:border-blue-500/50"
      >
        {/* Card Metadata Top */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold text-xs">
              {currentCard?.deck || 'General'}
            </span>
            {(currentCard?.tags || []).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                #{t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Rep: {currentCard?.repetition || 0}
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono">EF: {currentCard?.easeFactor ? currentCard.easeFactor.toFixed(1) : '2.5'}</span>
          </div>
        </div>

        {/* Center Content: Question vs Answer */}
        <div className="my-auto py-6 text-center space-y-4">
          <div className="text-xs uppercase font-bold tracking-widest text-slate-500">
            {isFlipped ? 'Answer' : 'Question (Click or Press Space to Reveal)'}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-relaxed whitespace-pre-wrap max-w-xl mx-auto">
            {isFlipped ? currentCard?.answer : currentCard?.question}
          </h3>
          {isFlipped && currentCard?.notes && (
            <div className="pt-4 border-t border-slate-800 max-w-md mx-auto text-xs text-slate-400 italic">
              💡 {currentCard.notes}
            </div>
          )}
        </div>

        {/* Bottom Hint */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isFlipped ? 'Click card to flip back' : 'Click anywhere or press Space to reveal'}</span>
        </div>
      </div>

      {/* SM-2 Rating Controls (Revealed after flip) */}
      {isFlipped ? (
        <div className="space-y-3 pt-2">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rate Recall Accuracy (SM-2 Interval Calculation)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Again */}
            <button
              onClick={() => handleRate(1)}
              className="p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Again [1]</span>
                <span className="font-mono text-[11px] text-rose-400 font-bold">+{sm2Previews?.again}</span>
              </div>
              <span className="text-[11px] text-rose-400/80 mt-1">Blackout / Forgot</span>
            </button>

            {/* 2. Hard */}
            <button
              onClick={() => handleRate(2)}
              className="p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-semibold transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Hard [2]</span>
                <span className="font-mono text-[11px] text-amber-400 font-bold">+{sm2Previews?.hard}</span>
              </div>
              <span className="text-[11px] text-amber-400/80 mt-1">Struggled to recall</span>
            </button>

            {/* 3. Good */}
            <button
              onClick={() => handleRate(3)}
              className="p-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 font-semibold transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Good [3]</span>
                <span className="font-mono text-[11px] text-blue-400 font-bold">+{sm2Previews?.good}</span>
              </div>
              <span className="text-[11px] text-blue-400/80 mt-1">Recalled with effort</span>
            </button>

            {/* 4. Easy */}
            <button
              onClick={() => handleRate(4)}
              className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-semibold transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Easy [4]</span>
                <span className="font-mono text-[11px] text-emerald-400 font-bold">+{sm2Previews?.easy}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 mt-1">Instant recall</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleFlipCard}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          Show Answer (Space)
        </button>
      )}
    </div>
  );
};
