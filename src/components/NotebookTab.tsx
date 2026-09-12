import React, { useState, useEffect } from 'react';
import { ParsedNotebookCard } from '../types';
import { playSound } from '../lib/audio';
import {
  Layers,
  FileText,
  Sparkles,
  Trash2,
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
  const [rawText, setRawText] = useState<string>('');
  const [targetDeck, setTargetDeck] = useState<string>('');
  const [scheduleMode, setScheduleMode] = useState<'today' | 'stagger' | 'tomorrow'>('today');
  const [saveToDailyLog, setSaveToDailyLog] = useState<boolean>(true);
  const [dailyLogTitle, setDailyLogTitle] = useState<string>('');
  const [parsedCards, setParsedCards] = useState<ParsedNotebookCard[]>([]);

  // Parser logic
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedCards([]);
      return;
    }

    const lines = rawText.split('\n');
    const cards: ParsedNotebookCard[] = [];

    // 1. Q: and A: blocks
    let currentQ = '';
    let currentA = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^q(uestion)?\s*[:\-\.]/i.test(line)) {
        if (currentQ && currentA) {
          cards.push({ type: 'qa', typeLabel: 'Q&A', question: currentQ, answer: currentA });
          currentQ = '';
          currentA = '';
        }
        currentQ = line.replace(/^q(uestion)?\s*[:\-\.]\s*/i, '');
      } else if (/^a(nswer)?\s*[:\-\.]/i.test(line)) {
        currentA = line.replace(/^a(nswer)?\s*[:\-\.]\s*/i, '');
      } else if (currentA) {
        currentA += '\n' + line;
      } else if (currentQ) {
        currentQ += ' ' + line;
      }
    }
    if (currentQ && currentA) {
      cards.push({ type: 'qa', typeLabel: 'Q&A', question: currentQ, answer: currentA });
    }

    // 2. Term :: Definition or Term - Definition
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes('::')) {
        const parts = trimmed.split('::');
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          cards.push({
            type: 'term_def',
            typeLabel: 'Term/Def',
            question: `What is ${parts[0].trim()}?`,
            answer: parts.slice(1).join('::').trim(),
          });
        }
      } else if (trimmed.includes(' - ') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        const parts = trimmed.split(' - ');
        if (parts.length === 2 && parts[0].trim().length < 60 && parts[1].trim().length > 10) {
          cards.push({
            type: 'term_def',
            typeLabel: 'Term/Def',
            question: `Explain: ${parts[0].trim()}`,
            answer: parts[1].trim(),
          });
        }
      }
    });

    // 3. Cloze deletion with brackets [answer]
    lines.forEach((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(/\[(.*?)\]/);
      if (match && match[1] && match[1].trim().length > 0 && trimmed.length > 20) {
        const clozeQ = trimmed.replace(/\[(.*?)\]/g, '_______');
        const clozeA = match[1].trim();
        cards.push({
          type: 'cloze',
          typeLabel: 'Cloze [ ]',
          question: `Fill in the blank:\n${clozeQ}`,
          answer: clozeA,
        });
      }
    });

    // 4. Bullet points
    lines.forEach((line) => {
      const trimmed = line.trim();
      if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && trimmed.includes(':')) {
        const colonIdx = trimmed.indexOf(':');
        const front = trimmed.slice(2, colonIdx).trim();
        const back = trimmed.slice(colonIdx + 1).trim();
        if (front && back) {
          cards.push({
            type: 'bullet',
            typeLabel: 'Bullet Point',
            question: front,
            answer: back,
          });
        }
      }
    });

    // Deduplicate
    const uniqueMap = new Map<string, ParsedNotebookCard>();
    cards.forEach((c) => {
      const key = `${c.question.trim()}|${c.answer.trim()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    });

    setParsedCards(Array.from(uniqueMap.values()));
  }, [rawText]);

  const handleInsertSample = (type: 'qa' | 'term' | 'cloze' | 'bullet') => {
    let sample = '';
    if (type === 'qa') {
      sample = `Q: What is Active Recall?\nA: The practice of retrieving information from memory without looking at the answer, strengthening neural pathways.\n\nQ: What is the Leitner System?\nA: A flashcard review method using spaced intervals to master difficult concepts.`;
    } else if (type === 'term') {
      sample = `Hermann Ebbinghaus :: Discovered the mathematical forgetting curve in 1885.\nSynaptic Plasticity :: The biological ability of neural connections to strengthen with spaced practice.`;
    } else if (type === 'cloze') {
      sample = `The [SM-2 Algorithm] calculates optimal intervals based on Ease Factor.\nMemory consolidation primarily takes place during [deep slow-wave sleep].`;
    } else if (type === 'bullet') {
      sample = `- Declarative Memory: Explicit facts and episodic events that can be consciously recalled.\n- Procedural Memory: Unconscious motor skills and habits.`;
    }

    setRawText((prev) => (prev ? `${prev}\n\n${sample}` : sample));
    playSound('flip', soundEnabled);
  };

  const handleUpdateParsedCard = (index: number, field: 'question' | 'answer', value: string) => {
    setParsedCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveParsedCard = (index: number) => {
    setParsedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    if (parsedCards.length === 0) return;
    const finalDeck = targetDeck.trim() || 'General Study';

    onImportBatch(
      parsedCards,
      finalDeck,
      scheduleMode,
      saveToDailyLog,
      dailyLogTitle.trim() || `Notebook Study: ${finalDeck}`,
      rawText
    );

    setRawText('');
    setParsedCards([]);
    playSound('complete', soundEnabled);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Paste from Study Notebook (Instant Spaced Memory Work)</h2>
            <p className="text-xs text-slate-400">
              Paste raw markdown, bullet points, or lecture notes. Our intelligent parser automatically extracts flashcards for SM-2 scheduling.
            </p>
          </div>
        </div>

        {/* Quick Format Inserters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400">Sample Templates:</span>
          <button
            onClick={() => handleInsertSample('qa')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Q&A
          </button>
          <button
            onClick={() => handleInsertSample('term')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Term :: Def
          </button>
          <button
            onClick={() => handleInsertSample('cloze')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Cloze [ ]
          </button>
          <button
            onClick={() => handleInsertSample('bullet')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Bullets
          </button>
        </div>
      </div>

      {/* Two Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input & Settings */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Paste Notes, Summaries, or Flashcard Syntax</span>
              <span className="text-[11px] text-slate-400">{rawText.length} characters</span>
            </label>
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste notes here...
Examples supported:
Q: What is Active Recall?
A: Retrieving information without hints.

Ebbinghaus Curve :: Rapid memory decay over 48 hours.

The [SM-2] algorithm recalculates intervals after every review.

- Declarative Memory: Conscious recall of facts."
              className="w-full font-mono text-xs bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed placeholder:text-slate-600"
            />
          </div>

          {/* Target Deck & Autocomplete */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Target Deck / Category</label>
            <input
              type="text"
              value={targetDeck}
              onChange={(e) => setTargetDeck(e.target.value)}
              placeholder="e.g. Cognitive Psychology, Neuroscience, Programming"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {existingDecks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Existing Decks:</span>
                {existingDecks.slice(0, 5).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDeck(d)}
                    className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Initial Scheduling Strategy</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'today', label: 'Due Today (Ready Now)' },
                { id: 'stagger', label: 'Stagger (Next 3 Days)' },
                { id: 'tomorrow', label: 'Due Tomorrow' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScheduleMode(opt.id as 'today' | 'stagger' | 'tomorrow')}
                  className={`p-2.5 rounded-xl border text-center font-medium transition ${
                    scheduleMode === opt.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Daily Log Synchronizer */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToDailyLog}
                onChange={(e) => setSaveToDailyLog(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <span>Also log this study session in the Daily Learning Log</span>
            </label>
            {saveToDailyLog && (
              <input
                type="text"
                value={dailyLogTitle}
                onChange={(e) => setDailyLogTitle(e.target.value)}
                placeholder="Session Title (e.g. Notebook Study: Memory Consolidation)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleImport}
            disabled={parsedCards.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Import & Generate {parsedCards.length} Spaced Cards
          </button>
        </div>

        {/* Right Column: Live Parsed Cards Preview */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Extracted Flashcards Preview</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono">
                {parsedCards.length} Detected
              </span>
            </div>
            {parsedCards.length > 0 && (
              <button
                onClick={() => setParsedCards([])}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                Clear All
              </button>
            )}
          </div>

          {parsedCards.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm space-y-3">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p>Type or paste notes on the left. The parser will display interactive cards here with editable questions and answers.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {parsedCards.map((card, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
                      {card.typeLabel} #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveParsedCard(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Question (Front):</span>
                      <textarea
                        rows={2}
                        value={card.question}
                        onChange={(e) => handleUpdateParsedCard(idx, 'question', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Answer (Back):</span>
                      <textarea
                        rows={2}
                        value={card.answer}
                        onChange={(e) => handleUpdateParsedCard(idx, 'answer', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
