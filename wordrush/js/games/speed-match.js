// Game 3: 스피드 짝짓기 타임어택 (Speed Match)
(function (global) {
  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    let mode = ctx.subMode || "ko"; // 'ko' | 'engDef' | 'phrase'
    const pairsPerRound = 6;
    const totalRounds = 2;

    let round = 0;
    let roundItems = [];
    let cards = []; // { uid, pairId, side: 'word'|'target', text, matched, wrongFlash }
    let selectedUid = null;
    let locked = false;

    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let totalMatched = 0;
    let totalAttempts = 0;
    let wrongClicks = 0;
    const wrongMap = new Map();
    const startTime = Date.now();
    let timerId = null;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function getSourcePool() {
      if (mode === "phrase") {
        const inFilter = ctx.items.filter((it) => it.isPhrase);
        if (inFilter.length >= 6) return inFilter;
        const allPhrases = D.getAllItems().filter((it) => it.isPhrase);
        return allPhrases.length >= 6 ? allPhrases : ctx.items;
      }
      return ctx.items;
    }

    let poolShuffled = D.shuffle(getSourcePool());

    function startRound() {
      const startIdx = round * pairsPerRound;
      let slice = poolShuffled.slice(startIdx, startIdx + pairsPerRound);
      if (slice.length < 4) {
        poolShuffled = D.shuffle(getSourcePool());
        slice = poolShuffled.slice(0, Math.min(pairsPerRound, poolShuffled.length));
      }
      roundItems = slice;
      selectedUid = null;
      locked = false;

      const built = [];
      slice.forEach((item) => {
        built.push({
          uid: `w-${item.id}-${round}`,
          pairId: item.id,
          side: "word",
          text: item.word,
          sub: item.pos,
          item,
          matched: false,
        });
        built.push({
          uid: `t-${item.id}-${round}`,
          pairId: item.id,
          side: "target",
          text: mode === "engDef" ? item.engDef : item.ko,
          sub: mode === "engDef" ? "영영풀이" : "한글 뜻",
          item,
          matched: false,
        });
      });
      cards = D.shuffle(built);
      render();
    }

    function render() {
      const totalPairs = Math.min(totalRounds * pairsPerRound, Math.max(roundItems.length, totalRounds * pairsPerRound));
      const pct = Math.round((totalMatched / Math.max(1, totalPairs)) * 100);

      const cardsHtml = cards
        .map((c) => {
          const isSelected = selectedUid === c.uid;
          const cls = [
            "match-card",
            c.side === "word" ? "eng" : mode === "engDef" ? "def" : "",
            isSelected ? "selected" : "",
            c.matched ? "matched" : "",
            c.wrongFlash ? "wrong-shake" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `
            <button class="${cls}" data-uid="${c.uid}" ${c.matched ? "disabled" : ""}>
              <span>${D.escapeHtml(c.text)}</span>
            </button>
          `;
        })
        .join("");

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">⚡ 라운드 ${round + 1} / ${totalRounds}</span>
              <span class="hud-pill">🔥 ${streak} 콤보</span>
              <span class="hud-pill">❌ 오답 ${wrongClicks}</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>

          <div class="card" style="margin-bottom:16px; padding:14px 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:800; font-size:0.95rem;">짝짓기 모드 선택</div>
              <div class="chip-group" style="flex:0 1 auto;">
                <button class="chip ${mode === "ko" ? "active" : ""}" data-mode="ko">영단어 ↔ 한글 뜻</button>
                <button class="chip ${mode === "engDef" ? "active" : ""}" data-mode="engDef">영단어 ↔ 영영풀이</button>
                <button class="chip ${mode === "phrase" ? "active" : ""}" data-mode="phrase">숙어·표현 집중</button>
              </div>
            </div>
          </div>

          <div class="match-grid">${cardsHtml}</div>
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => {
        cleanup();
        ctx.onExit();
      });

      container.querySelectorAll("[data-mode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextMode = btn.getAttribute("data-mode");
          if (nextMode !== mode) {
            mode = nextMode;
            round = 0;
            score = 0;
            streak = 0;
            totalMatched = 0;
            totalAttempts = 0;
            wrongClicks = 0;
            wrongMap.clear();
            poolShuffled = D.shuffle(getSourcePool());
            startRound();
          }
        });
      });

      container.querySelectorAll("[data-uid]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (locked) return;
          const uid = btn.getAttribute("data-uid");
          handleCardTap(uid);
        });
      });
    }

    function handleCardTap(uid) {
      const card = cards.find((c) => c.uid === uid);
      if (!card || card.matched) return;

      if (card.side === "word") {
        TTS.speak(card.text, 1.0);
      }

      if (!selectedUid) {
        selectedUid = uid;
        render();
        return;
      }

      if (selectedUid === uid) {
        selectedUid = null;
        render();
        return;
      }

      const first = cards.find((c) => c.uid === selectedUid);
      if (!first) {
        selectedUid = uid;
        render();
        return;
      }

      // If user tapped same side, switch selection
      if (first.side === card.side) {
        selectedUid = uid;
        render();
        return;
      }

      totalAttempts += 1;
      if (first.pairId === card.pairId) {
        first.matched = true;
        card.matched = true;
        selectedUid = null;
        totalMatched += 1;
        streak += 1;
        if (streak > maxStreak) maxStreak = streak;
        score += 80 + Math.min(streak * 15, 60);
        S.recordWordResult(card.item, true);

        const allCleared = cards.every((c) => c.matched);
        render();
        if (allCleared) {
          locked = true;
          setTimeout(() => {
            round += 1;
            if (round >= totalRounds) {
              finish();
            } else {
              startRound();
            }
          }, 420);
        }
      } else {
        // Wrong pair
        wrongClicks += 1;
        streak = 0;
        const wordItem = first.side === "word" ? first.item : card.item;
        wrongMap.set(wordItem.id, wordItem);
        S.recordWordResult(wordItem, false);

        first.wrongFlash = true;
        card.wrongFlash = true;
        locked = true;
        selectedUid = null;
        render();
        setTimeout(() => {
          first.wrongFlash = false;
          card.wrongFlash = false;
          locked = false;
          render();
        }, 380);
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((totalMatched / Math.max(1, totalAttempts)) * 100);
      const speedBonus = Math.max(0, 300 - durationSec * 3);
      const finalScore = score + speedBonus;
      const modeLabel = mode === "engDef" ? "영영풀이" : mode === "phrase" ? "숙어" : "한글뜻";
      ctx.onComplete({
        gameId: "speed-match",
        gameName: `스피드 짝짓기 (${modeLabel})`,
        filterLabel: ctx.filterLabel,
        score: finalScore,
        accuracy,
        correctCount: totalMatched,
        totalQuestions: totalAttempts,
        maxStreak,
        durationSec,
        wrongWords: Array.from(wrongMap.values()),
      });
    }

    function cleanup() {
      if (timerId) clearInterval(timerId);
      TTS.stop();
    }

    timerId = setInterval(() => {
      const el = container.querySelector("#hud-time");
      if (el) el.textContent = `⏱️ ${getElapsedSec()}초`;
    }, 1000);

    startRound();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["speed-match"] = { mount };
})(window);
