// MY Level Test — 문항 은행 (모든 지문·문항은 이 앱을 위해 새로 쓴 것)
// b = 문항 난이도(로짓). 기준: Pre-A1 ≈ -2.5, A1 ≈ -1.5, A2 ≈ -0.5, B1 ≈ 0.5, B2 ≈ 1.5, C1 ≈ 2.5
// a = 정답 보기 번호(0부터). 보기 순서는 화면에서 섞여요.
// 학생 응답이 쌓이면 교사 화면 → 🧪 문항 분석에서 b 값을 자동 보정할 수 있어요.
window.LT_BANK = {
  // ------------------------------------------------------------------
  // 1단계: 어휘 크기 (예/아니오 체크 + 뜻 확인)
  //   band: 빈도 구간 (1 = 가장 흔한 1,000단어, 6 = 5,001~6,000, 7 = 6,001~9,000)
  // ------------------------------------------------------------------
  vocab: [
    { w: "water", ko: "물", band: 1 }, { w: "friend", ko: "친구", band: 1 }, { w: "answer", ko: "대답", band: 1 }, { w: "easy", ko: "쉬운", band: 1 },
    { w: "carry", ko: "나르다", band: 1 }, { w: "market", ko: "시장", band: 1 }, { w: "quiet", ko: "조용한", band: 1 }, { w: "believe", ko: "믿다", band: 1 },
    { w: "borrow", ko: "빌리다", band: 2 }, { w: "narrow", ko: "좁은", band: 2 }, { w: "honest", ko: "정직한", band: 2 }, { w: "deliver", ko: "배달하다", band: 2 },
    { w: "shelf", ko: "선반", band: 2 }, { w: "prize", ko: "상, 상품", band: 2 }, { w: "brave", ko: "용감한", band: 2 }, { w: "invite", ko: "초대하다", band: 2 },
    { w: "rescue", ko: "구조하다", band: 3 }, { w: "ancient", ko: "고대의", band: 3 }, { w: "shallow", ko: "얕은", band: 3 }, { w: "steep", ko: "가파른", band: 3 },
    { w: "burden", ko: "짐, 부담", band: 3 }, { w: "grateful", ko: "고마워하는", band: 3 }, { w: "recipe", ko: "요리법", band: 3 }, { w: "sincere", ko: "진심 어린", band: 3 },
    { w: "tremble", ko: "떨다", band: 4 }, { w: "reluctant", ko: "꺼리는", band: 4 }, { w: "harvest", ko: "수확", band: 4 }, { w: "fragile", ko: "깨지기 쉬운", band: 4 },
    { w: "clumsy", ko: "서투른", band: 4 }, { w: "merchant", ko: "상인", band: 4 }, { w: "swamp", ko: "늪", band: 4 }, { w: "endure", ko: "견디다", band: 4 },
    { w: "vivid", ko: "생생한", band: 5 }, { w: "drought", ko: "가뭄", band: 5 }, { w: "mourn", ko: "애도하다", band: 5 }, { w: "stubborn", ko: "고집 센", band: 5 },
    { w: "glimpse", ko: "언뜻 봄", band: 5 }, { w: "timid", ko: "소심한", band: 5 }, { w: "hostile", ko: "적대적인", band: 5 }, { w: "plead", ko: "간청하다", band: 5 },
    { w: "ponder", ko: "곰곰이 생각하다", band: 6 }, { w: "frugal", ko: "검소한", band: 6 }, { w: "lament", ko: "한탄하다", band: 6 }, { w: "meager", ko: "빈약한", band: 6 },
    { w: "grumble", ko: "투덜대다", band: 6 }, { w: "feeble", ko: "허약한", band: 6 }, { w: "solemn", ko: "엄숙한", band: 6 }, { w: "gale", ko: "강풍", band: 6 },
    { w: "ominous", ko: "불길한", band: 7 }, { w: "wistful", ko: "아쉬워하는", band: 7 }, { w: "haggle", ko: "값을 깎다", band: 7 }, { w: "quench", ko: "(갈증을) 풀다", band: 7 },
    { w: "squalid", ko: "지저분한", band: 7 }, { w: "placate", ko: "달래다", band: 7 }, { w: "loathe", ko: "몹시 싫어하다", band: 7 }, { w: "dormant", ko: "휴면 중인", band: 7 }
  ],
  // 진짜 영어 단어가 아닌 가짜 단어 (아는 척 체크를 걸러내는 용도)
  pseudo: ["flarnish", "glomper", "vosken", "mardify", "brontle", "skelbor", "drimple", "plurrow",
    "nestify", "crambit", "wobbish", "dremble", "sorgent", "fendrous", "throsten", "pelvant"],
  bandWeight: { 1: 1000, 2: 1000, 3: 1000, 4: 1000, 5: 1000, 6: 1000, 7: 3000 },

  // ------------------------------------------------------------------
  // 2단계: 문법·어휘 (적응형, 4지선다)
  // ------------------------------------------------------------------
  lang: [
    // Pre-A1
    { id: "g01", b: -2.9, tag: "be", q: "I ___ a student.", o: ["am", "is", "are", "be"], a: 0 },
    { id: "g02", b: -2.7, tag: "present", q: "She ___ two cats.", o: ["has", "have", "having", "is"], a: 0 },
    { id: "g03", b: -2.4, tag: "article", q: "I have ___ orange.", o: ["an", "a", "two", "many"], a: 0 },
    { id: "g04", b: -2.8, tag: "word", q: "At night, I sleep in my ___.", o: ["bedroom", "kitchen", "classroom", "garden"], a: 0 },
    { id: "g05", b: -2.6, tag: "question", q: "___ is your name?", o: ["What", "Who", "Where", "How"], a: 0 },
    { id: "g06", b: -2.3, tag: "be", q: "There ___ three books on the desk.", o: ["are", "is", "am", "be"], a: 0 },
    { id: "g07", b: -2.2, tag: "progressive", q: "Look! The dog ___ in the park.", o: ["is running", "runs", "run", "to run"], a: 0 },
    { id: "g08", b: -2.5, tag: "word", q: "My mother's sister is my ___.", o: ["aunt", "uncle", "cousin", "grandfather"], a: 0 },
    { id: "g09", b: -2.6, tag: "modal", q: "I can ___ English.", o: ["speak", "speaks", "speaking", "to speak"], a: 0 },
    { id: "g10", b: -3.0, tag: "word", q: "The opposite of \"hot\" is ___.", o: ["cold", "warm", "big", "fast"], a: 0 },
    { id: "g11", b: -2.1, tag: "preposition", q: "The cat is ___ the box. I can't see it.", o: ["in", "on", "at", "to"], a: 0 },
    // A1
    { id: "g12", b: -1.8, tag: "past", q: "They ___ at home yesterday.", o: ["were", "was", "are", "be"], a: 0 },
    { id: "g13", b: -1.9, tag: "present", q: "He ___ to school by bus every day.", o: ["goes", "go", "going", "gone"], a: 0 },
    { id: "g14", b: -1.5, tag: "past", q: "Did you ___ the movie last night?", o: ["see", "saw", "seen", "seeing"], a: 0 },
    { id: "g15", b: -1.6, tag: "comparison", q: "This bag is ___ than that one.", o: ["heavier", "heavy", "heaviest", "more heavy"], a: 0 },
    { id: "g16", b: -1.3, tag: "quantifier", q: "We don't have ___ milk. Let's buy some.", o: ["any", "some", "many", "a"], a: 0 },
    { id: "g17", b: -2.0, tag: "word", q: "I'm hungry. Can I have something to ___?", o: ["eat", "wear", "read", "drive"], a: 0 },
    { id: "g18", b: -1.4, tag: "preposition", q: "My birthday is ___ May.", o: ["in", "on", "at", "to"], a: 0 },
    { id: "g19", b: -1.2, tag: "modal", q: "___ you like some tea?", o: ["Would", "Do", "Are", "Will"], a: 0 },
    { id: "g20", b: -1.1, tag: "preposition", q: "She is good ___ drawing.", o: ["at", "in", "on", "for"], a: 0 },
    { id: "g21", b: -1.7, tag: "past", q: "I usually get up early, but today I ___ up late.", o: ["got", "get", "getting", "gets"], a: 0 },
    { id: "g22", b: -1.3, tag: "word", q: "It's raining. Don't forget your ___.", o: ["umbrella", "sunglasses", "swimsuit", "kite"], a: 0 },
    // A2
    { id: "g23", b: -0.8, tag: "progressive", q: "I ___ TV when you called me.", o: ["was watching", "watched", "have watched", "watch"], a: 0 },
    { id: "g24", b: -0.6, tag: "perfect", q: "Have you ever ___ to Jeju Island?", o: ["been", "go", "went", "going"], a: 0 },
    { id: "g25", b: -0.5, tag: "conditional", q: "If it rains tomorrow, we ___ at home.", o: ["will stay", "stay", "stayed", "would stay"], a: 0 },
    { id: "g26", b: -0.4, tag: "relative", q: "This is the girl ___ won the contest.", o: ["who", "which", "what", "whose"], a: 0 },
    { id: "g27", b: -0.7, tag: "modal", q: "You ___ wear a helmet when you ride a bike. It's the rule.", o: ["must", "may", "might", "could"], a: 0 },
    { id: "g28", b: -0.1, tag: "gerund", q: "I'm looking forward ___ you soon.", o: ["to seeing", "to see", "seeing", "see"], a: 0 },
    { id: "g29", b: -0.3, tag: "so-such", q: "The book was ___ boring that I fell asleep.", o: ["so", "such", "too", "very"], a: 0 },
    { id: "g30", b: -0.5, tag: "perfect", q: "Minsu has lived here ___ 2020.", o: ["since", "for", "from", "at"], a: 0 },
    { id: "g31", b: -0.9, tag: "word", q: "Please ___ your phone off during the movie.", o: ["turn", "take", "put", "make"], a: 0 },
    { id: "g32", b: -0.6, tag: "gerund", q: "I enjoy ___ in the rain.", o: ["walking", "walk", "to walk", "walked"], a: 0 },
    { id: "g33", b: -0.2, tag: "word", q: "The museum is ___ on Mondays, so you can't go in.", o: ["closed", "close", "closing", "closes"], a: 0 },
    // B1
    { id: "g34", b: 0.4, tag: "conditional", q: "If I ___ more time, I would learn to play the guitar.", o: ["had", "have", "will have", "would have"], a: 0 },
    { id: "g35", b: 0.2, tag: "passive", q: "The bridge ___ in 1990.", o: ["was built", "built", "has built", "is building"], a: 0 },
    { id: "g36", b: 0.5, tag: "reported", q: "He said that he ___ tired, so he went to bed early.", o: ["was", "is", "be", "being"], a: 0 },
    { id: "g37", b: 0.7, tag: "perfect", q: "By the time we arrived, the movie ___.", o: ["had already started", "already started", "has already started", "already starts"], a: 0 },
    { id: "g38", b: 0.3, tag: "modal", q: "You'd better ___ an umbrella. It looks like rain.", o: ["take", "to take", "taking", "took"], a: 0 },
    { id: "g39", b: 0.6, tag: "causative", q: "The teacher made us ___ the essay again.", o: ["write", "to write", "writing", "written"], a: 0 },
    { id: "g40", b: 0.8, tag: "gerund", q: "I'm not used to ___ up so early.", o: ["getting", "get", "got", "be getting"], a: 0 },
    { id: "g41", b: 0.5, tag: "word", q: "We had to ___ the picnic because of the heavy rain.", o: ["call off", "call on", "call up", "call back"], a: 0 },
    { id: "g42", b: 0.9, tag: "conjunction", q: "Neither my brother ___ my sister likes spicy food.", o: ["nor", "or", "and", "but"], a: 0 },
    { id: "g43", b: 0.6, tag: "relative", q: "She is the most talented singer ___ I have ever heard.", o: ["that", "what", "who's", "where"], a: 0 },
    { id: "g44", b: 0.1, tag: "word", q: "Thanks to her hard work, she finally ___ her goal of running a marathon.", o: ["achieved", "arrived", "received", "succeeded"], a: 0 },
    // B2
    { id: "g45", b: 1.6, tag: "subjunctive", q: "I'd rather you ___ smoke here.", o: ["didn't", "don't", "won't", "not"], a: 0 },
    { id: "g46", b: 1.4, tag: "conditional", q: "Had I known about the traffic, I ___ earlier.", o: ["would have left", "would leave", "had left", "will leave"], a: 0 },
    { id: "g47", b: 1.7, tag: "subjunctive", q: "It's high time we ___ the problem seriously.", o: ["took", "take", "taking", "will take"], a: 0 },
    { id: "g48", b: 1.8, tag: "inversion", q: "Not only ___ the exam, but she also got the highest score.", o: ["did she pass", "she passed", "she did pass", "passed she"], a: 0 },
    { id: "g49", b: 1.2, tag: "relative", q: "The new policy, ___ was introduced last year, has been very successful.", o: ["which", "that", "what", "who"], a: 0 },
    { id: "g50", b: 1.1, tag: "gerund", q: "He denied ___ the window.", o: ["breaking", "to break", "break", "broke"], a: 0 },
    { id: "g51", b: 1.3, tag: "word", q: "The company had to ___ 200 workers because of falling sales.", o: ["lay off", "lay out", "lay down", "lay aside"], a: 0 },
    { id: "g52", b: 1.5, tag: "modal", q: "She must ___ the bus. She's usually here by now.", o: ["have missed", "miss", "be missing", "missed"], a: 0 },
    { id: "g53", b: 1.2, tag: "conjunction", q: "Despite ___ tired, he kept working.", o: ["being", "he was", "to be", "been"], a: 0 },
    { id: "g54", b: 1.0, tag: "comparison", q: "The more you practice, ___ you become.", o: ["the better", "better", "the best", "best"], a: 0 },
    { id: "g55", b: 1.4, tag: "word", q: "His explanation was so ___ that nobody understood it.", o: ["vague", "obvious", "precise", "simple"], a: 0 },
    // C1
    { id: "g56", b: 2.3, tag: "inversion", q: "Scarcely ___ the room when the phone rang.", o: ["had I entered", "I had entered", "did I enter", "I entered"], a: 0 },
    { id: "g57", b: 2.4, tag: "conditional", q: "Were it not for your help, I ___ in serious trouble now.", o: ["would be", "will be", "had been", "am"], a: 0 },
    { id: "g58", b: 2.6, tag: "word", q: "The proposal was rejected on the ___ that it would cost too much.", o: ["grounds", "reasons", "causes", "terms"], a: 0 },
    { id: "g59", b: 2.0, tag: "comparison", q: "She is ___ the most gifted student I have ever taught.", o: ["by far", "very", "so", "much more"], a: 0 },
    { id: "g60", b: 2.1, tag: "inversion", q: "Little ___ that his life was about to change forever.", o: ["did he know", "he knew", "he did know", "knew he"], a: 0 },
    { id: "g61", b: 2.5, tag: "word", q: "The two leaders failed to reach a ___ after hours of talks.", o: ["consensus", "conscience", "consequence", "convention"], a: 0 },
    { id: "g62", b: 2.7, tag: "modal", q: "I would sooner ___ than apologize to him.", o: ["starve", "to starve", "starving", "starved"], a: 0 },
    { id: "g63", b: 2.8, tag: "conjunction", q: "___ the bad weather, the event went ahead as planned.", o: ["Notwithstanding", "Although", "Nevertheless", "Despite of"], a: 0 },
    { id: "g64", b: 2.4, tag: "word", q: "His speech was full of ___ remarks that offended many listeners.", o: ["derogatory", "flattering", "generous", "modest"], a: 0 },
    { id: "g65", b: 2.2, tag: "inversion", q: "Only after the results were published ___ how serious the problem was.", o: ["did people realize", "people realized", "people did realize", "realized people"], a: 0 },
    { id: "g66", b: 2.9, tag: "subjunctive", q: "The manager insisted that every employee ___ the training.", o: ["attend", "attends", "attended", "will attend"], a: 0 }
  ],

  // ------------------------------------------------------------------
  // 3단계: 읽기 (적응형, 지문 1개당 2문항)
  // ------------------------------------------------------------------
  read: [
    // ---------- Pre-A1 ----------
    { id: "r01", lv: "A0", title: "My Cat", text: "I have a cat. Her name is Coco. Coco is small and white. She likes milk. She sleeps on my bed every night. I love Coco.",
      qs: [
        { id: "r01a", b: -3.0, tag: "detail", q: "What color is Coco?", o: ["White", "Black", "Brown", "Gray"], a: 0 },
        { id: "r01b", b: -2.7, tag: "detail", q: "Where does Coco sleep?", o: ["On the bed", "In the kitchen", "Under the table", "In the garden"], a: 0 }
      ] },
    { id: "r02", lv: "A0", title: "A Note", text: "Hi Tom,\nI am at the park with Jina. We are playing soccer. Come and play with us!\n— Minho",
      qs: [
        { id: "r02a", b: -2.8, tag: "detail", q: "Who is with Minho?", o: ["Jina", "Tom", "His mom", "His teacher"], a: 0 },
        { id: "r02b", b: -2.4, tag: "purpose", q: "What does Minho want Tom to do?", o: ["Come to the park", "Call him later", "Buy a new ball", "Go home"], a: 0 }
      ] },
    { id: "r03", lv: "A0", title: "Sunny Library", text: "SUNNY LIBRARY\nMonday – Friday: 9:00 – 6:00\nSaturday: 10:00 – 2:00\nSunday: Closed\nNo food or drinks, please.",
      qs: [
        { id: "r03a", b: -2.5, tag: "detail", q: "When is the library open on Saturday?", o: ["10:00 – 2:00", "9:00 – 6:00", "All day", "It is closed."], a: 0 },
        { id: "r03b", b: -2.2, tag: "detail", q: "What can't you do in the library?", o: ["Eat snacks", "Read books", "Sit at a table", "Visit on Monday"], a: 0 }
      ] },
    // ---------- A1 ----------
    { id: "r04", lv: "A1", title: "A Day at the Beach", text: "Last Saturday, my family went to the beach. The weather was sunny and warm. My little brother built a big sandcastle, and I swam in the sea. In the afternoon, it started to rain, so we went to a café and drank hot chocolate. It was a great day.\n— Sara",
      qs: [
        { id: "r04a", b: -1.8, tag: "detail", q: "What did Sara do at the beach?", o: ["She swam in the sea.", "She built a sandcastle.", "She sold hot chocolate.", "She stayed in the car."], a: 0 },
        { id: "r04b", b: -1.6, tag: "detail", q: "Why did the family go to a café?", o: ["It started to rain.", "They were very hungry.", "The beach was closed.", "Her brother was tired."], a: 0 }
      ] },
    { id: "r05", lv: "A1", title: "Talent Show", text: "SCHOOL TALENT SHOW!\nFriday, June 14, 3 p.m., in the school hall\nSing, dance, or play an instrument!\nSign up with Ms. Kim in Room 201 by June 10.\nPrizes for the top three acts!",
      qs: [
        { id: "r05a", b: -1.4, tag: "detail", q: "What should you do if you want to be in the show?", o: ["Sign up in Room 201 by June 10", "Go to the hall on June 10", "Buy a ticket from Ms. Kim", "Sing for Ms. Kim on Friday"], a: 0 },
        { id: "r05b", b: -1.7, tag: "detail", q: "How many acts will get a prize?", o: ["Three", "One", "Ten", "All of them"], a: 0 }
      ] },
    { id: "r06", lv: "A1", title: "Ben's Puppy", text: "Ben wanted a puppy, but his parents said no. \"A dog needs a lot of care,\" said his mom. So Ben started to help his neighbor, Mrs. Lee, with her old dog, Max. Every day after school, he walked Max and gave him water. After two months, his parents said, \"You are ready. Let's get a puppy.\"",
      qs: [
        { id: "r06a", b: -1.9, tag: "detail", q: "Who is Max?", o: ["Mrs. Lee's dog", "Ben's new puppy", "Ben's brother", "A dog at the shop"], a: 0 },
        { id: "r06b", b: -1.2, tag: "inference", q: "Why did Ben's parents finally say yes?", o: ["He proved he could care for a dog.", "He got very good grades at school.", "Mrs. Lee gave her old dog to Ben.", "His mom wanted a pet dog, too."], a: 0 }
      ] },
    // ---------- A2 ----------
    { id: "r07", lv: "A2", title: "The Bicycle Library", text: "In a small town in Canada, there is a library that lends bicycles instead of books. Anyone with a library card can borrow a bike for up to three days for free. The idea came from a group of students who noticed that many people in town did not own a bike but wanted to ride one in summer. Local shops donated old bikes, and volunteers repair them every weekend. Since it opened, more than 2,000 people have used the service.",
      qs: [
        { id: "r07a", b: -0.6, tag: "main", q: "What is the text mainly about?", o: ["A library that lends bikes", "How to repair old bikes", "Students who sell bikes", "A bike race in Canada"], a: 0 },
        { id: "r07b", b: -0.8, tag: "detail", q: "Who repairs the bikes?", o: ["Volunteers", "Local shops", "The town's mayor", "The students' parents"], a: 0 }
      ] },
    { id: "r08", lv: "A2", title: "A New School", text: "Yuna was nervous. It was her first day at a new school, and she didn't know anyone. At lunch, she sat alone and looked at her phone. Then a girl with a drawing book sat next to her. \"Do you like comics?\" the girl asked. Yuna smiled. She had drawn comics since she was eight. By the end of lunch, the two girls had made a plan to create a comic together.",
      qs: [
        { id: "r08a", b: -0.4, tag: "inference", q: "How did Yuna probably feel at the end of lunch?", o: ["Happier than before", "Still very nervous", "Angry at the new girl", "Bored and very sleepy"], a: 0 },
        { id: "r08b", b: -0.7, tag: "detail", q: "What did the two girls plan to do?", o: ["Make a comic together", "Buy new phones", "Join a sports club", "Eat lunch outside"], a: 0 }
      ] },
    { id: "r09", lv: "A2", title: "Save Water at Home", text: "Turn off the tap while you brush your teeth. This can save up to 12 liters of water a day. Take shorter showers. Fix leaking taps quickly: a tap that drips once every second wastes more than 10,000 liters a year. And when you wash a car, use a bucket instead of a hose.",
      qs: [
        { id: "r09a", b: -0.5, tag: "purpose", q: "Why was this text written?", o: ["To show ways to save water", "To sell buckets and hoses", "To explain where rain comes from", "To warn people about dirty water"], a: 0 },
        { id: "r09b", b: -0.2, tag: "detail", q: "What can waste more than 10,000 liters a year?", o: ["A dripping tap", "Brushing your teeth", "One long shower", "Washing a car once"], a: 0 }
      ] },
    // ---------- B1 ----------
    { id: "r10", lv: "B1", title: "Why Do We Yawn?", text: "Everyone yawns, but scientists still do not fully agree on why. For a long time, people believed we yawn because our bodies need more oxygen. However, in experiments where people breathed air with extra oxygen, they yawned just as often. A newer idea is that yawning cools the brain. When we yawn, we take in a large amount of air, which may lower the temperature of the blood flowing to the head. This could explain why people yawn more in warm rooms than in cold ones. Yawning is also contagious: simply seeing or reading about a yawn can make you yawn. Perhaps you are yawning right now.",
      qs: [
        { id: "r10a", b: 0.5, tag: "detail", q: "What did the oxygen experiments show?", o: ["Extra oxygen did not stop yawning.", "Tired people need much more oxygen.", "Yawning makes the brain much warmer.", "People yawn more often in cold rooms."], a: 0 },
        { id: "r10b", b: 0.3, tag: "vocab", q: "In the text, \"contagious\" is closest in meaning to ___.", o: ["spreading easily to other people", "harmful to your body and health", "lasting for a very long time", "happening mostly late at night"], a: 0 }
      ] },
    { id: "r11", lv: "B1", title: "The Umbrella Stand", text: "Mr. Han had sold umbrellas on the same corner for thirty years. When a large store opened across the street, his son told him to retire. \"Nobody will buy from a small stand anymore,\" he said. Mr. Han said nothing. The next morning, he put up a new sign: \"Forgot your umbrella? Borrow one. Bring it back when you can.\" Within a month, people were stopping by to return umbrellas, and many of them bought one, saying they wanted to support the man who had helped them on a rainy day.",
      qs: [
        { id: "r11a", b: 0.4, tag: "main", q: "What is the main idea of the story?", o: ["Kindness helped Mr. Han's business survive.", "Large stores are always better than small ones.", "Mr. Han finally decided to retire.", "Umbrellas became more expensive in the city."], a: 0 },
        { id: "r11b", b: 0.7, tag: "inference", q: "Why did many people buy umbrellas from Mr. Han?", o: ["They wanted to thank him.", "His umbrellas were the cheapest.", "The large store had closed down.", "His son asked them to buy one."], a: 0 }
      ] },
    { id: "r12", lv: "B1", title: "Homework, Not Busywork", text: "Some people say homework should be banned in middle schools. I disagree, but I think it needs to change. Instead of long worksheets, teachers could give short tasks that connect to real life, such as interviewing a family member or measuring things at home. This kind of homework takes less time, yet students often remember it better. The goal of homework should be learning, not just keeping students busy.",
      qs: [
        { id: "r12a", b: 0.6, tag: "main", q: "What is the writer's opinion?", o: ["Homework should change, not be banned.", "Homework should be banned completely.", "Long worksheets are the best homework.", "Students should study for longer hours."], a: 0 },
        { id: "r12b", b: 0.9, tag: "inference", q: "Which task would the writer most likely support?", o: ["Interviewing a grandparent", "Doing a 50-question worksheet", "Copying a textbook page three times", "Having no homework at all"], a: 0 }
      ] },
    // ---------- B2 ----------
    { id: "r13", lv: "B2", title: "The \"Mozart Effect\"", text: "The \"Mozart effect\" — the claim that listening to classical music makes you smarter — became popular in the 1990s after a small study found that students who listened to a Mozart sonata did slightly better on a spatial reasoning task. The media quickly exaggerated the finding, and some governments even handed out classical music CDs to parents of newborn babies. Later research, however, revealed that the effect was short-lived, lasting only about fifteen minutes, and that it was not unique to Mozart. Any music that participants enjoyed, or even listening to an interesting story, produced similar results. Researchers now believe the improvement was caused by greater alertness and a better mood rather than by anything special about the music itself.",
      qs: [
        { id: "r13a", b: 1.4, tag: "detail", q: "According to later research, what caused the improvement?", o: ["Greater alertness and a better mood", "Something special in Mozart's music", "Long-lasting changes in the brain", "Music CDs given to newborn babies"], a: 0 },
        { id: "r13b", b: 1.7, tag: "main", q: "What is the writer's main point?", o: ["A popular belief grew from an exaggerated study.", "Classical music makes people smarter over time.", "Governments should spend more on music.", "Mozart is more effective than other composers."], a: 0 }
      ] },
    { id: "r14", lv: "B2", title: "The Letter", text: "When the letter finally arrived, Clara did not open it at once. She had waited six months for the scholarship committee's decision, and now that the answer was in her hands, she found herself strangely reluctant to know it. As long as the envelope stayed sealed, both futures were still possible: the one in which she left for the university in Vienna, and the one in which she stayed behind the counter of her aunt's bakery. She placed the letter on the shelf beside the flour jars and went back to kneading dough.",
      qs: [
        { id: "r14a", b: 1.6, tag: "inference", q: "Why didn't Clara open the letter right away?", o: ["She wanted to keep both possibilities open.", "She had already heard the result from her aunt.", "She no longer cared about the scholarship.", "She had decided never to go to Vienna."], a: 0 },
        { id: "r14b", b: 1.3, tag: "reference", q: "What does \"both futures\" refer to?", o: ["Going to Vienna or staying at the bakery", "Opening the letter or throwing it away", "Baking bread or selling flour jars", "Living with her aunt or her parents"], a: 0 }
      ] },
    { id: "r15", lv: "B2", title: "Car-Free Cities", text: "Cities around the world are experimenting with car-free zones in their centers. Supporters point to cleaner air, fewer accidents, and busier shops, since people on foot tend to stop and browse more than drivers do. Critics, however, warn that such policies can hurt people who depend on cars, including the elderly, people with disabilities, and workers who live far from public transport. The most successful schemes seem to be those that combine restrictions with real alternatives: frequent buses, safe bike lanes, and exceptions for those who genuinely need to drive.",
      qs: [
        { id: "r15a", b: 1.5, tag: "main", q: "What conclusion does the writer reach?", o: ["Car-free zones work best with good alternatives.", "Car-free zones should end because of the critics.", "Only shop owners benefit from car-free zones.", "Elderly people should stop driving in cities."], a: 0 },
        { id: "r15b", b: 1.2, tag: "detail", q: "Why might shops do better in car-free zones?", o: ["People on foot stop and look around more.", "Shops pay less rent in these areas.", "Drivers spend more money than walkers.", "There are more parking spaces nearby."], a: 0 }
      ] },
    // ---------- C1 ----------
    { id: "r16", lv: "C1", title: "The Gift of Forgetting", text: "For most of history, forgetting was regarded as a failure of memory — an unfortunate leak in an otherwise useful system. Increasingly, however, neuroscientists argue that forgetting is not a defect but a feature. A brain that retained every detail would struggle to generalize: if you remembered each individual dog you had ever seen with perfect clarity, you might find it harder to recognize a new animal as a dog. By discarding specifics, the mind extracts patterns. Forgetting may also help us adapt; memories of outdated information, such as a friend's old address, need to fade so that new information can take their place. Seen this way, a good memory is less like an archive and more like an editor.",
      qs: [
        { id: "r16a", b: 2.3, tag: "inference", q: "Why does the writer compare a good memory to an editor?", o: ["It keeps what is useful and cuts the rest.", "It stores every detail permanently.", "It often makes careless mistakes.", "It invents information that never happened."], a: 0 },
        { id: "r16b", b: 2.0, tag: "detail", q: "How can forgetting help us recognize a new dog?", o: ["By keeping patterns instead of every detail", "By remembering every dog with perfect clarity", "By replacing old addresses with new ones", "By making us pay more attention to dogs"], a: 0 }
      ] },
    { id: "r17", lv: "C1", title: "Eleven Names", text: "My grandfather never spoke of the war, and for years I mistook his silence for indifference. It was only after his death, while sorting through a drawer of receipts and expired coupons, that I found the photograph: a row of young men squinting into the sun, their arms around one another's shoulders. On the back, in his careful handwriting, were eleven names. Nine had been crossed out. I understood then that he had not forgotten; he had simply decided that some things were too heavy to be handed down.",
      qs: [
        { id: "r17a", b: 2.5, tag: "inference", q: "What did the narrator come to realize?", o: ["His silence came from pain, not a lack of feeling.", "He had never cared about the war or its soldiers.", "He wanted the narrator to search for those men.", "He had forgotten most of the friends in the photo."], a: 0 },
        { id: "r17b", b: 2.2, tag: "inference", q: "The crossed-out names most likely belong to ___.", o: ["friends who had died", "men he had argued with", "people he no longer remembered", "soldiers who had returned home"], a: 0 }
      ] },
    { id: "r18", lv: "C1", title: "Points and Badges", text: "Advocates of \"gamification\" claim that adding points, badges, and leaderboards to dull tasks can transform motivation. Yet there is a risk that such systems replace genuine interest with a hunger for rewards. Studies of the so-called overjustification effect suggest that when people are rewarded for activities they already enjoy, their interest may decline once the rewards stop. This does not mean gamification is worthless; feedback and visible progress can be genuinely helpful. The challenge lies in designing systems that support curiosity rather than crowd it out.",
      qs: [
        { id: "r18a", b: 2.7, tag: "main", q: "The writer's attitude toward gamification is best described as ___.", o: ["balanced but cautious", "completely negative", "enthusiastically positive", "uninterested"], a: 0 },
        { id: "r18b", b: 2.4, tag: "vocab", q: "What is the \"overjustification effect\"?", o: ["Rewards can lower interest in enjoyable tasks.", "People work harder when the rewards get bigger.", "Leaderboards make every boring task exciting.", "Feedback always improves people's motivation."], a: 0 }
      ] }
  ]
};
