-- AI 영작문 튜터(writing1) → Supabase (tfellow-web) 표
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 먼저 cloze/supabase_cloze.sql 이 실행돼 있어야 해요 (cz_me, cz_school, cz_stamp 함수를 같이 써요).
-- 저장 방식은 Cloze·단어숲과 같아요: (id, data jsonb), 사람 구분 uid = 소문자 이메일. 접두어 w1_

-- 제출 (예전 Firestore vocab_results 중 appTag = writing1_submission)
create table if not exists public.w1_submissions (
  id text primary key, data jsonb not null default '{}',
  uid text generated always as (lower(data ->> 'uid')) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
-- 과제 목록·Gemini 사용 여부 (id = '_settings'): 학생도 읽어요
create table if not exists public.w1_settings (
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
-- 교사 전용: 명렬표·교사 화면 시험용 Gemini 키 (id = 'config')
create table if not exists public.w1_private (
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
-- 학생 한 명의 학번·이름 (id = 이메일): 본인과 교사만 읽기
create table if not exists public.w1_students (
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index if not exists w1_sub_uid_idx on public.w1_submissions (uid);

do $$ declare t text; begin
  foreach t in array array['w1_submissions','w1_settings','w1_private','w1_students'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_stamp', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.cz_stamp()', t || '_stamp', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- 제출: 학생은 자기 것만 쓰고 읽기, 교사는 모두 읽고 고치기·지우기
drop policy if exists w1_sub_read on public.w1_submissions;
create policy w1_sub_read on public.w1_submissions for select to authenticated
  using (public.cz_school() and (uid = public.cz_me() or public.is_admin()));
drop policy if exists w1_sub_ins on public.w1_submissions;
create policy w1_sub_ins on public.w1_submissions for insert to authenticated
  with check (public.cz_school() and uid = public.cz_me() and lower(data ->> 'studentEmail') = public.cz_me());
drop policy if exists w1_sub_upd on public.w1_submissions;
create policy w1_sub_upd on public.w1_submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists w1_sub_del on public.w1_submissions;
create policy w1_sub_del on public.w1_submissions for delete to authenticated using (public.is_admin());

-- 과제 설정: 학교 계정은 읽기, 교사만 쓰기
drop policy if exists w1_set_read on public.w1_settings;
create policy w1_set_read on public.w1_settings for select to authenticated using (public.cz_school());
drop policy if exists w1_set_write on public.w1_settings;
create policy w1_set_write on public.w1_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 교사 전용 저장소: 교사만 읽고 쓰기
drop policy if exists w1_priv_all on public.w1_private;
create policy w1_priv_all on public.w1_private for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 학생 명부: 본인과 교사만 읽기, 교사만 쓰기
drop policy if exists w1_stu_read on public.w1_students;
create policy w1_stu_read on public.w1_students for select to authenticated
  using (public.is_admin() or (public.cz_school() and id = public.cz_me()));
drop policy if exists w1_stu_write on public.w1_students;
create policy w1_stu_write on public.w1_students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 실시간 (교사 대시보드 제출, 학생 과제 목록)
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['w1_submissions','w1_settings'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Firestore 기록 옮기기 (관리자만, cloze/migrate.html 이 불러요). 이미 있는 id 는 건드리지 않아요.
create or replace function public.w1_import(p_table text, p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'W1_ADMIN_ONLY' using errcode = '42501'; end if;
  if p_table not in ('w1_submissions','w1_settings','w1_private','w1_students') then
    raise exception 'W1_BAD_TABLE %', p_table;
  end if;
  execute format('insert into public.%I (id, data) select r ->> ''id'', r -> ''data'' from jsonb_array_elements($1) r
                  on conflict (id) do nothing', p_table) using p_rows;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.w1_import(text, jsonb) from public, anon;
grant execute on function public.w1_import(text, jsonb) to authenticated;
