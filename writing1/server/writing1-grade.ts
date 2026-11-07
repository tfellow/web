// Supabase Edge Function: writing1-grade
// AI 영작문 튜터의 Gemini 채점을 대신 해 주는 작은 서버예요.
// - Gemini API 키는 Supabase 비밀값(GEMINI_API_KEY)에만 있어요. 학생 브라우저로는 절대 가지 않아요.
// - 학교(@smy.ms.kr) 또는 교사 Google 계정으로 MY English(Firebase cloze-a8e6c)에 로그인한 사람만 쓸 수 있어요.
// 배포: Supabase 대시보드 → Edge Functions → Deploy a new function → 이름 writing1-grade → 이 코드 붙여넣기
//       → 함수 설정에서 "Verify JWT with legacy secret" 끄기 (Firebase 로그인 토큰을 여기서 직접 확인해요)
//       → Edge Functions → Secrets 에 GEMINI_API_KEY 추가
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.9.6/index.ts";

const FIREBASE_PROJECT = "cloze-a8e6c";
const ALLOWED_ORIGINS = ["https://tfellow.github.io"];
const TEACHERS = ["tfellow@gmail.com", "tfellow@smy.ms.kr", "engwords@gmail.com"];
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

  // 1) Firebase 로그인 확인
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let email = "";
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT}`,
      audience: FIREBASE_PROJECT,
    });
    if (payload.email_verified === true) email = String(payload.email || "").toLowerCase();
  } catch (_) { /* 아래에서 거절 */ }
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
