/* 共通の装飾。旅行データ・操作・保存処理から独立して動かします。 */
(() => {
  'use strict';
  if (document.querySelector('.trip-mascot')) return;

  const mascot = document.createElement('div');
  mascot.className = 'trip-mascot';
  mascot.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = 'assets/trip-mascots.svg';
  image.alt = '';
  image.width = 1024;
  image.height = 112;
  image.draggable = false;
  mascot.append(image);
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

  // 他のタブを見ている間はコマ送りを止める。
  const updateVisibility = () => mascot.classList.toggle('is-paused', document.hidden);
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
})();
