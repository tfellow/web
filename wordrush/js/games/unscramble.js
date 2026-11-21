// Game 2: 문장 어순 블록 조립기 (Sentence Unscramble)
(function (global) {
  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    const validItems = ctx.items.filter((it) => D.tokenizeSentence(it.example).length >= 4);
    const total = Math.min(ctx.questionCount || 8, validItems.length);
    const list = D.shuffle(validItems).slice(0, total);

    let idx = 0;
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let correctCount = 0;
    const wrongWords = [];
    const startTime = Date.now();
    let timerId = null;

    let tokens = [];
    let bank = []; // [{ id, text, used }]
    let placed = []; // array of bank item ids
    let hintsUsed = 0;
    let answered = false;
    let isCorrect = false;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function loadQuestion() {
      if (idx >= list.length) {
        finish();
        return;
      }
      const item = list[idx];
      tokens = D.tokenizeSentence(item.example);
      let shuffled = D.shuffle(tokens.map((text, i) => ({ id: i, text, used: false })));
      // Ensure it's not already in exact original order
      if (tokens.length > 1 && shuffled.map((x) => x.text).join(" ") === tokens.join(" ")) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      bank = shuffled;
      placed = [];
      hintsUsed = 0;
      answered = false;
      isCorrect = false;
      render();
    }

    function render() {
      const item = list[idx];
      const pct = Math.round((idx / list.length) * 100);
      const zoneClass = answered ? (isCorrect ? "unscramble-zone correct" : "unscramble-zone wrong") : "unscramble-zone";

      const placedHtml =
        placed.length === 0
          ? `<span style="color:var(--text-muted); font-size:0.95rem;">아래 단어 블록을 순서대로 눌러 문장을 완성해 보세요.</span>`
          : placed
              .map((bid) => {
                const obj = bank.find((b) => b.id === bid);
                return `<button class="word-chip in-answer" data-placed-id="${bid}" ${answered ? "disabled" : ""}>${D.escapeHtml(obj.text)}</button>`;
              })
              .join("");

      const bankHtml = bank
        .map(
          (b) =>
            `<button class="word-chip ${b.used ? "used" : ""}" data-bank-id="${b.id}" ${answered || b.used ? "disabled" : ""}>${D.escapeHtml(b.text)}</button>`
        )
        .join("");

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">🧩 ${idx + 1} / ${list.length}</span>
              <span class="hud-pill">🔥 ${streak} 콤보</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>

          <div class="prompt-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="badge badge-primary">중${item.grade} · ${item.lesson}단원</span>
                <span class="badge badge-success">핵심 단어: ${D.escapeHtml(item.word)} (${D.escapeHtml(item.ko)})</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-tts">🔊 문장 듣기</button>
            </div>

            <div class="sentence-display" style="font-size:1.25rem; margin-top:14px;">
              “${D.escapeHtml(item.exampleKo)}”
            </div>

            <div class="${zoneClass}" id="answer-zone">${placedHtml}</div>

            <div class="word-bank" id="word-bank">${bankHtml}</div>

            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:20px; flex-wrap:wrap;">
              ${
                !answered
                  ? `<div style="display:flex; gap:8px; flex-wrap:wrap;">
                      <button class="btn btn-outline btn-sm" id="btn-hint">💡 다음 단어 힌트</button>
                      <button class="btn btn-outline btn-sm" id="btn-reset">↩️ 다시 배열</button>
                    </div>
                    <button class="btn btn-primary" id="btn-check" ${placed.length < tokens.length ? "disabled" : ""}>정답 확인</button>`
                  : `<div></div>
                     <button class="btn btn-primary" id="btn-next">${idx + 1 < list.length ? "다음 문장 →" : "결과 보기 🎉"}</button>`
              }
            </div>

            ${
              answered
                ? `<div class="feedback-banner ${isCorrect ? "correct" : "wrong"}">
                    <div>
                      ${
                        isCorrect
                          ? `✅ 완벽한 어순입니다! <strong>${D.escapeHtml(item.example)}</strong>`
                          : `❌ 올바른 문장: <strong>${D.escapeHtml(item.example)}</strong>`
                      }
                    </div>
                  </div>`
                : ""
            }
          </div>
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => {
        cleanup();
        ctx.onExit();
      });

      container.querySelector("#btn-tts").addEventListener("click", () => {
        TTS.speak(item.example, 0.88);
      });

      if (!answered) {
        container.querySelectorAll("[data-bank-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const bid = Number(btn.getAttribute("data-bank-id"));
            const obj = bank.find((b) => b.id === bid);
            if (obj && !obj.used) {
              obj.used = true;
              placed.push(bid);
              render();
            }
          });
        });

        container.querySelectorAll("[data-placed-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const bid = Number(btn.getAttribute("data-placed-id"));
            const obj = bank.find((b) => b.id === bid);
            if (obj) obj.used = false;
            placed = placed.filter((id) => id !== bid);
            render();
          });
        });

        container.querySelector("#btn-reset").addEventListener("click", () => {
          bank.forEach((b) => (b.used = false));
          placed = [];
          render();
        });

        container.querySelector("#btn-hint").addEventListener("click", () => {
          // Find first position where placed differs from tokens
          let matchLen = 0;
          while (matchLen < placed.length) {
            const obj = bank.find((b) => b.id === placed[matchLen]);
            if (obj && obj.text === tokens[matchLen]) matchLen++;
            else break;
          }
          // Return any misplaced tokens after matchLen
          for (let i = matchLen; i < placed.length; i++) {
            const obj = bank.find((b) => b.id === placed[i]);
            if (obj) obj.used = false;
          }
          placed = placed.slice(0, matchLen);
          if (matchLen < tokens.length) {
            const neededText = tokens[matchLen];
            const candidate = bank.find((b) => !b.used && b.text === neededText);
            if (candidate) {
              candidate.used = true;
              placed.push(candidate.id);
              hintsUsed += 1;
            }
          }
          render();
        });

        container.querySelector("#btn-check").addEventListener("click", () => {
          const userSentence = placed.map((bid) => bank.find((b) => b.id === bid).text).join(" ");
          const ok = D.normalizeAnswer(userSentence) === D.normalizeAnswer(item.example);
          answered = true;
          isCorrect = ok;
          S.recordWordResult(item, ok);

          if (ok) {
            correctCount += 1;
            streak += 1;
            if (streak > maxStreak) maxStreak = streak;
            score += Math.max(40, 120 - hintsUsed * 20) + Math.min(streak * 10, 50);
          } else {
            streak = 0;
            wrongWords.push(item);
          }
          TTS.speak(item.example);
          render();
        });
      } else {
        const btnNext = container.querySelector("#btn-next");
        btnNext.focus();
        btnNext.addEventListener("click", () => {
          idx += 1;
          loadQuestion();
        });
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((correctCount / Math.max(1, list.length)) * 100);
      ctx.onComplete({
        gameId: "unscramble",
        gameName: "문장 어순 블록 조립기",
        filterLabel: ctx.filterLabel,
        score,
        accuracy,
        correctCount,
        totalQuestions: list.length,
        maxStreak,
        durationSec,
        wrongWords,
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

    loadQuestion();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["unscramble"] = { mount };
})(window);
