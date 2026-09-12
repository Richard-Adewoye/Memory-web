import { Flashcard, SM2Result, KnowledgeTier, TierSettings } from '../types';

export const DEFAULT_TIER_SETTINGS: TierSettings = {
  tier1Interval: 2, // Every 2 days
  tier1MonthDays: 30, // 1 month
  tier2Interval: 3, // Every 3 days
  tier3Interval: 3.5, // Twice a week (alternates 3 and 4 days)
  defaultPostMonthFrequency: 'tier2',
  defaultCustomDays: 7, // Weekly default for custom
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function daysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateHuman(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check Tier 1 month duration progress
 */
export function getTier1Progress(card: Flashcard, monthDays = 30): {
  daysElapsed: number;
  totalDays: number;
  percent: number;
  isMonthCompleted: boolean;
  cyclesCompleted: number;
} {
  const today = getTodayDateString();
  const startDate = card.tierStartedDate || card.createdDate || today;
  const daysElapsed = Math.max(0, daysDifference(today, startDate));
  const cyclesCompleted = card.tierCyclesCompleted || 0;
  const isMonthCompleted = daysElapsed >= monthDays || cyclesCompleted >= Math.round(monthDays / 2);
  const percent = Math.min(100, Math.round((Math.max(daysElapsed, cyclesCompleted * 2) / monthDays) * 100));

  return {
    daysElapsed,
    totalDays: monthDays,
    percent,
    isMonthCompleted,
    cyclesCompleted,
  };
}

/**
 * Helper to get description label of a tier
 */
export function getTierDescription(tier?: KnowledgeTier, customInterval = 7): string {
  switch (tier) {
    case 'tier1':
      return 'Tier 1: 2-Day Interval (1 Month Duration)';
    case 'tier2':
      return 'Tier 2: 3-Day Interval';
    case 'tier3':
      return 'Tier 3: Twice a Week (3–4 Day Interval)';
    case 'custom':
      return `Custom Frequency: Every ${customInterval} Day${customInterval === 1 ? '' : 's'}`;
    default:
      return 'Tier 1: 2-Day Interval (1 Month)';
  }
}

/**
 * Calculate next review interval based on Knowledge Tier & Recall Quality
 * @param card The current flashcard
 * @param quality 1=Again (Reset/Fail), 2=Hard, 3=Good, 4=Easy
 * @param tierSettings App tier settings
 */
export function calculateSM2(
  card: Flashcard,
  quality: number,
  tierSettings: TierSettings = DEFAULT_TIER_SETTINGS
): SM2Result {
  const today = getTodayDateString();
  const currentTier: KnowledgeTier = card.tier || 'tier1';
  let repetition = card.repetition || 0;
  let interval = card.interval || 0;
  let easeFactor = card.easeFactor || 2.5;
  let tierCyclesCompleted = card.tierCyclesCompleted || 0;

  if (quality === 1) {
    // Again: Recall failed -> Schedule 1 day review immediately to consolidate memory
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (quality === 2) {
    // Hard: Difficult recall -> Schedule shortened interval (1-2 days)
    interval = currentTier === 'tier1' ? 1 : 2;
    repetition += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    tierCyclesCompleted += 1;
  } else {
    // Good (3) or Easy (4): Standard Tier intervals
    repetition += 1;
    tierCyclesCompleted += 1;

    if (currentTier === 'tier1') {
      // Tier 1: Every 2 days
      interval = tierSettings.tier1Interval || 2;
    } else if (currentTier === 'tier2') {
      // Tier 2: Every 3 days
      interval = tierSettings.tier2Interval || 3;
    } else if (currentTier === 'tier3') {
      // Tier 3: Twice a week -> alternate between 3 and 4 days for a 7-day week
      const isEvenCycle = tierCyclesCompleted % 2 === 0;
      interval = isEvenCycle ? 4 : 3;
    } else if (currentTier === 'custom') {
      // Custom user-decided frequency
      interval = Math.max(1, card.customIntervalDays || tierSettings.defaultCustomDays || 7);
    } else {
      interval = 2;
    }

    // Easy bonus: add 1 day buffer if Easy (4)
    if (quality === 4 && currentTier !== 'tier1') {
      interval += 1;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    }
  }

  interval = Math.max(1, Math.min(interval, 365));
  const nextReviewDate = addDays(today, interval);

  return {
    repetition,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    nextReviewDate,
    lastReviewedDate: today,
    tierCyclesCompleted,
    tier: currentTier,
  };
}

export function getSM2Previews(
  card: Flashcard,
  tierSettings: TierSettings = DEFAULT_TIER_SETTINGS
): { again: string; hard: string; good: string; easy: string } {
  const rAgain = calculateSM2(card, 1, tierSettings);
  const rHard = calculateSM2(card, 2, tierSettings);
  const rGood = calculateSM2(card, 3, tierSettings);
  const rEasy = calculateSM2(card, 4, tierSettings);

  return {
    again: `${rAgain.interval}d`,
    hard: `${rHard.interval}d`,
    good: `${rGood.interval}d`,
    easy: `${rEasy.interval}d`,
  };
}
