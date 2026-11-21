// Game 4: 영영풀이 퀴즈쇼 (Eng-Eng Definition Quiz)
(function (global) {
  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    const total = Math.min(ctx.questionCount || 10, ctx.items.length);
    const list = D.shuffle(ctx.items).slice(0, total);

    let idx = 0;
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let correctCount = 0;
    const wrongWords = [];
    const startTime = Date.now();
    let timerId = null;

    let choices = [];
    let showKoHint = false;
    let selectedId = null;
    let answered = false;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function loadQuestion() {
      if (idx >= list.length) {
        finish();
        return;
      }
      const item = list[idx];
      const distractors = D.getDistractors(item, ctx.items, 3);
      choices = D.shuffle([item, ...distractors]);
      showKoHint = false;
      selectedId = null;
      answered = false;
      render();
    }

    function render() {
      const item = list[idx];
      const pct = Math.round((idx / list.length) * 100);

      const choicesHtml = choices
        .map((c, i) => {
          let cls = "choice-btn";
          if (answered) {
            if (c.id === item.id) cls += " correct";
            else if (c.id === selectedId) cls += " wrong";
          }
          return `
            <button class="${cls}" data-choice-id="${c.id}" ${answered ? "disabled" : ""}>
              <span class="choice-num">${i + 1}</span>
              <span>${D.escapeHtml(c.word)}</span>
            </button>
          `;
        })
        .join("");

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">📖 ${idx + 1} / ${list.length}</span>
              <span class="hud-pill">🔥 ${streak} 콤보</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>

          <div class="prompt-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge badge-primary">중${item.grade} · ${item.lesson}단원</span>
                <span class="badge badge-muted">품사: ${D.escapeHtml(item.pos)}</span>
              </div>
              <div style="display:flex; gap:8px;">
                ${!answered && !showKoHint ? `<button class="btn btn-outline btn-sm" id="btn-ko-hint">💡 한글 뜻 힌트</button>` : ""}
                <button class="btn btn-secondary btn-sm" id="btn-tts-def">🔊 영영풀이 듣기</button>
              </div>
            </div>

            <div class="sentence-display" style="margin-top:16px;">
              “${D.escapeHtml(item.engDef)}”
            </div>

            ${
              showKoHint || answered
                ? `<div class="hint-box">
                    <strong>한글 뜻:</strong> (${D.escapeHtml(item.pos)}) ${D.escapeHtml(item.ko)}
                    ${answered ? `<div style="margin-top:6px;"><strong>예문:</strong> ${D.escapeHtml(item.example)}<br><span style="color:var(--text-muted);">${D.escapeHtml(item.exampleKo)}</span></div>` : ""}
                  </div>`
                : ""
            }

            <div class="choice-grid">${choicesHtml}</div>

            ${
              answered
                ? `<div class="feedback-banner ${selectedId === item.id ? "correct" : "wrong"}">
                    <div>
                      ${
                        selectedId === item.id
                          ? `✅ 정답! <strong>${D.escapeHtml(item.word)}</strong> (${D.escapeHtml(item.ko)})`
                          : `❌ 정답은 <strong>${D.escapeHtml(item.word)}</strong> (${D.escapeHtml(item.ko)}) 입니다.`
                      }
                    </div>
                    <button class="btn btn-primary btn-sm" id="btn-next">${idx + 1 < list.length ? "다음 문제 →" : "결과 보기 🎉"}</button>
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

      container.querySelector("#btn-tts-def").addEventListener("click", () => {
        TTS.speak(item.engDef, 0.9);
      });

      const btnHint = container.querySelector("#btn-ko-hint");
      if (btnHint) {
        btnHint.addEventListener("click", () => {
          showKoHint = true;
          render();
        });
      }

      if (!answered) {
        container.querySelectorAll("[data-choice-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            selectChoice(btn.getAttribute("data-choice-id"));
          });
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

    function selectChoice(choiceId) {
      if (answered) return;
      const item = list[idx];
      answered = true;
      selectedId = choiceId;
      const ok = choiceId === item.id;
      S.recordWordResult(item, ok);

      if (ok) {
        correctCount += 1;
        streak += 1;
        if (streak > maxStreak) maxStreak = streak;
        score += (showKoHint ? 70 : 100) + Math.min(streak * 15, 60);
      } else {
        streak = 0;
        wrongWords.push(item);
      }
      TTS.speak(item.word);
      render();
    }

    function onGlobalKey(e) {
      if (!answered && ["1", "2", "3", "4"].includes(e.key)) {
        const i = Number(e.key) - 1;
        if (choices[i]) selectChoice(choices[i].id);
      } else if (answered && e.key === "Enter") {
        e.preventDefault();
        idx += 1;
        loadQuestion();
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((correctCount / Math.max(1, list.length)) * 100);
      ctx.onComplete({
        gameId: "engdef-quiz",
        gameName: "영영풀이 퀴즈쇼",
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
      document.removeEventListener("keydown", onGlobalKey);
      TTS.stop();
    }

    document.addEventListener("keydown", onGlobalKey);
    timerId = setInterval(() => {
      const el = container.querySelector("#hud-time");
      if (el) el.textContent = `⏱️ ${getElapsedSec()}초`;
    }, 1000);

    loadQuestion();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["engdef-quiz"] = { mount };
})(window);
