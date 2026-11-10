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
  const statusBadge = kind => {
    const definition = data.statusKinds?.[kind] || data.statusKinds?.pending;
    const badge = textElement('span', 'status-badge status-badge--' + (data.statusKinds?.[kind] ? kind : 'pending'), '');
    const mark = textElement('span', 'status-mark', definition?.mark || '?');
    mark.setAttribute('aria-hidden', 'true');
    badge.append(mark, document.createTextNode(definition?.label || '未確認'));
    return badge;
  };
  document.querySelectorAll('[data-status]').forEach(el => el.replaceWith(statusBadge(el.dataset.status)));
  const travelIcon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'travel-icon');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', 'assets/travel-icons.svg#' + (['car','meal','onsen','stay','home'].includes(name) ? name : 'car'));
    svg.append(use);
    return svg;
  };
  // 折りたたまれた更新記録も、共有済みの #updates から開けます。
  const revealHashTarget = () => {
    const target = get(window.location.hash.slice(1));
    if (!target) return;
    let parent = target.parentElement;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    target.querySelectorAll('details[data-expand-on-hash]').forEach(details => { details.open = true; });
  };
  window.addEventListener('hashchange', revealHashTarget);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (link && link.hash === window.location.hash) revealHashTarget();
  });
  revealHashTarget();

  // 雪はイラスト内だけ。端末の「動きを減らす」と閲覧者の停止設定を尊重。
  const snowButton = get('snow-toggle');
  if (snowButton) {
    const snow = document.querySelector('.winter-snow');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let enabled = true;
    try { enabled = localStorage.getItem('family-trip-snow') !== 'off'; } catch (_) {}
    const refreshSnow = () => {
      const active = enabled && !reduced.matches;
      snow?.classList.toggle('is-playing', active && !document.hidden);
      snowButton.hidden = false;
      snowButton.disabled = reduced.matches;
      snowButton.setAttribute('aria-pressed', String(active));
      snowButton.textContent = reduced.matches ? '雪の演出：端末設定で停止' : '雪の演出：' + (active ? 'オン' : 'オフ');
    };
    snowButton.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem('family-trip-snow', enabled ? 'on' : 'off'); } catch (_) {}
      refreshSnow();
    });
    if (reduced.addEventListener) reduced.addEventListener('change', refreshSnow);
    else reduced.addListener(refreshSnow);
    document.addEventListener('visibilitychange', refreshSnow);
    refreshSnow();
  }


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
  setText('hero-pill', `${data.dateSummary || '旅行日程を確認中'} · ${data.duration || ''}`);
  setText('hero-lead', data.heroLead);
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
      ['即時利用', -payment.instantUseYen]
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
  setText('overview-stay', data.stayName);

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


  // 華鳳カラオケ：旅館への電話確認済みの大人・子供料金を基準とした、基本料金の試算。
  const karaokeDuration = get('karaoke-duration');
  if (karaokeDuration) {
    const karaoke = data.karaoke || {};
    const hourlyBeforeTax = karaoke.hourlyYenBeforeTax;
    const taxRate = karaoke.taxRate;
    const adults = karaoke.adults;
    const children = karaoke.children;
    const childRateFactor = karaoke.childRateFactor;
    setText('karaoke-opening-hours', '営業時間：' + (karaoke.openingHours || '要確認'));
    setText('karaoke-reservation-method', '予約：' + (karaoke.reservationMethod || '要確認'));
    const buttons = Array.from(karaokeDuration.querySelectorAll('button[data-karaoke-hours]'));
    const valid = Number.isSafeInteger(hourlyBeforeTax) && hourlyBeforeTax >= 0 &&
      Number.isFinite(taxRate) && taxRate >= 0 && taxRate < 1 &&
      Number.isSafeInteger(adults) && adults >= 0 &&
      Number.isSafeInteger(children) && children >= 0 &&
      Number.isFinite(childRateFactor) && childRateFactor >= 0 && childRateFactor <= 1;
    if (!valid) {
      ['karaoke-unit-price', 'karaoke-total-price', 'karaoke-adult-price', 'karaoke-child-price']
        .forEach(id => setText(id, '料金確認中'));
      buttons.forEach(button => { button.disabled = true; });
    } else {
      const hourlyWithTax = Math.round(hourlyBeforeTax * (1 + taxRate));
      const childHourlyWithTax = Math.round(hourlyWithTax * childRateFactor);
      setText('karaoke-unit-price', formatYen(hourlyWithTax));
      setText('karaoke-adult-label', '大人' + adults + '名');
      setText('karaoke-child-label', '子供' + children + '名（各' + formatYen(childHourlyWithTax) + '／時間）');
      const showKaraokePrice = hours => {
        if (hours !== 1 && hours !== 2) return;
        setText('karaoke-summary-label', '大人' + adults + '名＋子供' + children + '名・' + hours + '時間');
        setText('karaoke-total-price', formatYen((adults * hourlyWithTax + children * childHourlyWithTax) * hours));
        setText('karaoke-adult-price', formatYen(adults * hourlyWithTax * hours));
        setText('karaoke-child-price', formatYen(children * childHourlyWithTax * hours));
        buttons.forEach(button => {
          const selected = Number(button.dataset.karaokeHours) === hours;
          button.classList.toggle('is-active', selected);
          button.setAttribute('aria-pressed', String(selected));
        });
      };
      buttons.forEach(button => {
        button.addEventListener('click', () => showKaraokePrice(Number(button.dataset.karaokeHours)));
      });
      showKaraokePrice(1);
    }
  }

  // 華鳳の調査結果：調査日のスナップショットとして表示（リアルタイム空室ではない）。
  const bookingData = data.booking || {};
  setText('booking-plan-name', bookingData.planName);
  setText('booking-summary', bookingData.checkSummary);
  // 予約時に選んだ夕食開始時刻。一般の提供時間・変更可能な時間帯とは分けて表示。
  const bookedDinner = bookingData.dinner;
  const validDinnerTime = typeof bookedDinner?.startTime === 'string' &&
    /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(bookedDinner.startTime);
  setText('booking-dinner-start', validDinnerTime ? bookedDinner.startTime + '（予約時指定）' : '確認中');
  setText('booking-dinner-note', validDinnerTime ? bookedDinner.note : '予約時の夕食開始時刻は確認中です。');
  const planningList = get('planning-list');
  if (planningList) {
    list(data.planning).forEach(item => {
      const card = textElement('a', 'planning-card', '');
      // 公開中のしおりのページ内だけを案内する。
      if (!/^(hotel|schedule|budget|packing)\.html(?:#[a-z0-9-]+)?$/.test(item.href)) return;
      card.href = item.href;
      const title = item.bookingEvent === 'dinner' && validDinnerTime ? '夕食 ' + bookedDinner.startTime + ' 開始' : item.title;
      card.append(statusBadge(item.bookingEvent === 'dinner' && !validDinnerTime ? 'pending' : item.status), textElement('h3', '', title), textElement('p', '', item.note), textElement('span', 'planning-link', '詳しく見る →'));
      planningList.append(card);
    });
  }
  const homePending = get('home-pending');
  if (homePending) list(bookingData.pending).forEach(item => homePending.append(textElement('li', '', item)));

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

  // タブは矢印/Home/Endにも対応。ルート選択は比較表示のみで、旅行データは変更しない。
  const bindTabs = (tabs, panels, initialIndex = 0) => {
    if (!tabs.length) return;
    const select = index => tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault(); select(next); tabs[next].focus();
      });
    });
    select(initialIndex < 0 ? 0 : initialIndex);
  };
  const panels = [get('panel1'), get('panel2')];
  if (panels.every(Boolean)) {
    const dayTabs = [get('tab1'), get('tab2')];
    list(data.itinerary).slice(0,2).forEach((day, dayIndex) => {
      const panel = panels[dayIndex];
      dayTabs[dayIndex].replaceChildren(document.createTextNode(day.tabLabel || day.name), textElement('small', '', day.subtitle));
      const timeline = textElement('ol', 'timeline', '');
      list(day.steps).forEach(item => {
        const step = textElement('li', 'step', '');
        const icon = textElement('span', 'step-icon', ''); icon.append(travelIcon(item.icon));
        const detail = textElement('div', 'step-detail', '');
        const dinner = item.bookingEvent === 'dinner' && validDinnerTime ? bookedDinner : null;
        const time = dinner ? dinner.startTime : item.time || '確認中';
        const heading = textElement('div', 'step-heading', '');
        heading.append(textElement('strong', '', item.title), statusBadge(item.bookingEvent === 'dinner' && !validDinnerTime ? 'pending' : item.status));
        detail.append(heading);
        if (dinner) {
          detail.append(textElement('p', '', '予約時に指定した開始時刻です。'));
          const more = textElement('details', 'inline-details', '');
          more.append(textElement('summary', '', '時刻の変更について'), textElement('p', '', dinner.note));
          detail.append(more);
        } else detail.append(textElement('p', '', item.detail));
        step.append(icon, textElement('span', 'step-time', time), detail);
        timeline.append(step);
      });
      panel.append(textElement('h3', '', day.name), timeline);
      const routeDay = list(drivePlan.schedules).find(plan => plan.day === dayIndex + 1);
      if (!routeDay) return;
      panel.append(textElement('h4', 'drive-subheading', '移動ルートを比べる'));
      panel.append(textElement('p', 'route-switch-note', '切り替わるのは表示だけです。ルートは未確定で、交通費の計画予算も変わりません。'));
      const routeTabs = textElement('div', 'route-tabs', '');
      routeTabs.setAttribute('role', 'tablist');
      routeTabs.setAttribute('aria-label', day.tabLabel + 'の比較ルート');
      const buttons = [], cards = [], validOptions = list(routeDay.options).filter(option => roadById(option.roadId));
      validOptions.forEach((option, optionIndex) => {
        const road = roadById(option.roadId);
        const id = 'route-' + (dayIndex + 1) + '-' + road.id;
        const button = textElement('button', '', option.title.split('｜')[0] + ' · ' + (road.id === 'uonuma' ? '魚沼IC経由' : '高速優先'));
        button.type = 'button'; button.id = id + '-tab';
        button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', id);
        button.append(textElement('small', '', road.id === day.defaultRoadId ? '現在の仮案' : 'もうひとつの案'));
        routeTabs.append(button); buttons.push(button);
        const card = textElement('article', 'drive-option', '');
        card.id = id; card.setAttribute('role', 'tabpanel'); card.setAttribute('aria-labelledby', button.id);
        card.append(statusBadge('tentative'), textElement('h5', 'drive-option-heading', option.title), textElement('p', 'drive-option-caption', option.recommendation));
        card.append(textElement('p', 'drive-option-specs', '基準距離 ' + road.distanceKm + 'km ／ 純走行 ' + driveMinutesText(road.driveMinutes) + ' ／ 片道高速料金 ' + money(road.tollYen) + ' ／ 燃料代 約' + money(road.fuelYen)));
        const stopList = textElement('ol', 'drive-stop-list', '');
        list(option.stops).forEach(stop => {
          const row = textElement('li', 'drive-stop', '');
          const info = textElement('div', '', '');
          info.append(textElement('strong', '', stop.name));
          if (stop.detail) info.append(textElement('p', '', stop.detail));
          if (stop.placeId && data.places?.[stop.placeId]) {
            const mapSlot = textElement('span', 'map-slot', '');
            mapSlot.dataset.mapPlace = stop.placeId; info.append(mapSlot);
          }
          row.append(textElement('span', 'drive-stop-time', stop.time), info); stopList.append(row);
        });
        card.append(stopList);
        if (option.caution) card.append(textElement('p', 'drive-option-warning', option.caution));
        cards.push(card);
      });
      panel.append(routeTabs, ...cards);
      bindTabs(buttons, cards, validOptions.findIndex(option => option.roadId === day.defaultRoadId));
      panel.append(textElement('p', 'note', '時刻は通常時のナビ所要時間を基にした仮工程です。雪道・渋滞・寄り道で変わります。時間が押した場合は観光を短縮します。'));
    });
    bindTabs(dayTabs, panels);
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
  const updateArticle = (item, compact = false) => {
    const article = document.createElement('article');
    article.className = 'updates';
    const time = textElement('time', '', item.date);
    article.append(time, textElement('p', '', compact ? item.summary || item.text : item.text));
    return article;
  };
  const latestUpdate = get('latest-update');
  if (latestUpdate && updates.length) {
    latestUpdate.replaceChildren(updateArticle(updates[0], true));
  }
  const updatesList = get('updates-list');
  if (updatesList) {
    updates.forEach(item => updatesList.append(updateArticle(item)));
    if (!updates.length) updatesList.append(textElement('p', 'note', '現在、お知らせはありません。'));
  }
})();
