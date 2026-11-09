import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const context = { window: {} };
for (const file of ['mascot-dialogues.js', 'mascot-conversation.js']) {
  runInNewContext(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), context);
}
const data = context.window.MASCOT_DIALOGUES;
const { create, remainingDays } = context.window.MASCOT_CONVERSATION;
const utc = Date.parse;
const today = utc('2026-11-09T03:00:00Z');
const make = (options = {}) => create({ data, page: 'index', departureDate: () => null, random: () => 0, ...options });
assert.equal(Object.keys(data.pages).length, 5);
for (const [page, lines] of Object.entries(data.pages)) {
  assert.equal(lines.length, 10);
  assert.equal(new Set(lines.map(l => l.text)).size, 10);
  let index = 0;
  const c = make({ page, random: () => (index++ % 10) / 10 });
  let previous;
  for (let i = 0; i < 100; i++) {
    const line = c.tap(i * 4000, today);
    assert.ok(lines.some(l => l.text === line.text && l.speaker === line.speaker));
    assert.notEqual(line.text, previous);
    previous = line.text;
  }
}
assert.equal(data.anger.length, 24);
assert.equal(data.anger.filter(l => l.speaker === 'boy').length, 12);
assert.equal(data.anger.filter(l => l.speaker === 'girl').length, 12);
assert.equal(new Set(data.anger.map(l => l.text)).size, 24);
assert.equal(data.seasonal.length, 6);
for (const line of [...Object.values(data.pages).flat(), ...data.anger, ...data.seasonal]) {
  assert.ok(['boy', 'girl'].includes(line.speaker)); assert.ok(line.text);
}
// Exactly 9 versus 10 activations; lock and cooldown boundaries are relative to trigger.
const c = make();
for (let i = 0; i < 9; i++) assert.equal(c.tap(i * 100, today).kind, 'normal');
const anger = c.tap(900, today);
assert.equal(anger.kind, 'anger');
for (const time of [901, 1000, 3000, 4899]) assert.equal(c.tap(time, today), null);
assert.equal(c.tap(4900, today).kind, 'normal');
for (let i = 0; i < 30; i++) assert.equal(c.tap(5000 + i * 100, today).kind, 'normal');
assert.equal(c.tap(8899, today).kind, 'normal');
for (let i = 0; i < 9; i++) assert.equal(c.tap(8900 + i * 100, today).kind, 'normal');
const anger2 = c.tap(9800, today);
assert.equal(anger2.kind, 'anger'); assert.notEqual(anger2.text, anger.text);
// Window includes exactly 3000ms, not 3001ms.
for (const [end, expected] of [[3000, 'anger'], [3001, 'normal']]) {
  const model = make();
  for (let i = 0; i < 9; i++) model.tap(i * 10, today);
  assert.equal(model.tap(end, today).kind, expected);
}
const spaced = make();
for (let i = 0; i < 100; i++) assert.equal(spaced.tap(i * 400, today).kind, 'normal');
const reset = make();
for (let i = 0; i < 9; i++) reset.tap(i * 10, today);
reset.resetTaps(); assert.equal(reset.tap(100, today).kind, 'normal');
// All 24 angry lines are reachable, including the last entry.
for (let index = 0; index < 24; index++) {
  const model = make({ random: () => (index + 0.1) / 24 });
  let line;
  for (let i = 0; i < 10; i++) line = model.tap(i, today);
  assert.equal(line.text, data.anger[index].text);
}
const dates = [
  ['2026-11-08T15:00:00Z', 30, 'あと30日で旅行だよ！'],
  ['2026-11-08T14:59:59Z', 31, null],
  ['2026-12-01T03:00:00Z', 8, 'あと8日で旅行だよ！'],
  ['2026-12-02T03:00:00Z', 7, 'もうすぐだー！'],
  ['2026-12-07T03:00:00Z', 2, 'もうすぐだー！'],
  ['2026-12-07T15:00:00Z', 1, 'あした旅行だー！！'],
  ['2026-12-08T15:00:00Z', 0, 'いよいよ今日だね！'],
  ['2026-12-09T15:00:00Z', -1, '今日もいっぱい遊ぼ！'],
  ['2026-12-10T15:00:00Z', -2, 'またみんなで行こうね！']
];
for (const [date, days, text] of dates) {
  assert.equal(remainingDays('2026-12-09', utc(date)), days);
  const model = make({ departureDate: () => '2026-12-09' });
  const line = model.tap(0, utc(date));
  assert.equal(line.kind, text ? 'seasonal' : 'normal');
  if (text) assert.equal(line.text, text);
  assert.notEqual(model.tap(1, utc(date)).text, line.text, 'no repeated seasonal line');
}
for (const invalid of [null, undefined, '', '2026-02-30', '2026-13-01', '0000-01-01', '2026-2-09', 'invalid', 123]) {
  assert.equal(remainingDays(invalid, today), null);
  assert.equal(make({ departureDate: () => invalid }).tap(0, today).kind, 'normal');
}
let departure = '2026-12-09';
const updated = make({ departureDate: () => departure });
assert.equal(updated.tap(0, today).text, 'あと30日で旅行だよ！');
departure = '2026-11-10';
assert.equal(updated.tap(1, today).text, 'あした旅行だー！！');
// Probability threshold and anger priority over seasonal selection.
assert.equal(make({ departureDate: () => '2026-12-09', random: () => 0.1999 }).tap(0, today).kind, 'seasonal');
assert.equal(make({ departureDate: () => '2026-12-09', random: () => 0.2 }).tap(0, today).kind, 'normal');
const priority = make({ departureDate: () => '2026-12-09' });
for (let i = 0; i < 9; i++) priority.tap(i, today);
assert.equal(priority.tap(9, today).kind, 'anger');
console.log('PASS: 50 normal / 24 angry / 6 seasonal; pages/speakers/no repeats; 3000ms and 10 taps; 4s lock/8s cooldown; all date boundaries, JST midnight, invalid/changed dates, 20% threshold');
