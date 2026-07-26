const SCHEDULES = {
  off: [
    ["09:30","10:00","起床・身支度・朝食"],
    ["10:00","12:00","勉強①"],
    ["12:00","13:00","昼食・休憩"],
    ["13:00","15:15","勉強②"],
    ["15:15","15:30","休憩・自重筋トレ","tag"],
    ["15:30","17:30","勉強③"],
    ["17:30","18:15","ランニング","run"],
    ["18:15","18:45","クールダウン・お風呂","bath"],
    ["18:45","19:45","夕食"],
    ["19:45","21:45","勉強④"],
    ["21:45","22:45","自由時間"],
    ["22:45","23:15","翌日準備・ストレッチ"],
    ["23:15","24:00","就寝準備"],
    ["00:00","09:30","就寝","", true]
  ],
  work: [
    ["09:30","10:00","起床・身支度・朝食"],
    ["10:00","12:00","勉強①"],
    ["12:00","13:00","昼食・休憩・自重筋トレ"],
    ["13:00","15:00","勉強②"],
    ["15:00","15:45","準備・軽食・移動"],
    ["16:00","20:00","バイト","work"],
    ["20:00","20:15","帰宅・休憩"],
    ["20:15","21:00","ランニング","run"],
    ["21:00","21:30","クールダウン・お風呂","bath"],
    ["21:30","22:15","夕食"],
    ["22:15","23:00","勉強③"],
    ["23:00","23:30","自由時間・ストレッチ"],
    ["23:30","24:00","就寝準備"],
    ["00:00","09:30","就寝","", true]
  ]
};

const TAG_LABELS = {work:"バイト", run:"ラン", bath:"入浴"};
const TAG_COLORS = {
  work: {main:"#e8a15c", dim:"rgba(232,161,92,0.15)"},
  run:  {main:"#7fd68a", dim:"rgba(127,214,138,0.15)"},
  bath: {main:"#8fb3ff", dim:"rgba(143,179,255,0.15)"}
};

let mode = localStorage.getItem ? null : null; // storage disallowed per policy; use in-memory
mode = "off";

function toMinutes(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  return h*60+m;
}

function fmtMin(mins){
  const h = Math.floor(mins/60), m = mins%60;
  return h+"時間"+(m>0? m+"分":"");
}

function pad(n){return n.toString().padStart(2,"0");}

function render(){
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const nowMinExact = nowMin + now.getSeconds()/60;

  document.getElementById("clock").innerHTML =
    pad(now.getHours())+":"+pad(now.getMinutes())+"<span>"+pad(now.getSeconds())+"</span>";

  const days = ["日","月","火","水","木","金","土"];
  document.getElementById("dateLabel").innerHTML =
    (now.getMonth()+1)+"月"+now.getDate()+"日 (<b>"+days[now.getDay()]+"</b>)";

  const schedule = SCHEDULES[mode];
  let currentIdx = -1;

  // build timeline
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";

  schedule.forEach((item, i)=>{
    const [start, end, label, tag] = item;
    let s = toMinutes(start);
    let e = toMinutes(end);
    if (e <= s) e += 24*60; // crosses midnight

    let effectiveNow = nowMinExact;
    // handle wraparound: if item is overnight block and current time is early morning
    let isCurrent = false;
    if (effectiveNow >= s && effectiveNow < e){
      isCurrent = true;
    } else if (e > 24*60 && effectiveNow < (e-24*60)){
      isCurrent = true;
      effectiveNow += 24*60;
    }

    const div = document.createElement("div");
    div.className = "item" + (isCurrent ? " current" : (effectiveNow >= e ? " done" : ""));
    let tagHtml = "";
    if (tag && TAG_LABELS[tag]){
      tagHtml = '<span class="tag '+tag+'">'+TAG_LABELS[tag]+'</span>';
    }
    div.innerHTML =
      '<div class="item-time">'+start+' – '+end+'</div>'+
      '<div class="item-name">'+label+tagHtml+'</div>';
    tl.appendChild(div);

    if (isCurrent){
      currentIdx = i;
      const dur = e - s;
      const elapsed = effectiveNow - s;
      const pct = Math.min(100, Math.max(0, (elapsed/dur)*100));
      document.getElementById("nowTask").textContent = label;
      document.getElementById("progressFill").style.width = pct+"%";
      document.getElementById("elapsedLabel").textContent = fmtMin(Math.round(elapsed))+" 経過";
      document.getElementById("remainLabel").textContent = "残り "+fmtMin(Math.round(dur-elapsed));

      const color = tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : null;
      const nowCard = document.getElementById("nowCard");
      nowCard.style.setProperty("--tag-color", color ? color.main : "#5ec8d8");
      document.getElementById("progressFill").style.background = color ? color.main : "#5ec8d8";
    }
  });

  // next item
  if (currentIdx >= 0){
    const nextIdx = (currentIdx+1) % schedule.length;
    const nextItem = schedule[nextIdx];
    document.getElementById("nextTask").textContent = nextItem[2];
    document.getElementById("nextTime").textContent = nextItem[0]+"〜";
  }

  // sync current item highlight color on timeline dot
  document.querySelectorAll(".item.current").forEach(el=>{
    const tagEl = el.querySelector(".tag");
    if (tagEl){
      const cls = [...tagEl.classList].find(c=>c!=="tag");
      const color = TAG_COLORS[cls];
      if (color){
        el.style.setProperty("--tag-color", color.main);
        el.style.setProperty("--tag-color-dim", color.dim);
      }
    }
  });
}

function setMode(newMode){
  mode = newMode;
  document.getElementById("btnOff").classList.toggle("active", mode==="off");
  document.getElementById("btnWork").classList.toggle("active", mode==="work");
  render();
}

document.getElementById("btnOff").addEventListener("click", ()=>setMode("off"));
document.getElementById("btnWork").addEventListener("click", ()=>setMode("work"));

setMode("off");
setInterval(render, 1000);
