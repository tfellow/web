-- MY Grammar: M1-01-2 "___ the movie good?" 수정 (2026-11-12)
-- 문제: 시간 단서가 없어서 Is(현재)도 맞는 답인데 정답이 Was 하나뿐이었어요.
-- 해결: 과거 시간 단서 "last night"를 넣어 Was만 정답이 되게 합니다.
update public.mg_questions
set prompt      = replace(prompt, 'the movie good?', 'the movie good last night?'),
    explanation = '어젯밤(last night)은 과거이고, 주어 the movie는 단수이므로 과거형 의문문은 Was로 시작합니다.'
where topic_code = 'M1-01-2'
  and prompt like '%the movie good?%'
  and answer = 'Was';

-- 확인
select id, prompt, answer, explanation from public.mg_questions
where topic_code = 'M1-01-2' and prompt like '%the movie good%';
