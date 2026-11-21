// Vocabulary Data Loader, Filtering & NLP Utilities for MY Word Rush
(function (global) {
  let baseItems = [];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeAnswer(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[.,!?;:"()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function init() {
    if (global.MY_VOCAB_DATA && Array.isArray(global.MY_VOCAB_DATA.items)) {
      baseItems = global.MY_VOCAB_DATA.items;
      return getAllItems();
    }
    try {
      const res = await fetch("data/vocab.json");
      const json = await res.json();
      baseItems = json.items || [];
    } catch (e) {
      console.error("Failed to load vocab.json:", e);
      baseItems = [];
    }
    return getAllItems();
  }

  function getAllItems() {
    const custom = global.MY_STORAGE ? global.MY_STORAGE.getCustomVocab() : [];
    return [...baseItems, ...custom];
  }

  function getGrades() {
    const set = new Set(getAllItems().map((it) => it.grade));
    return Array.from(set).sort((a, b) => a - b);
  }

  function getLessonsForGrade(grade) {
    const items = grade === "all" ? getAllItems() : getAllItems().filter((it) => String(it.grade) === String(grade));
    const set = new Set(items.map((it) => it.lesson));
    return Array.from(set).sort((a, b) => a - b);
  }

  function filterItems({ grade = "1", lessons = [], weakOnly = false } = {}) {
    let items = getAllItems();
    if (weakOnly && global.MY_STORAGE) {
      const weakIds = new Set(
        Object.values(global.MY_STORAGE.getWordStats())
          .filter((s) => s.wrong > 0)
          .map((s) => s.id)
      );
      items = items.filter((it) => weakIds.has(it.id));
    }
    if (grade !== "all") {
      items = items.filter((it) => String(it.grade) === String(grade));
    }
    if (lessons && lessons.length > 0) {
      const lset = new Set(lessons.map(String));
      items = items.filter((it) => lset.has(String(it.lesson)));
    }
    return items;
  }

  function getDistractors(target, pool, count = 3) {
    const all = getAllItems();
    const candidates = (pool.length >= count + 1 ? pool : all).filter(
      (it) => it.id !== target.id && it.word.toLowerCase() !== target.word.toLowerCase()
    );
    // Prefer same part of speech for higher educational quality
    const samePos = shuffle(candidates.filter((it) => it.pos === target.pos));
    const diffPos = shuffle(candidates.filter((it) => it.pos !== target.pos));
    const picked = [];
    const seen = new Set([target.word.toLowerCase()]);
    for (const item of [...samePos, ...diffPos]) {
      if (picked.length >= count) break;
      const key = item.word.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        picked.push(item);
      }
    }
    return picked;
  }

  function buildClozeParts(item) {
    const sentence = item.example || "";
    const target = item.clozeTarget || item.word.split(/[,/]/)[0].trim();
    const rx = new RegExp(`(${escapeRegex(target)})`, "i");
    const m = sentence.match(rx);
    if (!m) {
      return { before: sentence + " ", blank: target, after: "" };
    }
    const idx = m.index;
    return {
      before: sentence.slice(0, idx),
      blank: m[0],
      after: sentence.slice(idx + m[0].length),
    };
  }

  function isClozeAnswerCorrect(userInput, item, blankText) {
    const norm = normalizeAnswer(userInput);
    if (!norm) return false;
    const validSet = new Set();
    validSet.add(normalizeAnswer(blankText));
    validSet.add(normalizeAnswer(item.clozeTarget));
    item.word.split(/[,/]/).forEach((w) => validSet.add(normalizeAnswer(w)));
    return validSet.has(norm);
  }

  function tokenizeSentence(sentence) {
    // Split by spaces while keeping contractions together (e.g. "I'm", "don't")
    return String(sentence || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function parseCSV(text) {
    // Simple RFC4180-compatible CSV parser
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if (inQuotes) {
        if (ch === '"' && clean[i + 1] === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(field.trim());
          field = "";
        } else if (ch === "\n") {
          row.push(field.trim());
          if (row.some((c) => c !== "")) rows.push(row);
          row = [];
          field = "";
        } else {
          field += ch;
        }
      }
    }
    row.push(field.trim());
    if (row.some((c) => c !== "")) rows.push(row);

    if (rows.length < 2) return [];
    const items = [];
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols[3]) continue;
      const grade = Number(cols[0]) || 3;
      const lesson = Number(cols[1]) || 1;
      const no = Number(cols[2]) || r;
      const word = cols[3];
      const koRaw = cols[4] || "";
      const engRaw = cols[5] || "";
      const example = cols[6] || `I learned the word ${word} today.`;
      const exampleKo = cols[7] || koRaw;
      const m = koRaw.match(/^([a-zA-Z]+\.)\s*(.*)$/);
      const pos = m ? m[1] : (word.includes(" ") ? "phr." : "etc.");
      const ko = m ? m[2] : koRaw;
      const engDef = engRaw.replace(/^[a-zA-Z]+\.\s*/, "");
      items.push({
        id: `C-G${grade}-L${lesson}-${no}-${Date.now().toString(36).slice(-3)}`,
        grade,
        lesson,
        no,
        word,
        pos,
        ko,
        engDef,
        example,
        exampleKo,
        clozeTarget: word.split(/[,/]/)[0].trim(),
        isPhrase: word.includes(" "),
        isCustom: true,
      });
    }
    return items;
  }

  function downloadSampleCSV() {
    const sample = [
      ["grade", "lesson", "no.", "words", "한글 뜻", "영영풀이", "예문", "예문 해석"],
      [3, 1, 1, "challenge", "n. 도전", "n. a difficult task that tests someone's ability", "Learning a new language is a fun challenge.", "새로운 언어를 배우는 것은 즐거운 도전이다."],
      [3, 1, 2, "discover", "v. 발견하다", "v. to find something for the first time", "Scientists discover new species every year.", "과학자들은 매년 새로운 종을 발견한다."],
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MY_Word_Rush_샘플단어장.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  global.MY_DATA = {
    init,
    getAllItems,
    getGrades,
    getLessonsForGrade,
    filterItems,
    getDistractors,
    buildClozeParts,
    isClozeAnswerCorrect,
    tokenizeSentence,
    normalizeAnswer,
    shuffle,
    escapeHtml,
    parseCSV,
    downloadSampleCSV,
  };
})(window);
