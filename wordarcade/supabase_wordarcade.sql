-- MY Word Arcade (교과서 단어 게임) 표 · 함수
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권 · Brain Up 과 같은 프로젝트, 같은 로그인(is_admin, roster)을 써요.
-- 이 앱이 만드는 표와 함수는 모두 이름이 wa_ 로 시작해요. 다른 앱의 표는 건드리지 않아요.
--
-- 저장하는 것
--   wa_plays    : 한 판에 1행 (게임, 단원, 문제 수, 맞힌 수, 점수, 걸린 시간, 힌트 수)
--   wa_wordstat : 학생 × 단어 1행 (몇 번 나왔고 몇 번 틀렸는지) → 오답 노트, 취약 어휘 통계
--   wa_banks    : 선생님이 올린 단어장 (기본 1·2학년 단어장은 앱 안 data/*.json 에 들어 있어요)
--   wa_settings : 앱 열기/닫기, 학교 밖 계정 허용

-- ======================================================================
-- 1) 표
-- ======================================================================
create table if not exists public.wa_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.wa_settings (key, value) values ('open', 'true'), ('allow_external', 'false')
on conflict (key) do nothing;

create table if not exists public.wa_banks (
  id         text primary key,                 -- 예: 'g1-2027', 'custom-1'
  name       text not null,                    -- 화면에 보이는 이름
  grade      smallint,
  words      jsonb not null,                   -- [{g,l,n,w,ko,def,ex,exKo}, ...]
  active     boolean not null default true,    -- 끄면 학생 화면에서 숨겨요
  sort       int not null default 0,
  updated_at timestamptz not null default now(),
  created_by text default lower(auth.jwt() ->> 'email')
);

create table if not exists public.wa_plays (
  id         bigserial primary key,
  user_id    uuid not null,
  email      text not null,
  game       text not null check (game in ('match','spell','order','listen','cross','battle','crypto')),
  mode       text,                             -- 게임 안의 방식 (예: match 'ko' / 'def' / 'phrase')
  bank       text not null,
  lessons    text,                             -- '1,2,3' 또는 'review'(오답 복습)
  n          int not null default 0,           -- 문제(단어) 수
  ok         int not null default 0,           -- 한 번에 맞힌 수
  score      int not null default 0,
  ms         int not null default 0,           -- 걸린 시간 (1/1000초)
  hints      int not null default 0,
  extra      jsonb not null default '{}',      -- 게임별 기록 (틀린 클릭 수, 평균 단어 길이 등)
  created_at timestamptz not null default now()
);
create index if not exists wa_plays_user_idx on public.wa_plays (user_id, created_at desc);
create index if not exists wa_plays_time_idx on public.wa_plays (created_at);

create table if not exists public.wa_wordstat (
  user_id    uuid not null,
  email      text not null,
  bank       text not null,
  word       text not null,
  tries      int not null default 0,
  wrong      int not null default 0,
  last_ok    boolean not null default true,
  last_at    timestamptz not null default now(),
  primary key (user_id, bank, word)
);
create index if not exists wa_wordstat_bank_idx on public.wa_wordstat (bank, word);

-- ======================================================================
-- 2) 함수
-- ======================================================================
create or replace function public.wa_set(k text) returns jsonb
language sql stable security definer set search_path = public as $$
  select value from public.wa_settings where key = k
$$;

-- 지금 로그인한 사람이 써도 되는지 (학교 계정 · 관리자 · 학교 밖 계정 허용)
create or replace function public.wa_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
    or public.is_admin()
    or coalesce(public.wa_set('allow_external') = 'true'::jsonb, false))
$$;

-- 내 이름 · 학년 · 반 · 번호 (명단에 없으면 빈 값)
create or replace function public.wa_me() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('name', r.name, 'grade', r.grade, 'class_no', r.class_no, 'student_no', r.student_no)
    from public.roster r where lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1), '{}'::jsonb)
$$;

-- 한 판 끝났을 때 결과 저장
-- p = {game, mode, bank, lessons, n, ok, score, ms, hints, extra, words:[{w:'apple', ok:true}, ...]}
create or replace function public.wa_submit(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id bigint;
  v_today int;
  w jsonb;
begin
  if v_uid is null or not public.wa_allowed() then raise exception 'WA_DENIED'; end if;
  if not public.is_admin() and coalesce(public.wa_set('open') = 'false'::jsonb, false) then raise exception 'WA_CLOSED'; end if;
  select count(*) into v_today from public.wa_plays where user_id = v_uid and created_at > now() - interval '1 day';
  if v_today >= 400 then raise exception 'WA_LIMIT'; end if;
  if jsonb_typeof(p -> 'words') is distinct from 'array' or jsonb_array_length(p -> 'words') > 200 then raise exception 'WA_BAD'; end if;

  insert into public.wa_plays (user_id, email, game, mode, bank, lessons, n, ok, score, ms, hints, extra)
  values (v_uid, v_email, p ->> 'game', left(p ->> 'mode', 20), left(p ->> 'bank', 60), left(p ->> 'lessons', 60),
    least(greatest(coalesce((p ->> 'n')::int, 0), 0), 200),
    least(greatest(coalesce((p ->> 'ok')::int, 0), 0), 200),
    least(greatest(coalesce((p ->> 'score')::int, 0), 0), 20000),
    least(greatest(coalesce((p ->> 'ms')::int, 0), 0), 3600000),
    least(greatest(coalesce((p ->> 'hints')::int, 0), 0), 999),
    case when jsonb_typeof(p -> 'extra') = 'object' and length((p -> 'extra')::text) < 2000 then p -> 'extra' else '{}'::jsonb end)
  returning id into v_id;

  for w in select * from jsonb_array_elements(p -> 'words') loop
    continue when coalesce(w ->> 'w', '') = '';
    insert into public.wa_wordstat as s (user_id, email, bank, word, tries, wrong, last_ok, last_at)
    values (v_uid, v_email, left(p ->> 'bank', 60), left(w ->> 'w', 80), 1,
      case when (w ->> 'ok')::boolean then 0 else 1 end, coalesce((w ->> 'ok')::boolean, false), now())
    on conflict (user_id, bank, word) do update set
      tries = s.tries + 1,
      wrong = s.wrong + excluded.wrong,
      last_ok = excluded.last_ok,
      last_at = now();
  end loop;
  return v_id;
end $$;

-- 교사용: 명단 (학번 · 이름 붙이기)
create or replace function public.wa_roster() returns table (email text, name text, grade int, class_no int, student_no int)
language sql stable security definer set search_path = public as $$
  select lower(r.email), r.name, r.grade::int, r.class_no::int, r.student_no::int
  from public.roster r where public.is_admin()
$$;

-- 교사용: 많이 틀린 단어 (p_emails 가 null 이면 전체 학생)
create or replace function public.wa_word_top(p_bank text, p_emails text[] default null, p_min int default 3)
returns table (word text, students int, tries int, wrong int, rate numeric)
language sql stable security definer set search_path = public as $$
  select s.word, count(*)::int, sum(s.tries)::int, sum(s.wrong)::int,
         round(100.0 * sum(s.wrong) / nullif(sum(s.tries), 0), 1)
  from public.wa_wordstat s
  where public.is_admin() and s.bank = p_bank and (p_emails is null or s.email = any(p_emails))
  group by s.word
  having sum(s.tries) >= p_min
  order by 5 desc, 4 desc
  limit 300
$$;

-- 앱이 켜져 있는지 확인용 (keep-alive 핑에도 쓸 수 있어요)
create or replace function public.wa_ping() returns text language sql stable as $$ select 'ok' $$;

-- ======================================================================
-- 3) 권한 (RLS)
-- ======================================================================
alter table public.wa_settings enable row level security;
alter table public.wa_banks    enable row level security;
alter table public.wa_plays    enable row level security;
alter table public.wa_wordstat enable row level security;

drop policy if exists wa_set_read  on public.wa_settings;
drop policy if exists wa_set_write on public.wa_settings;
create policy wa_set_read  on public.wa_settings for select to authenticated using (true);
create policy wa_set_write on public.wa_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists wa_bank_read  on public.wa_banks;
drop policy if exists wa_bank_write on public.wa_banks;
create policy wa_bank_read  on public.wa_banks for select to authenticated using (active or public.is_admin());
create policy wa_bank_write on public.wa_banks for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 기록은 wa_submit 으로만 써요. 읽기는 내 것만 (선생님은 전체)
drop policy if exists wa_play_read on public.wa_plays;
drop policy if exists wa_play_del  on public.wa_plays;
create policy wa_play_read on public.wa_plays for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy wa_play_del  on public.wa_plays for delete to authenticated using (public.is_admin());

drop policy if exists wa_ws_read on public.wa_wordstat;
drop policy if exists wa_ws_del  on public.wa_wordstat;
create policy wa_ws_read on public.wa_wordstat for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy wa_ws_del  on public.wa_wordstat for delete to authenticated using (public.is_admin());

revoke all on function public.wa_submit(jsonb) from anon;
revoke all on function public.wa_roster() from anon;
revoke all on function public.wa_word_top(text, text[], int) from anon;
grant execute on function public.wa_submit(jsonb) to authenticated;
grant execute on function public.wa_me() to authenticated;
grant execute on function public.wa_roster() to authenticated;
grant execute on function public.wa_word_top(text, text[], int) to authenticated;
grant execute on function public.wa_ping() to anon, authenticated;
