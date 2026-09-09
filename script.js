/**
 * Spaced Repetition & Learning Retention Journal
 * Vanilla ES6+ JavaScript - Zero External Dependencies
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEY = 'mnemolog_retention_data_v1';

  // --- AUDIO SYNTHESIZER (Polite UI Feedback via Web Audio API) ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!appState.settings.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'rate') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'complete') {
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0.07, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // --- DATE HELPERS ---
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  function daysDifference(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffTime = d1 - d2;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return 'Never';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // --- DEFAULT DATA (Memory Retention & Learning Psychology) ---
  const DEFAULT_DATA = {
    settings: {
      theme: 'dark',
      soundEnabled: true,
      notificationsEnabled: false,
      dailyReminderTime: '19:00',
      lastReminderDate: ''
    },
    stats: {
      streak: 3,
      lastActiveDate: getTodayDateString(),
      totalReviewsCompleted: 14
    },
    dailyLogs: [
      {
        id: 'log_seed_1',
        date: addDays(getTodayDateString(), -2),
        subject: 'Cognitive Psychology',
        title: 'The Forgetting Curve & Synaptic Consolidation',
        notes: 'Learned how Hermann Ebbinghaus discovered memory decay. Without spaced repetition, over 70% of new information is forgotten within 48 hours. Active retrieval forces the brain to rebuild neural pathways.',
        confidence: 'breakthrough',
        cardIds: ['card_seed_1', 'card_seed_2'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'log_seed_2',
        date: addDays(getTodayDateString(), -1),
        subject: 'Memory Science',
        title: 'Active Recall vs. Passive Re-reading',
        notes: 'Re-reading gives the illusion of competence. Only testing yourself (active recall) activates true synaptic plasticity. Combined with the SM-2 algorithm intervals, retention jumps to 90%+.',
        confidence: 'solid',
        cardIds: ['card_seed_3', 'card_seed_4', 'card_seed_5'],
        createdAt: new Date().toISOString()
      }
    ],
    cards: [
      {
        id: 'card_seed_1',
        question: 'What is the Ebbinghaus Forgetting Curve?',
        answer: 'A mathematical curve describing how information retention rapidly drops over time without active reinforcement. Approximately 50-70% is lost within 24-48 hours.',
        notes: 'Discovered by Hermann Ebbinghaus in 1885.',
        deck: 'Cognitive Science',
        tags: ['memory', 'psychology'],
        dailyLogId: 'log_seed_1',
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: getTodayDateString(), // Due today!
        lastReviewedDate: addDays(getTodayDateString(), -2),
        history: []
      },
      {
        id: 'card_seed_2',
        question: 'How does Spaced Repetition counteract memory decay?',
        answer: 'By re-testing memory at mathematically increasing intervals right as the memory is about to fade, flattening the forgetting curve and transferring knowledge into long-term neocortex storage.',
        notes: 'Each successful review increases the next interval exponentially.',
        deck: 'Cognitive Science',
        tags: ['spaced-repetition', 'neuroscience'],
        dailyLogId: 'log_seed_1',
        repetition: 1,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: getTodayDateString(), // Due today!
        lastReviewedDate: addDays(getTodayDateString(), -1),
        history: []
      },
      {
        id: 'card_seed_3',
        question: 'Why is Active Recall superior to passive re-reading or highlighting?',
        answer: 'Passive review only stimulates recognition memory (illusion of competence). Active recall forces retrieval from scratch, engaging synaptic consolidation and long-term potentiation.',
        notes: 'Also known as the Testing Effect in educational research.',
        deck: 'Study Methods',
        tags: ['learning', 'active-recall'],
        dailyLogId: 'log_seed_2',
        repetition: 2,
        interval: 1,
        easeFactor: 2.6,
        nextReviewDate: getTodayDateString(), // Due today!
        lastReviewedDate: addDays(getTodayDateString(), -1),
        history: []
      },
      {
        id: 'card_seed_4',
        question: 'What is the Leitner Box System?',
        answer: 'A classic flashcard method where cards advance into higher boxes (reviewed less frequently) upon correct recall, but reset to Box 1 immediately upon a failure.',
        notes: 'Invented by Sebastian Leitner in the 1970s.',
        deck: 'Study Methods',
        tags: ['flashcards', 'leitner'],
        dailyLogId: 'log_seed_2',
        repetition: 1,
        interval: 3,
        easeFactor: 2.5,
        nextReviewDate: addDays(getTodayDateString(), 2), // Upcoming
        lastReviewedDate: addDays(getTodayDateString(), -1),
        history: []
      },
      {
        id: 'card_seed_5',
        question: 'What are the two core variables calculated in the SM-2 algorithm?',
        answer: '1. Interval (number of days until the next scheduled review).\n2. Ease Factor (a dynamic multiplier starting around 2.5, adjusting up or down based on recall ease).',
        notes: 'Developed by Dr. Piotr Woźniak for SuperMemo in 1987.',
        deck: 'Algorithms',
        tags: ['sm-2', 'algorithms'],
        dailyLogId: 'log_seed_2',
        repetition: 2,
        interval: 6,
        easeFactor: 2.5,
        nextReviewDate: addDays(getTodayDateString(), 5), // Upcoming
        lastReviewedDate: addDays(getTodayDateString(), -1),
        history: []
      }
    ]
  };

  // --- APPLICATION STATE ---
  let appState = loadState();

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.cards && parsed.dailyLogs) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state, using default data', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    updateGlobalMetrics();
  }

  // --- SM-2 SPACED REPETITION ALGORITHM ---
  /**
   * SuperMemo SM-2 calculation
   * @param {Object} card 
   * @param {number} quality 1=Again, 2=Hard, 3=Good, 4=Easy
   * @returns {Object} { repetition, interval, easeFactor, nextReviewDate }
   */
  function calculateSM2(card, quality) {
    let rep = card.repetition || 0;
    let interval = card.interval || 0;
    let ef = card.easeFactor || 2.5;
    const today = getTodayDateString();

    if (quality === 1) {
      // Again: complete reset of interval
      rep = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
    } else if (quality === 2) {
      // Hard: small interval progression, slight ease penalty
      rep = Math.max(1, rep);
      interval = Math.max(1, Math.round((interval || 1) * 1.2));
      ef = Math.max(1.3, ef - 0.15);
    } else if (quality === 3) {
      // Good: normal progression
      if (rep === 0) {
        interval = 1;
      } else if (rep === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ef);
      }
      rep += 1;
      // standard SM-2 ease factor formula for good (grade 4 on 0-5 scale)
      ef = Math.max(1.3, ef + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)));
    } else if (quality === 4) {
      // Easy: accelerated interval + ease bonus
      if (rep === 0) {
        interval = 2;
      } else if (rep === 1) {
        interval = 7;
      } else {
        interval = Math.round(interval * ef * 1.35);
      }
      rep += 1;
      ef = Math.max(1.3, ef + 0.15);
    }

    // Ensure interval is at least 1 day
    interval = Math.max(1, interval);
    const nextReviewDate = addDays(today, interval);

    return {
      repetition: rep,
      interval: interval,
      easeFactor: parseFloat(ef.toFixed(2)),
      nextReviewDate: nextReviewDate,
      lastReviewedDate: today
    };
  }

  /**
   * Preview upcoming intervals for a card before rating
   */
  function getSM2Previews(card) {
    const q1 = calculateSM2(card, 1);
    const q2 = calculateSM2(card, 2);
    const q3 = calculateSM2(card, 3);
    const q4 = calculateSM2(card, 4);

    return {
      again: q1.interval + 'd',
      hard: q2.interval + 'd',
      good: q3.interval + 'd',
      easy: q4.interval + 'd'
    };
  }

  // --- REVIEW SESSION STATE ---
  let reviewQueue = [];
  let currentCardIndex = 0;
  let isCardFlipped = false;

  function initReviewQueue() {
    const today = getTodayDateString();
    // Cards due today or overdue
    reviewQueue = appState.cards.filter(c => !c.nextReviewDate || c.nextReviewDate <= today);
    // Shuffle queue slightly to avoid fixed order bias
    reviewQueue.sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    isCardFlipped = false;
    renderReviewView();
  }

  function renderReviewView() {
    const container = document.getElementById('review-container');
    if (!container) return;

    if (reviewQueue.length === 0 || currentCardIndex >= reviewQueue.length) {
      // Completed / All caught up state
      const totalDueCount = getDueCardsCount();
      container.innerHTML = `
        <div class="empty-review-state" id="empty-review-state">
          <div class="empty-icon">🎉</div>
          <h2 class="empty-title">You're All Caught Up!</h2>
          <p class="empty-desc">
            No flashcards are currently due for spaced repetition review today. Great work reinforcing your memory!
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="primary-btn" id="btn-goto-daily">
              <span>📝</span> Record What You Learnt Today
            </button>
            <button class="secondary-btn" id="btn-review-all-early">
              <span>⚡</span> Review All Cards Early (${appState.cards.length})
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-goto-daily')?.addEventListener('click', () => {
        switchTab('tab-daily');
      });

      document.getElementById('btn-review-all-early')?.addEventListener('click', () => {
        reviewQueue = [...appState.cards].sort(() => Math.random() - 0.5);
        currentCardIndex = 0;
        isCardFlipped = false;
        renderReviewView();
        showToast('Starting early reinforcement review session!');
      });

      return;
    }

    const currentCard = reviewQueue[currentCardIndex];
    const totalCount = reviewQueue.length;
    const progressPercent = Math.round(((currentCardIndex) / totalCount) * 100);
    const previews = getSM2Previews(currentCard);

    container.innerHTML = `
      <div class="review-session-container">
        <!-- Top Status Bar -->
        <div class="review-status-bar">
          <div>
            <strong>Card ${currentCardIndex + 1}</strong> of ${totalCount}
            <span style="color: var(--text-muted); margin-left: 0.5rem;">(Deck: ${escapeHtml(currentCard.deck || 'General')})</span>
          </div>
          <div>
            <span class="kbd-hint">Space</span> flip &bull; <span class="kbd-hint">1-4</span> rate
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- 3D Interactive Flashcard -->
        <div class="flashcard-stage" id="flashcard-stage">
          <div class="flashcard-inner ${isCardFlipped ? 'flipped' : ''}" id="flashcard-inner">
            
            <!-- Front Face -->
            <div class="flashcard-face flashcard-front">
              <div class="card-meta-top">
                <span class="card-deck-tag">${escapeHtml(currentCard.deck || 'General')}</span>
                <span class="card-repetition-tag">Repetition Level: ${currentCard.repetition || 0} &bull; Interval: ${currentCard.interval || 0}d</span>
              </div>

              <div class="card-body-content">
                <div class="card-prompt-label">Prompt / Question</div>
                <div class="card-text">${escapeHtml(currentCard.question)}</div>
              </div>

              <div class="card-hint-bottom">
                <span>Click card or press</span> <span class="kbd-hint">Spacebar</span> <span>to reveal answer</span>
              </div>
            </div>

            <!-- Back Face -->
            <div class="flashcard-face flashcard-back">
              <div class="card-meta-top">
                <span class="card-deck-tag">${escapeHtml(currentCard.deck || 'General')}</span>
                <span class="card-repetition-tag">Ease: ${currentCard.easeFactor || 2.5}</span>
              </div>

              <div class="card-body-content">
                <div class="card-prompt-label" style="color: #a5b4fc;">Answer / Insight</div>
                <div class="card-text" style="font-size: 1.25rem;">${escapeHtml(currentCard.answer)}</div>
                ${currentCard.notes ? `
                  <div class="card-explanation">
                    <strong>Context / Note:</strong> ${escapeHtml(currentCard.notes)}
                  </div>
                ` : ''}
              </div>

              <div class="card-hint-bottom">
                <span>Select your recall accuracy below</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Rating Controls (SM-2 options) -->
        <div class="rating-controls-container" style="${isCardFlipped ? 'opacity: 1;' : 'opacity: 0.45; pointer-events: none;'}">
          <div class="rating-grid">
            <button class="rating-btn again" id="rate-again-btn" title="Complete memory blackout or incorrect">
              <span class="btn-title">🔴 Again</span>
              <span class="btn-interval">+${previews.again}</span>
              <span class="btn-key">[1]</span>
            </button>
            <button class="rating-btn hard" id="rate-hard-btn" title="Recalled with significant hesitation">
              <span class="btn-title">🟠 Hard</span>
              <span class="btn-interval">+${previews.hard}</span>
              <span class="btn-key">[2]</span>
            </button>
            <button class="rating-btn good" id="rate-good-btn" title="Recalled correctly with normal effort">
              <span class="btn-title">🟢 Good</span>
              <span class="btn-interval">+${previews.good}</span>
              <span class="btn-key">[3]</span>
            </button>
            <button class="rating-btn easy" id="rate-easy-btn" title="Instant, effortless recall">
              <span class="btn-title">🔵 Easy</span>
              <span class="btn-interval">+${previews.easy}</span>
              <span class="btn-key">[4]</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners for current card
    const cardStage = document.getElementById('flashcard-stage');
    if (cardStage) {
      cardStage.addEventListener('click', toggleCardFlip);
    }

    document.getElementById('rate-again-btn')?.addEventListener('click', (e) => { e.stopPropagation(); submitRating(1); });
    document.getElementById('rate-hard-btn')?.addEventListener('click', (e) => { e.stopPropagation(); submitRating(2); });
    document.getElementById('rate-good-btn')?.addEventListener('click', (e) => { e.stopPropagation(); submitRating(3); });
    document.getElementById('rate-easy-btn')?.addEventListener('click', (e) => { e.stopPropagation(); submitRating(4); });
  }

  function toggleCardFlip() {
    isCardFlipped = !isCardFlipped;
    playSound('flip');
    const inner = document.getElementById('flashcard-inner');
    if (inner) {
      if (isCardFlipped) {
        inner.classList.add('flipped');
      } else {
        inner.classList.remove('flipped');
      }
    }
    const controls = document.querySelector('.rating-controls-container');
    if (controls) {
      if (isCardFlipped) {
        controls.style.opacity = '1';
        controls.style.pointerEvents = 'auto';
      } else {
        controls.style.opacity = '0.45';
        controls.style.pointerEvents = 'none';
      }
    }
  }

  function submitRating(quality) {
    if (currentCardIndex >= reviewQueue.length) return;
    const currentCard = reviewQueue[currentCardIndex];
    playSound('rate');

    // Apply SM-2 update
    const updatedMetrics = calculateSM2(currentCard, quality);

    // Update card in state
    const cardInMaster = appState.cards.find(c => c.id === currentCard.id);
    if (cardInMaster) {
      cardInMaster.repetition = updatedMetrics.repetition;
      cardInMaster.interval = updatedMetrics.interval;
      cardInMaster.easeFactor = updatedMetrics.easeFactor;
      cardInMaster.nextReviewDate = updatedMetrics.nextReviewDate;
      cardInMaster.lastReviewedDate = updatedMetrics.lastReviewedDate;
      if (!cardInMaster.history) cardInMaster.history = [];
      cardInMaster.history.push({
        date: updatedMetrics.lastReviewedDate,
        rating: quality,
        interval: updatedMetrics.interval,
        easeFactor: updatedMetrics.easeFactor
      });
    }

    // Update user stats
    appState.stats.totalReviewsCompleted = (appState.stats.totalReviewsCompleted || 0) + 1;
    updateStreak();
    saveState();

    // Move to next card in review queue
    currentCardIndex++;
    isCardFlipped = false;

    if (currentCardIndex >= reviewQueue.length) {
      playSound('complete');
      showToast('🎉 Review session finished! Great job!');
    }

    renderReviewView();
    renderLibrary();
    renderRetentionSchedule();
  }

  function updateStreak() {
    const today = getTodayDateString();
    const lastActive = appState.stats.lastActiveDate;

    if (!lastActive) {
      appState.stats.streak = 1;
      appState.stats.lastActiveDate = today;
    } else if (lastActive === today) {
      // Already active today
    } else {
      const diff = daysDifference(today, lastActive);
      if (diff === 1) {
        // Consecutive day
        appState.stats.streak = (appState.stats.streak || 0) + 1;
      } else if (diff > 1) {
        // Streak broken
        appState.stats.streak = 1;
      }
      appState.stats.lastActiveDate = today;
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  window.addEventListener('keydown', (e) => {
    // Only handle if active tab is Review and not typing in an input
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab || activeTab.id !== 'tab-review') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleCardFlip();
    } else if (isCardFlipped) {
      if (e.key === '1') {
        e.preventDefault();
        submitRating(1);
      } else if (e.key === '2') {
        e.preventDefault();
        submitRating(2);
      } else if (e.key === '3') {
        e.preventDefault();
        submitRating(3);
      } else if (e.key === '4') {
        e.preventDefault();
        submitRating(4);
      }
    }
  });

  // --- TAB 2: DAILY LEARNING LOG ---
  let tempDailyFlashcards = [];

  function initDailyLogForm() {
    const dateInput = document.getElementById('log-date-input');
    if (dateInput) {
      dateInput.value = getTodayDateString();
    }

    tempDailyFlashcards = [];
    renderTempFlashcards();

    const addCardBtn = document.getElementById('btn-add-quick-card');
    if (addCardBtn) {
      addCardBtn.onclick = () => {
        const qInput = document.getElementById('quick-q-input');
        const aInput = document.getElementById('quick-a-input');
        const q = qInput.value.trim();
        const a = aInput.value.trim();

        if (!q || !a) {
          showToast('Please provide both a Question and an Answer for the flashcard.');
          return;
        }

        tempDailyFlashcards.push({ question: q, answer: a });
        qInput.value = '';
        aInput.value = '';
        renderTempFlashcards();
        qInput.focus();
      };
    }

    const form = document.getElementById('daily-log-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        saveDailyLog();
      };
    }

    renderDailyLogsTimeline();
  }

  function renderTempFlashcards() {
    const container = document.getElementById('temp-cards-list');
    if (!container) return;

    if (tempDailyFlashcards.length === 0) {
      container.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-muted); font-style: italic;">No flashcards added to this daily log yet. Create 1 or more to convert your learnings into immediate spaced retention cards!</p>`;
      return;
    }

    container.innerHTML = tempDailyFlashcards.map((card, idx) => `
      <div class="quick-card-item">
        <button type="button" class="btn-sm-remove" data-index="${idx}" title="Remove card">&times;</button>
        <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 0.2rem;">
          Q: ${escapeHtml(card.question)}
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary);">
          A: ${escapeHtml(card.answer)}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-sm-remove').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        tempDailyFlashcards.splice(idx, 1);
        renderTempFlashcards();
      };
    });
  }

  function saveDailyLog() {
    const date = document.getElementById('log-date-input').value || getTodayDateString();
    const subject = document.getElementById('log-subject-input').value.trim() || 'General Learning';
    const title = document.getElementById('log-title-input').value.trim();
    const notes = document.getElementById('log-notes-input').value.trim();
    const confidence = document.getElementById('log-confidence-select').value;

    if (!title || !notes) {
      showToast('Please provide a Topic Title and Key Learnings/Notes.');
      return;
    }

    const logId = 'log_' + Date.now();
    const createdCardIds = [];

    // Also check if user typed question & answer in the quick inputs without clicking "Add Card"
    const quickQ = document.getElementById('quick-q-input')?.value.trim();
    const quickA = document.getElementById('quick-a-input')?.value.trim();
    if (quickQ && quickA) {
      tempDailyFlashcards.push({ question: quickQ, answer: quickA });
    }

    // Create cards attached to this log
    tempDailyFlashcards.forEach((cardData, idx) => {
      const cardId = 'card_' + Date.now() + '_' + idx;
      createdCardIds.push(cardId);
      appState.cards.push({
        id: cardId,
        question: cardData.question,
        answer: cardData.answer,
        notes: `Created from daily log: "${title}" (${subject})`,
        deck: subject,
        tags: ['daily-log', subject.toLowerCase().replace(/\s+/g, '-')],
        dailyLogId: logId,
        repetition: 0,
        interval: 1, // Will be due tomorrow
        easeFactor: 2.5,
        nextReviewDate: addDays(date, 1),
        lastReviewedDate: date,
        history: []
      });
    });

    const newLog = {
      id: logId,
      date: date,
      subject: subject,
      title: title,
      notes: notes,
      confidence: confidence,
      cardIds: createdCardIds,
      createdAt: new Date().toISOString()
    };

    appState.dailyLogs.unshift(newLog);
    updateStreak();
    saveState();

    // Reset Form
    document.getElementById('log-title-input').value = '';
    document.getElementById('log-notes-input').value = '';
    if (document.getElementById('quick-q-input')) document.getElementById('quick-q-input').value = '';
    if (document.getElementById('quick-a-input')) document.getElementById('quick-a-input').value = '';
    tempDailyFlashcards = [];
    renderTempFlashcards();

    playSound('complete');
    showToast(`Recorded daily learning entry with ${createdCardIds.length} new spaced flashcard(s)!`);

    renderDailyLogsTimeline();
    renderLibrary();
    renderRetentionSchedule();
  }

  function renderDailyLogsTimeline() {
    const container = document.getElementById('daily-logs-timeline');
    if (!container) return;

    if (!appState.dailyLogs || appState.dailyLogs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No daily learning logs recorded yet. Use the form to write your first daily takeaway!
        </div>
      `;
      return;
    }

    container.innerHTML = appState.dailyLogs.map(log => {
      const cardCount = (log.cardIds && log.cardIds.length) || 0;
      return `
        <div class="timeline-entry" id="entry-${log.id}">
          <div class="entry-header">
            <span class="entry-date">📅 ${formatDateHuman(log.date)}</span>
            <span class="entry-subject">${escapeHtml(log.subject)}</span>
          </div>
          <h3 class="entry-title">${escapeHtml(log.title)}</h3>
          <p class="entry-notes">${escapeHtml(log.notes)}</p>
          
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            ${cardCount > 0 ? `
              <span class="entry-cards-badge">
                🎴 ${cardCount} Spaced Flashcard${cardCount > 1 ? 's' : ''} Created
              </span>
            ` : '<span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem;">No flashcards linked</span>'}
            
            <div class="entry-actions">
              <button type="button" class="secondary-btn" style="padding: 0.2rem 0.6rem; font-size: 0.78rem;" onclick="window.deleteDailyLog('${log.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function safeConfirm(message) {
    try {
      if (typeof window.confirm === 'function') {
        return window.confirm(message);
      }
      return true;
    } catch (e) {
      console.warn('window.confirm blocked or restricted in current iframe sandbox:', e);
      return true;
    }
  }

  window.deleteDailyLog = function(logId) {
    if (!safeConfirm('Are you sure you want to delete this daily learning entry? Linked flashcards will be preserved.')) return;
    appState.dailyLogs = appState.dailyLogs.filter(l => l.id !== logId);
    saveState();
    renderDailyLogsTimeline();
    showToast('Daily learning entry removed.');
  };

  // --- TAB 3: PASTE FROM NOTEBOOK FOR MEMORY WORK ---
  let parsedNotebookCards = [];

  const SAMPLE_NOTEBOOK_TEMPLATES = {
    qa: `Q: What is the spacing effect in cognitive psychology?
A: The psychological finding that learning is greater when study sessions are spaced out over time rather than in a single cram session.

Q: How does the SM-2 spaced repetition algorithm calculate review intervals?
A: It adjusts review intervals based on an Ease Factor (EF) and feedback rating (Again, Hard, Good, Easy), resetting on failure and expanding exponentially on success.

Q: What is active recall and why is it superior to passive rereading?
A: Active recall forces deliberate neural retrieval, which triggers synaptic consolidation and reveals gaps in comprehension far more effectively.

Q: What role does Non-REM deep sleep play in memory consolidation?
A: During slow-wave sleep, memories are replayed and transferred from the temporary hippocampus to the long-term neocortex.`,

    terms: `Neuroplasticity :: The brain's ability to reorganize itself by forming new neural connections throughout life in response to learning or experience.
Long-Term Potentiation (LTP) :: Persistent strengthening of synapses based on recent patterns of activity, considered the primary cellular mechanism of memory.
Ebbinghaus Forgetting Curve - Mathematical model showing that without reinforcement, approximately 70% of new information is forgotten within 48 hours.
Episodic Memory: Memory of autobiographical events (times, places, contextual emotions) that can be explicitly recalled.
Working Memory: Temporary, limited-capacity cognitive system responsible for holding and manipulating information for immediate tasks.
Synaptic Consolidation: The biological process that stabilizes a memory trace after the initial acquisition, taking hours to days.`,

    cloze: `The [hippocampus] is essential for consolidating memories from short-term to long-term storage in the neocortex.
Synaptic consolidation occurs predominantly during [Non-REM slow-wave sleep].
Memory retention decays rapidly along the [Ebbinghaus forgetting curve] unless reinforced with spaced repetition.
The SM-2 algorithm uses an [Ease Factor] starting at 2.5 to scale review intervals exponentially.
Deliberate [active recall] stimulates neuroplasticity significantly more than passive highlighting or rereading.`,

    bullets: `- Active recall forces the brain to retrieve information, strengthening synaptic pathways and retention.
- Hermann Ebbinghaus discovered that over 70% of new information is forgotten within 48 hours without spaced review.
- Interleaving different subjects during study improves cognitive discrimination and problem-solving skills compared to blocked repetition.
- Sleep is essential for memory consolidation, specifically transferring labile memory traces into stable neural schemas.
- Testing yourself with flashcards acts as an active retrieval cue, halting the exponential forgetting curve.`
  };

  function parseNotebookText(text) {
    if (!text || !text.trim()) return [];
    const results = [];
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Strategy 1: Explicit Q&A blocks (e.g. Q: ... \n A: ...)
    const qaRegex = /(?:^|\n)(?:Q|Question|Prompt|\d+[\.\)]\s*(?:Q|Question)?)\s*:\s*([^\n]+(?:\n(?!(?:A|Answer|Response)\s*:)[^\n]+)*)\n(?:A|Answer|Response)\s*:\s*([^\n]+(?:\n(?!(?:Q|Question|Prompt|\d+[\.\)]\s*(?:Q|Question)?)\s*:)[^\n]+)*)/gi;
    let qaMatch;
    while ((qaMatch = qaRegex.exec(normalized)) !== null) {
      const question = qaMatch[1].trim();
      const answer = qaMatch[2].trim();
      if (question && answer) {
        results.push({
          type: 'qa',
          typeLabel: 'Q&A',
          question: question,
          answer: answer
        });
      }
    }

    // Line by line scanning for alternative notebook formats
    const lines = normalized.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // Skip lines already part of explicit Q&A tags
      if (/^(?:Q|Question|Prompt|\d+[\.\)]\s*Q):\s*/i.test(line) || /^(?:A|Answer|Response):\s*/i.test(line)) {
        continue;
      }

      // Format 2: Cloze Deletion brackets [cloze text] or {{cloze text}}
      const clozeMatch = line.match(/\[([^\]]+)\]/) || line.match(/\{\{([^}]+)\}\}/);
      if (clozeMatch) {
        const answerTerm = clozeMatch[1].trim();
        const prompt = line.replace(/\[([^\]]+)\]/, '[ ... ]')
          .replace(/\{\{([^}]+)\}\}/, '[ ... ]')
          .replace(/^[-*•\d\.]+\s*/, '');
        
        results.push({
          type: 'cloze',
          typeLabel: 'Cloze',
          question: prompt,
          answer: `${answerTerm}\n\nFull Note:\n${line.replace(/^[-*•\d\.]+\s*/, '')}`
        });
        continue;
      }

      // Format 3: Double or Triple Colons (Obsidian/RemNote style :: or :::)
      if (line.includes(':::') || line.includes('::')) {
        const parts = line.split(/::+/);
        if (parts.length >= 2) {
          const front = parts[0].replace(/^[-*•\d\.]+\s*/, '').trim();
          const back = parts.slice(1).join('::').trim();
          if (front && back) {
            results.push({
              type: 'terms',
              typeLabel: 'Term',
              question: front,
              answer: back
            });
            continue;
          }
        }
      }

      // Format 4: Tab-separated (TSV from spreadsheet or table)
      if (line.includes('\t')) {
        const parts = line.split('\t');
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          results.push({
            type: 'terms',
            typeLabel: 'Table',
            question: parts[0].trim(),
            answer: parts.slice(1).join(' - ').trim()
          });
          continue;
        }
      }

      // Format 5: Hyphen / Dash / Em-dash Separators: " - ", " – ", " — "
      let cleanLine = line.replace(/^[-*•]\s+/, '');
      const dashMatch = cleanLine.match(/^([^\-\–\—\n]+?)\s*[\-\–\—]\s+(.+)$/);
      if (dashMatch) {
        const term = dashMatch[1].replace(/^\d+[\.\)]\s*/, '').trim();
        const def = dashMatch[2].trim();
        if (term.length > 0 && term.length <= 90 && def.length > 0) {
          results.push({
            type: 'terms',
            typeLabel: 'Definition',
            question: term,
            answer: def
          });
          continue;
        }
      }

      // Format 6: Colon Separator "Term: Definition"
      const colonMatch = cleanLine.match(/^([A-Za-z0-9\s\(\)\/]{2,75}):\s+(.+)$/);
      if (colonMatch) {
        const term = colonMatch[1].replace(/^\d+[\.\)]\s*/, '').trim();
        const def = colonMatch[2].trim();
        if (term && def && !term.toLowerCase().startsWith('http')) {
          results.push({
            type: 'terms',
            typeLabel: 'Term',
            question: term,
            answer: def
          });
          continue;
        }
      }

      // Format 7: Numbered or Bullet Takeaways
      if (/^[-*•]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)) {
        const content = line.replace(/^[-*•\d\.]+\s*/, '').trim();
        if (content.length > 15) {
          const words = content.split(' ');
          let promptTitle = 'Key Takeaway / Principle:';
          if (words.length > 5) {
            promptTitle = `Recall the concept: "${words.slice(0, 4).join(' ')}..."`;
          }
          results.push({
            type: 'bullets',
            typeLabel: 'Bullet',
            question: promptTitle,
            answer: content
          });
          continue;
        }
      }

      // Format 8: Paragraph block with question ending with "?"
      if (line.endsWith('?') && i + 1 < lines.length && lines[i + 1].trim()) {
        const q = line.replace(/^[-*•\d\.]+\s*/, '').trim();
        const a = lines[i + 1].trim();
        results.push({
          type: 'qa',
          typeLabel: 'Q&A',
          question: q,
          answer: a
        });
        i++; // skip consumed answer line
        continue;
      }
    }

    return results;
  }

  function renderParsedCardsPreview() {
    const listEl = document.getElementById('parsed-cards-list');
    const countBadge = document.getElementById('parsed-card-count');
    const countText = document.getElementById('parsed-card-count-text');
    const importBtn = document.getElementById('btn-import-notebook-cards');
    const tabBadge = document.getElementById('notebook-parsed-badge');

    if (!listEl) return;

    const count = parsedNotebookCards.length;
    if (countBadge) countBadge.textContent = count;
    if (countText) countText.textContent = count === 1 ? 'card detected ready for review' : 'cards detected ready for review';
    if (importBtn) {
      importBtn.disabled = count === 0;
      importBtn.innerHTML = count > 0 
        ? `<span>📥</span> Import ${count} Card${count > 1 ? 's' : ''} into Spaced Repetition` 
        : `<span>📥</span> Import to Spaced Repetition Queue`;
    }

    if (tabBadge) {
      if (count > 0) {
        tabBadge.textContent = count;
        tabBadge.style.display = 'inline-flex';
      } else {
        tabBadge.style.display = 'none';
      }
    }

    if (count === 0) {
      listEl.innerHTML = `
        <div class="empty-parse-state">
          <span style="font-size: 2.25rem;">📝</span>
          <p style="margin-top: 0.6rem; color: var(--text-muted); font-size: 0.9rem; max-width: 380px; margin-left: auto; margin-right: auto;">
            Paste your notebook text on the left, or click one of the sample formats above to preview automatically generated memory flashcards.
          </p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = parsedNotebookCards.map((card, idx) => {
      let tagClass = '';
      if (card.type === 'cloze') tagClass = 'cloze';
      else if (card.type === 'terms') tagClass = 'terms';

      return `
        <div class="parsed-card-item" data-index="${idx}">
          <div class="parsed-card-header">
            <div class="parsed-card-meta">
              <span class="parsed-card-index">#${idx + 1}</span>
              <span class="parsed-card-type-tag ${tagClass}">${escapeHtml(card.typeLabel || 'CARD')}</span>
            </div>
            <button type="button" class="parsed-card-delete-btn" data-index="${idx}" title="Discard this card">&times; Remove</button>
          </div>
          <div class="parsed-card-fields">
            <div class="parsed-field-row">
              <label class="parsed-field-label">Front (Question / Prompt)</label>
              <textarea class="parsed-field-input card-field-q" rows="2" data-index="${idx}">${escapeHtml(card.question)}</textarea>
            </div>
            <div class="parsed-field-row">
              <label class="parsed-field-label">Back (Answer / Recall Target)</label>
              <textarea class="parsed-field-input card-field-a" rows="2" data-index="${idx}">${escapeHtml(card.answer)}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach real-time input change handlers so edits persist in parsedNotebookCards
    listEl.querySelectorAll('.card-field-q').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (parsedNotebookCards[idx]) {
          parsedNotebookCards[idx].question = e.target.value;
        }
      });
    });

    listEl.querySelectorAll('.card-field-a').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (parsedNotebookCards[idx]) {
          parsedNotebookCards[idx].answer = e.target.value;
        }
      });
    });

    listEl.querySelectorAll('.parsed-card-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        parsedNotebookCards.splice(idx, 1);
        renderParsedCardsPreview();
      });
    });
  }

  function updateNotebookDeckSuggestions() {
    const datalist = document.getElementById('notebook-deck-suggestions');
    if (!datalist) return;
    const decks = [...new Set(appState.cards.map(c => c.deck || 'General'))].filter(Boolean);
    datalist.innerHTML = decks.map(d => `<option value="${escapeHtml(d)}">`).join('');
  }

  function importNotebookCards() {
    if (parsedNotebookCards.length === 0) {
      showToast('No parsed cards to import. Paste notebook text first.');
      return;
    }

    const deckInput = document.getElementById('notebook-deck-input');
    const deckName = (deckInput && deckInput.value.trim()) || 'Notebook Memory Work';

    const scheduleMode = document.getElementById('notebook-schedule-mode')?.value || 'today';
    const logDailyCheck = document.getElementById('notebook-log-daily-check')?.checked;
    const logTitleInput = document.getElementById('notebook-log-title-input');
    const rawTextInput = document.getElementById('notebook-raw-input');
    const rawText = (rawTextInput && rawTextInput.value.trim()) || '';

    const today = getTodayDateString();
    const createdCardIds = [];
    const logId = 'log_' + Date.now();

    parsedNotebookCards.forEach((card, idx) => {
      const q = (card.question || '').trim();
      const a = (card.answer || '').trim();
      if (!q || !a) return;

      const cardId = 'card_nb_' + Date.now() + '_' + idx;
      createdCardIds.push(cardId);

      let nextReviewDate = today;
      let interval = 0;

      if (scheduleMode === 'stagger') {
        const staggerOffset = idx % 4; // Spread across today, +1, +2, +3 days
        nextReviewDate = addDays(today, staggerOffset);
        interval = staggerOffset;
      } else if (scheduleMode === 'tomorrow') {
        nextReviewDate = addDays(today, 1);
        interval = 1;
      } else {
        nextReviewDate = today;
        interval = 0;
      }

      appState.cards.push({
        id: cardId,
        question: q,
        answer: a,
        notes: `Imported from notebook: ${deckName}`,
        deck: deckName,
        tags: ['notebook', deckName.toLowerCase().replace(/\s+/g, '-')],
        dailyLogId: logDailyCheck ? logId : null,
        repetition: 0,
        interval: interval,
        easeFactor: 2.5,
        nextReviewDate: nextReviewDate,
        lastReviewedDate: null,
        history: []
      });
    });

    if (createdCardIds.length === 0) {
      showToast('No valid flashcards found with both questions and answers.');
      return;
    }

    // Optional: Log to Daily Learning Journal
    if (logDailyCheck) {
      const logTitle = (logTitleInput && logTitleInput.value.trim()) || `Notebook Study: ${deckName}`;
      const newLog = {
        id: logId,
        date: today,
        subject: deckName,
        title: logTitle,
        notes: rawText || `Imported ${createdCardIds.length} flashcard(s) from notebook for spaced repetition memory work.`,
        confidence: 'solid',
        cardIds: createdCardIds,
        createdAt: new Date().toISOString()
      };
      appState.dailyLogs.unshift(newLog);
      updateStreak();
    }

    saveState();
    playSound('complete');

    const totalImported = createdCardIds.length;
    showToast(`Successfully imported ${totalImported} card${totalImported > 1 ? 's' : ''} into "${deckName}"!`);

    // Reset notebook inputs
    if (rawTextInput) rawTextInput.value = '';
    parsedNotebookCards = [];
    renderParsedCardsPreview();

    // Re-render UI components
    renderDailyLogsTimeline();
    renderLibrary();
    renderRetentionSchedule();
    updateGlobalMetrics();
    checkScheduledReminder();

    // Prompt user if cards are due today using non-blocking interactive toast
    const dueCards = appState.cards.filter(c => c.nextReviewDate <= today);
    if (dueCards.length > 0 && scheduleMode === 'today') {
      showToast(
        `Imported ${totalImported} card${totalImported > 1 ? 's' : ''}! You have ${dueCards.length} card${dueCards.length > 1 ? 's' : ''} ready for review.`,
        'Start Review Now →',
        () => switchTab('tab-review')
      );
    } else {
      showToast(`Successfully imported ${totalImported} card${totalImported > 1 ? 's' : ''} into "${deckName}"!`);
    }
  }

  function initNotebookImporter() {
    updateNotebookDeckSuggestions();

    const rawInput = document.getElementById('notebook-raw-input');
    if (rawInput) {
      rawInput.addEventListener('input', () => {
        parsedNotebookCards = parseNotebookText(rawInput.value);
        renderParsedCardsPreview();
      });
    }

    // Template sample buttons
    document.querySelectorAll('.sample-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const templateKey = btn.dataset.template;
        if (SAMPLE_NOTEBOOK_TEMPLATES[templateKey]) {
          if (rawInput) {
            rawInput.value = SAMPLE_NOTEBOOK_TEMPLATES[templateKey];
            parsedNotebookCards = parseNotebookText(rawInput.value);
            renderParsedCardsPreview();
            showToast(`Loaded ${btn.textContent.trim()} notebook sample.`);
          }
        }
      });
    });

    // Paste from clipboard button
    const pasteBtn = document.getElementById('btn-paste-clipboard');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text) {
              if (rawInput) {
                rawInput.value = text;
                parsedNotebookCards = parseNotebookText(text);
                renderParsedCardsPreview();
                showToast('Pasted notebook text from clipboard!');
              }
            } else {
              showToast('Clipboard is empty.');
            }
          } else {
            showToast('Clipboard access not permitted in this browser mode. Press Ctrl+V / Cmd+V in the text box.');
          }
        } catch (err) {
          showToast('Please paste directly using Ctrl+V or Cmd+V in the text area.');
        }
      });
    }

    // Clear notebook button
    const clearBtn = document.getElementById('btn-clear-notebook');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (rawInput) rawInput.value = '';
        parsedNotebookCards = [];
        renderParsedCardsPreview();
        showToast('Notebook input cleared.');
      });
    }

    // Add manual custom card to preview batch
    const addCardBtn = document.getElementById('btn-add-preview-card');
    if (addCardBtn) {
      addCardBtn.addEventListener('click', () => {
        parsedNotebookCards.push({
          type: 'custom',
          typeLabel: 'Custom',
          question: 'New Question / Concept',
          answer: 'Target Answer / Explanation'
        });
        renderParsedCardsPreview();
        const listEl = document.getElementById('parsed-cards-list');
        if (listEl) {
          setTimeout(() => {
            listEl.scrollTop = listEl.scrollHeight;
            const inputs = listEl.querySelectorAll('.card-field-q');
            if (inputs.length > 0) inputs[inputs.length - 1].focus();
          }, 50);
        }
      });
    }

    // Import action button
    const importBtn = document.getElementById('btn-import-notebook-cards');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        importNotebookCards();
      });
    }

    renderParsedCardsPreview();
  }

  // --- TAB 4: CARD LIBRARY & DECKS ---
  let librarySearchTerm = '';
  let libraryFilterStatus = 'all'; // 'all', 'due', 'upcoming', 'learning'
  let libraryDeckFilter = 'all';

  function initLibrary() {
    const searchInput = document.getElementById('library-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        librarySearchTerm = e.target.value.toLowerCase().trim();
        renderLibrary();
      });
    }

    const filterStatusSelect = document.getElementById('library-status-select');
    if (filterStatusSelect) {
      filterStatusSelect.addEventListener('change', (e) => {
        libraryFilterStatus = e.target.value;
        renderLibrary();
      });
    }

    const filterDeckSelect = document.getElementById('library-deck-select');
    if (filterDeckSelect) {
      filterDeckSelect.addEventListener('change', (e) => {
        libraryDeckFilter = e.target.value;
        renderLibrary();
      });
    }

    document.getElementById('btn-open-new-card-modal')?.addEventListener('click', () => {
      openCardModal();
    });

    renderLibrary();
  }

  function getUniqueDecks() {
    const decks = new Set(['General']);
    appState.cards.forEach(c => {
      if (c.deck && c.deck.trim()) decks.add(c.deck.trim());
    });
    return Array.from(decks).sort();
  }

  function updateDeckFilterDropdown() {
    const select = document.getElementById('library-deck-select');
    if (!select) return;
    const decks = getUniqueDecks();
    const currentVal = select.value || 'all';

    select.innerHTML = `<option value="all">All Decks (${decks.length})</option>` +
      decks.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');

    if (decks.includes(currentVal) || currentVal === 'all') {
      select.value = currentVal;
    }
  }

  function renderLibrary() {
    updateDeckFilterDropdown();
    const grid = document.getElementById('card-library-grid');
    if (!grid) return;

    const today = getTodayDateString();

    const filtered = appState.cards.filter(card => {
      // Search term
      if (librarySearchTerm) {
        const matchesQ = card.question.toLowerCase().includes(librarySearchTerm);
        const matchesA = card.answer.toLowerCase().includes(librarySearchTerm);
        const matchesDeck = (card.deck || '').toLowerCase().includes(librarySearchTerm);
        if (!matchesQ && !matchesA && !matchesDeck) return false;
      }

      // Deck filter
      if (libraryDeckFilter !== 'all' && (card.deck || 'General') !== libraryDeckFilter) {
        return false;
      }

      // Status filter
      if (libraryFilterStatus === 'due') {
        return !card.nextReviewDate || card.nextReviewDate <= today;
      } else if (libraryFilterStatus === 'upcoming') {
        return card.nextReviewDate && card.nextReviewDate > today;
      } else if (libraryFilterStatus === 'mastered') {
        return (card.repetition || 0) >= 4;
      }

      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No flashcards match your current search/filter.</p>
          <button class="secondary-btn" onclick="window.clearLibraryFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(card => {
      const isDue = !card.nextReviewDate || card.nextReviewDate <= today;
      const diffDays = card.nextReviewDate ? daysDifference(card.nextReviewDate, today) : 0;
      let dueText = '';
      let dueClass = '';

      if (isDue) {
        dueText = 'Due Today';
        dueClass = 'due-now';
      } else if (diffDays === 1) {
        dueText = 'Due Tomorrow';
        dueClass = 'due-soon';
      } else {
        dueText = `Due in ${diffDays}d (${formatDateHuman(card.nextReviewDate)})`;
        dueClass = 'due-later';
      }

      return `
        <div class="card-item" id="card-${card.id}">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="card-deck-tag" style="font-size: 0.72rem;">${escapeHtml(card.deck || 'General')}</span>
              <span class="due-indicator ${dueClass}">
                &bull; ${dueText}
              </span>
            </div>
            <h4 class="card-item-question">${escapeHtml(card.question)}</h4>
            <div class="card-item-answer">${escapeHtml(card.answer)}</div>
          </div>

          <div class="card-item-footer">
            <div>
              <span>Rep: <strong>${card.repetition || 0}</strong></span> &bull; 
              <span>Interval: <strong>${card.interval || 0}d</strong></span> &bull; 
              <span>Ease: <strong>${card.easeFactor || 2.5}</strong></span>
            </div>
            <div class="card-item-actions">
              <button class="btn-icon" style="width: 28px; height: 28px; font-size: 0.8rem;" onclick="window.openCardModal('${card.id}')" title="Edit Card">
                ✏️
              </button>
              <button class="btn-icon" style="width: 28px; height: 28px; font-size: 0.8rem;" onclick="window.deleteCard('${card.id}')" title="Delete Card">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.clearLibraryFilters = function () {
    librarySearchTerm = '';
    libraryFilterStatus = 'all';
    libraryDeckFilter = 'all';
    const sInput = document.getElementById('library-search-input');
    const stSelect = document.getElementById('library-status-select');
    const dSelect = document.getElementById('library-deck-select');
    if (sInput) sInput.value = '';
    if (stSelect) stSelect.value = 'all';
    if (dSelect) dSelect.value = 'all';
    renderLibrary();
  };

  // --- CARD MODAL (Create & Edit) ---
  let editingCardId = null;

  window.openCardModal = function (cardId = null) {
    editingCardId = cardId;
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('modal-card-title');
    const qInput = document.getElementById('modal-card-question');
    const aInput = document.getElementById('modal-card-answer');
    const notesInput = document.getElementById('modal-card-notes');
    const deckInput = document.getElementById('modal-card-deck');

    // Populate decks autocomplete list
    const datalist = document.getElementById('deck-datalist');
    if (datalist) {
      datalist.innerHTML = getUniqueDecks().map(d => `<option value="${escapeHtml(d)}">`).join('');
    }

    if (cardId) {
      const card = appState.cards.find(c => c.id === cardId);
      if (!card) return;
      title.textContent = 'Edit Flashcard';
      qInput.value = card.question;
      aInput.value = card.answer;
      notesInput.value = card.notes || '';
      deckInput.value = card.deck || 'General';
    } else {
      title.textContent = 'Create New Flashcard';
      qInput.value = '';
      aInput.value = '';
      notesInput.value = '';
      deckInput.value = libraryDeckFilter !== 'all' ? libraryDeckFilter : 'General';
    }

    modal.classList.add('active');
    qInput.focus();
  };

  function closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.classList.remove('active');
    editingCardId = null;
  }

  window.deleteCard = function (cardId) {
    if (!safeConfirm('Are you sure you want to delete this flashcard?')) return;
    appState.cards = appState.cards.filter(c => c.id !== cardId);
    saveState();
    renderLibrary();
    initReviewQueue();
    renderRetentionSchedule();
    showToast('Card deleted.');
  };

  function initCardModalHandlers() {
    document.getElementById('modal-close-btn')?.addEventListener('click', closeCardModal);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeCardModal);
    document.getElementById('card-modal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('modal-card-question').value.trim();
      const a = document.getElementById('modal-card-answer').value.trim();
      const notes = document.getElementById('modal-card-notes').value.trim();
      const deck = document.getElementById('modal-card-deck').value.trim() || 'General';

      if (!q || !a) {
        showToast('Both Question and Answer are required.');
        return;
      }

      if (editingCardId) {
        // Update existing card
        const card = appState.cards.find(c => c.id === editingCardId);
        if (card) {
          card.question = q;
          card.answer = a;
          card.notes = notes;
          card.deck = deck;
        }
        showToast('Card updated successfully.');
      } else {
        // Create new card
        const newCard = {
          id: 'card_' + Date.now(),
          question: q,
          answer: a,
          notes: notes,
          deck: deck,
          tags: [deck.toLowerCase().replace(/\s+/g, '-')],
          repetition: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: getTodayDateString(), // Due today for initial learning
          lastReviewedDate: '',
          history: []
        };
        appState.cards.push(newCard);
        showToast('New card added and ready for review!');
      }

      saveState();
      closeCardModal();
      renderLibrary();
      initReviewQueue();
      renderRetentionSchedule();
    });
  }

  // --- TAB 4: RETENTION SCHEDULE & REMINDERS ---
  function renderRetentionSchedule() {
    const today = getTodayDateString();

    // 1. Retention Metrics Cards
    const totalCards = appState.cards.length;
    const dueTodayCount = getDueCardsCount();
    const masteredCount = appState.cards.filter(c => (c.repetition || 0) >= 4).length;
    const avgEase = totalCards > 0
      ? (appState.cards.reduce((acc, c) => acc + (c.easeFactor || 2.5), 0) / totalCards).toFixed(2)
      : '2.50';

    const elTotalCards = document.getElementById('stat-total-cards');
    const elDueToday = document.getElementById('stat-due-cards');
    const elMastered = document.getElementById('stat-mastered-cards');
    const elAvgEase = document.getElementById('stat-avg-ease');

    if (elTotalCards) elTotalCards.textContent = totalCards;
    if (elDueToday) elDueToday.textContent = dueTodayCount;
    if (elMastered) elMastered.textContent = masteredCount;
    if (elAvgEase) elAvgEase.textContent = avgEase;

    // 2. Schedule Forecast Calculations
    // Forecast buckets: Today, Tomorrow (+1), 2-3 days (+3), 4-7 days (+7), 8-14 days (+14), 15-30+ days (+30)
    let forecastBuckets = {
      today: 0,
      tomorrow: 0,
      in3d: 0,
      in7d: 0,
      in14d: 0,
      in30d: 0
    };

    appState.cards.forEach(card => {
      const nextDate = card.nextReviewDate || today;
      const diff = daysDifference(nextDate, today);

      if (diff <= 0) {
        forecastBuckets.today++;
      } else if (diff === 1) {
        forecastBuckets.tomorrow++;
      } else if (diff <= 3) {
        forecastBuckets.in3d++;
      } else if (diff <= 7) {
        forecastBuckets.in7d++;
      } else if (diff <= 14) {
        forecastBuckets.in14d++;
      } else {
        forecastBuckets.in30d++;
      }
    });

    const forecastContainer = document.getElementById('retention-forecast-slots');
    if (forecastContainer) {
      forecastContainer.innerHTML = `
        <div class="forecast-slot ${forecastBuckets.today > 0 ? 'active-due' : ''}">
          <div class="forecast-day">Today</div>
          <div class="forecast-count" style="color: ${forecastBuckets.today > 0 ? 'var(--accent-danger)' : 'var(--text-primary)'};">${forecastBuckets.today}</div>
          <div class="forecast-status">${forecastBuckets.today > 0 ? 'Needs Review' : 'Clear'}</div>
        </div>
        <div class="forecast-slot">
          <div class="forecast-day">Tomorrow</div>
          <div class="forecast-count">${forecastBuckets.tomorrow}</div>
          <div class="forecast-status">+1 Day</div>
        </div>
        <div class="forecast-slot">
          <div class="forecast-day">2-3 Days</div>
          <div class="forecast-count">${forecastBuckets.in3d}</div>
          <div class="forecast-status">Short term</div>
        </div>
        <div class="forecast-slot">
          <div class="forecast-day">4-7 Days</div>
          <div class="forecast-count">${forecastBuckets.in7d}</div>
          <div class="forecast-status">1 Week</div>
        </div>
        <div class="forecast-slot">
          <div class="forecast-day">8-14 Days</div>
          <div class="forecast-count">${forecastBuckets.in14d}</div>
          <div class="forecast-status">2 Weeks</div>
        </div>
        <div class="forecast-slot">
          <div class="forecast-day">15-30+ Days</div>
          <div class="forecast-count">${forecastBuckets.in30d}</div>
          <div class="forecast-status">Long-Term</div>
        </div>
      `;
    }

    // Update settings controls
    const reminderTimeInput = document.getElementById('reminder-time-input');
    if (reminderTimeInput) {
      reminderTimeInput.value = appState.settings.dailyReminderTime || '19:00';
    }

    updateNotificationStatusUI();
  }

  function initReminderSettings() {
    const timeInput = document.getElementById('reminder-time-input');
    if (timeInput) {
      timeInput.addEventListener('change', (e) => {
        appState.settings.dailyReminderTime = e.target.value;
        saveState();
        showToast(`Daily reminder scheduled for ${e.target.value}`);
      });
    }

    const testNotificationBtn = document.getElementById('btn-test-notification');
    if (testNotificationBtn) {
      testNotificationBtn.addEventListener('click', () => {
        triggerSpacedReminderNotification(true);
      });
    }

    const enableNotificationBtn = document.getElementById('btn-toggle-notifications');
    if (enableNotificationBtn) {
      enableNotificationBtn.addEventListener('click', requestNotificationPermission);
    }

    // Data Management Buttons
    document.getElementById('btn-export-data')?.addEventListener('click', exportDataJson);
    document.getElementById('btn-import-data')?.addEventListener('click', () => {
      document.getElementById('import-file-input')?.click();
    });
    document.getElementById('import-file-input')?.addEventListener('change', importDataJson);
    document.getElementById('btn-reset-demo')?.addEventListener('click', resetDemoData);
  }

  // --- NOTIFICATION & REMINDER ENGINE ---
  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser environment. In-app reminders will remain active.');
      return;
    }

    try {
      const p = Notification.requestPermission();
      if (p && typeof p.then === 'function') {
        p.then(permission => {
          if (permission === 'granted') {
            appState.settings.notificationsEnabled = true;
            saveState();
            updateNotificationStatusUI();
            showToast('Browser notifications enabled! You will receive daily spaced review alerts.');
            try {
              new Notification('🧠 MnemoLog Notifications Activated', {
                body: 'We will remind you when flashcards are due to strengthen your memory retention.',
                icon: '/favicon.ico'
              });
            } catch (err) {
              console.warn('System notification blocked:', err);
            }
          } else {
            appState.settings.notificationsEnabled = false;
            saveState();
            updateNotificationStatusUI();
            showToast('Notification permission was declined or dismissed.');
          }
        }).catch(err => {
          console.warn('Notification permission promise rejected:', err);
          showToast('Notification request was blocked by browser frame policy. In-app reminders remain active.');
        });
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      showToast('Notification permission request is restricted in this environment.');
    }
  }

  function updateNotificationStatusUI() {
    const btn = document.getElementById('btn-toggle-notifications');
    const badge = document.getElementById('notification-status-badge');
    const headerPill = document.getElementById('header-reminder-pill');

    const isPermGranted = ('Notification' in window && Notification.permission === 'granted');
    const isEnabled = appState.settings.notificationsEnabled && isPermGranted;

    if (badge) {
      badge.textContent = isEnabled ? 'Active' : 'Disabled / Pending';
      badge.style.color = isEnabled ? 'var(--accent-success)' : 'var(--text-muted)';
    }

    if (btn) {
      btn.textContent = isEnabled ? 'Disable Notifications' : 'Enable Browser Alerts';
      if (isEnabled) {
        btn.classList.remove('primary-btn');
        btn.classList.add('secondary-btn');
        btn.onclick = () => {
          appState.settings.notificationsEnabled = false;
          saveState();
          updateNotificationStatusUI();
          showToast('Browser alerts paused. In-app notifications remain active.');
        };
      } else {
        btn.classList.add('primary-btn');
        btn.classList.remove('secondary-btn');
        btn.onclick = requestNotificationPermission;
      }
    }

    if (headerPill) {
      if (isEnabled) {
        headerPill.classList.add('reminders-active');
        headerPill.innerHTML = `🔔 Alerts Active (${appState.settings.dailyReminderTime || '19:00'})`;
      } else {
        headerPill.classList.remove('reminders-active');
        headerPill.innerHTML = `🔔 Alerts Off`;
      }
    }
  }

  function triggerSpacedReminderNotification(isTest = false) {
    const dueCount = getDueCardsCount();
    const title = isTest ? '🧠 Test Spaced Repetition Alert' : '🧠 Time for Your Spaced Review';
    const message = dueCount > 0
      ? `You have ${dueCount} flashcard${dueCount > 1 ? 's' : ''} due for spaced review today. Take 2 minutes to reinforce retention!`
      : 'You have no cards due right now. Keep your streak alive by logging what you learned today!';

    // 1. Browser Notification (if granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Could not launch system notification', e);
      }
    }

    // 2. In-App Toast & Audio alert
    playSound('flip');
    showToast(`${title}: ${message}`);
  }

  // Periodic Reminder Background Checker
  setInterval(() => {
    checkScheduledReminder();
  }, 60000); // Check once per minute

  function checkScheduledReminder() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    const today = getTodayDateString();

    const targetTime = appState.settings.dailyReminderTime || '19:00';

    if (currentTime === targetTime && appState.settings.lastReminderDate !== today) {
      const dueCount = getDueCardsCount();
      if (dueCount > 0) {
        triggerSpacedReminderNotification(false);
        appState.settings.lastReminderDate = today;
        saveState();
      }
    }
  }

  // --- DATA EXPORT & IMPORT ---
  function exportDataJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `mnemolog_backup_${getTodayDateString()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Data exported successfully as JSON file.');
  }

  function importDataJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.cards || !Array.isArray(imported.cards)) {
          throw new Error('Invalid JSON format: missing cards array.');
        }

        appState = imported;
        saveState();
        initReviewQueue();
        renderDailyLogsTimeline();
        renderLibrary();
        renderRetentionSchedule();
        showToast('Data restored successfully!');
      } catch (err) {
        showToast('Error importing backup: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetDemoData() {
    if (!safeConfirm('Reset back to initial learning science sample data? Current cards and logs will be replaced.')) return;
    appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
    appState.stats.lastActiveDate = getTodayDateString();
    saveState();
    initReviewQueue();
    renderDailyLogsTimeline();
    renderLibrary();
    renderRetentionSchedule();
    showToast('Sample memory retention data restored.');
  }

  // --- GLOBAL METRICS & UI HELPERS ---
  function getDueCardsCount() {
    const today = getTodayDateString();
    return appState.cards.filter(c => !c.nextReviewDate || c.nextReviewDate <= today).length;
  }

  function updateGlobalMetrics() {
    const dueCount = getDueCardsCount();
    const streak = appState.stats.streak || 0;

    // Header pills
    const streakEl = document.getElementById('header-streak-count');
    const dueEl = document.getElementById('header-due-count');
    const reviewTabBadge = document.getElementById('review-tab-badge');

    if (streakEl) streakEl.textContent = `${streak}d Streak`;
    if (dueEl) dueEl.textContent = `${dueCount} Due`;
    if (reviewTabBadge) reviewTabBadge.textContent = dueCount;

    // Reminder Banner
    const reminderBanner = document.getElementById('top-reminder-banner');
    const reminderBannerText = document.getElementById('banner-reminder-text');
    if (reminderBanner && reminderBannerText) {
      if (dueCount > 0) {
        reminderBanner.style.display = 'block';
        reminderBannerText.innerHTML = `<strong>Spaced Repetition Alert:</strong> You have <strong>${dueCount} card${dueCount > 1 ? 's' : ''}</strong> scheduled for review today to prevent memory decay.`;
      } else {
        reminderBanner.style.display = 'none';
      }
    }
  }

  function showToast(message, actionLabel = null, onAction = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let contentHtml = `<span>💡</span> <div style="flex:1; line-height: 1.4;">${escapeHtml(message)}</div>`;
    if (actionLabel && onAction) {
      contentHtml += `<button type="button" class="toast-action-btn" style="background:var(--accent-primary);color:#fff;border:none;padding:0.3rem 0.65rem;border-radius:var(--radius-sm);font-size:0.78rem;font-weight:600;cursor:pointer;margin-left:0.5rem;white-space:nowrap;">${escapeHtml(actionLabel)}</button>`;
    }
    toast.innerHTML = contentHtml;

    if (actionLabel && onAction) {
      const btn = toast.querySelector('.toast-action-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          onAction();
          toast.remove();
        });
      }
    }

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.isConnected) {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, actionLabel ? 6500 : 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- TAB NAVIGATION ---
  function switchTab(targetTabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetTabId);
    });

    if (targetTabId === 'tab-review') {
      initReviewQueue();
    } else if (targetTabId === 'tab-daily') {
      renderDailyLogsTimeline();
    } else if (targetTabId === 'tab-notebook') {
      updateNotebookDeckSuggestions();
    } else if (targetTabId === 'tab-cards') {
      renderLibrary();
    } else if (targetTabId === 'tab-reminders') {
      renderRetentionSchedule();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    document.getElementById('banner-start-review-btn')?.addEventListener('click', () => {
      switchTab('tab-review');
    });

    document.getElementById('banner-dismiss-btn')?.addEventListener('click', () => {
      const banner = document.getElementById('top-reminder-banner');
      if (banner) banner.style.display = 'none';
    });

    document.getElementById('btn-daily-to-notebook')?.addEventListener('click', () => {
      switchTab('tab-notebook');
    });

    document.getElementById('btn-library-to-notebook')?.addEventListener('click', () => {
      switchTab('tab-notebook');
    });
  }

  function initThemeAndAudio() {
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.innerHTML = appState.settings.soundEnabled ? '🔊' : '🔇';
      soundBtn.addEventListener('click', () => {
        appState.settings.soundEnabled = !appState.settings.soundEnabled;
        soundBtn.innerHTML = appState.settings.soundEnabled ? '🔊' : '🔇';
        saveState();
        showToast(appState.settings.soundEnabled ? 'Audio cues enabled' : 'Audio muted');
      });
    }

    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      const currentTheme = appState.settings.theme || 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      themeBtn.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';

      themeBtn.addEventListener('click', () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        appState.settings.theme = nextTheme;
        themeBtn.innerHTML = nextTheme === 'light' ? '🌙' : '☀️';
        saveState();
      });
    }
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initThemeAndAudio();
    initReviewQueue();
    initDailyLogForm();
    initNotebookImporter();
    initLibrary();
    initCardModalHandlers();
    initReminderSettings();
    renderRetentionSchedule();
    updateGlobalMetrics();

    // Check if initial reminder alert is warranted
    checkScheduledReminder();
  });

})();
