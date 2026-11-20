(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./core.js'):root.ArcadeCore;
const day=stamp=>new Date(Date.parse(stamp)+9*3600000).toISOString().slice(0,10);
const studentKey=s=>s.userId?'user:'+s.userId:String(s.playerKey||'number:'+s.studentNumber);
function schoolNumber(value){
 const s=String(value||'').trim().toLowerCase().replace(/@smy\.ms\.kr$/,'');
 const m=s.match(/^(?:\d{4})?([1-3])(\d{2})(\d{2})$/);
 if(!m||+m[2]<1||+m[2]>30||+m[3]<1||+m[3]>99)return {grade:null,cls:null,no:null};
 return {grade:+m[1],cls:+m[2],no:+m[3]};
}
function person(s,roster=[]){
 const number=String(s.studentNumber||'').toLowerCase();
 const email=String(s.studentEmail||'').toLowerCase();
 const external=email&&!email.endsWith('@smy.ms.kr');
 const entry=external?null:roster.find(r=>String(r.email||'').toLowerCase()===(email||number+'@smy.ms.kr'));
 const parsed=external?{grade:null,cls:null,no:null}:schoolNumber(number);
 const grade=entry&&[1,2,3].includes(+entry.grade)?+entry.grade:parsed.grade;
 const cls=entry&&+entry.class_no>0?+entry.class_no:parsed.cls;
 const no=entry&&+entry.student_no>0?+entry.student_no:parsed.no;
 return {key:studentKey(s),number,name:String(entry?.name||s.studentName||''),nickname:String(s.studentName||''),grade,cls,no,source:entry?'roster':grade?'number':'unknown'};
}
function mergeSessions(local,remote){const m=new Map();for(const s of [...local,...remote])m.set(s.id,s);return [...m.values()].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||a.id.localeCompare(b.id));}
function filterSessions(rows,f={},roster=[]){return rows.filter(s=>{
 const p=person(s,roster),d=day(s.completedAt),q=String(f.search||'').trim().toLowerCase();
 return (!f.from||d>=f.from)&&(!f.to||d<=f.to)&&(!f.grade||String(p.grade??'unknown')===String(f.grade))&&(!f.cls||String(p.cls??'unknown')===String(f.cls))&&(!f.student||p.key===f.student)&&(!f.mode||s.mode===f.mode)&&(!f.bookGrade||String(s.grade)===String(f.bookGrade))&&(!f.unit||s.unit===f.unit)&&(!q||`${p.number} ${p.name} ${p.nickname}`.toLowerCase().includes(q));
});}
// One first response per student, game, bank version and item in each session.
// Later answers within the same session never inflate accuracy or recovery.
function learning(rows){
 const m=new Map();for(const s of mergeSessions([],rows)){
  const seen=new Set();for(const a of s.attempts||[]){if(seen.has(a.itemId))continue;seen.add(a.itemId);
   const key=JSON.stringify([studentKey(s),s.bankId||'legacy',s.mode,a.itemId]);
   const r=m.get(key)||{key,studentKey:studentKey(s),id:a.itemId,word:a.word,bankId:s.bankId,mode:s.mode,grade:s.grade,unit:s.unit,total:0,wrong:0,everWrong:false,rechecked:false,recovered:false,latestCorrect:false,latestHint:false,lastAt:s.completedAt};
   r.total++;if(r.everWrong)r.rechecked=true;if(!a.correct){r.wrong++;r.everWrong=true;}
   r.latestCorrect=a.correct;r.latestHint=!!a.hintUsed;r.recovered=r.everWrong&&r.rechecked&&a.correct;r.lastAt=s.completedAt;r.latestInput=a.input;r.expected=a.expected;
   m.set(key,r);
  }
 }return [...m.values()];
}
function summary(rows){
 let total=0,correct=0,score=0,elapsedMs=0,hints=0;const students=new Set();
 for(const s of rows){const a=C.summarize(s.attempts);total+=a.total;correct+=a.correct;score+=a.score;elapsedMs+=s.elapsedMs;students.add(studentKey(s));const seen=new Set();for(const x of s.attempts){if(!seen.has(x.itemId)){hints+=x.hintUsed?1:0;seen.add(x.itemId);}}}
 const l=learning(rows),rechecked=l.filter(i=>i.rechecked).length,recovered=l.filter(i=>i.recovered).length;
 return {sessions:rows.length,students:students.size,total,correct,accuracy:total?Math.round(correct/total*100):null,score,elapsedMs,averageMs:rows.length?Math.round(elapsedMs/rows.length):0,hints,reviewSessions:rows.filter(r=>r.reviewSession).length,rechecked,recovered,recovery:rechecked?Math.round(recovered/rechecked*100):null,needsReview:l.filter(i=>!i.latestCorrect).length};
}
function group(rows,keyFn,labelFn){const m=new Map();for(const s of rows){const key=keyFn(s);if(!m.has(key))m.set(key,[]);m.get(key).push(s);}return [...m].map(([key,list])=>({key,label:labelFn(list.at(-1)),...summary(list),rows:list}));}
function breakdown(rows,kind,roster=[]){
 const key=s=>{const p=person(s,roster);return kind==='student'?p.key:kind==='grade'?String(p.grade??'unknown'):kind==='class'?`${p.grade??'unknown'}-${p.cls??'unknown'}`:kind==='mode'?s.mode:kind==='unit'?`${s.grade}-${s.unit}`:day(s.completedAt);};
 const label=s=>{const p=person(s,roster);return kind==='student'?`${p.number} · ${p.name}`:kind==='grade'?(p.grade?`${p.grade}학년`:'소속 미확인'):kind==='class'?(p.grade&&p.cls?`${p.grade}학년 ${p.cls}반`:'소속 미확인'):kind==='mode'?s.mode:kind==='unit'?`${s.grade}학년 Lesson ${s.unit}`:day(s.completedAt);};
 return group(rows,key,label).sort((a,b)=>a.label.localeCompare(b.label,'ko',{numeric:true}));
}
function weak(rows){const m=new Map();for(const r of learning(rows)){const key=JSON.stringify([r.bankId||'legacy',r.mode,r.id]);const w=m.get(key)||{key,id:r.id,word:r.word,bankId:r.bankId,mode:r.mode,grade:r.grade,unit:r.unit,total:0,wrong:0,affected:0,unresolved:0};w.total+=r.total;w.wrong+=r.wrong;w.affected+=r.wrong?1:0;w.unresolved+=!r.latestCorrect?1:0;m.set(key,w);}return [...m.values()].filter(w=>w.wrong).map(w=>({...w,errorRate:Math.round(w.wrong/w.total*100)})).sort((a,b)=>b.errorRate-a.errorRate||b.affected-a.affected||b.wrong-a.wrong);}
const api={day,studentKey,schoolNumber,person,mergeSessions,filterSessions,learning,summary,breakdown,weak};root.ArcadeStats=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
