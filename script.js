/*
 * script.js：画面にデータを表示し、ボタン操作を担当します。
 * 旅行の内容を変更するときは、基本的に trip-data.js を編集してください。
 */
(() => {
  'use strict';
  const data = window.TRIP_DATA;
  if (!data) {
    const message = document.createElement('p');
    message.textContent = '旅行データを読み込めませんでした。trip-data.js が同じフォルダにあるか確認してください。';
    message.style.cssText = 'padding:20px;background:#fff4de;color:#714c00';
    document.body.prepend(message);
    return;
  }

  const get = id => document.getElementById(id);
  const setText = (id, value) => { const el=get(id); if(el) el.textContent = String(value ?? ''); };
  const textElement = (tag, cls, content) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    el.textContent = String(content ?? ''); // HTMLとして解釈させず、安全に文字を表示
    return el;
  };
  const list = (item) => Array.isArray(item) ? item : [];

  setText('trip-status', data.status);
  setText('last-update', `更新：${data.updatedAt}`);
  setText('hero-pill', `2026年12月〜2027年1月 · ${data.status}`);
  setText('summary-duration', data.duration);
  setText('summary-destination', data.destination);
  setText('overview-members', data.members);
  setText('overview-members-detail', data.membersDetail);
  setText('overview-transport', data.transport);
  setText('overview-destination', `行き先：${data.destination}`);
  setText('overview-stay', `宿泊先：${data.stayName}`);

  const dateList = get('date-options');
  list(data.dates).forEach((date) => {
    const card = textElement('article', 'choice', '');
    const cap = textElement('span', 'cap', date.label);
    const tag = textElement('span', 'corner-tag', date.badge);
    if (date.badge !== '有力候補' && date.badge !== '第1希望') tag.classList.add('muted');
    card.append(cap, tag, textElement('h3', '', date.range), textElement('p', '', date.detail));
    dateList.append(card);
  });
  if (!dateList.children.length) {
    dateList.append(textElement('p', 'note', '日程候補は調整中です。'));
  }

  // 宿泊候補：追加した分だけカードが増えます
  const lodgingList = get('lodging-list');
  const lodgingCandidates = list(data.lodgingCandidates);
  get('lodging-empty').hidden = lodgingCandidates.length > 0;
  lodgingCandidates.forEach((candidate) => {
    const row = textElement('article', 'lodging-row', '');
    const info = document.createElement('div');
    info.append(textElement('h3', '', candidate.name), textElement('p', '', `${candidate.area || '場所未定'}｜${candidate.memo || '詳細確認中'}`));
    // URLは https:// で始まるものだけ利用
    if (typeof candidate.url === 'string' && /^https:\/\//i.test(candidate.url)) {
      const a = textElement('a', '', '公式サイトを見る');
      a.href = candidate.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      info.append(a);
    }
    row.append(info, textElement('span', 'list-status', candidate.status || '検討中'));
    lodgingList.append(row);
  });

  // 華鳳の調査結果：調査日のスナップショットとして表示（リアルタイム空室ではない）。
  const bookingData = data.booking || {};
  const bookingPrices = get('booking-prices');
  if (bookingPrices) {
    const yen = amount => Number.isFinite(amount) ? `${amount.toLocaleString('ja-JP')}円` : '—';
    const intro = get('booking-intro');
    intro.append(
      textElement('strong', '', '調査日：' + (bookingData.surveyedAt || '未確認')),
      textElement('p', '', bookingData.condition || '条件確認中')
    );
    list(bookingData.offers).forEach(offer => {
      const card = document.createElement('article');
      card.className = 'rate-card' + (offer.available ? '' : ' rate-card--closed');
      const head = document.createElement('div');
      head.className = 'rate-card-head';
      const heading = document.createElement('div');
      heading.append(textElement('small', '', offer.period), textElement('h3', '', offer.range));
      const status = textElement('span', 'rate-status' + (offer.available ? ' rate-status--open' : ' rate-status--closed'), offer.available ? '予約可能表示あり' : '満室');
      head.append(heading, status);
      const prices = document.createElement('div');
      prices.className = 'rate-prices';
      [['通常料金', 'standard'], ['会員料金', 'member']].forEach(([label, field]) => {
        const row = document.createElement('div');
        row.append(textElement('span', '', label), textElement('strong', '', yen(offer[field])));
        prices.append(row);
      });
      const note = textElement('p', 'rate-note', offer.note || '');
      card.append(head, prices, note);
      bookingPrices.append(card);
    });
    setText('booking-note', bookingData.note || '');
    const other = get('booking-other-dates');
    list(bookingData.otherDates).forEach(item => other.append(textElement('li', '', item)));
    setText('booking-other-note', bookingData.otherDatesNote || '');
    setText('booking-children', bookingData.childrenNote || '');
    const pending = get('booking-pending');
    list(bookingData.pending).forEach(item => pending.append(textElement('li', '', item)));
    setText('booking-luxury', bookingData.luxuryReference || '');
  }

  // 1日目・2日目のタイムライン
  const panels = [get('panel1'), get('panel2')];
  list(data.itinerary).slice(0,2).forEach((day, dayIndex) => {
    const panel = panels[dayIndex];
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    list(day.steps).forEach((item, i) => {
      const step = document.createElement('div');
      step.className = 'step';
      const dot = textElement('span', 'dot', String(i+1).padStart(2,'0'));
      const detail = document.createElement('div');
      detail.append(textElement('strong', '', item.title), textElement('p', '', item.detail));
      step.append(dot, detail);
      timeline.append(step);
    });
    panel.append(textElement('h3', '', day.name), timeline);
  });
  const tabs = [get('tab1'), get('tab2')];
  function selectDay(index) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectDay(i));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = 1-i;
        selectDay(next);
        tabs[next].focus();
      }
    });
  });

  // チェックリスト：localStorageは閲覧している端末の中だけに保存
  const checks = get('checklist');
  const prefix = 'family-trip-2026-v04-';
  list(data.packing).forEach((item) => {
    const row = document.createElement('label');
    row.className = 'check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    const key = prefix + item.id;
    try { input.checked = localStorage.getItem(key) === '1'; } catch (_) {}
    input.addEventListener('change', () => {
      try { localStorage.setItem(key, input.checked ? '1' : '0'); } catch (_) {}
    });
    row.append(input, document.createTextNode(String(item.label)));
    checks.append(row);
  });
  get('packing-reset').addEventListener('click', () => {
    checks.querySelectorAll('input').forEach((input, i) => {
      input.checked = false;
      try { localStorage.removeItem(prefix + data.packing[i].id); } catch (_) {}
    });
  });

  // 日付（YYYY.MM.DD）の新しい順にコピーし、元の旅行データは変更しません。
  const updates = list(data.updates)
    .filter(item => item && typeof item.text === 'string' && item.text.trim())
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
  const updateArticle = (item) => {
    const article = document.createElement('article');
    article.className = 'updates';
    const time = textElement('time', '', item.date);
    article.append(time, textElement('p', '', item.text));
    return article;
  };
  const latestUpdate = get('latest-update');
  if (latestUpdate && updates.length) {
    latestUpdate.replaceChildren(updateArticle(updates[0]));
  }
  const updatesList = get('updates-list');
  updates.forEach(item => updatesList.append(updateArticle(item)));
  if (!updates.length) {
    updatesList.append(textElement('p', 'note', '現在、お知らせはありません。'));
  }
})();
