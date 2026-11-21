window.SMS = window.SMS || {};

(function () {
  function normalizeWord(word) {
    return String(word || '')
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z0-9']/g, '');
  }

  function tokenize(sentence) {
    return String(sentence || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function normalizeSentence(sentence) {
    return tokenize(sentence).map(normalizeWord).filter(Boolean).join(' ');
  }

  function isExactMatch(userText, targetText) {
    return normalizeSentence(userText) === normalizeSentence(targetText);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function compareWords(userText, targetText) {
    const targetTokens = tokenize(targetText);
    const userTokens = tokenize(userText);
    let matched = 0;
    const htmlParts = [];

    targetTokens.forEach((tWord, idx) => {
      const uWord = userTokens[idx];
      const nt = normalizeWord(tWord);
      const nu = normalizeWord(uWord);
      if (uWord && nt === nu) {
        matched += 1;
        htmlParts.push(`<span class="diff-ok">${escapeHtml(tWord)}</span>`);
      } else if (uWord) {
        htmlParts.push(
          `<span class="diff-err" title="입력: ${escapeHtml(uWord)}">${escapeHtml(uWord)}</span>` +
          `<span class="diff-miss">→ ${escapeHtml(tWord)}</span>`
        );
      } else {
        htmlParts.push(`<span class="diff-miss">[누락: ${escapeHtml(tWord)}]</span>`);
      }
    });

    if (userTokens.length > targetTokens.length) {
      userTokens.slice(targetTokens.length).forEach((extra) => {
        htmlParts.push(`<span class="diff-err" title="불필요한 단어">${escapeHtml(extra)}</span>`);
      });
    }

    const accuracy = targetTokens.length ? Math.round((matched / targetTokens.length) * 100) : 0;
    return {
      isPerfect: isExactMatch(userText, targetText),
      accuracy,
      matched,
      total: targetTokens.length,
      html: htmlParts.join(' ')
    };
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  window.SMS.diff = {
    normalizeWord,
    tokenize,
    normalizeSentence,
    isExactMatch,
    escapeHtml,
    compareWords,
    shuffle
  };
})();
