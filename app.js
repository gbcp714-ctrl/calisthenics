/* Scheda 2 · timer tenuta a cronometro + recupero a conto alla rovescia */
const VERSION='cal3'; // Conserva note e spunte della V3
const APP_VERSION='4';
const state={day:localStorage.getItem('cal_day')||'g1',week:Math.min(4,Math.max(1,Number(localStorage.getItem('cal3_week')||1))),timerId:null,mode:null,startAt:0,elapsedBefore:0,deadline:0,remaining:0,restSeconds:0,exerciseName:'',holdTarget:'',wakeLock:null};
const $=id=>document.getElementById(id);
const key=(d,id,kind)=>`${VERSION}_${d}_${id}_${kind}`;
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
function prepareUi(){
 document.querySelector('.subtitle').textContent='Patrick · 28 settembre – 25 ottobre 2026 · dati sul dispositivo';
 [...$('week').options].forEach(o=>{if(Number(o.value)>4)o.remove()});
 // V4: tutti i controlli del timer sono nell'HTML; fallback per eventuale HTML precedente ancora in cache.
 if(!$('timerMain')) $('timerOverlay').innerHTML='<div class="timerbox"><div id="timerType" class="timer-type"></div><div id="timerName" class="timername"></div><div id="timerTarget" class="timertarget"></div><div id="timerBig" class="timerbig" role="timer">0:00</div><div id="timerStatus" class="timerstatus"></div><div class="timercontrols"><button id="timerMain" class="timer-primary"></button><button id="add30" class="timer-secondary" hidden>+30 sec</button><button id="closeTimer" class="timer-secondary">Chiudi</button></div></div>';
 $('timerOverlay').setAttribute('role','dialog');$('timerOverlay').setAttribute('aria-modal','true');
 const style=document.createElement('style');style.textContent='.timer-type{font-weight:750;color:#b6d9ff;margin-bottom:12px}.timertarget,.timerstatus{color:#e1ecf9;font-size:14px;margin:8px auto 14px;max-width:80vw}.timer-primary{background:#b4dbff;color:#102033}.timer-secondary{background:#fff;color:#223b54}#add30[hidden]{display:none}.timercontrols{flex-wrap:wrap;padding:0 12px}';document.head.append(style);
}
function migrateMatchingNotes(){
 if(localStorage.getItem('cal3_notes_migrated'))return;
 for(const day of WORKOUTS){
  const old=PREVIOUS_WORKOUTS.find(o=>o.id===day.id);if(!old)continue;
  const visited=new Set();
  for(const exercise of day.exercises){
   const index=old.exercises.findIndex((item,i)=>item.name===exercise.name&&!visited.has(i));
   if(index===-1)continue;visited.add(index);
   const prior=localStorage.getItem(`cal_${day.id}_${index}_note`);
   if(prior!==null&&localStorage.getItem(key(day.id,exercise.id,'note'))===null)localStorage.setItem(key(day.id,exercise.id,'note'),prior);
  }
 }
 localStorage.setItem('cal3_notes_migrated','1');
}
function render(){
 $('tabs').replaceChildren();
 for(const day of WORKOUTS){const btn=document.createElement('button');btn.className='tab'+(day.id===state.day?' active':'');btn.textContent=day.title;btn.onclick=()=>{state.day=day.id;localStorage.setItem('cal_day',day.id);render()};$('tabs').append(btn)}
 $('week').value=String(state.week);const day=WORKOUTS.find(d=>d.id===state.day);$('dayTitle').textContent=day.title;
 const list=$('list');list.replaceChildren();let completed=0;
 for(const e of day.exercises){
  const checked=localStorage.getItem(key(day.id,e.id,'done'))==='1';if(checked)completed++;
  const saved=localStorage.getItem(key(day.id,e.id,'note'))||'';
  const overrides=e.progress?.[String(state.week)]||{};
  const reps=overrides.reps||e.reps,load=overrides.load||e.load;
  const card=document.createElement('section');card.className='card'+(checked?' done':'');
  const top=document.createElement('div');top.className='topline';
  const cb=document.createElement('input');cb.className='check';cb.type='checkbox';cb.checked=checked;cb.setAttribute('aria-label',`Completa ${e.name}`);cb.onchange=()=>{localStorage.setItem(key(day.id,e.id,'done'),cb.checked?'1':'0');render()};
  const name=document.createElement('div');name.className='name';name.textContent=e.name;top.append(cb,name);card.append(top);
  const meta=document.createElement('div');meta.className='meta';
  for(const [label,value] of [['Ripetizioni',reps],['Elastico / peso',load],['Recupero',fmt(e.rest)]]){
   const cell=document.createElement('div'),k=document.createElement('div'),v=document.createElement('div');k.className='k';v.className='v';v.textContent=value;k.textContent=label;cell.append(k,v);meta.append(cell)
  }card.append(meta);
  if(e.note){const note=document.createElement('div');note.className='note';const bold=document.createElement('strong');bold.textContent='Nota: ';note.append(bold,document.createTextNode(e.note));card.append(note)}
  if(Object.keys(overrides).length){const hint=document.createElement('div');hint.className='weekhint';hint.textContent=`Settimana ${state.week}: ${Object.entries(overrides).map(([k,v])=>v).join(' · ')}`;card.append(hint)}
  const actions=document.createElement('div');actions.className='actions';
  if(e.hold || /(?:tenuta|plank|barchetta|l-sit)/i.test(e.name)){const hold=document.createElement('button');hold.className='timer-btn hold-btn';hold.textContent='▶ Inizia tenuta · cronometro';hold.onclick=()=>startHold(e);actions.append(hold)}
  const rest=document.createElement('button');rest.className='timer-btn rest-btn';rest.textContent=`☕ Recupero ${fmt(e.rest)}`;rest.onclick=()=>startRest(e.rest,e.name);actions.append(rest);
  const toggle=document.createElement('button');toggle.className='note-toggle';toggle.textContent=`✎ Nota personale${saved?' ✓':''}`;actions.append(toggle);card.append(actions);
  const wrap=document.createElement('div');wrap.className='personal-wrap';const ta=document.createElement('textarea');ta.className='personal';ta.placeholder='Es. 3-3-3, elastico viola';ta.value=saved;const save=document.createElement('button');save.className='save-note';save.textContent='Salva nota';save.onclick=()=>{localStorage.setItem(key(day.id,e.id,'note'),ta.value.trim());render()};toggle.onclick=()=>wrap.classList.toggle('open');wrap.append(ta,save);card.append(wrap);list.append(card);
 }
 const percent=Math.round(completed/day.exercises.length*100);$('bar').style.width=`${percent}%`;$('pct').textContent=`${percent}%`;
}
function stopClock(){if(state.timerId!==null){clearInterval(state.timerId);state.timerId=null}}
function releaseWake(){if(state.wakeLock){state.wakeLock.release().catch(()=>{});state.wakeLock=null}}
function wake(){if(navigator.wakeLock?.request){navigator.wakeLock.request('screen').then(lock=>{if(state.mode)state.wakeLock=lock;else lock.release().catch(()=>{})}).catch(()=>{})}}
function openClock(){ $('timerOverlay').classList.add('show');wake();refreshClock();state.timerId=setInterval(refreshClock,250)}
function startHold(e){closeTimer();state.mode='hold';state.exerciseName=e.name;state.holdTarget=e.hold||'durata libera';state.restSeconds=e.rest;state.startAt=performance.now();state.elapsedBefore=0;openClock()}
function startRest(seconds,name){closeTimer();state.mode='rest';state.exerciseName=name;state.remaining=seconds;state.deadline=performance.now()+seconds*1000;openClock()}
function refreshClock(){
 if(!state.mode)return;
 $('timerName').textContent=state.exerciseName;
 $('add30').hidden=state.mode!=='rest';
 if(state.mode==='hold'){
  const elapsed=Math.floor((state.elapsedBefore+performance.now()-state.startAt)/1000);
  $('timerType').textContent='Cronometro tenuta';$('timerTarget').textContent=`Tempo previsto: ${state.holdTarget} · puoi superarlo`;
  $('timerBig').textContent=fmt(Math.max(0,elapsed));$('timerStatus').textContent='Il cronometro continua oltre il tempo previsto: termina quando vuoi.';
  $('timerMain').textContent='■ Fine tenuta → recupero';$('timerMain').onclick=finishHold;
 }else if(state.mode==='rest'){
  const seconds=Math.max(0,Math.ceil((state.deadline-performance.now())/1000));
  $('timerType').textContent='Recupero';$('timerTarget').textContent='Conto alla rovescia';$('timerBig').textContent=fmt(seconds);
  $('timerStatus').textContent=seconds?'Riposa fino a 0:00':'Recupero terminato!';
  $('timerMain').textContent='✓ Fine recupero';$('timerMain').onclick=closeTimer;
  if(seconds===0){stopClock();if(navigator.vibrate)navigator.vibrate([200,100,200]);releaseWake()}
 }
}
function finishHold(){if(state.mode!=='hold')return;const elapsed=Math.floor((state.elapsedBefore+performance.now()-state.startAt)/1000);const seconds=state.restSeconds;const name=state.exerciseName;state.lastHoldSeconds=elapsed;startRest(seconds,name);$('timerStatus').textContent=`Tenuta completata: ${fmt(elapsed)} · recupero iniziato`}
function add30(){if(state.mode==='rest'){state.deadline+=30000;refreshClock();if(state.timerId===null)state.timerId=setInterval(refreshClock,250)}}
function closeTimer(){stopClock();releaseWake();state.mode=null;$('timerOverlay').classList.remove('show')}
function resetDay(){const d=WORKOUTS.find(x=>x.id===state.day);if(!confirm(`Azzerare le spunte di ${d.title}? Le note restano salvate.`))return;d.exercises.forEach(e=>localStorage.removeItem(key(d.id,e.id,'done')));render()}
function resetAll(){if(!confirm('Azzerare tutte le spunte della nuova scheda? Le note restano salvate.'))return;WORKOUTS.forEach(d=>d.exercises.forEach(e=>localStorage.removeItem(key(d.id,e.id,'done'))));render()}
document.addEventListener('DOMContentLoaded',()=>{
 prepareUi();migrateMatchingNotes();$('week').onchange=e=>{state.week=Number(e.target.value);localStorage.setItem('cal3_week',String(state.week));render()};
 $('closeTimer').onclick=closeTimer;$('add30').onclick=add30;$('resetDay').onclick=resetDay;$('resetAll').onclick=resetAll;
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.mode&&state.timerId===null&&state.mode==='hold'){state.timerId=setInterval(refreshClock,250)}if(!document.hidden)refreshClock()});
 render();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
});