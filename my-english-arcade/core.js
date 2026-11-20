(function(root){
 'use strict';
 const normalize=s=>String(s??'').normalize('NFKC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').trim().replace(/\s+/g,' ').toLowerCase();
 const shuffle=(a,rng=Math.random)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function cloze(item){const re=new RegExp('(?<![A-Za-z])'+escapeRegex(item.word)+'(?![A-Za-z])','gi');const matches=item.sentence.match(re);return matches?item.sentence.replace(re,'______'):null;}
 function eligible(item,mode){if(['sentence','crypto'].includes(mode))return !!item.sentence&&item.sentence.split(/\s+/).length<=26;if(mode==='cloze')return !!item.sentence&&!!cloze(item);if(mode==='anagram')return /^[a-z]{3,14}$/i.test(item.word);if(mode==='definition')return !!item.definition;return true;}
 function answerOK(input,item,mode){const targets=['sentence','crypto'].includes(mode)?[item.sentence]:[item.word,...(item.acceptedAnswers||[])];return targets.some(x=>normalize(x)===normalize(input));}
 function choices(item,pool,field){const truth=item[field];const distinct=new Map();for(const x of pool){const v=x[field];if(v&&normalize(v)!==normalize(truth))distinct.set(normalize(v),v);}return shuffle([truth,...shuffle([...distinct.values()]).slice(0,3)]);}
 function validateBank(bank){
  if(!bank||bank.version!==1||!Array.isArray(bank.items)||bank.items.length<1||bank.items.length>10000)throw Error('version: 1과 1~10,000개 items가 필요합니다.');
  const ids=new Set();const items=bank.items.map((r,i)=>{
   if(!r||typeof r!=='object')throw Error(`${i+1}행: 올바른 문항 객체가 필요합니다.`);
   for(const k of ['id','word','meaning'])if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>500)throw Error(`${i+1}행: ${k}는 1~500자 문자열이어야 합니다.`);
   if(ids.has(r.id))throw Error(`${i+1}행: id가 중복됩니다 (${r.id}).`);ids.add(r.id);
   if(!Number.isInteger(Number(r.grade))||Number(r.grade)<1||Number(r.grade)>3)throw Error(`${i+1}행: grade는 1, 2, 3이어야 합니다.`);
   if(!String(r.unit??'').trim()||String(r.unit).length>50)throw Error(`${i+1}행: unit을 확인하세요.`);
   for(const k of ['definition','sentence','translation'])if(r[k]!=null&&(typeof r[k]!=='string'||r[k].length>2000))throw Error(`${i+1}행: ${k}는 2,000자 이내 문자열이어야 합니다.`);
   if(r.acceptedAnswers!==undefined&&(!Array.isArray(r.acceptedAnswers)||r.acceptedAnswers.length>20||r.acceptedAnswers.some(v=>typeof v!=='string'||v.length>500)))throw Error(`${i+1}행: acceptedAnswers를 확인하세요.`);
   return {id:r.id.trim(),grade:Number(r.grade),unit:String(r.unit).trim(),word:r.word.trim(),meaning:r.meaning.trim(),definition:r.definition?.trim()||'',sentence:r.sentence?.trim()||'',translation:r.translation?.trim()||'',acceptedAnswers:r.acceptedAnswers||[]};
  });
  if(new Set(items.map(i=>i.id)).size!==items.length)throw Error('공백을 제거한 id가 중복됩니다.');
  return {version:1,title:String(bank.title||'내 학습 자료').slice(0,100),items};
 }
 function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted){quoted=false;}else if(!cell){quoted=true;}else throw Error('CSV 따옴표 형식이 올바르지 않습니다.');}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  if(quoted)throw Error('CSV 따옴표가 닫히지 않았습니다.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  const headers=(rows.shift()||[]).map(x=>x.trim());if(new Set(headers).size!==headers.length)throw Error('CSV 열 이름이 중복됩니다.');
  return validateBank({version:1,items:rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`${i+2}행: CSV 열 개수가 다릅니다.`);const o=Object.fromEntries(headers.map((h,j)=>[h,r[j]]));if(o.acceptedAnswers)o.acceptedAnswers=o.acceptedAnswers.split('|');else delete o.acceptedAnswers;return o;})});
 }
 function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function csv(rows){return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');}
 function summarize(attempts){const first=new Map();for(const a of attempts)if(!first.has(a.itemId))first.set(a.itemId,a);const initial=[...first.values()];const correct=initial.filter(a=>a.correct).length;const score=initial.reduce((s,a)=>s+(a.correct?(a.hintUsed?70:100):0),0);return {total:initial.length,correct,accuracy:initial.length?Math.round(correct/initial.length*100):0,score,attempts:attempts.length,hints:attempts.filter(x=>x.hintUsed).length};}
 function weakItems(sessions){const map=new Map();for(const s of sessions){const seen=new Set();for(const a of s.attempts||[]){const key=`${s.bankId||'legacy'}:${a.itemId}:${s.mode}`;if(seen.has(key))continue;seen.add(key);const w=map.get(key)||{id:a.itemId,word:a.word,mode:s.mode,bankId:s.bankId,wrong:0,total:0};w.total++;if(!a.correct)w.wrong++;map.set(key,w);}}return [...map.values()].filter(x=>x.wrong).sort((a,b)=>b.wrong/b.total-a.wrong/a.total||b.wrong-a.wrong);}
 function bankId(bank){let h=2166136261;for(const c of JSON.stringify(bank.items)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return 'b'+(h>>>0).toString(16);}
 function validateSession(r){
  const modes=['meaning','reverse','definition','spelling','cloze','sentence','match','memory','listening','anagram','truefalse','crypto'];
  if(!r||typeof r.id!=='string'||r.id.length>100||!modes.includes(r.mode)||!Array.isArray(r.attempts)||!r.attempts.length||r.attempts.length>1000||!Number.isFinite(r.elapsedMs)||r.elapsedMs<0||!Number.isFinite(Date.parse(r.completedAt))||![1,2,3].includes(Number(r.grade)))throw Error('결과 데이터 형식이 잘못되었습니다.');
  const attempts=r.attempts.map(a=>{if(!a||typeof a.itemId!=='string'||a.itemId.length>500||typeof a.word!=='string'||a.word.length>500||typeof a.correct!=='boolean'||typeof a.input!=='string'||a.input.length>2000||typeof a.expected!=='string'||a.expected.length>2000||!Number.isFinite(a.elapsedMs)||a.elapsedMs<0)throw Error('응답 기록이 올바르지 않습니다.');return {itemId:a.itemId,word:a.word,correct:a.correct,input:a.input,expected:a.expected,hintUsed:!!a.hintUsed,phase:['initial','retry','review'].includes(a.phase)?a.phase:'initial',elapsedMs:a.elapsedMs};});
  return {id:r.id,playerKey:String(r.playerKey||'').slice(0,100),userId:r.userId?String(r.userId).slice(0,100):null,studentEmail:typeof r.studentEmail==='string'?r.studentEmail.slice(0,254).toLowerCase():'',studentNumber:String(r.studentNumber||'').slice(0,20),studentName:String(r.studentName||'').slice(0,30),mode:r.mode,grade:Number(r.grade),unit:String(r.unit||'').slice(0,50),bankId:String(r.bankId||'legacy').slice(0,50),reviewSession:!!r.reviewSession,...summarize(attempts),attempts,elapsedMs:r.elapsedMs,completedAt:new Date(r.completedAt).toISOString(),sync:['local','pending','synced','error'].includes(r.sync)?r.sync:'local'};
 }
 const API={normalize,shuffle,cloze,eligible,answerOK,choices,validateBank,validateSession,parseCSV,csv,summarize,weakItems,bankId};root.ArcadeCore=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
