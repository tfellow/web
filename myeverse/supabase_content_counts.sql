-- MYeVerse 첫 페이지: 앱별 자료 수 (숫자만)
-- Supabase → SQL Editor → New query 에 통째로 붙여 넣고 Run. (여러 번 실행해도 안전해요)
-- 로그인 없이 부를 수 있지만 개수만 돌려줘요. 문제·지문·학생 정보는 나가지 않아요. 표는 바꾸지 않아요.
create or replace function public.mv_content_counts() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r jsonb := '{}'; n int; m int;
begin
  -- 표가 없거나 이름이 달라도 그 앱만 건너뛰어요
  begin
    select count(*) into n from public.quiz_questions;
    r := r || jsonb_build_object('reading-passport', jsonb_build_object('questions', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select count(*) into n from public.r2_quiz_questions q join public.r2_books b on b.id = q.book_id where b.published;
    r := r || jsonb_build_object('knowledge-passport', jsonb_build_object('questions', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select count(*) into n from public.hm_quiz q join public.hm_rooms h on h.id = q.room_id where h.published;
    r := r || jsonb_build_object('history', jsonb_build_object('questions', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select count(*) into n from public.bu_questions where active;
    r := r || jsonb_build_object('brain-up', jsonb_build_object('questions', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select count(*) into n from public.mg_questions q join public.mg_topics t on t.code = q.topic_code where q.active and t.active;
    r := r || jsonb_build_object('grammar', jsonb_build_object('questions', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select count(*), coalesce(sum(case when jsonb_typeof(lines) = 'array' then jsonb_array_length(lines) else 0 end), 0)
      into n, m from public.sp_sets where published;
    r := r || jsonb_build_object('speaking', jsonb_build_object('dialogs', n, 'sentences', m));
  exception when undefined_table or undefined_column then null; end;
  -- 선생님이 더 올린 단어 (앱에 들어 있는 기본 단어장은 파일에서 세요)
  begin
    select coalesce(sum(case when jsonb_typeof(data -> 'rows') = 'array' then jsonb_array_length(data -> 'rows') else 0 end), 0)
      into n from public.ds_books where id <> '_settings';
    r := r || jsonb_build_object('word-forest', jsonb_build_object('extraWords', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select coalesce(sum(case when jsonb_typeof(words) = 'array' then jsonb_array_length(words) else 0 end), 0)
      into n from public.wa_banks where active and id not in ('g1', 'g2');
    r := r || jsonb_build_object('word-arcade', jsonb_build_object('extraWords', n));
  exception when undefined_table or undefined_column then null; end;
  begin
    select coalesce(sum(case when jsonb_typeof(items) = 'array' then jsonb_array_length(items) else 0 end), 0)
      into n from public.wr_custom_sets;
    r := r || jsonb_build_object('word-rush', jsonb_build_object('extraWords', n));
  exception when undefined_table or undefined_column then null; end;
  return r;
end $$;
revoke all on function public.mv_content_counts() from public;
grant execute on function public.mv_content_counts() to anon, authenticated;

-- 확인: 앱별 숫자가 나오면 성공이에요
select public.mv_content_counts();
