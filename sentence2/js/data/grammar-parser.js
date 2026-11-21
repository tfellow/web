window.SMS = window.SMS || {};

(function () {
  const RULES = {
    be_verb: {
      regex: /\b(am|is|are|was|were)\b/i,
      distractors: (m) => {
        const lower = m.toLowerCase();
        if (lower === 'am') return ['is', 'are'];
        if (lower === 'is') return ['are', 'am'];
        if (lower === 'are') return ['is', 'am'];
        if (lower === 'was') return ['were', 'is'];
        return ['was', 'are'];
      },
      tip: '주어의 인칭과 수, 시제에 알맞은 be동사를 골라야 해요.'
    },
    present_simple: {
      regex: /\b(doesn't|don't|[a-z]{3,}(?:es|s))\b/i,
      distractors: (m) => {
        const lower = m.toLowerCase();
        if (lower === "doesn't") return ["don't", "isn't"];
        if (lower === "don't") return ["doesn't", "aren't"];
        if (lower.endsWith('s')) return [lower.slice(0, -1), lower + 'ing'];
        return [lower + 's', lower + 'ed'];
      },
      tip: '주어가 3인칭 단수인지 확인하고 일반동사 형태(-s/-es, don’t/doesn’t)를 맞춰 주세요.'
    },
    progressive: {
      regex: /\b(am|is|are|was|were)\s+([a-z]+ing)\b/i,
      distractors: (m) => {
        const parts = m.split(/\s+/);
        const ing = parts[1] || 'doing';
        return [ing.replace(/ing$/, ''), 'is ' + ing.replace(/ing$/, '')];
      },
      tip: '진행형은 「be동사 + 동사원형-ing」 형태로 써야 해요.'
    },
    past_simple: {
      regex: /\b(went|saw|had|made|took|came|ate|did|broke|tied|found|[a-z]{3,}ed)\b/i,
      distractors: (m) => {
        const map = {
          went: ['go', 'goes'], saw: ['see', 'seen'], had: ['have', 'has'],
          made: ['make', 'making'], took: ['take', 'taken'], came: ['come', 'comes'],
          ate: ['eat', 'eaten'], did: ['do', 'does'], broke: ['break', 'broken'],
          found: ['find', 'finding'], tied: ['tie', 'tying']
        };
        const lower = m.toLowerCase();
        if (map[lower]) return map[lower];
        return [lower.replace(/ed$/, ''), lower.replace(/ed$/, 'ing')];
      },
      tip: '과거의 사건을 말할 때는 동사의 과거형을 사용해요.'
    },
    superlative: {
      regex: /\b(the\s+(?:most\s+[a-z]+|[a-z]+est|best|worst))\b/i,
      distractors: (m) => {
        const noThe = m.replace(/^the\s+/i, '');
        if (/best/i.test(m)) return ['better', 'most good'];
        if (/worst/i.test(m)) return ['worse', 'most bad'];
        return [noThe, noThe.replace(/est$/i, 'er')];
      },
      tip: '최상급은 「the + -est / the most + 원급」 형태로 써요.'
    },
    to_infinitive: {
      regex: /\b(to\s+[a-z]{2,})\b/i,
      distractors: (m) => {
        const verb = m.split(/\s+/)[1] || 'do';
        return [verb, verb + 'ing'];
      },
      tip: 'to부정사는 「to + 동사원형」 형태를 유지해야 해요.'
    },
    relative: {
      regex: /\b(who|which|that)\b/i,
      distractors: (m) => {
        const lower = m.toLowerCase();
        if (lower === 'who') return ['which', 'what'];
        if (lower === 'which') return ['who', 'what'];
        return ['what', 'where'];
      },
      tip: '선행사가 사람인지 사물인지 확인하고 알맞은 관계대명사(who / which / that)를 골라요.'
    },
    present_perfect: {
      regex: /\b((?:have|has)\s+[a-z]{3,}(?:ed|en|ne|wn|ht|nt))\b/i,
      distractors: (m) => {
        const parts = m.split(/\s+/);
        const aux = parts[0].toLowerCase() === 'has' ? 'have' : 'has';
        return [`${aux} ${parts[1]}`, parts[1]];
      },
      tip: '현재완료는 「have/has + 과거분사(p.p.)」 형태예요. 주어에 맞춰 have/has를 골라요.'
    },
    passive: {
      regex: /\b((?:am|is|are|was|were)\s+[a-z]{3,}(?:ed|en|de|lt|wn))\b/i,
      distractors: (m) => {
        const parts = m.split(/\s+/);
        return [parts[1], `${parts[0]} ${parts[1].replace(/ed$/, 'ing')}`];
      },
      tip: '수동태는 「be동사 + 과거분사(p.p.)」로 "~되다, ~당하다"를 나타내요.'
    }
  };

  function autoChunk(en) {
    const words = en.trim().split(/\s+/);
    if (words.length <= 3) return words;
    const chunks = [];
    let current = [];
    words.forEach((w, idx) => {
      current.push(w);
      const endsPunct = /[,.;?!]$/.test(w);
      const isBreakWord = /^(and|but|so|because|when|in|on|at|for|with|to|of)$/i.test(words[idx + 1] || '');
      if (endsPunct || (current.length >= 2 && isBreakWord) || current.length >= 3) {
        chunks.push(current.join(' '));
        current = [];
      }
    });
    if (current.length) {
      if (current.length === 1 && chunks.length > 0) {
        chunks[chunks.length - 1] += ' ' + current[0];
      } else {
        chunks.push(current.join(' '));
      }
    }
    return chunks;
  }

  function detectGrammar(en, ruleKey) {
    const order = ruleKey && ruleKey !== 'auto'
      ? [ruleKey, 'superlative', 'present_perfect', 'passive', 'progressive', 'to_infinitive', 'relative', 'past_simple', 'be_verb', 'present_simple']
      : ['superlative', 'present_perfect', 'passive', 'progressive', 'to_infinitive', 'relative', 'past_simple', 'be_verb', 'present_simple'];

    for (const key of order) {
      const rule = RULES[key];
      if (!rule) continue;
      const match = en.match(rule.regex);
      if (match) {
        const target = match[0];
        const distractors = rule.distractors(target).filter((d) => d.toLowerCase() !== target.toLowerCase());
        return {
          target,
          distractors: distractors.length ? distractors : ['is', 'are'],
          grammarTip: rule.tip,
          errorVersion: {
            wrong: distractors[0] || target,
            right: target
          }
        };
      }
    }

    // Fallback: pick a mid-sentence content word
    const words = en.replace(/[.,!?]/g, '').split(/\s+/).filter((w) => w.length >= 3);
    const target = words[Math.floor(words.length / 2)] || en.split(/\s+/)[0];
    return {
      target,
      distractors: [target + 's', target + 'ed'],
      grammarTip: '문맥에 맞는 정확한 단어와 형태를 확인해 보세요.',
      errorVersion: { wrong: target + 's', right: target }
    };
  }

  function parseBulkText(rawText, options) {
    const opts = Object.assign({ category: 'reading', ruleKey: 'auto', prefix: 'custom' }, options);
    const lines = String(rawText || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, index) => {
      const [leftPart, rightPart] = line.split('|').map((s) => (s || '').trim());
      let en = leftPart || '';
      let speaker = '';

      if (opts.category === 'incontext' && /^[A-Za-z가-힣0-9\s]{1,18}:/.test(en)) {
        const colonIdx = en.indexOf(':');
        speaker = en.slice(0, colonIdx).trim();
        en = en.slice(colonIdx + 1).trim();
      }

      const ko = rightPart || '(해석 미입력)';
      const detected = detectGrammar(en, opts.ruleKey);

      const item = {
        id: `${opts.prefix}-${Date.now()}-${index}`,
        category: opts.category,
        en,
        ko,
        chunks: autoChunk(en),
        target: detected.target,
        distractors: detected.distractors,
        grammarTip: detected.grammarTip,
        errorVersion: detected.errorVersion
      };
      if (speaker) item.speaker = speaker;
      return item;
    }).filter((item) => item.en.length > 0);
  }

  window.SMS.parser = {
    autoChunk,
    detectGrammar,
    parseBulkText
  };
})();
