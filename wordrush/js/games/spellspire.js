// Game 5: 스펠스파이어 RPG 배틀 (Spellspire-style Word Battle)
(function (global) {
  const MONSTERS = [
    { name: "낱말 슬라임", emoji: "🟢", maxHp: 110, atk: 12 },
    { name: "스펠 고블린", emoji: "👺", maxHp: 160, atk: 16 },
    { name: "보스 워드 드래곤", emoji: "🐉", maxHp: 220, atk: 20 },
  ];
  const EXTRA_POOL = "aeiourstlncdmphbgwyf";

  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    const singleWords = ctx.items.filter((it) => /^[a-zA-Z]{3,10}$/.test(it.word.trim()));
    const source = singleWords.length >= 4 ? singleWords : D.getAllItems().filter((it) => /^[a-zA-Z]{3,10}$/.test(it.word.trim()));
    let deck = D.shuffle(source);
    let deckIdx = 0;

    let stage = 0;
    let playerHp = 100;
    let monsterHp = MONSTERS[0].maxHp;
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let correctCount = 0;
    let totalAttempts = 0;
    let totalWordLen = 0;
    const wrongMap = new Map();
    const startTime = Date.now();
    let timerId = null;

    let currentItem = null;
    let tiles = []; // [{ id, ch, used }]
    let pickedIds = [];
    let showDefHint = false;
    let battleLog = "알파벳 타일을 눌러 단어를 완성하고 몬스터를 공격하세요!";

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function nextTurn() {
      if (deckIdx >= deck.length) {
        deck = D.shuffle(source);
        deckIdx = 0;
      }
      currentItem = deck[deckIdx++];
      const letters = currentItem.word.trim().toLowerCase().split("");
      const tileCount = Math.max(10, letters.length);
      const arr = letters.slice();
      while (arr.length < tileCount) {
        arr.push(EXTRA_POOL[Math.floor(Math.random() * EXTRA_POOL.length)]);
      }
      tiles = D.shuffle(arr).map((ch, i) => ({ id: i, ch, used: false }));
      pickedIds = [];
      showDefHint = false;
      render();
    }

    function render() {
      const m = MONSTERS[stage];
      const pPct = Math.max(0, Math.round((playerHp / 100) * 100));
      const mPct = Math.max(0, Math.round((monsterHp / m.maxHp) * 100));
      const formed = pickedIds.map((id) => tiles.find((t) => t.id === id).ch).join("");

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">⚔️ 스테이지 ${stage + 1} / ${MONSTERS.length}</span>
              <span class="hud-pill">🔥 ${streak} 콤보</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>

          <div class="battle-stage">
            <div class="fighter-card">
              <div class="fighter-emoji">🛡️</div>
              <strong>문영 용사 (나)</strong>
              <div style="font-size:0.86rem; color:var(--text-muted); margin-top:2px;">HP ${playerHp} / 100</div>
              <div class="hp-bar"><div class="hp-fill" style="width:${pPct}%"></div></div>
            </div>
            <div class="fighter-card monster">
              <div class="fighter-emoji">${m.emoji}</div>
              <strong>${m.name}</strong>
              <div style="font-size:0.86rem; color:var(--text-muted); margin-top:2px;">HP ${monsterHp} / ${m.maxHp}</div>
              <div class="hp-bar"><div class="hp-fill monster" style="width:${mPct}%"></div></div>
            </div>
          </div>

          <div class="prompt-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
              <div>
                <span class="badge badge-primary">중${currentItem.grade} · ${currentItem.lesson}단원</span>
                <span class="badge badge-gold">${currentItem.word.length}글자 단어</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-outline btn-sm" id="btn-def-hint" ${showDefHint ? "disabled" : ""}>💡 영영풀이</button>
                <button class="btn btn-secondary btn-sm" id="btn-tts">🔊 발음 힌트</button>
              </div>
            </div>

            <div class="sentence-display" style="margin:12px 0 6px; font-size:1.35rem;">
              (${D.escapeHtml(currentItem.pos)}) ${D.escapeHtml(currentItem.ko)}
            </div>
            ${showDefHint ? `<div class="hint-box" style="margin-top:6px;">${D.escapeHtml(currentItem.engDef)}</div>` : ""}

            <div class="unscramble-zone" style="justify-content:center; min-height:66px; margin:14px 0;">
              ${
                pickedIds.length === 0
                  ? `<span style="color:var(--text-muted);">아래 알파벳 타일을 눌러 단어를 조립하세요!</span>`
                  : pickedIds
                      .map((id) => {
                        const t = tiles.find((x) => x.id === id);
                        return `<button class="letter-tile gold" data-picked="${id}">${t.ch}</button>`;
                      })
                      .join("")
              }
            </div>

            <div class="letter-rack">
              ${tiles
                .map(
                  (t) =>
                    `<button class="letter-tile ${t.used ? "used" : ""}" data-tile="${t.id}" ${t.used ? "disabled" : ""}>${t.ch}</button>`
                )
                .join("")}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:14px;">
              <div style="display:flex; gap:8px;">
                <button class="btn btn-outline btn-sm" id="btn-clear">↩️ 비우기</button>
                <button class="btn btn-outline btn-sm" id="btn-pass">패스 (피격)</button>
              </div>
              <button class="btn btn-gold" id="btn-attack" ${formed.length < 2 ? "disabled" : ""}>⚔️ 공격하기 (${formed.toUpperCase() || "..."})</button>
            </div>

            <div class="hint-box" style="margin-top:14px; font-weight:700;">${D.escapeHtml(battleLog)}</div>
          </div>
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => { cleanup(); ctx.onExit(); });
      container.querySelector("#btn-tts").addEventListener("click", () => TTS.speakEn(currentItem.word));
      container.querySelector("#btn-def-hint").addEventListener("click", () => { showDefHint = true; render(); });
      container.querySelector("#btn-clear").addEventListener("click", () => {
        tiles.forEach((t) => (t.used = false));
        pickedIds = [];
        render();
      });
      container.querySelector("#btn-pass").addEventListener("click", () => handleAttack(true));
      container.querySelector("#btn-attack").addEventListener("click", () => handleAttack(false));

      container.querySelectorAll("[data-tile]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-tile"));
          const t = tiles.find((x) => x.id === id);
          if (t && !t.used) {
            t.used = true;
            pickedIds.push(id);
            render();
          }
        });
      });

      container.querySelectorAll("[data-picked]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-picked"));
          const t = tiles.find((x) => x.id === id);
          if (t) t.used = false;
          pickedIds = pickedIds.filter((x) => x !== id);
          render();
        });
      });
    }

    function handleAttack(skipped) {
      const m = MONSTERS[stage];
      const formed = pickedIds.map((id) => tiles.find((t) => t.id === id).ch).join("").toLowerCase();
      const target = currentItem.word.trim().toLowerCase();
      const ok = !skipped && formed === target;

      totalAttempts += 1;
      S.recordWordResult(currentItem, ok);

      if (ok) {
        correctCount += 1;
        streak += 1;
        if (streak > maxStreak) maxStreak = streak;
        totalWordLen += target.length;
        const dmg = target.length * 14 + Math.min(streak * 10, 50) + (showDefHint ? 0 : 15);
        monsterHp = Math.max(0, monsterHp - dmg);
        score += dmg * 2;
        TTS.speakEn(currentItem.word);

        if (monsterHp <= 0) {
          stage += 1;
          if (stage >= MONSTERS.length) {
            score += 300; // Boss clear bonus
            finish(true);
            return;
          }
          monsterHp = MONSTERS[stage].maxHp;
          playerHp = Math.min(100, playerHp + 20);
          battleLog = `🎉 ${m.name} 처치! 체력 +20 회복! 다음 상대: ${MONSTERS[stage].name}`;
        } else {
          battleLog = `💥 명중! "${target}" (${target.length}글자) → ${dmg} 데미지!`;
        }
        nextTurn();
      } else {
        streak = 0;
        wrongMap.set(currentItem.id, currentItem);
        playerHp = Math.max(0, playerHp - m.atk);
        TTS.speakEn(currentItem.word);
        if (playerHp <= 0) {
          finish(false);
          return;
        }
        battleLog = `❌ 빗나감! 정답은 "${target}" — ${m.name}의 반격 (-${m.atk} HP)`;
        nextTurn();
      }
    }

    function onKey(e) {
      if (e.key === "Backspace") {
        if (pickedIds.length > 0) {
          const lastId = pickedIds.pop();
          const t = tiles.find((x) => x.id === lastId);
          if (t) t.used = false;
          render();
        }
      } else if (e.key === "Enter" && pickedIds.length >= 2) {
        e.preventDefault();
        handleAttack(false);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const ch = e.key.toLowerCase();
        const avail = tiles.find((t) => !t.used && t.ch === ch);
        if (avail) {
          avail.used = true;
          pickedIds.push(avail.id);
          render();
        }
      }
    }

    function finish(victory) {
      cleanup();
      const durationSec = getElapsedSec();
      const accuracy = Math.round((correctCount / Math.max(1, totalAttempts)) * 100);
      const avgLen = correctCount > 0 ? (totalWordLen / correctCount).toFixed(1) : "0";
      ctx.onComplete({
        gameId: "spellspire",
        gameName: `스펠스파이어 RPG (${victory ? "보스 클리어!" : "도전 종료"} · 평균 ${avgLen}글자)`,
        filterLabel: ctx.filterLabel,
        score,
        accuracy,
        correctCount,
        totalQuestions: Math.max(1, totalAttempts),
        maxStreak,
        durationSec,
        wrongWords: Array.from(wrongMap.values()),
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

    nextTurn();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["spellspire"] = { mount };
})(window);
