'use strict';
const TB_API='https://jkxdhyvnrvsiokbbbjtu.supabase.co',TB_KEY='sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF',TB_CLIENT='359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com',TB_TABLE=TB_API+'/rest/v1/textbook_sentence_notes',TB_ADMINS=['tfellow@gmail.com','tfellow@smy.ms.kr','engwords@smy.ms.kr','hist1026@gmail.com'];
const tbHeaders=token=>({apikey:TB_KEY,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'});
async function tbRead(g,n){const r=await fetch(TB_TABLE+'?select=part,seq,ko,vocab,grammar,meaning&grade=eq.'+g+'&lesson=eq.'+n,{headers:tbHeaders(),signal:AbortSignal.timeout(4500)});if(!r.ok)throw Error('공동 저장소에 연결하지 못했습니다 ('+r.status+').');return r.json()}
function tbApply(d,rows){for(const row of rows){const s=(row.part==='reading'?d.sentences:d.context)[row.seq-1];if(s)for(const f of ['ko','vocab','grammar','meaning'])s[f]=row[f]}}
