'use client';

import { useEffect, useRef } from 'react';
import { AFFILIATE_SKUS } from '@/lib/affiliates';
import { incrAffiliateClickCount } from '@/lib/storage';

interface AffiliatePopupProps {
  open: boolean;
  onClose: () => void;
  /** Optional context label for analytics — e.g. "level:42 completed". */
  trigger?: string;
}

/**
 * Modal showing 4 affiliate/recommendation links. Opens after a level completes.
 * Dismissable via ESC, backdrop click, or the X button. Each tile opens the
 * target in a new tab (nofollow+sponsored) and increments a local click counter
 * so we can A/B the surface later.
 */
export default function AffiliatePopup({ open, onClose, trigger }: AffiliatePopupProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus close button when opened, restore on close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus close button for keyboard users
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // 彈窗開啟時觸發 vbtrax 印象追蹤 (5/8 SKU 有)
  // 5 家有 vbtrax 的已直接放 <img src> 在商品圖, 自動觸發曝光
  // 3 家只本地 PNG, 不額外埋 pixel (Icon 沒 vbtrax URL)
  useEffect(() => {
    if (!open) return;
    const pixels = AFFILIATE_SKUS
      .map(s => s.impressionUrl)
      .filter((u): u is string => !!u);
    if (pixels.length === 0) return;
    const imgs = pixels.map(src => {
      const img = new Image();
      img.src = src;
      img.style.display = 'none';
      img.setAttribute('aria-hidden', 'true');
      img.setAttribute('width', '1');
      img.setAttribute('height', '1');
      document.body.appendChild(img);
      return img;
    });
    return () => {
      imgs.forEach(img => {
        if (img.parentNode) img.parentNode.removeChild(img);
      });
    };
  }, [open]);

  if (!open) return null;

  const handleClick = (e: React.MouseEvent, id: string, url: string) => {
    // 讓 <a target="_blank"> 正常開新分頁, 再記一次點擊
    void incrAffiliateClickCount();
    // eslint-disable-next-line no-console
    console.debug('[affiliate] click', { id, url, trigger });
    // 不阻止預設行為, 讓瀏覽器自然在新分頁打開
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="affiliate-title"
      data-trigger={trigger}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Card */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 id="affiliate-title" className="text-lg font-bold text-slate-800">
            推薦給你的學習資源
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="關閉推薦"
            className="w-9 h-9 -mr-1 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
          {AFFILIATE_SKUS.map((sku) => (
            <a
              key={sku.id}
              href={sku.url}
              target="_blank"
              rel="noopener nofollow sponsored"
              onClick={(e) => handleClick(e, sku.id, sku.url)}
              className="group text-left rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all overflow-hidden bg-white"
              aria-label={sku.aria}
            >
              {/* Logo / brand image tile (aspect square, contain) */}
              <div
                className="aspect-square w-full flex items-center justify-center bg-slate-50 p-3"
              >
                <img
                  src={sku.image}
                  alt={sku.title}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">
                  {sku.title}
                </div>
                <div className="text-[11px] text-violet-600 group-hover:underline mt-2 inline-flex items-center gap-1">
                  查看詳情 <span aria-hidden="true">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
