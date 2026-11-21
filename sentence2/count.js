/* MY Sentence Master — 문제 수 선택 (5 / 10 / 20 / 모두)
 * Claude add-on: 게임 파일(js/games/*)과 app.js는 건드리지 않고,
 * 각 게임의 render()에 넘어가는 문장 목록만 고른 개수로 줄인다.
 * - 블라인드 암기·메신저 대화: 본문/대화 흐름이 끊기지 않게 "연속된 구간"을 무작위로 고름
 * - 나머지 게임: 무작위로 고르되 교과서 순서는 유지
 * 게임 화면에 들어갈 때마다(탭·카드 클릭) 새로 뽑고, 게임 안의 "다시 하기"는 같은 문제로 다시 함.
 */
(function () {
  var SMS = window.SMS || {};
  var KEY = "sms2_qcount";
  var OPTIONS = [5, 10, 20, 0]; // 0 = 모두
  var CONTIGUOUS = { blind: 1, chat: 1 };

  function getCount() {
    try { var v = parseInt(localStorage.getItem(KEY), 10); return OPTIONS.indexOf(v) >= 0 ? v : 10; } catch (e) { return 10; }
  }
  function setCount(v) { try { localStorage.setItem(KEY, String(v)); } catch (e) {} }

  function pick(list, n, contiguous) {
    if (!n || list.length <= n) return list;
    if (contiguous) {
      var start = Math.floor(Math.random() * (list.length - n + 1));
      return list.slice(start, start + n);
    }
    var idx = list.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return idx.slice(0, n).sort(function (a, b) { return a - b; }).map(function (k) { return list[k]; });
  }

  // 메신저 대화 게임이 실제로 쓰는 문장(source)을 게임과 같은 규칙으로 구한다
  function chatSource(sentences, ctx) {
    if (sentences.some(function (s) { return s.category === "incontext"; })) return sentences.filter(function (s) { return s.category === "incontext"; });
    var lessonIC = ((ctx && ctx.currentLesson && ctx.currentLesson.sentences) || []).filter(function (s) { return s.category === "incontext"; });
    return lessonIC.length ? lessonIC : sentences;
  }

  function wrapGames() {
    var games = SMS.games || {};
    Object.keys(games).forEach(function (mode) {
      var g = games[mode];
      if (!g || typeof g.render !== "function" || g.render.__smsCount) return;
      var orig = g.render;
      g.render = function (container, sentences, ctx) {
        var n = getCount();
        var list = sentences || [];
        if (mode === "chat") list = chatSource(list, ctx);
        return orig.call(this, container, pick(list, n, !!CONTIGUOUS[mode]), ctx);
      };
      g.render.__smsCount = true;
    });
  }

  function drawPicker() {
    var tabs = document.getElementById("category-tabs");
    if (!tabs || document.getElementById("s2-count")) return;
    var box = document.createElement("div");
    box.id = "s2-count";
    box.className = "s2-count";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "문제 수 선택");
    box.innerHTML = '<span class="selector-label">문제 수</span>' + OPTIONS.map(function (v) {
      return '<button type="button" class="cnt-tab" data-cnt="' + v + '">' + (v ? v + "문제" : "모두") + "</button>";
    }).join("");
    tabs.parentNode.insertBefore(box, tabs.nextSibling);
    function mark() {
      var cur = getCount();
      box.querySelectorAll(".cnt-tab").forEach(function (b) {
        var on = parseInt(b.dataset.cnt, 10) === cur;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".cnt-tab");
      if (!b) return;
      setCount(parseInt(b.dataset.cnt, 10));
      mark();
      // 게임 중이면 새 개수로 바로 다시 시작
      var active = document.querySelector(".mode-tab.active");
      if (active && active.dataset.mode !== "dashboard") active.click();
    });
    mark();
  }

  wrapGames(); // app.js 보다 뒤, DOMContentLoaded 전에 실행됨 → 첫 화면부터 적용
  document.addEventListener("DOMContentLoaded", function () { wrapGames(); drawPicker(); });
})();
