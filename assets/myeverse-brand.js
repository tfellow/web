/* MYeVerse 머리글 규칙 (모든 앱이 함께 써요)
 * - 머리글의 로고를 누르면 MYeVerse 첫 페이지(/web/)로 가요.
 * - 앱 이름(제목)을 누르면 그 앱의 첫 화면으로 가요.
 * - 머리글에 로고가 없는 앱은 앞에 작은 MYeVerse 로고를 붙여요.
 * 각 앱 페이지의 </body> 앞에 한 줄:  <script src="../assets/myeverse-brand.js" defer></script>
 * 로고를 붙이고 싶지 않은 페이지는 script 태그에 data-no-inject 를 써요.
 */
(function () {
  "use strict";
  if (window.__myeverseBrand) return;
  window.__myeverseBrand = true;
  var script = document.currentScript;
  var base;
  try { base = new URL("..", script.src).href; } catch (e) { return; }
  var HOME = base;                       // /web/ → 지금 첫 페이지로 이어져요
  var LOGO = base + "assets/myeverse/logo.svg";
  var noInject = script.hasAttribute("data-no-inject");
  var appStart = location.pathname;      // 해시(#/...)를 뺀 앱 첫 화면

  var HEADER = "header, .topbar, .top-navbar, .top, .app-header, .hd, .brand-area, .brand-wrap, .brand";
  var MARK = 'img[src*="myeverse/logo.svg"], .brand-mark, .brand-logo, .brand-crown, .brand-icon, .brand-emblem, .brand > .logo, .logo > .dot';
  var TITLE = ".brand-text, .brand-title, .brand-titles, .brand-sub-title, .brand > b, .logo > .txt, h1";
  var SKIP = ".cert, .cert-in, .card, dialog, .modal, .login, .auth-card, .pz-top, #my-apps-drawer, footer";

  function go(url) { return function (e) { e.preventDefault(); e.stopPropagation(); location.href = url; }; }
  function clickable(el, url, label) {
    el.setAttribute("data-mvb", "1");
    el.style.cursor = "pointer";
    if (!el.closest("a")) { el.setAttribute("role", "link"); el.tabIndex = 0; }
    el.title = label;
    el.addEventListener("click", go(url), true);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") go(url)(e); }, true);
  }
  function headerOf(el) { var h = el.closest(HEADER); return h && !el.closest(SKIP) ? h : null; }

  function run() {
    var marks = Array.prototype.filter.call(document.querySelectorAll(MARK), function (m) { return headerOf(m) && !m.hasAttribute("data-mvb") && !m.closest("[data-mvb]"); });
    marks.forEach(function (m) { clickable(m, HOME, "MYeVerse 첫 페이지"); });

    var titles = Array.prototype.filter.call(document.querySelectorAll(TITLE), function (t) {
      return headerOf(t) && !t.hasAttribute("data-mvb") && !t.closest("[data-mvb]") && !t.querySelector("[data-mvb]");
    });
    titles.forEach(function (t) {
      // 이미 앱 첫 화면으로 가는 링크·버튼 안에 있으면 그대로 둬요
      var a = t.closest("a[href], [onclick]");
      if (a && !a.matches("[data-mvb]")) {
        var href = a.getAttribute("href");
        if (a.hasAttribute("onclick") || href === "#/" || href === "#home" || href === "./" || href === "#") return;
      }
      clickable(t, appStart, "앱 첫 화면");
    });

    if (!noInject && !document.querySelector("[data-mvb-logo], " + MARK.split(", ").map(function (s) { return "header " + s + ", .topbar " + s + ", .top-navbar " + s; }).join(", "))) {
      var h = document.querySelector("header, .topbar, .top-navbar");
      if (h && !h.closest(SKIP)) {
        var a2 = document.createElement("a");
        a2.href = HOME; a2.setAttribute("data-mvb-logo", "1"); a2.setAttribute("data-mvb", "1");
        a2.title = "MYeVerse 첫 페이지"; a2.setAttribute("aria-label", "MYeVerse 첫 페이지");
        a2.style.cssText = "display:inline-flex;align-items:center;flex:none;margin-right:10px;vertical-align:middle";
        a2.innerHTML = '<img src="' + LOGO + '" alt="" width="34" height="34" style="width:34px;height:34px;display:block">';
        var anchor = h.querySelector(TITLE);
        var holder = anchor ? anchor.parentNode : h;
        holder.insertBefore(a2, anchor && anchor.parentNode === holder ? anchor : holder.firstChild);
      }
    }
  }

  var t = null;
  function soon() { clearTimeout(t); t = setTimeout(run, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  try { new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
