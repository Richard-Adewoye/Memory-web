import React, { useState } from 'react';
import { DailyLog, Flashcard } from '../types';
import { getTodayDateString, formatDateHuman } from '../lib/sm2';
import { playSound } from '../lib/audio';
import {
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle,
} from 'lucide-react';

interface DailyLogTabProps {
  dailyLogs: DailyLog[];
  cards: Flashcard[];
  soundEnabled: boolean;
  onSaveDailyLog: (
    logData: Omit<DailyLog, 'id' | 'createdAt'>,
    newCards: { question: string; answer: string }[]
  ) => void;
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

  const [date, setDate] = useState<string>(today);
  const [subject, setSubject] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [confidence, setConfidence] = useState<'breakthrough' | 'solid' | 'challenging'>('solid');

  // Flashcards to generate with this log
  const [logCards, setLogCards] = useState<{ question: string; answer: string }[]>([
    { question: '', answer: '' },
  ]);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleAddCardField = () => {
    setLogCards((prev) => [...prev, { question: '', answer: '' }]);
    playSound('flip', soundEnabled);
  };

  const handleRemoveCardField = (index: number) => {
    setLogCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCardField = (index: number, field: 'question' | 'answer', value: string) => {
    setLogCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    // Filter valid cards
    const validCards = logCards.filter((c) => c.question.trim() && c.answer.trim());

    onSaveDailyLog(
      {
        date: date || today,
        subject: subject.trim(),
        title: title.trim(),
        notes: notes.trim(),
        confidence,
        cardIds: [],
      },
      validCards
    );

    // Reset form
    setTitle('');
    setNotes('');
    setLogCards([{ question: '', answer: '' }]);
    playSound('complete', soundEnabled);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Daily Learning Log & Concept Capture</h2>
            <p className="text-xs text-slate-400">
              Synthesize key takeaways from today&apos;s studies and instantly generate spaced flashcards to prevent memory decay.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Create Daily Log Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            Record Today&apos;s Study Entry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Study Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject / Category <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cognitive Psychology, Rust, Anatomy"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Core Topic / Lesson Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Long-Term Potentiation & Synaptic Strength"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            {/* Key Insights & Synthesis */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Synthesis, Insights & Key Takeaways
              </label>
              <textarea
                rows={4}
                placeholder="Summarize the core concept in your own words (Feynman technique)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 leading-relaxed"
              />
            </div>

            {/* Confidence Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Comprehension Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'breakthrough', label: '🌟 Breakthrough', desc: 'Deep mastery' },
                  { id: 'solid', label: '✅ Solid Understanding', desc: 'Comfortable' },
                  { id: 'challenging', label: '⚠️ Needs Reinforcement', desc: 'Complex topic' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConfidence(item.id as DailyLog['confidence'])}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      confidence === item.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-75">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attached Spaced Flashcards Generator */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Convert Into Spaced Flashcards
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Creates active recall prompt cards scheduled in the SM-2 engine
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCardField}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Card
                </button>
              </div>

              {logCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Card #{idx + 1}</span>
                    {logCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCardField(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Question (e.g. What is the role of the hippocampus?)"
                    value={card.question}
                    onChange={(e) => handleUpdateCardField(idx, 'question', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Answer (e.g. Memory consolidation & spatial indexing)"
                    value={card.answer}
                    onChange={(e) => handleUpdateCardField(idx, 'answer', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Daily Learning Log &amp; Queue Cards
            </button>
          </form>
        </div>

        {/* Right Column: Historical Daily Logs (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Learning History ({dailyLogs.length})
            </h3>
            <span className="text-xs text-slate-400">Past reflections</span>
          </div>

          {dailyLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No learning logs recorded yet. Use the form on the left to start your daily retention journal.
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {dailyLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const linkedCards = cards.filter((c) => log.cardIds?.includes(c.id) || c.dailyLogId === log.id);

                return (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
                  >
                    {/* Top Row: Date & Subject */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold truncate max-w-[140px]">
                        {log.subject}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateHuman(log.date)}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-white leading-snug">{log.title}</h4>

                    {/* Notes Preview */}
                    {log.notes && (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {log.notes}
                      </p>
                    )}

                    {/* Linked Cards & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>{linkedCards.length} Spaced Cards</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Cards View */}
                    {isExpanded && linkedCards.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Attached Flashcards:</div>
                        {linkedCards.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                            <div className="font-semibold text-slate-200">Q: {c.question}</div>
                            <div className="text-slate-400">A: {c.answer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
