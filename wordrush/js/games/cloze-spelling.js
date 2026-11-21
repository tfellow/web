// Game 1: 문맥 빈칸 & 스펠링 챌린지 (말해보카 스타일)
(function (global) {
  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    const totalBase = Math.min(ctx.questionCount || 10, ctx.items.length);
    const initialList = D.shuffle(ctx.items).slice(0, totalBase);
    const queue = initialList.map((item) => ({ item, isRetry: false }));

    let idx = 0;
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let firstAttemptCorrect = 0;
    const wrongMap = new Map();
    const startTime = Date.now();

    let hintLevel = 0; // 0: none, 1: first letter + length, 2: engDef
    let answered = false;
    let lastWasCorrect = false;
    let timerId = null;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function buildMaskedHint(blank) {
      return blank
        .split(" ")
        .map((w) => (w.length <= 1 ? w : w[0] + "_".repeat(w.length - 1)))
        .join(" ");
    }

    function render() {
      if (idx >= queue.length) {
        finish();
        return;
      }

      const entry = queue[idx];
      const item = entry.item;
      const parts = D.buildClozeParts(item);
      const pct = Math.round((idx / queue.length) * 100);
      const blankDisplay = answered
        ? D.escapeHtml(parts.blank)
        : hintLevel >= 1
          ? D.escapeHtml(buildMaskedHint(parts.blank))
          : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";

      const slotClass = answered ? (lastWasCorrect ? "blank-slot correct" : "blank-slot wrong") : "blank-slot";

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">📝 ${idx + 1} / ${queue.length}</span>
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
                <span class="badge badge-muted">${D.escapeHtml(item.pos)}</span>
                ${entry.isRetry ? `<span class="badge badge-danger">🔁 오답 복습 재출제</span>` : ""}
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-tts">🔊 예문 듣기</button>
            </div>

            <div class="sentence-display">
              ${D.escapeHtml(parts.before)}<span class="${slotClass}">${blankDisplay}</span>${D.escapeHtml(parts.after)}
            </div>
            <p class="ko-translation">${D.escapeHtml(item.exampleKo)}</p>

            <div class="hint-box">
              <strong>단어 뜻:</strong> (${D.escapeHtml(item.pos)}) ${D.escapeHtml(item.ko)}
              ${hintLevel >= 1 ? `<div style="margin-top:6px;"><strong>철자 힌트:</strong> <code>${D.escapeHtml(buildMaskedHint(parts.blank))}</code> (${parts.blank.length}글자)</div>` : ""}
              ${hintLevel >= 2 ? `<div style="margin-top:6px;"><strong>영영풀이:</strong> ${D.escapeHtml(item.engDef)}</div>` : ""}
            </div>

            <div class="cloze-input-row">
              <input
                type="text"
                id="cloze-input"
                class="text-input"
                placeholder="빈칸에 들어갈 영어 단어를 입력하세요"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                ${answered ? "disabled" : ""}
              />
              ${
                !answered
                  ? `<button class="btn btn-primary" id="btn-submit">정답 확인</button>`
                  : `<button class="btn btn-primary" id="btn-next">${idx + 1 < queue.length ? "다음 문제 →" : "결과 보기 🎉"}</button>`
              }
            </div>

            ${
              !answered
                ? `<div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" id="btn-hint-letter" ${hintLevel >= 1 ? "disabled" : ""}>💡 첫 글자 힌트</button>
                    <button class="btn btn-outline btn-sm" id="btn-hint-def" ${hintLevel >= 2 ? "disabled" : ""}>📖 영영풀이 힌트</button>
                    <button class="btn btn-outline btn-sm" id="btn-skip">모르겠어요 (정답 보기)</button>
                  </div>`
                : `<div class="feedback-banner ${lastWasCorrect ? "correct" : "wrong"}">
                    <div>
                      ${
                        lastWasCorrect
                          ? `✅ 정답입니다! <strong>${D.escapeHtml(parts.blank)}</strong> ${parts.blank.toLowerCase() !== item.word.toLowerCase() ? `(원형: ${D.escapeHtml(item.word)})` : ""}`
                          : `❌ 정답은 <strong>${D.escapeHtml(parts.blank)}</strong> ${parts.blank.toLowerCase() !== item.word.toLowerCase() ? `(원형: ${D.escapeHtml(item.word)})` : ""} 입니다. ${!entry.isRetry ? "<br><small>잠시 뒤 복습 문제로 다시 나옵니다!</small>" : ""}`
                      }
                    </div>
                    <button class="btn btn-secondary btn-sm" id="btn-tts-word">🔊 단어 듣기</button>
                  </div>`
            }
          </div>
        </div>
      `;

      const input = container.querySelector("#cloze-input");
      if (input && !answered) {
        input.focus();
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(input.value, parts.blank, entry);
          }
        });
      }

      container.querySelector("#btn-exit").addEventListener("click", () => {
        cleanup();
        ctx.onExit();
      });

      container.querySelector("#btn-tts").addEventListener("click", () => {
        TTS.speak(answered ? item.example : item.example.replace(parts.blank, "blank"));
      });

      if (!answered) {
        container.querySelector("#btn-submit").addEventListener("click", () => {
          handleSubmit(input.value, parts.blank, entry);
        });
        container.querySelector("#btn-hint-letter").addEventListener("click", () => {
          hintLevel = Math.max(hintLevel, 1);
          render();
        });
        container.querySelector("#btn-hint-def").addEventListener("click", () => {
          hintLevel = 2;
          render();
        });
        container.querySelector("#btn-skip").addEventListener("click", () => {
          handleSubmit("", parts.blank, entry, true);
        });
      } else {
        const btnNext = container.querySelector("#btn-next");
        btnNext.focus();
        btnNext.addEventListener("click", nextQuestion);
        const btnTtsWord = container.querySelector("#btn-tts-word");
        if (btnTtsWord) btnTtsWord.addEventListener("click", () => TTS.speak(item.word));
      }
    }

    function handleSubmit(val, blankText, entry, skipped = false) {
      if (answered) return;
      const item = entry.item;
      const ok = !skipped && D.isClozeAnswerCorrect(val, item, blankText);
      answered = true;
      lastWasCorrect = ok;

      if (!entry.isRetry) {
        S.recordWordResult(item, ok);
      }

      if (ok) {
        if (!entry.isRetry) firstAttemptCorrect += 1;
        streak += 1;
        if (streak > maxStreak) maxStreak = streak;
        const basePts = entry.isRetry ? 50 : 100;
        const penalty = hintLevel * 15;
        score += Math.max(30, basePts - penalty) + Math.min(streak * 10, 50);
        TTS.speak(item.example);
      } else {
        streak = 0;
        wrongMap.set(item.id, item);
        // Spaced retry: insert 2~3 items later (only once per word)
        if (!entry.isRetry) {
          const insertAt = Math.min(queue.length, idx + 3);
          queue.splice(insertAt, 0, { item, isRetry: true });
        }
        TTS.speak(item.word);
      }
      render();
    }

    function nextQuestion() {
      idx += 1;
      hintLevel = 0;
      answered = false;
      lastWasCorrect = false;
      render();
    }

    function onGlobalKey(e) {
      if (answered && e.key === "Enter") {
        e.preventDefault();
        nextQuestion();
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((firstAttemptCorrect / Math.max(1, totalBase)) * 100);
      ctx.onComplete({
        gameId: "cloze-spelling",
        gameName: "문맥 빈칸 & 스펠링 챌린지",
        filterLabel: ctx.filterLabel,
        score,
        accuracy,
        correctCount: firstAttemptCorrect,
        totalQuestions: totalBase,
        maxStreak,
        durationSec,
        wrongWords: Array.from(wrongMap.values()),
      });
    }

    function cleanup() {
      if (timerId) clearInterval(timerId);
      document.removeEventListener("keydown", onGlobalKey);
      TTS.stop();
    }

    document.addEventListener("keydown", onGlobalKey);
    timerId = setInterval(() => {
      const el = container.querySelector("#hud-time");
      if (el) el.textContent = `⏱️ ${getElapsedSec()}초`;
    }, 1000);

    render();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["cloze-spelling"] = { mount };
})(window);
