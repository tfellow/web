-- =====================================================================
--  MY Grammar · 샘플 단원 18개 + 샘플 문제 103개
--  01_schema.sql 을 실행한 뒤에 실행하세요. (js/sample-data.js 에서 자동 생성)
--  이미 있는 단원 코드는 덮어쓰지 않아요. 문제는 문제 표가 비어 있을 때만 넣어요.
-- =====================================================================
insert into public.mg_topics (code, grade, category, title, title_en, summary, examples, tip, sort_order) values
  ('G1-01', 1, '동사', 'be동사 (am / are / is)', 'Be Verbs', 'be동사는 ''~이다, ~에 있다''라는 뜻이에요.
**주어에 따라 모양이 바뀌어요.**
I → am / You, We, They, 복수 → are / He, She, It, 단수 → is
부정문은 be동사 뒤에 not, 의문문은 be동사를 주어 앞으로!', 'I am a student. | 나는 학생이다.
They are in the library. | 그들은 도서관에 있다.
She is not hungry. | 그녀는 배고프지 않다.
Is he your brother? | 그는 너의 남동생이니?', 'My friends(복수) → are, My friend(단수) → is. 주어가 길어도 ''핵심 명사''의 단수·복수를 보세요!', 1),
  ('G1-02', 1, '동사', '일반동사 현재형', 'Simple Present', '주어가 3인칭 단수(he, she, it, Tom...)이면 동사에 **-s / -es** 를 붙여요.
-s: plays, likes / -es: watches, goes, does, fixes / 자음+y → -ies: studies, cries
have → has (불규칙)
부정문: don''t / doesn''t + 동사원형, 의문문: Do / Does + 주어 + 동사원형?', 'She plays the piano every day. | 그녀는 매일 피아노를 친다.
My dad watches TV at night. | 아빠는 밤에 TV를 보신다.
He doesn''t like carrots. | 그는 당근을 좋아하지 않는다.
Does she live near here? | 그녀는 이 근처에 사니?', 'doesn''t, does 뒤에는 반드시 동사원형! (He doesn''t likes ✗ → He doesn''t like ✓)', 2),
  ('G1-03', 1, '시제', '현재진행형', 'Present Progressive', '지금 하고 있는 일: **be동사(am/are/is) + 동사-ing**
-ing 만들기: play → playing / come → coming (e 빼고) / run → running (자음 하나 더)
상태를 나타내는 동사(know, like, want, have(가지다))는 진행형으로 잘 쓰지 않아요.', 'I am reading a book now. | 나는 지금 책을 읽고 있다.
They are swimming in the pool. | 그들은 수영장에서 수영하고 있다.
She is not sleeping. | 그녀는 자고 있지 않다.', 'now, right now, Look!, Listen! 이 보이면 진행형을 떠올리세요.', 3),
  ('G1-04', 1, '시제', '과거시제', 'Simple Past', '과거의 일: be동사 → **was / were**, 일반동사 → **-ed** 또는 불규칙 변화
규칙: played, liked, studied, stopped
불규칙: go-went, eat-ate, see-saw, have-had, make-made, buy-bought
부정문·의문문: didn''t / Did + 동사원형', 'I was tired yesterday. | 나는 어제 피곤했다.
We went to Busan last summer. | 우리는 지난여름 부산에 갔다.
She didn''t eat breakfast. | 그녀는 아침을 먹지 않았다.
Did you see the movie? | 너 그 영화 봤니?', 'yesterday, last ~, ~ ago, in 2020 → 과거시제 신호! did 뒤에는 동사원형.', 4),
  ('G1-05', 1, '시제', '미래 표현 (will / be going to)', 'Future', '**will + 동사원형**: ~할 것이다 (즉석 결정, 예측)
**be going to + 동사원형**: ~할 예정이다 (미리 정한 계획)
부정: will not(won''t), be not going to', 'I will help you. | 내가 도와줄게.
She is going to visit her grandma this weekend. | 그녀는 이번 주말에 할머니 댁을 방문할 예정이다.
It won''t rain tomorrow. | 내일은 비가 오지 않을 것이다.', 'will 뒤, to 뒤에는 동사원형! (will goes ✗, going to visits ✗)', 5),
  ('G1-06', 1, '조동사', '조동사 can / must / should', 'Modal Verbs', '조동사 + **동사원형**
can: ~할 수 있다 (= be able to), ~해도 된다
must: ~해야 한다 (= have to), must not: ~하면 안 된다
should: ~하는 게 좋겠다(충고)
don''t have to: ~할 필요 없다', 'She can speak three languages. | 그녀는 3개 언어를 할 수 있다.
You must wear a helmet. | 헬멧을 써야 한다.
You should go to bed early. | 일찍 자는 게 좋겠어.
You don''t have to hurry. | 서두를 필요 없어.', 'must not(금지) ≠ don''t have to(불필요). 시험 단골!', 6),
  ('G1-07', 1, '형용사·부사', '비교급과 최상급', 'Comparatives & Superlatives', '비교급: **-er than / more ~ than** (더 ~한)
최상급: **the -est / the most ~** (가장 ~한)
짧은 단어: tall-taller-tallest, big-bigger-biggest, easy-easier-easiest
긴 단어: beautiful-more beautiful-most beautiful
불규칙: good/well-better-best, bad-worse-worst, many/much-more-most', 'My bag is heavier than yours. | 내 가방이 네 것보다 더 무겁다.
This is the most interesting book. | 이것이 가장 재미있는 책이다.
She is as tall as her mom. | 그녀는 엄마만큼 키가 크다.', '비교급 강조는 much, even, far, a lot (very ✗)', 7),
  ('G2-01', 2, '준동사', 'to부정사', 'To-infinitives', '**to + 동사원형**
명사적 용법: ~하는 것 (To read books is fun. / I want to go.)
형용사적 용법: ~할 (something to drink, time to sleep)
부사적 용법: ~하기 위해(목적), ~해서(감정의 원인)
It is ~ to ...: 가주어 it', 'I want to be a doctor. | 나는 의사가 되고 싶다.
I need something to eat. | 나는 먹을 것이 필요하다.
She went to the store to buy milk. | 그녀는 우유를 사기 위해 가게에 갔다.
It is important to exercise. | 운동하는 것은 중요하다.', 'want, hope, plan, decide, need 뒤에는 to부정사!', 8),
  ('G2-02', 2, '준동사', '동명사', 'Gerunds', '**동사-ing** 가 명사처럼 ''~하는 것''으로 쓰여요.
주어: Swimming is good exercise.
목적어: enjoy, finish, mind, keep, give up, avoid + -ing
전치사 뒤: I''m good at drawing. / Thank you for helping me.', 'I enjoy playing soccer. | 나는 축구하는 것을 즐긴다.
He finished doing his homework. | 그는 숙제를 끝냈다.
She is interested in learning Korean. | 그녀는 한국어 배우는 데 관심이 있다.', 'enjoy/finish/mind/give up 뒤 to부정사 ✗. 전치사 뒤 동사는 무조건 -ing!', 9),
  ('G2-03', 2, '태', '수동태', 'Passive Voice', '**be동사 + 과거분사(p.p.) + (by 행위자)**: ~되다, ~당하다
능동: Many people love the song. → 수동: The song is loved by many people.
시제는 be동사로 표현: is made / was made / will be made', 'This bridge was built in 1990. | 이 다리는 1990년에 지어졌다.
English is spoken in many countries. | 영어는 많은 나라에서 사용된다.
The letter was written by Tom. | 그 편지는 Tom에 의해 쓰였다.', '주어가 ''스스로'' 하나, ''당하나''를 먼저 따지세요. be동사 + 동사원형 ✗', 10),
  ('G2-04', 2, '시제', '현재완료', 'Present Perfect', '**have / has + 과거분사(p.p.)**: 과거의 일이 지금까지 이어지거나 영향을 줄 때
경험(ever, never, before) / 계속(for, since) / 완료(just, already, yet) / 결과(have gone)
분명한 과거 표현(yesterday, last year, ~ ago)과 함께 쓰지 않아요!', 'I have been to Jeju twice. | 나는 제주도에 두 번 가 본 적이 있다.
She has lived here since 2020. | 그녀는 2020년부터 여기 살고 있다.
Have you finished your homework yet? | 숙제 벌써 끝냈니?', 'for + 기간(for three years), since + 시작 시점(since 2020)', 11),
  ('G2-05', 2, '접속사', '접속사 (when, if, because, that)', 'Conjunctions', 'when: ~할 때 / if: 만약 ~하면 / because: ~ 때문에 / that: ~라는 것
**시간·조건 부사절에서는 미래 대신 현재시제!** (If it rains tomorrow, ...)
because + 주어 + 동사 / because of + 명사', 'When I was young, I lived in Seoul. | 어렸을 때 나는 서울에 살았다.
If it rains tomorrow, we will stay home. | 내일 비가 오면 우리는 집에 있을 거야.
I think that he is honest. | 나는 그가 정직하다고 생각한다.', 'If it will rain ✗ → If it rains ✓', 12),
  ('G2-06', 2, '문장 형식', '4형식 · 5형식', 'Sentence Patterns', '4형식: 주어 + 동사 + **~에게(간접목적어) + ~을(직접목적어)**
→ 3형식 전환: give/send/show **to**, make/buy/cook **for**, ask **of**
5형식: 주어 + 동사 + 목적어 + **목적격보어**
make/keep/find + 목적어 + 형용사 / want/ask/tell + 목적어 + to부정사', 'He gave me a present. | 그는 나에게 선물을 주었다.
He gave a present to me. | (3형식 전환)
The news made us happy. | 그 소식은 우리를 행복하게 했다.
Mom told me to clean my room. | 엄마가 내게 방을 청소하라고 하셨다.', 'make + 목적어 + 형용사 (happily ✗ happy ✓)', 13),
  ('G3-01', 3, '관계사', '관계대명사 who / which / that', 'Relative Pronouns', '두 문장을 이어 앞의 명사(선행사)를 꾸며 줘요.
사람 → **who**(주격) / **whom**(목적격) / **whose**(소유격)
사물·동물 → **which**
that 은 사람·사물 모두 가능 (단, 콤마 뒤, 전치사 뒤 ✗)
목적격 관계대명사는 생략할 수 있어요.', 'I have a friend who lives in Canada. | 나는 캐나다에 사는 친구가 있다.
This is the book which I bought yesterday. | 이것이 내가 어제 산 책이다.
She is the girl whose father is a pilot. | 그녀는 아빠가 조종사인 소녀이다.', '주격 관계대명사 뒤 동사는 선행사에 수 일치! (a friend who live ✗)', 14),
  ('G3-02', 3, '관계사', '관계대명사 what', 'Relative Pronoun What', '**what = the thing(s) which/that** (~하는 것)
what 은 선행사를 품고 있어서 앞에 명사가 없어요.
What I want is your smile. / This is what I need.', 'What she said is true. | 그녀가 말한 것은 사실이다.
Show me what you have. | 네가 가진 것을 보여 줘.
This is not what I ordered. | 이것은 내가 주문한 것이 아니다.', '앞에 명사(선행사)가 있으면 which/that, 없으면 what!', 15),
  ('G3-03', 3, '가정법', '가정법 과거', 'Second Conditional', '현재 사실과 반대되는 상상: **If + 주어 + 과거동사, 주어 + would/could + 동사원형**
be동사는 주어와 상관없이 주로 **were**
I wish + 주어 + 과거동사: ~라면 좋을 텐데', 'If I had wings, I could fly. | 내게 날개가 있다면 날 수 있을 텐데.
If I were you, I would study harder. | 내가 너라면 더 열심히 공부할 텐데.
I wish I lived near the sea. | 바다 근처에 살면 좋을 텐데.', '모양은 과거, 뜻은 현재! If I were rich = 실제로는 부자가 아니다.', 16),
  ('G3-04', 3, '문장', '간접의문문', 'Embedded Questions', '의문문이 다른 문장 안에 들어가면 **의문사 + 주어 + 동사** 순서!
Where is he? → Do you know where he is?
의문사가 없으면 **if / whether + 주어 + 동사**
think, believe, guess 등은 의문사를 문장 맨 앞으로: What do you think he wants?', 'I don''t know what time it is. | 몇 시인지 모르겠다.
Can you tell me where the station is? | 역이 어디 있는지 알려 줄래요?
I wonder if she likes me. | 그녀가 나를 좋아하는지 궁금하다.', 'Do you know where is he? ✗ → where he is ✓', 17),
  ('G3-05', 3, '준동사', '현재분사와 과거분사', 'Participles', '**현재분사(-ing)**: 능동·진행 ''~하는'' (a sleeping baby)
**과거분사(p.p.)**: 수동·완료 ''~된'' (a broken window)
감정 분사: 감정을 일으키면 -ing (boring, exciting), 감정을 느끼면 p.p. (bored, excited)
분사가 다른 말과 함께 길어지면 명사 뒤에서 꾸며요.', 'Look at the dancing girls. | 춤추는 소녀들을 봐.
I found a wallet lost on the street. | 나는 길에서 잃어버린 지갑을 찾았다.
The movie was boring, so I was bored. | 영화가 지루해서 나는 지루했다.', '사람이 느끼는 감정 → -ed, 사물이 주는 느낌 → -ing', 18)
on conflict (code) do nothing;

insert into public.mg_questions (topic_code, qtype, prompt, choices, answer, explanation, difficulty, source)
select * from (values
  ('G1-01', 'mc', 'My sister and I ___ in the same class.', '["am","is","are","be"]'::jsonb, 'are', '주어 My sister and I 는 ''우리(복수)'' → are', 1, 'MY Grammar 샘플'),
  ('G1-01', 'blank', 'He ___ a famous singer. (be동사 현재형)', null::jsonb, 'is', 'He(3인칭 단수) → is', 1, 'MY Grammar 샘플'),
  ('G1-01', 'ox', '"The books on the desk is mine." 는 올바른 문장이다.', null::jsonb, 'X', '주어의 핵심은 The books(복수) → are 가 맞아요.', 2, 'MY Grammar 샘플'),
  ('G1-01', 'error', '[Tom and Jerry] [is] [my] [favorite] cartoon characters.', null::jsonb, 'is', 'Tom and Jerry 는 복수 → are', 2, 'MY Grammar 샘플'),
  ('G1-01', 'order', '그녀는 지금 집에 없다.', null::jsonb, 'She is not at home now.', '부정문: be동사 + not', 1, 'MY Grammar 샘플'),
  ('G1-01', 'mc', '다음 대화의 빈칸에 알맞은 것은?
A: ___ you a new student?
B: Yes, I am.', '["Do","Is","Are","Am"]'::jsonb, 'Are', 'be동사 의문문: Are you ~? 대답 Yes, I am.', 1, 'MY Grammar 샘플'),
  ('G1-02', 'mc', 'My brother ___ his homework after dinner.', '["do","does","doing","to do"]'::jsonb, 'does', '3인칭 단수 주어 → does', 1, 'MY Grammar 샘플'),
  ('G1-02', 'blank', 'She ___ (study) English every morning.', null::jsonb, 'studies', '자음 + y → -ies : studies', 2, 'MY Grammar 샘플'),
  ('G1-02', 'error', 'My cat [doesn''t] [likes] [to take] [a bath].', null::jsonb, 'likes', 'doesn''t 뒤에는 동사원형 like', 2, 'MY Grammar 샘플'),
  ('G1-02', 'ox', '"Does he has a bike?" 는 올바른 문장이다.', null::jsonb, 'X', 'Does 뒤에는 동사원형 have → Does he have a bike?', 2, 'MY Grammar 샘플'),
  ('G1-02', 'order', '그는 주말마다 축구를 한다.', null::jsonb, 'He plays soccer every weekend.', '3인칭 단수 → plays', 1, 'MY Grammar 샘플'),
  ('G1-02', 'mc', '밑줄 친 동사의 형태가 잘못된 것은?', '["She watches TV.","He gos to school.","It flies high.","Mina has a dog."]'::jsonb, 'He gos to school.', 'go → goes (-o로 끝나면 -es)', 2, 'MY Grammar 샘플'),
  ('G1-03', 'mc', 'Look! The children ___ in the park.', '["run","runs","are running","is running"]'::jsonb, 'are running', 'Look! → 지금 진행 중, children(복수) → are running', 1, 'MY Grammar 샘플'),
  ('G1-03', 'blank', 'I am ___ (write) a letter to my friend.', null::jsonb, 'writing', 'e로 끝나면 e를 빼고 -ing : writing', 2, 'MY Grammar 샘플'),
  ('G1-03', 'error', 'She [is] [siting] [on the bench] [now].', null::jsonb, 'siting', 'sit → sitting (단모음+단자음 → 자음 하나 더)', 2, 'MY Grammar 샘플'),
  ('G1-03', 'ox', '"I am knowing the answer." 는 올바른 문장이다.', null::jsonb, 'X', 'know 는 상태 동사라 진행형으로 쓰지 않아요 → I know the answer.', 3, 'MY Grammar 샘플'),
  ('G1-03', 'order', '너는 지금 무엇을 하고 있니?', null::jsonb, 'What are you doing now?', '의문사 + be동사 + 주어 + -ing', 2, 'MY Grammar 샘플'),
  ('G1-04', 'mc', 'We ___ to the museum last Friday.', '["go","goes","went","going"]'::jsonb, 'went', 'last Friday → 과거, go-went', 1, 'MY Grammar 샘플'),
  ('G1-04', 'blank', 'They ___ at home yesterday. (be동사)', null::jsonb, 'were', 'They + 과거 → were', 1, 'MY Grammar 샘플'),
  ('G1-04', 'error', '[Did] you [watched] the soccer game [last night]?', null::jsonb, 'watched', 'Did 뒤에는 동사원형 watch', 2, 'MY Grammar 샘플'),
  ('G1-04', 'ox', 'stop 의 과거형은 stoped 이다.', null::jsonb, 'X', '단모음+단자음 → 자음 하나 더 : stopped', 2, 'MY Grammar 샘플'),
  ('G1-04', 'order', '나는 어제 아침을 먹지 않았다.', null::jsonb, 'I didn''t eat breakfast yesterday.', 'didn''t + 동사원형', 2, 'MY Grammar 샘플'),
  ('G1-04', 'mc', '동사의 과거형이 잘못 짝지어진 것은?', '["buy - bought","see - saw","make - maked","eat - ate"]'::jsonb, 'make - maked', 'make 의 과거형은 made', 2, 'MY Grammar 샘플'),
  ('G1-05', 'mc', 'It ___ sunny tomorrow.', '["is","was","will be","will is"]'::jsonb, 'will be', 'tomorrow → 미래, will + 동사원형 be', 1, 'MY Grammar 샘플'),
  ('G1-05', 'blank', 'I am going ___ visit my uncle this Sunday.', null::jsonb, 'to', 'be going to + 동사원형', 1, 'MY Grammar 샘플'),
  ('G1-05', 'error', 'She [will] [goes] [shopping] [tomorrow].', null::jsonb, 'goes', 'will 뒤에는 동사원형 go', 2, 'MY Grammar 샘플'),
  ('G1-05', 'order', '우리는 다음 주에 소풍을 갈 예정이다.', null::jsonb, 'We are going to go on a picnic next week.', 'be going to + 동사원형', 3, 'MY Grammar 샘플'),
  ('G1-05', 'ox', '"Will you help me?" 는 올바른 문장이다.', null::jsonb, 'O', 'Will + 주어 + 동사원형 ~? 의문문', 1, 'MY Grammar 샘플'),
  ('G1-06', 'mc', 'You ___ run in the hallway. It''s dangerous.', '["must not","don''t have to","can","should"]'::jsonb, 'must not', '위험하니까 ''~하면 안 된다'' → must not', 2, 'MY Grammar 샘플'),
  ('G1-06', 'mc', 'Tomorrow is Sunday. You ___ get up early.', '["must","don''t have to","must not","can''t"]'::jsonb, 'don''t have to', '일요일이니까 ''~할 필요 없다'' → don''t have to', 2, 'MY Grammar 샘플'),
  ('G1-06', 'blank', 'She can swim. = She is ___ to swim.', null::jsonb, 'able', 'can = be able to', 2, 'MY Grammar 샘플'),
  ('G1-06', 'error', 'He [can] [plays] the guitar [very well].', null::jsonb, 'plays', '조동사 뒤에는 동사원형 play', 1, 'MY Grammar 샘플'),
  ('G1-06', 'order', '너는 의사에게 가 보는 게 좋겠어.', null::jsonb, 'You should see a doctor.', 'should: 충고', 1, 'MY Grammar 샘플'),
  ('G1-07', 'mc', 'Seoul is ___ than my hometown.', '["big","bigger","biggest","more big"]'::jsonb, 'bigger', 'than → 비교급, big → bigger', 1, 'MY Grammar 샘플'),
  ('G1-07', 'blank', 'This is the ___ (good) pizza in town.', null::jsonb, 'best', 'good - better - best', 2, 'MY Grammar 샘플'),
  ('G1-07', 'error', 'This puzzle is [very] [easier] [than] [that one].', null::jsonb, 'very', '비교급 강조는 much, even, far, a lot (very ✗)', 3, 'MY Grammar 샘플'),
  ('G1-07', 'ox', '"She is the most beautiful girl in our class." 는 올바른 문장이다.', null::jsonb, 'O', '긴 형용사 최상급 → the most beautiful', 1, 'MY Grammar 샘플'),
  ('G1-07', 'order', '나의 형은 아빠만큼 키가 크다.', null::jsonb, 'My brother is as tall as my dad.', 'as + 원급 + as: ~만큼 ...한', 2, 'MY Grammar 샘플'),
  ('G1-07', 'mc', '어법상 바른 문장은?', '["He is more taller than me.","This is the most famous place.","She is gooder than him.","It''s the bigest box."]'::jsonb, 'This is the most famous place.', 'more taller ✗ / gooder ✗ (better) / bigest ✗ (biggest)', 2, 'MY Grammar 샘플'),
  ('G2-01', 'mc', 'I want ___ a famous scientist.', '["be","to be","being","been"]'::jsonb, 'to be', 'want + to부정사', 1, 'MY Grammar 샘플'),
  ('G2-01', 'mc', '밑줄 친 to부정사의 용법이 나머지와 다른 것은?', '["I hope to see you.","She decided to leave.","I have no time to rest.","He likes to cook."]'::jsonb, 'I have no time to rest.', 'time to rest 는 ''쉴 시간'' (형용사적 용법), 나머지는 ''~하는 것'' (명사적 용법)', 3, 'MY Grammar 샘플'),
  ('G2-01', 'blank', 'It is hard ___ learn a new language.', null::jsonb, 'to', '가주어 It ~ 진주어 to부정사', 1, 'MY Grammar 샘플'),
  ('G2-01', 'error', 'She [went] to the library [to] [borrowing] [some books].', null::jsonb, 'borrowing', '목적(~하기 위해)의 to + 동사원형 borrow', 2, 'MY Grammar 샘플'),
  ('G2-01', 'order', '나는 마실 것이 필요하다.', null::jsonb, 'I need something to drink.', 'something + to부정사 (형용사적 용법)', 2, 'MY Grammar 샘플'),
  ('G2-01', 'ox', '"I was happy to hear the news." 에서 to hear 는 감정의 원인(~해서)을 나타낸다.', null::jsonb, 'O', '감정 형용사 + to부정사: ~해서 (부사적 용법)', 2, 'MY Grammar 샘플'),
  ('G2-02', 'mc', 'Do you mind ___ the window?', '["open","to open","opening","opened"]'::jsonb, 'opening', 'mind + 동명사', 2, 'MY Grammar 샘플'),
  ('G2-02', 'blank', 'Thank you for ___ (invite) me.', null::jsonb, 'inviting', '전치사 for 뒤 → 동명사', 2, 'MY Grammar 샘플'),
  ('G2-02', 'error', 'My dad [gave up] [to smoke] [last year] [for his health].', null::jsonb, 'to smoke', 'give up + 동명사 → smoking', 2, 'MY Grammar 샘플'),
  ('G2-02', 'ox', '"Reading books are my hobby." 는 올바른 문장이다.', null::jsonb, 'X', '동명사 주어는 단수 취급 → is', 3, 'MY Grammar 샘플'),
  ('G2-02', 'order', '그녀는 그림 그리는 것을 잘한다.', null::jsonb, 'She is good at drawing pictures.', 'be good at + 동명사', 2, 'MY Grammar 샘플'),
  ('G2-02', 'mc', '빈칸에 들어갈 수 없는 동사는?
I ___ playing the piano.', '["enjoy","finished","want","kept"]'::jsonb, 'want', 'want 는 to부정사를 목적어로 써요.', 3, 'MY Grammar 샘플'),
  ('G2-03', 'mc', 'This song ___ by BTS.', '["sang","was sung","was sang","is singing"]'::jsonb, 'was sung', '노래가 ''불려진'' 것 → be + p.p., sing-sang-sung', 2, 'MY Grammar 샘플'),
  ('G2-03', 'blank', 'The window was ___ (break) by the ball.', null::jsonb, 'broken', 'break - broke - broken', 2, 'MY Grammar 샘플'),
  ('G2-03', 'error', '[The Mona Lisa] [painted] [by] [Leonardo da Vinci].', null::jsonb, 'painted', '그림이 ''그려진'' 것 → was painted', 2, 'MY Grammar 샘플'),
  ('G2-03', 'ox', '"Korean is spoken in Korea." 는 올바른 수동태 문장이다.', null::jsonb, 'O', 'be + p.p.(spoken)', 1, 'MY Grammar 샘플'),
  ('G2-03', 'order', '이 집은 100년 전에 지어졌다.', null::jsonb, 'This house was built 100 years ago.', '과거 수동태: was + p.p.', 2, 'MY Grammar 샘플'),
  ('G2-03', 'mc', '능동태 "Jane wrote the letter." 를 수동태로 바르게 바꾼 것은?', '["The letter wrote by Jane.","The letter was written by Jane.","The letter is written by Jane.","Jane was written the letter."]'::jsonb, 'The letter was written by Jane.', '과거 → was + written', 2, 'MY Grammar 샘플'),
  ('G2-04', 'mc', 'I ___ in this town since 2018.', '["live","lived","have lived","am living"]'::jsonb, 'have lived', 'since(~부터 지금까지) → 현재완료 계속', 2, 'MY Grammar 샘플'),
  ('G2-04', 'blank', 'She has lived in Busan ___ five years.', null::jsonb, 'for', 'for + 기간', 1, 'MY Grammar 샘플'),
  ('G2-04', 'error', 'I [have seen] [the movie] [with my friends] [yesterday].', null::jsonb, 'have seen', 'yesterday(분명한 과거)와 현재완료는 함께 못 써요 → saw', 3, 'MY Grammar 샘플'),
  ('G2-04', 'ox', '"Have you ever been to London?" 는 경험을 묻는 문장이다.', null::jsonb, 'O', 'ever + 현재완료 → 경험', 1, 'MY Grammar 샘플'),
  ('G2-04', 'order', '나는 막 숙제를 끝냈다.', null::jsonb, 'I have just finished my homework.', 'have + just + p.p. (완료)', 2, 'MY Grammar 샘플'),
  ('G2-04', 'mc', '"He has gone to Paris." 의 의미로 알맞은 것은?', '["그는 파리에 가 본 적이 있다.","그는 파리에 가 버렸다(지금 여기 없다).","그는 파리에 갈 것이다.","그는 파리에서 돌아왔다."]'::jsonb, '그는 파리에 가 버렸다(지금 여기 없다).', 'have gone to: 가 버렸다(결과) / have been to: 가 본 적 있다(경험)', 3, 'MY Grammar 샘플'),
  ('G2-05', 'mc', 'I stayed home ___ I was sick.', '["because","because of","if","but"]'::jsonb, 'because', '뒤에 주어+동사 → because', 1, 'MY Grammar 샘플'),
  ('G2-05', 'mc', 'If it ___ tomorrow, we will cancel the game.', '["rain","rains","will rain","rained"]'::jsonb, 'rains', '조건 부사절에서는 미래 대신 현재시제', 2, 'MY Grammar 샘플'),
  ('G2-05', 'blank', 'I think ___ he is honest. (~라는 것)', null::jsonb, 'that', '명사절 접속사 that', 1, 'MY Grammar 샘플'),
  ('G2-05', 'error', '[When] [I] [will arrive] there, I''ll call you.', null::jsonb, 'will arrive', '시간 부사절 → 현재시제 arrive', 3, 'MY Grammar 샘플'),
  ('G2-05', 'order', '내가 어렸을 때, 나는 부산에 살았다.', null::jsonb, 'When I was young, I lived in Busan.', 'When + 주어 + 동사, 주절', 2, 'MY Grammar 샘플'),
  ('G2-05', 'ox', '"We didn''t go out because of the rain." 는 올바른 문장이다.', null::jsonb, 'O', 'because of + 명사(the rain)', 2, 'MY Grammar 샘플'),
  ('G2-06', 'mc', 'Mom made ___ a cake.', '["I","my","me","mine"]'::jsonb, 'me', '4형식 간접목적어 → 목적격 me', 1, 'MY Grammar 샘플'),
  ('G2-06', 'blank', 'He bought a new bag ___ his sister.', null::jsonb, 'for', 'buy 는 3형식 전환 시 for', 2, 'MY Grammar 샘플'),
  ('G2-06', 'error', 'The good news [made] [us] [very] [happily].', null::jsonb, 'happily', '5형식 목적격보어 → 형용사 happy', 2, 'MY Grammar 샘플'),
  ('G2-06', 'mc', 'The teacher told us ___ quiet.', '["be","to be","being","are"]'::jsonb, 'to be', 'tell + 목적어 + to부정사', 2, 'MY Grammar 샘플'),
  ('G2-06', 'order', '그는 나에게 그의 사진들을 보여 주었다.', null::jsonb, 'He showed me his pictures.', '4형식: 동사 + ~에게 + ~을', 2, 'MY Grammar 샘플'),
  ('G2-06', 'ox', '"She gave a flower for me." 는 올바른 문장이다.', null::jsonb, 'X', 'give 는 3형식 전환 시 to → She gave a flower to me.', 2, 'MY Grammar 샘플'),
  ('G3-01', 'mc', 'I have a friend ___ can speak French.', '["who","which","whose","what"]'::jsonb, 'who', '선행사 a friend(사람) + 주격 → who', 1, 'MY Grammar 샘플'),
  ('G3-01', 'mc', 'This is the cat ___ tail is very long.', '["who","which","whose","that"]'::jsonb, 'whose', '''그것의 꼬리'' → 소유격 whose', 2, 'MY Grammar 샘플'),
  ('G3-01', 'blank', 'The bike ___ I bought last week is red. (사물, 목적격)', null::jsonb, 'which|that', '사물 선행사 목적격 → which 또는 that', 2, 'MY Grammar 샘플'),
  ('G3-01', 'error', 'I know [a boy] [who] [play] [the drums] well.', null::jsonb, 'play', '선행사 a boy(단수)에 수 일치 → plays', 3, 'MY Grammar 샘플'),
  ('G3-01', 'order', '그녀는 내가 가장 좋아하는 가수이다.', null::jsonb, 'She is the singer that I like most.', '목적격 관계대명사 that (생략 가능)', 3, 'MY Grammar 샘플'),
  ('G3-01', 'ox', '"The man who I met yesterday was kind." 에서 who 는 생략할 수 있다.', null::jsonb, 'O', '목적격 관계대명사는 생략 가능', 2, 'MY Grammar 샘플'),
  ('G3-02', 'mc', '___ I want for my birthday is a new phone.', '["That","Which","What","Who"]'::jsonb, 'What', '선행사 없음 + ''~하는 것'' → What', 2, 'MY Grammar 샘플'),
  ('G3-02', 'mc', 'This is the bag ___ I lost.', '["what","which","who","whose"]'::jsonb, 'which', '선행사 the bag 이 있으므로 what ✗ → which', 2, 'MY Grammar 샘플'),
  ('G3-02', 'blank', 'Tell me ___ you saw. (네가 본 것)', null::jsonb, 'what', 'what = the thing which', 2, 'MY Grammar 샘플'),
  ('G3-02', 'error', '[The thing] [what] [he] [said] was not true.', null::jsonb, 'what', '선행사 The thing 이 있으므로 which/that', 3, 'MY Grammar 샘플'),
  ('G3-02', 'order', '그것은 내가 필요한 것이 아니다.', null::jsonb, 'That is not what I need.', 'what + 주어 + 동사: ~하는 것', 2, 'MY Grammar 샘플'),
  ('G3-03', 'mc', 'If I ___ a bird, I would fly to you.', '["am","was","were","will be"]'::jsonb, 'were', '가정법 과거: be동사 → were', 2, 'MY Grammar 샘플'),
  ('G3-03', 'blank', 'If I had a lot of money, I ___ buy a big house. (~할 텐데)', null::jsonb, 'would|could', '가정법 과거 주절: would/could + 동사원형', 2, 'MY Grammar 샘플'),
  ('G3-03', 'error', 'If I [knew] her number, I [will] [call] [her].', null::jsonb, 'will', '가정법 과거 → would call', 2, 'MY Grammar 샘플'),
  ('G3-03', 'ox', '"If I were taller, I could play basketball better." 는 지금 키가 크다는 뜻이다.', null::jsonb, 'X', '가정법 과거는 현재 사실의 반대 → 실제로는 키가 크지 않다', 2, 'MY Grammar 샘플'),
  ('G3-03', 'order', '내가 너라면, 나는 그 일을 하지 않을 텐데.', null::jsonb, 'If I were you, I wouldn''t do that.', 'If + 주어 + were, 주어 + would not + 동사원형', 3, 'MY Grammar 샘플'),
  ('G3-03', 'mc', '"I wish I could swim." 의 의미로 알맞은 것은?', '["나는 수영을 할 수 있다.","나는 수영을 할 수 있으면 좋겠다.","나는 수영을 했다.","나는 수영을 할 것이다."]'::jsonb, '나는 수영을 할 수 있으면 좋겠다.', 'I wish + 과거: 현재 이루기 어려운 소망', 1, 'MY Grammar 샘플'),
  ('G3-04', 'mc', 'Do you know where ___?', '["does she live","she lives","lives she","she does live"]'::jsonb, 'she lives', '간접의문문: 의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('G3-04', 'blank', 'I wonder ___ he will come to the party. (~인지 아닌지)', null::jsonb, 'if|whether', '의문사가 없을 때 if/whether', 2, 'MY Grammar 샘플'),
  ('G3-04', 'error', 'Can you [tell] [me] [what time] [is it]?', null::jsonb, 'is it', '간접의문문 → what time it is', 2, 'MY Grammar 샘플'),
  ('G3-04', 'order', '그가 왜 늦었는지 나는 모른다.', null::jsonb, 'I don''t know why he was late.', '의문사 + 주어 + 동사', 2, 'MY Grammar 샘플'),
  ('G3-04', 'ox', '"What do you think she wants?" 는 올바른 문장이다.', null::jsonb, 'O', 'think 가 있으면 의문사를 문장 맨 앞으로!', 3, 'MY Grammar 샘플'),
  ('G3-05', 'mc', 'Look at the ___ baby. (자고 있는)', '["sleep","sleeping","slept","sleeps"]'::jsonb, 'sleeping', '능동·진행 → 현재분사', 1, 'MY Grammar 샘플'),
  ('G3-05', 'mc', 'The game was so ___ that everyone shouted.', '["excite","excited","exciting","excites"]'::jsonb, 'exciting', '경기가 흥분을 ''일으킴'' → exciting', 2, 'MY Grammar 샘플'),
  ('G3-05', 'blank', 'I was ___ (surprise) at the news.', null::jsonb, 'surprised', '내가 놀람을 ''느낌'' → surprised', 2, 'MY Grammar 샘플'),
  ('G3-05', 'error', 'There is a [car] [parking] [in front of] [my house].', null::jsonb, 'parking', '차는 ''주차된'' 것 → parked', 3, 'MY Grammar 샘플'),
  ('G3-05', 'order', '나는 영어로 쓰인 책을 읽었다.', null::jsonb, 'I read a book written in English.', '과거분사구가 명사 뒤에서 수식', 3, 'MY Grammar 샘플'),
  ('G3-05', 'ox', '"I''m boring." 은 ''나는 지루함을 느낀다''라는 뜻이다.', null::jsonb, 'X', '지루함을 느낀다 → I''m bored. (I''m boring = 나는 지루한 사람이다)', 2, 'MY Grammar 샘플')
) as v(topic_code, qtype, prompt, choices, answer, explanation, difficulty, source)
where not exists (select 1 from public.mg_questions);
