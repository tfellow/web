// 공통 유틸: DOM, 날짜, 랜덤, 음성(TTS), 효과음, 토스트, 축하 효과
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 템플릿 → 엘리먼트
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- 날짜 ----------
export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
export function dayNum(d = new Date()) { // 로컬 기준 일 번호
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
export function keyToDayNum(k) { const [y, m, d] = k.split('-').map(Number); return dayNum(new Date(y, m - 1, d)); }
export function dayNumToKey(n) { const d = new Date(n * 86400000); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; }
export function weekKey(d = new Date()) { // 월요일 시작 주
  const n = dayNum(d); const dow = (d.getDay() + 6) % 7; return dayNumToKey(n - dow);
}
export function fmtDate(ts) { if (!ts) return '-'; const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
export function daysAgoText(ts) {
  if (!ts) return '기록 없음';
  const diff = dayNum() - dayNum(new Date(ts));
  return diff <= 0 ? '오늘' : diff === 1 ? '어제' : `${diff}일 전`;
}

// ---------- 랜덤 ----------
export function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function sample(a, n) { return shuffle(a).slice(0, n); }
export function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
export function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------- 저장 ----------
export const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
};

// ---------- 설정 ----------
export const prefs = Object.assign({ sound: true, autoSpeak: true, rate: 0.9, accent: 'en-US' }, ls.get('vocab.prefs', {}));
export function savePrefs() { ls.set('vocab.prefs', prefs); }

// ---------- 발음 (Web Speech API) ----------
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch { } }
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch { }
export function speak(text, { rate, lang } = {}) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || prefs.accent;
    u.rate = rate || prefs.rate;
    const v = voices.find(v => v.lang === u.lang && /Google|Samantha|Daniel|Natural/.test(v.name)) || voices.find(v => v.lang === u.lang);
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { }
}
export const canSpeak = () => 'speechSynthesis' in window;

// ---------- 효과음 (WebAudio) ----------
let actx;
export function sfx(type) {
  if (!prefs.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [660, 880], bad: [220, 180], tap: [520], win: [523, 659, 784, 1047], combo: [784, 988, 1175] }[type] || [440];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type === 'bad' ? 'square' : 'sine';
      o.frequency.value = f;
      const t = actx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type === 'bad' ? 0.05 : 0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.18);
    });
  } catch { }
}
export function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch { } }

// ---------- 토스트 ----------
export function toast(msg, kind = '') {
  let box = $('#toasts');
  if (!box) { box = el('<div id="toasts" aria-live="polite"></div>'); document.body.appendChild(box); }
  const t = el(`<div class="toast ${kind}">${msg}</div>`);
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

// ---------- 모달 ----------
export function modal(html, { onClose, wide } = {}) {
  const m = el(`<div class="modal-back" role="dialog" aria-modal="true"><div class="modal ${wide ? 'wide' : ''}"><button class="icon-btn modal-x" aria-label="닫기">✕</button>${html}</div></div>`);
  const close = () => { m.remove(); onClose && onClose(); };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('.modal-x') || e.target.closest('[data-close]')) close(); });
  document.body.appendChild(m);
  return { el: m.querySelector('.modal'), close };
}

// ---------- 축하 (캔버스 컨페티) ----------
export function confetti(n = 120) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = el('<canvas class="confetti"></canvas>'); document.body.appendChild(c);
  const ctx = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#FFC93C', '#3FA9F5', '#3DBE6B', '#FF5C7A', '#9B6BF2', '#7DDF86'];
  const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: pick(cols), a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (++f < 150) requestAnimationFrame(tick); else c.remove();
  })();
}

export function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
export function sum(a, f = x => x) { return a.reduce((s, x) => s + (f(x) || 0), 0); }
export function avg(a, f = x => x) { const v = a.map(f).filter(x => x != null && !isNaN(x)); return v.length ? sum(v) / v.length : null; }

export function downloadCSV(name, rows) {
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
