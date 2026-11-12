-- MY Brain Up (랜덤 상식 퀴즈) 표 · 함수
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권과 같은 프로젝트·같은 로그인(is_admin, roster)을 써요.
--
-- 정답은 학생 화면으로 내려가지 않아요. 문제를 고르는 일(bu_next)과 채점(bu_answer)을 모두 서버에서 해서
-- 개발자 도구로 정답을 훔쳐보거나, 쉬운 문제만 골라 점수를 쌓을 수 없어요.
-- 기록은 "학생 × 날짜" 합계(bu_daily)와 "학생 × 문제" 상태(bu_qstate)만 저장해서 무료 용량(500MB)을 아껴요.

-- ======================================================================
-- 1) 표
-- ======================================================================
create table if not exists public.bu_questions (
  id         bigserial primary key,
  category   text not null check (category in ('kor','eng','math','soc','sci','art','eco','it')),
  qtype      text not null check (qtype in ('mc','sa')),      -- mc 객관식(4지선다) / sa 단답형
  lang       text not null default 'ko' check (lang in ('ko','en')),
  question   text not null,
  choices    text[],                                          -- 객관식 보기 4개
  answer     text not null,                                   -- 객관식 '1'~'4' / 단답형 '정답|다른 정답'
  explain    text,                                            -- 해설 한 줄 (선택)
  ko         text,                                            -- 영어 문제의 한국어 번역 (선택, 힌트로 씀)
  grade      smallint,
  level      smallint,
  active     boolean not null default true,
  batch      text,                                            -- 올린 묶음 이름 (한꺼번에 지우기용)
  created_at timestamptz not null default now(),
  created_by text default lower(auth.jwt() ->> 'email')
);
create index if not exists bu_questions_pick_idx on public.bu_questions (active, lang, qtype, category);

create table if not exists public.bu_profile (
  user_id    uuid primary key,
  email      text not null,
  nickname   text not null,
  badges     text[] not null default '{}',                    -- 모은 분야 배지
  crown_day  date,                                            -- 왕관 찬스를 받은 날 (하루 1번)
  items      jsonb not null default '{}',                     -- {"day":"2026-11-10","fifty":1,"skip":0}
  created_at timestamptz not null default now()
);
-- 분야 배지 단계 {"sci":2,...} (0 없음 · 1 브론즈 25% · 2 실버 50% · 3 골드 75% · 4 퀸 100%, 내려가지 않아요)
alter table public.bu_profile add column if not exists tiers jsonb not null default '{}';
-- 👑 왕관 찬스: 다음 문제 점수 2배
alter table public.bu_profile add column if not exists double_next boolean not null default false;
-- 🙈 순위표에서 내 이름(닉네임) 빼기 (선생님 화면에는 그대로 보여요)
alter table public.bu_profile add column if not exists hide_rank boolean not null default false;

create table if not exists public.bu_daily (
  user_id uuid not null,
  email   text not null,
  day     date not null,
  n       int not null default 0,  ok    int not null default 0,  pts int not null default 0,
  mc_n    int not null default 0,  mc_ok int not null default 0,
  sa_n    int not null default 0,  sa_ok int not null default 0,
  en_n    int not null default 0,  en_ok int not null default 0,
  cats    jsonb not null default '{}',                        -- {"sci":[푼 수, 맞힌 수], ...}
  d10     jsonb not null default '[]',                        -- 오늘의 10문제 결과 [1,0,1,...]
  primary key (user_id, day)
);
create index if not exists bu_daily_day_idx on public.bu_daily (day);
-- 🌅 아침 보너스: 오늘의 10문제를 다 푼 시각 + 아침 시간 안에 끝냈는지
alter table public.bu_daily add column if not exists d10_at  timestamptz;
alter table public.bu_daily add column if not exists morning boolean not null default false;
-- 📅 오늘의 10문제 통계: 첫 문제를 받은 시각 + 10문제에서 얻은 점수(보너스 포함)
alter table public.bu_daily add column if not exists d10_start timestamptz;
alter table public.bu_daily add column if not exists d10_pts   int not null default 0;

create table if not exists public.bu_qstate (
  user_id uuid not null,
  qid     bigint not null references public.bu_questions(id) on delete cascade,
  tries   int not null default 0,
  correct int not null default 0,
  last_ok boolean not null default false,
  last_at timestamptz not null default now(),
  primary key (user_id, qid)
);
create index if not exists bu_qstate_qid_idx on public.bu_qstate (qid);

-- 지금 풀고 있는 문제 1개 (학생당 1행, 화면에서 직접 못 읽어요)
create table if not exists public.bu_ticket (
  user_id   uuid primary key,
  qid       bigint references public.bu_questions(id) on delete cascade,
  mode      text not null default 'random',
  crown     boolean not null default false,
  issued_at timestamptz not null default now(),
  limit_sec int not null default 30,
  hint      boolean not null default false,
  fifty_rm  int[]
);

-- 오늘의 10문제 (날짜마다 한 번 정해지면 그날은 그대로)
create table if not exists public.bu_d10 (
  day  date primary key,
  qids bigint[] not null
);

create table if not exists public.bu_settings (
  key   text primary key,
  value jsonb not null
);
insert into public.bu_settings (key, value) values
  ('open', 'true'), ('english_ratio', '0.2'), ('english_day', '""'),
  ('allow_external', 'false'), ('timer', 'true'), ('crown_rate', '0.05'),
  ('morning', '{"on": true, "from": "06:00", "to": "08:55", "pts": 3, "weekdays": true}')
on conflict (key) do nothing;

-- ======================================================================
-- 2) 도우미 (학생이 직접 부를 수 없게 막아 둬요)
-- ======================================================================
create or replace function public.bu_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Seoul')::date $$;

create or replace function public.bu_set(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select value from public.bu_settings where key = p_key
$$;

create or replace function public.bu_norm(t text) returns text
language sql immutable as $$
  select regexp_replace(lower(coalesce(t, '')), '[[:space:][:punct:]·“”‘’…]', '', 'g')
$$;

create or replace function public.bu_can() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
      or coalesce(public.bu_set('allow_external') = 'true'::jsonb, false)
$$;

create or replace function public.bu_qjson(q public.bu_questions, t public.bu_ticket) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'qid', q.id, 'category', q.category, 'qtype', q.qtype, 'lang', q.lang,
    'question', q.question, 'choices', to_jsonb(q.choices),
    'has_ko', coalesce(q.ko, '') <> '',
    'limit', t.limit_sec,
    'left', greatest(0, t.limit_sec - floor(extract(epoch from now() - t.issued_at))::int),
    'mode', t.mode,
    'fifty', to_jsonb(t.fifty_rm),
    'hint', case when t.hint then q.ko end)
$$;

-- 채점 + 기록 (bu_answer, 시간 초과에서만 불러요)
create or replace function public.bu_grade(p_uid uuid, t public.bu_ticket, p_given text, p_timeout boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  q public.bu_questions; d date := public.bu_today(); okb boolean := false; oki int; v_pts int := 0;
  em text := lower(coalesce(auth.jwt() ->> 'email', '')); d10len int := 0; dbl boolean := false;
  mset jsonb; mon boolean := false; mpts int := 0; kst timestamp := now() at time zone 'Asia/Seoul';
begin
  select * into q from public.bu_questions where id = t.qid;
  if q.id is null then
    delete from public.bu_ticket where user_id = p_uid;
    return jsonb_build_object('ok', false, 'gone', true);
  end if;
  if not p_timeout then
    if q.qtype = 'mc' then
      okb := trim(coalesce(p_given, '')) = trim(q.answer);
    else
      okb := exists (select 1 from unnest(string_to_array(q.answer, '|')) a
                     where public.bu_norm(a) <> '' and public.bu_norm(a) = public.bu_norm(p_given));
    end if;
  end if;
  oki := okb::int;
  if okb then
    v_pts := case when q.qtype = 'sa' then 2 else 1 end + case when q.lang = 'en' and not t.hint then 1 else 0 end;
  end if;
  -- 👑 왕관 찬스를 받았으면 이번 문제 점수 2배 (맞혀도 틀려도 한 번 쓰면 끝)
  update public.bu_profile set double_next = false where user_id = p_uid and double_next returning true into dbl;
  dbl := coalesce(dbl, false);
  if dbl then v_pts := v_pts * 2; end if;

  insert into public.bu_qstate as s (user_id, qid, tries, correct, last_ok, last_at)
  values (p_uid, q.id, 1, oki, okb, now())
  on conflict (user_id, qid) do update
    set tries = s.tries + 1, correct = s.correct + oki, last_ok = okb, last_at = now();

  insert into public.bu_daily (user_id, email, day) values (p_uid, em, d) on conflict do nothing;
  update public.bu_daily b set
    n = b.n + 1, ok = b.ok + oki,
    mc_n = b.mc_n + (q.qtype = 'mc')::int, mc_ok = b.mc_ok + (q.qtype = 'mc' and okb)::int,
    sa_n = b.sa_n + (q.qtype = 'sa')::int, sa_ok = b.sa_ok + (q.qtype = 'sa' and okb)::int,
    en_n = b.en_n + (q.lang = 'en')::int,  en_ok = b.en_ok + (q.lang = 'en' and okb)::int,
    cats = jsonb_set(b.cats, array[q.category], jsonb_build_array(
             coalesce((b.cats -> q.category ->> 0)::int, 0) + 1,
             coalesce((b.cats -> q.category ->> 1)::int, 0) + oki)),
    d10 = case when t.mode = 'daily' then b.d10 || to_jsonb(oki) else b.d10 end
  where b.user_id = p_uid and b.day = d
  returning jsonb_array_length(b.d10) into d10len;

  -- 오늘의 10문제를 다 풀면 +3
  if t.mode = 'daily' and d10len = 10 then
    v_pts := v_pts + 3;
    -- 🌅 아침 보너스: 선생님이 정한 시간(한국 시간) 안에 10문제를 끝내면 + 보너스
    mset := public.bu_set('morning');
    if coalesce((mset ->> 'on')::boolean, false)
       and (not coalesce((mset ->> 'weekdays')::boolean, true) or extract(isodow from kst) <= 5)
       and kst::time >= coalesce(mset ->> 'from', '06:00')::time
       and kst::time < coalesce(mset ->> 'to', '08:55')::time + interval '1 minute' then
      mon := true; mpts := greatest(0, least(10, coalesce((mset ->> 'pts')::int, 3)));
      v_pts := v_pts + mpts;
    end if;
    update public.bu_daily b set d10_at = now(), morning = mon where b.user_id = p_uid and b.day = d;
  end if;
  if v_pts > 0 then
    update public.bu_daily b set pts = b.pts + v_pts,
      d10_pts = b.d10_pts + case when t.mode = 'daily' then v_pts else 0 end
    where b.user_id = p_uid and b.day = d;
  end if;

  delete from public.bu_ticket where user_id = p_uid;
  return jsonb_build_object(
    'ok', okb, 'timeout', p_timeout, 'points', v_pts, 'qid', q.id, 'qtype', q.qtype, 'lang', q.lang,
    'category', q.category, 'answer', q.answer, 'choices', to_jsonb(q.choices),
    'explain', q.explain, 'ko', q.ko, 'double', dbl, 'mode', t.mode, 'd10len', d10len,
    'morning', mon, 'morning_pts', mpts);
end $$;

revoke execute on function public.bu_set(text), public.bu_qjson(public.bu_questions, public.bu_ticket),
  public.bu_grade(uuid, public.bu_ticket, text, boolean) from public, anon, authenticated;

-- ======================================================================
-- 3) 학생이 부르는 함수
-- ======================================================================
-- 닉네임 정하기 (처음 한 번, 언제든 바꿀 수 있어요)
create or replace function public.bu_set_nick(p_nick text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare nk text := left(regexp_replace(trim(coalesce(p_nick, '')), '\s+', ' ', 'g'), 12);
begin
  if auth.uid() is null or not public.bu_can() then raise exception 'BU_DENIED'; end if;
  if char_length(nk) < 1 then raise exception 'BU_NICK'; end if;
  insert into public.bu_profile (user_id, email, nickname)
  values (auth.uid(), lower(auth.jwt() ->> 'email'), nk)
  on conflict (user_id) do update set nickname = excluded.nickname, email = excluded.email;
  return jsonb_build_object('nickname', nk);
end $$;

-- 다음 문제 받기. p_mode: random(랜덤) / daily(오늘의 10문제) / review(오답 다시 풀기)
-- p_qtype: null(랜덤) / 'mc' / 'sa'
create or replace function public.bu_next(p_mode text default 'random', p_qtype text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); d date := public.bu_today(); t public.bu_ticket; q public.bu_questions;
  prof public.bu_profile; ratio real; want text; cat text; qid_ bigint := null; step int;
  lim int; set10 bigint[]; done10 int := 0; en_k int; mode_ text := coalesce(p_mode, 'random');
begin
  if uid is null or not public.bu_can() then raise exception 'BU_DENIED'; end if;
  if not public.is_admin() and coalesce(public.bu_set('open') = 'false'::jsonb, false) then raise exception 'BU_CLOSED'; end if;
  select * into prof from public.bu_profile where user_id = uid;
  if prof.user_id is null then raise exception 'BU_NO_PROFILE'; end if;
  if p_qtype is not null and p_qtype not in ('mc', 'sa') then p_qtype := null; end if;

  -- 풀던 문제가 있으면 그 문제를 그대로 (새로고침으로 문제 바꾸기 방지). 시간이 지났으면 오답 처리
  select * into t from public.bu_ticket where user_id = uid;
  if t.user_id is not null then
    if t.crown then return jsonb_build_object('crown', true); end if;
    if now() - t.issued_at <= make_interval(secs => t.limit_sec + 5) then
      select * into q from public.bu_questions where id = t.qid;
      if q.id is not null then
        return public.bu_qjson(q, t) || jsonb_build_object('resumed', true, 'idx', case when t.mode = 'daily' then
          coalesce((select jsonb_array_length(b.d10) from public.bu_daily b where b.user_id = uid and b.day = d), 0) + 1 end);
      end if;
    end if;
    perform public.bu_grade(uid, t, null, true);
  end if;

  ratio := coalesce((public.bu_set('english_ratio') #>> '{}')::real, 0.2);
  if (public.bu_set('english_day') #>> '{}') = d::text then ratio := 1; end if;

  if mode_ = 'daily' then
    select qids into set10 from public.bu_d10 where day = d;
    if set10 is null then
      en_k := round(10 * ratio);
      with en as (select id from public.bu_questions where active and lang = 'en' order by md5(id::text || d::text) limit en_k),
           ko as (select id from public.bu_questions where active and lang = 'ko' and id not in (select id from en)
                  order by md5(id::text || d::text) limit 10),
           pick as (select id from en union all select id from ko),
           top10 as (select id from pick limit 10),
           fill as (select id from public.bu_questions where active and id not in (select id from top10)
                    order by md5(id::text || d::text) limit greatest(0, 10 - (select count(*) from top10)))
      select array_agg(id order by md5(id::text || 'mix' || d::text)) into set10
      from (select id from top10 union all select id from fill) z;
      if set10 is null then return jsonb_build_object('empty', true); end if;
      insert into public.bu_d10 (day, qids) values (d, set10) on conflict (day) do nothing;
      select qids into set10 from public.bu_d10 where day = d;
    end if;
    select coalesce(jsonb_array_length(d10), 0) into done10 from public.bu_daily where user_id = uid and day = d;
    done10 := coalesce(done10, 0);
    if done10 >= array_length(set10, 1) then return jsonb_build_object('daily_done', true); end if;
    qid_ := set10[done10 + 1];
    -- 그 문제가 지워졌거나 꺼졌으면 다른 문제로 바꿔 끼워요 (모두에게 같은 자리, 같은 문제)
    if not exists (select 1 from public.bu_questions where id = qid_ and active) then
      select id into qid_ from public.bu_questions where active and id <> all(set10) order by md5(id::text || d::text) limit 1;
      if qid_ is null then return jsonb_build_object('daily_done', true); end if;
      update public.bu_d10 set qids[done10 + 1] = qid_ where day = d;
    end if;
    -- 첫 문제를 받은 시각 (걸린 시간 계산용, 처음 한 번만)
    if done10 = 0 then
      insert into public.bu_daily (user_id, email, day) values (uid, lower(coalesce(auth.jwt() ->> 'email', '')), d) on conflict do nothing;
      update public.bu_daily set d10_start = coalesce(d10_start, now()) where user_id = uid and day = d;
    end if;

  elsif mode_ = 'review' then
    select s.qid into qid_ from public.bu_qstate s join public.bu_questions bq on bq.id = s.qid and bq.active
    where s.user_id = uid and not s.last_ok order by random() limit 1;
    if qid_ is null then return jsonb_build_object('empty', true); end if;

  else
    mode_ := 'random';
    -- 👑 왕관 찬스: 하루 1번, 다음 문제 점수 2배
    if prof.crown_day is distinct from d and not prof.double_next
       and random() < coalesce((public.bu_set('crown_rate') #>> '{}')::real, 0.05) then
      insert into public.bu_ticket (user_id, qid, mode, crown, issued_at, limit_sec, hint, fifty_rm)
      values (uid, null, 'random', true, now(), 0, false, null)
      on conflict (user_id) do update set qid = null, mode = 'random', crown = true, issued_at = now(), limit_sec = 0, hint = false, fifty_rm = null;
      return jsonb_build_object('crown', true);
    end if;
    want := case when random() < ratio then 'en' else 'ko' end;
    -- 1: 원하는 언어 + 아직 못 맞힌 문제 → 2: 원하는 언어 전체 → 3: 모든 언어 + 못 맞힌 → 4: 전체
    -- 분야를 먼저 골고루 뽑고, 그 분야 안에서 문제를 뽑아요
    for step in 1..4 loop
      select x.category into cat from (
        select distinct bq.category from public.bu_questions bq
        where bq.active and (p_qtype is null or bq.qtype = p_qtype)
          and (step > 2 or bq.lang = want)
          and (step in (2, 4) or not exists (select 1 from public.bu_qstate s where s.user_id = uid and s.qid = bq.id and s.correct > 0))
      ) x order by random() limit 1;
      if cat is not null then
        select bq.id into qid_ from public.bu_questions bq
        where bq.active and bq.category = cat and (p_qtype is null or bq.qtype = p_qtype)
          and (step > 2 or bq.lang = want)
          and (step in (2, 4) or not exists (select 1 from public.bu_qstate s where s.user_id = uid and s.qid = bq.id and s.correct > 0))
        order by random() limit 1;
        exit;
      end if;
    end loop;
    if qid_ is null then return jsonb_build_object('empty', true); end if;
  end if;

  select * into q from public.bu_questions where id = qid_;
  if coalesce(public.bu_set('timer') = 'false'::jsonb, false) then lim := 600;
  else lim := case when q.qtype = 'sa' then 45 else 30 end + case when q.lang = 'en' then 10 else 0 end;
  end if;
  insert into public.bu_ticket (user_id, qid, mode, crown, issued_at, limit_sec, hint, fifty_rm)
  values (uid, q.id, mode_, false, now(), lim, false, null)
  on conflict (user_id) do update set qid = excluded.qid, mode = excluded.mode, crown = false,
    issued_at = now(), limit_sec = excluded.limit_sec, hint = false, fifty_rm = null
  returning * into t;
  return public.bu_qjson(q, t) || jsonb_build_object('idx', case when mode_ = 'daily' then done10 + 1 end);
end $$;

-- 답 내기
create or replace function public.bu_answer(p_given text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.bu_ticket;
begin
  if uid is null or not public.bu_can() then raise exception 'BU_DENIED'; end if;
  select * into t from public.bu_ticket where user_id = uid for update;
  if t.user_id is null or t.crown then raise exception 'BU_NO_TICKET'; end if;
  return public.bu_grade(uid, t, p_given, now() - t.issued_at > make_interval(secs => t.limit_sec + 5));
end $$;

-- 🙈 순위표에서 나 빼기 / 다시 넣기
create or replace function public.bu_set_hide(p_hide boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.bu_can() then raise exception 'BU_DENIED'; end if;
  update public.bu_profile set hide_rank = coalesce(p_hide, false) where user_id = auth.uid();
  return coalesce(p_hide, false);
end $$;

-- 아이템 사용 횟수 (하루 3번씩)
create or replace function public.bu_use_item(p_item text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it jsonb; d text := public.bu_today()::text; used int;
begin
  select items into it from public.bu_profile where user_id = uid for update;
  if it is null then raise exception 'BU_NO_PROFILE'; end if;
  if coalesce(it ->> 'day', '') <> d then it := jsonb_build_object('day', d, 'fifty', 0, 'skip', 0); end if;
  used := coalesce((it ->> p_item)::int, 0);
  if used >= 3 then raise exception 'BU_LIMIT'; end if;
  it := jsonb_set(it, array[p_item], to_jsonb(used + 1));
  update public.bu_profile set items = it where user_id = uid;
  return 3 - (used + 1);
end $$;
revoke execute on function public.bu_use_item(text) from public, anon, authenticated;

-- 50:50 (객관식에서 오답 2개 지우기)
create or replace function public.bu_fifty() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.bu_ticket; q public.bu_questions; rm int[]; left_ int;
begin
  select * into t from public.bu_ticket where user_id = uid for update;
  if t.user_id is null or t.crown then raise exception 'BU_NO_TICKET'; end if;
  if t.fifty_rm is not null then return jsonb_build_object('removed', to_jsonb(t.fifty_rm)); end if;
  select * into q from public.bu_questions where id = t.qid;
  if q.qtype <> 'mc' then raise exception 'BU_NOT_MC'; end if;
  left_ := public.bu_use_item('fifty');
  select array_agg(i) into rm from (
    select i from generate_series(1, coalesce(array_length(q.choices, 1), 0)) i
    where i::text <> trim(q.answer) order by random() limit 2) z;
  update public.bu_ticket set fifty_rm = rm where user_id = uid;
  return jsonb_build_object('removed', to_jsonb(rm), 'left', left_);
end $$;

-- 건너뛰기 (기록 없이 넘어가요, 오늘의 10문제에서는 못 써요)
create or replace function public.bu_skip() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.bu_ticket; left_ int;
begin
  select * into t from public.bu_ticket where user_id = uid for update;
  if t.user_id is null or t.crown then raise exception 'BU_NO_TICKET'; end if;
  if t.mode = 'daily' then raise exception 'BU_NO_SKIP'; end if;
  left_ := public.bu_use_item('skip');
  delete from public.bu_ticket where user_id = uid;
  return jsonb_build_object('left', left_);
end $$;

-- 한국어 보기 (영어 문제 힌트: 보너스 +1이 사라져요)
create or replace function public.bu_hint() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.bu_ticket; q public.bu_questions;
begin
  select * into t from public.bu_ticket where user_id = uid for update;
  if t.user_id is null or t.crown then raise exception 'BU_NO_TICKET'; end if;
  select * into q from public.bu_questions where id = t.qid;
  update public.bu_ticket set hint = true where user_id = uid;
  return jsonb_build_object('ko', q.ko);
end $$;

-- 👑 왕관 찬스로 배지 고르기
create or replace function public.bu_claim_crown(p_cat text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.bu_ticket;
begin
  select * into t from public.bu_ticket where user_id = uid for update;
  if t.user_id is null or not t.crown then raise exception 'BU_NO_TICKET'; end if;
  update public.bu_profile set double_next = true, crown_day = public.bu_today() where user_id = uid;
  delete from public.bu_ticket where user_id = uid;
  return jsonb_build_object('double', true);
end $$;

-- 오답 노트 (틀린 뒤 아직 다시 맞히지 못한 문제)
create or replace function public.bu_wrong_list() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'qid', q.id, 'category', q.category, 'qtype', q.qtype, 'lang', q.lang, 'question', q.question,
    'choices', to_jsonb(q.choices), 'answer', q.answer, 'explain', q.explain, 'ko', q.ko,
    'tries', s.tries, 'at', s.last_at) order by s.last_at desc), '[]'::jsonb)
  from (select * from public.bu_qstate where user_id = auth.uid() and not last_ok order by last_at desc limit 100) s
  join public.bu_questions q on q.id = s.qid and q.active
$$;

-- 순위. p_scope: week(이번 주) / all(전체) / acc(정답률, 20문제 이상) / class(반 대항전, 이번 주)
create or replace function public.bu_board(p_scope text default 'week') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d date := public.bu_today(); ws date := date_trunc('week', public.bu_today())::date; adm boolean := public.is_admin(); res jsonb;
begin
  if auth.uid() is null or not public.bu_can() then raise exception 'BU_DENIED'; end if;
  if p_scope = 'class' then
    with r as (select lower(email) email, grade, class_no from public.roster where grade is not null and class_no is not null),
         sz as (select grade, class_no, count(*) n from r group by 1, 2),
         w as (select lower(b.email) email, sum(b.pts) pts, sum(b.n) n, sum(b.ok) ok from public.bu_daily b where b.day >= ws group by 1),
         c as (select r.grade, r.class_no, coalesce(sum(w.pts), 0) pts, coalesce(sum(w.n), 0) n, coalesce(sum(w.ok), 0) ok,
                      count(w.email) players from r left join w on w.email = r.email group by 1, 2)
    select coalesce(jsonb_agg(to_jsonb(z) order by z.rank), '[]'::jsonb) into res from (
      select rank() over (order by round(c.pts::numeric / sz.n, 1) desc) as rank, c.grade, c.class_no, sz.n as size, c.players, c.pts, c.n, c.ok,
             round(c.pts::numeric / sz.n, 1) as avg_pts
      from c join sz using (grade, class_no)) z;
    return res;
  end if;

  with b as (
    select user_id, sum(pts) pts, sum(n) n, sum(ok) ok from public.bu_daily
    where (p_scope = 'all' or p_scope = 'acc' or day >= ws) group by user_id),
  f as (
    select b.*, p.nickname, p.email, p.tiers, p.hide_rank, r.grade, r.class_no, r.name,
           case when b.n > 0 then round(100.0 * b.ok / b.n, 1) else 0 end acc
    from b join public.bu_profile p using (user_id)
    left join public.roster r on lower(r.email) = lower(p.email)
    where (p_scope <> 'acc' or b.n >= 20)
      and (not p.hide_rank or p.user_id = auth.uid() or adm)),
  rk as (
    select f.*, case when p_scope = 'acc' then rank() over (order by f.acc desc, f.n desc)
                     else rank() over (order by f.pts desc, f.ok desc) end as rank from f)
  select coalesce(jsonb_agg(jsonb_build_object(
      'rank', rank, 'nickname', nickname, 'grade', grade, 'class_no', class_no, 'pts', pts, 'n', n, 'ok', ok, 'acc', acc,
      'queen', (select coalesce(min(coalesce((tiers ->> c)::int, 0)), 0) from unnest(array['kor','eng','math','soc','sci','art','eco','it']) c),
      'tiers', (select coalesce(sum(coalesce((tiers ->> c)::int, 0)), 0) from unnest(array['kor','eng','math','soc','sci','art','eco','it']) c),
      'me', user_id = auth.uid(), 'hidden', hide_rank,
      'name', case when adm then name end, 'email', case when adm then email end) order by rank), '[]'::jsonb) into res
  from rk where rank <= case when adm then 100000 else 50 end or user_id = auth.uid();
  return res;
end $$;

-- 교사용: 문제별 응답 수·정답 수
create or replace function public.bu_qstats() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce(jsonb_object_agg(qid, jsonb_build_array(p, t, c)), '{}'::jsonb) end
  from (select qid, count(*) p, sum(tries) t, sum(correct) c from public.bu_qstate group by qid) z
$$;

-- 문제 은행 크기 (켜진 문제 수만, 문제 내용·정답은 안 보여요) + 내가 맞힌 문제 수
-- 분야별로 "몇 문제 중 몇 문제 정복(한 번이라도 맞힘)"을 세고, 배지 단계를 올려요 (내려가지 않아요)
create or replace function public.bu_counts() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); res jsonb; v_cats jsonb; v_mine jsonb; v_old jsonb; v_new jsonb := '{}';
  c text; qn int; mn int; tr int; v_queen int := 4; v_name text;
begin
  select coalesce(jsonb_object_agg(category, k), '{}'::jsonb) into v_cats
  from (select category, count(*) k from public.bu_questions where active group by 1) z;
  select coalesce(jsonb_object_agg(category, k), '{}'::jsonb) into v_mine
  from (select q.category, count(*) k from public.bu_qstate s join public.bu_questions q on q.id = s.qid and q.active
        where s.user_id = uid and s.correct > 0 group by 1) z;
  select tiers into v_old from public.bu_profile where user_id = uid;
  foreach c in array array['kor','eng','math','soc','sci','art','eco','it'] loop
    qn := coalesce((v_cats ->> c)::int, 0); mn := coalesce((v_mine ->> c)::int, 0);
    tr := case when qn = 0 then 0 when mn >= qn then 4 when mn * 4 >= qn * 3 then 3 when mn * 2 >= qn then 2 when mn * 4 >= qn then 1 else 0 end;
    tr := greatest(tr, coalesce((v_old ->> c)::int, 0));
    v_new := v_new || jsonb_build_object(c, tr);
    v_queen := least(v_queen, tr);
  end loop;
  if v_old is not null and v_old is distinct from v_new then
    update public.bu_profile set tiers = v_new where user_id = uid;
  end if;
  select r.name into v_name from public.roster r where lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1;
  select jsonb_build_object('total', count(*), 'en', count(*) filter (where lang = 'en'),
    'mc', count(*) filter (where qtype = 'mc'), 'sa', count(*) filter (where qtype = 'sa')) into res
  from public.bu_questions where active;
  return res || jsonb_build_object('cats', v_cats, 'mine_cats', v_mine,
    'mine', (select coalesce(sum(value::int), 0) from jsonb_each_text(v_mine)),
    'tiers', case when v_old is null then '{}'::jsonb else v_new end,
    'queen', case when v_old is null then 0 else v_queen end, 'name', v_name);
end $$;
revoke execute on function public.bu_counts() from public, anon;
grant execute on function public.bu_counts() to authenticated;

-- 🖨️ QR 포스터 만들기 권한: 선생님 + 선생님이 고른 학생(bu_settings 'poster_editors' = 이메일 목록)
create or replace function public.bu_poster_can() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (public.is_admin() or exists (
    select 1 from jsonb_array_elements_text(coalesce(public.bu_set('poster_editors'), '[]'::jsonb)) e
    where lower(trim(e)) = lower(coalesce(auth.jwt() ->> 'email', ''))))
$$;

-- 포스터 문구 · 배경 그림 저장 (권한 있는 사람만). p_bg_set = true 일 때만 배경 그림을 바꿔요 ('' = 기본 배경)
create or replace function public.bu_save_poster(p_cfg jsonb default null, p_bg text default null, p_bg_set boolean default false) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.bu_poster_can() then raise exception 'BU_DENIED'; end if;
  if p_cfg is not null then
    insert into public.bu_settings (key, value) values ('poster', jsonb_build_object(
      'title',   left(coalesce(p_cfg ->> 'title', ''), 16),
      'sub',     left(coalesce(p_cfg ->> 'sub', ''), 40),
      'maker',   left(coalesce(p_cfg ->> 'maker', ''), 30),
      'morning', coalesce((p_cfg ->> 'morning')::boolean, true),
      'theme',   left(coalesce(p_cfg ->> 'theme', 'basic'), 20),
      'by',      lower(coalesce(auth.jwt() ->> 'email', '')),
      'at',      now()))
    on conflict (key) do update set value = excluded.value;
  end if;
  if p_bg_set then
    if coalesce(p_bg, '') <> '' and (p_bg not like 'data:image/jpeg;base64,%' or length(p_bg) > 2500000) then
      raise exception 'BU_BAD_IMAGE';
    end if;
    insert into public.bu_settings (key, value) values ('poster_bg', to_jsonb(coalesce(p_bg, '')))
    on conflict (key) do update set value = excluded.value;
  end if;
  return true;
end $$;
revoke execute on function public.bu_poster_can(), public.bu_save_poster(jsonb, text, boolean) from public, anon;
grant execute on function public.bu_poster_can(), public.bu_save_poster(jsonb, text, boolean) to authenticated;

-- 자동 접속(무료 프로젝트 일시 정지 방지)용. 로그인 없이 부를 수 있어요
create or replace function public.bu_ping() returns int language sql stable as $$ select 1 $$;

-- ======================================================================
-- 4) 권한 (RLS)
-- ======================================================================
alter table public.bu_questions enable row level security;
alter table public.bu_profile   enable row level security;
alter table public.bu_daily     enable row level security;
alter table public.bu_qstate    enable row level security;
alter table public.bu_ticket    enable row level security;
alter table public.bu_d10       enable row level security;
alter table public.bu_settings  enable row level security;

-- 문제(정답 포함)는 교사만 직접 읽고 써요. 학생은 bu_next 로 정답 없는 문제만 받아요
drop policy if exists bu_q_admin on public.bu_questions;
create policy bu_q_admin on public.bu_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists bu_prof_read on public.bu_profile;
create policy bu_prof_read on public.bu_profile for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists bu_prof_admin on public.bu_profile;
create policy bu_prof_admin on public.bu_profile for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists bu_daily_read on public.bu_daily;
create policy bu_daily_read on public.bu_daily for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists bu_daily_del on public.bu_daily;
create policy bu_daily_del on public.bu_daily for delete to authenticated using (public.is_admin());

drop policy if exists bu_qs_read on public.bu_qstate;
create policy bu_qs_read on public.bu_qstate for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists bu_qs_del on public.bu_qstate;
create policy bu_qs_del on public.bu_qstate for delete to authenticated using (public.is_admin());

drop policy if exists bu_set_read on public.bu_settings;
-- 포스터 권한 학생 목록(이메일)은 선생님만 읽어요
create policy bu_set_read on public.bu_settings for select to authenticated using (key <> 'poster_editors' or public.is_admin());
drop policy if exists bu_set_write on public.bu_settings;
create policy bu_set_write on public.bu_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists bu_d10_admin on public.bu_d10;
create policy bu_d10_admin on public.bu_d10 for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.bu_questions, public.bu_profile, public.bu_daily, public.bu_qstate,
  public.bu_ticket, public.bu_d10, public.bu_settings from anon;
revoke all on public.bu_ticket from authenticated;
grant select, insert, update, delete on public.bu_questions to authenticated;
grant select, update on public.bu_profile to authenticated;
grant select, delete on public.bu_daily, public.bu_qstate to authenticated;
grant select, insert, update, delete on public.bu_settings, public.bu_d10 to authenticated;
grant usage, select on sequence public.bu_questions_id_seq to authenticated;

revoke execute on function public.bu_ping() from public;
grant execute on function public.bu_ping() to anon, authenticated;
