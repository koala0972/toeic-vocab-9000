import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://english-learning-three-gamma.vercel.app';

export const metadata: Metadata = {
  title: {
    default: '多益單字 9000 | TOEIC Vocabulary 9000 — 從基礎到高級',
    template: '%s | 多益單字 9000',
  },
  description: '免費多益單字學習網站，9000 個單字分 3 級 300 關，由淺入深。每字附中文翻譯、例句、語音朗讀，中英反白對照學習，點擊同義詞反義詞跨關搜尋。適合多益初學者到進階考生。',
  keywords: [
    '多益單字', 'TOEIC vocabulary', '多益字彙', '英語學習',
    '英文單字', '多益考試', 'TOEIC', '單字背诵', '英語背單字',
    '英文學習網站', '免費英語學習', '多益9000', 'TOEIC 9000 words',
    'English vocabulary learning', 'TOEIC preparation',
    '多益入門', '多益基礎', '多益中級', '多益高級',
  ],
  authors: [{ name: 'TOEIC Vocabulary 9000' }],
  creator: 'TOEIC Vocabulary 9000',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'zh-TW': '/',
      'en': '/',
    },
  },
  openGraph: {
    title: '多益單字 9000 | TOEIC Vocabulary 9000',
    description: '免費多益單字學習網站，9000 單字 × 300 關 × 3 級，由淺入深。中文翻譯 + 例句 + 語音朗讀 + 中英反白對照。',
    url: SITE_URL,
    siteName: '多益單字 9000',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '多益單字 9000 | TOEIC Vocabulary 9000',
    description: '免費多益單字學習網站，9000 單字由淺入深，中文翻譯 + 語音 + 中英反白。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'education',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: '多益單字 9000 | TOEIC Vocabulary 9000',
              description: '免費多益單字學習網站，9000 個單字分 3 級 300 關，由淺入深。每字附中文翻譯、例句、語音朗讀。',
              url: SITE_URL,
              educationalLevel: ['Beginner', 'Intermediate', 'Advanced'],
              inLanguage: ['zh-TW', 'en'],
              teaches: 'TOEIC English Vocabulary',
              audience: {
                '@type': 'EducationalAudience',
                educationalRole: 'student',
              },
              knowsAbout: ['TOEIC', 'English vocabulary', 'English learning'],
            }),
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
