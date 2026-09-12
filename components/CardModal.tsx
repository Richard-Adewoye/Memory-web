'use client';

import React, { useState, useEffect } from 'react';
import { Flashcard } from '@/types';
import { getTodayDateString } from '@/lib/sm2';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  editingCard: Flashcard | null;
  existingDecks: string[];
  onClose: () => void;
  onSave: (cardData: {
    question: string;
    answer: string;
    notes: string;
    deck: string;
  }) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  editingCard,
  existingDecks,
  onClose,
  onSave,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deck, setDeck] = useState<string>('');

  useEffect(() => {
    if (editingCard) {
      setQuestion(editingCard.question || '');
      setAnswer(editingCard.answer || '');
      setNotes(editingCard.notes || '');
      setDeck(editingCard.deck || 'General');
    } else {
      setQuestion('');
      setAnswer('');
      setNotes('');
      setDeck('General');
    }
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    onSave({
      question: question.trim(),
      answer: answer.trim(),
      notes: notes.trim(),
      deck: deck.trim() || 'General',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deck / Category <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={deck}
              onChange={(e) => setDeck(e.target.value)}
              placeholder="e.g. Cognitive Science"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {existingDecks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {existingDecks.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeck(d)}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Question (Front of Card) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Write the active recall prompt..."
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Answer (Back of Card) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write the accurate target response..."
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Memory Anchor / Extra Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discovered by Hermann Ebbinghaus in 1885"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {editingCard ? 'Save Changes' : 'Create Flashcard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
