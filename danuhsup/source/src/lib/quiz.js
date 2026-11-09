// 문제 생성기
import { shuffle, sample } from './util.js';

export const QTYPES = {
  ko: { name: '뜻 고르기', icon: '🇰🇷', desc: '영어 단어를 보고 알맞은 뜻 고르기' },
  en: { name: '단어 고르기', icon: '🔤', desc: '우리말 뜻을 보고 영어 단어 고르기' },
  def: { name: '영영풀이', icon: '📖', desc: '영어 풀이를 읽고 단어 고르기' },
  listen: { name: '듣고 고르기', icon: '🎧', desc: '발음을 듣고 뜻 고르기' },
  cloze: { name: '예문 빈칸', icon: '🧩', desc: '예문의 빈칸에 들어갈 단어 고르기' },
  spell: { name: '철자 쓰기', icon: '✍️', desc: '뜻을 보고 영어 철자 직접 쓰기' },
};

// 예문 속 표제어 위치 찾기 (변화형 포함)
// 단어 객체 자체를 열쇠로 기억한다. id로 기억하면 id가 겹치거나 단어장을 다시 불러왔을 때
// 다른 단어의 예문이 나온다 (예: cheer 문제에 diary 예문).
const cache = new WeakMap();
export function clozeOf(w) {
  if (cache.has(w)) return cache.get(w);
  let res = null;
  if (w.ex) {
    for (const alt of w.word.split(/[,/]/).map(x => x.trim()).filter(Boolean)) {
    const parts = alt.split(/\s+/).map(p => p.replace(/[^a-zA-Z'-]/g, '')).filter(Boolean);
    const stem = p => p.length > 4 ? p.replace(/(e|y)$/i, '') : p;
    const irregular = { come: 'c[oa]me', give: 'g[ia]ve', take: 't(?:ake|ook|aken)', make: 'm(?:ake|ade)', get: 'g[eo]t', go: '(?:go|went|gone)', run: 'r[ua]n', find: 'f(?:i|ou)nd', keep: 'ke(?:e)?pt?', hold: 'h(?:o|e)ld', bring: 'br(?:ing|ought)', think: 'th(?:ink|ought)', catch: 'c(?:atch|aught)', fall: 'f[ae]ll', grow: 'gr[eo]w', throw: 'thr[eo]w', break: 'br(?:eak|oke)', wear: 'w[eo]ar|worn', hang: 'h[au]ng', stick: 'st(?:ick|uck)', be: '(?:be|is|am|are|was|were|been)', feel: 'fe(?:e)?lt?', leave: 'le(?:ave|ft)', stand: 'st(?:and|ood)', put: 'put', set: 'set', cut: 'cut' };
    const pat = parts.map(p => {
      const lo = p.toLowerCase();
      if (irregular[lo]) return `(?:${irregular[lo]})\\w*`;
      if (/^(a|an|the|of|in|on|at|to|up|out|off|with|for|by|from|down|away|part|care|look|place)$/.test(lo)) return lo;
      return stem(lo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*';
    }).join("[\\s\\w']{0,12}?\\s");
    try {
      const m = w.ex.match(new RegExp(`\\b${pat}\\b`, 'i'));
      if (m) { res = { before: w.ex.slice(0, m.index), hit: m[0], after: w.ex.slice(m.index + m[0].length) }; break; }
    } catch { }
    }
  }
  cache.set(w, res); return res;
}

function distractors(w, pool, n, key) {
  const seen = new Set([w[key].toLowerCase()]);
  const same = shuffle(pool.filter(x => x.id !== w.id && x.pos === w.pos));
  const rest = shuffle(pool.filter(x => x.id !== w.id && x.pos !== w.pos));
  const out = [];
  for (const x of [...same, ...rest]) { const v = x[key].toLowerCase(); if (!seen.has(v)) { seen.add(v); out.push(x); } if (out.length >= n) break; }
  return out;
}

export function makeQ(w, type, pool) {
  if (type === 'cloze' && !clozeOf(w)) type = 'en';
  const q = { type, word: w };
  if (type === 'spell') return q;
  const key = (type === 'ko' || type === 'listen') ? 'ko' : 'word';
  const opts = shuffle([w, ...distractors(w, pool, 3, key)]);
  q.options = opts.map(o => ({ text: o[key], correct: o.id === w.id, id: o.id }));
  return q;
}

// 상자(암기 단계)에 맞는 문제 유형
export function typeForBox(b = 0, w) {
  const byBox = [['ko'], ['ko', 'en', 'listen'], ['en', 'def', 'listen', 'cloze'], ['def', 'cloze', 'spell'], ['spell', 'cloze', 'def'], ['spell', 'cloze']];
  let opts = byBox[Math.min(5, b)];
  if (w && !clozeOf(w)) opts = opts.filter(t => t !== 'cloze');
  if (!w?.en) opts = opts.filter(t => t !== 'def');
  if (!opts.length) opts = ['en'];
  return opts[Math.floor(Math.random() * opts.length)];
}

export function checkSpell(input, w) {
  const norm = s => s.toLowerCase().replace(/[~’']/g, "'").replace(/\(.*?\)/g, '').replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ').trim();
  const a = norm(input), b = norm(w.word);
  if (a === b) return 'ok';
  // 한 글자 차이는 "아깝다" 처리
  if (Math.abs(a.length - b.length) <= 1 && lev(a, b) === 1 && b.length > 4) return 'close';
  return 'bad';
}
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export { sample };
