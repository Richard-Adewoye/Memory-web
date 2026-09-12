import React, { useState, useMemo } from 'react';
import { Flashcard, KnowledgeTier } from '../types';
import { getTodayDateString, formatDateHuman, getTier1Progress } from '../lib/sm2';
import { getRefTypeIcon } from './ReferenceManager';
import { TierBadge } from './TierBadge';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  ChevronDown,
  Bookmark,
  ExternalLink,
  Quote,
  Zap,
  Sprout,
  Star,
  Sliders,
  Award,
} from 'lucide-react';

interface LibraryTabProps {
  cards: Flashcard[];
  existingDecks: string[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onExportCsv: () => void;
  onUpdateCardTier?: (cardId: string, tier: KnowledgeTier, customIntervalDays?: number) => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  cards,
  existingDecks,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCard,
  onExportCsv,
  onUpdateCardTier,
}) => {
  const today = getTodayDateString();

  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'due' | 'upcoming' | 'mastered' | 'referenced'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Deck Filter
      if (selectedDeck !== 'all' && (card.deck || 'General') !== selectedDeck) {
        return false;
      }

      // Tier Filter
      if (selectedTierFilter !== 'all') {
        const cardTier = card.tier || 'tier1';
        if (selectedTierFilter === 'grad_ready') {
          if (cardTier !== 'tier1') return false;
          const prog = getTier1Progress(card);
          if (!prog.isMonthCompleted) return false;
        } else if (cardTier !== selectedTierFilter) {
          return false;
        }
      }

      // Status Filter
      if (selectedStatus === 'due') {
        if (card.nextReviewDate > today) return false;
      } else if (selectedStatus === 'upcoming') {
        if (card.nextReviewDate <= today) return false;
      } else if (selectedStatus === 'mastered') {
        if ((card.repetition || 0) < 4) return false;
      } else if (selectedStatus === 'referenced') {
        if (!card.references || card.references.length === 0) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = card.question?.toLowerCase().includes(q);
        const matchesA = card.answer?.toLowerCase().includes(q);
        const matchesDeck = card.deck?.toLowerCase().includes(q);
        const matchesNotes = card.notes?.toLowerCase().includes(q);
        const matchesRef = (card.references || []).some(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.author?.toLowerCase().includes(q) ||
            r.quote?.toLowerCase().includes(q)
        );
        if (!matchesQ && !matchesA && !matchesDeck && !matchesNotes && !matchesRef) return false;
      }

      return true;
    });
  }, [cards, selectedDeck, selectedTierFilter, selectedStatus, searchQuery, today]);

  const tierCounts = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;
    let custom = 0;
    let gradReady = 0;

    cards.forEach((c) => {
      const tier = c.tier || 'tier1';
      if (tier === 'tier1') {
        t1 += 1;
        if (getTier1Progress(c).isMonthCompleted) gradReady += 1;
      } else if (tier === 'tier2') t2 += 1;
      else if (tier === 'tier3') t3 += 1;
      else if (tier === 'custom') custom += 1;
    });

    return { t1, t2, t3, custom, gradReady };
  }, [cards]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Controls Bar */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Flashcard Library &amp; Knowledge Tiers ({cards.length} Total Cards)
            </h2>
            <p className="text-xs text-slate-400">
              Browse, filter by tier cadence (Tier 1 2-day/1mo, Tier 2 3-day, Tier 3 twice/wk, Custom), search citations, and manage recall schedules
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onExportCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2"
              title="Export all cards and tier schedules as CSV spreadsheet"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export CSV
            </button>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Flashcard
            </button>
          </div>
        </div>

        {/* Tier Summary Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedTierFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedTierFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tiers ({cards.length})
          </button>
          <button
            onClick={() => setSelectedTierFilter('tier1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              selectedTierFilter === 'tier1'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Tier 1: 2-Day / 1 Mo ({tierCounts.t1})</span>
          </button>
          <button
            onClick={() => setSelectedTierFilter('tier2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              selectedTierFilter === 'tier2'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Tier 2: 3-Day ({tierCounts.t2})</span>
          </button>
          <button
            onClick={() => setSelectedTierFilter('tier3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              selectedTierFilter === 'tier3'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-purple-400 hover:text-purple-300 border border-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Tier 3: Twice a Week ({tierCounts.t3})</span>
          </button>
          <button
            onClick={() => setSelectedTierFilter('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              selectedTierFilter === 'custom'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-blue-400 hover:text-blue-300 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Frequency ({tierCounts.custom})</span>
          </button>

          {tierCounts.gradReady > 0 && (
            <button
              onClick={() => setSelectedTierFilter('grad_ready')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 animate-pulse ${
                selectedTierFilter === 'grad_ready'
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-md'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>🎓 1-Month Completed ({tierCounts.gradReady})</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, answers, citations, authors..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Deck Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-500">Deck:</span>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-white">All Decks ({cards.length})</option>
              {existingDecks.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d} ({cards.filter((c) => (c.deck || 'General') === d).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'due' | 'upcoming' | 'mastered' | 'referenced')}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-white">All Cards ({cards.length})</option>
              <option value="due" className="bg-slate-900 text-white">Due for Review Today</option>
              <option value="upcoming" className="bg-slate-900 text-white">Upcoming Reviews</option>
              <option value="referenced" className="bg-slate-900 text-white">📚 Has Citations</option>
              <option value="mastered" className="bg-slate-900 text-white">Mastered (Rep ≥ 4)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
          <p>No flashcards matched your search or tier filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isDue = !card.nextReviewDate || card.nextReviewDate <= today;
            const isRevealed = revealedCardIds.has(card.id);
            const refs = card.references || [];
            const tier1Progress = card.tier === 'tier1' ? getTier1Progress(card) : null;

            return (
              <div
                key={card.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between shadow-md group"
              >
                {/* Header: Deck & Tier Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold truncate max-w-[120px]">
                      {card.deck || 'General'}
                    </span>
                    <TierBadge
                      tier={card.tier || 'tier1'}
                      card={card}
                      customIntervalDays={card.customIntervalDays}
                      showProgress={true}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                    {isDue ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        Due Today
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                        Due: {formatDateHuman(card.nextReviewDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Month Milestone graduation callout if ready */}
                {card.tier === 'tier1' && tier1Progress?.isMonthCompleted && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1.5">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        1-Month Phase Complete!
                      </span>
                    </div>
                    {onUpdateCardTier && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <button
                          onClick={() => onUpdateCardTier(card.id, 'tier2')}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                        >
                          → Tier 2 (3d)
                        </button>
                        <button
                          onClick={() => onUpdateCardTier(card.id, 'tier3')}
                          className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition"
                        >
                          → Tier 3 (2x/wk)
                        </button>
                        <button
                          onClick={() => onUpdateCardTier(card.id, 'custom', 7)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition"
                        >
                          → Weekly (7d)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Question & Answer Content */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question</div>
                  <h4 className="text-sm font-bold text-white leading-relaxed">{card.question}</h4>

                  {/* Answer Accordion / Reveal */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleReveal(card.id)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRevealed ? 'rotate-180' : ''}`} />
                    </button>
                    {isRevealed && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150 space-y-2">
                        <div>{card.answer}</div>

                        {refs.length > 0 && (
                          <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1.5">
                            <div className="font-bold text-amber-400 flex items-center gap-1">
                              <Bookmark className="w-3 h-3" />
                              <span>Attached Citations:</span>
                            </div>
                            {refs.map((r) => (
                              <div key={r.id} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                                <div className="font-semibold text-white flex items-center gap-1">
                                  {getRefTypeIcon(r.type)}
                                  <span>{r.title}</span>
                                </div>
                                {r.locator && <div className="text-slate-400">📍 {r.locator}</div>}
                                {r.quote && (
                                  <div className="italic text-slate-400 flex items-center gap-1">
                                    <Quote className="w-2.5 h-2.5 text-amber-400" />
                                    <span>&ldquo;{r.quote}&rdquo;</span>
                                  </div>
                                )}
                                {r.url && (
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="text-blue-400 hover:underline flex items-center gap-1 pt-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Source link</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {card.notes && (
                    <div className="text-[11px] text-slate-400 italic pt-1 truncate">
                      💡 {card.notes}
                    </div>
                  )}
                </div>

                {/* Footer: Metrics & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 font-mono">
                    <span>Int: {card.interval || 0}d</span>
                    <span>Rep: {card.repetition || 0}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(card)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit card, tier & references"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCard(card.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
