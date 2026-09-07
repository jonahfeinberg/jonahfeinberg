/* A reversible, scroll-authored composition. Native HTML remains the source of truth.
   No rendering library, scroll interception, WebGL context, or perpetual animation loop. */
(() => {
  'use strict';
  const root = document.querySelector('.folio');
  if (!root) return;
  const stage = root.querySelector('.folio-stage');
  const cards = [...root.querySelectorAll('.folio-card')];
  const groups = [...root.querySelectorAll('.folio-group')];
  const chapters = [...root.querySelectorAll('[data-chapter]')];
  const title = root.querySelector('#folio-title');
  const description = root.querySelector('#folio-description');
  const modeButton = root.querySelector('#folio-mode');
  const explore = root.querySelector('#folio-explore');
  const mark = root.querySelector('.jf-sculpture');
  const pieces = [...mark.children];
  const line = root.querySelector('#folio-line');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const supports = window.CSS && CSS.supports('transform-style', 'preserve-3d') && CSS.supports('position', 'sticky') && typeof IntersectionObserver === 'function';
  const titles = ['Selected work.', 'Photography.', 'Websites.', 'Video.', 'Back to the beginning.'];
  const descriptions = ['Websites, photographs, and moving images.', 'Places, people, and the moments in between.', 'Some for clients, some for school, some for fun.', 'Trailers, personal pieces, and motion work.', 'A few things I make. More about me below.'];
  const destinations = [['/gallery/', 'Explore the gallery ↗'], ['/gallery/', 'Explore the gallery ↗'], ['/websites/', 'All website projects ↗'], ['/projects/', 'All video projects ↗'], ['#about', 'More about me ↓']];
  const paths = [
    [200,310,260,310,320,310,380,310,415,310,415,160,415,140,465,140,500,380,540,380,590,380,560,160,620,160,670,160,740,210,810,210],
    [35,345,105,340,125,160,225,165,325,170,320,300,440,305,525,310,570,115,660,155,735,190,780,305,850,275,915,248,935,200,975,205],
    [40,340,130,340,150,130,255,130,345,130,330,370,435,370,540,370,520,135,625,135,725,135,730,350,835,350,900,350,940,260,975,260],
    [25,310,90,310,155,310,215,310,280,310,345,310,405,310,470,310,535,310,595,310,660,310,725,310,785,310,850,310,915,310,975,310],
    [200,310,260,310,320,310,380,310,415,310,415,160,415,140,465,140,500,380,540,380,590,380,560,160,620,160,670,160,740,210,810,210]
  ];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a,b,t) => a + (b-a)*t;
  const ease = t => { t=clamp(t); return t*t*(3-2*t); };
  let spatial=false, listChosen=false, printing=false, visible=true, frame=0, last=0, active=-1;
  let width=1000, height=520, top=0, distance=1, targetScroll=0, scroll=0;
  const paper = document.querySelector('.page-wrapper');
  const grain = document.querySelector('.grain');
  let paperOffset = null;
  const updatePaper = () => {
    // Subtract only the sticky scene's scroll distance. The same coordinate
    // works forwards/backwards and never jumps when entering or leaving it.
    const held = spatial ? clamp(window.scrollY - top, 0, distance) : 0;
    const offset = -Math.round((window.scrollY - held) * 100) / 100;
    if (offset === paperOffset) return;
    paperOffset = offset;
    paper?.style.setProperty('--paper-offset', `${offset}px`);
    grain?.style.setProperty('--paper-offset', `${offset}px`);
  };
  const measurePaper = () => {
    paper?.style.setProperty('--paper-height', `${Math.max(innerHeight, document.documentElement.scrollHeight - (spatial ? distance : 0))}px`);
    updatePaper();
  };
  const mouse={x:0,y:0,tx:0,ty:0,vx:0,vy:0};
  let hovered=null, lift=0;
  // Decode small preview images ahead of the scene. Full films remain click-to-load.
  const media = new Map(cards.map(card => [card, {ready:false, appearance:0}]));
  let mediaStarted=false;
  const prepareMedia = () => {
    if(mediaStarted)return;
    mediaStarted=true;
    cards.forEach(card => {
      const state=media.get(card), img=card.querySelector('img');
      const ready=() => {state.ready=true;signal();};
      if(!img){ready();return;}
      const failed=() => {card.classList.add('asset-unavailable');ready();};
      const decode=() => {
        if(!img.naturalWidth){failed();return;}
        if(typeof img.decode==='function')img.decode().then(ready,ready);
        else ready();
      };
      img.addEventListener('load',decode,{once:true});
      img.addEventListener('error',failed,{once:true});
      img.loading='eager';
      if(img.complete)decode();
    });
  };
  const signal = () => { if(spatial && visible && !document.hidden && !frame) frame=requestAnimationFrame(tick); };
  const setChapter = index => {
    if(active===index) return;
    active=index;
    if(title) title.textContent=titles[index]; if(description) description.textContent=descriptions[index];
    explore.href=destinations[index][0]; explore.textContent=destinations[index][1];
    chapters.forEach((a,i)=>i===index?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current'));
    groups.forEach((group,i)=>{group.inert=spatial && index!==i+1; if(group.inert)group.setAttribute('aria-hidden','true');else group.removeAttribute('aria-hidden');});
    // An outgoing focused card must not remain the invisible keyboard target.
    const focused=document.activeElement;
    if(spatial && focused?.matches('.folio-card') && Number(focused.dataset.group)!==index) chapters[index].focus({preventScroll:true});
    if(hovered && Number(hovered.dataset.group)!==index) hovered=null;
  };
  const measure = () => {
    if(!spatial)return;
    const r=root.getBoundingClientRect();
    width=stage.clientWidth;height=stage.clientHeight;
    top=window.scrollY+r.top-(parseFloat(getComputedStyle(root.querySelector('.folio-sticky')).top)||82);
    distance=Math.max(1,root.offsetHeight-root.querySelector('.folio-sticky').offsetHeight);
    targetScroll=clamp((window.scrollY-top)/distance)*4;
    measurePaper();
    signal();
  };
  const pose = (group,i) => {
    if(compact.matches) return {x:[-.245,.245,-.245,.245][i],y:[-.235,-.235,.235,.235][i],z:[8,-10,10,0][i],rx:0,ry:[3,-3,2,-2][i],rz:group===1?[-3,3,-2,2][i]:0};
    if(group===1) return {x:[-.345,-.12,.13,.345][i],y:[.08,-.105,.035,-.07][i],z:[-45,55,0,-50][i],rx:[3,-3,2,-2][i],ry:[12,5,-5,-12][i],rz:[-7,-3,4,7][i]};
    if(group===2) return {x:[-.31,-.105,.13,.325][i],y:[-.13,.145,-.12,.14][i],z:[-60,15,55,-30][i],rx:[2,-2,2,-2][i],ry:[14,7,-7,-14][i],rz:[-3,-1,1,3][i]};
    return {x:[-.355,-.12,.12,.355][i],y:[-.08,.015,-.035,.055][i],z:[-45,10,40,-40][i],rx:0,ry:[12,5,-5,-12][i],rz:0};
  };
  const draw = () => {
    const segment=Math.min(3,Math.floor(scroll));
    const t=ease((scroll-segment-.13)/.74);
    const phase=segment+t;
    setChapter(Math.round(phase));
    cards.forEach(card=>{
      const group=Number(card.dataset.group),i=Number(card.dataset.card);
      const delta=phase-group;
      const openness=clamp(1-Math.abs(delta));
      const p=pose(group,i);
      const spread=ease(openness);
      const dir=delta>0?1:-1;
      const hovering=hovered===card;
      const neighbor=hovered && Number(hovered.dataset.group)===group && !hovering;
      const localLift=hovering?lift:0;
      const nudge=neighbor?(i-Number(hovered.dataset.card))*lift*.08:0;
      const depth=p.z*(compact.matches?.35:1);
      const x=mix(dir*(.07+i*.015),p.x,spread)*width+mouse.x*(9+depth*.035)+nudge;
      const y=mix((i-1.5)*.018,p.y,spread)*height+mouse.y*(5+depth*.025);
      const z=mix(-230,depth,spread)+localLift;
      const scale=mix(.16,1,spread);
      card.style.transform=`translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${(p.rx*spread-mouse.y*1.5).toFixed(2)}deg) rotateY(${(p.ry*spread+dir*(1-spread)*86+mouse.x*2).toFixed(2)}deg) rotateZ(${(p.rz*spread).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      // Visibility follows a continuous envelope rather than a hard entrance gate.
      const opacity=ease(openness/.55)*media.get(card).appearance;
      card.style.visibility=opacity>.0001?'visible':'hidden';
      card.style.opacity=opacity.toFixed(4);
      card.style.zIndex=String(Math.round(depth+100+localLift));
      card.style.pointerEvents=active===group && openness>.65 && media.get(card).ready?'auto':'none';
    });
    const folded=1-clamp(Math.min(phase,4-phase));
    const markScale=(compact.matches?.56:1)*mix(.6,1,folded);
    mark.style.transform=`translate(-50%,-50%) rotateX(${-9-mouse.y*2}deg) rotateY(${-16+mouse.x*3+(1-folded)*55}deg) scale(${markScale})`;
    mark.style.visibility=folded>.01?'visible':'hidden';
    pieces.forEach((piece,i)=>{piece.style.transform=`translate3d(${(i-1.5)*(1-folded)*140}px,${(i%2?1:-1)*(1-folded)*65}px,${-(1-folded)*200}px) rotateY(${(1-folded)*80}deg)`;piece.style.opacity=clamp(folded*5);});
    const a=paths[segment],b=paths[segment+1];
    const coords=a.map((v,i)=>mix(v,b[i],t).toFixed(2));
    line.setAttribute('d',`M ${coords.slice(0,2).join(' ')} C ${coords.slice(2).join(' ')}`);
    line.parentElement.style.transform=`translate(${mouse.x*3}px,${mouse.y*2}px)`;
  };
  function tick(now) {
    frame=0;
    if(!spatial || !visible || document.hidden){last=0;return;}
    const dt=Math.min((now-last)/16.67||1,2);last=now;
    scroll+=(targetScroll-scroll)*(1-Math.pow(.67,dt));
    // Damped spring only responds to pointer input; it settles completely at rest.
    for(const axis of ['x','y']){
      const v='v'+axis;
      mouse[v]+=(mouse['t'+axis]-mouse[axis])*.08*dt;
      mouse[v]*=Math.pow(.62,dt);mouse[axis]+=mouse[v]*dt;
    }
    const targetLift=hovered && pointer.matches?36:0;
    lift+=(targetLift-lift)*(1-Math.pow(.78,dt));
    let mediaMoving=false;
    media.forEach(state=>{
      if(!state.ready)return;
      state.appearance+=(1-state.appearance)*(1-Math.pow(.78,dt));
      if(state.appearance>.999)state.appearance=1;
      else mediaMoving=true;
    });
    draw();
    if(mediaMoving || Math.abs(targetScroll-scroll)>.0001 || Math.abs(mouse.tx-mouse.x)+Math.abs(mouse.ty-mouse.y)+Math.abs(mouse.vx)+Math.abs(mouse.vy)>.001 || Math.abs(targetLift-lift)>.02)signal();
    else last=0;
  }
  const configure = () => {
    const prior=spatial;
    spatial=!!(supports && !reduced.matches && !listChosen && !printing && innerHeight>=(compact.matches?720:640));
    root.classList.toggle('is-spatial',spatial);
    modeButton.hidden=!supports || reduced.matches || innerHeight<(compact.matches?720:640);
    modeButton.textContent=spatial?'View as list':'View scroll experience';
    if(!spatial){
      cancelAnimationFrame(frame);frame=0;active=-1;
      cards.forEach(c=>{c.removeAttribute('style');});
      groups.forEach(g=>{g.inert=false;g.removeAttribute('aria-hidden');});
      if(title) title.textContent='Selected work.';if(description) description.textContent=descriptions[0];
      chapters.forEach(a=>a.removeAttribute('aria-current'));
      explore.href='/gallery/';explore.textContent='Explore the gallery ↗';
    }else{
      active=-1;measure();scroll=targetScroll;draw();signal();
    }
    if(prior!==spatial) hovered=null;
    measurePaper();
  };
  modeButton.addEventListener('click',()=>{
    listChosen=spatial;configure();
    root.scrollIntoView({behavior:'instant',block:'start'});measure();
  });
  chapters.forEach(a=>a.addEventListener('click',e=>{
    if(!spatial)return;
    e.preventDefault();measure();
    const chapter=Number(a.dataset.chapter);
    window.scrollTo({top:top+distance*chapter/4,behavior:'smooth'});
  }));
  const onScroll=()=>{updatePaper();if(spatial){targetScroll=clamp((window.scrollY-top)/distance)*4;signal();}};
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{configure();measure();},{passive:true});
  reduced.addEventListener('change',configure);
  window.addEventListener('beforeprint',()=>{printing=true;configure();});
  window.addEventListener('afterprint',()=>{printing=false;configure();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}
    else{measure();signal();}
  });
  stage.addEventListener('pointermove',e=>{
    if(!spatial || !pointer.matches || e.pointerType==='touch')return;
    const r=stage.getBoundingClientRect();mouse.tx=clamp((e.clientX-r.left)/r.width*2-1,-1,1);mouse.ty=clamp((e.clientY-r.top)/r.height*2-1,-1,1);signal();
  });
  stage.addEventListener('pointerleave',()=>{mouse.tx=mouse.ty=0;hovered=null;signal();});
  cards.forEach(card=>{
    card.addEventListener('pointerenter',()=>{if(pointer.matches){hovered=card;signal();}});
    card.addEventListener('pointerleave',()=>{hovered=null;signal();});
    card.addEventListener('focus',()=>{hovered=card;signal();});
    card.addEventListener('blur',()=>{hovered=null;signal();});
    card.querySelector('img')?.addEventListener('error',()=>{card.classList.add('asset-unavailable');});
  });
  if(supports)new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible){measure();scroll=targetScroll;signal();}
    else{cancelAnimationFrame(frame);frame=0;last=0;}
  },{rootMargin:'150px'}).observe(root);
  if(supports){
    const mediaObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        prepareMedia();mediaObserver.disconnect();
      }
    },{rootMargin:'900px'});
    mediaObserver.observe(root);
  }
  // Native video playback loads no MP4 until the visitor chooses a film.
  const dialog=document.querySelector('.folio-dialog');
  const video=dialog.querySelector('video');
  let opener=null;
  cards.filter(c=>c.dataset.video).forEach(card=>card.addEventListener('click',e=>{
    if(typeof dialog.showModal!=='function')return; // ordinary MP4 link fallback
    e.preventDefault();opener=card;
    document.querySelector('#folio-film-title').textContent=card.dataset.title;
    dialog.querySelector('.folio-video-error').hidden=true;
    video.poster=card.querySelector('img').src;video.src=card.dataset.video;
    dialog.showModal();video.play().catch(()=>{/* native play control remains available */});
  }));
  dialog.querySelector('.folio-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();opener?.focus({preventScroll:true});});
  video.addEventListener('error',()=>{if(dialog.open)dialog.querySelector('.folio-video-error').hidden=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  document.body.classList.add('paper-scroll-ready');
  configure();
})();
