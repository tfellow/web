import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, SCHOOL_DOMAIN, TEACHER_EMAILS, APP_NAME } from "./config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { SCHOOL_DOMAIN, APP_NAME };

const TEACHERS = TEACHER_EMAILS.map(e => String(e).trim().toLowerCase());

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const MODE_LABEL = { cloze: "빈칸 채우기", order: "문장 순서", words: "어순 배열" };
// 테스트 종류 배지 (빈칸 + 어순 배열을 섞은 테스트는 둘 다 표시)
export function modeBadge(t) {
  const m = t?.mode || "cloze";
  if (m === "order") return `<span class="badge purple">${MODE_LABEL.order}</span>`;
  if (m === "words") return `<span class="badge teal">${MODE_LABEL.words}</span>`;
  return `<span class="badge blue">${MODE_LABEL.cloze}</span>${(t.words || []).length ? ` <span class="badge teal">+ ${MODE_LABEL.words}</span>` : ""}`;
}
// 문항 수: 문장 순서는 문장 수, 그 외는 빈칸 + 어순 배열 문장
export function questionCount(t) {
  if (t?.mode === "order") return (t.sentences || []).length;
  return (t?.mode === "words" ? 0 : (t?.blanks || []).length) + (t?.words || []).length;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function isTeacherEmail(e) { return !!e && TEACHERS.includes(e.toLowerCase()); }
export function isAllowedEmail(e) {
  return !!e && (e.toLowerCase().endsWith("@" + SCHOOL_DOMAIN) || isTeacherEmail(e));
}
export function toast(msg, type = "") {
  let box = $("#toast-box");
  if (!box) { box = document.createElement("div"); box.id = "toast-box"; document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
export function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
}
export function tsNum(ts) { const d = toDate(ts); return d ? d.getTime() : Date.now(); }
const pad = n => String(n).padStart(2, "0");
export function fmtDate(ts) {
  const d = toDate(ts);
  if (!d) return "-";
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function toLocalInput(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtSec(sec) {
  if (sec == null || isNaN(sec)) return "-";
  if (sec < 60) return (Math.round(sec * 10) / 10).toFixed(1) + "초";
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}분 ${pad(s)}초`;
}
export function classOf(no) {
  const s = String(no || "");
  if (!/^\d{5}$/.test(s)) return "기타";
  return `${s[0]}학년 ${parseInt(s.slice(1, 3), 10)}반`;
}
export function inAppBrowser() {
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast("복사했습니다."); }
  catch { prompt("아래 내용을 복사하세요.", t); }
}
export function playUrl(code) {
  return new URL("play.html?code=" + encodeURIComponent(code), location.href).href;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    let c = "";
    for (let j = 0; j < 6; j++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    const s = await getDocs(query(collection(db, "tests"), where("code", "==", c)));
    if (s.empty) return c;
  }
  throw new Error("코드를 만들지 못했습니다.");
}

// 점수가 높을수록, 같으면 빠를수록 좋은 기록
export function better(a, b) {
  if (a.score !== b.score) return a.score > b.score;
  return (a.timeSec ?? 1e9) < (b.timeSec ?? 1e9);
}
export function pickPerStudent(list, mode = "best") {
  if (mode === "all") return list.slice();
  const m = new Map();
  for (const s of list) {
    const cur = m.get(s.uid);
    if (!cur) { m.set(s.uid, s); continue; }
    const replace = mode === "best" ? better(s, cur) : tsNum(s.submittedAt) < tsNum(cur.submittedAt);
    if (replace) m.set(s.uid, s);
  }
  return [...m.values()];
}
export function rankSort(list) {
  return list.sort((a, b) => (b.score - a.score) || ((a.timeSec ?? 1e9) - (b.timeSec ?? 1e9)));
}

// ---------- 닉네임 ----------
const BANNED = ["시발", "씨발", "ㅅㅂ", "병신", "ㅂㅅ", "개새", "좆", "존나", "fuck", "shit", "bitch", "sex", "섹스", "애미", "느금"];
export function checkNickname(n) {
  n = String(n || "").trim();
  if (n.length < 2 || n.length > 12) return "닉네임은 2~12글자로 입력하세요.";
  const low = n.toLowerCase().replace(/\s/g, "");
  if (BANNED.some(b => low.includes(b))) return "사용할 수 없는 단어가 들어 있습니다.";
  return "";
}
export function profileComplete(p) {
  return !!(p && /^\d{5}$/.test(p.studentNo || "") && p.realName && p.nickname);
}

// ---------- 로그인 ----------
export async function login() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, p);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, p);
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      toast("로그인 오류: " + (e.code || e.message), "err");
    }
  }
}
export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}

function renderLogin(el, msg = "") {
  const inApp = inAppBrowser();
  el.innerHTML = `
  <div class="card narrow center login-card">
    <h1 class="logo">${esc(APP_NAME)}</h1>
    <p class="muted">빈칸 채우기 · 문장 순서 맞추기 · 어순 배열</p>
    ${msg ? `<p class="alert err">${esc(msg)}</p>` : ""}
    ${inApp ? `<p class="alert warn">카카오톡·네이버 앱 안에서는 Google 로그인이 되지 않습니다.<br>오른쪽 위 메뉴에서 <b>다른 브라우저로 열기</b>를 눌러 주세요.<br><button class="btn small" id="copyUrl">주소 복사</button></p>` : ""}
    <button class="btn primary big" id="loginBtn">Google 학교 계정으로 로그인</button>
    <p class="muted small">@${esc(SCHOOL_DOMAIN)} 계정만 사용할 수 있습니다.</p>
  </div>`;
  $("#loginBtn", el).onclick = login;
  const c = $("#copyUrl", el);
  if (c) c.onclick = () => copyText(location.href);
}

export function profileForm(el, ctx, { cancelable = false } = {}) {
  return new Promise(resolve => {
    const p = ctx.profile || {};
    el.innerHTML = `
    <div class="card narrow">
      <h2>내 정보</h2>
      <p class="muted">학번과 실명은 <b>선생님만</b> 볼 수 있습니다. 친구들에게는 <b>닉네임</b>만 보입니다.</p>
      <label>학번 (5자리, 예: 1학년 3반 5번 → 10305)<input id="pfNo" inputmode="numeric" maxlength="5" value="${esc(p.studentNo || "")}"></label>
      <label>이름 (실명)<input id="pfName" maxlength="20" value="${esc(p.realName || "")}"></label>
      <label>닉네임 (순위표에 표시, 2~12자)<input id="pfNick" maxlength="12" value="${esc(p.nickname || "")}"></label>
      <p class="muted small">바르지 않은 닉네임은 선생님이 확인할 수 있습니다.</p>
      <p class="alert err hidden" id="pfErr"></p>
      <div class="row end">
        ${cancelable ? `<button class="btn" id="pfCancel">취소</button>` : ""}
        <button class="btn primary" id="pfSave">저장</button>
      </div>
    </div>`;
    const err = m => { const e = $("#pfErr", el); e.textContent = m; e.classList.toggle("hidden", !m); };
    if (cancelable) $("#pfCancel", el).onclick = () => resolve(null);
    $("#pfSave", el).onclick = async () => {
      const studentNo = $("#pfNo", el).value.trim();
      const realName = $("#pfName", el).value.trim();
      const nickname = $("#pfNick", el).value.trim();
      if (!/^\d{5}$/.test(studentNo)) return err("학번은 숫자 5자리로 입력하세요.");
      if (realName.length < 2) return err("이름을 입력하세요.");
      const ne = checkNickname(nickname);
      if (ne) return err(ne);
      const data = { email: ctx.user.email, role: "student", studentNo, realName, nickname, updatedAt: serverTimestamp() };
      try {
        await setDoc(doc(db, "users", ctx.user.uid), data, { merge: true });
        ctx.profile = { ...p, ...data };
        toast("저장했습니다.");
        resolve(ctx.profile);
      } catch (e) {
        console.error(e);
        err("저장하지 못했습니다: " + (e.code || e.message));
      }
    };
  });
}

export async function editProfileModal(ctx) {
  const ov = document.createElement("div");
  ov.className = "overlay";
  document.body.appendChild(ov);
  const r = await profileForm(ov, ctx, { cancelable: true });
  ov.remove();
  if (r) location.reload();
}

function renderHeader(ctx) {
  const h = document.createElement("header");
  h.className = "topbar";
  const name = ctx.teacher ? (ctx.user.displayName || ctx.user.email) : (ctx.profile?.nickname || ctx.user.email);
  h.innerHTML = `<a class="brand" href="index.html">${esc(APP_NAME)}</a>
    <div class="spacer"></div>
    <span class="badge ${ctx.teacher ? "blue" : "gray"}">${ctx.teacher ? "교사" : "학생"}</span>
    <span class="who">${esc(name)}</span>
    ${!ctx.teacher ? `<button class="btn small ghost" id="hdProfile">내 정보</button>` : ""}
    <button class="btn small ghost" id="hdLogout">로그아웃</button>`;
  document.body.prepend(h);
  $("#hdLogout", h).onclick = logout;
  const pb = $("#hdProfile", h);
  if (pb) pb.onclick = () => editProfileModal(ctx);
}

// 모든 페이지 공통 입구: 로그인 → 계정 확인 → (학생) 내 정보 입력
export function gate(opts = {}) {
  const { needProfile = false, teacherOnly = false, noHeader = false } = opts;
  const el = $("#app");
  if (String(firebaseConfig.apiKey).startsWith("PASTE")) {
    el.innerHTML = `<div class="card narrow"><h2>설정이 필요합니다</h2><p>js/config.js 파일에 Firebase 설정값을 넣어 주세요. (README.md 참고)</p></div>`;
    return new Promise(() => {});
  }
  el.innerHTML = `<div class="loading">불러오는 중…</div>`;
  getRedirectResult(auth).catch(e => console.warn(e));
  return new Promise(resolve => {
    let done = false;
    onAuthStateChanged(auth, async user => {
      if (done) return;
      if (!user) { renderLogin(el); return; }
      if (!isAllowedEmail(user.email)) {
        const em = user.email;
        await signOut(auth);
        renderLogin(el, `${em} 계정은 사용할 수 없습니다. @${SCHOOL_DOMAIN} 학교 계정으로 로그인하세요.`);
        return;
      }
      done = true;
      const teacher = isTeacherEmail(user.email);
      const ctx = { user, teacher, profile: null };
      if (teacherOnly && !teacher) {
        if (!noHeader) renderHeader(ctx);
        el.innerHTML = `<div class="card narrow"><h2>교사 전용 페이지입니다</h2><p class="muted">교사로 등록된 계정만 볼 수 있습니다.</p><a class="btn" href="index.html">첫 화면으로</a></div>`;
        return;
      }
      try {
        const s = await getDoc(doc(db, "users", user.uid));
        ctx.profile = s.exists() ? s.data() : null;
      } catch (e) { console.error(e); }
      if (teacher && !ctx.profile) {
        ctx.profile = { email: user.email, role: "teacher", realName: user.displayName || "", nickname: user.displayName || "선생님" };
        setDoc(doc(db, "users", user.uid), { ...ctx.profile, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
      }
      if (needProfile && !teacher && !profileComplete(ctx.profile)) await profileForm(el, ctx);
      if (!noHeader) renderHeader(ctx);
      el.innerHTML = "";
      resolve(ctx);
    });
  });
}
