import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ToeicHub 多益單字',
    short_name: 'ToeicHub',
    description: '多益單字學習工具，9K 關卡由淺入深，中英對照、語音、收藏、學習進度。',
    start_url: '/',
    display: 'standalone',
    background_color: '#9453d5',
    theme_color: '#9453d5',
    orientation: 'portrait',
    categories: ['education', 'productivity'],
    lang: 'zh-TW',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
