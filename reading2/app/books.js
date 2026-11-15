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
  "id": "antarctica",
  "title": "Antarctica",
  "titleKo": "남극 대륙",
  "country": "South Korea",
  "emoji": "🧊",
  "color": "#2a5a7a",
  "cefr": "B1",
  "words": 242,
  "places": [
   "South Korea"
  ]
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
  "id": "the-loch-ness-monster",
  "title": "The Loch Ness Monster",
  "titleKo": "네스호의 괴물",
  "country": "United Kingdom",
  "emoji": "🦕",
  "color": "#2a5a4a",
  "cefr": "B1",
  "words": 253,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "butterfly-bluff",
  "title": "Butterfly Bluff",
  "titleKo": "나비의 속임수",
  "emoji": "🦋",
  "color": "#7a3a6a",
  "cefr": "B1",
  "words": 236,
  "places": []
 },
 {
  "id": "color-and-mood",
  "title": "Color and Mood",
  "titleKo": "색깔과 기분",
  "country": "South Korea",
  "emoji": "🎨",
  "color": "#5a3a7a",
  "cefr": "B1",
  "words": 249,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "dodo-birds",
  "title": "Dodo Birds",
  "titleKo": "도도새",
  "emoji": "🦤",
  "color": "#6a5a3a",
  "cefr": "B1",
  "words": 243,
  "places": []
 },
 {
  "id": "el-ni-o",
  "title": "El Niño",
  "titleKo": "엘니뇨",
  "country": "Peru",
  "emoji": "🌡️",
  "color": "#8a4a1f",
  "cefr": "B1",
  "words": 221,
  "places": [
   "Peru",
   "Spain",
   "Australia",
   "Indonesia"
  ]
 },
 {
  "id": "groundwater",
  "title": "Groundwater",
  "titleKo": "지하수",
  "emoji": "💧",
  "color": "#1f5f8b",
  "cefr": "B1",
  "words": 234,
  "places": []
 },
 {
  "id": "how-tsunamis-are-made",
  "title": "How Tsunamis Are Made",
  "titleKo": "쓰나미는 어떻게 만들어질까요?",
  "country": "Japan",
  "emoji": "🌊",
  "color": "#1f4f7a",
  "cefr": "B1",
  "words": 229,
  "places": [
   "Japan"
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
  "id": "koko-the-gorilla",
  "title": "Koko the Gorilla",
  "titleKo": "고릴라 코코",
  "emoji": "🦍",
  "color": "#4a4a3a",
  "cefr": "B1",
  "words": 226,
  "places": []
 },
 {
  "id": "muscles-in-our-body",
  "title": "Muscles in Our Body",
  "titleKo": "우리 몸의 근육",
  "emoji": "💪",
  "color": "#8a2a3a",
  "cefr": "B1",
  "words": 235,
  "places": []
 },
 {
  "id": "our-internal-clock",
  "title": "Our Internal Clock",
  "titleKo": "우리 몸속의 시계",
  "emoji": "⏰",
  "color": "#3a3a6a",
  "cefr": "B1",
  "words": 243,
  "places": []
 },
 {
  "id": "rainforests",
  "title": "Rainforests",
  "titleKo": "열대우림",
  "emoji": "🌴",
  "color": "#2f6b3a",
  "cefr": "B1",
  "words": 237,
  "places": []
 },
 {
  "id": "the-marshmallow-test",
  "title": "The Marshmallow Test",
  "titleKo": "마시멜로 실험",
  "emoji": "🍡",
  "color": "#7a3a5a",
  "cefr": "B1",
  "words": 230,
  "places": []
 },
 {
  "id": "the-speed-of-sound",
  "title": "The Speed of Sound",
  "titleKo": "소리의 속도",
  "emoji": "🔊",
  "color": "#2a4a7a",
  "cefr": "B1",
  "words": 248,
  "places": []
 },
 {
  "id": "whale-and-dolphin-communication",
  "title": "Whale and Dolphin Communication",
  "titleKo": "고래와 돌고래의 의사소통",
  "emoji": "🐬",
  "color": "#1f5a7a",
  "cefr": "B1",
  "words": 242,
  "places": []
 },
 {
  "id": "what-we-can-learn-from-fossils",
  "title": "What We Can Learn from Fossils",
  "titleKo": "화석에서 배울 수 있는 것",
  "country": "South Korea",
  "emoji": "🦴",
  "color": "#6b5233",
  "cefr": "B1",
  "words": 238,
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
  "id": "body-changes-in-space",
  "title": "Body Changes in Space",
  "titleKo": "우주에서의 몸의 변화",
  "emoji": "🧑‍🚀",
  "color": "#2c3470",
  "cefr": "B1",
  "words": 230,
  "places": []
 },
 {
  "id": "telescope-on-the-moon",
  "title": "Telescope on the Moon",
  "titleKo": "달 위의 망원경",
  "emoji": "🔭",
  "color": "#2a2f5e",
  "cefr": "B1",
  "words": 226,
  "places": []
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
  "id": "art-contests-at-the-olympics",
  "title": "Art Contests at the Olympics",
  "titleKo": "올림픽의 예술 경기",
  "country": "Greece",
  "emoji": "🏅",
  "color": "#7a5a1a",
  "cefr": "B1",
  "words": 232,
  "places": [
   "Greece"
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
  "id": "stonehenge",
  "title": "Stonehenge",
  "titleKo": "스톤헨지",
  "country": "United Kingdom",
  "emoji": "🪨",
  "color": "#5a5a4a",
  "cefr": "B1",
  "words": 236,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-age-of-exploration",
  "title": "The Age of Exploration",
  "titleKo": "탐험의 시대",
  "country": "Portugal",
  "emoji": "⛵",
  "color": "#2a4a6a",
  "cefr": "B1",
  "words": 235,
  "places": [
   "Portugal",
   "Spain",
   "India",
   "South Korea"
  ]
 },
 {
  "id": "the-boy-king",
  "title": "The Boy King",
  "titleKo": "소년 왕",
  "country": "Egypt",
  "emoji": "👑",
  "color": "#8a6a1a",
  "cefr": "B1",
  "words": 220,
  "places": [
   "Egypt",
   "United Kingdom"
  ]
 },
 {
  "id": "the-civil-rights-movement",
  "title": "The Civil Rights Movement",
  "titleKo": "민권 운동",
  "country": "United States",
  "emoji": "✊",
  "color": "#5a2a4a",
  "cefr": "B1",
  "words": 234,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-founding-of-rome",
  "title": "The Founding of Rome",
  "titleKo": "로마의 건국",
  "country": "Italy",
  "emoji": "🐺",
  "color": "#7a2a2a",
  "cefr": "B1",
  "words": 242,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "the-lost-colony-of-roanoke",
  "title": "The Lost Colony of Roanoke",
  "titleKo": "사라진 로어노크 식민지",
  "country": "United States",
  "emoji": "🏝️",
  "color": "#4a3a2a",
  "cefr": "B1",
  "words": 243,
  "places": [
   "United States",
   "United Kingdom"
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
  "id": "the-worst-jobs-in-history",
  "title": "The Worst Jobs in History",
  "titleKo": "역사상 최악의 직업",
  "country": "United Kingdom",
  "emoji": "🧹",
  "color": "#5a4a3a",
  "cefr": "B1",
  "words": 218,
  "places": [
   "United Kingdom"
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
  "id": "diwali",
  "title": "Diwali",
  "titleKo": "디왈리",
  "country": "India",
  "emoji": "🪔",
  "color": "#8a5a1a",
  "cefr": "B1",
  "words": 232,
  "places": [
   "India"
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
  "id": "holi",
  "title": "Holi",
  "titleKo": "홀리 축제",
  "country": "India",
  "emoji": "🎨",
  "color": "#a3335a",
  "cefr": "B1",
  "words": 218,
  "places": [
   "India"
  ]
 },
 {
  "id": "las-fallas",
  "title": "Las Fallas",
  "titleKo": "라스 파야스",
  "country": "Spain",
  "emoji": "🔥",
  "color": "#a3431f",
  "cefr": "B1",
  "words": 253,
  "places": [
   "Spain"
  ]
 },
 {
  "id": "new-years-food-around-the-world",
  "title": "New Year's Food Around the World",
  "titleKo": "세계의 새해 음식",
  "country": "South Korea",
  "emoji": "🍇",
  "color": "#6a2a4a",
  "cefr": "B1",
  "words": 224,
  "places": [
   "South Korea",
   "Spain",
   "Japan",
   "China",
   "Greece"
  ]
 },
 {
  "id": "can-gum-make-you-smarter",
  "title": "Can Gum Make You Smarter?",
  "titleKo": "껌을 씹으면 더 똑똑해질까요?",
  "country": "Denmark",
  "emoji": "🍬",
  "color": "#7a3a5a",
  "cefr": "B1",
  "words": 234,
  "places": [
   "Denmark",
   "United States"
  ]
 },
 {
  "id": "coffeehouses-in-history",
  "title": "Coffeehouses in History",
  "titleKo": "역사 속의 커피하우스",
  "country": "Ethiopia",
  "emoji": "☕",
  "color": "#5a3a22",
  "cefr": "B1",
  "words": 226,
  "places": [
   "Ethiopia",
   "United Kingdom",
   "South Korea"
  ]
 },
 {
  "id": "love-apples",
  "title": "Love Apples",
  "titleKo": "사랑의 사과",
  "country": "Mexico",
  "emoji": "🍅",
  "color": "#a33a2a",
  "cefr": "B1",
  "words": 229,
  "places": [
   "Mexico",
   "Spain",
   "France",
   "Italy",
   "South Korea"
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
  "id": "edisons-invention-factory",
  "title": "Edison's Invention Factory",
  "titleKo": "에디슨의 발명 공장",
  "country": "United States",
  "emoji": "💡",
  "color": "#6a5a1a",
  "cefr": "B1",
  "words": 235,
  "places": [
   "United States"
  ]
 },
 {
  "id": "high-speed-trains",
  "title": "High-Speed Trains",
  "titleKo": "고속 열차",
  "country": "Japan",
  "emoji": "🚄",
  "color": "#2a4a6a",
  "cefr": "B1",
  "words": 245,
  "places": [
   "Japan",
   "France",
   "China",
   "South Korea"
  ]
 },
 {
  "id": "taipei-101",
  "title": "Taipei 101",
  "titleKo": "타이베이 101",
  "emoji": "🏙️",
  "color": "#3a4a5a",
  "cefr": "B1",
  "words": 230,
  "places": []
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
  "id": "abraham-lincoln",
  "title": "Abraham Lincoln",
  "titleKo": "에이브러햄 링컨",
  "country": "United States",
  "emoji": "🎩",
  "color": "#3a3a4a",
  "cefr": "B1",
  "words": 252,
  "places": [
   "United States"
  ]
 },
 {
  "id": "charles-darwin",
  "title": "Charles Darwin",
  "titleKo": "찰스 다윈",
  "country": "United Kingdom",
  "emoji": "🐢",
  "color": "#4a6a2a",
  "cefr": "B1",
  "words": 218,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "isaac-newton",
  "title": "Isaac Newton",
  "titleKo": "아이작 뉴턴",
  "country": "United Kingdom",
  "emoji": "🍎",
  "color": "#7a2a2a",
  "cefr": "B1",
  "words": 233,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "marie-curie-b1",
  "title": "Marie Curie",
  "titleKo": "마리 퀴리",
  "country": "Poland",
  "emoji": "⚗️",
  "color": "#4a3a7a",
  "cefr": "B1",
  "words": 238,
  "places": [
   "Poland",
   "France"
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
  "id": "pocahontas",
  "title": "Pocahontas",
  "titleKo": "포카혼타스",
  "country": "United States",
  "emoji": "🪶",
  "color": "#7a4a2a",
  "cefr": "B1",
  "words": 236,
  "places": [
   "United States",
   "United Kingdom"
  ]
 },
 {
  "id": "bhutan-and-gross-national-happiness",
  "title": "Bhutan and Gross National Happiness",
  "titleKo": "부탄과 국민총행복",
  "emoji": "🏔️",
  "color": "#2a5a4a",
  "cefr": "B1",
  "words": 243,
  "places": []
 },
 {
  "id": "british-vs-american-english",
  "title": "British vs. American English",
  "titleKo": "영국 영어와 미국 영어",
  "country": "United Kingdom",
  "emoji": "🇬🇧",
  "color": "#2a3a6a",
  "cefr": "B1",
  "words": 220,
  "places": [
   "United Kingdom",
   "United States",
   "South Korea"
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
  "id": "el-sistema",
  "title": "El Sistema",
  "titleKo": "엘 시스테마",
  "country": "United States",
  "emoji": "🎻",
  "color": "#7a3a2a",
  "cefr": "B1",
  "words": 233,
  "places": [
   "United States",
   "South Korea"
  ]
 },
 {
  "id": "hangul-and-the-fashion-world",
  "title": "Hangul and the Fashion World",
  "titleKo": "한글과 패션 세계",
  "country": "South Korea",
  "emoji": "👗",
  "color": "#6a2a4a",
  "cefr": "B1",
  "words": 252,
  "places": [
   "South Korea",
   "China"
  ]
 },
 {
  "id": "junk-art-and-urban-mining",
  "title": "Junk Art and Urban Mining",
  "titleKo": "정크 아트와 도시 광산",
  "country": "United States",
  "emoji": "♻️",
  "color": "#3a6a3a",
  "cefr": "B1",
  "words": 244,
  "places": [
   "United States",
   "Japan"
  ]
 },
 {
  "id": "monet-and-impressionism",
  "title": "Monet and Impressionism",
  "titleKo": "모네와 인상주의",
  "country": "France",
  "emoji": "🖼️",
  "color": "#3a5a7a",
  "cefr": "B1",
  "words": 231,
  "places": [
   "France"
  ]
 },
 {
  "id": "odin",
  "title": "Odin",
  "titleKo": "오딘",
  "country": "Norway",
  "emoji": "🪓",
  "color": "#3a4a5a",
  "cefr": "B1",
  "words": 240,
  "places": [
   "Norway",
   "Sweden",
   "Denmark"
  ]
 },
 {
  "id": "same-gods-different-names",
  "title": "Same Gods, Different Names",
  "titleKo": "같은 신, 다른 이름",
  "country": "Greece",
  "emoji": "⚡",
  "color": "#3a4a8a",
  "cefr": "B1",
  "words": 230,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "superstitions-in-various-cultures",
  "title": "Superstitions in Various Cultures",
  "titleKo": "여러 문화의 미신",
  "country": "South Korea",
  "emoji": "🍀",
  "color": "#2a6a3a",
  "cefr": "B1",
  "words": 230,
  "places": [
   "South Korea",
   "Japan",
   "Italy"
  ]
 },
 {
  "id": "the-tour-de-france",
  "title": "The Tour de France",
  "titleKo": "투르 드 프랑스",
  "country": "France",
  "emoji": "🚴",
  "color": "#a3431f",
  "cefr": "B1",
  "words": 228,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-voice-of-the-mona-lisa",
  "title": "The Voice of the Mona Lisa",
  "titleKo": "모나리자의 목소리",
  "country": "Italy",
  "emoji": "🖌️",
  "color": "#6a4a3a",
  "cefr": "B1",
  "words": 238,
  "places": [
   "Italy",
   "Japan"
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
  "id": "smartphone-addiction",
  "title": "Smartphone Addiction",
  "titleKo": "스마트폰 중독",
  "country": "South Korea",
  "emoji": "📱",
  "color": "#2a3a5a",
  "cefr": "B1",
  "words": 245,
  "places": [
   "South Korea",
   "France"
  ]
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
