// 앱 전역 상태 + 학습 기록 처리
import { applyAnswer, addActivity, checkBadges, freshStats, isMastered, XP, isDue } from './game.js';
import { allBooks, getBook } from '../data/books.js';
import { toast, confetti, sfx } from './util.js';

export const S = { store: null, user: null, progress: {}, dirty: new Set(), userDirty: false };

export function stats() { return S.user.stats || (S.user.stats = freshStats()); }

export async function progressOf(bookId) {
  if (!S.progress[bookId]) S.progress[bookId] = await S.store.loadProgress(S.user.uid, bookId);
  return S.progress[bookId];
}

// 한 문제 결과 기록 → 획득 XP 반환
export function record(word, correct, { kind } = {}) {
  const st = stats();
  const map = S.progress[word.bookId] || (S.progress[word.bookId] = {});
  const prev = map[word.id];
  const wasSeen = prev && prev.s > 0, wasM = isMastered(prev);
  const next = applyAnswer(prev, correct);
  if (prev?.f) next.f = prev.f; else delete next.f;
  map[word.id] = next;
  if (!wasSeen) st.learned = (st.learned || 0) + 1;
  const nowM = isMastered(next);
  if (nowM && !wasM) st.mastered = (st.mastered || 0) + 1;
  if (!nowM && wasM) st.mastered = Math.max(0, (st.mastered || 0) - 1);
  if (kind === 'spell' && correct) st.counters.spell = (st.counters.spell || 0) + 1;
  const xp = (correct ? XP.correct : XP.wrong) + (wasSeen ? 0 : XP.newWord);
  const { goalReached } = addActivity(st, { xp, answers: 1, correct: correct ? 1 : 0, newWords: wasSeen ? 0 : 1, seconds: 6 });
  if (goalReached) { st.counters.goals = (st.counters.goals || 0) + 1; setTimeout(() => { sfx('win'); confetti(); toast('🎯 오늘의 목표 달성! 대단해요!', 'good'); }, 300); }
  if (st._usedFreeze) { delete st._usedFreeze; toast('🧊 연속 학습 보호권을 사용해 연속 기록을 지켰어요!'); }
  S.dirty.add(word.bookId); S.userDirty = true; scheduleSave();
  return xp;
}

export function bonus(xp, counters = {}) {
  const st = stats();
  for (const [k, v] of Object.entries(counters)) {
    if (k === 'bestCombo') st.counters.bestCombo = Math.max(st.counters.bestCombo || 0, v);
    else if (k === 'matchBest') st.counters.matchBest = st.counters.matchBest ? Math.min(st.counters.matchBest, v) : v;
    else st.counters[k] = (st.counters[k] || 0) + v;
  }
  if (xp) addActivity(st, { xp });
  S.userDirty = true; scheduleSave();
}

export function toggleFav(word) {
  const map = S.progress[word.bookId] || (S.progress[word.bookId] = {});
  const s = map[word.id] || (map[word.id] = { b: 0, s: 0, c: 0, w: 0 });
  s.f = s.f ? 0 : 1; S.dirty.add(word.bookId); scheduleSave();
  return !!s.f;
}

// 새 배지 확인 → 획득 목록
export function newBadges() {
  const got = checkBadges(stats());
  if (got.length) { S.userDirty = true; scheduleSave(); }
  return got;
}

let timer, saving = Promise.resolve();
export function scheduleSave(ms = 1500) { clearTimeout(timer); timer = setTimeout(flush, ms); }
// 저장은 한 번에 하나씩 차례로. 실패하면 다시 저장할 목록에 되돌려 놓고 잠시 뒤 다시 시도합니다.
export function flush() {
  clearTimeout(timer);
  return (saving = saving.then(saveNow, saveNow));
}
async function saveNow() {
  if (!S.user || !S.store) return;
  const books = [...S.dirty], userDirty = S.userDirty;
  S.dirty.clear(); S.userDirty = false;
  try {
    for (const b of books) await S.store.saveProgress(S.user.uid, b, S.progress[b]);
    if (userDirty) await S.store.saveUser(S.user);
  } catch (e) {
    console.error(e);
    books.forEach(b => S.dirty.add(b)); if (userDirty) S.userDirty = true;
    if (e?.code !== 'permission-denied') scheduleSave(15000);
    toast(e?.code === 'permission-denied' ? '저장 권한이 없어요. 학교 계정으로 로그인했는지 확인해 주세요.' : `저장에 실패했어요. 잠시 후 자동으로 다시 시도할게요. (${e?.code || e?.message || '알 수 없는 오류'})`, 'bad');
  }
}
addEventListener('online', () => { if (S.user && (S.dirty.size || S.userDirty)) flush(); });
addEventListener('pagehide', () => { if (S.user) flush(); });
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.user) flush(); });

// 오늘 복습할 단어 (모든 단어장)
export async function dueWords() {
  const out = [];
  for (const b of allBooks()) {
    const map = await progressOf(b.id);
    for (const w of b.words) if (isDue(map[w.id])) out.push(w);
  }
  return out;
}
export async function wrongWords(bookId) {
  const out = []; const books = bookId ? [getBook(bookId)] : allBooks();
  for (const b of books) { const map = await progressOf(b.id); for (const w of b.words) { const s = map[w.id]; if (s && s.w > 0 && s.b < 4) out.push(w); } }
  return out.sort((a, b) => (S.progress[b.bookId][b.id].w - S.progress[a.bookId][a.id].w));
}
export async function favWords() {
  const out = []; for (const b of allBooks()) { const map = await progressOf(b.id); for (const w of b.words) if (map[w.id]?.f) out.push(w); } return out;
}
