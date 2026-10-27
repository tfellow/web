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
 }
];
