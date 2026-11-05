/* MY Grammar 샘플 단원·문제
   - 데모 모드에서 사용하고, supabase/02_sample_data.sql 도 이 파일에서 만들어요.
   - 문제 종류(qtype): mc 객관식 · ox 참/거짓 · blank 빈칸 · order 단어 배열 · error 틀린 곳 찾기
   - blank 정답이 여러 개면 | 로 구분 (예: "is not|isn't")
   - error 문제는 [대괄호] 로 고를 부분을 표시하고, 정답은 틀린 부분 */
window.MG_SAMPLE = {
  // 단원은 js/curriculum.js 의 단원표에서 만들어요.
  topics: (window.MG_CURRICULUM || []).map(function (r, i) {
    var m = /^(M1|M2|M3|H)-(\d+)-(\d+)$/.exec(r[0]);
    var unit = m ? parseInt(m[2], 10) : 0, sub = m ? parseInt(m[3], 10) : 0;
    return { code: r[0], grade: m ? { M1: 1, M2: 2, M3: 3, H: 4 }[m[1]] : 1, unit_no: unit, unit_title: r[1], sub_no: sub,
      category: r[1], title: r[2], title_en: r[3], summary: r[4], examples: r[5], tip: r[6], sort_order: unit * 10 + sub };
  }),
  questions: [
    // G1-01 be동사
    { t: "M1-01-1", y: "mc", p: "My sister and I ___ in the same class.", c: ["am", "is", "are", "be"], a: "are", e: "주어 My sister and I 는 '우리(복수)' → are", d: 1 },
    { t: "M1-01-1", y: "blank", p: "He ___ a famous singer. (be동사 현재형)", a: "is", e: "He(3인칭 단수) → is", d: 1 },
    { t: "M1-01-1", y: "ox", p: "\"The books on the desk is mine.\" 는 올바른 문장이다.", a: "X", e: "주어의 핵심은 The books(복수) → are 가 맞아요.", d: 2 },
    { t: "M1-01-1", y: "error", p: "[Tom and Jerry] [is] [my] [favorite] cartoon characters.", a: "is", e: "Tom and Jerry 는 복수 → are", d: 2 },
    { t: "M1-01-2", y: "order", p: "그녀는 지금 집에 없다.", a: "She is not at home now.", e: "부정문: be동사 + not", d: 1 },
    { t: "M1-01-2", y: "mc", p: "다음 대화의 빈칸에 알맞은 것은?\nA: ___ you a new student?\nB: Yes, I am.", c: ["Do", "Is", "Are", "Am"], a: "Are", e: "be동사 의문문: Are you ~? 대답 Yes, I am.", d: 1 },
    // G1-02 일반동사 현재
    { t: "M1-02-1", y: "mc", p: "My brother ___ his homework after dinner.", c: ["do", "does", "doing", "to do"], a: "does", e: "3인칭 단수 주어 → does", d: 1 },
    { t: "M1-02-1", y: "blank", p: "She ___ (study) English every morning.", a: "studies", e: "자음 + y → -ies : studies", d: 2 },
    { t: "M1-02-3", y: "error", p: "My cat [doesn't] [likes] [to take] [a bath].", a: "likes", e: "doesn't 뒤에는 동사원형 like", d: 2 },
    { t: "M1-02-3", y: "ox", p: "\"Does he has a bike?\" 는 올바른 문장이다.", a: "X", e: "Does 뒤에는 동사원형 have → Does he have a bike?", d: 2 },
    { t: "M1-02-1", y: "order", p: "그는 주말마다 축구를 한다.", a: "He plays soccer every weekend.", e: "3인칭 단수 → plays", d: 1 },
    { t: "M1-02-1", y: "mc", p: "밑줄 친 동사의 형태가 잘못된 것은?", c: ["She watches TV.", "He gos to school.", "It flies high.", "Mina has a dog."], a: "He gos to school.", e: "go → goes (-o로 끝나면 -es)", d: 2 },
    // G1-03 현재진행형
    { t: "M1-05-3", y: "mc", p: "Look! The children ___ in the park.", c: ["run", "runs", "are running", "is running"], a: "are running", e: "Look! → 지금 진행 중, children(복수) → are running", d: 1 },
    { t: "M1-05-3", y: "blank", p: "I am ___ (write) a letter to my friend.", a: "writing", e: "e로 끝나면 e를 빼고 -ing : writing", d: 2 },
    { t: "M1-05-3", y: "error", p: "She [is] [siting] [on the bench] [now].", a: "siting", e: "sit → sitting (단모음+단자음 → 자음 하나 더)", d: 2 },
    { t: "M1-05-3", y: "ox", p: "\"I am knowing the answer.\" 는 올바른 문장이다.", a: "X", e: "know 는 상태 동사라 진행형으로 쓰지 않아요 → I know the answer.", d: 3 },
    { t: "M1-05-3", y: "order", p: "너는 지금 무엇을 하고 있니?", a: "What are you doing now?", e: "의문사 + be동사 + 주어 + -ing", d: 2 },
    // G1-04 과거시제
    { t: "M1-02-2", y: "mc", p: "We ___ to the museum last Friday.", c: ["go", "goes", "went", "going"], a: "went", e: "last Friday → 과거, go-went", d: 1 },
    { t: "M1-01-1", y: "blank", p: "They ___ at home yesterday. (be동사)", a: "were", e: "They + 과거 → were", d: 1 },
    { t: "M1-02-3", y: "error", p: "[Did] you [watched] the soccer game [last night]?", a: "watched", e: "Did 뒤에는 동사원형 watch", d: 2 },
    { t: "M1-02-2", y: "ox", p: "stop 의 과거형은 stoped 이다.", a: "X", e: "단모음+단자음 → 자음 하나 더 : stopped", d: 2 },
    { t: "M1-02-3", y: "order", p: "나는 어제 아침을 먹지 않았다.", a: "I didn't eat breakfast yesterday.", e: "didn't + 동사원형", d: 2 },
    { t: "M1-02-2", y: "mc", p: "동사의 과거형이 잘못 짝지어진 것은?", c: ["buy - bought", "see - saw", "make - maked", "eat - ate"], a: "make - maked", e: "make 의 과거형은 made", d: 2 },
    // G1-05 미래
    { t: "M1-05-2", y: "mc", p: "It ___ sunny tomorrow.", c: ["is", "was", "will be", "will is"], a: "will be", e: "tomorrow → 미래, will + 동사원형 be", d: 1 },
    { t: "M1-05-2", y: "blank", p: "I am going ___ visit my uncle this Sunday.", a: "to", e: "be going to + 동사원형", d: 1 },
    { t: "M1-05-2", y: "error", p: "She [will] [goes] [shopping] [tomorrow].", a: "goes", e: "will 뒤에는 동사원형 go", d: 2 },
    { t: "M1-05-2", y: "order", p: "우리는 다음 주에 소풍을 갈 예정이다.", a: "We are going to go on a picnic next week.", e: "be going to + 동사원형", d: 3 },
    { t: "M1-05-2", y: "ox", p: "\"Will you help me?\" 는 올바른 문장이다.", a: "O", e: "Will + 주어 + 동사원형 ~? 의문문", d: 1 },
    // G1-06 조동사
    { t: "M1-06-2", y: "mc", p: "You ___ run in the hallway. It's dangerous.", c: ["must not", "don't have to", "can", "should"], a: "must not", e: "위험하니까 '~하면 안 된다' → must not", d: 2 },
    { t: "M1-06-2", y: "mc", p: "Tomorrow is Sunday. You ___ get up early.", c: ["must", "don't have to", "must not", "can't"], a: "don't have to", e: "일요일이니까 '~할 필요 없다' → don't have to", d: 2 },
    { t: "M1-06-1", y: "blank", p: "She can swim. = She is ___ to swim.", a: "able", e: "can = be able to", d: 2 },
    { t: "M1-06-1", y: "error", p: "He [can] [plays] the guitar [very well].", a: "plays", e: "조동사 뒤에는 동사원형 play", d: 1 },
    { t: "M1-06-2", y: "order", p: "너는 의사에게 가 보는 게 좋겠어.", a: "You should see a doctor.", e: "should: 충고", d: 1 },
    // G1-07 비교
    { t: "M1-10-3", y: "mc", p: "Seoul is ___ than my hometown.", c: ["big", "bigger", "biggest", "more big"], a: "bigger", e: "than → 비교급, big → bigger", d: 1 },
    { t: "M1-10-3", y: "blank", p: "This is the ___ (good) pizza in town.", a: "best", e: "good - better - best", d: 2 },
    { t: "M1-10-3", y: "error", p: "This puzzle is [very] [easier] [than] [that one].", a: "very", e: "비교급 강조는 much, even, far, a lot (very ✗)", d: 3 },
    { t: "M1-10-3", y: "ox", p: "\"She is the most beautiful girl in our class.\" 는 올바른 문장이다.", a: "O", e: "긴 형용사 최상급 → the most beautiful", d: 1 },
    { t: "M1-10-3", y: "order", p: "나의 형은 아빠만큼 키가 크다.", a: "My brother is as tall as my dad.", e: "as + 원급 + as: ~만큼 ...한", d: 2 },
    { t: "M1-10-3", y: "mc", p: "어법상 바른 문장은?", c: ["He is more taller than me.", "This is the most famous place.", "She is gooder than him.", "It's the bigest box."], a: "This is the most famous place.", e: "more taller ✗ / gooder ✗ (better) / bigest ✗ (biggest)", d: 2 },
    // G2-01 to부정사
    { t: "M1-09-1", y: "mc", p: "I want ___ a famous scientist.", c: ["be", "to be", "being", "been"], a: "to be", e: "want + to부정사", d: 1 },
    { t: "M1-09-2", y: "mc", p: "밑줄 친 to부정사의 용법이 나머지와 다른 것은?", c: ["I hope to see you.", "She decided to leave.", "I have no time to rest.", "He likes to cook."], a: "I have no time to rest.", e: "time to rest 는 '쉴 시간' (형용사적 용법), 나머지는 '~하는 것' (명사적 용법)", d: 3 },
    { t: "M2-05-1", y: "blank", p: "It is hard ___ learn a new language.", a: "to", e: "가주어 It ~ 진주어 to부정사", d: 1 },
    { t: "M1-09-2", y: "error", p: "She [went] to the library [to] [borrowing] [some books].", a: "borrowing", e: "목적(~하기 위해)의 to + 동사원형 borrow", d: 2 },
    { t: "M1-09-2", y: "order", p: "나는 마실 것이 필요하다.", a: "I need something to drink.", e: "something + to부정사 (형용사적 용법)", d: 2 },
    { t: "M1-09-2", y: "ox", p: "\"I was happy to hear the news.\" 에서 to hear 는 감정의 원인(~해서)을 나타낸다.", a: "O", e: "감정 형용사 + to부정사: ~해서 (부사적 용법)", d: 2 },
    // G2-02 동명사
    { t: "M2-06-2", y: "mc", p: "Do you mind ___ the window?", c: ["open", "to open", "opening", "opened"], a: "opening", e: "mind + 동명사", d: 2 },
    { t: "M1-09-3", y: "blank", p: "Thank you for ___ (invite) me.", a: "inviting", e: "전치사 for 뒤 → 동명사", d: 2 },
    { t: "M2-06-2", y: "error", p: "My dad [gave up] [to smoke] [last year] [for his health].", a: "to smoke", e: "give up + 동명사 → smoking", d: 2 },
    { t: "M1-09-3", y: "ox", p: "\"Reading books are my hobby.\" 는 올바른 문장이다.", a: "X", e: "동명사 주어는 단수 취급 → is", d: 3 },
    { t: "M1-09-3", y: "order", p: "그녀는 그림 그리는 것을 잘한다.", a: "She is good at drawing pictures.", e: "be good at + 동명사", d: 2 },
    { t: "M2-06-2", y: "mc", p: "빈칸에 들어갈 수 없는 동사는?\nI ___ playing the piano.", c: ["enjoy", "finished", "want", "kept"], a: "want", e: "want 는 to부정사를 목적어로 써요.", d: 3 },
    // G2-03 수동태
    { t: "M2-04-1", y: "mc", p: "This song ___ by BTS.", c: ["sang", "was sung", "was sang", "is singing"], a: "was sung", e: "노래가 '불려진' 것 → be + p.p., sing-sang-sung", d: 2 },
    { t: "M2-04-1", y: "blank", p: "The window was ___ (break) by the ball.", a: "broken", e: "break - broke - broken", d: 2 },
    { t: "M2-04-1", y: "error", p: "[The Mona Lisa] [painted] [by] [Leonardo da Vinci].", a: "painted", e: "그림이 '그려진' 것 → was painted", d: 2 },
    { t: "M2-04-1", y: "ox", p: "\"Korean is spoken in Korea.\" 는 올바른 수동태 문장이다.", a: "O", e: "be + p.p.(spoken)", d: 1 },
    { t: "M2-04-1", y: "order", p: "이 집은 100년 전에 지어졌다.", a: "This house was built 100 years ago.", e: "과거 수동태: was + p.p.", d: 2 },
    { t: "M2-04-1", y: "mc", p: "능동태 \"Jane wrote the letter.\" 를 수동태로 바르게 바꾼 것은?", c: ["The letter wrote by Jane.", "The letter was written by Jane.", "The letter is written by Jane.", "Jane was written the letter."], a: "The letter was written by Jane.", e: "과거 → was + written", d: 2 },
    // G2-04 현재완료
    { t: "M2-02-2", y: "mc", p: "I ___ in this town since 2018.", c: ["live", "lived", "have lived", "am living"], a: "have lived", e: "since(~부터 지금까지) → 현재완료 계속", d: 2 },
    { t: "M2-02-2", y: "blank", p: "She has lived in Busan ___ five years.", a: "for", e: "for + 기간", d: 1 },
    { t: "M2-02-2", y: "error", p: "I [have seen] [the movie] [with my friends] [yesterday].", a: "have seen", e: "yesterday(분명한 과거)와 현재완료는 함께 못 써요 → saw", d: 3 },
    { t: "M2-02-2", y: "ox", p: "\"Have you ever been to London?\" 는 경험을 묻는 문장이다.", a: "O", e: "ever + 현재완료 → 경험", d: 1 },
    { t: "M2-02-2", y: "order", p: "나는 막 숙제를 끝냈다.", a: "I have just finished my homework.", e: "have + just + p.p. (완료)", d: 2 },
    { t: "M2-02-2", y: "mc", p: "\"He has gone to Paris.\" 의 의미로 알맞은 것은?", c: ["그는 파리에 가 본 적이 있다.", "그는 파리에 가 버렸다(지금 여기 없다).", "그는 파리에 갈 것이다.", "그는 파리에서 돌아왔다."], a: "그는 파리에 가 버렸다(지금 여기 없다).", e: "have gone to: 가 버렸다(결과) / have been to: 가 본 적 있다(경험)", d: 3 },
    // G2-05 접속사
    { t: "M1-12-3", y: "mc", p: "I stayed home ___ I was sick.", c: ["because", "because of", "if", "but"], a: "because", e: "뒤에 주어+동사 → because", d: 1 },
    { t: "M1-12-3", y: "mc", p: "If it ___ tomorrow, we will cancel the game.", c: ["rain", "rains", "will rain", "rained"], a: "rains", e: "조건 부사절에서는 미래 대신 현재시제", d: 2 },
    { t: "M1-12-3", y: "blank", p: "I think ___ he is honest. (~라는 것)", a: "that", e: "명사절 접속사 that", d: 1 },
    { t: "M1-12-2", y: "error", p: "[When] [I] [will arrive] there, I'll call you.", a: "will arrive", e: "시간 부사절 → 현재시제 arrive", d: 3 },
    { t: "M1-12-2", y: "order", p: "내가 어렸을 때, 나는 부산에 살았다.", a: "When I was young, I lived in Busan.", e: "When + 주어 + 동사, 주절", d: 2 },
    { t: "M1-12-3", y: "ox", p: "\"We didn't go out because of the rain.\" 는 올바른 문장이다.", a: "O", e: "because of + 명사(the rain)", d: 2 },
    // G2-06 4·5형식
    { t: "M2-01-1", y: "mc", p: "Mom made ___ a cake.", c: ["I", "my", "me", "mine"], a: "me", e: "4형식 간접목적어 → 목적격 me", d: 1 },
    { t: "M2-01-1", y: "blank", p: "He bought a new bag ___ his sister.", a: "for", e: "buy 는 3형식 전환 시 for", d: 2 },
    { t: "M3-01-3", y: "error", p: "The good news [made] [us] [very] [happily].", a: "happily", e: "5형식 목적격보어 → 형용사 happy", d: 2 },
    { t: "M3-01-3", y: "mc", p: "The teacher told us ___ quiet.", c: ["be", "to be", "being", "are"], a: "to be", e: "tell + 목적어 + to부정사", d: 2 },
    { t: "M2-01-1", y: "order", p: "그는 나에게 그의 사진들을 보여 주었다.", a: "He showed me his pictures.", e: "4형식: 동사 + ~에게 + ~을", d: 2 },
    { t: "M2-01-1", y: "ox", p: "\"She gave a flower for me.\" 는 올바른 문장이다.", a: "X", e: "give 는 3형식 전환 시 to → She gave a flower to me.", d: 2 },
    // G3-01 관계대명사
    { t: "M2-11-1", y: "mc", p: "I have a friend ___ can speak French.", c: ["who", "which", "whose", "what"], a: "who", e: "선행사 a friend(사람) + 주격 → who", d: 1 },
    { t: "M2-11-1", y: "mc", p: "This is the cat ___ tail is very long.", c: ["who", "which", "whose", "that"], a: "whose", e: "'그것의 꼬리' → 소유격 whose", d: 2 },
    { t: "M2-11-1", y: "blank", p: "The bike ___ I bought last week is red. (사물, 목적격)", a: "which|that", e: "사물 선행사 목적격 → which 또는 that", d: 2 },
    { t: "M2-11-1", y: "error", p: "I know [a boy] [who] [play] [the drums] well.", a: "play", e: "선행사 a boy(단수)에 수 일치 → plays", d: 3 },
    { t: "M2-11-1", y: "order", p: "그녀는 내가 가장 좋아하는 가수이다.", a: "She is the singer that I like most.", e: "목적격 관계대명사 that (생략 가능)", d: 3 },
    { t: "M2-11-1", y: "ox", p: "\"The man who I met yesterday was kind.\" 에서 who 는 생략할 수 있다.", a: "O", e: "목적격 관계대명사는 생략 가능", d: 2 },
    // G3-02 what
    { t: "M2-11-2", y: "mc", p: "___ I want for my birthday is a new phone.", c: ["That", "Which", "What", "Who"], a: "What", e: "선행사 없음 + '~하는 것' → What", d: 2 },
    { t: "M2-11-2", y: "mc", p: "This is the bag ___ I lost.", c: ["what", "which", "who", "whose"], a: "which", e: "선행사 the bag 이 있으므로 what ✗ → which", d: 2 },
    { t: "M2-11-2", y: "blank", p: "Tell me ___ you saw. (네가 본 것)", a: "what", e: "what = the thing which", d: 2 },
    { t: "M2-11-2", y: "error", p: "[The thing] [what] [he] [said] was not true.", a: "what", e: "선행사 The thing 이 있으므로 which/that", d: 3 },
    { t: "M2-11-2", y: "order", p: "그것은 내가 필요한 것이 아니다.", a: "That is not what I need.", e: "what + 주어 + 동사: ~하는 것", d: 2 },
    // G3-03 가정법
    { t: "M2-12-1", y: "mc", p: "If I ___ a bird, I would fly to you.", c: ["am", "was", "were", "will be"], a: "were", e: "가정법 과거: be동사 → were", d: 2 },
    { t: "M2-12-1", y: "blank", p: "If I had a lot of money, I ___ buy a big house. (~할 텐데)", a: "would|could", e: "가정법 과거 주절: would/could + 동사원형", d: 2 },
    { t: "M2-12-1", y: "error", p: "If I [knew] her number, I [will] [call] [her].", a: "will", e: "가정법 과거 → would call", d: 2 },
    { t: "M2-12-1", y: "ox", p: "\"If I were taller, I could play basketball better.\" 는 지금 키가 크다는 뜻이다.", a: "X", e: "가정법 과거는 현재 사실의 반대 → 실제로는 키가 크지 않다", d: 2 },
    { t: "M2-12-1", y: "order", p: "내가 너라면, 나는 그 일을 하지 않을 텐데.", a: "If I were you, I wouldn't do that.", e: "If + 주어 + were, 주어 + would not + 동사원형", d: 3 },
    { t: "M2-12-2", y: "mc", p: "\"I wish I could swim.\" 의 의미로 알맞은 것은?", c: ["나는 수영을 할 수 있다.", "나는 수영을 할 수 있으면 좋겠다.", "나는 수영을 했다.", "나는 수영을 할 것이다."], a: "나는 수영을 할 수 있으면 좋겠다.", e: "I wish + 과거: 현재 이루기 어려운 소망", d: 1 },
    // G3-04 간접의문문
    { t: "M3-08-3", y: "mc", p: "Do you know where ___?", c: ["does she live", "she lives", "lives she", "she does live"], a: "she lives", e: "간접의문문: 의문사 + 주어 + 동사", d: 2 },
    { t: "M3-08-3", y: "blank", p: "I wonder ___ he will come to the party. (~인지 아닌지)", a: "if|whether", e: "의문사가 없을 때 if/whether", d: 2 },
    { t: "M3-08-3", y: "error", p: "Can you [tell] [me] [what time] [is it]?", a: "is it", e: "간접의문문 → what time it is", d: 2 },
    { t: "M3-08-3", y: "order", p: "그가 왜 늦었는지 나는 모른다.", a: "I don't know why he was late.", e: "의문사 + 주어 + 동사", d: 2 },
    { t: "M3-08-3", y: "ox", p: "\"What do you think she wants?\" 는 올바른 문장이다.", a: "O", e: "think 가 있으면 의문사를 문장 맨 앞으로!", d: 3 },
    // G3-05 분사
    { t: "M2-07-1", y: "mc", p: "Look at the ___ baby. (자고 있는)", c: ["sleep", "sleeping", "slept", "sleeps"], a: "sleeping", e: "능동·진행 → 현재분사", d: 1 },
    { t: "M2-07-1", y: "mc", p: "The game was so ___ that everyone shouted.", c: ["excite", "excited", "exciting", "excites"], a: "exciting", e: "경기가 흥분을 '일으킴' → exciting", d: 2 },
    { t: "M2-07-1", y: "blank", p: "I was ___ (surprise) at the news.", a: "surprised", e: "내가 놀람을 '느낌' → surprised", d: 2 },
    { t: "M2-07-1", y: "error", p: "There is a [car] [parking] [in front of] [my house].", a: "parking", e: "차는 '주차된' 것 → parked", d: 3 },
    { t: "M2-07-1", y: "order", p: "나는 영어로 쓰인 책을 읽었다.", a: "I read a book written in English.", e: "과거분사구가 명사 뒤에서 수식", d: 3 },
    { t: "M2-07-1", y: "ox", p: "\"I'm boring.\" 은 '나는 지루함을 느낀다'라는 뜻이다.", a: "X", e: "지루함을 느낀다 → I'm bored. (I'm boring = 나는 지루한 사람이다)", d: 2 }
    ,
    // 새 단원표에 맞춰 추가한 샘플 문제
    { t: "M1-01-2", y: "mc", p: "다음 대화의 빈칸에 알맞은 것은?\nA: Was he at school yesterday?\nB: No, he ___.", c: ["isn't", "wasn't", "weren't", "didn't"], a: "wasn't", e: "Was he ~? 의 부정 대답 → No, he wasn't.", d: 1 },
    { t: "M1-06-1", y: "ox", p: "\"May I use your phone?\" 의 may 는 '허락'을 구하는 뜻이다.", a: "O", e: "May I ~? = ~해도 될까요? (허락)", d: 1 },
    { t: "M1-09-1", y: "blank", p: "My dream is ___ travel around the world.", a: "to", e: "보어 자리의 to부정사: ~하는 것", d: 1 },
    { t: "M1-09-1", y: "error", p: "She [decided] [to] [learns] [Chinese].", a: "learns", e: "to 뒤에는 동사원형 learn", d: 2 },
    { t: "M1-12-2", y: "mc", p: "Wash your hands ___ you eat.", c: ["before", "but", "so", "or"], a: "before", e: "먹기 '전에' → before", d: 1 },
    { t: "M2-05-1", y: "mc", p: "___ is fun to play board games with friends.", c: ["This", "That", "It", "What"], a: "It", e: "가주어 It ~ 진주어 to부정사", d: 2 },
    { t: "M2-05-1", y: "order", p: "매일 운동하는 것은 중요하다.", a: "It is important to exercise every day.", e: "It(가주어) + is + 형용사 + to부정사(진주어)", d: 2 },
    { t: "M2-12-2", y: "blank", p: "I wish I ___ (have) a little sister.", a: "had", e: "I wish + 가정법 과거 → had", d: 2 },
    { t: "M2-12-2", y: "error", p: "He talks [as if] he [knows] [everything] [about it].", a: "knows", e: "as if + 가정법 과거 → knew", d: 3 },
    { t: "M3-01-3", y: "mc", p: "I had my bike ___ yesterday.", c: ["repair", "repairing", "repaired", "to repair"], a: "repaired", e: "자전거는 '수리되는' 것 → 목적격 보어 p.p.", d: 3 },
    { t: "H-11-1", y: "mc", p: "It was ___ a hot day that we stayed inside.", c: ["so", "such", "very", "too"], a: "such", e: "a + 형용사 + 명사 앞 → such", d: 2 },
    { t: "H-11-1", y: "error", p: "The movie was [such] [boring] [that] I [fell asleep].", a: "such", e: "명사 없이 형용사만 → so boring", d: 2 },
    { t: "H-11-1", y: "ox", p: "\"She is so kind a person.\" 은 어법상 올바르다.", a: "O", e: "so + 형용사 + a + 명사 = such a + 형용사 + 명사", d: 3 },
    { t: "H-09-2", y: "mc", p: "___ the heavy rain, the game continued.", c: ["Although", "Despite", "Because", "Though"], a: "Despite", e: "뒤에 명사구(the heavy rain) → 전치사 Despite", d: 2 },
    { t: "H-09-2", y: "error", p: "[Despite of] the cold weather, we [went] [swimming] [in the sea].", a: "Despite of", e: "despite 뒤에는 of 를 쓰지 않아요 → Despite", d: 2 },
    { t: "H-09-2", y: "blank", p: "___ it was cold, we went swimming. (비록 ~이지만, A로 시작)", a: "although", e: "뒤에 주어 + 동사 → 접속사 Although", d: 2 }
  ]
};
