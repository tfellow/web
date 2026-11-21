-- ============================================================================
-- MY Word Rush (wordrush/) — Supabase Schema, RLS & RPC Functions
-- Prefix: wr_
-- Safe to run multiple times (idempotent) in Supabase SQL Editor.
-- Prerequisite: public.is_admin() already exists in tfellow-web project.
-- ============================================================================

-- 1. App Settings (singleton row: id = 1)
--    Controls whether external (non-@smy.ms.kr) Google accounts are allowed.
create table if not exists public.wr_settings (
  id             int primary key default 1 check (id = 1),
  allow_external boolean not null default false,
  updated_by     text,
  updated_at     timestamptz not null default now()
);

insert into public.wr_settings (id, allow_external)
values (1, false)
on conflict (id) do nothing;

alter table public.wr_settings enable row level security;
revoke all on public.wr_settings from anon;
grant select on public.wr_settings to authenticated;
grant insert, update on public.wr_settings to authenticated;

drop policy if exists wr_settings_read on public.wr_settings;
create policy wr_settings_read on public.wr_settings
  for select to authenticated
  using (true);

drop policy if exists wr_settings_admin_write on public.wr_settings;
create policy wr_settings_admin_write on public.wr_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Helper: check if current authenticated user is allowed to use MY Word Rush
create or replace function public.wr_can_use()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
    or coalesce((select allow_external from public.wr_settings where id = 1), false);
$$;
revoke all on function public.wr_can_use() from anon;
grant execute on function public.wr_can_use() to authenticated;

-- 2. Daily Student Summary (1 row per student × KST date × game_id)
--    Compact storage for 500MB free plan & easy MY Teacher Hub integration.
create table if not exists public.wr_daily (
  email      text not null,
  day        date not null default (now() at time zone 'Asia/Seoul')::date,
  game_id    text not null,
  plays      int  not null default 0,
  correct    int  not null default 0,
  total      int  not null default 0,
  best_score int  not null default 0,
  total_sec  int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (email, day, game_id)
);

create index if not exists wr_daily_day_idx on public.wr_daily (day desc);

alter table public.wr_daily enable row level security;
revoke all on public.wr_daily from anon;
grant select, insert, update on public.wr_daily to authenticated;

drop policy if exists wr_daily_read on public.wr_daily;
create policy wr_daily_read on public.wr_daily
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists wr_daily_insert on public.wr_daily;
create policy wr_daily_insert on public.wr_daily
  for insert to authenticated
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

drop policy if exists wr_daily_update on public.wr_daily;
create policy wr_daily_update on public.wr_daily
  for update to authenticated
  using (email = lower(auth.jwt() ->> 'email') and public.wr_can_use())
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

-- 3. Per-Word Mastery & Error Stats (1 row per student × word_id)
create table if not exists public.wr_word_stats (
  email         text not null,
  word_id       text not null,
  grade         int  not null default 1,
  lesson        int  not null default 1,
  word          text not null,
  attempts      int  not null default 0,
  correct       int  not null default 0,
  wrong         int  not null default 0,
  last_wrong_at timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (email, word_id)
);

create index if not exists wr_word_stats_grade_lesson_idx on public.wr_word_stats (grade, lesson);

alter table public.wr_word_stats enable row level security;
revoke all on public.wr_word_stats from anon;
grant select, insert, update, delete on public.wr_word_stats to authenticated;

drop policy if exists wr_word_stats_read on public.wr_word_stats;
create policy wr_word_stats_read on public.wr_word_stats
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists wr_word_stats_insert on public.wr_word_stats;
create policy wr_word_stats_insert on public.wr_word_stats
  for insert to authenticated
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

drop policy if exists wr_word_stats_update on public.wr_word_stats;
create policy wr_word_stats_update on public.wr_word_stats
  for update to authenticated
  using (email = lower(auth.jwt() ->> 'email') and public.wr_can_use())
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

drop policy if exists wr_word_stats_delete on public.wr_word_stats;
create policy wr_word_stats_delete on public.wr_word_stats
  for delete to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

-- 4. Leaderboard Table (only nickname/display_name & scores exposed via RPC)
create table if not exists public.wr_leaderboard (
  email        text not null,
  game_id      text not null,
  display_name text not null,
  grade        int  not null default 1,
  best_score   int  not null default 0,
  total_plays  int  not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (email, game_id)
);

alter table public.wr_leaderboard enable row level security;
revoke all on public.wr_leaderboard from anon;
grant select, insert, update on public.wr_leaderboard to authenticated;

drop policy if exists wr_leaderboard_read on public.wr_leaderboard;
create policy wr_leaderboard_read on public.wr_leaderboard
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists wr_leaderboard_write on public.wr_leaderboard;
create policy wr_leaderboard_write on public.wr_leaderboard
  for insert to authenticated
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

drop policy if exists wr_leaderboard_update on public.wr_leaderboard;
create policy wr_leaderboard_update on public.wr_leaderboard
  for update to authenticated
  using (email = lower(auth.jwt() ->> 'email') and public.wr_can_use())
  with check (email = lower(auth.jwt() ->> 'email') and public.wr_can_use());

-- 5. Teacher Custom Vocabulary Sets (1 set = 1 JSONB row)
create table if not exists public.wr_custom_sets (
  id         text primary key,
  title      text not null,
  grade      int  not null default 3,
  lesson     int  not null default 1,
  items      jsonb not null default '[]'::jsonb,
  created_by text not null,
  updated_at timestamptz not null default now()
);

alter table public.wr_custom_sets enable row level security;
revoke all on public.wr_custom_sets from anon;
grant select on public.wr_custom_sets to authenticated;
grant insert, update, delete on public.wr_custom_sets to authenticated;

drop policy if exists wr_custom_sets_read on public.wr_custom_sets;
create policy wr_custom_sets_read on public.wr_custom_sets
  for select to authenticated
  using (public.wr_can_use());

drop policy if exists wr_custom_sets_admin_write on public.wr_custom_sets;
create policy wr_custom_sets_admin_write on public.wr_custom_sets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- RPC Functions
-- ============================================================================

-- Ping check for installation verification
create or replace function public.wr_ping()
returns boolean
language sql
stable
as $$ select true $$;
revoke all on function public.wr_ping() from anon;
grant execute on function public.wr_ping() to authenticated;

-- Atomic session recorder: updates wr_daily, wr_word_stats, and wr_leaderboard in 1 call
create or replace function public.wr_record_session(
  p_game_id      text,
  p_score        int,
  p_correct      int,
  p_total        int,
  p_duration_sec int,
  p_display_name text,
  p_grade        int,
  p_word_results jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_day   date := (now() at time zone 'Asia/Seoul')::date;
  v_item  jsonb;
  v_ok    boolean;
begin
  if v_email = '' or not public.wr_can_use() then
    raise exception 'Permission denied';
  end if;

  -- Upsert daily aggregate
  insert into public.wr_daily (email, day, game_id, plays, correct, total, best_score, total_sec, updated_at)
  values (
    v_email, v_day, p_game_id, 1,
    greatest(0, p_correct), greatest(0, p_total),
    greatest(0, p_score), greatest(1, p_duration_sec), now()
  )
  on conflict (email, day, game_id) do update set
    plays      = wr_daily.plays + 1,
    correct    = wr_daily.correct + greatest(0, p_correct),
    total      = wr_daily.total + greatest(0, p_total),
    best_score = greatest(wr_daily.best_score, greatest(0, p_score)),
    total_sec  = wr_daily.total_sec + greatest(1, p_duration_sec),
    updated_at = now();

  -- Upsert leaderboard (game-specific)
  insert into public.wr_leaderboard (email, game_id, display_name, grade, best_score, total_plays, updated_at)
  values (
    v_email, p_game_id, left(coalesce(nullif(trim(p_display_name), ''), '학생'), 24),
    coalesce(p_grade, 1), greatest(0, p_score), 1, now()
  )
  on conflict (email, game_id) do update set
    display_name = left(coalesce(nullif(trim(p_display_name), ''), wr_leaderboard.display_name), 24),
    grade        = coalesce(p_grade, wr_leaderboard.grade),
    best_score   = greatest(wr_leaderboard.best_score, greatest(0, p_score)),
    total_plays  = wr_leaderboard.total_plays + 1,
    updated_at   = now();

  -- Upsert per-word stats
  if jsonb_typeof(p_word_results) = 'array' then
    for v_item in select * from jsonb_array_elements(p_word_results)
    loop
      v_ok := coalesce((v_item ->> 'ok')::boolean, false);
      insert into public.wr_word_stats (email, word_id, grade, lesson, word, attempts, correct, wrong, last_wrong_at, updated_at)
      values (
        v_email,
        v_item ->> 'id',
        coalesce((v_item ->> 'grade')::int, 1),
        coalesce((v_item ->> 'lesson')::int, 1),
        coalesce(v_item ->> 'word', ''),
        1,
        case when v_ok then 1 else 0 end,
        case when v_ok then 0 else 1 end,
        case when v_ok then null else now() end,
        now()
      )
      on conflict (email, word_id) do update set
        attempts      = wr_word_stats.attempts + 1,
        correct       = wr_word_stats.correct + (case when v_ok then 1 else 0 end),
        wrong         = wr_word_stats.wrong + (case when v_ok then 0 else 1 end),
        last_wrong_at = case when v_ok then wr_word_stats.last_wrong_at else now() end,
        updated_at    = now();
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'day', v_day);
end;
$$;
revoke all on function public.wr_record_session(text, int, int, int, int, text, int, jsonb) from anon;
grant execute on function public.wr_record_session(text, int, int, int, int, text, int, jsonb) to authenticated;

-- Public-safe Leaderboard RPC (never exposes student emails)
create or replace function public.wr_get_leaderboard(
  p_game_id text default 'all',
  p_limit   int  default 20
)
returns table (
  display_name text,
  grade        int,
  best_score   int,
  total_plays  int,
  updated_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.display_name,
    l.grade,
    case when p_game_id = 'all' then sum(l.best_score)::int else max(l.best_score)::int end as best_score,
    sum(l.total_plays)::int as total_plays,
    max(l.updated_at) as updated_at
  from public.wr_leaderboard l
  where public.wr_can_use()
    and (p_game_id = 'all' or l.game_id = p_game_id)
  group by l.email, l.display_name, l.grade
  order by best_score desc, total_plays desc
  limit least(greatest(p_limit, 1), 50);
$$;
revoke all on function public.wr_get_leaderboard(text, int) from anon;
grant execute on function public.wr_get_leaderboard(text, int) to authenticated;

-- Teacher-only Weak Words Analytics RPC
create or replace function public.wr_teacher_weak_words(
  p_grade  int default null,
  p_lesson int default null,
  p_limit  int default 30
)
returns table (
  word_id       text,
  grade         int,
  lesson        int,
  word          text,
  total_attempts bigint,
  total_wrong   bigint,
  wrong_rate    int,
  student_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.word_id,
    w.grade,
    w.lesson,
    max(w.word) as word,
    sum(w.attempts) as total_attempts,
    sum(w.wrong) as total_wrong,
    round((sum(w.wrong)::numeric / greatest(1, sum(w.attempts))) * 100)::int as wrong_rate,
    count(distinct w.email) as student_count
  from public.wr_word_stats w
  where public.is_admin()
    and (p_grade is null or w.grade = p_grade)
    and (p_lesson is null or w.lesson = p_lesson)
    and w.wrong > 0
  group by w.word_id, w.grade, w.lesson
  order by total_wrong desc, wrong_rate desc
  limit least(greatest(p_limit, 1), 100);
$$;
revoke all on function public.wr_teacher_weak_words(int, int, int) from anon;
grant execute on function public.wr_teacher_weak_words(int, int, int) to authenticated;
