// 학습 엔진: 간격 반복(라이트너 상자) + 경험치/레벨/연속 학습/배지
import { dayNum, dayKey, weekKey, keyToDayNum } from './util.js';

// ---------- 간격 반복 ----------
// 상자 0(새 단어) ~ 5(완전 암기). 맞히면 한 칸 위로, 틀리면 1로.
export const INTERVALS = [0, 1, 2, 4, 8, 16]; // 다음 복습까지 일수
export const MASTER_BOX = 4;
export const BOX_LABEL = ['새 단어', '익히는 중', '익히는 중', '거의 앎', '암기 완료', '완벽'];

export function applyAnswer(st, correct) {
  st = st ? { ...st } : { b: 0, s: 0, c: 0, w: 0 };
  const today = dayNum();
  st.s = (st.s || 0) + 1;
  if (correct) {
    st.c = (st.c || 0) + 1;
    // 같은 날 반복 정답은 상자를 한 번만 올림
    if (st.lb !== today || !st.b) st.b = Math.min(5, (st.b || 0) + 1);
  } else {
    st.w = (st.w || 0) + 1;
    st.b = 1;
  }
  st.lb = today;
  st.d = today + INTERVALS[st.b];
  st.l = Date.now();
  return st;
}
export const isDue = st => st && st.s > 0 && st.d <= dayNum();
export const isMastered = st => st && st.b >= MASTER_BOX;
export const isSeen = st => st && st.s > 0;

// ---------- 레벨 ----------
export const LEVEL_TITLES = ['새싹', '단어 탐험가', '단어 수집가', '어휘 모험가', '어휘 기사', '단어 마법사', '어휘 박사', '단어 마스터', '어휘 전설'];
export function levelOf(xp = 0) {
  // 레벨 n 진입에 필요한 누적 XP = 60·n·(n-1)
  let lv = 1; while (60 * (lv + 1) * lv <= xp) lv++;
  const cur = 60 * lv * (lv - 1), next = 60 * (lv + 1) * lv;
  return { lv, cur, next, into: xp - cur, need: next - cur, title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lv - 1) / 3))] };
}

// ---------- 하루 기록 + 연속 학습 ----------
export function freshStats() {
  return { xp: 0, weekXp: 0, weekKey: weekKey(), streak: 0, bestStreak: 0, lastDay: null, goal: 50, days: {}, badges: {}, counters: {}, learned: 0, mastered: 0, freezes: 1 };
}

// 활동 기록 (정답/오답 1회 또는 보너스)
export function addActivity(stats, { xp = 0, answers = 0, correct = 0, newWords = 0, seconds = 0 }) {
  const k = dayKey(), today = dayNum();
  const wk = weekKey();
  if (stats.weekKey !== wk) { stats.weekKey = wk; stats.weekXp = 0; }
  // 연속 학습 갱신
  if (stats.lastDay !== k) {
    const last = stats.lastDay ? keyToDayNum(stats.lastDay) : null;
    if (last === today - 1) stats.streak = (stats.streak || 0) + 1;
    else if (last === today - 2 && (stats.freezes || 0) > 0) { stats.freezes--; stats.streak = (stats.streak || 0) + 1; stats._usedFreeze = true; }
    else stats.streak = 1;
    stats.lastDay = k;
    stats.bestStreak = Math.max(stats.bestStreak || 0, stats.streak);
    // 7일마다 연속 학습 보호권 1개 지급 (최대 2개)
    if (stats.streak % 7 === 0) stats.freezes = Math.min(2, (stats.freezes || 0) + 1);
  }
  const d = stats.days[k] || (stats.days[k] = { xp: 0, n: 0, c: 0, w: 0, t: 0 });
  const before = d.xp;
  d.xp += xp; d.n += answers; d.c += correct; d.w += newWords; d.t += seconds;
  stats.xp = (stats.xp || 0) + xp;
  stats.weekXp = (stats.weekXp || 0) + xp;
  // 오래된 날짜 기록 정리 (최근 400일만 보관)
  const keys = Object.keys(stats.days); if (keys.length > 400) keys.sort().slice(0, keys.length - 400).forEach(x => delete stats.days[x]);
  return { goalReached: before < stats.goal && d.xp >= stats.goal };
}
export function todayOf(stats) { return stats.days[dayKey()] || { xp: 0, n: 0, c: 0, w: 0, t: 0 }; }
// 오늘 아직 안 했으면 표시용 연속일 (어제까지 이어졌으면 유지, 끊겼으면 0)
export function liveStreak(stats) {
  if (!stats.lastDay) return 0;
  const gap = dayNum() - keyToDayNum(stats.lastDay);
  if (gap <= 1) return stats.streak || 0;
  if (gap === 2 && stats.freezes > 0) return stats.streak || 0;
  return 0;
}

// ---------- 배지 ----------
export const BADGES = [
  { id: 'first', icon: '🌱', name: '첫걸음', desc: '첫 학습 완료', test: s => s.xp > 0 },
  { id: 'w50', icon: '📗', name: '단어 50', desc: '단어 50개 학습', test: s => s.learned >= 50 },
  { id: 'w100', icon: '📘', name: '단어 100', desc: '단어 100개 학습', test: s => s.learned >= 100 },
  { id: 'w200', icon: '📙', name: '단어 200', desc: '단어 200개 학습', test: s => s.learned >= 200 },
  { id: 'w300', icon: '📚', name: '단어 300', desc: '단어 300개 학습', test: s => s.learned >= 300 },
  { id: 'm50', icon: '🧠', name: '암기왕 50', desc: '단어 50개 암기 완료', test: s => s.mastered >= 50 },
  { id: 'm150', icon: '🏛️', name: '암기왕 150', desc: '단어 150개 암기 완료', test: s => s.mastered >= 150 },
  { id: 's3', icon: '🔥', name: '3일 연속', desc: '3일 연속 학습', test: s => s.bestStreak >= 3 },
  { id: 's7', icon: '🔥', name: '일주일 연속', desc: '7일 연속 학습', test: s => s.bestStreak >= 7 },
  { id: 's14', icon: '🌋', name: '2주 연속', desc: '14일 연속 학습', test: s => s.bestStreak >= 14 },
  { id: 's30', icon: '☄️', name: '한 달 연속', desc: '30일 연속 학습', test: s => s.bestStreak >= 30 },
  { id: 'goal5', icon: '🎯', name: '목표 달성 5회', desc: '하루 목표 5번 달성', test: s => (s.counters.goals || 0) >= 5 },
  { id: 'perfect', icon: '💯', name: '만점', desc: '테스트 100점', test: s => (s.counters.perfect || 0) >= 1 },
  { id: 'test5', icon: '📝', name: '시험 5회', desc: '단원 테스트 5번 응시', test: s => (s.counters.tests || 0) >= 5 },
  { id: 'spell50', icon: '✍️', name: '철자 장인', desc: '철자 쓰기 50번 정답', test: s => (s.counters.spell || 0) >= 50 },
  { id: 'combo15', icon: '⚡', name: '15 콤보', desc: '연속 15문제 정답', test: s => (s.counters.bestCombo || 0) >= 15 },
  { id: 'match20', icon: '⏱️', name: '번개 손', desc: '짝 맞추기 20초 이내', test: s => s.counters.matchBest && s.counters.matchBest <= 20 },
  { id: 'review10', icon: '🔁', name: '복습 습관', desc: '오늘의 복습 10번 완료', test: s => (s.counters.reviews || 0) >= 10 },
  { id: 'night', icon: '🦉', name: '올빼미', desc: '밤 10시 이후 학습', test: s => s.counters.night },
  { id: 'early', icon: '🐦', name: '일찍 일어난 새', desc: '아침 7시 이전 학습', test: s => s.counters.early },
  { id: 'xp1000', icon: '💎', name: '1,000 XP', desc: '누적 1,000 XP', test: s => s.xp >= 1000 },
  { id: 'xp5000', icon: '👑', name: '5,000 XP', desc: '누적 5,000 XP', test: s => s.xp >= 5000 },
];
export function checkBadges(stats) {
  const h = new Date().getHours();
  if (h >= 22) stats.counters.night = 1;
  if (h < 7 && h >= 4) stats.counters.early = 1;
  const got = [];
  for (const b of BADGES) if (!stats.badges[b.id] && b.test(stats)) { stats.badges[b.id] = Date.now(); got.push(b); }
  return got;
}

export const XP = { correct: 10, wrong: 2, newWord: 3, perfectBonus: 30, sessionBonus: 10 };
