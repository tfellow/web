// 단어숲 마스코트 "새싹이" — 숲에서 자라는 동글동글 새싹 요정 (SVG, 외부 파일 없음)
// mood: happy(기본) | cheer(정답·축하) | sad(오답·위로) | sleep(기록 없음)
let uid = 0;
const INK = '#1F2D26';

export function mascot(mood = 'happy', size = 96, cls = '') {
  const id = 'ms' + (++uid);
  const eyes = {
    happy: `<ellipse cx="45" cy="66" rx="10" ry="11" fill="#fff"/><ellipse cx="75" cy="66" rx="10" ry="11" fill="#fff"/>
      <circle cx="47" cy="68" r="6.2" fill="${INK}"/><circle cx="77" cy="68" r="6.2" fill="${INK}"/>
      <circle cx="49.5" cy="65" r="2.2" fill="#fff"/><circle cx="79.5" cy="65" r="2.2" fill="#fff"/>`,
    cheer: `<path d="M37 69q8-11 16 0M67 69q8-11 16 0" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`,
    sad: `<ellipse cx="45" cy="68" rx="9.5" ry="10" fill="#fff"/><ellipse cx="75" cy="68" rx="9.5" ry="10" fill="#fff"/>
      <circle cx="45" cy="71" r="5.8" fill="${INK}"/><circle cx="75" cy="71" r="5.8" fill="${INK}"/>
      <circle cx="47" cy="68.5" r="2" fill="#fff"/><circle cx="77" cy="68.5" r="2" fill="#fff"/>
      <path d="M36 59l12-5M84 59l-12-5" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    sleep: `<path d="M37 68q8 6 16 0M67 68q8 6 16 0" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  }[mood] || '';
  const mouth = {
    happy: `<path d="M53 81q7 7 14 0" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
    cheer: `<path d="M49 79q11 0 22 0q-2 15-11 15t-11-15z" fill="${INK}"/><path d="M54 88q6-4 12 0q-2 5-6 5t-6-5z" fill="#FF7E93"/>`,
    sad: `<path d="M53 88q7-6 14 0" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
    sleep: `<ellipse cx="60" cy="84" rx="4" ry="3" fill="${INK}"/>`,
  }[mood] || '';
  const arms = mood === 'cheer'
    ? `<path d="M22 72q-12-10-9-24M98 72q12-10 9-24" stroke="url(#${id}b)" stroke-width="10" stroke-linecap="round" fill="none"/>`
    : `<ellipse cx="18" cy="82" rx="6" ry="9" fill="#3FB563" transform="rotate(${mood === 'sad' ? 10 : 25} 18 82)"/><ellipse cx="102" cy="82" rx="6" ry="9" fill="#3FB563" transform="rotate(${mood === 'sad' ? -10 : -25} 102 82)"/>`;
  const leafTilt = mood === 'sad' ? 'rotate(-14 60 34)' : mood === 'cheer' ? 'rotate(4 60 34)' : '';
  const leafTilt2 = mood === 'sad' ? 'rotate(14 60 34)' : '';
  const extra = mood === 'sad' ? `<path d="M96 50q5 8 0 11q-5-3 0-11z" fill="#8FD3FF"/>`
    : mood === 'cheer' ? `<path d="M14 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM104 28l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFC93C"/>`
    : mood === 'sleep' ? `<text x="92" y="42" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="#7FA88C">z</text><text x="102" y="30" font-family="Nunito,sans-serif" font-weight="900" font-size="11" fill="#7FA88C">z</text>` : '';
  return `<svg class="masc ${mood} ${cls}" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="새싹이">
  <defs>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DDF86"/><stop offset="1" stop-color="#34AE5B"/></linearGradient>
  </defs>
  <ellipse class="masc-sh" cx="60" cy="113" rx="30" ry="5" fill="rgba(20,40,25,.14)"/>
  <g class="masc-body">
    ${arms}
    <g class="masc-leaf">
      <path d="M60 36V22" stroke="#2F9A50" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M60 25C50 8 30 9 25 17c9 9 24 12 35 8z" fill="#8BE07A" transform="${leafTilt}"/>
      <path d="M60 25c9-18 32-20 38-11-9 11-26 15-38 11z" fill="#5BCB5E" transform="${leafTilt2}"/>
      <path d="M60 25C50 14 38 13 31 16" stroke="#5DBB55" stroke-width="1.6" fill="none" stroke-linecap="round" transform="${leafTilt}"/>
    </g>
    <path d="M60 31c28 0 44 21 44 46 0 22-18 34-44 34S16 99 16 77c0-25 16-46 44-46z" fill="url(#${id}b)"/>
    <path d="M32 50c6-9 15-13 24-13" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <ellipse cx="60" cy="92" rx="25" ry="15" fill="#E6F8D8" opacity=".9"/>
    ${eyes}
    <ellipse cx="33" cy="81" rx="6.5" ry="4.2" fill="#FF9DB0" opacity=".75"/><ellipse cx="87" cy="81" rx="6.5" ry="4.2" fill="#FF9DB0" opacity=".75"/>
    ${mouth}
  </g>
  ${extra}
</svg>`;
}

// 말풍선과 함께
export function mascotSays(text, mood = 'happy', size = 84, cls = '') {
  return `<div class="masc-say ${cls}">${mascot(mood, size, 'bob')}<div class="bubble">${text}</div></div>`;
}
