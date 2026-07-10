import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOEIC 多益單字 9000',
  description: '從基礎到高級 9000 多益單字，搭配語音與中英反白學習。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
