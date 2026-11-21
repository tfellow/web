// Storage & Session Buffer for MY Word Rush (Prefix: wr_)
// Syncs aggregated results to Supabase (wr_daily, wr_word_stats, wr_leaderboard)
// while keeping a lightweight local cache for instant weak-word filtering & CSV export.

(function (global) {
  const KEYS = {
    SESSIONS: "my_wordrush_sessions_v1",
    WORD_STATS: "my_wordrush_word_stats_v1",
  };

  let sessionWordBuffer = [];
  let remoteCustomItems = [];

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  const Storage = {
    resetSessionBuffer() {
      sessionWordBuffer = [];
    },

    getSessionWordBuffer() {
      return sessionWordBuffer.slice();
    },

    getSessions() {
      return safeRead(KEYS.SESSIONS, []);
    },

    getWordStats() {
      return safeRead(KEYS.WORD_STATS, {});
    },

    hydrateWordStatsFromServer(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const stats = this.getWordStats();
      for (const r of rows) {
        stats[r.word_id] = {
          id: r.word_id,
          word: r.word,
          ko: stats[r.word_id]?.ko || "",
          grade: r.grade,
          lesson: r.lesson,
          attempts: r.attempts,
          correct: r.correct,
          wrong: r.wrong,
          lastWrongAt: r.last_wrong_at,
        };
      }
      safeWrite(KEYS.WORD_STATS, stats);
    },

    setRemoteCustomSets(sets) {
      const merged = [];
      (sets || []).forEach((s) => {
        if (Array.isArray(s.items)) {
          s.items.forEach((it) => merged.push({ ...it, isCustom: true, setTitle: s.title }));
        }
      });
      remoteCustomItems = merged;
    },

    getCustomVocab() {
      return remoteCustomItems;
    },

    recordWordResult(item, isCorrect) {
      if (!item || !item.id) return;
      sessionWordBuffer.push({
        id: item.id,
        grade: item.grade || 1,
        lesson: item.lesson || 1,
        word: item.word || "",
        ok: Boolean(isCorrect),
      });

      const stats = this.getWordStats();
      const prev = stats[item.id] || {
        id: item.id,
        word: item.word,
        ko: item.ko || "",
        grade: item.grade || 1,
        lesson: item.lesson || 1,
        attempts: 0,
        correct: 0,
        wrong: 0,
        lastWrongAt: null,
      };
      prev.ko = prev.ko || item.ko || "";
      prev.attempts += 1;
      if (isCorrect) prev.correct += 1;
      else {
        prev.wrong += 1;
        prev.lastWrongAt = new Date().toISOString();
      }
      stats[item.id] = prev;
      safeWrite(KEYS.WORD_STATS, stats);
    },

    saveLocalSession(session, auth) {
      const record = {
        id: "WR-" + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
        studentName: auth?.displayName || "학생",
        studentCode: auth?.parsed?.studentCode || "-",
        ...session,
      };
      const sessions = this.getSessions();
      sessions.unshift(record);
      if (sessions.length > 100) sessions.length = 100;
      safeWrite(KEYS.SESSIONS, sessions);
      return record;
    },

    getWeakWords(limit = 20) {
      const stats = Object.values(this.getWordStats());
      return stats
        .filter((s) => s.wrong > 0)
        .map((s) => ({
          ...s,
          wrongRate: Math.round((s.wrong / Math.max(1, s.attempts)) * 100),
        }))
        .sort((a, b) => b.wrong - a.wrong || b.wrongRate - a.wrongRate)
        .slice(0, limit);
    },

    buildResultCode(session, auth) {
      const who = auth?.displayName || "학생";
      const wrongList = (session.wrongWords || []).map((w) => w.word).join(", ") || "없음";
      return [
        `[MY Word Rush 결과]`,
        `학생: ${who}`,
        `게임: ${session.gameName}`,
        `범위: ${session.filterLabel}`,
        `점수: ${session.score}점 | 정답률: ${session.accuracy}% (${session.correctCount}/${session.totalQuestions}) | 소요시간: ${session.durationSec}초`,
        `오답 단어: ${wrongList}`,
        `완료시각: ${new Date(session.timestamp).toLocaleString("ko-KR")}`,
      ].join("\n");
    },

    exportRowsCSV(filename, header, rows) {
      const csv = [header, ...rows]
        .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    exportSessionsCSV() {
      const sessions = this.getSessions();
      const header = ["완료시각", "학번", "이름", "게임", "학습범위", "점수", "정답률(%)", "정답수", "문항수", "소요시간(초)", "오답단어"];
      const rows = sessions.map((s) => [
        new Date(s.timestamp).toLocaleString("ko-KR"),
        s.studentCode,
        s.studentName,
        s.gameName,
        s.filterLabel,
        s.score,
        s.accuracy,
        s.correctCount,
        s.totalQuestions,
        s.durationSec,
        (s.wrongWords || []).map((w) => w.word).join(" / "),
      ]);
      this.exportRowsCSV(`MY_Word_Rush_기록_${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    },
  };

  global.MY_STORAGE = Storage;
})(window);
