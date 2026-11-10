-- MY Level Test (영어 레벨 테스트) 표
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권과 같은 프로젝트·같은 로그인(is_admin, roster)을 써요.

-- 1) 응시 결과 (시험 1번 = 1행)
create table if not exists public.lt_attempts (
  id            bigserial primary key,
  user_id       uuid not null default auth.uid(),
  email         text not null,
  started_at    timestamptz,
  finished_at   timestamptz not null default now(),
  duration_sec  int,
  overall_cefr  text,          -- A0(Pre-A1) / A1 / A2 / B1 / B2 / C1
  overall_sub   text,          -- 하 / 중 / 상
  overall_theta real,
  vocab_size    int,
  vocab_cefr    text,
  lang_cefr     text,
  read_cefr     text,
  lexile        int,
  ar            real,
  flags         text[] not null default '{}',
  result        jsonb not null,  -- 화면에 보이는 결과 전체
  responses     jsonb not null   -- 문항별 응답 (문항 분석·보정용)
);
create index if not exists lt_attempts_email_idx on public.lt_attempts (email, finished_at desc);

-- 2) 설정 (교사만 바꿀 수 있어요)
create table if not exists public.lt_settings (
  key   text primary key,
  value jsonb not null
);
insert into public.lt_settings (key, value) values
  ('open', 'true'), ('retake_days', '14'), ('allow_external', 'false'), ('item_b', '{}')
on conflict (key) do nothing;

-- 응시 가능: 교사, 학교 계정(@smy.ms.kr), 또는 외부 허용이 켜져 있을 때
create or replace function public.lt_can() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
      or coalesce((select value = 'true'::jsonb from public.lt_settings where key = 'allow_external'), false)
$$;

-- 재응시 간격·응시 열림을 서버에서도 지켜요 (교사는 예외)
create or replace function public.lt_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare d int; o boolean; last timestamptz;
begin
  if public.is_admin() then return new; end if;
  select (value #>> '{}')::boolean into o from public.lt_settings where key = 'open';
  if coalesce(o, true) = false then raise exception 'LT_CLOSED'; end if;
  select (value #>> '{}')::int into d from public.lt_settings where key = 'retake_days';
  select max(finished_at) into last from public.lt_attempts where user_id = new.user_id;
  if last is not null and coalesce(d, 0) > 0 and last > now() - make_interval(days => d) then
    raise exception 'LT_COOLDOWN';
  end if;
  new.finished_at := now();
  return new;
end $$;
drop trigger if exists lt_before_insert on public.lt_attempts;
create trigger lt_before_insert before insert on public.lt_attempts
  for each row execute function public.lt_before_insert();

alter table public.lt_attempts enable row level security;
alter table public.lt_settings enable row level security;

drop policy if exists lt_att_read on public.lt_attempts;
create policy lt_att_read on public.lt_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists lt_att_insert on public.lt_attempts;
create policy lt_att_insert on public.lt_attempts for insert to authenticated
  with check (user_id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email') and public.lt_can());
drop policy if exists lt_att_delete on public.lt_attempts;
create policy lt_att_delete on public.lt_attempts for delete to authenticated
  using (public.is_admin());

drop policy if exists lt_set_read on public.lt_settings;
create policy lt_set_read on public.lt_settings for select to authenticated using (true);
drop policy if exists lt_set_write on public.lt_settings;
create policy lt_set_write on public.lt_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.lt_attempts, public.lt_settings from anon;
grant select, insert, delete on public.lt_attempts to authenticated;
grant select, insert, update, delete on public.lt_settings to authenticated;
grant usage, select on sequence public.lt_attempts_id_seq to authenticated;
