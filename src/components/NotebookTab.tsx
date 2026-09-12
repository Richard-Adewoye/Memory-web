import React, { useState, useMemo } from 'react';
import { ParsedNotebookCard, KnowledgeReference, KnowledgeTier } from '../types';
import { playSound } from '../lib/audio';
import { ReferenceManager } from './ReferenceManager';
import { TierSelector } from './TierSelector';
import { TierBadge } from './TierBadge';
import {
  Sparkles,
  Layers,
  CheckCircle,
  Trash2,
  Bookmark,
  Bot,
  RefreshCw,
  AlertCircle,
  Wand2,
  Plus,
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
    rawText: string,
    batchTier: KnowledgeTier,
    batchCustomDays: number
  ) => void;
}

interface GeneratedAICard {
  question: string;
  answer: string;
  keyConcept?: string;
  quote?: string;
  citation?: string;
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
  const [batchTier, setBatchTier] = useState<KnowledgeTier>('tier1');
  const [batchCustomDays, setBatchCustomDays] = useState<number>(7);

  // AI Generation States
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');

  // Parser function for local regex rules
  const ruleParsedCards: ParsedNotebookCard[] = useMemo(() => {
    if (!rawText.trim()) return [];

    const results: ParsedNotebookCard[] = [];
    const text = rawText.replace(/\r\n/g, '\n');

    // 1. Q: and A: Pattern
    const qaRegex = /(?:^|\n)(?:Q|Question):\s*([\s\S]+?)\n(?:A|Answer):\s*([\s\S]+?)(?=(?:\n(?:Q|Question):|$))/gi;
    let match: RegExpExecArray | null;

    while ((match = qaRegex.exec(text)) !== null) {
      results.push({
        type: 'qa',
        typeLabel: 'Q & A',
        question: match[1].trim(),
        answer: match[2].trim(),
        tier: batchTier,
        customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
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
            tier: batchTier,
            customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
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
            tier: batchTier,
            customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
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
            tier: batchTier,
            customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
            references: references.length > 0 ? references : undefined,
          });
        }
      }
    });

    return results;
  }, [rawText, references, batchTier, batchCustomDays]);

  const [editableCards, setEditableCards] = useState<ParsedNotebookCard[]>([]);

  // Initialize with rule-parsed cards when rawText changes and not manually overridden
  React.useEffect(() => {
    setEditableCards(ruleParsedCards);
  }, [ruleParsedCards]);

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

  const handleAddBlankCard = () => {
    setEditableCards((prev) => [
      ...prev,
      {
        type: 'custom',
        typeLabel: 'Custom',
        question: '',
        answer: '',
        tier: batchTier,
        customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
        references: references.length > 0 ? references : undefined,
      },
    ]);
  };

  // AI Generation with Gemini API
  const handleGenerateWithAI = async () => {
    if (!rawText.trim()) {
      setAiError('Please enter some notes or text in the box above before generating cards with AI.');
      return;
    }

    setAiError(null);
    setIsGeneratingAI(true);
    setAiStatusMessage('Analyzing study text with Gemini AI...');

    try {
      const statusTimer = setTimeout(() => {
        setAiStatusMessage('Synthesizing active recall question-answer pairs...');
      }, 1200);

      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          deckName: deckName.trim() || 'General',
        }),
      });

      clearTimeout(statusTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const generatedCards: GeneratedAICard[] = data.cards || [];

      if (generatedCards.length === 0) {
        throw new Error('Gemini did not find distinct concepts to convert into flashcards. Try adding more detailed text.');
      }

      const newParsedCards: ParsedNotebookCard[] = generatedCards.map((c) => {
        const cardRefs: KnowledgeReference[] = [...references];
        if (c.citation || c.quote) {
          cardRefs.push({
            id: 'ref_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title: c.citation || `${deckName} Reference`,
            type: 'article',
            quote: c.quote,
          });
        }

        return {
          type: 'ai',
          typeLabel: c.keyConcept ? `AI: ${c.keyConcept}` : 'Gemini AI',
          question: c.question,
          answer: c.answer,
          tier: batchTier,
          customIntervalDays: batchTier === 'custom' ? batchCustomDays : undefined,
          references: cardRefs.length > 0 ? cardRefs : undefined,
        };
      });

      setEditableCards(newParsedCards);
      playSound('flip', soundEnabled);
      setAiStatusMessage(`Generated ${newParsedCards.length} flashcards using Gemini AI!`);
    } catch (err: unknown) {
      console.error('AI Card Generation failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate flashcards';
      setAiError(msg);
    } finally {
      setIsGeneratingAI(false);
    }
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
      rawText,
      batchTier,
      batchCustomDays
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-8">
      {/* Top Description */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Notebook Flashcard Synthesizer &amp; AI Generator
            </h2>
            <p className="text-xs text-slate-400">
              Paste raw markdown notes, lecture transcripts, or articles. Assign Knowledge Tiers (Tier 1 2-day / 1mo, Tier 2 3-day, Tier 3 twice a week, or Custom) and generate cards with Gemini AI.
            </p>
          </div>

          {/* AI Generate Cards Button */}
          <button
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI || !rawText.trim()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 shrink-0 border border-indigo-400/30"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Generating with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Generate Cards with AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Loading Banner / Status Message */}
        {isGeneratingAI && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 text-blue-200 text-xs flex items-center gap-3 animate-pulse">
            <Bot className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold text-white">{aiStatusMessage}</div>
              <div className="text-[11px] text-blue-300">
                Using Gemini 3.8 Flash to identify core concepts and format atomic Q&amp;A memory cards.
              </div>
            </div>
          </div>
        )}

        {/* AI Error Banner */}
        {aiError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white">AI Generation Notice</div>
              <p>{aiError}</p>
            </div>
          </div>
        )}

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
            <span className="font-bold text-amber-400">Gemini AI Parser:</span>
            <p className="text-slate-400 font-mono text-[11px]">
              Click &quot;Generate Cards with AI&quot; on any raw text
            </p>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-slate-300">Raw Study Notes / Lecture Text</label>
            <div className="flex items-center gap-3">
              <span>{editableCards.length} flashcards ready</span>
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI || !rawText.trim()}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Extract</span>
              </button>
            </div>
          </div>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your raw lecture notes, study summaries, research highlights, or textbook paragraphs here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* Knowledge Tier Selector for Batch */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <TierSelector
            selectedTier={batchTier}
            customIntervalDays={batchCustomDays}
            onSelectTier={setBatchTier}
            onChangeCustomDays={setBatchCustomDays}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Suggested Flashcards ({editableCards.length})
            </h3>
            <span className="text-xs text-slate-400">Review &amp; edit before importing</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAddBlankCard}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Blank Card
            </button>

            {editableCards.length > 0 && (
              <button
                onClick={handleImport}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Import All {editableCards.length} Flashcards
              </button>
            )}
          </div>
        </div>

        {editableCards.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-3">
            <Bot className="w-8 h-8 mx-auto text-slate-600" />
            <p>No flashcards detected yet. Type notes or click &quot;Generate Cards with AI&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableCards.map((card, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[11px] flex items-center gap-1">
                      {card.type === 'ai' && <Sparkles className="w-3 h-3 text-amber-400" />}
                      <span>{card.typeLabel}</span>
                    </span>
                    <TierBadge tier={card.tier || batchTier} customIntervalDays={batchCustomDays} size="sm" />
                    {card.references && card.references.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold flex items-center gap-0.5">
                        <Bookmark className="w-3 h-3" />
                        <span>{card.references.length} ref</span>
                      </span>
                    )}
                  </div>

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
