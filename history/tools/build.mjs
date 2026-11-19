// MY History Museum · 데이터 빌드
// 사용법: node history/tools/build.mjs <비공개 원본 폴더> <비공개 출력 폴더>
//   원본 폴더(비공개, 저장소 밖): 전시실마다 두 파일
//     <전시실 id>.json   해설 문단·용어·사료·카드·연표·인과·나란히 짝·필기 노트
//     <전시실 id>.q.json 퀴즈 10문항 [{ q, o: [정답, 오답, 오답, 오답], why, pid }] — 정답을 맨 앞에 써요.
//   출력 폴더에만 쓰는 것(비공개):
//     history_seed.sql     Supabase SQL Editor 에서 실행 (본문·퀴즈 등록, 여러 번 실행해도 괜찮아요)
//     history_preview.js   화면 미리보기용 (로그인 없이 내 컴퓨터에서만 확인)
//   검사: 문항 수, 선택지 4개, 정답이 가장 길지 않은지, 근거 문단(pid)이 있는지, 카드 이름이 겹치지 않는지
//   정답 위치는 1·2·3·4가 고르게 섞여요.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = process.argv[2], OUT = process.argv[3];
if (!SRC || !OUT) { console.error("사용법: node history/tools/build.mjs <원본 폴더> <출력 폴더>"); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "catalog.js"), "utf8"), ctx);
const M = ctx.window.MUSEUM;

const problems = [];
const warn = (id, m) => problems.push(id + ": " + m);
const len = (s) => [...String(s)].length;
const sq = (s) => "'" + String(s).replace(/'/g, "''") + "'";

let seed = "-- MY History Museum 본문·퀴즈 등록 (비공개 파일, 저장소에 올리지 마세요)\n-- Supabase SQL Editor 에서 setup.sql 다음에 실행하세요. 여러 번 실행해도 괜찮아요.\nbegin;\n";
const preview = { units: {}, quiz: {} };
let count = 0;

for (const h of M.halls) for (const r of h.rooms) {
  if (!r.open) continue;
  const f = path.join(SRC, r.id + ".json"), fq = path.join(SRC, r.id + ".q.json");
  if (!fs.existsSync(f) || !fs.existsSync(fq)) { warn(r.id, "열린 전시실인데 원본 파일이 없어요"); continue; }
  const c = JSON.parse(fs.readFileSync(f, "utf8"));
  const qs = JSON.parse(fs.readFileSync(fq, "utf8"));

  // ---- 내용 검사 ----
  const pids = new Set();
  (c.sections || []).forEach((s, i) => {
    if (s.title !== r.cases[i]) warn(r.id, `진열장 ${i + 1} 제목이 안내도와 달라요: ${s.title}`);
    (s.paras || []).forEach((p) => { if (pids.has(p.id)) warn(r.id, "문단 id 중복 " + p.id); pids.add(p.id); });
    (s.asks || []).forEach((a) => { if (!pids.has(a.pid)) warn(r.id, "생각 질문의 근거 문단이 없어요 " + a.pid); });
  });
  if ((c.sections || []).length !== r.cases.length) warn(r.id, `진열장 수가 안내도(${r.cases.length})와 달라요`);
  (c.sources || []).forEach((s) => { if (!pids.has(s.pid)) warn(r.id, "사료 근거 문단이 없어요 " + s.id); if (!(s.qs || []).length) warn(r.id, "사료 질문이 없어요 " + s.id); });
  const names = new Set();
  (c.cards || []).forEach((k) => { if (names.has(k.n)) warn(r.id, "카드 이름 중복 " + k.n); names.add(k.n); if (len(k.n) > 80) warn(r.id, "카드 이름이 너무 길어요 " + k.n); });
  if ((c.order || []).length < 4) warn(r.id, "연표 순서 문제는 4개 이상이어야 해요");
  const ys = (c.order || []).map((o) => o.y); if (ys.some((y, i) => i && y < ys[i - 1])) warn(r.id, "연표(order)는 오래된 순서로 써 주세요");
  if ((c.chain || []).length < 2) warn(r.id, "인과 잇기는 2개 이상이어야 해요");
  if ((c.pairs || []).length < 3) warn(r.id, "나란히 짝은 3개 이상이어야 해요");
  if (r.parallel && !M.halls.some((x) => x.rooms.some((y) => y.id === r.parallel))) warn(r.id, "나란히 보기 전시실이 없어요 " + r.parallel);

  // ---- 퀴즈 검사·섞기 ----
  if (qs.length !== 10) warn(r.id, `퀴즈가 ${qs.length}문항이에요 (10문항)`);
  // 정답 위치: 1·2·3·4를 고르게 담아 전시실 id로 정해진 순서로 섞어요 (빌드할 때마다 같은 결과)
  let seedN = [...r.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seedN = (seedN * 1103515245 + 12345) >>> 0) / 4294967296);
  const slots = qs.map((_, i) => i % 4);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const quiz = qs.map((q, i) => {
    if (!q.o || q.o.length !== 4) warn(r.id, `퀴즈 ${i + 1}: 선택지는 4개`);
    if (new Set(q.o).size !== q.o.length) warn(r.id, `퀴즈 ${i + 1}: 선택지가 겹쳐요`);
    const right = q.o[0], longest = Math.max(...q.o.slice(1).map(len));
    if (len(right) > longest) warn(r.id, `퀴즈 ${i + 1}: 정답(${len(right)}자)이 가장 길어요 (오답 최대 ${longest}자)`);
    if (!pids.has(q.pid)) warn(r.id, `퀴즈 ${i + 1}: 근거 문단 ${q.pid} 이 없어요`);
    const pos = slots[i];
    const wrong = q.o.slice(1);
    const choices = wrong.slice(0, pos).concat([right], wrong.slice(pos));
    return { no: i + 1, question: q.q, choices, answer: pos + 1, why: q.why, pid: q.pid };
  });

  seed += `insert into public.hm_rooms (id, hall_id, title, content, published) values (${sq(r.id)}, ${sq(h.id)}, ${sq(r.title)}, ${sq(JSON.stringify(c))}::jsonb, true)\n  on conflict (id) do update set hall_id = excluded.hall_id, title = excluded.title, content = excluded.content, published = excluded.published;\n`;
  seed += `delete from public.hm_quiz where room_id = ${sq(r.id)};\n`;
  quiz.forEach((q) => {
    seed += `insert into public.hm_quiz (room_id, no, question, choices, answer, why, pid) values (${sq(r.id)}, ${q.no}, ${sq(q.question)}, ${sq(JSON.stringify(q.choices))}::jsonb, ${q.answer}, ${sq(q.why)}, ${sq(q.pid)});\n`;
  });
  preview.units[r.id] = c; preview.quiz[r.id] = quiz; count++;
}
seed += "commit;\n";

fs.writeFileSync(path.join(OUT, "history_seed.sql"), seed);
fs.writeFileSync(path.join(OUT, "history_preview.js"), "// 화면 미리보기용 (비공개)\nwindow.MUSEUM_PREVIEW = " + JSON.stringify(preview) + ";\n");
console.log(`전시실 ${count}곳 → ${path.join(OUT, "history_seed.sql")}`);
if (problems.length) { console.log("\n검사에서 고칠 곳 " + problems.length + "개:\n- " + problems.join("\n- ")); process.exitCode = 1; }
else console.log("검사 통과");
