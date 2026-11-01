// 순수 함수 모음 (Firebase와 무관) — 단어 나누기, 자동 빈칸, 채점
export const PALETTE = ["#1e88e5", "#e53935", "#fb8c00", "#2e7d32", "#ab47bc", "#3949ab", "#26a69a", "#f4511e", "#7e57c2", "#039be5"];

const TOKEN_RE = /\s+|[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu;
export function tokenize(text) { return String(text || "").match(TOKEN_RE) || []; }
export function isWord(t) { return /^[\p{L}\p{N}]/u.test(t || ""); }

export const FUNCTION_WORDS = new Set(("a an the is am are was were be been being to of in on at by for with from and or but so if as " +
  "it its this that these those he she they we you i me him her them us my your his their our do does did not no " +
  "can will would should could has have had there here than then also very").split(" "));

export function autoBlanks(tokens, opts = {}) {
  const every = Math.max(1, parseInt(opts.every, 10) || 7);
  const start = Math.max(1, parseInt(opts.start, 10) || 1);
  const minLen = Math.max(1, parseInt(opts.minLen, 10) || 1);
  let from = 0;
  if (opts.keepFirst) {
    for (let i = 0; i < tokens.length; i++) {
      if (/^[.!?]$/.test(tokens[i])) { from = i + 1; break; }
    }
  }
  const ok = t => t.length >= minLen && !/^\d+$/.test(t) && !(opts.skipFunction && FUNCTION_WORDS.has(t.toLowerCase()));
  const res = [];
  let c = 0, target = start, pending = false;
  for (let i = from; i < tokens.length; i++) {
    const t = tokens[i];
    if (!isWord(t)) continue;
    c++;
    if (c >= target) pending = true;
    if (pending && ok(t)) {
      res.push(i);
      pending = false;
      c = 0;
      target = every;
    }
  }
  return res;
}

// 본문을 고쳤을 때 기존 빈칸을 (같은 단어, 같은 순번) 기준으로 최대한 유지
export function remapBlanks(oldT, newT, blanks, accepted = {}) {
  const occ = (toks, idx) => { const w = toks[idx]; let k = 0; for (let i = 0; i < idx; i++) if (toks[i] === w) k++; return k; };
  const find = (toks, w, k) => { let c = 0; for (let i = 0; i < toks.length; i++) if (toks[i] === w) { if (c === k) return i; c++; } return -1; };
  const nb = [], na = {};
  let lost = 0;
  for (const b of blanks) {
    const w = oldT[b];
    const ni = w == null ? -1 : find(newT, w, occ(oldT, b));
    if (ni >= 0 && !nb.includes(ni)) {
      nb.push(ni);
      if (accepted[b]) na[ni] = accepted[b];
    } else lost++;
  }
  return { blanks: nb.sort((a, b) => a - b), accepted: na, lost };
}

export function splitSentences(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const m = t.match(/[^.!?]+(?:[.!?]+["'”’)\]]*|$)/g) || [];
  return m.map(s => s.trim()).filter(Boolean);
}

export function contextOf(tokens, ti, span = 4) {
  const L = [], R = [];
  let i = ti - 1, c = 0;
  while (i >= 0 && c < span) { L.unshift(tokens[i]); if (isWord(tokens[i])) c++; i--; }
  let j = ti + 1; c = 0;
  while (j < tokens.length && c < span) { R.push(tokens[j]); if (isWord(tokens[j])) c++; j++; }
  return ((i >= 0 ? "…" : "") + L.join("") + "____" + R.join("") + (j < tokens.length ? "…" : "")).replace(/\s+/g, " ");
}

export function norm(s, cs = false) {
  let r = String(s ?? "").replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
  r = r.replace(/^[.,!?;:"]+|[.,!?;:"]+$/g, "");
  return cs ? r : r.toLowerCase();
}
export function isCorrect(given, answer, accepted = [], cs = false) {
  const g = norm(given, cs);
  if (!g) return false;
  return [answer, ...(accepted || [])].some(a => norm(a, cs) === g);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 원래 순서와 겹치는 자리가 적도록 섞기
export function shuffledPerm(n) {
  const id = [...Array(n).keys()];
  if (n < 2) return id;
  let best = null, bestFixed = 1e9;
  for (let t = 0; t < 30; t++) {
    const p = shuffle(id);
    const fixed = p.filter((v, i) => v === i).length;
    if (fixed < bestFixed) { best = p; bestFixed = fixed; }
    if (fixed === 0) break;
  }
  return best;
}
