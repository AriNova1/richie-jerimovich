import {WindowMotion} from './fable-r1.js';

// The desktop owns content and focus. This adapter owns only a window's geometry and gestures.
// C3: generalised from Codex's finder-host.mjs (C1) to every window; the engine (fable-r1.js) is unchanged.
export function mountWindowMotion(w, {root, raise, announce}) {
  const appName=(w.getAttribute('aria-label')||'window').replace(/ window$/,'');
  const events=new AbortController(), signal=events.signal;
  const title=w.querySelector('.mac-titlebar'), resizer=w.querySelector('.window-resizer');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const preview=document.createElement('div');preview.className='snap-preview';preview.dataset.for=w.dataset.appId||'';preview.setAttribute('aria-hidden','true');w.parentElement.append(preview);
  let ctl=null, frame=0, last=0, pointer=null, resizing=null, dead=false, suspended=false, wasNarrow=null, savedRect=null;
  const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal});
  const stage=()=>({w:root.clientWidth,h:root.clientHeight});
  const narrow=()=>root.clientWidth<=650;
  const safe=()=>({top:32,bottom:96});
  function point(ev) {const r=root.getBoundingClientRect();return{x:(ev.clientX-r.left)*root.clientWidth/r.width,y:(ev.clientY-r.top)*root.clientHeight/r.height};}
  function visible(){return !dead&&!suspended&&!document.hidden&&!w.hidden&&root.getClientRects().length>0;}
  function wake(){if(ctl&&visible()&&!frame){last=0;frame=requestAnimationFrame(tick);}}
  function tick(t){frame=0;if(!ctl||!visible())return;ctl.step(last?Math.min((t-last)/1000,.05):1/60);last=t;if(ctl.moving||ctl.grabbed||ctl.phase!=='rest')frame=requestAnimationFrame(tick);}
  function showPreview(zone,rect){preview.classList.toggle('on',Boolean(zone&&rect));if(rect){Object.assign(preview.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px',zIndex:String(Number(w.style.zIndex||1)-1)});}}
  function captureEnd(cancel=false){
    if(pointer!==null){const id=pointer;pointer=null;if(cancel)ctl?.cancel();else ctl?.release();if(title.hasPointerCapture(id))title.releasePointerCapture(id);}
    if(resizing){const r=resizing;resizing=null;if(cancel)ctl?.setRect(r.home);if(resizer.hasPointerCapture(r.id))resizer.releasePointerCapture(r.id);}
    wake();
  }
  function constrain(r){const s=stage();const width=Math.min(r.w,s.w-16),height=Math.min(r.h,s.h-136);return{x:Math.max(8,Math.min(s.w-width-8,r.x)),y:Math.max(40,Math.min(s.h-height-96,r.y)),w:Math.max(1,width),h:Math.max(1,height)};}
  function layout(){
    if(dead)return;
    const small=narrow();
    if(small!==wasNarrow){
      captureEnd(true);if(frame)cancelAnimationFrame(frame);frame=0;
      if(ctl){savedRect=ctl.state.floating;ctl.destroy();ctl=null;}
      w.classList.remove('motion-window','is-tiled','is-zoomed','is-lifted','maximized');
      for(const k of ['left','top','right','bottom','width','height','transform'])w.style[k]='';
      w.style.removeProperty('--lift');w.removeAttribute('data-phase');
      wasNarrow=small;w.classList.toggle('motion-sheet',small);resizer.hidden=small;title.tabIndex=small?-1:0;
      if(!small){
        const initial=constrain(savedRect||{x:w.offsetLeft,y:w.offsetTop,w:w.offsetWidth,h:w.offsetHeight});
        w.classList.add('motion-window');
        ctl=new WindowMotion(w,{stage,safe,reduced:()=>reduced.matches,thirds:()=>false,raise,onPreview:showPreview,announce},initial);
      }
    }else if(ctl){
      captureEnd(true);
      if(ctl.tiled||ctl.zoomed)ctl.relayout();
      else {const r=ctl.rect,c=constrain(r);if(Object.keys(c).some(k=>c[k]!==r[k]))ctl.setRect(c);}
    }
    wake();
  }
  title.setAttribute('aria-label',`Move ${appName} window`);
  title.setAttribute('aria-description','Drag to move. Control Option arrow keys tile or restore. Escape cancels the current move.');
  on(title,'pointerdown',ev=>{
    if(!ctl||ev.button!==0||ev.target.closest('button')||pointer!==null)return;
    ev.preventDefault();title.focus({preventScroll:true});const p=point(ev);ctl.press(p.x,p.y);pointer=ev.pointerId;title.setPointerCapture(pointer);lastMove=performance.now();wake();
  });
  let lastMove=0;
  on(title,'pointermove',ev=>{if(pointer!==ev.pointerId||!ctl)return;const p=point(ev),t=performance.now();ctl.move(p.x,p.y,Math.max(.001,(t-lastMove)/1000));lastMove=t;wake();});
  on(title,'pointerup',ev=>{if(pointer===ev.pointerId)captureEnd();});
  on(title,'pointercancel',ev=>{if(pointer===ev.pointerId)captureEnd(true);});
  on(title,'lostpointercapture',ev=>{if(pointer===ev.pointerId)captureEnd(true);});
  on(title,'dblclick',ev=>{if(ctl&&!ev.target.closest('button')){ctl.zoom();wake();}});
  on(w.querySelector('.maximize'),'click',()=>{if(ctl){ctl.zoom();wake();}});
  on(w,'keydown',ev=>{
    if(!ctl)return;
    if(ev.key==='Escape'&&(ctl.grabbed||resizing||ctl.state.flight)){
      ev.preventDefault();ev.stopPropagation();if(pointer!==null||resizing)captureEnd(true);else{ctl.cancel();wake();}return;
    }
    if(ev.target!==title||!ev.key.startsWith('Arrow'))return;
    if(ev.ctrlKey&&ev.altKey){ev.preventDefault();ev.stopPropagation();const z={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'fill'}[ev.key];if(z)ctl.snap(z);else ctl.restore();wake();}
  });
  function size(width,height){const r=ctl.rect,s=stage();ctl.setRect({...r,w:Math.max(1,Math.min(s.w-r.x-8,Math.max(360,width))),h:Math.max(1,Math.min(s.h-r.y-96,Math.max(260,height)))});wake();}
  on(resizer,'pointerdown',ev=>{if(!ctl||ev.button!==0)return;ev.preventDefault();captureEnd(true);const p=point(ev);const r=ctl.rect;ctl.setRect(r);resizing={id:ev.pointerId,p,home:r};resizer.setPointerCapture(ev.pointerId);});
  on(resizer,'pointermove',ev=>{if(resizing?.id!==ev.pointerId)return;const p=point(ev);size(resizing.home.w+p.x-resizing.p.x,resizing.home.h+p.y-resizing.p.y);});
  on(resizer,'pointerup',ev=>{if(resizing?.id===ev.pointerId)captureEnd();});
  on(resizer,'pointercancel',ev=>{if(resizing?.id===ev.pointerId)captureEnd(true);});
  on(resizer,'lostpointercapture',ev=>{if(resizing?.id===ev.pointerId)captureEnd(true);});
  on(resizer,'keydown',ev=>{if(!ctl||!ev.key.startsWith('Arrow'))return;ev.preventDefault();ev.stopPropagation();size(ctl.rect.w+(ev.key==='ArrowRight'?20:ev.key==='ArrowLeft'?-20:0),ctl.rect.h+(ev.key==='ArrowDown'?20:ev.key==='ArrowUp'?-20:0));});
  on(window,'blur',()=>captureEnd(true));
  on(window,'pagehide',()=>{suspended=true;captureEnd(true);if(frame)cancelAnimationFrame(frame);frame=0;});
  on(window,'pageshow',()=>{suspended=false;wake();});
  on(document,'visibilitychange',()=>{if(document.hidden){captureEnd(true);if(frame)cancelAnimationFrame(frame);frame=0;}else wake();});
  on(reduced,'change',()=>{if(ctl){captureEnd(true);if(ctl.tiled||ctl.zoomed)ctl.relayout();else ctl.setRect(ctl.target);wake();}});
  const geometry=new ResizeObserver(layout);geometry.observe(root);
  const hidden=new MutationObserver(()=>{if(w.hidden){captureEnd(true);showPreview(null);if(frame)cancelAnimationFrame(frame);frame=0;}else wake();});hidden.observe(w,{attributes:true,attributeFilter:['hidden']});
  layout();
  /* C5: restore a saved geometry: the floating rect first, then the tile or zoom identity on top of it, so a later restore returns to the right floating size. */
  function apply(g){
    if(!ctl||narrow()||!g)return;
    captureEnd(true);
    if(g.floating&&g.floating.w>0)ctl.setRect(constrain(g.floating));
    else if(g.rect&&g.rect.w>0)ctl.setRect(constrain(g.rect));
    if(g.tiled)ctl.snap(g.tiled); else if(g.zoomed)ctl.zoom();
    wake();
  }
  return {getState:()=>ctl?.state||{phase:'sheet'},setRect(r){if(ctl&&!narrow()){captureEnd(true);ctl.setRect(constrain(r));wake();}},apply,destroy(){if(dead)return;captureEnd(true);dead=true;events.abort();geometry.disconnect();hidden.disconnect();if(frame)cancelAnimationFrame(frame);ctl?.destroy();preview.remove();}};
}
