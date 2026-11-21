window.SMS = window.SMS || {};
window.SMS.games = window.SMS.games || {};

(function () {
  function render(container, sentences, ctx) {
    const { diff, speech, storage } = window.SMS;
    // Prefer incontext dialogues from the current lesson if current filter doesn't have enough
    const lessonInContext = (ctx.currentLesson.sentences || []).filter((s) => s.category === 'incontext');
    const source = sentences.some((s) => s.category === 'incontext')
      ? sentences.filter((s) => s.category === 'incontext')
      : (lessonInContext.length ? lessonInContext : sentences);

    if (!source.length) {
      container.innerHTML = `<div class="card"><p>대화를 구성할 문장이 없습니다.</p></div>`;
      return;
    }

    const speakers = Array.from(new Set(source.map((s) => s.speaker || 'Friend')));
    const userRole = speakers.length >= 2 ? speakers[1] : 'Me';

    const state = {
      stepIndex: 0,
      history: [],
      answeredCount: 0,
      awaitingUser: false,
      currentTargetItem: null,
      choices: [],
      feedback: null
    };

    function advanceDialogue() {
      while (state.stepIndex < source.length) {
        const item = source[state.stepIndex];
        const role = item.speaker || (state.stepIndex % 2 === 0 ? 'AI Tutor' : userRole);
        const isUserTurn = speakers.length >= 2 ? role === userRole : state.stepIndex % 2 === 1;

        if (!isUserTurn) {
          state.history.push({ side: 'other', speaker: role, en: item.en, ko: item.ko });
          state.stepIndex += 1;
        } else {
          state.awaitingUser = true;
          state.currentTargetItem = item;
          state.feedback = null;

          // Build 3-4 options for filling the target grammar inside the chat reply
          const target = item.target || '';
          if (target && item.en.toLowerCase().includes(target.toLowerCase())) {
            const distractors = (item.distractors && item.distractors.length) ? item.distractors : ['is', 'are'];
            const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const options = [item.en].concat(
              distractors.slice(0, 2).map((d) => item.en.replace(regex, d))
            );
            state.choices = diff.shuffle(Array.from(new Set(options)));
          } else {
            state.choices = [item.en];
          }
          draw();
          if (state.history.length) {
            speech.speak(state.history[state.history.length - 1].en);
          }
          return;
        }
      }

      // Finished all lines
      state.awaitingUser = false;
      storage.playTone('fanfare');
      draw();
    }

    function pickReply(replyText) {
      const item = state.currentTargetItem;
      if (diff.isExactMatch(replyText, item.en)) {
        state.history.push({ side: 'me', speaker: item.speaker || 'Me', en: item.en, ko: item.ko });
        state.answeredCount += 1;
        state.stepIndex += 1;
        state.awaitingUser = false;
        state.feedback = null;
        storage.addXP(15, item.id);
        ctx.refreshStats();
        speech.speak(item.en, {
          onEnd: () => {
            setTimeout(advanceDialogue, 350);
          }
        });
        draw();
      } else {
        storage.resetStreak();
        storage.recordWrong(item, `대화 롤플레이 오답 — ${item.grammarTip}`);
        ctx.refreshStats();
        state.feedback = `💡 어색한 표현이에요! ${item.grammarTip || '문법 형태를 다시 확인해 보세요.'}`;
        draw();
      }
    }

    function draw() {
      const finished = !state.awaitingUser && state.stepIndex >= source.length;
      container.innerHTML = `
        <div class="game-shell">
          <div class="game-topbar">
            <div class="game-title-wrap">
              <h2>💬 In Context 메신저 롤플레이</h2>
              <p>교과서 대화 속 <strong>${diff.escapeHtml(userRole)}</strong> 역할이 되어 자연스럽고 문법에 맞는 답장을 보내세요!</p>
            </div>
            <div class="game-controls">
              <button type="button" class="btn btn-ghost btn-sm" id="btn-chat-restart">↺ 대화 처음부터</button>
            </div>
          </div>

          <div class="chat-window" id="chat-window">
            ${state.history.map((msg) => `
              <div class="chat-row ${msg.side}">
                <div class="chat-sender">${diff.escapeHtml(msg.speaker)}</div>
                <div class="chat-bubble">
                  <div>${diff.escapeHtml(msg.en)}</div>
                  <div class="chat-ko">${diff.escapeHtml(msg.ko)}</div>
                </div>
              </div>
            `).join('')}

            ${finished ? `
              <div class="feedback-box correct" style="margin-top:8px;">
                <div class="feedback-icon">🎉</div>
                <div>
                  <div class="feedback-title">대화 롤플레이 완벽 성공!</div>
                  <div class="feedback-detail">교과서 In Context 대화를 끝까지 자연스럽게 완성했어요.</div>
                </div>
              </div>
            ` : ''}
          </div>

          ${state.awaitingUser && state.currentTargetItem ? `
            <div class="chat-input-panel">
              <div style="font-size:0.8rem; font-weight:800; color:var(--primary); margin-bottom:4px;">
                ✏️ 내 차례 (${diff.escapeHtml(state.currentTargetItem.speaker || userRole)}) — 아래 뜻에 맞는 올바른 영어 답장을 골라 전송하세요!
              </div>
              <div style="font-size:1rem; font-weight:800; margin-bottom:12px;">
                "${diff.escapeHtml(state.currentTargetItem.ko)}"
              </div>

              <div style="display:flex; flex-direction:column; gap:8px;">
                ${state.choices.map((opt, idx) => `
                  <button type="button" class="choice-btn" data-reply="${encodeURIComponent(opt)}">
                    <span class="choice-num">${idx + 1}</span>
                    <span>${diff.escapeHtml(opt)}</span>
                  </button>
                `).join('')}
              </div>

              ${state.feedback ? `
                <div class="feedback-box wrong" style="margin-top:12px;">
                  <div class="feedback-icon">💬</div>
                  <div class="feedback-detail">${diff.escapeHtml(state.feedback)}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;

      const chatWin = container.querySelector('#chat-window');
      if (chatWin) chatWin.scrollTop = chatWin.scrollHeight;

      container.querySelector('#btn-chat-restart').addEventListener('click', () => render(container, sentences, ctx));

      container.querySelectorAll('[data-reply]').forEach((btn) => {
        btn.addEventListener('click', () => pickReply(decodeURIComponent(btn.dataset.reply)));
      });
    }

    advanceDialogue();
  }

  window.SMS.games.chat = { render };
})();
