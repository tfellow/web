-- MY Sentence Master (sentence2/) 표 · 함수
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권과 같은 프로젝트(tfellow-web) · 같은 로그인 · 같은 관리자 표(public.is_admin) · 같은 명단(roster)을 써요.
-- 이름은 모두 sms_ 로 시작해요 (2026-11-21 확인: 다른 앱과 겹치지 않음).
--
-- 저장하는 것
--   sms_profile : 학생 1명당 1줄 — XP·콤보·마스터 문장(stats), 오답 노트(wrong_notes)
--   sms_items   : 학생 × 문장 × 게임 1줄 — 맞힌 횟수 / 틀린 횟수 (문항마다 줄을 늘리지 않고 숫자만 더해요)
--   sms_daily   : 학생 × 날짜 × 단원 × 영역 × 게임 1줄 — 그날 맞힘/틀림/XP (기간별 통계 · Teacher Hub 용)
--   sms_lessons : 교사 스튜디오에서 만든 커스텀 단원 (학생 화면 단원 목록에 나타남)
--   sms_settings: 앱 설정 (allow_external = 외부 계정 허용, 기본 false)

-- 0) 설정 ------------------------------------------------------------------
create table if not exists public.sms_settings (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.sms_settings (key, value) values ('allow_external', 'false'::jsonb)
  on conflict (key) do nothing;

-- 학교 계정(@smy.ms.kr) · 교사 · (외부 허용이 켜져 있으면) 외부 계정
create or replace function public.sms_can() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
      or coalesce((select value = 'true'::jsonb from public.sms_settings where key = 'allow_external'), false)
$$;

-- 로그인 직후 한 번: 권한 + 명단 정보
create or replace function public.sms_access() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ext boolean := coalesce((select value = 'true'::jsonb from public.sms_settings where key = 'allow_external'), false);
  r record;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false); end if;
  select name, grade, class_no, student_no into r from public.roster where lower(email) = v_email limit 1;
  return jsonb_build_object(
    'ok', public.sms_can(),
    'admin', public.is_admin(),
    'school', v_email like '%@smy.ms.kr',
    'allow_external', v_ext,
    'name', r.name, 'grade', r.grade, 'class_no', r.class_no, 'student_no', r.student_no
  );
end $$;

-- 1) 학생 요약 ---------------------------------------------------------------
create table if not exists public.sms_profile (
  user_id     uuid primary key default auth.uid(),
  email       text not null,
  stats       jsonb not null default '{}'::jsonb,
  wrong_notes jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- 2) 문장별 누적 ---------------------------------------------------------------
create table if not exists public.sms_items (
  user_id     uuid not null,
  email       text not null,
  sentence_id text not null,
  mode        text not null,
  lesson_id   text,
  category    text,
  correct     int not null default 0,
  wrong       int not null default 0,
  last_result text,
  last_at     timestamptz not null default now(),
  primary key (user_id, sentence_id, mode)
);
create index if not exists sms_items_lesson_idx on public.sms_items (lesson_id);

-- 3) 날짜별 합계 ---------------------------------------------------------------
create table if not exists public.sms_daily (
  user_id   uuid not null,
  email     text not null,
  day       date not null,
  lesson_id text not null default '',
  category  text not null default '',
  mode      text not null default '',
  correct   int not null default 0,
  wrong     int not null default 0,
  xp        int not null default 0,
  primary key (user_id, day, lesson_id, category, mode)
);
create index if not exists sms_daily_day_idx on public.sms_daily (day);

-- 4) 커스텀 단원 ---------------------------------------------------------------
create table if not exists public.sms_lessons (
  id         text primary key,
  data       jsonb not null,
  created_by text,
  updated_at timestamptz not null default now()
);

-- RLS ----------------------------------------------------------------------
alter table public.sms_settings enable row level security;
alter table public.sms_profile  enable row level security;
alter table public.sms_items    enable row level security;
alter table public.sms_daily    enable row level security;
alter table public.sms_lessons  enable row level security;

drop policy if exists sms_settings_read on public.sms_settings;
create policy sms_settings_read on public.sms_settings for select to authenticated using (true);
drop policy if exists sms_settings_write on public.sms_settings;
create policy sms_settings_write on public.sms_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sms_profile_read on public.sms_profile;
create policy sms_profile_read on public.sms_profile for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists sms_profile_admin_del on public.sms_profile;
create policy sms_profile_admin_del on public.sms_profile for delete to authenticated using (public.is_admin());

drop policy if exists sms_items_read on public.sms_items;
create policy sms_items_read on public.sms_items for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists sms_items_admin_del on public.sms_items;
create policy sms_items_admin_del on public.sms_items for delete to authenticated using (public.is_admin());

drop policy if exists sms_daily_read on public.sms_daily;
create policy sms_daily_read on public.sms_daily for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists sms_daily_admin_del on public.sms_daily;
create policy sms_daily_admin_del on public.sms_daily for delete to authenticated using (public.is_admin());

drop policy if exists sms_lessons_read on public.sms_lessons;
create policy sms_lessons_read on public.sms_lessons for select to authenticated using (public.sms_can());
drop policy if exists sms_lessons_write on public.sms_lessons;
create policy sms_lessons_write on public.sms_lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.sms_settings, public.sms_profile, public.sms_items, public.sms_daily, public.sms_lessons from anon;
grant select, insert, update, delete on public.sms_settings, public.sms_lessons to authenticated;
grant select, delete on public.sms_profile, public.sms_items, public.sms_daily to authenticated;
-- 학생 기록 쓰기는 아래 함수로만 (본인 uid · 본인 이메일로 고정)

-- 쓰기 함수 -------------------------------------------------------------------
-- 요약 저장 (XP · 콤보 · 마스터 문장 · 오답 노트). 값이 비어 있으면 그 칸은 그대로 둬요.
create or replace function public.sms_save_profile(p_stats jsonb default null, p_wrong jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or not public.sms_can() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_stats is not null and jsonb_typeof(p_stats) <> 'object' then raise exception 'bad stats'; end if;
  if p_wrong is not null and jsonb_typeof(p_wrong) <> 'array' then raise exception 'bad wrong notes'; end if;
  if octet_length(coalesce(p_stats, '{}')::text) + octet_length(coalesce(p_wrong, '[]')::text) > 200000 then raise exception 'too large'; end if;
  insert into public.sms_profile (user_id, email, stats, wrong_notes, updated_at)
  values (auth.uid(), v_email, coalesce(p_stats, '{}'), coalesce(p_wrong, '[]'), now())
  on conflict (user_id) do update set
    email = excluded.email,
    stats = coalesce(p_stats, public.sms_profile.stats),
    wrong_notes = coalesce(p_wrong, public.sms_profile.wrong_notes),
    updated_at = now();
end $$;

-- 문항 기록 묶음 저장. p_events = [{ts, result:'correct'|'wrong', sentenceId, lessonId, category, mode, xpDelta}, ...]
create or replace function public.sms_log(p_events jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  e jsonb; n int := 0;
  v_ok int; v_ng int; v_xp int; v_day date; v_ts timestamptz;
  v_sid text; v_mode text; v_les text; v_cat text;
begin
  if v_uid is null or not public.sms_can() then raise exception 'not allowed' using errcode = '42501'; end if;
  if jsonb_typeof(p_events) <> 'array' then raise exception 'bad events'; end if;
  if jsonb_array_length(p_events) > 300 then raise exception 'too many events'; end if;
  for e in select * from jsonb_array_elements(p_events) loop
    v_ok := case when e->>'result' = 'correct' then 1 else 0 end;
    v_ng := case when e->>'result' = 'wrong' then 1 else 0 end;
    continue when v_ok + v_ng = 0;
    v_xp := least(greatest(coalesce((e->>'xpDelta')::int, 0), 0), 100) * v_ok;
    v_ts := coalesce(nullif(e->>'ts', '')::timestamptz, now());
    if v_ts > now() + interval '5 minutes' or v_ts < now() - interval '14 days' then v_ts := now(); end if;
    v_day := (v_ts at time zone 'Asia/Seoul')::date;
    v_sid := left(coalesce(e->>'sentenceId', ''), 80);
    v_mode := left(coalesce(e->>'mode', ''), 20);
    v_les := left(coalesce(e->>'lessonId', ''), 80);
    v_cat := left(coalesce(e->>'category', ''), 20);

    if v_sid <> '' then
      insert into public.sms_items (user_id, email, sentence_id, mode, lesson_id, category, correct, wrong, last_result, last_at)
      values (v_uid, v_email, v_sid, v_mode, v_les, v_cat, v_ok, v_ng, e->>'result', v_ts)
      on conflict (user_id, sentence_id, mode) do update set
        correct = public.sms_items.correct + v_ok,
        wrong = public.sms_items.wrong + v_ng,
        lesson_id = excluded.lesson_id, category = excluded.category, email = excluded.email,
        last_result = case when excluded.last_at >= public.sms_items.last_at then excluded.last_result else public.sms_items.last_result end,
        last_at = greatest(public.sms_items.last_at, excluded.last_at);
    end if;

    insert into public.sms_daily (user_id, email, day, lesson_id, category, mode, correct, wrong, xp)
    values (v_uid, v_email, v_day, v_les, v_cat, v_mode, v_ok, v_ng, v_xp)
    on conflict (user_id, day, lesson_id, category, mode) do update set
      correct = public.sms_daily.correct + v_ok,
      wrong = public.sms_daily.wrong + v_ng,
      xp = public.sms_daily.xp + v_xp,
      email = excluded.email;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 교사 통계 한 번에 (행 수 제한 없이 jsonb 로) -----------------------------------
create or replace function public.sms_admin_data(p_since date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  return jsonb_build_object(
    'profiles', coalesce((select jsonb_agg(jsonb_build_object('e', email, 'stats', stats, 'wn', jsonb_array_length(wrong_notes), 'u', updated_at)) from public.sms_profile), '[]'),
    'items', coalesce((select jsonb_agg(jsonb_build_object('e', email, 's', sentence_id, 'm', mode, 'l', lesson_id, 'c', category, 'ok', correct, 'ng', wrong, 'r', last_result, 't', last_at))
                       from public.sms_items where p_since is null or last_at >= p_since), '[]'),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('e', email, 'd', day, 'l', lesson_id, 'c', category, 'm', mode, 'ok', correct, 'ng', wrong, 'xp', xp))
                       from public.sms_daily where p_since is null or day >= p_since), '[]')
  );
end $$;

revoke all on function public.sms_save_profile(jsonb, jsonb), public.sms_log(jsonb), public.sms_admin_data(date), public.sms_access(), public.sms_can() from anon, public;
grant execute on function public.sms_save_profile(jsonb, jsonb), public.sms_log(jsonb), public.sms_admin_data(date), public.sms_access(), public.sms_can() to authenticated;

-- 확인용: select public.sms_access();   (로그인한 상태의 SQL 편집기에서는 ok=false 로 나와도 정상)
