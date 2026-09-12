import { AppState, Flashcard, KnowledgeReference } from '../types';
import { addDays, getTodayDateString } from './sm2';

export const STORAGE_KEY = 'spaced_repetition_app_data_v2';

export const DEFAULT_DATA: AppState = {
  settings: {
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: false,
    dailyReminderTime: '19:00',
    lastReminderDate: '',
    dailyGoal: {
      target: 10,
      mode: 'combined',
    },
  },
  stats: {
    streak: 3,
    lastActiveDate: getTodayDateString(),
    totalReviewsCompleted: 14,
  },
  dailyLogs: [
    {
      id: 'log_seed_1',
      date: addDays(getTodayDateString(), -2),
      subject: 'Cognitive Psychology',
      title: 'The Forgetting Curve & Synaptic Consolidation',
      notes:
        'Learned how Hermann Ebbinghaus discovered memory decay. Without spaced repetition, over 70% of new information is forgotten within 48 hours. Active retrieval forces the brain to rebuild neural pathways.',
      confidence: 'breakthrough',
      references: [
        {
          id: 'ref_seed_1',
          title: 'Memory: A Contribution to Experimental Psychology',
          author: 'Hermann Ebbinghaus',
          type: 'book',
          locator: 'Chapter 3, pp. 45–58',
          quote: 'With considerable numbers of repetitions a surprising rapidity in the reproduction is attained.',
          url: 'https://archive.org/details/memorycontributi00ebbiuoft',
        },
        {
          id: 'ref_seed_2',
          title: 'Synaptic Plasticity and Memory Mechanisms',
          author: 'Nature Reviews Neuroscience',
          type: 'paper',
          locator: 'Vol. 15, Issue 2',
          quote: 'Spaced training induces protein synthesis-dependent long-term potentiation in CA1 neurons.',
          url: 'https://doi.org/10.1038/nrn3646',
        },
      ],
      cardIds: ['card_seed_1', 'card_seed_2'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'log_seed_2',
      date: addDays(getTodayDateString(), -1),
      subject: 'Memory Science',
      title: 'Active Recall vs. Passive Re-reading',
      notes:
        'Re-reading gives the illusion of competence. Only testing yourself (active recall) activates true synaptic plasticity. Combined with the SM-2 algorithm intervals, retention jumps to 90%+.',
      confidence: 'solid',
      references: [
        {
          id: 'ref_seed_3',
          title: 'The Critical Importance of Retrieval Practice in Long-Term Retention',
          author: 'Karpicke & Roediger (Science)',
          type: 'paper',
          locator: 'Science 319 (5865), 966-968',
          quote: 'Repeated retrieval practice produced large positive effects on long-term retention compared to repeated studying.',
          url: 'https://www.science.org/doi/10.1126/science.1152408',
        },
        {
          id: 'ref_seed_4',
          title: 'Building a Second Brain & Spaced Systems',
          author: 'Tiago Forte',
          type: 'book',
          locator: 'Part 2: Organize for Actionability',
          url: 'https://www.buildingasecondbrain.com',
        },
      ],
      cardIds: ['card_seed_3', 'card_seed_4', 'card_seed_5'],
      createdAt: new Date().toISOString(),
    },
  ],
  cards: [
    {
      id: 'card_seed_1',
      question: 'What is the Ebbinghaus Forgetting Curve?',
      answer:
        'A mathematical curve describing how information retention rapidly drops over time without active reinforcement. Approximately 50-70% is lost within 24-48 hours.',
      notes: 'Discovered by Hermann Ebbinghaus in 1885.',
      deck: 'Cognitive Science',
      tags: ['memory', 'psychology'],
      references: [
        {
          id: 'ref_card_1',
          title: 'Memory: A Contribution to Experimental Psychology (1885)',
          author: 'Hermann Ebbinghaus',
          type: 'book',
          locator: 'Section 7: Retention as Function of Time',
          quote: 'Left to itself, memory decays in an inverse logarithmic ratio to elapsed time.',
          url: 'https://archive.org/details/memorycontributi00ebbiuoft',
        },
      ],
      dailyLogId: 'log_seed_1',
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: getTodayDateString(), // Due today!
      lastReviewedDate: addDays(getTodayDateString(), -2),
      createdAt: new Date().toISOString(),
      createdDate: addDays(getTodayDateString(), -2),
      history: [],
    },
    {
      id: 'card_seed_2',
      question: 'How does Spaced Repetition counteract memory decay?',
      answer:
        'By re-testing memory at mathematically increasing intervals right as the memory is about to fade, flattening the forgetting curve and transferring knowledge into long-term neocortex storage.',
      notes: 'Each successful review increases the next interval exponentially.',
      deck: 'Cognitive Science',
      tags: ['spaced-repetition', 'neuroscience'],
      references: [
        {
          id: 'ref_card_2',
          title: 'Spacing Effect in Learning and Memory',
          author: 'Cepeda et al. (Psychological Bulletin)',
          type: 'paper',
          locator: 'Vol. 132(3), 354–380',
          url: 'https://pubmed.ncbi.nlm.nih.gov/16719566/',
        },
      ],
      dailyLogId: 'log_seed_1',
      repetition: 1,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: getTodayDateString(), // Due today!
      lastReviewedDate: addDays(getTodayDateString(), -1),
      createdAt: new Date().toISOString(),
      createdDate: addDays(getTodayDateString(), -2),
      history: [],
    },
    {
      id: 'card_seed_3',
      question: 'Why is Active Recall superior to passive re-reading or highlighting?',
      answer:
        'Passive review only stimulates recognition memory (illusion of competence). Active recall forces retrieval from scratch, engaging synaptic consolidation and long-term potentiation.',
      notes: 'Also known as the Testing Effect in educational research.',
      deck: 'Study Methods',
      tags: ['learning', 'active-recall'],
      references: [
        {
          id: 'ref_card_3',
          title: 'The Testing Effect: Retrieval Practice Produces Long-Term Learning',
          author: 'Roediger & Butler (Trends in Cognitive Sciences)',
          type: 'paper',
          locator: 'TICS Vol. 15(1), pp. 20-27',
          quote: 'Testing is not merely an assessment tool; it is a powerful learning event.',
          url: 'https://doi.org/10.1016/j.tics.2010.09.003',
        },
      ],
      dailyLogId: 'log_seed_2',
      repetition: 2,
      interval: 1,
      easeFactor: 2.6,
      nextReviewDate: getTodayDateString(), // Due today!
      lastReviewedDate: addDays(getTodayDateString(), -1),
      createdAt: new Date().toISOString(),
      createdDate: addDays(getTodayDateString(), -1),
      history: [],
    },
    {
      id: 'card_seed_4',
      question: 'What is the Leitner Box System?',
      answer:
        'A classic flashcard method where cards advance into higher boxes (reviewed less frequently) upon correct recall, but reset to Box 1 immediately upon a failure.',
      notes: 'Invented by Sebastian Leitner in the 1970s.',
      deck: 'Study Methods',
      tags: ['flashcards', 'leitner'],
      references: [
        {
          id: 'ref_card_4',
          title: 'So lernt man lernen (How to Learn to Learn)',
          author: 'Sebastian Leitner',
          type: 'book',
          locator: 'Freiburg 1972',
        },
      ],
      dailyLogId: 'log_seed_2',
      repetition: 1,
      interval: 3,
      easeFactor: 2.5,
      nextReviewDate: addDays(getTodayDateString(), 2), // Upcoming
      lastReviewedDate: addDays(getTodayDateString(), -1),
      createdAt: new Date().toISOString(),
      createdDate: addDays(getTodayDateString(), -1),
      history: [],
    },
    {
      id: 'card_seed_5',
      question: 'What are the two core variables calculated in the SM-2 algorithm?',
      answer:
        '1. Interval (number of days until the next scheduled review).\n2. Ease Factor (a dynamic multiplier starting around 2.5, adjusting up or down based on recall ease).',
      notes: 'Developed by Dr. Piotr Woźniak for SuperMemo in 1987.',
      deck: 'Algorithms',
      tags: ['sm-2', 'algorithms'],
      references: [
        {
          id: 'ref_card_5',
          title: 'Optimization of Learning (SuperMemo SM-2)',
          author: 'Dr. Piotr A. Woźniak',
          type: 'paper',
          locator: 'Master Thesis, University of Technology in Poznań (1990)',
          url: 'https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method',
        },
      ],
      dailyLogId: 'log_seed_2',
      repetition: 2,
      interval: 6,
      easeFactor: 2.5,
      nextReviewDate: addDays(getTodayDateString(), 5), // Upcoming
      lastReviewedDate: addDays(getTodayDateString(), -1),
      createdAt: new Date().toISOString(),
      createdDate: addDays(getTodayDateString(), -1),
      history: [],
    },
  ],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.cards && parsed.dailyLogs) {
        if (!parsed.settings) parsed.settings = {};
        if (!parsed.settings.dailyGoal) {
          parsed.settings.dailyGoal = { target: 10, mode: 'combined' };
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved state, using default data', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportCardsCsv(cards: Flashcard[]) {
  if (!cards || cards.length === 0) return;

  const headers = [
    'ID',
    'Deck',
    'Question_Front',
    'Answer_Back',
    'Notes',
    'Tags',
    'References_Citations',
    'Interval_Days',
    'Ease_Factor',
    'Repetitions',
    'Next_Review_Date',
    'Last_Reviewed_Date',
  ];

  const rows = cards.map((c) => {
    const refsFormatted = (c.references || [])
      .map((r) => `${r.title} [${r.type}]${r.locator ? ` (${r.locator})` : ''}${r.url ? ` <${r.url}>` : ''}`)
      .join(' | ');

    return [
      escapeCsvCell(c.id),
      escapeCsvCell(c.deck || 'General'),
      escapeCsvCell(c.question || ''),
      escapeCsvCell(c.answer || ''),
      escapeCsvCell(c.notes || ''),
      escapeCsvCell((c.tags || []).join('; ')),
      escapeCsvCell(refsFormatted),
      escapeCsvCell(c.interval ?? 0),
      escapeCsvCell(c.easeFactor ? Number(c.easeFactor).toFixed(2) : '2.50'),
      escapeCsvCell(c.repetition ?? 0),
      escapeCsvCell(c.nextReviewDate || ''),
      escapeCsvCell(c.lastReviewedDate || ''),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', url);
  dlAnchor.setAttribute('download', `flashcards_references_export_${getTodayDateString()}.csv`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDataJson(state: AppState) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `spaced_repetition_backup_${getTodayDateString()}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}
