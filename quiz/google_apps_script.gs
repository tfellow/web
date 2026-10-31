/**
 * ============================================================================
 * QUIZ QUEENS (퀴즈 퀸즈) - 서울문영여자중학교 (Seoul Moonyoung Girls' Middle School)
 * Google Sheets 백엔드 스크립트 (google_apps_script.gs v2.1 - 8대 영역 샘플 문제 내장)
 * ============================================================================
 *
 * [특징 및 기능]
 * 1. 선생님 작업용 [영역별 개별 탭 8개] 지원 (난이도, 해설 없이 질문·보기1~4·정답만 간결 입력!)
 * 2. 신규 영역(영어 16문항, 문학 16문항 포함 총 152문항 기본 샘플 문제 자동 탑재!)
 * 3. 상단 메뉴 [👑 퀴즈 퀸즈 > 🔄 영역별 탭 ➡️ 문제은행 자동 통합] 클릭 시 1초 만에 최종 취합!
 * 4. 상단 메뉴 [👑 퀴즈 퀸즈 > ✨ 샘플 문제 자동 채우기]로 비어있는 영역 탭을 즉시 채울 수 있음!
 * 5. 웹앱은 오직 [문제은행] 1개 탭만 읽으므로 로딩 속도 0.2초 초고속 유지!
 * 6. 학생 출제 퀴즈 및 상호 평가(좋아요/나빠요) 실시간 동기화 지원!
 */

const SHEET_NAMES = {
  STUDENTS: '학생통계',
  MASTER_QUESTIONS: '문제은행',
  STUDENT_SUBMISSIONS: '학생출제_검토',
  LOGS: '풀이로그',
  CERTS: '인증서발급내역'
};

const CATEGORY_TABS = [
  { tabName: '1.학교상식', catId: 'school' },
  { tabName: '2.교과융합', catId: 'curriculum' },
  { tabName: '3.시사경제', catId: 'economy' },
  { tabName: '4.세계지리', catId: 'world' },
  { tabName: '5.과학미래', catId: 'science' },
  { tabName: '6.예술문화', catId: 'culture' },
  { tabName: '7.영어', catId: 'english' },
  { tabName: '8.문학고전', catId: 'literature' }
];

const SAMPLE_QUESTIONS_BY_CAT = {
  "school": [
    [
      "sch_01",
      "서울문영여자중학교의 교훈(校訓)으로 올바르게 짝지어진 것은?",
      "경애(敬愛)와 신의(信義)",
      "성실(誠實)과 창조(創造)",
      "사랑(愛)과 봉사(奉仕)",
      "자유(自由)와 정의(正義)",
      1
    ],
    [
      "sch_02",
      "희망, 생명력과 인내심, 조화와 단결을 상징하는 서울문영여자중학교의 교화(꽃)는?",
      "진달래",
      "개나리",
      "장미",
      "목련",
      2
    ],
    [
      "sch_03",
      "서울문영여자중학교의 전통 학급 이름(1~4반)을 순서대로 바르게 나열한 것은?",
      "진·선·미·정",
      "정·숙·명·인",
      "매·난·국·죽",
      "경·애·신·의",
      2
    ],
    [
      "sch_04",
      "서울문영여자중학교의 영문 교명 표기로 올바른 것은?",
      "Seoul Moonyoung Girls' Middle School",
      "Seoul Munyeong High School",
      "Moonyoung International Academy",
      "Gwanak Moonyoung Middle School",
      1
    ],
    [
      "sch_05",
      "우리나라 사람들이 가진 고유한 신명을 살려 즐겁고 새로운 교육 희망을 일으킨다는 서울문영여자중학교의 학교 브랜드는?",
      "해피 문영",
      "신바람 문영",
      "드림 문영",
      "스마트 문영",
      2
    ],
    [
      "sch_06",
      "학교법인 문영학원의 3대 육영 지표(교육 이념)가 아닌 것은?",
      "구원인 : 진실",
      "생활인 : 근면",
      "창조인 : 창의",
      "경쟁인 : 승리",
      4
    ],
    [
      "sch_07",
      "구한말 참정대신으로 을사늑약 체결을 결사반대하신 부친 한규설 선생의 뜻을 받들어 학교법인 문영학원을 설립하신 분은?",
      "소석 한양호 선생",
      "우석 한학수 선생",
      "백범 김구 선생",
      "도산 안창호 선생",
      1
    ],
    [
      "sch_08",
      "학교법인 문영학원이 설립 인가를 받은 날을 기념하는 우리 학교의 개교기념일은 언제일까요?",
      "4월 1일",
      "5월 15일",
      "9월 29일",
      "11월 17일",
      3
    ],
    [
      "sch_09",
      "서울문영여자중학교 교표(배지)에서 \"프리즘과 소금 결정체를 나타내며 빛을 발하고 세상의 소금 구실을 하는 인재 양성\"을 상징하는 도형은?",
      "삼각형",
      "정육각형",
      "원",
      "별모양",
      2
    ],
    [
      "sch_10",
      "서울문영여자중학교 교가 1절의 첫 소절 가사로 알맞은 것은?",
      "남산을 바라보며 우뚝 솟은 집",
      "관악을 터전 삼아 이룩한 글터",
      "한강물 굽이치는 배움의 전당",
      "북한산 정기 받은 문영의 딸들",
      2
    ],
    [
      "sch_11",
      "매주 화요일 아침 독서 시간에 발행되어 읽고 100자 이상의 감상을 기록하는 우리 학교만의 독서 자료 이름은?",
      "문영 독서 노트",
      "내 마음속 보물 창고",
      "개나리 책방",
      "아침 지혜 편지",
      2
    ],
    [
      "sch_12",
      "우리 학교 본관 2층에 위치한 학생 휴게 공간의 이름은 무엇일까요?",
      "MY라움지",
      "개나리홀",
      "신바람카페",
      "문영쉼터",
      1
    ],
    [
      "sch_13",
      "등교 시 실내화를 가져오지 않은 학생에게 실내화를 대여해 주고 머리끈·손톱깎이 등을 지원하며 공공 자산 의식을 기르는 생활안전부 활동 이름은?",
      "문영 살림꾼",
      "문영 도우미",
      "신바람 지킴이",
      "개나리 봉사단",
      1
    ],
    [
      "sch_14",
      "6월 학급자치회 시간 등에 친구에게 미안했던 일을 편지로 써서 사과와 함께 전달하는 학교폭력 예방 행사 이름은?",
      "오렌지데이",
      "톡톡톡 애플데이",
      "해피 피치데이",
      "스위트 베리데이",
      2
    ],
    [
      "sch_15",
      "연간 30권 이상의 책을 읽고 독서기록장에 수기로 독후감을 작성하여 제출한 학생에게 학년말에 수여하는 상은?",
      "독서 표창장",
      "문영 노벨상",
      "베스트셀러상",
      "출판문화상",
      1
    ],
    [
      "sch_16",
      "우리 학교에서 매년 12월에 발간하는 학교 교지(소식지)의 제목은?",
      "관악",
      "문영인",
      "개나리",
      "신바람",
      3
    ],
    [
      "sch_17",
      "우리 학교 동아리 이름과 활동 분야가 바르게 연결되지 않은 것은?",
      "둥치 - 교지편집반",
      "두부 - 락밴드반",
      "로티플 - 댄스반",
      "완두콩 - 요리반",
      4
    ],
    [
      "sch_18",
      "우리 학교 방송반 동아리의 영문 약칭 이름은 무엇일까요?",
      "MYBS",
      "SMBC",
      "KBS-M",
      "M-TV",
      1
    ],
    [
      "sch_19",
      "우리 학교 피구반 동아리의 이름은 무엇일까요?",
      "스파이크",
      "퉁키스",
      "피구퀸즈",
      "썬더볼",
      2
    ],
    [
      "sch_20",
      "우리 학교 교실 배치도(본관) 기준으로 1학년 교실(1-1, 1-2, 1-3)은 몇 층에 위치해 있을까요?",
      "2층",
      "3층",
      "4층",
      "5층",
      4
    ],
    [
      "sch_21",
      "우리 학교 지하 1층에 위치한 특별실이 아닌 것은?",
      "도서실",
      "과학실 및 미술실",
      "컴퓨터실 및 영어교과실",
      "음악실",
      4
    ],
    [
      "sch_22",
      "1991년 홍제동에서 현재의 교사(건물)로 이전한 서울문영여자중학교가 위치한 서울특별시의 자치구는?",
      "서대문구",
      "관악구",
      "종로구",
      "동작구",
      2
    ],
    [
      "sch_23",
      "2025학년도 기준 서울문영여자중학교의 전체 학급 수(1~3학년 합계)는 총 몇 학급일까요?",
      "9학급",
      "11학급",
      "12학급",
      "15학급",
      2
    ],
    [
      "sch_24",
      "우리 학교 일과 운영표 기준, 아침 등교 시각과 1교시 시작 시각으로 올바른 것은?",
      "등교 8:00 / 1교시 8:30",
      "등교 8:20 / 1교시 8:55",
      "등교 8:40 / 1교시 9:00",
      "등교 9:00 / 1교시 9:15",
      2
    ],
    [
      "sch_25",
      "5월 백일장 및 미술 실기 활동에서 1학년 학생들이 주로 방문하여 창작 활동을 펼치는 장소는?",
      "관악산 호수 공원",
      "용산 가족 공원",
      "보라매 공원",
      "올림픽 공원",
      1
    ],
    [
      "sch_26",
      "진로상담부에서 운영하는 생명 존중 및 학생 정서 지원 캠페인의 이름으로 알맞은 것은?",
      "토닥토닥 마음 챙김 캠페인",
      "으쌰으쌰 체력 캠페인",
      "반짝반짝 별빛 캠페인",
      "하루한줄 일기 캠페인",
      1
    ],
    [
      "sch_27",
      "1학년 2학기 국어 수업 시간(15차시)을 활용하여 학급 친구들과 함께 대본을 쓰고 영화를 제작·발표하는 활동은?",
      "협력 종합 예술 활동",
      "나도 아나운서 활동",
      "영어 뮤지컬 캠프",
      "과학 발명 프로젝트",
      1
    ],
    [
      "sch_28",
      "우리 학교 특색사업으로, 방과 후에 교내에서 자습 및 대학생 교육봉사 멘토링 과외를 지원하는 프로그램 이름은?",
      "배움을 나누는 방과 후 공부방",
      "문영 심야 독서실",
      "관악 영재 아카데미",
      "신바람 어학당",
      1
    ],
    [
      "sch_29",
      "매월 5일 학교·학급 시설물의 안전을 점검하고, 보라매 안전체험관 연계 교육 등을 실시하는 우리 학교의 중점과제 이름은?",
      "슬기로운 학교 안전 생활",
      "글로벌 리더십 프로젝트",
      "친환경 에코 스쿨",
      "우주 과학 탐구 생활",
      1
    ],
    [
      "sch_30",
      "서울문영여자중학교 교가를 작사·작곡하신 분으로 바르게 짝지어진 것은?",
      "작사 김효중 / 작곡 백병동",
      "작사 윤동주 / 작곡 홍난파",
      "작사 박목월 / 작곡 안익태",
      "작사 이은상 / 작곡 나운영",
      1
    ]
  ],
  "curriculum": [
    [
      "cur_01",
      "[국어] \"까마귀 날자 배 떨어진다\"라는 속담과 가장 뜻이 통하는 한자성어는?",
      "오비이락(烏飛梨落)",
      "유비무환(有備無患)",
      "동문서답(東問西答)",
      "일석이조(一石二鳥)",
      1
    ],
    [
      "cur_02",
      "[수학] 1보다 큰 자연수 중에서 1과 자기 자신만을 약수로 가지는 수를 무엇이라고 할까요?",
      "합성수",
      "소수(Prime number)",
      "유리수",
      "무리수",
      2
    ],
    [
      "cur_03",
      "[역사] 고려 시대에 금속 활자로 인쇄된 책으로, 현존하는 세계 최고(最古)의 금속 활자본은?",
      "삼국사기",
      "팔만대장경",
      "직지심체요절",
      "무구정광대다라니경",
      3
    ],
    [
      "cur_04",
      "[과학] 식물이 빛에너지를 이용해 이산화 탄소와 물로부터 양분(포도당)과 산소를 만들어 내는 작용은?",
      "호흡 작용",
      "증산 작용",
      "광합성",
      "삼투 현상",
      3
    ],
    [
      "cur_05",
      "[영어] 다음 중 \"최선을 다하다\"라는 뜻의 영어 숙어 \"do one's _____\"의 빈칸에 들어갈 알맞은 단어는?",
      "good",
      "better",
      "best",
      "most",
      3
    ],
    [
      "cur_06",
      "[국어] 김유정의 소설 『동백꽃』에서 주인공 \"나\"와 \"점순이\"의 갈등을 유발하는 매개체이자 화해의 계기가 되는 노란 꽃은?",
      "진짜 동백나무 꽃",
      "생강나무 꽃",
      "개나리 꽃",
      "산수유 꽃",
      2
    ],
    [
      "cur_07",
      "[수학] 직각삼각형에서 직각을 낀 두 변의 길이가 각각 3cm, 4cm일 때, 빗변의 길이는 몇 cm일까요?",
      "5cm",
      "6cm",
      "7cm",
      "8cm",
      1
    ],
    [
      "cur_08",
      "[사회] 대한민국 헌법 제1조 제2항 \"대한민국의 주권은 (   )에게 있고, 모든 권력은 (   )으로부터 나온다\"에서 괄호에 공통으로 들어갈 말은?",
      "대통령",
      "국회",
      "국민",
      "법원",
      3
    ],
    [
      "cur_09",
      "[과학] 원소 기호 \"Au\"로 표기하며, 변하지 않는 노란 광택을 지닌 금속 원소는?",
      "은(Silver)",
      "금(Gold)",
      "구리(Copper)",
      "알루미늄(Aluminum)",
      2
    ],
    [
      "cur_10",
      "[국어] 다음 중 맞춤법 표기가 올바른 문장은 무엇일까요?",
      "감기 조심하길 바래.",
      "내일 뵈요.",
      "오랜만에 만나서 반가워.",
      "어제 웬지 기분이 좋더라.",
      3
    ],
    [
      "cur_11",
      "[역사] 조선 세종대왕 때 장영실 등이 제작한 기구로, 시간을 자동으로 알려주는 물시계의 이름은?",
      "앙부일구",
      "자격루",
      "측우기",
      "혼천의",
      2
    ],
    [
      "cur_12",
      "[영어] \"A piece of cake(케이크 한 조각)\"라는 영어 관용 표현이 실제로 의미하는 뜻은?",
      "매우 배가 고프다",
      "누워서 떡 먹기(매우 쉬운 일)",
      "생일을 축하하다",
      "소중한 보물",
      2
    ],
    [
      "cur_13",
      "[수학] 주사위 한 개를 던질 때, 소수(2, 3, 5)의 눈이 나올 확률은?",
      "1/6",
      "1/3",
      "1/2",
      "2/3",
      3
    ],
    [
      "cur_14",
      "[과학] 지구 대기권을 이루는 기체 중 부피 기준으로 가장 많은 비율(약 78%)을 차지하는 기체는?",
      "산소",
      "질소",
      "이산화 탄소",
      "아르곤",
      2
    ],
    [
      "cur_15",
      "[도덕/사회] 국가의 권력을 입법부(국회), 사법부(법원), 행정부(정부)로 나누어 서로 견제와 균형을 이루게 하는 원리는?",
      "삼권 분립",
      "지방 자치",
      "직접 민주제",
      "입헌 군주제",
      1
    ],
    [
      "cur_16",
      "[역사] 1919년 3·1 운동을 계기로 중국 상하이에 수립된 우리나라 최초의 민주 공화제 정부는?",
      "대한제국",
      "대한민국 임시 정부",
      "신민회",
      "독립협회",
      2
    ],
    [
      "cur_17",
      "[국어] \"겉으로는 비슷해 보이나 실제로는 완전히 다름\"을 이르는 한자성어로, 가짜가 진짜처럼 행세할 때 쓰는 말은?",
      "사이비(似而非)",
      "금상첨화(錦上添花)",
      "설상가상(雪上加霜)",
      "역지사지(易地思之)",
      1
    ],
    [
      "cur_18",
      "[과학] 물체에 작용하는 알짜힘이 0일 때, 정지해 있는 물체는 계속 정지해 있고 운동하는 물체는 등속 직선 운동을 계속하려는 성질은?",
      "마찰력",
      "관성",
      "탄성력",
      "부력",
      2
    ]
  ],
  "economy": [
    [
      "eco_01",
      "물가가 지속적으로 오르고 화폐(돈)의 가치가 떨어지는 경제 현상을 무엇이라고 할까요?",
      "디플레이션",
      "인플레이션",
      "리세션",
      "모라토리엄",
      2
    ],
    [
      "eco_02",
      "여러 가지 선택지 중에서 하나를 선택했을 때, 포기해야 하는 다른 선택지들 중 가장 가치가 큰 것의 가치를 뜻하는 경제 용어는?",
      "매몰 비용",
      "기회비용",
      "고정 비용",
      "수수료",
      2
    ],
    [
      "eco_03",
      "우리나라의 화폐를 발행하고 기준금리를 결정하여 물가 안정을 꾀하는 대한민국의 중앙은행은?",
      "국민은행",
      "한국은행",
      "기획재정부",
      "금융감독원",
      2
    ],
    [
      "eco_04",
      "원금에 대해서만 이자를 계산하는 단리와 달리, \"원금에 이자를 더한 금액\"을 새로운 원금으로 삼아 이자에 이자가 붙는 방식은?",
      "복리(Compound Interest)",
      "할부",
      "배당",
      "공제",
      1
    ],
    [
      "eco_05",
      "통장에 들어있는 잔액 범위 안에서만 결제할 수 있어 중학생도 발급받아 계획적인 소비를 할 수 있는 카드는?",
      "신용카드",
      "체크카드",
      "마이너스카드",
      "기프트론",
      2
    ],
    [
      "eco_06",
      "기업이 지속 가능한 성장을 위해 신경 써야 할 3대 핵심 요소인 \"환경(Environment)·사회(Social)·지배구조(Governance)\"의 머리글자를 딴 용어는?",
      "GDP",
      "ESG",
      "FTA",
      "IMF",
      2
    ],
    [
      "eco_07",
      "수요와 공급의 법칙에서, 다른 조건이 같을 때 어떤 상품의 가격이 오르면 그 상품을 사려는 양(수요량)은 어떻게 변할까요?",
      "증가한다",
      "감소한다",
      "변하지 않는다",
      "무조건 0이 된다",
      2
    ],
    [
      "eco_08",
      "한 나라의 영토 안에서 일정 기간(보통 1년) 동안 새롭게 생산된 모든 최종 재화와 서비스의 시장 가치를 합한 경제 지표는?",
      "국내총생산(GDP)",
      "소비자물가지수(CPI)",
      "실업률",
      "환율",
      1
    ],
    [
      "eco_09",
      "원/달러 환율이 \"1달러 = 1,200원\"에서 \"1달러 = 1,400원\"으로 올랐을 때(환율 상승), 나타나는 현상으로 옳은 것은?",
      "미국 여행 경비 부담이 줄어든다",
      "미국 직구(수입) 상품의 원화 가격이 비싸진다",
      "원화의 가치가 달러보다 높아졌다",
      "한국 제품의 미국 수출 가격이 달러 기준으로 비싸진다",
      2
    ],
    [
      "eco_10",
      "가로등, 국방, 치안, 공원처럼 대가를 지불하지 않은 사람도 함께 이용할 수 있어 국가나 지방자치단체가 주로 공급하는 재화는?",
      "사적재",
      "공공재",
      "사치재",
      "대체재",
      2
    ],
    [
      "eco_11",
      "금융(Finance)과 기술(Technology)의 합성어로, 모바일 간편결제·송금 앱처럼 IT 기술을 결합한 새로운 금융 서비스를 뜻하는 말은?",
      "핀테크(FinTech)",
      "바이오테크",
      "그린테크",
      "나노테크",
      1
    ],
    [
      "eco_12",
      "이미 지출해서 어떤 선택을 하더라도 다시 되돌릴 수 없는 비용(예: 환불 불가능한 영화표를 산 뒤 영화가 재미없을 때 티켓값)을 무엇이라 할까요?",
      "매몰 비용(Sunk Cost)",
      "기회비용",
      "부가가치세",
      "배당금",
      1
    ],
    [
      "eco_13",
      "소고기 가격이 너무 오르자 대신 돼지고기나 닭고기를 찾는 사람들이 늘어났습니다. 이처럼 비슷한 만족을 주어 서로 대신할 수 있는 재화를 무엇이라 할까요?",
      "보완재",
      "대체재",
      "공공재",
      "독점재",
      2
    ],
    [
      "eco_14",
      "인간이 배출하는 온실가스(이산화 탄소 등)의 양과 흡수·제거하는 양을 같게 만들어 실질적인 배출량을 \"0(Zero)\"으로 만든다는 기후위기 대응 개념은?",
      "탄소 중립(Net Zero)",
      "오존층 파괴",
      "열섬 현상",
      "엘니뇨",
      1
    ],
    [
      "eco_15",
      "생산자와 소비자가 공정한 가격으로 거래하여 개발도상국 노동자와 생산자의 경제적 자립을 돕는 윤리적 무역 형태는?",
      "보호 무역",
      "공정 무역(Fair Trade)",
      "밀무역",
      "덤핑 무역",
      2
    ],
    [
      "eco_16",
      "국가가 국민에게서 거두어들인 세금 중, 물건을 살 때 상품 가격에(보통 10%) 포함되어 우리가 간접적으로 내는 세금은?",
      "소득세",
      "부가가치세(VAT)",
      "재산세",
      "상속세",
      2
    ],
    [
      "eco_17",
      "\"달걀을 한 바구니에 담지 마라\"라는 경제 격언이 강조하는 바람직한 자산 관리 원칙은?",
      "충동구매",
      "분산 투자(위험 분산)",
      "전액 대출",
      "단기 투기",
      2
    ],
    [
      "eco_18",
      "버려지는 제품을 단순히 재활용하는 차원을 넘어, 디자인과 아이디어를 더해 완전히 새로운 가치를 지닌 제품으로 재탄생시키는 것은?",
      "업사이클링(Upcycling)",
      "다운사이클링",
      "패스트패션",
      "일회용 소비",
      1
    ]
  ],
  "world": [
    [
      "wld_01",
      "오스트레일리아(호주)의 수도는 어디일까요? (시드니나 멜버른이 아닙니다!)",
      "캔버라",
      "웰링턴",
      "오클랜드",
      "브리즈번",
      1
    ],
    [
      "wld_02",
      "세계에서 면적이 가장 넓은 나라와 가장 작은 나라(도시국가)를 바르게 짝지은 것은?",
      "러시아 - 바티칸 시국",
      "중국 - 모나코",
      "캐나다 - 싱가포르",
      "미국 - 몰타",
      1
    ],
    [
      "wld_03",
      "남아메리카 안데스산맥 고산지대에 위치하며, 잉카 제국의 신비로운 공중 도시 유적으로 유명한 페루의 세계유산은?",
      "앙코르와트",
      "마추픽추",
      "피라미드",
      "타지마할",
      2
    ],
    [
      "wld_04",
      "지구의 위도 0° 선으로, 지구를 북반구와 남반구로 나누는 기준선의 이름은?",
      "본초 자오선",
      "적도(Equator)",
      "북회귀선",
      "날짜 변경선",
      2
    ],
    [
      "wld_05",
      "유럽과 아시아 두 대륙에 걸쳐 있는 나라로, 최대 도시는 이스탄불이고 수도는 \"앙카라\"인 나라는?",
      "그리스",
      "튀르키예(터키)",
      "이집트",
      "스페인",
      2
    ],
    [
      "wld_06",
      "인도의 무굴 제국 황제 샤자한이 세상을 떠난 왕비 뭄타즈 마할을 추모하기 위해 아그라에 세운 순백의 대리석 건축물은?",
      "타지마할",
      "소피아 대성당",
      "알람브라 궁전",
      "파르테논 신전",
      1
    ],
    [
      "wld_07",
      "캐나다의 수도로 올바른 도시는 어디일까요?",
      "토론토",
      "밴쿠버",
      "오타와",
      "몬트리올",
      3
    ],
    [
      "wld_08",
      "동해의 우리 땅 \"독도\"는 행정구역상 어느 도(道)와 군(郡)에 속해 있을까요?",
      "강원특별자치도 강릉시",
      "경상북도 울릉군",
      "제주특별자치도 서귀포시",
      "경상남도 통영시",
      2
    ],
    [
      "wld_09",
      "지중해성 기후 지역(그리스 산토리니 등)에서 뜨거운 여름 햇빛을 반사하기 위해 집의 외벽을 주로 어떤 색으로 칠할까요?",
      "검은색",
      "하얀색",
      "진한 갈색",
      "보라색",
      2
    ],
    [
      "wld_10",
      "세계에서 가장 높은 산인 에베레스트산(해발 약 8,848m)이 속해 있는 산맥은?",
      "알프스산맥",
      "안데스산맥",
      "히말라야산맥",
      "로키산맥",
      3
    ],
    [
      "wld_11",
      "지구의 자전 때문에 경도 15°마다 1시간의 시차가 발생합니다. 우리나라(동경 135° 기준)는 영국 런던(본초 자오선, 경도 0°)보다 몇 시간 빠를까요?",
      "5시간",
      "7시간",
      "9시간",
      "12시간",
      3
    ],
    [
      "wld_12",
      "베트남의 전통 음식으로, 쌀국수(퍼)와 함께 얇은 라이스페이퍼에 채소와 고기, 해산물을 싸서 먹는 요리는?",
      "타코",
      "월남쌈",
      "팟타이",
      "케밥",
      2
    ],
    [
      "wld_13",
      "유네스코 세계유산으로 등재된 우리나라의 문화유산이 아닌 것은?",
      "수원 화성",
      "불국사와 석굴암",
      "종묘와 창덕궁",
      "남산서울타워",
      4
    ],
    [
      "wld_14",
      "남아메리카 대륙을 흐르며 유역 면적과 유량이 세계 최대이고, 열대 우림을 이루어 \"지구의 허파\"라 불리는 강은?",
      "아마존강",
      "나일강",
      "미시시피강",
      "다뉴브강",
      1
    ],
    [
      "wld_15",
      "뉴질랜드의 원주민인 \"마오리족\"이 손님을 환영할 때 코와 이마를 서로 맞대고 숨결을 나누는 전통 인사법은?",
      "홍이(Hongi)",
      "나마스테",
      "와이",
      "알로하",
      1
    ],
    [
      "wld_16",
      "빙하가 깎아 만든 U자형 골짜기에 바닷물이 들어와 형성된 지형으로, 노르웨이 해안에서 볼 수 있는 절경은?",
      "피오르(피오르드)",
      "리아스식 해안",
      "삼각주",
      "산호초",
      1
    ],
    [
      "wld_17",
      "미국 뉴욕 항구에 서 있는 \"자유의 여신상\"은 미국의 독립 100주년을 기념하여 어느 나라가 선물한 것일까요?",
      "영국",
      "프랑스",
      "독일",
      "이탈리아",
      2
    ],
    [
      "wld_18",
      "우리나라 지형 특징으로, 겨울철 눈이 많이 내리는 울릉도에서 눈이 집 안으로 들어오는 것을 막기 위해 지붕 처마 끝에 둘러친 전통 벽 구조물은?",
      "우데기",
      "정낭",
      "온돌",
      "다락",
      1
    ]
  ],
  "science": [
    [
      "sci_01",
      "텍스트, 이미지, 오디오 등을 단순히 분류하는 것을 넘어 사용자의 질문(프롬프트)에 맞춰 새로운 글이나 그림, 코드를 만들어내는 인공지능 기술은?",
      "생성형 AI(Generative AI)",
      "증기 기관",
      "아날로그 라디오",
      "바코드 스캐너",
      1
    ],
    [
      "sci_02",
      "태양계 행성 중 크기가 가장 크며, 표면에 거대한 소용돌이인 \"대적점(큰 붉은 점)\"이 있는 기체 행성은?",
      "화성",
      "목성",
      "토성",
      "금성",
      2
    ],
    [
      "sci_03",
      "순수한 독자 기술로 개발되어 실용위성을 우주 궤도에 성공적으로 안착시킨 대한민국의 한국형 발사체 이름은?",
      "누리호",
      "아리랑호",
      "무궁화호",
      "천리안호",
      1
    ],
    [
      "sci_04",
      "생물체의 유전 정보를 담고 있는 물질인 \"DNA\"의 입체 구조는 어떤 모양일까요?",
      "단일 직선 구조",
      "이중 나선 구조",
      "정육면체 구조",
      "피라미드 구조",
      2
    ],
    [
      "sci_05",
      "구급차가 다가올 때는 사이렌 소리가 높게 들리고, 멀어질 때는 낮게 들리는 것처럼 파원의 이동에 따라 진동수가 변해 보이는 현상은?",
      "도플러 효과",
      "신기루 현상",
      "무지개 분산",
      "자유 낙하",
      1
    ],
    [
      "sci_06",
      "인공지능이 사실이 아닌 정보를 마치 진짜 사실인 것처럼 그럴듯하게 지어내어 대답하는 현상을 무엇이라고 부를까요?",
      "할루시네이션(환각 현상)",
      "오버클럭",
      "버퍼링",
      "다운로드",
      1
    ],
    [
      "sci_07",
      "우리 몸의 세포 호흡을 통해 에너지를 생산하는 세포 소기관으로, \"세포의 발전소\"라고도 불리는 것은?",
      "미토콘드리아",
      "세포벽",
      "액포",
      "중심체",
      1
    ],
    [
      "sci_08",
      "0과 1의 비트(Bit)만 사용하는 일반 컴퓨터와 달리, 0과 1이 동시에 존재하는 \"중첩(큐비트)\" 현상을 이용해 초고속 연산을 수행하는 미래 컴퓨터는?",
      "양자 컴퓨터(Quantum Computer)",
      "주판",
      "타자기",
      "트랜지스터 라디오",
      1
    ],
    [
      "sci_09",
      "과자 봉지를 들고 높은 산에 올라가면 봉지가 빵빵하게 부풀어 오릅니다. 그 이유로 가장 알맞은 것은?",
      "높이 올라갈수록 외부 기압이 낮아지기 때문",
      "산 위의 온도가 100도 이상이기 때문",
      "산 위에는 중력이 전혀 없기 때문",
      "과자가 스스로 발효되기 때문",
      1
    ],
    [
      "sci_10",
      "가전제품, 자동차, 웨어러블 기기 등 일상 속 사물들이 인터넷에 연결되어 서로 데이터를 주고받으며 작동하는 기술은?",
      "사물인터넷(IoT)",
      "만유인력",
      "판구조론",
      "멘델의 유전법칙",
      1
    ],
    [
      "sci_11",
      "빛의 삼원색(R·G·B)을 모두 합치면 어떤 색의 빛이 될까요?",
      "검은색",
      "백색(하얀색)",
      "갈색",
      "회색",
      2
    ],
    [
      "sci_12",
      "현실의 모습 위에 가상의 이미지나 정보를 겹쳐서 보여주는 기술(예: 스마트폰 카메라로 길 안내 화살표나 포켓몬을 띄우는 기술)은?",
      "증강현실(AR)",
      "축음기",
      "모스 부호",
      "진공관",
      1
    ],
    [
      "sci_13",
      "특정 온도 이하에서 전기 저항이 완전히 \"0\"이 되어 전력 손실 없이 전류를 흘려보내고 자기부상열차 등에 활용되는 물질은?",
      "초전도체(Superconductor)",
      "부도체",
      "고무줄",
      "플라스틱",
      1
    ],
    [
      "sci_14",
      "여름철 더운 날 땀을 흘린 뒤 바람이 불면 시원함을 느끼는 이유는 물이 증발하면서 주변의 열을 어떻게 하기 때문일까요?",
      "기화열을 흡수하기(빼앗기) 때문",
      "열을 새로 만들어내기 때문",
      "피부를 얼리기 때문",
      "산소를 없애기 때문",
      1
    ],
    [
      "sci_15",
      "유전자(DNA)의 특정 부위를 정교하게 잘라내고 교정하여 유전 질환 치료나 품종 개량에 쓰이는 생명공학 기술의 별칭은?",
      "유전자 가위(CRISPR-Cas9)",
      "유전자 풀",
      "세포 현미경",
      "원심분리기",
      1
    ],
    [
      "sci_16",
      "태양에서 출발한 빛이 지구까지 도달하는 데 걸리는 시간은 약 얼마일까요? (빛의 속도는 초속 약 30만 km)",
      "약 1초",
      "약 8분 20초",
      "약 24시간",
      "약 1년",
      2
    ],
    [
      "sci_17",
      "바다나 강, 토양 등에 버려진 플라스틱이 쪼개져 크기가 5mm 미만으로 작아진 조각으로, 해양 생태계를 위협하는 오염 물질은?",
      "미세 플라스틱",
      "천연 미네랄",
      "피톤치드",
      "플랑크톤",
      1
    ],
    [
      "sci_18",
      "웹 브라우저 주소창의 \"HTTPS\"에서 마지막 알파벳 \"S\"가 의미하는 보안 관련 단어는?",
      "Speed(속도)",
      "Secure(보안/안전한)",
      "Simple(단순한)",
      "Super(초강력)",
      2
    ]
  ],
  "culture": [
    [
      "cul_01",
      "한국인 최초이자 아시아 여성 최초로 2024년 노벨 문학상을 수상한 대한민국의 소설가는?",
      "한강",
      "박경리",
      "신경숙",
      "김초엽",
      1
    ],
    [
      "cul_02",
      "프랑스 파리 루브르 박물관에 소장되어 있으며, 신비로운 미소와 눈썹이 없는 얼굴로 유명한 레오나르도 다빈치의 명화는?",
      "진주 귀걸이를 한 소녀",
      "모나리자",
      "별이 빛나는 밤",
      "절규",
      2
    ],
    [
      "cul_03",
      "악보에서 음을 점점 세게 연주하라는 뜻의 음악 용어(기호 <)는 무엇일까요?",
      "크레셴도(crescendo)",
      "데크레셴도(decrescendo)",
      "스타카토(staccato)",
      "피아니시모(pianissimo)",
      1
    ],
    [
      "cul_04",
      "소용돌이치는 밤하늘의 별빛과 사이프러스 나무를 강렬한 붓터치로 그린 『별이 빛나는 밤』, 『해바라기』의 화가는?",
      "파블로 피카소",
      "빈센트 반 고흐",
      "클로드 모네",
      "앙리 마티스",
      2
    ],
    [
      "cul_05",
      "우리나라 고유의 전통 성악곡으로, 소리꾼이 고수(북 치는 사람)의 장단에 맞추어 노래(창)와 말(아니리), 몸짓(발림)으로 이야기를 펼치는 예술은?",
      "판소리",
      "사물놀이",
      "가곡",
      "오페라",
      1
    ],
    [
      "cul_06",
      "사물놀이에 사용되는 네 가지 전통 타악기(꽹과리, 징, 장구, 북) 중, 가장 높은 소리를 내며 전체 가락을 이끄는 작은 놋쇠 악기는?",
      "꽹과리",
      "징",
      "장구",
      "소고",
      1
    ],
    [
      "cul_07",
      "생텍쥐페리의 소설 『어린 왕자』에서, 어린 왕자가 지구에 와서 길들이게 되며 \"가장 중요한 것은 눈에 보이지 않아\"라는 비밀을 알려주는 동물은?",
      "사막여우",
      "보아뱀",
      "하얀 토끼",
      "부엉이",
      1
    ],
    [
      "cul_08",
      "청력을 잃는 시련 속에서도 교향곡 제5번 『운명』과 제9번 『합창』 등 불멸의 명곡을 남긴 독일의 작곡가는?",
      "루트비히 판 베토벤",
      "볼프강 아마데우스 모차르트",
      "요한 세바스티안 바흐",
      "프레데리크 쇼팽",
      1
    ],
    [
      "cul_09",
      "배구 경기나 피구, 농구 등에서 심판의 판정에 항의하지 않고 규칙을 준수하며 상대방을 존중하는 태도를 일컫는 말은?",
      "스포츠맨십(페어플레이)",
      "오프사이드",
      "트래블링",
      "더블드리블",
      1
    ],
    [
      "cul_10",
      "조선 후기 화가 신윤복의 풍속화로, 단오날 창포물에 머리를 감는 여인들과 그네를 타는 모습을 생생하게 그린 작품은?",
      "단오풍정",
      "씨름",
      "서당",
      "인왕제색도",
      1
    ],
    [
      "cul_11",
      "4년마다 열리는 하계·동계 올림픽의 오륜기(5개의 고리)가 상징하는 의미로 가장 알맞은 것은?",
      "세계 5대륙의 화합과 단결",
      "올림픽 5대 인기 종목",
      "5일간의 축제 기간",
      "5명의 창립자",
      1
    ],
    [
      "cul_12",
      "봉준호 감독의 영화로, 한국 영화 최초로 칸 영화제 황금종려상과 미국 아카데미 시상식 작품상 등 4관왕을 차지한 작품은?",
      "기생충",
      "설국열차",
      "괴물",
      "미나리",
      1
    ],
    [
      "cul_13",
      "고려 시대에 발달한 독창적인 도자기 예술로, 은은한 비취색 유약과 표면을 파내어 흰 흙·붉은 흙을 메워 무늬를 넣는 \"상감 기법\"으로 유명한 것은?",
      "고려청자",
      "조선백자",
      "빗살무늬 토기",
      "신라 토우",
      1
    ],
    [
      "cul_14",
      "우리 학교 체력검사(PAPS) 종목 중, 신호음에 맞춰 20m 거리를 왕복하여 달리며 \"심폐지구력\"을 측정하는 종목의 이름은?",
      "셔틀런(왕복 오래달리기)",
      "제자리멀리뛰기",
      "앉아 윗몸 앞으로 굽히기",
      "악력 검사",
      1
    ],
    [
      "cul_15",
      "대상을 한 시점에서만 보지 않고 앞모습과 옆모습 등 여러 각도에서 본 모습을 한 화면에 재구성하여 그린 피카소의 미술 사조는?",
      "입체파(큐비즘)",
      "인상파",
      "점묘파",
      "극사실주의",
      1
    ],
    [
      "cul_16",
      "뮤지컬 『오페라의 유령』, 『캣츠(Cats)』, 『레미제라블』, 『미스 사이공』을 묶어 흔히 무엇이라고 부를까요?",
      "세계 4대 뮤지컬",
      "세계 4대 교향곡",
      "셰익스피어 4대 비극",
      "세계 4대 영화제",
      1
    ],
    [
      "cul_17",
      "서양 현악기 중 바이올린보다 크기가 조금 더 크고 중후한 중음역을 담당하는 악기는? (바이올린 - ____ - 첼로 - 콘트라베이스)",
      "비올라",
      "플루트",
      "클라리넷",
      "하프",
      1
    ],
    [
      "cul_18",
      "다른 사람이 창작한 글, 음악, 그림, 사진, 영상 등의 저작물을 이용할 때 원작자의 권리를 보호하기 위해 지켜야 하는 권리는?",
      "저작권(Copyright)",
      "초상권",
      "투표권",
      "청구권",
      1
    ]
  ],
  "english": [
    [
      "eng_01",
      "'Break a leg!'라는 영어 관용 표현이 공연이나 시험 전에 건네는 말일 때 알맞은 뜻은?",
      "행운을 빌어",
      "조심해서 걸어",
      "다리를 쉬게 해",
      "끝까지 포기 마",
      1
    ],
    [
      "eng_02",
      "'Once in a blue moon'이라는 표현이 뜻하는 빈도로 가장 알맞은 것은?",
      "매달 규칙적으로",
      "아주 드물게 일어나는",
      "달빛이 유난히 밝은",
      "밤늦게까지 지속되는",
      2
    ],
    [
      "eng_03",
      "식당에서 식사를 마친 후 'Can I have the check, please?'라고 요청할 때 'check'의 의미는?",
      "주문 메뉴 재확인",
      "빈자리 추가 예약",
      "계산서",
      "남은 음식 포장",
      3
    ],
    [
      "eng_04",
      "영미권 표현 'Piece of cake'과 가장 유사한 우리말 속담이나 관용구는?",
      "백지장도 맞들면 낫다",
      "시작이 반이다",
      "티끌 모아 태산",
      "누워서 떡 먹기",
      4
    ],
    [
      "eng_05",
      "지구 환경 보호를 위한 대표적인 3R 실천 운동에 포함되지 않는 단어는?",
      "Remove",
      "Reduce",
      "Reuse",
      "Recycle",
      1
    ],
    [
      "eng_06",
      "'I am feeling under the weather today.'라고 말했을 때 화자의 상태는?",
      "날씨가 좋아 상쾌함",
      "몸이 찌뿌둥하고 아픔",
      "비를 맞아 옷이 젖음",
      "바람 때문에 긴장됨",
      2
    ],
    [
      "eng_07",
      "책이나 영화의 줄거리나 핵심 결말을 미리 누설하여 감상의 재미를 떨어뜨리는 행위는?",
      "Trailer",
      "Sequel",
      "Spoiler",
      "Prequel",
      3
    ],
    [
      "eng_08",
      "상대방의 의견에 대해 '동의하지 않는다'는 의사를 공손하게 밝히는 표현은?",
      "I am not ready",
      "You got me wrong",
      "It doesn't matter",
      "I don't think so",
      4
    ],
    [
      "eng_09",
      "공항 탑승 수속 중 허용된 수하물 무게를 초과했을 때 부과되는 요금 명칭은?",
      "Excess baggage",
      "Fast luggage",
      "Heavy carton",
      "Secret parcel",
      1
    ],
    [
      "eng_10",
      "'We need to catch up with the latest trends.'에서 'catch up with'의 올바른 뜻은?",
      "멀리 도망치다",
      "따라잡다",
      "손을 맞잡다",
      "친구에게 소개하다",
      2
    ],
    [
      "eng_11",
      "'Every cloud has a silver lining'이라는 속담이 전하는 긍정적인 메시지는?",
      "먹구름 뒤엔 비가 온다",
      "은색 장식은 변하지 않는다",
      "어려움 속에도 희망이 있다",
      "일기예보를 미리 확인해야 한다",
      3
    ],
    [
      "eng_12",
      "스마트폰이나 프로그램의 오류를 고치고 최신 상태로 갱신하는 작업을 뜻하는 단어는?",
      "Download",
      "Restart",
      "Backup",
      "Update",
      4
    ],
    [
      "eng_13",
      "'I am looking forward to seeing you.' 문장에서 'look forward to'의 정확한 뜻은?",
      "간절히 고대하다",
      "뒤를 돌아보다",
      "앞으로 걸어가다",
      "앞장서서 이끌다",
      1
    ],
    [
      "eng_14",
      "강연회나 공식 인터뷰가 끝난 뒤 이어지는 'Q&A' 세션의 올바른 영문 풀이는?",
      "Quality and Access",
      "Question and Answer",
      "Quick and Accurate",
      "Quiet and Active",
      2
    ],
    [
      "eng_15",
      "'Better late than never'라는 격언이 강조하는 행동 양식으로 알맞은 것은?",
      "부지런해야 성공한다",
      "속도보다 방향이 중요하다",
      "늦더라도 하는 것이 낫다",
      "약속 시간을 철저히 지키자",
      3
    ],
    [
      "eng_16",
      "도움을 받은 상대방이 'Thank you so much!'라고 감사할 때 건네는 친절한 답변은?",
      "Never remind me",
      "It is your problem",
      "You must pay back",
      "My pleasure",
      4
    ]
  ],
  "literature": [
    [
      "lit_01",
      "김소월의 시 「진달래꽃」에서 이별의 슬픔을 겉으로 드러내지 않고 삭이는 우리 민족의 전통적 정서는?",
      "한(恨)",
      "풍자",
      "분노",
      "체념",
      1
    ],
    [
      "lit_02",
      "황순원의 단편 소설 「소나기」에서 갑작스러운 소나기를 피해 소년과 소녀가 함께 머물렀던 공간은?",
      "낡은 물레방앗간",
      "수수밭 원두막",
      "깊은 산속 동굴",
      "마을 어귀 당산나무",
      2
    ],
    [
      "lit_03",
      "이효석의 단편 소설 「메밀꽃 필 무렵」에서 허 생원과 동이가 달빛 아래 걸어가던 주 무대 장터는?",
      "강원도 횡성장",
      "강원도 정선장",
      "강원도 봉평장",
      "강원도 춘천장",
      3
    ],
    [
      "lit_04",
      "윤동주 시인의 대표작 「서시」에서 '하늘을 우러러 한 점 부끄럼이 없기를' 바라는 마음을 비유한 섬세한 자연물은?",
      "밤하늘의 별",
      "차오르는 달",
      "불어오는 바람",
      "일렁이는 잎새",
      4
    ],
    [
      "lit_05",
      "생텍쥐페리의 소설 「어린 왕자」에서 사막 여우가 어린 왕자에게 알려 준 관계 맺기의 소중한 비밀은?",
      "서로를 길들이는 것",
      "기다림 없이 떠나는 것",
      "비밀을 마음속에 묻는 것",
      "장미를 통제하는 것",
      1
    ],
    [
      "lit_06",
      "현진건의 단편 소설 「운수 좋은 날」의 비극적 결말을 극대화하기 위해 제목과 상황에 쓰인 문학적 표현 기법은?",
      "과장법",
      "반어법",
      "의인법",
      "도치법",
      2
    ],
    [
      "lit_07",
      "셰익스피어의 4대 비극(햄릿, 오셀로, 리어 왕, 맥베스)에 포함되지 않는 작품은?",
      "햄릿",
      "오셀로",
      "로미오와 줄리엣",
      "리어 왕",
      3
    ],
    [
      "lit_08",
      "주요섭의 단편 소설 「사랑손님과 어머니」에서 여섯 살 '옥희'의 순수한 시선으로 이야기를 전달하는 서술 시점은?",
      "1인칭 주인공 시점",
      "3인칭 전지적 작가 시점",
      "3인칭 관찰자 시점",
      "1인칭 관찰자 시점",
      4
    ],
    [
      "lit_09",
      "허균이 지은 우리나라 최초의 한글 소설로, 적서 차별 철폐와 탐관오리 응징을 다룬 고전 문학 작품은?",
      "홍길동전",
      "구운몽",
      "춘향전",
      "심청전",
      1
    ],
    [
      "lit_10",
      "헤르만 헤세의 소설 「데미안」에서 주인공 싱클레어가 알을 깨고 나와 날아가는 신화적 신의 이름은?",
      "프로메테우스",
      "아브락사스",
      "디오니소스",
      "오디세우스",
      2
    ],
    [
      "lit_11",
      "조지 오웰의 풍자 소설 「동물농장」에서 동물들의 혁명 이상을 변질시키고 독재자로 군림하는 동물은?",
      "충직한 말 복서",
      "늙은 당나귀 벤저민",
      "지배층이 된 돼지 나폴레옹",
      "경비견 무리",
      3
    ],
    [
      "lit_12",
      "이상화 시인의 저항시 「빼앗긴 들에도 봄은 오는가」에서 '빼앗긴 들'이 비유하고 있는 역사적 현실은?",
      "병자호란의 참상",
      "갑오개혁의 혼란",
      "한국 전쟁의 비극",
      "일제 강점기 국권 피탈",
      4
    ],
    [
      "lit_13",
      "소설의 3요소(주제, 구성, 문체)와 구별되는 소설 '구성의 3요소'에 해당하는 것은?",
      "인물, 사건, 배경",
      "운율, 심상, 어조",
      "기승전결, 갈등, 복선",
      "서론, 본론, 결론",
      1
    ],
    [
      "lit_14",
      "어니스트 헤밍웨이의 소설 「노인과 바다」에서 노인 산티아고가 84일간의 침묵 끝에 먼바다에서 낚아 올린 거대한 물고기는?",
      "백상아리",
      "청새치",
      "대왕고래",
      "참다랑어",
      2
    ],
    [
      "lit_15",
      "박완서의 소설 「자전거 도둑」에서 주인공 수남이가 도덕적 부끄러움을 느끼고 고향으로 돌아가게 만든 상징물은?",
      "잃어버린 시계",
      "낡은 가죽 지갑",
      "신사의 자전거",
      "가게의 금고",
      3
    ],
    [
      "lit_16",
      "찰스 디킨스의 소설 「크리스마스 캐럴」에서 구두쇠 스크루지가 과거·현재·미래의 유령을 만난 뒤 깨달은 삶의 진정한 가치는?",
      "치밀한 자산 관리",
      "명예로운 신분 상승",
      "규칙적인 절약 습관",
      "이웃에 대한 나눔과 사랑",
      4
    ]
  ]
};


/**
 * 스프레드시트 열릴 때 상단 커스텀 메뉴 자동 생성
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('👑 퀴즈 퀸즈')
    .addItem('🔄 영역별 탭 내용 ➡️ [문제은행] 탭으로 자동 통합', 'syncCategoryTabsToQuestionBank')
    .addItem('✨ 비어있는 탭에 샘플 문제 자동 채우기 (영어/문학 포함)', 'populateSampleQuestions')
    .addSeparator()
    .addItem('⚙️ 전체 시트 탭 초기 설정 (최초 1회)', 'setupSheets')
    .addToUi();
}

/**
 * 최초 1회 실행하여 필요한 시트 탭과 헤더를 자동으로 생성하고 샘플 문제를 채웁니다.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 학생통계 시트
  let stuSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!stuSheet) {
    stuSheet = ss.insertSheet(SHEET_NAMES.STUDENTS);
    stuSheet.appendRow([
      '이메일', '닉네임(공개)', '실명(교사용)', '학급(1-1~3-4)', '출석번호',
      '레벨', '경험치(XP)', '연속도전일수', '최고연속도전일',
      '총푼문제', '총정답수', '정확도(%)', '최고콤보',
      '수집마스코트JSON', '발급인증서JSON', '분야별통계JSON', '최근업데이트'
    ]);
    stuSheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#EDE9FE');
    stuSheet.getRange('D:D').setNumberFormat('@');
  }

  // 2. 최종 취합 [문제은행] 탭
  let masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(SHEET_NAMES.MASTER_QUESTIONS);
    masterSheet.appendRow([
      '문항ID', '분야', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)',
      '출제자', '좋아요(👍)', '나빠요(👎)', '상태(정상/보류)'
    ]);
    masterSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#FEF3C7');
  }

  // 3. 학생 출제 검토 탭
  let subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_NAMES.STUDENT_SUBMISSIONS);
    subSheet.appendRow([
      '등록일시', '문항ID', '분야', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호',
      '출제학생(이메일·실명)', '좋아요(👍)', '나빠요(👎)', '상태(정상/보류)'
    ]);
    subSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#FCE7F3');
  }

  // 4. 선생님용 8대 영역별 개별 탭 생성
  CATEGORY_TABS.forEach(cat => {
    let catSheet = ss.getSheetByName(cat.tabName);
    if (!catSheet) {
      catSheet = ss.insertSheet(cat.tabName);
      catSheet.appendRow([
        '문항ID', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)'
      ]);
      catSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E0F2FE');
    }
  });

  // 5. 풀이로그 시트
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
    logSheet.appendRow([
      '일시', '일자(YYYY-MM-DD)', '이메일', '학급', '닉네임', '실명',
      '분야', '문항ID', '정답여부', '현재레벨', '누적XP', '연속도전일수'
    ]);
    logSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#DCFCE7');
  }

  // 6. 인증서발급내역 시트
  let certSheet = ss.getSheetByName(SHEET_NAMES.CERTS);
  if (!certSheet) {
    certSheet = ss.insertSheet(SHEET_NAMES.CERTS);
    certSheet.appendRow([
      '발송일시', '수신이메일', '학급', '닉네임', '실명',
      '달성레벨', '인증서명', '부여칭호', '총푼문제', '정확도(%)'
    ]);
    certSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F3E8FF');
  }

  // 샘플 문제 채우기 & 문제은행 통합
  populateSampleQuestions();
}

/**
 * [핵심 기능] 비어있는 영역별 탭에 기본 샘플 문제를 채워 넣습니다.
 */
function populateSampleQuestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let filledTabs = [];

  CATEGORY_TABS.forEach(cat => {
    let sheet = ss.getSheetByName(cat.tabName);
    if (!sheet) {
      sheet = ss.insertSheet(cat.tabName);
      sheet.appendRow([
        '문항ID', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E0F2FE');
    }

    // 1행(헤더)만 있거나 내용이 없는 경우 샘플 문제 추가
    if (sheet.getLastRow() <= 1) {
      const sampleRows = SAMPLE_QUESTIONS_BY_CAT[cat.catId];
      if (sampleRows && sampleRows.length > 0) {
        sheet.getRange(2, 1, sampleRows.length, 7).setValues(sampleRows);
        filledTabs.push(`${cat.tabName}(${sampleRows.length}문항)`);
      }
    }
  });

  // 채운 뒤 문제은행으로 즉시 통합
  syncCategoryTabsToQuestionBank();

  if (filledTabs.length > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `✅ 샘플 문제 채움 완료: ${filledTabs.join(', ')}`,
      '샘플 문제 추가',
      5
    );
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '이미 모든 탭에 문제 데이터가 있어 기존 내용을 보존했습니다.',
      '알림',
      4
    );
  }
}

/**
 * [핵심 기능] 선생님이 작업하신 8개 개별 탭의 문제들을 [문제은행] 탭으로 자동 통합합니다.
 */
function syncCategoryTabsToQuestionBank() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  if (!masterSheet) {
    setupSheets();
    masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  }

  // 기존 문제은행에서 학생이 출제한 문제나 평가 수치(좋아요/나빠요/상태) 맵 보존
  const existingRows = masterSheet.getDataRange().getValues();
  const metaMap = {};
  for (let i = 1; i < existingRows.length; i++) {
    const r = existingRows[i];
    const qId = String(r[0]);
    if (qId) {
      metaMap[qId] = {
        author: r[8] || '선생님',
        likes: Number(r[9]) || 0,
        dislikes: Number(r[10]) || 0,
        status: r[11] || '정상'
      };
    }
  }

  const allCompiledRows = [];

  // 1) 8개 개별 탭에서 문제 읽어오기
  CATEGORY_TABS.forEach(cat => {
    const sheet = ss.getSheetByName(cat.tabName);
    if (!sheet) return;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const qId = String(row[0] || '').trim();
      const question = String(row[1] || '').trim();
      if (!question) continue;

      const realId = qId || `${cat.catId}_${i}`;
      const meta = metaMap[realId] || { author: '선생님', likes: 0, dislikes: 0, status: '정상' };

      allCompiledRows.push([
        realId,
        cat.catId,
        question,
        String(row[2] || ''),
        String(row[3] || ''),
        String(row[4] || ''),
        String(row[5] || ''),
        Number(row[6]) || 1,
        meta.author,
        meta.likes,
        meta.dislikes,
        meta.status
      ]);
    }
  });

  // 2) 학생 출제 검토 시트에서 '정상' 상태인 승인된 문제도 함께 통합
  const subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
  if (subSheet) {
    const subValues = subSheet.getDataRange().getValues();
    for (let i = 1; i < subValues.length; i++) {
      const row = subValues[i];
      const qId = String(row[1] || '').trim();
      const catId = String(row[2] || 'school').trim();
      const question = String(row[3] || '').trim();
      const status = String(row[12] || '정상').trim();
      if (!question || status === '보류') continue;

      const meta = metaMap[qId] || {
        author: String(row[9] || '학생'),
        likes: Number(row[10]) || 0,
        dislikes: Number(row[11]) || 0,
        status: status
      };

      allCompiledRows.push([
        qId,
        catId,
        question,
        String(row[4] || ''),
        String(row[5] || ''),
        String(row[6] || ''),
        String(row[7] || ''),
        Number(row[8]) || 1,
        meta.author,
        meta.likes,
        meta.dislikes,
        meta.status
      ]);
    }
  }

  // 3) [문제은행] 탭 내용 전면 갱신
  if (masterSheet.getLastRow() > 1) {
    masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 12).clearContent();
  }
  if (allCompiledRows.length > 0) {
    masterSheet.getRange(2, 1, allCompiledRows.length, 12).setValues(allCompiledRows);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✅ 총 ${allCompiledRows.length}개의 문제를 [문제은행] 탭으로 자동 통합했습니다!`,
    '통합 완료',
    5
  );
}

/**
 * GET 요청 처리: 학생 통계 목록 및 통합된 [문제은행] 반환 (초고속 단일 조회)
 */
function doGet(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 학생 통계 조회
  const stuSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const stuValues = stuSheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < stuValues.length; i++) {
    const r = stuValues[i];
    if (!r[0]) continue;
    users.push({
      email: String(r[0]),
      nickname: String(r[1] || r[2]),
      name: String(r[2] || r[1]),
      classId: String(r[3] || ''),
      studentNo: r[4] ? Number(r[4]) : null,
      level: Number(r[5]) || 1,
      xp: Number(r[6]) || 0,
      streak: Number(r[7]) || 1,
      maxStreak: Number(r[8]) || 1,
      totalAnswered: Number(r[9]) || 0,
      correctCount: Number(r[10]) || 0,
      accuracy: Number(r[11]) || 0,
      maxCombo: Number(r[12]) || 0,
      badges: safeJsonParse(r[13], []),
      certificates: safeJsonParse(r[14], []),
      categoryStats: safeJsonParse(r[15], {}),
      updatedAt: r[16] ? String(r[16]) : ''
    });
  }

  // [문제은행] 통합 탭에서 문제 목록 읽기
  const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  const qValues = masterSheet ? masterSheet.getDataRange().getValues() : [];
  const questions = [];
  for (let i = 1; i < qValues.length; i++) {
    const r = qValues[i];
    const qId = String(r[0] || '').trim();
    const cat = String(r[1] || '').trim();
    const questionText = String(r[2] || '').trim();
    const status = String(r[11] || '정상').trim();

    // 보류 상태인 문제는 출제 제외
    if (!questionText || status === '보류') continue;

    questions.push({
      id: qId,
      category: cat,
      question: questionText,
      options: [String(r[3] || ''), String(r[4] || ''), String(r[5] || ''), String(r[6] || '')],
      answer: Number(r[7]) || 1,
      author: String(r[8] || '선생님'),
      likes: Number(r[9]) || 0,
      dislikes: Number(r[10]) || 0,
      status: status
    });
  }

  // 학생 출제 전체 목록 (교사용 검토 목적)
  const subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
  const subValues = subSheet ? subSheet.getDataRange().getValues() : [];
  const submissions = [];
  for (let i = 1; i < subValues.length; i++) {
    const r = subValues[i];
    if (!r[1]) continue;
    submissions.push({
      submittedAt: String(r[0] || ''),
      id: String(r[1]),
      category: String(r[2]),
      question: String(r[3]),
      options: [String(r[4] || ''), String(r[5] || ''), String(r[6] || ''), String(r[7] || '')],
      answer: Number(r[8]) || 1,
      author: String(r[9]),
      likes: Number(r[10]) || 0,
      dislikes: Number(r[11]) || 0,
      status: String(r[12] || '정상')
    });
  }

  const result = {
    success: true,
    users: users,
    questions: questions,
    submissions: submissions,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리: 통계 동기화, 문제 평가(좋아요/나빠요), 학생 출제 등록 등
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) 학생 퀴즈 직접 출제 등록
    if (action === 'submitStudentQuestion') {
      const q = body.question;
      const subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS) || ss.insertSheet(SHEET_NAMES.STUDENT_SUBMISSIONS);
      const newRow = [
        new Date().toISOString(),
        q.id || `stu_${Date.now()}`,
        q.category,
        q.question,
        q.options[0],
        q.options[1],
        q.options[2],
        q.options[3],
        q.answer,
        q.author || '학생',
        0, // likes
        0, // dislikes
        '정상' // status
      ];
      subSheet.appendRow(newRow);

      // 문제은행 탭에도 자동 추가
      const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
      if (masterSheet) {
        masterSheet.appendRow([
          newRow[1], newRow[2], newRow[3],
          newRow[4], newRow[5], newRow[6], newRow[7], newRow[8],
          newRow[9], 0, 0, '정상'
        ]);
      }

      return jsonResponse({ success: true, message: '학생 출제 퀴즈 등록 완료' });
    }

    // 2) 문제 상호 평가 (좋아요 / 나빠요)
    if (action === 'rateQuestion') {
      const qId = String(body.questionId);
      const rating = body.rating; // 'like' or 'dislike'
      const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
      let updated = false;
      let newStatus = '정상';

      if (masterSheet) {
        const rows = masterSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === qId) {
            let likes = Number(rows[i][9]) || 0;
            let dislikes = Number(rows[i][10]) || 0;

            if (rating === 'like') {
              likes += 1;
              masterSheet.getRange(i + 1, 10).setValue(likes);
            } else if (rating === 'dislike') {
              dislikes += 1;
              masterSheet.getRange(i + 1, 11).setValue(dislikes);
              // 나빠요 3회 누적 시 자동 출제 보류
              if (dislikes >= 3) {
                newStatus = '보류';
                masterSheet.getRange(i + 1, 12).setValue('보류');
              }
            }
            updated = true;
            break;
          }
        }
      }

      return jsonResponse({ success: true, updated: updated, status: newStatus });
    }

    // 3) 교사: 학생 출제 문제 상태 변경 (승인/보류)
    if (action === 'updateQuestionStatus') {
      const qId = String(body.questionId);
      const newStatus = body.status; // '정상' or '보류'
      const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
      if (masterSheet) {
        const rows = masterSheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === qId) {
            masterSheet.getRange(i + 1, 12).setValue(newStatus);
            break;
          }
        }
      }
      return jsonResponse({ success: true, status: newStatus });
    }

    // 4) 기존 학생 데이터 동기화
    if (action === 'syncUser' || !action) {
      const userData = body.user || body;
      const stuSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
      if (stuSheet && userData && userData.email) {
        const data = stuSheet.getDataRange().getValues();
        let rowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]).toLowerCase() === String(userData.email).toLowerCase()) {
            rowIndex = i + 1;
            break;
          }
        }

        const rowValues = [
          userData.email,
          userData.nickname || userData.name,
          userData.name || userData.nickname,
          userData.classId || '',
          userData.studentNo || '',
          Number(userData.level) || 1,
          Number(userData.xp) || 0,
          Number(userData.streak) || 1,
          Number(userData.maxStreak) || 1,
          Number(userData.totalAnswered) || 0,
          Number(userData.correctCount) || 0,
          Number(userData.accuracy) || 0,
          Number(userData.maxCombo) || 0,
          JSON.stringify(userData.badges || []),
          JSON.stringify(userData.certificates || []),
          JSON.stringify(userData.categoryStats || {}),
          new Date().toISOString()
        ];

        if (rowIndex > 0) {
          stuSheet.getRange(rowIndex, 1, 1, 17).setValues([rowValues]);
        } else {
          stuSheet.appendRow(rowValues);
        }
      }
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: '알 수 없는 action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function safeJsonParse(val, fallback) {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
