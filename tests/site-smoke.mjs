import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const routes = {
  'index.html': ['about','trip-style','quick-access','latest-updates','dates','updates'],
  'hotel.html': ['kahou-experience','discuss','booking-info'],
  'schedule.html': ['schedule'],
  'budget.html': ['travel-budget','route-compare'],
  'packing.html': ['packing']
};
const pages=Object.fromEntries(Object.keys(routes).map(p=>[p,readFileSync(new URL('../'+p,import.meta.url),'utf8').replace(/\?v=\d+(?:\.\d+)+/g, '')]));
for(const [name,html] of Object.entries(pages)){
  assert.match(html,/<meta name="robots" content="noindex, nofollow">/,name+' noindex');
  assert.match(html,/<nav class="bottom-nav"/,name+' bottom navigation');
  assert.match(html,/<nav class="nav"/,name+' desktop navigation');
  assert.match(html,/<script defer src="trip-data.js"><\/script>/,name+' data');
  assert.match(html,/<script defer src="script.js"><\/script>/,name+' script');
  assert.equal((html.match(/aria-current="page"/g)||[]).length,2,name+' current page');
  assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length,name+' section count');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,name+' duplicate id');
  for(const id of routes[name])assert.ok(ids.includes(id),name+' section '+id);
  for(const target of Object.keys(routes))assert.ok(html.includes('href="'+target+'"'),name+' nav link '+target);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    if(/^(https?:|mailto:|tel:)/i.test(href)||href.endsWith('.css'))continue;
    const [target,hash]=href.split('#'),linked=target||name;
    if (target.endsWith('.svg')) {
      const asset = new URL('../' + target, import.meta.url);
      assert.ok(existsSync(asset), name+' missing SVG '+target);
      if (hash) assert.ok(readFileSync(asset,'utf8').includes('id="'+hash+'"'), name+' missing SVG symbol '+href);
      continue;
    }
    if (['guide.html','stamps.html'].includes(linked)) {
      const targetHTML=readFileSync(new URL('../'+linked,import.meta.url),'utf8');
      if(hash) assert.ok(targetHTML.includes('id="'+hash+'"'),name+' invalid new-page anchor '+href);
      continue;
    }
    assert.ok(pages[linked],name+' invalid link '+href);
    if(hash)assert.ok(pages[linked].includes('id="'+hash+'"'),name+' invalid anchor '+href);
  }
}
const js=readFileSync(new URL('../script.js',import.meta.url),'utf8');
const data=readFileSync(new URL('../trip-data.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
new Script(js,{filename:'script.js'});new Script(data,{filename:'trip-data.js'});
const sandbox = { window: {} };
new Script(data).runInNewContext(sandbox);
const p = sandbox.window.TRIP_DATA.booking.payment;
assert.equal(p.adultUnitYen * p.adultCount, 126500);
assert.equal(p.childUnitYen * p.childCount, 22000);
assert.equal(p.childCategory, '乳幼児（食事・寝具利用）');
assert.equal(p.subtotalYen, p.adultUnitYen * p.adultCount + p.childUnitYen * p.childCount);
assert.equal(p.cardChargeYen, p.subtotalYen - p.instantUseYen);
assert.equal(p.cardChargeYen, 126225);
const dinner = sandbox.window.TRIP_DATA.booking.dinner;
assert.equal(dinner.startTime, '18:00');
assert.match(dinner.note, /最も早い枠/);
assert.match(dinner.note, /変更可否/);
assert.equal(sandbox.window.TRIP_DATA.itinerary[0].steps.filter(x => x.bookingEvent === 'dinner').length, 1);
assert.equal(sandbox.window.TRIP_DATA.itinerary[1].steps.filter(x => x.bookingEvent === 'dinner').length, 0);
assert.match(pages['hotel.html'], /id="booking-dinner-start"/);
assert.match(js, /item.bookingEvent === 'dinner'/);
assert.match(pages['hotel.html'],/id="booking-payment-breakdown"/);
assert.match(pages['budget.html'],/id="budget-with-transport"/);
assert.match(js,/const prefix = 'family-trip-2026-v04-';/);
assert.match(css,/\.bottom-nav\s*\{position:fixed/);
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
console.log('PASS: pages, nav links, noindex, JavaScript, packing key, confirmed booking arithmetic and dinner at 18:00');
