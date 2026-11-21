// Game 8: 교과서 워들 & 스펠링 비 (Wordle + Spelling Bee)
(function (global) {
  const KBD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  function evaluateWordle(guess, target) {
    const res = Array(target.length).fill("absent");
    const counts = {};
    for (let i = 0; i < target.length; i++) {
      if (guess[i] === target[i]) {
        res[i] = "correct";
      } else {
        counts[target[i]] = (counts[target[i]] || 0) + 1;
      }
    }
    for (let i = 0; i < target.length; i++) {
      if (res[i] !== "correct" && counts[guess[i]] > 0) {
        res[i] = "present";
        counts[guess[i]] -= 1;
      }
    }
    return res;
  }

  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    let subMode = "wordle"; // 'wordle' | 'bee'
    let score = 0;
    let correctCount = 0;
    let totalQuestions = 0;
    const wrongWords = [];
    const startTime = Date.now();
    let timerId = null;

    // --- Wordle state ---
    const wordlePool = ctx.items.filter((it) => /^[a-zA-Z]{4,7}$/.test(it.word.trim()));
    const wSource = wordlePool.length >= 3 ? wordlePool : D.getAllItems().filter((it) => /^[a-zA-Z]{4,7}$/.test(it.word.trim()));
    const wList = D.shuffle(wSource).slice(0, Math.min(3, wSource.length));
    let wRound = 0;
    let wGuesses = []; // [{ word, eval }]
    let wInput = "";
    let wDone = false;
    let wWon = false;
    let wShowDef = false;

    // --- Spelling Bee state ---
    let beeCenter = "e";
    let beeOuter = ["a", "r", "s", "t", "n", "l"];
    let beeValidItems = [];
    let beeFoundIds = new Set();
    let beeInput = "";
    let beeMsg = "중앙 금색 알파벳을 반드시 포함해 4글자 이상 교과서 단어를 만들어 보세요!";
    let beeShowHints = false;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function initBee() {
      const allClean = D.getAllItems().filter((it) => /^[a-zA-Z]{4,12}$/.test(it.word.trim()));
      let bestSet = null;
      // Pick a 7-letter combination from a real textbook word that yields >= 5 valid textbook words
      const seeds = D.shuffle(allClean.filter((it) => new Set(it.word.toLowerCase()).size >= 5));
      for (const seed of seeds.slice(0, 60)) {
        const letters = Array.from(new Set(seed.word.toLowerCase().split("")));
        const extra = D.shuffle("aeiourstlncdmphg".split(""));
        for (const ch of extra) {
          if (letters.length >= 7) break;
          if (!letters.includes(ch)) letters.push(ch);
        }
        if (letters.length < 7) continue;
        const allowed = new Set(letters.slice(0, 7));
        const center = letters[0];
        const matches = allClean.filter((it) => {
          const w = it.word.toLowerCase();
          if (!w.includes(center)) return false;
          for (const ch of w) if (!allowed.has(ch)) return false;
          return true;
        });
        if (!bestSet || matches.length > bestSet.matches.length) {
          bestSet = { center, outer: letters.slice(1, 7), matches };
          if (matches.length >= 8) break;
        }
      }
      if (bestSet) {
        beeCenter = bestSet.center;
        beeOuter = bestSet.outer;
        // Deduplicate by word
        const seen = new Set();
        beeValidItems = bestSet.matches.filter((it) => {
          const k = it.word.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      beeFoundIds = new Set();
      beeInput = "";
      beeShowHints = false;
      beeMsg = `중앙 금색 글자 [${beeCenter.toUpperCase()}] 포함! 찾을 수 있는 교과서 단어: 총 ${beeValidItems.length}개`;
    }

    function resetWordleRound() {
      if (wRound >= wList.length) {
        finish();
        return;
      }
      wGuesses = [];
      wInput = "";
      wDone = false;
      wWon = false;
      wShowDef = false;
      render();
    }

    function submitWordle() {
      if (wDone) return;
      const item = wList[wRound];
      const target = item.word.trim().toLowerCase();
      if (wInput.length !== target.length) return;

      const ev = evaluateWordle(wInput.toLowerCase(), target);
      wGuesses.push({ word: wInput.toLowerCase(), eval: ev });
      wInput = "";

      if (ev.every((x) => x === "correct")) {
        wDone = true;
        wWon = true;
        totalQuestions += 1;
        correctCount += 1;
        score += Math.max(100, 220 - (wGuesses.length - 1) * 25);
        S.recordWordResult(item, true);
        TTS.speakEn(item.word);
      } else if (wGuesses.length >= 6) {
        wDone = true;
        wWon = false;
        totalQuestions += 1;
        wrongWords.push(item);
        S.recordWordResult(item, false);
        TTS.speakEn(item.word);
      }
      render();
    }

    function submitBee() {
      const guess = beeInput.trim().toLowerCase();
      beeInput = "";
      if (guess.length < 4) {
        beeMsg = "4글자 이상 입력해 주세요!";
        render();
        return;
      }
      if (!guess.includes(beeCenter)) {
        beeMsg = `중앙 금색 글자 [${beeCenter.toUpperCase()}]가 꼭 들어가야 해요!`;
        render();
        return;
      }
      const match = beeValidItems.find((it) => it.word.toLowerCase() === guess);
      if (!match) {
        beeMsg = `"${guess}" 은(는) 교과서 단어 목록에 없어요. 다시 도전해 보세요!`;
        render();
        return;
      }
      if (beeFoundIds.has(match.id)) {
        beeMsg = `"${guess}" 은(는) 이미 찾은 단어예요!`;
        render();
        return;
      }
      beeFoundIds.add(match.id);
      totalQuestions += 1;
      correctCount += 1;
      const pts = guess.length * 25;
      score += pts;
      S.recordWordResult(match, true);
      TTS.speakEn(match.word);
      beeMsg = `🎉 발견! "${match.word}" (${match.ko}) +${pts}점! (${beeFoundIds.size}/${beeValidItems.length})`;
      render();
    }

    function renderWordle() {
      const item = wList[wRound];
      const target = item.word.trim().toLowerCase();
      const len = target.length;

      // Key status map
      const keyState = {};
      const rank = { absent: 1, present: 2, correct: 3 };
      wGuesses.forEach((g) => {
        g.word.split("").forEach((ch, i) => {
          const st = g.eval[i];
          const up = ch.toUpperCase();
          if (!keyState[up] || rank[st] > rank[keyState[up]]) keyState[up] = st;
        });
      });

      const rowsHtml = [];
      for (let r = 0; r < 6; r++) {
        const g = wGuesses[r];
        const isCur = r === wGuesses.length && !wDone;
        const cells = [];
        for (let c = 0; c < len; c++) {
          const ch = g ? g.word[c] : isCur ? wInput[c] || "" : "";
          const cls = g ? `wordle-cell ${g.eval[c]}` : "wordle-cell";
          cells.push(`<div class="${cls}">${D.escapeHtml(ch)}</div>`);
        }
        rowsHtml.push(`<div class="wordle-row">${cells.join("")}</div>`);
      }

      return `
        <div class="prompt-box">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
            <div>
              <span class="badge badge-primary">워들 ${wRound + 1} / ${wList.length}</span>
              <span class="badge badge-gold">${len}글자 · 중${item.grade} ${item.lesson}단원</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline btn-sm" id="btn-w-def" ${wShowDef ? "disabled" : ""}>💡 영영풀이</button>
              <button class="btn btn-secondary btn-sm" id="btn-w-tts">🔊 발음 듣기</button>
            </div>
          </div>

          <div class="hint-box" style="margin-top:12px;">
            <strong>단어 뜻:</strong> (${D.escapeHtml(item.pos)}) ${D.escapeHtml(item.ko)}
            ${wShowDef ? `<div style="margin-top:6px;"><strong>영영풀이:</strong> ${D.escapeHtml(item.engDef)}</div>` : ""}
          </div>

          <div class="wordle-board">${rowsHtml.join("")}</div>

          ${
            !wDone
              ? `
                <div class="kbd-wrap">
                  ${KBD_ROWS.map(
                    (row, rIdx) => `
                    <div class="kbd-row">
                      ${rIdx === 2 ? `<button class="kbd-key wide" id="w-enter">확인</button>` : ""}
                      ${row
                        .split("")
                        .map((ch) => `<button class="kbd-key ${keyState[ch] || ""}" data-wkey="${ch}">${ch}</button>`)
                        .join("")}
                      ${rIdx === 2 ? `<button class="kbd-key wide" id="w-bs">⌫</button>` : ""}
                    </div>
                  `
                  ).join("")}
                </div>
              `
              : `
                <div class="feedback-banner ${wWon ? "correct" : "wrong"}">
                  <div>
                    ${wWon ? "🎉 정답입니다!" : "❌ 아쉽지만 다음 기회에!"} <strong>${D.escapeHtml(item.word)}</strong> (${D.escapeHtml(item.ko)})
                  </div>
                  <button class="btn btn-primary btn-sm" id="btn-w-next">${wRound + 1 < wList.length ? "다음 단어 →" : "결과 보기 🎉"}</button>
                </div>
              `
          }
        </div>
      `;
    }

    function renderBee() {
      const allHex = [beeOuter[0], beeOuter[1], beeOuter[2], beeCenter, beeOuter[3], beeOuter[4], beeOuter[5]];
      const foundList = beeValidItems.filter((it) => beeFoundIds.has(it.id));
      const remainList = beeValidItems.filter((it) => !beeFoundIds.has(it.id));

      return `
        <div class="prompt-box">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="badge badge-gold">🐝 발견한 단어: ${beeFoundIds.size} / ${beeValidItems.length}개</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-outline btn-sm" id="btn-bee-shuffle">🔀 섞기</button>
              <button class="btn btn-outline btn-sm" id="btn-bee-hint">${beeShowHints ? "🙈 뜻 힌트 숨기기" : "💡 남은 단어 뜻 힌트"}</button>
              <button class="btn btn-primary btn-sm" id="btn-bee-finish">결과 저장 & 종료</button>
            </div>
          </div>

          <div class="hint-box" style="margin-top:12px; font-weight:700;">${D.escapeHtml(beeMsg)}</div>

          <div style="text-align:center; font-size:1.75rem; font-weight:900; letter-spacing:0.12em; min-height:46px; margin-top:14px; color:var(--navy);">
            ${D.escapeHtml(beeInput.toUpperCase()) || '<span style="color:#b0b9d0;">TAP LETTERS</span>'}
          </div>

          <div class="bee-hive">
            ${allHex
              .map(
                (ch) =>
                  `<button class="bee-hex ${ch === beeCenter ? "center" : ""}" data-bkey="${ch}">${ch}</button>`
              )
              .join("")}
          </div>

          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="btn-bee-bs">⌫ 지우기</button>
            <button class="btn btn-gold" id="btn-bee-submit" ${beeInput.length < 4 ? "disabled" : ""}>단어 확인</button>
          </div>

          ${
            foundList.length > 0
              ? `<div style="margin-top:16px; display:flex; flex-wrap:wrap; gap:8px;">
                  ${foundList.map((it) => `<span class="badge badge-success" style="font-size:0.86rem; padding:6px 11px;">${D.escapeHtml(it.word)} (${D.escapeHtml(it.ko)})</span>`).join("")}
                </div>`
              : ""
          }

          ${
            beeShowHints && remainList.length > 0
              ? `<div class="hint-box" style="margin-top:14px;">
                  <strong>남은 단어 힌트:</strong><br>
                  ${remainList.slice(0, 12).map((it) => `• ${it.word.length}글자 (${it.word[0].toUpperCase()}...) — ${D.escapeHtml(it.ko)}`).join("<br>")}
                </div>`
              : ""
          }
        </div>
      `;
    }

    function render() {
      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>

          <div class="card" style="margin-bottom:14px; padding:12px 16px;">
            <div class="chip-group">
              <button class="chip ${subMode === "wordle" ? "active" : ""}" data-pmode="wordle">🟩 교과서 워들 (6번 추리)</button>
              <button class="chip ${subMode === "bee" ? "active" : ""}" data-pmode="bee">🐝 스펠링 비 (벌집 조합)</button>
            </div>
          </div>

          ${subMode === "wordle" ? renderWordle() : renderBee()}
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => { cleanup(); ctx.onExit(); });
      container.querySelectorAll("[data-pmode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.getAttribute("data-pmode");
          if (next !== subMode) {
            subMode = next;
            if (subMode === "bee" && beeValidItems.length === 0) initBee();
            render();
          }
        });
      });

      if (subMode === "wordle") {
        const item = wList[wRound];
        const maxLen = item.word.trim().length;
        container.querySelector("#btn-w-tts").addEventListener("click", () => TTS.speakEn(item.word));
        const btnDef = container.querySelector("#btn-w-def");
        if (btnDef) btnDef.addEventListener("click", () => { wShowDef = true; render(); });

        if (!wDone) {
          container.querySelectorAll("[data-wkey]").forEach((btn) => {
            btn.addEventListener("click", () => {
              if (wInput.length < maxLen) {
                wInput += btn.getAttribute("data-wkey").toLowerCase();
                render();
              }
            });
          });
          container.querySelector("#w-bs").addEventListener("click", () => {
            wInput = wInput.slice(0, -1);
            render();
          });
          container.querySelector("#w-enter").addEventListener("click", submitWordle);
        } else {
          container.querySelector("#btn-w-next").addEventListener("click", () => {
            wRound += 1;
            resetWordleRound();
          });
        }
      } else {
        container.querySelectorAll("[data-bkey]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (beeInput.length < 14) {
              beeInput += btn.getAttribute("data-bkey");
              render();
            }
          });
        });
        container.querySelector("#btn-bee-bs").addEventListener("click", () => {
          beeInput = beeInput.slice(0, -1);
          render();
        });
        container.querySelector("#btn-bee-shuffle").addEventListener("click", () => {
          beeOuter = D.shuffle(beeOuter);
          render();
        });
        container.querySelector("#btn-bee-hint").addEventListener("click", () => {
          beeShowHints = !beeShowHints;
          render();
        });
        container.querySelector("#btn-bee-submit").addEventListener("click", submitBee);
        container.querySelector("#btn-bee-finish").addEventListener("click", finish);
      }
    }

    function onKey(e) {
      if (subMode === "wordle") {
        if (wDone) {
          if (e.key === "Enter") { wRound += 1; resetWordleRound(); }
          return;
        }
        const maxLen = wList[wRound].word.trim().length;
        if (/^[a-zA-Z]$/.test(e.key) && wInput.length < maxLen) {
          wInput += e.key.toLowerCase();
          render();
        } else if (e.key === "Backspace") {
          wInput = wInput.slice(0, -1);
          render();
        } else if (e.key === "Enter") {
          submitWordle();
        }
      } else {
        const allowed = new Set([beeCenter, ...beeOuter]);
        if (/^[a-zA-Z]$/.test(e.key) && allowed.has(e.key.toLowerCase())) {
          beeInput += e.key.toLowerCase();
          render();
        } else if (e.key === "Backspace") {
          beeInput = beeInput.slice(0, -1);
          render();
        } else if (e.key === "Enter") {
          submitBee();
        }
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const denom = Math.max(1, totalQuestions);
      const accuracy = Math.round((correctCount / denom) * 100);
      ctx.onComplete({
        gameId: "word-puzzle",
        gameName: subMode === "wordle" ? "교과서 워들" : "스펠링 비",
        filterLabel: ctx.filterLabel,
        score,
        accuracy,
        correctCount,
        totalQuestions: denom,
        maxStreak: correctCount,
        durationSec,
        wrongWords,
      });
    }

    function cleanup() {
      if (timerId) clearInterval(timerId);
      document.removeEventListener("keydown", onKey);
      TTS.stop();
    }

    document.addEventListener("keydown", onKey);
    timerId = setInterval(() => {
      const el = container.querySelector("#hud-time");
      if (el) el.textContent = `⏱️ ${getElapsedSec()}초`;
    }, 1000);

    resetWordleRound();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["word-puzzle"] = { mount };
})(window);
