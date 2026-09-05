
const state = {
  day: localStorage.getItem('cal_day') || 'g1',
  timerId: null,
  remaining: 0,
  activeBtn: null,
};

function key(day,i,what){return `cal_${day}_${i}_${what}`}

function fmt(sec){
  const m=Math.floor(sec/60), s=sec%60;
  return m ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
}

function render(){
  const tabs=document.getElementById('tabs');
  tabs.innerHTML='';
  WORKOUTS.forEach(d=>{
    const b=document.createElement('button');
    b.className='tab'+(d.id===state.day?' active':'');
    b.textContent=d.title;
    b.onclick=()=>{state.day=d.id; localStorage.setItem('cal_day',d.id); render();}
    tabs.appendChild(b);
  });

  const d=WORKOUTS.find(x=>x.id===state.day);
  document.getElementById('dayTitle').textContent=d.title;
  const list=document.getElementById('list'); list.innerHTML='';
  let done=0;

  d.exercises.forEach((e,i)=>{
    const checked=localStorage.getItem(key(d.id,i,'done'))==='1';
    if(checked) done++;
    const card=document.createElement('section');
    card.className='card'+(checked?' done':'');
    const noteSaved=localStorage.getItem(key(d.id,i,'note')) || '';
    card.innerHTML=`
      <div class="topline">
        <input class="check" type="checkbox" ${checked?'checked':''} aria-label="Completato">
        <div class="name">${e.name}</div>
      </div>
      <div class="meta">
        <div><div class="k">Ripetizioni</div><div class="v">${e.reps}</div></div>
        <div><div class="k">Elastico / peso</div><div class="v">${e.load}</div></div>
        <div><div class="k">Recupero</div><div class="v">${fmt(e.rest)}</div></div>
      </div>
      ${e.note?`<div class="note"><strong>Nota:</strong> ${e.note}</div>`:''}
      <div class="actions">
        <button class="timer-btn">⏱ Avvia recupero ${fmt(e.rest)}</button>
      </div>
      <textarea class="personal" placeholder="Nota personale (es. 3-3-3, elastico viola)">${noteSaved}</textarea>
      <button class="save-note">Salva nota</button>
    `;
    const cb=card.querySelector('.check');
    cb.onchange=()=>{
      localStorage.setItem(key(d.id,i,'done'), cb.checked?'1':'0');
      render();
    };
    card.querySelector('.timer-btn').onclick=(ev)=>startTimer(e.rest,e.name,ev.currentTarget);
    const ta=card.querySelector('.personal');
    card.querySelector('.save-note').onclick=()=>{
      localStorage.setItem(key(d.id,i,'note'), ta.value.trim());
      const btn=card.querySelector('.save-note');
      const old=btn.textContent; btn.textContent='✓ Salvata';
      setTimeout(()=>btn.textContent=old,1000);
    };
    list.appendChild(card);
  });

  const pct=Math.round(done/d.exercises.length*100);
  document.getElementById('bar').style.width=pct+'%';
  document.getElementById('pct').textContent=pct+'%';
}

function startTimer(seconds,name,btn){
  clearInterval(state.timerId);
  state.remaining=seconds;
  state.activeBtn=btn;
  document.getElementById('timerName').textContent=name;
  updateTimer();
  document.getElementById('timerOverlay').classList.add('show');
  state.timerId=setInterval(()=>{
    state.remaining--;
    updateTimer();
    if(state.remaining<=0){
      clearInterval(state.timerId);
      if(navigator.vibrate) navigator.vibrate([200,100,200]);
      try{ new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAP//AAD//wAA').play() }catch(e){}
    }
  },1000);
}
function updateTimer(){
  document.getElementById('timerBig').textContent=fmt(Math.max(state.remaining,0));
}
function closeTimer(){
  clearInterval(state.timerId);
  document.getElementById('timerOverlay').classList.remove('show');
}
function add30(){state.remaining+=30; updateTimer();}
function resetDay(){
  const d=WORKOUTS.find(x=>x.id===state.day);
  if(!confirm(`Azzerare le spunte di ${d.title}? Le note personali restano salvate.`)) return;
  d.exercises.forEach((e,i)=>localStorage.removeItem(key(d.id,i,'done')));
  render();
}
function resetAll(){
  if(!confirm('Azzerare tutte le spunte dei 3 giorni? Le note personali restano salvate.')) return;
  WORKOUTS.forEach(d=>d.exercises.forEach((e,i)=>localStorage.removeItem(key(d.id,i,'done'))));
  render();
}
document.addEventListener('DOMContentLoaded',()=>{
  render();
  document.getElementById('closeTimer').onclick=closeTimer;
  document.getElementById('add30').onclick=add30;
  document.getElementById('resetDay').onclick=resetDay;
  document.getElementById('resetAll').onclick=resetAll;
  if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
});
