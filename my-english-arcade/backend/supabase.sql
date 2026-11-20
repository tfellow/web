-- MY English Arcade. Reviewed by Claude 2026-11-21. Run ONLY after the owner's final OK.
-- Project: tfellow-web (https://jkxdhyvnrvsiokbbbjtu.supabase.co), the same project/login as the other MY apps.
-- Dedicated prefix: myea_ (checked free on 2026-11-21). No existing app tables or functions are altered.
-- Admins = the shared public.is_admin() (admins table: tfellow@gmail.com, tfellow@smy.ms.kr,
--   engwords@smy.ms.kr, hist1026@gmail.com), so one admin list for every app,
--   PLUS engwords@gmail.com as an admin of this app only (owner's request 2026-11-21).
-- Run once in the Supabase SQL editor. It fails on purpose if any myea_ object already exists.
begin;

-- Intentionally fail on a name collision instead of reusing unknown tables.
create table public.myea_settings (
  id smallint primary key check (id = 1),
  allow_external boolean not null default false
);
insert into public.myea_settings(id) values (1);

create function public.myea_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and u.raw_app_meta_data->'providers' ? 'google'
      and (coalesce(public.is_admin(), false)
           -- extra admin for THIS app only (owner, 2026-11-21); the shared admins table is not changed
           or lower(u.email) = 'engwords@gmail.com')
  );
$$;

create function public.myea_can_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and u.raw_app_meta_data->'providers' ? 'google'
      and (
        coalesce(public.is_admin(), false)
        or lower(u.email) = 'engwords@gmail.com'
        or split_part(lower(u.email),'@',2) = 'smy.ms.kr'
        or coalesce((select s.allow_external from public.myea_settings s where s.id=1),false)
      )
  );
$$;

revoke all on function public.myea_is_admin() from public, anon;
revoke all on function public.myea_can_access() from public, anon;
grant execute on function public.myea_is_admin() to authenticated;
grant execute on function public.myea_can_access() to authenticated;

create table public.myea_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_number text not null check (length(student_number) between 1 and 20),
  student_name text not null check (length(student_name) between 1 and 30),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint myea_payload_valid check (
    coalesce(
      jsonb_typeof(payload)='object'
      and octet_length(payload::text)<=500000
      and payload->>'id'=id::text
      and payload->>'userId'=user_id::text
      and payload->>'playerKey'='google:'||user_id::text
      and payload->>'studentNumber'=student_number
      and payload->>'studentName'=student_name
      and payload->>'mode' in ('meaning','reverse','definition','spelling','cloze','sentence','match','memory','listening','anagram','truefalse','crypto')
      and jsonb_typeof(payload->'attempts')='array'
      and jsonb_array_length(payload->'attempts') between 1 and 1000
      and jsonb_typeof(payload->'score')='number'
      and jsonb_typeof(payload->'accuracy')='number'
      and jsonb_typeof(payload->'elapsedMs')='number'
      and jsonb_typeof(payload->'total')='number'
      and jsonb_typeof(payload->'correct')='number'
      and (payload->>'score')::numeric between 0 and 100000
      and (payload->>'accuracy')::numeric between 0 and 100
      and (payload->>'elapsedMs')::numeric>=0
      and (payload->>'total')::numeric between 1 and 1000
      and (payload->>'correct')::numeric between 0 and (payload->>'total')::numeric
      and jsonb_typeof(payload->'completedAt')='string',
      false
    )
  )
);
create index myea_sessions_user_created on public.myea_sessions(user_id,created_at desc);
create index myea_sessions_created on public.myea_sessions(created_at desc);

alter table public.myea_settings enable row level security;
alter table public.myea_sessions enable row level security;
revoke all on public.myea_settings,public.myea_sessions from anon,authenticated;
grant select,update on public.myea_settings to authenticated;
grant select,insert on public.myea_sessions to authenticated;

create policy myea_settings_read on public.myea_settings for select to authenticated
  using ((select public.myea_can_access()));
create policy myea_settings_admin on public.myea_settings for update to authenticated
  using ((select public.myea_is_admin())) with check ((select public.myea_is_admin()));
create policy myea_sessions_read on public.myea_sessions for select to authenticated
  using ((select public.myea_can_access()) and (user_id=(select auth.uid()) or (select public.myea_is_admin())));
create policy myea_sessions_insert on public.myea_sessions for insert to authenticated
  with check ((select public.myea_can_access()) and user_id=(select auth.uid()));
-- No client UPDATE/DELETE policy. Submission IDs make retry insertions idempotent.
-- These are self-study records. Client grading is NOT a tamper-proof examination.
commit;
