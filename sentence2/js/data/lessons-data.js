window.SMS = window.SMS || {};

(function () {
  window.SMS.BUILTIN_LESSONS = [
    {
      id: 'g1-l1',
      grade: '중1',
      title: 'Lesson 1. All about Me',
      grammarPoints: ['be동사의 현재형 (am / is / are)', '일반동사의 현재형 (3인칭 단수 -s, don’t / doesn’t)'],
      sentences: [
        // ===== 1. 문법 (Language Use) =====
        {
          id: 'g1-l1-g1',
          category: 'grammar',
          en: 'I am an active person.',
          ko: '나는 활동적인 사람이야.',
          chunks: ['I am', 'an active person.'],
          target: 'am',
          distractors: ['is', 'are'],
          grammarTip: '주어가 I(1인칭 단수)일 때 be동사 현재형은 am을 써요.',
          errorVersion: { wrong: 'are', right: 'am' }
        },
        {
          id: 'g1-l1-g2',
          category: 'grammar',
          en: 'These pictures are my fashion diary.',
          ko: '이 사진들은 나의 패션 일기장이야.',
          chunks: ['These pictures', 'are', 'my fashion diary.'],
          target: 'are',
          distractors: ['is', 'am'],
          grammarTip: '주어 These pictures가 복수이므로 be동사는 are를 써요.',
          errorVersion: { wrong: 'is', right: 'are' }
        },
        {
          id: 'g1-l1-g3',
          category: 'grammar',
          en: 'Donuts are not just a snack for me.',
          ko: '도넛은 나에게 단순한 간식이 아니야.',
          chunks: ['Donuts', 'are not', 'just a snack', 'for me.'],
          target: 'are not',
          distractors: ['is not', 'do not'],
          grammarTip: 'be동사의 부정문은 be동사 뒤에 not을 붙여요. 복수 주어 Donuts 뒤에는 are not!',
          errorVersion: { wrong: 'is not', right: 'are not' }
        },
        {
          id: 'g1-l1-g4',
          category: 'grammar',
          en: 'Is Daniel in the library now?',
          ko: 'Daniel은 지금 도서관에 있니?',
          chunks: ['Is Daniel', 'in the library', 'now?'],
          target: 'Is',
          distractors: ['Are', 'Does'],
          grammarTip: 'be동사의 의문문은 「be동사 + 주어 ~?」 순서예요. 3인칭 단수 Daniel 앞에는 Is를 써요.',
          errorVersion: { wrong: 'Are', right: 'Is' }
        },
        {
          id: 'g1-l1-g5',
          category: 'grammar',
          en: 'It records my speed, time, and steps.',
          ko: '그것은 나의 속도, 시간, 걸음 수를 기록해.',
          chunks: ['It records', 'my speed, time,', 'and steps.'],
          target: 'records',
          distractors: ['record', 'recording'],
          grammarTip: '주어 It이 3인칭 단수이고 현재 시제이므로 일반동사 끝에 -s를 붙여 records가 돼요.',
          errorVersion: { wrong: 'record', right: 'records' }
        },
        {
          id: 'g1-l1-g6',
          category: 'grammar',
          en: "She doesn't clean her room.",
          ko: '그녀는 자기 방을 청소하지 않아.',
          chunks: ['She', "doesn't clean", 'her room.'],
          target: "doesn't",
          distractors: ["don't", "isn't"],
          grammarTip: "주어 She가 3인칭 단수일 때 일반동사 부정문은 doesn't + 동사원형을 써요.",
          errorVersion: { wrong: "don't", right: "doesn't" }
        },
        {
          id: 'g1-l1-g7',
          category: 'grammar',
          en: 'Do you have any brothers or sisters?',
          ko: '너는 형제나 자매가 있니?',
          chunks: ['Do you have', 'any brothers', 'or sisters?'],
          target: 'Do',
          distractors: ['Does', 'Are'],
          grammarTip: '주어가 you인 일반동사 의문문은 문장 맨 앞에 Do를 쓰고 동사원형(have)을 써요.',
          errorVersion: { wrong: 'Does', right: 'Do' }
        },
        {
          id: 'g1-l1-g8',
          category: 'grammar',
          en: 'Junho likes rainbows.',
          ko: '준호는 무지개를 좋아해.',
          chunks: ['Junho', 'likes', 'rainbows.'],
          target: 'likes',
          distractors: ['like', 'is like'],
          grammarTip: '주어 Junho가 3인칭 단수이므로 동사 like에 -s를 붙여 likes로 써요.',
          errorVersion: { wrong: 'like', right: 'likes' }
        },

        // ===== 2. 읽기 본문 (Reading: My Lifelogging) =====
        {
          id: 'g1-l1-r1',
          category: 'reading',
          en: 'I often run in the park, and I enjoy the fresh air there.',
          ko: '나는 종종 공원에서 달리면서 그곳에서 신선한 공기를 즐겨.',
          chunks: ['I often run', 'in the park,', 'and I enjoy', 'the fresh air there.'],
          target: 'enjoy',
          distractors: ['enjoys', 'enjoying'],
          grammarTip: '주어 I 뒤의 일반동사는 원형(run, enjoy)을 그대로 써요.',
          errorVersion: { wrong: 'enjoys', right: 'enjoy' }
        },
        {
          id: 'g1-l1-r2',
          category: 'reading',
          en: 'I use a running app. It is very helpful.',
          ko: '나는 달리기 앱을 사용해. 그것은 굉장히 유용해.',
          chunks: ['I use', 'a running app.', 'It is', 'very helpful.'],
          target: 'is',
          distractors: ['are', 'am'],
          grammarTip: '단수 주어 It 뒤에는 be동사 is가 와요.',
          errorVersion: { wrong: 'are', right: 'is' }
        },
        {
          id: 'g1-l1-r3',
          category: 'reading',
          en: "I'm very interested in fashion.",
          ko: '나는 패션에 관심이 아주 많아.',
          chunks: ["I'm very", 'interested in', 'fashion.'],
          target: 'interested in',
          distractors: ['interesting in', 'interested on'],
          grammarTip: '「be interested in ~」은 "~에 관심이 있다"라는 핵심 수거예요.',
          errorVersion: { wrong: 'interesting', right: 'interested' }
        },
        {
          id: 'g1-l1-r4',
          category: 'reading',
          en: 'I take pictures of my clothes. Then, I post them on social media.',
          ko: '나는 내 옷을 사진 찍어. 그다음에 나는 그것들을 소셜 미디어에 게시해.',
          chunks: ['I take pictures', 'of my clothes.', 'Then, I post them', 'on social media.'],
          target: 'post',
          distractors: ['posts', 'posting'],
          grammarTip: '주어 I 뒤에는 동사원형(take, post)을 쓰고, 대명사 them은 복수(pictures)를 받아요.',
          errorVersion: { wrong: 'posts', right: 'post' }
        },
        {
          id: 'g1-l1-r5',
          category: 'reading',
          en: 'I have many followers. They leave nice comments, too.',
          ko: '나는 팔로워가 많아. 그들은 멋진 댓글을 달아주기도 해.',
          chunks: ['I have', 'many followers.', 'They leave', 'nice comments, too.'],
          target: 'leave',
          distractors: ['leaves', 'leaving'],
          grammarTip: '복수 주어 They 뒤에는 일반동사 원형 leave를 써요.',
          errorVersion: { wrong: 'leaves', right: 'leave' }
        },
        {
          id: 'g1-l1-r6',
          category: 'reading',
          en: "I'm into donuts these days.",
          ko: '나는 요즘 도넛을 아주 좋아해.',
          chunks: ["I'm into", 'donuts', 'these days.'],
          target: 'into',
          distractors: ['onto', 'under'],
          grammarTip: '「be into ~」는 "~에 푹 빠져 있다, ~을 아주 좋아하다"라는 표현이에요.',
          errorVersion: { wrong: 'onto', right: 'into' }
        },
        {
          id: 'g1-l1-r7',
          category: 'reading',
          en: 'I mark good shops on my map app.',
          ko: '나는 내 지도 앱에 괜찮은 가게들을 표시해.',
          chunks: ['I mark', 'good shops', 'on my map app.'],
          target: 'mark',
          distractors: ['marks', 'am mark'],
          grammarTip: '일반동사 mark 앞에 불필요한 be동사를 쓰지 않고 주어 I 뒤에 동사원형 mark를 써요.',
          errorVersion: { wrong: 'marks', right: 'mark' }
        },

        // ===== 3. In Context 대화 (Language Use C) =====
        {
          id: 'g1-l1-c1',
          category: 'incontext',
          speaker: 'Arin',
          en: 'Max, Siwoo! How are you?',
          ko: 'Max, Siwoo! 잘 지내니?',
          chunks: ['Max, Siwoo!', 'How are', 'you?'],
          target: 'are',
          distractors: ['is', 'am'],
          grammarTip: '주어가 you일 때 be동사는 are를 써요.',
          errorVersion: { wrong: 'is', right: 'are' }
        },
        {
          id: 'g1-l1-c2',
          category: 'incontext',
          speaker: 'Siwoo',
          en: 'I am great.',
          ko: '나는 아주 좋아.',
          chunks: ['I am', 'great.'],
          target: 'am',
          distractors: ['is', 'are'],
          grammarTip: '주어 I와 짝을 이루는 be동사 현재형은 am이에요.',
          errorVersion: { wrong: 'is', right: 'am' }
        },
        {
          id: 'g1-l1-c3',
          category: 'incontext',
          speaker: 'Arin',
          en: 'Siwoo, Max! This is my friend, Linda.',
          ko: 'Siwoo, Max! 이쪽은 내 친구 Linda야.',
          chunks: ['Siwoo, Max!', 'This is', 'my friend, Linda.'],
          target: 'is',
          distractors: ['are', 'am'],
          grammarTip: '단수 주어 This 뒤에는 be동사 is를 써요.',
          errorVersion: { wrong: 'are', right: 'is' }
        },
        {
          id: 'g1-l1-c4',
          category: 'incontext',
          speaker: 'Max',
          en: 'Everything is new!',
          ko: '모든 것이 새로워!',
          chunks: ['Everything', 'is', 'new!'],
          target: 'is',
          distractors: ['are', 'were'],
          grammarTip: 'Everything(모든 것)은 단수 취급하므로 be동사 is를 써요.',
          errorVersion: { wrong: 'are', right: 'is' }
        },
        {
          id: 'g1-l1-c5',
          category: 'incontext',
          speaker: 'Linda',
          en: 'We wear school uniforms.',
          ko: '우리는 교복을 입어.',
          chunks: ['We wear', 'school uniforms.'],
          target: 'wear',
          distractors: ['wears', 'wearing'],
          grammarTip: '복수 주어 We 뒤에는 일반동사 원형 wear를 써요.',
          errorVersion: { wrong: 'wears', right: 'wear' }
        },
        {
          id: 'g1-l1-c6',
          category: 'incontext',
          speaker: 'Siwoo',
          en: "We don't stay with our homeroom teacher all day.",
          ko: '우리는 하루 종일 담임 선생님과 함께 있지 않아.',
          chunks: ['We', "don't stay", 'with our homeroom teacher', 'all day.'],
          target: "don't",
          distractors: ["doesn't", "aren't"],
          grammarTip: "복수 주어 We의 일반동사 부정문은 don't + 동사원형(stay)이에요.",
          errorVersion: { wrong: "doesn't", right: "don't" }
        },
        {
          id: 'g1-l1-c7',
          category: 'incontext',
          speaker: 'Max',
          en: "That's okay. We have each other.",
          ko: '괜찮아. 우리에겐 서로가 있잖아.',
          chunks: ["That's okay.", 'We have', 'each other.'],
          target: 'have',
          distractors: ['has', 'having'],
          grammarTip: '복수 주어 We 뒤에는 has가 아니라 have를 써요.',
          errorVersion: { wrong: 'has', right: 'have' }
        }
      ]
    },

    {
      id: 'g2-l1',
      grade: '중2',
      title: 'Lesson 1. Know Me, Know You',
      grammarPoints: ['최상급 (the + -est / the most ~)', 'to부정사의 형용사적 용법 (명사 + to 동사원형)'],
      sentences: [
        // ===== 1. 문법 (Language Use) =====
        {
          id: 'g2-l1-g1',
          category: 'grammar',
          en: 'They are the happiest animals in the woods.',
          ko: '그들은 숲에서 가장 행복한 동물들이야.',
          chunks: ['They are', 'the happiest animals', 'in the woods.'],
          target: 'the happiest',
          distractors: ['happiest', 'more happy'],
          grammarTip: '최상급 앞에는 정관사 the를 붙이고, 자음+y로 끝나는 happy는 y를 i로 바꾸고 -est를 붙여요.',
          errorVersion: { wrong: 'happiest', right: 'the happiest' }
        },
        {
          id: 'g2-l1-g2',
          category: 'grammar',
          en: 'August is the hottest month of the year.',
          ko: '8월은 일 년 중 가장 더운 달이야.',
          chunks: ['August is', 'the hottest month', 'of the year.'],
          target: 'the hottest',
          distractors: ['the hotest', 'hotter'],
          grammarTip: '단모음+단자음으로 끝나는 hot은 마지막 자음 t를 한 번 더 쓰고 -est를 붙여 the hottest가 돼요.',
          errorVersion: { wrong: 'hotter', right: 'the hottest' }
        },
        {
          id: 'g2-l1-g3',
          category: 'grammar',
          en: 'Tom runs the fastest in our school.',
          ko: 'Tom은 우리 학교에서 가장 빨리 달려.',
          chunks: ['Tom runs', 'the fastest', 'in our school.'],
          target: 'the fastest',
          distractors: ['faster', 'most fast'],
          grammarTip: '짧은 부사 fast의 최상급은 -est를 붙여 (the) fastest로 표현해요.',
          errorVersion: { wrong: 'faster', right: 'the fastest' }
        },
        {
          id: 'g2-l1-g4',
          category: 'grammar',
          en: 'There was a rope to help.',
          ko: '도움이 될 밧줄이 하나 있었어.',
          chunks: ['There was', 'a rope', 'to help.'],
          target: 'to help',
          distractors: ['helping', 'help'],
          grammarTip: '명사(a rope) 뒤에서 "~할, ~하는"으로 꾸며 줄 때는 「to + 동사원형」을 써요.',
          errorVersion: { wrong: 'help', right: 'to help' }
        },
        {
          id: 'g2-l1-g5',
          category: 'grammar',
          en: 'She found a new book to read.',
          ko: '그녀는 읽을 새 책을 찾았어.',
          chunks: ['She found', 'a new book', 'to read.'],
          target: 'to read',
          distractors: ['read', 'reading'],
          grammarTip: '앞의 명사 a new book을 수식하는 to부정사의 형용사적 용법(to read)이에요.',
          errorVersion: { wrong: 'read', right: 'to read' }
        },
        {
          id: 'g2-l1-g6',
          category: 'grammar',
          en: "I didn't have a chance to talk to Jina.",
          ko: '나는 지나와 이야기할 기회가 없었어.',
          chunks: ["I didn't have", 'a chance', 'to talk to Jina.'],
          target: 'to talk',
          distractors: ['talk', 'talked'],
          grammarTip: '명사 a chance를 꾸며 주는 형용사적 용법으로 「to + 동사원형(to talk)」을 써요.',
          errorVersion: { wrong: 'talked', right: 'to talk' }
        },
        {
          id: 'g2-l1-g7',
          category: 'grammar',
          en: 'I want some water to drink.',
          ko: '나는 마실 물이 좀 필요해.',
          chunks: ['I want', 'some water', 'to drink.'],
          target: 'to drink',
          distractors: ['drink', 'drank'],
          grammarTip: 'some water(마실 물)처럼 명사를 뒤에서 수식할 때는 to부정사(to drink)를 써요.',
          errorVersion: { wrong: 'drink', right: 'to drink' }
        },

        // ===== 2. 읽기 본문 (Reading: Different but Together) =====
        {
          id: 'g2-l1-r1',
          category: 'reading',
          en: 'Pooh loves all kinds of food, but he likes honey the best.',
          ko: 'Pooh는 모든 종류의 음식을 정말 좋아하지만, 꿀을 가장 좋아해.',
          chunks: ['Pooh loves', 'all kinds of food,', 'but he likes honey', 'the best.'],
          target: 'the best',
          distractors: ['the better', 'most good'],
          grammarTip: 'well의 불규칙 최상급은 best예요. like ~ the best는 "~을 가장 좋아하다"라는 뜻이에요.',
          errorVersion: { wrong: 'better', right: 'best' }
        },
        {
          id: 'g2-l1-r2',
          category: 'reading',
          en: 'He is always thinking of creative ways to get honey.',
          ko: '그는 항상 꿀을 얻을 창의적인 방법들에 대해 생각하고 있어.',
          chunks: ['He is always', 'thinking of', 'creative ways', 'to get honey.'],
          target: 'to get',
          distractors: ['get', 'got'],
          grammarTip: 'creative ways(창의적인 방법들)를 꾸미는 to부정사의 형용사적 용법(to get)이에요.',
          errorVersion: { wrong: 'get', right: 'to get' }
        },
        {
          id: 'g2-l1-r3',
          category: 'reading',
          en: 'The strong wind almost broke the door, so my friends had to hold it.',
          ko: '강한 바람이 문을 거의 부술 뻔해서 내 친구들이 문을 꼭 잡고 있어야 했어.',
          chunks: ['The strong wind', 'almost broke the door,', 'so my friends', 'had to hold it.'],
          target: 'had to',
          distractors: ['have to', 'has to'],
          grammarTip: '앞 절의 동사가 과거형(broke)이므로 "~해야 했다"도 have to의 과거형인 had to를 써요.',
          errorVersion: { wrong: 'have', right: 'had' }
        },
        {
          id: 'g2-l1-r4',
          category: 'reading',
          en: 'Luckily, there was a rope to help.',
          ko: '다행히도 도움이 될 밧줄이 하나 있었어.',
          chunks: ['Luckily,', 'there was', 'a rope', 'to help.'],
          target: 'to help',
          distractors: ['helping', 'helped'],
          grammarTip: 'a rope를 뒤에서 꾸며 주는 to부정사 형용사적 용법(to help)이에요.',
          errorVersion: { wrong: 'helped', right: 'to help' }
        },
        {
          id: 'g2-l1-r5',
          category: 'reading',
          en: 'He gathered his courage and tied it tightly.',
          ko: '그는 용기를 내어 문을 단단히 묶었어.',
          chunks: ['He gathered', 'his courage', 'and tied it', 'tightly.'],
          target: 'tied',
          distractors: ['tie', 'tying'],
          grammarTip: '등위접속사 and가 과거동사 gathered와 나란히 연결하므로 뒤에도 과거형 tied를 써요.',
          errorVersion: { wrong: 'tie', right: 'tied' }
        },
        {
          id: 'g2-l1-r6',
          category: 'reading',
          en: 'Owl believes he is the smartest animal in the woods.',
          ko: 'Owl은 자신이 숲에서 가장 똑똑한 동물이라고 믿어.',
          chunks: ['Owl believes', 'he is', 'the smartest animal', 'in the woods.'],
          target: 'the smartest',
          distractors: ['smartest', 'smarter'],
          grammarTip: '「the + 최상급 + in + 범위(in the woods)」 구조예요. 정관사 the를 빠뜨리지 마세요!',
          errorVersion: { wrong: 'smarter', right: 'smartest' }
        },
        {
          id: 'g2-l1-r7',
          category: 'reading',
          en: 'Owl is always ready to help.',
          ko: 'Owl은 항상 도울 준비가 되어 있어.',
          chunks: ['Owl is', 'always ready', 'to help.'],
          target: 'to help',
          distractors: ['help', 'helping'],
          grammarTip: '「be ready to + 동사원형」은 "~할 준비가 되어 있다"라는 핵심 표현이에요.',
          errorVersion: { wrong: 'helping', right: 'to help' }
        },

        // ===== 3. In Context 대화 (Language Use C) =====
        {
          id: 'g2-l1-c1',
          category: 'incontext',
          speaker: 'Suho',
          en: 'Your key rings are so cute!',
          ko: '너의 열쇠고리들 정말 귀엽다!',
          chunks: ['Your key rings', 'are', 'so cute!'],
          target: 'are',
          distractors: ['is', 'am'],
          grammarTip: '주어 Your key rings가 복수이므로 be동사 are를 써요.',
          errorVersion: { wrong: 'is', right: 'are' }
        },
        {
          id: 'g2-l1-c2',
          category: 'incontext',
          speaker: 'Kate',
          en: 'Yes! I like all characters in Mickey Mouse & Friends.',
          ko: '응! 나는 미키 마우스와 친구들의 모든 캐릭터를 좋아해.',
          chunks: ['Yes! I like', 'all characters', 'in Mickey Mouse & Friends.'],
          target: 'characters',
          distractors: ['character', 'charactering'],
          grammarTip: 'all 뒤에는 셀 수 있는 명사의 복수형(characters)이 와요.',
          errorVersion: { wrong: 'character', right: 'characters' }
        },
        {
          id: 'g2-l1-c3',
          category: 'incontext',
          speaker: 'Kate',
          en: 'I like Mickey the best.',
          ko: '나는 미키를 가장 좋아해.',
          chunks: ['I like', 'Mickey', 'the best.'],
          target: 'best',
          distractors: ['better', 'good'],
          grammarTip: '여럿 중 "가장" 좋아한다는 뜻이므로 비교급(better)이 아니라 최상급(the best)을 써요.',
          errorVersion: { wrong: 'better', right: 'best' }
        },
        {
          id: 'g2-l1-c4',
          category: 'incontext',
          speaker: 'Kate',
          en: 'He has many friends to play with.',
          ko: '그는 함께 놀 친구들이 많아.',
          chunks: ['He has', 'many friends', 'to play with.'],
          target: 'to play',
          distractors: ['play', 'played'],
          grammarTip: 'many friends를 꾸며 주는 to부정사의 형용사적 용법(to play with)이에요.',
          errorVersion: { wrong: 'play', right: 'to play' }
        },
        {
          id: 'g2-l1-c5',
          category: 'incontext',
          speaker: 'Suho',
          en: "I like Harry Potter. He's the bravest boy!",
          ko: '나는 해리 포터를 좋아해. 그는 가장 용감한 소년이야!',
          chunks: ['I like Harry Potter.', "He's", 'the bravest boy!'],
          target: 'the bravest',
          distractors: ['bravest', 'more brave'],
          grammarTip: '형용사 최상급 앞에는 반드시 정관사 the를 붙여 the bravest로 써요.',
          errorVersion: { wrong: 'bravest', right: 'the bravest' }
        },
        {
          id: 'g2-l1-c6',
          category: 'incontext',
          speaker: 'Suho',
          en: 'He also has real friends to help him.',
          ko: '그는 또한 그를 도와줄 진정한 친구들이 있어.',
          chunks: ['He also has', 'real friends', 'to help him.'],
          target: 'to help',
          distractors: ['help', 'helping'],
          grammarTip: 'real friends를 꾸며 주는 to부정사의 형용사적 용법으로 to help를 써요.',
          errorVersion: { wrong: 'help', right: 'to help' }
        }
      ]
    }
  ];
})();
