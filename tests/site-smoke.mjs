import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const routes = {
  'index.html': ['about','trip-style','quick-access','latest-updates','dates','updates'],
  'hotel.html': ['kahou-experience','discuss','booking-info'],
  'schedule.html': ['schedule'],
  'budget.html': ['travel-budget','route-compare'],
  'packing.html': ['packing']
};
const pages=Object.fromEntries(Object.keys(routes).map(p=>[p,readFileSync(new URL('../'+p,import.meta.url),'utf8')]));
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
    assert.ok(pages[linked],name+' invalid link '+href);
    if(hash)assert.ok(pages[linked].includes('id="'+hash+'"'),name+' invalid anchor '+href);
  }
}
const js=readFileSync(new URL('../script.js',import.meta.url),'utf8');
const data=readFileSync(new URL('../trip-data.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
new Script(js,{filename:'script.js'});new Script(data,{filename:'trip-data.js'});
assert.match(js,/const prefix = 'family-trip-2026-v04-';/);
assert.match(css,/\.bottom-nav\s*\{position:fixed/);
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
console.log('PASS: pages, nav links, noindex, JavaScript, packing key');
