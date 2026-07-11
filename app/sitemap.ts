import type { MetadataRoute } from 'next';

const SITE_URL = 'https://english-learning-three-gamma.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // 首頁
  entries.push({
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  });

  // 瀏覽頁
  entries.push({
    url: `${SITE_URL}/browse`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // 搜尋頁
  entries.push({
    url: `${SITE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  });

  // 300 關卡頁 (level 1-300)
  for (let i = 1; i <= 300; i++) {
    entries.push({
      url: `${SITE_URL}/level/${i}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: i <= 100 ? 0.8 : i <= 200 ? 0.7 : 0.6,
    });
  }

  return entries;
}
