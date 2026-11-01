// 선생님 캐릭터 (반팔 체크 셔츠). 학생 홈 "선생님 한마디", 단원 테스트 결과 화면에서 사용
import wave from '../assets/teacher/t-wave.webp';
import smile from '../assets/teacher/t-smile.webp';
import happy from '../assets/teacher/t-happy.webp';
import surprise from '../assets/teacher/t-surprise.webp';
import worried from '../assets/teacher/t-worried.webp';
import laugh from '../assets/teacher/t-laugh.webp';

export const TEACHER = { wave, smile, happy, surprise, worried, laugh };
export const teacherImg = (kind = 'smile', cls = '') => `<img class="tchar ${kind === 'wave' ? 'tbust' : 'tface'} ${cls}" src="${TEACHER[kind] || TEACHER.smile}" alt="선생님" draggable="false">`;

// 테스트 점수에 따른 선생님 표정과 한마디
export function teacherReaction(p) {
  if (p === 100) return ['laugh', '만점! 선생님이 정말 감동했어요 👏'];
  if (p >= 80) return ['happy', '아주 잘했어요! 이대로만 하면 돼요.'];
  if (p >= 60) return ['smile', '좋아요! 틀린 단어만 한 번 더 보면 완벽해요.'];
  if (p >= 40) return ['surprise', '어? 조금 헷갈렸나 봐요. 다시 연습해 볼까요?'];
  return ['worried', '괜찮아요, 처음엔 다 어려워요. 같이 다시 해 봐요!'];
}
