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
  "lexile": "약 1100L (추정)",
  "ar": "약 7.0 (추정)",
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
  "lexile": "약 900L (추정)",
  "ar": "약 5.5 (추정)",
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
  "lexile": "약 350L (추정)",
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
  "lexile": "약 300L (추정)",
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
  "lexile": "약 330L (추정)",
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
  "lexile": "약 340L (추정)",
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
  "lexile": "약 360L (추정)",
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
  "lexile": "약 320L (추정)",
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
  "lexile": "약 340L (추정)",
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
  "lexile": "약 350L (추정)",
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
  "lexile": "약 330L (추정)",
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
  "lexile": "약 360L (추정)",
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
  "lexile": "약 330L (추정)",
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
  "lexile": "약 330L (추정)",
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
  "lexile": "약 340L (추정)",
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
  "lexile": "약 350L (추정)",
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
  "lexile": "약 320L (추정)",
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
  "lexile": "약 330L (추정)",
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
  "lexile": "약 360L (추정)",
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
  "lexile": "약 340L (추정)",
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
  "lexile": "약 360L (추정)",
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
  "lexile": "약 370L (추정)",
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
  "lexile": "약 350L (추정)",
  "words": 161,
  "places": [
   "Denmark"
  ]
 }
];
