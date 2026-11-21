/* MY English 앱 서랍 (모든 학생 앱이 함께 쓰는 작은 메뉴)
 * - 화면 왼쪽 가장자리의 "MY" 손잡이를 누르면 다른 앱으로 바로 갈 수 있어요.
 * - 각 앱 index.html 의 </body> 바로 앞에 한 줄만 넣으면 돼요:
 *     <script src="../assets/my-apps.js" defer></script>
 * - 퀴즈·시험을 푸는 화면(#/quiz, #/test, #/play, #/daily)과 전체 화면, 인쇄에서는 숨겨요.
 *   다른 화면에서도 숨기려면 data-hide-hash="정규식" 을 script 태그에 써요.
 * - 앱을 추가·삭제할 때는 아래 APPS 목록만 고치면 모든 앱에 반영돼요.
 * - 끄고 싶으면 각 앱에서 이 script 한 줄을 지우면 돼요. 앱의 다른 기능에는 영향을 주지 않아요.
 */
(function () {
  "use strict";
  if (window.__myAppsDrawer) return;
  window.__myAppsDrawer = true;

  var script = document.currentScript;
  var base;
  try { base = new URL("..", script.src).href; } catch (e) { return; }

  // [폴더, 아이콘, 이름, 한 줄 설명]
  var APPS = [
    ["level/", "🧭", "MY Level Test", "내 영어 레벨 알아보기"],
    ["app/", "📖", "MY Reading Passport", "세계문학 읽고 퀴즈"],
    ["reading2/app/", "🌍", "MY Knowledge Passport", "지식 글 읽고 퀴즈"],
    ["metro/", "🚇", "MY Reading Metro", "교과서 본문 읽기"],
    ["grammar/", "✏️", "MY Grammar", "문법 배우고 풀기"],
    ["writing1/", "📝", "MY Writing Tutor", "한국어를 영어로 쓰기"],
    ["speaking/", "🎤", "MY Speaking", "대화문 듣고 말하기"],
    ["danuhsup/", "🌳", "MY Word Forest", "단어숲 · 단어 외우기"],
    ["my-english-arcade/", "🎮", "MY English Arcade", "교과서 어휘 게임 12종"],
    ["wordrush/", "⚡", "MY Word Rush", "단어·문장 챌린지 8종"],
    ["wordarcade/", "🕹️", "MY Word Arcade", "교과서 단어 게임"],
    ["sentence/", "🏋️", "MY Sentence Gym", "교과서 문장 게임 9종"],
    ["brainup/", "💡", "MY Brain Up", "랜덤 상식 퀴즈"],
    ["quiz/", "👑", "Quiz Queens", "룰렛 상식 퀴즈"],
    ["history/", "🏛️", "MY History Museum", "역사 교과서 박물관"]
  ];

  var hideRe = null;
  try { hideRe = new RegExp(script.getAttribute("data-hide-hash") || "^#/(quiz|test|play|daily)"); } catch (e) {}

  var here = location.href.split("#")[0].split("?")[0];
  function isHere(path) { return here.indexOf(base + path) === 0; }

  var host = document.createElement("div");
  host.id = "my-apps-drawer";
  host.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;";
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var css =
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:Pretendard,'Malgun Gothic','Apple SD Gothic Neo',system-ui,sans-serif}" +
    ".tab{position:fixed;left:0;top:50%;transform:translateY(-50%);width:26px;min-height:64px;padding:8px 0;border:0;border-radius:0 12px 12px 0;" +
    "background:#1e3768;color:#e9c46a;font-weight:800;font-size:11px;line-height:1.25;letter-spacing:.04em;cursor:pointer;opacity:.72;" +
    "box-shadow:2px 2px 10px rgba(20,38,73,.3);writing-mode:vertical-rl;text-orientation:upright;touch-action:manipulation}" +
    ".tab:hover,.tab:focus-visible{opacity:1;outline:2px solid #e9c46a;outline-offset:1px}" +
    ".shade{position:fixed;inset:0;background:rgba(15,23,42,.45);opacity:0;pointer-events:none;transition:opacity .18s}" +
    ".panel{position:fixed;left:0;top:0;bottom:0;width:min(320px,86vw);background:#fbf7ef;color:#1f2937;transform:translateX(-102%);transition:transform .2s ease;" +
    "display:flex;flex-direction:column;box-shadow:6px 0 30px rgba(15,23,42,.3);padding-left:env(safe-area-inset-left,0px)}" +
    ".open .shade{opacity:1;pointer-events:auto}.open .panel{transform:none}.open .tab{display:none}" +
    ".head{background:#1e3768;color:#fff;padding:16px 14px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}" +
    ".head b{font-size:17px;letter-spacing:-.01em}.head span{display:block;font-size:12px;color:#e9c46a;font-weight:600;margin-top:2px}" +
    ".x{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer}" +
    ".x:focus-visible,a:focus-visible{outline:3px solid #e9c46a;outline-offset:-3px}" +
    ".top{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 12px 4px}" +
    ".top a{display:block;text-align:center;padding:11px 6px;border-radius:12px;background:#fff;border:1px solid #e8e1d2;color:#1e3768;font-weight:700;font-size:14px;text-decoration:none}" +
    ".list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:6px 12px 10px;margin:0;list-style:none}" +
    ".list a{display:flex;align-items:center;gap:12px;min-height:52px;padding:8px 10px;border-radius:12px;color:inherit;text-decoration:none}" +
    ".list a:hover{background:#f1eadb}.list i{font-style:normal;font-size:22px;width:30px;text-align:center;flex:none}" +
    ".list b{display:block;font-size:15px}.list small{display:block;font-size:12px;color:#6b7280;margin-top:1px}" +
    ".list a.now{background:#1e3768;color:#fff}.list a.now small{color:#e9c46a}" +
    ".foot{padding:10px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid #e8e1d2;font-size:12px;color:#6b7280}.foot a{color:#1e3768}" +
    ".hide .tab{display:none}" +
    "@media print{.tab,.shade,.panel{display:none!important}}" +
    "@media (prefers-reduced-motion:reduce){.panel,.shade{transition:none}}";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var items = APPS.map(function (a) {
    var now = isHere(a[0]);
    return '<li><a href="' + esc(base + a[0]) + '"' + (now ? ' class="now" aria-current="page"' : "") + "><i aria-hidden=\"true\">" + a[1] +
      "</i><span><b>" + esc(a[2]) + "</b><small>" + (now ? "지금 여기" : esc(a[3])) + "</small></span></a></li>";
  }).join("");

  root.innerHTML = "<style>" + css + "</style>" +
    '<div class="wrap">' +
    '<button class="tab" type="button" aria-label="MY 다른 앱 열기" aria-expanded="false">MY</button>' +
    '<div class="shade"></div>' +
    '<nav class="panel" aria-label="MY 앱 목록" aria-hidden="true">' +
    '<div class="head"><div><b>MY Apps</b><span>MYeVerse 앱 모음</span></div><button class="x" type="button" aria-label="닫기">×</button></div>' +
    '<div class="top"><a href="' + esc(base) + '">🏠 처음 화면</a><a href="' + esc(base + "me/") + '">🗺️ 내 기록</a></div>' +
    '<ul class="list">' + items + "</ul>" +
    '<div class="foot">MYeVerse · <a href="' + esc(base + "privacy.html") + '">개인정보처리방침</a></div></nav></div>';

  var wrap = root.querySelector(".wrap");
  var tab = root.querySelector(".tab");
  var panel = root.querySelector(".panel");
  var closeBtn = root.querySelector(".x");

  function setOpen(on) {
    wrap.classList.toggle("open", on);
    tab.setAttribute("aria-expanded", on ? "true" : "false");
    panel.setAttribute("aria-hidden", on ? "false" : "true");
    if ("inert" in panel) panel.inert = !on;
    if (on) closeBtn.focus(); else if (!wrap.classList.contains("hide")) tab.focus();
  }
  function refresh() {
    var hide = !!document.fullscreenElement || !!(hideRe && hideRe.test(location.hash || ""));
    wrap.classList.toggle("hide", hide);
    if (hide && wrap.classList.contains("open")) setOpen(false);
  }

  tab.addEventListener("click", function () { setOpen(true); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  root.querySelector(".shade").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && wrap.classList.contains("open")) setOpen(false); });
  window.addEventListener("hashchange", refresh);
  document.addEventListener("fullscreenchange", refresh);

  function mount() {
    document.body.appendChild(host);
    if ("inert" in panel) panel.inert = true;
    refresh();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
