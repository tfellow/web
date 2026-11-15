'use strict';
const $=x=>document.querySelector(x),app=$('#app'),cache={},pending={},E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),pad=n=>String(n).padStart(2,'0');
const sections={opening:['시작 질문','WARM UP'],reading:['본문 깊이 읽기','READING'],context:['In Context','DIALOGUE'],people:['인물과 관점','PERSPECTIVES'],grammar:['핵심 문법','GRAMMAR'],summary:['요약과 빈칸','SUMMARY'],quiz:['이해 확인','QUIZ'],verbs:['동사 변화','VERBS'],studio:['표현 활동','STUDIO']};
let state=null,revealed=false;
function lessonLoaded(g,n,d){cache[g+'-'+n]=d;if(location.protocol.startsWith('http'))tbRead(g,n).then(rows=>{tbApply(d,rows);if(state&&state.g===g&&state.n===n&&rows.length){state.rows=deck(d,state.k);show()}}).catch(()=>{});if(pending[g+'-'+n])pending[g+'-'+n](d)}
function load(g,n){let key=g+'-'+n;if(cache[key])return Promise.resolve(cache[key]);return new Promise((resolve,reject)=>{pending[key]=resolve;const s=document.createElement('script');s.src='data/'+key+'.js';s.onerror=reject;document.head.append(s)})}
const link=(g,n,k,i)=>'#/'+[g,n,k,i].filter(x=>x!=null).join('/');
const tile=(url,tag,title,sub)=>'<a class="tile" href="'+url+'"><span class="tag">'+E(tag)+'</span><strong>'+E(title)+'</strong><small>'+E(sub)+'</small></a>';
function hero(top,title,sub){return '<section class="hero"><div><span class="kicker">'+E(top)+'</span><h1>'+E(title)+'</h1><p>'+E(sub)+'</p></div><img alt="" src="cover.svg"></section>'}
function home(g){const last=localStorage.getItem('textbook.last');app.innerHTML='<div class="wrap">'+hero('MOONYOUNG  /  CLASSROOM LIBRARY','영어 교과서 수업실','오늘의 단원을 고르고, 한 문장씩 함께 읽어 보세요.')+'<div class="headrow"><div><span class="kicker">LESSON LIBRARY</span><h2>단원 서가</h2></div><div class="tabs">'+Object.entries(catalog).map(([k,v])=>v.length?'<a class="'+(+k===g?'on':'')+'" href="'+link(k)+'">'+k+'학년</a>':'<span class="off">'+k+'학년 · 준비 중</span>').join('')+'</div></div><div class="tiles">'+catalog[g].map(l=>tile(link(g,l.number),'LESSON '+pad(l.number),l.unitTitle,l.subtitleKo)).join('')+'</div>'+(last&&/^#\/[1-3]\/\d+\/\w+\/\d+$/.test(last)?'<p style="margin-top:22px"><a class="action" href="'+last+'">마지막 수업 이어가기 →</a></p>':'')+'<p style="margin-top:20px"><a class="crumb" href="original-'+g+'.html">기존 '+g+'학년 통합 자료 열기 ↗</a></p></div>'}
function unit(g,n,d){app.innerHTML='<div class="wrap"><a class="crumb" href="'+link(g)+'">← '+g+'학년 단원 서가</a>'+hero('GRADE 0'+g+'  /  LESSON '+pad(n),d.meta.unitTitle,d.meta.subtitleKo)+'<div class="headrow"><h2>수업 활동</h2></div><div class="tiles sections">'+Object.entries(sections).filter(([k])=>deck(d,k).length).map(([k,[ko,en]])=>tile(link(g,n,k,1),en,ko,k==='reading'?d.meta.readingTitle+' · '+d.sentences.length+'문장':k==='context'?'상황 대화 · '+d.context.length+'문장':deck(d,k).length+'장')).join('')+'</div></div>'}
const join=x=>Array.isArray(x)?x.join(' · '):x;
function deck(d,k){const slide=(en,tag,...items)=>({en,tag,items:items.filter(x=>x[1]!=null&&x[1]!=='')});switch(k){
case 'reading':case 'context':return (k==='reading'?d.sentences:d.context).map(s=>slide(s.en,k==='context'?s.speaker+' · 대화':('p. '+s.page+' · '+(d.chapters[s.chapter-1]||s.tag)),['해석',s.ko],['어휘·표현',s.vocab],['문법',s.grammar],['지시어·의미',s.meaning]));
case 'opening':return [['준비 질문','warmup'],['화제','topic'],['중심 생각','main'],['교훈','lesson']].map(([tag,id])=>slide(d.overview[id+'En'],tag,['함께 생각하기',d.overview[id+'Ko']]));
case 'people':return [...d.characters.people.map(p=>slide(p.name,p.roleKo,['인물 읽기',p.descriptionKo],['영어로 말하기',p.easyEn])),slide(d.characters.titleKo,'관점 비교',['비교 포인트',join(d.characters.contrasts)],['생각 정리',d.characters.closingKo])];
case 'grammar':return d.grammarCards.map(c=>slide(c.title,c.label,['예문',c.examples.join(' / ')],['문법',c.explanationKo],['확인',c.noteKo]));
case 'summary':return [...d.summaries.steps.map(s=>slide(s.en.replace(/\[[^\]]+\]/g,'＿＿＿'),s.title,['완성 문장',s.en.replace(/[\[\]]/g,'')],['해석',s.ko])),...['hundred','fifty','one'].map((s,j)=>slide(['100단어 요약','50단어 요약','한 문장 요약'][j],'SUMMARY',['영어 요약',d.summaries[s]],['우리말 요약',d.summaries[s+'Ko']]))];
case 'quiz':return d.questions.map(q=>({...slide(q.q,'이해 확인',['정답',(q.answer+1)+'. '+q.options[q.answer]],['근거',q.why]),options:q.options}));
case 'verbs':return d.irregulars.map(v=>slide(v[0],'동사 변화',['과거형',v[1]],['과거분사',v[2]],['뜻',v[3]]));
case 'studio':return [slide(d.studio.titleKo,'표현 활동',['생각 열기',d.studio.questionKo],['핵심 질문',join(d.studio.questionEn)],['문장 틀',join(d.studio.frames)],['표현 예시',d.studio.placeholder])];default:return []}}
function fit(){const f=$('.frame'),c=$('.canvas');if(f&&c){const s=Math.min((f.clientWidth-4)/c.offsetWidth,(f.clientHeight-4)/c.offsetHeight);c.style.transform='translateX(-50%) scale('+s+')'}}
let showReadingBreaks = localStorage.getItem('textbook.readingBreaks') === 'on';

function readingBreakControl(activity) {
  if (activity !== 'reading') return '';
  return '<button id="reading-breaks" aria-label="끊어 읽기" aria-pressed="' + showReadingBreaks +
    '">끊어 읽기 ' + (showReadingBreaks ? '켬' : '끔') + '</button> ';
}

function promptText(slide) {
  if (state.k !== 'reading' || !showReadingBreaks) return E(slide.en);
  const sentence = cache[state.g + '-' + state.n].sentences[state.i - 1];
  const phrases = (sentence.chunk || sentence.en).split(/\s+\/\s+/);
  if (phrases.length === 1) return E(slide.en);
  return phrases.map(E).join('<span class="reading-break" aria-hidden="true"> /</span> ');
}

function bindReadingBreakControl() {
  const button = $('#reading-breaks');
  if (!button) return;
  button.onclick = () => {
    showReadingBreaks = !showReadingBreaks;
    localStorage.setItem('textbook.readingBreaks', showReadingBreaks ? 'on' : 'off');
    show();
    $('#reading-breaks').focus({preventScroll: true});
  };
}

function answerCards(items) {
  const cards = items.map(([label, value], index) => {
    const text = E(join(value));
    const answer = revealed
      ? '<div class="answer-body">' + text + '</div>'
      : '<div class="answer-body"><span class="reserved-answer" aria-hidden="true">' + text +
        '</span><span class="answer-blank" role="img" aria-label="빈칸"></span></div>';
    return '<div class="answer"><em>' + pad(index + 1) + ' &nbsp; ' + E(label) + '</em>' + answer + '</div>';
  });
  return '<div class="answers">' + cards.join('') + '</div>';
}

function advance() {
  if (revealed) {
    step(1);
    return;
  }
  revealed = true;
  show();
  $('#next').focus({preventScroll: true});
}

function show(){const {g,n,k,i,rows}=state,s=rows[i-1];app.innerHTML='<section class="stage"><div class="bar"><a href="'+link(g,n)+'">← '+g+'학년 '+n+'과 · 활동 목록</a><div>'+readingBreakControl(k)+'<select aria-label="수업 활동" id="part">'+Object.entries(sections).filter(([id])=>deck(cache[g+'-'+n],id).length).map(([id,[name]])=>'<option value="'+id+'" '+(id===k?'selected':'')+'>'+name+'</option>').join('')+'</select> <select id="page" aria-label="페이지 이동">'+rows.map((_,j)=>'<option '+(j===i-1?'selected':'')+' value="'+(j+1)+'">'+(j+1)+' / '+rows.length+'</option>').join('')+'</select></div></div><div class="frame"><article class="canvas"><div class="kicker">'+E(sections[k][1])+' &nbsp; / &nbsp; '+pad(i)+' &nbsp; · &nbsp; '+E(s.tag)+'</div><h1>'+promptText(s)+'</h1>'+(s.options?'<div>'+s.options.map((o,j)=>'<p class="option">'+(j+1)+'. '+E(o)+'</p>').join('')+'</div>':'')+answerCards(s.items)+'</article></div><div class="progress"><i style="width:'+100*i/rows.length+'%"></i></div><nav><div class="navleft"><button id="prev" '+(i===1?'disabled':'')+'>← 이전</button><button id="next">'+(revealed&&i===rows.length?'활동 마치기':'다음 →')+'</button></div><small>Space · → 공개 / 다음　← 이전　F 전체 화면</small><button class="primary" id="reveal" aria-pressed="'+revealed+'">'+(revealed?'설명 가리기':'모두 공개')+'</button></nav></section>';$('#reveal').onclick=()=>{revealed=!revealed;show();$('#reveal').focus({preventScroll:true})};bindReadingBreakControl();$('#prev').onclick=()=>step(-1);$('#next').onclick=advance;$('#page').onchange=e=>location.hash=link(g,n,k,+e.target.value);$('#part').onchange=e=>location.hash=link(g,n,e.target.value,1);fit()}
function step(dir){const {g,n,k,i,rows}=state;if(i+dir<1)return;location.hash=i+dir>rows.length?link(g,n):link(g,n,k,i+dir)}
async function route(){let hash=location.hash,[g,n,k,pos]=hash.replace(/^#\/?/,'').split('/');g=Number(g);n=Number(n);if(!catalog[g]?.length)g=1;state=null;revealed=false;if(!catalog[g].some(l=>l.number===n)){home(g);return}try{const d=await load(g,n);if(hash!==location.hash)return;if(!Object.hasOwn(sections,k)){unit(g,n,d);return}const rows=deck(d,k);if(!rows.length){unit(g,n,d);return}const i=Math.min(rows.length,Math.max(1,parseInt(pos)||1));state={g,n,k,i,rows};localStorage.setItem('textbook.last',link(g,n,k,i));show()}catch(err){console.error(err);app.innerHTML='<div class="wrap panel">단원을 열지 못했습니다. <a href="#">단원 서가로 돌아가기</a></div>'}}
$('#theme').value=document.documentElement.dataset.theme;$('#theme').onchange=e=>{document.documentElement.dataset.theme=e.target.value;localStorage.setItem('textbook.theme',e.target.value)};$('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{alert('브라우저에서 F11을 눌러 전체 화면으로 전환하세요.')}};document.onfullscreenchange=()=>{$('#full').textContent=document.fullscreenElement?'전체 화면 종료':'전체 화면';fit()};window.onresize=fit;window.onhashchange=route;document.onkeydown=e=>{if(!state||e.ctrlKey||e.altKey||e.metaKey||e.target.matches('select,input,textarea'))return;const k=e.key;if(![' ','ArrowRight','ArrowLeft','ArrowDown','ArrowUp','PageDown','PageUp','f','F','Escape'].includes(k))return;if(k===' '&&e.target.matches('button')&&e.target.id!=='reveal')return;e.preventDefault();if(k==='f'||k==='F')$('#full').click();else if(k==='Escape'){if(!document.fullscreenElement)location.hash=link(state.g,state.n)}else if(['ArrowLeft','ArrowUp','PageUp'].includes(k))step(-1);else if(!e.repeat)advance()};route();
