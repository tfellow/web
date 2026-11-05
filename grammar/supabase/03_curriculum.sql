-- =====================================================================
--  MY Grammar · 새 단원표 적용 (4단계 · 소단원 129개)
--  이미 01_schema.sql, 02_sample_data.sql 을 실행한 경우 이 파일만 실행하면 돼요.
--  · 예전 단원(G1-01 …)의 문제·풀이 기록·스탬프는 새 단원으로 그대로 옮겨져요.
--  · 선생님이 직접 추가한 문제는 지워지지 않아요. (예전 단원의 문제는 새 단원으로 함께 옮겨져요.)
--  · 여러 번 실행해도 안전해요.
-- =====================================================================

-- 1. 단원에 대단원·소단원 정보 추가
alter table public.mg_topics add column if not exists unit_no int;
alter table public.mg_topics add column if not exists unit_title text;
alter table public.mg_topics add column if not exists sub_no int;

create or replace view public.mg_topics_public as
select id, code, grade, category, title, title_en, summary, examples, tip, sort_order,
       (select count(*) from public.mg_questions q where q.topic_code = t.code and q.active)::int as q_count,
       unit_no, unit_title, sub_no
  from public.mg_topics t
 where t.active and public.mg_is_allowed();
grant select on public.mg_topics_public to authenticated;

-- 2. 예전 단원 코드를 새 코드로 바꾸기 (문제는 자동으로 따라와요)
do $$
declare r record;
begin
  for r in select * from (values
    ('G1-01', 'M1-01-1'),
    ('G1-02', 'M1-02-1'),
    ('G1-03', 'M1-05-3'),
    ('G1-04', 'M1-02-2'),
    ('G1-05', 'M1-05-2'),
    ('G1-06', 'M1-06-2'),
    ('G1-07', 'M1-10-3'),
    ('G2-01', 'M1-09-1'),
    ('G2-02', 'M1-09-3'),
    ('G2-03', 'M2-04-1'),
    ('G2-04', 'M2-02-2'),
    ('G2-05', 'M1-12-3'),
    ('G2-06', 'M2-01-1'),
    ('G3-01', 'M2-11-1'),
    ('G3-02', 'M2-11-2'),
    ('G3-03', 'M2-12-1'),
    ('G3-04', 'M3-08-3'),
    ('G3-05', 'M2-07-1')
  ) as x(old_code, new_code) loop
    if exists (select 1 from public.mg_topics where code = r.old_code)
       and not exists (select 1 from public.mg_topics where code = r.new_code) then
      update public.mg_topics set code = r.new_code where code = r.old_code;
    elsif exists (select 1 from public.mg_topics where code = r.old_code) then
      update public.mg_questions set topic_code = r.new_code where topic_code = r.old_code;
    end if;
    update public.mg_stamps s set topic_code = r.new_code
     where s.topic_code = r.old_code
       and not exists (select 1 from public.mg_stamps x where x.user_id = s.user_id and x.topic_code = r.new_code);
  end loop;
end $$;

-- 3. 새 단원표 넣기 (같은 코드가 있으면 내용을 새 단원표로 바꿔요)
insert into public.mg_topics (code, grade, unit_no, unit_title, sub_no, category, title, title_en, summary, examples, tip, sort_order) values
  ('M1-01-1', 1, 1, 'be동사', 1, 'be동사', 'be동사의 현재형과 과거형', 'Be Verbs: Present & Past', 'be동사는 ''~이다, ~에 있다''라는 뜻이에요.
**현재:** I → am / You, We, They, 복수 → are / He, She, It, 단수 → is
**과거:** am, is → **was** / are → **were**', 'I am a student. | 나는 학생이다.
My friends are in the library. | 내 친구들은 도서관에 있다.
She was sick yesterday. | 그녀는 어제 아팠다.', '주어가 길어도 ''핵심 명사''의 단수·복수를 보세요. The books on the desk → are', 11),
  ('M1-01-2', 1, 1, 'be동사', 2, 'be동사', 'be동사의 부정문과 의문문', 'Be Verbs: Negatives & Questions', '**부정문:** be동사 뒤에 not → is not(isn''t), are not(aren''t), was not(wasn''t)
**의문문:** be동사를 주어 앞으로 → Are you ~? / Was he ~?
대답: Yes, I am. / No, he wasn''t.', 'She is not at home. | 그녀는 집에 없다.
Are you a new student? | 너는 새로 온 학생이니?
Were they at the park? — No, they weren''t. | 그들은 공원에 있었니? — 아니.', 'am not 은 줄여서 amn''t 로 쓰지 않아요. I''m not ✓', 12),
  ('M1-02-1', 1, 2, '일반동사', 1, '일반동사', '일반동사의 현재형', 'Simple Present', '주어가 3인칭 단수(he, she, it, Tom…)이면 동사에 **-s / -es**
-es: watches, goes, does, fixes / 자음+y → -ies: studies
have → **has** (불규칙)', 'She plays the piano every day. | 그녀는 매일 피아노를 친다.
My dad watches TV at night. | 아빠는 밤에 TV를 보신다.
Tom has two cats. | Tom은 고양이 두 마리가 있다.', 'every day, always, usually 처럼 습관을 말할 때 현재형!', 21),
  ('M1-02-2', 1, 2, '일반동사', 2, '일반동사', '일반동사의 과거형', 'Simple Past', '과거의 일은 동사에 **-ed** 또는 불규칙 변화
규칙: played, liked, studied, stopped
불규칙: go-went, eat-ate, see-saw, have-had, make-made, buy-bought', 'We went to Busan last summer. | 우리는 지난여름 부산에 갔다.
I studied English yesterday. | 나는 어제 영어를 공부했다.
She made a cake for me. | 그녀는 나를 위해 케이크를 만들었다.', 'yesterday, last ~, ~ ago 는 과거시제 신호!', 22),
  ('M1-02-3', 1, 2, '일반동사', 3, '일반동사', '일반동사의 부정문과 의문문', 'Do/Does/Did: Negatives & Questions', '**부정문:** don''t / doesn''t / didn''t + **동사원형**
**의문문:** Do / Does / Did + 주어 + **동사원형** ~?
3인칭 단수 현재 → does, 과거 → 주어와 상관없이 did', 'He doesn''t like carrots. | 그는 당근을 좋아하지 않는다.
Does she live near here? | 그녀는 이 근처에 사니?
I didn''t eat breakfast. | 나는 아침을 먹지 않았다.', 'does, did 뒤에는 반드시 동사원형! (He doesn''t likes ✗)', 23),
  ('M1-03-1', 1, 3, '명사와 관사', 1, '명사와 관사', '셀 수 있는 명사', 'Countable Nouns', '하나, 둘 셀 수 있는 명사는 단수일 때 a/an, 복수일 때 **-s / -es**
-es: boxes, dishes, potatoes / 자음+y → -ies: babies
불규칙: man-men, child-children, foot-feet, tooth-teeth, mouse-mice', 'I have two brothers. | 나는 남자 형제가 두 명 있다.
There are three boxes. | 상자가 세 개 있다.
The children are playing. | 아이들이 놀고 있다.', 'fish, sheep, deer 는 단수·복수 모양이 같아요.', 31),
  ('M1-03-2', 1, 3, '명사와 관사', 2, '명사와 관사', '셀 수 없는 명사', 'Uncountable Nouns', '물질(water, milk), 추상(love, advice), 고유명사(Seoul)는 셀 수 없어요.
a/an 을 붙이지 않고 복수형도 없어요.
셀 때는 단위를 써요: **a glass of** water, **a piece of** paper, **two cups of** coffee', 'I need some water. | 나는 물이 좀 필요하다.
She gave me a piece of advice. | 그녀는 나에게 충고 한마디를 해 주었다.
I drank two cups of milk. | 나는 우유 두 잔을 마셨다.', 'information, homework, furniture 는 셀 수 없어요. (homeworks ✗)', 32),
  ('M1-03-3', 1, 3, '명사와 관사', 3, '명사와 관사', '관사 (a/an, the, 무관사)', 'Articles', '**a/an:** 처음 말하는 셀 수 있는 단수 명사 (모음 소리 앞 an: an apple, an hour)
**the:** 이미 말한 것, 세상에 하나뿐인 것(the sun), 악기(play the piano)
**무관사:** 운동(play soccer), 식사(have lunch), by + 교통수단(by bus)', 'I saw a dog. The dog was very big. | 개를 봤다. 그 개는 정말 컸다.
She plays the violin. | 그녀는 바이올린을 연주한다.
We go to school by bus. | 우리는 버스로 학교에 간다.', 'a/an 은 소리로 판단! an hour(h 묵음), a university(유 소리)', 33),
  ('M1-04-1', 1, 4, '대명사', 1, '대명사', '인칭대명사와 재귀대명사', 'Personal & Reflexive Pronouns', '**주격:** I you he she it we they / **목적격:** me you him her it us them
**소유격:** my your his her its our their / **소유대명사:** mine yours his hers ours theirs
**재귀대명사:** myself, yourself, himself, herself, ourselves, themselves (자기 자신)', 'This bag is mine. | 이 가방은 내 것이다.
I like her, and she likes me. | 나는 그녀를 좋아하고, 그녀도 나를 좋아한다.
She looked at herself in the mirror. | 그녀는 거울 속 자신을 보았다.', 'it''s = it is, its = 그것의. 헷갈리지 마세요!', 41),
  ('M1-04-2', 1, 4, '대명사', 2, '대명사', '지시대명사 (this, that, it)', 'Demonstratives & It', '**this / these:** 가까운 것 (이것 / 이것들)
**that / those:** 먼 것 (저것 / 저것들)
**비인칭 주어 it:** 날씨, 시간, 날짜, 거리 → ''그것''으로 해석하지 않아요.', 'This is my sister. | 이 사람은 내 여동생이야.
Those shoes are nice. | 저 신발들은 멋지다.
It is raining now. | 지금 비가 오고 있다.', 'These is ✗ → These are ✓ (복수는 are)', 42),
  ('M1-04-3', 1, 4, '대명사', 3, '대명사', '부정대명사 (one, some, any)', 'Indefinite Pronouns: one, some, any', '**one:** 앞에 나온 명사와 같은 종류의 ''하나'' (it 은 바로 그것)
**some:** 긍정문, 권유하는 의문문 / **any:** 부정문, 의문문
something, anything, someone, anyone 도 같은 규칙', 'I lost my pen. I need to buy one. | 펜을 잃어버렸다. 하나 사야 한다.
Would you like some tea? | 차 좀 드실래요?
I don''t have any money. | 나는 돈이 하나도 없다.', 'I lost my pen, but I found it. (바로 그 펜 → it)', 43),
  ('M1-05-1', 1, 5, '현재 vs 과거 정리 (기본 시제 복습)', 1, '현재 vs 과거 정리 (기본 시제 복습)', '현재시제와 과거시제 정리', 'Review: Present vs Past', '1·2단원에서 배운 시제를 한 번에 정리해요.
**현재:** 습관, 사실, 진리 (The sun rises in the east.)
**과거:** 이미 끝난 일 (yesterday, last week, ago)
be동사: am/is → was, are → were / 일반동사: -ed 또는 불규칙', 'I usually walk to school. | 나는 보통 걸어서 학교에 간다.
I walked to school yesterday. | 나는 어제 걸어서 학교에 갔다.
Water boils at 100℃. | 물은 100도에서 끓는다.', '과학적 사실·진리는 항상 현재시제!', 51),
  ('M1-05-2', 1, 5, '현재 vs 과거 정리 (기본 시제 복습)', 2, '현재 vs 과거 정리 (기본 시제 복습)', '미래시제 (will, be going to)', 'Future: will / be going to', '**will + 동사원형:** ~할 것이다 (즉석 결정, 예측)
**be going to + 동사원형:** ~할 예정이다 (미리 정한 계획)
부정: will not(won''t), be not going to', 'I will help you. | 내가 도와줄게.
She is going to visit her grandma this weekend. | 그녀는 이번 주말에 할머니 댁을 방문할 예정이다.
It won''t rain tomorrow. | 내일은 비가 오지 않을 것이다.', 'will 뒤, to 뒤에는 동사원형! (will goes ✗)', 52),
  ('M1-05-3', 1, 5, '현재 vs 과거 정리 (기본 시제 복습)', 3, '현재 vs 과거 정리 (기본 시제 복습)', '진행시제 (현재진행, 과거진행)', 'Progressive Tenses', '**현재진행:** am/are/is + -ing (지금 ~하고 있다)
**과거진행:** was/were + -ing (그때 ~하고 있었다)
-ing: come → coming, run → running / know, like, want 같은 상태동사는 진행형 ✗', 'I am reading a book now. | 나는 지금 책을 읽고 있다.
They were swimming at 3 p.m. | 그들은 오후 3시에 수영하고 있었다.
Look! It is snowing. | 봐! 눈이 오고 있어.', 'now, Look!, Listen! → 현재진행 / at that time → 과거진행', 53),
  ('M1-06-1', 1, 6, '조동사 I', 1, '조동사 I', 'can, may', 'Modals: can, may', '조동사 + **동사원형**
**can:** ~할 수 있다(능력 = be able to), ~해도 된다(허락)
**may:** ~해도 된다(허락), ~일지도 모른다(추측)', 'She can speak three languages. | 그녀는 3개 언어를 할 수 있다.
May I come in? | 들어가도 될까요?
He may be at home. | 그는 집에 있을지도 모른다.', 'can 의 과거는 could, 미래는 will be able to', 61),
  ('M1-06-2', 1, 6, '조동사 I', 2, '조동사 I', 'must, have to, should', 'Modals: must, have to, should', '**must = have to:** ~해야 한다 (의무)
**must not:** ~하면 안 된다 (금지)
**don''t have to:** ~할 필요 없다 (불필요)
**should:** ~하는 게 좋겠다 (충고)', 'You must wear a helmet. | 헬멧을 써야 한다.
You must not run here. | 여기서 뛰면 안 된다.
You don''t have to hurry. | 서두를 필요 없어.
You should go to bed early. | 일찍 자는 게 좋겠어.', 'must not(금지) ≠ don''t have to(불필요). 시험 단골!', 62),
  ('M1-07-1', 1, 7, '문장의 종류', 1, '문장의 종류', '의문사 의문문 I (who, what, which)', 'Wh-questions I', '의문사 + 동사 + 주어 ~?
**who:** 누구 / **what:** 무엇 / **which:** 어느 것 (정해진 것 중 고를 때)
의문사가 주어면 바로 동사: Who made this?', 'Who is that girl? | 저 소녀는 누구니?
What do you want for lunch? | 점심으로 뭘 원하니?
Which color do you like, red or blue? | 빨강과 파랑 중 어느 색이 좋니?', '의문사 의문문은 Yes/No 로 대답하지 않아요.', 71),
  ('M1-07-2', 1, 7, '문장의 종류', 2, '문장의 종류', '의문사 의문문 II (when, where, why, how)', 'Wh-questions II', '**when:** 언제 / **where:** 어디서 / **why:** 왜 (→ Because ~) / **how:** 어떻게, 얼마나
how + 형용사·부사: how old, how many(셀 수 있는), how much(셀 수 없는, 가격), how often', 'Where do you live? | 너는 어디 사니?
Why were you late? — Because I missed the bus. | 왜 늦었니? — 버스를 놓쳐서.
How many books do you have? | 책이 몇 권 있니?', 'How much is it? = 가격 묻기', 72),
  ('M1-07-3', 1, 7, '문장의 종류', 3, '문장의 종류', '명령문, 청유문(Let''s ~), There is/are ~', 'Imperatives, Let''s, There is/are', '**명령문:** 동사원형으로 시작 (~해라) / 부정: Don''t + 동사원형
**청유문:** Let''s + 동사원형 (~하자) / 부정: Let''s not ~
**There is + 단수 / There are + 복수:** ~이 있다', 'Be quiet, please. | 조용히 해 주세요.
Don''t touch it. | 그거 만지지 마.
Let''s go to the movies. | 영화 보러 가자.
There are many people in the park. | 공원에 사람이 많다.', 'There is 뒤 명사의 수를 보고 is / are 를 골라요.', 73),
  ('M1-07-4', 1, 7, '문장의 종류', 4, '문장의 종류', '감탄문과 부가의문문', 'Exclamations & Tag Questions', '**감탄문:** What + (a/an) + 형용사 + 명사 + 주어 + 동사! / How + 형용사·부사 + 주어 + 동사!
**부가의문문:** 긍정문 → 부정 꼬리, 부정문 → 긍정 꼬리 (~, isn''t it? / ~, do you?)', 'What a beautiful day it is! | 정말 아름다운 날이구나!
How fast he runs! | 그는 정말 빨리 달리는구나!
You like pizza, don''t you? | 너 피자 좋아하지, 그렇지?', '명사가 있으면 What, 없으면 How!', 74),
  ('M1-08-1', 1, 8, '주요 문장 구조', 1, '주요 문장 구조', '1형식과 3형식 기초 (자동사와 타동사)', 'Intransitive & Transitive Verbs', '**1형식:** 주어 + 동사 (목적어 없이 완전: The baby cried.)
**3형식:** 주어 + 동사 + 목적어 (~을/를)
자동사는 목적어를 바로 못 받아요 → 전치사 필요 (listen **to**, look **at**)', 'Birds fly. | 새는 난다.
I like music. | 나는 음악을 좋아한다.
She listened to the radio. | 그녀는 라디오를 들었다.', 'discuss, enter, marry 는 타동사 → 전치사 없이 바로 목적어 (discuss about ✗)', 81),
  ('M1-08-2', 1, 8, '주요 문장 구조', 2, '주요 문장 구조', '감각동사 (2형식)', 'Linking Verbs', '**look, sound, smell, taste, feel + 형용사**
~하게 보이다/들리다/냄새가 나다/맛이 나다/느껴지다
명사가 오면 **like + 명사**: look like a doll', 'You look happy today. | 너 오늘 행복해 보여.
This soup tastes good. | 이 수프는 맛이 좋다.
It sounds like a good idea. | 좋은 생각 같아.', '감각동사 뒤 부사 ✗ (look happily ✗ → look happy ✓)', 82),
  ('M1-08-3', 1, 8, '주요 문장 구조', 3, '주요 문장 구조', '수여동사 (4형식)', 'Dative Verbs', '주어 + 수여동사 + **~에게(간접목적어) + ~을(직접목적어)**
give, send, show, tell, teach, make, buy, ask
간접목적어는 목적격: me, him, her, us, them', 'He gave me a present. | 그는 나에게 선물을 주었다.
Mom made us sandwiches. | 엄마가 우리에게 샌드위치를 만들어 주셨다.
She showed me her pictures. | 그녀는 나에게 사진을 보여 주었다.', '''누구에게'' 가 먼저, ''무엇을'' 이 나중!', 83),
  ('M1-09-1', 1, 9, 'to부정사와 동명사 기초', 1, 'to부정사와 동명사 기초', '명사처럼 쓰이는 to부정사', 'To-infinitive as a Noun', '**to + 동사원형** = ''~하는 것, ~하기''
주어, 목적어, 보어 자리에 와요.
want, hope, plan, decide, need, wish + to부정사', 'I want to be a doctor. | 나는 의사가 되고 싶다.
My dream is to travel the world. | 내 꿈은 세계 여행을 하는 것이다.
She decided to learn Chinese. | 그녀는 중국어를 배우기로 결심했다.', 'to 뒤에는 무조건 동사원형!', 91),
  ('M1-09-2', 1, 9, 'to부정사와 동명사 기초', 2, 'to부정사와 동명사 기초', '형용사·부사처럼 쓰이는 to부정사', 'To-infinitive as Adjective & Adverb', '**형용사적 용법:** 명사 뒤에서 ''~할'' (something to drink, time to sleep)
**부사적 용법:** ~하기 위해(목적), ~해서(감정의 원인)', 'I need something to eat. | 나는 먹을 것이 필요하다.
She went to the store to buy milk. | 그녀는 우유를 사기 위해 가게에 갔다.
I was happy to hear the news. | 나는 그 소식을 들어서 기뻤다.', '-thing + 형용사 + to부정사: something cold to drink', 92),
  ('M1-09-3', 1, 9, 'to부정사와 동명사 기초', 3, 'to부정사와 동명사 기초', '명사처럼 쓰이는 동명사', 'Gerunds as Nouns', '**동사-ing** = ''~하는 것'' (주어, 목적어, 보어)
주어로 쓰이면 **단수 취급**
**전치사 뒤** 동사는 항상 동명사: good at drawing, thank you for helping', 'Swimming is good exercise. | 수영은 좋은 운동이다.
I enjoy playing soccer. | 나는 축구하는 것을 즐긴다.
She is good at drawing. | 그녀는 그림을 잘 그린다.', 'Reading books are ✗ → is ✓ (동명사 주어는 단수)', 93),
  ('M1-10-1', 1, 10, '형용사, 부사 및 비교', 1, '형용사, 부사 및 비교', '형용사의 역할', 'Adjectives', '형용사는 명사를 꾸미거나(a **tall** boy) 보어가 돼요(He is **tall**).
수량 형용사: many(셀 수 있는) / much(셀 수 없는) / a lot of(둘 다)
a few(셀 수 있는, 조금 있는) / a little(셀 수 없는, 조금 있는)', 'She has a cute puppy. | 그녀는 귀여운 강아지가 있다.
There isn''t much milk. | 우유가 많지 않다.
I have a few friends here. | 나는 여기에 친구가 몇 명 있다.', 'few / little(a 없이) = 거의 없는 (부정의 뜻)', 101),
  ('M1-10-2', 1, 10, '형용사, 부사 및 비교', 2, '형용사, 부사 및 비교', '부사의 역할', 'Adverbs', '부사는 동사, 형용사, 다른 부사, 문장 전체를 꾸며요.
형용사 + -ly: quick → quickly, happy → happily
빈도부사(always, usually, often, sometimes, never)는 **be동사·조동사 뒤, 일반동사 앞**', 'He runs very fast. | 그는 아주 빨리 달린다.
She spoke quietly. | 그녀는 조용히 말했다.
I am always busy. / I always get up early. | 나는 항상 바쁘다. / 나는 항상 일찍 일어난다.', 'hard(열심히) ≠ hardly(거의 ~않다), late(늦게) ≠ lately(최근에)', 102),
  ('M1-10-3', 1, 10, '형용사, 부사 및 비교', 3, '형용사, 부사 및 비교', '원급, 비교급, 최상급 기본', 'Comparatives & Superlatives', '**as + 원급 + as:** ~만큼 …한
**비교급 + than:** ~보다 더 …한 (taller, bigger, more beautiful)
**the + 최상급:** 가장 …한 (the tallest, the most beautiful)
불규칙: good-better-best, bad-worse-worst, many/much-more-most', 'She is as tall as her mom. | 그녀는 엄마만큼 키가 크다.
My bag is heavier than yours. | 내 가방이 네 것보다 무겁다.
This is the most interesting book. | 이것이 가장 재미있는 책이다.', '비교급 강조는 much, even, far, a lot (very ✗)', 103),
  ('M1-11-1', 1, 11, '전치사', 1, '전치사', '시간을 나타내는 전치사', 'Prepositions of Time', '**at:** 시각, 특정 시점 (at 7, at noon, at night)
**on:** 요일, 날짜 (on Monday, on May 5th)
**in:** 월, 계절, 연도, 오전·오후 (in July, in 2026, in the morning)
for + 기간 / during + 특정 기간', 'School starts at 8:30. | 학교는 8시 30분에 시작한다.
I was born on March 3rd. | 나는 3월 3일에 태어났다.
We go skiing in winter. | 우리는 겨울에 스키를 타러 간다.', 'this, next, last, every 앞에는 전치사 ✗ (on next Monday ✗)', 111),
  ('M1-11-2', 1, 11, '전치사', 2, '전치사', '장소를 나타내는 전치사', 'Prepositions of Place', '**at:** 좁은 장소, 지점 (at the bus stop) / **in:** 넓은 장소, 안 (in Seoul, in the box) / **on:** 표면 위 (on the wall)
under(아래), next to(옆), between A and B(사이), in front of(앞), behind(뒤), across from(맞은편)', 'The cat is under the table. | 고양이가 탁자 아래에 있다.
The bank is between the school and the park. | 은행은 학교와 공원 사이에 있다.
There is a picture on the wall. | 벽에 그림이 하나 있다.', 'between 은 둘 사이, among 은 셋 이상 사이', 112),
  ('M1-11-3', 1, 11, '전치사', 3, '전치사', '기타 주요 전치사', 'Other Prepositions', '**with:** ~와 함께, ~을 가지고 / **without:** ~ 없이
**by:** ~ 옆에, ~로(교통), ~까지 / **for:** ~을 위해 / **about:** ~에 대해
전치사 뒤에는 명사·대명사 목적격·동명사', 'I went shopping with my sister. | 나는 언니와 쇼핑하러 갔다.
He left without saying goodbye. | 그는 작별 인사도 없이 떠났다.
This gift is for you. | 이 선물은 너를 위한 거야.', 'with I ✗ → with me ✓ (전치사 뒤 목적격)', 113),
  ('M1-12-1', 1, 12, '기본 접속사', 1, '기본 접속사', '등위접속사 (and, but, or, so)', 'Coordinating Conjunctions', '**and:** 그리고 / **but:** 그러나 / **or:** 또는 / **so:** 그래서 (결과)
같은 형태끼리 연결해요 (명사-명사, 동사-동사, 문장-문장)
명령문, and ~: ~해라, 그러면 / 명령문, or ~: ~해라, 그렇지 않으면', 'I like apples, but my brother likes bananas. | 나는 사과를 좋아하지만 동생은 바나나를 좋아한다.
It was cold, so I wore a coat. | 추워서 코트를 입었다.
Hurry up, or you''ll be late. | 서둘러, 그렇지 않으면 늦을 거야.', 'so 는 결과, because 는 이유! 방향이 반대예요.', 121),
  ('M1-12-2', 1, 12, '기본 접속사', 2, '기본 접속사', '시간의 부사절 접속사 (when, while, before, after)', 'Time Clauses', '**when:** ~할 때 / **while:** ~하는 동안 / **before:** ~ 전에 / **after:** ~ 후에
**시간 부사절에서는 미래 대신 현재시제!** (When I arrive, I''ll call you.)', 'When I was young, I lived in Busan. | 어렸을 때 나는 부산에 살았다.
Wash your hands before you eat. | 먹기 전에 손을 씻어라.
While I was sleeping, it snowed. | 내가 자는 동안 눈이 왔다.', 'When I will arrive ✗ → When I arrive ✓', 122),
  ('M1-12-3', 1, 12, '기본 접속사', 3, '기본 접속사', '이유·조건·명사절 접속사 (because, if, that)', 'because, if, that', '**because + 주어 + 동사:** ~ 때문에 (because of + 명사)
**if:** 만약 ~하면 (조건절은 미래 대신 현재시제)
**that:** ~라는 것 (I think that ~, that 은 생략 가능)', 'I stayed home because I was sick. | 아파서 집에 있었다.
If it rains tomorrow, we will stay home. | 내일 비가 오면 집에 있을 거야.
I think (that) he is honest. | 나는 그가 정직하다고 생각한다.', 'If it will rain ✗ → If it rains ✓', 123),
  ('M2-01-1', 2, 1, '문장 형식을 지배하는 동사', 1, '문장 형식을 지배하는 동사', '감각동사 및 수여동사 문장 전환', 'Linking Verbs & Dative Shift', '**감각동사 + 형용사** (look happy, sound strange)
**4형식 → 3형식:** 직접목적어 + 전치사 + 간접목적어
**to:** give, send, show, tell, teach / **for:** make, buy, cook, get / **of:** ask', 'He gave me a present. → He gave a present to me. | 그는 나에게 선물을 주었다.
Dad cooked us dinner. → Dad cooked dinner for us. | 아빠가 우리에게 저녁을 해 주셨다.
Can I ask you a favor? → Can I ask a favor of you? | 부탁 하나 해도 될까?', 'buy, make, cook 은 for! (bought it to me ✗)', 11),
  ('M2-01-2', 2, 1, '문장 형식을 지배하는 동사', 2, '문장 형식을 지배하는 동사', '5형식 지각동사와 사역동사', 'Perception & Causative Verbs', '**지각동사(see, watch, hear, feel) + 목적어 + 동사원형 / -ing**
**사역동사(make, have, let) + 목적어 + 동사원형**
get + 목적어 + to부정사, help + 목적어 + (to) 동사원형', 'I saw him cross the street. | 나는 그가 길을 건너는 것을 보았다.
I heard someone singing. | 누군가 노래하는 소리를 들었다.
Mom made me clean my room. | 엄마는 내게 방을 청소하게 하셨다.', '사역동사 make + 목적어 + to clean ✗ → clean ✓', 12),
  ('M2-02-1', 2, 2, '완료 시제', 1, '완료 시제', '단순시제와 진행시제 정리', 'Simple & Progressive Review', '**단순시제:** 습관·사실(현재), 끝난 일(과거), 예정(미래)
**진행시제:** be + -ing → 그 순간 진행 중인 동작
과거진행은 과거의 한 시점에 하고 있던 일 (When he called, I was taking a shower.)', 'I usually take the bus, but today I am walking. | 보통 버스를 타지만 오늘은 걷고 있다.
When he called, I was taking a shower. | 그가 전화했을 때 나는 샤워 중이었다.
She will be here soon. | 그녀는 곧 여기 올 것이다.', '긴 동작(과거진행) 중에 짧은 동작(과거)이 끼어들어요.', 21),
  ('M2-02-2', 2, 2, '완료 시제', 2, '완료 시제', '현재완료시제 (완료, 경험, 계속, 결과)', 'Present Perfect', '**have / has + p.p.:** 과거의 일이 지금까지 이어지거나 영향을 줄 때
경험(ever, never, before) / 계속(for, since) / 완료(just, already, yet) / 결과(have gone)
분명한 과거 표현(yesterday, ~ ago, last ~)과 함께 쓰지 않아요!', 'I have been to Jeju twice. | 나는 제주도에 두 번 가 본 적이 있다.
She has lived here since 2020. | 그녀는 2020년부터 여기 살고 있다.
Have you finished your homework yet? | 숙제 벌써 끝냈니?', 'for + 기간 / since + 시작 시점, have been to(경험) ≠ have gone to(가 버림)', 22),
  ('M2-03-1', 2, 3, '조동사 II', 1, '조동사 II', 'can, may의 다양한 의미', 'can / may: Meanings', '**can:** 능력(= be able to), 허락, 가능성 / **can''t:** ~일 리가 없다
**may:** 허락(May I ~?), 추측(~일지도 모른다)
could / might 는 더 공손하거나 더 약한 추측', 'Can you help me? | 도와줄 수 있니?
It can''t be true. | 그게 사실일 리가 없어.
She might be busy now. | 그녀는 지금 바쁠지도 몰라.', 'can''t be(강한 부정 추측) ↔ must be(강한 긍정 추측)', 31),
  ('M2-03-2', 2, 3, '조동사 II', 2, '조동사 II', 'must, should의 의무 및 강한 추측', 'must / should: Duty & Deduction', '**must:** ~해야 한다(의무) / ~임에 틀림없다(강한 추측)
**should / ought to:** ~해야 한다(충고, 도리)
과거의 의무는 had to (must 는 과거형이 없어요)', 'You must follow the rules. | 규칙을 따라야 한다.
He must be tired after the long trip. | 긴 여행 뒤라 그는 피곤함에 틀림없다.
You should apologize to her. | 너는 그녀에게 사과해야 해.', '어제 ~해야 했다 → had to (must ✗)', 32),
  ('M2-03-3', 2, 3, '조동사 II', 3, '조동사 II', 'had better, would like to, used to', 'had better, would like to, used to', '**had better + 동사원형:** ~하는 게 낫다 (부정: had better not)
**would like to + 동사원형:** ~하고 싶다 (want to 의 공손한 말)
**used to + 동사원형:** (예전에) ~하곤 했다, ~였다 (지금은 아님)', 'You had better take an umbrella. | 우산을 가져가는 게 좋겠다.
I would like to order a pizza. | 피자를 주문하고 싶어요.
I used to live in Daegu. | 나는 예전에 대구에 살았다.', 'used to go(~하곤 했다) ≠ be used to going(~에 익숙하다)', 33),
  ('M2-04-1', 2, 4, '수동태', 1, '수동태', '수동태의 기본 개념과 시제별 수동태', 'Passive Voice Basics', '**be동사 + p.p. + (by 행위자):** ~되다, ~당하다
현재 is made / 과거 was made / 미래 will be made / 진행 is being made / 완료 has been made
주어가 동작을 ''하는지'' 아니면 ''당하는지'' 먼저 따져요.', 'This bridge was built in 1990. | 이 다리는 1990년에 지어졌다.
English is spoken in many countries. | 영어는 많은 나라에서 사용된다.
The work will be finished tomorrow. | 그 일은 내일 끝날 것이다.', 'be동사 + 동사원형 ✗ → be + p.p. ✓', 41),
  ('M2-04-2', 2, 4, '수동태', 2, '수동태', '4형식 및 5형식 문장의 수동태', 'Passives of 4th & 5th Patterns', '**4형식:** 목적어가 2개 → 수동태도 2가지
He gave me a book. → I was given a book. / A book was given to me.
**5형식:** 목적격보어는 그대로: They call him Max. → He is called Max.
사역·지각동사의 동사원형 보어 → to부정사: She was made to wait.', 'I was given a book by him. | 나는 그에게서 책을 받았다.
The dog is called Max. | 그 개는 Max 라고 불린다.
He was seen to enter the room. | 그가 방에 들어가는 것이 목격되었다.', 'make, buy 는 사람을 주어로 한 수동태를 잘 쓰지 않아요.', 42),
  ('M2-04-3', 2, 4, '수동태', 3, '수동태', '주의해야 할 수동태 (동사구, by 이외의 전치사)', 'Tricky Passives', '**동사구는 한 덩어리로:** look after → was looked after by, laugh at → was laughed at by
**by 이외의 전치사:** be interested **in**, be filled **with**, be covered **with**, be known **to/for**, be made **of/from**, be surprised **at**', 'The baby was looked after by her aunt. | 그 아기는 이모가 돌봤다.
The box is filled with toys. | 상자는 장난감으로 가득 차 있다.
I''m interested in music. | 나는 음악에 관심이 있다.', 'be made of(재료 그대로: 나무 책상) / be made from(성질 변함: 포도 → 와인)', 43),
  ('M2-05-1', 2, 5, 'to부정사 심화', 1, 'to부정사 심화', '명사적 용법과 가주어·진주어', 'Noun Use & It ~ to', 'to부정사 주어가 길면 **It(가주어) ~ to부정사(진주어)**
It is important to exercise every day.
목적어 자리: want, plan, expect, promise, refuse + to부정사', 'It is hard to learn a new language. | 새 언어를 배우는 것은 어렵다.
It is fun to play board games. | 보드게임을 하는 것은 재미있다.
He promised to come back. | 그는 돌아오겠다고 약속했다.', '가주어 It 은 ''그것''으로 해석하지 않아요.', 51),
  ('M2-05-2', 2, 5, 'to부정사 심화', 2, 'to부정사 심화', '형용사적·부사적 용법 심화', 'Adjective & Adverb Uses', '**형용사적:** 명사 + to부정사 + 전치사 (a chair to sit on, a friend to talk with)
**부사적:** 목적(~하기 위해 = in order to), 감정의 원인(~해서), 결과(…해서 ~하다), 판단의 근거(~하다니)', 'I need a pen to write with. | 나는 쓸 펜이 필요하다.
He grew up to be a famous singer. | 그는 자라서 유명한 가수가 되었다.
She must be smart to solve it. | 그것을 풀다니 그녀는 똑똑함에 틀림없다.', 'a house to live in 의 in 을 빼먹지 마세요!', 52),
  ('M2-05-3', 2, 5, 'to부정사 심화', 3, 'to부정사 심화', '의미상 주어 및 주요 구문 (too~to, enough to)', 'for/of + O, too ~ to, enough to', '**의미상 주어:** It is ~ **for** 사람 to ~ / 성격 형용사(kind, nice, wise)는 **of** 사람
**too + 형용사 + to:** 너무 ~해서 …할 수 없다 (= so ~ that 주어 can''t)
**형용사 + enough to:** …할 만큼 충분히 ~하다', 'It is easy for me to swim. | 나에게 수영은 쉽다.
It was kind of you to help me. | 나를 도와주다니 너는 친절했어.
This tea is too hot to drink. | 이 차는 너무 뜨거워서 마실 수 없다.
She is old enough to drive. | 그녀는 운전할 나이가 충분히 됐다.', 'enough 의 위치: 형용사 뒤! (enough old ✗)', 53),
  ('M2-06-1', 2, 6, '동명사 심화', 1, '동명사 심화', '동명사의 역할과 관용 표현', 'Gerund Expressions', '동명사는 주어·목적어·보어·전치사의 목적어
**관용 표현:** go -ing(~하러 가다), be busy -ing, feel like -ing(~하고 싶다), look forward to -ing, How about -ing?, spend 시간/돈 -ing, cannot help -ing', 'Let''s go swimming. | 수영하러 가자.
I feel like eating pizza. | 피자 먹고 싶어.
I''m looking forward to seeing you. | 너를 만나기를 고대하고 있어.', 'look forward to 의 to 는 전치사! → to see ✗ to seeing ✓', 61),
  ('M2-06-2', 2, 6, '동명사 심화', 2, '동명사 심화', '동명사 vs to부정사 (목적어 구분)', 'Gerund vs To-infinitive', '**동명사만:** enjoy, finish, mind, avoid, give up, keep, practice, quit
**to부정사만:** want, hope, plan, decide, expect, promise, refuse
**둘 다 (뜻 같음):** like, love, start, begin, hate', 'Do you mind opening the window? | 창문 좀 열어도 될까요?
He gave up smoking last year. | 그는 작년에 담배를 끊었다.
She decided to study abroad. | 그녀는 유학하기로 결심했다.', '''미래·계획''은 to부정사, ''이미 하고 있는 일''은 동명사로 기억해요.', 62),
  ('M2-07-1', 2, 7, '분사', 1, '분사', '현재분사와 과거분사의 구분과 명사 수식', 'Present vs Past Participles', '**현재분사(-ing):** 능동·진행 ''~하는'' (a sleeping baby)
**과거분사(p.p.):** 수동·완료 ''~된'' (a broken window)
감정: 감정을 일으키면 -ing(boring), 감정을 느끼면 p.p.(bored)
분사가 다른 말과 함께 길어지면 명사 **뒤**에서 꾸며요. (분사구문은 3학년에서!)', 'Look at the dancing girls. | 춤추는 소녀들을 봐.
I found a wallet lost on the street. | 나는 길에서 잃어버린 지갑을 찾았다.
The movie was boring, so I was bored. | 영화가 지루해서 나는 지루했다.', '사람이 느끼면 -ed, 사물이 주는 느낌은 -ing', 71),
  ('M2-08-1', 2, 8, '대명사 심화', 1, '대명사 심화', '부정대명사 I (one, another, other, others)', 'one, another, other(s)', '둘 중: **one ~ the other**
셋 이상: **one ~ another ~ the other** (마지막 하나)
여럿 중 일부: **some ~ others** (다른 일부) / **some ~ the others** (나머지 전부)', 'I have two pets. One is a dog, and the other is a cat. | 애완동물이 둘 있는데, 하나는 개고 다른 하나는 고양이다.
This shirt is too small. Show me another. | 이 셔츠는 너무 작아요. 다른 걸 보여 주세요.
Some like summer, and others like winter. | 어떤 사람은 여름을, 다른 사람들은 겨울을 좋아한다.', 'the 가 붙으면 ''나머지 전부''', 81),
  ('M2-08-2', 2, 8, '대명사 심화', 2, '대명사 심화', '부정대명사 II (all, both, each, every)', 'all, both, each, every', '**all:** 모두 (+ 복수명사 → 복수 동사, + 셀 수 없는 명사 → 단수 동사)
**both:** 둘 다 (복수 취급)
**each:** 각각 (단수 취급, each of + 복수명사 + 단수 동사)
**every + 단수명사:** 모든 (단수 취급)', 'All the students are here. | 모든 학생이 여기 있다.
Both of my parents are teachers. | 부모님 두 분 다 선생님이시다.
Each student has a locker. | 각 학생은 사물함이 있다.
Every child likes candy. | 모든 아이는 사탕을 좋아한다.', 'every 뒤에는 단수 명사! (every students ✗)', 82),
  ('M2-08-3', 2, 8, '대명사 심화', 3, '대명사 심화', '재귀대명사의 재귀용법과 강조용법', 'Reflexive & Emphatic Uses', '**재귀용법:** 주어와 목적어가 같을 때 (생략 ✗) → She hurt herself.
**강조용법:** ''직접, 스스로'' (생략 가능) → I made it myself.
관용: by oneself(혼자서), for oneself(스스로 힘으로), enjoy oneself(즐거운 시간을 보내다), help yourself(마음껏 먹어)', 'He looked at himself in the mirror. | 그는 거울 속 자신을 보았다.
I fixed the bike myself. | 나는 자전거를 직접 고쳤다.
We enjoyed ourselves at the party. | 우리는 파티에서 즐거운 시간을 보냈다.', '주어 = 목적어 이면 재귀대명사! (She loves her ✗ 자기 자신일 때)', 83),
  ('M2-09-1', 2, 9, '비교 구문 심화', 1, '비교 구문 심화', '원급·비교급·최상급 활용', 'Using Comparisons', '**배수 비교:** 배수 + as 원급 as (twice as big as, three times as long as)
**as ~ as possible = as ~ as 주어 can** (가능한 한 ~하게)
**최상급:** the 최상급 + in 장소/집단, of 복수명사 / one of the 최상급 + 복수명사', 'This room is twice as big as mine. | 이 방은 내 방보다 두 배 크다.
Come home as soon as possible. | 가능한 한 빨리 집에 와.
She is one of the best players in the team. | 그녀는 팀에서 가장 뛰어난 선수 중 한 명이다.', 'one of the + 최상급 + 복수명사! (one of the best player ✗)', 91),
  ('M2-09-2', 2, 9, '비교 구문 심화', 2, '비교 구문 심화', '여러 가지 비교 표현 (비교급 강조, the+비교급)', 'Comparative Expressions', '**비교급 강조:** much, even, far, still, a lot + 비교급 (very ✗)
**The 비교급, the 비교급:** ~하면 할수록 더 …하다
**비교급 and 비교급:** 점점 더 ~한 (bigger and bigger, more and more)', 'This box is much heavier than that one. | 이 상자가 저것보다 훨씬 무겁다.
The more you practice, the better you get. | 연습할수록 더 잘하게 된다.
It is getting colder and colder. | 점점 더 추워지고 있다.', 'more and more beautiful ✓ / beautifuler ✗', 92),
  ('M2-10-1', 2, 10, '접속사 심화', 1, '접속사 심화', '시간·이유의 부사절 접속사', 'Time & Reason Clauses', '**시간:** when, while, before, after, until(~할 때까지), since(~ 이래로), as soon as(~하자마자)
**이유:** because, since, as (~ 때문에)
시간·조건 부사절은 미래 대신 현재시제', 'Wait here until I come back. | 내가 돌아올 때까지 여기서 기다려.
As soon as he saw me, he ran away. | 그는 나를 보자마자 도망쳤다.
Since it was late, we took a taxi. | 늦어서 우리는 택시를 탔다.', 'since 는 ''~ 이래로''와 ''~ 때문에'' 두 뜻이 있어요.', 101),
  ('M2-10-2', 2, 10, '접속사 심화', 2, '접속사 심화', '조건·양보·결과의 부사절 접속사 (so ~ that 등)', 'Condition, Concession, Result', '**조건:** if(~하면), unless(~하지 않으면 = if ~ not)
**양보:** although, though, even though (비록 ~이지만)
**결과:** so + 형용사·부사 + that ~ (너무 ~해서 …하다) / so that ~ (~하기 위해서)', 'Unless you hurry, you''ll miss the bus. | 서두르지 않으면 버스를 놓칠 거야.
Although it rained, we went out. | 비가 왔지만 우리는 나갔다.
He was so tired that he fell asleep. | 그는 너무 피곤해서 잠들었다.', 'unless 안에는 not 을 또 쓰지 않아요. (Unless you don''t ✗)', 102),
  ('M2-10-3', 2, 10, '접속사 심화', 3, '접속사 심화', '명사절 접속사 (that, if/whether)', 'Noun Clauses: that, if/whether', '**that:** ~라는 것 (주어·목적어·보어), 목적어 자리 that 은 생략 가능
**if / whether:** ~인지 아닌지
주어 자리, 전치사 뒤, or not 바로 앞은 **whether** 만', 'I believe that you can do it. | 나는 네가 할 수 있다고 믿는다.
I wonder if she likes me. | 그녀가 나를 좋아하는지 궁금하다.
Whether he comes or not is not important. | 그가 오든 안 오든 중요하지 않다.', 'If he comes ~ is important ✗ → Whether ✓ (주어 자리)', 103),
  ('M2-11-1', 2, 11, '관계사 I', 1, '관계사 I', '주격·목적격·소유격 관계대명사', 'Relative Pronouns', '앞의 명사(선행사)를 꾸미는 절을 이끌어요.
사람: **who**(주격) / **whom, who**(목적격) / **whose**(소유격)
사물·동물: **which** (소유격 whose)
목적격 관계대명사는 생략할 수 있어요.', 'I have a friend who lives in Canada. | 나는 캐나다에 사는 친구가 있다.
This is the book (which) I bought yesterday. | 이것이 내가 어제 산 책이다.
She is the girl whose father is a pilot. | 그녀는 아빠가 조종사인 소녀이다.', '주격 관계대명사 뒤 동사는 선행사에 수 일치! (a friend who live ✗)', 111),
  ('M2-11-2', 2, 11, '관계사 I', 2, '관계사 I', '관계대명사 that과 what', 'that & what', '**that:** 사람·사물 모두 가능 (콤마 뒤, 전치사 뒤 ✗)
선행사에 최상급, 서수, the only, all, -thing 이 있으면 주로 that
**what = the thing(s) which** (~하는 것): 선행사가 없어요.', 'He is the only person that knows the answer. | 그는 답을 아는 유일한 사람이다.
What I want is your smile. | 내가 원하는 것은 너의 미소다.
This is not what I ordered. | 이것은 내가 주문한 것이 아니다.', '앞에 명사(선행사)가 있으면 that/which, 없으면 what!', 112),
  ('M2-12-1', 2, 12, '가정법 I', 1, '가정법 I', '가정법 과거 개념 및 구문', 'Second Conditional', '현재 사실과 반대되는 상상
**If + 주어 + 과거동사, 주어 + would/could + 동사원형**
be동사는 주어와 상관없이 주로 **were**
모양은 과거, 뜻은 현재!', 'If I had wings, I could fly. | 내게 날개가 있다면 날 수 있을 텐데.
If I were you, I would study harder. | 내가 너라면 더 열심히 공부할 텐데.
If it were sunny, we would go out. | 날씨가 맑다면 나갈 텐데.', 'If I were rich = 실제로는 부자가 아니다', 121),
  ('M2-12-2', 2, 12, '가정법 I', 2, '가정법 I', '다양한 형태의 가정법 과거 표현', 'I wish, as if (Past)', '**I wish + 가정법 과거:** ~라면 좋을 텐데 (현재 이루기 어려운 소망)
**as if + 가정법 과거:** 마치 ~인 것처럼
직설법으로 바꾸기: I wish I were tall. = I''m sorry (that) I''m not tall.', 'I wish I lived near the sea. | 바다 근처에 살면 좋을 텐데.
I wish I could swim. | 수영을 할 수 있으면 좋을 텐데.
He talks as if he knew everything. | 그는 마치 모든 것을 아는 것처럼 말한다.', 'I wish 뒤 동사는 한 시제 과거로!', 122),
  ('M3-01-1', 3, 1, '문장 구조와 보어 완성', 1, '문장 구조와 보어 완성', '목적어를 가지는 동사', 'Verbs with Objects', '3형식 동사는 명사, 대명사, to부정사, 동명사, 명사절(that, if, 의문사절)을 목적어로 가져요.
전치사 없이 바로 목적어: discuss, enter, reach, marry, attend, resemble', 'We discussed the problem. | 우리는 그 문제를 논의했다.
She resembles her mother. | 그녀는 엄마를 닮았다.
I don''t know what to say. | 무슨 말을 해야 할지 모르겠다.', 'discuss about ✗ / reach at ✗ / marry with ✗', 11),
  ('M3-01-2', 3, 1, '문장 구조와 보어 완성', 2, '문장 구조와 보어 완성', '주격 보어를 가지는 동사', 'Verbs with Subject Complements', '2형식: 주어 + 동사 + **보어(명사·형용사)**
상태: be, keep, stay, remain / 변화: become, get, turn, grow, go / 감각: look, sound, smell, taste, feel / 판단: seem, appear', 'The leaves turned red. | 나뭇잎이 빨갛게 변했다.
Please keep quiet. | 조용히 해 주세요.
He seems happy these days. | 그는 요즘 행복해 보인다.', '보어 자리에 부사 ✗ (stay calmly ✗ → stay calm ✓)', 12),
  ('M3-01-3', 3, 1, '문장 구조와 보어 완성', 3, '문장 구조와 보어 완성', '다양한 목적격 보어 (지각·사역·준사역 동사)', 'Object Complements', 'make/keep/find + 목적어 + **형용사** / call/name/elect + 목적어 + **명사**
want/ask/tell/allow/expect + 목적어 + **to부정사**
지각동사 + 목적어 + 동사원형/-ing / 사역 make·have·let + 동사원형 / 준사역 get + to부정사, help + (to) 동사원형
목적어와 수동 관계면 **p.p.** (I had my hair cut.)', 'The news made us happy. | 그 소식은 우리를 행복하게 했다.
Mom told me to clean my room. | 엄마가 방을 청소하라고 하셨다.
I had my bike repaired. | 나는 자전거를 수리 받았다.', '목적어가 직접 하면 동사원형, 당하면 p.p.', 13),
  ('M3-02-1', 3, 2, '완료시제 완성', 1, '완료시제 완성', '현재완료 종합', 'Present Perfect Review', '**have/has + p.p.** 의 4가지 쓰임(경험·계속·완료·결과) 종합
**현재완료진행:** have been + -ing (지금까지 계속 ~하고 있다)
How long have you ~? / When did you ~? (when 은 과거시제와!)', 'I have known her for ten years. | 나는 그녀를 10년 동안 알아 왔다.
It has been raining since morning. | 아침부터 계속 비가 오고 있다.
When did you arrive? | 언제 도착했니?', 'When have you arrived? ✗ → When did you arrive? ✓', 21),
  ('M3-02-2', 3, 2, '완료시제 완성', 2, '완료시제 완성', '과거완료 및 미래완료시제', 'Past & Future Perfect', '**과거완료 had + p.p.:** 과거의 어느 때보다 더 먼저 일어난 일(대과거) 또는 그때까지의 경험·계속
**미래완료 will have + p.p.:** 미래의 어느 때까지 완료될 일', 'When I got to the station, the train had already left. | 내가 역에 도착했을 때 기차는 이미 떠났다.
I had never seen snow before I came here. | 여기 오기 전에는 눈을 본 적이 없었다.
I will have finished it by tomorrow. | 내일까지는 그것을 끝냈을 것이다.', '두 과거 중 ''더 먼저'' 일어난 일이 had p.p.', 22),
  ('M3-03-1', 3, 3, '조동사 완성과 관용 표현', 1, '조동사 완성과 관용 표현', '의미별 조동사 용법 정리', 'Modals by Meaning', '**능력:** can, be able to / **허락:** can, may / **의무:** must, have to, should, ought to
**추측의 강도:** must(틀림없다) > may/might(~일지도) > can''t(~일 리 없다)
**과거의 습관:** used to, would', 'He must be at home; the lights are on. | 불이 켜져 있으니 그는 집에 있음에 틀림없다.
She can''t be 40. She looks so young. | 그녀가 40살일 리 없어. 너무 어려 보여.
We would play here after school. | 우리는 방과 후에 여기서 놀곤 했다.', 'would 는 ''동작''의 습관만, used to 는 ''상태''도 가능', 31),
  ('M3-03-2', 3, 3, '조동사 완성과 관용 표현', 2, '조동사 완성과 관용 표현', '자주 쓰이는 조동사 관용 구문', 'Modal Expressions', '**cannot help -ing** (~하지 않을 수 없다) / **cannot ~ too** (아무리 ~해도 지나치지 않다)
**may well + 동사원형** (~하는 것도 당연하다) / **may as well** (~하는 편이 낫다)
**would rather A than B** (B 하느니 차라리 A 하겠다)', 'I couldn''t help laughing. | 웃지 않을 수 없었다.
You cannot be too careful. | 아무리 조심해도 지나치지 않다.
I would rather stay home than go out. | 나가느니 차라리 집에 있겠다.', 'would rather 뒤에는 동사원형! (would rather to stay ✗)', 32),
  ('M3-03-3', 3, 3, '조동사 완성과 관용 표현', 3, '조동사 완성과 관용 표현', '조동사 + have p.p. (과거 추측·후회)', 'Modal + have p.p.', '**must have p.p.:** ~했음에 틀림없다 / **can''t have p.p.:** ~했을 리 없다
**may(might) have p.p.:** ~했을지도 모른다
**should have p.p.:** ~했어야 했는데 (안 했다, 후회)', 'She must have been tired yesterday. | 그녀는 어제 피곤했음에 틀림없다.
He can''t have said that. | 그가 그런 말을 했을 리 없다.
I should have studied harder. | 더 열심히 공부했어야 했는데.', '과거 일에 대한 추측·후회 → 조동사 + have p.p.', 33),
  ('M3-04-1', 3, 4, '수동태 완성과 특수 수동태', 1, '수동태 완성과 특수 수동태', '수동태 세부 쓰임', 'Passive Details', '**진행 수동태:** be being p.p. (지금 ~되고 있다)
**완료 수동태:** have been p.p.
자동사(happen, appear, disappear, arrive)와 상태동사(have, resemble)는 수동태 ✗', 'The road is being repaired. | 도로가 수리되고 있다.
The tickets have been sold out. | 표가 매진되었다.
The accident happened last night. | 그 사고는 어젯밤에 일어났다.', 'was happened ✗ → happened ✓', 41),
  ('M3-04-2', 3, 4, '수동태 완성과 특수 수동태', 2, '수동태 완성과 특수 수동태', '문장 형태별 수동태 (의문문·명령문·조동사)', 'Passives in Questions, Commands, Modals', '**조동사 수동태:** 조동사 + be + p.p. (can be seen, must be done)
**의문문:** Be동사 + 주어 + p.p. ~? / 의문사 + be + 주어 + p.p. ~?
**명령문:** Let + 목적어 + be + p.p.', 'The stars can be seen at night. | 밤에는 별을 볼 수 있다.
Was this picture painted by you? | 이 그림은 네가 그렸니?
When was the tower built? | 그 탑은 언제 지어졌니?', '조동사 뒤에는 be + p.p.! (must is done ✗)', 42),
  ('M3-04-3', 3, 4, '수동태 완성과 특수 수동태', 3, '수동태 완성과 특수 수동태', '주의해야 할 수동태 (지각·사역동사, 목적어가 절)', 'Special Passives', '**지각·사역동사 수동태:** 동사원형 보어 → to부정사 (He was made to wait.)
**목적어가 that절:** People say that ~ → It is said that ~ / 주어 is said to ~', 'She was seen to leave the house. | 그녀가 집을 나서는 것이 목격되었다.
It is said that he is rich. | 그는 부자라고들 한다.
He is said to be rich. | 그는 부자라고 한다.', 'was made wait ✗ → was made to wait ✓', 43),
  ('M3-05-1', 3, 5, 'to부정사 완성', 1, 'to부정사 완성', '명사적 용법 (의문사 + to부정사)', 'Wh-word + to-infinitive', '**의문사 + to부정사** = 의문사 + 주어 + should + 동사원형
what to do(무엇을 할지), how to swim(수영하는 법), where to go, when to start
가목적어 it: I found **it** hard **to** solve the problem.', 'I don''t know what to do. | 무엇을 해야 할지 모르겠다.
Can you tell me how to get there? | 거기 가는 방법을 알려 줄래요?
I found it easy to make friends. | 친구를 사귀는 것이 쉽다는 것을 알았다.', 'why to ✗ (why 는 to부정사와 함께 쓰지 않아요)', 51),
  ('M3-05-2', 3, 5, 'to부정사 완성', 2, 'to부정사 완성', '형용사·부사적 용법의 세부 의미', 'Detailed Meanings', '**be to 용법:** 예정·의무·가능·운명·의도 (We are to meet at 5.)
**부사적:** 목적, 감정의 원인, 판단의 근거, 결과(only to ~: 결국 ~하고 말았다), 조건
형용사 수식: easy to read, hard to understand', 'We are to meet at five. | 우리는 5시에 만날 예정이다.
He tried hard, only to fail. | 그는 열심히 노력했지만 결국 실패했다.
This book is easy to read. | 이 책은 읽기 쉽다.', 'This book is easy to read it ✗ (목적어를 또 쓰지 않아요)', 52),
  ('M3-05-3', 3, 5, 'to부정사 완성', 3, 'to부정사 완성', '의미상 주어, 완료부정사, 수동 부정사', 'Subject, Perfect & Passive Infinitives', '**의미상 주어:** for + 목적격 / 성격 형용사는 of + 목적격
**완료부정사 to have p.p.:** 본동사보다 이전의 일 (He seems to have been sick.)
**수동 부정사 to be p.p.:** ~되는 것 (I want to be loved.)', 'It is necessary for you to rest. | 너는 쉴 필요가 있다.
He seems to have been rich. | 그는 (예전에) 부자였던 것 같다.
Everyone wants to be loved. | 모두 사랑받기를 원한다.', 'seems to have p.p. = It seems that 주어 + 과거동사', 53),
  ('M3-05-4', 3, 5, 'to부정사 완성', 4, 'to부정사 완성', '자주 쓰는 to부정사 구문 및 독립부정사', 'Common Patterns & Independent Infinitives', 'too ~ to / enough to / in order to / so as to
**seem to:** It seems that ~ = 주어 + seem(s) to ~
**독립부정사:** to tell the truth(사실은), to be honest(솔직히), needless to say(말할 필요도 없이), strange to say(이상한 얘기지만)', 'To tell the truth, I forgot it. | 사실은 잊어버렸어.
She seems to be busy. | 그녀는 바빠 보인다.
He saved money so as to buy a laptop. | 그는 노트북을 사기 위해 돈을 모았다.', '독립부정사는 문장 전체를 꾸며요.', 54),
  ('M3-06-1', 3, 6, '동명사 완성', 1, '동명사 완성', '동명사의 역할과 의미상 주어', 'Gerunds & Their Subjects', '**의미상 주어:** 소유격 또는 목적격 + 동명사 (Do you mind my/me opening the window?)
**부정:** not + 동명사 (I''m sorry for not calling you.)
**완료 동명사 having p.p.:** 본동사보다 이전 / **수동 동명사 being p.p.**', 'I''m proud of my son winning the prize. | 나는 아들이 상을 받은 것이 자랑스럽다.
She apologized for not coming. | 그녀는 오지 않은 것을 사과했다.
He denied having stolen the bag. | 그는 가방을 훔친 것을 부인했다.', 'not 의 위치: 동명사 바로 앞!', 61),
  ('M3-06-2', 3, 6, '동명사 완성', 2, '동명사 완성', '동명사 vs to부정사 의미 구분 및 관용 구문', 'Meaning Differences', '**remember/forget -ing:** (과거에) ~한 것을 / **to부정사:** (앞으로) ~할 것을
**try -ing:** 시험 삼아 ~해 보다 / **try to:** ~하려고 애쓰다
**stop -ing:** ~하는 것을 멈추다 / **stop to:** ~하기 위해 멈추다
regret -ing(~한 것을 후회) / regret to(~하게 되어 유감)', 'I remember meeting her. | 그녀를 만났던 것을 기억한다.
Remember to lock the door. | 문 잠그는 것 잊지 마.
He stopped to buy some water. | 그는 물을 사려고 멈췄다.', '-ing 는 과거(이미 한 일), to 는 미래(할 일)', 62),
  ('M3-07-1', 3, 7, '분사와 분사구문 완성', 1, '분사와 분사구문 완성', '분사구문의 기본 개념 (처음 배우기)', 'Participle Clauses: Basics', '부사절을 분사로 줄인 것이 **분사구문**이에요.
① 접속사 생략 ② 주어가 같으면 주어 생략 ③ 동사를 -ing 로
When I opened the door, I saw him. → **Opening** the door, I saw him.
뜻: 시간, 이유, 동시동작(~하면서), 조건, 양보', 'Walking down the street, I met Tom. | 길을 걸어가다가 Tom을 만났다.
Feeling tired, she went to bed early. | 피곤해서 그녀는 일찍 잤다.
He watched TV, eating popcorn. | 그는 팝콘을 먹으면서 TV를 봤다.', '부정은 Not + 분사: Not knowing what to do, ~', 71),
  ('M3-07-2', 3, 7, '분사와 분사구문 완성', 2, '분사와 분사구문 완성', '감정유발 분사 및 명사 수식', 'Emotion Participles', '감정을 일으키는 쪽 → **-ing** (exciting, boring, surprising, interesting, tiring)
감정을 느끼는 쪽 → **p.p.** (excited, bored, surprised, interested, tired)
분사 단독은 명사 앞, 다른 말과 함께면 명사 뒤', 'The game was exciting. | 경기는 신났다.
The fans were excited. | 팬들은 신이 났다.
The girl sitting next to me is my cousin. | 내 옆에 앉아 있는 소녀는 내 사촌이다.', 'I''m boring. = 나는 지루한 사람이다 (!) / I''m bored. = 나는 지루하다', 72),
  ('M3-07-3', 3, 7, '분사와 분사구문 완성', 3, '분사와 분사구문 완성', '분사구문의 시제와 수동 분사구문', 'Perfect & Passive Participle Clauses', '**완료 분사구문 Having p.p.:** 주절보다 먼저 일어난 일
**수동 분사구문 (Being) p.p.:** 주어가 동작을 당할 때, Being 은 주로 생략
Seen from the sky, the island looks like a heart.', 'Having finished my homework, I went out. | 숙제를 끝낸 후 나는 밖에 나갔다.
Written in easy English, the book is popular. | 쉬운 영어로 쓰여 있어서 그 책은 인기가 있다.
Seen from far away, it looks small. | 멀리서 보면 그것은 작아 보인다.', '주어가 ''당하면'' p.p.로 시작!', 73),
  ('M3-07-4', 3, 7, '분사와 분사구문 완성', 4, '분사와 분사구문 완성', '주의해야 할 분사구문 (with + 목적어 + 분사, 독립분사구문)', 'with + O + Participle', '**with + 목적어 + 분사:** ~한 채로 (목적어가 하면 -ing, 당하면 p.p.)
with his eyes **closed**, with the TV **turned** on, with the dog **following** me
**독립분사구문:** 주어가 다르면 주어를 남겨요 (It being rainy, ~)
비인칭: generally speaking, judging from, frankly speaking', 'She listened to music with her eyes closed. | 그녀는 눈을 감은 채로 음악을 들었다.
He ran with his dog following him. | 그는 개가 따라오는 채로 달렸다.
It being sunny, we went on a picnic. | 날씨가 맑아서 우리는 소풍을 갔다.', '눈은 ''감겨지는'' 것 → closed ✓ (closing ✗)', 74),
  ('M3-08-1', 3, 8, '접속사 및 상관접속사', 1, '접속사 및 상관접속사', '부사절 접속사 총정리', 'Adverb Clauses Review', '시간(when, while, until, since, as soon as) / 이유(because, since, as) / 조건(if, unless, as long as) / 양보(although, even if) / 목적(so that) / 결과(so ~ that, such ~ that)
**전치사와 구별:** because of, despite, during + 명사', 'As long as you''re happy, I''m happy. | 네가 행복하기만 하면 나도 행복해.
Even though he was tired, he kept working. | 그는 피곤했지만 계속 일했다.
Speak louder so that everyone can hear you. | 모두가 들을 수 있도록 더 크게 말해.', '접속사 + 주어 + 동사 / 전치사 + 명사', 81),
  ('M3-08-2', 3, 8, '접속사 및 상관접속사', 2, '접속사 및 상관접속사', '명사절 접속사 I (that, if/whether)', 'Noun Clauses I', '**that 절:** 주어(It ~ that 가주어), 목적어, 보어
**if/whether 절:** ~인지 아닌지 / 주어 자리·전치사 뒤·to부정사 앞은 whether
I''m not sure whether to go or stay.', 'It is true that he won the contest. | 그가 대회에서 우승한 것은 사실이다.
The problem is that we have no time. | 문제는 우리에게 시간이 없다는 것이다.
I''m not sure whether he will come. | 그가 올지 확실하지 않다.', '주어 자리 that절은 보통 It 으로 바꿔 써요.', 82),
  ('M3-08-3', 3, 8, '접속사 및 상관접속사', 3, '접속사 및 상관접속사', '간접의문문과 상관접속사', 'Embedded Questions & Correlatives', '**간접의문문:** 의문사 + 주어 + 동사 (Do you know where he is?) / 의문사 없으면 if/whether
think, believe, guess 는 의문사를 맨 앞으로: What do you think he wants?
**상관접속사:** both A and B(복수) / either A or B, neither A nor B, not only A but also B(B에 수 일치) / not A but B', 'I don''t know what time it is. | 몇 시인지 모르겠다.
Can you tell me where the station is? | 역이 어디 있는지 알려 줄래요?
Not only I but also my sister likes cats. | 나뿐만 아니라 언니도 고양이를 좋아한다.', 'Do you know where is he? ✗ → where he is ✓', 83),
  ('M3-08-4', 3, 8, '접속사 및 상관접속사', 4, '접속사 및 상관접속사', '동격의 that', 'Appositive that', '명사 + **that + 완전한 문장:** ''~라는 (명사)''
자주 쓰는 명사: fact, news, idea, belief, hope, rumor, truth
관계대명사 that 과 구별: 동격 that 뒤는 **완전한 문장**, 관계대명사 that 뒤는 **불완전한 문장**', 'I heard the news that she won. | 나는 그녀가 이겼다는 소식을 들었다.
The fact that he lied surprised me. | 그가 거짓말을 했다는 사실이 나를 놀라게 했다.
There is a rumor that the shop will close. | 그 가게가 문을 닫는다는 소문이 있다.', 'the news that I heard(관계대명사: heard 의 목적어 빠짐) vs the news that she won(동격: 완전)', 84),
  ('M3-09-1', 3, 9, '관계사 완성', 1, '관계사 완성', '관계대명사의 세부 격과 쓰임', 'Relative Pronouns in Detail', '주격 who/which/that, 목적격 whom/which/that(생략 가능), 소유격 whose
**주격 관계대명사 + be동사** 는 함께 생략 가능 (the boy (who is) playing)
관계대명사 뒤는 **불완전한 문장**', 'The man (whom) I met yesterday was kind. | 내가 어제 만난 남자는 친절했다.
The boy (who is) playing soccer is my brother. | 축구하는 소년은 내 동생이다.
I know a girl whose dream is to be a pilot. | 나는 꿈이 조종사인 소녀를 안다.', '관계대명사 뒤에 목적어를 또 쓰지 않아요. (the book which I read it ✗)', 91),
  ('M3-09-2', 3, 9, '관계사 완성', 2, '관계사 완성', '관계부사 (when, where, why, how)와 생략·계속적 용법', 'Relative Adverbs & Non-defining Clauses', '**관계부사 = 전치사 + which**, 뒤는 **완전한 문장**
시간 when / 장소 where / 이유 why / 방법 how (the way 와 how 는 함께 쓰지 않음)
**계속적 용법:** 콤마 + who/which (that ✗), ''그리고 그는/그것은''', 'This is the house where I was born. | 이곳은 내가 태어난 집이다.
I remember the day when we first met. | 우리가 처음 만난 날을 기억한다.
Tell me the way he solved it. | 그가 그것을 푼 방법을 말해 줘.
I have a sister, who lives in Paris. | 나는 언니가 한 명 있는데, 파리에 산다.', 'the way how ✗ → the way 또는 how 하나만!', 92),
  ('M3-09-3', 3, 9, '관계사 완성', 3, '관계사 완성', '주의해야 할 관계사 (전치사 + 관계대명사)', 'Preposition + Relative', '전치사는 관계대명사 앞으로 올 수 있어요: the house in which I live = the house which I live in
**전치사 + whom / which** (that ✗, who ✗)
전치사가 앞에 오면 관계대명사를 생략할 수 없어요.', 'This is the girl with whom I went to the concert. | 이 사람이 나와 콘서트에 간 소녀다.
The chair on which you are sitting is old. | 네가 앉아 있는 의자는 오래됐다.
The city in which I live is beautiful. | 내가 사는 도시는 아름답다.', 'in that ✗ / with who ✗', 93),
  ('M3-09-4', 3, 9, '관계사 완성', 4, '관계사 완성', '복합관계사 (복합관계대명사, 복합관계부사)', 'Compound Relatives', '**whoever**(누구든지), **whatever**(무엇이든지), **whichever**(어느 것이든지)
**whenever**(~할 때마다, 언제든지), **wherever**(어디든지), **however + 형용사**(아무리 ~해도)
양보: No matter what = whatever', 'Whoever comes first will win. | 먼저 오는 사람은 누구든 이긴다.
You can eat whatever you want. | 원하는 것은 무엇이든 먹어도 돼.
However hard it is, I won''t give up. | 아무리 어려워도 포기하지 않을 거야.', 'However it is hard ✗ → However hard it is ✓', 94),
  ('M3-10-1', 3, 10, '비교 구문 완성', 1, '비교 구문 완성', '원급·비교급·최상급 종합 원리', 'Comparison Review', 'as 원급 as / not as(so) 원급 as(~만큼 …하지 않은) / 배수 as ~ as
비교급 than / 비교급 강조(much, even, far, still, a lot)
the 최상급 + in(장소·집단) / of(복수) / 현재완료 경험(the best ~ I have ever seen)', 'He is not as tall as his brother. | 그는 형만큼 키가 크지 않다.
This is the best movie I have ever seen. | 이것은 내가 본 영화 중 최고다.
Seoul is much bigger than Busan. | 서울은 부산보다 훨씬 크다.', '비교하는 대상의 형태를 맞춰요: My bag is bigger than yours(your bag).', 101),
  ('M3-10-2', 3, 10, '비교 구문 완성', 2, '비교 구문 완성', '최상급 대용 표현 및 관용 비교구문', 'Superlative Equivalents', '**최상급 = No (other) 단수명사 ~ 비교급 than / as 원급 as**
= 비교급 than any other 단수명사 / 비교급 than all the other 복수명사
관용: no more than(겨우), no less than(~만큼이나), not so much A as B(A라기보다는 B)', 'Mt. Everest is the highest mountain in the world. | 에베레스트는 세계에서 가장 높은 산이다.
= No other mountain in the world is higher than Mt. Everest. | (같은 뜻)
= Mt. Everest is higher than any other mountain in the world. | (같은 뜻)', 'any other + 단수명사! (any other mountains ✗)', 102),
  ('M3-11-1', 3, 11, '가정법 완성', 1, '가정법 완성', '가정법 과거 및 과거완료', 'Second & Third Conditionals', '**가정법 과거:** If + 과거, would + 동사원형 → 현재 사실의 반대
**가정법 과거완료:** If + had p.p., would have p.p. → 과거 사실의 반대
**혼합가정법:** If + had p.p., would + 동사원형 now', 'If I had known it, I would have told you. | 내가 그것을 알았다면 너에게 말했을 텐데.
If she had studied, she would have passed. | 그녀가 공부했다면 합격했을 텐데.
If I had slept well, I wouldn''t be tired now. | 잘 잤다면 지금 피곤하지 않을 텐데.', '과거의 후회·반대 상상 → had p.p. + would have p.p.', 111),
  ('M3-11-2', 3, 11, '가정법 완성', 2, '가정법 완성', 'as if, I wish 가정법', 'as if & I wish', '**I wish + 과거:** (지금) ~라면 좋을 텐데 / **I wish + had p.p.:** (그때) ~했더라면 좋았을 텐데
**as if + 과거:** (지금) 마치 ~인 것처럼 / **as if + had p.p.:** (그때) 마치 ~였던 것처럼', 'I wish I had studied harder. | 더 열심히 공부했더라면 좋았을 텐데.
She talks as if she were a princess. | 그녀는 마치 공주인 것처럼 말한다.
He looks as if he had seen a ghost. | 그는 마치 유령이라도 본 것 같은 얼굴이다.', '주절 시제와 비교해 ''같은 때''면 과거, ''더 이전''이면 had p.p.', 112),
  ('M3-11-3', 3, 11, '가정법 완성', 3, '가정법 완성', '주의해야 할 가정법 (without/but for, 조건절 대용)', 'Without, But for, Implied Conditions', '**Without(But for) ~, 가정법:** ~이 없다면(없었다면)
= If it were not for ~ (현재) / If it had not been for ~ (과거)
**It''s time + 과거동사:** 이제 ~할 시간이다
조건절 대용: otherwise(그렇지 않으면), to부정사, 주어 자체', 'Without water, we could not live. | 물이 없다면 우리는 살 수 없을 것이다.
But for your help, I would have failed. | 너의 도움이 없었다면 나는 실패했을 것이다.
It''s time you went to bed. | 이제 잘 시간이다.', 'Without = If it were not for (현재) = Were it not for (도치)', 113),
  ('M3-12-1', 3, 12, '특수구문', 1, '특수구문', '수의 일치 및 시제 일치', 'Agreement & Sequence of Tenses', '**수의 일치:** 주어의 핵심 명사에 동사를 맞춰요 (The number of ~ 단수 / A number of ~ 복수)
동명사·to부정사·명사절 주어는 단수
**시제 일치:** 주절이 과거면 종속절도 과거·과거완료 (예외: 진리, 습관, 역사적 사실)', 'The number of students is increasing. | 학생 수가 늘고 있다.
A number of students are absent. | 많은 학생이 결석했다.
She said that she was hungry. | 그녀는 배가 고프다고 말했다.
We learned that the earth moves around the sun. | 우리는 지구가 태양 주위를 돈다고 배웠다.', '진리는 시제 일치의 예외 → 항상 현재!', 121),
  ('M3-12-2', 3, 12, '특수구문', 2, '특수구문', '강조 (It ~ that, 조동사 do) 및 도치', 'Emphasis & Inversion', '**It is(was) 강조할 말 that ~:** 바로 ~이다 (주어·목적어·부사구 강조)
**do/does/did + 동사원형:** 정말 ~하다 (동사 강조)
**도치:** 부정어(Never, Little, Hardly) / 장소 부사구 / So, Neither 가 앞으로 오면 동사가 주어 앞으로', 'It was Tom that broke the window. | 창문을 깬 것은 바로 Tom이었다.
I do love you. | 나는 정말 너를 사랑해.
Never have I seen such a big fish. | 나는 그렇게 큰 물고기를 본 적이 없다.
I like it. — So do I. | 나 그거 좋아해. — 나도.', 'Never I have seen ✗ → Never have I seen ✓', 122),
  ('M3-12-3', 3, 12, '특수구문', 3, '특수구문', '부정구문, 병렬구조 및 생략', 'Negation, Parallelism, Ellipsis', '**부분부정:** not + all/every/always (모두 ~인 것은 아니다) / **전체부정:** no, none, never
**병렬구조:** and, but, or 로 연결된 말은 같은 형태 (to read, to write / reading, writing)
**생략:** 반복되는 말, 부사절의 ''주어 + be동사'' (When (I was) young, ~)', 'Not all birds can fly. | 모든 새가 날 수 있는 것은 아니다.
I like swimming, hiking, and reading. | 나는 수영, 등산, 독서를 좋아한다.
When young, he lived in Jeju. | 어렸을 때 그는 제주에 살았다.', 'I like to swim and hiking ✗ → to swim and (to) hike ✓', 123),
  ('H-01-1', 4, 1, '주어-동사 수의 일치', 1, '주어-동사 수의 일치', '수식어가 결합된 복잡한 주어의 수 일치', 'Agreement with Long Subjects', '주어 뒤의 **전치사구, 관계사절, 분사구, to부정사구**를 괄호로 묶고 핵심 주어를 찾아요.
The key (to the doors) **is** ~ / People (who live here) **are** ~
동명사·to부정사·명사절 주어 → 단수', 'The boxes in the corner are heavy. | 구석에 있는 상자들은 무겁다.
The girl standing with her friends is my sister. | 친구들과 서 있는 소녀가 내 여동생이다.
What you need is a good rest. | 네게 필요한 것은 충분한 휴식이다.', '동사 바로 앞의 명사에 속지 마세요!', 11),
  ('H-01-2', 4, 1, '주어-동사 수의 일치', 2, '주어-동사 수의 일치', '부분 표현 및 상관접속사 주어의 수 일치', 'Partitives & Correlative Subjects', '**부분 표현(all, most, some, half, the rest, 분수, percent) of + 명사:** of 뒤 명사에 수 일치
**상관접속사:** both A and B → 복수 / either A or B, neither A nor B, not only A but also B, not A but B → **B에 일치** / A as well as B → **A에 일치**', 'Most of the water is polluted. | 그 물의 대부분이 오염되었다.
Twenty percent of the students are absent. | 학생의 20%가 결석했다.
Neither you nor he is wrong. | 너도 그도 틀리지 않았다.', 'each/every/one of + 복수명사 → 단수 동사', 12),
  ('H-01-3', 4, 1, '주어-동사 수의 일치', 3, '주어-동사 수의 일치', '도치문에서의 주어-동사 수 일치', 'Agreement in Inversion', '장소·방향 부사구, 보어, 부정어가 문장 앞에 오면 **동사 + 주어** 순서
동사 **뒤**에 있는 진짜 주어를 찾아 수를 맞춰요.
There is/are ~ 도 같은 원리', 'On the hill stands an old church. | 언덕 위에 오래된 교회가 서 있다.
Among the guests were two famous actors. | 손님들 중에는 유명 배우 두 명이 있었다.
So important are these rules that ~ | 이 규칙들은 너무 중요해서 ~', '도치문은 동사 뒤 명사가 주어!', 13),
  ('H-02-1', 4, 2, '동사 vs 준동사 구별', 1, '동사 vs 준동사 구별', '문장의 본동사 자리 구별 및 동사 개수 파악', 'Finding the Main Verb', '한 문장(절)에는 **본동사가 하나**만 있어요.
접속사·관계사가 하나 늘면 동사도 하나 늘어요 (동사 수 = 접속사 수 + 1)
본동사 자리에 to부정사, -ing, 분사가 오면 틀린 문장', 'The man who lives next door is a doctor. | 옆집에 사는 남자는 의사이다.
People living in cities often feel lonely. | 도시에 사는 사람들은 종종 외로움을 느낀다.
What surprised me was his honesty. | 나를 놀라게 한 것은 그의 정직함이었다.', '접속사 없이 동사가 두 개면 하나는 준동사여야 해요.', 21),
  ('H-02-2', 4, 2, '동사 vs 준동사 구별', 2, '동사 vs 준동사 구별', '부정사·동명사·분사의 기능 구별', 'Functions of Non-finite Verbs', '**명사 역할(주어·목적어·보어):** to부정사, 동명사
**형용사 역할(명사 수식):** to부정사, 현재분사, 과거분사
**부사 역할(목적·이유·분사구문):** to부정사, 분사
자리를 보고 어떤 준동사가 와야 하는지 판단해요.', 'Reading books improves your vocabulary. | 책을 읽는 것은 어휘력을 높여 준다.
The girl dancing on the stage is my friend. | 무대에서 춤추는 소녀는 내 친구다.
To get there on time, we left early. | 제시간에 도착하기 위해 우리는 일찍 출발했다.', '전치사 뒤 → 동명사 / 명사 뒤 수식 → 분사·to부정사', 22),
  ('H-03-1', 4, 3, '능동태 vs 수동태', 1, '능동태 vs 수동태', '타동사의 목적어 유무에 따른 능동/수동 판단', 'Active vs Passive by Object', '타동사 뒤에 **목적어가 있으면 능동**, **없으면 수동**
주어가 행동을 하는 주체인지, 당하는 대상인지 의미로도 확인
자동사(happen, occur, appear, disappear, rise)는 수동태 ✗', 'The museum attracts many tourists. | 그 박물관은 많은 관광객을 끌어들인다.
Many tourists are attracted to the museum. | 많은 관광객이 그 박물관에 끌린다.
The accident occurred at night. | 그 사고는 밤에 발생했다.', 'was occurred ✗ / rise(자동사) vs raise(타동사)', 31),
  ('H-03-2', 4, 3, '능동태 vs 수동태', 2, '능동태 vs 수동태', '3·4·5형식 수동태 및 목적격 보어의 태 판단', 'Passives & Object Complements', '4형식 수동태는 수동태 뒤에도 목적어가 하나 남아요 (I was given a chance.)
5형식 수동태는 보어가 남아요 (He was elected captain.)
**목적격 보어:** 목적어가 하면 동사원형/to부정사/-ing, 당하면 **p.p.**', 'I was offered a job. | 나는 일자리를 제안받았다.
She kept the door locked. | 그녀는 문을 잠가 두었다.
I heard my name called. | 내 이름이 불리는 것을 들었다.', '수동태 뒤 명사가 있다고 무조건 능동은 아니에요 (4·5형식).', 32),
  ('H-03-3', 4, 3, '능동태 vs 수동태', 3, '능동태 vs 수동태', '감정유발 동사의 현재분사 vs 과거분사', 'Emotion -ing vs -ed', 'surprise, interest, excite, bore, satisfy, disappoint, embarrass, frustrate…
수식받는 명사가 감정을 **일으키면 -ing**, **느끼면 -ed**
사람 = 대체로 -ed, 사물 = 대체로 -ing (예외 주의: a boring person)', 'The result was disappointing. | 결과는 실망스러웠다.
The disappointed fans left early. | 실망한 팬들은 일찍 떠났다.
She found the lecture interesting. | 그녀는 그 강의가 흥미롭다고 생각했다.', '감정 주체를 찾고 ''느끼는지, 주는지'' 판단!', 33),
  ('H-04-1', 4, 4, '관계사 vs 접속사', 1, '관계사 vs 접속사', '관계대명사 vs 관계부사 (완전/불완전 절)', 'Relative Pronoun vs Adverb', '**관계대명사 + 불완전한 절** (주어·목적어 빠짐)
**관계부사(= 전치사 + which) + 완전한 절**
the house **which** I bought (bought 의 목적어 없음) / the house **where** I live (완전)', 'This is the town where I grew up. | 이곳은 내가 자란 마을이다.
This is the town which I visited last year. | 이곳은 내가 작년에 방문한 마을이다.
I remember the day when he left. | 그가 떠난 날을 기억한다.', '선행사가 장소라고 무조건 where 가 아니에요. 뒤의 절을 보세요!', 41),
  ('H-04-2', 4, 4, '관계사 vs 접속사', 2, '관계사 vs 접속사', 'that(접속사) vs that(관계대명사) vs what', 'that vs what', '**접속사 that:** 뒤에 완전한 절, ''~라는 것''
**관계대명사 that:** 선행사 O + 불완전한 절
**관계대명사 what:** 선행사 X + 불완전한 절 (''~하는 것'')', 'I know that he is honest. | 나는 그가 정직하다는 것을 안다.
This is the book that I wanted. | 이것이 내가 원하던 책이다.
This is what I wanted. | 이것이 내가 원하던 것이다.', '선행사 있음 + 불완전 → that / 선행사 없음 + 불완전 → what / 완전 → 접속사 that', 42),
  ('H-04-3', 4, 4, '관계사 vs 접속사', 3, '관계사 vs 접속사', '복합관계사와 명사절/부사절 구분', 'Compound Relatives in Clauses', '**whoever, whatever, whichever:** 명사절(~하는 누구든) 또는 부사절(누가 ~하더라도)
**whenever, wherever, however:** 부사절
명사절이면 문장의 주어·목적어 자리, 부사절이면 문장 앞뒤에 덧붙어요.', 'Whatever you decide is fine with me. | 네가 무엇을 결정하든 나는 괜찮다. (명사절 주어)
Whatever you decide, I''ll support you. | 네가 무엇을 결정하더라도 나는 응원할게. (부사절)
You can sit wherever you like. | 원하는 곳 어디든 앉아도 돼.', 'whoever 는 절 안에서 주어, whomever 는 목적어', 43),
  ('H-05-1', 4, 5, '수능 시제 및 조동사 어법', 1, '수능 시제 및 조동사 어법', '과거시제 vs 현재완료 (과거 표시 부사)', 'Past vs Present Perfect', '**분명한 과거 표현**(yesterday, ago, last ~, in 2010, when ~)과는 **과거시제**
**since, for, so far, recently, up to now**와는 **현재완료**
since + 과거 시점 / 주절은 현재완료', 'I lost my phone two days ago. | 나는 이틀 전에 휴대폰을 잃어버렸다.
She has worked here since 2015. | 그녀는 2015년부터 여기서 일해 왔다.
So far, we have collected 500 books. | 지금까지 우리는 책 500권을 모았다.', 'in 2015 → 과거 / since 2015 → 현재완료', 51),
  ('H-05-2', 4, 5, '수능 시제 및 조동사 어법', 2, '수능 시제 및 조동사 어법', '과거완료(대과거) 및 조동사 + have p.p.', 'Past Perfect & Modal Perfect', '**had p.p.:** 과거 기준 시점보다 먼저 일어난 일
**must have p.p.**(~했음에 틀림없다), **can''t have p.p.**(~했을 리 없다), **should have p.p.**(~했어야 했는데), **may have p.p.**(~했을지도)
문맥상 과거의 일에 대한 추측·후회면 조동사 + have p.p.', 'She realized she had left her bag on the bus. | 그녀는 가방을 버스에 두고 내린 것을 깨달았다.
You should have told me earlier. | 너는 나에게 더 일찍 말했어야 했어.
The road is wet. It must have rained. | 길이 젖었다. 비가 왔음에 틀림없다.', 'should + 동사원형(지금 충고) vs should have p.p.(과거 후회)', 52),
  ('H-06-1', 4, 6, '분사구문 실전 어법', 1, '분사구문 실전 어법', '분사구문의 능동/수동 판별', 'Active vs Passive Participle Clauses', '분사구문의 의미상 주어 = **주절의 주어**
주어가 동작을 **하면 -ing**, **당하면 p.p.**
주절보다 먼저 일어났으면 Having p.p. / Having been p.p.', 'Looking out the window, she saw a rainbow. | 창밖을 내다보다가 그녀는 무지개를 보았다.
Surrounded by mountains, the village is quiet. | 산으로 둘러싸여 있어서 그 마을은 조용하다.
Having lost the key, he couldn''t get in. | 열쇠를 잃어버려서 그는 들어갈 수 없었다.', '마을은 ''둘러싸인'' 것 → Surrounded ✓ (Surrounding ✗)', 61),
  ('H-06-2', 4, 6, '분사구문 실전 어법', 2, '분사구문 실전 어법', 'with + 목적어 + 분사 부대상황', 'with + O + Participle', '**with + 목적어 + -ing:** 목적어가 ~하는 채로 (능동)
**with + 목적어 + p.p.:** 목적어가 ~된 채로 (수동)
분사 대신 형용사·부사·전치사구도 가능 (with your mouth full, with the lights on)', 'He sat with his arms folded. | 그는 팔짱을 낀 채로 앉아 있었다.
She walked away with tears running down her face. | 그녀는 눈물을 흘리며 걸어갔다.
Don''t speak with your mouth full. | 입에 음식을 가득 넣은 채로 말하지 마라.', '팔은 ''접혀진'' 것 → folded / 눈물은 ''흐르는'' 것 → running', 62),
  ('H-07-1', 4, 7, '병렬 구조 및 대명사·대동사 어법', 1, '병렬 구조 및 대명사·대동사 어법', '등위·상관접속사의 병렬 구조', 'Parallel Structure', 'and, but, or, 그리고 both A and B, either A or B, not only A but also B, not A but B 로 연결된 말은 **같은 문법 형태**
동사-동사, to부정사-to부정사, 동명사-동명사, 형용사-형용사', 'She likes singing, dancing, and acting. | 그녀는 노래, 춤, 연기를 좋아한다.
He not only plays the guitar but also writes songs. | 그는 기타를 칠 뿐만 아니라 노래도 쓴다.
The job is interesting and rewarding. | 그 일은 흥미롭고 보람 있다.', 'and 앞뒤의 형태를 꼭 비교하세요!', 71),
  ('H-07-2', 4, 7, '병렬 구조 및 대명사·대동사 어법', 2, '병렬 구조 및 대명사·대동사 어법', '대명사의 수 일치 및 재귀대명사 vs 인칭대명사', 'Pronoun Agreement & Reflexives', '대명사는 가리키는 명사와 **수(단수·복수)** 를 맞춰요 (it/its ↔ they/their)
**같은 절 안에서** 주어와 목적어가 같은 대상 → 재귀대명사
다른 대상이거나 다른 절이면 인칭대명사', 'Plants need sunlight to make their food. | 식물은 양분을 만들기 위해 햇빛이 필요하다.
She taught herself to play the piano. | 그녀는 피아노를 독학했다.
She asked me to help her. | 그녀는 내게 자기를 도와 달라고 했다.', '주어 = 목적어(같은 절) → -self', 72),
  ('H-07-3', 4, 7, '병렬 구조 및 대명사·대동사 어법', 3, '병렬 구조 및 대명사·대동사 어법', '대동사 (do/does/did vs be동사)', 'Pro-verbs: do vs be', '앞에 나온 동사를 반복하지 않고 대신 쓰는 말
**일반동사 → do / does / did**, **be동사 → be동사**, 조동사·완료 → 조동사·have
시제와 주어의 수도 맞춰요.', 'She runs faster than I do. | 그녀는 나보다 빨리 달린다.
He is taller than his father was at his age. | 그는 그 나이 때의 아버지보다 키가 크다.
I have finished, and so has she. | 나는 끝냈고, 그녀도 끝냈다.', '앞의 동사가 일반동사인지 be동사인지 먼저 확인!', 73),
  ('H-08-1', 4, 8, '가정법, 도치 및 특수 구문 어법', 1, '가정법, 도치 및 특수 구문 어법', '가정법 시제 판단 및 if 생략 도치', 'Conditional Tenses & Inversion', '현재 반대 → 가정법 과거 / 과거 반대 → 가정법 과거완료 / 혼합가정법
**if 생략 도치:** If I were → **Were I** / If I had known → **Had I known** / If it should → **Should it**', 'Had I known the truth, I would have acted differently. | 진실을 알았더라면 다르게 행동했을 텐데.
Were I you, I would accept the offer. | 내가 너라면 그 제안을 받아들일 텐데.
Should you need help, call me. | 혹시 도움이 필요하면 전화해.', 'Had + 주어 + p.p. 로 시작하면 가정법 과거완료!', 81),
  ('H-08-2', 4, 8, '가정법, 도치 및 특수 구문 어법', 2, '가정법, 도치 및 특수 구문 어법', '부정어·보어 도치 및 It is ~ that 강조', 'Negative Inversion & Cleft Sentences', '**부정어(Never, Little, Hardly, Seldom, Not only, Only + 부사구) 문두:** 조동사(do/does/did, have) + 주어 + 동사
**보어 문두:** 보어 + 동사 + 주어 (Happy are those who ~)
**It is ~ that 강조:** that 뒤는 강조된 부분이 빠진 불완전한 절', 'Little did I know that he was sick. | 그가 아프다는 것을 나는 전혀 몰랐다.
Only then did she realize her mistake. | 그제서야 그녀는 실수를 깨달았다.
It was in Paris that they first met. | 그들이 처음 만난 곳은 바로 파리였다.', 'Not only he is ✗ → Not only is he ✓', 82),
  ('H-09-1', 4, 9, '전치사 vs 접속사', 1, '전치사 vs 접속사', '이유 (because vs because of)', 'because vs because of', '**because, since, as + 주어 + 동사** (접속사)
**because of, due to, owing to, on account of + 명사(구)** (전치사)
뒤에 동사가 있는지 확인해요.', 'The game was canceled because it rained heavily. | 비가 많이 와서 경기가 취소되었다.
The game was canceled because of the heavy rain. | 폭우 때문에 경기가 취소되었다.
Due to the traffic, I was late. | 교통 체증 때문에 늦었다.', 'because of + 주어 + 동사 ✗', 91),
  ('H-09-2', 4, 9, '전치사 vs 접속사', 2, '전치사 vs 접속사', '양보 (although/though vs despite/in spite of)', 'although vs despite', '**although, though, even though + 주어 + 동사** (접속사)
**despite, in spite of + 명사(구)** (전치사)
despite of ✗ (despite 뒤에 of 를 쓰지 않아요)', 'Although it was cold, we went swimming. | 추웠지만 우리는 수영하러 갔다.
Despite the cold weather, we went swimming. | 추운 날씨에도 불구하고 우리는 수영하러 갔다.
In spite of being tired, she kept studying. | 피곤했는데도 그녀는 계속 공부했다.', 'despite of ✗ / in spite of ✓', 92),
  ('H-09-3', 4, 9, '전치사 vs 접속사', 3, '전치사 vs 접속사', '시간 (while vs during)', 'while vs during', '**while + 주어 + 동사** (접속사: ~하는 동안)
**during + 명사(구)** (전치사: ~ 동안, 특정 기간)
**for + 기간 숫자** (for three hours) / during + 사건·기간 이름 (during the vacation)', 'While I was in London, I visited many museums. | 런던에 있는 동안 나는 많은 박물관을 방문했다.
During my stay in London, I visited many museums. | 런던에 머무는 동안 많은 박물관을 방문했다.
I slept for eight hours. | 나는 8시간 동안 잤다.', 'during + 숫자 기간 ✗ (during three hours ✗ → for three hours ✓)', 93),
  ('H-10-1', 4, 10, '형용사 vs 부사', 1, '형용사 vs 부사', '보어 자리의 형용사 (부사 사용 불가)', 'Adjectives as Complements', 'be, become, seem, remain, stay, keep, look, sound, feel 뒤 **주격 보어 → 형용사**
make, keep, find, leave + 목적어 + **목적격 보어 → 형용사**
보어 자리에 -ly 부사 ✗', 'The room remained silent. | 방은 조용한 채로 있었다.
Keep the windows open. | 창문을 열어 두어라.
She found the task easy. | 그녀는 그 과제가 쉽다는 것을 알았다.', 'remain silently ✗ / find it easily(쉽게 찾다) ≠ find it easy(쉽다고 생각하다)', 101),
  ('H-10-2', 4, 10, '형용사 vs 부사', 2, '형용사 vs 부사', '형용사 수식 vs 부사 수식 대상 구별', 'What Is Being Modified?', '**명사**를 꾸미면 형용사, **동사·형용사·부사·문장 전체**를 꾸미면 부사
형용사를 꾸미는 말은 부사: surprisingly **high**, extremely **important**
-ly 형용사 주의: friendly, lovely, lonely, costly', 'She speaks English fluently. | 그녀는 영어를 유창하게 말한다.
The price was surprisingly low. | 가격이 놀라울 정도로 낮았다.
He gave me a friendly smile. | 그는 나에게 다정한 미소를 지었다.', '꾸밈을 받는 말이 명사인지 먼저 찾아요.', 102),
  ('H-10-3', 4, 10, '형용사 vs 부사', 3, '형용사 vs 부사', '가목적어 it - 진목적어 구문의 형용사 보어', 'it + Adjective + to / that', '**make / find / think / consider + it + 형용사 + to부정사 / that절**
it 은 가목적어, 뒤의 to부정사·that절이 진목적어
보어 자리는 형용사 (부사 ✗)', 'I found it difficult to understand him. | 나는 그를 이해하기 어렵다는 것을 알았다.
The internet makes it possible to work from home. | 인터넷은 재택근무를 가능하게 한다.
She thinks it strange that he didn''t call. | 그녀는 그가 전화하지 않은 것을 이상하게 생각한다.', 'make possible to ✗ → make it possible to ✓ (가목적어 it 생략 불가)', 103),
  ('H-11-1', 4, 11, '수능 빈출 어법 플러스', 1, '수능 빈출 어법 플러스', 'so vs such', 'so vs such', '**so + 형용사·부사 (+ that ~)**
**such + (a/an) + 형용사 + 명사 (+ that ~)**
**so + 형용사 + a/an + 명사** (= such a 형용사 명사)
so many/much/few/little + 명사', 'It was so hot that we stayed inside. | 너무 더워서 우리는 안에 있었다.
It was such a hot day that we stayed inside. | 너무 더운 날이라 우리는 안에 있었다.
She is so kind a person. = She is such a kind person. | 그녀는 정말 친절한 사람이다.', '명사가 있으면 such, 없으면 so! (so a hot day ✗)', 111),
  ('H-11-2', 4, 11, '수능 빈출 어법 플러스', 2, '수능 빈출 어법 플러스', '목적어 자리의 to부정사 vs 동명사', 'Object: To-infinitive vs Gerund', '**to부정사만:** want, hope, plan, decide, expect, refuse, manage, afford, fail, agree
**동명사만:** enjoy, finish, mind, avoid, deny, consider, suggest, postpone, quit, give up, keep
**뜻이 달라지는 동사:** remember, forget, regret, try, stop', 'We managed to finish the project on time. | 우리는 그 프로젝트를 가까스로 제때 끝냈다.
He suggested going to the beach. | 그는 해변에 가자고 제안했다.
She avoided answering the question. | 그녀는 그 질문에 대답하는 것을 피했다.', 'suggest to go ✗ → suggest going ✓', 112),
  ('H-11-3', 4, 11, '수능 빈출 어법 플러스', 3, '수능 빈출 어법 플러스', '대명사 지칭 (it / that / those)', 'Pronoun Reference: it, that, those', '**it:** 앞에 나온 바로 그 대상
**that / those:** 비교 구문에서 앞의 명사 반복을 피할 때 (단수 → that, 복수 → those) + 수식어 (of ~)
**those who ~:** ~하는 사람들', 'The climate of Korea is milder than that of Russia. | 한국의 기후는 러시아의 기후보다 온화하다.
The ears of a rabbit are longer than those of a cat. | 토끼의 귀는 고양이의 귀보다 길다.
Heaven helps those who help themselves. | 하늘은 스스로 돕는 자를 돕는다.', '가리키는 명사가 단수면 that, 복수면 those!', 113)
on conflict (code) do update set
  grade = excluded.grade, unit_no = excluded.unit_no, unit_title = excluded.unit_title, sub_no = excluded.sub_no,
  category = excluded.category, title = excluded.title, title_en = excluded.title_en, summary = excluded.summary,
  examples = excluded.examples, tip = excluded.tip, sort_order = excluded.sort_order, active = true;

-- 4. 샘플 문제를 알맞은 소단원으로 옮기고, 새 샘플 문제 추가
with v(topic_code, qtype, prompt, choices, answer, explanation, difficulty, source) as (values
  ('M1-01-1', 'mc', 'My sister and I ___ in the same class.', '["am","is","are","be"]'::jsonb, 'are', '주어 My sister and I 는 ''우리(복수)'' → are', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'blank', 'He ___ a famous singer. (be동사 현재형)', null::jsonb, 'is', 'He(3인칭 단수) → is', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'ox', '"The books on the desk is mine." 는 올바른 문장이다.', null::jsonb, 'X', '주어의 핵심은 The books(복수) → are 가 맞아요.', 2, 'MY Grammar 샘플'),
  ('M1-01-1', 'error', '[Tom and Jerry] [is] [my] [favorite] cartoon characters.', null::jsonb, 'is', 'Tom and Jerry 는 복수 → are', 2, 'MY Grammar 샘플'),
  ('M1-01-2', 'order', '그녀는 지금 집에 없다.', null::jsonb, 'She is not at home now.', '부정문: be동사 + not', 1, 'MY Grammar 샘플'),
  ('M1-01-2', 'mc', '다음 대화의 빈칸에 알맞은 것은?
A: ___ you a new student?
B: Yes, I am.', '["Do","Is","Are","Am"]'::jsonb, 'Are', 'be동사 의문문: Are you ~? 대답 Yes, I am.', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'mc', 'My brother ___ his homework after dinner.', '["do","does","doing","to do"]'::jsonb, 'does', '3인칭 단수 주어 → does', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'blank', 'She ___ (study) English every morning.', null::jsonb, 'studies', '자음 + y → -ies : studies', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'error', 'My cat [doesn''t] [likes] [to take] [a bath].', null::jsonb, 'likes', 'doesn''t 뒤에는 동사원형 like', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'ox', '"Does he has a bike?" 는 올바른 문장이다.', null::jsonb, 'X', 'Does 뒤에는 동사원형 have → Does he have a bike?', 2, 'MY Grammar 샘플'),
  ('M1-02-1', 'order', '그는 주말마다 축구를 한다.', null::jsonb, 'He plays soccer every weekend.', '3인칭 단수 → plays', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'mc', '밑줄 친 동사의 형태가 잘못된 것은?', '["She watches TV.","He gos to school.","It flies high.","Mina has a dog."]'::jsonb, 'He gos to school.', 'go → goes (-o로 끝나면 -es)', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'mc', 'Look! The children ___ in the park.', '["run","runs","are running","is running"]'::jsonb, 'are running', 'Look! → 지금 진행 중, children(복수) → are running', 1, 'MY Grammar 샘플'),
  ('M1-05-3', 'blank', 'I am ___ (write) a letter to my friend.', null::jsonb, 'writing', 'e로 끝나면 e를 빼고 -ing : writing', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'error', 'She [is] [siting] [on the bench] [now].', null::jsonb, 'siting', 'sit → sitting (단모음+단자음 → 자음 하나 더)', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'ox', '"I am knowing the answer." 는 올바른 문장이다.', null::jsonb, 'X', 'know 는 상태 동사라 진행형으로 쓰지 않아요 → I know the answer.', 3, 'MY Grammar 샘플'),
  ('M1-05-3', 'order', '너는 지금 무엇을 하고 있니?', null::jsonb, 'What are you doing now?', '의문사 + be동사 + 주어 + -ing', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'mc', 'We ___ to the museum last Friday.', '["go","goes","went","going"]'::jsonb, 'went', 'last Friday → 과거, go-went', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'blank', 'They ___ at home yesterday. (be동사)', null::jsonb, 'were', 'They + 과거 → were', 1, 'MY Grammar 샘플'),
  ('M1-02-3', 'error', '[Did] you [watched] the soccer game [last night]?', null::jsonb, 'watched', 'Did 뒤에는 동사원형 watch', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'ox', 'stop 의 과거형은 stoped 이다.', null::jsonb, 'X', '단모음+단자음 → 자음 하나 더 : stopped', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'order', '나는 어제 아침을 먹지 않았다.', null::jsonb, 'I didn''t eat breakfast yesterday.', 'didn''t + 동사원형', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'mc', '동사의 과거형이 잘못 짝지어진 것은?', '["buy - bought","see - saw","make - maked","eat - ate"]'::jsonb, 'make - maked', 'make 의 과거형은 made', 2, 'MY Grammar 샘플'),
  ('M1-05-2', 'mc', 'It ___ sunny tomorrow.', '["is","was","will be","will is"]'::jsonb, 'will be', 'tomorrow → 미래, will + 동사원형 be', 1, 'MY Grammar 샘플'),
  ('M1-05-2', 'blank', 'I am going ___ visit my uncle this Sunday.', null::jsonb, 'to', 'be going to + 동사원형', 1, 'MY Grammar 샘플'),
  ('M1-05-2', 'error', 'She [will] [goes] [shopping] [tomorrow].', null::jsonb, 'goes', 'will 뒤에는 동사원형 go', 2, 'MY Grammar 샘플'),
  ('M1-05-2', 'order', '우리는 다음 주에 소풍을 갈 예정이다.', null::jsonb, 'We are going to go on a picnic next week.', 'be going to + 동사원형', 3, 'MY Grammar 샘플'),
  ('M1-05-2', 'ox', '"Will you help me?" 는 올바른 문장이다.', null::jsonb, 'O', 'Will + 주어 + 동사원형 ~? 의문문', 1, 'MY Grammar 샘플'),
  ('M1-06-2', 'mc', 'You ___ run in the hallway. It''s dangerous.', '["must not","don''t have to","can","should"]'::jsonb, 'must not', '위험하니까 ''~하면 안 된다'' → must not', 2, 'MY Grammar 샘플'),
  ('M1-06-2', 'mc', 'Tomorrow is Sunday. You ___ get up early.', '["must","don''t have to","must not","can''t"]'::jsonb, 'don''t have to', '일요일이니까 ''~할 필요 없다'' → don''t have to', 2, 'MY Grammar 샘플'),
  ('M1-06-1', 'blank', 'She can swim. = She is ___ to swim.', null::jsonb, 'able', 'can = be able to', 2, 'MY Grammar 샘플'),
  ('M1-06-1', 'error', 'He [can] [plays] the guitar [very well].', null::jsonb, 'plays', '조동사 뒤에는 동사원형 play', 1, 'MY Grammar 샘플'),
  ('M1-06-2', 'order', '너는 의사에게 가 보는 게 좋겠어.', null::jsonb, 'You should see a doctor.', 'should: 충고', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'mc', 'Seoul is ___ than my hometown.', '["big","bigger","biggest","more big"]'::jsonb, 'bigger', 'than → 비교급, big → bigger', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'blank', 'This is the ___ (good) pizza in town.', null::jsonb, 'best', 'good - better - best', 2, 'MY Grammar 샘플'),
  ('M1-10-3', 'error', 'This puzzle is [very] [easier] [than] [that one].', null::jsonb, 'very', '비교급 강조는 much, even, far, a lot (very ✗)', 3, 'MY Grammar 샘플'),
  ('M1-10-3', 'ox', '"She is the most beautiful girl in our class." 는 올바른 문장이다.', null::jsonb, 'O', '긴 형용사 최상급 → the most beautiful', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'order', '나의 형은 아빠만큼 키가 크다.', null::jsonb, 'My brother is as tall as my dad.', 'as + 원급 + as: ~만큼 ...한', 2, 'MY Grammar 샘플'),
  ('M1-10-3', 'mc', '어법상 바른 문장은?', '["He is more taller than me.","This is the most famous place.","She is gooder than him.","It''s the bigest box."]'::jsonb, 'This is the most famous place.', 'more taller ✗ / gooder ✗ (better) / bigest ✗ (biggest)', 2, 'MY Grammar 샘플'),
  ('M1-09-1', 'mc', 'I want ___ a famous scientist.', '["be","to be","being","been"]'::jsonb, 'to be', 'want + to부정사', 1, 'MY Grammar 샘플'),
  ('M1-09-2', 'mc', '밑줄 친 to부정사의 용법이 나머지와 다른 것은?', '["I hope to see you.","She decided to leave.","I have no time to rest.","He likes to cook."]'::jsonb, 'I have no time to rest.', 'time to rest 는 ''쉴 시간'' (형용사적 용법), 나머지는 ''~하는 것'' (명사적 용법)', 3, 'MY Grammar 샘플'),
  ('M2-05-1', 'blank', 'It is hard ___ learn a new language.', null::jsonb, 'to', '가주어 It ~ 진주어 to부정사', 1, 'MY Grammar 샘플'),
  ('M1-09-2', 'error', 'She [went] to the library [to] [borrowing] [some books].', null::jsonb, 'borrowing', '목적(~하기 위해)의 to + 동사원형 borrow', 2, 'MY Grammar 샘플'),
  ('M1-09-2', 'order', '나는 마실 것이 필요하다.', null::jsonb, 'I need something to drink.', 'something + to부정사 (형용사적 용법)', 2, 'MY Grammar 샘플'),
  ('M1-09-2', 'ox', '"I was happy to hear the news." 에서 to hear 는 감정의 원인(~해서)을 나타낸다.', null::jsonb, 'O', '감정 형용사 + to부정사: ~해서 (부사적 용법)', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'mc', 'Do you mind ___ the window?', '["open","to open","opening","opened"]'::jsonb, 'opening', 'mind + 동명사', 2, 'MY Grammar 샘플'),
  ('M1-09-3', 'blank', 'Thank you for ___ (invite) me.', null::jsonb, 'inviting', '전치사 for 뒤 → 동명사', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'error', 'My dad [gave up] [to smoke] [last year] [for his health].', null::jsonb, 'to smoke', 'give up + 동명사 → smoking', 2, 'MY Grammar 샘플'),
  ('M1-09-3', 'ox', '"Reading books are my hobby." 는 올바른 문장이다.', null::jsonb, 'X', '동명사 주어는 단수 취급 → is', 3, 'MY Grammar 샘플'),
  ('M1-09-3', 'order', '그녀는 그림 그리는 것을 잘한다.', null::jsonb, 'She is good at drawing pictures.', 'be good at + 동명사', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'mc', '빈칸에 들어갈 수 없는 동사는?
I ___ playing the piano.', '["enjoy","finished","want","kept"]'::jsonb, 'want', 'want 는 to부정사를 목적어로 써요.', 3, 'MY Grammar 샘플'),
  ('M2-04-1', 'mc', 'This song ___ by BTS.', '["sang","was sung","was sang","is singing"]'::jsonb, 'was sung', '노래가 ''불려진'' 것 → be + p.p., sing-sang-sung', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'blank', 'The window was ___ (break) by the ball.', null::jsonb, 'broken', 'break - broke - broken', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'error', '[The Mona Lisa] [painted] [by] [Leonardo da Vinci].', null::jsonb, 'painted', '그림이 ''그려진'' 것 → was painted', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'ox', '"Korean is spoken in Korea." 는 올바른 수동태 문장이다.', null::jsonb, 'O', 'be + p.p.(spoken)', 1, 'MY Grammar 샘플'),
  ('M2-04-1', 'order', '이 집은 100년 전에 지어졌다.', null::jsonb, 'This house was built 100 years ago.', '과거 수동태: was + p.p.', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'mc', '능동태 "Jane wrote the letter." 를 수동태로 바르게 바꾼 것은?', '["The letter wrote by Jane.","The letter was written by Jane.","The letter is written by Jane.","Jane was written the letter."]'::jsonb, 'The letter was written by Jane.', '과거 → was + written', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'mc', 'I ___ in this town since 2018.', '["live","lived","have lived","am living"]'::jsonb, 'have lived', 'since(~부터 지금까지) → 현재완료 계속', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'blank', 'She has lived in Busan ___ five years.', null::jsonb, 'for', 'for + 기간', 1, 'MY Grammar 샘플'),
  ('M2-02-2', 'error', 'I [have seen] [the movie] [with my friends] [yesterday].', null::jsonb, 'have seen', 'yesterday(분명한 과거)와 현재완료는 함께 못 써요 → saw', 3, 'MY Grammar 샘플'),
  ('M2-02-2', 'ox', '"Have you ever been to London?" 는 경험을 묻는 문장이다.', null::jsonb, 'O', 'ever + 현재완료 → 경험', 1, 'MY Grammar 샘플'),
  ('M2-02-2', 'order', '나는 막 숙제를 끝냈다.', null::jsonb, 'I have just finished my homework.', 'have + just + p.p. (완료)', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'mc', '"He has gone to Paris." 의 의미로 알맞은 것은?', '["그는 파리에 가 본 적이 있다.","그는 파리에 가 버렸다(지금 여기 없다).","그는 파리에 갈 것이다.","그는 파리에서 돌아왔다."]'::jsonb, '그는 파리에 가 버렸다(지금 여기 없다).', 'have gone to: 가 버렸다(결과) / have been to: 가 본 적 있다(경험)', 3, 'MY Grammar 샘플'),
  ('M1-12-3', 'mc', 'I stayed home ___ I was sick.', '["because","because of","if","but"]'::jsonb, 'because', '뒤에 주어+동사 → because', 1, 'MY Grammar 샘플'),
  ('M1-12-3', 'mc', 'If it ___ tomorrow, we will cancel the game.', '["rain","rains","will rain","rained"]'::jsonb, 'rains', '조건 부사절에서는 미래 대신 현재시제', 2, 'MY Grammar 샘플'),
  ('M1-12-3', 'blank', 'I think ___ he is honest. (~라는 것)', null::jsonb, 'that', '명사절 접속사 that', 1, 'MY Grammar 샘플'),
  ('M1-12-2', 'error', '[When] [I] [will arrive] there, I''ll call you.', null::jsonb, 'will arrive', '시간 부사절 → 현재시제 arrive', 3, 'MY Grammar 샘플'),
  ('M1-12-2', 'order', '내가 어렸을 때, 나는 부산에 살았다.', null::jsonb, 'When I was young, I lived in Busan.', 'When + 주어 + 동사, 주절', 2, 'MY Grammar 샘플'),
  ('M1-12-3', 'ox', '"We didn''t go out because of the rain." 는 올바른 문장이다.', null::jsonb, 'O', 'because of + 명사(the rain)', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'mc', 'Mom made ___ a cake.', '["I","my","me","mine"]'::jsonb, 'me', '4형식 간접목적어 → 목적격 me', 1, 'MY Grammar 샘플'),
  ('M2-01-1', 'blank', 'He bought a new bag ___ his sister.', null::jsonb, 'for', 'buy 는 3형식 전환 시 for', 2, 'MY Grammar 샘플'),
  ('M3-01-3', 'error', 'The good news [made] [us] [very] [happily].', null::jsonb, 'happily', '5형식 목적격보어 → 형용사 happy', 2, 'MY Grammar 샘플'),
  ('M3-01-3', 'mc', 'The teacher told us ___ quiet.', '["be","to be","being","are"]'::jsonb, 'to be', 'tell + 목적어 + to부정사', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'order', '그는 나에게 그의 사진들을 보여 주었다.', null::jsonb, 'He showed me his pictures.', '4형식: 동사 + ~에게 + ~을', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'ox', '"She gave a flower for me." 는 올바른 문장이다.', null::jsonb, 'X', 'give 는 3형식 전환 시 to → She gave a flower to me.', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'mc', 'I have a friend ___ can speak French.', '["who","which","whose","what"]'::jsonb, 'who', '선행사 a friend(사람) + 주격 → who', 1, 'MY Grammar 샘플'),
  ('M2-11-1', 'mc', 'This is the cat ___ tail is very long.', '["who","which","whose","that"]'::jsonb, 'whose', '''그것의 꼬리'' → 소유격 whose', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'blank', 'The bike ___ I bought last week is red. (사물, 목적격)', null::jsonb, 'which|that', '사물 선행사 목적격 → which 또는 that', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'error', 'I know [a boy] [who] [play] [the drums] well.', null::jsonb, 'play', '선행사 a boy(단수)에 수 일치 → plays', 3, 'MY Grammar 샘플'),
  ('M2-11-1', 'order', '그녀는 내가 가장 좋아하는 가수이다.', null::jsonb, 'She is the singer that I like most.', '목적격 관계대명사 that (생략 가능)', 3, 'MY Grammar 샘플'),
  ('M2-11-1', 'ox', '"The man who I met yesterday was kind." 에서 who 는 생략할 수 있다.', null::jsonb, 'O', '목적격 관계대명사는 생략 가능', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'mc', '___ I want for my birthday is a new phone.', '["That","Which","What","Who"]'::jsonb, 'What', '선행사 없음 + ''~하는 것'' → What', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'mc', 'This is the bag ___ I lost.', '["what","which","who","whose"]'::jsonb, 'which', '선행사 the bag 이 있으므로 what ✗ → which', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'blank', 'Tell me ___ you saw. (네가 본 것)', null::jsonb, 'what', 'what = the thing which', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'error', '[The thing] [what] [he] [said] was not true.', null::jsonb, 'what', '선행사 The thing 이 있으므로 which/that', 3, 'MY Grammar 샘플'),
  ('M2-11-2', 'order', '그것은 내가 필요한 것이 아니다.', null::jsonb, 'That is not what I need.', 'what + 주어 + 동사: ~하는 것', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'mc', 'If I ___ a bird, I would fly to you.', '["am","was","were","will be"]'::jsonb, 'were', '가정법 과거: be동사 → were', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'blank', 'If I had a lot of money, I ___ buy a big house. (~할 텐데)', null::jsonb, 'would|could', '가정법 과거 주절: would/could + 동사원형', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'error', 'If I [knew] her number, I [will] [call] [her].', null::jsonb, 'will', '가정법 과거 → would call', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'ox', '"If I were taller, I could play basketball better." 는 지금 키가 크다는 뜻이다.', null::jsonb, 'X', '가정법 과거는 현재 사실의 반대 → 실제로는 키가 크지 않다', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'order', '내가 너라면, 나는 그 일을 하지 않을 텐데.', null::jsonb, 'If I were you, I wouldn''t do that.', 'If + 주어 + were, 주어 + would not + 동사원형', 3, 'MY Grammar 샘플'),
  ('M2-12-2', 'mc', '"I wish I could swim." 의 의미로 알맞은 것은?', '["나는 수영을 할 수 있다.","나는 수영을 할 수 있으면 좋겠다.","나는 수영을 했다.","나는 수영을 할 것이다."]'::jsonb, '나는 수영을 할 수 있으면 좋겠다.', 'I wish + 과거: 현재 이루기 어려운 소망', 1, 'MY Grammar 샘플'),
  ('M3-08-3', 'mc', 'Do you know where ___?', '["does she live","she lives","lives she","she does live"]'::jsonb, 'she lives', '간접의문문: 의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'blank', 'I wonder ___ he will come to the party. (~인지 아닌지)', null::jsonb, 'if|whether', '의문사가 없을 때 if/whether', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'error', 'Can you [tell] [me] [what time] [is it]?', null::jsonb, 'is it', '간접의문문 → what time it is', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'order', '그가 왜 늦었는지 나는 모른다.', null::jsonb, 'I don''t know why he was late.', '의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'ox', '"What do you think she wants?" 는 올바른 문장이다.', null::jsonb, 'O', 'think 가 있으면 의문사를 문장 맨 앞으로!', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'mc', 'Look at the ___ baby. (자고 있는)', '["sleep","sleeping","slept","sleeps"]'::jsonb, 'sleeping', '능동·진행 → 현재분사', 1, 'MY Grammar 샘플'),
  ('M2-07-1', 'mc', 'The game was so ___ that everyone shouted.', '["excite","excited","exciting","excites"]'::jsonb, 'exciting', '경기가 흥분을 ''일으킴'' → exciting', 2, 'MY Grammar 샘플'),
  ('M2-07-1', 'blank', 'I was ___ (surprise) at the news.', null::jsonb, 'surprised', '내가 놀람을 ''느낌'' → surprised', 2, 'MY Grammar 샘플'),
  ('M2-07-1', 'error', 'There is a [car] [parking] [in front of] [my house].', null::jsonb, 'parking', '차는 ''주차된'' 것 → parked', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'order', '나는 영어로 쓰인 책을 읽었다.', null::jsonb, 'I read a book written in English.', '과거분사구가 명사 뒤에서 수식', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'ox', '"I''m boring." 은 ''나는 지루함을 느낀다''라는 뜻이다.', null::jsonb, 'X', '지루함을 느낀다 → I''m bored. (I''m boring = 나는 지루한 사람이다)', 2, 'MY Grammar 샘플'),
  ('M1-01-2', 'mc', '다음 대화의 빈칸에 알맞은 것은?
A: Was he at school yesterday?
B: No, he ___.', '["isn''t","wasn''t","weren''t","didn''t"]'::jsonb, 'wasn''t', 'Was he ~? 의 부정 대답 → No, he wasn''t.', 1, 'MY Grammar 샘플'),
  ('M1-06-1', 'ox', '"May I use your phone?" 의 may 는 ''허락''을 구하는 뜻이다.', null::jsonb, 'O', 'May I ~? = ~해도 될까요? (허락)', 1, 'MY Grammar 샘플'),
  ('M1-09-1', 'blank', 'My dream is ___ travel around the world.', null::jsonb, 'to', '보어 자리의 to부정사: ~하는 것', 1, 'MY Grammar 샘플'),
  ('M1-09-1', 'error', 'She [decided] [to] [learns] [Chinese].', null::jsonb, 'learns', 'to 뒤에는 동사원형 learn', 2, 'MY Grammar 샘플'),
  ('M1-12-2', 'mc', 'Wash your hands ___ you eat.', '["before","but","so","or"]'::jsonb, 'before', '먹기 ''전에'' → before', 1, 'MY Grammar 샘플'),
  ('M2-05-1', 'mc', '___ is fun to play board games with friends.', '["This","That","It","What"]'::jsonb, 'It', '가주어 It ~ 진주어 to부정사', 2, 'MY Grammar 샘플'),
  ('M2-05-1', 'order', '매일 운동하는 것은 중요하다.', null::jsonb, 'It is important to exercise every day.', 'It(가주어) + is + 형용사 + to부정사(진주어)', 2, 'MY Grammar 샘플'),
  ('M2-12-2', 'blank', 'I wish I ___ (have) a little sister.', null::jsonb, 'had', 'I wish + 가정법 과거 → had', 2, 'MY Grammar 샘플'),
  ('M2-12-2', 'error', 'He talks [as if] he [knows] [everything] [about it].', null::jsonb, 'knows', 'as if + 가정법 과거 → knew', 3, 'MY Grammar 샘플'),
  ('M3-01-3', 'mc', 'I had my bike ___ yesterday.', '["repair","repairing","repaired","to repair"]'::jsonb, 'repaired', '자전거는 ''수리되는'' 것 → 목적격 보어 p.p.', 3, 'MY Grammar 샘플'),
  ('H-11-1', 'mc', 'It was ___ a hot day that we stayed inside.', '["so","such","very","too"]'::jsonb, 'such', 'a + 형용사 + 명사 앞 → such', 2, 'MY Grammar 샘플'),
  ('H-11-1', 'error', 'The movie was [such] [boring] [that] I [fell asleep].', null::jsonb, 'such', '명사 없이 형용사만 → so boring', 2, 'MY Grammar 샘플'),
  ('H-11-1', 'ox', '"She is so kind a person." 은 어법상 올바르다.', null::jsonb, 'O', 'so + 형용사 + a + 명사 = such a + 형용사 + 명사', 3, 'MY Grammar 샘플'),
  ('H-09-2', 'mc', '___ the heavy rain, the game continued.', '["Although","Despite","Because","Though"]'::jsonb, 'Despite', '뒤에 명사구(the heavy rain) → 전치사 Despite', 2, 'MY Grammar 샘플'),
  ('H-09-2', 'error', '[Despite of] the cold weather, we [went] [swimming] [in the sea].', null::jsonb, 'Despite of', 'despite 뒤에는 of 를 쓰지 않아요 → Despite', 2, 'MY Grammar 샘플'),
  ('H-09-2', 'blank', '___ it was cold, we went swimming. (비록 ~이지만, A로 시작)', null::jsonb, 'although', '뒤에 주어 + 동사 → 접속사 Although', 2, 'MY Grammar 샘플')
)
update public.mg_questions m set topic_code = v.topic_code
  from v where m.source = 'MY Grammar 샘플' and m.prompt = v.prompt and m.topic_code <> v.topic_code;

insert into public.mg_questions (topic_code, qtype, prompt, choices, answer, explanation, difficulty, source)
select v.* from (values
  ('M1-01-1', 'mc', 'My sister and I ___ in the same class.', '["am","is","are","be"]'::jsonb, 'are', '주어 My sister and I 는 ''우리(복수)'' → are', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'blank', 'He ___ a famous singer. (be동사 현재형)', null::jsonb, 'is', 'He(3인칭 단수) → is', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'ox', '"The books on the desk is mine." 는 올바른 문장이다.', null::jsonb, 'X', '주어의 핵심은 The books(복수) → are 가 맞아요.', 2, 'MY Grammar 샘플'),
  ('M1-01-1', 'error', '[Tom and Jerry] [is] [my] [favorite] cartoon characters.', null::jsonb, 'is', 'Tom and Jerry 는 복수 → are', 2, 'MY Grammar 샘플'),
  ('M1-01-2', 'order', '그녀는 지금 집에 없다.', null::jsonb, 'She is not at home now.', '부정문: be동사 + not', 1, 'MY Grammar 샘플'),
  ('M1-01-2', 'mc', '다음 대화의 빈칸에 알맞은 것은?
A: ___ you a new student?
B: Yes, I am.', '["Do","Is","Are","Am"]'::jsonb, 'Are', 'be동사 의문문: Are you ~? 대답 Yes, I am.', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'mc', 'My brother ___ his homework after dinner.', '["do","does","doing","to do"]'::jsonb, 'does', '3인칭 단수 주어 → does', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'blank', 'She ___ (study) English every morning.', null::jsonb, 'studies', '자음 + y → -ies : studies', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'error', 'My cat [doesn''t] [likes] [to take] [a bath].', null::jsonb, 'likes', 'doesn''t 뒤에는 동사원형 like', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'ox', '"Does he has a bike?" 는 올바른 문장이다.', null::jsonb, 'X', 'Does 뒤에는 동사원형 have → Does he have a bike?', 2, 'MY Grammar 샘플'),
  ('M1-02-1', 'order', '그는 주말마다 축구를 한다.', null::jsonb, 'He plays soccer every weekend.', '3인칭 단수 → plays', 1, 'MY Grammar 샘플'),
  ('M1-02-1', 'mc', '밑줄 친 동사의 형태가 잘못된 것은?', '["She watches TV.","He gos to school.","It flies high.","Mina has a dog."]'::jsonb, 'He gos to school.', 'go → goes (-o로 끝나면 -es)', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'mc', 'Look! The children ___ in the park.', '["run","runs","are running","is running"]'::jsonb, 'are running', 'Look! → 지금 진행 중, children(복수) → are running', 1, 'MY Grammar 샘플'),
  ('M1-05-3', 'blank', 'I am ___ (write) a letter to my friend.', null::jsonb, 'writing', 'e로 끝나면 e를 빼고 -ing : writing', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'error', 'She [is] [siting] [on the bench] [now].', null::jsonb, 'siting', 'sit → sitting (단모음+단자음 → 자음 하나 더)', 2, 'MY Grammar 샘플'),
  ('M1-05-3', 'ox', '"I am knowing the answer." 는 올바른 문장이다.', null::jsonb, 'X', 'know 는 상태 동사라 진행형으로 쓰지 않아요 → I know the answer.', 3, 'MY Grammar 샘플'),
  ('M1-05-3', 'order', '너는 지금 무엇을 하고 있니?', null::jsonb, 'What are you doing now?', '의문사 + be동사 + 주어 + -ing', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'mc', 'We ___ to the museum last Friday.', '["go","goes","went","going"]'::jsonb, 'went', 'last Friday → 과거, go-went', 1, 'MY Grammar 샘플'),
  ('M1-01-1', 'blank', 'They ___ at home yesterday. (be동사)', null::jsonb, 'were', 'They + 과거 → were', 1, 'MY Grammar 샘플'),
  ('M1-02-3', 'error', '[Did] you [watched] the soccer game [last night]?', null::jsonb, 'watched', 'Did 뒤에는 동사원형 watch', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'ox', 'stop 의 과거형은 stoped 이다.', null::jsonb, 'X', '단모음+단자음 → 자음 하나 더 : stopped', 2, 'MY Grammar 샘플'),
  ('M1-02-3', 'order', '나는 어제 아침을 먹지 않았다.', null::jsonb, 'I didn''t eat breakfast yesterday.', 'didn''t + 동사원형', 2, 'MY Grammar 샘플'),
  ('M1-02-2', 'mc', '동사의 과거형이 잘못 짝지어진 것은?', '["buy - bought","see - saw","make - maked","eat - ate"]'::jsonb, 'make - maked', 'make 의 과거형은 made', 2, 'MY Grammar 샘플'),
  ('M1-05-2', 'mc', 'It ___ sunny tomorrow.', '["is","was","will be","will is"]'::jsonb, 'will be', 'tomorrow → 미래, will + 동사원형 be', 1, 'MY Grammar 샘플'),
  ('M1-05-2', 'blank', 'I am going ___ visit my uncle this Sunday.', null::jsonb, 'to', 'be going to + 동사원형', 1, 'MY Grammar 샘플'),
  ('M1-05-2', 'error', 'She [will] [goes] [shopping] [tomorrow].', null::jsonb, 'goes', 'will 뒤에는 동사원형 go', 2, 'MY Grammar 샘플'),
  ('M1-05-2', 'order', '우리는 다음 주에 소풍을 갈 예정이다.', null::jsonb, 'We are going to go on a picnic next week.', 'be going to + 동사원형', 3, 'MY Grammar 샘플'),
  ('M1-05-2', 'ox', '"Will you help me?" 는 올바른 문장이다.', null::jsonb, 'O', 'Will + 주어 + 동사원형 ~? 의문문', 1, 'MY Grammar 샘플'),
  ('M1-06-2', 'mc', 'You ___ run in the hallway. It''s dangerous.', '["must not","don''t have to","can","should"]'::jsonb, 'must not', '위험하니까 ''~하면 안 된다'' → must not', 2, 'MY Grammar 샘플'),
  ('M1-06-2', 'mc', 'Tomorrow is Sunday. You ___ get up early.', '["must","don''t have to","must not","can''t"]'::jsonb, 'don''t have to', '일요일이니까 ''~할 필요 없다'' → don''t have to', 2, 'MY Grammar 샘플'),
  ('M1-06-1', 'blank', 'She can swim. = She is ___ to swim.', null::jsonb, 'able', 'can = be able to', 2, 'MY Grammar 샘플'),
  ('M1-06-1', 'error', 'He [can] [plays] the guitar [very well].', null::jsonb, 'plays', '조동사 뒤에는 동사원형 play', 1, 'MY Grammar 샘플'),
  ('M1-06-2', 'order', '너는 의사에게 가 보는 게 좋겠어.', null::jsonb, 'You should see a doctor.', 'should: 충고', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'mc', 'Seoul is ___ than my hometown.', '["big","bigger","biggest","more big"]'::jsonb, 'bigger', 'than → 비교급, big → bigger', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'blank', 'This is the ___ (good) pizza in town.', null::jsonb, 'best', 'good - better - best', 2, 'MY Grammar 샘플'),
  ('M1-10-3', 'error', 'This puzzle is [very] [easier] [than] [that one].', null::jsonb, 'very', '비교급 강조는 much, even, far, a lot (very ✗)', 3, 'MY Grammar 샘플'),
  ('M1-10-3', 'ox', '"She is the most beautiful girl in our class." 는 올바른 문장이다.', null::jsonb, 'O', '긴 형용사 최상급 → the most beautiful', 1, 'MY Grammar 샘플'),
  ('M1-10-3', 'order', '나의 형은 아빠만큼 키가 크다.', null::jsonb, 'My brother is as tall as my dad.', 'as + 원급 + as: ~만큼 ...한', 2, 'MY Grammar 샘플'),
  ('M1-10-3', 'mc', '어법상 바른 문장은?', '["He is more taller than me.","This is the most famous place.","She is gooder than him.","It''s the bigest box."]'::jsonb, 'This is the most famous place.', 'more taller ✗ / gooder ✗ (better) / bigest ✗ (biggest)', 2, 'MY Grammar 샘플'),
  ('M1-09-1', 'mc', 'I want ___ a famous scientist.', '["be","to be","being","been"]'::jsonb, 'to be', 'want + to부정사', 1, 'MY Grammar 샘플'),
  ('M1-09-2', 'mc', '밑줄 친 to부정사의 용법이 나머지와 다른 것은?', '["I hope to see you.","She decided to leave.","I have no time to rest.","He likes to cook."]'::jsonb, 'I have no time to rest.', 'time to rest 는 ''쉴 시간'' (형용사적 용법), 나머지는 ''~하는 것'' (명사적 용법)', 3, 'MY Grammar 샘플'),
  ('M2-05-1', 'blank', 'It is hard ___ learn a new language.', null::jsonb, 'to', '가주어 It ~ 진주어 to부정사', 1, 'MY Grammar 샘플'),
  ('M1-09-2', 'error', 'She [went] to the library [to] [borrowing] [some books].', null::jsonb, 'borrowing', '목적(~하기 위해)의 to + 동사원형 borrow', 2, 'MY Grammar 샘플'),
  ('M1-09-2', 'order', '나는 마실 것이 필요하다.', null::jsonb, 'I need something to drink.', 'something + to부정사 (형용사적 용법)', 2, 'MY Grammar 샘플'),
  ('M1-09-2', 'ox', '"I was happy to hear the news." 에서 to hear 는 감정의 원인(~해서)을 나타낸다.', null::jsonb, 'O', '감정 형용사 + to부정사: ~해서 (부사적 용법)', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'mc', 'Do you mind ___ the window?', '["open","to open","opening","opened"]'::jsonb, 'opening', 'mind + 동명사', 2, 'MY Grammar 샘플'),
  ('M1-09-3', 'blank', 'Thank you for ___ (invite) me.', null::jsonb, 'inviting', '전치사 for 뒤 → 동명사', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'error', 'My dad [gave up] [to smoke] [last year] [for his health].', null::jsonb, 'to smoke', 'give up + 동명사 → smoking', 2, 'MY Grammar 샘플'),
  ('M1-09-3', 'ox', '"Reading books are my hobby." 는 올바른 문장이다.', null::jsonb, 'X', '동명사 주어는 단수 취급 → is', 3, 'MY Grammar 샘플'),
  ('M1-09-3', 'order', '그녀는 그림 그리는 것을 잘한다.', null::jsonb, 'She is good at drawing pictures.', 'be good at + 동명사', 2, 'MY Grammar 샘플'),
  ('M2-06-2', 'mc', '빈칸에 들어갈 수 없는 동사는?
I ___ playing the piano.', '["enjoy","finished","want","kept"]'::jsonb, 'want', 'want 는 to부정사를 목적어로 써요.', 3, 'MY Grammar 샘플'),
  ('M2-04-1', 'mc', 'This song ___ by BTS.', '["sang","was sung","was sang","is singing"]'::jsonb, 'was sung', '노래가 ''불려진'' 것 → be + p.p., sing-sang-sung', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'blank', 'The window was ___ (break) by the ball.', null::jsonb, 'broken', 'break - broke - broken', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'error', '[The Mona Lisa] [painted] [by] [Leonardo da Vinci].', null::jsonb, 'painted', '그림이 ''그려진'' 것 → was painted', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'ox', '"Korean is spoken in Korea." 는 올바른 수동태 문장이다.', null::jsonb, 'O', 'be + p.p.(spoken)', 1, 'MY Grammar 샘플'),
  ('M2-04-1', 'order', '이 집은 100년 전에 지어졌다.', null::jsonb, 'This house was built 100 years ago.', '과거 수동태: was + p.p.', 2, 'MY Grammar 샘플'),
  ('M2-04-1', 'mc', '능동태 "Jane wrote the letter." 를 수동태로 바르게 바꾼 것은?', '["The letter wrote by Jane.","The letter was written by Jane.","The letter is written by Jane.","Jane was written the letter."]'::jsonb, 'The letter was written by Jane.', '과거 → was + written', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'mc', 'I ___ in this town since 2018.', '["live","lived","have lived","am living"]'::jsonb, 'have lived', 'since(~부터 지금까지) → 현재완료 계속', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'blank', 'She has lived in Busan ___ five years.', null::jsonb, 'for', 'for + 기간', 1, 'MY Grammar 샘플'),
  ('M2-02-2', 'error', 'I [have seen] [the movie] [with my friends] [yesterday].', null::jsonb, 'have seen', 'yesterday(분명한 과거)와 현재완료는 함께 못 써요 → saw', 3, 'MY Grammar 샘플'),
  ('M2-02-2', 'ox', '"Have you ever been to London?" 는 경험을 묻는 문장이다.', null::jsonb, 'O', 'ever + 현재완료 → 경험', 1, 'MY Grammar 샘플'),
  ('M2-02-2', 'order', '나는 막 숙제를 끝냈다.', null::jsonb, 'I have just finished my homework.', 'have + just + p.p. (완료)', 2, 'MY Grammar 샘플'),
  ('M2-02-2', 'mc', '"He has gone to Paris." 의 의미로 알맞은 것은?', '["그는 파리에 가 본 적이 있다.","그는 파리에 가 버렸다(지금 여기 없다).","그는 파리에 갈 것이다.","그는 파리에서 돌아왔다."]'::jsonb, '그는 파리에 가 버렸다(지금 여기 없다).', 'have gone to: 가 버렸다(결과) / have been to: 가 본 적 있다(경험)', 3, 'MY Grammar 샘플'),
  ('M1-12-3', 'mc', 'I stayed home ___ I was sick.', '["because","because of","if","but"]'::jsonb, 'because', '뒤에 주어+동사 → because', 1, 'MY Grammar 샘플'),
  ('M1-12-3', 'mc', 'If it ___ tomorrow, we will cancel the game.', '["rain","rains","will rain","rained"]'::jsonb, 'rains', '조건 부사절에서는 미래 대신 현재시제', 2, 'MY Grammar 샘플'),
  ('M1-12-3', 'blank', 'I think ___ he is honest. (~라는 것)', null::jsonb, 'that', '명사절 접속사 that', 1, 'MY Grammar 샘플'),
  ('M1-12-2', 'error', '[When] [I] [will arrive] there, I''ll call you.', null::jsonb, 'will arrive', '시간 부사절 → 현재시제 arrive', 3, 'MY Grammar 샘플'),
  ('M1-12-2', 'order', '내가 어렸을 때, 나는 부산에 살았다.', null::jsonb, 'When I was young, I lived in Busan.', 'When + 주어 + 동사, 주절', 2, 'MY Grammar 샘플'),
  ('M1-12-3', 'ox', '"We didn''t go out because of the rain." 는 올바른 문장이다.', null::jsonb, 'O', 'because of + 명사(the rain)', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'mc', 'Mom made ___ a cake.', '["I","my","me","mine"]'::jsonb, 'me', '4형식 간접목적어 → 목적격 me', 1, 'MY Grammar 샘플'),
  ('M2-01-1', 'blank', 'He bought a new bag ___ his sister.', null::jsonb, 'for', 'buy 는 3형식 전환 시 for', 2, 'MY Grammar 샘플'),
  ('M3-01-3', 'error', 'The good news [made] [us] [very] [happily].', null::jsonb, 'happily', '5형식 목적격보어 → 형용사 happy', 2, 'MY Grammar 샘플'),
  ('M3-01-3', 'mc', 'The teacher told us ___ quiet.', '["be","to be","being","are"]'::jsonb, 'to be', 'tell + 목적어 + to부정사', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'order', '그는 나에게 그의 사진들을 보여 주었다.', null::jsonb, 'He showed me his pictures.', '4형식: 동사 + ~에게 + ~을', 2, 'MY Grammar 샘플'),
  ('M2-01-1', 'ox', '"She gave a flower for me." 는 올바른 문장이다.', null::jsonb, 'X', 'give 는 3형식 전환 시 to → She gave a flower to me.', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'mc', 'I have a friend ___ can speak French.', '["who","which","whose","what"]'::jsonb, 'who', '선행사 a friend(사람) + 주격 → who', 1, 'MY Grammar 샘플'),
  ('M2-11-1', 'mc', 'This is the cat ___ tail is very long.', '["who","which","whose","that"]'::jsonb, 'whose', '''그것의 꼬리'' → 소유격 whose', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'blank', 'The bike ___ I bought last week is red. (사물, 목적격)', null::jsonb, 'which|that', '사물 선행사 목적격 → which 또는 that', 2, 'MY Grammar 샘플'),
  ('M2-11-1', 'error', 'I know [a boy] [who] [play] [the drums] well.', null::jsonb, 'play', '선행사 a boy(단수)에 수 일치 → plays', 3, 'MY Grammar 샘플'),
  ('M2-11-1', 'order', '그녀는 내가 가장 좋아하는 가수이다.', null::jsonb, 'She is the singer that I like most.', '목적격 관계대명사 that (생략 가능)', 3, 'MY Grammar 샘플'),
  ('M2-11-1', 'ox', '"The man who I met yesterday was kind." 에서 who 는 생략할 수 있다.', null::jsonb, 'O', '목적격 관계대명사는 생략 가능', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'mc', '___ I want for my birthday is a new phone.', '["That","Which","What","Who"]'::jsonb, 'What', '선행사 없음 + ''~하는 것'' → What', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'mc', 'This is the bag ___ I lost.', '["what","which","who","whose"]'::jsonb, 'which', '선행사 the bag 이 있으므로 what ✗ → which', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'blank', 'Tell me ___ you saw. (네가 본 것)', null::jsonb, 'what', 'what = the thing which', 2, 'MY Grammar 샘플'),
  ('M2-11-2', 'error', '[The thing] [what] [he] [said] was not true.', null::jsonb, 'what', '선행사 The thing 이 있으므로 which/that', 3, 'MY Grammar 샘플'),
  ('M2-11-2', 'order', '그것은 내가 필요한 것이 아니다.', null::jsonb, 'That is not what I need.', 'what + 주어 + 동사: ~하는 것', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'mc', 'If I ___ a bird, I would fly to you.', '["am","was","were","will be"]'::jsonb, 'were', '가정법 과거: be동사 → were', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'blank', 'If I had a lot of money, I ___ buy a big house. (~할 텐데)', null::jsonb, 'would|could', '가정법 과거 주절: would/could + 동사원형', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'error', 'If I [knew] her number, I [will] [call] [her].', null::jsonb, 'will', '가정법 과거 → would call', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'ox', '"If I were taller, I could play basketball better." 는 지금 키가 크다는 뜻이다.', null::jsonb, 'X', '가정법 과거는 현재 사실의 반대 → 실제로는 키가 크지 않다', 2, 'MY Grammar 샘플'),
  ('M2-12-1', 'order', '내가 너라면, 나는 그 일을 하지 않을 텐데.', null::jsonb, 'If I were you, I wouldn''t do that.', 'If + 주어 + were, 주어 + would not + 동사원형', 3, 'MY Grammar 샘플'),
  ('M2-12-2', 'mc', '"I wish I could swim." 의 의미로 알맞은 것은?', '["나는 수영을 할 수 있다.","나는 수영을 할 수 있으면 좋겠다.","나는 수영을 했다.","나는 수영을 할 것이다."]'::jsonb, '나는 수영을 할 수 있으면 좋겠다.', 'I wish + 과거: 현재 이루기 어려운 소망', 1, 'MY Grammar 샘플'),
  ('M3-08-3', 'mc', 'Do you know where ___?', '["does she live","she lives","lives she","she does live"]'::jsonb, 'she lives', '간접의문문: 의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'blank', 'I wonder ___ he will come to the party. (~인지 아닌지)', null::jsonb, 'if|whether', '의문사가 없을 때 if/whether', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'error', 'Can you [tell] [me] [what time] [is it]?', null::jsonb, 'is it', '간접의문문 → what time it is', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'order', '그가 왜 늦었는지 나는 모른다.', null::jsonb, 'I don''t know why he was late.', '의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('M3-08-3', 'ox', '"What do you think she wants?" 는 올바른 문장이다.', null::jsonb, 'O', 'think 가 있으면 의문사를 문장 맨 앞으로!', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'mc', 'Look at the ___ baby. (자고 있는)', '["sleep","sleeping","slept","sleeps"]'::jsonb, 'sleeping', '능동·진행 → 현재분사', 1, 'MY Grammar 샘플'),
  ('M2-07-1', 'mc', 'The game was so ___ that everyone shouted.', '["excite","excited","exciting","excites"]'::jsonb, 'exciting', '경기가 흥분을 ''일으킴'' → exciting', 2, 'MY Grammar 샘플'),
  ('M2-07-1', 'blank', 'I was ___ (surprise) at the news.', null::jsonb, 'surprised', '내가 놀람을 ''느낌'' → surprised', 2, 'MY Grammar 샘플'),
  ('M2-07-1', 'error', 'There is a [car] [parking] [in front of] [my house].', null::jsonb, 'parking', '차는 ''주차된'' 것 → parked', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'order', '나는 영어로 쓰인 책을 읽었다.', null::jsonb, 'I read a book written in English.', '과거분사구가 명사 뒤에서 수식', 3, 'MY Grammar 샘플'),
  ('M2-07-1', 'ox', '"I''m boring." 은 ''나는 지루함을 느낀다''라는 뜻이다.', null::jsonb, 'X', '지루함을 느낀다 → I''m bored. (I''m boring = 나는 지루한 사람이다)', 2, 'MY Grammar 샘플'),
  ('M1-01-2', 'mc', '다음 대화의 빈칸에 알맞은 것은?
A: Was he at school yesterday?
B: No, he ___.', '["isn''t","wasn''t","weren''t","didn''t"]'::jsonb, 'wasn''t', 'Was he ~? 의 부정 대답 → No, he wasn''t.', 1, 'MY Grammar 샘플'),
  ('M1-06-1', 'ox', '"May I use your phone?" 의 may 는 ''허락''을 구하는 뜻이다.', null::jsonb, 'O', 'May I ~? = ~해도 될까요? (허락)', 1, 'MY Grammar 샘플'),
  ('M1-09-1', 'blank', 'My dream is ___ travel around the world.', null::jsonb, 'to', '보어 자리의 to부정사: ~하는 것', 1, 'MY Grammar 샘플'),
  ('M1-09-1', 'error', 'She [decided] [to] [learns] [Chinese].', null::jsonb, 'learns', 'to 뒤에는 동사원형 learn', 2, 'MY Grammar 샘플'),
  ('M1-12-2', 'mc', 'Wash your hands ___ you eat.', '["before","but","so","or"]'::jsonb, 'before', '먹기 ''전에'' → before', 1, 'MY Grammar 샘플'),
  ('M2-05-1', 'mc', '___ is fun to play board games with friends.', '["This","That","It","What"]'::jsonb, 'It', '가주어 It ~ 진주어 to부정사', 2, 'MY Grammar 샘플'),
  ('M2-05-1', 'order', '매일 운동하는 것은 중요하다.', null::jsonb, 'It is important to exercise every day.', 'It(가주어) + is + 형용사 + to부정사(진주어)', 2, 'MY Grammar 샘플'),
  ('M2-12-2', 'blank', 'I wish I ___ (have) a little sister.', null::jsonb, 'had', 'I wish + 가정법 과거 → had', 2, 'MY Grammar 샘플'),
  ('M2-12-2', 'error', 'He talks [as if] he [knows] [everything] [about it].', null::jsonb, 'knows', 'as if + 가정법 과거 → knew', 3, 'MY Grammar 샘플'),
  ('M3-01-3', 'mc', 'I had my bike ___ yesterday.', '["repair","repairing","repaired","to repair"]'::jsonb, 'repaired', '자전거는 ''수리되는'' 것 → 목적격 보어 p.p.', 3, 'MY Grammar 샘플'),
  ('H-11-1', 'mc', 'It was ___ a hot day that we stayed inside.', '["so","such","very","too"]'::jsonb, 'such', 'a + 형용사 + 명사 앞 → such', 2, 'MY Grammar 샘플'),
  ('H-11-1', 'error', 'The movie was [such] [boring] [that] I [fell asleep].', null::jsonb, 'such', '명사 없이 형용사만 → so boring', 2, 'MY Grammar 샘플'),
  ('H-11-1', 'ox', '"She is so kind a person." 은 어법상 올바르다.', null::jsonb, 'O', 'so + 형용사 + a + 명사 = such a + 형용사 + 명사', 3, 'MY Grammar 샘플'),
  ('H-09-2', 'mc', '___ the heavy rain, the game continued.', '["Although","Despite","Because","Though"]'::jsonb, 'Despite', '뒤에 명사구(the heavy rain) → 전치사 Despite', 2, 'MY Grammar 샘플'),
  ('H-09-2', 'error', '[Despite of] the cold weather, we [went] [swimming] [in the sea].', null::jsonb, 'Despite of', 'despite 뒤에는 of 를 쓰지 않아요 → Despite', 2, 'MY Grammar 샘플'),
  ('H-09-2', 'blank', '___ it was cold, we went swimming. (비록 ~이지만, A로 시작)', null::jsonb, 'although', '뒤에 주어 + 동사 → 접속사 Although', 2, 'MY Grammar 샘플')
) as v(topic_code, qtype, prompt, choices, answer, explanation, difficulty, source)
where not exists (select 1 from public.mg_questions m where m.prompt = v.prompt);

-- 5. 풀이 기록의 단원 코드 맞추기
update public.mg_attempts a set topic_code = q.topic_code
  from public.mg_questions q where q.id = a.question_id and a.topic_code is distinct from q.topic_code;

-- 6. 남은 예전 단원은 숨기기 (지우지 않아요)
update public.mg_topics set active = false where code ~ '^G[0-9]-[0-9]{2}$';

-- 7. 채점 함수 업데이트 (문제가 3개 이상인 단원만 '전 단원 완주'에 세어요)
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
     and (select count(*) from public.mg_questions qq where qq.topic_code = t.code and qq.active) >= 3;
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

-- 끝! 학생 화면을 새로고침하면 새 단원표가 보여요.
