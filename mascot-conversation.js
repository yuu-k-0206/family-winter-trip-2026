/* DOMから独立した会話・連打判定。タイマーは表示側で1つだけ管理します。 */
(() => {
  'use strict';
  const dayMs = 86400000;
  function remainingDays(departureDate, timestamp) {
    // script.js のカウントダウンと同じ、日本時間の暦日差・厳密な日付検証。
    if (typeof departureDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate) || departureDate.startsWith('0000-')) return null;
    const departure = Date.parse(`${departureDate}T00:00:00Z`);
    if (!Number.isFinite(departure) || new Date(departure).toISOString().slice(0, 10) !== departureDate || !Number.isFinite(timestamp)) return null;
    return departure / dayMs - Math.floor((timestamp + 9 * 60 * 60 * 1000) / dayMs);
  }
  function create({ data, page, departureDate, random = Math.random }) {
    const settings = data.settings;
    let taps = [];
    let lockedUntil = -Infinity;
    let cooldownUntil = -Infinity;
    let lastText = '';
    let lastAnger = '';
    const pick = (items, exclude) => {
      const candidates = items.filter(item => item.text !== exclude);
      return candidates[Math.floor(random() * candidates.length)] || null;
    };
    return {
      resetTaps() { taps = []; },
      tap(now, calendarNow) {
        if (now < lockedUntil) return null;
        if (now >= cooldownUntil) {
          taps = taps.filter(time => now - time <= settings.tapWindowMs);
          taps.push(now);
          if (taps.length >= settings.angerTapCount) {
            taps = [];
            lockedUntil = now + settings.displayMs;
            cooldownUntil = now + settings.cooldownMs;
            const line = pick(data.anger, lastAnger);
            if (!line) return null;
            lastAnger = lastText = line.text;
            return { ...line, kind: 'anger' };
          }
        } else {
          // クールダウン中の操作を、次の連打判定へ持ち越さない。
          taps = [];
        }
        const days = remainingDays(departureDate(), calendarNow);
        const special = days === null ? null : data.seasonal.find(line => days >= line.min && days <= line.max);
        const seasonal = special && { ...special, text: special.text.replace('{days}', String(days)), kind: 'seasonal' };
        let line = null;
        if (seasonal && random() < settings.seasonalProbability && seasonal.text !== lastText) line = seasonal;
        if (!line) {
          const normal = pick(data.pages[page] || data.pages.index, lastText);
          if (normal) line = { ...normal, kind: 'normal' };
        }
        if (line) lastText = line.text;
        return line;
      }
    };
  }
  window.MASCOT_CONVERSATION = { create, remainingDays };
})();
