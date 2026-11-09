import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const context = { window: {} };
runInNewContext(readFileSync(new URL('../mascot-scenes.js', import.meta.url), 'utf8'), context);
const { create, SCENES, MIN_DELAY_MS, MAX_DELAY_MS, DURATION_MS } = context.window.MASCOT_SCENES;
assert.equal(SCENES.join(','), 'glance,poke,cheer');
assert.equal(MIN_DELAY_MS, 5000);
assert.equal(MAX_DELAY_MS, 5000);
assert.equal(DURATION_MS, 2200);

function clock(random = () => 0) {
  let now = 0, nextId = 0;
  const tasks = new Map(), events = [];
  const controller = create({
    onScene: scene => events.push({ at: now, scene }),
    random,
    setTimer(fn, ms) {
      const id = ++nextId;
      tasks.set(id, { fn, at: now + ms });
      return id;
    },
    clearTimer(id) { tasks.delete(id); }
  });
  return {
    controller, events,
    get now() { return now; },
    get timers() { return tasks.size; },
    advance(ms) {
      const end = now + ms;
      while (true) {
        const list = [...tasks].sort((a, b) => a[1].at - b[1].at);
        if (!list.length || list[0][1].at > end) break;
        const [id, task] = list[0];
        tasks.delete(id);
        now = task.at;
        task.fn();
      }
      now = end;
    }
  };
}
const c = clock();
c.controller.start();
c.controller.start();
assert.equal(c.timers, 1, 'start is idempotent');
c.advance(4999);
assert.equal(c.events.length, 0);
c.advance(1);
assert.deepEqual(c.events.map(e => e.scene), ['glance']);
assert.equal(c.events[0].at, 5000, 'min random value must also wait exactly 5s');
c.advance(2199);
assert.equal(c.events.length, 1);
c.advance(1);
assert.deepEqual(c.events.map(e => e.scene), ['glance', null]);
c.advance(5000);
assert.deepEqual(c.events.map(e => e.scene), ['glance', null, 'poke']);
c.controller.interrupt();
assert.equal(c.events.at(-1).scene, null);
assert.equal(c.timers, 1);
c.advance(5000);
assert.equal(c.events.at(-1).scene, 'glance');
c.controller.stop();
assert.equal(c.events.at(-1).scene, null);
assert.equal(c.timers, 0);
c.advance(100000);
assert.equal(c.events.at(-1).scene, null, 'stopped scene stays stopped');
c.controller.start();
assert.equal(c.timers, 1);
c.controller.stop();

const high = clock(() => 0.99999999);
high.controller.start();
high.advance(4999);
assert.equal(high.events.length, 0);
high.advance(1);
assert.equal(high.events[0].scene, 'cheer');
assert.equal(high.events[0].at, 5000, 'max random value must still wait exactly 5s');
high.controller.stop();
assert.equal(high.timers, 0);

const mid = clock(() => 0.5);
mid.controller.start();
mid.advance(4999);
assert.equal(mid.events.length, 0);
mid.advance(1);
assert.equal(mid.events[0].at, 5000, 'middle random value must wait exactly 5s');
mid.controller.stop();

const variety = clock(() => 0.5);
variety.controller.start();
for (let i = 0; i < 8; i++) variety.advance(5000 + 2200);
const names = variety.events.filter(e => e.scene).map(e => e.scene);
assert.equal(names.length, 8);
assert.ok(names.every((name, i) => i === 0 || name !== names[i - 1]), 'no consecutive repeats');
assert.ok(names.every(name => SCENES.includes(name)));
variety.controller.stop();
console.log('PASS: fixed 5s interval, 2.2s duration, variety, tap interruption, restart, stop, timer cleanup');
