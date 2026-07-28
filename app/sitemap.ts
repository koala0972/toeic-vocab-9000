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

  // 900 關卡頁 (level 1-900)
  // 初級 1-300 priority 0.8, 中級 301-600 priority 0.7, 高級 601-900 priority 0.6
  for (let i = 1; i <= 900; i++) {
    const tier = i <= 300 ? 'basic' : i <= 600 ? 'intermediate' : 'advanced';
    entries.push({
      url: `${SITE_URL}/level/${i}`,
      lastModified: new Date(),
      changeFrequency: tier === 'advanced' ? 'monthly' : 'weekly',
      priority: i <= 300 ? 0.8 : i <= 600 ? 0.7 : 0.6,
    });
  }

  return entries;
}
