window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function buildErrorTokens(item) {
    const right = (item.errorVersion && item.errorVersion.right) || item.target || '';
    const wrong = (item.errorVersion && item.errorVersion.wrong) || (item.distractors && item.distractors[0]) || '';
    if (!right || !wrong || right.toLowerCase() === wrong.toLowerCase()) return null;

    const regex = new RegExp(right.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (!regex.test(item.en)) return null;

    const match = item.en.match(regex);
    const start = match.index;
    const end = start + match[0].length;
    const before = item.en.slice(0, start).trim();
    const after = item.en.slice(end).trim();

    const tokens = [];
    if (before) {
      before.split(/\s+/).forEach((w) => tokens.push({ text: w, isError: false }));
    }
    tokens.push({ text: wrong, isError: true, rightText: match[0] });
    if (after) {
      after.split(/\s+/).forEach((w) => tokens.push({ text: w, isError: false }));
    }
    return tokens;
  }

  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    const playable = sentences.map((s) => ({ item: s, tokens: buildErrorTokens(s) })).filter((x) => x.tokens);

    if (!playable.length) {
      container.innerHTML = `<div class="card"><p>오류 탐정 문제를 만들 수 있는 문장이 없습니다.</p></div>`;
      return;
    }

    const state = {
      queue: diff.shuffle(playable),
      index: 0,
      score: 0,
      step: 'find', // 'find' | 'fix' | 'done'
      wrongPickIdx: -1,
      fixChoices: [],
      fixCorrect: false
    };

    function current() {
      return state.queue[state.index];
    }

    function setupCurrent() {
      if (state.index >= state.queue.length) {
        renderComplete();
        return;
      }
      const { item, tokens } = current();
      const errTok = tokens.find((t) => t.isError);
      const pool = Array.from(new Set([errTok.rightText, errTok.text].concat(item.distractors || []))).slice(0, 3);
      state.step = 'find';
      state.wrongPickIdx = -1;
      state.fixChoices = diff.shuffle(pool);
      state.fixCorrect = false;
      draw();
    }

    function renderComplete() {
      storage.playTone('fanfare');
      container.innerHTML = `
        <div class="game-shell">
          <div class="card complete-card">
            <div class="complete-trophy">🕵️</div>
            <h3>문장 오류 탐정 임무 완료!</h3>
            <p>내신 시험에 자주 나오는 어법 함정을 날카롭게 찾아냈어요.</p>
            <div class="complete-stats">
              <div class="complete-stat-box"><strong>${state.score} / ${state.queue.length}</strong><span>정확히 수정</span></div>
              <div class="complete-stat-box"><strong>+${state.score * 20} XP</strong><span>획득 경험치</span></div>
            </div>
            <div class="action-right" style="justify-content:center;">
              <button class="btn btn-secondary" id="btn-replay">다시 도전</button>
              <button class="btn btn-primary" id="btn-next-mode">다음 게임(대화 롤플레이) →</button>
            </div>
          </div>
        </div>
      `;
      container.querySelector('#btn-replay').addEventListener('click', () => render(container, sentences, ctx));
      container.querySelector('#btn-next-mode').addEventListener('click', () => ctx.switchMode('chat'));
    }

    function draw() {
      const { item, tokens } = current();
      const errTok = tokens.find((t) => t.isError);
      const pct = Math.round(((state.index + 1) / state.queue.length) * 100);

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>🔍 문장 오류 탐정 (Error Hunter)</h2>
              <p>내신 어법 대비! 문장 속에 숨어 있는 <strong>틀린 부분 1곳</strong>을 찾아 올바르게 고쳐 보세요.</p>
            </div>
          </div>

          <div class="session-bar">
            <div class="session-track"><div class="session-fill" style="width:${pct}%"></div></div>
            <div class="session-counter">${state.index + 1} / ${state.queue.length} 사건</div>
          </div>

          <div class="card">
            <div class="prompt-card">
              <div class="prompt-meta">
                <span class="cat-badge ${item.category}">
                  ${state.step === 'find' ? 'STEP 1. 어법상 틀린 단어/구를 클릭하세요' : state.step === 'fix' ? 'STEP 2. 올바른 표현으로 고쳐 주세요!' : '사건 해결!'}
                </span>
              </div>
              <div class="korean-prompt">${diff.escapeHtml(item.ko)}</div>
            </div>

            <div class="hunter-sentence">
              ${tokens.map((tok, i) => {
                let cls = '';
                let display = tok.text;
                if (state.step === 'fix' && tok.isError) cls = 'found-error';
                if (state.step === 'done' && tok.isError) {
                  cls = 'fixed';
                  display = tok.rightText;
                }
                if (state.wrongPickIdx === i) cls = 'wrong-pick';
                return `<button type="button" class="hunter-token ${cls}" data-tok="${i}" ${state.step !== 'find' ? 'disabled' : ''}>${diff.escapeHtml(display)}</button>`;
              }).join('')}
            </div>

            ${state.step === 'fix' ? `
              <div class="feedback-box info" style="margin-bottom:14px;">
                <div class="feedback-icon">🎯</div>
                <div>
                  <div class="feedback-title">오류 포착! "${diff.escapeHtml(errTok.text)}"을(를) 어떻게 고쳐야 할까요?</div>
                </div>
              </div>
              <div class="choice-grid">
                ${state.fixChoices.map((c, idx) => `
                  <button type="button" class="choice-btn" data-fix="${encodeURIComponent(c)}">
                    <span class="choice-num">${idx + 1}</span>
                    <span>${diff.escapeHtml(c)}</span>
                  </button>
                `).join('')}
              </div>
            ` : ''}

            ${state.step === 'done' ? `
              <div class="feedback-box ${state.fixCorrect ? 'correct' : 'wrong'}">
                <div class="feedback-icon">${state.fixCorrect ? '🕵️‍♂️' : '📌'}</div>
                <div>
                  <div class="feedback-title">
                    ${state.fixCorrect ? '완벽하게 수정했어요! (+20 XP)' : `정답은 "${diff.escapeHtml(errTok.rightText)}"입니다.`}
                  </div>
                  <div class="feedback-detail">
                    <strong>${diff.escapeHtml(item.en)}</strong><br/>
                    💡 ${diff.escapeHtml(item.grammarTip || '')}
                  </div>
                </div>
              </div>
              <div class="action-row" style="margin-top:16px;">
                ${speech.renderTTSBar(item.en)}
                <button type="button" class="btn btn-success" id="btn-next-case">다음 사건 →</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      speech.bindTTSButtons(container);

      container.querySelectorAll('[data-tok]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.tok, 10);
          if (tokens[idx].isError) {
            storage.playTone('click');
            state.step = 'fix';
            state.wrongPickIdx = -1;
            draw();
          } else {
            storage.playTone('wrong');
            state.wrongPickIdx = idx;
            ctx.toast('그 부분은 문법적으로 맞아요! 다른 곳을 살펴보세요.', 'error');
            draw();
          }
        });
      });

      container.querySelectorAll('[data-fix]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const picked = decodeURIComponent(btn.dataset.fix);
          state.step = 'done';
          if (diff.isExactMatch(picked, errTok.rightText)) {
            state.fixCorrect = true;
            state.score += 1;
            storage.addXP(20, item.id);
            ctx.refreshStats();
            speech.speak(item.en);
          } else {
            state.fixCorrect = false;
            storage.resetStreak();
            storage.recordWrong(item, `오류 수정 실수: ${errTok.text} → ${errTok.rightText}`);
            ctx.refreshStats();
          }
          draw();
        });
      });

      const nextBtn = container.querySelector('#btn-next-case');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          state.index += 1;
          setupCurrent();
        });
      }
    }

    setupCurrent();
  }

  window.SMS.games.error = { render };
})();
