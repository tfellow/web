// Game 6: 크립토그램 암호 해독 (Cryptogram Sentence Puzzle)
(function (global) {
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const KBD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  function buildCipher() {
    const shuffled = ALPHA.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Ensure derangement (no letter maps to itself)
    for (let i = 0; i < 26; i++) {
      if (shuffled[i] === ALPHA[i]) {
        const swap = (i + 1) % 26;
        [shuffled[i], shuffled[swap]] = [shuffled[swap], shuffled[i]];
      }
    }
    const enc = {};
    const dec = {};
    for (let i = 0; i < 26; i++) {
      enc[ALPHA[i]] = shuffled[i];
      dec[shuffled[i]] = ALPHA[i];
    }
    return { enc, dec };
  }

  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    const candidates = ctx.items.filter((it) => it.example && it.example.length >= 20 && it.example.length <= 68);
    const source = candidates.length >= 3 ? candidates : ctx.items;
    const totalRounds = Math.min(3, source.length);
    const list = D.shuffle(source).slice(0, totalRounds);

    let round = 0;
    let score = 0;
    let correctRounds = 0;
    let totalHints = 0;
    const wrongWords = [];
    const startTime = Date.now();
    let timerId = null;

    let cipher = null;
    let lockedCiphers = new Set(); // cipher letters pre-revealed or hinted
    let guesses = {}; // cipherChar -> plainChar
    let activeCipher = null;
    let solved = false;
    let gaveUp = false;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function loadRound() {
      if (round >= list.length) {
        finish();
        return;
      }
      const item = list[round];
      cipher = buildCipher();
      lockedCiphers = new Set();
      guesses = {};
      solved = false;
      gaveUp = false;

      const upper = item.example.toUpperCase();
      const uniquePlain = Array.from(new Set(upper.replace(/[^A-Z]/g, "").split("")));
      // Pre-reveal ~40% of unique letters for middle-school friendly difficulty
      const revealCount = Math.max(2, Math.floor(uniquePlain.length * 0.42));
      D.shuffle(uniquePlain)
        .slice(0, revealCount)
        .forEach((p) => {
          const c = cipher.enc[p];
          lockedCiphers.add(c);
          guesses[c] = p;
        });

      const firstOpen = uniquePlain.map((p) => cipher.enc[p]).find((c) => !lockedCiphers.has(c));
      activeCipher = firstOpen || null;
      render();
    }

    function checkSolved(item) {
      const upper = item.example.toUpperCase();
      for (const ch of upper) {
        if (/[A-Z]/.test(ch)) {
          const c = cipher.enc[ch];
          if (guesses[c] !== ch) return false;
        }
      }
      return true;
    }

    function assignLetter(plainChar) {
      if (solved || !activeCipher || lockedCiphers.has(activeCipher)) return;
      guesses[activeCipher] = plainChar;

      const item = list[round];
      if (checkSolved(item)) {
        solved = true;
        correctRounds += 1;
        score += Math.max(120, 260 - totalHints * 25);
        S.recordWordResult(item, true);
        TTS.speakEn(item.example);
      } else {
        // Move focus to next empty cipher letter
        const upper = item.example.toUpperCase();
        const uniqueC = Array.from(new Set(upper.replace(/[^A-Z]/g, "").split("").map((p) => cipher.enc[p])));
        const nextEmpty = uniqueC.find((c) => !lockedCiphers.has(c) && !guesses[c]);
        if (nextEmpty) activeCipher = nextEmpty;
      }
      render();
    }

    function render() {
      const item = list[round];
      const words = item.example.split(" ");
      const pct = Math.round((round / list.length) * 100);

      const sentenceHtml = words
        .map((w) => {
          const cells = w
            .split("")
            .map((ch) => {
              const up = ch.toUpperCase();
              if (!/[A-Z]/.test(up)) {
                return `<div class="crypto-cell" style="width:16px;"><div style="height:40px; display:flex; align-items:center; font-size:1.25rem; font-weight:900;">${D.escapeHtml(ch)}</div><div class="crypto-code">&nbsp;</div></div>`;
              }
              const c = cipher.enc[up];
              const isLocked = lockedCiphers.has(c);
              const isActive = activeCipher === c;
              const val = guesses[c] || "";
              const cls = [
                "crypto-guess",
                isLocked ? "locked" : "",
                !isLocked && isActive ? "active" : "",
                !isLocked && !isActive && activeCipher === c ? "same-cipher" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return `
                <button class="crypto-cell" data-cipher="${c}" ${isLocked || solved ? "disabled" : ""}>
                  <span class="${cls}">${D.escapeHtml(val)}</span>
                  <span class="crypto-code">${c}</span>
                </button>
              `;
            })
            .join("");
          return `<div class="crypto-word">${cells}</div>`;
        })
        .join("");

      const usedPlain = new Set(Object.values(guesses));

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">🔐 암호 ${round + 1} / ${list.length}</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>

          <div class="prompt-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
              <div>
                <span class="badge badge-primary">중${item.grade} · ${item.lesson}단원</span>
                <span class="badge badge-gold">핵심 단어: ${D.escapeHtml(item.word)} (${D.escapeHtml(item.ko)})</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-tts">🔊 원문 듣기 힌트</button>
            </div>

            <div class="hint-box" style="margin-top:12px;">
              <strong>문장 해석:</strong> ${D.escapeHtml(item.exampleKo)}
            </div>

            <div class="crypto-sentence">${sentenceHtml}</div>

            ${
              !solved
                ? `
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px;">
                    <div style="font-size:0.88rem; color:var(--text-muted); font-weight:700;">
                      ${activeCipher ? `선택된 암호 글자: <strong>${activeCipher}</strong> → 아래 키보드에서 원래 알파벳을 누르세요` : "빈 칸을 먼저 눌러 선택하세요"}
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-outline btn-sm" id="btn-hint">💡 1글자 해독 힌트</button>
                      <button class="btn btn-outline btn-sm" id="btn-giveup">정답 보기</button>
                    </div>
                  </div>
                  <div class="kbd-wrap">
                    ${KBD_ROWS.map(
                      (row) => `
                      <div class="kbd-row">
                        ${row
                          .split("")
                          .map((ch) => `<button class="kbd-key ${usedPlain.has(ch) ? "absent" : ""}" data-key="${ch}">${ch}</button>`)
                          .join("")}
                      </div>
                    `
                    ).join("")}
                    <div class="kbd-row">
                      <button class="kbd-key wide" id="btn-backspace">⌫ 지우기</button>
                    </div>
                  </div>
                `
                : `
                  <div class="feedback-banner ${gaveUp ? "wrong" : "correct"}">
                    <div>
                      ${gaveUp ? "🔓 정답 공개:" : "🎉 암호 해독 성공!"} <strong>${D.escapeHtml(item.example)}</strong>
                    </div>
                    <button class="btn btn-primary btn-sm" id="btn-next">${round + 1 < list.length ? "다음 암호 →" : "결과 보기 🎉"}</button>
                  </div>
                `
            }
          </div>
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => { cleanup(); ctx.onExit(); });
      container.querySelector("#btn-tts").addEventListener("click", () => TTS.speakEn(item.example, 0.85));

      if (!solved) {
        container.querySelectorAll("[data-cipher]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const c = btn.getAttribute("data-cipher");
            if (!lockedCiphers.has(c)) {
              activeCipher = c;
              render();
            }
          });
        });

        container.querySelectorAll("[data-key]").forEach((btn) => {
          btn.addEventListener("click", () => assignLetter(btn.getAttribute("data-key")));
        });

        const btnBs = container.querySelector("#btn-backspace");
        if (btnBs) {
          btnBs.addEventListener("click", () => {
            if (activeCipher && !lockedCiphers.has(activeCipher)) {
              delete guesses[activeCipher];
              render();
            }
          });
        }

        container.querySelector("#btn-hint").addEventListener("click", () => {
          const upper = item.example.toUpperCase();
          const remaining = Array.from(new Set(upper.replace(/[^A-Z]/g, "").split("")))
            .map((p) => cipher.enc[p])
            .filter((c) => !lockedCiphers.has(c) && guesses[c] !== cipher.dec[c]);
          if (remaining.length > 0) {
            const targetC = activeCipher && remaining.includes(activeCipher) ? activeCipher : remaining[0];
            lockedCiphers.add(targetC);
            guesses[targetC] = cipher.dec[targetC];
            totalHints += 1;
            if (checkSolved(item)) {
              solved = true;
              correctRounds += 1;
              score += Math.max(100, 240 - totalHints * 25);
              S.recordWordResult(item, true);
              TTS.speakEn(item.example);
            }
            render();
          }
        });

        container.querySelector("#btn-giveup").addEventListener("click", () => {
          gaveUp = true;
          solved = true;
          const upper = item.example.toUpperCase();
          for (const ch of upper) {
            if (/[A-Z]/.test(ch)) {
              const c = cipher.enc[ch];
              guesses[c] = ch;
              lockedCiphers.add(c);
            }
          }
          wrongWords.push(item);
          S.recordWordResult(item, false);
          TTS.speakEn(item.example);
          render();
        });
      } else {
        container.querySelector("#btn-next").addEventListener("click", () => {
          round += 1;
          loadRound();
        });
      }
    }

    function onKey(e) {
      if (solved) {
        if (e.key === "Enter") {
          round += 1;
          loadRound();
        }
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        assignLetter(e.key.toUpperCase());
      } else if (e.key === "Backspace" && activeCipher && !lockedCiphers.has(activeCipher)) {
        delete guesses[activeCipher];
        render();
      }
    }

    function finish() {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((correctRounds / Math.max(1, list.length)) * 100);
      ctx.onComplete({
        gameId: "cryptogram",
        gameName: "크립토그램 암호 해독",
        filterLabel: ctx.filterLabel,
        score,
        accuracy,
        correctCount: correctRounds,
        totalQuestions: list.length,
        maxStreak: correctRounds,
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

    loadRound();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["cryptogram"] = { mount };
})(window);
