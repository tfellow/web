// 단어숲 오프라인 지원 (서비스 워커). 빌드할 때마다 버전 이름이 바뀌어 새 버전이 자동으로 깔립니다.
// - 앱 파일(같은 주소): 인터넷 먼저, 안 되면 저장해 둔 것
// - 글꼴·Supabase 프로그램(버전이 고정된 주소, cdn.jsdelivr.net/npm/): 저장해 둔 것 먼저
// - 학습 기록(Supabase 서버, 구글 로그인)은 건드리지 않음: 앱이 기기에 적어 두었다가 다시 연결되면 보냅니다.
const CACHE = 'danuhsup-38e81b09f1';
const CORE = ['./', 'index.html', 'app.js', 'app.css', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('danuhsup-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const pinned = url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com' || (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/@supabase/'));
  if (pinned) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
