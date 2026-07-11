import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '多益單字 9000 | TOEIC Vocabulary 9000',
    short_name: '多益9000',
    description: '免費多益單字學習網站，9000 單字由淺入深，中文翻譯 + 語音 + 中英反白。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    categories: ['education', 'productivity'],
    lang: 'zh-TW',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
