// ============================================================================
// QUIZ QUEENS (퀴즈 퀸즈) - 서울문영여자중학교 상식 여왕 도전기
// 6대 분야 기본 문제은행 (총 120문항)
// 선생님이 구글 시트([문제은행] 탭)를 연동하면 시트의 문제들이 자동으로 추가/반영됩니다.
// ============================================================================

const CATEGORIES = [
  {
    id: 'school',
    name: '우리 학교 상식',
    shortName: '문영상식',
    icon: '🏫',
    color: '#FF5E7E',
    lightColor: '#FFF0F3',
    mascotName: '개나리 퀸 나리',
    mascotEmoji: '🌼',
    mascotDesc: '서울문영여자중학교의 역사와 전통을 사랑하는 개나리 마스코트'
  },
  {
    id: 'curriculum',
    name: '교과 융합',
    shortName: '교과융합',
    icon: '📘',
    color: '#3B82F6',
    lightColor: '#EFF6FF',
    mascotName: '지혜 퀸 아테나',
    mascotEmoji: '🦉',
    mascotDesc: '국·영·수·사·과 교과 핵심 지식을 꿰뚫는 백과사전 마스코트'
  },
  {
    id: 'economy',
    name: '시사·경제',
    shortName: '시사·경제',
    icon: '📈',
    color: '#F59E0B',
    lightColor: '#FFFBEB',
    mascotName: '트렌드 퀸 리치',
    mascotEmoji: '🪙',
    mascotDesc: '세상 돌아가는 뉴스와 스마트한 금융·경제 상식의 달인'
  },
  {
    id: 'world',
    name: '세계·지리',
    shortName: '세계·지리',
    icon: '🌍',
    color: '#10B981',
    lightColor: '#ECFDF5',
    mascotName: '글로벌 퀸 보야지',
    mascotEmoji: '🧭',
    mascotDesc: '오대양 육대주 세계의 수도와 문화를 탐험하는 여행가'
  },
  {
    id: 'science',
    name: '과학·미래',
    shortName: '과학·미래',
    icon: '🚀',
    color: '#8B5CF6',
    lightColor: '#F5F3FF',
    mascotName: '사이언스 퀸 노바',
    mascotEmoji: '🔭',
    mascotDesc: 'AI, 우주, 생명과학과 미래 기술을 이끄는 이노베이터'
  },
  {
    id: 'culture',
    name: '예술·문화',
    shortName: '예술·문화',
    icon: '🎨',
    color: '#EC4899',
    lightColor: '#FDF2F8',
    mascotName: '아트 퀸 뮤즈',
    mascotEmoji: '🎭',
    mascotDesc: '음악, 미술, 공연, 스포츠와 K-컬처를 즐기는 예술가'
  },
  {
    id: 'english',
    name: '영어',
    shortName: '영어',
    icon: '🔤',
    color: '#0284C7',
    lightColor: '#F0F9FF',
    mascotName: '잉글리시 퀸 로렐',
    mascotEmoji: '👑',
    mascotDesc: '세계인과 유창하게 소통하며 문화의 다리를 놓는 글로벌 리더'
  },
  {
    id: 'literature',
    name: '문학·고전',
    shortName: '문학·고전',
    icon: '📖',
    color: '#7C3AED',
    lightColor: '#FAF5FF',
    mascotName: '책향기 퀸 다솔',
    mascotEmoji: '🪶',
    mascotDesc: '시와 소설, 동서양 고전문학의 깊은 감동을 전하는 문학 감성가'
  }
];

const SCHOOL_CLASSES = [
  { grade: 1, classNo: 1, classId: '1-1', className: '1반', fullLabel: '1-1' },
  { grade: 1, classNo: 2, classId: '1-2', className: '2반', fullLabel: '1-2' },
  { grade: 1, classNo: 3, classId: '1-3', className: '3반', fullLabel: '1-3' },
  { grade: 2, classNo: 1, classId: '2-1', className: '1반', fullLabel: '2-1' },
  { grade: 2, classNo: 2, classId: '2-2', className: '2반', fullLabel: '2-2' },
  { grade: 2, classNo: 3, classId: '2-3', className: '3반', fullLabel: '2-3' },
  { grade: 2, classNo: 4, classId: '2-4', className: '4반', fullLabel: '2-4' },
  { grade: 3, classNo: 1, classId: '3-1', className: '1반', fullLabel: '3-1' },
  { grade: 3, classNo: 2, classId: '3-2', className: '2반', fullLabel: '3-2' },
  { grade: 3, classNo: 3, classId: '3-3', className: '3반', fullLabel: '3-3' },
  { grade: 3, classNo: 4, classId: '3-4', className: '4반', fullLabel: '3-4' }
];

const LEVEL_TITLES = [
  { minLevel: 1, maxLevel: 2, title: '🌱 호기심 가득 새싹 퀸', badge: '🌱', certName: '입문 퀴즈 퀸 인증서' },
  { minLevel: 3, maxLevel: 4, title: '🌼 피어나는 개나리 탐험가', badge: '🌼', certName: '브론즈 개나리 퀸 인증서' },
  { minLevel: 5, maxLevel: 9, title: '✨ 신바람 상식 해결사', badge: '✨', certName: '실버 신바람 퀸 인증서' },
  { minLevel: 10, maxLevel: 14, title: '📚 내보창 지성 리더', badge: '📚', certName: '골드 지성 퀸 인증서' },
  { minLevel: 15, maxLevel: 19, title: '💎 빛나는 프리즘 박사', badge: '💎', certName: '플래티넘 프리즘 퀸 인증서' },
  { minLevel: 20, maxLevel: 29, title: '👑 서울문영 상식 여왕', badge: '👑', certName: '다이아몬드 문영 여왕 인증서' },
  { minLevel: 30, maxLevel: 999, title: '🌟 전설의 그랜드 퀴즈 퀸', badge: '🌟', certName: '전설의 그랜드 퀴즈 퀸 인증서' }
];

// 인증서 자동 발급/발송 기준 레벨
const CERTIFICATE_MILESTONE_LEVELS = [3, 5, 10, 15, 20, 25, 30];

const DEFAULT_QUESTIONS = [
  // ==========================================================================
  // 1. 🏫 우리 학교 상식 (서울문영여자중학교 교육계획서 기반 30문항)
  // ==========================================================================
  {
    id: 'sch_01',
    category: 'school',
    difficulty: '쉬움',
    question: '서울문영여자중학교의 교훈(校訓)으로 올바르게 짝지어진 것은?',
    options: ['경애(敬愛)와 신의(信義)', '성실(誠實)과 창조(創造)', '사랑(愛)과 봉사(奉仕)', '자유(自由)와 정의(正義)'],
    answer: 1,
    explanation: '우리 학교의 교훈은 남을 공경하고 사랑하는 "경애(敬愛)"와 믿음과 의리를 지키는 "신의(信義)"입니다.'
  },
  {
    id: 'sch_02',
    category: 'school',
    difficulty: '쉬움',
    question: '희망, 생명력과 인내심, 조화와 단결을 상징하는 서울문영여자중학교의 교화(꽃)는?',
    options: ['진달래', '개나리', '장미', '목련'],
    answer: 2,
    explanation: '서울문영여자중학교의 교화는 한국이 원산지이며 희망과 조화·단결을 상징하는 "개나리"입니다. 학교 교지 이름도 「개나리」입니다!'
  },
  {
    id: 'sch_03',
    category: 'school',
    difficulty: '쉬움',
    question: '서울문영여자중학교의 전통 학급 이름(1~4반)을 순서대로 바르게 나열한 것은?',
    options: ['진·선·미·정', '정·숙·명·인', '매·난·국·죽', '경·애·신·의'],
    answer: 2,
    explanation: '서울문영여자중학교의 전통 학급 이름은 1반 정(곧을 정), 2반 숙(맑을 숙), 3반 명(밝을 명), 4반 인(어질 인)입니다.'
  },
  {
    id: 'sch_04',
    category: 'school',
    difficulty: '보통',
    question: '서울문영여자중학교의 영문 교명 표기로 올바른 것은?',
    options: [
      'Seoul Moonyoung Girls\' Middle School',
      'Seoul Munyeong High School',
      'Moonyoung International Academy',
      'Gwanak Moonyoung Middle School'
    ],
    answer: 1,
    explanation: '우리 학교의 공식 영문 명칭은 "Seoul Moonyoung Girls\' Middle School"입니다.'
  },
  {
    id: 'sch_05',
    category: 'school',
    difficulty: '쉬움',
    question: '우리나라 사람들이 가진 고유한 신명을 살려 즐겁고 새로운 교육 희망을 일으킨다는 서울문영여자중학교의 학교 브랜드는?',
    options: ['해피 문영', '신바람 문영', '드림 문영', '스마트 문영'],
    answer: 2,
    explanation: '우리 학교 브랜드는 "\'신바람\' 문영"으로, 즐겁고 흥이 있는 교육·신선한 바람(新風)·새로운 희망(新希)·신의 기대(神待)라는 4가지 의미를 담고 있습니다.'
  },
  {
    id: 'sch_06',
    category: 'school',
    difficulty: '보통',
    question: '학교법인 문영학원의 3대 육영 지표(교육 이념)가 아닌 것은?',
    options: ['구원인 : 진실', '생활인 : 근면', '창조인 : 창의', '경쟁인 : 승리'],
    answer: 4,
    explanation: '문영학원의 육영 지표는 "구원인(진실), 생활인(근면), 창조인(창의)"입니다.'
  },
  {
    id: 'sch_07',
    category: 'school',
    difficulty: '보통',
    question: '구한말 참정대신으로 을사늑약 체결을 결사반대하신 부친 한규설 선생의 뜻을 받들어 학교법인 문영학원을 설립하신 분은?',
    options: ['소석 한양호 선생', '우석 한학수 선생', '백범 김구 선생', '도산 안창호 선생'],
    answer: 1,
    explanation: '소석(小石) 한양호 선생께서 부친 강석 한규설 참정대신의 뜻을 받들어 참된 여성 교육을 목표로 문영학원을 설립하셨습니다.'
  },
  {
    id: 'sch_08',
    category: 'school',
    difficulty: '보통',
    question: '학교법인 문영학원이 설립 인가를 받은 날을 기념하는 우리 학교의 개교기념일은 언제일까요?',
    options: ['4월 1일', '5월 15일', '9월 29일', '11월 17일'],
    answer: 3,
    explanation: '1936년 9월 29일 학교법인 문영학원 설립 인가를 받은 날을 기념하여 매년 9월 29일이 개교기념일입니다.'
  },
  {
    id: 'sch_09',
    category: 'school',
    difficulty: '보통',
    question: '서울문영여자중학교 교표(배지)에서 "프리즘과 소금 결정체를 나타내며 빛을 발하고 세상의 소금 구실을 하는 인재 양성"을 상징하는 도형은?',
    options: ['삼각형', '정육각형', '원', '별모양'],
    answer: 2,
    explanation: '교표의 삼각형은 삼각산·독립정신·안정감을, 정육각형은 프리즘과 소금 결정체(빛과 소금)를, 원은 원만하고 따뜻한 마음을 상징합니다.'
  },
  {
    id: 'sch_10',
    category: 'school',
    difficulty: '쉬움',
    question: '서울문영여자중학교 교가 1절의 첫 소절 가사로 알맞은 것은?',
    options: ['남산을 바라보며 우뚝 솟은 집', '관악을 터전 삼아 이룩한 글터', '한강물 굽이치는 배움의 전당', '북한산 정기 받은 문영의 딸들'],
    answer: 2,
    explanation: '우리 학교 교가(김효중 작사, 백병동 작곡) 1절은 "관악을 터전 삼아 이룩한 글터 / 대한의 어진 딸들 여기에 모여~"로 시작합니다.'
  },
  {
    id: 'sch_11',
    category: 'school',
    difficulty: '보통',
    question: '매주 화요일 아침 독서 시간에 발행되어 읽고 100자 이상의 감상을 기록하는 우리 학교만의 독서 자료 이름은?',
    options: ['문영 독서 노트', '내 마음속 보물 창고', '개나리 책방', '아침 지혜 편지'],
    answer: 2,
    explanation: '매주 화요일 아침 독서 시간에는 5분 분량의 읽을거리인 "내 마음속 보물 창고(내보창)"가 발행됩니다.'
  },
  {
    id: 'sch_12',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 본관 2층에 위치한 학생 휴게 공간의 이름은 무엇일까요?',
    options: ['MY라움지', '개나리홀', '신바람카페', '문영쉼터'],
    answer: 1,
    explanation: '본관 2층에는 온·오프라인 수업을 위한 MY스튜디오와 학생 휴게실인 "MY라움지"가 있습니다.'
  },
  {
    id: 'sch_13',
    category: 'school',
    difficulty: '쉬움',
    question: '등교 시 실내화를 가져오지 않은 학생에게 실내화를 대여해 주고 머리끈·손톱깎이 등을 지원하며 공공 자산 의식을 기르는 생활안전부 활동 이름은?',
    options: ['문영 살림꾼', '문영 도우미', '신바람 지킴이', '개나리 봉사단'],
    answer: 1,
    explanation: '"문영 살림꾼"은 실내화 대여 및 생활 필요 물품 지원을 통해 상부상조의 학풍과 공공 자산 의식을 기르는 활동입니다.'
  },
  {
    id: 'sch_14',
    category: 'school',
    difficulty: '쉬움',
    question: '6월 학급자치회 시간 등에 친구에게 미안했던 일을 편지로 써서 사과와 함께 전달하는 학교폭력 예방 행사 이름은?',
    options: ['오렌지데이', '톡톡톡 애플데이', '해피 피치데이', '스위트 베리데이'],
    answer: 2,
    explanation: '"톡톡톡 애플데이(Talk Talk Talk Apple day)"는 친구에게 사과 편지를 쓰며 화해와 공감을 나누는 행사입니다.'
  },
  {
    id: 'sch_15',
    category: 'school',
    difficulty: '보통',
    question: '연간 30권 이상의 책을 읽고 독서기록장에 수기로 독후감을 작성하여 제출한 학생에게 학년말에 수여하는 상은?',
    options: ['독서 표창장', '문영 노벨상', '베스트셀러상', '출판문화상'],
    answer: 1,
    explanation: '연간 30권 이상을 읽고 독서기록장을 성실히 작성한 학생에게는 학년말에 "독서 표창장"을 수여합니다.'
  },
  {
    id: 'sch_16',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교에서 매년 12월에 발간하는 학교 교지(소식지)의 제목은?',
    options: ['관악', '문영인', '개나리', '신바람'],
    answer: 3,
    explanation: '우리 학교 교지는 교화와 같은 이름인 「개나리」이며, 문집으로는 「나도 작가」와 「책 사랑」이 발간됩니다.'
  },
  {
    id: 'sch_17',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 동아리 이름과 활동 분야가 바르게 연결되지 않은 것은?',
    options: ['둥치 - 교지편집반', '두부 - 락밴드반', '로티플 - 댄스반', '완두콩 - 요리반'],
    answer: 4,
    explanation: '"완두콩"은 요리반이 아니라 신나는 타악 퍼포먼스를 펼치는 "난타반"입니다!'
  },
  {
    id: 'sch_18',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 방송반 동아리의 영문 약칭 이름은 무엇일까요?',
    options: ['MYBS', 'SMBC', 'KBS-M', 'M-TV'],
    answer: 1,
    explanation: '서울문영여자중학교 방송반의 이름은 "MYBS(MoonYoung Broadcasting System)"입니다.'
  },
  {
    id: 'sch_19',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 피구반 동아리의 이름은 무엇일까요?',
    options: ['스파이크', '퉁키스', '피구퀸즈', '썬더볼'],
    answer: 2,
    explanation: '피구반 동아리 이름은 만화 피구왕 통키에서 착안한 "퉁키스"입니다. 춘계 스포츠 페스티벌에서도 학년별 피구 리그전이 열립니다!'
  },
  {
    id: 'sch_20',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 교실 배치도(본관) 기준으로 1학년 교실(1-1, 1-2, 1-3)은 몇 층에 위치해 있을까요?',
    options: ['2층', '3층', '4층', '5층'],
    answer: 4,
    explanation: '본관 3층에는 3학년 교실(3-1~3-4), 4층에는 2학년 교실(2-1~2-4), 5층에는 1학년 교실(1-1~1-3)과 다목적실, 교목실이 있습니다.'
  },
  {
    id: 'sch_21',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 지하 1층에 위치한 특별실이 아닌 것은?',
    options: ['도서실', '과학실 및 미술실', '컴퓨터실 및 영어교과실', '음악실'],
    answer: 4,
    explanation: '지하 1층에는 도서실, 진로진학실, 미술실, 과학실, 컴퓨터실, 영어교과실이 있고, "음악실"은 지하 2층에 있습니다.'
  },
  {
    id: 'sch_22',
    category: 'school',
    difficulty: '보통',
    question: '1991년 홍제동에서 현재의 교사(건물)로 이전한 서울문영여자중학교가 위치한 서울특별시의 자치구는?',
    options: ['서대문구', '관악구', '종로구', '동작구'],
    answer: 2,
    explanation: '우리 학교는 1991년 서대문구 홍제동에서 현재의 관악구 봉천동(관악로 85) 신축 교사로 이전하였습니다.'
  },
  {
    id: 'sch_23',
    category: 'school',
    difficulty: '보통',
    question: '2025학년도 기준 서울문영여자중학교의 전체 학급 수(1~3학년 합계)는 총 몇 학급일까요?',
    options: ['9학급', '11학급', '12학급', '15학급'],
    answer: 2,
    explanation: '1학년 3학급(1-1~1-3), 2학년 4학급(2-1~2-4), 3학년 4학급(3-1~3-4)으로 총 11학급입니다.'
  },
  {
    id: 'sch_24',
    category: 'school',
    difficulty: '어려움',
    question: '우리 학교 일과 운영표 기준, 아침 등교 시각과 1교시 시작 시각으로 올바른 것은?',
    options: ['등교 8:00 / 1교시 8:30', '등교 8:20 / 1교시 8:55', '등교 8:40 / 1교시 9:00', '등교 9:00 / 1교시 9:15'],
    answer: 2,
    explanation: '등교 시각은 8:20이며, 아침독서(8:20~8:40)와 학급조회(8:45~8:50) 후 8:55에 1교시가 시작됩니다.'
  },
  {
    id: 'sch_25',
    category: 'school',
    difficulty: '보통',
    question: '5월 백일장 및 미술 실기 활동에서 1학년 학생들이 주로 방문하여 창작 활동을 펼치는 장소는?',
    options: ['관악산 호수 공원', '용산 가족 공원', '보라매 공원', '올림픽 공원'],
    answer: 1,
    explanation: '백일장 및 미술 실기 활동은 1학년 관악산 호수 공원, 2학년 용산 가족 공원, 3학년 보라매 공원에서 진행됩니다.'
  },
  {
    id: 'sch_26',
    category: 'school',
    difficulty: '보통',
    question: '진로상담부에서 운영하는 생명 존중 및 학생 정서 지원 캠페인의 이름으로 알맞은 것은?',
    options: ['토닥토닥 마음 챙김 캠페인', '으쌰으쌰 체력 캠페인', '반짝반짝 별빛 캠페인', '하루한줄 일기 캠페인'],
    answer: 1,
    explanation: '또래상담 동아리(톡메이트)와 함께 등굣길 피켓 캠페인 등으로 운영하는 "토닥토닥 마음 챙김 캠페인"입니다.'
  },
  {
    id: 'sch_27',
    category: 'school',
    difficulty: '보통',
    question: '1학년 2학기 국어 수업 시간(15차시)을 활용하여 학급 친구들과 함께 대본을 쓰고 영화를 제작·발표하는 활동은?',
    options: ['협력 종합 예술 활동', '나도 아나운서 활동', '영어 뮤지컬 캠프', '과학 발명 프로젝트'],
    answer: 1,
    explanation: '1학년 2학기 국어 시간에는 학급 전원이 연출, 배우, 소품, 촬영에 참여하는 "협력 종합 예술 활동(영화 만들기)"을 진행합니다.'
  },
  {
    id: 'sch_28',
    category: 'school',
    difficulty: '보통',
    question: '우리 학교 특색사업으로, 방과 후에 교내에서 자습 및 대학생 교육봉사 멘토링 과외를 지원하는 프로그램 이름은?',
    options: ['배움을 나누는 방과 후 공부방', '문영 심야 독서실', '관악 영재 아카데미', '신바람 어학당'],
    answer: 1,
    explanation: '미래교육부 주관 특색사업인 "배움을 나누는 방과 후 공부방"을 통해 자기주도학습과 멘토링을 지원하고 있습니다.'
  },
  {
    id: 'sch_29',
    category: 'school',
    difficulty: '보통',
    question: '매월 5일 학교·학급 시설물의 안전을 점검하고, 보라매 안전체험관 연계 교육 등을 실시하는 우리 학교의 중점과제 이름은?',
    options: ['슬기로운 학교 안전 생활', '글로벌 리더십 프로젝트', '친환경 에코 스쿨', '우주 과학 탐구 생활'],
    answer: 1,
    explanation: '생활안전부 주관 학교 중점과제는 "슬기로운 학교 안전 생활"입니다.'
  },
  {
    id: 'sch_30',
    category: 'school',
    difficulty: '어려움',
    question: '서울문영여자중학교 교가를 작사·작곡하신 분으로 바르게 짝지어진 것은?',
    options: ['작사 김효중 / 작곡 백병동', '작사 윤동주 / 작곡 홍난파', '작사 박목월 / 작곡 안익태', '작사 이은상 / 작곡 나운영'],
    answer: 1,
    explanation: '서울문영여자중학교의 교가는 김효중 작사, 백병동 작곡입니다.'
  },

  // ==========================================================================
  // 2. 📘 교과 융합 (국·영·수·사·과 핵심 상식 18문항)
  // ==========================================================================
  {
    id: 'cur_01',
    category: 'curriculum',
    difficulty: '쉬움',
    question: '[국어] "까마귀 날자 배 떨어진다"라는 속담과 가장 뜻이 통하는 한자성어는?',
    options: ['오비이락(烏飛梨落)', '유비무환(有備無患)', '동문서답(東問西答)', '일석이조(一石二鳥)'],
    answer: 1,
    explanation: '오비이락(烏飛梨落)은 까마귀가 날자 배가 떨어진다는 뜻으로, 아무 관계없이 한 일이 우연히 동시에 일어나 오해를 받음을 이릅니다.'
  },
  {
    id: 'cur_02',
    category: 'curriculum',
    difficulty: '쉬움',
    question: '[수학] 1보다 큰 자연수 중에서 1과 자기 자신만을 약수로 가지는 수를 무엇이라고 할까요?',
    options: ['합성수', '소수(Prime number)', '유리수', '무리수'],
    answer: 2,
    explanation: '2, 3, 5, 7, 11처럼 1과 자기 자신만을 약수로 가지는 수를 소수(Prime number)라고 합니다. 가장 작은 소수이자 유일한 짝수 소수는 2입니다.'
  },
  {
    id: 'cur_03',
    category: 'curriculum',
    difficulty: '보통',
    question: '[역사] 고려 시대에 금속 활자로 인쇄된 책으로, 현존하는 세계 최고(最古)의 금속 활자본은?',
    options: ['삼국사기', '팔만대장경', '직지심체요절', '무구정광대다라니경'],
    answer: 3,
    explanation: '1377년 청주 흥덕사에서 간행된 『백운화상초록불조직지심체요절(직지)』은 현존 세계 최고의 금속 활자본으로 유네스코 세계기록유산입니다.'
  },
  {
    id: 'cur_04',
    category: 'curriculum',
    difficulty: '쉬움',
    question: '[과학] 식물이 빛에너지를 이용해 이산화 탄소와 물로부터 양분(포도당)과 산소를 만들어 내는 작용은?',
    options: ['호흡 작용', '증산 작용', '광합성', '삼투 현상'],
    answer: 3,
    explanation: '식물의 엽록체에서 빛에너지를 이용해 이산화 탄소와 물을 원료로 포도당과 산소를 만드는 과정을 광합성이라고 합니다.'
  },
  {
    id: 'cur_05',
    category: 'curriculum',
    difficulty: '보통',
    question: '[영어] 다음 중 "최선을 다하다"라는 뜻의 영어 숙어 "do one\'s _____"의 빈칸에 들어갈 알맞은 단어는?',
    options: ['good', 'better', 'best', 'most'],
    answer: 3,
    explanation: '"do one\'s best"는 "최선을 다하다"라는 뜻의 대표적인 영어 표현입니다.'
  },
  {
    id: 'cur_06',
    category: 'curriculum',
    difficulty: '보통',
    question: '[국어] 김유정의 소설 『동백꽃』에서 주인공 "나"와 "점순이"의 갈등을 유발하는 매개체이자 화해의 계기가 되는 노란 꽃은?',
    options: ['진짜 동백나무 꽃', '생강나무 꽃', '개나리 꽃', '산수유 꽃'],
    answer: 2,
    explanation: '강원도에서는 생강나무의 노란 꽃을 "산동백(동백꽃)"이라고 불렀습니다. 소설 속 알싸한 향기의 노란 동백꽃은 생강나무 꽃입니다!'
  },
  {
    id: 'cur_07',
    category: 'curriculum',
    difficulty: '보통',
    question: '[수학] 직각삼각형에서 직각을 낀 두 변의 길이가 각각 3cm, 4cm일 때, 빗변의 길이는 몇 cm일까요?',
    options: ['5cm', '6cm', '7cm', '8cm'],
    answer: 1,
    explanation: '피타고라스 정리(a² + b² = c²)에 의해 3² + 4² = 9 + 16 = 25 = 5²이므로 빗변의 길이는 5cm입니다.'
  },
  {
    id: 'cur_08',
    category: 'curriculum',
    difficulty: '보통',
    question: '[사회] 대한민국 헌법 제1조 제2항 "대한민국의 주권은 (   )에게 있고, 모든 권력은 (   )으로부터 나온다"에서 괄호에 공통으로 들어갈 말은?',
    options: ['대통령', '국회', '국민', '법원'],
    answer: 3,
    explanation: '국민주권의 원리에 따라 대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나옵니다.'
  },
  {
    id: 'cur_09',
    category: 'curriculum',
    difficulty: '보통',
    question: '[과학] 원소 기호 "Au"로 표기하며, 변하지 않는 노란 광택을 지닌 금속 원소는?',
    options: ['은(Silver)', '금(Gold)', '구리(Copper)', '알루미늄(Aluminum)'],
    answer: 2,
    explanation: 'Au는 라틴어 Aurum에서 유래한 "금(Gold)"의 원소 기호입니다. 은은 Ag, 구리는 Cu입니다.'
  },
  {
    id: 'cur_10',
    category: 'curriculum',
    difficulty: '쉬움',
    question: '[국어] 다음 중 맞춤법 표기가 올바른 문장은 무엇일까요?',
    options: ['감기 조심하길 바래.', '내일 뵈요.', '오랜만에 만나서 반가워.', '어제 웬지 기분이 좋더라.'],
    answer: 3,
    explanation: '"오랜만에"가 맞습니다! (바래→바라, 뵈요→봬요, 웬지→왠지(왜인지의 준말)가 올바른 표기입니다.)'
  },
  {
    id: 'cur_11',
    category: 'curriculum',
    difficulty: '보통',
    question: '[역사] 조선 세종대왕 때 장영실 등이 제작한 기구로, 시간을 자동으로 알려주는 물시계의 이름은?',
    options: ['앙부일구', '자격루', '측우기', '혼천의'],
    answer: 2,
    explanation: '자격루(自擊漏)는 스스로 종과 북, 징을 쳐서 시간을 알려주는 조선 시대의 자동 물시계입니다. (앙부일구는 해시계)'
  },
  {
    id: 'cur_12',
    category: 'curriculum',
    difficulty: '보통',
    question: '[영어] "A piece of cake(케이크 한 조각)"라는 영어 관용 표현이 실제로 의미하는 뜻은?',
    options: ['매우 배가 고프다', '누워서 떡 먹기(매우 쉬운 일)', '생일을 축하하다', '소중한 보물'],
    answer: 2,
    explanation: '"It\'s a piece of cake!"는 우리말 "식은 죽 먹기", "누워서 떡 먹기"처럼 아주 쉬운 일을 뜻합니다.'
  },
  {
    id: 'cur_13',
    category: 'curriculum',
    difficulty: '보통',
    question: '[수학] 주사위 한 개를 던질 때, 소수(2, 3, 5)의 눈이 나올 확률은?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    answer: 3,
    explanation: '주사위의 눈(1~6) 중 소수는 2, 3, 5로 3개이므로, 확률은 3/6 = 1/2입니다.'
  },
  {
    id: 'cur_14',
    category: 'curriculum',
    difficulty: '보통',
    question: '[과학] 지구 대기권을 이루는 기체 중 부피 기준으로 가장 많은 비율(약 78%)을 차지하는 기체는?',
    options: ['산소', '질소', '이산화 탄소', '아르곤'],
    answer: 2,
    explanation: '건조한 공기의 부피비는 질소(약 78%), 산소(약 21%), 아르곤(약 0.93%), 이산화 탄소(약 0.04%) 순입니다.'
  },
  {
    id: 'cur_15',
    category: 'curriculum',
    difficulty: '보통',
    question: '[도덕/사회] 국가의 권력을 입법부(국회), 사법부(법원), 행정부(정부)로 나누어 서로 견제와 균형을 이루게 하는 원리는?',
    options: ['삼권 분립', '지방 자치', '직접 민주제', '입헌 군주제'],
    answer: 1,
    explanation: '국가 권력의 남용을 막고 국민의 기본권을 보장하기 위해 입법·사법·행정을 나누는 것을 "삼권 분립"이라고 합니다.'
  },
  {
    id: 'cur_16',
    category: 'curriculum',
    difficulty: '어려움',
    question: '[역사] 1919년 3·1 운동을 계기로 중국 상하이에 수립된 우리나라 최초의 민주 공화제 정부는?',
    options: ['대한제국', '대한민국 임시 정부', '신민회', '독립협회'],
    answer: 2,
    explanation: '3·1 운동 직후인 1919년 4월 중국 상하이에서 삼권 분립과 민주 공화제를 바탕으로 한 "대한민국 임시 정부"가 수립되었습니다.'
  },
  {
    id: 'cur_17',
    category: 'curriculum',
    difficulty: '보통',
    question: '[국어] "겉으로는 비슷해 보이나 실제로는 완전히 다름"을 이르는 한자성어로, 가짜가 진짜처럼 행세할 때 쓰는 말은?',
    options: ['사이비(似而非)', '금상첨화(錦上添花)', '설상가상(雪上加霜)', '역지사지(易地思之)'],
    answer: 1,
    explanation: '사이비(似而非)는 같을 사(似), 말 이(而), 아닐 비(非) 자를 써서 "비슷하지만 실상은 아님"을 뜻합니다.'
  },
  {
    id: 'cur_18',
    category: 'curriculum',
    difficulty: '보통',
    question: '[과학] 물체에 작용하는 알짜힘이 0일 때, 정지해 있는 물체는 계속 정지해 있고 운동하는 물체는 등속 직선 운동을 계속하려는 성질은?',
    options: ['마찰력', '관성', '탄성력', '부력'],
    answer: 2,
    explanation: '물체가 처음의 운동 상태를 계속 유지하려는 성질을 "관성"이라고 합니다. 버스가 급출발할 때 몸이 뒤로 쏠리는 것도 관성 때문입니다.'
  },

  // ==========================================================================
  // 3. 📈 시사·경제 (금융, 사회, 시사 상식 18문항)
  // ==========================================================================
  {
    id: 'eco_01',
    category: 'economy',
    difficulty: '쉬움',
    question: '물가가 지속적으로 오르고 화폐(돈)의 가치가 떨어지는 경제 현상을 무엇이라고 할까요?',
    options: ['디플레이션', '인플레이션', '리세션', '모라토리엄'],
    answer: 2,
    explanation: '물가 수준이 지속적으로 상승하여 같은 돈으로 살 수 있는 물건의 양이 줄어드는 현상을 "인플레이션(Inflation)"이라고 합니다.'
  },
  {
    id: 'eco_02',
    category: 'economy',
    difficulty: '쉬움',
    question: '여러 가지 선택지 중에서 하나를 선택했을 때, 포기해야 하는 다른 선택지들 중 가장 가치가 큰 것의 가치를 뜻하는 경제 용어는?',
    options: ['매몰 비용', '기회비용', '고정 비용', '수수료'],
    answer: 2,
    explanation: '어떤 선택으로 인해 포기한 대안 중 가장 가치 있는 것의 가치를 "기회비용(Opportunity Cost)"이라고 합니다.'
  },
  {
    id: 'eco_03',
    category: 'economy',
    difficulty: '보통',
    question: '우리나라의 화폐를 발행하고 기준금리를 결정하여 물가 안정을 꾀하는 대한민국의 중앙은행은?',
    options: ['국민은행', '한국은행', '기획재정부', '금융감독원'],
    answer: 2,
    explanation: '대한민국의 중앙은행은 "한국은행(Bank of Korea)"으로, 화폐 발행권과 통화신용정책 결정권을 가지고 있습니다.'
  },
  {
    id: 'eco_04',
    category: 'economy',
    difficulty: '보통',
    question: '원금에 대해서만 이자를 계산하는 단리와 달리, "원금에 이자를 더한 금액"을 새로운 원금으로 삼아 이자에 이자가 붙는 방식은?',
    options: ['복리(Compound Interest)', '할부', '배당', '공제'],
    answer: 1,
    explanation: '원금뿐만 아니라 발생한 이자에도 다시 이자가 붙어 눈덩이처럼 불어나는 방식을 "복리"라고 합니다.'
  },
  {
    id: 'eco_05',
    category: 'economy',
    difficulty: '쉬움',
    question: '통장에 들어있는 잔액 범위 안에서만 결제할 수 있어 중학생도 발급받아 계획적인 소비를 할 수 있는 카드는?',
    options: ['신용카드', '체크카드', '마이너스카드', '기프트론'],
    answer: 2,
    explanation: '체크카드(직불형 카드)는 연결된 은행 계좌의 잔액 한도 내에서만 즉시 출금되어 과소비를 예방할 수 있습니다.'
  },
  {
    id: 'eco_06',
    category: 'economy',
    difficulty: '보통',
    question: '기업이 지속 가능한 성장을 위해 신경 써야 할 3대 핵심 요소인 "환경(Environment)·사회(Social)·지배구조(Governance)"의 머리글자를 딴 용어는?',
    options: ['GDP', 'ESG', 'FTA', 'IMF'],
    answer: 2,
    explanation: '친환경 경영, 사회적 책임, 투명한 지배구조를 뜻하는 "ESG 경영"은 현대 기업의 중요한 평가 기준입니다.'
  },
  {
    id: 'eco_07',
    category: 'economy',
    difficulty: '보통',
    question: '수요와 공급의 법칙에서, 다른 조건이 같을 때 어떤 상품의 가격이 오르면 그 상품을 사려는 양(수요량)은 어떻게 변할까요?',
    options: ['증가한다', '감소한다', '변하지 않는다', '무조건 0이 된다'],
    answer: 2,
    explanation: '수요의 법칙에 따라 상품 가격이 상승하면 수요량은 감소하고, 가격이 하락하면 수요량은 증가합니다.'
  },
  {
    id: 'eco_08',
    category: 'economy',
    difficulty: '보통',
    question: '한 나라의 영토 안에서 일정 기간(보통 1년) 동안 새롭게 생산된 모든 최종 재화와 서비스의 시장 가치를 합한 경제 지표는?',
    options: ['국내총생산(GDP)', '소비자물가지수(CPI)', '실업률', '환율'],
    answer: 1,
    explanation: '국내총생산(GDP, Gross Domestic Product)은 한 나라의 경제 규모와 성장률을 파악하는 가장 대표적인 지표입니다.'
  },
  {
    id: 'eco_09',
    category: 'economy',
    difficulty: '보통',
    question: '원/달러 환율이 "1달러 = 1,200원"에서 "1달러 = 1,400원"으로 올랐을 때(환율 상승), 나타나는 현상으로 옳은 것은?',
    options: ['미국 여행 경비 부담이 줄어든다', '미국 직구(수입) 상품의 원화 가격이 비싸진다', '원화의 가치가 달러보다 높아졌다', '한국 제품의 미국 수출 가격이 달러 기준으로 비싸진다'],
    answer: 2,
    explanation: '환율이 오르면 같은 1달러짜리 물건을 살 때 1,200원 대신 1,400원을 내야 하므로 수입품 가격과 해외여행 비용 부담이 커집니다.'
  },
  {
    id: 'eco_10',
    category: 'economy',
    difficulty: '쉬움',
    question: '가로등, 국방, 치안, 공원처럼 대가를 지불하지 않은 사람도 함께 이용할 수 있어 국가나 지방자치단체가 주로 공급하는 재화는?',
    options: ['사적재', '공공재', '사치재', '대체재'],
    answer: 2,
    explanation: '비배제성과 비경합성을 지녀 모든 시민이 함께 누리는 재화와 서비스를 "공공재(Public Goods)"라고 합니다.'
  },
  {
    id: 'eco_11',
    category: 'economy',
    difficulty: '보통',
    question: '금융(Finance)과 기술(Technology)의 합성어로, 모바일 간편결제·송금 앱처럼 IT 기술을 결합한 새로운 금융 서비스를 뜻하는 말은?',
    options: ['핀테크(FinTech)', '바이오테크', '그린테크', '나노테크'],
    answer: 1,
    explanation: 'Finance(금융) + Technology(기술)의 합성어인 "핀테크(FinTech)"는 모바일 뱅킹, 간편송금 등을 아우르는 용어입니다.'
  },
  {
    id: 'eco_12',
    category: 'economy',
    difficulty: '보통',
    question: '이미 지출해서 어떤 선택을 하더라도 다시 되돌릴 수 없는 비용(예: 환불 불가능한 영화표를 산 뒤 영화가 재미없을 때 티켓값)을 무엇이라 할까요?',
    options: ['매몰 비용(Sunk Cost)', '기회비용', '부가가치세', '배당금'],
    answer: 1,
    explanation: '이미 지불하여 회수할 수 없는 비용을 "매몰 비용"이라고 합니다. 합리적인 선택을 하려면 매몰 비용에 얽매이지 말아야 합니다.'
  },
  {
    id: 'eco_13',
    category: 'economy',
    difficulty: '보통',
    question: '소고기 가격이 너무 오르자 대신 돼지고기나 닭고기를 찾는 사람들이 늘어났습니다. 이처럼 비슷한 만족을 주어 서로 대신할 수 있는 재화를 무엇이라 할까요?',
    options: ['보완재', '대체재', '공공재', '독점재'],
    answer: 2,
    explanation: '소고기와 돼지고기, 콜라와 사이다처럼 대신 소비할 수 있는 재화를 "대체재"라고 합니다.'
  },
  {
    id: 'eco_14',
    category: 'economy',
    difficulty: '보통',
    question: '인간이 배출하는 온실가스(이산화 탄소 등)의 양과 흡수·제거하는 양을 같게 만들어 실질적인 배출량을 "0(Zero)"으로 만든다는 기후위기 대응 개념은?',
    options: ['탄소 중립(Net Zero)', '오존층 파괴', '열섬 현상', '엘니뇨'],
    answer: 1,
    explanation: '탄소 배출량과 흡수량을 같게 하여 순배출량을 0으로 만드는 것을 "탄소 중립(Carbon Neutrality / Net Zero)"이라고 합니다.'
  },
  {
    id: 'eco_15',
    category: 'economy',
    difficulty: '보통',
    question: '생산자와 소비자가 공정한 가격으로 거래하여 개발도상국 노동자와 생산자의 경제적 자립을 돕는 윤리적 무역 형태는?',
    options: ['보호 무역', '공정 무역(Fair Trade)', '밀무역', '덤핑 무역'],
    answer: 2,
    explanation: '커피, 초콜릿 등의 원료 생산자에게 정당한 대가를 지불하는 윤리적 소비·무역 운동을 "공정 무역(Fair Trade)"이라고 합니다.'
  },
  {
    id: 'eco_16',
    category: 'economy',
    difficulty: '보통',
    question: '국가가 국민에게서 거두어들인 세금 중, 물건을 살 때 상품 가격에(보통 10%) 포함되어 우리가 간접적으로 내는 세금은?',
    options: ['소득세', '부가가치세(VAT)', '재산세', '상속세'],
    answer: 2,
    explanation: '편의점이나 문구점에서 물건을 살 때 영수증에 찍히는 10%의 세금은 간접세인 "부가가치세(Value Added Tax)"입니다.'
  },
  {
    id: 'eco_17',
    category: 'economy',
    difficulty: '어려움',
    question: '"달걀을 한 바구니에 담지 마라"라는 경제 격언이 강조하는 바람직한 자산 관리 원칙은?',
    options: ['충동구매', '분산 투자(위험 분산)', '전액 대출', '단기 투기'],
    answer: 2,
    explanation: '한 곳에 모든 자산을 몰아넣으면 큰 손실을 볼 수 있으므로 여러 곳에 나누어 위험을 줄이라는 "분산 투자"를 뜻합니다.'
  },
  {
    id: 'eco_18',
    category: 'economy',
    difficulty: '쉬움',
    question: '버려지는 제품을 단순히 재활용하는 차원을 넘어, 디자인과 아이디어를 더해 완전히 새로운 가치를 지닌 제품으로 재탄생시키는 것은?',
    options: ['업사이클링(Upcycling)', '다운사이클링', '패스트패션', '일회용 소비'],
    answer: 1,
    explanation: 'Upgrade + Recycling의 합성어인 "업사이클링(새활용)"은 폐기물에 디자인과 활용도를 더해 가치를 높이는 활동입니다.'
  },

  // ==========================================================================
  // 4. 🌍 세계 문화·지리 (국가, 수도, 유산, 지리 18문항)
  // ==========================================================================
  {
    id: 'wld_01',
    category: 'world',
    difficulty: '쉬움',
    question: '오스트레일리아(호주)의 수도는 어디일까요? (시드니나 멜버른이 아닙니다!)',
    options: ['캔버라', '웰링턴', '오클랜드', '브리즈번'],
    answer: 1,
    explanation: '호주의 최대 도시는 시드니이지만, 시드니와 멜버른의 수도 경쟁을 절충하여 세운 계획도시 "캔버라(Canberra)"가 수도입니다.'
  },
  {
    id: 'wld_02',
    category: 'world',
    difficulty: '쉬움',
    question: '세계에서 면적이 가장 넓은 나라와 가장 작은 나라(도시국가)를 바르게 짝지은 것은?',
    options: ['러시아 - 바티칸 시국', '중국 - 모나코', '캐나다 - 싱가포르', '미국 - 몰타'],
    answer: 1,
    explanation: '세계에서 가장 넓은 나라는 러시아(한반도의 약 77배)이며, 가장 작은 나라는 로마 시내에 위치한 "바티칸 시국"입니다.'
  },
  {
    id: 'wld_03',
    category: 'world',
    difficulty: '보통',
    question: '남아메리카 안데스산맥 고산지대에 위치하며, 잉카 제국의 신비로운 공중 도시 유적으로 유명한 페루의 세계유산은?',
    options: ['앙코르와트', '마추픽추', '피라미드', '타지마할'],
    answer: 2,
    explanation: '페루의 해발 2,430m 고산지대에 위치한 잉카 문명의 유적은 "마추픽추(Machu Picchu)"입니다.'
  },
  {
    id: 'wld_04',
    category: 'world',
    difficulty: '쉬움',
    question: '지구의 위도 0° 선으로, 지구를 북반구와 남반구로 나누는 기준선의 이름은?',
    options: ['본초 자오선', '적도(Equator)', '북회귀선', '날짜 변경선'],
    answer: 2,
    explanation: '위도 0°는 "적도"이며, 경도 0°(영국 그리니치 천문대 기준)는 "본초 자오선"입니다.'
  },
  {
    id: 'wld_05',
    category: 'world',
    difficulty: '보통',
    question: '유럽과 아시아 두 대륙에 걸쳐 있는 나라로, 최대 도시는 이스탄불이고 수도는 "앙카라"인 나라는?',
    options: ['그리스', '튀르키예(터키)', '이집트', '스페인'],
    answer: 2,
    explanation: '형제의 나라로도 불리는 "튀르키예"는 보스포루스 해협을 사이에 두고 유럽과 아시아에 걸쳐 있으며 수도는 앙카라입니다.'
  },
  {
    id: 'wld_06',
    category: 'world',
    difficulty: '보통',
    question: '인도의 무굴 제국 황제 샤자한이 세상을 떠난 왕비 뭄타즈 마할을 추모하기 위해 아그라에 세운 순백의 대리석 건축물은?',
    options: ['타지마할', '소피아 대성당', '알람브라 궁전', '파르테논 신전'],
    answer: 1,
    explanation: '인도 아그라에 위치한 "타지마할(Taj Mahal)"은 세계에서 가장 아름다운 대리석 건축물 중 하나로 꼽힙니다.'
  },
  {
    id: 'wld_07',
    category: 'world',
    difficulty: '보통',
    question: '캐나다의 수도로 올바른 도시는 어디일까요?',
    options: ['토론토', '밴쿠버', '오타와', '몬트리올'],
    answer: 3,
    explanation: '캐나다의 수도는 온타리오주와 퀘벡주 경계에 있는 "오타와(Ottawa)"입니다.'
  },
  {
    id: 'wld_08',
    category: 'world',
    difficulty: '쉬움',
    question: '동해의 우리 땅 "독도"는 행정구역상 어느 도(道)와 군(郡)에 속해 있을까요?',
    options: ['강원특별자치도 강릉시', '경상북도 울릉군', '제주특별자치도 서귀포시', '경상남도 통영시'],
    answer: 2,
    explanation: '독도는 동도와 서도 및 89개의 부속 도서로 이루어져 있으며, 행정구역은 "경상북도 울릉군 울릉읍 독도리"입니다.'
  },
  {
    id: 'wld_09',
    category: 'world',
    difficulty: '보통',
    question: '지중해성 기후 지역(그리스 산토리니 등)에서 뜨거운 여름 햇빛을 반사하기 위해 집의 외벽을 주로 어떤 색으로 칠할까요?',
    options: ['검은색', '하얀색', '진한 갈색', '보라색'],
    answer: 2,
    explanation: '여름이 고온 건조하고 햇볕이 강한 그리스 산토리니 등 지중해 연안에서는 햇빛을 반사해 실내 온도를 낮추려고 벽을 하얀색으로 칠합니다.'
  },
  {
    id: 'wld_10',
    category: 'world',
    difficulty: '보통',
    question: '세계에서 가장 높은 산인 에베레스트산(해발 약 8,848m)이 속해 있는 산맥은?',
    options: ['알프스산맥', '안데스산맥', '히말라야산맥', '로키산맥'],
    answer: 3,
    explanation: '"세계의 지붕"이라 불리는 아시아의 히말라야산맥에 에베레스트산이 위치해 있습니다.'
  },
  {
    id: 'wld_11',
    category: 'world',
    difficulty: '보통',
    question: '지구의 자전 때문에 경도 15°마다 1시간의 시차가 발생합니다. 우리나라(동경 135° 기준)는 영국 런던(본초 자오선, 경도 0°)보다 몇 시간 빠를까요?',
    options: ['5시간', '7시간', '9시간', '12시간'],
    answer: 3,
    explanation: '135° ÷ 15° = 9이므로, 한국 표준시(KST)는 영국 그리니치 표준시(GMT/UTC)보다 9시간 빠릅니다(UTC+9).'
  },
  {
    id: 'wld_12',
    category: 'world',
    difficulty: '쉬움',
    question: '베트남의 전통 음식으로, 쌀국수(퍼)와 함께 얇은 라이스페이퍼에 채소와 고기, 해산물을 싸서 먹는 요리는?',
    options: ['타코', '월남쌈', '팟타이', '케밥'],
    answer: 2,
    explanation: '라이스페이퍼에 신선한 채소와 재료를 싸 먹는 베트남 요리는 "월남쌈(고이꾸온)"입니다.'
  },
  {
    id: 'wld_13',
    category: 'world',
    difficulty: '보통',
    question: '유네스코 세계유산으로 등재된 우리나라의 문화유산이 아닌 것은?',
    options: ['수원 화성', '불국사와 석굴암', '종묘와 창덕궁', '남산서울타워'],
    answer: 4,
    explanation: '수원 화성, 석굴암과 불국사, 종묘, 창덕궁은 모두 자랑스러운 유네스코 세계문화유산입니다.'
  },
  {
    id: 'wld_14',
    category: 'world',
    difficulty: '보통',
    question: '남아메리카 대륙을 흐르며 유역 면적과 유량이 세계 최대이고, 열대 우림을 이루어 "지구의 허파"라 불리는 강은?',
    options: ['아마존강', '나일강', '미시시피강', '다뉴브강'],
    answer: 1,
    explanation: '남아메리카의 "아마존강" 유역 열대 우림(셀바스)은 지구 산소 공급과 생물 다양성의 보고로 불립니다.'
  },
  {
    id: 'wld_15',
    category: 'world',
    difficulty: '보통',
    question: '뉴질랜드의 원주민인 "마오리족"이 손님을 환영할 때 코와 이마를 서로 맞대고 숨결을 나누는 전통 인사법은?',
    options: ['홍이(Hongi)', '나마스테', '와이', '알로하'],
    answer: 1,
    explanation: '마오리족의 전통 인사인 "홍이(Hongi)"는 코를 맞대어 생명의 숨결을 나눈다는 뜻깊은 의미를 담고 있습니다.'
  },
  {
    id: 'wld_16',
    category: 'world',
    difficulty: '보통',
    question: '빙하가 깎아 만든 U자형 골짜기에 바닷물이 들어와 형성된 지형으로, 노르웨이 해안에서 볼 수 있는 절경은?',
    options: ['피오르(피오르드)', '리아스식 해안', '삼각주', '산호초'],
    answer: 1,
    explanation: '노르웨이, 뉴질랜드 남섬 등에서 볼 수 있는 좁고 깊은 빙하 침식만 지형을 "피오르(Fjord)"라고 합니다.'
  },
  {
    id: 'wld_17',
    category: 'world',
    difficulty: '쉬움',
    question: '미국 뉴욕 항구에 서 있는 "자유의 여신상"은 미국의 독립 100주년을 기념하여 어느 나라가 선물한 것일까요?',
    options: ['영국', '프랑스', '독일', '이탈리아'],
    answer: 2,
    explanation: '자유의 여신상은 프랑스가 미국 독립 100주년을 축하하며 우정의 상징으로 선물한 조각상입니다.'
  },
  {
    id: 'wld_18',
    category: 'world',
    difficulty: '보통',
    question: '우리나라 지형 특징으로, 겨울철 눈이 많이 내리는 울릉도에서 눈이 집 안으로 들어오는 것을 막기 위해 지붕 처마 끝에 둘러친 전통 벽 구조물은?',
    options: ['우데기', '정낭', '온돌', '다락'],
    answer: 1,
    explanation: '다설지인 울릉도의 전통 가옥에는 눈보라를 막고 실내 활동 공간을 확보하기 위한 외벽 시설인 "우데기"가 있습니다.'
  },

  // ==========================================================================
  // 5. 🚀 과학·미래기술 (AI, 우주, 생명과학, 생활 과학 18문항)
  // ==========================================================================
  {
    id: 'sci_01',
    category: 'science',
    difficulty: '쉬움',
    question: '텍스트, 이미지, 오디오 등을 단순히 분류하는 것을 넘어 사용자의 질문(프롬프트)에 맞춰 새로운 글이나 그림, 코드를 만들어내는 인공지능 기술은?',
    options: ['생성형 AI(Generative AI)', '증기 기관', '아날로그 라디오', '바코드 스캐너'],
    answer: 1,
    explanation: '제미나이(Gemini)처럼 데이터를 학습해 새로운 콘텐츠를 만들어내는 인공지능을 "생성형 AI"라고 합니다.'
  },
  {
    id: 'sci_02',
    category: 'science',
    difficulty: '쉬움',
    question: '태양계 행성 중 크기가 가장 크며, 표면에 거대한 소용돌이인 "대적점(큰 붉은 점)"이 있는 기체 행성은?',
    options: ['화성', '목성', '토성', '금성'],
    answer: 2,
    explanation: '목성(Jupiter)은 태양계에서 가장 큰 행성으로, 지구의 약 11배 지름을 가졌으며 대적점이라는 거대한 폭풍 소용돌이가 있습니다.'
  },
  {
    id: 'sci_03',
    category: 'science',
    difficulty: '보통',
    question: '순수한 독자 기술로 개발되어 실용위성을 우주 궤도에 성공적으로 안착시킨 대한민국의 한국형 발사체 이름은?',
    options: ['누리호', '아리랑호', '무궁화호', '천리안호'],
    answer: 1,
    explanation: '"누리호(KSLV-II)"는 세상을 뜻하는 순우리말 "누리"에서 이름을 딴 대한민국의 독자 우주 발사체입니다.'
  },
  {
    id: 'sci_04',
    category: 'science',
    difficulty: '쉬움',
    question: '생물체의 유전 정보를 담고 있는 물질인 "DNA"의 입체 구조는 어떤 모양일까요?',
    options: ['단일 직선 구조', '이중 나선 구조', '정육면체 구조', '피라미드 구조'],
    answer: 2,
    explanation: '왓슨과 크릭 등이 밝혀낸 DNA의 입체 구조는 두 가닥의 사슬이 꼬여 있는 "이중 나선(Double Helix) 구조"입니다.'
  },
  {
    id: 'sci_05',
    category: 'science',
    difficulty: '보통',
    question: '구급차가 다가올 때는 사이렌 소리가 높게 들리고, 멀어질 때는 낮게 들리는 것처럼 파원의 이동에 따라 진동수가 변해 보이는 현상은?',
    options: ['도플러 효과', '신기루 현상', '무지개 분산', '자유 낙하'],
    answer: 1,
    explanation: '소리를 내는 물체나 관찰자가 움직일 때 파장과 진동수가 변하는 현상을 "도플러 효과(Doppler Effect)"라고 합니다.'
  },
  {
    id: 'sci_06',
    category: 'science',
    difficulty: '보통',
    question: '인공지능이 사실이 아닌 정보를 마치 진짜 사실인 것처럼 그럴듯하게 지어내어 대답하는 현상을 무엇이라고 부를까요?',
    options: ['할루시네이션(환각 현상)', '오버클럭', '버퍼링', '다운로드'],
    answer: 1,
    explanation: 'AI가 거짓 정보를 사실처럼 생성하는 현상을 "할루시네이션(Hallucination, 환각)"이라고 부르며, 사실 확인(팩트 체크)이 중요합니다.'
  },
  {
    id: 'sci_07',
    category: 'science',
    difficulty: '쉬움',
    question: '우리 몸의 세포 호흡을 통해 에너지를 생산하는 세포 소기관으로, "세포의 발전소"라고도 불리는 것은?',
    options: ['미토콘드리아', '세포벽', '액포', '중심체'],
    answer: 1,
    explanation: '미토콘드리아는 영양소를 분해하여 생명 활동에 필요한 에너지(ATP)를 만들어내는 세포 소기관입니다.'
  },
  {
    id: 'sci_08',
    category: 'science',
    difficulty: '보통',
    question: '0과 1의 비트(Bit)만 사용하는 일반 컴퓨터와 달리, 0과 1이 동시에 존재하는 "중첩(큐비트)" 현상을 이용해 초고속 연산을 수행하는 미래 컴퓨터는?',
    options: ['양자 컴퓨터(Quantum Computer)', '주판', '타자기', '트랜지스터 라디오'],
    answer: 1,
    explanation: '양자 역학의 중첩과 얽힘 원리를 이용한 "양자 컴퓨터"는 기존 슈퍼컴퓨터로 수만 년 걸릴 계산을 단시간에 풀 수 있습니다.'
  },
  {
    id: 'sci_09',
    category: 'science',
    difficulty: '쉬움',
    question: '과자 봉지를 들고 높은 산에 올라가면 봉지가 빵빵하게 부풀어 오릅니다. 그 이유로 가장 알맞은 것은?',
    options: ['높이 올라갈수록 외부 기압이 낮아지기 때문', '산 위의 온도가 100도 이상이기 때문', '산 위에는 중력이 전혀 없기 때문', '과자가 스스로 발효되기 때문'],
    answer: 1,
    explanation: '높은 산으로 올라갈수록 공기가 희박해져 외부 기압이 낮아지므로, 봉지 내부 기체의 부피가 팽창합니다(보일의 법칙).'
  },
  {
    id: 'sci_10',
    category: 'science',
    difficulty: '보통',
    question: '가전제품, 자동차, 웨어러블 기기 등 일상 속 사물들이 인터넷에 연결되어 서로 데이터를 주고받으며 작동하는 기술은?',
    options: ['사물인터넷(IoT)', '만유인력', '판구조론', '멘델의 유전법칙'],
    answer: 1,
    explanation: 'Internet of Things의 약자인 "사물인터넷(IoT)"은 스마트홈, 스마트워치 등 사물 간 네트워크 연결 기술입니다.'
  },
  {
    id: 'sci_11',
    category: 'science',
    difficulty: '보통',
    question: '빛의 삼원색(R·G·B)을 모두 합치면 어떤 색의 빛이 될까요?',
    options: ['검은색', '백색(하얀색)', '갈색', '회색'],
    answer: 2,
    explanation: '빛의 삼원색(빨강·초록·파랑)은 섞을수록 밝아지는 가산 혼합이어서 세 가지를 모두 합치면 "백색광(하얀 빛)"이 됩니다.'
  },
  {
    id: 'sci_12',
    category: 'science',
    difficulty: '보통',
    question: '현실의 모습 위에 가상의 이미지나 정보를 겹쳐서 보여주는 기술(예: 스마트폰 카메라로 길 안내 화살표나 포켓몬을 띄우는 기술)은?',
    options: ['증강현실(AR)', '축음기', '모스 부호', '진공관'],
    answer: 1,
    explanation: '실제 현실 세계에 3차원 가상 정보를 겹쳐 보여주는 기술을 "증강현실(AR, Augmented Reality)"이라고 합니다.'
  },
  {
    id: 'sci_13',
    category: 'science',
    difficulty: '보통',
    question: '특정 온도 이하에서 전기 저항이 완전히 "0"이 되어 전력 손실 없이 전류를 흘려보내고 자기부상열차 등에 활용되는 물질은?',
    options: ['초전도체(Superconductor)', '부도체', '고무줄', '플라스틱'],
    answer: 1,
    explanation: '전기 저항이 0이 되는 현상과 자기장을 밀어내는 마이스너 효과를 지닌 물질을 "초전도체"라고 합니다.'
  },
  {
    id: 'sci_14',
    category: 'science',
    difficulty: '쉬움',
    question: '여름철 더운 날 땀을 흘린 뒤 바람이 불면 시원함을 느끼는 이유는 물이 증발하면서 주변의 열을 어떻게 하기 때문일까요?',
    options: ['기화열을 흡수하기(빼앗기) 때문', '열을 새로 만들어내기 때문', '피부를 얼리기 때문', '산소를 없애기 때문'],
    answer: 1,
    explanation: '액체(땀)가 기체(수증기)로 상태 변화할 때 주변으로부터 "기화열"을 흡수하므로 피부 온도가 내려가 시원해집니다.'
  },
  {
    id: 'sci_15',
    category: 'science',
    difficulty: '보통',
    question: '유전자(DNA)의 특정 부위를 정교하게 잘라내고 교정하여 유전 질환 치료나 품종 개량에 쓰이는 생명공학 기술의 별칭은?',
    options: ['유전자 가위(CRISPR-Cas9)', '유전자 풀', '세포 현미경', '원심분리기'],
    answer: 1,
    explanation: '원하는 DNA 염기서열을 찾아가 정확히 자르고 교정하는 크리스퍼(CRISPR-Cas9) 기술을 "유전자 가위"라고 부릅니다.'
  },
  {
    id: 'sci_16',
    category: 'science',
    difficulty: '보통',
    question: '태양에서 출발한 빛이 지구까지 도달하는 데 걸리는 시간은 약 얼마일까요? (빛의 속도는 초속 약 30만 km)',
    options: ['약 1초', '약 8분 20초', '약 24시간', '약 1년'],
    answer: 2,
    explanation: '지구와 태양 사이의 거리(약 1억 5천만 km, 1AU)를 빛이 달려오는 데는 약 8분 20초(약 500초)가 걸립니다.'
  },
  {
    id: 'sci_17',
    category: 'science',
    difficulty: '보통',
    question: '바다나 강, 토양 등에 버려진 플라스틱이 쪼개져 크기가 5mm 미만으로 작아진 조각으로, 해양 생태계를 위협하는 오염 물질은?',
    options: ['미세 플라스틱', '천연 미네랄', '피톤치드', '플랑크톤'],
    answer: 1,
    explanation: '크기 5mm 이하의 작은 플라스틱 입자인 "미세 플라스틱(Microplastics)"은 먹이사슬을 통해 생태계와 인체에 영향을 미칩니다.'
  },
  {
    id: 'sci_18',
    category: 'science',
    difficulty: '쉬움',
    question: '웹 브라우저 주소창의 "HTTPS"에서 마지막 알파벳 "S"가 의미하는 보안 관련 단어는?',
    options: ['Speed(속도)', 'Secure(보안/안전한)', 'Simple(단순한)', 'Super(초강력)'],
    answer: 2,
    explanation: 'HTTPS의 S는 "Secure(보안)"를 뜻하며, 데이터를 암호화하여 안전하게 주고받는 통신 규약입니다.'
  },

  // ==========================================================================
  // 6. 🎨 예술·대중문화 (음악, 미술, 문학, 스포츠, K-컬처 18문항)
  // ==========================================================================
  {
    id: 'cul_01',
    category: 'culture',
    difficulty: '쉬움',
    question: '한국인 최초이자 아시아 여성 최초로 2024년 노벨 문학상을 수상한 대한민국의 소설가는?',
    options: ['한강', '박경리', '신경숙', '김초엽'],
    answer: 1,
    explanation: '『소년이 온다』, 『작별하지 않는다』, 『채식주의자』 등을 집필한 한강 작가가 2024년 노벨 문학상을 수상하였습니다.'
  },
  {
    id: 'cul_02',
    category: 'culture',
    difficulty: '쉬움',
    question: '프랑스 파리 루브르 박물관에 소장되어 있으며, 신비로운 미소와 눈썹이 없는 얼굴로 유명한 레오나르도 다빈치의 명화는?',
    options: ['진주 귀걸이를 한 소녀', '모나리자', '별이 빛나는 밤', '절규'],
    answer: 2,
    explanation: '레오나르도 다빈치가 스푸마토 기법(윤곽선을 안개처럼 부드럽게 번지게 하는 기법)으로 그린 명화는 "모나리자"입니다.'
  },
  {
    id: 'cul_03',
    category: 'culture',
    difficulty: '쉬움',
    question: '악보에서 음을 점점 세게 연주하라는 뜻의 음악 용어(기호 <)는 무엇일까요?',
    options: ['크레셴도(crescendo)', '데크레셴도(decrescendo)', '스타카토(staccato)', '피아니시모(pianissimo)'],
    answer: 1,
    explanation: '점점 세게는 "크레셴도(cresc.)", 점점 여리게는 "데크레셴도(decresc.)" 또는 "디미누엔도(dim.)"라고 합니다.'
  },
  {
    id: 'cul_04',
    category: 'culture',
    difficulty: '보통',
    question: '소용돌이치는 밤하늘의 별빛과 사이프러스 나무를 강렬한 붓터치로 그린 『별이 빛나는 밤』, 『해바라기』의 화가는?',
    options: ['파블로 피카소', '빈센트 반 고흐', '클로드 모네', '앙리 마티스'],
    answer: 2,
    explanation: '네덜란드 출신의 후기 인상주의 화가 "빈센트 반 고흐"의 대표작입니다.'
  },
  {
    id: 'cul_05',
    category: 'culture',
    difficulty: '쉬움',
    question: '우리나라 고유의 전통 성악곡으로, 소리꾼이 고수(북 치는 사람)의 장단에 맞추어 노래(창)와 말(아니리), 몸짓(발림)으로 이야기를 펼치는 예술은?',
    options: ['판소리', '사물놀이', '가곡', '오페라'],
    answer: 1,
    explanation: '춘향가, 심청가, 수궁가, 흥보가, 적벽가 등으로 대표되는 "판소리"는 유네스코 인류무형문화유산입니다.'
  },
  {
    id: 'cul_06',
    category: 'culture',
    difficulty: '보통',
    question: '사물놀이에 사용되는 네 가지 전통 타악기(꽹과리, 징, 장구, 북) 중, 가장 높은 소리를 내며 전체 가락을 이끄는 작은 놋쇠 악기는?',
    options: ['꽹과리', '징', '장구', '소고'],
    answer: 1,
    explanation: '사물놀이에서 꽹과리는 번개, 장구는 비, 북은 구름, 징은 바람을 상징하며, 꽹과리(상쇠)가 전체 연주를 이끕니다.'
  },
  {
    id: 'cul_07',
    category: 'culture',
    difficulty: '쉬움',
    question: '생텍쥐페리의 소설 『어린 왕자』에서, 어린 왕자가 지구에 와서 길들이게 되며 "가장 중요한 것은 눈에 보이지 않아"라는 비밀을 알려주는 동물은?',
    options: ['사막여우', '보아뱀', '하얀 토끼', '부엉이'],
    answer: 1,
    explanation: '여우는 어린 왕자에게 "네가 나를 길들인다면 우리는 서로에게 세상에 단 하나뿐인 존재가 될 거야"라며 소중한 지혜를 알려줍니다.'
  },
  {
    id: 'cul_08',
    category: 'culture',
    difficulty: '보통',
    question: '청력을 잃는 시련 속에서도 교향곡 제5번 『운명』과 제9번 『합창』 등 불멸의 명곡을 남긴 독일의 작곡가는?',
    options: ['루트비히 판 베토벤', '볼프강 아마데우스 모차르트', '요한 세바스티안 바흐', '프레데리크 쇼팽'],
    answer: 1,
    explanation: '"악성(樂聖)"이라 불리는 베토벤은 청력을 잃은 뒤에도 교향곡 9번 『합창』 등 위대한 작품을 작곡했습니다.'
  },
  {
    id: 'cul_09',
    category: 'culture',
    difficulty: '쉬움',
    question: '배구 경기나 피구, 농구 등에서 심판의 판정에 항의하지 않고 규칙을 준수하며 상대방을 존중하는 태도를 일컫는 말은?',
    options: ['스포츠맨십(페어플레이)', '오프사이드', '트래블링', '더블드리블'],
    answer: 1,
    explanation: '정정당당하게 경기하고 결과에 승복하며 상대를 배려하는 정신을 "스포츠맨십(Sportsmanship)" 또는 "페어플레이"라고 합니다.'
  },
  {
    id: 'cul_10',
    category: 'culture',
    difficulty: '보통',
    question: '조선 후기 화가 신윤복의 풍속화로, 단오날 창포물에 머리를 감는 여인들과 그네를 타는 모습을 생생하게 그린 작품은?',
    options: ['단오풍정', '씨름', '서당', '인왕제색도'],
    answer: 1,
    explanation: '혜원 신윤복의 『단오풍정』은 단오날 개울가에서 그네를 타고 머리를 감는 여인들의 모습을 그린 대표적인 풍속화입니다. (씨름, 서당은 김홍도)'
  },
  {
    id: 'cul_11',
    category: 'culture',
    difficulty: '보통',
    question: '4년마다 열리는 하계·동계 올림픽의 오륜기(5개의 고리)가 상징하는 의미로 가장 알맞은 것은?',
    options: ['세계 5대륙의 화합과 단결', '올림픽 5대 인기 종목', '5일간의 축제 기간', '5명의 창립자'],
    answer: 1,
    explanation: '오륜기의 파랑·노랑·검정·초록·빨강 다섯 고리는 아시아, 유럽, 아프리카, 아메리카, 오세아니아 5대륙의 평화로운 결합을 상징합니다.'
  },
  {
    id: 'cul_12',
    category: 'culture',
    difficulty: '보통',
    question: '봉준호 감독의 영화로, 한국 영화 최초로 칸 영화제 황금종려상과 미국 아카데미 시상식 작품상 등 4관왕을 차지한 작품은?',
    options: ['기생충', '설국열차', '괴물', '미나리'],
    answer: 1,
    explanation: '영화 『기생충(Parasite)』은 칸 영화제 황금종려상과 제92회 아카데미 작품상·감독상·각본상·국제장편영화상을 수상했습니다.'
  },
  {
    id: 'cul_13',
    category: 'culture',
    difficulty: '보통',
    question: '고려 시대에 발달한 독창적인 도자기 예술로, 은은한 비취색 유약과 표면을 파내어 흰 흙·붉은 흙을 메워 무늬를 넣는 "상감 기법"으로 유명한 것은?',
    options: ['고려청자', '조선백자', '빗살무늬 토기', '신라 토우'],
    answer: 1,
    explanation: '비색의 아름다움과 상감 기법으로 세계적인 예술성을 인정받는 도자기는 "고려청자(상감청자)"입니다.'
  },
  {
    id: 'cul_14',
    category: 'culture',
    difficulty: '쉬움',
    question: '우리 학교 체력검사(PAPS) 종목 중, 신호음에 맞춰 20m 거리를 왕복하여 달리며 "심폐지구력"을 측정하는 종목의 이름은?',
    options: ['셔틀런(왕복 오래달리기)', '제자리멀리뛰기', '앉아 윗몸 앞으로 굽히기', '악력 검사'],
    answer: 1,
    explanation: 'PAPS에서 심폐지구력은 "셔틀런(왕복 오래달리기)", 유연성은 앉아 윗몸 앞으로 굽히기, 순발력은 제자리멀리뛰기, 근력은 악력으로 측정합니다!'
  },
  {
    id: 'cul_15',
    category: 'culture',
    difficulty: '보통',
    question: '대상을 한 시점에서만 보지 않고 앞모습과 옆모습 등 여러 각도에서 본 모습을 한 화면에 재구성하여 그린 피카소의 미술 사조는?',
    options: ['입체파(큐비즘)', '인상파', '점묘파', '극사실주의'],
    answer: 1,
    explanation: '파블로 피카소와 조르주 브라크로 대표되는 "입체파(Cubism)"는 대상을 여러 시점에서 분해하여 한 화면에 결합한 현대 미술 사조입니다.'
  },
  {
    id: 'cul_16',
    category: 'culture',
    difficulty: '쉬움',
    question: '뮤지컬 『오페라의 유령』, 『캣츠(Cats)』, 『레미제라블』, 『미스 사이공』을 묶어 흔히 무엇이라고 부를까요?',
    options: ['세계 4대 뮤지컬', '세계 4대 교향곡', '셰익스피어 4대 비극', '세계 4대 영화제'],
    answer: 1,
    explanation: '오페라의 유령, 캣츠, 레미제라블, 미스 사이공은 전 세계적으로 가장 사랑받는 "세계 4대 뮤지컬"로 꼽힙니다.'
  },
  {
    id: 'cul_17',
    category: 'culture',
    difficulty: '보통',
    question: '서양 현악기 중 바이올린보다 크기가 조금 더 크고 중후한 중음역을 담당하는 악기는? (바이올린 - ____ - 첼로 - 콘트라베이스)',
    options: ['비올라', '플루트', '클라리넷', '하프'],
    answer: 1,
    explanation: '현악 4중주나 오케스트라에서 바이올린과 첼로 사이의 따뜻한 중음을 담당하는 현악기는 "비올라(Viola)"입니다.'
  },
  {
    id: 'cul_18',
    category: 'culture',
    difficulty: '쉬움',
    question: '다른 사람이 창작한 글, 음악, 그림, 사진, 영상 등의 저작물을 이용할 때 원작자의 권리를 보호하기 위해 지켜야 하는 권리는?',
    options: ['저작권(Copyright)', '초상권', '투표권', '청구권'],
    answer: 1,
    explanation: '창작자의 노력이 담긴 저작물에 대한 권리를 "저작권(Copyright)"이라고 하며, 출처 표시와 허락 등 정보통신윤리를 지켜야 합니다.'
  },

  // ==========================================================================
  // 7. 🔤 글로벌 영어 (실생활 관용표현·어휘·문화 16문항 - 정답 1,2,3,4번 균등 배분)
  // ==========================================================================
  {
    id: 'eng_01',
    category: 'english',
    question: "'Break a leg!'라는 영어 관용 표현이 공연이나 시험 전에 건네는 말일 때 알맞은 뜻은?",
    options: ['행운을 빌어', '조심해서 걸어', '다리를 쉬게 해', '끝까지 포기 마'],
    answer: 1
  },
  {
    id: 'eng_02',
    category: 'english',
    question: "'Once in a blue moon'이라는 표현이 뜻하는 빈도로 가장 알맞은 것은?",
    options: ['매달 규칙적으로', '아주 드물게 일어나는', '달빛이 유난히 밝은', '밤늦게까지 지속되는'],
    answer: 2
  },
  {
    id: 'eng_03',
    category: 'english',
    question: "식당에서 식사를 마친 후 'Can I have the check, please?'라고 요청할 때 'check'의 의미는?",
    options: ['주문 메뉴 재확인', '빈자리 추가 예약', '계산서', '남은 음식 포장'],
    answer: 3
  },
  {
    id: 'eng_04',
    category: 'english',
    question: "영미권 표현 'Piece of cake'과 가장 유사한 우리말 속담이나 관용구는?",
    options: ['백지장도 맞들면 낫다', '시작이 반이다', '티끌 모아 태산', '누워서 떡 먹기'],
    answer: 4
  },
  {
    id: 'eng_05',
    category: 'english',
    question: "지구 환경 보호를 위한 대표적인 3R 실천 운동에 포함되지 않는 단어는?",
    options: ['Remove', 'Reduce', 'Reuse', 'Recycle'],
    answer: 1
  },
  {
    id: 'eng_06',
    category: 'english',
    question: "'I am feeling under the weather today.'라고 말했을 때 화자의 상태는?",
    options: ['날씨가 좋아 상쾌함', '몸이 찌뿌둥하고 아픔', '비를 맞아 옷이 젖음', '바람 때문에 긴장됨'],
    answer: 2
  },
  {
    id: 'eng_07',
    category: 'english',
    question: "책이나 영화의 줄거리나 핵심 결말을 미리 누설하여 감상의 재미를 떨어뜨리는 행위는?",
    options: ['Trailer', 'Sequel', 'Spoiler', 'Prequel'],
    answer: 3
  },
  {
    id: 'eng_08',
    category: 'english',
    question: "상대방의 의견에 대해 '동의하지 않는다'는 의사를 공손하게 밝히는 표현은?",
    options: ['I am not ready', 'You got me wrong', 'It doesn\'t matter', 'I don\'t think so'],
    answer: 4
  },
  {
    id: 'eng_09',
    category: 'english',
    question: "공항 탑승 수속 중 허용된 수하물 무게를 초과했을 때 부과되는 요금 명칭은?",
    options: ['Excess baggage', 'Fast luggage', 'Heavy carton', 'Secret parcel'],
    answer: 1
  },
  {
    id: 'eng_10',
    category: 'english',
    question: "'We need to catch up with the latest trends.'에서 'catch up with'의 올바른 뜻은?",
    options: ['멀리 도망치다', '따라잡다', '손을 맞잡다', '친구에게 소개하다'],
    answer: 2
  },
  {
    id: 'eng_11',
    category: 'english',
    question: "'Every cloud has a silver lining'이라는 속담이 전하는 긍정적인 메시지는?",
    options: ['먹구름 뒤엔 비가 온다', '은색 장식은 변하지 않는다', '어려움 속에도 희망이 있다', '일기예보를 미리 확인해야 한다'],
    answer: 3
  },
  {
    id: 'eng_12',
    category: 'english',
    question: "스마트폰이나 프로그램의 오류를 고치고 최신 상태로 갱신하는 작업을 뜻하는 단어는?",
    options: ['Download', 'Restart', 'Backup', 'Update'],
    answer: 4
  },
  {
    id: 'eng_13',
    category: 'english',
    question: "'I am looking forward to seeing you.' 문장에서 'look forward to'의 정확한 뜻은?",
    options: ['간절히 고대하다', '뒤를 돌아보다', '앞으로 걸어가다', '앞장서서 이끌다'],
    answer: 1
  },
  {
    id: 'eng_14',
    category: 'english',
    question: "강연회나 공식 인터뷰가 끝난 뒤 이어지는 'Q&A' 세션의 올바른 영문 풀이는?",
    options: ['Quality and Access', 'Question and Answer', 'Quick and Accurate', 'Quiet and Active'],
    answer: 2
  },
  {
    id: 'eng_15',
    category: 'english',
    question: "'Better late than never'라는 격언이 강조하는 행동 양식으로 알맞은 것은?",
    options: ['부지런해야 성공한다', '속도보다 방향이 중요하다', '늦더라도 하는 것이 낫다', '약속 시간을 철저히 지키자'],
    answer: 3
  },
  {
    id: 'eng_16',
    category: 'english',
    question: "도움을 받은 상대방이 'Thank you so much!'라고 감사할 때 건네는 친절한 답변은?",
    options: ['Never remind me', 'It is your problem', 'You must pay back', 'My pleasure'],
    answer: 4
  },

  // ==========================================================================
  // 8. 📖 한국·세계 문학 (중학 교과 핵심 시·소설·세계명작 16문항 - 정답 1,2,3,4번 균등 배분)
  // ==========================================================================
  {
    id: 'lit_01',
    category: 'literature',
    question: "김소월의 시 「진달래꽃」에서 이별의 슬픔을 겉으로 드러내지 않고 삭이는 우리 민족의 전통적 정서는?",
    options: ['한(恨)', '풍자', '분노', '체념'],
    answer: 1
  },
  {
    id: 'lit_02',
    category: 'literature',
    question: "황순원의 단편 소설 「소나기」에서 갑작스러운 소나기를 피해 소년과 소녀가 함께 머물렀던 공간은?",
    options: ['낡은 물레방앗간', '수수밭 원두막', '깊은 산속 동굴', '마을 어귀 당산나무'],
    answer: 2
  },
  {
    id: 'lit_03',
    category: 'literature',
    question: "이효석의 단편 소설 「메밀꽃 필 무렵」에서 허 생원과 동이가 달빛 아래 걸어가던 주 무대 장터는?",
    options: ['강원도 횡성장', '강원도 정선장', '강원도 봉평장', '강원도 춘천장'],
    answer: 3
  },
  {
    id: 'lit_04',
    category: 'literature',
    question: "윤동주 시인의 대표작 「서시」에서 '하늘을 우러러 한 점 부끄럼이 없기를' 바라는 마음을 비유한 섬세한 자연물은?",
    options: ['밤하늘의 별', '차오르는 달', '불어오는 바람', '일렁이는 잎새'],
    answer: 4
  },
  {
    id: 'lit_05',
    category: 'literature',
    question: "생텍쥐페리의 소설 「어린 왕자」에서 사막 여우가 어린 왕자에게 알려 준 관계 맺기의 소중한 비밀은?",
    options: ['서로를 길들이는 것', '기다림 없이 떠나는 것', '비밀을 마음속에 묻는 것', '장미를 통제하는 것'],
    answer: 1
  },
  {
    id: 'lit_06',
    category: 'literature',
    question: "현진건의 단편 소설 「운수 좋은 날」의 비극적 결말을 극대화하기 위해 제목과 상황에 쓰인 문학적 표현 기법은?",
    options: ['과장법', '반어법', '의인법', '도치법'],
    answer: 2
  },
  {
    id: 'lit_07',
    category: 'literature',
    question: "셰익스피어의 4대 비극(햄릿, 오셀로, 리어 왕, 맥베스)에 포함되지 않는 작품은?",
    options: ['햄릿', '오셀로', '로미오와 줄리엣', '리어 왕'],
    answer: 3
  },
  {
    id: 'lit_08',
    category: 'literature',
    question: "주요섭의 단편 소설 「사랑손님과 어머니」에서 여섯 살 '옥희'의 순수한 시선으로 이야기를 전달하는 서술 시점은?",
    options: ['1인칭 주인공 시점', '3인칭 전지적 작가 시점', '3인칭 관찰자 시점', '1인칭 관찰자 시점'],
    answer: 4
  },
  {
    id: 'lit_09',
    category: 'literature',
    question: "허균이 지은 우리나라 최초의 한글 소설로, 적서 차별 철폐와 탐관오리 응징을 다룬 고전 문학 작품은?",
    options: ['홍길동전', '구운몽', '춘향전', '심청전'],
    answer: 1
  },
  {
    id: 'lit_10',
    category: 'literature',
    question: "헤르만 헤세의 소설 「데미안」에서 주인공 싱클레어가 알을 깨고 나와 날아가는 신화적 신의 이름은?",
    options: ['프로메테우스', '아브락사스', '디오니소스', '오디세우스'],
    answer: 2
  },
  {
    id: 'lit_11',
    category: 'literature',
    question: "조지 오웰의 풍자 소설 「동물농장」에서 동물들의 혁명 이상을 변질시키고 독재자로 군림하는 동물은?",
    options: ['충직한 말 복서', '늙은 당나귀 벤저민', '지배층이 된 돼지 나폴레옹', '경비견 무리'],
    answer: 3
  },
  {
    id: 'lit_12',
    category: 'literature',
    question: "이상화 시인의 저항시 「빼앗긴 들에도 봄은 오는가」에서 '빼앗긴 들'이 비유하고 있는 역사적 현실은?",
    options: ['병자호란의 참상', '갑오개혁의 혼란', '한국 전쟁의 비극', '일제 강점기 국권 피탈'],
    answer: 4
  },
  {
    id: 'lit_13',
    category: 'literature',
    question: "소설의 3요소(주제, 구성, 문체)와 구별되는 소설 '구성의 3요소'에 해당하는 것은?",
    options: ['인물, 사건, 배경', '운율, 심상, 어조', '기승전결, 갈등, 복선', '서론, 본론, 결론'],
    answer: 1
  },
  {
    id: 'lit_14',
    category: 'literature',
    question: "어니스트 헤밍웨이의 소설 「노인과 바다」에서 노인 산티아고가 84일간의 침묵 끝에 먼바다에서 낚아 올린 거대한 물고기는?",
    options: ['백상아리', '청새치', '대왕고래', '참다랑어'],
    answer: 2
  },
  {
    id: 'lit_15',
    category: 'literature',
    question: "박완서의 소설 「자전거 도둑」에서 주인공 수남이가 도덕적 부끄러움을 느끼고 고향으로 돌아가게 만든 상징물은?",
    options: ['잃어버린 시계', '낡은 가죽 지갑', '신사의 자전거', '가게의 금고'],
    answer: 3
  },
  {
    id: 'lit_16',
    category: 'literature',
    question: "찰스 디킨스의 소설 「크리스마스 캐럴」에서 구두쇠 스크루지가 과거·현재·미래의 유령을 만난 뒤 깨달은 삶의 진정한 가치는?",
    options: ['치밀한 자산 관리', '명예로운 신분 상승', '규칙적인 절약 습관', '이웃에 대한 나눔과 사랑'],
    answer: 4
  }
];
