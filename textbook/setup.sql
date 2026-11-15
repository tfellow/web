-- Run once in tfellow-web. No existing app tables, functions or settings are changed.
begin;
create table public.textbook_sentence_notes (
 grade smallint not null check(grade between 1 and 3),
 lesson smallint not null check(lesson between 1 and 99),
 part text not null check(part in ('reading','context')),
 seq smallint not null check(seq between 1 and 500),
 ko text not null check(length(trim(ko)) between 1 and 550),
 vocab text not null check(length(trim(vocab)) between 1 and 550),
 grammar text not null check(length(trim(grammar)) between 1 and 550),
 meaning text not null check(length(trim(meaning)) between 1 and 550),
 primary key(grade,lesson,part,seq)
);
alter table public.textbook_sentence_notes enable row level security;
revoke all on public.textbook_sentence_notes from public, anon, authenticated;
grant select on public.textbook_sentence_notes to anon,authenticated;
grant insert,update on public.textbook_sentence_notes to authenticated;
create policy textbook_read on public.textbook_sentence_notes for select to anon,authenticated using(true);
create policy textbook_insert on public.textbook_sentence_notes for insert to authenticated with check(
 lower(auth.jwt()->>'email') in ('tfellow@gmail.com','tfellow@smy.ms.kr') and (auth.jwt()->'app_metadata'->>'provider')='google');
create policy textbook_update on public.textbook_sentence_notes for update to authenticated using(
 lower(auth.jwt()->>'email') in ('tfellow@gmail.com','tfellow@smy.ms.kr') and (auth.jwt()->'app_metadata'->>'provider')='google') with check(
 lower(auth.jwt()->>'email') in ('tfellow@gmail.com','tfellow@smy.ms.kr') and (auth.jwt()->'app_metadata'->>'provider')='google');
commit;
