/* ToeicHub SW registration — called from app/layout.tsx
 * 只在 production 或 localhost 才註冊，避免 dev HMR 出錯
 */
(function () {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!window.isSecureContext && location.hostname !== 'localhost') return;

  // 略過 prerender 階段 + 跨網域
  if (navigator.serviceWorker.controller) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // 但凡 update 進場就跳過等待
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.debug('[SW] registered', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] registration failed', err);
      });
  });
})();
