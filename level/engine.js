// MY Level Test — 평가 알고리즘 (화면과 분리된 순수 계산 모듈)
//
//  1) 어휘 크기: 예/아니오 체크(Meara X-Lex 방식) + 가짜 단어로 '아는 척' 보정 + 뜻 확인 문항
//       구간별 보정 정답률 h' = (h − f) / (1 − f)   (h = 진짜 단어 체크율, f = 가짜 단어 체크율)
//       어휘 크기 = Σ h'(구간) × 구간 단어 수
//  2) 문법·어휘, 읽기: 3모수 문항반응이론(3PL IRT) 컴퓨터 적응형 검사(CAT)
//       P(정답 | θ) = c + (1 − c) / (1 + e^(−a(θ − b)))      a = 1.2, c = 0.2 (4지선다 찍기 확률)
//       능력 추정 = EAP(사후 기대값), 문항 선택 = 현재 θ 에서 정보량 최대 (상위 3개 중 무작위)
//       너무 빨리 고른 답(찍기 의심)은 추정에서 빼요 (effort-moderated scoring)
//  3) 환산: θ → CEFR(+하/중/상), Lexile, AR(ATOS), ZPD
(function (root) {
  "use strict";
  var A = 1.2, C = 0.2;
  var GRID = []; for (var g = -4.5; g <= 4.5001; g += 0.05) GRID.push(Math.round(g * 100) / 100);

  function P(theta, b, a, c) { a = a == null ? A : a; c = c == null ? C : c; return c + (1 - c) / (1 + Math.exp(-a * (theta - b))); }
  function info(theta, b, a, c) {
    a = a == null ? A : a; c = c == null ? C : c;
    var p = P(theta, b, a, c);
    return a * a * Math.pow((p - c) / (1 - c), 2) * ((1 - p) / p);
  }
  // resp: [{b, u}] (u = 1 정답, 0 오답) → {theta, se}
  function eap(resp, prior) {
    prior = prior || { m: -0.5, s: 1.5 };
    var lw = GRID.map(function (t) { var z = (t - prior.m) / prior.s; return -0.5 * z * z; });
    resp.forEach(function (r) {
      for (var i = 0; i < GRID.length; i++) { var p = P(GRID[i], r.b, r.a, r.c); lw[i] += r.u ? Math.log(p) : Math.log(1 - p); }
    });
    var mx = Math.max.apply(null, lw), sw = 0, s1 = 0, s2 = 0;
    for (var i = 0; i < GRID.length; i++) { var w = Math.exp(lw[i] - mx); sw += w; s1 += w * GRID[i]; s2 += w * GRID[i] * GRID[i]; }
    var m = s1 / sw; return { theta: m, se: Math.sqrt(Math.max(0, s2 / sw - m * m)) };
  }

  // 간단한 시드 난수 (같은 시험지는 새로고침해도 같은 순서)
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 1e9) / 1e9; }; }
  function shuffle(arr, rnd) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------------- 단계 1: 어휘 크기 ----------------
  var PER_BAND = 5, N_PSEUDO = 10, N_CHECK = 4;
  function buildVocab(bank, rnd) {
    var items = [];
    for (var band = 1; band <= 7; band++) {
      shuffle(bank.vocab.filter(function (v) { return v.band === band; }), rnd).slice(0, PER_BAND)
        .forEach(function (v) { items.push({ w: v.w, band: band }); });
    }
    shuffle(bank.pseudo, rnd).slice(0, N_PSEUDO).forEach(function (w) { items.push({ w: w, band: 0 }); });
    return shuffle(items, rnd);
  }
  // 뜻 확인: '안다'고 한 진짜 단어 중 높은 구간부터 4개
  function buildChecks(bank, items, marks, rnd) {
    var known = items.filter(function (it) { return it.band > 0 && marks[it.w]; });
    known = shuffle(known, rnd).sort(function (x, y) { return y.band - x.band; }).slice(0, N_CHECK);
    var byW = {}; bank.vocab.forEach(function (v) { byW[v.w] = v; });
    return known.map(function (it) {
      var right = byW[it.w].ko;
      var others = shuffle(bank.vocab.filter(function (v) { return v.w !== it.w && v.ko !== right; }), rnd).slice(0, 3).map(function (v) { return v.ko; });
      return { w: it.w, band: it.band, o: shuffle([right].concat(others), rnd), right: right };
    });
  }
  function scoreVocab(bank, items, marks, checks, checkAns) {
    var pseudo = items.filter(function (it) { return it.band === 0; });
    var fa = pseudo.filter(function (it) { return marks[it.w]; }).length;
    var f = pseudo.length ? fa / pseudo.length : 0;
    var size = 0, bands = {};
    for (var band = 1; band <= 7; band++) {
      var arr = items.filter(function (it) { return it.band === band; });
      if (!arr.length) continue;
      var h = arr.filter(function (it) { return marks[it.w]; }).length / arr.length;
      var adj = f >= 1 ? 0 : Math.max(0, (h - f) / (1 - f));
      bands[band] = { h: h, adj: adj };
      size += adj * bank.bandWeight[band];
    }
    var nChk = (checks || []).length, ok = 0;
    (checks || []).forEach(function (c, i) { if (checkAns && checkAns[i] === c.right) ok++; });
    var chk = nChk ? ok / nChk : 1;
    // 뜻 확인에서 틀린 만큼 높은 구간의 '안다'를 깎아요 (확인한 단어는 대부분 높은 구간)
    var factor = nChk ? 0.55 + 0.45 * chk : 1;
    var hiPart = 0; for (var b2 = 4; b2 <= 7; b2++) if (bands[b2]) hiPart += bands[b2].adj * bank.bandWeight[b2];
    size = size - hiPart * (1 - factor);
    size = Math.max(0, Math.round(size / 50) * 50);
    return { size: size, falseAlarm: f, check: chk, checkN: nChk, bands: bands, reliable: f < 0.4 };
  }
  // 어휘 크기 → θ (Milton 2010 의 CEFR별 어휘 크기에 맞춘 구간 선형 변환)
  var VOC_PTS = [[0, -3.5], [750, -2], [1500, -1], [2500, 0], [3250, 1], [3750, 2], [4500, 3], [9000, 4.5]];
  function interp(pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) { var p = pts[i - 1], q = pts[i]; return p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0]); }
    var a = pts[pts.length - 2], b = pts[pts.length - 1]; return b[1] + (b[1] - a[1]) * (x - b[0]) / (b[0] - a[0]);
  }
  function vocabTheta(size) { return interp(VOC_PTS, size); }

  // ---------------- 적응형 문항 선택 ----------------
  function itemB(it, override) { return override && override[it.id] != null ? override[it.id] : it.b; }
  function pickLang(bank, used, theta, lastTags, rnd, override) {
    var cand = bank.lang.filter(function (it) { return used.indexOf(it.id) < 0; });
    var fresh = cand.filter(function (it) { return lastTags.indexOf(it.tag) < 0; });
    if (fresh.length >= 3) cand = fresh;
    cand = cand.map(function (it) { return { it: it, i: info(theta, itemB(it, override)) }; }).sort(function (x, y) { return y.i - x.i; });
    var top = cand.slice(0, 3);
    return top.length ? top[Math.floor(rnd() * top.length)].it : null;
  }
  function pickPassage(bank, used, theta, rnd, override) {
    var cand = bank.read.filter(function (p) { return used.indexOf(p.id) < 0; })
      .map(function (p) { var s = 0; p.qs.forEach(function (q) { s += info(theta, itemB(q, override)); }); return { p: p, i: s }; })
      .sort(function (x, y) { return y.i - x.i; });
    var top = cand.slice(0, 2);
    return top.length ? top[Math.floor(rnd() * top.length)].p : null;
  }
  var RULES = {
    lang: { min: 12, max: 12, se: 0.42 },
    read: { min: 5, max: 5, se: 0.45 } // 지문 개수
  };
  // 찍기 의심: 문법은 1.2초 미만, 읽기는 지문 첫 문항이 (단어 수 × 0.06초, 최소 3초) 미만, 둘째 문항은 1.5초 미만
  function isRapid(r) {
    if (r.dk) return false;
    if (r.sec === "lang") return r.ms < 1200;
    if (r.first) return r.ms < Math.max(3000, (r.words || 0) * 60);
    return r.ms < 1500;
  }
  function estimate(resp, prior, override) {
    return eap(resp.filter(function (r) { return !isRapid(r); }).map(function (r) {
      return { b: override && override[r.id] != null ? override[r.id] : r.b, u: r.ok ? 1 : 0 };
    }), prior);
  }
  // 진행 중 문항 선택에 쓰는 현재 능력값: 어휘 크기를 사전 정보로, 지금까지의 모든 응답으로 추정
  function liveTheta(S, bank, override) {
    var v = scoreVocab(bank, S.vocab.items, S.vocab.marks, S.vcheck.items, S.vcheck.ans);
    var prior = v.reliable ? { m: vocabTheta(v.size), s: 1.2 } : { m: -0.5, s: 1.5 };
    return estimate(S.lang.resp.concat(S.read.resp), prior, override);
  }
  // 다음 문법 문항 (null = 이 단계 끝)
  function nextLang(S, bank, rnd, override) {
    var n = S.lang.resp.length, R = RULES.lang;
    if (n >= R.max) return null;
    var est = liveTheta(S, bank, override);
    if (n >= R.min && est.se < R.se) return null;
    var used = S.lang.resp.map(function (r) { return r.id; });
    var lastTags = S.lang.resp.slice(-2).map(function (r) { return r.tag; });
    return pickLang(bank, used, est.theta, lastTags, rnd, override);
  }
  // 다음 읽기 지문 (null = 끝)
  function nextPassage(S, bank, rnd, override) {
    var n = S.read.done.length, R = RULES.read;
    if (n >= R.max) return null;
    if (n >= R.min) {
      var eR = estimate(S.read.resp, liveTheta(S, bank, override).theta != null ? { m: liveTheta(S, bank, override).theta, s: 1.0 } : null, override);
      if (eR.se < R.se) return null;
    }
    return pickPassage(bank, S.read.done, liveTheta(S, bank, override).theta, rnd, override);
  }

  // ---------------- 환산 ----------------
  var LV = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
  var CUTS = [-2, -1, 0, 1, 2, 3]; // A0|A1|A2|B1|B2|C1|C2
  function lvName(l) { return l === "A0" ? "Pre-A1" : l; }
  function cefrOf(theta) {
    var k = 0; while (k < CUTS.length && theta >= CUTS[k]) k++;
    var code = LV[k];
    if (code === "C2") return { code: "C1", sub: "상+", label: "C1 이상", idx: 5, pos: 1 };
    var lo = k === 0 ? -3 : CUTS[k - 1], pos = Math.max(0, Math.min(0.999, theta - lo));
    var sub = pos < 1 / 3 ? "하" : pos < 2 / 3 ? "중" : "상";
    return { code: code, sub: sub, label: lvName(code) + " " + sub, idx: k, pos: pos };
  }
  // Lexile: CEFR 경계와 맞춰 둔 구간 선형 변환 (Pre-A1|A1 200L, A1|A2 450L, A2|B1 700L, B1|B2 950L, B2|C1 1150L, C1|C2 1350L)
  var LEX_PTS = [[-4.5, -300], [-2, 200], [-1, 450], [0, 700], [1, 950], [2, 1150], [3, 1350], [4.5, 1600]];
  function lexileOf(theta) { return Math.round(interp(LEX_PTS, theta) / 10) * 10; }
  function lexLabel(l) { return l < 0 ? "BR" + Math.abs(l) + "L" : l + "L"; }
  // Lexile → AR(ATOS 책 레벨 = 미국 학년) 대략 환산표
  var AR_PTS = [[-300, 0.1], [0, 0.6], [100, 1.1], [200, 1.4], [300, 1.9], [400, 2.4], [500, 3.0], [600, 3.6], [700, 4.3], [800, 5.0], [900, 5.9], [1000, 6.9], [1100, 8.0], [1200, 9.4], [1300, 10.8], [1400, 12.0], [1600, 13.0]];
  function arOf(lex) { return Math.max(0.1, Math.round(interp(AR_PTS, lex) * 10) / 10); }
  function zpdOf(ar) { return [Math.max(0.3, Math.round((ar - 0.7) * 10) / 10), Math.round((ar + 1.0) * 10) / 10]; }

  // ---------------- 진단 (영역별 강점·보완점) ----------------
  var TAGS = {
    be: "be동사", present: "현재시제", past: "과거시제", progressive: "진행형", perfect: "완료시제", article: "관사", question: "의문사",
    word: "어휘·연어", modal: "조동사", preposition: "전치사", comparison: "비교", quantifier: "수량 표현", conditional: "조건문·가정법",
    relative: "관계사", gerund: "동명사·to부정사", "so-such": "so/such 구문", passive: "수동태", reported: "간접화법", causative: "사역동사",
    conjunction: "접속사·연결어", subjunctive: "가정법·당위", inversion: "도치",
    detail: "세부 정보 찾기", main: "주제·요지 파악", inference: "추론", vocab: "문맥 속 어휘", purpose: "글의 목적", reference: "지칭 파악"
  };
  // 기대 정답률 대비 실제 정답률로 강점/약점을 정해요 (잔차 = 실제 − 기대)
  function diagnose(resp, theta) {
    var by = {};
    resp.forEach(function (r) {
      if (isRapid(r)) return;
      var t = by[r.tag] || (by[r.tag] = { tag: r.tag, n: 0, ok: 0, exp: 0 });
      t.n++; t.ok += r.ok ? 1 : 0; t.exp += P(theta, r.b);
    });
    var list = Object.keys(by).map(function (k) { var t = by[k]; t.name = TAGS[k] || k; t.res = (t.ok - t.exp) / t.n; return t; }).filter(function (t) { return t.n >= 2; });
    list.sort(function (x, y) { return y.res - x.res; });
    return {
      strong: list.filter(function (t) { return t.res > 0.12 && t.ok / t.n >= 0.6; }).slice(0, 3),
      weak: list.filter(function (t) { return t.res < -0.12; }).reverse().slice(0, 3),
      all: list
    };
  }

  // ---------------- 최종 결과 ----------------
  function finalize(S, bank, override) {
    var v = scoreVocab(bank, S.vocab.items, S.vocab.marks, S.vcheck.items, S.vcheck.ans);
    var thV = vocabTheta(v.size);
    var lang = S.lang.resp, read = S.read.resp, all = lang.concat(read);
    var base = { m: -0.5, s: 1.5 };
    // 영역별 점수: 다른 영역 결과를 약한 사전 정보로 써서(부수 정보 활용) 문항 수가 적어도 흔들림을 줄여요
    var vPrior = v.reliable ? { m: thV, s: 1.3 } : base;
    var eL = estimate(lang, { m: estimate(read, vPrior, override).theta, s: 1.0 }, override);
    var eR = estimate(read, { m: estimate(lang, vPrior, override).theta, s: 1.0 }, override);
    // 종합: 문법·읽기 응답 전체를 함께 추정하고, 어휘 크기를 사전 정보로 써요 (어휘 체크가 믿을 만할 때만)
    var eAll = estimate(all, v.reliable ? { m: thV, s: 1.1 } : base, override);
    var rapid = all.filter(isRapid).length, dk = all.filter(function (r) { return r.dk; }).length;
    var lex = lexileOf(eR.theta * 0.85 + eL.theta * 0.15);
    var lexLo = lexileOf(eR.theta - eR.se), lexHi = lexileOf(eR.theta + eR.se);
    var ar = arOf(lex);
    var flags = [];
    if (!v.reliable) flags.push("vocab_overclaim");
    if (rapid >= Math.max(3, all.length * 0.2)) flags.push("rapid");
    if (v.checkN && v.check < 0.5) flags.push("vocab_check_low");
    var ok = all.filter(function (r) { return r.ok; }).length;
    var o = cefrOf(eAll.theta);
    return {
      v: 1,
      overall: { theta: r2(eAll.theta), se: r2(eAll.se), cefr: o.code, sub: o.sub, label: o.label, lo: cefrOf(eAll.theta - eAll.se).code, hi: cefrOf(eAll.theta + eAll.se).code },
      vocab: { size: v.size, theta: r2(thV), cefr: cefrOf(thV).code, label: cefrOf(thV).label, falseAlarm: r2(v.falseAlarm), check: r2(v.check), checkN: v.checkN, reliable: v.reliable },
      lang: { theta: r2(eL.theta), se: r2(eL.se), cefr: cefrOf(eL.theta).code, label: cefrOf(eL.theta).label, n: lang.length, ok: lang.filter(function (r) { return r.ok; }).length },
      read: { theta: r2(eR.theta), se: r2(eR.se), cefr: cefrOf(eR.theta).code, label: cefrOf(eR.theta).label, n: read.length, ok: read.filter(function (r) { return r.ok; }).length, wpm: wpm(read) },
      lexile: lex, lexileRange: [lexLo, lexHi], ar: ar, zpd: zpdOf(ar),
      diag: diagnose(all, eAll.theta),
      items: all.length, correct: ok, rapid: rapid, dontKnow: dk, flags: flags
    };
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  // 읽기 속도(참고): 지문 첫 문항을 고를 때까지 걸린 시간으로 계산, 찍기 의심 제외
  function wpm(read) {
    var w = 0, ms = 0;
    read.forEach(function (r) { if (r.first && !isRapid(r) && r.words) { w += r.words; ms += r.ms; } });
    return ms ? Math.round(w / (ms / 60000)) : 0;
  }

  // ---------------- 문항 보정 (교사 화면) ----------------
  // 응답이 쌓이면 학생들의 종합 θ 를 고정하고 문항별 b 를 최대우도로 다시 추정해요
  function calibrate(records, bank) {
    var byItem = {};
    records.forEach(function (rec) {
      var th = rec.theta; if (th == null) return;
      (rec.resp || []).forEach(function (r) {
        if (isRapid(r)) return;
        (byItem[r.id] || (byItem[r.id] = [])).push({ th: th, u: r.ok ? 1 : 0, ms: r.ms });
      });
    });
    var base = {}; bank.lang.forEach(function (it) { base[it.id] = it; }); bank.read.forEach(function (p) { p.qs.forEach(function (q) { base[q.id] = q; }); });
    return Object.keys(base).map(function (id) {
      var d = byItem[id] || [], n = d.length, it = base[id];
      var p = n ? d.filter(function (x) { return x.u; }).length / n : null;
      var best = null;
      if (n >= 5) {
        var bestLL = -Infinity;
        for (var b = -4; b <= 4.001; b += 0.05) {
          var ll = -0.5 * Math.pow((b - it.b) / 1.0, 2); // 원래 값 쪽으로 약하게 당겨요 (표본이 적을 때 안정)
          d.forEach(function (x) { var pp = P(x.th, b); ll += x.u ? Math.log(pp) : Math.log(1 - pp); });
          if (ll > bestLL) { bestLL = ll; best = Math.round(b * 100) / 100; }
        }
      }
      var avgMs = n ? Math.round(d.reduce(function (s, x) { return s + (x.ms || 0); }, 0) / n) : null;
      var expP = n ? d.reduce(function (s, x) { return s + P(x.th, it.b); }, 0) / n : null;
      return { id: id, b: it.b, n: n, p: p, expP: expP, bNew: best, avgMs: avgMs, q: it.q, tag: it.tag };
    });
  }

  root.LT = {
    P: P, info: info, eap: eap, rng: rng, shuffle: shuffle, interp: interp,
    buildVocab: buildVocab, buildChecks: buildChecks, scoreVocab: scoreVocab, vocabTheta: vocabTheta,
    pickLang: pickLang, pickPassage: pickPassage, liveTheta: liveTheta, nextLang: nextLang, nextPassage: nextPassage, RULES: RULES, isRapid: isRapid, estimate: estimate, itemB: itemB,
    cefrOf: cefrOf, lvName: lvName, lexileOf: lexileOf, lexLabel: lexLabel, arOf: arOf, zpdOf: zpdOf,
    diagnose: diagnose, finalize: finalize, calibrate: calibrate, TAGS: TAGS, LV: LV, CUTS: CUTS
  };
})(typeof window !== "undefined" ? window : globalThis);
