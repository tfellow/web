-- =====================================================================
--  MY Grammar · 데이터베이스 설정 (Supabase SQL Editor 에 붙여 넣고 Run)
--  - 기존 앱(독서 여권, 퀴즈 등)의 테이블은 건드리지 않아요.
--  - MY Grammar 의 모든 테이블·함수 이름은 mg_ 로 시작해요.
--  - 여러 번 실행해도 안전하게 만들었어요 (if not exists / or replace).
-- =====================================================================

-- ---------- 1. 설정 · 관리자 ----------
create table if not exists public.mg_settings (
  key   text primary key,
  value text
);
insert into public.mg_settings (key, value) values
  ('allow_external', 'false'),      -- true 로 바꾸면 학교 밖 구글 계정도 이용 가능
  ('school_domain',  'smy.ms.kr'),
  ('daily_goal',     '20'),         -- 하루 목표 문제 수
  ('notice',         '')            -- 학생 홈 화면 공지
on conflict (key) do nothing;

create table if not exists public.mg_admins (
  email text primary key
);
insert into public.mg_admins (email) values ('tfellow@gmail.com'), ('tfellow@smy.ms.kr')
on conflict (email) do nothing;

-- ---------- 2. 학생 ----------
create table if not exists public.mg_players (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  real_name   text,
  nickname    text,
  grade       int,
  class_no    int,
  student_no  int,
  is_school   boolean not null default true,
  xp          int not null default 0,
  combo       int not null default 0,
  combo_best  int not null default 0,
  streak      int not null default 0,
  best_streak int not null default 0,
  last_day    date,
  today_count int not null default 0,
  goal_days   int not null default 0,
  created_at  timestamptz not null default now(),
  last_at     timestamptz
);
create unique index if not exists mg_players_nick_uq on public.mg_players (lower(nickname));

-- ---------- 3. 문법 단원 · 문제 ----------
create table if not exists public.mg_topics (
  id         serial primary key,
  code       text unique not null,           -- 예: G1-01
  grade      int,                            -- 1·2·3 (중1·중2·중3), 4 = 고등 기초
  category   text,                           -- 예: 동사, 시제, 준동사
  title      text not null,                  -- 한국어 제목
  title_en   text,
  summary    text,                           -- 개념 설명 (줄바꿈 가능, **굵게** 가능)
  examples   text,                           -- 예문 (한 줄에 하나, "영어 | 해석")
  tip        text,                           -- 시험 꿀팁 / 자주 하는 실수
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mg_questions (
  id          serial primary key,
  topic_code  text not null references public.mg_topics (code) on update cascade,
  qtype       text not null check (qtype in ('mc', 'ox', 'blank', 'order', 'error')),
  prompt      text not null,
  choices     jsonb,                          -- mc: ["보기1","보기2",...]
  answer      text not null,
  explanation text,
  difficulty  int not null default 2 check (difficulty between 1 and 3),
  source      text,                           -- 출처 (교과서, 문제집 등)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  text
);
create index if not exists mg_questions_topic_idx on public.mg_questions (topic_code);

-- ---------- 4. 학습 기록 ----------
create table if not exists public.mg_attempts (
  id          bigserial primary key,
  user_id     uuid not null references public.mg_players (id) on delete cascade,
  question_id int  not null references public.mg_questions (id) on delete cascade,
  topic_code  text,
  answer      text,
  is_correct  boolean not null,
  mode        text,
  xp          int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists mg_attempts_user_idx on public.mg_attempts (user_id, created_at);
create index if not exists mg_attempts_time_idx on public.mg_attempts (created_at);
create index if not exists mg_attempts_q_idx    on public.mg_attempts (question_id);

-- 간격 반복(라이트너 상자) 진도: 문제마다 상자 0~5, 다음 복습 시각
create table if not exists public.mg_progress (
  user_id     uuid not null references public.mg_players (id) on delete cascade,
  question_id int  not null references public.mg_questions (id) on delete cascade,
  box         int  not null default 0,
  due_at      timestamptz not null default now(),
  right_n     int  not null default 0,
  wrong_n     int  not null default 0,
  last_at     timestamptz,
  primary key (user_id, question_id)
);

create table if not exists public.mg_stamps (
  user_id    uuid not null references public.mg_players (id) on delete cascade,
  topic_code text not null,
  earned_at  timestamptz not null default now(),
  primary key (user_id, topic_code)
);

create table if not exists public.mg_badges (
  user_id   uuid not null references public.mg_players (id) on delete cascade,
  code      text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);

create table if not exists public.mg_certs (
  id        bigserial primary key,
  user_id   uuid not null references public.mg_players (id) on delete cascade,
  kind      text not null,
  title     text not null,
  detail    text,
  serial    text,
  issued_at timestamptz not null default now(),
  unique (user_id, kind)
);

-- ---------- 5. 도우미 함수 ----------
create or replace function public.mg_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.mg_setting(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select value from public.mg_settings where key = p_key
$$;

create or replace function public.mg_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mg_admins where email = public.mg_email())
$$;

create or replace function public.mg_is_school() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mg_email() like '%@' || coalesce(public.mg_setting('school_domain'), 'smy.ms.kr')
$$;

create or replace function public.mg_is_allowed() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.mg_is_admin() or public.mg_is_school() or coalesce(public.mg_setting('allow_external'), 'false') = 'true')
$$;

-- 한국 시간 기준 오늘
create or replace function public.mg_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Seoul')::date $$;

-- 레벨: Lv n 이 되려면 누적 XP 50·n·(n-1) 필요 (Lv2 100, Lv3 300, Lv5 1000, Lv10 4500)
create or replace function public.mg_level(p_xp int) returns int
language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + 4 * greatest(p_xp, 0) / 50.0)) / 2)::int)
$$;

-- 답 비교용 정규화: 소문자, 따옴표 통일, 공백 정리, 끝 문장부호 제거
create or replace function public.mg_norm(p text) returns text
language sql immutable as $$
  select regexp_replace(
           regexp_replace(
             trim(lower(translate(coalesce(p, ''), '’‘“”', '''''""'))),
           '\s+', ' ', 'g'),
         '\s*[.?!]+$', '')
$$;

create or replace function public.mg_check(p_type text, p_answer text, p_given text) returns boolean
language plpgsql immutable as $$
declare alt text;
begin
  if p_type = 'ox' then
    return upper(left(trim(p_given), 1)) = upper(left(trim(p_answer), 1));
  end if;
  -- 정답 여러 개 허용: "is|'s"
  foreach alt in array string_to_array(p_answer, '|') loop
    if public.mg_norm(alt) = public.mg_norm(p_given) then return true; end if;
  end loop;
  return false;
end $$;

-- 명단(roster) 테이블이 있으면 실명·학번을 가져와요 (없으면 건너뜀)
create or replace function public.mg_roster_lookup(p_email text)
returns table (name text, grade int, class_no int, student_no int)
language plpgsql stable security definer set search_path = public as $$
begin
  if to_regclass('public.roster') is null then return; end if;
  return query execute
    'select name::text, grade::int, class_no::int, student_no::int from public.roster where lower(email) = $1 limit 1'
    using lower(p_email);
exception when others then return;
end $$;

-- ---------- 6. 학생용 RPC ----------
-- 로그인 직후 호출: 처음이면 학생 정보를 만들고, 내 정보를 돌려줘요
create or replace function public.mg_me() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := public.mg_email();
  v_name text; r record; p public.mg_players;
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not public.mg_is_allowed() then
    return jsonb_build_object('allowed', false, 'email', v_email);
  end if;
  select * into p from public.mg_players where id = v_uid;
  if not found then
    select coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name') into v_name
      from auth.users where id = v_uid;
    select * into r from public.mg_roster_lookup(v_email);
    insert into public.mg_players (id, email, real_name, grade, class_no, student_no, is_school)
    values (v_uid, v_email, coalesce(r.name, v_name), r.grade, r.class_no, r.student_no, public.mg_is_school())
    returning * into p;
  end if;
  return jsonb_build_object(
    'allowed', true,
    'is_admin', public.mg_is_admin(),
    'player', to_jsonb(p),
    'daily_goal', coalesce(public.mg_setting('daily_goal'), '20')::int,
    'notice', coalesce(public.mg_setting('notice'), ''),
    'today', public.mg_today());
end $$;

create or replace function public.mg_set_profile(p_nick text, p_grade int, p_class int, p_no int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_nick text := regexp_replace(trim(coalesce(p_nick, '')), '\s+', ' ', 'g');
begin
  if not public.mg_is_allowed() then raise exception 'NOT_ALLOWED'; end if;
  if char_length(v_nick) < 2 or char_length(v_nick) > 12 then raise exception '닉네임은 2~12글자로 정해 주세요.'; end if;
  if v_nick ~* '(시발|씨발|병신|ㅅㅂ|ㅂㅅ|fuck|shit|bitch|admin|관리자|선생님)' then raise exception '사용할 수 없는 닉네임이에요.'; end if;
  if exists (select 1 from public.mg_players where lower(nickname) = lower(v_nick) and id <> auth.uid()) then
    raise exception '이미 다른 친구가 쓰는 닉네임이에요.';
  end if;
  if p_grade is not null and (p_grade < 1 or p_grade > 6) then raise exception '학년을 확인해 주세요.'; end if;
  if p_class is not null and (p_class < 1 or p_class > 20) then raise exception '반을 확인해 주세요.'; end if;
  if p_no is not null and (p_no < 1 or p_no > 50) then raise exception '번호를 확인해 주세요.'; end if;
  update public.mg_players set nickname = v_nick, grade = p_grade, class_no = p_class, student_no = p_no
   where id = auth.uid();
  return (select to_jsonb(p) from public.mg_players p where id = auth.uid());
end $$;

-- 학생에게 보이는 문제 (정답·해설은 숨김. 순서 배열 문제는 단어를 섞어서 보냄)
create or replace view public.mg_questions_public as
select q.id, q.topic_code, q.qtype, q.prompt,
       case when q.qtype = 'order'
            then (select jsonb_agg(w order by md5(w || q.id::text)) from unnest(string_to_array(trim(q.answer), ' ')) w)
            else q.choices end as choices,
       q.difficulty
  from public.mg_questions q
  join public.mg_topics t on t.code = q.topic_code
 where q.active and t.active and public.mg_is_allowed();

create or replace view public.mg_topics_public as
select id, code, grade, category, title, title_en, summary, examples, tip, sort_order,
       (select count(*) from public.mg_questions q where q.topic_code = t.code and q.active)::int as q_count
  from public.mg_topics t
 where t.active and public.mg_is_allowed();

-- 답 제출: 채점, XP, 연속 학습, 간격 반복, 스탬프, 배지, 인증서를 한 번에 처리
create or replace function public.mg_submit(p_qid int, p_answer text, p_mode text default 'topic')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  q public.mg_questions; p public.mg_players; pr public.mg_progress;
  v_ok boolean; v_xp int := 0; v_today date := public.mg_today();
  v_goal int := coalesce(public.mg_setting('daily_goal'), '20')::int;
  v_old_level int; v_new_level int; v_goal_hit boolean := false;
  v_intervals int[] := array[0, 1, 3, 7, 14, 30];
  v_box int; v_total int; v_done int; v_stamp text := null;
  v_badges text[] := '{}'; v_certs jsonb := '[]'::jsonb;
  v_right_total int; v_review_right int; v_stamp_n int; v_topic_n int;
  b text; c record;
begin
  if not public.mg_is_allowed() then raise exception 'NOT_ALLOWED'; end if;
  select * into p from public.mg_players where id = v_uid for update;
  if not found then raise exception 'NO_PLAYER'; end if;
  select * into q from public.mg_questions where id = p_qid and active;
  if not found then raise exception 'NO_QUESTION'; end if;

  v_ok := public.mg_check(q.qtype, q.answer, p_answer);
  select * into pr from public.mg_progress where user_id = v_uid and question_id = q.id;

  -- 하루·연속 학습
  if p.last_day is distinct from v_today then
    p.streak := case when p.last_day = v_today - 1 then p.streak + 1 else 1 end;
    p.today_count := 0;
    p.last_day := v_today;
  end if;
  p.today_count := p.today_count + 1;
  if p.today_count = v_goal then v_goal_hit := true; p.goal_days := p.goal_days + 1; end if;
  p.best_streak := greatest(p.best_streak, p.streak);

  -- XP
  if v_ok then
    p.combo := p.combo + 1;
    p.combo_best := greatest(p.combo_best, p.combo);
    v_xp := 8 + q.difficulty * 2;
    if coalesce(pr.right_n, 0) >= 2 and p_mode <> 'review' then v_xp := 3; end if;   -- 이미 잘 아는 문제 반복은 조금만
    if p_mode = 'review' and pr.wrong_n > 0 then v_xp := v_xp + 5; end if;          -- 오답 복습 보너스
    v_xp := v_xp + case when p.combo >= 10 then 5 when p.combo >= 5 then 3 when p.combo >= 3 then 1 else 0 end;
  else
    p.combo := 0;
    v_xp := 1;                                                                       -- 도전 점수
  end if;
  if v_goal_hit then v_xp := v_xp + 30; end if;
  v_old_level := public.mg_level(p.xp);
  p.xp := p.xp + v_xp;
  v_new_level := public.mg_level(p.xp);

  update public.mg_players set xp = p.xp, combo = p.combo, combo_best = p.combo_best, streak = p.streak,
    best_streak = p.best_streak, last_day = p.last_day, today_count = p.today_count, goal_days = p.goal_days,
    last_at = now()
  where id = v_uid;

  insert into public.mg_attempts (user_id, question_id, topic_code, answer, is_correct, mode, xp)
  values (v_uid, q.id, q.topic_code, left(p_answer, 300), v_ok, left(coalesce(p_mode, 'topic'), 20), v_xp);

  -- 간격 반복 (맞히면 다음 상자로, 틀리면 0번 상자로 → 바로 복습 목록)
  v_box := case when v_ok then least(coalesce(pr.box, 0) + 1, 5) else 0 end;
  insert into public.mg_progress (user_id, question_id, box, due_at, right_n, wrong_n, last_at)
  values (v_uid, q.id, v_box, now() + make_interval(days => v_intervals[v_box + 1]),
          case when v_ok then 1 else 0 end, case when v_ok then 0 else 1 end, now())
  on conflict (user_id, question_id) do update set
    box = excluded.box, due_at = excluded.due_at, last_at = now(),
    right_n = mg_progress.right_n + excluded.right_n, wrong_n = mg_progress.wrong_n + excluded.wrong_n;

  -- 스탬프: 단원 문제의 80% 이상을 한 번 이상 맞히면
  if v_ok and not exists (select 1 from public.mg_stamps where user_id = v_uid and topic_code = q.topic_code) then
    select count(*) into v_total from public.mg_questions where topic_code = q.topic_code and active;
    select count(*) into v_done from public.mg_progress g join public.mg_questions qq on qq.id = g.question_id
     where g.user_id = v_uid and qq.topic_code = q.topic_code and qq.active and g.right_n > 0;
    if v_total >= 3 and v_done >= ceil(v_total * 0.8) then
      insert into public.mg_stamps (user_id, topic_code) values (v_uid, q.topic_code);
      v_stamp := q.topic_code;
    end if;
  end if;

  -- 배지
  select count(*) filter (where is_correct), count(*) filter (where is_correct and mode = 'review')
    into v_right_total, v_review_right from public.mg_attempts where user_id = v_uid;
  select count(*) into v_stamp_n from public.mg_stamps where user_id = v_uid;
  select count(*) into v_topic_n from public.mg_topics t where t.active
     and exists (select 1 from public.mg_questions qq where qq.topic_code = t.code and qq.active);
  foreach b in array array[
    case when v_right_total >= 1    then 'first' end,
    case when v_right_total >= 50   then 'right50' end,
    case when v_right_total >= 200  then 'right200' end,
    case when v_right_total >= 500  then 'right500' end,
    case when v_right_total >= 1000 then 'right1000' end,
    case when p.streak >= 3   then 'streak3' end,
    case when p.streak >= 7   then 'streak7' end,
    case when p.streak >= 30  then 'streak30' end,
    case when p.combo >= 10   then 'combo10' end,
    case when p.combo >= 25   then 'combo25' end,
    case when v_review_right >= 20  then 'review20' end,
    case when v_review_right >= 100 then 'review100' end,
    case when p.goal_days >= 1  then 'goal1' end,
    case when p.goal_days >= 10 then 'goal10' end,
    case when v_stamp_n >= 1  then 'stamp1' end,
    case when v_stamp_n >= 5  then 'stamp5' end,
    case when v_stamp_n >= 10 then 'stamp10' end,
    case when extract(hour from now() at time zone 'Asia/Seoul') between 5 and 7 then 'early' end
  ] loop
    if b is not null then
      insert into public.mg_badges (user_id, code) values (v_uid, b) on conflict do nothing;
      if found then v_badges := v_badges || b; end if;
    end if;
  end loop;

  -- 인증서 자동 발급
  for c in
    select * from (values
      ('level5',   v_new_level >= 5,  'Level 5 달성 인증서',  'Grammar Explorer · Lv.5'),
      ('level10',  v_new_level >= 10, 'Level 10 달성 인증서', 'Grammar Master · Lv.10'),
      ('level15',  v_new_level >= 15, 'Level 15 달성 인증서', 'Grammar Queen · Lv.15'),
      ('stamp5',   v_stamp_n >= 5,    '문법 스탬프 5개 인증서',  '문법 단원 5개 마스터'),
      ('stamp10',  v_stamp_n >= 10,   '문법 스탬프 10개 인증서', '문법 단원 10개 마스터'),
      ('stampall', v_topic_n >= 5 and v_stamp_n >= v_topic_n, '전 단원 완주 인증서', '모든 문법 단원 마스터'),
      ('streak30', p.streak >= 30,    '30일 연속 학습 인증서', '30일 동안 하루도 빠짐없이 공부')
    ) as t(kind, ok, title, detail)
  loop
    if c.ok then
      insert into public.mg_certs (user_id, kind, title, detail) values (v_uid, c.kind, c.title, c.detail)
      on conflict (user_id, kind) do nothing;
      if found then
        update public.mg_certs set serial = 'MYG-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMM') || '-' || lpad(id::text, 5, '0')
         where user_id = v_uid and kind = c.kind;
        v_certs := v_certs || (select to_jsonb(x) from public.mg_certs x where user_id = v_uid and kind = c.kind);
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'correct', v_ok, 'answer', q.answer, 'explanation', q.explanation,
    'xp', v_xp, 'total_xp', p.xp, 'old_level', v_old_level, 'level', v_new_level,
    'combo', p.combo, 'streak', p.streak, 'today_count', p.today_count, 'goal_hit', v_goal_hit,
    'box', v_box, 'stamp', v_stamp, 'badges', to_jsonb(v_badges), 'certs', v_certs);
end $$;

-- 순위표 (닉네임만 보여요. 외부 계정은 제외)
create or replace function public.mg_leaderboard(p_period text default 'week', p_grade int default null)
returns table (nickname text, grade int, class_no int, xp bigint, level int, is_me boolean)
language sql stable security definer set search_path = public as $$
  with s as (
    select p.id, p.nickname, p.grade, p.class_no, p.xp as total,
           coalesce((select sum(a.xp) from public.mg_attempts a where a.user_id = p.id
             and a.created_at >= case p_period
               when 'week'  then date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
               when 'month' then date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
               else '-infinity'::timestamptz end), 0) as px
      from public.mg_players p
     where p.nickname is not null and p.is_school and (p_grade is null or p.grade = p_grade)
       and not exists (select 1 from public.mg_admins m where m.email = p.email)
  )
  select nickname, grade, class_no, case when p_period = 'all' then total::bigint else px::bigint end, public.mg_level(total), id = auth.uid()
    from s
   where public.mg_is_allowed() and (case when p_period = 'all' then total else px end) > 0
   order by 4 desc, nickname
   limit 50
$$;

-- 반 대항전: 반별 이번 주 XP 합계와 1인당 평균
create or replace function public.mg_class_board(p_period text default 'week')
returns table (grade int, class_no int, members bigint, active bigint, xp bigint, avg_xp numeric, is_mine boolean)
language sql stable security definer set search_path = public as $$
  with since as (
    select case p_period
      when 'week'  then date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
      when 'month' then date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
      else '-infinity'::timestamptz end as t
  ), me as (select grade, class_no from public.mg_players where id = auth.uid())
  select p.grade, p.class_no, count(distinct p.id),
         count(distinct a.user_id), coalesce(sum(a.xp), 0)::bigint,
         round(coalesce(sum(a.xp), 0)::numeric / greatest(count(distinct p.id), 1), 1),
         (p.grade, p.class_no) = (select grade, class_no from me)
    from public.mg_players p
    left join public.mg_attempts a on a.user_id = p.id and a.created_at >= (select t from since)
   where public.mg_is_allowed() and p.is_school and p.grade is not null and p.class_no is not null
     and not exists (select 1 from public.mg_admins m where m.email = p.email)
   group by p.grade, p.class_no
   order by 6 desc
$$;

-- ---------- 7. 교사용 통계 RPC ----------
create or replace function public.mg_admin_by_student(p_from timestamptz, p_to timestamptz)
returns table (user_id uuid, attempts bigint, correct bigint, xp bigint, days bigint, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.user_id, count(*), count(*) filter (where a.is_correct), sum(a.xp),
         count(distinct (a.created_at at time zone 'Asia/Seoul')::date), max(a.created_at)
    from public.mg_attempts a
   where public.mg_is_admin() and a.created_at >= p_from and a.created_at < p_to
   group by a.user_id
$$;

create or replace function public.mg_admin_by_question(p_from timestamptz, p_to timestamptz)
returns table (question_id int, attempts bigint, correct bigint, users bigint, top_wrong text)
language sql stable security definer set search_path = public as $$
  select a.question_id, count(*), count(*) filter (where a.is_correct), count(distinct a.user_id),
         mode() within group (order by a.answer) filter (where not a.is_correct)
    from public.mg_attempts a
   where public.mg_is_admin() and a.created_at >= p_from and a.created_at < p_to
   group by a.question_id
$$;

create or replace function public.mg_admin_by_day(p_from timestamptz, p_to timestamptz)
returns table (day date, attempts bigint, correct bigint, users bigint)
language sql stable security definer set search_path = public as $$
  select (a.created_at at time zone 'Asia/Seoul')::date, count(*), count(*) filter (where a.is_correct), count(distinct a.user_id)
    from public.mg_attempts a
   where public.mg_is_admin() and a.created_at >= p_from and a.created_at < p_to
   group by 1 order by 1
$$;

create or replace function public.mg_admin_student_topics(p_user uuid)
returns table (topic_code text, attempts bigint, correct bigint, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.topic_code, count(*), count(*) filter (where a.is_correct), max(a.created_at)
    from public.mg_attempts a
   where public.mg_is_admin() and a.user_id = p_user
   group by a.topic_code
$$;

-- ---------- 8. 보안 규칙 (Row Level Security) ----------
alter table public.mg_settings  enable row level security;
alter table public.mg_admins    enable row level security;
alter table public.mg_players   enable row level security;
alter table public.mg_topics    enable row level security;
alter table public.mg_questions enable row level security;
alter table public.mg_attempts  enable row level security;
alter table public.mg_progress  enable row level security;
alter table public.mg_stamps    enable row level security;
alter table public.mg_badges    enable row level security;
alter table public.mg_certs     enable row level security;

do $$
declare t text;
begin
  -- 관리자: 모든 MY Grammar 테이블 전체 권한
  foreach t in array array['mg_settings','mg_admins','mg_players','mg_topics','mg_questions','mg_attempts','mg_progress','mg_stamps','mg_badges','mg_certs'] loop
    execute format('drop policy if exists mg_admin_all on public.%I', t);
    execute format('create policy mg_admin_all on public.%I for all to authenticated using (public.mg_is_admin()) with check (public.mg_is_admin())', t);
  end loop;
  -- 학생: 내 기록만 읽기 (쓰기는 RPC 로만)
  foreach t in array array['mg_attempts','mg_progress','mg_stamps','mg_badges','mg_certs'] loop
    execute format('drop policy if exists mg_own_read on public.%I', t);
    execute format('create policy mg_own_read on public.%I for select to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;
drop policy if exists mg_own_read on public.mg_players;
create policy mg_own_read on public.mg_players for select to authenticated using (id = auth.uid());

grant select on public.mg_questions_public, public.mg_topics_public to authenticated;
revoke all on public.mg_questions_public, public.mg_topics_public from anon;

-- 테이블 권한 (보안은 위의 RLS 규칙이 지켜요)
grant select, insert, update, delete on
  public.mg_settings, public.mg_admins, public.mg_players, public.mg_topics, public.mg_questions,
  public.mg_attempts, public.mg_progress, public.mg_stamps, public.mg_badges, public.mg_certs
  to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.mg_me(), public.mg_set_profile(text, int, int, int), public.mg_submit(int, text, text),
  public.mg_leaderboard(text, int), public.mg_class_board(text), public.mg_admin_by_student(timestamptz, timestamptz),
  public.mg_admin_by_question(timestamptz, timestamptz), public.mg_admin_by_day(timestamptz, timestamptz),
  public.mg_admin_student_topics(uuid), public.mg_is_admin(), public.mg_is_allowed() to authenticated;

-- 끝! 이어서 02_sample_data.sql 을 실행하면 샘플 단원·문제가 들어가요.
