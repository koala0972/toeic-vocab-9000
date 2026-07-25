/**
 * Affiliate recommendations shown after a level is completed.
 *
 * Four canonical slots — keep stable IDs so future rotation doesn't reset
 * the 30-day throttle for users who have already seen the popup.
 *
 * URLs: leave as env-overridable so production can swap real affiliate
 * targets via process.env.AFF_*_URL without code changes. In dev, all four
 * fall back to `https://example.com/...` placeholder. The first SKU
 * ('official') deliberately points to the public TOEIC landing page (no
 * affiliate program available there).
 */
export type AffiliateSku = {
  id: 'flashcard' | 'mocktest' | 'app' | 'official';
  title: string;
  subtitle: string;
  /** Visual emoji glyph rendered in the card. ASCII-only fallback handled in the component. */
  icon: string;
  /** Background gradient for the icon tile. Two valid CSS colors. */
  gradient: [string, string];
  /** External + safe target. Append `?ref=toeichub` or equivalent at click time when set in env. */
  url: string;
  /** Optional longer copy shown in tooltip aria. */
  aria: string;
};

const fromEnv = (key: string, fallback: string) =>
  (typeof process !== 'undefined' && process.env?.[key]) || fallback;

export const AFFILIATE_SKUS: readonly AffiliateSku[] = [
  {
    id: 'flashcard',
    title: '多益單字字卡（電子版）',
    subtitle: '通勤複習 · 隨身帶著走',
    icon: '📚',
    gradient: ['#a78bfa', '#7c3aed'],
    url: fromEnv('AFF_FLASH_URL', 'https://example.com/affiliate/flashcard'),
    aria: '多益單字字卡電子版，隨時隨地複習高頻單字',
  },
  {
    id: 'mocktest',
    title: '多益模擬試題套書',
    subtitle: '5 回完整模擬考',
    icon: '📝',
    gradient: ['#60a5fa', '#2563eb'],
    url: fromEnv('AFF_MOCK_URL', 'https://example.com/affiliate/mocktest'),
    aria: '多益模擬試題套書，含 5 回完整模擬考題與詳解',
  },
  {
    id: 'app',
    title: '訂閱制語言學習 App',
    subtitle: '全年無限複習',
    icon: '📱',
    gradient: ['#34d399', '#059669'],
    url: fromEnv('AFF_APP_URL', 'https://example.com/affiliate/app'),
    aria: '訂閱制語言學習 App，全年無限複習多益教材',
  },
  {
    id: 'official',
    title: 'TOEIC 官方報名',
    subtitle: '真實考試報名頁',
    icon: '🎯',
    gradient: ['#fbbf24', '#d97706'],
    // Official landing has no affiliate program — link directly.
    url: fromEnv('AFF_OFFICIAL_URL', 'https://www.toeic.com.tw/'),
    aria: 'TOEIC 多益官方報名頁',
  },
] as const;

/** How long after showing this popup before we show it again. ms. 30 days. */
export const AFFILIATE_THROTTLE_MS = 30 * 24 * 60 * 60 * 1000;
