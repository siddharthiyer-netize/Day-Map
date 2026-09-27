const KEY="daymap-data-v1";
const demoBlocks=[
 {id:1,time:"07:30",title:"Morning reset",category:"Health & Rest",duration:30,screen:"screen-free",done:true},
 {id:2,time:"09:00",title:"Deep work: creative brief",category:"Deep Work",duration:90,screen:"90 min screen",done:true},
 {id:3,time:"12:30",title:"Lunch + screen-free walk",category:"Health & Rest",duration:45,screen:"screen-free",done:true},
 {id:4,time:"14:00",title:"Studio session",category:"Personal",duration:60,screen:"45 min screen",done:true},
 {id:5,time:"18:00",title:"Reply and organise",category:"Admin",duration:45,screen:"30 min screen",done:false},
 {id:6,time:"20:30",title:"Evening wind-down",category:"Health & Rest",duration:30,screen:"screen-free",done:true}
];
const demo={
 blocks:demoBlocks, theme:"warm", goal:330, reminders:true,
 journal:[
  {date:"Sep 26, 2026",mood:"Grateful",text:"Life is so much fun when you young"},
  {date:"Sep 16, 2026",mood:"Grateful",text:"A quiet start helped me find more room for the things that matter."}
 ],
 focusSeconds:1500, focusRunning:false
};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(demo);
let currentPage="plan", timerId=null, filter="All blocks";

function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function fmtTime(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function today(){return new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
function score(){let total=data.blocks.length||1; return Math.round(data.blocks.filter(b=>b.done).length/total*100)}
function nav(page){
 currentPage=page;
 document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===page));
 document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 render();
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));
document.getElementById("quickAdd").onclick=openModal;
document.getElementById("datePill").textContent=new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
document.getElementById("fullDate").textContent=today();
function tickClock(){document.getElementById("clock").textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
setInterval(tickClock,1000);tickClock();

function render(){
 document.body.dataset.theme=data.theme==="warm"?"":data.theme;
 document.getElementById("sidebarDone").textContent=data.blocks.filter(b=>b.done).length;
 document.getElementById("sidebarTotal").textContent=data.blocks.length;
 if(currentPage==="plan")renderPlan();
 if(currentPage==="focus")renderFocus();
 if(currentPage==="insights")renderInsights();
 if(currentPage==="journal")renderJournal();
 if(currentPage==="settings")renderSettings();
}
function renderPlan(){
 const s=score(), done=data.blocks.filter(b=>b.done).length, planned=data.blocks.reduce((a,b)=>a+b.duration,0), completed=data.blocks.filter(b=>b.done).reduce((a,b)=>a+b.duration,0);
 const cats=["Deep Work","Health & Rest","Personal","Admin"];
 document.getElementById("plan").innerHTML=`
 <div class="page-head"><div><div class="eyebrow">TUESDAY RHYTHM</div><h1>The Day Map</h1><p class="sub">A calm view of your day, with enough structure to keep your attention soft.</p></div><button class="primary" onclick="openModal()">••• &nbsp; Add Block</button></div>
 <div class="plan-layout"><div>
   <div class="filter-row">${["All blocks",...cats].map(x=>`<button class="chip ${filter===x?"active":""}" onclick="setFilter('${x}')">${x}</button>`).join("")}<span class="filter">⌯ Filter</span></div>
   ${data.blocks.filter(b=>filter==="All blocks"||b.category===filter).sort((a,b)=>a.time.localeCompare(b.time)).map(blockHTML).join("")}
 </div>
 <div class="side-stack">
   <div class="card balance"><div class="card-title">Today's Balance <span style="float:right;color:var(--muted)">${done}/${data.blocks.length} done</span></div>
    <div class="ring" style="--score:${s}%"><strong>${s}%</strong><span>IN BALANCE</span></div>
    <div class="stats"><div class="statbox"><b>${Math.floor(planned/60)}h</b><span>PLANNED</span></div><div class="statbox"><b>${done}</b><span>COMPLETED</span></div></div>
   </div>
   <div class="card focus-card"><div class="card-title">Focus next <span style="float:right;color:var(--pink)">→</span></div><p>Give one block your full attention. The rest of the day can wait.</p><a class="link" onclick="nav('focus')">Open Focus Time →</a></div>
   <div class="card ingredients"><div class="card-title">Your ingredients</div>${cats.map(c=>{let n=data.blocks.filter(b=>b.category===c).length;return `<div class="ingredient"><div class="ingredient-line"><span>${c}</span><b>${n}</b></div><div class="bar"><i style="width:${Math.min(100,n*28)}%"></i></div></div>`}).join("")}</div>
 </div></div>`;
}
function blockHTML(b){
 return `<div class="block"><div class="block-time">${b.time}</div><div><h4 class="${b.done?"done-title":""}">${b.title}<span class="tag">${b.done?"✓ DONE":"UPCOMING"}</span></h4><div class="block-meta">${b.duration} min · ${b.screen}</div></div><div class="block-actions"><button class="check ${b.done?"done":""}" onclick="toggleBlock(${b.id})">${b.done?"✓":""}</button><button class="icon-btn" onclick="focusOn('${b.title.replace(/'/g,"&#39;")}')">▷</button><button class="icon-btn" onclick="deleteBlock(${b.id})">♧</button></div></div>`
}
function setFilter(x){filter=x;render()}
function toggleBlock(id){let b=data.blocks.find(x=>x.id===id);b.done=!b.done;save();render()}
function deleteBlock(id){data.blocks=data.blocks.filter(x=>x.id!==id);save();render()}
function focusOn(title){data.focusTask=title;save();nav("focus")}
function openModal(){document.getElementById("blockModal").classList.remove("hidden")}
function closeModal(){document.getElementById("blockModal").classList.add("hidden")}
function addBlock(){
 const b={id:Date.now(),time:document.getElementById("blockTime").value,title:document.getElementById("blockTitle").value.trim()||"New block",category:document.getElementById("blockCategory").value,duration:+document.getElementById("blockDuration").value||30,screen:"screen-time",done:false};
 data.blocks.push(b);save();closeModal();render()
}

function renderFocus(){
 const sec=data.focusSeconds||1500;
 document.getElementById("focus").innerHTML=`<div class="page-head"><div><div class="eyebrow">ONE THING AT A TIME</div><h1>Focus Time</h1><p class="sub">Choose a gentle container for your attention, then let the next few minutes be enough.</p></div><span class="chip">READY WHEN YOU ARE</span></div>
 <div class="focus-grid"><div class="card timer-card"><div class="timer-circle"><div><b id="timerText">${fmtTime(sec)}</b><span>${data.focusRunning?"FOCUSING":"REPLY AND ORGANISE"}</span></div></div>
 <select class="select" onchange="data.focusTask=this.value;save()">${data.blocks.map(b=>`<option ${data.focusTask===b.title?"selected":""}>${b.title}</option>`).join("")}</select>
 <div class="timer-controls"><button class="primary" onclick="startTimer()">${data.focusRunning?"❚❚ Pause":"▷ Start"}</button><button class="secondary" onclick="resetTimer()">↻ Reset</button><button class="secondary" onclick="completeFocus()">✓ Complete early</button></div></div>
 <div class="card preset-card"><div class="card-title">Choose a container <span style="float:right">✣</span></div>
 ${[[25,"Pomodoro"],[45,"Deep work"],[60,"Ultra focus"]].map(([m,t])=>`<button class="preset ${sec===m*60?"selected":""}" onclick="setTimer(${m*60})"><b>${m} min</b><br><span>${t}</span></button>`).join("")}
 <hr style="border:0;border-top:1px solid var(--line)"><small style="color:var(--muted)">Custom minutes</small><input id="customMin" type="number" value="${Math.max(1,Math.round(sec/60))}" min="1" style="width:100%;margin:6px 0;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--gold2)"><button class="secondary" style="width:100%" onclick="setTimer((+document.getElementById('customMin').value||25)*60)">Use custom duration</button>
 <div class="landing"><b style="font-size:9px">A soft landing</b><p>When the timer finishes, The Day Map will mark this activity complete and play a quiet chime.</p></div></div></div>`;
}
function setTimer(sec){data.focusSeconds=sec;data.focusRunning=false;clearInterval(timerId);save();render()}
function startTimer(){
 data.focusRunning=!data.focusRunning;save();render();
 if(data.focusRunning){clearInterval(timerId);timerId=setInterval(()=>{if(data.focusSeconds>0){data.focusSeconds--;localStorage.setItem(KEY,JSON.stringify(data));let el=document.getElementById("timerText");if(el)el.textContent=fmtTime(data.focusSeconds)}else{clearInterval(timerId);data.focusRunning=false;save();render()}},1000)}
}
function resetTimer(){data.focusSeconds=1500;data.focusRunning=false;clearInterval(timerId);save();render()}
function completeFocus(){let b=data.blocks.find(x=>x.title===data.focusTask);if(b)b.done=true;resetTimer()}

function renderInsights(){
 const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], vals=[3,4,2,5,3,4,5], done=[2,3,2,4,2,3,0];
 const screen=[210,240,180,300,225,250,165];
 document.getElementById("insights").innerHTML=`<div class="page-head"><div><div class="eyebrow">PATTERNS, NOT PRESSURE</div><h1>Insights & Rhythm</h1><p class="sub">A gentle look at how your attention has been moving this week.</p></div><span class="chip">♨ 5 days<br><small>current rhythm</small></span></div>
 <div class="metrics"><div class="card metric"><b>${score()}%</b><span>plan completion</span></div><div class="card metric"><b>${(data.blocks.filter(b=>b.done).reduce((a,b)=>a+b.duration,0)/60).toFixed(1)}h</b><span>focused this week</span></div><div class="card metric"><b>${Math.round(data.blocks.reduce((a,b)=>a+(b.screen==="screen-free"?0:b.duration),0)/data.blocks.length)}m</b><span>average screen time</span></div></div>
 <div class="charts"><div class="card chart-card"><div class="chart-title">Completed vs planned <span style="float:right;color:var(--pink)">● Done &nbsp; <span style="color:var(--gold)">● Planned</span></span></div><div class="chart"><div class="bars">${days.map((d,i)=>`<div class="barpair"><i class="vbar" style="height:${vals[i]*25}px"></i><i class="vbar done" style="height:${done[i]*25}px"></i><span class="daylabel" style="left:${i*14.2+5}%">${d}</span></div>`).join("")}</div></div></div>
 <div class="card chart-card"><div class="chart-title">Screen time <span style="float:right;color:var(--pink)">⌁</span></div><div class="chart"><svg class="line-svg" viewBox="0 0 400 200" preserveAspectRatio="none"><polyline fill="none" stroke="var(--pink)" stroke-width="3" points="${screen.map((v,i)=>`${i*65+15},${190-v*.45}`).join(" ")}"/></svg><div style="font-size:7px;color:var(--gold);position:absolute;bottom:-25px">● Goal: ${data.goal} min</div></div></div></div>
 <div class="card reflection"><div class="card-title">💡 A little reflection</div><div class="reflection-grid"><div><small>You kept</small><p><b>16 moments</b></p><small>of attention this week</small></div><div><small>Best window</small><p><b>9:00–11:00</b></p><small>your clearest focus</small></div><div><small>Keep noticing</small><p><b>The small wins</b></p><small>they are the rhythm</small></div></div><div style="margin-top:15px;background:var(--pink2);padding:10px;border-radius:8px;font-size:9px"><b>WEEKLY REFLECTION</b><br><span style="color:var(--muted)">What helped you feel most present this week, and what would you like to carry into the next one?</span><a class="link" style="float:right" onclick="nav('journal')">Write in Journal →</a></div></div>`;
}
function renderJournal(){
 document.getElementById("journal").innerHTML=`<div><div class="eyebrow">A PLACE TO LAND</div><h1>Daily Journal</h1><p class="sub">A few honest lines can help the day become a little clearer.</p></div>
 <div class="journal-grid"><div class="card journal-card"><div class="card-title">● ${today()}</div><h3 style="font-size:14px">What is here today?</h3><div class="moods">${["Calm","Inspired","Focused","Tired","Grateful"].map(m=>`<button class="mood ${data.currentMood===m?"selected":""}" onclick="data.currentMood='${m}';save();render()">${m}</button>`).join("")}</div><textarea id="journalText" class="journal-text" placeholder="Write a few honest lines..."></textarea><div style="margin-top:9px;font-size:8px;color:var(--muted)">✣ Kept private on this device <button class="primary" style="float:right" onclick="saveJournal()">✓ Save reflection</button></div></div>
 <div class="card past"><div class="card-title">Past reflections</div><input class="search" placeholder="Search entries" oninput="filterJournal(this.value)"><div id="entries">${data.journal.map((e,i)=>`<div class="entry"><b>${e.date}</b><span style="float:right;color:var(--pink)">${e.mood}</span><br>${e.text}<small>↻ Updated recently</small></div>`).join("")}</div></div></div>`;
}
function saveJournal(){let text=document.getElementById("journalText").value.trim();if(!text)return;data.journal.unshift({date:today(),mood:data.currentMood||"Calm",text});document.getElementById("journalText").value="";save();render()}
function filterJournal(q){let es=data.journal.filter(e=>(e.text+" "+e.mood+" "+e.date).toLowerCase().includes(q.toLowerCase()));document.getElementById("entries").innerHTML=es.map(e=>`<div class="entry"><b>${e.date}</b><span style="float:right;color:var(--pink)">${e.mood}</span><br>${e.text}<small>↻ Updated recently</small></div>`).join("")}

function renderSettings(){
 const themes=[["warm","Warm Rose",["#d968a0","#e5b33d","#fff8ec","#403b3a"],"Rosy pink, warm gold, and creamy space"],["ocean","Ocean",["#087fb9","#38b8e9","#eef8ff","#17283b"],"Calm coastal blues and crisp clarity"],["forest","Forest",["#2f7659","#6bc097","#f0f5f1","#193327"],"Moss greens and earthy sage"],["sunset","Sunset",["#f05809","#ffad0b","#fff1df","#3c2519"],"Terracotta, amber, and dusk glow"],["midnight","Midnight",["#a55af0","#6267df","#121827","#edf1f7"],"Twilight violet and electric indigo"]];
 document.getElementById("settings").innerHTML=`<div><div class="eyebrow">MAKE IT YOURS</div><h1>Preferences & Themes</h1><p class="sub">Tune the space around your attention. Changes save instantly on this device.</p></div>
 <div class="card" style="padding:14px"><div class="card-title">Colour theme <span class="chip" style="float:right">Custom colours</span></div><div class="theme-row">${themes.map(t=>`<button class="theme ${data.theme===t[0]?"active":""}" onclick="setTheme('${t[0]}')"><div class="swatches">${t[1].map?"" : ""}${t[2].map(c=>`<i style="background:${c}"></i>`).join("")}</div><b>${t[1]}</b><span>${t[3]}</span></button>`).join("")}</div></div>
 <div class="settings-grid"><div class="card setting-card"><div class="card-title">Daily preferences</div><div style="font-size:9px">Daily screen time goal <b style="float:right;color:var(--pink)">${Math.floor(data.goal/60)}h ${data.goal%60}m</b></div><input class="range" type="range" min="60" max="600" value="${data.goal}" oninput="data.goal=+this.value;save();this.previousElementSibling.querySelector('b').textContent=Math.floor(data.goal/60)+'h '+data.goal%60+'m'"><div class="setting-row"><span>Break reminders<br><small style="color:var(--muted)">A gentle nudge to stretch after a long focus block.</small></span><button class="toggle ${data.reminders?"on":""}" onclick="data.reminders=!data.reminders;save();render()"></button></div></div>
 <div class="card setting-card"><div class="privacy"><div class="privacy-icon">♙</div><div><b>100% on-device & private</b><p style="font-size:9px;color:var(--muted);line-height:1.5">Your activities, reflections, and preferences stay in this browser. The Day Map does not send your personal routine anywhere.</p><small style="color:var(--gold)">⚠ Local storage only</small></div></div></div>
 <div class="card setting-card" style="grid-column:1/-1"><div class="card-title">Data management</div><p style="font-size:9px;color:var(--muted)">Keep a clean slate or bring the example day back when you need inspiration.</p><button class="secondary" onclick="restoreDemo()">↻ Restore demo day</button> <button class="danger" onclick="clearAll()">▣ Clear all data</button></div></div>`;
}
function setTheme(t){data.theme=t;save();render()}
function restoreDemo(){data=structuredClone(demo);save();render()}
function clearAll(){if(confirm("Clear your Day Map data?")){data={...structuredClone(demo),blocks:[],journal:[],theme:data.theme,goal:data.goal,reminders:data.reminders};save();render()}}
render();
