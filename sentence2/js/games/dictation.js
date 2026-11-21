window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    if (!sentences.length) {
      container.innerHTML = `<div class="card"><p>선택한 영역에 문장이 없습니다.</p></div>`;
      return;
    }

    const state = {
      subMode: 'dictation', // 'dictation' | 'shadowing'
      index: 0,
      showKorean: true,
      showInitialHint: false,
      userInput: '',
      result: null,
      isRecording: false,
      recognition: null
    };

    function currentItem() {
      return sentences[state.index];
    }

    function initialHintText(en) {
      return diff.tokenize(en).map((w) => w[0] + '_'.repeat(Math.max(1, w.length - 1))).join(' ');
    }

    function evaluateInput(text) {
      const item = currentItem();
      const res = diff.compareWords(text, item.en);
      state.userInput = text;
      state.result = res;

      if (res.isPerfect || (state.subMode === 'shadowing' && res.accuracy >= 85)) {
        storage.addXP(15, item.id);
        ctx.refreshStats();
      } else {
        storage.resetStreak();
        storage.recordWrong(item, `받아쓰기/쉐도잉 일치율 ${res.accuracy}%`);
        ctx.refreshStats();
      }
      draw();
    }

    function draw() {
      const item = currentItem();
      const pct = Math.round(((state.index + 1) / sentences.length) * 100);
      const srSupported = speech.isRecognitionSupported();

      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>🎧 속도조절 듣기 · 받아쓰기 · 쉐도잉</h2>
              <p>원속도(1.0x), 느리게(0.7x), 3회 반복으로 듣고 받아쓰거나 따라 말해 보세요.</p>
            </div>
            <div class="game-controls">
              <div class="toggle-group">
                <button class="toggle-btn ${state.subMode === 'dictation' ? 'active' : ''}" data-sub="dictation">✍️ 받아쓰기</button>
                <button class="toggle-btn ${state.subMode === 'shadowing' ? 'active' : ''}" data-sub="shadowing">🎙️ 쉐도잉 말하기</button>
              </div>
            </div>
          </div>

          <div class="session-bar">
            <div class="session-track"><div class="session-fill" style="width:${pct}%"></div></div>
            <div class="session-counter">${state.index + 1} / ${sentences.length}</div>
          </div>

          <div class="card">
            <div class="audio-hero">
              <div>
                <div style="font-size:0.82rem; opacity:0.88; font-weight:700; margin-bottom:4px;">🔊 원어민 음성 컨트롤</div>
                <div style="font-size:1rem; font-weight:800;">
                  ${state.showKorean ? diff.escapeHtml(item.ko) : '소리에만 집중해서 들어 보세요!'}
                </div>
              </div>
              ${speech.renderTTSBar(item.en)}
            </div>

            ${state.subMode === 'dictation' ? `
              <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm" id="btn-toggle-ko-hint">
                  🇰🇷 해석 ${state.showKorean ? '숨기기' : '보기'}
                </button>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-toggle-init-hint">
                  🔤 첫 글자 힌트 ${state.showInitialHint ? '숨기기' : '보기'}
                </button>
              </div>

              ${state.showInitialHint ? `
                <div class="prompt-card" style="padding:12px 16px; font-family:monospace; font-size:0.96rem; letter-spacing:0.03em;">
                  ${diff.escapeHtml(initialHintText(item.en))}
                </div>
              ` : ''}

              <div class="drill-input-wrap">
                <input type="text" id="dictation-input" class="text-input-lg" placeholder="들리는 영어 문장을 그대로 입력하세요..." value="${diff.escapeHtml(state.userInput)}" autocomplete="off" />
                <button type="button" class="btn btn-primary" id="btn-check-dictation">채점</button>
              </div>
            ` : `
              <div class="prompt-card">
                <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; margin-bottom:6px;">따라 읽을 문장</div>
                <div style="font-size:1.2rem; font-weight:800;">${diff.escapeHtml(item.en)}</div>
              </div>
              <div class="mic-box">
                ${srSupported ? `
                  <button type="button" class="mic-btn ${state.isRecording ? 'recording' : ''}" id="btn-mic">
                    ${state.isRecording ? '⏹' : '🎙️'}
                  </button>
                  <p style="margin-top:12px; font-size:0.88rem; font-weight:700; color:var(--text-sub);">
                    ${state.isRecording ? '듣고 있어요! 영어로 또박또박 말해 보세요...' : '마이크 버튼을 누르고 위 문장을 따라 읽어 보세요.'}
                  </p>
                ` : `
                  <p style="font-weight:700; color:var(--text-sub);">이 브라우저는 음성 인식(SpeechRecognition)을 지원하지 않습니다.<br/>Chrome 또는 Edge 브라우저에서 마이크 쉐도잉을 이용해 보세요!</p>
                `}
              </div>
            `}

            ${state.result ? `
              <div class="diff-result">
                <div style="font-weight:800; margin-bottom:6px;">
                  ${state.result.isPerfect
                    ? '🎉 완벽합니다! 100% 일치 (+15 XP)'
                    : `📊 일치율 ${state.result.accuracy}% (${state.result.matched}/${state.result.total} 단어 일치)`}
                </div>
                <div>${state.result.html}</div>
                <div style="margin-top:8px; font-size:0.84rem; color:var(--text-sub);">
                  정답 원문: <strong>${diff.escapeHtml(item.en)}</strong>
                </div>
              </div>
            ` : ''}

            <div class="action-row" style="margin-top:18px;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-prev" ${state.index === 0 ? 'disabled' : ''}>← 이전 문장</button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-next">${state.index === sentences.length - 1 ? '처음으로 ↺' : '다음 문장 →'}</button>
            </div>
          </div>
        </div>
      `;

      speech.bindTTSButtons(container);

      container.querySelectorAll('[data-sub]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.subMode = btn.dataset.sub;
          state.result = null;
          state.userInput = '';
          draw();
        });
      });

      const koBtn = container.querySelector('#btn-toggle-ko-hint');
      if (koBtn) koBtn.addEventListener('click', () => { state.showKorean = !state.showKorean; draw(); });

      const initBtn = container.querySelector('#btn-toggle-init-hint');
      if (initBtn) initBtn.addEventListener('click', () => { state.showInitialHint = !state.showInitialHint; draw(); });

      const dictInput = container.querySelector('#dictation-input');
      const checkBtn = container.querySelector('#btn-check-dictation');
      if (dictInput) {
        dictInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && dictInput.value.trim()) evaluateInput(dictInput.value.trim());
        });
      }
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          if (dictInput && dictInput.value.trim()) evaluateInput(dictInput.value.trim());
        });
      }

      const micBtn = container.querySelector('#btn-mic');
      if (micBtn) {
        micBtn.addEventListener('click', () => {
          if (state.isRecording && state.recognition) {
            state.recognition.stop();
            state.isRecording = false;
            draw();
            return;
          }
          state.isRecording = true;
          draw();
          state.recognition = speech.startRecognition({
            onResult: (transcript) => {
              state.isRecording = false;
              evaluateInput(transcript);
            },
            onError: (err) => {
              state.isRecording = false;
              ctx.toast(`음성 인식 오류: ${err}. 마이크 권한을 확인해 주세요.`, 'error');
              draw();
            },
            onEnd: () => {
              state.isRecording = false;
            }
          });
        });
      }

      container.querySelector('#btn-prev').addEventListener('click', () => {
        if (state.index > 0) {
          state.index -= 1;
          state.userInput = '';
          state.result = null;
          state.showInitialHint = false;
          draw();
        }
      });

      container.querySelector('#btn-next').addEventListener('click', () => {
        state.index = (state.index + 1) % sentences.length;
        state.userInput = '';
        state.result = null;
        state.showInitialHint = false;
        draw();
      });
    }

    draw();
  }

  window.SMS.games.dictation = { render };
})();
