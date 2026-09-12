import { Flashcard, KnowledgeTier, AppSettings, AppStats, DailyGoalSettings } from '../types';
import { playSound } from './audio';
import { getTier1Progress, DEFAULT_TIER_SETTINGS } from './sm2';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Returns current browser notification permission status safely.
 */
export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the browser.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const res = await Notification.requestPermission();
    return res;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return Notification.permission || 'denied';
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  soundType?: 'flip' | 'rate' | 'complete';
  soundEnabled?: boolean;
  onToastFallback?: (message: string, actionLabel?: string, onAction?: () => void) => void;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Sends a native notification if supported and permitted, with sound and in-app fallback.
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const {
    title,
    body,
    icon = '/pwa-192x192.png',
    badge = '/pwa-192x192.png',
    tag,
    soundType = 'complete',
    soundEnabled = true,
    onToastFallback,
    actionLabel,
    onAction,
  } = payload;

  // Play audio cue
  if (soundType && soundEnabled) {
    playSound(soundType, soundEnabled);
  }

  let sentNatively = false;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Prefer ServiceWorker showNotification if available for PWA background support
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              body,
              icon,
              badge,
              tag: tag || 'spaced-rep-alert',
              vibrate: [200, 100, 200],
            } as NotificationOptions);
            sentNatively = true;
          }
        } catch {
          // Fallback to standard Notification constructor
        }
      }

      if (!sentNatively) {
        new Notification(title, {
          body,
          icon,
          badge,
          tag: tag || 'spaced-rep-alert',
        });
        sentNatively = true;
      }
    } catch (err) {
      console.warn('Native notification dispatch error, using in-app fallback:', err);
    }
  }

  // Always invoke in-app toast fallback / visual confirmation
  if (onToastFallback) {
    onToastFallback(`${title}: ${body}`, actionLabel, onAction);
  }

  return sentNatively;
}

/**
 * 1. Primary Feature: Daily Spaced Repetition Due Reminder
 */
export function notifyDueCards(
  dueCards: Flashcard[],
  soundEnabled: boolean = true,
  onToast?: (msg: string, actionLabel?: string, onAction?: () => void) => void,
  onReviewAction?: () => void
) {
  const count = dueCards.length;
  if (count === 0) {
    return sendNotification({
      title: 'Memory Review Up to Date! 🧠',
      body: 'All flashcards are caught up for today. No recall reviews due right now.',
      soundType: 'complete',
      soundEnabled,
      onToastFallback: onToast,
    });
  }

  const t1Due = dueCards.filter((c) => (c.tier || 'tier1') === 'tier1').length;
  const t2Due = dueCards.filter((c) => c.tier === 'tier2').length;
  const t3Due = dueCards.filter((c) => c.tier === 'tier3').length;
  const customDue = dueCards.filter((c) => c.tier === 'custom').length;

  const breakdownParts: string[] = [];
  if (t1Due > 0) breakdownParts.push(`T1: ${t1Due}`);
  if (t2Due > 0) breakdownParts.push(`T2: ${t2Due}`);
  if (t3Due > 0) breakdownParts.push(`T3: ${t3Due}`);
  if (customDue > 0) breakdownParts.push(`Custom: ${customDue}`);

  const breakdownStr = breakdownParts.length > 0 ? ` (${breakdownParts.join(', ')})` : '';

  return sendNotification({
    title: 'Spaced Recall Due Today 🧠',
    body: `You have ${count} card${count === 1 ? '' : 's'} due for active recall${breakdownStr}. Keep your retention curve high!`,
    tag: 'due-today-reminder',
    soundType: 'complete',
    soundEnabled,
    actionLabel: 'Review Now →',
    onAction: onReviewAction,
    onToastFallback: onToast,
  });
}

/**
 * 2. Primary Feature: Daily Study Goal Reached Notification
 */
export function notifyGoalCompleted(
  target: number,
  mode: DailyGoalSettings['mode'],
  soundEnabled: boolean = true,
  onToast?: (msg: string) => void
) {
  const modeLabel = mode === 'created' ? 'created' : mode === 'reviewed' ? 'reviewed' : 'completed';
  return sendNotification({
    title: 'Daily Goal Achieved! 🎯🏆',
    body: `Incredible work! You reached your daily target of ${target} flashcards ${modeLabel}.`,
    tag: 'goal-achieved',
    soundType: 'complete',
    soundEnabled,
    onToastFallback: onToast,
  });
}

/**
 * 3. Primary Feature: Streak Habit Milestone Notification
 */
export function notifyStreakExtended(
  streak: number,
  soundEnabled: boolean = true,
  onToast?: (msg: string) => void
) {
  const isMilestone = streak === 3 || streak === 7 || streak === 14 || streak === 30 || streak === 60 || streak === 100;
  const title = isMilestone ? `🔥 ${streak}-Day Streak Milestone!` : `Streak Extended! 🔥`;
  const body = isMilestone
    ? `Remarkable consistency! You've maintained your spaced repetition habit for ${streak} consecutive days.`
    : `Daily streak is now ${streak} day${streak === 1 ? '' : 's'}. Active recall habit reinforced!`;

  return sendNotification({
    title,
    body,
    tag: 'streak-update',
    soundType: 'complete',
    soundEnabled,
    onToastFallback: onToast,
  });
}

/**
 * 4. Primary Feature: Tier 1 Graduation Milestone Ready
 */
export function notifyTier1GraduationReady(
  graduatingCardsCount: number,
  soundEnabled: boolean = true,
  onToast?: (msg: string, actionLabel?: string, onAction?: () => void) => void,
  onNavigateRetention?: () => void
) {
  if (graduatingCardsCount <= 0) return;

  return sendNotification({
    title: 'Tier 1 Graduation Ready! 🎓',
    body: `${graduatingCardsCount} flashcard${graduatingCardsCount === 1 ? '' : 's'} completed the 1-month foundation and can graduate to Tier 2 (3-day) or Tier 3 (2x/week)!`,
    tag: 'tier1-graduation',
    soundType: 'complete',
    soundEnabled,
    actionLabel: 'Graduation Center →',
    onAction: onNavigateRetention,
    onToastFallback: onToast,
  });
}

/**
 * 5. Primary Feature: Review Session Queue Finished
 */
export function notifyQueueFinished(
  reviewedCount: number,
  soundEnabled: boolean = true,
  onToast?: (msg: string) => void
) {
  return sendNotification({
    title: 'All Caught Up! ✨',
    body: `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} in this session. Memory retention active!`,
    tag: 'queue-finished',
    soundType: 'complete',
    soundEnabled,
    onToastFallback: onToast,
  });
}

/**
 * 6. Primary Feature: Daily Log & Citations Recorded
 */
export function notifyDailyLogCreated(
  title: string,
  newCardsCount: number,
  referencesCount: number,
  soundEnabled: boolean = true,
  onToast?: (msg: string) => void
) {
  return sendNotification({
    title: 'Learning Log & Citations Saved 📝',
    body: `Saved "${title}" with ${newCardsCount} spaced flashcard${newCardsCount === 1 ? '' : 's'} and ${referencesCount} citation reference${referencesCount === 1 ? '' : 's'}.`,
    tag: 'log-created',
    soundType: 'rate',
    soundEnabled,
    onToastFallback: onToast,
  });
}

/**
 * 7. Primary Feature: Batch Notebook Import Completed
 */
export function notifyNotebookImported(
  totalImported: number,
  deckName: string,
  soundEnabled: boolean = true,
  onToast?: (msg: string, actionLabel?: string, onAction?: () => void) => void,
  onReviewAction?: () => void
) {
  return sendNotification({
    title: 'Flashcards Imported 📋',
    body: `Successfully imported ${totalImported} card${totalImported === 1 ? '' : 's'} into deck "${deckName}".`,
    tag: 'notebook-imported',
    soundType: 'rate',
    soundEnabled,
    actionLabel: 'Start Review →',
    onAction: onReviewAction,
    onToastFallback: onToast,
  });
}

/**
 * Helper to check time and trigger scheduled daily notification if due
 */
export function checkScheduledDailyReminder(
  todayDateStr: string,
  dueCards: Flashcard[],
  settings: AppSettings,
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void,
  onToast?: (msg: string, actionLabel?: string, onAction?: () => void) => void,
  onReviewAction?: () => void
) {
  if (!settings.notificationsEnabled) return;
  if (settings.lastReminderDate === todayDateStr) return; // Already reminded today

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const reminderTime = settings.dailyReminderTime || '19:00';
  const [targetH, targetM] = reminderTime.split(':').map((v) => parseInt(v, 10) || 0);

  // Check if current time is past or equal to reminder time
  const currentTotalMins = currentHours * 60 + currentMinutes;
  const targetTotalMins = targetH * 60 + targetM;

  if (currentTotalMins >= targetTotalMins) {
    if (dueCards.length > 0) {
      notifyDueCards(dueCards, settings.soundEnabled, onToast, onReviewAction);
    }
    // Mark as notified today
    onUpdateSettings({ lastReminderDate: todayDateStr });
  }
}
