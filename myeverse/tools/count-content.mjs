// 첫 페이지 앱 카드의 자료 수를 세어 myeverse/stats.json 에 저장해요.
//   node myeverse/tools/count-content.mjs             오늘 기록을 만들거나 고쳐요
//   node myeverse/tools/count-content.mjs --backfill  git 기록으로 지난 14일의 파일 자료 수를 채워요
// 숫자가 바뀐 날만 기록해요. 지문·문제 내용은 저장하지 않아요.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'myeverse/stats.json');
const KEEP_DAYS = 60;
const SB_URL = 'https://jkxdhyvnrvsiokbbbjtu.supabase.co';
const SB_KEY = 'sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF';   // 공개용 키

const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
const reader = ref => file => ref ? git('show', `${ref}:${file}`) : fs.readFileSync(path.join(ROOT, file), 'utf8');
function run(code, name) {
  const w = {}; w.window = w;
  vm.createContext(w);
  vm.runInContext(code, w);
  return vm.runInContext(name, w);
}
const sum = (list, f) => list.reduce((n, x) => n + f(x), 0);

// 앱마다 따로 세요. 하나가 실패해도 나머지는 남겨요.
const COUNTERS = {
  'reading-passport': r => ({ books: run(r('app/books.js'), 'BOOKS').length }),
  'knowledge-passport': r => ({ texts: run(r('reading2/app/books.js'), 'BOOKS').length }),
  'reading-metro': r => {
    const open = run(r('metro/catalog.js'), 'METRO').lines.filter(l => l.status === 'open');
    return { lines: open.length, stations: sum(open, l => l.stations.length), questions: sum(open, l => sum(l.stations, s => s.quizCount || 0)) };
  },
  'word-forest': r => ({ words: JSON.parse(r('danuhsup/source/src/data/g2-park.json')).length }),
  'word-arcade': r => ({ words: sum([1, 2], g => JSON.parse(r(`wordarcade/data/g${g}.json`)).words.length) }),
  'word-rush': r => ({ words: JSON.parse(r('wordrush/data/vocab.json')).items.length }),
  'english-arcade': r => ({ words: JSON.parse(r('my-english-arcade/data/bank.json')).items.length }),
  'sentence-gym': r => {
    // sentence/core.js 의 SG.load 와 같은 기준 (제목·두 단어 이하 문장은 빼요)
    const skip = new Set(['제목', '부제', '소제목', '날짜']);
    let n = sum(Object.values(run(r('sentence/data/grammar.js'), 'SG_GRAMMAR')), u => u.s.length);
    for (const g of [1, 2]) for (let u = 1; u <= 8; u++) {
      const d = run(`var L; function lessonLoaded(g, u, x) { L = x; }\n${r(`textbook/data/${g}-${u}.js`)}`, 'L');
      n += (d.sentences || []).filter(s => !skip.has(s.tag) && s.en.trim().split(/\s+/).length >= 3).length + (d.context || []).length;
    }
    return { sentences: n };
  },
  'history': r => ({ rooms: sum(run(r('history/catalog.js'), 'MUSEUM').halls, h => h.rooms.filter(x => x.open).length) }),
  'quiz-show': r => {
    const m = r('quizshow/index.html').match(/const WORKS_DATA = (\[.*\]);?\s*$/m);
    const works = JSON.parse(m[1]);
    return { works: works.length, questions: sum(works, w => w.questions.length) };
  },
  'quiz-queens': r => ({ questions: run(r('quiz/questions.js'), 'DEFAULT_QUESTIONS').length })
};

function countFiles(ref) {
  const out = {};
  for (const [app, f] of Object.entries(COUNTERS)) {
    try { out[app] = f(reader(ref)); }
    catch (e) { if (!ref) console.warn(`세지 못함: ${app} — ${e.message}`); }
  }
  return out;
}
async function countDb() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/rpc/mv_content_counts`, {
      method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) { console.warn(`DB 자료 수를 받지 못함 (이전 숫자를 써요): ${e.message}`); return {}; }
}
function merge(base, files, db) {
  const out = {};
  for (const app of new Set([...Object.keys(base), ...Object.keys(files), ...Object.keys(db)])) {
    const v = { ...base[app], ...files[app] };
    for (const [k, n] of Object.entries(db[app] || {})) {
      if (!Number.isInteger(n)) continue;
      v[k] = n;
    }
    out[app] = v;
  }
  return out;
}

const kst = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const now = Date.now(), today = kst(now);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const stats = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { history: [] };
let history = stats.history;

if (process.argv.includes('--backfill')) {
  const old = [];
  for (let d = 14; d >= 1; d--) {
    const day = kst(now - d * 864e5);
    if (history.some(h => h.date <= day)) continue;
    const ref = git('rev-list', '-1', `--before=${day}T23:59:59+09:00`, 'HEAD').trim();
    if (!ref) continue;
    const apps = countFiles(ref);
    if (!old.length || !same(old.at(-1).apps, apps)) old.push({ date: day, apps });
  }
  history = [...old, ...history];
}

const last = history.filter(h => h.date !== today).at(-1);
const apps = merge(history.at(-1)?.apps || {}, countFiles(), await countDb());
if (last && same(last.apps, apps)) history = history.filter(h => h.date !== today);
else history = [...history.filter(h => h.date !== today), { date: today, apps }];

// 오래된 기록 정리: 기준일 직전 값 하나는 남겨요
const cut = kst(now - KEEP_DAYS * 864e5);
const before = history.filter(h => h.date < cut);
history = [...before.slice(-1), ...history.filter(h => h.date >= cut)];

const text = '{"history":[\n' + history.map(h => JSON.stringify(h)).join(',\n') + '\n]}\n';
if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) { fs.writeFileSync(OUT, text); console.log('stats.json 저장'); }
else console.log('바뀐 숫자 없음');
