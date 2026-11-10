/* v1.5: maps, scenery, local stampbook, and one-page guide. No network requests. */
(() => {
  'use strict';
  const data = window.TRIP_DATA, utils = window.TRAVEL_UTILS;
  if (!data || !utils) return;
  const get = id => document.getElementById(id);
  const el = (tag, cls, text = '') => {
    const node = document.createElement(tag); node.className = cls; node.textContent = text; return node;
  };
  const mapLink = id => {
    const place = data.places?.[id], url = utils.mapURL(place?.query);
    if (!url) return null;
    const a = el('a', 'map-link', '地図を開く ↗');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', place.label + 'の地図を開く（Google マップ・別画面）');
    return a;
  };
  document.querySelectorAll('[data-map-place]').forEach(slot => {
    const link = mapLink(slot.dataset.mapPlace); if (link) slot.replaceChildren(link);
  });

  // The manual selector previews another sky; Auto always follows Japan time.
  const sceneSelect = get('scenery-mode'), sceneImage = get('winter-scenery');
  if (sceneSelect && sceneImage) {
    const labels = {morning: '朝の雪景色', day: '昼の雪景色', evening: '夕暮れの雪景色', night: '夜の雪景色'};
    const sources = {morning: 'assets/winter-morning.svg', day: 'assets/winter-day.svg', evening: 'assets/winter-evening.svg', night: 'winter-illustration.svg'};
    let mode = 'auto', timer;
    try { const stored = localStorage.getItem('family-trip-scenery'); if (stored === 'auto' || sources[stored]) mode = stored; } catch (_) {}
    sceneSelect.value = mode;
    const refresh = () => {
      clearTimeout(timer);
      const selected = mode === 'auto' ? utils.period(Date.now()) : mode;
      sceneImage.src = sources[selected];
      sceneImage.alt = labels[selected] + '。雪山と架空の旅館のイラスト';
      get('scenery-caption').textContent = labels[selected] + (mode === 'auto' ? ' · 日本時間で自動' : ' · 手動プレビュー');
      if (mode === 'auto' && !document.hidden) timer = setTimeout(refresh, 60000 - Date.now() % 60000);
    };
    sceneSelect.addEventListener('change', () => {
      mode = sceneSelect.value;
      try { localStorage.setItem('family-trip-scenery', mode); } catch (_) {}
      refresh();
    });
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pagehide', () => clearTimeout(timer));
    window.addEventListener('pageshow', refresh);
    refresh();
  }

  const stampGrid = get('stamp-grid');
  if (stampGrid) {
    const stamps = data.stamps || [], ids = stamps.map(stamp => stamp.id);
    const storageKey = 'family-trip-stamps-v1-' + data.departureDate;
    let collected = [], canSave = true;
    const saveNote = get('stamp-save-note'), message = get('stamp-message');
    try { collected = utils.stampState(localStorage.getItem(storageKey), ids); } catch (_) { canSave = false; }
    const note = () => {
      saveNote.textContent = canSave ? 'この端末・ブラウザ内に保存。家族との同期はしません。ブラウザのデータを消すと記録も消えます。' : 'このブラウザでは保存できません。今開いている間だけ記録できます。';
      saveNote.classList.toggle('save-warning', !canSave);
    };
    const persist = () => {
      try { localStorage.setItem(storageKey, JSON.stringify({version: 1, collected})); canSave = true; } catch (_) { canSave = false; }
      note();
    };
    const buttons = [];
    const refresh = () => {
      buttons.forEach((button, index) => {
        const checked = collected.includes(ids[index]);
        button.setAttribute('aria-pressed', String(checked));
        button.querySelector('.stamp-state').textContent = checked ? '押したよ ✓ · もう一度で戻す' : 'できたら押してね';
      });
      get('stamp-count').textContent = collected.length + ' / ' + stamps.length;
      get('stamp-progress').value = collected.length;
      get('stamp-complete').hidden = collected.length !== stamps.length || !stamps.length;
    };
    for (const stamp of stamps) {
      const button = el('button', 'stamp-card'); button.type = 'button';
      const icon = el('span', 'stamp-icon', stamp.symbol); icon.setAttribute('aria-hidden', 'true');
      button.append(icon, el('strong', '', stamp.label), el('span', 'stamp-hint', stamp.hint), el('span', 'stamp-state'));
      button.addEventListener('click', () => {
        const added = !collected.includes(stamp.id);
        collected = added ? [...collected, stamp.id] : collected.filter(id => id !== stamp.id);
        persist(); refresh();
        message.textContent = stamp.label + (added ? 'のスタンプを押しました。' : 'のスタンプを戻しました。');
        button.classList.remove('stamp-pop');
        if (added) requestAnimationFrame(() => button.classList.add('stamp-pop'));
      });
      stampGrid.append(button); buttons.push(button);
    }
    get('stamp-progress').max = stamps.length || 1;
    const confirm = get('stamp-reset-confirm');
    get('stamp-reset').addEventListener('click', () => { confirm.hidden = false; get('stamp-reset-cancel').focus(); });
    get('stamp-reset-cancel').addEventListener('click', () => { confirm.hidden = true; get('stamp-reset').focus(); });
    get('stamp-reset-yes').addEventListener('click', () => {
      collected = []; persist(); refresh(); confirm.hidden = true; get('stamp-reset').focus(); message.textContent = 'スタンプをすべて戻しました。';
    });
    window.addEventListener('storage', event => {
      if (event.key === storageKey || event.key === null) {
        collected = utils.stampState(event.newValue, ids); refresh();
      }
    });
    note(); refresh();
  }

  const sheet = get('travel-sheet');
  if (sheet) {
    get('sheet-date').textContent = data.dateSummary;
    get('sheet-stay').textContent = data.stayName;
    get('sheet-members').textContent = data.membersDetail;
    get('sheet-room').textContent = data.booking.roomLabel + '。' + data.guideNotes.roomRequest;
    for (const day of utils.guideDays(data)) {
      const card = el('section', 'sheet-day'); card.append(el('h2', '', day.label), el('p', 'sheet-route', day.route + '【仮案】'));
      const rows = el('ol', 'sheet-stops');
      for (const stop of day.stops) {
        const row = el('li', stop.status === '予約指定' ? 'sheet-booked' : '');
        row.append(el('b', '', stop.time), el('span', '', stop.name + (stop.status === '予約指定' ? '【予約指定】' : ''))); rows.append(row);
      }
      card.append(rows); get('sheet-days').append(card);
    }
    for (const item of data.packing || []) get('sheet-packing').append(el('li', '', '□ ' + item.label));
    const karaoke = data.karaoke;
    const groupPrice = Math.round(karaoke.hourlyYenBeforeTax * (1 + karaoke.taxRate)) * (karaoke.adults + karaoke.children * karaoke.childRateFactor);
    get('sheet-karaoke').textContent = 'カラオケ：' + karaoke.openingHours + '。' + (karaoke.adults + karaoke.children) + '名1時間' + groupPrice.toLocaleString('ja-JP') + '円／2時間' + (groupPrice * 2).toLocaleString('ja-JP') + '円。未予約・空室時のみ。';
    get('sheet-winter').textContent = data.guideNotes.winter;
    get('sheet-pending').textContent = data.guideNotes.pending;
    const generated = () => { get('sheet-generated').textContent = '作成日 ' + utils.japanDay(Date.now()) + '（日本時間）｜旅行情報の更新 ' + data.updatedAt; };
    generated(); window.addEventListener('beforeprint', generated);
    get('print-guide').addEventListener('click', () => { generated(); window.print(); });
    get('print-guide').disabled = false;
    get('sheet-loading').hidden = true;
    sheet.hidden = false;
  }
})();
