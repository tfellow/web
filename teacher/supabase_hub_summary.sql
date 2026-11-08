-- MY English Journey (학생용 통합 페이지) 요약 표
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 선생님이 MY Teacher Hub 를 열면 학생별 요약이 이 표에 올라가고, 학생은 자기 줄만 읽을 수 있어요.

create table if not exists public.hub_summary (
  email      text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hub_summary enable row level security;

-- 읽기: 본인 줄만 (교사는 전체)
drop policy if exists hub_summary_read on public.hub_summary;
create policy hub_summary_read on public.hub_summary for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_admin());

-- 쓰기: 교사만
drop policy if exists hub_summary_write on public.hub_summary;
create policy hub_summary_write on public.hub_summary for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.hub_summary from anon;
grant select, insert, update, delete on public.hub_summary to authenticated;
