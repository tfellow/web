'use strict';
// 앱 카드에 자료 수와 최근 7일 동안 늘어난 수를 보여 줘요. 숫자는 stats.json (tools/count-content.mjs 가 만들어요).
// 불러오지 못하거나 셀 자료가 없으면 아무것도 표시하지 않아요.
(() => {
  const words = [['단어', '개', ['words', 'extraWords']]];
  const q = ['퀴즈', '문항', ['questions']];
  // [이름, 단위, 더할 항목들]. 첫 줄의 늘어난 수가 🆕 로 나와요. 첫 줄이 그대로면 다음 줄을 봐요.
  const LABELS = {
    'reading-passport': [['책', '권', ['books']], q],
    'knowledge-passport': [['글', '편', ['texts']], q],
    'reading-metro': [['역', '개', ['stations']], q],
    'word-forest': words, 'word-arcade': words, 'word-rush': words, 'english-arcade': words,
    'grammar': [['문제', '개', ['questions']]],
    'speaking': [['대화', '개', ['dialogs']], ['문장', '개', ['sentences']]],
    'sentence-gym': [['문장', '개', ['sentences']]],
    'history': [['전시실', '개', ['rooms']], q],
    'quiz-show': [['작품', '개', ['works']], q],
    'brain-up': [['문제', '개', ['questions']]],
    'quiz-queens': [['기본 문제', '개', ['questions']]]
  };
  const DAYS = 7;
  const total = (data, keys) => {
    const found = keys.filter(k => Number.isInteger(data?.[k]));
    return found.length ? { n: found.reduce((sum, k) => sum + data[k], 0), keys: found.join() } : null;
  };
  const span = (text, cls) => { const el = document.createElement('span'); el.textContent = text; if (cls) el.className = cls; return el; };
  fetch('./stats.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject()).then(({ history }) => {
    const base = new Date(Date.now() + 9 * 3600e3 - DAYS * 864e5).toISOString().slice(0, 10);
    const now = history.at(-1).apps;
    const old = history.filter(h => h.date <= base).at(-1)?.apps || {};
    document.querySelectorAll('.app-card').forEach(card => {
      const app = card.dataset.app, parts = [];
      let fresh = null;
      for (const [name, unit, keys] of LABELS[app] || []) {
        const cur = total(now[app], keys);
        if (!cur?.n) continue;
        parts.push(`${name} ${cur.n.toLocaleString('ko-KR')}${unit}`);
        const prev = total(old[app], keys);
        // 세는 항목이 그사이 달라졌으면 비교하지 않아요
        if (!fresh && prev && prev.keys === cur.keys && cur.n > prev.n) fresh = `${name} +${(cur.n - prev.n).toLocaleString('ko-KR')}`;
      }
      if (!parts.length) return;
      const line = document.createElement('p');
      line.className = 'app-stats';
      line.append(span(parts.join(' · ')));
      if (fresh) line.append(span(`🆕 최근 7일 ${fresh}`, 'stat-new'));
      card.querySelector('.app-description').after(line);
    });
  }).catch(() => {});
})();
