-- MY Speaking (말하기 연습) 표
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 독서 여권과 같은 프로젝트·같은 로그인을 써요. 녹음은 저장하지 않고, 인식된 글자와 점수만 저장해요.

-- 1) 대화문 세트 (교사가 붙여 넣기)
create table if not exists public.sp_sets (
  id          bigserial primary key,
  title       text not null,
  lesson      text,                         -- 예: 1-3
  grade       int,                          -- 1~3, 비우면 전 학년
  lines       jsonb not null default '[]',  -- [{who, text, ko}]
  published   boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) 연습 기록 (한 줄 말할 때마다 1행)
create table if not exists public.sp_attempts (
  id          bigserial primary key,
  user_id     uuid not null default auth.uid(),
  email       text not null,
  set_id      bigint not null references public.sp_sets (id) on delete cascade,
  line_idx    int not null,
  said        text,
  score       int not null check (score between 0 and 100),
  mode        text,
  created_at  timestamptz not null default now()
);
create index if not exists sp_attempts_set_idx  on public.sp_attempts (set_id, email);
create index if not exists sp_attempts_user_idx on public.sp_attempts (user_id, created_at);

-- 학교 계정(@smy.ms.kr) 또는 교사
create or replace function public.sp_can() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or lower(coalesce(auth.jwt() ->> 'email', '')) like '%@smy.ms.kr'
$$;

alter table public.sp_sets enable row level security;
alter table public.sp_attempts enable row level security;

drop policy if exists sp_sets_read on public.sp_sets;
create policy sp_sets_read on public.sp_sets for select to authenticated
  using ((published and public.sp_can()) or public.is_admin());
drop policy if exists sp_sets_write on public.sp_sets;
create policy sp_sets_write on public.sp_sets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sp_att_read on public.sp_attempts;
create policy sp_att_read on public.sp_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists sp_att_insert on public.sp_attempts;
create policy sp_att_insert on public.sp_attempts for insert to authenticated
  with check (user_id = auth.uid() and lower(email) = lower(auth.jwt() ->> 'email') and public.sp_can());
drop policy if exists sp_att_admin on public.sp_attempts;
create policy sp_att_admin on public.sp_attempts for delete to authenticated
  using (public.is_admin());

revoke all on public.sp_sets, public.sp_attempts from anon;
grant select, insert, update, delete on public.sp_sets to authenticated;
grant select, insert, delete on public.sp_attempts to authenticated;
grant usage, select on sequence public.sp_sets_id_seq, public.sp_attempts_id_seq to authenticated;
