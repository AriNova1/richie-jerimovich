import {createDesktop} from './mac.js';
import {SeekQueue} from './video-seek.mjs';

const $=s=>document.querySelector(s), clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const abort=new AbortController(),on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:abort.signal});
const placement=$('#desktop-placement'),root=$('#crt'),entry=$('#enter-room'),back=$('#return-room');
const status=$('#spatial-status'),poster=$('#poster'),film=$('#room-film');
history.scrollRestoration='manual';
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
on(entry,'click',()=>go(1));on(back,'click',leave);document.querySelectorAll('[data-stop]').forEach(b=>on(b,'click',()=>go(Number(b.dataset.stop))));
on($('#direct-entry'),'click',e=>{if(!desktop)return;e.preventDefault();bypassVideo=true;go(1,{instant:true});});
on(window,'scroll',()=>{if(owner!=='desktop'&&(commandedScrollY===null||Math.abs(scrollY-commandedScrollY)>1)){commandedScrollY=null;schedule();}},{passive:true});
on(window,'wheel',()=>{if(owner!=='desktop'){tween=null;commandedScrollY=null;}},{passive:true});on(window,'touchstart',()=>{if(owner!=='desktop'){tween=null;commandedScrollY=null;}},{passive:true});
on(window,'keydown',e=>{if(owner==='desktop'||e.target.closest('input,textarea,select'))return;if(e.key==='Escape'){e.preventDefault();go(0,{instant:true});}if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();go(progress<.4?.48:1,{instant:true});}if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();go(0,{instant:true});}});
on(window,'resize',()=>{if(owner==='desktop'){progress=1;draw()}else{syncScroll(progress);schedule();}});
on(document,'visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else schedule();});
on(reduce,'change',()=>{document.body.classList.toggle('motion-off',motionOff());if(motionOff()){tween=null;progress=owner==='desktop'?1:0;window.scrollTo(0,0);draw();}else {loadVideo();schedule();}});
on(film,'seeked',()=>seeks.complete(film.currentTime));
on(film,'loadeddata',()=>{clearTimeout(videoTimer);videoReady=true;document.body.classList.add('video-ready');seeks.enable(film.currentTime);schedule();});
function videoFailure(){clearTimeout(videoTimer);seeks.stop();videoReady=false;graphicsFailed=true;document.body.classList.add('graphics-failed');errors.push('Video unavailable; still/direct entrance active');draw();}
on(film,'error',videoFailure);
on($('#debug-progress'),'input',e=>go(Number(e.target.value),{instant:true}));

function loadVideo(){if(film.getAttribute('src'))return;videoTimer=setTimeout(videoFailure,12000);film.src='assets/video-pass-2/approach-1080.mp4';film.load();}

async function initialize(){
 try{const response=await fetch('/workspace/corpus.json');if(!response.ok)throw Error('Public record unavailable');const corpus=await response.json();desktop=createDesktop(root,corpus,{leave});mounts++;window.__desk=desktop;root._showLogin?.();placement.inert=true;entry.focus({preventScroll:true});
 }catch(e){errors.push(e.message);status.textContent='Workspace could not load. Use Open workspace to try the direct route.';entry.disabled=true;return;}
 try{await poster.decode();document.body.classList.add('photo-ready');}
 catch(e){errors.push('Room image unavailable');graphicsFailed=true;document.body.classList.add('graphics-failed');status.textContent='Room image unavailable. The workspace remains available.';}
 progress=0;syncScroll(0);draw();if(!motionOff())loadVideo();if(params.get('p'))go(Number(params.get('p')),{instant:true});
}
window.__spatial={ready:false,go,snapshot,dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);abort.abort();clearTimeout(videoTimer);seeks.stop();film.pause();film.removeAttribute('src');film.load();desktop?.dispose();document.documentElement.style.overflowY='';}};
initialize().then(()=>{window.__spatial.ready=true;});
