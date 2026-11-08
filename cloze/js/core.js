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

// ---------- 어순 배열 ----------
// 문장 → 단어 조각(띄어쓰기 기준) + 끝 문장부호(. ! ?)는 따로 떼어 고정
export function splitChunks(sentence) {
  let s = String(sentence || "").replace(/\s+/g, " ").trim();
  const m = s.match(/\s*([.!?]+["'”’)\]]*)$/);
  let end = "";
  if (m && m.index > 0) { end = m[1]; s = s.slice(0, m.index).trim(); }
  return { chunks: s ? s.split(" ") : [], end };
}
// 비교용 문자열: 대소문자 무시, 따옴표 통일, (옵션) 문장부호 무시
export function wordKey(str, ignorePunct = true) {
  let r = String(str ?? "").replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  r = r.replace(/[.!?]+["')\]]*\s*$/, "");
  if (ignorePunct) r = r.replace(/[^\p{L}\p{N}\s']/gu, " ");
  return r.replace(/\s+/g, " ").trim();
}
export const wordPrimary = it => (it.chunks || []).join(" ");
export const wordAnswers = it => [wordPrimary(it), ...(it.alts || [])];
export function isWordCorrect(given, it, ignorePunct = true) {
  const g = wordKey(given, ignorePunct);
  if (!g) return false;
  return wordAnswers(it).some(a => wordKey(a, ignorePunct) === g);
}
// 답이 이 문제의 조각을 모두 한 번씩 써서 만들 수 있는지 (대소문자·문장부호 무시)
export function fitsChunks(answer, chunks) {
  const words = wordKey(answer, true).split(" ").filter(Boolean);
  const parts = chunks.map(c => wordKey(c, true).split(" ").filter(Boolean)).filter(p => p.length);
  if (words.length !== parts.reduce((a, p) => a + p.length, 0)) return false;
  const used = new Array(parts.length).fill(false);
  const go = pos => {
    if (pos === words.length) return true;
    const tried = new Set();
    for (let i = 0; i < parts.length; i++) {
      if (used[i]) continue;
      const key = parts[i].join(" ");
      if (tried.has(key)) continue;
      tried.add(key);
      if (parts[i].every((w, d) => words[pos + d] === w)) {
        used[i] = true;
        if (go(pos + parts[i].length)) return true;
        used[i] = false;
      }
    }
    return false;
  };
  return go(0);
}
// 어순 배열 문항이 제출 기록의 answers/correct 배열에서 시작하는 자리 (어순 배열이 없던 기록은 null)
export function wordStartOf(sub) {
  return Number.isInteger(sub?.wordStart) ? sub.wordStart : null;
}

// ---------- 어순 배열: 단어 칩 표시 (대소문자·문장부호) ----------
const KEEP_CAP = new Set(["i", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "korea", "korean", "seoul", "busan", "english", "america", "american", "china", "chinese", "japan", "japanese", "mr.", "mrs.", "ms.", "dr.", "christmas"]);
// 첫 단어의 대문자를 그대로 둘지 (I, 고유명사, 약어). 교사가 문항별로 바꿀 수 있음 (it.cap)
export function autoKeepCap(chunks) {
  const first = String((chunks || [])[0] || "").split(" ")[0];
  const bare = first.replace(/[^\p{L}.']/gu, "");
  const w = bare.toLowerCase().replace(/'.*$/, "");
  if (!/^\p{Lu}/u.test(bare)) return true; // 원래 소문자면 바꿀 것 없음
  if (KEEP_CAP.has(w) || KEEP_CAP.has(bare.toLowerCase())) return true;
  if (bare.length >= 2 && bare === bare.toUpperCase() && /\p{L}{2}/u.test(bare)) return true; // TV, USA
  // 두 번째 단어도 대문자면 고유명사 덩어리로 봄 (New York, Mr Kim)
  const words = (chunks || []).join(" ").split(" ");
  if (words[1] && /^\p{Lu}/u.test(words[1]) && words[1] !== "I") return true;
  return false;
}
const lowerFirst = s => s.replace(/\p{Lu}/u, c => c.toLowerCase());
const upperFirst = s => s.replace(/\p{L}/u, c => c.toUpperCase());
// 학생에게 보일 칩 글자. first: 답 칸 맨 앞 자리, hidePunct: 쉼표 등을 칩에서 감춤 (채점에서 무시할 때)
export function chipText(it, ci, { first = false, hidePunct = false } = {}) {
  let t = String(it.chunks?.[ci] ?? "");
  const keep = it.cap != null ? it.cap : autoKeepCap(it.chunks);
  if (ci === 0 && !keep) t = lowerFirst(t);
  if (first) t = upperFirst(t);
  if (hidePunct) {
    const s = t.replace(/(^|\s)[,;:]+|[,;:]+(?=\s|$)/g, "$1").replace(/\s+/g, " ").trim();
    if (s) t = s;
  }
  return t;
}

// ---------- 어순 배열: 자동 묶기 ----------
// 규칙 기반 (API 없이). mode: "word" | "n" (n단어씩) | "phrase" (의미 단위) | "count" (n묶음)
const DET = new Set("a an the this that these those my your his her its our their some any every each no many much few several all both another other one two three four five six seven eight nine ten last next".split(" "));
const PREP = new Set("in on at to for with from by about of into onto under over after before during without near behind between among through across around along against than until since toward towards inside outside".split(" "));
const AUX = new Set("am is are was were be been being will would can could should shall may might must do does did have has had don't doesn't didn't won't can't cannot couldn't shouldn't wouldn't isn't aren't wasn't weren't haven't hasn't hadn't".split(" "));
const ADV = new Set("not never always often usually sometimes also just already still really very so too even ever".split(" "));
const ADJ = new Set("big small little old new young good bad great nice happy sad long short tall high low hot cold warm cool beautiful pretty kind favorite favourite best first last next same different important interesting delicious funny busy free famous special real whole own red blue green yellow white black".split(" "));
const PRON = new Set("i you he she it we they me him her us them myself yourself himself herself itself ourselves themselves there here this that what who".split(" "));
const FIXED = ["a lot of", "lots of", "in front of", "next to", "because of", "as well as", "each other", "at first", "of course", "kind of", "such as", "a few", "a little", "in order to", "be going to", "am going to", "is going to", "are going to", "was going to", "were going to", "used to", "have to", "has to", "had to", "want to", "wants to", "wanted to", "would like to", "at last", "at home", "at school", "every day", "these days", "one day", "after school", "for example", "thank you", "look forward to", "be able to", "get up", "wake up", "on time", "right now", "at night", "in the morning", "in the afternoon", "in the evening", "out of", "instead of", "all over", "more than", "less than", "according to", "thanks to", "how to", "what to"].map(s => s.split(" "));
const bareW = w => String(w).toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}']/gu, "");
const endsClause = w => /[,;:]$/.test(w);

// 의미 단위 묶음: 단어 배열 -> 묶음별 단어 수
function phraseSizes(words) {
  const n = words.length, b = words.map(bareW), sizes = [];
  const cap = (i) => /^\p{Lu}/u.test(words[i].replace(/^[^\p{L}]+/u, "")) && b[i] !== "i";
  let i = 0;
  // i부터 명사구 하나의 길이 (최대 4)
  const np = (i) => {
    let k = i;
    if (k < n && cap(k) && (k > 0 || (k + 1 < n && cap(k + 1)))) { while (k < n && cap(k) && !endsClause(words[k])) k++; if (k < n && cap(k)) k++; return k - i; }
    if (k < n && DET.has(b[k]) && !endsClause(words[k])) {
      k++;
      while (k < n && k - i < 3 && (ADJ.has(b[k]) || ADV.has(b[k])) && k + 1 < n && !endsClause(words[k]) && !PREP.has(b[k + 1]) && !AUX.has(b[k + 1])) k++;
      if (k < n && !PREP.has(b[k]) && !AUX.has(b[k])) k++;
      return k - i;
    }
    return 0;
  };
  while (i < n) {
    let len = 0;
    // 1) 고정 표현
    for (const f of FIXED) {
      if (f.length > 1 && i + f.length <= n && f.every((w, d) => b[i + d] === w) && !words.slice(i, i + f.length - 1).some(endsClause)) { len = Math.max(len, f.length); }
    }
    if (len) {
      // "a lot of fun", "in front of the house": 뒤의 명사구까지
      const last = b[i + len - 1];
      if ((last === "of" || PREP.has(last)) && i + len < n && !endsClause(words[i + len - 1])) len += np(i + len) || 1;
    } else if (PREP.has(b[i]) && i + 1 < n && !endsClause(words[i])) {
      // 2) 전치사 + 명사구 (to + 동사원형 포함)
      len = 1 + (np(i + 1) || 1);
    } else if (AUX.has(b[i]) && i + 1 < n && !endsClause(words[i])) {
      // 3) 조동사/be동사 + (not 등) + 동사
      let k = i + 1;
      while (k < n && ADV.has(b[k]) && !endsClause(words[k - 1])) k++;
      if (k < n && !endsClause(words[k - 1]) && !DET.has(b[k]) && !PREP.has(b[k]) && !PRON.has(b[k]) && !cap(k)) k++;
      len = k - i;
    } else if (ADV.has(b[i]) && i + 1 < n && !endsClause(words[i]) && !DET.has(b[i + 1]) && !PREP.has(b[i + 1]) && !PRON.has(b[i + 1]) && !AUX.has(b[i + 1])) {
      // 4) very well, always late
      len = 2;
    } else {
      // 5) 명사구 (관사·소유격 + 형용사 + 명사, 고유명사)
      len = np(i) || 1;
    }
    len = Math.max(1, Math.min(len, n - i));
    sizes.push(len);
    i += len;
  }
  return sizes;
}
function evenSizes(n, groups) {
  groups = Math.max(1, Math.min(groups, n));
  const base = Math.floor(n / groups), extra = n % groups;
  return Array.from({ length: groups }, (_, k) => base + (k < extra ? 1 : 0));
}
// 목표 묶음 수에 맞추기: 의미 단위에서 시작해 짧은 이웃끼리 합치거나 긴 묶음을 나눔
function countSizes(words, target) {
  const n = words.length;
  target = Math.max(1, Math.min(target, n));
  let s = phraseSizes(words);
  while (s.length > target) {
    let best = 0;
    for (let k = 1; k < s.length - 1; k++) if (s[k] + s[k + 1] < s[best] + s[best + 1]) best = k;
    s.splice(best, 2, s[best] + s[best + 1]);
  }
  while (s.length < target) {
    let k = s.indexOf(Math.max(...s));
    const a = Math.ceil(s[k] / 2);
    s.splice(k, 1, a, s[k] - a);
  }
  return s;
}
export function autoChunks(chunks, mode = "word", n = 2) {
  const words = (chunks || []).join(" ").split(" ").filter(Boolean);
  if (!words.length) return [];
  let sizes;
  if (mode === "phrase") sizes = phraseSizes(words);
  else if (mode === "n") sizes = evenSizes(words.length, Math.ceil(words.length / Math.max(1, n)));
  else if (mode === "count") sizes = countSizes(words, n);
  else sizes = words.map(() => 1);
  const out = [];
  let p = 0;
  for (const z of sizes) { out.push(words.slice(p, p + z).join(" ")); p += z; }
  return out;
}
