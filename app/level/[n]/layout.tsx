import type { Metadata } from 'next';

const SITE_URL = 'https://english-learning-three-gamma.vercel.app';

/** 關卡 tier 對應中文名 */
function tierName(n: number): string {
  if (n <= 300) return '初級';
  if (n <= 600) return '中級';
  return '高級';
}

/** 關卡 tier 對應字數 */
function tierCount(n: number): string {
  if (n <= 300) return 'Oxford 3000 + COCA';
  if (n <= 600) return 'TSL 1.2 + COCA 補充';
  return 'TSL 1.2 進階 + COCA 高頻';
}

type Props = { params: { n: string } };

export function generateMetadata({ params }: Props): Metadata {
  const n = parseInt(params.n, 10);
  const tier = tierName(n);
  const wordRange = `${(n - 1) * 10 + 1}–${n * 10}`;
  const title = `第 ${n} 關 ${tier} · 多益單字 ${wordRange}`;
  const description = `ToeicHub 多益單字第 ${n} 關, ${tier} (${tierCount(n)}), 本關學單字編號 ${wordRange}. 中文翻譯 + 例句 + 語音朗讀, 練闖關由淺入深.`;
  const url = `${SITE_URL}/level/${n}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ToeicHub`,
      description,
      url,
      siteName: 'ToeicHub',
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ToeicHub`,
      description,
    },
  };
}

export default function LevelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
