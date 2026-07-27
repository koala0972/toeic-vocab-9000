/**
 * Affiliate recommendations — 8 real brands auto-scraped on 2026-07-27.
 * Images stored in /affiliates/*.png (og:image fallback to first_img/favicon).
 * URLs are the short affiliate links (linkgo.one / afflink.one / onelink.one).
 * og:title values preserved from original scrape (may need manual polish).
 */
export type AffiliateSku = {
  id: string;
  title: string;
  /** 圖片路徑 (本地 PNG) */
  image: string;
  /** 聯盟短連結. 直接原地貼, 不 env-overridable (是真實連結) */
  url: string;
  /** SEO/aria label longer copy */
  aria: string;
};

export const AFFILIATE_SKUS: readonly AffiliateSku[] = [
  {
    id: 'ivy-bar',
    title: 'iVY BAR 學英文吧',
    image: '/affiliates/ivy-bar.png',
    url: 'https://linkgo.one/s/F77Hk',
    aria: 'iVY BAR 學英文吧 — 帶你走向世界',
  },
  {
    id: 'jiantan',
    title: '巨匠美語',
    image: '/affiliates/jiantan.png',
    url: 'https://afflink.one/s/aiCcB',
    aria: '巨匠美語成人英文課程推薦, 全台37間分校',
  },
  {
    id: '51talk',
    title: '51Talk',
    image: '/affiliates/51talk.png',
    url: 'https://onelink.one/s/vV7rM',
    aria: '51Talk 兒童線上英文, 讓孩子愛上說英文',
  },
  {
    id: 'oikid',
    title: 'OiKID',
    image: '/affiliates/oikid.png',
    url: 'https://onelink.one/s/MsAO5',
    aria: 'OiKID 提升孩童英語能力',
  },
  {
    id: 'voicetube',
    title: 'VoiceTube Vclass',
    image: '/affiliates/voicetube.png',
    url: 'https://afflink.one/s/kr9iK',
    aria: 'VoiceTube Vclass 名師課, 專業老師規劃的語言學習課程',
  },
  {
    id: 'yingdai',
    title: '英代外語',
    image: '/affiliates/yingdai.png',
    url: 'https://onelink.one/s/tFfFc',
    aria: '英代外語, 挑戰多益700分, 一週只要888',
  },
  {
    id: 'd-plus',
    title: 'D+ Language Plus',
    image: '/affiliates/d-plus.png',
    url: 'https://linkgo.one/s/q4ucw',
    aria: 'D+ Language Plus 大新線上語言教育平台',
  },
  {
    id: 'preply',
    title: 'Preply',
    image: '/affiliates/preply.png',
    url: 'https://afflink.one/s/m1pOj',
    aria: 'Preply 線上英語學習, 首堂優惠',
  },
] as const;

/** 30 天節流保留但目前已停用 */
export const AFFILIATE_THROTTLE_MS = 30 * 24 * 60 * 60 * 1000;
