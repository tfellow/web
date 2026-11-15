// 글 목록(카탈로그). tools/build.py 가 만들어요. 본문은 books/<id>.js 에 있어요.
// cefr 는 A0(Pre-A1) / A1 / A2 / B1 / B2 / C1 중 하나. Supabase 의 r2_books / r2_quiz_questions 에도 같은 id 로 등록해요.
// places: 여권 도장 후보 나라. 첫 번째가 글의 대표 나라(기본값). Supabase r2_books.places 와 같게 맞춰요.
window.BOOKS = [
 {
  "id": "days-of-the-week",
  "title": "The Seven Days of the Week",
  "titleKo": "일주일의 일곱 요일",
  "country": "United Kingdom",
  "emoji": "📅",
  "color": "#3f6fa8",
  "cefr": "A0",
  "words": 78,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "animals-and-their-babies",
  "title": "Animals and Their Babies",
  "titleKo": "동물과 아기",
  "country": "Australia",
  "emoji": "🐣",
  "color": "#2f8a6b",
  "cefr": "A0",
  "words": 77,
  "places": [
   "Australia"
  ]
 },
 {
  "id": "the-moon",
  "title": "The Moon",
  "titleKo": "달",
  "emoji": "🌙",
  "color": "#2c3470",
  "cefr": "A0",
  "words": 89,
  "places": []
 },
 {
  "id": "the-pyramids-of-egypt",
  "title": "The Pyramids of Egypt",
  "titleKo": "이집트의 피라미드",
  "country": "Egypt",
  "emoji": "🔺",
  "color": "#9a6a2f",
  "cefr": "A0",
  "words": 84,
  "places": [
   "Egypt"
  ]
 },
 {
  "id": "christmas-day",
  "title": "Christmas Day",
  "titleKo": "크리스마스",
  "country": "United Kingdom",
  "emoji": "🎄",
  "color": "#b8432f",
  "cefr": "A0",
  "words": 79,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "pizza",
  "title": "Pizza from Italy",
  "titleKo": "이탈리아에서 온 피자",
  "country": "Italy",
  "emoji": "🍕",
  "color": "#c9722f",
  "cefr": "A0",
  "words": 83,
  "places": [
   "Italy",
   "United States"
  ]
 },
 {
  "id": "the-pencil",
  "title": "The Pencil",
  "titleKo": "연필",
  "country": "United Kingdom",
  "emoji": "✏️",
  "color": "#6b5aa8",
  "cefr": "A0",
  "words": 77,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "king-sejong-and-hangeul",
  "title": "King Sejong and Hangeul",
  "titleKo": "세종대왕과 한글",
  "country": "South Korea",
  "emoji": "👑",
  "color": "#a8842f",
  "cefr": "A0",
  "words": 81,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "hello-around-the-world",
  "title": "Hello Around the World",
  "titleKo": "세계의 인사말",
  "country": "France",
  "emoji": "👋",
  "color": "#2f8a8a",
  "cefr": "A0",
  "words": 70,
  "places": [
   "France",
   "Spain",
   "Japan",
   "China",
   "South Korea"
  ]
 },
 {
  "id": "recycling",
  "title": "Let's Recycle!",
  "titleKo": "분리배출을 해요!",
  "emoji": "♻️",
  "color": "#4f8a3c",
  "cefr": "A0",
  "words": 71,
  "places": []
 },
 {
  "id": "the-seven-continents",
  "title": "The Seven Continents",
  "titleKo": "일곱 대륙",
  "country": "South Korea",
  "emoji": "🗺️",
  "color": "#3f6fa8",
  "cefr": "A1",
  "words": 110,
  "places": [
   "South Korea",
   "Egypt",
   "Brazil",
   "Australia"
  ]
 },
 {
  "id": "how-plants-grow",
  "title": "How Plants Grow",
  "titleKo": "식물은 어떻게 자랄까",
  "emoji": "🌱",
  "color": "#2f8a6b",
  "cefr": "A1",
  "words": 106,
  "places": []
 },
 {
  "id": "the-sun-is-a-star",
  "title": "The Sun Is a Star",
  "titleKo": "태양은 별이에요",
  "emoji": "☀️",
  "color": "#2c3470",
  "cefr": "A1",
  "words": 124,
  "places": []
 },
 {
  "id": "the-great-wall-of-china",
  "title": "The Great Wall of China",
  "titleKo": "중국의 만리장성",
  "country": "China",
  "emoji": "🧱",
  "color": "#9a6a2f",
  "cefr": "A1",
  "words": 120,
  "places": [
   "China"
  ]
 },
 {
  "id": "halloween",
  "title": "Halloween",
  "titleKo": "핼러윈",
  "country": "Ireland",
  "emoji": "🎃",
  "color": "#c25a1c",
  "cefr": "A1",
  "words": 128,
  "places": [
   "Ireland",
   "United States",
   "United Kingdom"
  ]
 },
 {
  "id": "kimchi",
  "title": "The Story of Kimchi",
  "titleKo": "김치 이야기",
  "country": "South Korea",
  "emoji": "🥬",
  "color": "#c9722f",
  "cefr": "A1",
  "words": 113,
  "places": [
   "South Korea",
   "Mexico"
  ]
 },
 {
  "id": "the-bicycle",
  "title": "The First Bicycle",
  "titleKo": "최초의 자전거",
  "country": "Germany",
  "emoji": "🚲",
  "color": "#6b5aa8",
  "cefr": "A1",
  "words": 120,
  "places": [
   "Germany",
   "France",
   "United Kingdom"
  ]
 },
 {
  "id": "helen-keller",
  "title": "Helen Keller",
  "titleKo": "헬렌 켈러",
  "country": "United States",
  "emoji": "🤲",
  "color": "#a8842f",
  "cefr": "A1",
  "words": 119,
  "places": [
   "United States"
  ]
 },
 {
  "id": "cherry-blossoms-in-japan",
  "title": "Cherry Blossoms in Japan",
  "titleKo": "일본의 벚꽃",
  "country": "Japan",
  "emoji": "🌸",
  "color": "#c25a8a",
  "cefr": "A1",
  "words": 116,
  "places": [
   "Japan",
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "a-healthy-plate",
  "title": "A Healthy Plate",
  "titleKo": "건강한 한 접시",
  "emoji": "🥗",
  "color": "#4f8a3c",
  "cefr": "A1",
  "words": 117,
  "places": []
 },
 {
  "id": "how-time-zones-work",
  "title": "Why Is It Night in New York?",
  "titleKo": "왜 뉴욕은 지금 밤일까? 시간대 이야기",
  "country": "United Kingdom",
  "emoji": "🕰️",
  "color": "#3f6fa8",
  "cefr": "A2",
  "words": 166,
  "places": [
   "United Kingdom",
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "the-water-cycle",
  "title": "The Water Cycle",
  "titleKo": "물의 순환",
  "emoji": "💧",
  "color": "#2f8a6b",
  "cefr": "A2",
  "words": 154,
  "places": []
 },
 {
  "id": "our-solar-system",
  "title": "Our Solar System",
  "titleKo": "우리 태양계",
  "emoji": "🪐",
  "color": "#2c3470",
  "cefr": "A2",
  "words": 170,
  "places": []
 },
 {
  "id": "the-titanic",
  "title": "The Titanic",
  "titleKo": "타이태닉호",
  "country": "United Kingdom",
  "emoji": "🚢",
  "color": "#9a6a2f",
  "cefr": "A2",
  "words": 146,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "thanksgiving",
  "title": "Thanksgiving Day",
  "titleKo": "추수감사절",
  "country": "United States",
  "emoji": "🦃",
  "color": "#a8572f",
  "cefr": "A2",
  "words": 161,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "kimchi-food-and-sharing",
  "title": "Kimchi: Food and Sharing",
  "titleKo": "김치: 음식과 나눔",
  "country": "South Korea",
  "emoji": "🥬",
  "color": "#A83232",
  "cefr": "A2",
  "words": 155,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-story-of-chocolate",
  "title": "The Story of Chocolate",
  "titleKo": "초콜릿 이야기",
  "country": "Mexico",
  "emoji": "🍫",
  "color": "#7a4a2a",
  "cefr": "A2",
  "words": 163,
  "places": [
   "Mexico",
   "Spain",
   "Switzerland"
  ]
 },
 {
  "id": "the-telephone",
  "title": "\"Come Here, Watson!\" The First Telephone",
  "titleKo": "“왓슨, 이리 와요!” 최초의 전화",
  "country": "United States",
  "emoji": "☎️",
  "color": "#6b5aa8",
  "cefr": "A2",
  "words": 166,
  "places": [
   "United States",
   "United Kingdom",
   "Canada"
  ]
 },
 {
  "id": "marie-curie",
  "title": "Marie Curie",
  "titleKo": "마리 퀴리",
  "country": "Poland",
  "emoji": "⚗️",
  "color": "#a8842f",
  "cefr": "A2",
  "words": 151,
  "places": [
   "Poland",
   "France"
  ]
 },
 {
  "id": "the-olympic-games",
  "title": "The Olympic Games",
  "titleKo": "올림픽 이야기",
  "country": "Greece",
  "emoji": "🏅",
  "color": "#2f8a8a",
  "cefr": "A2",
  "words": 165,
  "places": [
   "Greece",
   "France",
   "South Korea"
  ]
 },
 {
  "id": "saving-energy-at-home",
  "title": "Be an Energy Hero",
  "titleKo": "에너지 지킴이가 되어요",
  "emoji": "💡",
  "color": "#4f8a3c",
  "cefr": "A2",
  "words": 156,
  "places": []
 },
 {
  "id": "driving-on-the-left",
  "title": "Why Do Some Countries Drive on the Left?",
  "titleKo": "왜 어떤 나라는 왼쪽으로 달릴까?",
  "country": "United Kingdom",
  "emoji": "🚗",
  "color": "#3f6fa8",
  "cefr": "B1",
  "words": 263,
  "places": [
   "United Kingdom",
   "Japan",
   "France",
   "United States"
  ]
 },
 {
  "id": "how-volcanoes-work",
  "title": "How Volcanoes Work",
  "titleKo": "화산의 원리",
  "country": "South Korea",
  "emoji": "🌋",
  "color": "#B71C1C",
  "cefr": "B1",
  "words": 207,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "why-is-the-sky-blue",
  "title": "Why Is the Sky Blue?",
  "titleKo": "하늘은 왜 파랄까?",
  "country": "United Kingdom",
  "emoji": "🌤️",
  "color": "#2f8a6b",
  "cefr": "B1",
  "words": 232,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-first-moon-landing",
  "title": "One Giant Leap: The First Moon Landing",
  "titleKo": "위대한 도약: 최초의 달 착륙",
  "country": "United States",
  "emoji": "🧑‍🚀",
  "color": "#2c3470",
  "cefr": "B1",
  "words": 217,
  "places": [
   "United States",
   "Russia"
  ]
 },
 {
  "id": "eiffel-tower",
  "title": "The Eiffel Tower",
  "titleKo": "에펠탑",
  "country": "France",
  "emoji": "🗼",
  "color": "#3E2723",
  "cefr": "B1",
  "words": 199,
  "places": [
   "France",
   "South Korea"
  ]
 },
 {
  "id": "the-silk-road",
  "title": "The Silk Road",
  "titleKo": "실크로드",
  "country": "China",
  "emoji": "🐫",
  "color": "#9a6a2f",
  "cefr": "B1",
  "words": 233,
  "places": [
   "China",
   "Iran",
   "Turkey",
   "Italy"
  ]
 },
 {
  "id": "chuseok-korean-harvest-festival",
  "title": "Chuseok: Korea's Harvest Festival",
  "titleKo": "추석: 한국의 수확 명절",
  "country": "South Korea",
  "emoji": "🌕",
  "color": "#1A237E",
  "cefr": "B1",
  "words": 209,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "guy-fawkes-night",
  "title": "Remember, Remember the Fifth of November",
  "titleKo": "11월 5일을 기억하라: 가이 포크스의 밤",
  "country": "United Kingdom",
  "emoji": "🎆",
  "color": "#7a2f5a",
  "cefr": "B1",
  "words": 239,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-potato-journey",
  "title": "The Potato's Long Journey",
  "titleKo": "감자의 긴 여행",
  "country": "Peru",
  "emoji": "🥔",
  "color": "#a8722f",
  "cefr": "B1",
  "words": 259,
  "places": [
   "Peru",
   "Spain",
   "Ireland",
   "Germany"
  ]
 },
 {
  "id": "the-printing-press",
  "title": "The Printing Press",
  "titleKo": "인쇄기, 세상을 바꾸다",
  "country": "Germany",
  "emoji": "📰",
  "color": "#6b5aa8",
  "cefr": "B1",
  "words": 242,
  "places": [
   "Germany",
   "South Korea",
   "China"
  ]
 },
 {
  "id": "martin-luther-king-jr",
  "title": "Martin Luther King Jr.: \"I Have a Dream\"",
  "titleKo": "마틴 루서 킹 주니어: “나에게는 꿈이 있습니다”",
  "country": "United States",
  "emoji": "✊",
  "color": "#a8842f",
  "cefr": "B1",
  "words": 226,
  "places": [
   "United States"
  ]
 },
 {
  "id": "day-of-the-dead",
  "title": "Mexico's Day of the Dead",
  "titleKo": "멕시코의 ‘죽은 자들의 날’",
  "country": "Mexico",
  "emoji": "💀",
  "color": "#2f8a8a",
  "cefr": "B1",
  "words": 246,
  "places": [
   "Mexico"
  ]
 },
 {
  "id": "climate-change",
  "title": "Our Warming Planet",
  "titleKo": "점점 더워지는 지구",
  "emoji": "🌡️",
  "color": "#4f8a3c",
  "cefr": "B1",
  "words": 267,
  "places": []
 },
 {
  "id": "crop-circles",
  "title": "Crop Circles",
  "titleKo": "미스터리 서클",
  "country": "United Kingdom",
  "emoji": "🌾",
  "color": "#6a6a2a",
  "cefr": "B2",
  "words": 379,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "figure-skating-scoring",
  "title": "Figure Skating Scoring",
  "titleKo": "피겨 스케이팅 채점",
  "country": "South Korea",
  "emoji": "⛸️",
  "color": "#2a5a7a",
  "cefr": "B2",
  "words": 367,
  "places": [
   "South Korea",
   "United States",
   "Canada"
  ]
 },
 {
  "id": "the-story-of-the-calendar",
  "title": "The Missing Ten Days: The Story of Our Calendar",
  "titleKo": "사라진 열흘: 달력 이야기",
  "country": "Italy",
  "emoji": "🗓️",
  "color": "#3f6fa8",
  "cefr": "B2",
  "words": 398,
  "places": [
   "Italy",
   "Egypt",
   "United Kingdom",
   "South Korea"
  ]
 },
 {
  "id": "diseases-and-the-immune-system",
  "title": "Diseases and the Immune System",
  "titleKo": "질병과 면역 체계",
  "emoji": "🛡️",
  "color": "#8a2a4a",
  "cefr": "B2",
  "words": 377,
  "places": []
 },
 {
  "id": "do-animals-dream",
  "title": "Do Animals Dream?",
  "titleKo": "동물도 꿈을 꿀까요?",
  "country": "France",
  "emoji": "💤",
  "color": "#4a3a7a",
  "cefr": "B2",
  "words": 388,
  "places": [
   "France"
  ]
 },
 {
  "id": "fresh-water-a-growing-crisis",
  "title": "Fresh Water: A Growing Crisis",
  "titleKo": "민물: 커져 가는 위기",
  "country": "South Africa",
  "emoji": "💧",
  "color": "#1f5f8b",
  "cefr": "B2",
  "words": 361,
  "places": [
   "South Africa",
   "South Korea"
  ]
 },
 {
  "id": "going-carbon-neutral",
  "title": "Going Carbon Neutral",
  "titleKo": "탄소 중립을 향해",
  "country": "South Korea",
  "emoji": "🌍",
  "color": "#2f7a5b",
  "cefr": "B2",
  "words": 374,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "heat-islands",
  "title": "Heat Islands",
  "titleKo": "열섬",
  "emoji": "🏙️",
  "color": "#9a4a1f",
  "cefr": "B2",
  "words": 365,
  "places": []
 },
 {
  "id": "how-vaccines-work",
  "title": "Training the Body's Army: How Vaccines Work",
  "titleKo": "몸의 군대를 훈련하다: 백신의 원리",
  "country": "United Kingdom",
  "emoji": "💉",
  "color": "#2f8a6b",
  "cefr": "B2",
  "words": 382,
  "places": [
   "United Kingdom",
   "France"
  ]
 },
 {
  "id": "newtons-laws-of-motion",
  "title": "Newton's Laws of Motion",
  "titleKo": "뉴턴의 운동 법칙",
  "country": "United Kingdom",
  "emoji": "🚀",
  "color": "#2a4a7a",
  "cefr": "B2",
  "words": 372,
  "places": [
   "United Kingdom",
   "South Korea"
  ]
 },
 {
  "id": "replanting-the-worlds-forests",
  "title": "Replanting the World's Forests",
  "titleKo": "세계의 숲 되살리기",
  "country": "China",
  "emoji": "🌳",
  "color": "#2f6b3a",
  "cefr": "B2",
  "words": 376,
  "places": [
   "China",
   "South Korea"
  ]
 },
 {
  "id": "survival-of-the-fittest",
  "title": "Survival of the Fittest",
  "titleKo": "적자생존",
  "country": "United Kingdom",
  "emoji": "🦎",
  "color": "#4a6a2a",
  "cefr": "B2",
  "words": 374,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-placebo-effect",
  "title": "The Placebo Effect",
  "titleKo": "플라세보 효과",
  "emoji": "💊",
  "color": "#5a3a7a",
  "cefr": "B2",
  "words": 373,
  "places": []
 },
 {
  "id": "the-power-of-instinct",
  "title": "The Power of Instinct",
  "titleKo": "본능의 힘",
  "emoji": "🐾",
  "color": "#6a4a2a",
  "cefr": "B2",
  "words": 385,
  "places": []
 },
 {
  "id": "the-power-of-music",
  "title": "The Power of Music",
  "titleKo": "음악의 힘",
  "country": "South Korea",
  "emoji": "🎵",
  "color": "#6a2a6a",
  "cefr": "B2",
  "words": 379,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "vision-and-color",
  "title": "Vision and Color",
  "titleKo": "시각과 색",
  "emoji": "👁️",
  "color": "#3a5a8a",
  "cefr": "B2",
  "words": 382,
  "places": []
 },
 {
  "id": "yellow-dust-storms",
  "title": "Yellow Dust Storms",
  "titleKo": "황사",
  "country": "South Korea",
  "emoji": "🌪️",
  "color": "#8a6a1f",
  "cefr": "B2",
  "words": 390,
  "places": [
   "South Korea",
   "Mongolia",
   "China",
   "Japan"
  ]
 },
 {
  "id": "black-holes",
  "title": "Black Holes: Where Light Cannot Escape",
  "titleKo": "블랙홀: 빛도 빠져나올 수 없는 곳",
  "emoji": "🕳️",
  "color": "#1c1f4a",
  "cefr": "B2",
  "words": 379,
  "places": []
 },
 {
  "id": "space-colonies",
  "title": "Space Colonies",
  "titleKo": "우주 식민지",
  "emoji": "🪐",
  "color": "#2c3470",
  "cefr": "B2",
  "words": 361,
  "places": []
 },
 {
  "id": "conquistadors",
  "title": "Conquistadors",
  "titleKo": "콘키스타도르",
  "country": "Spain",
  "emoji": "⚔️",
  "color": "#6a3a1a",
  "cefr": "B2",
  "words": 366,
  "places": [
   "Spain",
   "Mexico",
   "Peru"
  ]
 },
 {
  "id": "derinkuyu-underground-city",
  "title": "Derinkuyu Underground City",
  "titleKo": "데린쿠유 지하 도시",
  "country": "Turkey",
  "emoji": "🕳️",
  "color": "#5a4a3a",
  "cefr": "B2",
  "words": 363,
  "places": [
   "Turkey"
  ]
 },
 {
  "id": "egypts-golden-age",
  "title": "Egypt's Golden Age",
  "titleKo": "이집트의 황금기",
  "country": "Egypt",
  "emoji": "🏺",
  "color": "#8a6a1a",
  "cefr": "B2",
  "words": 380,
  "places": [
   "Egypt"
  ]
 },
 {
  "id": "fighting-for-womens-rights",
  "title": "Fighting for Women's Rights",
  "titleKo": "여성의 권리를 위한 투쟁",
  "country": "United Kingdom",
  "emoji": "✊",
  "color": "#7a2a5a",
  "cefr": "B2",
  "words": 369,
  "places": [
   "United Kingdom",
   "New Zealand",
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "pompeii",
  "title": "Pompeii",
  "titleKo": "폼페이",
  "country": "Italy",
  "emoji": "🌋",
  "color": "#8a3b2a",
  "cefr": "B2",
  "words": 378,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "roman-citizenship",
  "title": "Roman Citizenship",
  "titleKo": "로마 시민권",
  "country": "Italy",
  "emoji": "🏛️",
  "color": "#7a2a2a",
  "cefr": "B2",
  "words": 368,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "saving-the-last-supper",
  "title": "Saving The Last Supper",
  "titleKo": "「최후의 만찬」 구하기",
  "country": "Italy",
  "emoji": "🖌️",
  "color": "#6a4a3a",
  "cefr": "B2",
  "words": 359,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "the-battle-of-gettysburg",
  "title": "The Battle of Gettysburg",
  "titleKo": "게티즈버그 전투",
  "country": "United States",
  "emoji": "🎖️",
  "color": "#3a3a5a",
  "cefr": "B2",
  "words": 371,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-fall-of-the-berlin-wall",
  "title": "The Night the Berlin Wall Fell",
  "titleKo": "베를린 장벽이 무너진 밤",
  "country": "Germany",
  "emoji": "🧱",
  "color": "#7a6a5a",
  "cefr": "B2",
  "words": 358,
  "places": [
   "Germany",
   "Russia",
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "the-plight-of-the-bison",
  "title": "The Plight of the Bison",
  "titleKo": "위기에 처한 들소",
  "country": "United States",
  "emoji": "🦬",
  "color": "#6b4423",
  "cefr": "B2",
  "words": 355,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-true-story-of-dracula",
  "title": "The True Story of Dracula",
  "titleKo": "드라큘라의 진짜 이야기",
  "country": "Romania",
  "emoji": "🧛",
  "color": "#4a1a2a",
  "cefr": "B2",
  "words": 362,
  "places": [
   "Romania"
  ]
 },
 {
  "id": "remembrance-day",
  "title": "Red Poppies: Remembrance Day",
  "titleKo": "붉은 양귀비: 영령 기념일",
  "country": "United Kingdom",
  "emoji": "🌺",
  "color": "#a8322f",
  "cefr": "B2",
  "words": 365,
  "places": [
   "United Kingdom",
   "Canada",
   "Belgium",
   "Australia"
  ]
 },
 {
  "id": "tea-from-china-to-the-world",
  "title": "A Leaf That Changed the World: The Story of Tea",
  "titleKo": "세상을 바꾼 잎: 차 이야기",
  "country": "China",
  "emoji": "🍵",
  "color": "#c9722f",
  "cefr": "B2",
  "words": 406,
  "places": [
   "China",
   "United Kingdom",
   "India",
   "Japan"
  ]
 },
 {
  "id": "artificial-intelligence",
  "title": "Artificial Intelligence",
  "titleKo": "인공 지능",
  "country": "South Korea",
  "emoji": "🤖",
  "color": "#2a3a5a",
  "cefr": "B2",
  "words": 367,
  "places": [
   "South Korea",
   "United States"
  ]
 },
 {
  "id": "chocolate-may-power-cars",
  "title": "Chocolate May Power Cars",
  "titleKo": "초콜릿이 자동차를 움직일 수도 있어요",
  "country": "United Kingdom",
  "emoji": "🍫",
  "color": "#5a3a22",
  "cefr": "B2",
  "words": 383,
  "places": [
   "United Kingdom",
   "Brazil"
  ]
 },
 {
  "id": "the-internet",
  "title": "A Web Around the World: The Story of the Internet",
  "titleKo": "세계를 잇는 그물: 인터넷 이야기",
  "country": "United States",
  "emoji": "🌐",
  "color": "#6b5aa8",
  "cefr": "B2",
  "words": 380,
  "places": [
   "United States",
   "Switzerland",
   "United Kingdom",
   "South Korea"
  ]
 },
 {
  "id": "the-rotating-skyscraper",
  "title": "The Rotating Skyscraper",
  "titleKo": "회전하는 고층 빌딩",
  "country": "Brazil",
  "emoji": "🏢",
  "color": "#3a4a5a",
  "cefr": "B2",
  "words": 370,
  "places": [
   "Brazil"
  ]
 },
 {
  "id": "the-war-of-currents",
  "title": "The War of Currents",
  "titleKo": "전류 전쟁",
  "country": "United States",
  "emoji": "⚡",
  "color": "#6a5a1a",
  "cefr": "B2",
  "words": 364,
  "places": [
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "ernest-shackleton",
  "title": "Ernest Shackleton",
  "titleKo": "어니스트 섀클턴",
  "country": "United Kingdom",
  "emoji": "🧭",
  "color": "#2a4a6a",
  "cefr": "B2",
  "words": 382,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "nelson-mandela",
  "title": "Nelson Mandela: The Long Walk to Freedom",
  "titleKo": "넬슨 만델라: 자유를 향한 긴 여정",
  "country": "South Africa",
  "emoji": "✊",
  "color": "#a8842f",
  "cefr": "B2",
  "words": 395,
  "places": [
   "South Africa"
  ]
 },
 {
  "id": "english-a-world-language",
  "title": "How English Became a World Language",
  "titleKo": "영어는 어떻게 세계의 언어가 되었을까",
  "country": "United Kingdom",
  "emoji": "🗣️",
  "color": "#2f8a8a",
  "cefr": "B2",
  "words": 376,
  "places": [
   "United Kingdom",
   "United States",
   "India",
   "South Korea"
  ]
 },
 {
  "id": "from-baroque-to-pop-art",
  "title": "From Baroque to Pop Art",
  "titleKo": "바로크에서 팝 아트까지",
  "country": "France",
  "emoji": "🖼️",
  "color": "#7a3a5a",
  "cefr": "B2",
  "words": 375,
  "places": [
   "France",
   "United Kingdom",
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "greek-myths-in-english-words",
  "title": "Greek Myths in English Words",
  "titleKo": "영어 단어 속 그리스 신화",
  "country": "Greece",
  "emoji": "📜",
  "color": "#3a4a8a",
  "cefr": "B2",
  "words": 380,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "hanji-and-ikebana",
  "title": "Hanji and Ikebana",
  "titleKo": "한지와 이케바나",
  "country": "South Korea",
  "emoji": "🌸",
  "color": "#8a3a4a",
  "cefr": "B2",
  "words": 382,
  "places": [
   "South Korea",
   "Japan"
  ]
 },
 {
  "id": "language-change",
  "title": "Language Change",
  "titleKo": "언어의 변화",
  "country": "United Kingdom",
  "emoji": "🗣️",
  "color": "#4a5a2a",
  "cefr": "B2",
  "words": 376,
  "places": [
   "United Kingdom",
   "France",
   "South Korea"
  ]
 },
 {
  "id": "native-american-art",
  "title": "Native American Art",
  "titleKo": "아메리카 원주민의 예술",
  "country": "United States",
  "emoji": "🎨",
  "color": "#8a4a2a",
  "cefr": "B2",
  "words": 362,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-indigenous-peoples-games",
  "title": "The Indigenous People's Games",
  "titleKo": "세계 원주민 경기 대회",
  "country": "Brazil",
  "emoji": "🏹",
  "color": "#7a4a2a",
  "cefr": "B2",
  "words": 372,
  "places": [
   "Brazil",
   "Canada"
  ]
 },
 {
  "id": "checking-fake-news",
  "title": "Is It True? How to Spot Fake News",
  "titleKo": "정말일까? 가짜 뉴스 가려내기",
  "emoji": "📰",
  "color": "#4f8a3c",
  "cefr": "B2",
  "words": 399,
  "places": []
 }
];
