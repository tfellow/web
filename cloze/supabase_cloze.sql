-- MY Cloze · 단어숲 → Supabase (tfellow-web) 표
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권과 같은 프로젝트·같은 구글 로그인을 써요. 관리자 = public.admins (public.is_admin()).
--
-- 저장 방식: Firestore 문서를 그대로 옮기기 위해 표마다 (id, data jsonb) 형태로 저장해요.
--   보안 규칙에 쓰는 값(만든 교사, 학생, 테스트 번호)은 data 에서 자동으로 뽑아 둔 칸(generated column)으로 확인해요.
--   사람을 구분하는 값(uid, ownerUid)은 모두 "소문자 이메일"이에요.
-- 접두어: cz_ = MY Cloze, ds_ = 단어숲

-- ===================== 공통 함수 =====================
create or replace function public.cz_me() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

-- 학교 계정(@smy.ms.kr) 또는 관리자(교사)
create or replace function public.cz_school() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.cz_me() like '%@smy.ms.kr'
$$;

-- 앱이 보낸 "__SERVER_TS__" 를 서버 시각으로 바꾸고 updated_at 을 고쳐요 (Firestore serverTimestamp 대신)
create or replace function public.cz_stamp() returns trigger
language plpgsql as $$
declare k text;
begin
  for k in select key from jsonb_each(new.data) where value = '"__SERVER_TS__"'::jsonb loop
    new.data := jsonb_set(new.data, array[k], to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
  end loop;
  new.updated_at := now();
  return new;
end $$;

-- ===================== MY Cloze =====================
create table if not exists public.cz_users (          -- 학번·실명·닉네임 (id = 이메일)
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cz_tests (          -- 테스트 (본문·정답 포함)
  id text primary key, data jsonb not null default '{}',
  owner text generated always as (lower(data ->> 'ownerUid')) stored,
  code  text generated always as (data ->> 'code') stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cz_submissions (    -- 제출 기록 (실명 포함)
  id text primary key, data jsonb not null default '{}',
  owner   text generated always as (lower(data ->> 'ownerUid')) stored,
  uid     text generated always as (lower(data ->> 'uid')) stored,
  test_id text generated always as (data ->> 'testId') stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cz_board (          -- 학생용 순위표 (닉네임·점수만)
  id text primary key, data jsonb not null default '{}',
  owner   text generated always as (lower(data ->> 'ownerUid')) stored,
  uid     text generated always as (lower(data ->> 'uid')) stored,
  test_id text generated always as (data ->> 'testId') stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cz_assignments (    -- 과제
  id text primary key, data jsonb not null default '{}',
  owner   text generated always as (lower(data ->> 'ownerUid')) stored,
  test_id text generated always as (data ->> 'testId') stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index if not exists cz_tests_owner_idx on public.cz_tests (owner);
create index if not exists cz_tests_code_idx  on public.cz_tests (code);
create index if not exists cz_sub_owner_idx   on public.cz_submissions (owner, test_id);
create index if not exists cz_sub_uid_idx     on public.cz_submissions (uid);
create index if not exists cz_board_test_idx  on public.cz_board (test_id);
create index if not exists cz_asg_owner_idx   on public.cz_assignments (owner);

do $$ declare t text; begin
  foreach t in array array['cz_users','cz_tests','cz_submissions','cz_board','cz_assignments'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_stamp', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.cz_stamp()', t || '_stamp', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- 내 정보: 본인과 교사만 읽기, 본인만 쓰기
drop policy if exists cz_users_read on public.cz_users;
create policy cz_users_read on public.cz_users for select to authenticated
  using (public.cz_school() and (id = public.cz_me() or public.is_admin()));
drop policy if exists cz_users_ins on public.cz_users;
create policy cz_users_ins on public.cz_users for insert to authenticated
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'email') = public.cz_me());
drop policy if exists cz_users_upd on public.cz_users;
create policy cz_users_upd on public.cz_users for update to authenticated
  using (id = public.cz_me())
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'email') = public.cz_me());

-- 테스트: 학교 계정은 읽기, 만든 교사만 만들기·고치기·지우기
drop policy if exists cz_tests_read on public.cz_tests;
create policy cz_tests_read on public.cz_tests for select to authenticated using (public.cz_school());
drop policy if exists cz_tests_ins on public.cz_tests;
create policy cz_tests_ins on public.cz_tests for insert to authenticated
  with check (public.is_admin() and owner = public.cz_me());
drop policy if exists cz_tests_upd on public.cz_tests;
create policy cz_tests_upd on public.cz_tests for update to authenticated
  using (public.is_admin() and owner = public.cz_me())
  with check (public.is_admin() and owner = public.cz_me());
drop policy if exists cz_tests_del on public.cz_tests;
create policy cz_tests_del on public.cz_tests for delete to authenticated
  using (public.is_admin() and owner = public.cz_me());

-- 제출: 본인·그 테스트를 만든 교사·관리자(Teacher Hub)가 읽기. 학생은 자기 이름으로만 제출.
drop policy if exists cz_sub_read on public.cz_submissions;
create policy cz_sub_read on public.cz_submissions for select to authenticated
  using (public.cz_school() and (uid = public.cz_me() or owner = public.cz_me() or public.is_admin()));
drop policy if exists cz_sub_ins on public.cz_submissions;
create policy cz_sub_ins on public.cz_submissions for insert to authenticated
  with check (public.cz_school() and uid = public.cz_me() and lower(data ->> 'email') = public.cz_me()
    and owner = (select t.owner from public.cz_tests t where t.id = test_id));
drop policy if exists cz_sub_upd on public.cz_submissions;       -- 다시 채점 (정답으로 인정)
create policy cz_sub_upd on public.cz_submissions for update to authenticated
  using (public.is_admin() and owner = public.cz_me())
  with check (public.is_admin() and owner = public.cz_me());
drop policy if exists cz_sub_del on public.cz_submissions;
create policy cz_sub_del on public.cz_submissions for delete to authenticated
  using (public.is_admin() and owner = public.cz_me());

-- 다시 채점할 때 교사도 점수·정답 여부·채점 시각 말고는 못 바꿔요
create or replace function public.cz_sub_guard() returns trigger
language plpgsql as $$
begin
  if (new.data - 'correct' - 'score' - 'regradedAt') is distinct from (old.data - 'correct' - 'score' - 'regradedAt') then
    raise exception 'CZ_REGRADE_ONLY' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists cz_submissions_guard on public.cz_submissions;
create trigger cz_submissions_guard before update on public.cz_submissions
  for each row when (current_setting('cz.import', true) is distinct from 'on') execute function public.cz_sub_guard();

-- 순위표: 학교 계정은 읽기, 학생은 자기 기록만 (실명·이메일 없이), 교사는 점수만 고치기
drop policy if exists cz_board_read on public.cz_board;
create policy cz_board_read on public.cz_board for select to authenticated using (public.cz_school());
drop policy if exists cz_board_ins on public.cz_board;
create policy cz_board_ins on public.cz_board for insert to authenticated
  with check (public.cz_school() and uid = public.cz_me() and not (data ? 'realName') and not (data ? 'email'));
drop policy if exists cz_board_upd on public.cz_board;
create policy cz_board_upd on public.cz_board for update to authenticated
  using (public.is_admin() and owner = public.cz_me())
  with check (public.is_admin() and owner = public.cz_me() and not (data ? 'realName') and not (data ? 'email'));
drop policy if exists cz_board_del on public.cz_board;
create policy cz_board_del on public.cz_board for delete to authenticated
  using (public.is_admin() and owner = public.cz_me());

-- 과제: 학교 계정은 읽기, 그 테스트를 만든 교사만 내기·고치기·취소
drop policy if exists cz_asg_read on public.cz_assignments;
create policy cz_asg_read on public.cz_assignments for select to authenticated using (public.cz_school());
drop policy if exists cz_asg_ins on public.cz_assignments;
create policy cz_asg_ins on public.cz_assignments for insert to authenticated
  with check (public.is_admin() and owner = public.cz_me()
    and exists (select 1 from public.cz_tests t where t.id = test_id and t.owner = public.cz_me()));
drop policy if exists cz_asg_upd on public.cz_assignments;
create policy cz_asg_upd on public.cz_assignments for update to authenticated
  using (public.is_admin() and owner = public.cz_me())
  with check (public.is_admin() and owner = public.cz_me());
drop policy if exists cz_asg_del on public.cz_assignments;
create policy cz_asg_del on public.cz_assignments for delete to authenticated
  using (public.is_admin() and owner = public.cz_me());

-- ===================== 단어숲 =====================
create table if not exists public.ds_users (          -- 학생·교사 정보 + 학습 통계 (id = 이메일)
  id text primary key, data jsonb not null default '{}',
  role text generated always as (data ->> 'role') stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.ds_progress (       -- 단어별 암기 상태 (id = 이메일|단어장)
  id text primary key, data jsonb not null default '{}',
  uid  text not null, book text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.ds_board (          -- 랭킹용 공개 요약 (이름·XP·연속일만)
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.ds_results (        -- 단원 테스트 결과
  id text primary key, data jsonb not null default '{}',
  uid text generated always as (lower(data ->> 'uid')) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.ds_books (          -- 교사가 올린 단어장 (+ _settings: 선생님 한마디)
  id text primary key, data jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index if not exists ds_progress_uid_idx on public.ds_progress (uid);
create index if not exists ds_results_uid_idx  on public.ds_results (uid);

do $$ declare t text; begin
  foreach t in array array['ds_users','ds_progress','ds_board','ds_results','ds_books'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_stamp', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.cz_stamp()', t || '_stamp', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- 학생 정보: 본인과 교사만 읽기, 본인만 쓰기 (학생은 role 을 student 로만)
drop policy if exists ds_users_read on public.ds_users;
create policy ds_users_read on public.ds_users for select to authenticated
  using (public.cz_school() and (id = public.cz_me() or public.is_admin()));
drop policy if exists ds_users_ins on public.ds_users;
create policy ds_users_ins on public.ds_users for insert to authenticated
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'email') = public.cz_me()
    and (role = 'student' or public.is_admin()));
drop policy if exists ds_users_upd on public.ds_users;
create policy ds_users_upd on public.ds_users for update to authenticated
  using (id = public.cz_me())
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'email') = public.cz_me()
    and (role = 'student' or public.is_admin()));
drop policy if exists ds_users_del on public.ds_users;
create policy ds_users_del on public.ds_users for delete to authenticated using (public.is_admin());

-- 암기 상태: 본인과 교사만 읽기, 본인만 쓰기
drop policy if exists ds_prog_read on public.ds_progress;
create policy ds_prog_read on public.ds_progress for select to authenticated
  using (public.cz_school() and (uid = public.cz_me() or public.is_admin()));
drop policy if exists ds_prog_ins on public.ds_progress;
create policy ds_prog_ins on public.ds_progress for insert to authenticated
  with check (public.cz_school() and uid = public.cz_me() and id = uid || '|' || book);
drop policy if exists ds_prog_upd on public.ds_progress;
create policy ds_prog_upd on public.ds_progress for update to authenticated
  using (uid = public.cz_me())
  with check (public.cz_school() and uid = public.cz_me() and id = uid || '|' || book);

-- 랭킹: 학교 계정은 읽기, 본인만 쓰기
drop policy if exists ds_board_read on public.ds_board;
create policy ds_board_read on public.ds_board for select to authenticated using (public.cz_school());
drop policy if exists ds_board_ins on public.ds_board;
create policy ds_board_ins on public.ds_board for insert to authenticated
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'uid') = public.cz_me());
drop policy if exists ds_board_upd on public.ds_board;
create policy ds_board_upd on public.ds_board for update to authenticated
  using (id = public.cz_me())
  with check (public.cz_school() and id = public.cz_me() and lower(data ->> 'uid') = public.cz_me());
drop policy if exists ds_board_del on public.ds_board;
create policy ds_board_del on public.ds_board for delete to authenticated using (public.is_admin());

-- 테스트 결과: 본인 것만 쓰기, 본인과 교사만 읽기
drop policy if exists ds_res_read on public.ds_results;
create policy ds_res_read on public.ds_results for select to authenticated
  using (public.cz_school() and (uid = public.cz_me() or public.is_admin()));
drop policy if exists ds_res_ins on public.ds_results;
create policy ds_res_ins on public.ds_results for insert to authenticated
  with check (public.cz_school() and uid = public.cz_me());
drop policy if exists ds_res_admin on public.ds_results;
create policy ds_res_admin on public.ds_results for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ds_res_del on public.ds_results;
create policy ds_res_del on public.ds_results for delete to authenticated using (public.is_admin());

-- 단어장: 학교 계정은 읽기, 교사만 추가·삭제
drop policy if exists ds_books_read on public.ds_books;
create policy ds_books_read on public.ds_books for select to authenticated using (public.cz_school());
drop policy if exists ds_books_write on public.ds_books;
create policy ds_books_write on public.ds_books for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===================== 실시간 (Cloze 결과·실시간 순위 화면) =====================
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cz_submissions') then
    execute 'alter publication supabase_realtime add table public.cz_submissions';
  end if;
end $$;

-- ===================== Firestore 기록 옮기기 (관리자만) =====================
-- cloze/migrate.html 이 Firestore 에서 읽은 문서를 이 함수로 넣어요.
-- 이미 있는 id 는 건드리지 않아요(옮긴 뒤 Supabase 에서 새로 쌓인 학습 기록을 옛 기록으로 덮지 않게). 여러 번 실행해도 안전해요.
create or replace function public.cz_import(p_table text, p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'CZ_ADMIN_ONLY' using errcode = '42501'; end if;
  if p_table not in ('cz_users','cz_tests','cz_submissions','cz_board','cz_assignments',
                     'ds_users','ds_progress','ds_board','ds_results','ds_books') then
    raise exception 'CZ_BAD_TABLE %', p_table;
  end if;
  perform set_config('cz.import', 'on', true);
  if p_table = 'ds_progress' then
    -- 옮기기 전에 새 앱에서 먼저 공부했어도 합쳐요: 옛 단어 기록 위에 새 단어 기록을 덮어써요
    insert into public.ds_progress as t (id, uid, book, data)
      select r ->> 'id', lower(r ->> 'uid'), r ->> 'book', r -> 'data' from jsonb_array_elements(p_rows) r
      on conflict (id) do update
        set data = jsonb_set(t.data, '{words}', coalesce(excluded.data -> 'words', '{}') || coalesce(t.data -> 'words', '{}'));
  elsif p_table in ('ds_users', 'ds_board') then
    -- 새 앱에서 먼저 들어와 XP 가 옛 기록보다 적으면(새로 시작한 경우) 옛 기록으로 바꿔요
    execute format('insert into public.%I as t (id, data) select r ->> ''id'', r -> ''data'' from jsonb_array_elements($1) r
                    on conflict (id) do update set data = excluded.data
                    where coalesce((t.data #>> ''{stats,xp}'')::numeric, (t.data ->> ''xp'')::numeric, 0)
                        < coalesce((excluded.data #>> ''{stats,xp}'')::numeric, (excluded.data ->> ''xp'')::numeric, 0)', p_table) using p_rows;
  else
    execute format('insert into public.%I (id, data) select r ->> ''id'', r -> ''data'' from jsonb_array_elements($1) r
                    on conflict (id) do nothing', p_table) using p_rows;
  end if;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.cz_import(text, jsonb) from public, anon;
grant execute on function public.cz_import(text, jsonb) to authenticated;

-- 설치 확인용 (로그인하지 않은 사람은 false)
create or replace function public.cz_ping() returns boolean
language sql stable as $$ select auth.uid() is not null $$;
grant execute on function public.cz_ping() to authenticated, anon;
