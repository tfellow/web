-- =====================================================================
--  MY Grammar · 단원별 진도 통계 (교사 화면 → 📈 단원별 진도)
--  Supabase SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 안전해요.
--  - 학생 기록은 바꾸지 않아요. 통계를 빨리 계산하는 함수 하나만 추가해요.
--  - 이 파일을 실행하지 않아도 화면은 동작하지만(학생 기록을 직접 모아 계산),
--    기록이 많아지면 느려지니 실행해 두는 것을 권해요.
-- =====================================================================

-- 학생 × 소단원마다: 푼 문제 수(서로 다른 문제), 맞힌 문제 수(한 번이라도 맞힌 문제),
-- 시도 횟수, 정답 횟수, 마지막 풀이 시각. 지금 공개 중인 문제만 세요.
create or replace function public.mg_admin_unit_progress(p_from timestamptz, p_to timestamptz)
returns table (user_id uuid, topic_code text, solved bigint, correct bigint,
               attempts bigint, correct_attempts bigint, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.user_id, q.topic_code,
         count(distinct a.question_id),
         count(distinct a.question_id) filter (where a.is_correct),
         count(*), count(*) filter (where a.is_correct), max(a.created_at)
    from public.mg_attempts a
    join public.mg_questions q on q.id = a.question_id and q.active
   where public.mg_is_admin() and a.created_at >= p_from and a.created_at < p_to
   group by a.user_id, q.topic_code
$$;

revoke all on function public.mg_admin_unit_progress(timestamptz, timestamptz) from public, anon;
grant execute on function public.mg_admin_unit_progress(timestamptz, timestamptz) to authenticated;

-- 끝! 교사 화면을 새로고침하면 📈 단원별 진도에서 바로 쓰여요.
