// ブラウザの実時間に依存せず、案内の終了・フォーカス・タイマーを検証する。
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../mascot.js',import.meta.url),'utf8');
function fixture(page='index') {
  const timers=new Map(); let now=0,nextTimer=0;
  const doc={hidden:false,activeElement:null,events:{},addEventListener(name,fn){(this.events[name]??=[]).push(fn);}};
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.hidden=false;this.className='';this.hover=false;this.style={setProperty(){}};this.classList={toggle(){}};}
    append(...children){this.children.push(...children);}
    setAttribute(key,value){this.attrs[key]=String(value);}
    addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
    fire(name,event={}){for(const fn of this.events[name]||[])fn(event);}
    contains(el){return el===this||this.children.some(child=>child.contains?.(el));}
    matches(selector){return selector===':hover'&&this.hover;}
    focus(){doc.activeElement=this;}
  }
  doc.body=new Element('body');
  doc.createElement=tag=>new Element(tag);
  doc.querySelector=selector=>selector==='.trip-mascot'?doc.body.children.find(el=>el.className==='trip-mascot')||null:null;
  const window={MASCOT_DIALOGUES:{settings:{displayMs:4000}},MASCOT_CONVERSATION:{create:()=>({tap:()=>({text:'旅へ行こう',speaker:'boy',kind:'normal'}),resetTaps(){}})},addEventListener(){}};
  runInNewContext(source,{document:doc,window,location:{pathname:'/'+page+'.html'},performance:{now:()=>now},Date,
    setTimeout(fn,delay){timers.set(++nextTimer,{at:now+delay,fn});return nextTimer;},clearTimeout(id){timers.delete(id);}});
  const root=doc.body.children[0],button=root.children.find(el=>el.className==='trip-mascot-talk'),bubble=root.children.find(el=>el.className==='trip-mascot-bubble');
  const [header,line,nav]=bubble.children,close=header.children[1];
  function tick(ms){const end=now+ms;while(true){const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=end;}
  return {doc,button,bubble,line,nav,close,tick,timers};
}
{
  const f=fixture();
  assert.equal(f.bubble.hidden,true);f.button.fire('click');
  assert.equal(f.button.attrs['aria-expanded'],'true');
  assert.equal(f.bubble.attrs.role,'region');assert.equal(f.line.attrs.role,'status');
  assert.equal(f.nav.attrs['aria-label'],'マスコットの案内');
  f.tick(3999);assert.equal(f.bubble.hidden,false);f.tick(1);assert.equal(f.bubble.hidden,true);
  assert.equal(f.button.attrs['aria-expanded'],'false');
  f.button.fire('click');f.tick(3000);f.button.fire('click');f.tick(1000);assert.equal(f.bubble.hidden,false);f.tick(3000);assert.equal(f.bubble.hidden,true);
}
{
  const f=fixture();f.button.fire('click');f.nav.children[0].focus();f.bubble.fire('focusin');f.tick(20000);
  assert.equal(f.bubble.hidden,false,'focused link must remain available');
  f.doc.events.keydown[0]({key:'Escape',preventDefault(){}});
  assert.equal(f.bubble.hidden,true);assert.equal(f.doc.activeElement,f.button);
  f.button.fire('click');f.bubble.hover=true;f.bubble.fire('pointerenter');f.tick(20000);assert.equal(f.bubble.hidden,false);
  f.bubble.hover=false;f.bubble.fire('pointerleave');f.tick(4000);assert.equal(f.bubble.hidden,true);
  f.button.fire('click');f.close.focus();f.close.fire('click');assert.equal(f.bubble.hidden,true);assert.equal(f.doc.activeElement,f.button);
}
{
  const f=fixture();f.button.fire('click');f.nav.children[0].focus();f.bubble.fire('focusin');f.button.focus();f.bubble.fire('focusout');f.tick(0);f.tick(3999);assert.equal(f.bubble.hidden,false);f.tick(1);assert.equal(f.bubble.hidden,true);
  f.button.fire('click');f.doc.hidden=true;for(const callback of f.doc.events.visibilitychange)callback();assert.equal(f.bubble.hidden,true);
}
for(const page of ['index','hotel','schedule','budget','packing']) {
  const f=fixture(page);assert.equal(f.nav.children.length,2);
  for(const link of f.nav.children) assert.match(link.href,/^(index|hotel|schedule|budget|packing)\.html(?:#[a-z-]+)?$/);
  f.button.fire('click');f.nav.children[0].focus();f.nav.children[0].fire('click');assert.equal(f.bubble.hidden,true);
}
console.log('PASS: guide live-region semantics, 4s timeout/replacement, focus/hover hold, focusout, Escape/close focus return, hidden-page cleanup, five-page navigation');
