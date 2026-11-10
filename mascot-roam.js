/* Automatic excursions use empty playgrounds; explicit calls may cross content. */
(() => {
  'use strict';
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  function plan(zone, viewport, obstacles = [], reverse = false) {
    if (![zone.left,zone.top,zone.width,zone.height,viewport.width,viewport.height].every(Number.isFinite)) return null;
    const box = {left:zone.left+8,top:zone.top+8,right:zone.left+zone.width-8,bottom:zone.top+zone.height-8};
    if (box.left < 8 || box.right > viewport.width-8 || box.top < viewport.top+8 || box.bottom > viewport.bottom-8 || zone.width < 180 || zone.height < 88) return null;
    // Checking the entire corridor protects every interpolated frame, not only endpoints.
    if (obstacles.some(rect => intersects(box, rect))) return null;
    const height = Math.min(82, box.bottom-box.top-4), width = height*0.48;
    const span = box.right-box.left-width;
    const ground = box.bottom-height;
    const hop = Math.min(14, Math.max(0, ground-box.top));
    const path = (follower) => {
      const positions = follower ? [0,.12,.34,.60,.50,.78,1] : [0,.24,.52,.70,.60,.90,1];
      return positions.map((portion,i) => ({
        offset: [0,.16,.34,.50,.65,.84,1][i],
        x: box.left+(reverse?1-portion:portion)*span,
        y: ground-((i === (follower?3:2) || i === 5) ? hop : 0),
        opacity: i === 0 || i === 6 ? 0 : 1
      }));
    };
    return {width,height,paths:[path(false),path(true)],corridor:box};
  }
  function manualPlan(viewport, dockTop = viewport.bottom, reverse = false) {
    // Only an explicit call may overlay reading content. Keep the navigation,
    // fixed call button and right-hand talk control below the running lane.
    const bottom = Math.min(viewport.bottom, dockTop) - 12;
    const height = Math.min(112, bottom - viewport.top - 16);
    return plan({left:12,top:bottom-height,width:viewport.width-24,height},viewport,[],reverse);
  }

  function create({mascot,sprite,sceneController,updateScenes,reduced,hideBubble}) {
    if (!Element.prototype.animate) return null;
    let enabled = true, timer, active = false, animations = [], visitors = [], turn = 0, closed = false;
    let lastZone = null;
    try { enabled = localStorage.getItem('family-trip-roaming') !== 'off'; } catch (_) {}
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'roam-toggle';
    const play = document.createElement('button'); play.type = 'button'; play.className = 'roam-preview'; play.textContent = '2人を呼んでみる';
    const status = document.createElement('span'); status.className = 'roam-status'; status.setAttribute('role','status');
    const controls = document.createElement('div'); controls.className = 'wrap roam-controls';
    controls.append(toggle,play,status);
    const footer = document.querySelector('footer'); footer?.before(controls);
    // Anchor to the navigation itself: its measured height and safe-area padding
    // can change without moving this button into the Home link's tap target.
    const nav = document.querySelector('.bottom-nav');
    const fixedPlay = document.createElement('button'); fixedPlay.type = 'button';
    fixedPlay.className = 'roam-fixed-call'; fixedPlay.textContent = '2人を呼ぶ';
    const fixedStatus = document.createElement('span'); fixedStatus.className = 'roam-call-status';
    fixedStatus.setAttribute('role','status'); fixedStatus.setAttribute('aria-atomic','true');
    nav?.append(fixedPlay,fixedStatus);
    // Empty playgrounds at the top, between long sections, and before the footer.
    const makeZone = () => {
      const zone = document.createElement('div'); zone.className = 'mascot-playground wrap'; zone.dataset.mascotPlayground = '';
      zone.setAttribute('aria-hidden','true'); return zone;
    };
    const main = document.querySelector('main');
    if (main) {
      main.before(makeZone());
      const sections=main.querySelectorAll(':scope > section');
      if(sections.length>2) sections[Math.floor(sections.length/2)-1].after(makeZone());
    }
    const bottomZone = makeZone(); controls.before(bottomZone);
    const call = document.createElement('span'); call.className = 'trip-mascot-call'; call.textContent = '2人を呼ぶ'; call.setAttribute('aria-hidden','true');
    mascot.querySelector('.trip-mascot-talk')?.append(call);

    const busy = () => document.hidden || closed || reduced?.matches || !enabled ||
      mascot.querySelector('.trip-mascot-bubble:not([hidden])') || mascot.contains(document.activeElement) ||
      document.activeElement?.matches('input,select,textarea,[contenteditable="true"]');
    const schedule = (delay = 22000) => {
      clearTimeout(timer);
      if (!document.hidden && !closed && enabled && !reduced?.matches) timer = setTimeout(() => start(),delay);
    };
    const finish = (reschedule = true) => {
      for (const animation of animations) animation.cancel(); animations=[];
      for (const visitor of visitors) visitor.remove(); visitors=[];
      active=false; mascot.classList.remove('is-roaming');
      if (status.textContent === '追いかけっこのはじまり！') status.textContent = '右下に戻ってきたよ。';
      if (fixedStatus.textContent === '追いかけっこのはじまり！') fixedStatus.textContent = '右下に戻ってきたよ。';
      if (closed) sceneController?.stop(); else updateScenes();
      if (reschedule) schedule();
    };
    const interrupt = () => { clearTimeout(timer); if (active) finish(false); schedule(); };
    const clone = (who, width, height) => {
      const visitor = document.createElement('div'); visitor.className = 'mascot-visitor'; visitor.setAttribute('aria-hidden','true');
      visitor.style.width = width+'px'; visitor.style.height=height+'px';
      const svg = sprite.querySelector('svg').cloneNode(true);
      // Namespaced definitions avoid duplicate IDs with the stationary pair.
      const prefix='roam-'+who+'-';
      svg.querySelectorAll('[id]').forEach(node => { node.id = prefix+node.id; });
      svg.querySelectorAll('use').forEach(node => { const href=node.getAttribute('href'); if(href?.startsWith('#')) node.setAttribute('href','#'+prefix+href.slice(1)); });
      svg.querySelector('.mascot-character--'+(who==='boy'?'girl':'boy'))?.remove();
      svg.setAttribute('viewBox',who==='boy'?'12 0 54 112':'73 0 54 112');
      visitor.append(svg); document.body.append(visitor); return visitor;
    };
    const measureViewport = () => {
      const vv=window.visualViewport;
      const header=document.querySelector('header'), nav=document.querySelector('.bottom-nav');
      const headerRect=header?.getBoundingClientRect(), navRect=nav?.getBoundingClientRect();
      const viewport={width:document.documentElement.clientWidth,height:window.innerHeight,top:vv?.offsetTop||0,bottom:(vv?.offsetTop||0)+(vv?.height||window.innerHeight)};
      if(headerRect?.top===0) viewport.top=Math.max(viewport.top,headerRect.bottom);
      if(navRect?.height>0) viewport.bottom=Math.min(viewport.bottom,navRect.top);
      return viewport;
    };
    const selectManualPlan = () => {
      const viewport=measureViewport();
      const dockTop=Math.min(viewport.bottom,...[mascot,fixedPlay].map(node=>node.getBoundingClientRect()).filter(rect=>rect.width>0&&rect.height>0).map(rect=>rect.top));
      const result=manualPlan(viewport,dockTop,turn%2===1);
      return result?{result,zone:null}:null;
    };
    const selectPlan = (preferred) => {
      const viewport=measureViewport();
      const obstacleNodes=[...document.querySelectorAll('a,button,input,select,textarea,summary,header,.bottom-nav,.art-note')].filter(node=>!mascot.contains(node));
      const obstacles=obstacleNodes.map(node=>node.getBoundingClientRect()).filter(rect=>rect.width>0 && rect.height>0);
      const zones=preferred?[preferred]:[...document.querySelectorAll('[data-mascot-playground]'),document.getElementById('winter-scenery')].filter(Boolean);
      // Rotate among visible zones; safety wins over variety.
      if(zones.length>1 && zones[0]===lastZone) zones.push(zones.shift());
      for(const zone of zones) {
        const rect=zone.getBoundingClientRect();
        const area={left:rect.left,top:rect.top,width:rect.width,height:rect.height};
        if(zone.id==='winter-scenery') {area.top+=12;area.height-=48;}
        const result=plan(area,viewport,obstacles,turn%2===1);
        if(result) return {result,zone};
      }
      return null;
    };
    function start(preferred, allowOverlay = false) {
      clearTimeout(timer);
      if (busy() || active) { schedule(); return false; }
      const chosen=selectPlan(preferred)||(allowOverlay?selectManualPlan():null);
      if(!chosen) { schedule(12000); return false; }
      lastZone=chosen.zone; const p=chosen.result;
      active=true; mascot.classList.add('is-roaming'); sceneController?.stop();
      const people=turn++%2 ? ['girl','boy'] : ['boy','girl'];
      visitors=people.map(who=>clone(who,p.width,p.height));
      animations=visitors.map((visitor,i)=>visitor.animate(p.paths[i].map(frame=>({offset:frame.offset,transform:`translate(${frame.x}px, ${frame.y}px)`,opacity:frame.opacity})),{duration:6200,easing:'ease-in-out',fill:'both'}));
      const current=animations;
      Promise.all(animations.map(animation=>animation.finished)).then(()=>{if(animations===current) finish();}).catch(()=>{});
      return true;
    }
    const refresh = () => {
      toggle.textContent=reduced?.matches?'おさんぽ：端末設定で停止':enabled?'おさんぽ：オン':'おさんぽ：オフ';
      toggle.setAttribute('aria-pressed',String(enabled&&!reduced?.matches)); toggle.disabled=Boolean(reduced?.matches);
      play.disabled=!enabled||Boolean(reduced?.matches);
      fixedPlay.disabled=play.disabled;
      fixedPlay.setAttribute('aria-label',reduced?.matches?'2人を呼ぶ（端末の設定で停止中）':enabled?'2人を呼ぶ':'2人を呼ぶ（おさんぽがオフです）');
    };
    toggle.addEventListener('click',()=>{
      enabled=!enabled;try{localStorage.setItem('family-trip-roaming',enabled?'on':'off');}catch(_){}
      interrupt();refresh();status.textContent=enabled?'余白で、ときどき遊びます。':'右下でおとなしく待っています。';
    });
    play.addEventListener('click',()=>{
      interrupt();status.textContent=start(bottomZone)?'追いかけっこのはじまり！':'上の余白が画面に入るように少しスクロールして、もう一度呼んでね。';
    });
    fixedPlay.addEventListener('click',()=>{
      interrupt(); hideBubble?.();
      // Explicit permission to run over content; scrolling and other input still
      // interrupt immediately, and visitors never intercept pointer input.
      fixedStatus.textContent=start(undefined,true)?'追いかけっこのはじまり！':'画面を少し広げて、もう一度呼んでね。';
    });
    for(const name of ['scroll','resize']) window.addEventListener(name,interrupt,{passive:true});
    for(const name of ['pointerdown','keydown','focusin']) document.addEventListener(name,interrupt,{passive:true});
    document.addEventListener('visibilitychange',interrupt);
    window.visualViewport?.addEventListener('resize',interrupt);
    window.visualViewport?.addEventListener('scroll',interrupt);
    if ('ResizeObserver' in window) {
      const layoutObserver = new ResizeObserver(interrupt);
      layoutObserver.observe(document.body);
      if (nav) layoutObserver.observe(nav);
    }
    window.addEventListener('pagehide',()=>{closed=true;clearTimeout(timer);finish(false);});
    window.addEventListener('pageshow',()=>{closed=false;schedule(10000);});
    window.addEventListener('beforeprint',()=>{closed=true;clearTimeout(timer);finish(false);});
    window.addEventListener('afterprint',()=>{closed=false;schedule();});
    if(reduced?.addEventListener) reduced.addEventListener('change',()=>{interrupt();refresh();});
    else reduced?.addListener(()=>{interrupt();refresh();});
    refresh();schedule(10000);
    return {interrupt,isActive:()=>active};
  }
  window.MASCOT_ROAM = Object.freeze({plan,manualPlan,intersects,create});
})();
