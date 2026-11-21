window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function maskWordInitial(word) {
    const clean = word.replace(/^([^A-Za-z]*)([A-Za-z])([A-Za-z']*?)([^A-Za-z']*)$/, (_, pre, first, mid, post) => {
      return `${pre}${first}${'_'.repeat(Math.max(2, mid.length))}${post}`;
    });
    return clean;
  }

  // 2단계는 빈칸(핵심어)만, 나머지 단계는 문장 전체를 채점
  function blankAnswer(item) {
    const target = item.target || '';
    if (!target) return '';
    const m = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(item.en);
    return m ? m[0] : '';
  }

  const TYPE_GUIDE = {
    1: { banner: '✍️ 보이는 문장을 보고 영어 문장 전체를 입력해 보세요.', ph: '영어 문장 전체를 입력하세요...' },
    2: { banner: '✍️ 빈칸에 들어갈 말만 입력하세요. (문장 전체 X)', ph: '빈칸에 들어갈 말만 입력하세요...' },
    3: { banner: '✍️ 첫 글자 힌트를 보고 영어 문장 전체를 입력하세요.', ph: '힌트를 보고 영어 문장 전체를 입력하세요...' },
    4: { banner: '✍️ 우리말 해석을 보고 영어 문장 전체를 입력하세요.', ph: '영어 문장 전체를 입력하세요...' }
  };

  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    if (!sentences.length) {
      container.innerHTML = `<div class="card"><p>선택한 영역에 문장이 없습니다.</p></div>`;
      return;
    }

    const state = {
      stage: 2, // 1: 전체보기, 2: 핵심문법 빈칸, 3: 첫글자 초성, 4: 통문장 블라인드
      showKorean: true,
      typingMode: false,
      checkedMap: {}
    };

    function formatSentence(item) {
      const escapedEn = diff.escapeHtml(item.en);
      const target = item.target || '';

      if (state.stage === 1) {
        if (!target) return escapedEn;
        const safeRegex = new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
        return escapedEn.replace(safeRegex, `<span class="memo-highlight">$1</span>`);
      }

      if (state.stage === 2) {
        if (!target) return escapedEn;
        const safeRegex = new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
        return escapedEn.replace(safeRegex, (match) => {
          return `<span class="blank-chip" data-answer="${encodeURIComponent(match)}" data-mask="_____">_____</span>`;
        });
      }

      if (state.stage === 3) {
        return diff.tokenize(item.en).map((w, idx) => {
          const pure = w.replace(/[^A-Za-z]/g, '');
          if (pure.length <= 2 && idx > 0) return diff.escapeHtml(w);
          const masked = maskWordInitial(w);
          return `<span class="blank-chip" data-answer="${encodeURIComponent(w)}" data-mask="${encodeURIComponent(masked)}">${diff.escapeHtml(masked)}</span>`;
        }).join(' ');
      }

      // Stage 4: Full blind
      return `<span class="blank-chip" style="min-width:220px;" data-answer="${encodeURIComponent(item.en)}" data-mask="${encodeURIComponent('클릭해서 2초간 정답 확인 (통문장 가림)')}">클릭해서 2초간 정답 확인 (통문장 가림)</span>`;
    }

    function draw() {
      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>🙈 4단계 블라인드 본문·대화 암기</h2>
              <p>빈칸을 클릭하면 정답이 2초간 보였다가 다시 가려집니다. 단계를 높여 통문장을 암기해 보세요!</p>
            </div>
            <div class="game-controls">
              <button class="switch-pill ${state.showKorean ? 'on' : ''}" id="btn-toggle-ko">
                🇰🇷 해석 ${state.showKorean ? '보이기' : '숨기기'}
              </button>
              <button class="switch-pill ${state.typingMode ? 'on' : ''}" id="btn-toggle-typing">
                ⌨️ 영작 확인 ${state.typingMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div class="stage-tabs">
            <button class="stage-btn ${state.stage === 1 ? 'active' : ''}" data-stage="1">1단계: 전체 보기<span>핵심 문법 강조</span></button>
            <button class="stage-btn ${state.stage === 2 ? 'active' : ''}" data-stage="2">2단계: 핵심 빈칸<span>문법·핵심어 가림</span></button>
            <button class="stage-btn ${state.stage === 3 ? 'active' : ''}" data-stage="3">3단계: 첫 글자 힌트<span>초성(이니셜) 암기</span></button>
            <button class="stage-btn ${state.stage === 4 ? 'active' : ''}" data-stage="4">4단계: 통문장 암기<span>전체 블라인드</span></button>
          </div>

          ${state.typingMode ? `<div class="memo-type-guide">${TYPE_GUIDE[state.stage].banner}</div>` : ''}

          <div class="memo-list">
            ${sentences.map((item, idx) => {
              const checkRes = state.checkedMap[item.id];
              const blankOnly = state.stage === 2 && !!blankAnswer(item);
              return `
                <div class="memo-item" data-item-id="${item.id}">
                  <div class="memo-item-head">
                    <div>
                      <span class="cat-badge ${item.category}">#${idx + 1}</span>
                      ${item.speaker ? `<span class="speaker-tag">${diff.escapeHtml(item.speaker)}</span>` : ''}
                    </div>
                    ${speech.renderTTSBar(item.en)}
                  </div>

                  <div class="memo-english">${formatSentence(item)}</div>

                  ${state.showKorean ? `<div class="memo-korean">${diff.escapeHtml(item.ko)}</div>` : ''}

                  ${state.typingMode ? `
                    <div class="memo-type-row">
                      <input type="text" class="memo-type-input" data-type-id="${item.id}" placeholder="${blankOnly ? TYPE_GUIDE[2].ph : TYPE_GUIDE[state.stage === 2 ? 1 : state.stage].ph}" value="${checkRes ? diff.escapeHtml(checkRes.input) : ''}" />
                      <button type="button" class="btn btn-primary btn-sm" data-verify-id="${item.id}">채점</button>
                    </div>
                    ${checkRes ? `
                      <div class="diff-result">
                        ${checkRes.isPerfect ? (checkRes.blankOnly ? '✅ 정답! (+10 XP) ' : '✅ 완벽하게 외웠어요! (+10 XP) ') : `일치율 ${checkRes.accuracy}% — `}
                        ${checkRes.html}
                      </div>
                    ` : ''}
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      speech.bindTTSButtons(container);

      container.querySelectorAll('[data-stage]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.stage = parseInt(btn.dataset.stage, 10);
          state.checkedMap = {}; // 단계마다 채점 기준이 다르므로 결과 초기화
          draw();
        });
      });

      container.querySelector('#btn-toggle-ko').addEventListener('click', () => {
        state.showKorean = !state.showKorean;
        draw();
      });

      container.querySelector('#btn-toggle-typing').addEventListener('click', () => {
        state.typingMode = !state.typingMode;
        draw();
      });

      // Click-to-Reveal (2 seconds)
      container.querySelectorAll('.blank-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          if (chip.dataset.timerId) {
            clearTimeout(parseInt(chip.dataset.timerId, 10));
          }
          const answer = decodeURIComponent(chip.dataset.answer);
          const mask = decodeURIComponent(chip.dataset.mask);
          chip.textContent = answer;
          chip.classList.add('revealed');
          storage.playTone('click');

          const tid = setTimeout(() => {
            chip.textContent = mask;
            chip.classList.remove('revealed');
          }, 2000);
          chip.dataset.timerId = String(tid);
        });
      });

      // Typing verify
      container.querySelectorAll('[data-verify-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.verifyId;
          const item = sentences.find((s) => s.id === id);
          const inputEl = container.querySelector(`[data-type-id="${id}"]`);
          const userVal = inputEl ? inputEl.value : '';
          const blank = state.stage === 2 ? blankAnswer(item) : '';
          const res = diff.compareWords(userVal, blank || item.en);
          res.input = userVal;
          res.blankOnly = !!blank;
          state.checkedMap[id] = res;
          if (res.isPerfect) {
            storage.addXP(10, item.id);
            ctx.refreshStats();
            speech.speak(item.en);
          } else {
            storage.resetStreak();
            ctx.refreshStats();
          }
          draw();
        });
      });

      container.querySelectorAll('.memo-type-input').forEach((input) => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const btn = container.querySelector(`[data-verify-id="${input.dataset.typeId}"]`);
            if (btn) btn.click();
          }
        });
      });
    }

    draw();
  }

  window.SMS.games.blind = { render };
})();
