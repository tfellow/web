window.SMS = window.SMS || {};

(function () {
  const { storage, speech, diff, parser } = window.SMS;

  const state = {
    lessonId: 'g1-l1',
    category: 'all', // 'all' | 'grammar' | 'reading' | 'incontext'
    mode: 'dashboard'
  };

  function getAllLessons() {
    return (window.SMS.BUILTIN_LESSONS || []).concat(storage.getCustomLessons());
  }

  function getCurrentLesson() {
    const all = getAllLessons();
    return all.find((l) => l.id === state.lessonId) || all[0];
  }

  function getFilteredSentences() {
    const lesson = getCurrentLesson();
    if (!lesson) return [];
    if (state.category === 'all') return lesson.sentences || [];
    return (lesson.sentences || []).filter((s) => s.category === state.category);
  }

  function toast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type || ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }
  window.SMS.toast = toast;

  function refreshStats() {
    const stats = storage.getStats();
    const wrongs = storage.getWrongNotes();
    document.getElementById('stat-xp').textContent = stats.xp;
    document.getElementById('stat-streak').textContent = stats.streak;
    document.getElementById('stat-wrong-count').textContent = wrongs.length;
    document.getElementById('btn-toggle-sfx').textContent = stats.sfxEnabled ? '🔊' : '🔇';
  }

  function renderLessonSelector() {
    const select = document.getElementById('select-lesson');
    const lessons = getAllLessons();
    select.innerHTML = lessons.map((l) => {
      const customTag = l.isCustom ? ' [교사 추가]' : '';
      return `<option value="${l.id}" ${l.id === state.lessonId ? 'selected' : ''}>[${l.grade}] ${diff.escapeHtml(l.title)}${customTag}</option>`;
    }).join('');
  }

  function renderCategoryCountsAndMeta() {
    const lesson = getCurrentLesson();
    if (!lesson) return;
    const all = lesson.sentences || [];
    const g = all.filter((s) => s.category === 'grammar').length;
    const r = all.filter((s) => s.category === 'reading').length;
    const c = all.filter((s) => s.category === 'incontext').length;

    document.getElementById('count-all').textContent = all.length;
    document.getElementById('count-grammar').textContent = g;
    document.getElementById('count-reading').textContent = r;
    document.getElementById('count-incontext').textContent = c;

    const metaBar = document.getElementById('lesson-meta-bar');
    const points = lesson.grammarPoints || [];
    metaBar.innerHTML = `
      <span class="meta-chip">📚 ${diff.escapeHtml(lesson.grade)} ${diff.escapeHtml(lesson.title)}</span>
      ${points.map((p) => `<span class="meta-chip grammar">🎯 ${diff.escapeHtml(p)}</span>`).join('')}
    `;
  }

  function renderDashboard(stage) {
    const lesson = getCurrentLesson();
    const sentences = getFilteredSentences();
    const stats = storage.getStats();
    const masteredInLesson = (lesson.sentences || []).filter((s) => stats.masteredIds.includes(s.id)).length;
    const totalInLesson = (lesson.sentences || []).length || 1;
    const pct = Math.round((masteredInLesson / totalInLesson) * 100);

    const games = [
      {
        mode: 'scramble',
        emoji: '🧩',
        bg: '#eef2ff',
        badge: '듀오링고 · 배열 영문법',
        title: '타일 어순 배열 & 청크 조립',
        desc: '의미 덩어리(청크) 또는 낱단어 타일을 탭해 영어 어순을 체화하세요. 문법 함정 타일 섞기 지원!',
        tags: ['청크/낱단어 토글', '문법 함정 ON/OFF']
      },
      {
        mode: 'blind',
        emoji: '🙈',
        bg: '#dcfce7',
        badge: '잽영어 · 이그잼포유 M · 빔',
        title: '4단계 블라인드 본문 암기',
        desc: '전체보기 → 핵심어 빈칸 → 첫 글자 힌트 → 통문장 블라인드! 빈칸 클릭 시 2초간 정답이 보였다 다시 가려집니다.',
        tags: ['2초 클릭-투-리빌', '직접 영작 채점']
      },
      {
        mode: 'drill',
        emoji: '⚡',
        bg: '#fef3c7',
        badge: '말해보카 모델',
        title: '문법·어휘 드릴 & 오답 큐',
        desc: '핵심 문법 빈칸을 객관식·타이핑으로 훈련하고, 틀린 문장은 해설과 함께 오답 대기열에서 100% 통과할 때까지 복습합니다.',
        tags: ['맞춤 문법 해설', '오답 리트라이 큐']
      },
      {
        mode: 'dictation',
        emoji: '🎧',
        bg: '#e0f2fe',
        badge: 'Cake 모델 + AI 발음',
        title: '속도조절 듣기 · 받아쓰기 · 쉐도잉',
        desc: '1.0x / 0.7x / 3회 반복 듣기로 받아쓰기 철자 비교를 하거나, 마이크 음성 인식으로 쉐도잉 일치율을 확인하세요.',
        tags: ['0.7x 느리게 듣기', '철자 Diff & 마이크']
      },
      {
        mode: 'error',
        emoji: '🔍',
        bg: '#fee2e2',
        badge: 'NEW · 내신 어법 특화',
        isNew: true,
        title: '문장 오류 탐정 (Error Hunter)',
        desc: '중학교 내신 단골 유형! 문장 속에 숨겨진 어법 오류 1곳을 클릭해 찾아내고 올바른 형태로 고쳐 보세요.',
        tags: ['어법 함정 찾기', '서술형 대비']
      },
      {
        mode: 'chat',
        emoji: '💬',
        bg: '#f3e8ff',
        badge: 'NEW · In Context 특화',
        isNew: true,
        title: 'In Context 메신저 롤플레이',
        desc: '교과서 속 캐릭터와 실제 채팅하듯 대화를 주고받으며 문맥과 타깃 문법에 맞는 답장을 완성해 보세요.',
        tags: ['대화 말풍선 UX', '실전 상황 문법']
      }
    ];

    stage.innerHTML = `
      <div class="hero-banner">
        <div>
          <h2>${diff.escapeHtml(lesson.grade)} ${diff.escapeHtml(lesson.title)}</h2>
          <p>현재 선택된 영역에 <strong>${sentences.length}개의 교과서 핵심 문장</strong>이 준비되어 있습니다. 원하는 게임을 골라 바로 학습을 시작해 보세요!</p>
        </div>
        <div class="hero-progress">
          <div class="hero-progress-label">
            <span>이 단원 마스터리</span>
            <span>${masteredInLesson} / ${totalInLesson} (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>

      <div class="game-grid">
        ${games.map((g) => `
          <article class="game-card" data-launch="${g.mode}" role="button" tabindex="0">
            <div class="game-card-top">
              <div class="game-icon-box" style="background:${g.bg};">${g.emoji}</div>
              <span class="game-badge ${g.isNew ? 'new' : ''}">${g.badge}</span>
            </div>
            <h3>${g.title}</h3>
            <p>${g.desc}</p>
            <div class="game-card-tags">
              ${g.tags.map((t) => `<span class="mini-tag">#${t}</span>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    `;

    stage.querySelectorAll('[data-launch]').forEach((card) => {
      card.addEventListener('click', () => switchMode(card.dataset.launch));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchMode(card.dataset.launch);
        }
      });
    });
  }

  function renderStage() {
    speech.stopSpeaking();
    storage.setContext({
      lessonId: state.lessonId,
      category: state.category,
      mode: state.mode
    });
    const stage = document.getElementById('main-stage');
    const sentences = getFilteredSentences();

    document.querySelectorAll('.mode-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });

    if (state.mode === 'dashboard') {
      renderDashboard(stage);
      return;
    }

    const game = window.SMS.games && window.SMS.games[state.mode];
    if (game && typeof game.render === 'function') {
      game.render(stage, sentences, {
        currentLesson: getCurrentLesson(),
        refreshStats,
        switchMode,
        toast
      });
    }
  }

  function switchMode(mode) {
    state.mode = mode;
    renderStage();
  }

  /* ---------- Wrong Answer Notebook Modal ---------- */
  function openWrongModal() {
    const body = document.getElementById('wrong-notebook-body');
    const notes = storage.getWrongNotes();
    if (!notes.length) {
      body.innerHTML = `<p style="text-align:center; padding:30px 0; color:var(--text-muted);">아직 기록된 오답이 없어요! 게임을 풀다가 틀린 문장이 자동으로 이곳에 저장됩니다.</p>`;
    } else {
      body.innerHTML = notes.map((n) => `
        <div class="wrong-item">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div>
              <div class="wrong-item-en">${diff.escapeHtml(n.en)}</div>
              <div class="wrong-item-ko">${diff.escapeHtml(n.ko)}</div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              ${speech.renderTTSBar(n.en)}
              <button type="button" class="btn btn-ghost btn-sm" data-del-wrong="${n.id}">삭제</button>
            </div>
          </div>
          ${n.grammarTip ? `<div class="wrong-item-tip">💡 ${diff.escapeHtml(n.grammarTip)} (오답 ${n.count}회)</div>` : ''}
        </div>
      `).join('');
      speech.bindTTSButtons(body);
      body.querySelectorAll('[data-del-wrong]').forEach((btn) => {
        btn.addEventListener('click', () => {
          storage.removeWrong(btn.dataset.delWrong);
          refreshStats();
          openWrongModal();
        });
      });
    }
    document.getElementById('modal-wrong').classList.remove('hidden');
  }

  /* ---------- Teacher Studio Modal ---------- */
  function renderCustomLessonsList() {
    const listEl = document.getElementById('custom-lessons-list');
    const custom = storage.getCustomLessons();
    if (!custom.length) {
      listEl.innerHTML = `<p class="helper-text">아직 선생님이 추가한 커스텀 단원이 없습니다.</p>`;
      return;
    }
    listEl.innerHTML = custom.map((l) => `
      <div class="custom-row">
        <div>
          <strong>[${diff.escapeHtml(l.grade)}] ${diff.escapeHtml(l.title)}</strong>
          <span style="font-size:0.8rem; color:var(--text-muted); margin-left:6px;">(${(l.sentences || []).length}문장)</span>
        </div>
        <button type="button" class="btn btn-danger btn-sm" data-del-lesson="${l.id}">삭제</button>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-del-lesson]').forEach((btn) => {
      btn.addEventListener('click', () => {
        storage.deleteCustomLesson(btn.dataset.delLesson);
        if (state.lessonId === btn.dataset.delLesson) {
          state.lessonId = 'g1-l1';
        }
        renderLessonSelector();
        renderCategoryCountsAndMeta();
        renderCustomLessonsList();
        renderStage();
        toast('커스텀 단원이 삭제되었습니다.');
      });
    });
  }

  function setupTeacherStudio() {
    document.querySelectorAll('.t-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.t-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.ttab;
        document.getElementById('teacher-panel-create').classList.toggle('hidden', target !== 'create');
        document.getElementById('teacher-panel-manage').classList.toggle('hidden', target !== 'manage');
        if (target === 'manage') renderCustomLessonsList();
      });
    });

    document.getElementById('btn-insert-sample').addEventListener('click', () => {
      document.getElementById('t-title').value = 'Lesson 2. Sample Custom Lesson';
      document.getElementById('t-category').value = 'grammar';
      document.getElementById('t-grammar-rule').value = 'auto';
      document.getElementById('t-raw-input').value = [
        'She has lived in Seoul for five years. | 그녀는 서울에서 5년 동안 살아왔다.',
        'This is the boy who won the gold medal. | 이 아이가 금메달을 딴 소년이다.',
        'The letter was written by my grandmother. | 그 편지는 우리 할머니에 의해 쓰였다.',
        'I have a lot of homework to finish tonight. | 나는 오늘 밤에 끝낼 숙제가 많다.'
      ].join('\n');
    });

    document.getElementById('btn-preview-parse').addEventListener('click', () => {
      const raw = document.getElementById('t-raw-input').value;
      const category = document.getElementById('t-category').value;
      const ruleKey = document.getElementById('t-grammar-rule').value;
      const parsed = parser.parseBulkText(raw, { category, ruleKey });
      const previewEl = document.getElementById('parse-preview-area');
      if (!parsed.length) {
        toast('먼저 영어 문장을 한 줄 이상 입력해 주세요.', 'error');
        return;
      }
      previewEl.classList.remove('hidden');
      previewEl.innerHTML = `
        <strong>✨ 자동 변환 결과 (${parsed.length}문장)</strong>
        ${parsed.map((p) => `
          <div class="preview-item">
            <div><strong>${diff.escapeHtml(p.en)}</strong> — ${diff.escapeHtml(p.ko)}</div>
            <div style="color:var(--primary-dark); margin-top:4px;">
              🎯 핵심어: <code>${diff.escapeHtml(p.target)}</code> |
              🎭 함정: <code>${diff.escapeHtml((p.distractors || []).join(', '))}</code> |
              🧩 청크: <code>${diff.escapeHtml((p.chunks || []).join(' / '))}</code>
            </div>
          </div>
        `).join('')}
      `;
    });

    document.getElementById('btn-save-parsed').addEventListener('click', () => {
      const grade = document.getElementById('t-grade').value;
      const title = document.getElementById('t-title').value.trim() || '교사 커스텀 단원';
      const category = document.getElementById('t-category').value;
      const ruleKey = document.getElementById('t-grammar-rule').value;
      const raw = document.getElementById('t-raw-input').value;
      const parsed = parser.parseBulkText(raw, { category, ruleKey, prefix: 't' });

      if (!parsed.length) {
        toast('저장할 문장을 입력해 주세요.', 'error');
        return;
      }

      // If a custom lesson with same grade+title exists, append sentences to it!
      const existing = storage.getCustomLessons().find((l) => l.grade === grade && l.title === title);
      let savedLesson;
      if (existing) {
        existing.sentences = existing.sentences.concat(parsed);
        savedLesson = existing;
      } else {
        savedLesson = {
          id: `custom-${Date.now()}`,
          grade,
          title,
          isCustom: true,
          grammarPoints: [`교사 커스텀 자료 (${parsed.length}문장)`],
          sentences: parsed
        };
      }

      storage.addCustomLesson(savedLesson);
      state.lessonId = savedLesson.id;
      state.category = 'all';
      renderLessonSelector();
      renderCategoryCountsAndMeta();
      document.getElementById('modal-teacher').classList.add('hidden');
      toast(`"${title}"에 ${parsed.length}문장이 저장되었습니다!`, 'success');
      switchMode('dashboard');
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
      const data = storage.getCustomLessons();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentence-master-custom-lessons.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('커스텀 단원 JSON 파일이 다운로드되었습니다.', 'success');
    });

    document.getElementById('input-import-json').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const list = Array.isArray(parsed) ? parsed : [parsed];
          list.forEach((lesson) => {
            if (lesson && lesson.title && Array.isArray(lesson.sentences)) {
              lesson.id = lesson.id || `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              lesson.isCustom = true;
              storage.addCustomLesson(lesson);
            }
          });
          renderLessonSelector();
          renderCustomLessonsList();
          toast('JSON 교과서 자료를 성공적으로 불러왔습니다!', 'success');
        } catch {
          toast('올바른 JSON 파일 형식이 아닙니다.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  /* ---------- Init ---------- */
  function init() {
    renderLessonSelector();
    renderCategoryCountsAndMeta();
    refreshStats();
    setupTeacherStudio();
    renderStage();

    document.getElementById('btn-go-home').addEventListener('click', () => switchMode('dashboard'));

    document.getElementById('select-lesson').addEventListener('change', (e) => {
      state.lessonId = e.target.value;
      renderCategoryCountsAndMeta();
      renderStage();
    });

    document.querySelectorAll('.cat-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.category = tab.dataset.cat;
        renderStage();
      });
    });

    document.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    document.getElementById('btn-toggle-sfx').addEventListener('click', () => {
      const on = storage.toggleSfx();
      refreshStats();
      toast(on ? '효과음을 켰습니다 🔊' : '효과음을 껐습니다 🔇');
    });

    document.getElementById('btn-open-wrong').addEventListener('click', openWrongModal);
    document.getElementById('btn-clear-wrong').addEventListener('click', () => {
      storage.clearWrongNotes();
      refreshStats();
      openWrongModal();
      toast('오답 노트를 비웠습니다.');
    });

    document.getElementById('btn-open-teacher').addEventListener('click', () => {
      renderCustomLessonsList();
      document.getElementById('modal-teacher').classList.remove('hidden');
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).classList.add('hidden');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((bg) => {
      bg.addEventListener('click', (e) => {
        if (e.target === bg) bg.classList.add('hidden');
      });
    });
  }

  window.SMS.refreshUI = function () {
    renderLessonSelector();
    renderCategoryCountsAndMeta();
    refreshStats();
    renderStage();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
