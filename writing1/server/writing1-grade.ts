// Supabase Edge Function: writing1-grade
// AI 영작문 튜터의 Gemini 채점을 대신 해 주는 작은 서버예요.
// - Gemini API 키는 Supabase 비밀값(GEMINI_API_KEY)에만 있어요. 학생 브라우저로는 절대 가지 않아요.
// - 학교(@smy.ms.kr) 또는 교사 Google 계정으로 로그인한 사람만 쓸 수 있어요.
//   2026-11: 영작문 튜터가 Supabase 로그인으로 바뀌어서 Supabase 로그인 표를 먼저 확인하고,
//   예전 앱(Firebase cloze-a8e6c 로그인)이 남은 기기를 위해 Firebase 로그인 표도 계속 받아요.
// 배포: Supabase 대시보드 → Edge Functions → writing1-grade → Code 에 이 코드 붙여넣기 → Deploy
//       → 함수 설정에서 "Verify JWT with legacy secret" 은 꺼 둔 그대로 (로그인 표를 여기서 직접 확인해요)
//       → Edge Functions → Secrets 에 GEMINI_API_KEY (이미 있으면 그대로)
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.9.6/index.ts";

const FIREBASE_PROJECT = "cloze-a8e6c";
const ALLOWED_ORIGINS = ["https://tfellow.github.io"];
const TEACHERS = ["tfellow@gmail.com", "tfellow@smy.ms.kr", "engwords@gmail.com", "engwords@smy.ms.kr", "hist1026@gmail.com"];
const MODEL = "gemini-2.5-flash";
const MAX_BODY = 20_000;

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Vary": "Origin",
  };
}

// Supabase 로그인 표 확인: Supabase 인증 서버에 "이 표의 주인이 누구냐"고 물어봐요.
// (SUPABASE_URL, SUPABASE_ANON_KEY 는 Edge Function 에 자동으로 들어 있는 값이에요)
async function supabaseEmail(token: string): Promise<string> {
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon || token.split(".").length !== 3) return "";
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!r.ok) return "";
    const u = await r.json();
    const verified = u?.email_confirmed_at || u?.user_metadata?.email_verified === true;
    return verified ? String(u.email || "").toLowerCase() : "";
  } catch (_) { return ""; }
}

// 같은 계정이 너무 자주 부르지 못하게 (함수 인스턴스 안에서만 세는 간단한 제한)
const recent = new Map<string, number[]>();
function tooMany(email: string) {
  const now = Date.now();
  const list = (recent.get(email) || []).filter((t) => now - t < 60_000);
  list.push(now);
  recent.set(email, list);
  return list.length > 12;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response("method", { status: 405, headers });

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return Response.json({ error: "server key missing" }, { status: 503, headers });

  // 1) 로그인 확인: Supabase 로그인(지금) → 안 되면 Firebase 로그인(예전 앱)
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let email = token ? await supabaseEmail(token) : "";
  if (!email && token) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT}`,
        audience: FIREBASE_PROJECT,
      });
      if (payload.email_verified === true) email = String(payload.email || "").toLowerCase();
    } catch (_) { /* 아래에서 거절 */ }
  }
  const allowed = email && (email.endsWith("@smy.ms.kr") || TEACHERS.includes(email));
  if (!allowed) return Response.json({ error: "unauthorized" }, { status: 401, headers });
  if (tooMany(email)) return Response.json({ error: "too many requests" }, { status: 429, headers });

  // 2) 채점 요청만 그대로 전달 (모델은 고정)
  const raw = await req.text();
  if (raw.length > MAX_BODY) return Response.json({ error: "too large" }, { status: 413, headers });
  let body: { contents?: unknown; generationConfig?: unknown };
  try { body = JSON.parse(raw); } catch (_) { return Response.json({ error: "bad json" }, { status: 400, headers }); }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: body.contents, generationConfig: body.generationConfig }),
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { ...headers, "Content-Type": "application/json" } });
});
