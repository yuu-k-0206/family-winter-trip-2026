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

  // 日本時間（UTC+9、夏時間なし）の暦日を整数で比較。端末の現地時刻は使いません。
  const dayMs = 24 * 60 * 60 * 1000;
  const japanOffsetMs = 9 * 60 * 60 * 1000;
  const departureDay = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    // 2月30日など、自動補正される日付も拒否します。
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
    return timestamp / dayMs;
  };
  let countdownTimer;
  function updateCountdown() {
    const el = get('trip-countdown');
    if (!el) return;
    const now = Date.now();
    const departure = departureDay(data.departureDate);
    let message;
    if (data.departureDate == null) {
      message = '日程が決まり次第、出発までの日数をお知らせします。';
    } else if (departure === null) {
      message = '出発日を確認中です。日程が決まり次第、出発までの日数をお知らせします。';
    } else {
      const remaining = departure - Math.floor((now + japanOffsetMs) / dayMs);
      if (remaining > 0) message = `出発まであと${remaining}日`;
      else if (remaining === 0) message = 'いよいよ出発当日です！';
      // 現在の旅行は1泊2日。翌日を2日目、その翌日以降を旅行終了後として扱います。
      else if (remaining === -1) message = '今日は旅行2日目です。';
      else message = '今回の旅行は終了しました。';
    }
    // 同じ文章での繰り返し通知を避けます。
    if (el.textContent !== message) el.textContent = message;
    clearTimeout(countdownTimer);
    // 日本時間の午前0時に更新。端末の時計変更も最長1分で反映します。
    const untilMidnight = dayMs - ((now + japanOffsetMs) % dayMs);
    countdownTimer = setTimeout(updateCountdown, Math.min(60 * 1000, untilMidnight));
  }
  updateCountdown();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateCountdown();
  });
  window.addEventListener('pageshow', updateCountdown);

  setText('trip-status', data.status);
  setText('last-update', `更新：${data.updatedAt}`);
  setText('hero-pill', `${data.dateSummary || '旅行日程を確認中'} · ${data.status}`);
  setText('summary-duration', data.duration);
  setText('overview-date', data.dateSummary);
  setText('overview-date-note', data.dateNote);
  setText('decision-note', data.decisionNote);
  setText('work-schedule-note', data.workScheduleNote);
  setText('cancel-free-until', data.cancellation?.freeUntil);
  setText('cancel-fee-from', data.cancellation?.feeFrom);
  setText('cancel-caution', data.cancellation?.caution);
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
      textElement('p', '', bookingData.condition || '条件確認中'),
      textElement('p', '', '以下は調査時点の記録で、リアルタイムの空室・料金ではありません。掲載料金は上記の仮検索条件での1室・1泊の合計です。')
    );
    const archivedCards = [];
    list(bookingData.offers).forEach((offer, offerIndex) => {
      const card = document.createElement('article');
      card.className = 'rate-card' + (offer.available ? '' : ' rate-card--closed');
      const head = document.createElement('div');
      head.className = 'rate-card-head';
      const heading = document.createElement('div');
      heading.append(textElement('small', '', offer.period), textElement('h3', '', offer.range));
      const status = textElement('span', 'rate-status' + (offer.available ? ' rate-status--open' : ' rate-status--closed'), offer.available ? '調査時：空室表示あり' : '調査時：満室');
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
      if (offerIndex === 0) bookingPrices.append(card);
      else archivedCards.push(card);
    });
    if (archivedCards.length) {
      const past = document.createElement('details');
      past.className = 'booking-details';
      const summary = textElement('summary', '', '過去の候補日と参考料金を表示');
      const archiveGrid = document.createElement('div');
      archiveGrid.className = 'booking-offers';
      archiveGrid.style.marginTop = '15px';
      archiveGrid.append(...archivedCards);
      past.append(summary, archiveGrid);
      bookingPrices.after(past);
    }
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
