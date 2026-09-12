export type ReferenceType = 'book' | 'paper' | 'article' | 'video' | 'lecture' | 'course' | 'link' | 'other';

export type KnowledgeTier = 'tier1' | 'tier2' | 'tier3' | 'custom';

export interface KnowledgeReference {
  id: string;
  title: string;
  url?: string;
  type: ReferenceType;
  locator?: string; // Chapter, page number, timestamp, or section
  quote?: string;   // Excerpt or definition citation
  author?: string;
}

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
  references?: KnowledgeReference[];
  dailyLogId?: string | null;
  // Tier-based reminder system
  tier?: KnowledgeTier;
  tierStartedDate?: string; // YYYY-MM-DD when Tier 1 or current tier began
  tierCyclesCompleted?: number; // Count of successful recall reviews in this tier
  customIntervalDays?: number; // User-defined frequency from then on (e.g. 7, 14, 30)
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
  references?: KnowledgeReference[];
  cardIds: string[];
  createdAt: string;
}

export interface DailyGoalSettings {
  target: number;
  mode: 'combined' | 'reviewed' | 'created';
}

export interface TierSettings {
  tier1Interval: number; // Default: 2 days
  tier1MonthDays: number; // Default: 30 days
  tier2Interval: number; // Default: 3 days
  tier3Interval: number; // Default: 3.5 (alternating 3 and 4 days / twice a week)
  defaultPostMonthFrequency: 'tier2' | 'tier3' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  defaultCustomDays: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  lastReminderDate: string;
  dailyGoal: DailyGoalSettings;
  tierSettings?: TierSettings;
}

export interface AppStats {
  streak: number;
  lastActiveDate: string;
  totalReviewsCompleted: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  tierCyclesCompleted?: number;
  tier?: KnowledgeTier;
}

export interface ParsedNotebookCard {
  type: string;
  typeLabel: string;
  question: string;
  answer: string;
  tier?: KnowledgeTier;
  customIntervalDays?: number;
  references?: KnowledgeReference[];
}
