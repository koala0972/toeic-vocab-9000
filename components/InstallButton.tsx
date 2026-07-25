'use client';

import { useEffect, useState } from 'react';

type Platform = 'ios' | 'android' | 'other';

/**
 * 右下角懸浮按鈕: 引導使用者將 PWA 加到主畫面
 * - iOS: 因瀏覽器不會自動跳 prompt, 點按鈕顯示教學
 * - Android/Desktop: 攔截 beforeinstallprompt 並觸發瀏覽器原生 prompt
 * - 已安裝 (standalone): 不渲染
 */
export default function InstallButton() {
  const [platform, setPlatform] = useState<Platform>('other');
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 已安裝為 standalone app -> 不顯示
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // 平台偵測
    const ua = navigator.userAgent || navigator.vendor || '';
    if (/iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) {
      setPlatform('ios');
      setVisible(true); // iOS 一定顯示按鈕
      return;
    }
    if (/Android/i.test(ua)) {
      setPlatform('android');
      // 等 beforeinstallprompt 事件
      const onPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', onPrompt);
      return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }
    // desktop / 其他: 瀏覽器會自己跳, 5 秒後還沒裝就顯示按鈕
    const timer = setTimeout(() => {
      // 已經在 install 狀態就跳過
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setPlatform('other');
        setVisible(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (installed || !visible) return null;

  const handleClick = async () => {
    if (platform === 'ios') {
      setShowIosGuide(true);
      return;
    }
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setVisible(false); // 已裝
        }
      } catch (e) {
        console.warn('[install] prompt failed', e);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* 右下角按鈕 */}
      <button
        onClick={handleClick}
        aria-label="安裝 ToeicHub 到主畫面"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 shadow-lg text-sm font-medium"
      >
        <span aria-hidden="true">📥</span>
        <span>安裝到主畫面</span>
      </button>

      {/* iOS 教學 modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-guide-title"
        >
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setShowIosGuide(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 id="ios-guide-title" className="text-lg font-bold text-slate-800 mb-3">
              iOS 加入主畫面
            </h3>
            <ol className="text-sm text-slate-700 space-y-2 mb-4 list-decimal list-inside">
              <li>
                點底部的<span aria-hidden="true"> ⬆ </span>分享按鈕
              </li>
              <li>選擇「加入主畫面」</li>
              <li>點「新增」完成</li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 text-white py-2 text-sm font-medium"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
