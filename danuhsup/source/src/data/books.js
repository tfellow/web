// 단어장 레지스트리. 기본 내장 단어장 + 교사가 업로드한 단어장(스토어에서 로드)
import g2park from './g2-park.json';

// 압축 형식 {l,n,w,p,k,e,x,xk} → 단어 객체
export function normalizeBook(meta, rows) {
  const words = rows.map(r => ({
    id: `${meta.id}:${r.l}:${r.n}`,
    bookId: meta.id, lesson: r.l, no: r.n,
    word: r.w, pos: r.p || '', ko: r.k, en: r.e || '', ex: r.x || '', exKo: r.xk || '',
  }));
  const lessonNums = [...new Set(words.map(w => w.lesson))].sort((a, b) => a - b);
  const lessons = lessonNums.map(n => ({ n, title: (meta.lessonTitles || {})[n] || `Lesson ${n}`, count: words.filter(w => w.lesson === n).length }));
  return { ...meta, words, lessons };
}

export const BUILTIN_BOOKS = [
  normalizeBook({ id: 'g2-park', title: '중2 영어 New Words', short: '중2 (박)', grade: 2, publisher: '출판사 교과서', builtin: true }, g2park),
];

const registry = new Map(BUILTIN_BOOKS.map(b => [b.id, b]));
// 교사가 정한 단어장 이름·순서. vocab_books/_settings 문서 하나에 저장 (단어장 문서와 같은 권한 규칙)
export const SETTINGS_ID = '_settings';
let settings = { id: SETTINGS_ID, order: [], names: {} };
const original = new Map(); // 이름을 바꾸기 전 원래 이름
function applyNames() {
  for (const b of registry.values()) {
    if (!original.has(b.id)) original.set(b.id, { title: b.title, short: b.short });
    Object.assign(b, original.get(b.id), settings.names?.[b.id] || {});
  }
}
export function setCustomBooks(list) {
  for (const b of list) {
    if (b.id === SETTINGS_ID) { settings = { order: [], names: {}, ...b }; continue; }
    original.delete(b.id);
    registry.set(b.id, normalizeBook(b, b.rows));
  }
  applyNames();
}
export const bookSettings = () => JSON.parse(JSON.stringify(settings));
export function setBookSettings(next) { settings = { ...next, id: SETTINGS_ID }; applyNames(); }
export const originalName = id => original.get(id) || {};
export const hasCustomOrder = () => (settings.order || []).length > 0;
export const allBooks = () => {
  const order = settings.order || [];
  return [...registry.values()].map((b, i) => [b, i]).sort(([a, i], [b, j]) => {
    const x = order.indexOf(a.id), y = order.indexOf(b.id);
    return (x < 0 ? 1e6 + i : x) - (y < 0 ? 1e6 + j : y);
  }).map(([b]) => b);
};
export function removeBook(id) { registry.delete(id); original.delete(id); }
export const getBook = id => registry.get(id);
export function getWord(id) { const b = registry.get(id.split(':')[0]); return b && b.words.find(w => w.id === id); }
export function booksForGrade(g) { const l = allBooks().filter(b => !g || b.grade == g); return l.length ? l : allBooks(); }

// 엑셀/CSV 행 → 압축 행. 머리글: grade, lesson, no., words, 한글 뜻, 영영풀이, 예문, 예문 해석
const POS = /^\s*((?:n|v|adj|adv|a|prep|conj|pron|int)\.(?:\s*\/\s*(?:n|v|adj|adv|a|prep|conj|pron)\.)*)\s*/;
function splitPos(s) { s = String(s ?? '').trim(); const m = s.match(POS); return m ? [m[1] === 'a.' ? 'adj.' : m[1], s.slice(m[0].length).trim()] : ['', s]; }
export function rowsFromSheet(aoa) {
  const head = aoa[0].map(h => String(h ?? '').trim().toLowerCase());
  const find = (...keys) => head.findIndex(h => keys.some(k => h.includes(k)));
  const ci = { g: find('grade', '학년'), l: find('lesson', '단원'), n: find('no'), w: find('word', '단어'), k: find('한글', '뜻', 'meaning'), e: find('영영', 'definition'), x: find('예문', 'example'), xk: find('해석', 'translation') };
  if (ci.w < 0 || ci.k < 0) throw new Error('머리글에 words(단어)와 한글 뜻 열이 필요합니다.');
  if (ci.xk === ci.x) ci.xk = head.findIndex((h, i) => i !== ci.x && h.includes('해석'));
  const out = []; let auto = {}; let grade = null;
  for (const r of aoa.slice(1)) {
    const w = String(r[ci.w] ?? '').trim(); if (!w) continue;
    const l = Number(r[ci.l]) || 1; auto[l] = (auto[l] || 0) + 1;
    if (ci.g >= 0 && r[ci.g]) grade = grade || Number(r[ci.g]);
    const [p, k] = splitPos(r[ci.k]); const [p2, e] = splitPos(ci.e >= 0 ? r[ci.e] : '');
    out.push({ l, n: Number(r[ci.n]) || auto[l], w, p: p || p2, k, e, x: ci.x >= 0 ? String(r[ci.x] ?? '').trim() : '', xk: ci.xk >= 0 ? String(r[ci.xk] ?? '').trim() : '' });
  }
  return { rows: out, grade };
}
