window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function catLabel(cat) {
    if (cat === 'grammar') return '📘 문법';
    if (cat === 'reading') return '📖 읽기 본문';
    return '💬 In Context';
  }

  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    if (!sentences.length) {
      container.innerHTML = `<div class="card"><p>선택한 영역에 문장이 없습니다. 다른 영역을 선택해 주세요.</p></div>`;
      return;
    }

    const state = {
      mode: 'chunk', // 'chunk' | 'word'
      useDistractors: true,
      queue: diff.shuffle(sentences),
      retryQueue: [],
      index: 0,
      solvedCount: 0,
      totalUnique: sentences.length,
      tiles: [],
      placedIds: [],
      checked: false,
      isCorrect: false,
      feedbackHtml: ''
    };

    function currentItem() {
      return state.queue[state.index];
    }

    function buildTiles(item) {
      const basePieces = state.mode === 'chunk' && item.chunks && item.chunks.length >= 2
        ? item.chunks.slice()
        : diff.tokenize(item.en);

      const tileObjs = basePieces.map((text, i) => ({
        id: `t-${i}`,
        text,
        isDistractor: false
      }));

      if (state.useDistractors && item.distractors && item.distractors.length) {
        const count = state.mode === 'chunk' ? 1 : Math.min(2, item.distractors.length);
        item.distractors.slice(0, count).forEach((d, idx) => {
          tileObjs.push({
            id: `d-${idx}`,
            text: d,
            isDistractor: true
          });
        });
      }

      state.tiles = diff.shuffle(tileObjs);
      state.placedIds = [];
      state.checked = false;
      state.isCorrect = false;
      state.feedbackHtml = '';
    }

    function loadCurrent() {
      if (state.index >= state.queue.length) {
        if (state.retryQueue.length > 0) {
          state.queue = state.retryQueue.slice();
          state.retryQueue = [];
          state.index = 0;
          ctx.toast('틀린 문장을 다시 복습합니다! 100% 통과해 보세요 🔥', 'info');
        } else {
          renderComplete();
          return;
        }
      }
      buildTiles(currentItem());
      draw();
    }

    function renderComplete() {
      storage.playTone('fanfare');
      container.innerHTML = `
        <div class="game-shell">
          <div class="card complete-card">
            <div class="complete-trophy">🏆</div>
            <h3>어순 배열 라운드 클리어!</h3>
            <p>모든 문장의 어순을 완벽하게 조립했어요.</p>
            <div class="complete-stats">
              <div class="complete-stat-box"><strong>${state.totalUnique}문장</strong><span>완료 문장</span></div>
              <div class="complete-stat-box"><strong>+${state.totalUnique * 15} XP</strong><span>획득 경험치</span></div>
            </div>
            <div class="action-right" style="justify-content:center;">
              <button class="btn btn-secondary" id="btn-replay">다시 도전</button>
              <button class="btn btn-primary" id="btn-go-next-mode">다음 게임(4단계 암기) →</button>
            </div>
          </div>
        </div>
      `;
      container.querySelector('#btn-replay').addEventListener('click', () => render(container, sentences, ctx));
      container.querySelector('#btn-go-next-mode').addEventListener('click', () => ctx.switchMode('blind'));
    }

    function checkAnswer() {
      const item = currentItem();
      const chosenTiles = state.placedIds.map((id) => state.tiles.find((t) => t.id === id)).filter(Boolean);
      const userSentence = chosenTiles.map((t) => t.text).join(' ');
      const usedDistractor = chosenTiles.find((t) => t.isDistractor);

      state.checked = true;
      if (!usedDistractor && diff.isExactMatch(userSentence, item.en)) {
        state.isCorrect = true;
        state.solvedCount += 1;
        storage.addXP(15, item.id);
        storage.removeWrong(item.id);
        ctx.refreshStats();
        speech.speak(item.en, { rate: 1.0 });
        state.feedbackHtml = `
          <div class="feedback-box correct">
            <div class="feedback-icon">🎉</div>
            <div>
              <div class="feedback-title">정확해요! (+15 XP)</div>
              <div class="feedback-detail"><strong>${diff.escapeHtml(item.en)}</strong><br/>💡 ${diff.escapeHtml(item.grammarTip || '')}</div>
            </div>
          </div>
        `;
      } else {
        state.isCorrect = false;
        storage.resetStreak();
        storage.recordWrong(item, usedDistractor ? `함정 타일(${usedDistractor.text}) 선택 — ${item.grammarTip}` : item.grammarTip);
        ctx.refreshStats();
        if (!state.retryQueue.some((q) => q.id === item.id)) {
          state.retryQueue.push(item);
        }
        const distractorMsg = usedDistractor
          ? `⚠️ 문법 함정 타일 <strong>"${diff.escapeHtml(usedDistractor.text)}"</strong>이(가) 포함되어 있어요!<br/>`
          : '';
        state.feedbackHtml = `
          <div class="feedback-box wrong">
            <div class="feedback-icon">🤔</div>
            <div>
              <div class="feedback-title">다시 확인해 볼까요? (오답 대기열에 추가됨)</div>
              <div class="feedback-detail">
                ${distractorMsg}
                정답: <strong>${diff.escapeHtml(item.en)}</strong><br/>
                💡 ${diff.escapeHtml(item.grammarTip || '단어 순서를 다시 살펴보세요.')}
              </div>
            </div>
          </div>
        `;
      }
      draw();
    }

    function giveHint() {
      if (state.checked) return;
      const item = currentItem();
      const correctOrder = state.mode === 'chunk' && item.chunks && item.chunks.length >= 2
        ? item.chunks
        : diff.tokenize(item.en);

      // Keep valid prefix
      const validPrefix = [];
      for (let i = 0; i < state.placedIds.length; i++) {
        const t = state.tiles.find((x) => x.id === state.placedIds[i]);
        if (t && !t.isDistractor && t.text === correctOrder[i]) {
          validPrefix.push(t.id);
        } else {
          break;
        }
      }
      state.placedIds = validPrefix;
      const nextText = correctOrder[validPrefix.length];
      if (nextText) {
        const candidate = state.tiles.find((t) => !t.isDistractor && t.text === nextText && !state.placedIds.includes(t.id));
        if (candidate) {
          state.placedIds.push(candidate.id);
          storage.playTone('click');
        }
      }
      draw();
    }

    function draw() {
      const item = currentItem();
      const pct = Math.min(100, Math.round((state.solvedCount / state.totalUnique) * 100));
      const placedTiles = state.placedIds.map((id) => state.tiles.find((t) => t.id === id)).filter(Boolean);

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>🧩 타일 어순 배열 & 청크 조립</h2>
              <p>아래 단어/청크 카드를 순서대로 탭해 영어 문장을 완성하세요.</p>
            </div>
            <div class="game-controls">
              <div class="toggle-group">
                <button class="toggle-btn ${state.mode === 'chunk' ? 'active' : ''}" data-setmode="chunk">청크(초급)</button>
                <button class="toggle-btn ${state.mode === 'word' ? 'active' : ''}" data-setmode="word">낱단어(심화)</button>
              </div>
              <button class="switch-pill ${state.useDistractors ? 'on' : ''}" id="btn-toggle-distractor">
                🎭 문법 함정 ${state.useDistractors ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div class="session-bar">
            <div class="session-track"><div class="session-fill" style="width:${pct}%"></div></div>
            <div class="session-counter">${state.solvedCount} / ${state.totalUnique} 완료</div>
            ${state.retryQueue.length ? `<span class="retry-badge">오답 대기 ${state.retryQueue.length}</span>` : ''}
          </div>

          <div class="card">
            <div class="prompt-card">
              <div class="prompt-meta">
                <span class="cat-badge ${item.category}">${catLabel(item.category)}</span>
                ${speech.renderTTSBar(item.en)}
              </div>
              <div class="korean-prompt">
                ${item.speaker ? `<span class="speaker-tag">${diff.escapeHtml(item.speaker)}</span>` : ''}
                ${diff.escapeHtml(item.ko)}
              </div>
            </div>

            <div class="answer-zone ${placedTiles.length ? 'has-items' : ''}" id="answer-zone">
              ${placedTiles.length
                ? placedTiles.map((t) => `<button type="button" class="word-tile placed ${state.checked && t.isDistractor ? 'distractor-hit' : ''}" data-remove="${t.id}">${diff.escapeHtml(t.text)}</button>`).join('')
                : '<span class="answer-zone-placeholder">여기에 선택한 단어 타일이 순서대로 배치됩니다 (클릭하면 취소)</span>'}
            </div>

            <div class="word-bank" id="word-bank">
              ${state.tiles.map((t) => {
                const used = state.placedIds.includes(t.id);
                return `<button type="button" class="word-tile ${used ? 'used' : ''}" data-add="${t.id}">${diff.escapeHtml(t.text)}</button>`;
              }).join('')}
            </div>

            <div class="action-row">
              <div class="action-left">
                <button type="button" class="btn btn-ghost btn-sm" id="btn-reset" ${state.checked ? 'disabled' : ''}>↺ 초기화</button>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-hint" ${state.checked ? 'disabled' : ''}>💡 힌트 1조각</button>
              </div>
              <div class="action-right">
                ${!state.checked
                  ? `<button type="button" class="btn btn-primary" id="btn-check" ${placedTiles.length ? '' : 'disabled'}>정답 확인</button>`
                  : `<button type="button" class="btn btn-success" id="btn-next">다음 문장 →</button>`}
              </div>
            </div>

            ${state.feedbackHtml}
          </div>
        </div>
      `;

      speech.bindTTSButtons(container);

      container.querySelectorAll('[data-setmode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.mode = btn.dataset.setmode;
          buildTiles(currentItem());
          draw();
        });
      });

      container.querySelector('#btn-toggle-distractor').addEventListener('click', () => {
        state.useDistractors = !state.useDistractors;
        buildTiles(currentItem());
        draw();
      });

      container.querySelectorAll('[data-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (state.checked) return;
          const id = btn.dataset.add;
          if (!state.placedIds.includes(id)) {
            state.placedIds.push(id);
            storage.playTone('click');
            draw();
          }
        });
      });

      container.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (state.checked) return;
          const id = btn.dataset.remove;
          state.placedIds = state.placedIds.filter((x) => x !== id);
          storage.playTone('click');
          draw();
        });
      });

      const resetBtn = container.querySelector('#btn-reset');
      if (resetBtn) resetBtn.addEventListener('click', () => { state.placedIds = []; draw(); });

      const hintBtn = container.querySelector('#btn-hint');
      if (hintBtn) hintBtn.addEventListener('click', giveHint);

      const checkBtn = container.querySelector('#btn-check');
      if (checkBtn) checkBtn.addEventListener('click', checkAnswer);

      const nextBtn = container.querySelector('#btn-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          state.index += 1;
          loadCurrent();
        });
      }
    }

    loadCurrent();
  }

  window.SMS.games.scramble = { render };
})();
