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

  // 旧版で共有済みのホーム内リンクも、新しい独立ページに移動させる。
  const legacyLinks = {'kahou-experience':'hotel.html','discuss':'hotel.html','booking-info':'hotel.html','travel-budget':'budget.html','route-compare':'budget.html','schedule':'schedule.html','packing':'packing.html'};
  const currentFile = window.location.pathname.split('/').pop();
  if ((!currentFile || currentFile === 'index.html') && window.location.hash) {
    const anchor = window.location.hash.slice(1);
    if (Object.prototype.hasOwnProperty.call(legacyLinks,anchor)) {
      window.location.replace(legacyLinks[anchor] + window.location.hash);
      return;
    }
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
  setText('insurance-note', data.cancellation?.insuranceNote);
  setText('concept-description', data.concept?.description);
  setText('concept-note', data.concept?.note);
  setText('budget-transport', Number.isFinite(data.travelBudget?.total) ? data.travelBudget.total.toLocaleString('ja-JP') + '円' : '確認中');
  // 宿泊カード決済額は予約明細の確定値。旅行全体の総額とは区別する。
  const payment = data.booking?.payment;
  const paymentValid = payment &&
    [payment.adultUnitYen, payment.adultCount, payment.childUnitYen, payment.childCount,
     payment.subtotalYen, payment.instantUseYen, payment.cardChargeYen]
      .every(value => Number.isSafeInteger(value) && value >= 0) &&
    payment.adultUnitYen * payment.adultCount + payment.childUnitYen * payment.childCount === payment.subtotalYen &&
    payment.subtotalYen - payment.instantUseYen === payment.cardChargeYen;
  const formatYen = value => value.toLocaleString('ja-JP') + '円';
  const confirmedCharge = paymentValid ? formatYen(payment.cardChargeYen) : '確認中';
  setText('budget-combined', confirmedCharge);
  setText('booking-card-charge', confirmedCharge);
  setText('booking-payment-confirmed', paymentValid ? payment.confirmedAt : '決済額は確認中です。');
  setText('booking-payment-caution', paymentValid ? payment.note : '');
  const breakdown = get('booking-payment-breakdown');
  if (breakdown && paymentValid) {
    const rows = [
      ['大人 ' + formatYen(payment.adultUnitYen) + ' × ' + payment.adultCount + '名', payment.adultUnitYen * payment.adultCount],
      [payment.childCategory + ' ' + formatYen(payment.childUnitYen) + ' × ' + payment.childCount + '名', payment.childUnitYen * payment.childCount],
      ['宿泊料金小計', payment.subtotalYen],
      ['即時利用', -payment.instantUseYen],
      ['オンラインカード決済額', payment.cardChargeYen]
    ];
    rows.forEach(([label, amount]) => {
      const row = textElement('div', 'reference-rate-row', '');
      row.append(textElement('span', '', label), textElement('strong', '', formatYen(amount)));
      breakdown.append(row);
    });
  }
  // 交通費は計画予算。単純合算は最終的な旅行総額ではない。
  const withTransport = paymentValid && Number.isFinite(data.travelBudget?.total)
    ? payment.cardChargeYen + data.travelBudget.total : null;
  setText('budget-with-transport', withTransport === null ? '宿泊費と交通費の合計目安は確認中です。'
    : '宿泊カード決済額＋往復交通費の計画予算：計算上 約' + formatYen(withTransport) +
      '（交通費は概算。入湯税・現地食事・施設料金・保険料等は未計上）');
  setText('budget-source-date', data.travelBudget?.surveyedAt);
  setText('budget-condition', data.travelBudget?.condition);
  setText('budget-note', data.travelBudget?.note);
  const cancelPeriods = get('cancel-period-list');
  if (cancelPeriods) {
    list(data.cancellation?.periods).forEach((item) => {
      const row = textElement('div', 'fee-row', '');
      row.append(textElement('span', '', item.when), textElement('strong', '', item.percent));
      cancelPeriods.append(row);
    });
  }
  setText('summary-destination', data.destination);
  setText('overview-members', data.members);
  setText('overview-members-detail', data.membersDetail);
  setText('overview-transport', data.transport);
  setText('overview-destination', `行き先：${data.destination}`);
  setText('overview-stay', `宿泊先：${data.stayName}`);

  const dateList = get('date-options');
  if (dateList) {
  list(data.dates).forEach((date) => {
    const card = textElement('article', 'choice', '');
    const cap = textElement('span', 'cap', date.label);
    const tag = textElement('span', 'corner-tag', date.badge);
    if (date.badge !== '有力候補' && date.badge !== '第1希望' && date.badge !== '一旦決定') tag.classList.add('muted');
    card.append(cap, tag, textElement('h3', '', date.range), textElement('p', '', date.detail));
    dateList.append(card);
  });
  if (!dateList.children.length) {
    dateList.append(textElement('p', 'note', '日程候補は調整中です。'));
  }

  }

  // 宿泊候補：追加した分だけカードが増えます
  const lodgingList = get('lodging-list');
  if (lodgingList) {
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

  }

  // 客室の希望は「確約」ではなく、trip-data.js の案内文をそのまま表示。
  setText('kahou-room-request', data.roomRequestNote || '客室の眺望・階層は未確定です。');

  // 華鳳の調査結果：調査日のスナップショットとして表示（リアルタイム空室ではない）。
  const bookingData = data.booking || {};
  setText('booking-plan-name', bookingData.planName);
  setText('booking-summary', bookingData.checkSummary);
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
    setText('booking-checkin', bookingData.checkIn || '要確認');
    setText('booking-checkout', bookingData.checkOut || '要確認');
    setText('booking-stay-note', bookingData.checkInNote || '予約プランを確認してください。');
    const childRatesEl = get('booking-child-rates');
    if (childRatesEl) list(bookingData.childrenRates).forEach((item) => {
      const row = textElement('div', 'reference-rate-row', '');
      const label = textElement('div', '', '');
      label.append(textElement('strong', '', item.label), textElement('small', '', item.note || ''));
      row.append(label, textElement('strong', '', yen(item.price)));
      childRatesEl.append(row);
    });
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
      prices.className = 'rate-prices' + (offerIndex === 0 ? ' rate-prices--three' : '');
      const priceKinds = offerIndex === 0
        ? [['通常料金', 'standard'], ['事前カード決済', 'prepaid'], ['会員料金', 'member']]
        : [['通常料金', 'standard'], ['会員料金', 'member']];
      priceKinds.forEach(([label, field]) => {
        const row = document.createElement('div');
        row.append(textElement('span', '', label), textElement('strong', '', yen(offer[field])));
        if (offerIndex === 0 && Number.isFinite(offer[field]) && Number.isFinite(bookingData.bathTax)) {
          row.append(textElement('small', '', '入湯税込の参考合計 ' + yen(offer[field] + bookingData.bathTax)));
        }
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

  // ドライブ比較：金額・工程は trip-data.js を正本とし、表示用に整形します。
  const drivePlan = data.drivePlan || {};
  const driveRoads = list(drivePlan.roads);
  const roadById = id => driveRoads.find(road => road.id === id);
  const money = amount => Number.isFinite(amount) ? amount.toLocaleString('ja-JP') + '円' : '確認中';
  const driveMinutesText = minutes => Number.isFinite(minutes) ? Math.floor(minutes / 60) + '時間' + (minutes % 60) + '分' : '確認中';
  const costGrid = get('route-cost-comparisons');
  if (costGrid && driveRoads.length === 2) {
    costGrid.replaceChildren();
    // 行きA/帰りA、行きA/帰りB、行きB/帰りA、行きB/帰りB。
    for (const outward of driveRoads) {
      for (const homeward of driveRoads) {
        const recommended = outward.id === 'uonuma' && homeward.id === 'express';
        const sumToll = outward.tollYen + homeward.tollYen;
        const sumFuel = outward.fuelYen + homeward.fuelYen;
        const total = sumToll + sumFuel + Number(drivePlan.reserveYen || 0);
        const rounded = Math.round(total / 100) * 100;
        const article = document.createElement('article');
        article.className = 'route-cost-card' + (recommended ? ' route-cost-card--featured' : '');
        const name = textElement('h3', '', '行き ' + (outward.id === 'uonuma' ? '魚沼' : '高速') + ' ／ 帰り ' + (homeward.id === 'uonuma' ? '魚沼' : '高速'));
        article.append(name);
        if (recommended) article.append(textElement('span', 'route-recommend', 'おすすめ仮案'));
        article.append(textElement('strong', 'route-cost-total', '約' + money(rounded)));
        article.append(textElement('p', 'route-cost-breakdown', '高速料金 ' + money(sumToll) + ' ＋ 燃料代 約' + money(sumFuel) + ' ＋ 予備費 ' + money(Number(drivePlan.reserveYen || 0))));
        article.append(textElement('p', 'route-cost-details', '行き：' + outward.distanceKm + 'km・' + driveMinutesText(outward.driveMinutes) + '・料金' + money(outward.tollYen)));
        article.append(textElement('p', 'route-cost-details', '帰り：' + homeward.distanceKm + 'km・' + driveMinutesText(homeward.driveMinutes) + '・料金' + money(homeward.tollYen)));
        costGrid.append(article);
      }
    }
  }
  setText('route-assumptions', drivePlan.assumptions || '');
  setText('route-reserve-note', drivePlan.reserveNote || '');
  setText('winter-route-note', drivePlan.winterNote);
  setText('winter-timing-note', drivePlan.timingNote);
  const transportBudget = data.travelBudget;
  if (transportBudget) {
    setText('budget-breakdown', '高速料金 ' + money(transportBudget.toll) +
      ' ＋ 燃料代 約' + money(transportBudget.fuel) + ' ＋ 予備費 ' + money(drivePlan.reserveYen));
  }

  // 日別の2ルート工程。文字列はすべて textContent で表示します。
  // 1日目・2日目のタイムライン
  const panels = [get('panel1'), get('panel2')];
  if (panels.every(Boolean)) {
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
    const routeDay = list(drivePlan.schedules).find(plan => plan.day === dayIndex + 1);
    if (routeDay) {
      panel.append(textElement('h4', 'drive-subheading', '寄り道・休憩を含む2つのルート案'));
      const cards = document.createElement('div');
      cards.className = 'drive-option-list';
      list(routeDay.options).forEach(option => {
        const road = roadById(option.roadId);
        if (!road) return;
        const card = document.createElement('article');
        card.className = 'drive-option';
        card.append(textElement('h5', 'drive-option-heading', option.title));
        card.append(textElement('p', 'drive-option-caption', option.recommendation));
        const specs = textElement('p', 'drive-option-specs',
          '基準距離 ' + road.distanceKm + 'km ／ 純走行 ' + driveMinutesText(road.driveMinutes) +
          ' ／ 片道高速料金 ' + money(road.tollYen) +
          ' ／ 燃料代 約' + money(road.fuelYen));
        card.append(specs);
        const stopList = document.createElement('div');
        stopList.className = 'drive-stop-list';
        list(option.stops).forEach(stop => {
          const stopRow = document.createElement('div');
          stopRow.className = 'drive-stop';
          const info = document.createElement('div');
          info.append(textElement('strong', '', stop.name));
          if (stop.detail) info.append(textElement('p', '', stop.detail));
          stopRow.append(textElement('span', 'drive-stop-time', stop.time), info);
          stopList.append(stopRow);
        });
        card.append(stopList);
        if (option.caution) card.append(textElement('p', 'drive-option-warning', option.caution));
        cards.append(card);
      });
      panel.append(cards);
      panel.append(textElement('p', 'note', '時刻は通常時のナビ所要時間を基にした仮工程です。冬の雪道・渋滞・立ち寄り先への迂回で変わります。時間が押した場合は観光を短縮します。'));
    }
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

  }

  // チェックリスト：localStorageは閲覧している端末の中だけに保存
  const checks = get('checklist');
  if (checks) {
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

  }

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
  if (updatesList) {
    updates.forEach(item => updatesList.append(updateArticle(item)));
    if (!updates.length) updatesList.append(textElement('p', 'note', '現在、お知らせはありません。'));
  }
})();
