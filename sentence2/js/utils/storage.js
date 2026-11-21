window.SMS = window.SMS || {};

(function () {
  const KEY_STATS = 'sms_stats_v1';
  const KEY_WRONG = 'sms_wrong_v1';
  const KEY_CUSTOM = 'sms_custom_lessons_v1';

  const defaultStats = {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    masteredIds: [],
    sfxEnabled: true
  };

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(type) {
    const stats = getStats();
    if (!stats.sfxEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.33);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'fanfare') {
      osc.type = 'triangle';
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
      });
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.56);
    }
  }

  let externalAdapter = null;
  let activeContext = {
    lessonId: 'g1-l1',
    category: 'all',
    mode: 'dashboard'
  };

  function setContext(ctx) {
    activeContext = Object.assign({}, activeContext, ctx);
  }

  function getUser() {
    if (externalAdapter && typeof externalAdapter.getCurrentUser === 'function') {
      try {
        return externalAdapter.getCurrentUser() || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function emitEvent(eventName, payload) {
    const detail = Object.assign(
      {
        app: 'sentence-master-studio',
        timestamp: new Date().toISOString(),
        user: getUser(),
        context: Object.assign({}, activeContext)
      },
      payload
    );

    // 1. Direct adapter callback
    if (externalAdapter) {
      try {
        if (eventName === 'sms:activity' && typeof externalAdapter.onActivity === 'function') {
          externalAdapter.onActivity(detail);
        } else if (eventName === 'sms:stats-updated' && typeof externalAdapter.onStatsSync === 'function') {
          externalAdapter.onStatsSync(detail);
        } else if (eventName === 'sms:wrong-updated' && typeof externalAdapter.onWrongUpdate === 'function') {
          externalAdapter.onWrongUpdate(detail);
        }
      } catch (err) {
        console.error('[SMS integration adapter error]', err);
      }
    }

    // 2. DOM CustomEvent (same-window integration)
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch {
      // ignore
    }

    // 3. postMessage (iframe integration)
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: eventName, payload: detail }, '*');
      }
    } catch {
      // ignore
    }
  }

  function getStats() {
    return Object.assign({}, defaultStats, safeParse(localStorage.getItem(KEY_STATS), {}));
  }

  function saveStats(stats) {
    localStorage.setItem(KEY_STATS, JSON.stringify(stats));
    emitEvent('sms:stats-updated', { stats });
  }

  function addXP(amount, sentenceId) {
    const stats = getStats();
    stats.xp += amount;
    stats.streak += 1;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
    if (sentenceId && !stats.masteredIds.includes(sentenceId)) {
      stats.masteredIds.push(sentenceId);
    }
    saveStats(stats);
    playTone('correct');
    emitEvent('sms:activity', {
      result: 'correct',
      xpDelta: amount,
      sentenceId: sentenceId || null,
      totalXp: stats.xp,
      streak: stats.streak
    });
    return stats;
  }

  function resetStreak() {
    const stats = getStats();
    stats.streak = 0;
    saveStats(stats);
    playTone('wrong');
    return stats;
  }

  function toggleSfx() {
    const stats = getStats();
    stats.sfxEnabled = !stats.sfxEnabled;
    saveStats(stats);
    return stats.sfxEnabled;
  }

  function getWrongNotes() {
    return safeParse(localStorage.getItem(KEY_WRONG), []);
  }

  function recordWrong(item, reason) {
    const notes = getWrongNotes();
    const existing = notes.find((n) => n.id === item.id);
    if (existing) {
      existing.count += 1;
      existing.reason = reason || existing.reason;
      existing.updatedAt = Date.now();
    } else {
      notes.unshift({
        id: item.id,
        en: item.en,
        ko: item.ko,
        grammarTip: reason || item.grammarTip || '',
        count: 1,
        updatedAt: Date.now()
      });
    }
    const trimmed = notes.slice(0, 60);
    localStorage.setItem(KEY_WRONG, JSON.stringify(trimmed));
    emitEvent('sms:activity', {
      result: 'wrong',
      xpDelta: 0,
      sentenceId: item.id,
      reason: reason || item.grammarTip || ''
    });
    emitEvent('sms:wrong-updated', { wrongNotes: trimmed });
    return trimmed;
  }

  function removeWrong(id) {
    const notes = getWrongNotes().filter((n) => n.id !== id);
    localStorage.setItem(KEY_WRONG, JSON.stringify(notes));
    emitEvent('sms:wrong-updated', { wrongNotes: notes });
    return notes;
  }

  function clearWrongNotes() {
    localStorage.setItem(KEY_WRONG, JSON.stringify([]));
    emitEvent('sms:wrong-updated', { wrongNotes: [] });
  }

  function hydrateFromHost(data) {
    if (!data || typeof data !== 'object') return;
    if (data.stats && typeof data.stats === 'object') {
      const merged = Object.assign({}, defaultStats, data.stats);
      localStorage.setItem(KEY_STATS, JSON.stringify(merged));
    }
    if (Array.isArray(data.wrongNotes)) {
      localStorage.setItem(KEY_WRONG, JSON.stringify(data.wrongNotes.slice(0, 60)));
    }
    if (Array.isArray(data.customLessons)) {
      localStorage.setItem(KEY_CUSTOM, JSON.stringify(data.customLessons));
    }
    if (typeof window.SMS.refreshUI === 'function') {
      window.SMS.refreshUI();
    }
  }

  function setAdapter(adapter) {
    externalAdapter = adapter || null;
    if (externalAdapter && typeof externalAdapter.loadInitialState === 'function') {
      Promise.resolve(externalAdapter.loadInitialState())
        .then((initialData) => {
          if (initialData) hydrateFromHost(initialData);
        })
        .catch((err) => console.error('[SMS loadInitialState error]', err));
    }
  }

  function exportSnapshot() {
    return {
      stats: getStats(),
      wrongNotes: getWrongNotes(),
      customLessons: getCustomLessons()
    };
  }

  function getCustomLessons() {
    return safeParse(localStorage.getItem(KEY_CUSTOM), []);
  }

  function saveCustomLessons(list) {
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(list));
  }

  function addCustomLesson(lesson) {
    const list = getCustomLessons();
    const idx = list.findIndex((l) => l.id === lesson.id);
    if (idx >= 0) {
      list[idx] = lesson;
    } else {
      list.push(lesson);
    }
    saveCustomLessons(list);
    return list;
  }

  function deleteCustomLesson(id) {
    const list = getCustomLessons().filter((l) => l.id !== id);
    saveCustomLessons(list);
    return list;
  }

  // Listen for iframe parent hydration (optional)
  window.addEventListener('message', (event) => {
    const msg = event && event.data;
    if (msg && msg.type === 'sms:hydrate' && msg.payload) {
      hydrateFromHost(msg.payload);
    }
  });

  window.SMS.storage = {
    getStats,
    addXP,
    resetStreak,
    toggleSfx,
    playTone,
    getWrongNotes,
    recordWrong,
    removeWrong,
    clearWrongNotes,
    getCustomLessons,
    saveCustomLessons,
    addCustomLesson,
    deleteCustomLesson,
    setContext
  };

  window.SMS.integration = {
    setAdapter,
    hydrateFromHost,
    exportSnapshot,
    getUser
  };
})();
