import type { Metadata } from 'next';
import { TIERS } from '@/lib/levels-config';

const SITE_URL = 'https://english-learning-three-gamma.vercel.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  const config = TIERS.find(t => t.name === tier);

  if (!config) {
    return {
      title: '瀏覽不存在',
      robots: { index: false, follow: false },
    };
  }

  const [lo, hi] = config.levels;
  const title = `多益單字 ${config.zhName}（關卡 ${lo}-${hi}・CEFR ${config.cefrRange[0]}-${config.cefrRange[1]}）`;
  const description = `${config.description}。關卡 ${lo} 到 ${hi}，共 ${(hi - lo + 1) * 10} 個英文單字，搭配中文翻譯、例句、語音朗讀。對應多益 ${config.toeicRange[0]}-${config.toeicRange[1]} 分。`;

  return {
    title,
    description,
    keywords: [
      '多益單字', `多益${config.zhName}`, `TOEIC ${config.name}`,
      `CEFR ${config.cefrRange.join('-')}`, '英文單字', '英語學習',
    ],
    alternates: {
      canonical: `/browse/${config.name}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/browse/${config.name}`,
      locale: 'zh_TW',
      type: 'website',
    },
  };
}

export default function BrowseTierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
