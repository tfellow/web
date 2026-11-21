window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    const valid = sentences.filter((s) => s.target && s.en.toLowerCase().includes(s.target.toLowerCase()));
    if (!valid.length) {
      container.innerHTML = `<div class="card"><p>문법 드릴을 진행할 타깃 문장이 없습니다.</p></div>`;
      return;
    }

    const state = {
      inputMode: 'choice', // 'choice' | 'typing'
      queue: diff.shuffle(valid),
      retryQueue: [],
      index: 0,
      clearedCount: 0,
      totalUnique: valid.length,
      answered: false,
      selectedAnswer: '',
      isCorrect: false,
      choices: []
    };

    function currentItem() {
      return state.queue[state.index];
    }

    function prepareQuestion() {
      if (state.index >= state.queue.length) {
        if (state.retryQueue.length > 0) {
          state.queue = state.retryQueue.slice();
          state.retryQueue = [];
          state.index = 0;
          ctx.toast('🔁 오답 대기열 복습 시작! 틀린 문장을 모두 통과해야 클리어됩니다.', 'info');
        } else {
          renderComplete();
          return;
        }
      }
      const item = currentItem();
      const pool = [item.target].concat(item.distractors || []);
      const uniquePool = Array.from(new Set(pool));
      state.choices = diff.shuffle(uniquePool);
      state.answered = false;
      state.selectedAnswer = '';
      state.isCorrect = false;
      draw();
    }

    function renderComplete() {
      storage.playTone('fanfare');
      container.innerHTML = `
        <div class="game-shell">
          <div class="card complete-card">
            <div class="complete-trophy">⚡</div>
            <h3>문법·어휘 드릴 100% 통과!</h3>
            <p>오답 대기열까지 남김없이 정복했어요.</p>
            <div class="complete-stats">
              <div class="complete-stat-box"><strong>${state.totalUnique}문제</strong><span>완벽 통과</span></div>
              <div class="complete-stat-box"><strong>+${state.totalUnique * 15} XP</strong><span>획득 경험치</span></div>
            </div>
            <div class="action-right" style="justify-content:center;">
              <button class="btn btn-secondary" id="btn-replay">다시 풀기</button>
              <button class="btn btn-primary" id="btn-next-game">다음 게임(듣기·쉐도잉) →</button>
            </div>
          </div>
        </div>
      `;
      container.querySelector('#btn-replay').addEventListener('click', () => render(container, sentences, ctx));
      container.querySelector('#btn-next-game').addEventListener('click', () => ctx.switchMode('dictation'));
    }

    function submitAnswer(userAnswer) {
      if (state.answered) return;
      const item = currentItem();
      state.answered = true;
      state.selectedAnswer = userAnswer;
      state.isCorrect = diff.isExactMatch(userAnswer, item.target);

      if (state.isCorrect) {
        state.clearedCount += 1;
        storage.addXP(15, item.id);
        storage.removeWrong(item.id);
        ctx.refreshStats();
        speech.speak(item.en);
      } else {
        storage.resetStreak();
        storage.recordWrong(item, `입력: "${userAnswer}" / 정답: "${item.target}" — ${item.grammarTip}`);
        ctx.refreshStats();
        if (!state.retryQueue.some((q) => q.id === item.id)) {
          state.retryQueue.push(item);
        }
      }
      draw();
    }

    function renderSentenceWithBlank(item) {
      const escaped = diff.escapeHtml(item.en);
      const safeRegex = new RegExp(item.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const fillText = state.answered ? diff.escapeHtml(item.target) : '_______';
      return escaped.replace(safeRegex, `<span class="drill-blank">${fillText}</span>`);
    }

    function draw() {
      const item = currentItem();
      const pct = Math.min(100, Math.round((state.clearedCount / state.totalUnique) * 100));

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>⚡ 문법·어휘 드릴 & 오답 리트라이 큐</h2>
              <p>틀린 문제는 오답 대기열에 쌓여 마지막에 다시 풀어야 클리어됩니다.</p>
            </div>
            <div class="game-controls">
              <div class="toggle-group">
                <button class="toggle-btn ${state.inputMode === 'choice' ? 'active' : ''}" data-imode="choice">객관식</button>
                <button class="toggle-btn ${state.inputMode === 'typing' ? 'active' : ''}" data-imode="typing">직접 타이핑</button>
              </div>
            </div>
          </div>

          <div class="session-bar">
            <div class="session-track"><div class="session-fill" style="width:${pct}%"></div></div>
            <div class="session-counter">${state.clearedCount} / ${state.totalUnique} 통과</div>
            ${state.retryQueue.length ? `<span class="retry-badge">🔁 오답 대기 ${state.retryQueue.length}</span>` : ''}
          </div>

          <div class="card">
            <div class="prompt-card">
              <div class="prompt-meta">
                <span class="cat-badge ${item.category}">${item.category.toUpperCase()}</span>
                ${speech.renderTTSBar(item.en)}
              </div>
              <div class="korean-prompt">${diff.escapeHtml(item.ko)}</div>
            </div>

            <div class="drill-sentence">${renderSentenceWithBlank(item)}</div>

            ${state.inputMode === 'choice' ? `
              <div class="choice-grid">
                ${state.choices.map((c, idx) => {
                  let cls = '';
                  if (state.answered) {
                    if (diff.isExactMatch(c, item.target)) cls = 'correct';
                    else if (c === state.selectedAnswer) cls = 'wrong';
                  }
                  return `
                    <button type="button" class="choice-btn ${cls}" data-choice="${encodeURIComponent(c)}" ${state.answered ? 'disabled' : ''}>
                      <span class="choice-num">${idx + 1}</span>
                      <span>${diff.escapeHtml(c)}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="drill-input-wrap">
                <input type="text" id="drill-typing-input" class="text-input-lg" placeholder="빈칸에 들어갈 정확한 영어 표현을 입력하세요..." value="${diff.escapeHtml(state.selectedAnswer)}" ${state.answered ? 'disabled' : ''} autocomplete="off" />
                <button type="button" class="btn btn-primary" id="btn-submit-typing" ${state.answered ? 'disabled' : ''}>제출</button>
              </div>
            `}

            ${state.answered ? `
              <div class="feedback-box ${state.isCorrect ? 'correct' : 'wrong'}">
                <div class="feedback-icon">${state.isCorrect ? '🎯' : '💡'}</div>
                <div>
                  <div class="feedback-title">
                    ${state.isCorrect
                      ? '정답입니다! (+15 XP)'
                      : `아쉬워요! "${diff.escapeHtml(state.selectedAnswer)}" → 정답은 "${diff.escapeHtml(item.target)}"`}
                  </div>
                  <div class="feedback-detail">${diff.escapeHtml(item.grammarTip || '')}</div>
                </div>
              </div>
              <div class="action-row" style="margin-top:16px; justify-content:flex-end;">
                <button type="button" class="btn btn-success" id="btn-drill-next">다음 문제 →</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      speech.bindTTSButtons(container);

      container.querySelectorAll('[data-imode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.inputMode = btn.dataset.imode;
          draw();
        });
      });

      container.querySelectorAll('[data-choice]').forEach((btn) => {
        btn.addEventListener('click', () => submitAnswer(decodeURIComponent(btn.dataset.choice)));
      });

      const typingInput = container.querySelector('#drill-typing-input');
      const typingBtn = container.querySelector('#btn-submit-typing');
      if (typingInput && !state.answered) {
        typingInput.focus();
        typingInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && typingInput.value.trim()) submitAnswer(typingInput.value.trim());
        });
      }
      if (typingBtn) {
        typingBtn.addEventListener('click', () => {
          if (typingInput && typingInput.value.trim()) submitAnswer(typingInput.value.trim());
        });
      }

      const nextBtn = container.querySelector('#btn-drill-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          state.index += 1;
          prepareQuestion();
        });
      }
    }

    prepareQuestion();
  }

  window.SMS.games.drill = { render };
})();
