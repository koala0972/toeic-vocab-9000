import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-slate-600 mt-2">找不到此頁</p>
      <Link href="/" className="mt-4 inline-block text-blue-600">回首頁</Link>
    </main>
  );
}
