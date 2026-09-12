import React, { useState } from 'react';
import { KnowledgeReference, ReferenceType } from '../types';
import {
  Book,
  FileText,
  Video,
  GraduationCap,
  Newspaper,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  Bookmark,
  Quote,
  Layers,
} from 'lucide-react';

interface ReferenceManagerProps {
  references: KnowledgeReference[];
  onChange: (refs: KnowledgeReference[]) => void;
  isEditable?: boolean;
}

export const getRefTypeIcon = (type: ReferenceType) => {
  switch (type) {
    case 'book':
      return <Book className="w-3.5 h-3.5 text-amber-400" />;
    case 'paper':
      return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    case 'video':
      return <Video className="w-3.5 h-3.5 text-rose-400" />;
    case 'lecture':
      return <GraduationCap className="w-3.5 h-3.5 text-purple-400" />;
    case 'article':
      return <Newspaper className="w-3.5 h-3.5 text-emerald-400" />;
    case 'course':
      return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
    default:
      return <Globe className="w-3.5 h-3.5 text-slate-400" />;
  }
};

export const getRefTypeLabel = (type: ReferenceType) => {
  switch (type) {
    case 'book':
      return 'Book Citation';
    case 'paper':
      return 'Research Paper';
    case 'video':
      return 'Video / Lecture';
    case 'lecture':
      return 'Class Lecture';
    case 'article':
      return 'Article';
    case 'course':
      return 'Online Course';
    default:
      return 'Web Reference';
  }
};

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  references = [],
  onChange,
  isEditable = true,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newType, setNewType] = useState<ReferenceType>('book');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newLocator, setNewLocator] = useState<string>('');
  const [newQuote, setNewQuote] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRef: KnowledgeReference = {
      id: 'ref_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      title: newTitle.trim(),
      author: newAuthor.trim() || undefined,
      type: newType,
      url: newUrl.trim() || undefined,
      locator: newLocator.trim() || undefined,
      quote: newQuote.trim() || undefined,
    };

    onChange([...references, newRef]);

    // Reset Form
    setNewTitle('');
    setNewAuthor('');
    setNewUrl('');
    setNewLocator('');
    setNewQuote('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(references.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-blue-400" />
          <span>Knowledge References &amp; Memory Sources ({references.length})</span>
        </label>

        {isEditable && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Close Form' : 'Add Reference'}
          </button>
        )}
      </div>

      {/* Inline Form to Add Reference */}
      {isEditable && showAddForm && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>Add Study Citation / Source</span>
            <span className="text-[11px] text-slate-400 font-normal">Reinforces active recall with proof</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Source Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Memory: A Contribution to Experimental Psychology"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Author / Institution</label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="e.g. Hermann Ebbinghaus / Stanford"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Source Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ReferenceType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="book">Book Citation 📖</option>
                <option value="paper">Research Paper 📄</option>
                <option value="lecture">Class Lecture 🎓</option>
                <option value="video">Video / Talk 🎥</option>
                <option value="article">Article / Journal 📰</option>
                <option value="course">Online Course 💻</option>
                <option value="link">Web Link 🔗</option>
                <option value="other">Other Reference 📌</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Chapter / Page / Timestamp</label>
              <input
                type="text"
                value={newLocator}
                onChange={(e) => setNewLocator(e.target.value)}
                placeholder="e.g. Chapter 4, pp. 45–50, or 12:45"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">URL / DOI Link (Optional)</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Key Quote or Excerpt (Optional)</label>
            <input
              type="text"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder="e.g. Memory decays logarithmically without active rehearsal..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-sm"
            >
              Attach Reference
            </button>
          </div>
        </div>
      )}

      {/* Render Attached References */}
      {references.length > 0 ? (
        <div className="space-y-2">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs group hover:border-slate-700 transition"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px]">
                    {getRefTypeIcon(ref.type)}
                    <span>{getRefTypeLabel(ref.type)}</span>
                  </span>

                  <span className="font-bold text-white truncate">{ref.title}</span>

                  {ref.author && (
                    <span className="text-slate-400 text-[11px]">by {ref.author}</span>
                  )}

                  {ref.locator && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">
                      📍 {ref.locator}
                    </span>
                  )}
                </div>

                {ref.quote && (
                  <div className="flex items-center gap-1.5 text-slate-300 italic text-[11px] pt-0.5">
                    <Quote className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>&ldquo;{ref.quote}&rdquo;</span>
                  </div>
                )}

                {ref.url && (
                  <div className="pt-0.5">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-xs">{ref.url}</span>
                    </a>
                  </div>
                )}
              </div>

              {isEditable && (
                <button
                  type="button"
                  onClick={() => handleRemove(ref.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition shrink-0"
                  title="Remove reference"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="text-[11px] text-slate-500 italic p-2 rounded-xl bg-slate-950/30 border border-slate-900">
            No source references attached yet. Add citations to anchor flashcards and notes to credible study materials.
          </div>
        )
      )}
    </div>
  );
};
