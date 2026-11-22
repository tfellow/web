'use strict';
const cards = [...document.querySelectorAll('.app-card')];
const filters = [...document.querySelectorAll('[data-filter]')];
const audienceButtons = [...document.querySelectorAll('[data-audience]')];
const subjectButtons = [...document.querySelectorAll('[data-subject]')];
const sections = [...document.querySelectorAll('[data-domain-section]')];
const search = document.getElementById('app-search');
let audience = 'student';
let subject = 'all';
let category = 'all';
let lastStudentSubject = 'all';
const domainNames = { english:'영어 학습', subjects:'다른 교과', knowledge:'상식·퀴즈', all:'전체 영역', teacher:'수업·관리 도구' };
function filterApps() {
  const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const inScope = card => card.dataset.role === audience && (audience === 'teacher' || subject === 'all' || card.dataset.domain === subject);
  let count = 0;
  cards.forEach(card => {
    const content = `${card.textContent} ${card.dataset.search}`.toLocaleLowerCase();
    const matches = inScope(card) && (category === 'all' || card.dataset.topic === category) && words.every(word => content.includes(word));
    card.hidden = !matches;
    if(matches) count++;
  });
  sections.forEach(section => {
    section.querySelectorAll('.app-group').forEach(group => {
      const visible = group.querySelectorAll('.app-card:not([hidden])').length;
      group.hidden = visible === 0;
      group.querySelector('.group-count').textContent = visible;
    });
    section.hidden = !section.querySelector('.app-card:not([hidden])');
  });
  audienceButtons.forEach(button => {
    const active = button.dataset.audience === audience;
    button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
  });
  subjectButtons.forEach(button => {
    const active = button.dataset.subject === subject;
    button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
  });
  filters.forEach(button => {
    const topic = button.dataset.filter;
    button.hidden = topic !== 'all' && !cards.some(card => inScope(card) && card.dataset.topic === topic);
    const active = topic === category;
    button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
  });
  document.getElementById('subject-bar').hidden = audience === 'teacher';
  document.getElementById('result-count').textContent = `${audience === 'student' ? '학생용' : '교사용'} · ${domainNames[subject]} · ${count}개 앱`;
  document.getElementById('scope-note').textContent = audience === 'teacher' ? '관리 기능은 각 앱에서 교사 인증 후 이용해요.' : '로그인은 각 앱에서도 할 수 있어요.';
  document.getElementById('empty-state').hidden = count !== 0;
  document.getElementById('reset-search').textContent = audience === 'student' ? '학생용 전체 앱 보기' : '교사용 전체 앱 보기';
}
audienceButtons.forEach(button => button.addEventListener('click',()=>{
  if(audience === 'student') lastStudentSubject = subject;
  audience = button.dataset.audience;
  subject = audience === 'teacher' ? 'teacher' : lastStudentSubject;
  category = 'all'; filterApps();
}));
subjectButtons.forEach(button => button.addEventListener('click',()=>{
  subject = button.dataset.subject; category = 'all'; filterApps();
}));
filters.forEach(button => button.addEventListener('click',()=>{category = button.dataset.filter; filterApps();}));
document.querySelectorAll('[data-jump-topic]').forEach(button => button.addEventListener('click',()=>{
  audience = 'student'; subject = 'english'; category = button.dataset.jumpTopic; search.value = ''; filterApps();
  document.querySelector(`[data-filter="${category}"]`).focus({preventScroll:true});
  document.querySelector('.discovery-controls').scrollIntoView({block:'start',behavior:'instant'});
}));
search.addEventListener('input',filterApps);
document.getElementById('reset-search').addEventListener('click',()=>{
  search.value = ''; category = 'all'; subject = audience === 'teacher' ? 'teacher' : 'all'; filterApps(); search.focus();
});
filterApps();

const dialog = document.getElementById('account-dialog');
const accountButton = document.getElementById('account-button');
const accountStatus = document.getElementById('account-status');
const googleButton = document.getElementById('google-button');
const logoutButton = document.getElementById('logout-button');
let authClient = null;
let authReady = null;
let session = null;
let googleReady = null;
let googleDrawn = false;

// Public application configuration, shared with the existing MY apps. No staff email list.
const config = {
  supabaseUrl: 'https://jkxdhyvnrvsiokbbbjtu.supabase.co',
  supabaseKey: 'sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF',
  googleClientId: '359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com'
};
function renderAccount() {
  accountButton.textContent = session ? '내 계정' : '로그인';
  googleButton.hidden = !!session;
  logoutButton.hidden = !session;
  accountStatus.textContent = session ? `${session.user.email || 'Google 계정'} 계정으로 로그인했어요.` : '';
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => { script.remove(); reject(new Error('load timeout')); }, 12000);
    script.src = src; script.async = true;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('load failed')); };
    document.head.append(script);
  });
}
async function getAuth() {
  if (!authReady) {
    authReady = (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js');
      authClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
      authClient.auth.onAuthStateChange((_event, nextSession) => { session = nextSession; renderAccount(); });
      const result = await authClient.auth.getSession();
      if (result.error) throw result.error;
      session = result.data.session;
      renderAccount();
      return authClient;
    })().catch(error => { authReady = null; throw error; });
  }
  return authReady;
}
async function prepareGoogle() {
  if (googleDrawn) return;
  if (!googleReady) googleReady = loadScript('https://accounts.google.com/gsi/client').catch(error => { googleReady = null; throw error; });
  await googleReady;
  window.google.accounts.id.initialize({
    client_id: config.googleClientId,
    callback: async response => {
      accountStatus.textContent = '로그인하고 있어요…';
      try {
        const client = await getAuth();
        const result = await client.auth.signInWithIdToken({ provider: 'google', token: response.credential });
        if (result.error) throw result.error;
        session = result.data.session;
        renderAccount();
      } catch (_) {
        accountStatus.textContent = '로그인하지 못했어요. 잠시 후 다시 시도하거나 이용할 앱에서 로그인해 주세요.';
      }
    }
  });
  googleButton.replaceChildren();
  window.google.accounts.id.renderButton(googleButton, { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ko', shape: 'pill', width: 260 });
  googleDrawn = true;
}
accountButton.addEventListener('click', async () => {
  if (!dialog.open) dialog.showModal();
  accountStatus.textContent = '로그인 정보를 확인하고 있어요…';
  try {
    await getAuth();
    renderAccount();
    if (!session) await prepareGoogle();
  } catch (_) {
    accountStatus.textContent = '로그인 연결을 불러오지 못했어요. 잠시 후 다시 열거나 이용할 앱에서 로그인해 주세요.';
  }
});
logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    const client = await getAuth();
    const result = await client.auth.signOut({ scope: 'local' });
    if (result.error) throw result.error;
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
    session = null; renderAccount();
    accountStatus.textContent = '이 브라우저의 공통 로그인에서 로그아웃했어요. 별도 로그인을 쓰는 앱은 해당 앱에서도 로그아웃해 주세요.';
    await prepareGoogle();
  } catch (_) {
    accountStatus.textContent = '로그아웃을 완료하지 못했어요. 다시 시도해 주세요.';
  } finally { logoutButton.disabled = false; }
});
document.getElementById('close-account').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });

// On page load, restore an existing shared login so the button shows "내 계정" right away.
try {
  if (Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) getAuth().catch(() => {});
} catch (_) {}
