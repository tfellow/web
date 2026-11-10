// MY Brain Up — 분야 목록 · 문제 파일 읽기 · 올리기 전 검사 · AI 프롬프트
// 화면(app.js)과 분리돼 있어서 node 에서도 시험해 볼 수 있어요.
(function (root) {
  "use strict";

  var CATS = [
    { id: "kor",  name: "국어·문학",   short: "국어",   icon: "📚", color: "#d9480f", badge: "Book Brain",    bicon: "📖" },
    { id: "eng",  name: "영어",        short: "영어",   icon: "🔤", color: "#2d5291", badge: "Word Brain",    bicon: "💬" },
    { id: "math", name: "수학",        short: "수학",   icon: "➗", color: "#7048e8", badge: "Number Brain",  bicon: "🔢" },
    { id: "soc",  name: "사회·역사",   short: "사회",   icon: "🏛️", color: "#9c5b2e", badge: "History Brain", bicon: "🗺️" },
    { id: "sci",  name: "과학",        short: "과학",   icon: "🔬", color: "#1f8a4c", badge: "Science Brain", bicon: "🧪" },
    { id: "art",  name: "예술·체육",   short: "예체능", icon: "🎨", color: "#d6336c", badge: "Art Brain",     bicon: "🎵" },
    { id: "eco",  name: "경제·시사",   short: "경제",   icon: "💰", color: "#b07d12", badge: "Money Brain",   bicon: "🪙" },
    { id: "it",   name: "IT·미래기술", short: "IT",     icon: "🤖", color: "#1098ad", badge: "Tech Brain",    bicon: "💡" }
  ];
  var CAT = {}; CATS.forEach(function (c) { CAT[c.id] = c; });
  var HEADERS = ["분야", "형식", "언어", "문제", "보기1", "보기2", "보기3", "보기4", "정답", "해설", "한국어 번역", "학년", "난이도"];

  function trim(s) { return String(s == null ? "" : s).replace(/ /g, " ").trim(); }
  function norm(s) { return trim(s).toLowerCase().replace(/[\s.,!?'"`·“”‘’…:;()\[\]{}\-_~/\\]/g, ""); }
  var HANGUL = /[ㄱ-ㆎ가-힣]/;

  // ---------- 칸 이름 알아보기 ----------
  function headerKey(h) {
    var s = norm(h);
    if (!s) return null;
    var m = s.match(/^(보기|선택지|option|choice|opt)([1-4])$/) || s.match(/^([①②③④])$/);
    if (m) return "o" + (m[2] || "①②③④".indexOf(m[1]) + 1);
    if (/정답|answer|^답$/.test(s)) return "ans";
    if (/해설|설명|explanation|explain/.test(s)) return "exp";
    if (/번역|한국어|korean|translation|한글/.test(s)) return "ko";
    if (/형식|유형|type|format/.test(s)) return "type";
    if (/언어|lang/.test(s)) return "lang";
    if (/분야|category|과목|영역|subject/.test(s)) return "cat";
    if (/학년|grade/.test(s)) return "grade";
    if (/난이도|level|difficulty/.test(s)) return "level";
    if (/문제|질문|question|문항/.test(s)) return "q";
    return null;
  }

  function catId(v) {
    var s = norm(v);
    if (!s) return null;
    if (CAT[s]) return s;
    var kw = [
      ["kor", ["국어", "문학", "korean", "literature"]],
      ["eng", ["영어", "english"]],
      ["math", ["수학", "math", "mathematics"]],
      ["soc", ["사회", "역사", "지리", "도덕", "history", "social", "society", "geography"]],
      ["sci", ["과학", "science"]],
      ["art", ["예술", "체육", "음악", "미술", "art", "arts", "music", "pe", "sports", "sport"]],
      ["eco", ["경제", "시사", "금융", "economy", "economics", "news"]],
      ["it", ["it", "정보", "기술", "코딩", "미래", "ai", "tech", "technology", "computer"]]
    ];
    for (var i = 0; i < kw.length; i++) {
      for (var j = 0; j < kw[i][1].length; j++) {
        var k = kw[i][1][j];
        if (HANGUL.test(k) ? s.indexOf(k) >= 0 : s === k) return kw[i][0];
      }
    }
    return null;
  }
  function typeId(v) {
    var s = norm(v);
    if (!s) return null;
    if (/객관|선다|선택|mc|multiple|choice|quiz/.test(s)) return "mc";
    if (/단답|주관|서술|sa|short|typeanswer|answer/.test(s)) return "sa";
    return null;
  }
  function langId(v) {
    var s = norm(v);
    if (!s) return null;
    if (/영어|english|^en$|^eng$/.test(s)) return "en";
    if (/한국어|국어|한글|korean|^ko$|^kr$/.test(s)) return "ko";
    return null;
  }

  // ---------- 표 읽기: 엑셀(2차원 배열) / 붙여넣기(탭·마크다운 표·CSV) ----------
  function splitCsvLine(line) {
    var out = [], cur = "", q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  }
  function textToAoa(text) {
    var lines = String(text || "").replace(/\r/g, "").split("\n").filter(function (l) { return trim(l); });
    if (!lines.length) return [];
    if (lines.some(function (l) { return l.indexOf("\t") >= 0; })) return lines.map(function (l) { return l.split("\t"); });
    if (lines.filter(function (l) { return /^\s*\|/.test(l); }).length >= 2) {
      return lines.filter(function (l) { return /^\s*\|/.test(l) && !/^[\s|:\-]+$/.test(l); })
        .map(function (l) {
          var s = l.trim().replace(/\\\|/g, "\u0001").replace(/^\|/, "").replace(/\|$/, "");
          return s.split("|").map(function (c) { return c.replace(/\u0001/g, ";").replace(/<br\s*\/?>/gi, " ").replace(/\*\*/g, ""); });
        });
    }
    return lines.map(splitCsvLine);
  }

  function aoaToRows(aoa) {
    aoa = (aoa || []).map(function (r) { return (r || []).map(trim); });
    var hi = -1, map = null;
    for (var i = 0; i < Math.min(aoa.length, 10); i++) {
      var m = {}, hits = 0;
      aoa[i].forEach(function (h, j) { var k = headerKey(h); if (k && m[k] == null) { m[k] = j; hits++; } });
      if (m.q != null && hits >= 3) { hi = i; map = m; break; }
    }
    if (hi < 0) {
      // 머리글이 없으면 템플릿 순서로 읽어요
      map = {}; ["cat", "type", "lang", "q", "o1", "o2", "o3", "o4", "ans", "exp", "ko", "grade", "level"].forEach(function (k, j) { map[k] = j; });
    }
    var rows = [];
    for (var r = hi + 1; r < aoa.length; r++) {
      var a = aoa[r];
      if (!a.some(function (c) { return c; })) continue;
      var g = function (k) { return map[k] == null ? "" : trim(a[map[k]]); };
      rows.push({
        line: r + 1, rawCat: g("cat"), rawType: g("type"), rawLang: g("lang"), question: g("q"),
        options: [g("o1"), g("o2"), g("o3"), g("o4")], rawAnswer: g("ans"), explain: g("exp"), ko: g("ko"),
        grade: g("grade"), level: g("level")
      });
    }
    return rows;
  }

  // ---------- 쉬운 영어 검사 ----------
  function englishCheck(text, maxPerSentence) {
    var warns = [], t = trim(text);
    if (!t) return warns;
    var sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    var words = t.match(/[A-Za-z][A-Za-z'-]*/g) || [];
    var longS = sentences.map(function (s) { return (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length; }).filter(function (n) { return n > (maxPerSentence || 15); });
    if (longS.length) warns.push("문장이 길어요 (" + longS.join(", ") + "단어, 15단어 이하 권장)");
    if (words.length > 35) warns.push("문제가 길어요 (" + words.length + "단어)");
    var hard = words.filter(function (w) { return w.replace(/[^A-Za-z]/g, "").length >= 12; });
    if (hard.length) warns.push("어려운 단어일 수 있어요: " + hard.slice(0, 4).join(", "));
    if (HANGUL.test(t)) warns.push("영어 문제에 한글이 있어요 (한국어 뜻은 '한국어 번역' 칸에)");
    return warns;
  }

  // ---------- 올리기 전 검사 ----------
  // existing: 이미 올린 문제의 norm(question) 집합 (Set 또는 객체)
  function validate(rows, existing) {
    var seen = {}, has = function (k) { return existing && (existing.has ? existing.has(k) : existing[k]); };
    return rows.map(function (r) {
      var e = [], w = [], out = { line: r.line };
      out.category = catId(r.rawCat);
      if (!out.category) e.push(r.rawCat ? "분야를 모르겠어요: " + r.rawCat : "분야가 비었어요");
      out.question = r.question;
      if (!out.question) e.push("문제가 비었어요");
      var opts = r.options.filter(function (o) { return o; });
      out.qtype = typeId(r.rawType) || (opts.length >= 2 ? "mc" : "sa");
      out.lang = langId(r.rawLang) || (HANGUL.test(r.question) ? "ko" : "en");
      out.explain = r.explain || null;
      out.ko = r.ko || null;
      out.grade = /^[1-3]$/.test(r.grade.replace(/학년/, "")) ? +r.grade.replace(/학년/, "") : null;
      out.level = /^[1-3]$/.test(r.level) ? +r.level : ({ "쉬움": 1, "보통": 2, "어려움": 3, "하": 1, "중": 2, "상": 3 })[r.level] || null;

      if (out.qtype === "mc") {
        out.choices = r.options.slice();
        if (r.options.some(function (o) { return !o; })) e.push("객관식은 보기 4개가 모두 있어야 해요");
        var nn = r.options.map(norm);
        if (nn.some(function (x, i) { return x && nn.indexOf(x) !== i; })) e.push("같은 보기가 두 번 있어요");
        var a = trim(r.rawAnswer).replace(/번$/, ""), idx = 0;
        if (/^[1-4]$/.test(a)) idx = +a;
        else if ("①②③④".indexOf(a) >= 0 && a) idx = "①②③④".indexOf(a) + 1;
        else if (/^[A-Da-d]$/.test(a)) idx = "abcd".indexOf(a.toLowerCase()) + 1;
        else if (a) { var k = nn.indexOf(norm(a)); if (k >= 0) idx = k + 1; }
        if (!idx) e.push(a ? "정답 번호를 모르겠어요: " + a : "정답이 비었어요");
        out.answer = idx ? String(idx) : "";
        if (idx && r.options.every(function (o) { return o; })) {
          var L = r.options.map(function (o) { return o.length; }), right = L[idx - 1];
          var others = L.filter(function (_, i) { return i !== idx - 1; }), mx = Math.max.apply(null, others);
          if (right > mx * 1.3 && right - mx >= 4) w.push("정답 보기만 길어요 (보기 길이를 비슷하게)");
        }
        if (out.lang === "en") r.options.forEach(function (o, i) { if ((o.match(/[A-Za-z]+/g) || []).length > 6) w.push("보기 " + (i + 1) + "이 길어요"); });
      } else {
        out.choices = null;
        var alts = trim(r.rawAnswer).split(/\s*[|;]\s*/).map(trim).filter(Boolean);
        if (!alts.length) e.push("단답형 정답이 비었어요");
        out.answer = alts.join("|");
        if (alts.some(function (x) { return x.length > 20; })) w.push("단답형 정답이 길어요 (1~3단어 권장)");
        if (opts.length) w.push("단답형인데 보기가 있어요 (보기는 무시해요)");
      }

      if (out.lang === "en") {
        englishCheck(out.question).forEach(function (x) { w.push(x); });
        if (!out.ko) w.push("한국어 번역이 없어요 (한국어 보기 버튼이 안 보여요)");
      }
      if (out.question && out.question.length > 160) w.push("문제가 길어요 (" + out.question.length + "자)");

      var key = norm(out.question);
      if (key) {
        if (seen[key]) e.push(seen[key] + "번째 줄과 같은 문제예요");
        else if (has(key)) e.push("이미 올린 문제예요");
        seen[key] = seen[key] || r.line;
      }
      out.errors = e; out.warns = w;
      return out;
    });
  }

  // ---------- 템플릿 예시 ----------
  var EXAMPLES = [
    ["과학", "객관식", "한국어", "물이 얼음으로 바뀌는 온도는 몇 ℃일까요?", "0℃", "10℃", "50℃", "100℃", "1", "물은 0℃에서 얼어요.", "", "1", "1"],
    ["사회·역사", "단답형", "한국어", "훈민정음을 만든 조선의 왕은 누구일까요?", "", "", "", "", "세종대왕; 세종", "세종대왕은 1443년에 훈민정음을 만들었어요.", "", "1", "1"],
    ["과학", "객관식", "영어", "Which planet is the biggest in our solar system?", "Mars", "Earth", "Jupiter", "Venus", "3", "Jupiter is the biggest planet.", "우리 태양계에서 가장 큰 행성은 무엇일까요?", "1", "1"],
    ["영어", "단답형", "영어", "What is the opposite of \"hot\"?", "", "", "", "", "cold", "Hot ↔ cold.", "\"hot(뜨거운)\"의 반대말은 무엇일까요?", "1", "1"]
  ];
  var GUIDE = [
    ["칸", "쓰는 법"],
    ["분야", CATS.map(function (c) { return c.name; }).join(", ") + " 중 하나"],
    ["형식", "객관식 또는 단답형"],
    ["언어", "한국어 또는 영어"],
    ["문제", "문제 글. 영어 문제는 아주 쉬운 영어(한 문장 15단어 이하)"],
    ["보기1~4", "객관식만. 4개 모두 채우기, 길이는 비슷하게. 단답형은 비워 두기"],
    ["정답", "객관식: 정답 보기 번호(1~4) / 단답형: 정답. 다른 표기도 맞게 하려면 세미콜론(;)으로 (예: 세종대왕; 세종)"],
    ["해설", "선택. 한 줄. 답을 낸 뒤에 보여요"],
    ["한국어 번역", "선택. 영어 문제만. '한국어 보기' 힌트로 쓰여요 (쓰면 영어 보너스 +1이 없어져요)"],
    ["학년", "선택. 1~3"],
    ["난이도", "선택. 1(쉬움)~3(어려움)"],
    ["", ""],
    ["점수", "객관식 1점, 단답형 2점, 영어 문제 +1점, 오늘의 10문제 완주 +3점"]
  ];

  // ---------- 제미나이·챗지피티용 프롬프트 ----------
  function buildPrompt(o) {
    o = o || {};
    var n = +o.count || 20, en = Math.round(n * (o.enRatio == null ? 0.3 : o.enRatio)), sa = Math.round(n * (o.saRatio == null ? 0.3 : o.saRatio));
    var cat = o.cat && CAT[o.cat] ? CAT[o.cat].name : "8개 분야에 골고루";
    return [
      "당신은 중학생용 상식 퀴즈 출제자예요. 아래 조건으로 'MY Brain Up' 퀴즈 문제를 만들어 주세요.",
      "",
      "[만들 문제]",
      "- 분야: " + cat,
      "- 개수: " + n + "문제 (객관식 " + (n - sa) + "개, 단답형 " + sa + "개)",
      "- 언어: 한국어 문제 " + (n - en) + "개, 영어 문제 " + en + "개",
      "- 대상: 중학교 " + (o.grade ? o.grade + "학년" : "1~3학년") + " (교과서에서 배우는 내용 + 교과서 밖의 재미있는 상식)",
      o.topic ? "- 주제/단원: " + o.topic : "",
      "",
      "[출력 형식] 아래 13칸 표(머리글 포함)로만 답해 주세요. 표 앞뒤에 다른 말은 쓰지 마세요.",
      "| " + HEADERS.join(" | ") + " |",
      "- 분야: " + CATS.map(function (c) { return c.name; }).join(", ") + " 중 하나",
      "- 형식: 객관식 또는 단답형 / 언어: 한국어 또는 영어",
      "- 객관식: 보기 4개를 쓰고, 정답 칸에는 정답 보기 번호(1~4)만 써요. 정답 번호가 1~4에 고르게 섞이게 해요.",
      "- 단답형: 보기 칸은 비우고, 정답 칸에 1~3단어(또는 숫자)로 써요. 맞다고 인정할 다른 표기는 세미콜론(;)으로 이어 써요. 예) 세종대왕; 세종 / 7; 일곱; seven",
      "- 단답형 문제는 답이 하나로만 나오게 묻고, 숫자 답이면 단위를 문제에 밝혀요. 예) 몇 개일까요? (숫자만)",
      "- 해설: 한 문장(40자 안팎). / 한국어 번역: 영어 문제만, 문제를 한국어로 옮겨 써요. 한국어 문제는 비워요.",
      "- 학년: 1~3 / 난이도: 1(쉬움)~3(어려움)",
      "- 표 안에서는 세로 막대(|)를 쓰지 마세요.",
      "",
      "[문제 품질 규칙]",
      "1. 정답이 딱 하나만 맞아야 해요. 오답 보기도 하나씩 다시 확인해서 '이것도 맞는데?'가 없게 해요.",
      "2. 오답 보기는 그럴듯하게 만들고, 정답 보기만 길거나 자세하지 않게 네 보기의 길이를 비슷하게 맞춰요.",
      "3. '옳지 않은 것은?' 같은 부정 질문, '모두 정답'·'정답 없음' 보기는 쓰지 않아요.",
      "4. 사실을 꼭 확인해요. 해마다 바뀌는 내용(최신 기록, 현직 인물, 가격)은 피하거나 '2025년 기준'처럼 밝혀요.",
      "5. 특정 학교에 관한 문제는 내지 않아요.",
      "6. 중학생에게 알맞은 내용으로 써요. 폭력적·선정적·차별적인 내용은 넣지 않아요.",
      "",
      "[영어 문제 규칙: 아주 쉬운 영어]",
      "1. CEFR A1~A2 수준, 중학교 1~2학년 교과서에 나오는 쉬운 단어만 써요.",
      "2. 한 문장은 15단어 이하, 문제 전체는 2문장 이하로 써요.",
      "3. 관용구, 어려운 전문 용어, 긴 단어는 피해요. 꼭 필요한 용어는 아주 잘 알려진 것만 써요. (예: planet, ocean, music)",
      "4. 보기도 짧게(1~4단어) 써요.",
      "5. 영어 문제 칸에는 한글을 쓰지 않아요. 한국어 뜻은 '한국어 번역' 칸에 써요.",
      "6. 해설은 쉬운 영어 한 문장이나 한국어 한 문장으로 써요."
    ].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n");
  }

  var API = { CATS: CATS, CAT: CAT, HEADERS: HEADERS, EXAMPLES: EXAMPLES, GUIDE: GUIDE, norm: norm, catId: catId, typeId: typeId, langId: langId,
    textToAoa: textToAoa, aoaToRows: aoaToRows, validate: validate, englishCheck: englishCheck, buildPrompt: buildPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.BU = API;
})(this);
