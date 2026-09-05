
const state={day:localStorage.getItem('cal_day')||'g1',week:Number(localStorage.getItem('cal_week')||1),timerId:null,remaining:0};
function key(d,i,w){return `cal_${d}_${i}_${w}`}
function fmt(sec){const m=Math.floor(sec/60),s=sec%60;return m?`${m}:${String(s).padStart(2,'0')}`:`${s}s`}
function weekHint(e,w){
 const n=e.note||'';
 if(w===1) return '';
 const parts=n.split('.').map(x=>x.trim());
 const hits=parts.filter(p=>{
   const q=p.toLowerCase();
   if(w===2) return q.includes('sett. 2')||q.includes('sett. 2–3')||q.includes('sett. 2-3');
   if(w===3) return q.includes('sett. 3')||q.includes('sett. 2–3')||q.includes('sett. 2-3')||q.includes('sett. 3–4')||q.includes('sett. 3-4');
   if(w===4) return q.includes('sett. 4')||q.includes('sett. 3–4')||q.includes('sett. 3-4')||q.includes('sett. 4–5')||q.includes('sett. 4-5');
   if(w===5) return q.includes('sett. 5')||q.includes('sett. 4–5')||q.includes('sett. 4-5');
 });
 return hits.join('. ');
}
function render(){
 const tabs=document.getElementById('tabs');tabs.innerHTML='';
 WORKOUTS.forEach(d=>{const b=document.createElement('button');b.className='tab'+(d.id===state.day?' active':'');b.textContent=d.title;b.onclick=()=>{state.day=d.id;localStorage.setItem('cal_day',d.id);render()};tabs.appendChild(b)});
 document.getElementById('week').value=state.week;
 const d=WORKOUTS.find(x=>x.id===state.day);document.getElementById('dayTitle').textContent=d.title;
 const list=document.getElementById('list');list.innerHTML='';let done=0;
 d.exercises.forEach((e,i)=>{
   const checked=localStorage.getItem(key(d.id,i,'done'))==='1';if(checked)done++;
   const saved=localStorage.getItem(key(d.id,i,'note'))||'';const hint=weekHint(e,state.week);
   const card=document.createElement('section');card.className='card'+(checked?' done':'');
   card.innerHTML=`<div class="topline"><input class="check" type="checkbox" ${checked?'checked':''}><div class="name">${e.name}</div></div>
   <div class="meta"><div><div class="k">Ripetizioni</div><div class="v">${e.reps}</div></div><div><div class="k">Elastico / peso</div><div class="v">${e.load}</div></div><div><div class="k">Recupero</div><div class="v">${fmt(e.rest)}</div></div></div>
   ${e.note?`<div class="note"><strong>Nota:</strong> ${e.note}</div>`:''}${hint?`<div class="weekhint">Settimana ${state.week}: ${hint}</div>`:''}
   <div class="actions"><button class="timer-btn">⏱ ${fmt(e.rest)}</button><button class="note-toggle">✎ Nota personale${saved?' ✓':''}</button></div>
   <div class="personal-wrap"><textarea class="personal" placeholder="Es. 3-3-3, elastico viola">${saved}</textarea><button class="save-note">Salva nota</button></div>`;
   const cb=card.querySelector('.check');cb.onchange=()=>{localStorage.setItem(key(d.id,i,'done'),cb.checked?'1':'0');render()};
   card.querySelector('.timer-btn').onclick=()=>startTimer(e.rest,e.name);
   const wrap=card.querySelector('.personal-wrap'),tog=card.querySelector('.note-toggle'),ta=card.querySelector('.personal');
   tog.onclick=()=>wrap.classList.toggle('open');
   card.querySelector('.save-note').onclick=()=>{localStorage.setItem(key(d.id,i,'note'),ta.value.trim());render()};
   list.appendChild(card);
 });
 const pct=Math.round(done/d.exercises.length*100);document.getElementById('bar').style.width=pct+'%';document.getElementById('pct').textContent=pct+'%';
}
function startTimer(sec,name){clearInterval(state.timerId);state.remaining=sec;document.getElementById('timerName').textContent=name;updateTimer();document.getElementById('timerOverlay').classList.add('show');state.timerId=setInterval(()=>{state.remaining--;updateTimer();if(state.remaining<=0){clearInterval(state.timerId);if(navigator.vibrate)navigator.vibrate([200,100,200])}},1000)}
function updateTimer(){document.getElementById('timerBig').textContent=fmt(Math.max(0,state.remaining))}
function closeTimer(){clearInterval(state.timerId);document.getElementById('timerOverlay').classList.remove('show')}
function add30(){state.remaining+=30;updateTimer()}
function resetDay(){const d=WORKOUTS.find(x=>x.id===state.day);if(!confirm(`Azzerare le spunte di ${d.title}? Le note restano salvate.`))return;d.exercises.forEach((e,i)=>localStorage.removeItem(key(d.id,i,'done')));render()}
function resetAll(){if(!confirm('Azzerare tutte le spunte? Le note restano salvate.'))return;WORKOUTS.forEach(d=>d.exercises.forEach((e,i)=>localStorage.removeItem(key(d.id,i,'done'))));render()}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('week').onchange=e=>{state.week=Number(e.target.value);localStorage.setItem('cal_week',state.week);render()};document.getElementById('closeTimer').onclick=closeTimer;document.getElementById('add30').onclick=add30;document.getElementById('resetDay').onclick=resetDay;document.getElementById('resetAll').onclick=resetAll;render();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})});
