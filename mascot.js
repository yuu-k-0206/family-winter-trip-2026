/* 足踏みと会話の表示。既存ページの操作・保存処理から独立しています。 */
(() => {
  'use strict';
  if (document.querySelector('.trip-mascot')) return;

  const mascot = document.createElement('div');
  mascot.className = 'trip-mascot';
  // 元の採用SVGのパーツをそのまま使用。横長スプライトを動かさず、手足だけ回転する。
  const sprite = document.createElement('div');
  sprite.className = 'trip-mascot-sprite';
  sprite.setAttribute('aria-hidden', 'true');
  sprite.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="112" viewBox="0 0 128 112" focusable="false" aria-hidden="true">
<defs>
    <g id="boy-upper">
      <path fill="#244754" d="M13 53h25v32H13z"/>
      <path fill="#3e8c96" d="M13 53h21v28H13z"/>
      <path fill="#62adb0" d="M15 56h17v5H15z"/>
      <path fill="#285a6b" d="M24 62h2v19h-2zM15 72h6v2h-6zM28 72h4v2h-4z"/>
      <path fill="#f2c66e" d="M12 51h25v8H12zM27 57h7v13h-7z"/>
      <path fill="#d49c51" d="M13 57h24v3H13zM28 67h6v3h-6z"/>
      <path fill="#312c30" d="M5 20h37v32H5z"/>
      <path fill="#d79b78" d="M35 24h8v27h-8z"/>
      <path fill="#f5c49a" d="M7 25h29v27H7z"/>
      <path fill="#ffe0b6" d="M9 26h25v5H9z"/>
      <path fill="#4b3630" d="M7 24h29v7H25v4h-6v-5h-6v7H7z"/>
      
      
      <path fill="#db8e79" d="M9 44h6v3H9zM30 44h5v3h-5z"/>
      <path fill="#955b4a" d="M20 47h6v2h-6z"/>
      <path fill="#286b78" d="M5 14h34v14H5z"/>
      <path fill="#204d60" d="m39 14 5 4v13l-5-3z"/>
      <path fill="#67b2b6" d="m5 14 5-5h29l5 5z"/>
      <path fill="#3f929d" d="M3 24h36v6H3z"/>
      <path fill="#205766" d="M39 25h7v7h-7z"/>
      <path fill="#f3cf80" d="M9 24h5v6H9z"/>
    </g>
    <g id="girl-upper">
      <path fill="#593a35" d="M4 25h40v39h-8v-7H11v7H4z"/>
      <path fill="#82524a" d="M5 32h5v25H5zM38 31h5v27h-5z"/>
      <path fill="#823e5a" d="M13 54h25v31H13z"/>
      <path fill="#bd667b" d="M13 54h21v28H13z"/>
      <path fill="#de8b9a" d="M15 60h17v5H15z"/>
      <path fill="#8e405c" d="M24 63h2v19h-2zM15 74h6v2h-6zM28 74h4v2h-4z"/>
      <path fill="#f8deb2" d="M11 51h27v8H11zM15 57h7v14h-7z"/>
      <path fill="#d4b38c" d="M12 57h25v3H12zM16 68h6v3h-6z"/>
      <path fill="#d99f7e" d="M34 26h7v26h-7z"/>
      <path fill="#f7c9a5" d="M8 25h27v28H8z"/>
      <path fill="#ffe0bb" d="M10 27h22v4H10z"/>
      <path fill="#603f36" d="M6 21h31v12h-8v-4h-9v5h-8v5H6z"/>
      
      
      <path fill="#df8f87" d="M9 45h7v3H9zM29 45h5v3h-5z"/>
      <path fill="#a56a59" d="M20 48h6v2h-6z"/>
      <path fill="#85445f" d="M6 15h31v10H6z"/>
      <path fill="#d58ca0" d="m6 15 6-5h24l6 5z"/>
      <path fill="#b56b88" d="M4 22h36v6H4z"/>
      <path fill="#8d4a68" d="M37 16h6v15h-6z"/>
      <path fill="#f4d6ad" d="M3 30h7v12H3zM37 30h7v12h-7z"/>
      <path fill="#d8b58f" d="M40 32h4v10h-4z"/>
    </g>
    <g id="boy-leg"><path fill="#314355" d="M0 0h10v15H0z"/><path fill="#466075" d="M1 1h4v12H1z"/><path fill="#28313b" d="M-1 13h13v7H-1z"/><path fill="#d6b78e" d="M-1 18h13v2H-1z"/></g>
    <g id="girl-leg"><path fill="#4c4156" d="M0 0h10v14H0z"/><path fill="#6b5872" d="M1 1h4v11H1z"/><path fill="#5c403b" d="M-1 12h13v8H-1z"/><path fill="#d9b997" d="M-1 17h13v3H-1z"/></g>
    <g id="boy-arm"><path fill="#2d6879" d="M0 0h9v18H0z"/><path fill="#4c9ca5" d="M1 1h5v15H1z"/><path fill="#e7b982" d="M0 16h9v8H0z"/></g>
    <g id="girl-arm"><path fill="#914862" d="M0 0h9v18H0z"/><path fill="#cc7c92" d="M1 1h5v15H1z"/><path fill="#f3d6ad" d="M0 16h9v8H0z"/></g>
  </defs>
<g class="mascot-character mascot-character--boy" transform="translate(12 0) scale(1)">
<path fill="#263a47" opacity=".12" d="M9 103h31v4H9z"/>
<g class="mascot-actor mascot-actor--boy">
<g transform="translate(14 81)"><g class="mascot-limb mascot-leg--left"><use href="#boy-leg"/></g></g>
<g transform="translate(27 81)"><g class="mascot-limb mascot-leg--right"><use href="#boy-leg"/></g></g>
<g transform="translate(0 0)"><g class="mascot-body mascot-body--boy">
<g transform="translate(5 55)"><g class="mascot-limb mascot-arm--left"><use href="#boy-arm"/></g></g>
<g transform="translate(37 55)"><g class="mascot-limb mascot-arm--right"><use href="#boy-arm"/></g></g>
<use href="#boy-upper"/>
<g class="mascot-eyes mascot-eyes--boy">
<path fill="#30333e" d="M13 38h5v6h-5zM27 38h5v6h-5z"/>
<path fill="#fff7df" d="M13 38h2v2h-2zM27 38h2v2h-2z"/>
</g>
</g></g>
</g>
</g>
<g class="mascot-character mascot-character--girl" transform="translate(73 6) scale(0.94)">
<path fill="#263a47" opacity=".12" d="M9 103h31v4H9z"/>
<g class="mascot-actor mascot-actor--girl">
<g transform="translate(14 81)"><g class="mascot-limb mascot-leg--left"><use href="#girl-leg"/></g></g>
<g transform="translate(27 81)"><g class="mascot-limb mascot-leg--right"><use href="#girl-leg"/></g></g>
<g transform="translate(0 -1)"><g class="mascot-body mascot-body--girl">
<g transform="translate(5 58)"><g class="mascot-limb mascot-arm--left"><use href="#girl-arm"/></g></g>
<g transform="translate(37 55)"><g class="mascot-limb mascot-arm--right"><use href="#girl-arm"/></g></g>
<use href="#girl-upper"/>
<g class="mascot-eyes mascot-eyes--girl">
<path fill="#36313b" d="M13 39h5v6h-5zM26 39h5v6h-5z"/>
<path fill="#fff7e8" d="M13 39h2v2h-2zM26 39h2v2h-2z"/>
</g>
</g></g>
</g>
</g>
</svg>`;
  mascot.append(sprite);
  document.body.append(mascot);

  // 5秒の待機後に2人の掛け合いを再生。タップ・非表示・動きを減らす設定を優先。
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const sceneController = window.MASCOT_SCENES?.create({
    onScene(scene) {
      if (scene) mascot.dataset.mascotScene = scene;
      else delete mascot.dataset.mascotScene;
    }
  });
  const updateScenes = () => {
    if (document.hidden || prefersReducedMotion?.matches) sceneController?.stop();
    else sceneController?.start();
  };
  updateScenes();
  window.addEventListener('pagehide', () => sceneController?.stop());
  window.addEventListener('pageshow', updateScenes);
  document.addEventListener('visibilitychange', updateScenes);
  if (prefersReducedMotion) {
    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', updateScenes);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
      prefersReducedMotion.addListener(updateScenes);
    }
  }

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
  let talkButton;
  const hideBubble = (returnFocus = false) => {
    clearTimeout(hideTimer);
    const focusInside = bubble?.contains(document.activeElement);
    if (bubble) bubble.hidden = true;
    talkButton?.setAttribute('aria-expanded', 'false');
    if (returnFocus && focusInside) talkButton?.focus();
  };
  if (data && engine) {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    const conversation = engine.create({ data, page, departureDate: () => window.TRIP_DATA?.departureDate });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trip-mascot-talk';
    button.setAttribute('aria-label', '男の子と女の子に話しかける');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'trip-mascot-guide');
    talkButton = button;
    bubble = document.createElement('div');
    bubble.className = 'trip-mascot-bubble';
    bubble.hidden = true;
    bubble.id = 'trip-mascot-guide';
    bubble.setAttribute('role', 'region');
    bubble.setAttribute('aria-label', 'マスコットの会話と旅の案内');
    const text = document.createElement('span');
    text.className = 'trip-mascot-line';
    text.setAttribute('role', 'status');
    text.setAttribute('aria-live', 'polite');
    text.setAttribute('aria-atomic', 'true');
    const header = document.createElement('div');
    header.className = 'trip-mascot-guide-header';
    const label = document.createElement('span'); label.textContent = '旅の案内';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'trip-mascot-close';
    close.setAttribute('aria-label', '会話と案内を閉じる'); close.textContent = '×';
    header.append(label, close);
    const links = document.createElement('nav');
    links.className = 'trip-mascot-links'; links.setAttribute('aria-label', 'マスコットの案内');
    // 日付やランダムなセリフに関わらず、毎回使える案内。外部送信・共有はしません。
    const routes = {
      index: [['schedule.html', '旅行の予定を見る'], ['packing.html', '持ち物を確認する']],
      hotel: [['schedule.html', '旅行の予定を見る'], ['hotel.html#kahou-karaoke', 'カラオケの案内へ']],
      schedule: [['hotel.html', '旅館・お料理を見る'], ['budget.html#route-compare', 'ルートの費用を比べる']],
      budget: [['schedule.html', '旅行の予定を見る'], ['hotel.html#booking-info', '宿泊の予約内容へ']],
      packing: [['schedule.html', '旅行の予定を見る'], ['index.html#planning-status', '準備の現在地を見る']]
    };
    (routes[page] || routes.index).forEach(([href, title]) => {
      const link = document.createElement('a'); link.href = href;
      link.textContent = title + ' →'; links.append(link);
      link.addEventListener('click', () => hideBubble(true));
    });
    bubble.append(header, text, links);
    // 吹き出しがスクロールしても、話し手を示すしっぽはキャラクターの上に残す。
    const tail = document.createElement('span');
    tail.className = 'trip-mascot-tail';
    tail.setAttribute('aria-hidden', 'true');
    mascot.append(button, bubble, tail);
    const scheduleHide = () => {
      clearTimeout(hideTimer);
      if (bubble.hidden || bubble.contains(document.activeElement) || bubble.matches(':hover')) return;
      hideTimer = setTimeout(() => hideBubble(), data.settings.displayMs);
    };
    bubble.addEventListener('pointerenter', () => clearTimeout(hideTimer));
    bubble.addEventListener('pointerdown', () => clearTimeout(hideTimer));
    bubble.addEventListener('pointerleave', scheduleHide);
    bubble.addEventListener('focusin', () => clearTimeout(hideTimer));
    bubble.addEventListener('focusout', () => setTimeout(scheduleHide, 0));
    close.addEventListener('click', () => hideBubble(true));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !bubble.hidden) {
        event.preventDefault(); hideBubble(true);
      }
    });
    // clickだけを使うことで、タッチ後の合成clickとの二重集計を防ぐ。
    // ネイティブbuttonによりEnter/Spaceの操作も同じ経路になる。
    button.addEventListener('click', () => {
      sceneController?.interrupt();
      const line = conversation.tap(performance.now(), Date.now());
      if (!line) return;
      clearTimeout(hideTimer);
      text.textContent = line.text;
      bubble.dataset.speaker = line.speaker;
      bubble.dataset.kind = line.kind;
      bubble.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      scheduleHide();
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
