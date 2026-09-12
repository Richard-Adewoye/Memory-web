import React, { useState, useMemo } from 'react';
import { ParsedNotebookCard, KnowledgeReference } from '../types';
import { playSound } from '../lib/audio';
import { ReferenceManager } from './ReferenceManager';
import {
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Trash2,
  Bookmark,
} from 'lucide-react';

interface NotebookTabProps {
  existingDecks: string[];
  soundEnabled: boolean;
  onImportBatch: (
    cards: ParsedNotebookCard[],
    deckName: string,
    scheduleMode: 'today' | 'stagger' | 'tomorrow',
    saveToDailyLog: boolean,
    dailyLogTitle: string,
    rawText: string
  ) => void;
}

export const NotebookTab: React.FC<NotebookTabProps> = ({
  existingDecks,
  soundEnabled,
  onImportBatch,
}) => {
  const [rawText, setRawText] = useState<string>(
    `Q: What is the spacing effect in learning psychology?
A: The phenomenon whereby learning is greater when studying is spread out over time, as opposed to cramming in a single session.

Synaptic Plasticity :: The ability of chemical synapses to change their strength in response to increases or decreases in their activity.

In long-term potentiation, [glutamate] activates [NMDA receptors] to trigger lasting dendritic spine growth.

- Working memory capacity is limited to roughly 4 to 7 items in humans.`
  );

  const [deckName, setDeckName] = useState<string>('Cognitive Science');
  const [scheduleMode, setScheduleMode] = useState<'today' | 'stagger' | 'tomorrow'>('stagger');
  const [saveToDailyLog, setSaveToDailyLog] = useState<boolean>(true);
  const [dailyLogTitle, setDailyLogTitle] = useState<string>('Notebook Study: Cognitive Science');
  const [references, setReferences] = useState<KnowledgeReference[]>([]);

  // Parser function
  const parsedCards: ParsedNotebookCard[] = useMemo(() => {
    if (!rawText.trim()) return [];

    const results: ParsedNotebookCard[] = [];
    const text = rawText.replace(/\r\n/g, '\n');

    // 1. Q: and A: Pattern
    const qaRegex = /(?:^|\n)(?:Q|Question):\s*([\s\S]+?)\n(?:A|Answer):\s*([\s\S]+?)(?=(?:\n(?:Q|Question):|$))/gi;
    let match: RegExpExecArray | null;
    const handledSpans: [number, number][] = [];

    while ((match = qaRegex.exec(text)) !== null) {
      handledSpans.push([match.index, match.index + match[0].length]);
      results.push({
        type: 'qa',
        typeLabel: 'Q & A',
        question: match[1].trim(),
        answer: match[2].trim(),
        references: references.length > 0 ? references : undefined,
      });
    }

    // Process line-by-line for remaining text
    const lines = text.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip lines already captured by QA regex
      if (/^(?:Q|Question|A|Answer):/i.test(trimmed)) return;

      // 2. Term :: Definition
      if (trimmed.includes('::')) {
        const [term, ...defParts] = trimmed.split('::');
        const def = defParts.join('::').trim();
        if (term.trim() && def) {
          results.push({
            type: 'definition',
            typeLabel: 'Term :: Def',
            question: `What is the definition of "${term.trim()}"?`,
            answer: def,
            references: references.length > 0 ? references : undefined,
          });
          return;
        }
      }

      // 3. Cloze Deletion [Bracketed]
      if (/\[.+?\]/.test(trimmed)) {
        const matches = trimmed.match(/\[(.+?)\]/g);
        if (matches && matches.length > 0) {
          const prompt = trimmed.replace(/\[(.+?)\]/g, '[ ... ]');
          const answers = matches.map((m) => m.slice(1, -1)).join(', ');
          results.push({
            type: 'cloze',
            typeLabel: 'Cloze Deletion',
            question: `Fill in the missing terms: ${prompt}`,
            answer: answers,
            references: references.length > 0 ? references : undefined,
          });
          return;
        }
      }

      // 4. Bullet Points
      if (/^[-*•]\s+/.test(trimmed)) {
        const content = trimmed.replace(/^[-*•]\s+/, '').trim();
        if (content.length > 15) {
          results.push({
            type: 'bullet',
            typeLabel: 'Key Fact',
            question: `Recall key principle: "${content.slice(0, 45)}..."`,
            answer: content,
            references: references.length > 0 ? references : undefined,
          });
        }
      }
    });

    return results;
  }, [rawText, references]);

  const [editableCards, setEditableCards] = useState<ParsedNotebookCard[]>([]);

  // Sync parsed with editable state
  React.useEffect(() => {
    setEditableCards(parsedCards);
  }, [parsedCards]);

  const handleCardEdit = (index: number, field: 'question' | 'answer', value: string) => {
    setEditableCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveCard = (index: number) => {
    setEditableCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    if (editableCards.length === 0) return;

    playSound('complete', soundEnabled);
    onImportBatch(
      editableCards,
      deckName.trim() || 'General',
      scheduleMode,
      saveToDailyLog,
      dailyLogTitle.trim(),
      rawText
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Top Description */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Paste from Study Notebook &amp; Attach Sources
            </h2>
            <p className="text-xs text-slate-400">
              Paste raw markdown notes, lecture transcripts, or summaries. Our smart parser converts them into spaced flashcards instantly.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Smart Syntax Extractor</span>
        </div>

        {/* Syntax Helpers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-blue-400">Q &amp; A Format:</span>
            <p className="text-slate-400 font-mono text-[11px]">
              Q: What is X?<br />A: X is defined as...
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">Term :: Definition:</span>
            <p className="text-slate-400 font-mono text-[11px]">
              Synapse :: Connection between neurons
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">Cloze Brackets:</span>
            <p className="text-slate-400 font-mono text-[11px]">
              The [mitochondria] is the powerhouse.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">Bullet Points:</span>
            <p className="text-slate-400 font-mono text-[11px]">
              - Over 70% of memory fades in 48h.
            </p>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-slate-300">Raw Study Notes / Lecture Text</label>
            <span>{editableCards.length} flashcards detected in real-time</span>
          </div>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your raw lecture notes, study summaries, or textbook highlights here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* Attach References to this Batch */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <ReferenceManager
            references={references}
            onChange={setReferences}
            isEditable={true}
          />
        </div>

        {/* Batch Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Deck</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g. Cognitive Psychology"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Review Scheduling</label>
            <select
              value={scheduleMode}
              onChange={(e) => setScheduleMode(e.target.value as 'today' | 'stagger' | 'tomorrow')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="stagger">⚡ Staggered (Over 1-3 days to avoid overload)</option>
              <option value="today">🚀 Due Immediately Today</option>
              <option value="tomorrow">📅 Start Tomorrow (1 day interval)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={saveToDailyLog}
                onChange={(e) => setSaveToDailyLog(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <span>Also archive text as a Daily Study Log entry</span>
            </label>
          </div>
        </div>
      </div>

      {/* Live Interactive Preview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Detected Flashcards Preview ({editableCards.length})
          </h3>

          {editableCards.length > 0 && (
            <button
              onClick={handleImport}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Import All {editableCards.length} Flashcards
            </button>
          )}
        </div>

        {editableCards.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
            No flashcards detected yet. Type or paste notes using the syntax helpers above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableCards.map((card, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[11px]">
                    {card.typeLabel}
                  </span>
                  <button
                    onClick={() => handleRemoveCard(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Remove from batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Question (Front)
                  </label>
                  <textarea
                    rows={2}
                    value={card.question}
                    onChange={(e) => handleCardEdit(idx, 'question', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Answer (Back)
                  </label>
                  <textarea
                    rows={2}
                    value={card.answer}
                    onChange={(e) => handleCardEdit(idx, 'answer', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
