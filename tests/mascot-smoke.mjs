import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const pages = ['index.html', 'hotel.html', 'schedule.html', 'budget.html', 'packing.html'];
for (const page of pages) {
  const html = readFileSync(new URL('../' + page, import.meta.url), 'utf8');
  assert.equal(html.split('src="mascot.js"').length - 1, 1, page);
  assert.equal(html.split('href="mascot.css"').length - 1, 1, page);
}

const source = readFileSync(new URL('../mascot.js', import.meta.url), 'utf8');
function initialize({ observer = true, navPresent = true, hidden = false } = {}) {
  let navHeight = 104;
  const appended = [];
  const documentEvents = {};
  const windowEvents = {};
  let observed;
  let observedBox;
  let resizeObserverCallback;
  const nav = { getBoundingClientRect: () => ({ height: navHeight }) };
  const doc = {
    hidden,
    body: { append: element => appended.push(element) },
    querySelector: selector => selector === '.bottom-nav' ? (navPresent ? nav : null) : appended[0] || null,
    createElement: tag => ({
      tag, children: [], attributes: {}, properties: {}, classes: new Set(),
      append(child) { this.children.push(child); },
      setAttribute(name, value) { this.attributes[name] = value; },
      style: { setProperty(name, value) { appended[0].properties[name] = value; } },
      classList: { toggle(name, enabled) { if (enabled) appended[0].classes.add(name); else appended[0].classes.delete(name); } }
    }),
    addEventListener: (name, callback) => { documentEvents[name] = callback; }
  };
  const window = { addEventListener: (name, callback) => { windowEvents[name] = callback; } };
  class Observer {
    constructor(callback) { resizeObserverCallback = callback; }
    observe(element, options) { observed = element; observedBox = options.box; }
  }
  if (observer) window.ResizeObserver = Observer;
  const context = { document: doc, window, ResizeObserver: Observer };
  runInNewContext(source, context);
  const mascot = appended[0];
  assert.equal(mascot.attributes['aria-hidden'], 'true');
  assert.equal(mascot.children[0].alt, '');
  assert.equal(mascot.children[0].draggable, false);
  assert.equal(mascot.properties['--trip-mascot-nav-height'], navPresent ? '104px' : '0px');
  if (observer && navPresent) {
    assert.equal(observed, nav);
    assert.equal(observedBox, 'border-box', 'safe-area padding must trigger repositioning');
    navHeight = 124;
    resizeObserverCallback();
    assert.equal(mascot.properties['--trip-mascot-nav-height'], '124px');
  }
  navHeight = 70;
  windowEvents.resize();
  assert.equal(mascot.properties['--trip-mascot-nav-height'], navPresent ? '70px' : '0px');
  doc.hidden = true;
  documentEvents.visibilitychange();
  assert.ok(mascot.classes.has('is-paused'));
  doc.hidden = false;
  documentEvents.visibilitychange();
  assert.ok(!mascot.classes.has('is-paused'));
  runInNewContext(source, context);
  assert.equal(appended.length, 1, 'duplicate initializer must not duplicate decoration');
}
initialize();
initialize({ observer: false });
initialize({ navPresent: false });
initialize({ hidden: true });
console.log('PASS: five pages, navigation resize and fallback, hidden-tab pause, decorative semantics, duplicate initialization');
