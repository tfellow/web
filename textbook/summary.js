const summaryDecks = new WeakMap();
const openSummaryBoxes = new Set();

function summaryDeck(lesson) {
  if (summaryDecks.has(lesson)) return summaryDecks.get(lesson);
  const slides = lesson.summaries.steps.map(step =>
    summarySlide(step.title, step.en, step.ko)
  );
  for (const [field, length, title] of [
    ['hundred', '100', '100단어 요약'],
    ['fifty', '50', '50단어 요약'],
    ['one', '1', '한 문장 요약']
  ]) {
    const text = lesson.summaries[field];
    const words = lesson.summaryWords[length];
    const escapePattern = word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('\\b(?:' + words.map(escapePattern).join('|') + ')\\b', 'gi');
    const used = new Set();
    const marked = text.replace(pattern, match => {
      const key = match.toLowerCase();
      if (used.has(key)) return match;
      used.add(key);
      return '[' + match + ']';
    });
    slides.push(summarySlide(title, marked));
  }
  summaryDecks.set(lesson, slides);
  return slides;
}

function summarySlide(tag, marked, translation = '') {
  // Even positions are prose; odd positions are the target expressions.
  const parts = marked.split(/\[([^\]]+)\]/g);
  return { tag, parts, boxCount: (parts.length - 1) / 2, translation };
}

function summaryContent(slide) {
  const sentence = slide.parts.map((part, position) => {
    if (position % 2 === 0) return E(part);
    const index = (position - 1) / 2;
    const open = openSummaryBoxes.has(index);
    const label = (index + 1) + '번 빈칸' + (open ? ' 정답: ' + part : ' 정답 보기');
    return '<button type="button" class="summary-box" data-box="' + index +
      '" aria-label="' + E(label) + '" aria-disabled="' + open + '">' +
      '<span aria-hidden="true">' + E(part) + '</span></button>';
  }).join('');
  const translation = slide.translation
    ? '<p class="step-translation' + (revealed ? '' : ' reserved-answer') + '">' + E(slide.translation) + '</p>'
    : '';
  return '<p class="summary-passage" lang="en">' + sentence + '</p>' + translation;
}

function openSummaryBox(slide, index, focusSelector) {
  if (openSummaryBoxes.has(index)) return;
  openSummaryBoxes.add(index);
  revealed = openSummaryBoxes.size === slide.boxCount;
  show();
  $(focusSelector).focus({preventScroll: true});
}

function nextSummaryBox(slide) {
  for (let index = 0; index < slide.boxCount; index++) {
    if (!openSummaryBoxes.has(index)) {
      openSummaryBox(slide, index, '#next');
      return;
    }
  }
  step(1);
}

function bindSummaryBoxes(slide) {
  for (const button of app.querySelectorAll('.summary-box')) {
    const index = Number(button.dataset.box);
    button.onclick = () => openSummaryBox(slide, index, '[data-box="' + index + '"]');
  }
}

function setAllSummaryBoxes(slide, open) {
  openSummaryBoxes.clear();
  if (open) {
    for (let index = 0; index < slide.boxCount; index++) openSummaryBoxes.add(index);
  }
}
