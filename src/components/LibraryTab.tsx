import React, { useState, useMemo } from 'react';
import { Flashcard } from '../types';
import { getTodayDateString, formatDateHuman } from '../lib/sm2';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  ChevronDown,
} from 'lucide-react';

interface LibraryTabProps {
  cards: Flashcard[];
  existingDecks: string[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onExportCsv: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  cards,
  existingDecks,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCard,
  onExportCsv,
}) => {
  const today = getTodayDateString();

  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'due' | 'upcoming' | 'mastered'>('all');
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

      // Status Filter
      if (selectedStatus === 'due') {
        if (card.nextReviewDate > today) return false;
      } else if (selectedStatus === 'upcoming') {
        if (card.nextReviewDate <= today) return false;
      } else if (selectedStatus === 'mastered') {
        if ((card.repetition || 0) < 4) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = card.question?.toLowerCase().includes(q);
        const matchesA = card.answer?.toLowerCase().includes(q);
        const matchesDeck = card.deck?.toLowerCase().includes(q);
        const matchesNotes = card.notes?.toLowerCase().includes(q);
        if (!matchesQ && !matchesA && !matchesDeck && !matchesNotes) return false;
      }

      return true;
    });
  }, [cards, selectedDeck, selectedStatus, searchQuery, today]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Controls Bar */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Flashcard Library ({cards.length} Total Cards)
            </h2>
            <p className="text-xs text-slate-400">
              Browse, filter, edit, or export all spaced memory cards across your curriculum
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onExportCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2"
              title="Export all cards as CSV spreadsheet"
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

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, answers, notes..."
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
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'due' | 'upcoming' | 'mastered')}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="due" className="bg-slate-900 text-white">Due for Review</option>
              <option value="upcoming" className="bg-slate-900 text-white">Upcoming Reviews</option>
              <option value="mastered" className="bg-slate-900 text-white">Mastered (Rep ≥ 4)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
          <p>No flashcards matched your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isDue = !card.nextReviewDate || card.nextReviewDate <= today;
            const isRevealed = revealedCardIds.has(card.id);

            return (
              <div
                key={card.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between shadow-md group"
              >
                {/* Header: Deck & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold truncate max-w-[160px]">
                    {card.deck || 'General'}
                  </span>

                  <div className="flex items-center gap-1.5 text-[11px]">
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
                      <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
                        {card.answer}
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
                  <div className="flex items-center gap-3 font-mono">
                    <span>Int: {card.interval || 0}d</span>
                    <span>EF: {card.easeFactor ? card.easeFactor.toFixed(1) : '2.5'}</span>
                    <span>Rep: {card.repetition || 0}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(card)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit card"
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
