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
  setText('hero-pill', `2026年12月 · ${data.status}`);
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
    if (date.badge !== '有力候補') tag.classList.add('muted');
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

  const updatesList = get('updates-list');
  list(data.updates).forEach((item) => {
    const article = document.createElement('article');
    article.className = 'updates';
    const time = textElement('time', '', item.date);
    article.append(time, textElement('p', '', item.text));
    updatesList.append(article);
  });
})();
