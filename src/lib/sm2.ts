import { Flashcard, SM2Result } from '../types';

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
 * SuperMemo SM-2 calculation
 * @param card The current flashcard
 * @param quality 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export function calculateSM2(card: Flashcard, quality: number): SM2Result {
  const today = getTodayDateString();
  let repetition = card.repetition || 0;
  let interval = card.interval || 0;
  let easeFactor = card.easeFactor || 2.5;

  if (quality === 1) {
    // Again: Failure, reset repetition and schedule tomorrow
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Quality >= 2 (Hard, Good, Easy)
    if (repetition === 0) {
      interval = quality === 2 ? 1 : quality === 4 ? 2 : 1;
      repetition = 1;
    } else if (repetition === 1) {
      interval = quality === 2 ? 2 : quality === 4 ? 6 : 4;
      repetition = 2;
    } else {
      let multiplier = easeFactor;
      if (quality === 2) {
        multiplier = 1.2; // Hard: smaller step
      } else if (quality === 4) {
        multiplier = easeFactor * 1.3; // Easy: bonus multiplier
      }
      interval = Math.round(interval * multiplier);
      repetition += 1;
    }

    // Update Ease Factor for SM-2
    const qSM2 = quality === 4 ? 5 : quality === 3 ? 4 : quality === 2 ? 3 : 0;
    const efDelta = 0.1 - (5 - qSM2) * (0.08 + (5 - qSM2) * 0.02);
    easeFactor = Math.max(1.3, easeFactor + efDelta);
  }

  interval = Math.max(1, Math.min(interval, 365));
  const nextReviewDate = addDays(today, interval);

  return {
    repetition,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    nextReviewDate,
    lastReviewedDate: today,
  };
}

export function getSM2Previews(card: Flashcard): { again: string; hard: string; good: string; easy: string } {
  const rAgain = calculateSM2(card, 1);
  const rHard = calculateSM2(card, 2);
  const rGood = calculateSM2(card, 3);
  const rEasy = calculateSM2(card, 4);

  return {
    again: `${rAgain.interval}d`,
    hard: `${rHard.interval}d`,
    good: `${rGood.interval}d`,
    easy: `${rEasy.interval}d`,
  };
}
