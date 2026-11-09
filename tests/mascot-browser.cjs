const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const evidence = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'mascot-dialogues-'));
 const server = http.createServer((req,res) => {
  const file=path.join(__dirname,'..',req.url.split('?')[0]);
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'text/plain');
  fs.readFile(file,(err,data)=>{res.statusCode=err?404:200;res.end(err?'Not found':data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const base = `http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH || undefined,args:process.env.BROWSER_SINGLE_PROCESS === '1' ? ['--no-zygote','--single-process'] : [],headless:true});
 try {
 const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{ Math.random=()=>0.5; });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-11-09T03:00:00Z')});
 const records=[];
 const pages=['index','hotel','schedule','budget','packing'];
 for (const width of [320,375,390,1280]) {
  await page.setViewportSize({width,height:812});
  for (const name of pages) {
   await page.goto(base+name+'.html');
   const button=page.getByRole('button',{name:'男の子と女の子に話しかける'});
   const bubble=page.locator('.trip-mascot-bubble');
   assert.equal(await bubble.isVisible(),false);
   await button.tap();
   assert.equal(await bubble.isVisible(),true);
   const text1=await page.locator('.trip-mascot-line').textContent();
   const state=await page.evaluate((name)=>{
    const root=document.querySelector('.trip-mascot'), b=root.querySelector('button'), talk=root.querySelector('.trip-mascot-bubble');
    const r=root.getBoundingClientRect(),br=b.getBoundingClientRect(),tr=talk.getBoundingClientRect(),nav=document.querySelector('.bottom-nav').getBoundingClientRect();
    const text=talk.querySelector('.trip-mascot-line').textContent;
    const expected=window.MASCOT_DIALOGUES.pages[name].find(l=>l.text===text);
    return { width:innerWidth, root:r.toJSON(),button:br.toJSON(),bubble:tr.toJSON(),nav:nav.toJSON(),labelExists:!!talk.querySelector('.trip-mascot-speaker'),speaker:expected?.speaker,storedSpeaker:talk.dataset.speaker,kind:talk.dataset.kind,animation:getComputedStyle(root.querySelector('.mascot-leg--left')).animationName,artwork:!!root.querySelector('svg .mascot-character--boy')&&!!root.querySelector('svg .mascot-character--girl'),overflow:document.documentElement.scrollWidth>innerWidth,transparentBubble:!root.contains(document.elementFromPoint(tr.x+10,tr.y+10)),transparentMargin:!root.contains(document.elementFromPoint(r.x+1,r.y+1)),touchAction:getComputedStyle(b).touchAction };
   },name);
   assert.ok(state.speaker);assert.equal(state.labelExists,false);assert.equal(state.storedSpeaker,state.speaker);assert.equal(await bubble.textContent(),text1);
   assert.equal(state.kind,'normal');assert.equal(state.overflow,false);
   assert.ok(state.bubble.x>=0&&state.bubble.right<=width&&state.bubble.y>=0);
   assert.ok(state.button.width>=44&&state.button.height>=44);
   assert.equal(state.transparentBubble,true);assert.equal(state.transparentMargin,true);
   assert.equal(state.touchAction,'manipulation');assert.equal(state.animation,'trip-mascot-swing-a');assert.equal(state.artwork,true);
   if(width<721)assert.ok(state.nav.top-state.root.bottom>=11.9);
   await button.tap();assert.notEqual(await page.locator('.trip-mascot-line').textContent(),text1);
   await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
   assert.equal((await page.locator('.trip-mascot').boundingBox()).y,state.root.y);
   records.push({page:name,...state});
   if(name==='packing'||name==='index') await page.screenshot({path:path.join(evidence,`${name}-${width}.png`)});
  }
 }
 console.log('PASS: 20 page/width combinations, speakers, hit areas, overflow, nav gap, scroll');
 await page.setViewportSize({width:375,height:812});
 await page.goto(base+'index.html');
 const button=page.getByRole('button',{name:'男の子と女の子に話しかける'}),bubble=page.locator('.trip-mascot-bubble');
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()) + 1000));
 // Rapid real taps: 9 is normal, the tenth is angry (no synthetic double counting).
 for(let i=0;i<9;i++)await button.tap();
 assert.equal(await bubble.getAttribute('data-kind'),'normal');
 await button.tap();assert.equal(await bubble.getAttribute('data-kind'),'anger');
 const angry=await bubble.textContent();
 for(let i=0;i<12;i++)await button.tap();
 assert.equal(await bubble.textContent(),angry);
 await page.screenshot({path:path.join(evidence,'anger-375.png')});
 await page.clock.runFor(3999);assert.equal(await bubble.isVisible(),true);
 await page.clock.runFor(1);assert.equal(await bubble.isVisible(),false);
 await button.tap();assert.equal(await bubble.getAttribute('data-kind'),'normal');
 for(let i=0;i<12;i++)await button.tap();assert.equal(await bubble.getAttribute('data-kind'),'normal');
 await page.clock.runFor(4000);
 for(let i=0;i<9;i++)await button.tap();assert.equal(await bubble.getAttribute('data-kind'),'normal');
 await button.tap();assert.equal(await bubble.getAttribute('data-kind'),'anger');assert.notEqual(await bubble.textContent(),angry);
 console.log('PASS: touch count, anger lock, timer, cooldown, repeated event');
 await page.goto(base+'hotel.html');
 await button.focus();await page.keyboard.press('Enter');assert.equal(await bubble.isVisible(),true);
 const keyboard1=await bubble.textContent();await page.keyboard.press('Space');assert.notEqual(await bubble.textContent(),keyboard1);
 // Replacing a line cancels its old timeout; latest click gets a full four seconds.
 await page.clock.runFor(3000);await button.tap();
 await page.clock.runFor(1000);assert.equal(await bubble.isVisible(),true);
 await page.clock.runFor(2999);assert.equal(await bubble.isVisible(),true);
 await page.clock.runFor(1);assert.equal(await bubble.isVisible(),false);
 await button.tap();await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await bubble.isVisible(),false);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.trip-mascot .mascot-leg--left').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('.bottom-nav').evaluate(e=>e.style.paddingBottom='39px');
 await page.waitForFunction(()=>Math.abs(document.querySelector('.bottom-nav').getBoundingClientRect().top-document.querySelector('.trip-mascot').getBoundingClientRect().bottom-12)<0.1);
 for(const name of ['schedule','budget','packing','index','hotel']){
  await page.locator(`.bottom-nav a[href="${name}.html"]`).click();await page.waitForURL('**/'+name+'.html');assert.equal(await button.count(),1);assert.equal(await bubble.isVisible(),false);
 }
 await page.goto(base+'index.html');assert.match(await page.locator('#trip-countdown').innerText(),/出発まであと30日/);
 await page.goto(base+'schedule.html');await page.locator('#tab2').click();assert.equal(await page.locator('#panel2').isVisible(),true);await page.locator('#tab2').press('ArrowLeft');assert.equal(await page.locator('#panel1').isVisible(),true);
 await page.goto(base+'packing.html');await page.locator('#checklist input').first().check();await page.reload();assert.equal(await page.locator('#checklist input').first().isChecked(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('family-trip-2026-v04-coat')),'1');await page.locator('#packing-reset').click();assert.equal(await page.locator('#checklist input:checked').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('family-trip-2026-v04-coat')),null);
 // Date integration uses the current TRIP_DATA on every click.
 await page.goto(base+'index.html');
 await page.evaluate(()=>window.MASCOT_DIALOGUES.settings.seasonalProbability=1);
 await button.tap();assert.equal(await page.locator('.trip-mascot-line').textContent(),'あと30日で旅行だよ！');
 await page.evaluate(()=>window.TRIP_DATA.departureDate='2026-11-10');await button.tap();assert.equal(await page.locator('.trip-mascot-line').textContent(),'あした旅行だー！！');
 // Automated pair scenes: first poke, then cheer at 7.5s wait (Math.random fixed to 0.5).
 await page.goto(base+'index.html');
 await page.clock.runFor(7500);
 assert.equal(await page.locator('.trip-mascot').getAttribute('data-mascot-scene'),'poke');
 await page.clock.runFor(2200);
 assert.equal(await page.locator('.trip-mascot').getAttribute('data-mascot-scene'),null);
 await page.clock.runFor(7500);
 assert.equal(await page.locator('.trip-mascot').getAttribute('data-mascot-scene'),'cheer');
 await page.getByRole('button',{name:'男の子と女の子に話しかける'}).tap();
 assert.equal(await page.locator('.trip-mascot').getAttribute('data-mascot-scene'),null);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.clock.runFor(30000);
 assert.equal(await page.locator('.trip-mascot').getAttribute('data-mascot-scene'),null);
 console.log('PASS: spontaneous scenes, interruption on tap, reduced-motion disables scenes');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({browser:await browser.version(),records,errors,behavior:'PASS'},null,2));
 console.log('PASS: keyboard, timer replacement, pagehide, reduced motion, nav resize, all navigation, countdown, tabs, storage/reset, changed date; zero JS errors');
 console.log('Evidence:',evidence);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
