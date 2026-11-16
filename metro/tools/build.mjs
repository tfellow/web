// MY Reading Metro · 데이터 빌드
// 사용법: node metro/tools/build.mjs <출력 폴더> [퀴즈 폴더] [원본 폴더]
//   원본 폴더(비공개): 교과서 본문 <역 id>.s.json(문장·해설) + <역 id>.q.json(줄거리·퀴즈)
//   퀴즈 폴더(비공개)의 *.json: { "m1-01": [{ q, o: [정답, 오답, 오답, 오답], why, ids }] } — 정답을 맨 앞에 써요.
//   빌드할 때 정답 위치가 1·2·3·4로 고르게 섞이고, 문항 수·선택지 수·정답 길이를 검사해요.
//   - 저장소에 쓰는 것: metro/catalog.js (노선도·분석 수치만, 본문 없음)
//   - 출력 폴더에만 쓰는 것(비공개): metro_seed.sql (본문·퀴즈 정답을 Supabase에 등록)
// 원본: textbook/data/<학년>-<단원>.js (YBM(박) 중1·중2)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SRC = path.join(ROOT, "textbook", "data");
const OUT = process.argv[2];
const QUIZ_DIR = process.argv[3];
const SRC_DIR = process.argv[4];
if (!OUT) { console.error("출력 폴더를 지정하세요: node metro/tools/build.mjs <출력 폴더>"); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 교과서(노선) ---------- */
const LINES = [
  { id: "m1", school: "중", grade: 1, publisher: "YBM", author: "박준언", course: "중학교 영어 1", color: "#2FA84F", status: "open" },
  { id: "m2", school: "중", grade: 2, publisher: "YBM", author: "박준언", course: "중학교 영어 2", color: "#2563C9", status: "open" },
  { id: "m3", school: "중", grade: 3, publisher: "YBM", author: "박준언", course: "중학교 영어 3", color: "#E07A1F", status: "planned", note: "2027년 3월 개통 예정 (2022 개정 중3 교과서 적용 연도)" },
  // 아래 노선은 비공개 원본 폴더(<srcDir>/<역 id>.s.json, .q.json)에 본문이 있을 때만 열려요
  { id: "k1", label: "김1", school: "중", grade: 1, publisher: "NE능률", author: "김기택", course: "중학교 영어 1", color: "#C62E2E", status: "src" },
  { id: "k2", label: "김2", school: "중", grade: 2, publisher: "NE능률", author: "김기택", course: "중학교 영어 2", color: "#5B7A1F", status: "src" },
  { id: "s1", label: "소1", school: "중", grade: 1, publisher: "천재교육", author: "소영순", course: "중학교 영어 1", color: "#D4A017", status: "src" },
  { id: "s2", label: "소2", school: "중", grade: 2, publisher: "천재교육", author: "소영순", course: "중학교 영어 2", color: "#4A5D8C", status: "src" },
  { id: "n1", label: "민1", school: "고", grade: 1, publisher: "NE능률", author: "민", course: "공통영어 1", color: "#8B3FC1", status: "src" },
  { id: "n2", label: "민2", school: "고", grade: 1, publisher: "NE능률", author: "민", course: "공통영어 2", color: "#D23F7A", status: "src" },
  { id: "o1", label: "오1", school: "고", grade: 1, publisher: "NE능률", author: "오", course: "공통영어 1", color: "#0F9D94", status: "src" },
  { id: "o2", label: "오2", school: "고", grade: 1, publisher: "NE능률", author: "오", course: "공통영어 2", color: "#B8641E", status: "src" }
];

/* ---------- CEFR 단어 목록 (CEFR-J Wordlist 1.5 + Octanove C1/C2) ---------- */
const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
const cefr = new Map();
const funcPos = new Map();
function loadCsv(file) {
  const rows = fs.readFileSync(path.join(HERE, "cefr", file), "utf8").split(/\r?\n/).slice(1);
  for (const r of rows) {
    if (!r.trim()) continue;
    const [head, pos, lv] = r.split(",");
    if (!LV.includes(lv)) continue;
    for (const h of head.split("/")) {
      const k = h.trim().toLowerCase();
      if (!k || /\s/.test(k)) continue;
      if (!cefr.has(k) || LV.indexOf(lv) < LV.indexOf(cefr.get(k))) cefr.set(k, lv);
      if (/determiner|pronoun|preposition|conjunction|auxiliary|be-verb|do-verb|have-verb|modal|number|interjection/.test(pos)) funcPos.set(k, true);
    }
  }
}
loadCsv("cefrj-vocabulary-profile-1.5.csv");
loadCsv("octanove-vocabulary-profile-c1c2-1.0.csv");

const IRR = {
  am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", being: "be", "i'm": "i", "it's": "it", "we're": "we", "you're": "you", "they're": "they", "he's": "he", "she's": "she", "that's": "that", "there's": "there", "let's": "let", "don't": "do", "doesn't": "do", "didn't": "do", "can't": "can", "won't": "will", "isn't": "be", "aren't": "be", "wasn't": "be", "i'll": "i", "we'll": "we", "you'll": "you", "it'll": "it", "i've": "i", "we've": "we", "i'd": "i",
  went: "go", gone: "go", ran: "run", took: "take", taken: "take", made: "make", had: "have", has: "have", did: "do", done: "do", said: "say", saw: "see", seen: "see", came: "come", got: "get", gotten: "get", gave: "give", given: "give", knew: "know", known: "know", thought: "think", told: "tell", found: "find", left: "leave", felt: "feel", became: "become", began: "begin", begun: "begin", brought: "bring", bought: "buy", built: "build", caught: "catch", chose: "choose", chosen: "choose", drew: "draw", drawn: "draw", drank: "drink", drove: "drive", ate: "eat", eaten: "eat", fell: "fall", fallen: "fall", flew: "fly", flown: "fly", forgot: "forget", grew: "grow", grown: "grow", heard: "hear", held: "hold", kept: "keep", led: "lead", lost: "lose", meant: "mean", met: "meet", paid: "pay", rode: "ride", rose: "rise", risen: "rise", sold: "sell", sent: "send", sang: "sing", sung: "sing", sat: "sit", slept: "sleep", spoke: "speak", spoken: "speak", spent: "spend", stood: "stand", stole: "steal", swam: "swim", taught: "teach", threw: "throw", thrown: "throw", understood: "understand", woke: "wake", wore: "wear", worn: "wear", won: "win", wrote: "write", written: "write", children: "child", people: "person", men: "man", women: "woman", feet: "foot", teeth: "tooth", mice: "mouse", better: "good", best: "good", worse: "bad", worst: "bad", lives: "life", leaves: "leaf", knives: "knife", wolves: "wolf", hid: "hide", hidden: "hide", shook: "shake", broke: "break", broken: "break", froze: "freeze", lay: "lie", laid: "lay", fed: "feed", fought: "fight", hung: "hang", shot: "shoot", shone: "shine", struck: "strike", tore: "tear", stuck: "stick", spun: "spin", sank: "sink", dug: "dig", bit: "bite", bent: "bend", lent: "lend", lit: "light", slid: "slide", swept: "sweep", wept: "weep"
};
function lemmaCandidates(w) {
  const c = [w];
  if (IRR[w]) c.push(IRR[w]);
  const add = (x) => { if (x && x.length > 1) c.push(x); };
  if (w.endsWith("'s") || w.endsWith("’s")) add(w.slice(0, -2));
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ied")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); }
  if (w.endsWith("ing")) { add(w.slice(0, -3)); add(w.slice(0, -3) + "e"); if (/(.)\1ing$/.test(w)) add(w.slice(0, -4)); if (w.endsWith("ying")) add(w.slice(0, -4) + "ie"); }
  if (w.endsWith("ier")) add(w.slice(0, -3) + "y");
  if (w.endsWith("iest")) add(w.slice(0, -4) + "y");
  if (w.endsWith("er")) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1er$/.test(w)) add(w.slice(0, -3)); }
  if (w.endsWith("est")) { add(w.slice(0, -3)); add(w.slice(0, -2)); if (/(.)\1est$/.test(w)) add(w.slice(0, -4)); }
  if (w.endsWith("ily")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ly")) add(w.slice(0, -2));
  return c;
}
function levelOf(w) {
  for (const k of lemmaCandidates(w.toLowerCase().replace(/’/g, "'"))) if (cefr.has(k)) return cefr.get(k);
  return null;
}

/* ---------- 문장 분석 ---------- */
const WORD_RE = /[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g;
const HEADING_TAGS = new Set(["제목", "소제목", "그림표지"]);
function words(s) { return s.match(WORD_RE) || []; }
function syllables(w) {
  w = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}
function analyse(lesson) {
  const names = new Set();
  ((lesson.characters && lesson.characters.people) || []).forEach((p) => names.add(p.name.toLowerCase()));
  const s = lesson.sentences;
  const title = s[0].en;
  let total = 0, body = 0, bodySent = 0, syl = 0;
  const dist = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, none: 0 };
  const off = new Map();
  s.forEach((x, i) => {
    const ws = words(x.en);
    total += ws.length;
    if (!HEADING_TAGS.has(x.tag)) { body += ws.length; bodySent += 1; ws.forEach((w) => { syl += syllables(w); }); }
    ws.forEach((w, j) => {
      if (/^\d/.test(w)) return;
      const low = w.toLowerCase();
      if (names.has(low)) return;
      const lv = levelOf(w);
      const cap = /^[A-Z]/.test(w);
      if (!lv && cap) return; // 고유명사(사람·나라·행사 이름)는 빼요
      if (lv && cap && j > 0 && !HEADING_TAGS.has(x.tag) && !cefr.has(low)) return;
      if (lv) dist[lv] += 1; else { dist.none += 1; off.set(low, (off.get(low) || 0) + 1); }
    });
  });
  // 목록에 없는 낱말(외래어·음식 이름 등)은 계산에서 빼고 따로 보여 줘요
  const leveled = LV.reduce((a, l) => a + dist[l], 0);
  let cum = 0, est = "C2";
  for (const l of LV) { cum += dist[l]; if (cum / leveled >= 0.95) { est = l; break; } }
  const msl = body / Math.max(1, bodySent);
  const fk = 0.39 * msl + 11.8 * (syl / Math.max(1, body)) - 15.59;
  const lexile = Math.max(100, Math.round((150 + 110 * fk) / 10) * 10);
  return {
    words: total,
    titleWords: words(title).length,
    bodyWords: body,
    sentences: bodySent,
    msl: Math.round(msl * 10) / 10,
    fk: Math.round(fk * 10) / 10,
    cefr: est,
    cefrDist: dist,
    lexile,
    offList: [...off.keys()].slice(0, 20)
  };
}

/* ---------- 단어장 ---------- */
function vocabOf(lesson) {
  const out = [], seen = new Set();
  for (const x of lesson.sentences) {
    const items = String(x.vocab || "").split(/;\s*/);
    for (const it of items) {
      const main = it.split(/\s[↔≈→]\s?|\s=\s/)[0].trim();
      const m = main.match(/^([A-Za-z][A-Za-z’'\-–\s.!?~,]*?)\s+([^A-Za-z].*)$/);
      if (!m) continue;
      let head = m[1].trim().replace(/[.,]$/, "");
      const ko = m[2].trim().replace(/^[(:]\s*/, "");
      if (!/[가-힣]/.test(ko) || /^(불?가산\s*)?(명사|동사|형용사|부사|전치사|대명사)(\s*취급)?$/.test(ko)) continue;
      const forms = head.includes("–") ? head : "";
      const w = head.split("–")[0].trim();
      const key = w.toLowerCase();
      if (seen.has(key) || key.length < 2) continue;
      const enLow = x.en.toLowerCase();
      const cands = (forms ? forms.split("–") : [w]).map((f) => f.trim().toLowerCase());
      const inSentence = cands.some((f) => enLow.includes(f.split(" ")[0])) || lemmaFound(enLow, key);
      if (!inSentence) continue;
      if (/\s/.test(key) === false && funcPos.has(key) && (cefr.get(key) === "A1")) continue;
      seen.add(key);
      const lv = /\s/.test(key) ? phraseLevel(key) : levelOf(key);
      out.push({ w, forms, ko: ko.replace(/\s+/g, " "), lv: lv || "", sid: x.id });
    }
  }
  return out;
}
function lemmaFound(enLow, key) { return words(enLow).some((t) => lemmaCandidates(t).includes(key)); }
function phraseLevel(p) {
  let worst = -1;
  for (const t of words(p)) { const l = levelOf(t); if (l) worst = Math.max(worst, LV.indexOf(l)); }
  return worst >= 0 ? LV[worst] : "";
}

/* ---------- 퀴즈 (10문항 4지선다, 정답 위치 고르게) ---------- */
const QUIZ = {};
if (QUIZ_DIR) for (const f of fs.readdirSync(QUIZ_DIR).filter((x) => x.endsWith(".json")).sort()) Object.assign(QUIZ, JSON.parse(fs.readFileSync(path.join(QUIZ_DIR, f), "utf8")));
function rng(seed) { let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; }; }
function shuffleR(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }
let unitNo = 0;
const problems = [];
function arrangeQuiz(id, list) {
  if (list.length !== 10) problems.push(`${id}: 문항 ${list.length}개 (10개여야 해요)`);
  const r = rng(id);
  const base = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3].map((x) => (x + unitNo) % 4); // 단원마다 3·3·2·2를 돌려 전체가 고르게
  const pos = shuffleR(base.slice(0, list.length), r);
  unitNo++;
  return list.map((qq, i) => {
    const [ans, ...wrong] = qq.o;
    if (qq.o.length !== 4) problems.push(`${id} ${i + 1}번: 선택지 ${qq.o.length}개`);
    if (new Set(qq.o).size !== qq.o.length) problems.push(`${id} ${i + 1}번: 같은 선택지`);
    if (ans.length > Math.max(...wrong.map((w) => w.length))) problems.push(`${id} ${i + 1}번: 정답이 가장 길어요 (${ans})`);
    if (/sentence \d|last sentence|line \d/i.test(qq.q)) problems.push(`${id} ${i + 1}번: 문장 번호 대신 문장을 보여 주세요`);
    const opts = shuffleR(wrong, r);
    opts.splice(pos[i], 0, ans);
    return { no: i + 1, question: qq.q, choices: opts, answer: pos[i] + 1, why: qq.why, ids: qq.ids || [] };
  });
}

/* ---------- 읽기 ---------- */
function loadLesson(file) {
  let got = null;
  const ctx = { lessonLoaded: (g, u, d) => { got = { grade: g, unit: u, data: d }; } };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx);
  return got;
}
const files = fs.readdirSync(SRC).filter((f) => /^\d-\d+\.js$/.test(f)).sort((a, b) => {
  const [ga, ua] = a.split(/[-.]/).map(Number), [gb, ub] = b.split(/[-.]/).map(Number);
  return ga - gb || ua - ub;
});

const catalog = { lines: LINES.map((l) => Object.assign({}, l, { stations: [] })), built: new Date().toISOString().slice(0, 10) };
const seed = [];
const quizSql = [];
const preview = { units: {}, quiz: {} }; // 화면 미리보기용 (비공개 출력 폴더에만)
const q = (v) => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const j = (v) => q(JSON.stringify(v)) + "::jsonb";

function emit(line, id, unit, data, quizList, extra) {
  const stats = analyse(data);
  const vocab = vocabOf(data);
  const m = data.meta;
  const quiz = quizList ? arrangeQuiz(id, quizList) : (data.questions || []).map((qq, i) => ({ no: i + 1, question: qq.q, choices: qq.options, answer: qq.answer + 1, why: qq.why, ids: qq.ids || [] }));
  if ((QUIZ_DIR || SRC_DIR) && !quizList) problems.push(`${id}: 새 퀴즈가 없어요`);
  line.stations.push(Object.assign({
    id, unit, unitTitle: m.unitTitle, readingTitle: m.readingTitle, subtitleKo: m.subtitleKo,
    coreGrammar: m.coreGrammar, pageRange: m.pageRange, vocabCount: vocab.length, quizCount: quiz.length,
    stats: { words: stats.words, titleWords: stats.titleWords, sentences: stats.sentences, msl: stats.msl, cefr: stats.cefr, cefrDist: stats.cefrDist, lexile: stats.lexile, lexileOfficial: null }
  }, extra || {}));
  const content = {
    id, grade: line.grade, unit, publisher: line.publisher, author: line.author, meta: m, chapters: data.chapters,
    sentences: data.sentences.map((s) => ({ id: s.id, chapter: s.chapter, page: s.page, tag: s.tag, en: s.en, chunk: s.chunk, ko: s.ko, vocab: s.vocab, grammar: s.grammar, meaning: s.meaning })),
    overview: data.overview, characters: data.characters, grammarCards: data.grammarCards,
    summaries: data.summaries, summaryWords: data.summaryWords, vocab
  };
  seed.push(`insert into public.tm_units (id, line_id, unit, title, content, published) values (${q(id)}, ${q(line.id)}, ${unit}, ${q(m.readingTitle)}, ${j(content)}, true)
  on conflict (id) do update set line_id = excluded.line_id, unit = excluded.unit, title = excluded.title, content = excluded.content;`);
  preview.units[id] = content;
  preview.quiz[id] = quiz;
  const qs = [`delete from public.tm_quiz where unit_id = ${q(id)};`];
  quiz.forEach((qq) => {
    qs.push(`insert into public.tm_quiz (unit_id, no, question, choices, answer, why, ids) values (${q(id)}, ${qq.no}, ${q(qq.question)}, ${j(qq.choices)}, ${qq.answer}, ${q(qq.why)}, ${j(qq.ids)});`);
  });
  seed.push(...qs);
  quizSql.push(...qs);
  console.log(id, m.readingTitle, "| 단어", stats.words, "(제목", stats.titleWords + ") | CEFR", stats.cefr, "| Lexile 추정", stats.lexile + "L | 단어장", vocab.length, "| 목록 외:", stats.offList.join(" "));
}

for (const f of files) {
  const { grade, unit, data } = loadLesson(path.join(SRC, f));
  const line = catalog.lines.find((l) => l.school === "중" && l.grade === grade);
  if (!line) continue;
  const id = line.id + "-" + String(unit).padStart(2, "0");
  emit(line, id, unit, data, QUIZ[id]);
}

/* ---------- 비공개 원본(새 교과서) ---------- */
// <id>.s.json: { line, unit, no?, lesson?, meta, overview, chapters: [[이름, 쪽]], s: [[장, 태그, "끊어 / 읽기", 해석, 어휘, 문법, 의미]] }
// <id>.q.json: { summaries, summaryWords, quiz: [{ q, o: [정답, 오답, 오답, 오답], why, ids }] }
if (SRC_DIR) {
  const ids = fs.readdirSync(SRC_DIR).filter((x) => x.endsWith(".s.json")).map((x) => x.slice(0, -7)).sort();
  for (const id of ids) {
    const S = JSON.parse(fs.readFileSync(path.join(SRC_DIR, id + ".s.json"), "utf8"));
    const qf = path.join(SRC_DIR, id + ".q.json");
    const Q = fs.existsSync(qf) ? JSON.parse(fs.readFileSync(qf, "utf8")) : {};
    const line = catalog.lines.find((l) => l.id === S.line);
    if (!line) { problems.push(`${id}: 노선 ${S.line}이 없어요`); continue; }
    const sentences = S.s.map((r, i) => {
      const [chapter, tag, chunk, ko, vocab, grammar, meaning] = r;
      if (r.length !== 7) problems.push(`${id} 문장 ${i + 1}: 칸이 ${r.length}개 (7개여야 해요)`);
      return { id: i + 1, chapter, page: (S.chapters[chapter - 1] || [])[1] || null, tag, en: chunk.replace(/\s*\/\s*/g, " ").trim(), chunk, ko, vocab, grammar, meaning };
    });
    (Q.quiz || []).concat((Q.summaries && Q.summaries.steps) || []).forEach((x) => (x.ids || []).forEach((n) => { if (!sentences[n - 1]) problems.push(`${id}: 없는 문장 번호 ${n}`); }));
    const data = { meta: S.meta, chapters: S.chapters.map((c) => c[0]), sentences, overview: S.overview, summaries: Q.summaries, summaryWords: Q.summaryWords };
    emit(line, id, S.unit, data, Q.quiz, S.no ? { no: S.no, lesson: S.lesson } : null);
  }
}
catalog.lines = catalog.lines.filter((l) => l.status !== "src" || l.stations.length).map((l) => (l.status === "src" ? Object.assign(l, { status: "open" }) : l));

if (problems.length) { console.error("퀴즈 검사에서 고칠 곳이 있어요:\n" + problems.join("\n")); process.exit(1); }
const pos = [0, 0, 0, 0];
Object.values(preview.quiz).forEach((l) => l.forEach((x) => { pos[x.answer - 1]++; }));
console.log("정답 위치 1·2·3·4:", pos.join(" · "));
fs.writeFileSync(path.join(ROOT, "metro", "catalog.js"),
  "// node metro/tools/build.mjs 로 만들어요. 본문은 없고 노선도·분석 수치만 있어요.\nwindow.METRO=" + JSON.stringify(catalog) + ";\n");
fs.writeFileSync(path.join(OUT, "metro_seed.sql"),
  "-- MY Reading Metro 본문·퀴즈 등록 (비공개 파일, 저장소에 올리지 않아요)\n-- metro/setup.sql 을 먼저 한 번 실행한 뒤, 이 파일을 Supabase SQL Editor에서 실행하세요. 여러 번 실행해도 괜찮아요.\nbegin;\n" + seed.join("\n") + "\ncommit;\n");
fs.writeFileSync(path.join(OUT, "metro_preview.js"), "window.METRO_PREVIEW=Object.assign(" + JSON.stringify(preview) + ", window.METRO_PREVIEW || {});\n");
fs.writeFileSync(path.join(OUT, "metro_quiz.sql"),
  "-- MY Reading Metro 퀴즈만 다시 등록 (비공개 파일). 본문(tm_units)이 들어간 뒤 실행하세요.\nbegin;\n" +
  fs.readFileSync(path.join(HERE, "..", "setup.sql"), "utf8").match(/create or replace function public\.tm_get_quiz[\s\S]*?\$\$;\n/)[0] +
  quizSql.join("\n") + "\ncommit;\n");
console.log("완료:", path.join(OUT, "metro_seed.sql"));
