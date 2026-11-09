/* 足踏みと会話の表示。既存ページの操作・保存処理から独立しています。 */
(() => {
  'use strict';
  if (document.querySelector('.trip-mascot')) return;

  const mascot = document.createElement('div');
  mascot.className = 'trip-mascot';
  const sprite = document.createElement('div');
  sprite.className = 'trip-mascot-sprite';
  sprite.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = 'assets/trip-mascots.svg';
  image.alt = '';
  image.width = 1024;
  image.height = 112;
  image.draggable = false;
  sprite.append(image);
  mascot.append(sprite);
  document.body.append(mascot);

  // ナビの実測値にはiPhoneの安全領域も含まれる。文字拡大や画面回転にも追従。
  const nav = document.querySelector('.bottom-nav');
  const positionAboveNav = () => {
    const height = nav ? nav.getBoundingClientRect().height : 0;
    mascot.style.setProperty('--trip-mascot-nav-height', `${height}px`);
  };
  positionAboveNav();
  if (nav && 'ResizeObserver' in window) {
    new ResizeObserver(positionAboveNav).observe(nav, { box: 'border-box' });
  }
  window.addEventListener('resize', positionAboveNav, { passive: true });
  window.addEventListener('pageshow', positionAboveNav);

  const data = window.MASCOT_DIALOGUES;
  const engine = window.MASCOT_CONVERSATION;
  let hideTimer;
  let bubble;
  const hideBubble = () => {
    clearTimeout(hideTimer);
    if (bubble) bubble.hidden = true;
  };
  if (data && engine) {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    const conversation = engine.create({ data, page, departureDate: () => window.TRIP_DATA?.departureDate });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trip-mascot-talk';
    button.setAttribute('aria-label', '男の子と女の子に話しかける');
    bubble = document.createElement('div');
    bubble.className = 'trip-mascot-bubble';
    bubble.hidden = true;
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
    bubble.setAttribute('aria-atomic', 'true');
    const text = document.createElement('span');
    text.className = 'trip-mascot-line';
    bubble.append(text);
    mascot.append(button, bubble);
    // clickだけを使うことで、タッチ後の合成clickとの二重集計を防ぐ。
    // ネイティブbuttonによりEnter/Spaceの操作も同じ経路になる。
    button.addEventListener('click', () => {
      const line = conversation.tap(performance.now(), Date.now());
      if (!line) return;
      clearTimeout(hideTimer);
      text.textContent = line.text;
      bubble.dataset.speaker = line.speaker;
      bubble.dataset.kind = line.kind;
      bubble.hidden = false;
      hideTimer = setTimeout(hideBubble, data.settings.displayMs);
    });
    const resetVisibleConversation = () => { hideBubble(); conversation.resetTaps(); };
    window.addEventListener('pagehide', resetVisibleConversation);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetVisibleConversation();
    });
  }

  // 他のタブを見ている間はコマ送りを止める。
  const updateVisibility = () => mascot.classList.toggle('is-paused', document.hidden);
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
})();
