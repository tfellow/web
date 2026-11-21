// Game 7: 커넥션즈 (Connections — 4x4 4그룹 묶기)
(function (global) {
  const POS_LABELS = {
    "n.": "명사 (Noun)",
    "v.": "동사 (Verb)",
    "adj.": "형용사 (Adjective)",
    "adv.": "부사 (Adverb)",
    "phr.": "숙어·표현 (Phrase)",
  };

  function mount(container, ctx) {
    const D = global.MY_DATA;
    const TTS = global.MY_TTS;
    const S = global.MY_STORAGE;

    let groupMode = "lesson"; // 'lesson' | 'pos'
    let groups = []; // [{ id, label, colorIdx, items: [4] }]
    let remainingTiles = []; // [{ item, groupId }]
    let solvedGroups = [];
    let selectedIds = [];
    let lives = 4;
    let score = 0;
    let feedback = "같은 단원 또는 같은 품사에 속하는 단어 4개를 골라 묶어 보세요!";
    let showMeanings = false;
    let finished = false;
    const wrongWords = [];
    const startTime = Date.now();
    let timerId = null;

    function getElapsedSec() {
      return Math.max(1, Math.round((Date.now() - startTime) / 1000));
    }

    function buildPuzzle() {
      const pool = ctx.items.length >= 16 ? ctx.items : D.getAllItems();
      const buckets = new Map();

      if (groupMode === "lesson") {
        pool.forEach((it) => {
          const key = `G${it.grade}-L${it.lesson}`;
          if (!buckets.has(key)) buckets.set(key, { label: `중${it.grade} ${it.lesson}단원 어휘`, items: [] });
          buckets.get(key).items.push(it);
        });
      } else {
        pool.forEach((it) => {
          const key = it.isPhrase ? "phr." : it.pos;
          if (!POS_LABELS[key]) return;
          if (!buckets.has(key)) buckets.set(key, { label: POS_LABELS[key], items: [] });
          buckets.get(key).items.push(it);
        });
      }

      let validBuckets = Array.from(buckets.entries()).filter(([, b]) => b.items.length >= 4);
      // Fallback to all items if current filter has fewer than 4 buckets
      if (validBuckets.length < 4) {
        buckets.clear();
        D.getAllItems().forEach((it) => {
          const key = groupMode === "lesson" ? `G${it.grade}-L${it.lesson}` : it.isPhrase ? "phr." : it.pos;
          if (groupMode === "pos" && !POS_LABELS[key]) return;
          if (!buckets.has(key)) {
            buckets.set(key, {
              label: groupMode === "lesson" ? `중${it.grade} ${it.lesson}단원 어휘` : POS_LABELS[key],
              items: [],
            });
          }
          buckets.get(key).items.push(it);
        });
        validBuckets = Array.from(buckets.entries()).filter(([, b]) => b.items.length >= 4);
      }

      const chosen = D.shuffle(validBuckets).slice(0, 4);
      groups = chosen.map(([key, b], idx) => ({
        id: key,
        label: b.label,
        colorIdx: idx,
        items: D.shuffle(b.items).slice(0, 4),
      }));

      remainingTiles = D.shuffle(
        groups.flatMap((g) => g.items.map((item) => ({ item, groupId: g.id })))
      );
      solvedGroups = [];
      selectedIds = [];
      lives = 4;
      score = 0;
      finished = false;
      feedback =
        groupMode === "lesson"
          ? "서로 같은 단원에 나오는 단어 4개씩 4그룹으로 묶어 보세요!"
          : "서로 같은 품사(명사·동사·형용사·부사·숙어) 4개씩 4그룹으로 묶어 보세요!";
      render();
    }

    function render() {
      const hearts = "❤️".repeat(lives) + "🤍".repeat(Math.max(0, 4 - lives));

      const solvedHtml = solvedGroups
        .map(
          (g) => `
          <div class="conn-solved-group conn-g${g.colorIdx}">
            <div style="font-size:0.95rem; margin-bottom:4px;">${D.escapeHtml(g.label)}</div>
            <div style="font-size:0.92rem; font-weight:600;">
              ${g.items.map((it) => `${D.escapeHtml(it.word)}(${D.escapeHtml(it.ko)})`).join(" · ")}
            </div>
          </div>
        `
        )
        .join("");

      const gridHtml = remainingTiles
        .map((t) => {
          const isSel = selectedIds.includes(t.item.id);
          return `
            <button class="conn-tile ${isSel ? "selected" : ""}" data-tile-id="${t.item.id}" ${finished ? "disabled" : ""}>
              <div>
                <div>${D.escapeHtml(t.item.word)}</div>
                ${showMeanings ? `<div style="font-size:0.75rem; font-weight:600; opacity:0.8; margin-top:3px;">${D.escapeHtml(t.item.ko)}</div>` : ""}
              </div>
            </button>
          `;
        })
        .join("");

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <button class="btn btn-outline btn-sm" id="btn-exit">← 로비로</button>
            <div class="game-hud">
              <span class="hud-pill">🟦 ${solvedGroups.length} / 4 그룹</span>
              <span class="hud-pill">${hearts}</span>
              <span class="hud-pill">⭐ ${score}점</span>
              <span class="hud-pill" id="hud-time">⏱️ ${getElapsedSec()}초</span>
            </div>
          </div>

          <div class="card" style="margin-bottom:14px; padding:14px 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div class="chip-group" style="flex:0 1 auto;">
                <button class="chip ${groupMode === "lesson" ? "active" : ""}" data-gmode="lesson">📚 단원별 4그룹</button>
                <button class="chip ${groupMode === "pos" ? "active" : ""}" data-gmode="pos">🏷️ 품사별 4그룹</button>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-toggle-ko">
                ${showMeanings ? "🙈 한글 뜻 숨기기" : "💡 한글 뜻 힌트 보기"}
              </button>
            </div>
          </div>

          <div class="prompt-box">
            <div class="hint-box" style="margin-top:0; margin-bottom:14px; font-weight:700;">${D.escapeHtml(feedback)}</div>
            ${solvedHtml}
            ${remainingTiles.length > 0 ? `<div class="conn-grid">${gridHtml}</div>` : ""}

            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:16px;">
              ${
                !finished
                  ? `<div style="display:flex; gap:8px;">
                      <button class="btn btn-outline btn-sm" id="btn-shuffle">🔀 섞기</button>
                      <button class="btn btn-outline btn-sm" id="btn-deselect" ${selectedIds.length === 0 ? "disabled" : ""}>선택 해제</button>
                    </div>
                    <button class="btn btn-gold" id="btn-submit" ${selectedIds.length !== 4 ? "disabled" : ""}>제출 (${selectedIds.length}/4)</button>`
                  : `<div></div>
                     <button class="btn btn-primary" id="btn-finish">결과 보기 🎉</button>`
              }
            </div>
          </div>
        </div>
      `;

      container.querySelector("#btn-exit").addEventListener("click", () => { cleanup(); ctx.onExit(); });

      container.querySelectorAll("[data-gmode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.getAttribute("data-gmode");
          if (next !== groupMode) {
            groupMode = next;
            buildPuzzle();
          }
        });
      });

      container.querySelector("#btn-toggle-ko").addEventListener("click", () => {
        showMeanings = !showMeanings;
        render();
      });

      if (!finished) {
        container.querySelectorAll("[data-tile-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-tile-id");
            const tile = remainingTiles.find((t) => t.item.id === id);
            if (tile) TTS.speakEn(tile.item.word, 1.0);
            if (selectedIds.includes(id)) {
              selectedIds = selectedIds.filter((x) => x !== id);
            } else if (selectedIds.length < 4) {
              selectedIds.push(id);
            }
            render();
          });
        });

        container.querySelector("#btn-shuffle").addEventListener("click", () => {
          remainingTiles = D.shuffle(remainingTiles);
          render();
        });

        container.querySelector("#btn-deselect").addEventListener("click", () => {
          selectedIds = [];
          render();
        });

        container.querySelector("#btn-submit").addEventListener("click", handleSubmit);
      } else {
        container.querySelector("#btn-finish").addEventListener("click", completeGame);
      }
    }

    function handleSubmit() {
      if (selectedIds.length !== 4 || finished) return;
      const picked = remainingTiles.filter((t) => selectedIds.includes(t.item.id));
      const counts = {};
      picked.forEach((p) => {
        counts[p.groupId] = (counts[p.groupId] || 0) + 1;
      });
      const maxSame = Math.max(...Object.values(counts));

      if (maxSame === 4) {
        const gid = picked[0].groupId;
        const gObj = groups.find((g) => g.id === gid);
        solvedGroups.push(gObj);
        remainingTiles = remainingTiles.filter((t) => t.groupId !== gid);
        selectedIds = [];
        score += showMeanings ? 120 : 180;
        gObj.items.forEach((it) => S.recordWordResult(it, true));
        feedback = `✅ 정답! [${gObj.label}] 그룹을 완성했습니다!`;

        if (solvedGroups.length === 4) {
          score += lives * 40;
          finished = true;
          feedback = "🎉 4그룹 모두 완성! 대단해요!";
        }
      } else {
        lives -= 1;
        picked.forEach((p) => {
          S.recordWordResult(p.item, false);
          if (!wrongWords.some((w) => w.id === p.item.id)) wrongWords.push(p.item);
        });
        feedback =
          maxSame === 3
            ? "🔥 아깝다! 3개는 맞고 1개만 달라요! (기회 -1)"
            : "❌ 아직 같은 그룹이 아니에요. 다시 조합해 보세요! (기회 -1)";

        if (lives <= 0) {
          finished = true;
          // Reveal remaining groups
          groups.forEach((g) => {
            if (!solvedGroups.some((s) => s.id === g.id)) solvedGroups.push(g);
          });
          remainingTiles = [];
          selectedIds = [];
          feedback = "기회를 모두 사용했습니다. 정답 그룹을 확인해 보세요!";
        }
      }
      render();
    }

    function completeGame() {
      cleanup();
      const durationSec = getElapsedSec();
      const solvedByPlayer = lives > 0 ? 4 : Math.max(0, 4 - (4 - solvedGroups.length));
      const accuracy = Math.round(((lives > 0 ? 4 : Math.max(0, solvedGroups.length - 1)) / 4) * 100);
      ctx.onComplete({
        gameId: "connections",
        gameName: `커넥션즈 (${groupMode === "lesson" ? "단원별" : "품사별"})`,
        filterLabel: ctx.filterLabel,
        score,
        accuracy: Math.min(100, Math.max(0, accuracy)),
        correctCount: solvedByPlayer,
        totalQuestions: 4,
        maxStreak: solvedByPlayer,
        durationSec,
        wrongWords: wrongWords.slice(0, 8),
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

    buildPuzzle();
    return cleanup;
  }

  global.MY_GAMES = global.MY_GAMES || {};
  global.MY_GAMES["connections"] = { mount };
})(window);
