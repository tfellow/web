// MY Word Rush — Supabase Auth & Data Layer (Prefix: wr_)
// Strictly follows MYeVerse MY App rules:
// - Shared Supabase client (no custom storageKey)
// - GIS signInWithIdToken (no signInWithOAuth)
// - Server-side public.is_admin() check
// - Never auto-signOut blocked external accounts
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm";

const SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
const SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF";
const GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

function parseSchoolEmail(email) {
  const lower = String(email || "").toLowerCase();
  const m = lower.match(/^(\d{4})(\d)(\d{2})(\d{2})@smy\.ms\.kr$/);
  if (!m) return null;
  const grade = Number(m[2]);
  const classNo = Number(m[3]);
  const studentNo = Number(m[4]);
  return {
    entryYear: Number(m[1]),
    grade,
    classNo,
    studentNo,
    studentCode: `${m[2]}${m[3]}${m[4]}`,
    label: `${grade}학년 ${classNo}반 ${studentNo}번`,
  };
}

let gisPromise = null;
function loadGisScript() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    return Promise.resolve();
  }
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

const api = {
  client: sb,
  parseSchoolEmail,

  async getAuthState() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session || !session.user) {
      return { status: "signed_out", session: null, email: "", isAdmin: false, allowExternal: false };
    }

    const email = (session.user.email || "").toLowerCase();
    const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "";

    let isAdmin = false;
    try {
      const res = await sb.rpc("is_admin");
      isAdmin = Boolean(res.data);
    } catch (e) {
      isAdmin = false;
    }

    let allowExternal = false;
    let schemaReady = true;
    try {
      const { data: settings, error: sErr } = await sb
        .from("wr_settings")
        .select("allow_external")
        .eq("id", 1)
        .maybeSingle();
      if (sErr) {
        schemaReady = false;
      } else if (settings) {
        allowExternal = Boolean(settings.allow_external);
      }
    } catch (e) {
      schemaReady = false;
    }

    const isSchool = email.endsWith("@smy.ms.kr");
    const allowed = isAdmin || isSchool || allowExternal;

    const parsed = parseSchoolEmail(email);
    const displayName = isAdmin
      ? `${fullName || "교사"} 선생님`
      : parsed
        ? `${parsed.grade}-${parsed.classNo} ${fullName || parsed.studentCode}`
        : fullName || email.split("@")[0];

    return {
      status: allowed ? "allowed" : "blocked",
      session,
      email,
      fullName,
      displayName,
      parsed,
      grade: parsed ? parsed.grade : 1,
      isAdmin,
      isSchool,
      allowExternal,
      schemaReady,
    };
  },

  async drawGoogleButton(el, onError) {
    if (!el) return;
    el.innerHTML = "";
    try {
      await loadGisScript();
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (r) => {
          const { error } = await sb.auth.signInWithIdToken({
            provider: "google",
            token: r.credential,
          });
          if (error) {
            if (onError) onError(error.message);
            else alert("로그인 오류: " + error.message);
          } else {
            location.reload();
          }
        },
      });
      window.google.accounts.id.renderButton(el, {
        theme: "filled_blue",
        size: "large",
        text: "signin_with",
        locale: "ko",
        shape: "pill",
      });
    } catch (e) {
      el.innerHTML = `<p style="color:#e11d48; font-size:0.88rem;">Google 로그인 버튼을 불러오지 못했습니다. 네트워크를 확인해 주세요.</p>`;
    }
  },

  async signOutLocal() {
    await sb.auth.signOut({ scope: "local" });
    location.reload();
  },

  async ping() {
    const { data, error } = await sb.rpc("wr_ping");
    return !error && data === true;
  },

  async recordSession({ gameId, score, correctCount, totalQuestions, durationSec, displayName, grade, wordResults }) {
    const { data, error } = await sb.rpc("wr_record_session", {
      p_game_id: gameId,
      p_score: Math.round(score || 0),
      p_correct: Math.round(correctCount || 0),
      p_total: Math.round(totalQuestions || 0),
      p_duration_sec: Math.max(1, Math.round(durationSec || 1)),
      p_display_name: displayName || "학생",
      p_grade: Number(grade) || 1,
      p_word_results: wordResults || [],
    });
    if (error) throw error;
    return data;
  },

  async fetchMyDaily(email) {
    const { data, error } = await sb
      .from("wr_daily")
      .select("*")
      .eq("email", email.toLowerCase())
      .order("day", { ascending: false })
      .limit(60);
    if (error) return [];
    return data || [];
  },

  async fetchMyWordStats(email) {
    const { data, error } = await sb
      .from("wr_word_stats")
      .select("*")
      .eq("email", email.toLowerCase())
      .order("wrong", { ascending: false })
      .limit(500);
    if (error) return [];
    return data || [];
  },

  async fetchLeaderboard(gameId = "all", limit = 20) {
    const { data, error } = await sb.rpc("wr_get_leaderboard", {
      p_game_id: gameId,
      p_limit: limit,
    });
    if (error) return [];
    return data || [];
  },

  async fetchCustomSets() {
    const { data, error } = await sb
      .from("wr_custom_sets")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) return [];
    return data || [];
  },

  // --- Teacher Admin APIs ---
  async setAllowExternal(allow, adminEmail) {
    const { error } = await sb
      .from("wr_settings")
      .upsert({
        id: 1,
        allow_external: Boolean(allow),
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
  },

  async fetchTeacherDaily(limit = 300) {
    const { data, error } = await sb
      .from("wr_daily")
      .select("*")
      .order("day", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  },

  async fetchRoster() {
    const { data, error } = await sb
      .from("roster")
      .select("email, name, grade, class_no, student_no");
    if (error) return [];
    return data || [];
  },

  async fetchTeacherWeakWords(grade = null, lesson = null, limit = 30) {
    const { data, error } = await sb.rpc("wr_teacher_weak_words", {
      p_grade: grade ? Number(grade) : null,
      p_lesson: lesson ? Number(lesson) : null,
      p_limit: limit,
    });
    if (error) return [];
    return data || [];
  },

  async saveCustomSet({ id, title, grade, lesson, items, createdBy }) {
    const { error } = await sb.from("wr_custom_sets").upsert({
      id,
      title,
      grade: Number(grade) || 3,
      lesson: Number(lesson) || 1,
      items,
      created_by: createdBy,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async deleteCustomSet(id) {
    const { error } = await sb.from("wr_custom_sets").delete().eq("id", id);
    if (error) throw error;
  },
};

window.MY_SB = api;
window.dispatchEvent(new Event("my-sb-ready"));
