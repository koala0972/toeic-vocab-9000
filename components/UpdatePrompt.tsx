'use client';

import { useEffect, useState } from 'react';

/**
 * 偵測 SW update, 在 state=installed 時顯示更新按鈕
 * 用法: 在 layout 內 <body> 末端 render <UpdatePrompt />
 * 需要 SW 已 listen controllerchange (sw-register.js 我們已設置 skipWaiting + clients.claim)
 */
export default function UpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const onUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
      }
    };

    const checkActive = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        if (reg.waiting) onUpdate(reg);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdate(reg);
            }
          });
        });
      } catch (e) {
        // ignore
      }
    };
    checkActive();

    // 備援：每 15 秒 poll 一次 reg.waiting
    // (handle case where update already finished before listener attached)
    const pollTimer = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) onUpdate(reg);
      } catch (e) {
        // ignore
      }
    }, 15000);

    return () => clearInterval(pollTimer);
  }, []);

  if (!waitingWorker || dismissed) return null;

  const reload = () => {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    waitingWorker.addEventListener('statechange', () => {
      window.location.reload();
    });
    // Fallback in case statechange didn't fire in time
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100vw-24px)]"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl bg-violet-700 text-white shadow-2xl px-4 py-3 flex items-center gap-3 text-sm">
        <span aria-hidden="true">🔄</span>
        <span className="flex-1">有新版本可用</span>
        <button
          onClick={reload}
          className="bg-white text-violet-700 px-3 py-1.5 rounded-full font-medium hover:bg-violet-100"
        >
          更新
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="關閉更新提示"
          className="text-violet-200 hover:text-white px-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}
