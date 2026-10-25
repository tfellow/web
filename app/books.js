// 책 데이터. 새 작품은 이 배열에 같은 형식으로 추가하고, Supabase의 books / quiz_questions 에도 같은 id로 등록합니다.
window.BOOKS = [
  {
    id: "unbearable-lightness",
    title: "The Unbearable Lightness of Being",
    titleKo: "참을 수 없는 존재의 가벼움",
    author: "Milan Kundera",
    authorKo: "밀란 쿤데라",
    country: "Czechoslovakia",
    emoji: "🪶",
    color: "#7c6bb0",
    cefr: "B1",
    lexile: "750L",
    ar: "4.5",
    words: 391,
    story: [
      {
        en: "The story takes place in Prague, Czechoslovakia, around the year 1968. It follows the lives of four people and a dog. The main character is Tomas. He is a successful doctor and a very smart man. Tomas likes to have relationships with many women, but he does not want true love. He wants his life to be \"light\" and free of serious responsibilities.",
        ko: "이 이야기는 1968년경 체코슬로바키아의 프라하를 배경으로 합니다. 네 사람과 개 한 마리의 삶을 따라갑니다. 주인공은 토마시입니다. 그는 성공한 의사이며 매우 똑똑한 사람입니다. 토마시는 많은 여성들과 관계를 맺는 것을 좋아하지만, 진정한 사랑은 원하지 않습니다. 그는 자신의 삶이 \"가볍고\" 심각한 책임이 없기를 바랍니다."
      },
      {
        en: "One day, Tomas meets a young woman named Tereza. Tereza is very different from him. She wants a serious relationship and deep love. In this book, deep feelings and important responsibilities are called \"heavy.\" Tomas and Tereza fall in love and get married. However, Tomas continues to see other women. One of these women is Sabina, a free-spirited artist who is Tomas's close friend. Tereza feels very sad and jealous about this.",
        ko: "어느 날, 토마시는 테레자라는 젊은 여성을 만납니다. 테레자는 그와 매우 다릅니다. 그녀는 진지한 관계와 깊은 사랑을 원합니다. 이 책에서 깊은 감정과 중요한 책임은 \"무겁다\"고 표현됩니다. 토마시와 테레자는 사랑에 빠져 결혼을 합니다. 하지만 토마시는 계속해서 다른 여자들을 만납니다. 그중 한 명은 자유로운 영혼의 예술가이자 토마시의 친한 친구인 사비나입니다. 테레자는 이로 인해 매우 슬퍼하고 질투를 느낍니다."
      },
      {
        en: "When the Soviet Union invades their country in 1968, Tomas, Tereza, and Sabina escape to Switzerland. Tereza is still unhappy because of Tomas's other women. She decides to leave him and goes back to Prague alone. Tomas realizes he truly loves her. He makes a \"heavy\" decision to follow her back to Prague, even though the country is no longer safe.",
        ko: "1968년 소련이 그들의 나라를 침공했을 때, 토마시, 테레자, 사비나는 스위스로 탈출합니다. 테레자는 토마시의 다른 여자들 때문에 여전히 불행합니다. 그녀는 그를 떠나기로 결심하고 혼자 프라하로 돌아갑니다. 토마시는 자신이 그녀를 진심으로 사랑한다는 것을 깨닫습니다. 그는 조국이 더 이상 안전하지 않음에도 불구하고, 그녀를 따라 프라하로 돌아가는 \"무거운\" 결정을 내립니다."
      },
      {
        en: "Meanwhile, Sabina leaves Switzerland and travels to other countries. She always wants her life to be light and completely free. She meets a university professor named Franz. Franz is a good man, but he takes life very seriously. He leaves his wife to be with Sabina, but Sabina runs away from him because she does not want a heavy, committed life.",
        ko: "한편, 사비나는 스위스를 떠나 다른 나라들로 여행을 떠납니다. 그녀는 항상 자신의 삶이 가볍고 완전히 자유롭기를 원합니다. 그녀는 프란츠라는 대학교수를 만납니다. 프란츠는 좋은 사람이지만 삶을 매우 진지하게 받아들입니다. 그는 사비나와 함께하기 위해 아내를 떠나지만, 사비나는 무겁고 헌신적인 삶을 원하지 않기 때문에 그에게서 도망칩니다."
      },
      {
        en: "Back in Prague, Tomas loses his job as a doctor because he wrote an article criticizing the government. He has to work as a window washer. Life in the city is very hard for Tomas and Tereza. Finally, they decide to leave the city and move to the quiet countryside. They live on a small farm with their beloved dog, Karenin. Away from the city and the government, they finally find peace and true happiness together. Sadly, Tomas and Tereza die in a tragic car accident at the end of the story.",
        ko: "프라하로 돌아온 토마시는 정부를 비판하는 글을 썼다는 이유로 의사 직업을 잃습니다. 그는 유리창 닦이로 일해야만 합니다. 도시에서의 삶은 토마시와 테레자에게 매우 힘듭니다. 마침내 그들은 도시를 떠나 조용한 시골로 이사하기로 결정합니다. 그들은 사랑하는 반려견 카레닌과 함께 작은 농장에서 살아갑니다. 도시와 정부에서 벗어나, 그들은 마침내 함께 평화와 진정한 행복을 찾습니다. 슬프게도, 이야기의 끝에서 토마시와 테레자는 비극적인 교통사고로 목숨을 잃습니다."
      },
      {
        en: "Through these four characters, the author asks an important question. Which is a better way to live: a \"light\" life with no ties, or a \"heavy\" life filled with deep meaning and responsibility?",
        ko: "이 네 명의 등장인물을 통해 작가는 중요한 질문을 던집니다. 얽매임이 없는 \"가벼운\" 삶과, 깊은 의미와 책임감으로 가득 찬 \"무거운\" 삶 중 어느 것이 더 나은 삶의 방식일까요?"
      }
    ],
    analysis: [
      { label: "Topic (글감)", en: "Love, politics, and the life choices we make.", ko: "사랑, 정치, 그리고 우리가 삶에서 내리는 선택." },
      { label: "Main Idea (요지)", en: "Every choice we make only happens once, making life feel \"light,\" but love and duty make our lives feel \"heavy\" and meaningful.", ko: "우리가 내리는 모든 선택은 단 한 번만 일어나며 이로 인해 삶은 \"가볍게\" 느껴지지만, 사랑과 의무는 우리의 삶을 \"무겁고\" 의미 있게 만듭니다." },
      { label: "Theme (주제)", en: "The conflict between lightness (freedom, no ties) and weight (commitment, responsibility).", ko: "가벼움(자유, 얽매임 없음)과 무거움(헌신, 책임감) 사이의 갈등." }
    ],
    characters: [
      { name: "Tomas (토마시)", en: "A smart doctor who loves many women but struggles to understand true love and commitment.", ko: "많은 여성을 사랑하지만 진정한 사랑과 헌신을 이해하는 데 어려움을 겪는 똑똑한 의사." },
      { name: "Tereza (테레자)", en: "Tomas's wife who wants a deep, serious love and suffers because of his other relationships.", ko: "깊고 진지한 사랑을 원하며 남편의 다른 관계들 때문에 고통받는 토마시의 아내." },
      { name: "Sabina (사비나)", en: "An artist and Tomas's friend who hates rules and always runs away to keep her freedom.", ko: "규칙을 싫어하고 자유를 지키기 위해 항상 도망치는 예술가이자 토마시의 친구." },
      { name: "Franz (프란츠)", en: "A university professor who loves Sabina and thinks love should be serious and faithful.", ko: "사비나를 사랑하며 사랑은 진지하고 충실해야 한다고 생각하는 대학교수." }
    ],
    vocab: [
      { level: "C1 - Advanced", items: [
        ["Unbearable", "adj.", "참을 수 없는", "Too bad or painful to accept."]
      ] },
      { level: "B2 - Upper Intermediate", items: [
        ["Free-spirited", "adj.", "자유분방한", "Independent and not following traditional rules."],
        ["Invade", "v.", "침략하다", "To enter a country by force with an army."],
        ["Criticize", "v.", "비판하다", "To say what you think is wrong with someone or something."],
        ["Committed", "adj.", "헌신적인", "Loyal and giving a lot of your time to something."],
        ["Tragic", "adj.", "비극적인", "Very sad, especially because it involves death."],
        ["Conflict", "n.", "갈등", "A situation where people or ideas are in disagreement."]
      ] },
      { level: "B1 - Intermediate", items: [
        ["Responsibility", "n.", "책임", "A duty to take care of someone or something."],
        ["Relationship", "n.", "관계", "The way in which two people or groups are connected."],
        ["Independent", "adj.", "독립적인", "Free from outside control; not needing help from others."],
        ["Jealous", "adj.", "질투하는", "Feeling unhappy because you want what someone else has."],
        ["Realize", "v.", "깨닫다", "To notice or understand something for the first time."],
        ["Decision", "n.", "결정", "A choice that you make after thinking about it."],
        ["Escape", "v.", "탈출하다", "To get away from a dangerous place or situation."],
        ["Successful", "adj.", "성공적인", "Achieving the result that you wanted to have."]
      ] },
      { level: "A2 - Elementary", items: [
        ["Serious", "adj.", "진지한", "Needing careful thought; not intended to be funny."],
        ["Character", "n.", "등장인물", "A person represented in a book, movie, or play."],
        ["Peace", "n.", "평화", "A situation or feeling of being calm and quiet."],
        ["Unhappy", "adj.", "불행한", "Feeling sad or not satisfied with a situation."]
      ] },
      { level: "A1 - Beginner", items: [
        ["Different", "adj.", "다른", "Not the same as another person or thing."]
      ] }
    ]
  },
  {
    id: "tuesdays-with-morrie",
    title: "Tuesdays with Morrie",
    titleKo: "모리와 함께한 화요일",
    author: "Mitch Albom",
    authorKo: "미치 앨봄",
    country: "United States",
    emoji: "🍂",
    color: "#c9722f",
    cefr: "B1",
    lexile: "830L",
    ar: "5.5",
    words: 367,
    story: [
      {
        en: "Mitch Albom is a very busy and successful sports writer. He works hard, earns a lot of money, and travels often. However, he is not truly happy. He has lost touch with his favorite college professor, Morrie Schwartz, for sixteen years.",
        ko: "미치 앨봄은 매우 바쁘고 성공한 스포츠 기자입니다. 그는 열심히 일하고 돈을 많이 벌며 자주 여행을 다닙니다. 하지만 그는 진정으로 행복하지는 않습니다. 그는 16년 동안 자신이 가장 좋아하는 대학 교수인 모리 슈워츠와 연락이 끊긴 상태였습니다."
      },
      {
        en: "One night, Mitch sees Morrie on a television show. He learns some very sad news. Morrie is dying from a terrible disease called ALS. This disease makes the body stop working, but the mind stays perfectly clear. Mitch decides to visit Morrie. He travels to Morrie's home in Massachusetts.",
        ko: "어느 날 밤, 미치는 텔레비전 프로그램에서 모리를 보게 됩니다. 그는 매우 슬픈 소식을 알게 됩니다. 모리가 ALS(루게릭병)라는 무서운 병으로 죽어가고 있다는 것입니다. 이 병은 몸을 움직이지 못하게 하지만, 정신은 완벽하게 맑은 상태로 유지하게 합니다. 미치는 모리를 방문하기로 결심합니다. 그는 매사추세츠에 있는 모리의 집으로 여행을 갑니다."
      },
      {
        en: "What starts as a single visit becomes a regular habit. Every Tuesday, Mitch flies all the way from Michigan to see his old teacher. These Tuesday visits become a special final class between a student and his professor. There are no books and no tests. The subject of this class is \"The Meaning of Life.\"",
        ko: "단 한 번의 방문으로 시작된 일은 규칙적인 습관이 됩니다. 매주 화요일, 미치는 옛 스승을 만나기 위해 미시간에서 비행기를 타고 날아갑니다. 이 화요일의 방문들은 학생과 교수 사이의 특별한 마지막 수업이 됩니다. 책도 없고 시험도 없습니다. 이 수업의 주제는 '인생의 의미'입니다."
      },
      {
        en: "During their time together, Morrie teaches Mitch many important life lessons. They talk about big topics like love, work, family, aging, forgiveness, and death. Morrie's body is getting weaker every day. Soon, he cannot walk, dress himself, or even eat without help. But his mind remains very strong and positive. He is not afraid of death. Instead, he chooses to live his final days with joy, humor, and a deep connection with others.",
        ko: "함께하는 시간 동안 모리는 미치에게 많은 중요한 인생의 교훈을 가르쳐 줍니다. 그들은 사랑, 일, 가족, 나이 듦, 용서, 그리고 죽음과 같은 무거운 주제들에 대해 이야기합니다. 모리의 몸은 매일 약해집니다. 곧 그는 혼자서 걷거나 옷을 입거나 도움 없이는 밥을 먹을 수도 없게 됩니다. 하지만 그의 마음은 여전히 매우 강하고 긍정적입니다. 그는 죽음을 두려워하지 않습니다. 대신, 그는 기쁨과 유머, 그리고 다른 사람들과의 깊은 유대감으로 마지막 날들을 살아가기로 선택합니다."
      },
      {
        en: "Morrie teaches Mitch a very important lesson: we must learn how to die before we can learn how to live. Mitch slowly realizes that he has been focusing on the wrong things in his life. He cares too much about money, career, and success. Morrie helps Mitch see what is truly important. Love is the most important thing in the world. As Morrie famously says, \"Love each other or perish.\"",
        ko: "모리는 미치에게 매우 중요한 교훈을 가르칩니다. 어떻게 죽어야 하는지 배우기 전까지는 어떻게 살아야 하는지 배울 수 없다는 것입니다. 미치는 자신이 인생에서 잘못된 것들에 집중하고 있었다는 것을 서서히 깨닫게 됩니다. 그는 돈, 직업, 성공에 너무 많은 신경을 썼습니다. 모리는 미치가 무엇이 진정으로 중요한지 볼 수 있도록 도와줍니다. 세상에서 가장 중요한 것은 사랑입니다. 모리가 한 유명한 말처럼 \"서로 사랑하지 않으면 멸망합니다.\""
      },
      {
        en: "In the end, Morrie passes away peacefully, surrounded by his family. However, his lessons do not die. They live on inside Mitch. Mitch writes this book to share Morrie's beautiful wisdom with the world. It is their final project together. It helps readers everywhere understand how to live a happy, loving, and meaningful life.",
        ko: "마침내 모리는 가족들에게 둘러싸여 평화롭게 세상을 떠납니다. 하지만 그의 가르침은 죽지 않습니다. 그것은 미치의 마음속에 계속 살아 숨 쉽니다. 미치는 모리의 아름다운 지혜를 세상과 나누기 위해 이 책을 씁니다. 이것은 그들이 함께 한 마지막 프로젝트입니다. 이 책은 세상의 모든 독자들이 어떻게 행복하고 사랑이 넘치며 의미 있는 삶을 살 수 있는지 이해하도록 도와줍니다."
      }
    ],
    analysis: [
      { label: "Topic (화제, 소재)", en: "The final lessons of a dying professor.", ko: "죽어가는 교수의 마지막 가르침." },
      { label: "Main Idea (요지)", en: "True happiness comes from love, giving to others, and accepting death, not from money or success.", ko: "진정한 행복은 돈이나 성공이 아니라 사랑, 타인에게 베푸는 것, 그리고 죽음을 받아들이는 것에서 온다." },
      { label: "Theme (주제)", en: "The meaning of life, love, and acceptance.", ko: "삶의 의미, 사랑, 그리고 수용." }
    ],
    characters: [
      { name: "Mitch Albom (미치 앨봄)", en: "A busy sports writer who rediscovers the true meaning of life through his old professor.", ko: "옛 스승을 통해 삶의 진정한 의미를 다시 발견하는 바쁜 스포츠 기자." },
      { name: "Morrie Schwartz (모리 슈워츠)", en: "A wise and loving sociology professor who teaches his final lessons while dying from ALS.", ko: "루게릭병으로 죽어가면서 마지막 수업을 가르치는 지혜롭고 사랑이 넘치는 사회학 교수." },
      { name: "Charlotte (샬럿)", en: "Morrie's caring and supportive wife.", ko: "모리를 헌신적으로 보살피고 지지해 주는 아내." }
    ],
    vocab: [
      { level: "C2 - Mastery", items: [
        ["Perish", "v.", "죽다, 멸망하다", "To die, especially in a sudden or violent way."]
      ] },
      { level: "C1 - Advanced", items: [
        ["Sociology", "n.", "사회학", "The study of how people behave in a society or group."],
        ["Wisdom", "n.", "지혜", "The ability to use knowledge and experience to make good choices."]
      ] },
      { level: "B2 - Upper Intermediate", items: [
        ["Acceptance", "n.", "수용, 받아들이기", "The act of agreeing to a situation even if it is difficult."],
        ["Connection", "n.", "유대감, 연결", "A shared feeling of understanding or friendship between people."],
        ["Forgiveness", "n.", "용서", "The act of deciding to stop being angry with someone."],
        ["Meaningful", "adj.", "의미 있는", "Having a serious, important, or useful quality."],
        ["Supportive", "adj.", "지지하는, 도와주는", "Giving help or encouragement to someone."]
      ] },
      { level: "B1 - Intermediate", items: [
        ["Career", "n.", "직업, 경력", "A job or profession that you do for a long time."],
        ["Disease", "n.", "질병, 병", "An illness of the body or mind."],
        ["Habit", "n.", "습관", "Something that you do often and regularly."],
        ["Positive", "adj.", "긍정적인", "Thinking about the good things in a situation; hopeful."],
        ["Professor", "n.", "교수", "A teacher of the highest rank in a college or university."],
        ["Realize", "v.", "깨닫다", "To understand or become aware of something."],
        ["Success", "n.", "성공", "Reaching a goal or getting what you wanted."],
        ["Surround", "v.", "둘러싸다", "To be everywhere around something or someone."]
      ] },
      { level: "A2 - Elementary", items: [
        ["Lesson", "n.", "교훈, 수업", "Something that is learned or taught."],
        ["Meaning", "n.", "의미", "The message or idea that something conveys."],
        ["Regular", "adj.", "규칙적인", "Happening often or at the same time each day or week."],
        ["Travel", "v.", "여행하다", "To go from one place to another place."]
      ] }
    ]
  }
];
