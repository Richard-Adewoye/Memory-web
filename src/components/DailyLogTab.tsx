import React, { useState } from 'react';
import { DailyLog, Flashcard, KnowledgeReference } from '../types';
import { getTodayDateString, formatDateHuman } from '../lib/sm2';
import { playSound } from '../lib/audio';
import { ReferenceManager, getRefTypeIcon, getRefTypeLabel } from './ReferenceManager';
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Quote,
  Bookmark,
} from 'lucide-react';

interface DailyLogTabProps {
  dailyLogs: DailyLog[];
  cards: Flashcard[];
  soundEnabled: boolean;
  onSaveDailyLog: (
    logData: Omit<DailyLog, 'id' | 'createdAt'>,
    newCardsData: { question: string; answer: string; references?: KnowledgeReference[] }[]
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

  // Form State
  const [date, setDate] = useState<string>(today);
  const [subject, setSubject] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [confidence, setConfidence] = useState<'breakthrough' | 'solid' | 'challenging'>('solid');
  const [references, setReferences] = useState<KnowledgeReference[]>([]);

  // Inline Flashcards to create alongside log
  const [newCards, setNewCards] = useState<{ question: string; answer: string }[]>([
    { question: '', answer: '' },
  ]);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleAddCardRow = () => {
    setNewCards((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveCardRow = (index: number) => {
    setNewCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardChange = (index: number, field: 'question' | 'answer', value: string) => {
    setNewCards((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim() || !notes.trim()) return;

    // Filter valid card rows and pass inherited references
    const validCards = newCards
      .filter((c) => c.question.trim() && c.answer.trim())
      .map((c) => ({
        question: c.question.trim(),
        answer: c.answer.trim(),
        references: references.length > 0 ? references : undefined,
      }));

    onSaveDailyLog(
      {
        date,
        subject: subject.trim(),
        title: title.trim(),
        notes: notes.trim(),
        confidence,
        references: references.length > 0 ? references : undefined,
        cardIds: [],
      },
      validCards
    );

    playSound('complete', soundEnabled);

    // Reset Form
    setTitle('');
    setNotes('');
    setSubject('');
    setReferences([]);
    setNewCards([{ question: '', answer: '' }]);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Top Creation Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Log Daily Study Session &amp; Sources
            </h2>
            <p className="text-xs text-slate-400">
              Document your daily learnings, attach reference citations, and turn key takeaways into spaced flashcards
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Active Recall Journal</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Date, Subject, Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject / Deck Name</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cognitive Psychology, Organic Chemistry"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Session Comprehension</label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as 'breakthrough' | 'solid' | 'challenging')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="breakthrough">🌟 Breakthrough (Mastered Concepts)</option>
                <option value="solid">🟢 Solid Comprehension</option>
                <option value="challenging">🟡 Challenging (Needs Reinforcement)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Study Topic / Key Concept</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Synaptic Plasticity &amp; Long-Term Potentiation (LTP)"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row 3: Synthesis Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Knowledge Synthesis &amp; Reflections (Markdown / Plain Text)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summarize the core mental models learned in your own words..."
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Row 4: Knowledge References / Citations */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <ReferenceManager
              references={references}
              onChange={setReferences}
              isEditable={true}
            />
          </div>

          {/* Row 5: Create Flashcards from this log */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Reinforce with Instant Spaced Flashcards
                </h4>
                <p className="text-[11px] text-slate-400">
                  These cards will automatically attach your session references and enter the SM-2 review queue
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCardRow}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Card Prompt
              </button>
            </div>

            <div className="space-y-3">
              {newCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                >
                  <span className="text-slate-500 font-mono text-[11px] shrink-0">#{idx + 1}</span>

                  <input
                    type="text"
                    value={card.question}
                    onChange={(e) => handleCardChange(idx, 'question', e.target.value)}
                    placeholder="Question / Active Recall Prompt..."
                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />

                  <input
                    type="text"
                    value={card.answer}
                    onChange={(e) => handleCardChange(idx, 'answer', e.target.value)}
                    placeholder="Target Answer..."
                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />

                  {newCards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCardRow(idx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Remove card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Save Study Log &amp; Queue Flashcards
            </button>
          </div>
        </form>
      </div>

      {/* Historical Daily Learning Logs */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Study Journal History ({dailyLogs.length} Entries)
        </h3>

        {dailyLogs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
            No study logs recorded yet. Use the form above to record your first session!
          </div>
        ) : (
          <div className="space-y-4">
            {dailyLogs.map((log) => {
              const attachedCards = cards.filter((c) => c.dailyLogId === log.id || (log.cardIds || []).includes(c.id));
              const isExpanded = expandedLogId === log.id;
              const logRefs = log.references || [];

              return (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                        {log.subject}
                      </span>
                      <h4 className="text-sm font-bold text-white">{log.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono">{formatDateHuman(log.date)}</span>
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Content */}
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                    {log.notes}
                  </div>

                  {/* Attached References & Sources */}
                  {logRefs.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                        <span>Referenced Knowledge Sources ({logRefs.length})</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {logRefs.map((ref) => (
                          <div
                            key={ref.id}
                            className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              {getRefTypeIcon(ref.type)}
                              <span className="truncate">{ref.title}</span>
                            </div>

                            {ref.author && (
                              <div className="text-[11px] text-slate-400">Author: {ref.author}</div>
                            )}

                            {ref.locator && (
                              <div className="text-[10px] font-mono text-blue-300">📍 {ref.locator}</div>
                            )}

                            {ref.quote && (
                              <div className="text-[11px] text-slate-300 italic flex items-center gap-1 pt-0.5">
                                <Quote className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>&ldquo;{ref.quote}&rdquo;</span>
                              </div>
                            )}

                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pt-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span className="truncate">{ref.url}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Flashcards Accordion */}
                  {attachedCards.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {attachedCards.length} Spaced Flashcard{attachedCards.length === 1 ? '' : 's'} Created
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 animate-in fade-in duration-150">
                          {attachedCards.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                            >
                              <div className="font-bold text-white">Q: {c.question}</div>
                              <div className="text-slate-400">A: {c.answer}</div>
                              <div className="text-[10px] font-mono text-slate-500 pt-1">
                                Next Due: {c.nextReviewDate} | Int: {c.interval}d
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
