/* 自動掛け合いのタイミングを制御。会話内容や旅行データから独立。 */
(() => {
  'use strict';
  const SCENES = Object.freeze(['glance', 'poke', 'cheer']);
  const MIN_DELAY_MS = 15000;
  const MAX_DELAY_MS = 30000;
  const DURATION_MS = 2200;

  function create({ onScene, random = Math.random, setTimer = setTimeout, clearTimer = clearTimeout }) {
    if (typeof onScene !== 'function') throw new TypeError('onScene is required');
    let running = false;
    let waitTimer = null;
    let endTimer = null;
    let active = null;
    let previous = null;

    const sample = () => {
      const value = Number(random());
      return Number.isFinite(value) ? Math.max(0, Math.min(value, 0.999999999)) : 0;
    };
    const show = scene => {
      if (active === scene) return;
      active = scene;
      onScene(scene);
    };
    const clearAll = () => {
      if (waitTimer !== null) clearTimer(waitTimer);
      if (endTimer !== null) clearTimer(endTimer);
      waitTimer = null;
      endTimer = null;
    };
    const schedule = () => {
      if (!running) return;
      const wait = MIN_DELAY_MS + Math.floor(sample() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
      waitTimer = setTimer(() => {
        waitTimer = null;
        if (!running) return;
        const choices = SCENES.filter(scene => scene !== previous);
        const next = choices[Math.floor(sample() * choices.length)];
        previous = next;
        show(next);
        endTimer = setTimer(() => {
          endTimer = null;
          if (!running) return;
          show(null);
          schedule();
        }, DURATION_MS);
      }, wait);
    };
    return Object.freeze({
      start() {
        if (running) return;
        running = true;
        schedule();
      },
      stop() {
        running = false;
        clearAll();
        show(null);
      },
      interrupt() {
        if (!running) return;
        clearAll();
        show(null);
        schedule();
      }
    });
  }
  window.MASCOT_SCENES = Object.freeze({ create, SCENES, MIN_DELAY_MS, MAX_DELAY_MS, DURATION_MS });
})();
