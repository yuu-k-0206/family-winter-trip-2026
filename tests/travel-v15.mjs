import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const context={window:{}};
for(const file of ['trip-data.js','travel-utils.js','mascot-roam.js']) runInNewContext(read(file),context);
const {TRIP_DATA:d,TRAVEL_UTILS:u,MASCOT_ROAM:r}=context.window;
const plain=value=>JSON.parse(JSON.stringify(value));
// All old facts survive, with only map IDs and new page metadata added.
const old={window:{}};runInNewContext(execFileSync('git',['show','5c2d1e8f2e7da6bc6e23f193e14d7eb4d871a9ce:trip-data.js'],{encoding:'utf8'}),old);
const current=plain(d);delete current.places;delete current.stamps;delete current.booking.roomLabel;delete current.guideNotes;
for(const day of current.drivePlan.schedules) for(const option of day.options) for(const stop of option.stops) delete stop.placeId;
assert.deepEqual(current,plain(old.window.TRIP_DATA),'preserve original travel data');
for(const [hour,expected] of [[0,'night'],[4,'night'],[5,'morning'],[9,'morning'],[10,'day'],[15,'day'],[16,'evening'],[17,'evening'],[18,'night'],[23,'night']]) {
  assert.equal(u.period(Date.parse('2026-12-09T'+String(hour).padStart(2,'0')+':00:00+09:00')),expected);
}
assert.equal(u.japanDay(Date.parse('2026-12-08T15:00:00Z')),'2026-12-09');
assert.equal(u.japanDay(Date.parse('2026-12-08T14:59:59Z')),'2026-12-08');
assert.equal(u.mapURL(''),null);assert.equal(u.mapURL(null),null);
for(const [id,place] of Object.entries(d.places)) {
  const url=new URL(u.mapURL(place.query));
  assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('query'),place.query,id);
}
for(const day of d.drivePlan.schedules) for(const option of day.options) for(const stop of option.stops) {
  if(stop.name==='花園周辺で夕食')assert.equal(stop.placeId,undefined,'unspecified restaurant has no guessed map');
  else assert.ok(d.places[stop.placeId],stop.name);
  if(stop.name.includes('（上り）'))assert.ok(d.places[stop.placeId].query.includes('上り'));
  if(stop.name.includes('（下り）'))assert.ok(d.places[stop.placeId].query.includes('下り'));
}
const ids=d.stamps.map(x=>x.id);
for(const raw of [null,'','{','null','[]','{"version":2,"collected":["bath"]}','{"version":1,"collected":"bath"}']) assert.deepEqual(plain(u.stampState(raw,ids)),[]);
assert.deepEqual(plain(u.stampState('{"version":1,"collected":["bath","bath","bogus",null,{},"meal"]}',ids)),['bath','meal']);
const days=u.guideDays(d);assert.equal(days.length,2);assert.ok(days[0].route.includes('魚沼'));assert.ok(days[1].route.includes('高速優先'));
assert.equal(days[0].stops.at(-1).time,d.booking.dinner.startTime);assert.equal(days[0].stops.at(-1).status,'予約指定');
assert.ok(days[1].stops.every(s=>s.status==='仮案'));
const viewport={width:390,height:844,top:64,bottom:770};
const zone={left:17,top:200,width:356,height:112};
const basic=r.plan(zone,viewport);assert.ok(basic);
for(const width of [320,375,390,720])for(const height of [390,568,812])for(const reverse of [false,true]) {
  const v={width,height,top:64,bottom:height-70},dockTop=height-156;
  const manual=r.manualPlan(v,dockTop,reverse);assert.ok(manual,'explicit call works without a playground');
  assert.ok(manual.corridor.top>=v.top&&manual.corridor.bottom<dockTop,'keep header and fixed controls clear');
}
assert.equal(r.manualPlan({width:320,height:200,top:64,bottom:130},90),null,'unusable viewport cannot draw outside the screen');
assert.equal(r.plan({...zone,width:120},viewport),null,'narrow zone');
assert.equal(r.plan({...zone,height:50},viewport),null,'short zone');
assert.equal(r.plan({...zone,top:740},viewport),null,'bottom navigation');
assert.equal(r.plan({...zone,top:30},viewport),null,'sticky header');
assert.equal(r.plan({...zone,left:-5},viewport),null,'offscreen');
assert.equal(r.plan(zone,viewport,[{left:180,right:200,top:200,bottom:310}]),null,'path blocked between clear endpoints');
assert.ok(r.plan(zone,viewport,[{left:0,right:5,top:0,bottom:5}]));
for(let width=320;width<=1440;width+=40)for(const reverse of [false,true]) {
  const v={width,height:844,top:64,bottom:770},z={left:17,top:200,width:width-34,height:112};
  const p=r.plan(z,v,[],reverse);assert.ok(p);
  for(const path of p.paths)for(let n=1;n<path.length;n++)for(let t=0;t<=1;t+=.1){
    const x=path[n-1].x+(path[n].x-path[n-1].x)*t,y=path[n-1].y+(path[n].y-path[n-1].y)*t;
    assert.ok(x>=p.corridor.left-.001&&x+p.width<=p.corridor.right+.001);
    assert.ok(y>=p.corridor.top-.001&&y+p.height<=p.corridor.bottom+.001);
  }
}
for(const page of ['index','hotel','schedule','budget','packing','stamps','guide']) {
  const html=read(page+'.html');assert.match(html,/<meta name="robots" content="noindex, nofollow">/);
  for(const [,path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(https?:|mailto:|tel:)/.test(path))continue;
    const file=path.split(/[?#]/)[0];assert.ok(existsSync(new URL('../'+file,import.meta.url)),page+': '+file);
  }
}
console.log('PASS: preserved original facts, JST scenery boundaries, map encoding/directions, stamp recovery, guide data, route collision/corridor sampling, and seven-page assets');
