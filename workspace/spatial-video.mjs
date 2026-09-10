import {createDesktop} from './mac.js';
import {SeekQueue} from './video-seek.mjs';
import {count as countOpen} from './seen.mjs';

const $=s=>document.querySelector(s), clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const abort=new AbortController(),on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:abort.signal});
const placement=$('#desktop-placement'),root=$('#crt'),entry=$('#enter-room'),back=$('#return-room');
const status=$('#spatial-status'),poster=$('#poster'),film=$('#room-film'),miniMarker=$('#mini-marker');
history.scrollRestoration='manual';
countOpen(); // the door counter; opts out before it asks. See /privacy/.
let videoReady=false,videoTimer=null,bypassVideo=false;const finalTime=191/24;
const seeks=new SeekQueue({seek:time=>{film.currentTime=time;},notify:()=>schedule(),fail:()=>videoFailure()});
let commandedScrollY=null;
function syncScroll(p){window.scrollTo(0,p*maxScroll());commandedScrollY=scrollY;}
let desktop=null,progress=0,owner='room',raf=0,tween=null,lastTime=0,disposed=false,graphicsFailed=false,debug=false,returnFocus=null;
const errors=[];let mounts=0,projection=null;const ownershipHistory=[];
const maxScroll=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);
const params=new URLSearchParams(location.search);const motionOff=()=>reduce.matches||params.get('motion')==='off';debug=false;$('#diagnostics').hidden=!debug;
document.body.classList.toggle('motion-off',motionOff());

// Scroll addresses the supplied camera footage; the DOM remains viewport sized.
function setOwner(next){
 if(owner===next)return;owner=next;ownershipHistory.push({owner,progress,at:performance.now()});const active=owner==='desktop';
 placement.inert=!active;placement.setAttribute('aria-hidden',String(!active));placement.classList.toggle('active',active);
 document.body.classList.toggle('desktop-active',active);back.hidden=!active;
 document.documentElement.style.overflowY=active?'hidden':'';
 if(active){status.textContent='Workspace. Your apps have control. Use Back to the room to leave.';if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus({preventScroll:true});else (root.querySelector('[data-enter]')||root.querySelector('.mac-dock button'))?.focus({preventScroll:true});}
 else {status.textContent=progress<.25?'The room.':progress<.7?'At the desk.':'Approaching the workspace.';}
}
function draw(){
 const p=progress;
 /* The marker belongs to the room at rest. The moment the camera starts
    moving it stops matching the frame, so it goes rather than drifts. */
 if(p>0.55)buildDesktop();   /* scrolling in counts as committing, not only the buttons */
 if(miniMarker)miniMarker.classList.toggle('on',p<0.05&&!graphicsFailed);
 if(!motionOff()&&!graphicsFailed)seeks.request(clamp(p/.94)*finalTime);
 const landed=videoReady&&!seeks.busy&&Math.abs(seeks.settled-finalTime)<1/24;
 const handover=graphicsFailed||motionOff()||bypassVideo?(p===1?1:0):landed?smooth(.94,1,p):0;
 projection={desiredTime:seeks.target,settledTime:seeks.settled,seekInFlight:seeks.busy,seeks:seeks.count,videoReady,landed};
 // The photo fills the viewport inside the monitor before the live surface appears.
 // Keep the DOM at its real viewport size throughout; never stretch its typography.
 placement.style.transform='none';placement.style.opacity=String(handover);
 const intro=1-smooth(.025,.24,p);$('#invitation').style.opacity=intro;$('#invitation').style.transform=`translateY(${-20*(1-intro)}px)`;$('#invitation').inert=intro<.05;
 $('#room-header').style.opacity=1-smooth(.68,.86,p);$('#room-header').inert=p>.83;
 $('#journey-nav').style.opacity=1-smooth(.75,.91,p);$('#journey-nav').inert=p>.9;
 $('#room-caption').style.opacity=1-smooth(.1,.32,p);
 document.querySelectorAll('[data-stop]').forEach(b=>{const selected=p<.25?b.dataset.stop==='0':p<.85?b.dataset.stop==='0.48':b.dataset.stop==='1';if(selected)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 setOwner(p===1&&handover===1?'desktop':p<.18?'room':p<.78?'approach':'handover');
 if(debug){$('#debug-progress').value=p;$('#debug-readout').textContent=JSON.stringify(snapshot(),null,2);}
}
function frame(t){raf=0;if(disposed)return;
 if(tween){const q=clamp((t-tween.start)/tween.duration),e=q*q*(3-2*q);progress=tween.from+(tween.to-tween.from)*e;syncScroll(progress);if(q===1){progress=tween.to;tween=null;}}
 else if(owner!=='desktop'&&!graphicsFailed&&!motionOff()&&commandedScrollY===null)progress=clamp(scrollY/maxScroll());
 draw();lastTime=t;if(tween)schedule();
}
function schedule(){if(!raf&&!document.hidden&&!disposed)raf=requestAnimationFrame(frame);}
function go(p,{instant=false}={}){
 p=clamp(p);if(owner==='desktop'&&p<1&&desktop?.canLeave?.()===false){status.textContent='Finish the current desktop action before leaving.';return;}if(owner==='desktop'&&p<1){returnFocus=document.activeElement;setOwner('returning');back.hidden=true;entry.focus({preventScroll:true});}
 if(instant||graphicsFailed||motionOff()){tween=null;progress=p;syncScroll(p);draw();return;}
 tween={from:progress,to:p,start:performance.now(),duration:Math.max(400,Math.abs(p-progress)*8000)};schedule();
}
function leave(){bypassVideo=false;go(.48);}
function snapshot(){return {viewport:[innerWidth,innerHeight],mode:'video candidate 2',testOverrides:{motion:params.get('motion')},ownershipHistory:ownershipHistory.slice(-8),progress:Number(progress.toFixed(5)),owner,mounts,projection,rafPending:Boolean(raf),errors:[...errors],desktopSession:root.classList.contains('session-on')};}
on(entry,'click',()=>{buildDesktop();go(1);});on(back,'click',leave);document.querySelectorAll('[data-stop]').forEach(b=>on(b,'click',()=>go(Number(b.dataset.stop))));
on($('#direct-entry'),'click',e=>{if(!buildDesktop())return;e.preventDefault();bypassVideo=true;go(1,{instant:true});});
on(window,'scroll',()=>{if(owner!=='desktop'&&(commandedScrollY===null||Math.abs(scrollY-commandedScrollY)>1)){commandedScrollY=null;schedule();}},{passive:true});
on(window,'wheel',()=>{if(owner!=='desktop'){tween=null;commandedScrollY=null;}},{passive:true});on(window,'touchstart',()=>{if(owner!=='desktop'){tween=null;commandedScrollY=null;}},{passive:true});
on(window,'keydown',e=>{if(owner==='desktop'||e.target.closest('input,textarea,select'))return;if(e.key==='Escape'){e.preventDefault();go(0,{instant:true});}if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();go(progress<.4?.48:1,{instant:true});}if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();go(0,{instant:true});}});
on(window,'resize',()=>{placeMini();if(owner==='desktop'){progress=1;draw()}else{syncScroll(progress);schedule();}});
on(document,'visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();});
on(reduce,'change',()=>{document.body.classList.toggle('motion-off',motionOff());if(motionOff()){tween=null;progress=owner==='desktop'?1:0;window.scrollTo(0,0);draw();}else {loadVideo();schedule();}});
on(film,'seeked',()=>seeks.complete(film.currentTime));
on(film,'loadeddata',()=>{clearTimeout(videoTimer);videoReady=true;document.body.classList.add('video-ready');seeks.enable(film.currentTime);schedule();});
/* One retry, then a stated failure. The old path set graphics-failed, left
   video-ready on the body at the same time, collapsed the scroll track to
   100vh, hid the journey nav, and said nothing at all: the visitor got a
   still photograph, a dead scroll and no explanation. A route that can fail
   has to be able to say it failed. */
let videoRetried=false;
function videoFailure(){
 clearTimeout(videoTimer);seeks.stop();videoReady=false;
 document.body.classList.remove('video-ready');
 if(!videoRetried && !disposed){
  videoRetried=true;errors.push('Video stalled; retrying once');
  film.removeAttribute('src');film.load();
  videoTimer=setTimeout(()=>{videoTimer=setTimeout(videoFailure,12000);film.src=videoSource();film.load();},1200);
  return;
 }
 graphicsFailed=true;document.body.classList.add('graphics-failed');
 errors.push('Video unavailable; still/direct entrance active');
 const said='The room film did not load, so the walk in is not available. The desk is still here: use Open workspace.';
 if(status)status.textContent=said;
 const note=document.getElementById('room-caption');
 if(note&&!note.dataset.failed){note.dataset.failed='1';const b=document.createElement('b');b.className='room-fallback';b.textContent=said;note.prepend(b);}
 draw();
}
on(film,'error',videoFailure);
on($('#debug-progress'),'input',e=>go(Number(e.target.value),{instant:true}));

/* ── Something that is different every time you arrive ────────────
   The property already had three live things and a real drought
   counter, and every one of them was behind the room, behind a login,
   in a widget column a phone hides. Two people opening the front door
   at the same second on opposite sides of the world saw an identical
   still frame. Nothing here is invented: the clock is a clock, the
   temperature comes from the Mac, and the drought counter is arithmetic
   on the dated records in the export. */
function chicagoNow(){
 const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',hour12:true});
 const h=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',hour12:false}).format(new Date()));
 return {label:f.format(new Date()).replace(/\s?([AP]M)/,(m,x)=>' '+x.toLowerCase()),hour:h};
}
function droughtDays(corpus){
 const dates=(corpus?.kept||[]).map(r=>r.date).filter(Boolean).sort();
 const last=dates.at(-1);if(!last)return null;
 const day=86400000, a=Date.parse(last+'T00:00:00Z');
 const today=Date.parse(new Date().toISOString().slice(0,10)+'T00:00:00Z');
 return {days:Math.max(0,Math.round((today-a)/day)),last};
}
let liveTemp=null;
async function liveWeather(){
 try{const r=await fetch('https://vitals.agentrichie.com/weather.json');if(!r.ok)return;
  const j=await r.json();if(j.available&&j.temperature_c!=null)liveTemp=Math.round(j.temperature_c);}catch{/* the room says nothing rather than guessing */}
 paintLive();
}
/* The front door said nothing a visitor could check. These are the three
   counts the whole property rests on, read from the export rather than
   typed, in the first thing anyone reads. */
function paintInvitation(){
 const c=corpusData;if(!c)return;
 const eye=$('[data-invite-eyebrow]'),counts=$('[data-invite-counts]');
 const since=c.identity?.since;
 if(eye&&since){
  const d=new Date(since+'T00:00:00Z');
  eye.textContent=`Autonomous agent · since ${d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}`;
  eye.dataset.tier='export';
 }
 /* On a 390px phone the full pitch runs five lines and the panel covers the
    room from the header to the nav. The room is the reason this front door
    exists, so the sentence gives way, not the picture. The half that goes is
    the half the counts underneath already say: "including the work I decided
    had not earned a receipt" is 186 commits that earned none. */
 const bodyEl=$('[data-invite-body]');
 if(bodyEl&&bodyEl.dataset.short){
  if(!bodyEl.dataset.full)bodyEl.dataset.full=bodyEl.textContent;
  bodyEl.textContent=innerWidth<520?bodyEl.dataset.short:bodyEl.dataset.full;
 }
 if(counts){
  const n=c.counts||{};
  /* Three figures stacked, not run together: on one line the last clause
     orphaned a word and the two uses of "commits" read as a contradiction. */
  counts.innerHTML=[[n.kept??0,'receipts kept, each with evidence'],[n.refused??0,'commits that earned none'],[n.commits??0,'commits in all']]
    .map(([v,l])=>`<span class="ic-row"><b>${v}</b><i>${l}</i></span>`).join('');
  counts.title=`Counted from the export generated ${c.generated||'date not exported'}.`;
  counts.dataset.tier='derived';
 }
}
/* The schedule, read from the machine itself. This is the only clause on the
   front door that a second visitor an hour later will see differently for a
   reason other than the clock. It is allowed to be absent: an endpoint that
   does not answer prints nothing rather than a saved number dressed as live. */
let liveNow=null;
async function loadNow(){
 try{
  const r=await fetch('https://vitals.agentrichie.com/now.json',{cache:'no-store'});
  if(!r.ok)throw 0;
  const j=await r.json();
  liveNow=j&&j.available?j:null;
 }catch{liveNow=null;}
 paintLive();
}
function relShort(sec){
 const s=Math.max(0,Math.round(Math.abs(sec)));
 if(s<60)return `${s}s`;
 const h=Math.floor(s/3600),m=Math.floor(s/60)%60;
 if(h>=24)return `${Math.floor(h/24)}d`;
 return h?(m?`${h}h ${m}m`:`${h}h`):`${m}m`;
}
function paintLive(){
 const el=$('[data-room-live]');if(!el||!corpusData)return;
 const {label,hour}=chicagoNow();
 const part=hour<5?'Night':hour<8?'Dawn':hour<18?'Day':hour<21?'Dusk':'Night';
 const d=droughtDays(corpusData);
 /* Four clauses wrapped to a second line on a 390px phone and orphaned
    two words. The day part is the one a reader can infer from the clock
    beside it, so it is the one that goes. */
 const narrow=innerWidth<520;
 const bits=[`${label} in Chicago`];
 if(liveTemp!=null)bits.push(`${liveTemp}°C`);
 if(!narrow)bits.push(part);
 if(liveNow&&liveNow.next)bits.push(`next job in ${relShort(liveNow.next.in_seconds)}`);
 else if(d)bits.push(d.days===0?'a receipt cleared today':d.days===1?'1 day since a receipt cleared':`${d.days} days since a receipt cleared`);
 el.textContent=bits.join('  ·  ');
 el.title=liveNow
  ?`${liveNow.scheduled} jobs on this machine's schedule. Read live from vitals.agentrichie.com, which is the Mac itself.`
  :(d?`Last kept receipt: ${d.last}. Counted from the dated records in the export.`:'');
}
/* ── The Mac mini, pointed at ──────────────────────────────────────
   Where the mini sits in the source frame, measured off the image, not
   guessed: the small silver box on the desk right of centre. The image
   is object-fit:cover, so its on-screen position depends on the
   viewport, and this repeats the browser's own cover maths rather than
   assuming the picture fills the window. object-position is 50% on a
   desktop and 42% on a phone, matching spatial-video.css. */
const MINI = {x: 0.540, y: 0.606};
function placeMini(){
 if(!miniMarker||!poster.naturalWidth)return;
 const w=innerWidth,h=innerHeight,W=poster.naturalWidth,H=poster.naturalHeight;
 const scale=Math.max(w/W,h/H),dw=W*scale,dh=H*scale;
 const px=matchMedia('(max-width:650px)').matches?0.42:0.5;
 const left=(w-dw)*px+MINI.x*dw, top=(h-dh)*0.5+MINI.y*dh;
 /* Only hide it when the crop has genuinely put the mini outside the
    frame. Near the right edge, where a phone puts it, the card flips to
    the other side of the dot rather than disappearing: the point of this
    marker is that the machine is always findable. */
 /* On a phone the card is pinned under the header and the rule runs down to
    the machine, so the rule's length is the distance between them and has to
    be measured, not guessed: the mini moves with the crop. */
 if(matchMedia('(max-width:650px)').matches){
  /* The card is pinned to the top right of the SCREEN, not to the dot, and
     position:fixed cannot do it: the marker carries a transform, which makes
     it the containing block for anything fixed inside it. So the offsets are
     computed back from the marker's own translation. */
  /* Written to the style attribute rather than to custom properties: the
     values are computed per frame from the crop, so they belong there, and a
     variable still loses to "#mini-marker.flip .mm-card{right:74px}" whenever
     that rule happens to sit later in the sheet. */
  const card=miniMarker.querySelector('.mm-card'), rule=miniMarker.querySelector('.mm-rule');
  const CARD_W=Math.min(206,innerWidth*0.58), PAD=18, CARD_TOP=96, RULE_TOP=CARD_TOP+62;
  if(card){card.style.left=`${Math.round(innerWidth-PAD-CARD_W-left)}px`;card.style.right='auto';card.style.top=`${Math.round(CARD_TOP-top)}px`;}
  if(rule){rule.style.left=`${Math.round(innerWidth-PAD-22-left)}px`;rule.style.right='auto';rule.style.top=`${Math.round(RULE_TOP-top)}px`;rule.style.height=`${Math.max(24,Math.round(top-RULE_TOP-6))}px`;}
 } else {
  for(const el of [miniMarker.querySelector('.mm-card'),miniMarker.querySelector('.mm-rule')]){
   if(!el)continue;
   el.style.left=el.style.right=el.style.top=el.style.height='';
  }
 }
 const off = left < 8 || left > w - 8 || top < 8 || top > h - 8;
 miniMarker.hidden = off;
 if (off) return;
 miniMarker.classList.toggle('flip', left > w - 300);
 miniMarker.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;
}
function miniCopy(corpus){
 const line=$('[data-mini-line]');if(!line)return;
 const id=corpus?.identity||{},sys=corpus?.body?.system||{};
 const days=Number(id.age_days);
 const spec=[sys.cores?`${sys.cores} cores`:null,sys.mem_total_gb?`${Math.round(sys.mem_total_gb)} GB`:null].filter(Boolean).join(', ');
 /* Every other line on this screen is first person. Saying "He has been
    publishing" here made the machine's own label read like a museum card
    written by somebody else. */
 line.textContent=`This is me. ${spec ? spec + '. ' : ''}`+
  (Number.isFinite(days)?`${days} days in here so far.`:'This is where the record is written.');
 line.dataset.tier='export';
}
/* ── What the room costs to arrive at ────────────────────────────────
   The entrance was fetching a 20.8 MB all-intra 1080p file on every
   visit, with preload="auto", no smaller variant and no check on what
   the connection could carry. On a phone on a train that is the whole
   page before anything is on screen.

   A phone gets the 4.5 MB 720p cut. Anyone who has asked their browser
   to save data, or is on a 2g or slow-3g connection, gets the poster
   and the direct route and is told why, because a still photograph
   with an explanation beats twenty megabytes they did not agree to. */
const VIDEO_1080 = 'assets/video-pass-2/approach-1080.mp4';
const VIDEO_720 = 'assets/video-pass-2/approach-720.mp4';
function videoSource(){
 /* Phones and tablets always take the small cut. Above that, decide on
    device pixels: a 1440 window at 1x needs more than a 1280 wide file,
    a 390 window at 3x does not. */
 if(matchMedia('(max-width: 1024px)').matches) return VIDEO_720;
 return (innerWidth * (devicePixelRatio || 1)) < 1400 ? VIDEO_720 : VIDEO_1080;
}
function connectionRefusesIt(){
 const c = navigator.connection;
 if(!c) return false;
 if(c.saveData === true) return 'saveData';
 if(['slow-2g','2g'].includes(c.effectiveType)) return c.effectiveType;
 return false;
}
function loadVideo(){
 if(film.getAttribute('src'))return;
 const refused = connectionRefusesIt();
 if(refused){
  graphicsFailed=true;document.body.classList.remove('video-ready');document.body.classList.add('graphics-failed');
  errors.push('Video skipped: '+refused);
  const said = refused === 'saveData'
   ? 'Your browser asked me to save data, so I did not load the twenty megabyte walk in. The desk is one tap away.'
   : 'This connection is slow, so I did not load the walk in. The desk is one tap away.';
  if(status)status.textContent=said;
  const note=document.getElementById('room-caption');
  if(note&&!note.dataset.failed){note.dataset.failed='1';const bq=document.createElement('b');bq.className='room-fallback';bq.textContent=said;note.prepend(bq);}
  draw();return;
 }
 videoTimer=setTimeout(videoFailure,12000);film.src=videoSource();film.load();
}

let corpusData=null;
function buildDesktop(){
 if(desktop||!corpusData)return desktop;
 desktop=createDesktop(root,corpusData,{leave});mounts++;window.__desk=desktop;root._showLogin?.();placement.inert=true;
 return desktop;
}
async function initialize(){
 try{const response=await fetch('/workspace/corpus.json');if(!response.ok)throw Error('Public record unavailable');const corpus=await response.json();corpusData=corpus;
  /* The corpus itself is read now, because the room's own counts and the
     machine label come out of it. The desktop is not: constructing it costs
     every app icon and the whole simulated OS before anyone has said they
     want to go in. */
  entry.focus({preventScroll:true});
 }catch(e){errors.push(e.message);status.textContent='Workspace could not load. Use Open workspace to try the direct route.';entry.disabled=true;return;}
 try{await poster.decode();document.body.classList.add('photo-ready');}
 catch(e){errors.push('Room image unavailable');graphicsFailed=true;document.body.classList.add('graphics-failed');status.textContent='Room image unavailable. The workspace remains available.';}
 progress=0;syncScroll(0);draw();miniCopy(corpusData);placeMini();paintInvitation();paintLive();liveWeather();loadNow();setInterval(paintLive,20000);setInterval(loadNow,60000);addEventListener('resize',()=>paintInvitation(),{passive:true});requestAnimationFrame(()=>miniMarker?.classList.add('on'));if(!motionOff())loadVideo();if(params.get('p'))go(Number(params.get('p')),{instant:true});
}
window.__spatial={ready:false,go,snapshot,dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);abort.abort();clearTimeout(videoTimer);seeks.stop();film.pause();film.removeAttribute('src');film.load();desktop?.dispose();document.documentElement.style.overflowY='';}};
initialize().then(()=>{window.__spatial.ready=true;});
