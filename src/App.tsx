import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Flashcard,
  DailyLog,
  SM2Result,
  ParsedNotebookCard,
  DailyGoalSettings,
  AppSettings,
  UserProfile,
  KnowledgeReference,
  KnowledgeTier,
} from './types';
import {
  loadState,
  saveState,
  DEFAULT_DATA,
  exportCardsCsv,
  exportDataJson,
} from './lib/storage';
import {
  subscribeToAuth,
  signInWithGoogle,
  logoutUser,
  loadUserDataFromFirestore,
  syncAppStateToFirestore,
  deleteCardFromFirestore,
  deleteLogFromFirestore,
} from './lib/firebase';
import { getTodayDateString, addDays, getTier1Progress, DEFAULT_TIER_SETTINGS } from './lib/sm2';
import { playSound } from './lib/audio';
import {
  notifyDueCards,
  notifyGoalCompleted,
  notifyStreakExtended,
  notifyTier1GraduationReady,
  notifyQueueFinished,
  notifyDailyLogCreated,
  notifyNotebookImported,
  checkScheduledDailyReminder,
} from './lib/notifications';
import { Header } from './components/Header';
import { DailyGoalTracker } from './components/DailyGoalTracker';
import { ReviewTab } from './components/ReviewTab';
import { DailyLogTab } from './components/DailyLogTab';
import { NotebookTab } from './components/NotebookTab';
import { LibraryTab } from './components/LibraryTab';
import { RetentionTab } from './components/RetentionTab';
import { CardModal } from './components/CardModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Bell, BookOpen, X } from 'lucide-react';

export default function App() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(DEFAULT_DATA);
  const [activeTab, setActiveTab] = useState<string>('tab-review');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showReminderBanner, setShowReminderBanner] = useState<boolean>(true);

  // Firebase Auth & Cloud Sync State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Toast System
  const showToast = useCallback(
    (message: string, actionText?: string, onAction?: () => void) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, message, actionText, onAction }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load state on mount (from local storage)
  useEffect(() => {
    const loaded = loadState();
    setAppState(loaded);
    setMounted(true);

    const theme = loaded.settings?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Attempt to load existing cloud data from Firestore
        try {
          setIsSyncing(true);
          const cloudData = await loadUserDataFromFirestore(currentUser.uid);
          if (cloudData && (cloudData.cards?.length || cloudData.dailyLogs?.length)) {
            setAppState((prev) => ({
              ...prev,
              settings: cloudData.settings ? { ...prev.settings, ...cloudData.settings } : prev.settings,
              stats: cloudData.stats ? { ...prev.stats, ...cloudData.stats } : prev.stats,
              cards: cloudData.cards || prev.cards,
              dailyLogs: cloudData.dailyLogs || prev.dailyLogs,
            }));
            showToast(`Welcome back, ${currentUser.displayName || 'Learner'}! Loaded cloud database.`);
          } else {
            // First time login - upload current state to Firestore
            await syncAppStateToFirestore(currentUser.uid, appState);
            showToast(`Signed in! Initialized Firestore cloud database for ${currentUser.displayName || 'Learner'}.`);
          }
        } catch (err) {
          console.error('Firestore sync error on auth change:', err);
          showToast('Signed in. Could not sync with Firestore.');
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save state whenever appState updates
  useEffect(() => {
    if (mounted) {
      saveState(appState);

      // Also sync to Firestore if user is authenticated
      if (user) {
        syncAppStateToFirestore(user.uid, appState).catch((err) => {
          console.error('Background Firestore sync error', err);
        });
      }
    }
  }, [appState, mounted, user]);

  const today = getTodayDateString();

  // Theme & Sound Handlers
  const handleToggleTheme = () => {
    const nextTheme = appState.settings.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    setAppState((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme: nextTheme },
    }));
    showToast(`Theme switched to ${nextTheme} mode`);
  };

  const handleToggleSound = () => {
    const nextSound = !appState.settings.soundEnabled;
    setAppState((prev) => ({
      ...prev,
      settings: { ...prev.settings, soundEnabled: nextSound },
    }));
    showToast(nextSound ? '🔊 Audio cues enabled' : '🔇 Audio muted');
  };

  const handleUpdateGoalSettings = (newGoal: Partial<DailyGoalSettings>) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        dailyGoal: { ...prev.settings.dailyGoal, ...newGoal },
      },
    }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setAppState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    showToast('Settings saved successfully');
  };

  // Auth Action Handlers
  const handleSignIn = async () => {
    try {
      setIsSyncing(true);
      const res = await signInWithGoogle();
      showToast(`Signed in as ${res.displayName || res.email}!`);
    } catch (err: unknown) {
      console.error('Google Sign-in failed', err);
      showToast('Google Sign-In was cancelled or failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      showToast('Signed out. Local offline mode active.');
    } catch (err) {
      console.error('Sign out error', err);
      showToast('Error signing out.');
    }
  };

  const handleManualCloudSync = async () => {
    if (!user) {
      handleSignIn();
      return;
    }
    try {
      setIsSyncing(true);
      await syncAppStateToFirestore(user.uid, appState);
      playSound('complete', appState.settings.soundEnabled);
      showToast('Cloud database synchronized successfully with Firestore! ☁️');
    } catch (err) {
      console.error('Manual sync failed', err);
      showToast('Cloud sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Unique Decks List
  const existingDecks = useMemo(() => {
    const set = new Set<string>();
    (appState.cards || []).forEach((c) => {
      if (c.deck && c.deck.trim()) set.add(c.deck.trim());
    });
    return Array.from(set);
  }, [appState.cards]);

  // Due count today
  const dueTodayCards = useMemo(() => {
    return (appState.cards || []).filter((c) => !c.nextReviewDate || c.nextReviewDate <= today);
  }, [appState.cards, today]);

  // Scheduled Daily Reminder Interval Check
  useEffect(() => {
    if (!mounted) return;
    const checkReminder = () => {
      checkScheduledDailyReminder(
        today,
        dueTodayCards,
        appState.settings,
        (newSettings) => {
          setAppState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings },
          }));
        },
        showToast,
        () => setActiveTab('tab-review')
      );
    };

    // Check on mount and periodically every 30 seconds
    checkReminder();
    const intervalId = setInterval(checkReminder, 30000);
    return () => clearInterval(intervalId);
  }, [mounted, today, dueTodayCards, appState.settings, showToast]);

  // Created Today & Reviewed Today metrics for Daily Goal
  const createdTodayCount = useMemo(() => {
    return (appState.cards || []).filter((c) => {
      if (c.createdAt && c.createdAt.startsWith(today)) return true;
      if (c.createdDate === today) return true;
      if (c.dailyLogId) {
        const log = (appState.dailyLogs || []).find((l) => l.id === c.dailyLogId);
        if (log && log.date === today) return true;
      }
      return false;
    }).length;
  }, [appState.cards, appState.dailyLogs, today]);

  const reviewedTodayCount = useMemo(() => {
    return (appState.cards || []).filter((c) => {
      if (c.lastReviewedDate === today) return true;
      if (c.history && Array.isArray(c.history) && c.history.some((h) => h.date === today)) return true;
      return false;
    }).length;
  }, [appState.cards, today]);

  // Streak update helper
  const updateStreak = (currentStats: AppState['stats']): AppState['stats'] => {
    const lastActive = currentStats.lastActiveDate;
    if (!lastActive) {
      return { ...currentStats, streak: 1, lastActiveDate: today };
    }
    if (lastActive === today) {
      return currentStats;
    }
    const diff = Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / 86400000);
    if (diff === 1) {
      return { ...currentStats, streak: (currentStats.streak || 0) + 1, lastActiveDate: today };
    } else {
      return { ...currentStats, streak: 1, lastActiveDate: today };
    }
  };

  // Card Reviewed in SM-2 Spaced Repetition Tab
  const handleCardReviewed = (cardId: string, updatedMetrics: SM2Result, quality: number) => {
    const prevReviewed = reviewedTodayCount;
    const prevCreated = createdTodayCount;
    const targetGoal = appState.settings.dailyGoal?.target || 10;
    const goalMode = appState.settings.dailyGoal?.mode || 'combined';

    const prevGoalMetric = goalMode === 'created' ? prevCreated : goalMode === 'reviewed' ? prevReviewed : (prevCreated + prevReviewed);
    const newGoalMetric = goalMode === 'created' ? prevCreated : goalMode === 'reviewed' ? (prevReviewed + 1) : (prevCreated + prevReviewed + 1);

    const prevStreak = appState.stats.streak || 0;
    const remainingDue = dueTodayCards.length;

    setAppState((prev) => {
      let graduatedCardAlert = false;
      const updatedCards = prev.cards.map((c) => {
        if (c.id === cardId) {
          const historyEntry = {
            date: today,
            rating: quality,
            interval: updatedMetrics.interval,
            easeFactor: updatedMetrics.easeFactor,
          };
          const updatedCard = {
            ...c,
            repetition: updatedMetrics.repetition,
            interval: updatedMetrics.interval,
            easeFactor: updatedMetrics.easeFactor,
            nextReviewDate: updatedMetrics.nextReviewDate,
            lastReviewedDate: today,
            tierCyclesCompleted: (c.tierCyclesCompleted || 0) + 1,
            history: [...(c.history || []), historyEntry],
          };

          if ((updatedCard.tier || 'tier1') === 'tier1') {
            const tierSettings = prev.settings.tierSettings || DEFAULT_TIER_SETTINGS;
            const progress = getTier1Progress(updatedCard, tierSettings.tier1MonthDays);
            if (progress.isMonthCompleted) {
              graduatedCardAlert = true;
            }
          }

          return updatedCard;
        }
        return c;
      });

      const updatedStats = updateStreak({
        ...prev.stats,
        totalReviewsCompleted: (prev.stats.totalReviewsCompleted || 0) + 1,
      });

      // 1. Streak habit notification
      if (updatedStats.streak > prevStreak) {
        notifyStreakExtended(updatedStats.streak, prev.settings.soundEnabled, showToast);
      }

      // 2. Goal completion notification
      if (prevGoalMetric < targetGoal && newGoalMetric >= targetGoal) {
        notifyGoalCompleted(targetGoal, goalMode, prev.settings.soundEnabled, showToast);
      }

      // 3. Queue finished notification or graduation notification
      if (remainingDue <= 1) {
        notifyQueueFinished(prevReviewed + 1, prev.settings.soundEnabled, showToast);
      } else if (graduatedCardAlert) {
        notifyTier1GraduationReady(1, prev.settings.soundEnabled, showToast, () => setActiveTab('tab-reminders'));
      }

      return {
        ...prev,
        cards: updatedCards,
        stats: updatedStats,
      };
    });
  };

  // Knowledge Tier Management Handler (Individual Card)
  const handleUpdateCardTier = (cardId: string, tier: KnowledgeTier, customIntervalDays?: number) => {
    setAppState((prev) => {
      const updatedCards = prev.cards.map((c) => {
        if (c.id === cardId) {
          let interval = c.interval;
          let nextReviewDate = c.nextReviewDate;

          if (tier === 'tier1') {
            interval = 2;
            nextReviewDate = addDays(today, 2);
          } else if (tier === 'tier2') {
            interval = 3;
            nextReviewDate = addDays(today, 3);
          } else if (tier === 'tier3') {
            interval = 3;
            nextReviewDate = addDays(today, 3);
          } else if (tier === 'custom') {
            const days = customIntervalDays || 7;
            interval = days;
            nextReviewDate = addDays(today, days);
          }

          return {
            ...c,
            tier,
            tierStartedDate: tier === 'tier1' ? (c.tierStartedDate || today) : undefined,
            tierCyclesCompleted: tier === 'tier1' ? (c.tierCyclesCompleted || 0) : 0,
            customIntervalDays: tier === 'custom' ? (customIntervalDays || 7) : undefined,
            interval,
            nextReviewDate,
          };
        }
        return c;
      });

      return {
        ...prev,
        cards: updatedCards,
      };
    });

    const tierLabels: Record<KnowledgeTier, string> = {
      tier1: 'Tier 1 (Every 2 Days / 1 Month)',
      tier2: 'Tier 2 (Every 3 Days)',
      tier3: 'Tier 3 (Twice a Week)',
      custom: `Custom (${customIntervalDays || 7} Days)`,
    };
    showToast(`Card updated to ${tierLabels[tier]}!`);
  };

  // Batch Graduation of Tier 1 Cards (after 1-month milestone)
  const handleBatchGraduateTier1 = (targetTier: KnowledgeTier, customDays?: number) => {
    let count = 0;
    const tierSettings = appState.settings.tierSettings || DEFAULT_TIER_SETTINGS;

    setAppState((prev) => {
      const updatedCards = prev.cards.map((c) => {
        if ((c.tier || 'tier1') === 'tier1' && getTier1Progress(c, tierSettings.tier1MonthDays).isMonthCompleted) {
          count += 1;
          let interval = 3;
          if (targetTier === 'tier2') interval = 3;
          else if (targetTier === 'tier3') interval = 3;
          else if (targetTier === 'custom') interval = customDays || 7;

          return {
            ...c,
            tier: targetTier,
            customIntervalDays: targetTier === 'custom' ? (customDays || 7) : undefined,
            interval,
            nextReviewDate: addDays(today, interval),
          };
        }
        return c;
      });

      return {
        ...prev,
        cards: updatedCards,
      };
    });

    playSound('complete', appState.settings.soundEnabled);
    showToast(`Graduated ${count} cards from Tier 1 foundation to ${targetTier.toUpperCase()}! 🎓`);
  };

  // Save Daily Log with attached flashcards and references
  const handleSaveDailyLog = (
    logData: Omit<DailyLog, 'id' | 'createdAt'>,
    newCardsData: {
      question: string;
      answer: string;
      tier?: KnowledgeTier;
      customIntervalDays?: number;
      references?: KnowledgeReference[];
    }[]
  ) => {
    const logId = 'log_' + Date.now();
    const createdCardIds: string[] = [];
    const newCards: Flashcard[] = [];

    newCardsData.forEach((cData, idx) => {
      const cardId = 'card_' + Date.now() + '_' + idx;
      createdCardIds.push(cardId);
      const tier: KnowledgeTier = cData.tier || 'tier1';

      let interval = 2;
      if (tier === 'tier1') interval = 2;
      else if (tier === 'tier2') interval = 3;
      else if (tier === 'tier3') interval = 3;
      else if (tier === 'custom') interval = cData.customIntervalDays || 7;

      newCards.push({
        id: cardId,
        question: cData.question,
        answer: cData.answer,
        notes: `Created from daily log: "${logData.title}" (${logData.subject})`,
        deck: logData.subject,
        tags: ['daily-log', logData.subject.toLowerCase().replace(/\s+/g, '-')],
        references: cData.references || logData.references,
        dailyLogId: logId,
        repetition: 0,
        interval,
        easeFactor: 2.5,
        tier,
        tierStartedDate: tier === 'tier1' ? today : undefined,
        tierCyclesCompleted: 0,
        customIntervalDays: tier === 'custom' ? cData.customIntervalDays : undefined,
        nextReviewDate: addDays(logData.date || today, interval),
        lastReviewedDate: logData.date || today,
        createdAt: new Date().toISOString(),
        createdDate: today,
        history: [],
      });
    });

    const newLog: DailyLog = {
      ...logData,
      id: logId,
      cardIds: createdCardIds,
      createdAt: new Date().toISOString(),
    };

    const prevReviewed = reviewedTodayCount;
    const prevCreated = createdTodayCount;
    const targetGoal = appState.settings.dailyGoal?.target || 10;
    const goalMode = appState.settings.dailyGoal?.mode || 'combined';
    const prevGoalMetric = goalMode === 'created' ? prevCreated : goalMode === 'reviewed' ? prevReviewed : (prevCreated + prevReviewed);
    const newGoalMetric = goalMode === 'created' ? (prevCreated + newCards.length) : goalMode === 'reviewed' ? prevReviewed : (prevCreated + newCards.length + prevReviewed);

    setAppState((prev) => {
      const updatedStats = updateStreak(prev.stats);
      return {
        ...prev,
        dailyLogs: [newLog, ...prev.dailyLogs],
        cards: [...newCards, ...prev.cards],
        stats: updatedStats,
      };
    });

    notifyDailyLogCreated(
      logData.title,
      newCards.length,
      (logData.references || []).length,
      appState.settings.soundEnabled,
      showToast
    );

    if (prevGoalMetric < targetGoal && newGoalMetric >= targetGoal) {
      notifyGoalCompleted(targetGoal, goalMode, appState.settings.soundEnabled, showToast);
    }
  };

  // Delete Daily Log
  const handleDeleteLog = (logId: string) => {
    if (user) {
      deleteLogFromFirestore(user.uid, logId);
    }
    setAppState((prev) => ({
      ...prev,
      dailyLogs: prev.dailyLogs.filter((l) => l.id !== logId),
    }));
    showToast('Daily learning entry deleted');
  };

  // Batch import from Notebook Tab
  const handleImportBatch = (
    parsed: ParsedNotebookCard[],
    deckName: string,
    scheduleMode: 'today' | 'stagger' | 'tomorrow',
    saveToDailyLog: boolean,
    dailyLogTitle: string,
    rawText: string,
    batchTier: KnowledgeTier = 'tier1',
    batchCustomDays: number = 7
  ) => {
    const createdCardIds: string[] = [];
    const newCards: Flashcard[] = [];
    const logId = 'log_' + Date.now();

    parsed.forEach((c, idx) => {
      const cardId = 'card_' + Date.now() + '_' + idx;
      createdCardIds.push(cardId);
      const tier = c.tier || batchTier;
      const customDays = c.customIntervalDays || batchCustomDays;

      let nextReviewDate = today;
      let interval = 2;

      if (tier === 'tier1') {
        interval = 2;
      } else if (tier === 'tier2') {
        interval = 3;
      } else if (tier === 'tier3') {
        interval = 3;
      } else if (tier === 'custom') {
        interval = customDays;
      }

      if (scheduleMode === 'tomorrow') {
        nextReviewDate = addDays(today, 1);
      } else if (scheduleMode === 'stagger') {
        const staggerOffset = (idx % 3) + 1;
        nextReviewDate = addDays(today, staggerOffset);
      } else if (scheduleMode === 'today') {
        nextReviewDate = today;
      }

      newCards.push({
        id: cardId,
        question: c.question,
        answer: c.answer,
        notes: `Imported from notebook: ${deckName}`,
        deck: deckName,
        tags: ['notebook', deckName.toLowerCase().replace(/\s+/g, '-')],
        references: c.references,
        dailyLogId: saveToDailyLog ? logId : null,
        repetition: 0,
        interval,
        easeFactor: 2.5,
        tier,
        tierStartedDate: tier === 'tier1' ? today : undefined,
        tierCyclesCompleted: 0,
        customIntervalDays: tier === 'custom' ? customDays : undefined,
        nextReviewDate,
        lastReviewedDate: null,
        createdAt: new Date().toISOString(),
        createdDate: today,
        history: [],
      });
    });

    let newLogs = [...appState.dailyLogs];
    if (saveToDailyLog) {
      newLogs = [
        {
          id: logId,
          date: today,
          subject: deckName,
          title: dailyLogTitle || `Notebook Study: ${deckName}`,
          notes: rawText || `Imported ${newCards.length} flashcards from notebook for memory reinforcement.`,
          confidence: 'solid',
          references: parsed[0]?.references,
          cardIds: createdCardIds,
          createdAt: new Date().toISOString(),
        },
        ...newLogs,
      ];
    }

    const prevReviewed = reviewedTodayCount;
    const prevCreated = createdTodayCount;
    const targetGoal = appState.settings.dailyGoal?.target || 10;
    const goalMode = appState.settings.dailyGoal?.mode || 'combined';
    const prevGoalMetric = goalMode === 'created' ? prevCreated : goalMode === 'reviewed' ? prevReviewed : (prevCreated + prevReviewed);
    const newGoalMetric = goalMode === 'created' ? (prevCreated + newCards.length) : goalMode === 'reviewed' ? prevReviewed : (prevCreated + newCards.length + prevReviewed);

    setAppState((prev) => {
      const updatedStats = updateStreak(prev.stats);
      return {
        ...prev,
        cards: [...newCards, ...prev.cards],
        dailyLogs: newLogs,
        stats: updatedStats,
      };
    });

    const totalImported = newCards.length;
    notifyNotebookImported(
      totalImported,
      deckName,
      appState.settings.soundEnabled,
      showToast,
      scheduleMode === 'today' ? () => setActiveTab('tab-review') : undefined
    );

    if (prevGoalMetric < targetGoal && newGoalMetric >= targetGoal) {
      notifyGoalCompleted(targetGoal, goalMode, appState.settings.soundEnabled, showToast);
    }
  };

  // Card Library Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  const handleOpenEditModal = (card: Flashcard) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleSaveCardModal = (data: {
    question: string;
    answer: string;
    notes: string;
    deck: string;
    tier?: KnowledgeTier;
    customIntervalDays?: number;
    references?: KnowledgeReference[];
  }) => {
    const tier = data.tier || 'tier1';
    if (editingCard) {
      setAppState((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === editingCard.id
            ? {
                ...c,
                ...data,
                tier,
                customIntervalDays: tier === 'custom' ? data.customIntervalDays : undefined,
                tags: [data.deck.toLowerCase().replace(/\s+/g, '-')],
              }
            : c
        ),
      }));
      showToast('Flashcard & tier settings updated successfully!');
    } else {
      let interval = 2;
      if (tier === 'tier1') interval = 2;
      else if (tier === 'tier2') interval = 3;
      else if (tier === 'tier3') interval = 3;
      else if (tier === 'custom') interval = data.customIntervalDays || 7;

      const newCard: Flashcard = {
        id: 'card_' + Date.now(),
        ...data,
        tags: [data.deck.toLowerCase().replace(/\s+/g, '-')],
        repetition: 0,
        interval,
        easeFactor: 2.5,
        tier,
        tierStartedDate: tier === 'tier1' ? today : undefined,
        tierCyclesCompleted: 0,
        customIntervalDays: tier === 'custom' ? data.customIntervalDays : undefined,
        nextReviewDate: today,
        lastReviewedDate: '',
        createdAt: new Date().toISOString(),
        createdDate: today,
        history: [],
      };
      setAppState((prev) => ({
        ...prev,
        cards: [newCard, ...prev.cards],
      }));
      showToast('New card created with reference citations!');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (user) {
      deleteCardFromFirestore(user.uid, cardId);
    }
    setAppState((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
    }));
    showToast('Flashcard deleted from library');
  };

  // Export & Backup Actions
  const handleExportCsv = () => {
    exportCardsCsv(appState.cards);
    showToast('Flashcards & references exported as CSV spreadsheet!');
  };

  const handleExportJson = () => {
    exportDataJson(appState);
    showToast('Full study journal backup JSON exported!');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.cards && parsed.dailyLogs) {
          setAppState(parsed);
          playSound('complete', appState.settings.soundEnabled);
          showToast('Backup restored successfully!');
        } else {
          showToast('Invalid backup file structure.');
        }
      } catch {
        showToast('Error reading backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeedData = () => {
    if (window.confirm('Reset all decks, references, and logs back to starter memory science data?')) {
      const freshSeed = JSON.parse(JSON.stringify(DEFAULT_DATA));
      setAppState(freshSeed);
      saveState(freshSeed);
      if (user) {
        syncAppStateToFirestore(user.uid, freshSeed);
      }
      showToast('Restored default cognitive psychology starter decks & citations!');
    }
  };

  const handleTestReminder = (tier?: KnowledgeTier) => {
    notifyDueCards(
      dueTodayCards,
      appState.settings.soundEnabled,
      showToast,
      () => setActiveTab('tab-review')
    );
  };

  const handleTestGoalNotification = () => {
    notifyGoalCompleted(
      appState.settings.dailyGoal?.target || 10,
      appState.settings.dailyGoal?.mode || 'combined',
      appState.settings.soundEnabled,
      showToast
    );
  };

  const handleTestStreakNotification = () => {
    notifyStreakExtended(
      appState.stats.streak || 3,
      appState.settings.soundEnabled,
      showToast
    );
  };

  const handleTestGraduationNotification = () => {
    const t1Count = appState.cards.filter((c) => (c.tier || 'tier1') === 'tier1').length;
    notifyTier1GraduationReady(
      Math.max(1, t1Count),
      appState.settings.soundEnabled,
      showToast,
      () => setActiveTab('tab-reminders')
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading Spaced Repetition Journal...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header with Google Sign In & Sync */}
      <Header
        settings={appState.settings}
        stats={appState.stats}
        dueTodayCount={dueTodayCards.length}
        totalCardsCount={appState.cards.length}
        user={user}
        isSyncing={isSyncing}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSound={handleToggleSound}
        onToggleTheme={handleToggleTheme}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Spaced Review Due Banner Alert */}
      {showReminderBanner && dueTodayCards.length > 0 && activeTab !== 'tab-review' && (
        <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border-b border-blue-500/30 text-white px-4 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Bell className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
              <span className="truncate">
                <strong>{dueTodayCards.length} flashcard{dueTodayCards.length === 1 ? '' : 's'}</strong> ready for spaced review today across your knowledge tiers!
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('tab-review')}
                className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Review Now
              </button>
              <button
                onClick={() => setShowReminderBanner(false)}
                className="text-slate-300 hover:text-white p-1"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Daily Goal Tracker */}
        <DailyGoalTracker
          goalSettings={appState.settings.dailyGoal}
          createdTodayCount={createdTodayCount}
          reviewedTodayCount={reviewedTodayCount}
          onUpdateGoalSettings={handleUpdateGoalSettings}
        />

        {/* Tab 1: Spaced Repetition Review */}
        {activeTab === 'tab-review' && (
          <ReviewTab
            cards={appState.cards}
            tierSettings={appState.settings.tierSettings}
            soundEnabled={appState.settings.soundEnabled}
            onCardReviewed={handleCardReviewed}
            onUpdateCardTier={handleUpdateCardTier}
            onNavigateToNotebook={() => setActiveTab('tab-notebook')}
            onNavigateToDailyLog={() => setActiveTab('tab-daily')}
          />
        )}

        {/* Tab 2: Daily Learning Log & Citations */}
        {activeTab === 'tab-daily' && (
          <DailyLogTab
            dailyLogs={appState.dailyLogs}
            cards={appState.cards}
            soundEnabled={appState.settings.soundEnabled}
            onSaveDailyLog={handleSaveDailyLog}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {/* Tab 3: Paste from Notebook */}
        {activeTab === 'tab-notebook' && (
          <NotebookTab
            existingDecks={existingDecks}
            soundEnabled={appState.settings.soundEnabled}
            onImportBatch={handleImportBatch}
          />
        )}

        {/* Tab 4: Flashcard Library */}
        {activeTab === 'tab-cards' && (
          <LibraryTab
            cards={appState.cards}
            existingDecks={existingDecks}
            onOpenCreateModal={handleOpenCreateModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteCard={handleDeleteCard}
            onExportCsv={handleExportCsv}
            onUpdateCardTier={handleUpdateCardTier}
          />
        )}

        {/* Tab 5: Retention Schedule & Firebase Cloud Sync */}
        {activeTab === 'tab-reminders' && (
          <RetentionTab
            cards={appState.cards}
            stats={appState.stats}
            settings={appState.settings}
            user={user}
            isSyncing={isSyncing}
            onUpdateSettings={handleUpdateSettings}
            onUpdateCardTier={handleUpdateCardTier}
            onBatchGraduateTier1={handleBatchGraduateTier1}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetSeedData={handleResetSeedData}
            onTestReminder={handleTestReminder}
            onTestGoalNotification={handleTestGoalNotification}
            onTestStreakNotification={handleTestStreakNotification}
            onTestGraduationNotification={handleTestGraduationNotification}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onManualCloudSync={handleManualCloudSync}
          />
        )}
      </main>

      {/* Card Create/Edit Modal with References */}
      <CardModal
        isOpen={isCardModalOpen}
        editingCard={editingCard}
        existingDecks={existingDecks}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleSaveCardModal}
      />

      {/* Global Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
