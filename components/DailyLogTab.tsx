'use client';

import React, { useState } from 'react';
import { DailyLog, Flashcard } from '@/types';
import { getTodayDateString, addDays, formatDateHuman } from '@/lib/sm2';
import { playSound } from '@/lib/audio';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  Layers,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

interface DailyLogTabProps {
  dailyLogs: DailyLog[];
  cards: Flashcard[];
  soundEnabled: boolean;
  onSaveDailyLog: (log: Omit<DailyLog, 'id' | 'createdAt'>, newCardsData: { question: string; answer: string }[]) => void;
  onDeleteLog: (logId: string) => void;
}

export const DailyLogTab: React.FC<DailyLogTabProps> = ({
  dailyLogs,
  cards,
  soundEnabled,
  onSaveDailyLog,
  onDeleteLog,
}) => {
  const today = getTodayDateString();

  // Form State
  const [date, setDate] = useState<string>(today);
  const [subject, setSubject] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [confidence, setConfidence] = useState<'breakthrough' | 'solid' | 'challenging'>('solid');

  // Quick Flashcards State
  const [tempCards, setTempCards] = useState<{ question: string; answer: string }[]>([]);
  const [quickQ, setQuickQ] = useState<string>('');
  const [quickA, setQuickA] = useState<string>('');

  const handleAddTempCard = () => {
    const q = quickQ.trim();
    const a = quickA.trim();
    if (!q || !a) return;

    setTempCards((prev) => [...prev, { question: q, answer: a }]);
    setQuickQ('');
    setQuickA('');
    playSound('rate', soundEnabled);
  };

  const handleRemoveTempCard = (index: number) => {
    setTempCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;

    onSaveDailyLog(
      {
        date: date || today,
        subject: subject.trim() || 'General Learning',
        title: title.trim(),
        notes: notes.trim(),
        confidence,
        cardIds: [],
      },
      tempCards
    );

    // Reset Form
    setTitle('');
    setNotes('');
    setTempCards([]);
    setQuickQ('');
    setQuickA('');
    playSound('complete', soundEnabled);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-10">
      {/* Daily Entry Creation Form */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Record Daily Learning & Generate Flashcards</h2>
            <p className="text-xs text-slate-400">
              Summarize your daily study takeaways and instantly create memory anchors for spaced repetition
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Subject / Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject / Field</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cognitive Psychology, TypeScript, History"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            {/* Confidence / Mastery */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Understanding Level</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as 'breakthrough' | 'solid' | 'challenging')}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="breakthrough">🌟 Breakthrough (Mastered)</option>
                <option value="solid">💡 Solid Understanding</option>
                <option value="challenging">⚡ Challenging (Needs Repetition)</option>
              </select>
            </div>
          </div>

          {/* Core Concept Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Core Concept Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Ebbinghaus Forgetting Curve & Synaptic Decay"
              required
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-medium"
            />
          </div>

          {/* Detailed Learnings */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Key Learnings & Personal Insights <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write a concise breakdown of what you learned, why it matters, and mental models or analogies..."
              required
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>

          {/* Embedded Flashcard Generator */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Attach Active Recall Flashcards ({tempCards.length})
              </span>
              <span className="text-[11px] text-slate-400">Scheduled for SM-2 review starting tomorrow</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={quickQ}
                onChange={(e) => setQuickQ(e.target.value)}
                placeholder="Question (Front of flashcard)"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={quickA}
                onChange={(e) => setQuickA(e.target.value)}
                placeholder="Answer (Back of flashcard)"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddTempCard}
              disabled={!quickQ.trim() || !quickA.trim()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              Add Flashcard to this Entry
            </button>

            {/* List of Added Cards */}
            {tempCards.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                {tempCards.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">Q: {c.question}</div>
                      <div className="text-slate-400 truncate">A: {c.answer}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTempCard(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1 shrink-0"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Daily Learning Entry
          </button>
        </form>
      </div>

      {/* Historical Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Learning Journal Timeline ({dailyLogs.length} Entries)
          </h3>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-sm text-slate-400">
            No daily learning entries recorded yet. Fill out the form above to log your first study takeaway!
          </div>
        ) : (
          <div className="space-y-4">
            {dailyLogs.map((log) => {
              const confidenceColors = {
                breakthrough: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                solid: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                challenging: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              };

              const attachedCardsCount = (log.cardIds || []).length;

              return (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{formatDateHuman(log.date)}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                        {log.subject}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          confidenceColors[log.confidence] || confidenceColors.solid
                        }`}
                      >
                        {log.confidence.toUpperCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-white">{log.title}</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{log.notes}</p>

                  {attachedCardsCount > 0 && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-blue-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{attachedCardsCount} Spaced Repetition flashcard{attachedCardsCount > 1 ? 's' : ''} generated</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
