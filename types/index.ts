export interface CardHistoryEntry {
  date: string;
  rating: number; // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  interval: number;
  easeFactor: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  notes?: string;
  deck: string;
  tags: string[];
  dailyLogId?: string | null;
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string | null;
  createdAt?: string;
  createdDate?: string;
  history: CardHistoryEntry[];
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
  title: string;
  notes: string;
  confidence: 'breakthrough' | 'solid' | 'challenging';
  cardIds: string[];
  createdAt: string;
}

export interface DailyGoalSettings {
  target: number;
  mode: 'combined' | 'reviewed' | 'created';
}

export interface AppSettings {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  lastReminderDate: string;
  dailyGoal: DailyGoalSettings;
}

export interface AppStats {
  streak: number;
  lastActiveDate: string;
  totalReviewsCompleted: number;
}

export interface AppState {
  settings: AppSettings;
  stats: AppStats;
  dailyLogs: DailyLog[];
  cards: Flashcard[];
}

export interface SM2Result {
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewedDate: string;
}

export interface ParsedNotebookCard {
  type: string;
  typeLabel: string;
  question: string;
  answer: string;
}
