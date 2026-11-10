/* MY Reading Passport 서비스 워커 (PWA)
 *
 * 하는 일
 *  - 앱 화면(HTML): 항상 서버에서 새로 받아요. 인터넷이 안 되거나 4초 넘게 응답이 없을 때만 저장본을 보여 줘요.
 *  - ?v=버전이 붙은 파일(app.js, books.js, style.css, books/*.js …): 한 번 받으면 저장해 두고 다시 써요.
 *    버전 번호가 바뀌면 주소가 달라지므로 새 파일을 받아요. 예전 버전 저장본은 자동으로 지워요.
 *  - jsDelivr 글꼴·라이브러리: 버전이 고정된 주소라 저장해 두고 다시 써요.
 *  - Supabase(로그인·기록·퀴즈), Google 로그인: 전혀 건드리지 않아요. 항상 서버와 직접 주고받아요.
 *
 * 버전: index 쪽 app.js 가 "sw.js?v=ASSET_V" 로 등록하므로 이 파일은 고칠 필요가 없어요.
 *
 * ⚠️ 문제가 생겨 PWA를 완전히 끄고 싶을 때(비상 해제):
 *   이 파일 내용을 아래 네 줄로 바꿔서 배포하면 모든 기기에서 서비스 워커와 저장본이 지워지고 원래 웹앱으로 돌아가요.
 *   self.addEventListener("install", function () { self.skipWaiting(); });
 *   self.addEventListener("activate", function (e) { e.waitUntil(caches.keys().then(function (ks) {
 *     return Promise.all(ks.map(function (k) { return caches.delete(k); })); }).then(function () {
 *     return self.registration.unregister(); })); });
 */
"use strict";

var V = new URL(self.location.href).searchParams.get("v") || "0";
var APP_CACHE = "myrp-app-" + V;
var CDN_CACHE = "myrp-cdn-1";
var SCOPE = self.registration.scope; // 예: https://tfellow.github.io/web/app/
var CDN_HOSTS = ["cdn.jsdelivr.net"]; // flagcdn 국기 그림은 브라우저 기본 캐시에 맡겨요(opaque 응답은 저장 공간을 많이 차지해요)
var SHELL = [
  "./",
  "style.css?v=" + V,
  "books.js?v=" + V,
  "themes.js?v=" + V,
  "app.js?v=" + V,
  "emblem.png",
  "icon-192.png",
  "manifest.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(APP_CACHE).then(function (cache) {
      // 하나가 실패해도 설치는 계속돼요
      return Promise.all(SHELL.map(function (u) {
        return cache.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf("myrp-app-") === 0 && k !== APP_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function putIfOk(cacheName, req, res) {
  if (res && res.ok) {
    var copy = res.clone();
    caches.open(cacheName).then(function (c) { c.put(req, copy); });
  }
  return res;
}

// 화면(HTML): 네트워크 우선, 실패하거나 4초 넘으면 저장본
function networkFirst(req) {
  var net = fetch(req).then(function (res) {
    if (res.ok) {
      var copy = res.clone();
      var key = new URL(req.url); key.search = ""; key.hash = "";
      caches.open(APP_CACHE).then(function (c) { c.put(key.href, copy); });
    }
    return res;
  });
  var cachedP = caches.open(APP_CACHE).then(function (c) {
    var key = new URL(req.url); key.search = ""; key.hash = "";
    return c.match(key.href).then(function (m) { return m || c.match(SCOPE); });
  });
  var timeout = new Promise(function (resolve) {
    setTimeout(function () { cachedP.then(function (m) { if (m) resolve(m); }); }, 4000);
  });
  return Promise.race([
    net.catch(function () { return cachedP.then(function (m) { return m || Response.error(); }); }),
    timeout
  ]);
}

function cacheFirst(cacheName, req) {
  return caches.open(cacheName).then(function (c) {
    return c.match(req).then(function (m) {
      return m || fetch(req).then(function (res) { return putIfOk(cacheName, req, res); });
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.open(APP_CACHE).then(function (c) {
    return c.match(req).then(function (m) {
      var net = fetch(req).then(function (res) { return putIfOk(APP_CACHE, req, res); });
      if (m) { net.catch(function () {}); return m; }
      return net;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.href.indexOf(SCOPE) !== 0) return; // /web/app/ 밖(다른 앱)은 건드리지 않아요
    if (req.mode === "navigate") { event.respondWith(networkFirst(req)); return; }
    if (url.searchParams.has("v")) { event.respondWith(cacheFirst(APP_CACHE, req)); return; }
    if (url.pathname.endsWith("sw.js")) return;
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(cacheFirst(CDN_CACHE, req));
  }
  // 그 밖의 주소(Supabase, Google 등)는 서비스 워커가 관여하지 않아요
});
