import type { Metadata } from 'next';
import { levelToCEFR, levelToTier, levelToToeicScore, TIERS } from '@/lib/levels-config';

const SITE_URL = 'https://english-learning-three-gamma.vercel.app';

const tierZh: Record<string, string> = {
  basic: '基礎',
  intermediate: '中級',
  advanced: '高級',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const level = parseInt(n, 10);

  if (isNaN(level) || level < 1 || level > 900) {
    return {
      title: '關卡不存在',
      robots: { index: false, follow: false },
    };
  }

  const cefr = levelToCEFR(level);
  const tier = levelToTier(level);
  const toeic = levelToToeicScore(level);
  const tierName = tierZh[tier] ?? '';

  const title = `多益單字 關卡 ${level}（${tierName}・CEFR ${cefr}・多益 ${toeic}+）`;
  const description = `多益單字 9000 第 ${level} 關，${tierName}級難度，CEFR ${cefr}，對應多益 ${toeic} 分以上。10 個英文單字搭配中文翻譯、例句、語音朗讀，中英反白對照學習。`;

  // 構建 keyword list
  const keywords = [
    '多益單字', 'TOEIC vocabulary', `多益第${level}關`, `CEFR ${cefr}`,
    `多益 ${toeic}分`, `${tierName}英文`, '英文單字學習', '英語背單字',
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/level/${level}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/level/${level}`,
      type: 'website',
      locale: 'zh_TW',
    },
    twitter: {
      card: 'summary',
      title: `多益單字 關卡 ${level}（${tierName}・CEFR ${cefr}）`,
      description,
    },
  };
}

export default function LevelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
