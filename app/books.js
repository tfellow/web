// 책 목록(카탈로그). 새 작품은 여기에 한 줄 추가하고, 본문은 books/<id>.js 에 넣어요.
// cefr 는 A1 / A2 / B1 / B2 / C1 중 하나. Supabase 의 books / quiz_questions 에도 같은 id 로 등록해요.
// places: 여권 도장 후보 나라. 첫 번째가 작가 나라(기본값), 나머지는 배경·관련 나라. Supabase books.places 와 같게 맞춰요.
window.BOOKS = [
 {
  "id": "unbearable-lightness",
  "title": "The Unbearable Lightness of Being",
  "titleKo": "참을 수 없는 존재의 가벼움",
  "author": "Milan Kundera",
  "authorKo": "밀란 쿤데라",
  "country": "Czechoslovakia",
  "emoji": "🪶",
  "color": "#7c6bb0",
  "cefr": "B1",
  "lexile": "750L",
  "ar": "4.5",
  "words": 391,
  "places": [
   "Czechoslovakia",
   "Switzerland"
  ]
 },
 {
  "id": "tuesdays-with-morrie",
  "title": "Tuesdays with Morrie",
  "titleKo": "모리와 함께한 화요일",
  "author": "Mitch Albom",
  "authorKo": "미치 앨봄",
  "country": "United States",
  "emoji": "🍂",
  "color": "#c9722f",
  "cefr": "B1",
  "lexile": "830L",
  "ar": "5.5",
  "words": 367,
  "places": [
   "United States"
  ]
 },
 {
  "id": "dr-jekyll-and-mr-hyde",
  "title": "Dr. Jekyll and Mr. Hyde",
  "titleKo": "지킬 박사와 하이드",
  "author": "Robert Louis Stevenson",
  "authorKo": "로버트 루이스 스티븐슨",
  "country": "United Kingdom",
  "emoji": "🧪",
  "color": "#3f7a6b",
  "cefr": "A2",
  "cefrLabel": "A2 - B1",
  "lexile": "640L",
  "ar": "3.8",
  "words": 226,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "journey-to-the-center-of-the-earth",
  "title": "Journey to the Center of the Earth",
  "titleKo": "지구 속 여행",
  "author": "Jules Verne",
  "authorKo": "쥘 베른",
  "country": "France",
  "emoji": "🌋",
  "color": "#a8452f",
  "cefr": "B1",
  "lexile": "약 1100L",
  "ar": "약 7.0",
  "words": 316,
  "places": [
   "France",
   "Iceland",
   "Germany",
   "Italy"
  ]
 },
 {
  "id": "night-on-the-galactic-railroad",
  "title": "Night on the Galactic Railroad",
  "titleKo": "은하철도의 밤",
  "author": "Kenji Miyazawa",
  "authorKo": "미야자와 겐지",
  "country": "Japan",
  "emoji": "🚂",
  "color": "#2f3f7a",
  "cefr": "B1",
  "lexile": "약 900L",
  "ar": "약 5.5",
  "words": 340,
  "places": [
   "Japan"
  ]
 },
 {
  "id": "the-little-prince",
  "title": "The Little Prince",
  "titleKo": "어린 왕자",
  "author": "Antoine de Saint-Exupéry",
  "authorKo": "앙투안 드 생텍쥐페리",
  "country": "France",
  "emoji": "🌹",
  "color": "#c4882b",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 159,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-tortoise-and-the-hare",
  "title": "The Tortoise and the Hare",
  "titleKo": "토끼와 거북",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐢",
  "color": "#5f8a4a",
  "cefr": "A1",
  "lexile": "약 300L",
  "words": 157,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-ant-and-the-grasshopper",
  "title": "The Ant and the Grasshopper",
  "titleKo": "개미와 베짱이",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐜",
  "color": "#8a6d3b",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 159,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-boy-who-cried-wolf",
  "title": "The Boy Who Cried Wolf",
  "titleKo": "양치기 소년",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐺",
  "color": "#5d6b7d",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 162,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-north-wind-and-the-sun",
  "title": "The North Wind and the Sun",
  "titleKo": "북풍과 태양",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "☀️",
  "color": "#c98a2a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 159,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-town-mouse-and-the-country-mouse",
  "title": "The Town Mouse and the Country Mouse",
  "titleKo": "시골 쥐와 도시 쥐",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐭",
  "color": "#9a6a8a",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 166,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-fox-and-the-grapes",
  "title": "The Fox and the Grapes",
  "titleKo": "여우와 신 포도",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🍇",
  "color": "#6a4a8a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 160,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-goose-that-laid-the-golden-eggs",
  "title": "The Goose That Laid the Golden Eggs",
  "titleKo": "황금알을 낳는 거위",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🥚",
  "color": "#b08a24",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 170,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-crow-and-the-pitcher",
  "title": "The Crow and the Pitcher",
  "titleKo": "까마귀와 물병",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐦",
  "color": "#3d4f6b",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 160,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-fox-and-the-stork",
  "title": "The Fox and the Stork",
  "titleKo": "여우와 두루미",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦊",
  "color": "#b5602a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 163,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-lion-and-the-mouse",
  "title": "The Lion and the Mouse",
  "titleKo": "사자와 생쥐",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦁",
  "color": "#a8742f",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 167,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-honest-woodcutter",
  "title": "The Honest Woodcutter",
  "titleKo": "정직한 나무꾼",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🪓",
  "color": "#6b5a3a",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 172,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "belling-the-cat",
  "title": "Belling the Cat",
  "titleKo": "고양이 목에 방울 달기",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🔔",
  "color": "#7a6e9a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 172,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-wolf-and-the-crane",
  "title": "The Wolf and the Crane",
  "titleKo": "늑대와 두루미",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦴",
  "color": "#4f6a7a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 164,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-frog-and-the-ox",
  "title": "The Frog and the Ox",
  "titleKo": "개구리와 황소",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐸",
  "color": "#4f8a5b",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 152,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-ant-and-the-dove",
  "title": "The Ant and the Dove",
  "titleKo": "개미와 비둘기",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🕊️",
  "color": "#4a7aa0",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 166,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-father-his-son-and-their-donkey",
  "title": "The Father, His Son, and Their Donkey",
  "titleKo": "당나귀를 팔러 간 아버지와 아들",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐴",
  "color": "#8a7a5a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 162,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-donkey-in-the-lions-skin",
  "title": "The Donkey in the Lion’s Skin",
  "titleKo": "사자 가죽을 쓴 당나귀",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🎭",
  "color": "#9a7b3a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 162,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "thumbelina",
  "title": "Thumbelina",
  "titleKo": "엄지 공주",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "🌷",
  "color": "#c46a8a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 168,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "the-little-match-girl",
  "title": "The Little Match Girl",
  "titleKo": "성냥팔이 소녀",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "🕯️",
  "color": "#6a4058",
  "cefr": "A1",
  "lexile": "약 370L",
  "words": 168,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "the-ugly-duckling",
  "title": "The Ugly Duckling",
  "titleKo": "미운 오리 새끼",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "🦢",
  "color": "#5a8aa8",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 161,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "the-gift-of-the-magi",
  "title": "The Gift of the Magi",
  "titleKo": "크리스마스 선물",
  "author": "O. Henry",
  "authorKo": "오 헨리",
  "country": "United States",
  "emoji": "🎁",
  "color": "#8a3a4a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 169,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-last-leaf",
  "title": "The Last Leaf",
  "titleKo": "마지막 잎새",
  "author": "O. Henry",
  "authorKo": "오 헨리",
  "country": "United States",
  "emoji": "🍃",
  "color": "#6a7a3a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 164,
  "places": [
   "United States"
  ]
 },
 {
  "id": "after-twenty-years",
  "title": "After Twenty Years",
  "titleKo": "20년 후",
  "author": "O. Henry",
  "authorKo": "오 헨리",
  "country": "United States",
  "emoji": "🌃",
  "color": "#3d4a6b",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 175,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-cop-and-the-anthem",
  "title": "The Cop and the Anthem",
  "titleKo": "경찰관과 찬송가",
  "author": "O. Henry",
  "authorKo": "오 헨리",
  "country": "United States",
  "emoji": "🎵",
  "color": "#5a5a8a",
  "cefr": "A1",
  "lexile": "약 370L",
  "words": 165,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-ransom-of-red-chief",
  "title": "The Ransom of Red Chief",
  "titleKo": "붉은 추장의 몸값",
  "author": "O. Henry",
  "authorKo": "오 헨리",
  "country": "United States",
  "emoji": "🏕️",
  "color": "#a85a2a",
  "cefr": "A1",
  "lexile": "약 390L",
  "words": 174,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-necklace",
  "title": "The Necklace",
  "titleKo": "목걸이",
  "author": "Guy de Maupassant",
  "authorKo": "기 드 모파상",
  "country": "France",
  "emoji": "💎",
  "color": "#5a4a8a",
  "cefr": "A1",
  "lexile": "약 390L",
  "words": 166,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-last-lesson",
  "title": "The Last Lesson",
  "titleKo": "마지막 수업",
  "author": "Alphonse Daudet",
  "authorKo": "알퐁스 도데",
  "country": "France",
  "emoji": "📖",
  "color": "#4a6a8a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 164,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-stars",
  "title": "The Stars",
  "titleKo": "별",
  "author": "Alphonse Daudet",
  "authorKo": "알퐁스 도데",
  "country": "France",
  "emoji": "🌌",
  "color": "#2a3a6a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 168,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-happy-prince",
  "title": "The Happy Prince",
  "titleKo": "행복한 왕자",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🏛️",
  "color": "#b08a2a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 170,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-nightingale",
  "title": "The Nightingale",
  "titleKo": "나이팅게일",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "🎶",
  "color": "#3a7a6a",
  "cefr": "A1",
  "lexile": "약 370L",
  "words": 167,
  "places": [
   "Denmark",
   "China"
  ]
 },
 {
  "id": "ivan-the-fool",
  "title": "Ivan the Fool",
  "titleKo": "바보 이반",
  "author": "Leo Tolstoy",
  "authorKo": "레프 톨스토이",
  "country": "Russia",
  "emoji": "🌾",
  "color": "#7a6a3a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 166,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "what-men-live-by",
  "title": "What Men Live By",
  "titleKo": "사람은 무엇으로 사는가",
  "author": "Leo Tolstoy",
  "authorKo": "레프 톨스토이",
  "country": "Russia",
  "emoji": "👞",
  "color": "#6a4a3a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 180,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "moonlight",
  "title": "Moonlight",
  "titleKo": "달빛",
  "author": "Guy de Maupassant",
  "authorKo": "기 드 모파상",
  "country": "France",
  "emoji": "🌙",
  "color": "#3a4a7a",
  "cefr": "A1",
  "lexile": "약 370L",
  "words": 165,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-great-stone-face",
  "title": "The Great Stone Face",
  "titleKo": "큰 바위 얼굴",
  "author": "Nathaniel Hawthorne",
  "authorKo": "너새니얼 호손",
  "country": "United States",
  "emoji": "🗿",
  "color": "#6a6a5a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 175,
  "places": [
   "United States"
  ]
 },
 {
  "id": "snow-white",
  "title": "Snow White",
  "titleKo": "백설공주",
  "author": "The Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "🍎",
  "color": "#a83a3a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 170,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "rapunzel",
  "title": "Rapunzel",
  "titleKo": "라푼젤",
  "author": "The Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "🗼",
  "color": "#7a5a9a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 176,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "cinderella",
  "title": "Cinderella",
  "titleKo": "신데렐라",
  "author": "Charles Perrault",
  "authorKo": "샤를 페로",
  "country": "France",
  "emoji": "👠",
  "color": "#4a6aa8",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 164,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-giving-tree",
  "title": "The Giving Tree",
  "titleKo": "아낌없이 주는 나무",
  "author": "Shel Silverstein",
  "authorKo": "셸 실버스타인",
  "country": "United States",
  "emoji": "🌳",
  "color": "#4a8a4a",
  "cefr": "A1",
  "lexile": "약 300L",
  "words": 176,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-dot",
  "title": "The Dot",
  "titleKo": "점",
  "author": "Peter H. Reynolds",
  "authorKo": "피터 H. 레이놀즈",
  "country": "United States",
  "emoji": "🎨",
  "color": "#c4502a",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 167,
  "places": [
   "United States"
  ]
 },
 {
  "id": "ish",
  "title": "Ish",
  "titleKo": "느끼는 대로",
  "author": "Peter H. Reynolds",
  "authorKo": "피터 H. 레이놀즈",
  "country": "United States",
  "emoji": "🖍️",
  "color": "#3a8a9a",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 157,
  "places": [
   "United States"
  ]
 },
 {
  "id": "sky-color",
  "title": "Sky Color",
  "titleKo": "하늘 색깔",
  "author": "Peter H. Reynolds",
  "authorKo": "피터 H. 레이놀즈",
  "country": "United States",
  "emoji": "🌅",
  "color": "#4a7ac0",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 164,
  "places": [
   "United States"
  ]
 },
 {
  "id": "demian",
  "title": "Demian",
  "titleKo": "데미안",
  "author": "Hermann Hesse",
  "authorKo": "헤르만 헤세",
  "country": "Germany",
  "emoji": "🦅",
  "color": "#3a4a5a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 225,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "animal-farm",
  "title": "Animal Farm",
  "titleKo": "동물농장",
  "author": "George Orwell",
  "authorKo": "조지 오웰",
  "country": "United Kingdom",
  "emoji": "🐷",
  "color": "#8a5a5a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 212,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-adventures-of-tom-sawyer",
  "title": "The Adventures of Tom Sawyer",
  "titleKo": "톰 소여의 모험",
  "author": "Mark Twain",
  "authorKo": "마크 트웨인",
  "country": "United States",
  "emoji": "🛶",
  "color": "#a87a3a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 221,
  "places": [
   "United States"
  ]
 },
 {
  "id": "my-sweet-orange-tree",
  "title": "My Sweet Orange Tree",
  "titleKo": "나의 라임오렌지나무",
  "author": "José Mauro de Vasconcelos",
  "authorKo": "주제 마우루 지 바스콘셀로스",
  "country": "Brazil",
  "emoji": "🍊",
  "color": "#c4782a",
  "cefr": "A2",
  "lexile": "약 560L",
  "words": 213,
  "places": [
   "Brazil"
  ]
 },
 {
  "id": "the-catcher-in-the-rye",
  "title": "The Catcher in the Rye",
  "titleKo": "호밀밭의 파수꾼",
  "author": "J. D. Salinger",
  "authorKo": "J. D. 샐린저",
  "country": "United States",
  "emoji": "🧢",
  "color": "#a83a3a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 217,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-old-man-and-the-sea",
  "title": "The Old Man and the Sea",
  "titleKo": "노인과 바다",
  "author": "Ernest Hemingway",
  "authorKo": "어니스트 헤밍웨이",
  "country": "United States",
  "emoji": "🎣",
  "color": "#2a6a8a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 215,
  "places": [
   "United States",
   "Cuba"
  ]
 },
 {
  "id": "alice-in-wonderland",
  "title": "Alice in Wonderland",
  "titleKo": "이상한 나라의 앨리스",
  "author": "Lewis Carroll",
  "authorKo": "루이스 캐럴",
  "country": "United Kingdom",
  "emoji": "🐰",
  "color": "#7a6aaa",
  "cefr": "A2",
  "lexile": "약 580L",
  "words": 200,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-sorrows-of-young-werther",
  "title": "The Sorrows of Young Werther",
  "titleKo": "젊은 베르테르의 슬픔",
  "author": "Johann Wolfgang von Goethe",
  "authorKo": "요한 볼프강 폰 괴테",
  "country": "Germany",
  "emoji": "💌",
  "color": "#7a3a5a",
  "cefr": "A2",
  "lexile": "약 640L",
  "words": 196,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "beneath-the-wheel",
  "title": "Beneath the Wheel",
  "titleKo": "수레바퀴 아래서",
  "author": "Hermann Hesse",
  "authorKo": "헤르만 헤세",
  "country": "Germany",
  "emoji": "⚙️",
  "color": "#5a6a7a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 210,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "jonathan-livingston-seagull",
  "title": "Jonathan Livingston Seagull",
  "titleKo": "갈매기의 꿈",
  "author": "Richard Bach",
  "authorKo": "리처드 바크",
  "country": "United States",
  "emoji": "🌊",
  "color": "#3a8ab0",
  "cefr": "A2",
  "lexile": "약 580L",
  "words": 209,
  "places": [
   "United States"
  ]
 },
 {
  "id": "momo",
  "title": "Momo",
  "titleKo": "모모",
  "author": "Michael Ende",
  "authorKo": "미하엘 엔데",
  "country": "Germany",
  "emoji": "⏳",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 210,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "don-quixote",
  "title": "Don Quixote",
  "titleKo": "돈키호테",
  "author": "Miguel de Cervantes",
  "authorKo": "미겔 데 세르반테스",
  "country": "Spain",
  "emoji": "🐎",
  "color": "#a86a2a",
  "cefr": "A2",
  "lexile": "약 640L",
  "words": 193,
  "places": [
   "Spain"
  ]
 },
 {
  "id": "brave-new-world",
  "title": "Brave New World",
  "titleKo": "멋진 신세계",
  "author": "Aldous Huxley",
  "authorKo": "올더스 헉슬리",
  "country": "United Kingdom",
  "emoji": "🏙️",
  "color": "#4a8a8a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 190,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "nineteen-eighty-four",
  "title": "1984",
  "titleKo": "1984",
  "author": "George Orwell",
  "authorKo": "조지 오웰",
  "country": "United Kingdom",
  "emoji": "👁️",
  "color": "#5a5a5a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 190,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-great-gatsby",
  "title": "The Great Gatsby",
  "titleKo": "위대한 개츠비",
  "author": "F. Scott Fitzgerald",
  "authorKo": "F. 스콧 피츠제럴드",
  "country": "United States",
  "emoji": "💚",
  "color": "#2a6a4a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 194,
  "places": [
   "United States"
  ]
 },
 {
  "id": "frankenstein",
  "title": "Frankenstein",
  "titleKo": "프랑켄슈타인",
  "author": "Mary Shelley",
  "authorKo": "메리 셸리",
  "country": "United Kingdom",
  "emoji": "⚡",
  "color": "#4a5a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 207,
  "places": [
   "United Kingdom",
   "Switzerland"
  ]
 },
 {
  "id": "anne-of-green-gables",
  "title": "Anne of Green Gables",
  "titleKo": "빨강 머리 앤",
  "author": "Lucy Maud Montgomery",
  "authorKo": "루시 모드 몽고메리",
  "country": "Canada",
  "emoji": "🌸",
  "color": "#c4602a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 208,
  "places": [
   "Canada"
  ]
 },
 {
  "id": "romeo-and-juliet",
  "title": "Romeo and Juliet",
  "titleKo": "로미오와 줄리엣",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "💔",
  "color": "#a82a4a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 198,
  "places": [
   "United Kingdom",
   "Italy"
  ]
 },
 {
  "id": "around-the-world-in-eighty-days",
  "title": "Around the World in Eighty Days",
  "titleKo": "80일간의 세계 일주",
  "author": "Jules Verne",
  "authorKo": "쥘 베른",
  "country": "France",
  "emoji": "🎈",
  "color": "#3a6aa8",
  "cefr": "A2",
  "lexile": "약 650L",
  "words": 215,
  "places": [
   "France",
   "United Kingdom",
   "India"
  ]
 },
 {
  "id": "twenty-thousand-leagues-under-the-seas",
  "title": "Twenty Thousand Leagues Under the Seas",
  "titleKo": "해저 2만 리",
  "author": "Jules Verne",
  "authorKo": "쥘 베른",
  "country": "France",
  "emoji": "🐙",
  "color": "#2a4a7a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 196,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-diary-of-a-young-girl",
  "title": "The Diary of a Young Girl",
  "titleKo": "안네의 일기",
  "author": "Anne Frank",
  "authorKo": "안네 프랑크",
  "country": "Netherlands",
  "emoji": "📔",
  "color": "#7a5a3a",
  "cefr": "A2",
  "lexile": "약 640L",
  "words": 198,
  "places": [
   "Netherlands",
   "Germany"
  ]
 },
 {
  "id": "treasure-island",
  "title": "Treasure Island",
  "titleKo": "보물섬",
  "author": "Robert Louis Stevenson",
  "authorKo": "로버트 루이스 스티븐슨",
  "country": "United Kingdom",
  "emoji": "🏴‍☠️",
  "color": "#8a6a2a",
  "cefr": "A2",
  "lexile": "약 640L",
  "words": 203,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "jane-eyre",
  "title": "Jane Eyre",
  "titleKo": "제인 에어",
  "author": "Charlotte Brontë",
  "authorKo": "샬럿 브론테",
  "country": "United Kingdom",
  "emoji": "🏚️",
  "color": "#5a3a4a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 211,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "daddy-long-legs",
  "title": "Daddy-Long-Legs",
  "titleKo": "키다리 아저씨",
  "author": "Jean Webster",
  "authorKo": "진 웹스터",
  "country": "United States",
  "emoji": "✉️",
  "color": "#3a6a8a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 194,
  "places": [
   "United States"
  ]
 },
 {
  "id": "les-miserables",
  "title": "Les Misérables",
  "titleKo": "레 미제라블",
  "author": "Victor Hugo",
  "authorKo": "빅토르 위고",
  "country": "France",
  "emoji": "⛓️",
  "color": "#4a4a6a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 203,
  "places": [
   "France"
  ]
 },
 {
  "id": "gullivers-travels",
  "title": "Gulliver’s Travels",
  "titleKo": "걸리버 여행기",
  "author": "Jonathan Swift",
  "authorKo": "조너선 스위프트",
  "country": "Ireland",
  "emoji": "⛵",
  "color": "#3a7a8a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 196,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-metamorphosis",
  "title": "The Metamorphosis",
  "titleKo": "변신",
  "author": "Franz Kafka",
  "authorKo": "프란츠 카프카",
  "country": "Czechia",
  "emoji": "🚪",
  "color": "#6a5a3a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 212,
  "places": [
   "Czechia"
  ]
 },
 {
  "id": "the-alchemist",
  "title": "The Alchemist",
  "titleKo": "연금술사",
  "author": "Paulo Coelho",
  "authorKo": "파울루 코엘류",
  "country": "Brazil",
  "emoji": "🏜️",
  "color": "#c4943a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 202,
  "places": [
   "Brazil",
   "Spain",
   "Egypt"
  ]
 },
 {
  "id": "a-christmas-carol",
  "title": "A Christmas Carol",
  "titleKo": "크리스마스 캐럴",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🎄",
  "color": "#2a6a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 205,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "crime-and-punishment",
  "title": "Crime and Punishment",
  "titleKo": "죄와 벌",
  "author": "Fyodor Dostoevsky",
  "authorKo": "표도르 도스토옙스키",
  "country": "Russia",
  "emoji": "⚖️",
  "color": "#6a3a3a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 190,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-stranger",
  "title": "The Stranger",
  "titleKo": "이방인",
  "author": "Albert Camus",
  "authorKo": "알베르 카뮈",
  "country": "France",
  "emoji": "🌞",
  "color": "#c49a3a",
  "cefr": "A2",
  "lexile": "약 650L",
  "words": 195,
  "places": [
   "France",
   "Algeria"
  ]
 },
 {
  "id": "the-merchant-of-venice",
  "title": "The Merchant of Venice",
  "titleKo": "베니스의 상인",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "🪙",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 193,
  "places": [
   "United Kingdom",
   "Italy"
  ]
 },
 {
  "id": "hamlet",
  "title": "Hamlet",
  "titleKo": "햄릿",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "💀",
  "color": "#3a3a5a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 196,
  "places": [
   "United Kingdom",
   "Denmark"
  ]
 },
 {
  "id": "to-kill-a-mockingbird",
  "title": "To Kill a Mockingbird",
  "titleKo": "앵무새 죽이기",
  "author": "Harper Lee",
  "authorKo": "하퍼 리",
  "country": "United States",
  "emoji": "🕊️",
  "color": "#6a7a4a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 194,
  "places": [
   "United States"
  ]
 },
 {
  "id": "lord-of-the-flies",
  "title": "Lord of the Flies",
  "titleKo": "파리대왕",
  "author": "William Golding",
  "authorKo": "윌리엄 골딩",
  "country": "United Kingdom",
  "emoji": "🐚",
  "color": "#5a7a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 201,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "peter-pan",
  "title": "Peter Pan",
  "titleKo": "피터 팬",
  "author": "J. M. Barrie",
  "authorKo": "J. M. 배리",
  "country": "United Kingdom",
  "emoji": "🧚",
  "color": "#3a8a5a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 197,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "wuthering-heights",
  "title": "Wuthering Heights",
  "titleKo": "폭풍의 언덕",
  "author": "Emily Brontë",
  "authorKo": "에밀리 브론테",
  "country": "United Kingdom",
  "emoji": "🌫️",
  "color": "#4a4a5a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 182,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-jungle-book",
  "title": "The Jungle Book",
  "titleKo": "정글북",
  "author": "Rudyard Kipling",
  "authorKo": "러디어드 키플링",
  "country": "United Kingdom",
  "emoji": "🐻",
  "color": "#4a7a3a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 204,
  "places": [
   "United Kingdom",
   "India"
  ]
 },
 {
  "id": "gone-with-the-wind",
  "title": "Gone with the Wind",
  "titleKo": "바람과 함께 사라지다",
  "author": "Margaret Mitchell",
  "authorKo": "마거릿 미첼",
  "country": "United States",
  "emoji": "🌪️",
  "color": "#a84a2a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 196,
  "places": [
   "United States"
  ]
 },
 {
  "id": "charlie-and-the-chocolate-factory",
  "title": "Charlie and the Chocolate Factory",
  "titleKo": "찰리와 초콜릿 공장",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "🍫",
  "color": "#6a3a2a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 203,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "a-tale-of-two-cities",
  "title": "A Tale of Two Cities",
  "titleKo": "두 도시 이야기",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🗡️",
  "color": "#7a3a3a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 198,
  "places": [
   "United Kingdom",
   "France"
  ]
 },
 {
  "id": "pride-and-prejudice",
  "title": "Pride and Prejudice",
  "titleKo": "오만과 편견",
  "author": "Jane Austen",
  "authorKo": "제인 오스틴",
  "country": "United Kingdom",
  "emoji": "💃",
  "color": "#8a5a7a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 204,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-wonderful-wizard-of-oz",
  "title": "The Wonderful Wizard of Oz",
  "titleKo": "오즈의 마법사",
  "author": "L. Frank Baum",
  "authorKo": "L. 프랭크 바움",
  "country": "United States",
  "emoji": "🌈",
  "color": "#4a8a3a",
  "cefr": "A2",
  "lexile": "약 600L",
  "words": 220,
  "places": [
   "United States"
  ]
 },
 {
  "id": "waiting-for-godot",
  "title": "Waiting for Godot",
  "titleKo": "고도를 기다리며",
  "author": "Samuel Beckett",
  "authorKo": "사뮈엘 베케트",
  "country": "Ireland",
  "emoji": "🎩",
  "color": "#6a6a6a",
  "cefr": "A2",
  "lexile": "약 650L",
  "words": 199,
  "places": [
   "Ireland",
   "France"
  ]
 },
 {
  "id": "the-grapes-of-wrath",
  "title": "The Grapes of Wrath",
  "titleKo": "분노의 포도",
  "author": "John Steinbeck",
  "authorKo": "존 스타인벡",
  "country": "United States",
  "emoji": "🚚",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 209,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-hunchback-of-notre-dame",
  "title": "The Hunchback of Notre-Dame",
  "titleKo": "노트르담의 꼽추",
  "author": "Victor Hugo",
  "authorKo": "빅토르 위고",
  "country": "France",
  "emoji": "⛪",
  "color": "#5a5a7a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 184,
  "places": [
   "France"
  ]
 },
 {
  "id": "a-midsummer-nights-dream",
  "title": "A Midsummer Night’s Dream",
  "titleKo": "한여름 밤의 꿈",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "🌿",
  "color": "#4a8a6a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 212,
  "places": [
   "United Kingdom",
   "Greece"
  ]
 },
 {
  "id": "sense-and-sensibility",
  "title": "Sense and Sensibility",
  "titleKo": "이성과 감성",
  "author": "Jane Austen",
  "authorKo": "제인 오스틴",
  "country": "United Kingdom",
  "emoji": "☕",
  "color": "#7a6a8a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 195,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "robinson-crusoe",
  "title": "Robinson Crusoe",
  "titleKo": "로빈슨 크루소",
  "author": "Daniel Defoe",
  "authorKo": "대니얼 디포",
  "country": "United Kingdom",
  "emoji": "🏝️",
  "color": "#6a8a4a",
  "cefr": "A2",
  "lexile": "약 660L",
  "words": 191,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-count-of-monte-cristo",
  "title": "The Count of Monte Cristo",
  "titleKo": "몬테크리스토 백작",
  "author": "Alexandre Dumas",
  "authorKo": "알렉상드르 뒤마",
  "country": "France",
  "emoji": "🗝️",
  "color": "#3a4a6a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 216,
  "places": [
   "France"
  ]
 },
 {
  "id": "great-expectations",
  "title": "Great Expectations",
  "titleKo": "위대한 유산",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🎩",
  "color": "#6a5a4a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 207,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-scarlet-letter",
  "title": "The Scarlet Letter",
  "titleKo": "주홍 글씨",
  "author": "Nathaniel Hawthorne",
  "authorKo": "너새니얼 호손",
  "country": "United States",
  "emoji": "🅰️",
  "color": "#a33a3a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 201,
  "places": [
   "United States"
  ]
 },
 {
  "id": "moby-dick",
  "title": "Moby Dick",
  "titleKo": "모비 딕",
  "author": "Herman Melville",
  "authorKo": "허먼 멜빌",
  "country": "United States",
  "emoji": "🐋",
  "color": "#2a5a7a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 203,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-bfg",
  "title": "The BFG",
  "titleKo": "내 친구 꼬마 거인",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "👂",
  "color": "#5a7a9a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 199,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "who-moved-my-cheese",
  "title": "Who Moved My Cheese?",
  "titleKo": "누가 내 치즈를 옮겼을까?",
  "author": "Spencer Johnson",
  "authorKo": "스펜서 존슨",
  "country": "United States",
  "emoji": "🧀",
  "color": "#c9a227",
  "cefr": "A2",
  "lexile": "약 650L",
  "words": 210,
  "places": [
   "United States"
  ]
 },
 {
  "id": "macbeth",
  "title": "Macbeth",
  "titleKo": "맥베스",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "🗡️",
  "color": "#4a2a2a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 203,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "king-lear",
  "title": "King Lear",
  "titleKo": "리어 왕",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "👑",
  "color": "#5a4a6a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 211,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "othello",
  "title": "Othello",
  "titleKo": "오셀로",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "Italy",
  "emoji": "🧣",
  "color": "#3a3a5a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 193,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "the-taming-of-the-shrew",
  "title": "The Taming of the Shrew",
  "titleKo": "말괄량이 길들이기",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "Italy",
  "emoji": "🎭",
  "color": "#a35a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 215,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "the-iliad",
  "title": "The Iliad",
  "titleKo": "일리아스",
  "author": "Homer",
  "authorKo": "호메로스",
  "country": "Greece",
  "emoji": "🛡️",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 214,
  "places": [
   "Greece",
   "Turkey"
  ]
 },
 {
  "id": "the-odyssey",
  "title": "The Odyssey",
  "titleKo": "오디세이아",
  "author": "Homer",
  "authorKo": "호메로스",
  "country": "Greece",
  "emoji": "⛵",
  "color": "#2a6a8a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 226,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "dead-poets-society",
  "title": "Dead Poets Society",
  "titleKo": "죽은 시인의 사회",
  "author": "N. H. Kleinbaum",
  "authorKo": "N. H. 클라인바움",
  "country": "United States",
  "emoji": "📜",
  "color": "#4a5a3a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 228,
  "places": [
   "United States"
  ]
 },
 {
  "id": "zorba-the-greek",
  "title": "Zorba the Greek",
  "titleKo": "그리스인 조르바",
  "author": "Nikos Kazantzakis",
  "authorKo": "니코스 카잔차키스",
  "country": "Greece",
  "emoji": "💃",
  "color": "#3a7aa3",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 227,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-plague",
  "title": "The Plague",
  "titleKo": "페스트",
  "author": "Albert Camus",
  "authorKo": "알베르 카뮈",
  "country": "France",
  "emoji": "🐀",
  "color": "#6a6a5a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 228,
  "places": [
   "France",
   "Algeria"
  ]
 },
 {
  "id": "siddhartha",
  "title": "Siddhartha",
  "titleKo": "싯다르타",
  "author": "Hermann Hesse",
  "authorKo": "헤르만 헤세",
  "country": "Germany",
  "emoji": "🪷",
  "color": "#c98a3a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 214,
  "places": [
   "Germany",
   "India"
  ]
 },
 {
  "id": "the-adventures-of-huckleberry-finn",
  "title": "The Adventures of Huckleberry Finn",
  "titleKo": "허클베리 핀의 모험",
  "author": "Mark Twain",
  "authorKo": "마크 트웨인",
  "country": "United States",
  "emoji": "🛶",
  "color": "#7a5a3a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 232,
  "places": [
   "United States"
  ]
 },
 {
  "id": "oliver-twist",
  "title": "Oliver Twist",
  "titleKo": "올리버 트위스트",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🥣",
  "color": "#6a5a5a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 227,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "a-dog-of-flanders",
  "title": "A Dog of Flanders",
  "titleKo": "플랜더스의 개",
  "author": "Ouida",
  "authorKo": "위다",
  "country": "United Kingdom",
  "emoji": "🐕",
  "color": "#7a8a5a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 241,
  "places": [
   "United Kingdom",
   "Belgium"
  ]
 },
 {
  "id": "dracula",
  "title": "Dracula",
  "titleKo": "드라큘라",
  "author": "Bram Stoker",
  "authorKo": "브램 스토커",
  "country": "Ireland",
  "emoji": "🦇",
  "color": "#3a1a2a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 223,
  "places": [
   "Ireland",
   "Romania",
   "United Kingdom"
  ]
 },
 {
  "id": "the-secret-garden",
  "title": "The Secret Garden",
  "titleKo": "비밀의 화원",
  "author": "Frances Hodgson Burnett",
  "authorKo": "프랜시스 호지슨 버넷",
  "country": "United Kingdom",
  "emoji": "🌹",
  "color": "#5a8a4a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 216,
  "places": [
   "United Kingdom",
   "India"
  ]
 },
 {
  "id": "a-little-princess",
  "title": "A Little Princess",
  "titleKo": "소공녀",
  "author": "Frances Hodgson Burnett",
  "authorKo": "프랜시스 호지슨 버넷",
  "country": "United Kingdom",
  "emoji": "👸",
  "color": "#a37aa3",
  "cefr": "A2",
  "lexile": "약 670L",
  "words": 236,
  "places": [
   "United Kingdom",
   "India"
  ]
 },
 {
  "id": "heidi",
  "title": "Heidi",
  "titleKo": "하이디",
  "author": "Johanna Spyri",
  "authorKo": "요하나 슈피리",
  "country": "Switzerland",
  "emoji": "🏔️",
  "color": "#4a8a9a",
  "cefr": "A2",
  "lexile": "약 660L",
  "words": 222,
  "places": [
   "Switzerland",
   "Germany"
  ]
 },
 {
  "id": "the-brothers-karamazov",
  "title": "The Brothers Karamazov",
  "titleKo": "카라마조프가의 형제들",
  "author": "Fyodor Dostoevsky",
  "authorKo": "표도르 도스토옙스키",
  "country": "Russia",
  "emoji": "⛪",
  "color": "#5a3a3a",
  "cefr": "A2",
  "lexile": "약 730L",
  "words": 225,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "faust",
  "title": "Faust",
  "titleKo": "파우스트",
  "author": "Johann Wolfgang von Goethe",
  "authorKo": "요한 볼프강 폰 괴테",
  "country": "Germany",
  "emoji": "📕",
  "color": "#6a2a2a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 230,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "narcissus-and-goldmund",
  "title": "Narcissus and Goldmund",
  "titleKo": "지와 사랑",
  "author": "Hermann Hesse",
  "authorKo": "헤르만 헤세",
  "country": "Germany",
  "emoji": "🗿",
  "color": "#8a7a4a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 223,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "the-hobbit",
  "title": "The Hobbit",
  "titleKo": "호빗",
  "author": "J. R. R. Tolkien",
  "authorKo": "J. R. R. 톨킨",
  "country": "United Kingdom",
  "emoji": "🐉",
  "color": "#6a7a3a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 234,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-lord-of-the-rings",
  "title": "The Lord of the Rings",
  "titleKo": "반지의 제왕",
  "author": "J. R. R. Tolkien",
  "authorKo": "J. R. R. 톨킨",
  "country": "United Kingdom",
  "emoji": "💍",
  "color": "#8a6a2a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 242,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "little-women",
  "title": "Little Women",
  "titleKo": "작은 아씨들",
  "author": "Louisa May Alcott",
  "authorKo": "루이자 메이 올콧",
  "country": "United States",
  "emoji": "📝",
  "color": "#a35a6a",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 235,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-legend-of-sleepy-hollow",
  "title": "The Legend of Sleepy Hollow",
  "titleKo": "슬리피 할로우의 전설",
  "author": "Washington Irving",
  "authorKo": "워싱턴 어빙",
  "country": "United States",
  "emoji": "🎃",
  "color": "#a35a1a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 232,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-phantom-of-the-opera",
  "title": "The Phantom of the Opera",
  "titleKo": "오페라의 유령",
  "author": "Gaston Leroux",
  "authorKo": "가스통 르루",
  "country": "France",
  "emoji": "🎭",
  "color": "#2a2a3a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 246,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-hound-of-the-baskervilles",
  "title": "The Hound of the Baskervilles",
  "titleKo": "바스커빌가의 개",
  "author": "Arthur Conan Doyle",
  "authorKo": "아서 코넌 도일",
  "country": "United Kingdom",
  "emoji": "🐾",
  "color": "#3a4a3a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 236,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "tuesdays-with-morrie-a2",
  "title": "Tuesdays with Morrie",
  "titleKo": "모리와 함께한 화요일",
  "author": "Mitch Albom",
  "authorKo": "미치 앨봄",
  "country": "United States",
  "emoji": "🍂",
  "color": "#c9722f",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 230,
  "places": [
   "United States"
  ]
 },
 {
  "id": "unbearable-lightness-a2",
  "title": "The Unbearable Lightness of Being",
  "titleKo": "참을 수 없는 존재의 가벼움",
  "author": "Milan Kundera",
  "authorKo": "밀란 쿤데라",
  "country": "Czechia",
  "emoji": "🪶",
  "color": "#7c6bb0",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 234,
  "places": [
   "Czechia",
   "Switzerland"
  ]
 },
 {
  "id": "the-vegetarian",
  "title": "The Vegetarian",
  "titleKo": "채식주의자",
  "author": "Han Kang",
  "authorKo": "한강",
  "country": "South Korea",
  "emoji": "🌳",
  "color": "#4f7a52",
  "cefr": "B2",
  "lexile": "약 950L",
  "words": 373,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "human-acts",
  "title": "Human Acts",
  "titleKo": "소년이 온다",
  "author": "Han Kang",
  "authorKo": "한강",
  "country": "South Korea",
  "emoji": "🕯️",
  "color": "#5a4f7a",
  "cefr": "B2",
  "lexile": "약 980L",
  "words": 379,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "heungbu-and-nolbu",
  "title": "Heungbu and Nolbu",
  "titleKo": "흥부와 놀부",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🐦",
  "color": "#8a6a2a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 145,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-old-man-with-a-lump",
  "title": "The Old Man with a Lump",
  "titleKo": "혹부리 영감",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "👴",
  "color": "#7a5a8a",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 152,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-goblins-magic-club",
  "title": "The Goblins’ Magic Club",
  "titleKo": "도깨비 방망이",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🏏",
  "color": "#3a6a8a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 156,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-three-year-hill",
  "title": "The Three-Year Hill",
  "titleKo": "삼년 고개",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "⛰️",
  "color": "#6a8a5a",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 153,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-tiger-and-the-dried-persimmon",
  "title": "The Tiger and the Dried Persimmon",
  "titleKo": "호랑이와 곶감",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🐯",
  "color": "#c9721a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 158,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-red-bean-porridge-grandma",
  "title": "The Red Bean Porridge Grandma and the Tiger",
  "titleKo": "팥죽 할머니와 호랑이",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🥣",
  "color": "#8a3a3a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 153,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "kongjwi-and-patjwi",
  "title": "Kongjwi and Patjwi",
  "titleKo": "콩쥐 팥쥐",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "👡",
  "color": "#a35a7a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 160,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-story-of-shim-cheong",
  "title": "The Story of Shim Cheong",
  "titleKo": "효녀 심청",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🪷",
  "color": "#c95a7a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 169,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-good-brothers",
  "title": "The Good Brothers",
  "titleKo": "의좋은 형제",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🌾",
  "color": "#b58a2a",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 140,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-sun-and-the-moon",
  "title": "The Brother and Sister Who Became the Sun and the Moon",
  "titleKo": "해와 달이 된 오누이",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🌙",
  "color": "#2a3a6a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 155,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-rabbits-liver",
  "title": "The Rabbit’s Liver",
  "titleKo": "별주부전(토끼와 자라)",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🐇",
  "color": "#3a8a8a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 148,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-snail-bride",
  "title": "The Snail Bride",
  "titleKo": "우렁각시",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🐌",
  "color": "#5a8a7a",
  "cefr": "A1",
  "lexile": "약 340L",
  "words": 160,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-water-of-youth",
  "title": "The Water of Youth",
  "titleKo": "젊어지는 샘물",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "💧",
  "color": "#3a7aa3",
  "cefr": "A1",
  "lexile": "약 320L",
  "words": 147,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "why-the-sea-is-salty",
  "title": "Why the Sea Is Salty",
  "titleKo": "바닷물이 짠 이유",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🧂",
  "color": "#4a6a9a",
  "cefr": "A1",
  "lexile": "약 330L",
  "words": 145,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "gyeonu-and-jiknyeo",
  "title": "Gyeonu and Jiknyeo",
  "titleKo": "견우와 직녀",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🌌",
  "color": "#3a2a6a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 168,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-grateful-magpie",
  "title": "The Grateful Magpie",
  "titleKo": "은혜 갚은 까치",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🔔",
  "color": "#2a5a5a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 165,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-green-frog",
  "title": "The Green Frog",
  "titleKo": "청개구리 이야기",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🐸",
  "color": "#4a8a3a",
  "cefr": "A1",
  "lexile": "약 310L",
  "words": 152,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-grateful-toad",
  "title": "The Grateful Toad",
  "titleKo": "은혜 갚은 두꺼비",
  "author": "Korean Folktale",
  "authorKo": "한국 전래동화",
  "country": "South Korea",
  "emoji": "🍚",
  "color": "#7a6a3a",
  "cefr": "A1",
  "lexile": "약 350L",
  "words": 151,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "the-snow-queen",
  "title": "The Snow Queen",
  "titleKo": "눈의 여왕",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "❄️",
  "color": "#5a8ac0",
  "cefr": "A2",
  "lexile": "약 560L",
  "words": 218,
  "places": [
   "Denmark",
   "Finland"
  ]
 },
 {
  "id": "the-adventures-of-pinocchio",
  "title": "The Adventures of Pinocchio",
  "titleKo": "피노키오의 모험",
  "author": "Carlo Collodi",
  "authorKo": "카를로 콜로디",
  "country": "Italy",
  "emoji": "🤥",
  "color": "#b0603a",
  "cefr": "A2",
  "lexile": "약 580L",
  "words": 213,
  "places": [
   "Italy"
  ]
 },
 {
  "id": "the-little-mermaid",
  "title": "The Little Mermaid",
  "titleKo": "인어공주",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "🧜‍♀️",
  "color": "#3a8aa0",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 158,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "the-emperors-new-clothes",
  "title": "The Emperor’s New Clothes",
  "titleKo": "벌거벗은 임금님",
  "author": "Hans Christian Andersen",
  "authorKo": "한스 크리스티안 안데르센",
  "country": "Denmark",
  "emoji": "👑",
  "color": "#b08a3a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 158,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "hansel-and-gretel",
  "title": "Hansel and Gretel",
  "titleKo": "헨젤과 그레텔",
  "author": "Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "🍬",
  "color": "#a0623a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 176,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "the-town-musicians-of-bremen",
  "title": "The Town Musicians of Bremen",
  "titleKo": "브레멘 음악대",
  "author": "Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "🎺",
  "color": "#6a8a3a",
  "cefr": "A1",
  "lexile": "약 390L",
  "words": 178,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "the-twelve-labors-of-heracles",
  "title": "The Twelve Labors of Heracles",
  "titleKo": "헤라클레스의 12가지 과업",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🦁",
  "color": "#a0702a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 226,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-trojan-horse",
  "title": "The Trojan Horse",
  "titleKo": "트로이 목마",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🐴",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 640L",
  "words": 225,
  "places": [
   "Greece",
   "Turkey"
  ]
 },
 {
  "id": "jason-and-the-golden-fleece",
  "title": "Jason and the Golden Fleece",
  "titleKo": "이아손과 황금 양털",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🐏",
  "color": "#b08a2a",
  "cefr": "A2",
  "lexile": "약 630L",
  "words": 219,
  "places": [
   "Greece",
   "Georgia"
  ]
 },
 {
  "id": "pandoras-box",
  "title": "Pandora’s Box",
  "titleKo": "판도라의 상자",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "📦",
  "color": "#8a5a9a",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 148,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "king-midas",
  "title": "King Midas and the Golden Touch",
  "titleKo": "미다스 왕의 황금 손",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🪙",
  "color": "#c09a2a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 164,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "daedalus-and-icarus",
  "title": "Daedalus and Icarus",
  "titleKo": "이카로스의 날개",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🪶",
  "color": "#d08a3a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 157,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "prometheus-and-the-fire",
  "title": "Prometheus and the Fire",
  "titleKo": "프로메테우스의 불",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🔥",
  "color": "#c0502a",
  "cefr": "A1",
  "lexile": "약 430L",
  "words": 161,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "narcissus-and-echo",
  "title": "Narcissus and Echo",
  "titleKo": "나르키소스와 에코",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🌼",
  "color": "#4a8a7a",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 177,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "arachne-and-athena",
  "title": "Arachne and Athena",
  "titleKo": "아라크네와 아테나",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🕷️",
  "color": "#6a5a8a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 149,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "orpheus-and-eurydice",
  "title": "Orpheus and Eurydice",
  "titleKo": "오르페우스와 에우리디케",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🎵",
  "color": "#4a5a9a",
  "cefr": "A1",
  "lexile": "약 430L",
  "words": 160,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "persephone-and-the-seasons",
  "title": "Persephone and the Seasons",
  "titleKo": "페르세포네와 사계절",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🌸",
  "color": "#9a5a7a",
  "cefr": "A1",
  "lexile": "약 440L",
  "words": 164,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "theseus-and-the-minotaur",
  "title": "Theseus and the Minotaur",
  "titleKo": "테세우스와 미노타우로스",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🐂",
  "color": "#8a4a3a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 160,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "perseus-and-medusa",
  "title": "Perseus and Medusa",
  "titleKo": "페르세우스와 메두사",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🛡️",
  "color": "#3a6a5a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 171,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "pygmalion-myth",
  "title": "Pygmalion",
  "titleKo": "피그말리온",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "🗿",
  "color": "#a07a6a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 165,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "phaethon-and-the-sun-chariot",
  "title": "Phaethon and the Sun Chariot",
  "titleKo": "파에톤과 태양 마차",
  "author": "Greek Myth",
  "authorKo": "그리스 로마 신화",
  "country": "Greece",
  "emoji": "☀️",
  "color": "#d0702a",
  "cefr": "A1",
  "lexile": "약 440L",
  "words": 168,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "anansi-and-the-pot-of-wisdom",
  "title": "Anansi and the Pot of Wisdom",
  "titleKo": "아난시와 지혜의 항아리",
  "author": "Ghanaian Folktale",
  "authorKo": "가나 민담",
  "country": "Ghana",
  "emoji": "🕷️",
  "color": "#a0602a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 169,
  "places": [
   "Ghana"
  ]
 },
 {
  "id": "why-the-sky-is-far-away",
  "title": "Why the Sky Is Far Away",
  "titleKo": "하늘은 왜 멀어졌을까",
  "author": "Nigerian Folktale",
  "authorKo": "나이지리아 민담",
  "country": "Nigeria",
  "emoji": "☁️",
  "color": "#4a7ab0",
  "cefr": "A1",
  "lexile": "약 390L",
  "words": 172,
  "places": [
   "Nigeria"
  ]
 },
 {
  "id": "why-mosquitoes-buzz",
  "title": "Why Mosquitoes Buzz in People’s Ears",
  "titleKo": "모기는 왜 귓가에서 윙윙거릴까",
  "author": "West African Folktale",
  "authorKo": "서아프리카 민담",
  "country": "Nigeria",
  "emoji": "🦟",
  "color": "#5a7a3a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 173,
  "places": [
   "Nigeria"
  ]
 },
 {
  "id": "isis-and-osiris",
  "title": "Isis and Osiris",
  "titleKo": "이시스와 오시리스",
  "author": "Egyptian Myth",
  "authorKo": "이집트 신화",
  "country": "Egypt",
  "emoji": "🏺",
  "color": "#c09a3a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 168,
  "places": [
   "Egypt"
  ]
 },
 {
  "id": "the-lions-whisker",
  "title": "The Lion’s Whisker",
  "titleKo": "사자의 수염",
  "author": "Ethiopian Folktale",
  "authorKo": "에티오피아 민담",
  "country": "Ethiopia",
  "emoji": "🦁",
  "color": "#b07a2a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 178,
  "places": [
   "Ethiopia"
  ]
 },
 {
  "id": "tiddalik-the-frog",
  "title": "Tiddalik the Frog",
  "titleKo": "개구리 티달릭",
  "author": "Aboriginal Australian Story",
  "authorKo": "오스트레일리아 원주민 이야기",
  "country": "Australia",
  "emoji": "🐸",
  "color": "#3a8a6a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 175,
  "places": [
   "Australia"
  ]
 },
 {
  "id": "the-rainbow-serpent",
  "title": "The Rainbow Serpent",
  "titleKo": "무지개 뱀",
  "author": "Aboriginal Australian Story",
  "authorKo": "오스트레일리아 원주민 이야기",
  "country": "Australia",
  "emoji": "🌈",
  "color": "#7a5ab0",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 177,
  "places": [
   "Australia"
  ]
 },
 {
  "id": "maui-and-the-sun",
  "title": "Maui and the Sun",
  "titleKo": "마우이와 태양",
  "author": "Māori Myth",
  "authorKo": "마오리 신화",
  "country": "New Zealand",
  "emoji": "🌞",
  "color": "#d0802a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 177,
  "places": [
   "New Zealand"
  ]
 },
 {
  "id": "popocatepetl-and-iztaccihuatl",
  "title": "Popocatépetl and Iztaccíhuatl",
  "titleKo": "포포카테페틀과 이스타시와틀",
  "author": "Aztec Legend",
  "authorKo": "아스테카 전설",
  "country": "Mexico",
  "emoji": "🌋",
  "color": "#8a4a5a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 179,
  "places": [
   "Mexico"
  ]
 },
 {
  "id": "manco-capac-the-first-inca",
  "title": "Manco Cápac, the First Inca",
  "titleKo": "잉카의 첫 왕 망코 카팍",
  "author": "Inca Legend",
  "authorKo": "잉카 전설",
  "country": "Peru",
  "emoji": "🏔️",
  "color": "#b0702a",
  "cefr": "A1",
  "lexile": "약 430L",
  "words": 178,
  "places": [
   "Peru"
  ]
 },
 {
  "id": "ali-baba-and-the-forty-thieves",
  "title": "Ali Baba and the Forty Thieves",
  "titleKo": "알리바바와 40인의 도둑",
  "author": "One Thousand and One Nights",
  "authorKo": "아라비안나이트",
  "country": "Iraq",
  "emoji": "🏺",
  "color": "#9a6a2a",
  "cefr": "A1",
  "lexile": "약 460L",
  "words": 177,
  "places": [
   "Iraq"
  ]
 },
 {
  "id": "aladdin-and-the-magic-lamp",
  "title": "Aladdin and the Magic Lamp",
  "titleKo": "알라딘과 요술 램프",
  "author": "One Thousand and One Nights",
  "authorKo": "아라비안나이트",
  "country": "Iraq",
  "emoji": "🪔",
  "color": "#5a4a9a",
  "cefr": "A1",
  "lexile": "약 460L",
  "words": 179,
  "places": [
   "Iraq",
   "China"
  ]
 },
 {
  "id": "suho-and-the-white-horse",
  "title": "Suho and the White Horse",
  "titleKo": "수호의 하얀 말",
  "author": "Mongolian Folktale",
  "authorKo": "몽골 민담",
  "country": "Mongolia",
  "emoji": "🐎",
  "color": "#6a8ab0",
  "cefr": "A1",
  "lexile": "약 430L",
  "words": 178,
  "places": [
   "Mongolia"
  ]
 },
 {
  "id": "the-legend-of-the-returned-sword",
  "title": "The Legend of the Returned Sword",
  "titleKo": "환검 호수의 거북 전설",
  "author": "Vietnamese Legend",
  "authorKo": "베트남 전설",
  "country": "Vietnam",
  "emoji": "🐢",
  "color": "#3a7a6a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 179,
  "places": [
   "Vietnam"
  ]
 },
 {
  "id": "the-legend-of-the-pineapple",
  "title": "The Legend of the Pineapple",
  "titleKo": "파인애플 전설",
  "author": "Filipino Legend",
  "authorKo": "필리핀 전설",
  "country": "Philippines",
  "emoji": "🍍",
  "color": "#b0a02a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 177,
  "places": [
   "Philippines"
  ]
 },
 {
  "id": "the-boy-who-harnessed-the-wind",
  "title": "The Boy Who Harnessed the Wind",
  "titleKo": "바람을 길들인 풍차 소년",
  "author": "William Kamkwamba",
  "authorKo": "윌리엄 캄쾀바",
  "country": "Malawi",
  "emoji": "🌬️",
  "color": "#4a8aa0",
  "cefr": "A2",
  "lexile": "약 690L",
  "words": 230,
  "places": [
   "Malawi"
  ]
 },
 {
  "id": "things-fall-apart",
  "title": "Things Fall Apart",
  "titleKo": "모든 것이 산산이 무너지다",
  "author": "Chinua Achebe",
  "authorKo": "치누아 아체베",
  "country": "Nigeria",
  "emoji": "🥁",
  "color": "#8a5a2a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 222,
  "places": [
   "Nigeria"
  ]
 },
 {
  "id": "long-walk-to-freedom",
  "title": "Long Walk to Freedom",
  "titleKo": "자유를 향한 머나먼 길",
  "author": "Nelson Mandela",
  "authorKo": "넬슨 만델라",
  "country": "South Africa",
  "emoji": "✊",
  "color": "#3a6a3a",
  "cefr": "A2",
  "lexile": "약 710L",
  "words": 215,
  "places": [
   "South Africa"
  ]
 },
 {
  "id": "the-whale-rider",
  "title": "The Whale Rider",
  "titleKo": "웨일 라이더",
  "author": "Witi Ihimaera",
  "authorKo": "위티 이히마에라",
  "country": "New Zealand",
  "emoji": "🐋",
  "color": "#2a6a8a",
  "cefr": "A2",
  "lexile": "약 700L",
  "words": 249,
  "places": [
   "New Zealand"
  ]
 },
 {
  "id": "storm-boy",
  "title": "Storm Boy",
  "titleKo": "스톰 보이",
  "author": "Colin Thiele",
  "authorKo": "콜린 실레",
  "country": "Australia",
  "emoji": "🐦",
  "color": "#4a7a9a",
  "cefr": "A2",
  "lexile": "약 660L",
  "words": 239,
  "places": [
   "Australia"
  ]
 },
 {
  "id": "the-handsomest-drowned-man",
  "title": "The Handsomest Drowned Man in the World",
  "titleKo": "세상에서 가장 잘생긴 익사체",
  "author": "Gabriel García Márquez",
  "authorKo": "가브리엘 가르시아 마르케스",
  "country": "Colombia",
  "emoji": "🌊",
  "color": "#3a5a8a",
  "cefr": "A2",
  "lexile": "약 720L",
  "words": 242,
  "places": [
   "Colombia"
  ]
 },
 {
  "id": "the-voyages-of-sinbad",
  "title": "The Voyages of Sinbad the Sailor",
  "titleKo": "신드바드의 모험",
  "author": "One Thousand and One Nights",
  "authorKo": "아라비안나이트",
  "country": "Iraq",
  "emoji": "⛵",
  "color": "#2a5a7a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 242,
  "places": [
   "Iraq"
  ]
 },
 {
  "id": "the-giver",
  "title": "The Giver",
  "titleKo": "기억 전달자",
  "author": "Lois Lowry",
  "authorKo": "로이스 로리",
  "country": "United States",
  "emoji": "🍎",
  "color": "#5a6a7a",
  "cefr": "B1",
  "lexile": "약 760L",
  "words": 273,
  "places": [
   "United States"
  ]
 },
 {
  "id": "holes",
  "title": "Holes",
  "titleKo": "구덩이",
  "author": "Louis Sachar",
  "authorKo": "루이스 새커",
  "country": "United States",
  "emoji": "🕳️",
  "color": "#b08a4a",
  "cefr": "B1",
  "lexile": "약 660L",
  "words": 289,
  "places": [
   "United States"
  ]
 },
 {
  "id": "wonder",
  "title": "Wonder",
  "titleKo": "원더",
  "author": "R.J. Palacio",
  "authorKo": "R. J. 팔라시오",
  "country": "United States",
  "emoji": "🚀",
  "color": "#4a7ab0",
  "cefr": "B1",
  "lexile": "약 790L",
  "words": 286,
  "places": [
   "United States"
  ]
 },
 {
  "id": "flipped",
  "title": "Flipped",
  "titleKo": "플립",
  "author": "Wendelin Van Draanen",
  "authorKo": "웬들린 밴 드라닌",
  "country": "United States",
  "emoji": "🌳",
  "color": "#6a9a4a",
  "cefr": "B1",
  "lexile": "약 720L",
  "words": 289,
  "places": [
   "United States"
  ]
 },
 {
  "id": "number-the-stars",
  "title": "Number the Stars",
  "titleKo": "별을 헤아리며",
  "author": "Lois Lowry",
  "authorKo": "로이스 로리",
  "country": "Denmark",
  "emoji": "⭐",
  "color": "#3a5a8a",
  "cefr": "B1",
  "lexile": "약 670L",
  "words": 306,
  "places": [
   "Denmark"
  ]
 },
 {
  "id": "bridge-to-terabithia",
  "title": "Bridge to Terabithia",
  "titleKo": "비밀의 숲 테라비시아",
  "author": "Katherine Paterson",
  "authorKo": "캐서린 패터슨",
  "country": "United States",
  "emoji": "🌉",
  "color": "#4a7a5a",
  "cefr": "B1",
  "lexile": "약 810L",
  "words": 311,
  "places": [
   "United States"
  ]
 },
 {
  "id": "stargirl",
  "title": "Stargirl",
  "titleKo": "스타걸",
  "author": "Jerry Spinelli",
  "authorKo": "제리 스피넬리",
  "country": "United States",
  "emoji": "🌟",
  "color": "#c07a3a",
  "cefr": "B1",
  "lexile": "약 590L",
  "words": 283,
  "places": [
   "United States"
  ]
 },
 {
  "id": "my-side-of-the-mountain",
  "title": "My Side of the Mountain",
  "titleKo": "나의 산에서",
  "author": "Jean Craighead George",
  "authorKo": "진 크레이그헤드 조지",
  "country": "United States",
  "emoji": "🦅",
  "color": "#5a7a3a",
  "cefr": "B1",
  "lexile": "약 810L",
  "words": 301,
  "places": [
   "United States"
  ]
 },
 {
  "id": "a-wrinkle-in-time",
  "title": "A Wrinkle in Time",
  "titleKo": "시간의 주름",
  "author": "Madeleine L’Engle",
  "authorKo": "매들렌 렝글",
  "country": "United States",
  "emoji": "🌀",
  "color": "#4a3a8a",
  "cefr": "B1",
  "lexile": "약 740L",
  "words": 292,
  "places": [
   "United States"
  ]
 },
 {
  "id": "flowers-for-algernon",
  "title": "Flowers for Algernon",
  "titleKo": "앨저넌에게 꽃을",
  "author": "Daniel Keyes",
  "authorKo": "대니얼 키스",
  "country": "United States",
  "emoji": "🐭",
  "color": "#7a8a9a",
  "cefr": "B1",
  "lexile": "약 910L",
  "words": 292,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-miracles-of-the-namiya-general-store",
  "title": "The Miracles of the Namiya General Store",
  "titleKo": "나미야 잡화점의 기적",
  "author": "Keigo Higashino",
  "authorKo": "히가시노 게이고",
  "country": "Japan",
  "emoji": "✉️",
  "color": "#8a6a4a",
  "cefr": "B1",
  "lexile": "약 760L",
  "words": 295,
  "places": [
   "Japan"
  ]
 },
 {
  "id": "the-call-of-the-wild",
  "title": "The Call of the Wild",
  "titleKo": "야성의 부름",
  "author": "Jack London",
  "authorKo": "잭 런던",
  "country": "United States",
  "emoji": "🐺",
  "color": "#6a7a8a",
  "cefr": "B1",
  "lexile": "약 1120L",
  "words": 310,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "white-fang",
  "title": "White Fang",
  "titleKo": "화이트 팽",
  "author": "Jack London",
  "authorKo": "잭 런던",
  "country": "United States",
  "emoji": "🐺",
  "color": "#8a9aaa",
  "cefr": "B1",
  "lexile": "약 970L",
  "words": 297,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "black-beauty",
  "title": "Black Beauty",
  "titleKo": "블랙 뷰티",
  "author": "Anna Sewell",
  "authorKo": "애나 슈얼",
  "country": "United Kingdom",
  "emoji": "🐎",
  "color": "#3a3a4a",
  "cefr": "B1",
  "lexile": "약 1010L",
  "words": 318,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-pearl",
  "title": "The Pearl",
  "titleKo": "진주",
  "author": "John Steinbeck",
  "authorKo": "존 스타인벡",
  "country": "United States",
  "emoji": "🦪",
  "color": "#4a8a9a",
  "cefr": "B1",
  "lexile": "약 680L",
  "words": 308,
  "places": [
   "United States",
   "Mexico"
  ]
 },
 {
  "id": "the-prince-and-the-pauper",
  "title": "The Prince and the Pauper",
  "titleKo": "왕자와 거지",
  "author": "Mark Twain",
  "authorKo": "마크 트웨인",
  "country": "United States",
  "emoji": "👑",
  "color": "#8a5a3a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 317,
  "places": [
   "United States",
   "United Kingdom"
  ]
 },
 {
  "id": "little-lord-fauntleroy",
  "title": "Little Lord Fauntleroy",
  "titleKo": "소공자",
  "author": "Frances Hodgson Burnett",
  "authorKo": "프랜시스 호지슨 버넷",
  "country": "United Kingdom",
  "emoji": "🎩",
  "color": "#6a4a7a",
  "cefr": "B1",
  "lexile": "약 990L",
  "words": 293,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "sounder",
  "title": "Sounder",
  "titleKo": "사운더",
  "author": "William H. Armstrong",
  "authorKo": "윌리엄 H. 암스트롱",
  "country": "United States",
  "emoji": "🐕",
  "color": "#7a5a3a",
  "cefr": "B1",
  "lexile": "약 900L",
  "words": 307,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-time-machine",
  "title": "The Time Machine",
  "titleKo": "타임머신",
  "author": "H. G. Wells",
  "authorKo": "H. G. 웰스",
  "country": "United Kingdom",
  "emoji": "⏳",
  "color": "#6a5a3a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 288,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-war-of-the-worlds",
  "title": "The War of the Worlds",
  "titleKo": "우주 전쟁",
  "author": "H. G. Wells",
  "authorKo": "H. G. 웰스",
  "country": "United Kingdom",
  "emoji": "👽",
  "color": "#7a3a2a",
  "cefr": "B1",
  "lexile": "약 1060L",
  "words": 300,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "fahrenheit-451",
  "title": "Fahrenheit 451",
  "titleKo": "화씨 451",
  "author": "Ray Bradbury",
  "authorKo": "레이 브래드버리",
  "country": "United States",
  "emoji": "🔥",
  "color": "#a04a2a",
  "cefr": "B1",
  "lexile": "약 890L",
  "words": 315,
  "places": [
   "United States"
  ]
 },
 {
  "id": "i-robot",
  "title": "I, Robot",
  "titleKo": "아이, 로봇",
  "author": "Isaac Asimov",
  "authorKo": "아이작 아시모프",
  "country": "United States",
  "emoji": "🤖",
  "color": "#4a6a8a",
  "cefr": "B1",
  "lexile": "약 820L",
  "words": 315,
  "places": [
   "United States"
  ]
 },
 {
  "id": "planet-of-the-apes",
  "title": "Planet of the Apes",
  "titleKo": "혹성 탈출",
  "author": "Pierre Boulle",
  "authorKo": "피에르 불",
  "country": "France",
  "emoji": "🦍",
  "color": "#6a5a4a",
  "cefr": "B1",
  "lexile": "약 980L",
  "words": 318,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-lion-the-witch-and-the-wardrobe",
  "title": "The Lion, the Witch and the Wardrobe",
  "titleKo": "사자와 마녀와 옷장",
  "author": "C. S. Lewis",
  "authorKo": "C. S. 루이스",
  "country": "United Kingdom",
  "emoji": "🦁",
  "color": "#7a6a2a",
  "cefr": "B1",
  "lexile": "약 940L",
  "words": 334,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-neverending-story",
  "title": "The Neverending Story",
  "titleKo": "끝없는 이야기",
  "author": "Michael Ende",
  "authorKo": "미하엘 엔데",
  "country": "Germany",
  "emoji": "📖",
  "color": "#8a3a4a",
  "cefr": "B1",
  "lexile": "약 1010L",
  "words": 312,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "howls-moving-castle",
  "title": "Howl’s Moving Castle",
  "titleKo": "하울의 움직이는 성",
  "author": "Diana Wynne Jones",
  "authorKo": "다이애나 윈 존스",
  "country": "United Kingdom",
  "emoji": "🏰",
  "color": "#5a6a9a",
  "cefr": "B1",
  "lexile": "약 800L",
  "words": 314,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "a-wizard-of-earthsea",
  "title": "A Wizard of Earthsea",
  "titleKo": "어스시의 마법사",
  "author": "Ursula K. Le Guin",
  "authorKo": "어슐러 K. 르 귄",
  "country": "United States",
  "emoji": "🧙",
  "color": "#3a5a6a",
  "cefr": "B1",
  "lexile": "약 1150L",
  "words": 326,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-phantom-tollbooth",
  "title": "The Phantom Tollbooth",
  "titleKo": "팬텀 톨부스",
  "author": "Norton Juster",
  "authorKo": "노턴 저스터",
  "country": "United States",
  "emoji": "🚗",
  "color": "#3a7a8a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 323,
  "places": [
   "United States"
  ]
 },
 {
  "id": "through-the-looking-glass",
  "title": "Through the Looking-Glass",
  "titleKo": "거울 나라의 앨리스",
  "author": "Lewis Carroll",
  "authorKo": "루이스 캐럴",
  "country": "United Kingdom",
  "emoji": "♟️",
  "color": "#8a4a6a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 305,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "harry-potter-and-the-philosophers-stone",
  "title": "Harry Potter and the Philosopher’s Stone",
  "titleKo": "해리 포터와 마법사의 돌",
  "author": "J. K. Rowling",
  "authorKo": "J. K. 롤링",
  "country": "United Kingdom",
  "emoji": "⚡",
  "color": "#7a2a2a",
  "cefr": "B1",
  "lexile": "약 880L",
  "words": 301,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "cyrano-de-bergerac",
  "title": "Cyrano de Bergerac",
  "titleKo": "시라노",
  "author": "Edmond Rostand",
  "authorKo": "에드몽 로스탕",
  "country": "France",
  "emoji": "🎭",
  "color": "#6a3a5a",
  "cefr": "B1",
  "lexile": "약 900L",
  "words": 334,
  "places": [
   "France"
  ]
 },
 {
  "id": "pygmalion-shaw",
  "title": "Pygmalion (Shaw)",
  "titleKo": "피그말리온(버나드 쇼)",
  "author": "George Bernard Shaw",
  "authorKo": "조지 버나드 쇼",
  "country": "Ireland",
  "emoji": "🌹",
  "color": "#7a4a5a",
  "cefr": "B1",
  "lexile": "약 880L",
  "words": 323,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "a-dolls-house",
  "title": "A Doll’s House",
  "titleKo": "인형의 집",
  "author": "Henrik Ibsen",
  "authorKo": "헨리크 입센",
  "country": "Norway",
  "emoji": "🏠",
  "color": "#9a6a4a",
  "cefr": "B1",
  "lexile": "약 870L",
  "words": 324,
  "places": [
   "Norway"
  ]
 },
 {
  "id": "antigone",
  "title": "Antigone",
  "titleKo": "안티고네",
  "author": "Sophocles",
  "authorKo": "소포클레스",
  "country": "Greece",
  "emoji": "🏛️",
  "color": "#8a7a5a",
  "cefr": "B1",
  "lexile": "약 900L",
  "words": 316,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-speckled-band",
  "title": "The Adventure of the Speckled Band",
  "titleKo": "셜록 홈즈: 얼룩 끈",
  "author": "Arthur Conan Doyle",
  "authorKo": "아서 코난 도일",
  "country": "United Kingdom",
  "emoji": "🐍",
  "color": "#4a5a3a",
  "cefr": "B1",
  "lexile": "약 960L",
  "words": 338,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "a-scandal-in-bohemia",
  "title": "A Scandal in Bohemia",
  "titleKo": "셜록 홈즈: 보헤미아 스캔들",
  "author": "Arthur Conan Doyle",
  "authorKo": "아서 코난 도일",
  "country": "United Kingdom",
  "emoji": "📷",
  "color": "#5a4a6a",
  "cefr": "B1",
  "lexile": "약 940L",
  "words": 334,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "arsene-lupin-gentleman-thief",
  "title": "Arsène Lupin, Gentleman-Thief",
  "titleKo": "괴도 신사 아르센 뤼팽",
  "author": "Maurice Leblanc",
  "authorKo": "모리스 르블랑",
  "country": "France",
  "emoji": "🎩",
  "color": "#2a2a4a",
  "cefr": "B1",
  "lexile": "약 950L",
  "words": 327,
  "places": [
   "France"
  ]
 },
 {
  "id": "murder-on-the-orient-express",
  "title": "Murder on the Orient Express",
  "titleKo": "오리엔트 특급 살인",
  "author": "Agatha Christie",
  "authorKo": "애거사 크리스티",
  "country": "United Kingdom",
  "emoji": "🚂",
  "color": "#5a3a2a",
  "cefr": "B1",
  "lexile": "약 640L",
  "words": 304,
  "places": [
   "United Kingdom",
   "Turkey"
  ]
 },
 {
  "id": "the-velveteen-rabbit",
  "title": "The Velveteen Rabbit",
  "titleKo": "헝겊 토끼의 눈물",
  "author": "Margery Williams",
  "authorKo": "마저리 윌리엄스",
  "country": "United Kingdom",
  "emoji": "🐰",
  "color": "#a08a7a",
  "cefr": "A1",
  "lexile": "약 820L",
  "words": 169,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-rainbow-fish",
  "title": "The Rainbow Fish",
  "titleKo": "무지개 물고기",
  "author": "Marcus Pfister",
  "authorKo": "마르쿠스 피스터",
  "country": "Switzerland",
  "emoji": "🐠",
  "color": "#3a7ab0",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 177,
  "places": [
   "Switzerland"
  ]
 },
 {
  "id": "little-red-riding-hood",
  "title": "Little Red Riding Hood",
  "titleKo": "빨간 모자",
  "author": "Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "🧺",
  "color": "#b03a3a",
  "cefr": "A2",
  "lexile": "약 380L",
  "words": 192,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "jack-and-the-beanstalk",
  "title": "Jack and the Beanstalk",
  "titleKo": "잭과 콩나무",
  "author": "English Fairy Tale",
  "authorKo": "영국 전래동화",
  "country": "United Kingdom",
  "emoji": "🌱",
  "color": "#4a8a3a",
  "cefr": "A2",
  "lexile": "약 400L",
  "words": 200,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-three-little-pigs",
  "title": "The Three Little Pigs",
  "titleKo": "아기 돼지 삼형제",
  "author": "English Fairy Tale",
  "authorKo": "영국 전래동화",
  "country": "United Kingdom",
  "emoji": "🐷",
  "color": "#c07a8a",
  "cefr": "A2",
  "lexile": "약 360L",
  "words": 206,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "sleeping-beauty",
  "title": "Sleeping Beauty",
  "titleKo": "잠자는 숲속의 공주",
  "author": "Charles Perrault",
  "authorKo": "샤를 페로",
  "country": "France",
  "emoji": "🌹",
  "color": "#9a5a8a",
  "cefr": "A2",
  "lexile": "약 410L",
  "words": 221,
  "places": [
   "France"
  ]
 },
 {
  "id": "beauty-and-the-beast",
  "title": "Beauty and the Beast",
  "titleKo": "미녀와 야수",
  "author": "Jeanne-Marie Leprince de Beaumont",
  "authorKo": "잔마리 르프랭스 드 보몽",
  "country": "France",
  "emoji": "🥀",
  "color": "#8a3a5a",
  "cefr": "A2",
  "lexile": "약 420L",
  "words": 222,
  "places": [
   "France"
  ]
 },
 {
  "id": "puss-in-boots",
  "title": "Puss in Boots",
  "titleKo": "장화 신은 고양이",
  "author": "Charles Perrault",
  "authorKo": "샤를 페로",
  "country": "France",
  "emoji": "🐈",
  "color": "#a07a3a",
  "cefr": "A2",
  "lexile": "약 430L",
  "words": 222,
  "places": [
   "France"
  ]
 },
 {
  "id": "goldilocks-and-the-three-bears",
  "title": "Goldilocks and the Three Bears",
  "titleKo": "골디락스와 곰 세 마리",
  "author": "Robert Southey",
  "authorKo": "로버트 사우디",
  "country": "United Kingdom",
  "emoji": "🐻",
  "color": "#b0803a",
  "cefr": "A2",
  "lexile": "약 350L",
  "words": 214,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-nutcracker",
  "title": "The Nutcracker",
  "titleKo": "호두까기 인형",
  "author": "E. T. A. Hoffmann",
  "authorKo": "E. T. A. 호프만",
  "country": "Germany",
  "emoji": "🎄",
  "color": "#7a2a3a",
  "cefr": "A2",
  "lexile": "약 450L",
  "words": 209,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "the-tale-of-peter-rabbit",
  "title": "The Tale of Peter Rabbit",
  "titleKo": "피터 래빗 이야기",
  "author": "Beatrix Potter",
  "authorKo": "베아트릭스 포터",
  "country": "United Kingdom",
  "emoji": "🐇",
  "color": "#5a7a9a",
  "cefr": "A2",
  "lexile": "약 450L",
  "words": 205,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "winnie-the-pooh",
  "title": "Winnie-the-Pooh",
  "titleKo": "곰돌이 푸",
  "author": "A. A. Milne",
  "authorKo": "A. A. 밀른",
  "country": "United Kingdom",
  "emoji": "🍯",
  "color": "#c09a3a",
  "cefr": "A2",
  "lexile": "약 520L",
  "words": 225,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-gruffalo",
  "title": "The Gruffalo",
  "titleKo": "그루팔로",
  "author": "Julia Donaldson",
  "authorKo": "줄리아 도널드슨",
  "country": "United Kingdom",
  "emoji": "🐭",
  "color": "#6a5a3a",
  "cefr": "A2",
  "lexile": "약 350L",
  "words": 212,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-polar-express",
  "title": "The Polar Express",
  "titleKo": "폴라 익스프레스",
  "author": "Chris Van Allsburg",
  "authorKo": "크리스 반 알스버그",
  "country": "United States",
  "emoji": "🚂",
  "color": "#3a4a7a",
  "cefr": "A2",
  "lexile": "약 520L",
  "words": 196,
  "places": [
   "United States"
  ]
 },
 {
  "id": "jumanji",
  "title": "Jumanji",
  "titleKo": "쥬만지",
  "author": "Chris Van Allsburg",
  "authorKo": "크리스 반 알스버그",
  "country": "United States",
  "emoji": "🎲",
  "color": "#4a6a3a",
  "cefr": "A2",
  "lexile": "약 620L",
  "words": 196,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-dog-and-his-reflection",
  "title": "The Dog and His Reflection",
  "titleKo": "욕심 많은 개",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐕",
  "color": "#8a6a4a",
  "cefr": "A1",
  "lexile": "약 360L",
  "words": 148,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-lion-and-the-three-bulls",
  "title": "The Lion and the Three Bulls",
  "titleKo": "사자와 황소 세 마리",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐂",
  "color": "#7a5a3a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 161,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-fox-and-the-goat",
  "title": "The Fox and the Goat",
  "titleKo": "여우와 염소",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐐",
  "color": "#8a7a4a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 174,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-hares-and-the-frogs",
  "title": "The Hares and the Frogs",
  "titleKo": "겁쟁이 토끼들",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐸",
  "color": "#5a8a5a",
  "cefr": "A1",
  "lexile": "약 390L",
  "words": 163,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-monkey-and-the-cat",
  "title": "The Monkey and the Cat",
  "titleKo": "원숭이와 고양이",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐒",
  "color": "#9a6a3a",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 172,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-stag-at-the-pool",
  "title": "The Stag at the Pool",
  "titleKo": "사슴과 사자",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦌",
  "color": "#7a6a4a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 178,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-crab-and-his-mother",
  "title": "The Crab and His Mother",
  "titleKo": "게와 엄마 게",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦀",
  "color": "#c05a3a",
  "cefr": "A1",
  "lexile": "약 380L",
  "words": 160,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-bat-and-the-weasels",
  "title": "The Bat and the Weasels",
  "titleKo": "박쥐와 족제비",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦇",
  "color": "#4a3a5a",
  "cefr": "A1",
  "lexile": "약 400L",
  "words": 179,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-peacock-and-the-crane",
  "title": "The Peacock and the Crane",
  "titleKo": "공작과 두루미",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦚",
  "color": "#2a6a6a",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 164,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-fox-and-the-woodcutter",
  "title": "The Fox and the Woodcutter",
  "titleKo": "여우와 나무꾼",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦊",
  "color": "#b0602a",
  "cefr": "A1",
  "lexile": "약 410L",
  "words": 165,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-trees-and-the-axe",
  "title": "The Trees and the Axe",
  "titleKo": "나무와 도끼",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🪓",
  "color": "#5a6a3a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 172,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-bee-and-jupiter",
  "title": "The Bee and Jupiter",
  "titleKo": "꿀벌과 제우스",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🐝",
  "color": "#c0a02a",
  "cefr": "A1",
  "lexile": "약 430L",
  "words": 177,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-lion-in-love",
  "title": "The Lion in Love",
  "titleKo": "사랑에 빠진 사자",
  "author": "Aesop",
  "authorKo": "이솝",
  "country": "Greece",
  "emoji": "🦁",
  "color": "#b08a3a",
  "cefr": "A1",
  "lexile": "약 420L",
  "words": 177,
  "places": [
   "Greece"
  ]
 },
 {
  "id": "the-very-hungry-caterpillar",
  "title": "The Very Hungry Caterpillar",
  "titleKo": "배고픈 애벌레",
  "author": "Eric Carle",
  "authorKo": "에릭 칼",
  "country": "United States",
  "emoji": "🐛",
  "color": "#4f8a3c",
  "cefr": "A0",
  "lexile": "약 460L",
  "words": 106,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-little-red-hen",
  "title": "The Little Red Hen",
  "titleKo": "빨간 암탉",
  "author": "English Folktale",
  "authorKo": "영국 민담",
  "country": "United Kingdom",
  "emoji": "🐔",
  "color": "#b5452f",
  "cefr": "A0",
  "lexile": "약 400L",
  "words": 109,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-gingerbread-man",
  "title": "The Gingerbread Man",
  "titleKo": "진저브레드맨",
  "author": "American Folktale",
  "authorKo": "미국 민담",
  "country": "United States",
  "emoji": "🍪",
  "color": "#a8642c",
  "cefr": "A0",
  "lexile": "약 450L",
  "words": 106,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-enormous-turnip",
  "title": "The Enormous Turnip",
  "titleKo": "커다란 순무",
  "author": "Russian Folktale",
  "authorKo": "러시아 민담",
  "country": "Russia",
  "emoji": "🥬",
  "color": "#7a4f8f",
  "cefr": "A0",
  "lexile": "약 350L",
  "words": 100,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "henny-penny",
  "title": "Henny Penny",
  "titleKo": "하늘이 무너진대요",
  "author": "English Folktale",
  "authorKo": "영국 민담",
  "country": "United Kingdom",
  "emoji": "🌰",
  "color": "#c08a2e",
  "cefr": "A0",
  "lexile": "약 420L",
  "words": 98,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "three-billy-goats-gruff",
  "title": "Three Billy Goats Gruff",
  "titleKo": "염소 삼형제",
  "author": "Norwegian Folktale",
  "authorKo": "노르웨이 민담",
  "country": "Norway",
  "emoji": "🐐",
  "color": "#5b7d3a",
  "cefr": "A0",
  "lexile": "약 400L",
  "words": 98,
  "places": [
   "Norway"
  ]
 },
 {
  "id": "where-the-wild-things-are",
  "title": "Where the Wild Things Are",
  "titleKo": "괴물들이 사는 나라",
  "author": "Maurice Sendak",
  "authorKo": "모리스 샌닥",
  "country": "United States",
  "emoji": "👑",
  "color": "#3f6e6a",
  "cefr": "A0",
  "lexile": "약 740L",
  "words": 99,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-elves-and-the-shoemaker",
  "title": "The Elves and the Shoemaker",
  "titleKo": "요정과 구두장이",
  "author": "Brothers Grimm",
  "authorKo": "그림 형제",
  "country": "Germany",
  "emoji": "👞",
  "color": "#6b4a8a",
  "cefr": "A0",
  "lexile": "약 500L",
  "words": 106,
  "places": [
   "Germany"
  ]
 },
 {
  "id": "stone-soup",
  "title": "Stone Soup",
  "titleKo": "돌멩이 수프",
  "author": "French Folktale",
  "authorKo": "프랑스 민담",
  "country": "France",
  "emoji": "🍲",
  "color": "#8a5a2b",
  "cefr": "A0",
  "lexile": "약 450L",
  "words": 103,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-mitten",
  "title": "The Mitten",
  "titleKo": "털장갑",
  "author": "Ukrainian Folktale",
  "authorKo": "우크라이나 민담",
  "country": "Ukraine",
  "emoji": "🧤",
  "color": "#3a6ea5",
  "cefr": "A0",
  "lexile": "약 500L",
  "words": 95,
  "places": [
   "Ukraine"
  ]
 },
 {
  "id": "cloudy-with-a-chance-of-meatballs",
  "title": "Cloudy with a Chance of Meatballs",
  "titleKo": "하늘에서 음식이 내린다면",
  "author": "Judi Barrett",
  "authorKo": "주디 바레트",
  "country": "United States",
  "emoji": "🍝",
  "color": "#c0602a",
  "cefr": "A1",
  "lexile": "약 730L",
  "words": 130,
  "places": [
   "United States"
  ]
 },
 {
  "id": "strega-nona",
  "title": "Strega Nona",
  "titleKo": "마법 냄비 할머니 스트레가 노나",
  "author": "Tomie dePaola",
  "authorKo": "토미 드 파올라",
  "country": "United States",
  "emoji": "🍜",
  "color": "#7a5a9a",
  "cefr": "A1",
  "lexile": "약 640L",
  "words": 148,
  "places": [
   "United States",
   "Italy"
  ]
 },
 {
  "id": "hope-for-the-flowers",
  "title": "Hope for the Flowers",
  "titleKo": "꽃들에게 희망을",
  "author": "Trina Paulus",
  "authorKo": "트리나 폴러스",
  "country": "United States",
  "emoji": "🦋",
  "color": "#d29a2a",
  "cefr": "A1",
  "lexile": "약 560L",
  "words": 134,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-selfish-giant",
  "title": "The Selfish Giant",
  "titleKo": "거인의 정원",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🌸",
  "color": "#5a8a6a",
  "cefr": "A1",
  "lexile": "약 650L",
  "words": 171,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-three-questions",
  "title": "The Three Questions",
  "titleKo": "세 가지 질문",
  "author": "Leo Tolstoy",
  "authorKo": "레프 톨스토이",
  "country": "Russia",
  "emoji": "❓",
  "color": "#4a6a8a",
  "cefr": "A1",
  "lexile": "약 620L",
  "words": 150,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-spiders-thread",
  "title": "The Spider’s Thread",
  "titleKo": "거미줄",
  "author": "Ryunosuke Akutagawa",
  "authorKo": "아쿠타가와 류노스케",
  "country": "Japan",
  "emoji": "🕸️",
  "color": "#5a5a7a",
  "cefr": "A1",
  "lexile": "약 600L",
  "words": 136,
  "places": [
   "Japan"
  ]
 },
 {
  "id": "charlottes-web",
  "title": "Charlotte’s Web",
  "titleKo": "샬롯의 거미줄",
  "author": "E. B. White",
  "authorKo": "E. B. 화이트",
  "country": "United States",
  "emoji": "🕷️",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 680L",
  "words": 184,
  "places": [
   "United States"
  ]
 },
 {
  "id": "stuart-little",
  "title": "Stuart Little",
  "titleKo": "스튜어트 리틀",
  "author": "E. B. White",
  "authorKo": "E. B. 화이트",
  "country": "United States",
  "emoji": "🐭",
  "color": "#5a7a9a",
  "cefr": "A2",
  "lexile": "약 920L",
  "words": 187,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-trumpet-of-the-swan",
  "title": "The Trumpet of the Swan",
  "titleKo": "트럼펫 부는 백조",
  "author": "E. B. White",
  "authorKo": "E. B. 화이트",
  "country": "United States",
  "emoji": "🎺",
  "color": "#3a7a8a",
  "cefr": "A2",
  "lexile": "약 750L",
  "words": 180,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "pippi-longstocking",
  "title": "Pippi Longstocking",
  "titleKo": "말괄량이 삐삐",
  "author": "Astrid Lindgren",
  "authorKo": "아스트리드 린드그렌",
  "country": "Sweden",
  "emoji": "🧦",
  "color": "#c0502a",
  "cefr": "A2",
  "lexile": "약 870L",
  "words": 183,
  "places": [
   "Sweden"
  ]
 },
 {
  "id": "mary-poppins",
  "title": "Mary Poppins",
  "titleKo": "메리 포핀스",
  "author": "P. L. Travers",
  "authorKo": "P. L. 트래버스",
  "country": "United Kingdom",
  "emoji": "☂️",
  "color": "#2f4f7a",
  "cefr": "A2",
  "lexile": "약 760L",
  "words": 183,
  "places": [
   "United Kingdom",
   "Australia"
  ]
 },
 {
  "id": "a-bear-called-paddington",
  "title": "A Bear Called Paddington",
  "titleKo": "내 이름은 패딩턴",
  "author": "Michael Bond",
  "authorKo": "마이클 본드",
  "country": "United Kingdom",
  "emoji": "🧸",
  "color": "#2a5a8a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 181,
  "places": [
   "United Kingdom",
   "Peru"
  ]
 },
 {
  "id": "matilda",
  "title": "Matilda",
  "titleKo": "마틸다",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "📚",
  "color": "#8a3a5a",
  "cefr": "A2",
  "lexile": "약 840L",
  "words": 185,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-witches",
  "title": "The Witches",
  "titleKo": "마녀를 잡아라",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "🧙‍♀️",
  "color": "#4a3a6a",
  "cefr": "A2",
  "lexile": "약 740L",
  "words": 195,
  "places": [
   "United Kingdom",
   "Norway"
  ]
 },
 {
  "id": "james-and-the-giant-peach",
  "title": "James and the Giant Peach",
  "titleKo": "제임스와 슈퍼 복숭아",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "🍑",
  "color": "#d0703a",
  "cefr": "A2",
  "lexile": "약 870L",
  "words": 196,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "the-wind-in-the-willows",
  "title": "The Wind in the Willows",
  "titleKo": "버드나무에 부는 바람",
  "author": "Kenneth Grahame",
  "authorKo": "케네스 그레이엄",
  "country": "United Kingdom",
  "emoji": "🐸",
  "color": "#4a7a4a",
  "cefr": "A2",
  "lexile": "약 1140L",
  "words": 187,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "bambi",
  "title": "Bambi, a Life in the Woods",
  "titleKo": "밤비",
  "author": "Felix Salten",
  "authorKo": "펠릭스 잘텐",
  "country": "Austria",
  "emoji": "🦌",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 870L",
  "words": 191,
  "places": [
   "Austria"
  ]
 },
 {
  "id": "pollyanna",
  "title": "Pollyanna",
  "titleKo": "폴리애나",
  "author": "Eleanor H. Porter",
  "authorKo": "엘리너 H. 포터",
  "country": "United States",
  "emoji": "😊",
  "color": "#c08a3a",
  "cefr": "A2",
  "lexile": "약 1050L",
  "words": 183,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-railway-children",
  "title": "The Railway Children",
  "titleKo": "철도의 아이들",
  "author": "Edith Nesbit",
  "authorKo": "이디스 네스빗",
  "country": "United Kingdom",
  "emoji": "🚂",
  "color": "#7a3a2a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 188,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "diary-of-a-wimpy-kid",
  "title": "Diary of a Wimpy Kid",
  "titleKo": "윔피 키드",
  "author": "Jeff Kinney",
  "authorKo": "제프 키니",
  "country": "United States",
  "emoji": "📓",
  "color": "#3a6a3a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 188,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-nightingale-and-the-rose",
  "title": "The Nightingale and the Rose",
  "titleKo": "나이팅게일과 장미",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🌹",
  "color": "#9a2a3a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 207,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-devoted-friend",
  "title": "The Devoted Friend",
  "titleKo": "헌신적인 친구",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🛒",
  "color": "#6a7a3a",
  "cefr": "A2",
  "lexile": "약 980L",
  "words": 197,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-remarkable-rocket",
  "title": "The Remarkable Rocket",
  "titleKo": "잘난 척하는 로켓 폭죽",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🎆",
  "color": "#3a3a7a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 191,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "how-much-land-does-a-man-need",
  "title": "How Much Land Does a Man Need?",
  "titleKo": "사람에게는 얼마만큼의 땅이 필요한가",
  "author": "Leo Tolstoy",
  "authorKo": "레프 톨스토이",
  "country": "Russia",
  "emoji": "🌾",
  "color": "#8a7a2a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 187,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-chameleon",
  "title": "The Chameleon",
  "titleKo": "카멜레온",
  "author": "Anton Chekhov",
  "authorKo": "안톤 체호프",
  "country": "Russia",
  "emoji": "🦎",
  "color": "#3a7a5a",
  "cefr": "A2",
  "lexile": "약 850L",
  "words": 181,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "vanka",
  "title": "Vanka",
  "titleKo": "반카",
  "author": "Anton Chekhov",
  "authorKo": "안톤 체호프",
  "country": "Russia",
  "emoji": "✉️",
  "color": "#4a5a7a",
  "cefr": "A2",
  "lexile": "약 880L",
  "words": 180,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-lottery-ticket",
  "title": "The Lottery Ticket",
  "titleKo": "복권",
  "author": "Anton Chekhov",
  "authorKo": "안톤 체호프",
  "country": "Russia",
  "emoji": "🎟️",
  "color": "#7a5a2a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 199,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-death-of-a-government-clerk",
  "title": "The Death of a Government Clerk",
  "titleKo": "관리의 죽음",
  "author": "Anton Chekhov",
  "authorKo": "안톤 체호프",
  "country": "Russia",
  "emoji": "🤧",
  "color": "#5a4a6a",
  "cefr": "A2",
  "lexile": "약 880L",
  "words": 183,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-piece-of-string",
  "title": "The Piece of String",
  "titleKo": "끈 한 오라기",
  "author": "Guy de Maupassant",
  "authorKo": "기 드 모파상",
  "country": "France",
  "emoji": "🧵",
  "color": "#6a5a3a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 200,
  "places": [
   "France"
  ]
 },
 {
  "id": "master-cornilles-secret",
  "title": "Master Cornille’s Secret",
  "titleKo": "코르니유 영감의 비밀",
  "author": "Alphonse Daudet",
  "authorKo": "알퐁스 도데",
  "country": "France",
  "emoji": "🌬️",
  "color": "#7a6a4a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 184,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-man-with-the-golden-brain",
  "title": "The Man with the Golden Brain",
  "titleKo": "황금 뇌를 가진 사나이",
  "author": "Alphonse Daudet",
  "authorKo": "알퐁스 도데",
  "country": "France",
  "emoji": "🧠",
  "color": "#a8842a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 216,
  "places": [
   "France"
  ]
 },
 {
  "id": "the-open-window",
  "title": "The Open Window",
  "titleKo": "열린 창문",
  "author": "Saki",
  "authorKo": "사키",
  "country": "United Kingdom",
  "emoji": "🪟",
  "color": "#4a6a5a",
  "cefr": "A2",
  "lexile": "약 990L",
  "words": 199,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "all-summer-in-a-day",
  "title": "All Summer in a Day",
  "titleKo": "하루뿐인 여름",
  "author": "Ray Bradbury",
  "authorKo": "레이 브래드버리",
  "country": "United States",
  "emoji": "☀️",
  "color": "#c08a2a",
  "cefr": "A2",
  "lexile": "약 800L",
  "words": 181,
  "places": [
   "United States"
  ]
 },
 {
  "id": "there-will-come-soft-rains",
  "title": "There Will Come Soft Rains",
  "titleKo": "부드러운 비가 내리리",
  "author": "Ray Bradbury",
  "authorKo": "레이 브래드버리",
  "country": "United States",
  "emoji": "🏠",
  "color": "#4a4a5a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 184,
  "places": [
   "United States"
  ]
 },
 {
  "id": "thank-you-mam",
  "title": "Thank You, M’am",
  "titleKo": "고마워요, 아주머니",
  "author": "Langston Hughes",
  "authorKo": "랭스턴 휴스",
  "country": "United States",
  "emoji": "👟",
  "color": "#6a3a5a",
  "cefr": "A2",
  "lexile": "약 660L",
  "words": 190,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-secret-life-of-walter-mitty",
  "title": "The Secret Life of Walter Mitty",
  "titleKo": "월터 미티의 은밀한 생활",
  "author": "James Thurber",
  "authorKo": "제임스 서버",
  "country": "United States",
  "emoji": "💭",
  "color": "#3a5a7a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 193,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-bet",
  "title": "The Bet",
  "titleKo": "내기",
  "author": "Anton Chekhov",
  "authorKo": "안톤 체호프",
  "country": "Russia",
  "emoji": "📖",
  "color": "#5a4a3a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 262,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "the-gold-bug",
  "title": "The Gold-Bug",
  "titleKo": "황금 벌레",
  "author": "Edgar Allan Poe",
  "authorKo": "에드거 앨런 포",
  "country": "United States",
  "emoji": "🪲",
  "color": "#a8842a",
  "cefr": "B1",
  "lexile": "약 1060L",
  "words": 251,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-purloined-letter",
  "title": "The Purloined Letter",
  "titleKo": "도둑맞은 편지",
  "author": "Edgar Allan Poe",
  "authorKo": "에드거 앨런 포",
  "country": "United States",
  "emoji": "✉️",
  "color": "#3a4a6a",
  "cefr": "B1",
  "lexile": "약 1150L",
  "words": 250,
  "places": [
   "United States",
   "France"
  ]
 },
 {
  "id": "the-last-question",
  "title": "The Last Question",
  "titleKo": "마지막 질문",
  "author": "Isaac Asimov",
  "authorKo": "아이작 아시모프",
  "country": "United States",
  "emoji": "🌌",
  "color": "#1f2a5a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 254,
  "places": [
   "United States",
   "Russia"
  ]
 },
 {
  "id": "harrison-bergeron",
  "title": "Harrison Bergeron",
  "titleKo": "해리슨 버저론",
  "author": "Kurt Vonnegut",
  "authorKo": "커트 보니것",
  "country": "United States",
  "emoji": "⚖️",
  "color": "#5a3a3a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 255,
  "places": [
   "United States"
  ]
 },
 {
  "id": "everyday-use",
  "title": "Everyday Use",
  "titleKo": "일상의 쓰임",
  "author": "Alice Walker",
  "authorKo": "앨리스 워커",
  "country": "United States",
  "emoji": "🧵",
  "color": "#8a4a2a",
  "cefr": "B1",
  "lexile": "약 900L",
  "words": 263,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-lesson",
  "title": "The Lesson",
  "titleKo": "수업",
  "author": "Toni Cade Bambara",
  "authorKo": "토니 케이드 뱀바라",
  "country": "United States",
  "emoji": "⛵",
  "color": "#3a6a8a",
  "cefr": "B1",
  "lexile": "약 870L",
  "words": 260,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-curious-case-of-benjamin-button",
  "title": "The Curious Case of Benjamin Button",
  "titleKo": "벤자민 버튼의 시간은 거꾸로 간다",
  "author": "F. Scott Fitzgerald",
  "authorKo": "F. 스콧 피츠제럴드",
  "country": "United States",
  "emoji": "⏳",
  "color": "#5a6a7a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 254,
  "places": [
   "United States"
  ]
 },
 {
  "id": "to-build-a-fire",
  "title": "To Build a Fire",
  "titleKo": "불을 지피다",
  "author": "Jack London",
  "authorKo": "잭 런던",
  "country": "United States",
  "emoji": "🔥",
  "color": "#3a5a7a",
  "cefr": "B1",
  "lexile": "약 970L",
  "words": 265,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "a-piece-of-steak",
  "title": "A Piece of Steak",
  "titleKo": "스테이크 한 조각",
  "author": "Jack London",
  "authorKo": "잭 런던",
  "country": "United States",
  "emoji": "🥩",
  "color": "#8a3a3a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 257,
  "places": [
   "United States",
   "Australia"
  ]
 },
 {
  "id": "my-old-home",
  "title": "My Old Home",
  "titleKo": "고향",
  "author": "Lu Xun",
  "authorKo": "루쉰",
  "country": "China",
  "emoji": "🏡",
  "color": "#6a5a4a",
  "cefr": "B1",
  "lexile": "약 950L",
  "words": 255,
  "places": [
   "China"
  ]
 },
 {
  "id": "a-lucky-day",
  "title": "A Lucky Day",
  "titleKo": "운수 좋은 날",
  "author": "Hyun Jin-geon",
  "authorKo": "현진건",
  "country": "South Korea",
  "emoji": "🌧️",
  "color": "#4a5a6a",
  "cefr": "B1",
  "lexile": "약 900L",
  "words": 255,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "a-very-old-man-with-enormous-wings",
  "title": "A Very Old Man with Enormous Wings",
  "titleKo": "거대한 날개를 가진 아주 늙은 남자",
  "author": "Gabriel García Márquez",
  "authorKo": "가브리엘 가르시아 마르케스",
  "country": "Colombia",
  "emoji": "🪽",
  "color": "#6a7a5a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 257,
  "places": [
   "Colombia"
  ]
 },
 {
  "id": "the-paper-menagerie",
  "title": "The Paper Menagerie",
  "titleKo": "종이 동물원",
  "author": "Ken Liu",
  "authorKo": "켄 리우",
  "country": "United States",
  "emoji": "🐅",
  "color": "#b05a2a",
  "cefr": "B1",
  "lexile": "약 950L",
  "words": 261,
  "places": [
   "United States",
   "China"
  ]
 },
 {
  "id": "the-invisible-collection",
  "title": "The Invisible Collection",
  "titleKo": "보이지 않는 소장품",
  "author": "Stefan Zweig",
  "authorKo": "슈테판 츠바이크",
  "country": "Austria",
  "emoji": "🖼️",
  "color": "#5a4a6a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 253,
  "places": [
   "Austria",
   "Germany"
  ]
 },
 {
  "id": "the-overcoat",
  "title": "The Overcoat",
  "titleKo": "외투",
  "author": "Nikolai Gogol",
  "authorKo": "니콜라이 고골",
  "country": "Russia",
  "emoji": "🧥",
  "color": "#4a4a5a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 254,
  "places": [
   "Russia",
   "Ukraine"
  ]
 },
 {
  "id": "the-country-of-the-blind",
  "title": "The Country of the Blind",
  "titleKo": "눈먼 자들의 나라",
  "author": "H. G. Wells",
  "authorKo": "H. G. 웰스",
  "country": "United Kingdom",
  "emoji": "🏔️",
  "color": "#3a5a4a",
  "cefr": "B1",
  "lexile": "약 1100L",
  "words": 256,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-door-in-the-wall",
  "title": "The Door in the Wall",
  "titleKo": "벽 속의 문",
  "author": "H. G. Wells",
  "authorKo": "H. G. 웰스",
  "country": "United Kingdom",
  "emoji": "🚪",
  "color": "#2f6a4a",
  "cefr": "B1",
  "lexile": "약 1100L",
  "words": 258,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "rip-van-winkle",
  "title": "Rip Van Winkle",
  "titleKo": "립 밴 윙클",
  "author": "Washington Irving",
  "authorKo": "워싱턴 어빙",
  "country": "United States",
  "emoji": "😴",
  "color": "#6a5a3a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 200,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-nose",
  "title": "The Nose",
  "titleKo": "코",
  "author": "Ryunosuke Akutagawa",
  "authorKo": "아쿠타가와 류노스케",
  "country": "Japan",
  "emoji": "👃",
  "color": "#8a5a4a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 215,
  "places": [
   "Japan"
  ]
 },
 {
  "id": "the-grasshopper-and-the-bell-cricket",
  "title": "The Grasshopper and the Bell Cricket",
  "titleKo": "메뚜기와 방울벌레",
  "author": "Yasunari Kawabata",
  "authorKo": "가와바타 야스나리",
  "country": "Japan",
  "emoji": "🏮",
  "color": "#a8642c",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 206,
  "places": [
   "Japan"
  ]
 },
 {
  "id": "the-camellias",
  "title": "The Camellias",
  "titleKo": "동백꽃",
  "author": "Kim Yu-jeong",
  "authorKo": "김유정",
  "country": "South Korea",
  "emoji": "🌼",
  "color": "#c8962a",
  "cefr": "A2",
  "lexile": "약 850L",
  "words": 225,
  "places": [
   "South Korea"
  ]
 },
 {
  "id": "breaking-the-pig",
  "title": "Breaking the Pig",
  "titleKo": "돼지 저금통 깨기",
  "author": "Etgar Keret",
  "authorKo": "에트가르 케레트",
  "country": "Israel",
  "emoji": "🐷",
  "color": "#c06a7a",
  "cefr": "A2",
  "lexile": "약 800L",
  "words": 230,
  "places": [
   "Israel"
  ]
 },
 {
  "id": "the-luncheon",
  "title": "The Luncheon",
  "titleKo": "점심",
  "author": "W. Somerset Maugham",
  "authorKo": "서머싯 몸",
  "country": "United Kingdom",
  "emoji": "🍽️",
  "color": "#7a4a3a",
  "cefr": "A2",
  "lexile": "약 1000L",
  "words": 233,
  "places": [
   "United Kingdom",
   "France"
  ]
 },
 {
  "id": "the-ant-and-the-grasshopper-maugham",
  "title": "The Ant and the Grasshopper (Maugham)",
  "titleKo": "개미와 베짱이 (서머싯 몸)",
  "author": "W. Somerset Maugham",
  "authorKo": "서머싯 몸",
  "country": "United Kingdom",
  "emoji": "🦗",
  "color": "#5a7a3a",
  "cefr": "A2",
  "lexile": "약 1050L",
  "words": 213,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-monkey-and-the-crocodile",
  "title": "The Monkey and the Crocodile",
  "titleKo": "원숭이와 악어",
  "author": "Panchatantra",
  "authorKo": "판차탄트라",
  "country": "India",
  "emoji": "🐊",
  "color": "#4a7a3a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 135,
  "places": [
   "India"
  ]
 },
 {
  "id": "the-lion-and-the-clever-rabbit",
  "title": "The Lion and the Clever Rabbit",
  "titleKo": "사자와 꾀 많은 토끼",
  "author": "Panchatantra",
  "authorKo": "판차탄트라",
  "country": "India",
  "emoji": "🐇",
  "color": "#a8842a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 140,
  "places": [
   "India"
  ]
 },
 {
  "id": "the-tortoise-and-the-geese",
  "title": "The Tortoise and the Geese",
  "titleKo": "거북과 기러기",
  "author": "Panchatantra",
  "authorKo": "판차탄트라",
  "country": "India",
  "emoji": "🐢",
  "color": "#3a7a6a",
  "cefr": "A1",
  "lexile": "약 450L",
  "words": 132,
  "places": [
   "India"
  ]
 },
 {
  "id": "the-epic-of-gilgamesh",
  "title": "The Epic of Gilgamesh",
  "titleKo": "길가메시 서사시",
  "author": "Ancient Mesopotamia",
  "authorKo": "고대 메소포타미아",
  "country": "Iraq",
  "emoji": "🏛️",
  "color": "#8a6a3a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 226,
  "places": [
   "Iraq"
  ]
 },
 {
  "id": "the-ramayana",
  "title": "The Ramayana",
  "titleKo": "라마야나",
  "author": "Valmiki",
  "authorKo": "발미키",
  "country": "India",
  "emoji": "🏹",
  "color": "#c0602a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 207,
  "places": [
   "India",
   "Sri Lanka"
  ]
 },
 {
  "id": "rostam-and-the-seven-trials",
  "title": "Rostam and the Seven Trials",
  "titleKo": "로스탐의 일곱 가지 시련 (샤나메)",
  "author": "Ferdowsi",
  "authorKo": "페르도우시",
  "country": "Iran",
  "emoji": "🐎",
  "color": "#9a3a2a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 210,
  "places": [
   "Iran"
  ]
 },
 {
  "id": "journey-to-the-west",
  "title": "Journey to the West",
  "titleKo": "서유기",
  "author": "Wu Cheng’en",
  "authorKo": "오승은",
  "country": "China",
  "emoji": "🐒",
  "color": "#c08a2a",
  "cefr": "A2",
  "lexile": "약 900L",
  "words": 212,
  "places": [
   "China",
   "India"
  ]
 },
 {
  "id": "romance-of-the-three-kingdoms",
  "title": "Romance of the Three Kingdoms",
  "titleKo": "삼국지: 도원결의와 삼고초려",
  "author": "Luo Guanzhong",
  "authorKo": "나관중",
  "country": "China",
  "emoji": "🍑",
  "color": "#8a2a3a",
  "cefr": "A2",
  "lexile": "약 950L",
  "words": 225,
  "places": [
   "China"
  ]
 },
 {
  "id": "the-boy-in-the-striped-pyjamas",
  "title": "The Boy in the Striped Pyjamas",
  "titleKo": "줄무늬 파자마를 입은 소년",
  "author": "John Boyne",
  "authorKo": "존 보인",
  "country": "Ireland",
  "emoji": "🧒",
  "color": "#4a5a6a",
  "cefr": "B1",
  "lexile": "약 1080L",
  "words": 252,
  "places": [
   "Ireland",
   "Germany",
   "Poland"
  ]
 },
 {
  "id": "the-book-thief",
  "title": "The Book Thief",
  "titleKo": "책도둑",
  "author": "Markus Zusak",
  "authorKo": "마커스 주삭",
  "country": "Australia",
  "emoji": "📕",
  "color": "#5a3a2a",
  "cefr": "B1",
  "lexile": "약 730L",
  "words": 250,
  "places": [
   "Australia",
   "Germany"
  ]
 },
 {
  "id": "all-quiet-on-the-western-front",
  "title": "All Quiet on the Western Front",
  "titleKo": "서부 전선 이상 없다",
  "author": "Erich Maria Remarque",
  "authorKo": "에리히 마리아 레마르크",
  "country": "Germany",
  "emoji": "🪖",
  "color": "#5a5a3a",
  "cefr": "B1",
  "lexile": "약 830L",
  "words": 257,
  "places": [
   "Germany",
   "France"
  ]
 },
 {
  "id": "uncle-toms-cabin",
  "title": "Uncle Tom’s Cabin",
  "titleKo": "톰 아저씨의 오두막",
  "author": "Harriet Beecher Stowe",
  "authorKo": "해리엇 비처 스토",
  "country": "United States",
  "emoji": "🛖",
  "color": "#6a4a2a",
  "cefr": "B1",
  "lexile": "약 1070L",
  "words": 251,
  "places": [
   "United States",
   "Canada"
  ]
 },
 {
  "id": "persepolis",
  "title": "Persepolis",
  "titleKo": "페르세폴리스",
  "author": "Marjane Satrapi",
  "authorKo": "마르잔 사트라피",
  "country": "Iran",
  "emoji": "🧕",
  "color": "#2a2a2a",
  "cefr": "B1",
  "lexile": "약 380L",
  "words": 250,
  "places": [
   "Iran",
   "Austria"
  ]
 },
 {
  "id": "the-good-earth",
  "title": "The Good Earth",
  "titleKo": "대지",
  "author": "Pearl S. Buck",
  "authorKo": "펄 S. 벅",
  "country": "United States",
  "emoji": "🌾",
  "color": "#7a6a3a",
  "cefr": "B1",
  "lexile": "약 1030L",
  "words": 252,
  "places": [
   "United States",
   "China"
  ]
 },
 {
  "id": "the-monkeys-paw",
  "title": "The Monkey’s Paw",
  "titleKo": "원숭이 손",
  "author": "W. W. Jacobs",
  "authorKo": "W. W. 제이콥스",
  "country": "United Kingdom",
  "emoji": "🐾",
  "color": "#4a3a2a",
  "cefr": "A2",
  "lexile": "약 870L",
  "words": 195,
  "places": [
   "United Kingdom",
   "India"
  ]
 },
 {
  "id": "of-mice-and-men",
  "title": "Of Mice and Men",
  "titleKo": "생쥐와 인간",
  "author": "John Steinbeck",
  "authorKo": "존 스타인벡",
  "country": "United States",
  "emoji": "🐇",
  "color": "#7a6a4a",
  "cefr": "B1",
  "lexile": "약 630L",
  "words": 256,
  "places": [
   "United States"
  ]
 },
 {
  "id": "and-then-there-were-none",
  "title": "And Then There Were None",
  "titleKo": "그리고 아무도 없었다",
  "author": "Agatha Christie",
  "authorKo": "애거사 크리스티",
  "country": "United Kingdom",
  "emoji": "🏝️",
  "color": "#2a3a4a",
  "cefr": "B1",
  "lexile": "약 510L",
  "words": 252,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-murder-of-roger-ackroyd",
  "title": "The Murder of Roger Ackroyd",
  "titleKo": "애크로이드 살인 사건",
  "author": "Agatha Christie",
  "authorKo": "애거사 크리스티",
  "country": "United Kingdom",
  "emoji": "🕵️",
  "color": "#4a3a3a",
  "cefr": "B1",
  "lexile": "약 870L",
  "words": 250,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "rebecca",
  "title": "Rebecca",
  "titleKo": "레베카",
  "author": "Daphne du Maurier",
  "authorKo": "대프니 듀 모리에",
  "country": "United Kingdom",
  "emoji": "🏰",
  "color": "#3a2a3a",
  "cefr": "B1",
  "lexile": "약 880L",
  "words": 255,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-tell-tale-heart",
  "title": "The Tell-Tale Heart",
  "titleKo": "고자질하는 심장",
  "author": "Edgar Allan Poe",
  "authorKo": "에드거 앨런 포",
  "country": "United States",
  "emoji": "🫀",
  "color": "#5a1a1a",
  "cefr": "B1",
  "lexile": "약 850L",
  "words": 266,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-lottery",
  "title": "The Lottery",
  "titleKo": "제비뽑기",
  "author": "Shirley Jackson",
  "authorKo": "셜리 잭슨",
  "country": "United States",
  "emoji": "📦",
  "color": "#4a4a3a",
  "cefr": "B1",
  "lexile": "약 1010L",
  "words": 251,
  "places": [
   "United States"
  ]
 },
 {
  "id": "lamb-to-the-slaughter",
  "title": "Lamb to the Slaughter",
  "titleKo": "도살장으로 가는 어린 양",
  "author": "Roald Dahl",
  "authorKo": "로알드 달",
  "country": "United Kingdom",
  "emoji": "🍖",
  "color": "#6a3a3a",
  "cefr": "B1",
  "lexile": "약 810L",
  "words": 251,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-most-dangerous-game",
  "title": "The Most Dangerous Game",
  "titleKo": "가장 위험한 게임",
  "author": "Richard Connell",
  "authorKo": "리처드 코넬",
  "country": "United States",
  "emoji": "🏹",
  "color": "#3a5a3a",
  "cefr": "B1",
  "lexile": "약 1080L",
  "words": 251,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-ones-who-walk-away-from-omelas",
  "title": "The Ones Who Walk Away from Omelas",
  "titleKo": "오멜라스를 떠나는 사람들",
  "author": "Ursula K. Le Guin",
  "authorKo": "어슐러 K. 르 귄",
  "country": "United States",
  "emoji": "🚶",
  "color": "#5a6a8a",
  "cefr": "B1",
  "lexile": "약 1100L",
  "words": 252,
  "places": [
   "United States"
  ]
 },
 {
  "id": "sophies-world",
  "title": "Sophie’s World",
  "titleKo": "소피의 세계",
  "author": "Jostein Gaarder",
  "authorKo": "요슈타인 가아더",
  "country": "Norway",
  "emoji": "🤔",
  "color": "#3a6a8a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 252,
  "places": [
   "Norway"
  ]
 },
 {
  "id": "a-monster-calls",
  "title": "A Monster Calls",
  "titleKo": "몬스터 콜",
  "author": "Patrick Ness",
  "authorKo": "패트릭 네스",
  "country": "United Kingdom",
  "emoji": "🌳",
  "color": "#2a4a3a",
  "cefr": "B1",
  "lexile": "약 730L",
  "words": 250,
  "places": [
   "United Kingdom",
   "United States"
  ]
 },
 {
  "id": "life-of-pi",
  "title": "Life of Pi",
  "titleKo": "파이 이야기",
  "author": "Yann Martel",
  "authorKo": "얀 마텔",
  "country": "Canada",
  "emoji": "🐅",
  "color": "#2a6a8a",
  "cefr": "B1",
  "lexile": "약 830L",
  "words": 256,
  "places": [
   "Canada",
   "India",
   "Mexico"
  ]
 },
 {
  "id": "the-picture-of-dorian-gray",
  "title": "The Picture of Dorian Gray",
  "titleKo": "도리언 그레이의 초상",
  "author": "Oscar Wilde",
  "authorKo": "오스카 와일드",
  "country": "Ireland",
  "emoji": "🖼️",
  "color": "#4a2a4a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 264,
  "places": [
   "Ireland",
   "United Kingdom"
  ]
 },
 {
  "id": "the-death-of-ivan-ilyich",
  "title": "The Death of Ivan Ilyich",
  "titleKo": "이반 일리치의 죽음",
  "author": "Leo Tolstoy",
  "authorKo": "레프 톨스토이",
  "country": "Russia",
  "emoji": "🕯️",
  "color": "#4a4a4a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 261,
  "places": [
   "Russia"
  ]
 },
 {
  "id": "strait-is-the-gate",
  "title": "Strait Is the Gate",
  "titleKo": "좁은 문",
  "author": "André Gide",
  "authorKo": "앙드레 지드",
  "country": "France",
  "emoji": "🚪",
  "color": "#5a6a5a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 252,
  "places": [
   "France"
  ]
 },
 {
  "id": "araby",
  "title": "Araby",
  "titleKo": "애러비",
  "author": "James Joyce",
  "authorKo": "제임스 조이스",
  "country": "Ireland",
  "emoji": "🏮",
  "color": "#3a4a5a",
  "cefr": "B1",
  "lexile": "약 1000L",
  "words": 257,
  "places": [
   "Ireland"
  ]
 },
 {
  "id": "chess-story",
  "title": "Chess Story",
  "titleKo": "체스 이야기",
  "author": "Stefan Zweig",
  "authorKo": "슈테판 츠바이크",
  "country": "Austria",
  "emoji": "♟️",
  "color": "#2a2a3a",
  "cefr": "B1",
  "lexile": "약 1100L",
  "words": 258,
  "places": [
   "Austria",
   "Argentina"
  ]
 },
 {
  "id": "young-goodman-brown",
  "title": "Young Goodman Brown",
  "titleKo": "젊은 굿맨 브라운",
  "author": "Nathaniel Hawthorne",
  "authorKo": "너새니얼 호손",
  "country": "United States",
  "emoji": "🌲",
  "color": "#2a3a2a",
  "cefr": "B1",
  "lexile": "약 1050L",
  "words": 261,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-fall-of-the-house-of-usher",
  "title": "The Fall of the House of Usher",
  "titleKo": "어셔가의 몰락",
  "author": "Edgar Allan Poe",
  "authorKo": "에드거 앨런 포",
  "country": "United States",
  "emoji": "🏚️",
  "color": "#2a2a2a",
  "cefr": "B1",
  "lexile": "약 1180L",
  "words": 263,
  "places": [
   "United States"
  ]
 },
 {
  "id": "the-little-prince-b2",
  "title": "The Little Prince (B2)",
  "titleKo": "어린 왕자 (B2)",
  "author": "Antoine de Saint-Exupéry",
  "authorKo": "앙투안 드 생텍쥐페리",
  "country": "France",
  "emoji": "🌹",
  "color": "#c4882b",
  "cefr": "B2",
  "lexile": "약 1000L",
  "words": 358,
  "places": [
   "France"
  ]
 },
 {
  "id": "animal-farm-b2",
  "title": "Animal Farm (B2)",
  "titleKo": "동물농장 (B2)",
  "author": "George Orwell",
  "authorKo": "조지 오웰",
  "country": "United Kingdom",
  "emoji": "🐖",
  "color": "#8a4a3a",
  "cefr": "B2",
  "lexile": "약 1170L",
  "words": 354,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-old-man-and-the-sea-b2",
  "title": "The Old Man and the Sea (B2)",
  "titleKo": "노인과 바다 (B2)",
  "author": "Ernest Hemingway",
  "authorKo": "어니스트 헤밍웨이",
  "country": "United States",
  "emoji": "🎣",
  "color": "#2a6a8a",
  "cefr": "B2",
  "lexile": "약 940L",
  "words": 358,
  "places": [
   "United States",
   "Cuba"
  ]
 },
 {
  "id": "demian-b2",
  "title": "Demian (B2)",
  "titleKo": "데미안 (B2)",
  "author": "Hermann Hesse",
  "authorKo": "헤르만 헤세",
  "country": "Germany",
  "emoji": "🥚",
  "color": "#3a4a6a",
  "cefr": "B2",
  "lexile": "약 1050L",
  "words": 355,
  "places": [
   "Germany",
   "Switzerland"
  ]
 },
 {
  "id": "the-great-gatsby-b2",
  "title": "The Great Gatsby (B2)",
  "titleKo": "위대한 개츠비 (B2)",
  "author": "F. Scott Fitzgerald",
  "authorKo": "F. 스콧 피츠제럴드",
  "country": "United States",
  "emoji": "💚",
  "color": "#2a5a4a",
  "cefr": "B2",
  "lexile": "약 1070L",
  "words": 354,
  "places": [
   "United States"
  ]
 },
 {
  "id": "alice-in-wonderland-b2",
  "title": "Alice’s Adventures in Wonderland (B2)",
  "titleKo": "이상한 나라의 앨리스 (B2)",
  "author": "Lewis Carroll",
  "authorKo": "루이스 캐럴",
  "country": "United Kingdom",
  "emoji": "🐇",
  "color": "#5a7ab0",
  "cefr": "B2",
  "lexile": "약 1090L",
  "words": 353,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "dr-jekyll-and-mr-hyde-b2",
  "title": "Dr Jekyll and Mr Hyde (B2)",
  "titleKo": "지킬 박사와 하이드 (B2)",
  "author": "Robert Louis Stevenson",
  "authorKo": "로버트 루이스 스티븐슨",
  "country": "United Kingdom",
  "emoji": "🧪",
  "color": "#3f5a4b",
  "cefr": "B2",
  "lexile": "약 1120L",
  "words": 356,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "a-christmas-carol-b2",
  "title": "A Christmas Carol (B2)",
  "titleKo": "크리스마스 캐럴 (B2)",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🎄",
  "color": "#7a2a2a",
  "cefr": "B2",
  "lexile": "약 1080L",
  "words": 359,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "nineteen-eighty-four-b2",
  "title": "Nineteen Eighty-Four (B2)",
  "titleKo": "1984 (B2)",
  "author": "George Orwell",
  "authorKo": "조지 오웰",
  "country": "United Kingdom",
  "emoji": "👁️",
  "color": "#3a3a3a",
  "cefr": "B2",
  "lexile": "약 1090L",
  "words": 358,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "frankenstein-b2",
  "title": "Frankenstein (B2)",
  "titleKo": "프랑켄슈타인 (B2)",
  "author": "Mary Shelley",
  "authorKo": "메리 셸리",
  "country": "United Kingdom",
  "emoji": "⚡",
  "color": "#3a4a3a",
  "cefr": "B2",
  "lexile": "약 1170L",
  "words": 353,
  "places": [
   "United Kingdom",
   "Switzerland"
  ]
 },
 {
  "id": "les-miserables-b2",
  "title": "Les Misérables (B2)",
  "titleKo": "레 미제라블 (B2)",
  "author": "Victor Hugo",
  "authorKo": "빅토르 위고",
  "country": "France",
  "emoji": "🕯️",
  "color": "#4a3a5a",
  "cefr": "B2",
  "lexile": "약 1150L",
  "words": 370,
  "places": [
   "France"
  ]
 },
 {
  "id": "jane-eyre-b2",
  "title": "Jane Eyre (B2)",
  "titleKo": "제인 에어 (B2)",
  "author": "Charlotte Brontë",
  "authorKo": "샬럿 브론테",
  "country": "United Kingdom",
  "emoji": "🕊️",
  "color": "#5a4a6a",
  "cefr": "B2",
  "lexile": "약 1110L",
  "words": 368,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "to-kill-a-mockingbird-b2",
  "title": "To Kill a Mockingbird (B2)",
  "titleKo": "앵무새 죽이기 (B2)",
  "author": "Harper Lee",
  "authorKo": "하퍼 리",
  "country": "United States",
  "emoji": "🐦",
  "color": "#6a5a3a",
  "cefr": "B2",
  "lexile": "약 1040L",
  "words": 373,
  "places": [
   "United States"
  ]
 },
 {
  "id": "pride-and-prejudice-b2",
  "title": "Pride and Prejudice (B2)",
  "titleKo": "오만과 편견 (B2)",
  "author": "Jane Austen",
  "authorKo": "제인 오스틴",
  "country": "United Kingdom",
  "emoji": "💌",
  "color": "#8a5a6a",
  "cefr": "B2",
  "lexile": "약 1100L",
  "words": 357,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-metamorphosis-b2",
  "title": "The Metamorphosis (B2)",
  "titleKo": "변신 (B2)",
  "author": "Franz Kafka",
  "authorKo": "프란츠 카프카",
  "country": "Czechia",
  "emoji": "🪲",
  "color": "#4a4a3a",
  "cefr": "B2",
  "lexile": "약 1060L",
  "words": 370,
  "places": [
   "Czechia"
  ]
 },
 {
  "id": "great-expectations-b2",
  "title": "Great Expectations (B2)",
  "titleKo": "위대한 유산 (B2)",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🎩",
  "color": "#4a5a6a",
  "cefr": "B2",
  "lexile": "약 1120L",
  "words": 384,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "wuthering-heights-b2",
  "title": "Wuthering Heights (B2)",
  "titleKo": "폭풍의 언덕 (B2)",
  "author": "Emily Brontë",
  "authorKo": "에밀리 브론테",
  "country": "United Kingdom",
  "emoji": "🌫️",
  "color": "#4a5058",
  "cefr": "B2",
  "lexile": "약 1100L",
  "words": 359,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "oliver-twist-b2",
  "title": "Oliver Twist (B2)",
  "titleKo": "올리버 트위스트 (B2)",
  "author": "Charles Dickens",
  "authorKo": "찰스 디킨스",
  "country": "United Kingdom",
  "emoji": "🥣",
  "color": "#6a5a4a",
  "cefr": "B2",
  "lexile": "약 1080L",
  "words": 380,
  "places": [
   "United Kingdom"
  ]
 },
 {
  "id": "the-count-of-monte-cristo-b2",
  "title": "The Count of Monte Cristo (B2)",
  "titleKo": "몬테크리스토 백작 (B2)",
  "author": "Alexandre Dumas",
  "authorKo": "알렉상드르 뒤마",
  "country": "France",
  "emoji": "🗝️",
  "color": "#3a4a6a",
  "cefr": "B2",
  "lexile": "약 1110L",
  "words": 385,
  "places": [
   "France"
  ]
 },
 {
  "id": "hamlet-b2",
  "title": "Hamlet (B2)",
  "titleKo": "햄릿 (B2)",
  "author": "William Shakespeare",
  "authorKo": "윌리엄 셰익스피어",
  "country": "United Kingdom",
  "emoji": "💀",
  "color": "#3a3a4a",
  "cefr": "B2",
  "lexile": "약 1120L",
  "words": 384,
  "places": [
   "United Kingdom",
   "Denmark"
  ]
 }
];
