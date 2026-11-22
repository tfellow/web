// MY Word Arcade — 게임 7개
// 모든 게임은 ctx.pool(고른 단원의 단어)을 받아서 놀고, 끝나면 ctx.done({score, ms, words:[{w, ok}], ...}) 을 불러요.
(function () {
  "use strict";
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc;
  function reg(id, g) { g.id = id; WA.games[id] = g; WA.order.push(id); }
  function now() { return Date.now(); }
  function pick(ctx, n) { return WA.shuffle(ctx.pool).slice(0, Math.min(n || ctx.count, ctx.pool.length)); }
  function progress(i, n) { return '<div class="prog"><i style="width:' + Math.round(100 * i / n) + '%"></i></div>'; }
  function distract(ctx, it, n, key) {   // 같은 단어장에서 보기를 골라요 (같은 품사 먼저)
    var pos = WA.pos(it), seen = {}; seen[key(it)] = 1;
    var all = WA.shuffle(ctx.all.filter(function (x) { return x.w !== it.w; }));
    var same = all.filter(function (x) { return WA.pos(x) === pos; }), rest = all.filter(function (x) { return WA.pos(x) !== pos; });
    var out = [];
    same.concat(rest).forEach(function (x) { var k = key(x); if (out.length < n && k && !seen[k]) { seen[k] = 1; out.push(x); } });
    return out;
  }
  function single(it) { var l = WA.letters(it); return !WA.isPhrase(it) && l.length >= 3 && l.length <= 10 && /^[a-z]+$/.test(WA.main(it).toLowerCase()); }

  // ======================================================================
  // 1) 🃏 짝짓기 타임어택
  // ======================================================================
  reg("match", {
    icon: "🃏", name: "짝짓기 타임어택", desc: "단어와 뜻 카드를 빨리 짝지어요", min: 4,
    how: "왼쪽 단어를 누르고 오른쪽에서 짝을 눌러요. 틀리게 누르면 점수가 깎여요.",
    modes: [["ko", "단어 ↔ 한국어 뜻"], ["def", "단어 ↔ 영영풀이"], ["phrase", "숙어 앞 ↔ 뒤"]],
    start: function (ctx) {
      var g = this, words;
      if (ctx.mode === "phrase") {
        var ph = ctx.pool.filter(WA.isPhrase);
        if (ph.length < 4) { ph = ctx.all.filter(WA.isPhrase); WA.toast("고른 단원에 숙어가 적어서 단어장 전체 숙어로 해요."); }
        words = WA.shuffle(ph).slice(0, ctx.count);
      } else words = pick(ctx);
      var per = 6, rounds = [], t0 = now(), wrongClicks = 0, score = 0, res = {}, ri = 0;
      for (var i = 0; i < words.length; i += per) rounds.push(words.slice(i, i + per));
      if (rounds.length > 1 && rounds[rounds.length - 1].length < 3) { var last = rounds.pop(); rounds[rounds.length - 1] = rounds[rounds.length - 1].concat(last); }
      words.forEach(function (w) { res[w.w] = true; });
      var timer = setInterval(function () { var el = $("#mt"); if (el) el.textContent = "⏱ " + Math.floor((now() - t0) / 1000) + "초"; }, 500);
      WA.onLeave(function () { clearInterval(timer); });
      function left(w) { if (ctx.mode !== "phrase") return WA.main(w); var p = WA.main(w).split(" "); return p.slice(0, -1).join(" "); }
      function right(w) { if (ctx.mode === "ko") return WA.ko(w); if (ctx.mode === "def") return WA.def(w); return WA.main(w).split(" ").slice(-1)[0]; }
      function round() {
        var R = rounds[ri], L = WA.shuffle(R), Rr = WA.shuffle(R), sel = null, left_n = R.length, rt = now();
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s" id="mt">⏱ 0초</span><span class="s">⭐ <b id="ms">' + score + "</b></span>") + progress(ri, rounds.length) +
          '<div class="stage"><p class="center small muted" style="padding:0 0 10px">' + (ri + 1) + " / " + rounds.length + ' 판 · 틀린 클릭 <b id="mw">' + wrongClicks + "</b></p>" +
          '<div class="mgrid"><div class="mcol">' + L.map(function (w) { return '<button class="mcard w" data-k="' + esc(w.w) + '">' + esc(left(w)) + "</button>"; }).join("") + "</div>" +
          '<div class="mcol">' + Rr.map(function (w) { return '<button class="mcard' + (ctx.mode === "def" ? " def" : "") + '" data-v="' + esc(w.w) + '">' + esc(right(w)) + "</button>"; }).join("") + "</div></div></div>";
        WA.bindQuit(ctx, end);
        $$(".mcard.w").forEach(function (el) { el.onclick = function () { $$(".mcard.w").forEach(function (x) { x.classList.remove("sel"); }); el.classList.add("sel"); sel = el; WA.say(left(byK(el.dataset.k))); }; });
        $$(".mcard[data-v]").forEach(function (el) { el.onclick = function () {
          if (!sel) { el.classList.add("shake"); setTimeout(function () { el.classList.remove("shake"); }, 400); return WA.toast("왼쪽 단어를 먼저 눌러요"); }
          var k = sel.dataset.k, v = el.dataset.v;
          var ok = k === v || right(byK(k)) === right(byK(v));
          if (ok) {
            sel.classList.add("done"); sel.classList.remove("sel"); el.classList.add("done"); sel = null; score += 10; left_n--;
            $("#ms").textContent = score;
            if (!left_n) {
              var sec = (now() - rt) / 1000; score += Math.max(0, Math.round(R.length * 4 - sec)); ri++;
              setTimeout(ri < rounds.length ? round : end, 350);
            }
          } else {
            wrongClicks++; res[k] = false; score = Math.max(0, score - 3);
            el.classList.add("no", "shake"); sel.classList.add("shake");
            var s = sel; setTimeout(function () { el.classList.remove("no", "shake"); s.classList.remove("shake"); }, 450);
            $("#mw").textContent = wrongClicks; $("#ms").textContent = score;
          }
        }; });
      }
      function byK(k) { return words.filter(function (w) { return w.w === k; })[0]; }
      function end() {
        clearInterval(timer);
        var done = rounds.slice(0, ri).reduce(function (a, r) { return a.concat(r); }, []);
        ctx.done({ score: score, ms: now() - t0, words: done.map(function (w) { return { w: w.w, ok: res[w.w] }; }), extra: { wrongClicks: wrongClicks }, kpis: [["틀린 클릭", wrongClicks + "번"]] });
      }
      round();
    }
  });

  // ======================================================================
  // 2) ✍️ 빈칸 스펠링 (틀린 단어는 뒤에서 다시)
  // ======================================================================
  reg("spell", {
    icon: "✍️", name: "빈칸 스펠링", desc: "예문 빈칸에 알맞은 단어를 써요", min: 3,
    filter: function (it) { return !!WA.cloze(it); },
    start: function (ctx) {
      var g = this, list = pick(ctx), queue = list.map(function (w) { return { it: w, c: WA.cloze(w), tries: 0 }; });
      var total = queue.length, first = {}, score = 0, hints = 0, t0 = now(), solved = 0, combo = 0;
      function show() {
        if (!queue.length) return end();
        var q = queue[0], ans = q.c.ans, hint = ans[0] + ans.slice(1).replace(/[A-Za-z]/g, "_");
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">⭐ <b>' + score + "</b></span>" + (combo >= 2 ? '<span class="s">🔥 ' + combo + "</span>" : "")) + progress(solved, total) +
          '<div class="stage"><div class="prompt"><div class="ko">' + esc(WA.ko(q.it)) + '</div><div class="sub">' + esc(WA.posKo(q.it)) + (q.tries ? ' · <span class="pill bad">다시 나온 단어</span>' : "") + "</div></div>" +
          '<div class="sent">' + esc(q.c.pre) + '<span class="blank" id="bl">' + esc(hint) + "</span>" + esc(q.c.post) + "</div>" +
          '<p class="center small muted" id="exko" style="visibility:hidden">' + esc(q.it.exKo) + "</p>" +
          '<form class="ans" id="f" autocomplete="off"><input id="in" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="' + ans.length + '글자" maxlength="' + (ans.length + 6) + '"><button class="btn big navy">확인</button></form>' +
          '<div class="row-btns c"><button class="btn sm" id="h1">💬 해석 보기</button><button class="btn sm" id="h2">🔊 듣기 (힌트)</button><button class="btn sm" id="skip">🤔 모르겠어요</button></div>' +
          '<div class="fb" id="fb"></div></div>';
        WA.bindQuit(ctx, end);
        var inp = $("#in"); inp.focus();
        $("#h1").onclick = function () { $("#exko").style.visibility = "visible"; };
        $("#h2").onclick = function () { hints++; q.heard = true; WA.say(ans); };
        $("#skip").onclick = function () { wrong(true); };
        $("#f").onsubmit = function (e) {
          e.preventDefault();
          var v = WA.norm(inp.value); if (!v) return;
          var okList = [WA.norm(ans)].concat(q.tries ? WA.answers(q.it).map(WA.norm) : []);
          if (okList.indexOf(v) >= 0) right(); else wrong(false);
        };
        function right() {
          if (!(q.it.w in first)) first[q.it.w] = true;
          combo++; var pts = q.tries ? 5 : (q.heard ? 7 : 10) + Math.min(combo, 5);
          score += pts; solved++;
          $("#bl").textContent = ans; $("#bl").classList.add("pop"); $("#fb").className = "fb ok"; $("#fb").textContent = "정답! +" + pts;
          WA.say(q.it.ex); queue.shift(); lock(); setTimeout(show, 1100);
        }
        function wrong(skip) {
          first[q.it.w] = false; combo = 0; q.tries++;
          $("#f").classList.add("shake");
          $("#bl").textContent = ans; $("#fb").className = "fb bad";
          $("#fb").innerHTML = (skip ? "" : "아쉬워요! ") + "정답은 <b>" + esc(ans) + "</b> · 조금 뒤에 다시 나와요";
          queue.shift();
          if (q.tries < 3) queue.splice(Math.min(3, queue.length), 0, q); else solved++;
          lock(); setTimeout(show, 2200);
        }
        function lock() { $$("#f input, #f button, .row-btns button").forEach(function (b) { b.disabled = true; }); }
      }
      function end() {
        var ws = list.filter(function (w) { return w.w in first; }).map(function (w) { return { w: w.w, ok: first[w.w] }; });
        ctx.done({ score: score, ms: now() - t0, hints: hints, words: ws });
      }
      show();
    }
  });

  // ======================================================================
  // 3) 🧱 문장 어순 조립
  // ======================================================================
  reg("order", {
    icon: "🧱", name: "문장 어순 조립", desc: "흩어진 단어 칩으로 예문을 완성해요", min: 3,
    filter: function (it) { var n = WA.tokens(it.ex).length; return n >= 3 && n <= 14; },
    start: function (ctx) {
      var g = this, list = pick(ctx), i = 0, score = 0, t0 = now(), res = [];
      function show() {
        if (i >= list.length) return end();
        var it = list[i], toks = WA.tokens(it.ex), tries = 0;
        var chips = toks.map(function (t, k) { return { t: t, k: k }; }), mix;
        do { mix = WA.shuffle(chips); } while (toks.length > 2 && mix.map(function (c) { return c.t; }).join(" ") === it.ex);
        var placed = [];
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">⭐ <b>' + score + "</b></span>") + progress(i, list.length) +
          '<div class="stage"><div class="prompt"><div class="ko" style="font-size:19px">' + esc(it.exKo) + '</div><div class="sub">핵심 단어: <b>' + esc(it.w) + "</b> (" + esc(WA.ko(it)) + ")</div></div>" +
          '<div class="line" id="line"></div><div class="pool" id="pool"></div>' +
          '<div class="row-btns c"><button class="btn" id="reset">↺ 처음부터</button><button class="btn big navy" id="chk" disabled>확인</button></div><div class="fb" id="fb"></div></div>';
        WA.bindQuit(ctx, end);
        function draw() {
          $("#line").innerHTML = placed.map(function (c, j) { return '<button class="tok" data-j="' + j + '">' + esc(c.t) + "</button>"; }).join("") || '<span class="muted small" style="padding:10px">아래 단어를 순서대로 눌러요</span>';
          $("#pool").innerHTML = mix.filter(function (c) { return placed.indexOf(c) < 0; }).map(function (c) { return '<button class="tok" data-k="' + c.k + '">' + esc(c.t) + "</button>"; }).join("");
          $$("#line .tok").forEach(function (b) { b.onclick = function () { placed.splice(+b.dataset.j, 1); draw(); }; });
          $$("#pool .tok").forEach(function (b) { b.onclick = function () { placed.push(chips[+b.dataset.k]); draw(); }; });
          $("#chk").disabled = placed.length !== toks.length;
        }
        draw();
        $("#reset").onclick = function () { placed = []; draw(); };
        $("#chk").onclick = function () {
          var got = placed.map(function (c) { return c.t; });
          if (WA.norm(got.join(" ")) === WA.norm(it.ex)) {
            var pts = tries ? 5 : 10; score += pts; res.push({ w: it.w, ok: !tries });
            $$("#line .tok").forEach(function (b) { b.classList.add("good"); });
            $("#fb").className = "fb ok"; $("#fb").textContent = "정답! +" + pts; WA.say(it.ex);
            $("#chk").disabled = true; i++; setTimeout(show, 1400);
          } else {
            tries++;
            $$("#line .tok").forEach(function (b, j) { if (WA.norm(got[j]) !== WA.norm(toks[j])) b.classList.add("bad"); });
            if (tries >= 2) {
              res.push({ w: it.w, ok: false });
              $("#fb").className = "fb bad"; $("#fb").innerHTML = "정답: <b>" + esc(it.ex) + "</b>"; WA.say(it.ex);
              $("#chk").disabled = true; $("#reset").disabled = true; i++; setTimeout(show, 3000);
            } else { $("#fb").className = "fb bad"; $("#fb").textContent = "빨간 칩의 자리가 틀렸어요. 한 번 더!"; }
          }
        };
      }
      function end() { ctx.done({ score: score, ms: now() - t0, words: res }); }
      show();
    }
  });

  // ======================================================================
  // 4) 🎧 듣고 고르기 · 받아쓰기
  // ======================================================================
  reg("listen", {
    icon: "🎧", name: "듣고 맞히기", desc: "소리를 듣고 뜻을 고르거나 받아써요", min: 4,
    how: "🔊 버튼을 누르면 단어를 읽어 줘요. 🐢 는 천천히 읽어요.",
    modes: [["choice", "듣고 뜻 고르기"], ["type", "듣고 받아쓰기"], ["sent", "문장 듣고 빈칸 쓰기"]],
    start: function (ctx) {
      var g = this, pool = ctx.mode === "sent" ? ctx.pool.filter(function (w) { return !!WA.cloze(w); }) : ctx.pool;
      var list = WA.shuffle(pool).slice(0, ctx.count), i = 0, score = 0, t0 = now(), res = [], replays = 0;
      if (!WA.canSpeak()) WA.toast("이 기기는 소리 읽기를 지원하지 않아요.");
      function show() {
        if (i >= list.length) return end();
        var it = list[i], c = WA.cloze(it), text = ctx.mode === "sent" ? it.ex : WA.main(it), body;
        if (ctx.mode === "choice") {
          var opts = WA.shuffle([it].concat(distract(ctx, it, 3, WA.ko)));
          body = '<div class="choices">' + opts.map(function (o) { return '<button class="choice" data-w="' + esc(o.w) + '">' + esc(WA.ko(o)) + "</button>"; }).join("") + "</div>";
        } else {
          var ans = ctx.mode === "sent" ? c.ans : WA.main(it);
          body = (ctx.mode === "sent" ? '<div class="sent">' + esc(c.pre) + '<span class="blank" id="bl">' + "_".repeat(Math.min(ans.length, 12)) + "</span>" + esc(c.post) + "</div>" : '<p class="center muted">' + esc(WA.ko(it)) + "</p>") +
            '<form class="ans" id="f" autocomplete="off"><input id="in" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="들은 단어를 써요"><button class="btn big navy">확인</button></form>';
        }
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">⭐ <b>' + score + "</b></span>") + progress(i, list.length) +
          '<div class="stage"><div class="center" style="padding:6px"><button class="speak" id="sp">🔊</button><div class="row-btns c"><button class="btn sm" id="slow">🐢 천천히</button></div></div>' + body + '<div class="fb" id="fb"></div></div>';
        WA.bindQuit(ctx, end);
        setTimeout(function () { WA.say(text); }, 300);
        $("#sp").onclick = function () { replays++; WA.say(text); };
        $("#slow").onclick = function () { replays++; WA.say(text, true); };
        function after(ok, html) {
          res.push({ w: it.w, ok: ok }); if (ok) score += 10;
          $("#fb").className = "fb " + (ok ? "ok" : "bad"); $("#fb").innerHTML = html;
          $$(".stage button, .stage input").forEach(function (b) { if (b.id !== "sp" && b.id !== "slow") b.disabled = true; });
          i++; setTimeout(show, ok ? 1100 : 2400);
        }
        if (ctx.mode === "choice") $$(".choice").forEach(function (b) { b.onclick = function () {
          var ok = b.dataset.w === it.w;
          b.classList.add(ok ? "ok" : "bad");
          $$(".choice").forEach(function (x) { if (x.dataset.w === it.w) x.classList.add("ok"); });
          after(ok, (ok ? "정답! " : "") + "<b>" + esc(it.w) + "</b> = " + esc(WA.ko(it)));
        }; });
        else {
          $("#in").focus();
          $("#f").onsubmit = function (e) {
            e.preventDefault(); var v = WA.norm($("#in").value); if (!v) return;
            var okA = ctx.mode === "sent" ? [WA.norm(c.ans)] : WA.answers(it).map(WA.norm);
            var ok = okA.indexOf(v) >= 0;
            if ($("#bl")) $("#bl").textContent = ctx.mode === "sent" ? c.ans : "";
            after(ok, (ok ? "정답! " : "정답은 ") + "<b>" + esc(ctx.mode === "sent" ? c.ans : it.w) + "</b> · " + esc(WA.ko(it)));
          };
        }
      }
      function end() { ctx.done({ score: score, ms: now() - t0, words: res, extra: { replays: replays }, kpis: [["다시 듣기", replays + "번"]] }); }
      show();
    }
  });

  // ======================================================================
  // 5) 🧩 크로스워드 (영영풀이가 힌트)
  // ======================================================================
  function buildCross(words, want, maxSize) {
    var best = null;
    for (var attempt = 0; attempt < 30; attempt++) {
      var cand = WA.shuffle(words).slice(0, want * 3).sort(function (a, b) { return WA.letters(b).length - WA.letters(a).length + (Math.random() - .5) * 3; });
      var grid = {}, placed = [];
      var put = function (it, r, c, d) { var s = WA.letters(it); for (var k = 0; k < s.length; k++) grid[(r + (d ? k : 0)) + "," + (c + (d ? 0 : k))] = s[k]; placed.push({ it: it, s: s, r: r, c: c, d: d }); };
      var at = function (r, c) { return grid[r + "," + c]; };
      var bounds = function (extra) {
        var r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9;
        placed.concat(extra ? [extra] : []).forEach(function (p) { r0 = Math.min(r0, p.r); c0 = Math.min(c0, p.c); r1 = Math.max(r1, p.r + (p.d ? p.s.length - 1 : 0)); c1 = Math.max(c1, p.c + (p.d ? 0 : p.s.length - 1)); });
        return { r0: r0, r1: r1, c0: c0, c1: c1 };
      };
      var fits = function (s, r, c, d) {
        var cross = 0;
        if (at(r - (d ? 1 : 0), c - (d ? 0 : 1)) || at(r + (d ? s.length : 0), c + (d ? 0 : s.length))) return -1;
        for (var k = 0; k < s.length; k++) {
          var rr = r + (d ? k : 0), cc = c + (d ? 0 : k), v = at(rr, cc);
          if (v) { if (v !== s[k]) return -1; cross++; }
          else if (d ? (at(rr, cc - 1) || at(rr, cc + 1)) : (at(rr - 1, cc) || at(rr + 1, cc))) return -1;
        }
        return cross;
      };
      put(cand[0], 0, 0, 0);
      for (var x = 1; x < cand.length && placed.length < want; x++) {
        var s = WA.letters(cand[x]), opts = [];
        if (placed.some(function (p) { return p.s === s; })) continue;
        placed.forEach(function (p) {
          for (var a = 0; a < p.s.length; a++) for (var b = 0; b < s.length; b++) {
            if (p.s[a] !== s[b]) continue;
            var d = p.d ? 0 : 1, r = p.r + (p.d ? a : 0) - (d ? b : 0), c = p.c + (p.d ? 0 : a) - (d ? 0 : b);
            var f = fits(s, r, c, d); if (f < 1) continue;
            var bb = bounds({ s: s, r: r, c: c, d: d });
            if (bb.r1 - bb.r0 + 1 > maxSize || bb.c1 - bb.c0 + 1 > maxSize) continue;
            opts.push({ r: r, c: c, d: d, score: f * 10 - (bb.r1 - bb.r0 + bb.c1 - bb.c0) + Math.random() });
          }
        });
        if (opts.length) { opts.sort(function (u, v) { return v.score - u.score; }); put(cand[x], opts[0].r, opts[0].c, opts[0].d); }
      }
      if (!best || placed.length > best.placed.length) best = { placed: placed, b: bounds() };
      if (placed.length >= want) break;
    }
    var B = best.b; best.placed.forEach(function (p) { p.r -= B.r0; p.c -= B.c0; });
    best.rows = B.r1 - B.r0 + 1; best.cols = B.c1 - B.c0 + 1;
    // 번호 붙이기
    var starts = {}; best.placed.forEach(function (p) { starts[p.r + "," + p.c] = 1; });
    var keys = Object.keys(starts).sort(function (a, b) { var A = a.split(",").map(Number), C = b.split(",").map(Number); return A[0] - C[0] || A[1] - C[1]; });
    best.placed.forEach(function (p) { p.no = keys.indexOf(p.r + "," + p.c) + 1; });
    return best;
  }
  reg("cross", {
    icon: "🧩", name: "크로스워드", desc: "영영풀이를 보고 십자말풀이를 채워요", min: 5,
    filter: single,
    start: function (ctx) {
      var g = this, want = ctx.count >= 20 ? 10 : 8;
      var X = buildCross(ctx.pool, want, ctx.el.clientWidth < 520 ? 11 : 13), P = X.placed;
      var cells = {}, t0 = now(), hints = 0, cur = null, score = 0;
      P.forEach(function (p, i) { p.i = i; p.got = false; p.wrong = 0; p.rev = 0; p.show = {}; for (var k = 0; k < p.s.length; k++) { var key = (p.r + (p.d ? k : 0)) + "," + (p.c + (p.d ? 0 : k)); (cells[key] = cells[key] || { ch: p.s[k], w: [] }).w.push(i); } });
      var cs = Math.max(24, Math.min(40, Math.floor((Math.min(ctx.el.clientWidth, 560) - 20) / X.cols) - 2));
      function render() {
        var html = "";
        for (var r = 0; r < X.rows; r++) for (var c = 0; c < X.cols; c++) {
          var k = r + "," + c, cell = cells[k];
          if (!cell) { html += '<div class="xc x"></div>'; continue; }
          var no = P.filter(function (p) { return p.r === r && p.c === c; })[0];
          var shown = cell.w.some(function (i) { return P[i].got; }) || cell.w.some(function (i) { return P[i].show[k]; });
          var isRev = cell.w.every(function (i) { return !P[i].got; }) && cell.w.some(function (i) { return P[i].show[k]; });
          var on = cur != null && cell.w.indexOf(cur) >= 0;
          html += '<div class="xc' + (on ? " on" : "") + (shown ? (isRev ? " rev" : " okc") : "") + '" data-k="' + k + '" style="width:' + cs + "px;height:" + cs + "px;font-size:" + Math.round(cs * .55) + 'px">' + (no ? "<sup>" + no.no + "</sup>" : "") + (shown ? cell.ch : "") + "</div>";
        }
        var clue = function (d) { return P.filter(function (p) { return p.d === d; }).sort(function (a, b) { return a.no - b.no; }).map(function (p) {
          return '<div class="clue' + (p.i === cur ? " on" : "") + (p.got ? " done" : "") + '" data-i="' + p.i + '"><b>' + p.no + ".</b> " + esc(WA.def(p.it)) + ' <span class="muted">(' + p.s.length + ")</span></div>"; }).join(""); };
        var solved = P.filter(function (p) { return p.got; }).length;
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">✅ ' + solved + " / " + P.length + '</span><span class="s">💡 ' + hints + "</span>") +
          '<div class="stage"><div class="xw"><div class="xgrid" style="grid-template-columns:repeat(' + X.cols + "," + cs + 'px)">' + html + '</div><div class="clues"><h3>→ 가로</h3>' + clue(0) + "<h3>↓ 세로</h3>" + clue(1) + "</div></div>" +
          (cur != null ? xbar(P[cur]) : '<p class="center muted small">칸이나 힌트를 누르면 답을 쓸 수 있어요.</p>') +
          '<div class="row-btns c"><button class="btn" id="give">🏳️ 정답 보고 끝내기</button></div></div>';
        WA.bindQuit(ctx, end);
        $$(".xc[data-k]").forEach(function (el) { el.onclick = function () {
          var w = cells[el.dataset.k].w; cur = w.length > 1 && w[0] === cur ? w[1] : (w.filter(function (i) { return !P[i].got; })[0] != null ? w.filter(function (i) { return !P[i].got; })[0] : w[0]); render();
        }; });
        $$(".clue").forEach(function (el) { el.onclick = function () { cur = +el.dataset.i; render(); }; });
        $("#give").onclick = function () { if (confirm("남은 답을 모두 보여 주고 끝낼까요?")) end(true); };
        if (cur != null) bindBar(P[cur]);
      }
      function xbar(p) {
        return '<div class="xbar"><div class="q"><b>' + p.no + (p.d ? " ↓ " : " → ") + "</b>" + esc(WA.def(p.it)) + (p.koShown ? ' <span style="color:var(--gold-2)">· ' + esc(WA.ko(p.it)) + "</span>" : "") + "</div>" +
          (p.got ? '<div class="q" style="font-size:18px">✅ <b>' + esc(p.s) + "</b></div>" :
          '<form id="xf" style="display:flex;gap:8px;flex:1;flex-wrap:wrap" autocomplete="off"><input id="xi" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="' + p.s.length + '" placeholder="' + p.s.length + '글자"><button class="btn gold">확인</button></form>' +
          '<button class="btn sm" id="hk">🇰🇷 뜻</button><button class="btn sm" id="hl">💡 한 글자</button>') + "</div>";
      }
      function bindBar(p) {
        if (p.got) return;
        var inp = $("#xi"); inp.focus();
        // 쓰는 글자를 칸에도 바로 보여 줘요 (이미 채워진 글자는 그대로)
        inp.oninput = function () {
          var v = inp.value.toLowerCase().replace(/[^a-z]/g, "");
          for (var k = 0; k < p.s.length; k++) {
            var key = (p.r + (p.d ? k : 0)) + "," + (p.c + (p.d ? 0 : k)), el = $('.xc[data-k="' + key + '"]');
            if (!el || el.classList.contains("okc") || el.classList.contains("rev")) continue;
            var sup = el.querySelector("sup");
            el.textContent = v[k] || ""; if (sup) el.insertBefore(sup, el.firstChild);
            el.classList.toggle("typ", !!v[k]);
          }
        };
        $("#hk").onclick = function () { if (!p.koShown) { p.koShown = true; hints++; } render(); };
        $("#hl").onclick = function () {
          for (var k = 0; k < p.s.length; k++) { var key = (p.r + (p.d ? k : 0)) + "," + (p.c + (p.d ? 0 : k)); if (!p.show[key] && !cells[key].w.some(function (i) { return P[i].got; })) { p.show[key] = 1; p.rev++; hints++; break; } }
          render();
        };
        $("#xf").onsubmit = function (e) {
          e.preventDefault(); var v = WA.norm(inp.value).replace(/[^a-z]/g, ""); if (!v) return;
          if (v === p.s) {
            p.got = true; score += Math.max(3, 10 + p.s.length - p.rev * 3 - p.wrong * 2 - (p.koShown ? 2 : 0)); WA.say(p.s);
            var next = P.filter(function (q) { return !q.got; })[0];
            cur = next ? next.i : null; render();
            if (!next) setTimeout(function () { end(false); }, 700);
          } else { p.wrong++; $("#xf").classList.add("shake"); inp.select(); setTimeout(function () { var f = $("#xf"); if (f) f.classList.remove("shake"); }, 400); }
        };
      }
      function end(gave) {
        var words = P.map(function (p) { return { w: p.it.w, ok: p.got && !p.wrong && !p.rev }; });
        ctx.done({ score: score + (gave ? 0 : 20), ms: now() - t0, hints: hints, n: P.length, words: words, extra: { solved: P.filter(function (p) { return p.got; }).length, gave: !!gave },
          kpis: [["힌트", hints + "번"], ["채운 단어", P.filter(function (p) { return p.got; }).length + " / " + P.length]] });
      }
      cur = 0; render();
    }
  });

  // ======================================================================
  // 6) ⚔️ 스펠 배틀 (글자 타일로 단어를 만들어 몬스터 공격)
  // ======================================================================
  var MONS = ["👾", "🐙", "🦖", "👻", "🐉", "🦂", "🧟", "🐲", "🤖", "🦇"];
  reg("battle", {
    icon: "⚔️", name: "스펠 배틀", desc: "뜻을 보고 글자 타일을 누르거나 타이핑해 몬스터를 물리쳐요", min: 4,
    filter: single,
    start: function (ctx) {
      var g = this, list = pick(ctx), i = 0, hearts = 3, stage = 1, hp, maxHp, dmgTotal = 0, kills = 0, t0 = now(), res = [], lenSum = 0, timer = null, combo = 0;
      var LIMIT = 25000;
      function newMon() { maxHp = hp = 60 + stage * 30; }
      newMon();
      WA.onLeave(function () { clearInterval(timer); });
      function show() {
        clearInterval(timer);
        if (i >= list.length || hearts <= 0) return end();
        var it = list[i], s = WA.letters(it), extra = Math.max(8, Math.min(12, s.length + 4)) - s.length;
        var abc = "aeioulnrstdmcphbgkwyf";
        var tiles = s.split(""); for (var e = 0; e < extra; e++) tiles.push(abc[Math.floor(Math.random() * abc.length)]);
        tiles = WA.shuffle(tiles).map(function (ch, k) { return { ch: ch, k: k }; });
        var built = [], t1 = now(), defShown = false;
        ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">🗡️ ' + dmgTotal + '</span><span class="s">💀 ' + kills + "</span>") + progress(i, list.length) +
          '<div class="stage"><div class="arena"><div class="fighter"><div class="av">🧙‍♀️</div><div class="hearts">' + "❤️".repeat(hearts) + "🖤".repeat(3 - hearts) + '</div></div>' +
          '<div class="fighter" style="position:relative"><div class="small muted">STAGE ' + stage + '</div><div class="av" id="mon">' + MONS[(stage - 1) % MONS.length] + '</div><div class="hp"><i id="hp" style="width:' + (100 * hp / maxHp) + '%"></i></div></div></div>' +
          '<div class="timer"><i id="tm" style="width:100%"></i></div>' +
          '<div class="prompt"><div class="ko">' + esc(WA.ko(it)) + '</div><div class="sub" id="df">' + esc(WA.posKo(it)) + " · " + s.length + '글자 · <a href="#" id="hd">영영풀이 보기</a></div></div>' +
          '<input class="built" id="bu" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" maxlength="' + tiles.length + '" placeholder="눌러서 타이핑" aria-label="단어 입력 (타이핑하거나 아래 타일을 눌러요)"><div class="tiles" id="tl"></div>' +
          '<div class="row-btns c"><button class="btn" id="bk">⌫ 지우기</button><button class="btn" id="cl">↺</button><button class="btn big red" id="atk">⚔️ 공격!</button></div><div class="fb" id="fb"></div></div>';
        WA.bindQuit(ctx, end);
        function draw() {
          $("#bu").value = built.map(function (t) { return t.ch; }).join("");
          $("#tl").innerHTML = tiles.map(function (t) { return '<button class="tile" data-k="' + t.k + '"' + (built.indexOf(t) >= 0 ? " disabled" : "") + ">" + t.ch + "</button>"; }).join("");
          $$("#tl .tile").forEach(function (b) { b.onclick = function () { built.push(tiles.filter(function (t) { return t.k === +b.dataset.k; })[0]); draw(); }; });
        }
        draw();
        // 타이핑: 친 글자를 남은 타일에서 하나씩 가져와요 (타일에 없는 글자는 들어가지 않아요)
        var bu = $("#bu");
        bu.oninput = function () {
          var typed = bu.value.toLowerCase().replace(/[^a-z]/g, ""), next = [], bad = false;
          typed.split("").forEach(function (ch) {
            var t = tiles.filter(function (x) { return x.ch === ch && next.indexOf(x) < 0; })[0];
            if (t) next.push(t); else bad = true;
          });
          built = next; draw();
          if (bad) { bu.classList.remove("shake"); void bu.offsetWidth; bu.classList.add("shake"); }
        };
        bu.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); $("#atk").click(); } else if (e.key === "Escape") { built = []; draw(); } };
        if (window.matchMedia && matchMedia("(pointer: fine)").matches) bu.focus();
        $("#hd").onclick = function (e) { e.preventDefault(); if (!defShown) { defShown = true; $("#df").innerHTML = esc(WA.def(it)); } };
        $("#bk").onclick = function () { built.pop(); draw(); };
        $("#cl").onclick = function () { built = []; draw(); };
        $("#atk").onclick = function () {
          var w = built.map(function (t) { return t.ch; }).join("");
          if (!w) return;
          if (w === s) hit(); else miss("틀렸어요! 정답은 <b>" + esc(s) + "</b>");
        };
        timer = setInterval(function () {
          var left = 1 - (now() - t1) / LIMIT; var el = $("#tm"); if (el) el.style.width = Math.max(0, left * 100) + "%";
          if (left <= 0) miss("시간이 다 됐어요! 정답은 <b>" + esc(s) + "</b>");
        }, 100);
        function lock() { clearInterval(timer); $$(".stage button, #bu").forEach(function (b) { b.disabled = true; }); }
        function hit() {
          lock(); combo++;
          var fast = (now() - t1) < 8000, d = s.length * 10 + (fast ? 10 : 0) + (combo >= 3 ? 10 : 0) - (defShown ? 5 : 0);
          hp -= d; dmgTotal += d; lenSum += s.length; res.push({ w: it.w, ok: true });
          var m = $("#mon"); m.classList.add("hit");
          var fx = document.createElement("div"); fx.className = "dmg"; fx.textContent = "-" + d; m.parentNode.appendChild(fx);
          $("#hp").style.width = Math.max(0, 100 * hp / maxHp) + "%";
          $("#fb").className = "fb ok"; $("#fb").textContent = (fast ? "⚡ 빠른 공격! " : "") + (combo >= 3 ? "🔥 콤보! " : "") + d + " 데미지";
          WA.say(s);
          i++;
          setTimeout(function () {
            if (hp <= 0) { kills++; stage++; newMon(); WA.toast("💀 몬스터를 물리쳤어요! STAGE " + stage); }
            show();
          }, 1100);
        }
        function miss(html) {
          lock(); combo = 0; hearts--; res.push({ w: it.w, ok: false });
          $("#fb").className = "fb bad"; $("#fb").innerHTML = "💥 몬스터의 반격! " + html;
          $("#bu").value = s;
          i++; setTimeout(show, 2300);
        }
      }
      function end() {
        clearInterval(timer);
        var okN = res.filter(function (r) { return r.ok; }).length;
        ctx.done({ score: dmgTotal + kills * 50 + hearts * 20 * (i >= list.length ? 1 : 0), ms: now() - t0, words: res,
          extra: { kills: kills, avgLen: okN ? +(lenSum / okN).toFixed(1) : 0, hearts: hearts },
          kpis: [["물리친 몬스터", kills + "마리"], ["평균 단어 길이", (okN ? (lenSum / okN).toFixed(1) : 0) + "글자"], ["남은 하트", hearts + "개"]] });
      }
      show();
    }
  });

  // ======================================================================
  // 7) 🔐 크립토그램 (교과서 예문 암호 풀기)
  // ======================================================================
  reg("crypto", {
    icon: "🔐", name: "암호 해독", desc: "알파벳이 바뀐 교과서 예문을 풀어요", min: 3,
    filter: function (it) { var n = WA.tokens(it.ex).length; return n >= 4 && n <= 12; },
    start: function (ctx) {
      var g = this, n = ctx.count >= 30 ? 5 : ctx.count >= 20 ? 4 : 3;
      var list = WA.shuffle(ctx.pool).slice(0, n), i = 0, score = 0, t0 = now(), hints = 0, res = [], totalChecks = 0;
      var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      function show() {
        if (i >= list.length) return end();
        var it = list[i], plain = it.ex.toUpperCase(), key, ok;
        do { key = WA.shuffle(ABC.split("")); ok = key.every(function (c, k) { return c !== ABC[k]; }); } while (!ok);
        var enc = {}, dec = {}; ABC.split("").forEach(function (c, k) { enc[c] = key[k]; dec[key[k]] = c; });
        var guess = {}, fixed = {}, cur = null, checks = 0, myHints = 0;
        // 많이 나오는 글자부터 일부를 미리 알려 줘요 (글자 수의 약 35%)
        var freq = {}, letters = plain.replace(/[^A-Z]/g, ""); letters.split("").forEach(function (c) { freq[c] = (freq[c] || 0) + 1; });
        var order = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }), cover = 0;
        for (var q = 0; q < order.length && cover < letters.length * .35; q++) { if (q % 2 === 1 || q === 0) { fixed[enc[order[q]]] = 1; guess[enc[order[q]]] = order[q]; cover += freq[order[q]]; } }
        function render() {
          var words = plain.split(" ");
          var html = words.map(function (w) {
            return '<div class="cw">' + w.split("").map(function (ch) {
              if (!/[A-Z]/.test(ch)) return '<div class="cl p">' + esc(ch) + "</div>";
              var c = enc[ch], gs = guess[c] || "";
              return '<div class="cl' + (fixed[c] ? " fix" : "") + (cur === c ? " cur" : "") + (checks && gs && gs !== ch && !fixed[c] ? " badl" : "") + '" data-c="' + c + '"><div class="g">' + gs + '</div><div class="c">' + c + "</div></div>";
            }).join("") + "</div>";
          }).join("");
          var used = {}; Object.keys(guess).forEach(function (c) { used[guess[c]] = 1; });
          var kb = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map(function (row, ri) {
            return "<div>" + row.split("").map(function (ch) { return '<button data-ch="' + ch + '"' + (used[ch] ? ' class="used"' : "") + ">" + ch + "</button>"; }).join("") + (ri === 2 ? '<button class="wide" data-ch="">⌫</button>' : "") + "</div>";
          }).join("");
          ctx.el.innerHTML = WA.bar(ctx, g, '<span class="s">' + (i + 1) + " / " + list.length + '</span><span class="s">⭐ <b>' + score + "</b></span>") + progress(i, list.length) +
            '<div class="stage"><div class="prompt"><div class="sub">💬 ' + esc(it.exKo) + '</div><div class="sub">작은 글자는 암호, 위 칸에 진짜 글자를 넣어요. 같은 암호는 한꺼번에 바뀌어요.</div></div>' +
            '<div class="cry">' + html + '</div><div class="kb">' + kb + '</div>' +
            '<div class="row-btns c"><button class="btn" id="hint">💡 이 글자 알려 주기</button><button class="btn big navy" id="chk">확인</button><button class="btn" id="giveup">🏳️ 포기</button></div><div class="fb" id="fb"></div></div>';
          WA.bindQuit(ctx, end);
          $$(".cl[data-c]").forEach(function (el) { el.onclick = function () { if (!fixed[el.dataset.c]) { cur = el.dataset.c; render(); } }; });
          $$(".kb button").forEach(function (b) { b.onclick = function () {
            if (!cur) return WA.toast("먼저 바꿀 칸을 눌러요");
            var ch = b.dataset.ch;
            if (ch) Object.keys(guess).forEach(function (c) { if (guess[c] === ch && !fixed[c]) delete guess[c]; });
            if (ch) guess[cur] = ch; else delete guess[cur];
            // 다음 빈칸으로
            var seq = plain.replace(/[^A-Z]/g, "").split("").map(function (p) { return enc[p]; });
            var at = seq.indexOf(cur), nxt = null;
            for (var k = 1; k <= seq.length && ch; k++) { var cc = seq[(at + k) % seq.length]; if (!guess[cc]) { nxt = cc; break; } }
            if (nxt) cur = nxt;
            render();
          }; });
          $("#hint").onclick = function () {
            if (!cur) return WA.toast("알고 싶은 칸을 먼저 눌러요");
            Object.keys(guess).forEach(function (c) { if (guess[c] === dec[cur] && c !== cur) delete guess[c]; });
            guess[cur] = dec[cur]; fixed[cur] = 1; hints++; myHints++; cur = null; render();
          };
          $("#chk").onclick = function () {
            var need = Object.keys(freq).map(function (p) { return enc[p]; });
            if (need.some(function (c) { return !guess[c]; })) return WA.toast("빈칸을 모두 채워 주세요");
            checks++; totalChecks++;
            if (need.every(function (c) { return guess[c] === dec[c]; })) {
              var pts = Math.max(20, 100 - myHints * 10 - (checks - 1) * 5); score += pts;
              res.push({ w: it.w, ok: myHints <= 2 && checks <= 2 });
              render(); $("#fb").className = "fb ok"; $("#fb").textContent = "🔓 해독 성공! +" + pts; WA.say(it.ex);
              $$(".stage button, .kb button").forEach(function (b) { b.disabled = true; });
              i++; setTimeout(show, 2200);
            } else { render(); $("#fb").className = "fb bad"; $("#fb").textContent = "빨간 글자가 틀렸어요. 다시 생각해 봐요!"; }
          };
          $("#giveup").onclick = function () {
            if (!confirm("정답을 보고 다음 문장으로 갈까요?")) return;
            Object.keys(freq).forEach(function (p) { guess[enc[p]] = p; fixed[enc[p]] = 1; });
            res.push({ w: it.w, ok: false }); render();
            $("#fb").className = "fb bad"; $("#fb").textContent = it.ex;
            $$(".stage button, .kb button").forEach(function (b) { b.disabled = true; });
            i++; setTimeout(show, 3000);
          };
        }
        render();
      }
      function end() { ctx.done({ score: score, ms: now() - t0, hints: hints, words: res, extra: { checks: totalChecks }, kpis: [["힌트", hints + "번"]] }); }
      show();
    }
  });
})();
