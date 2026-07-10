'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('favorites') ?? '[]');
      setIds(Array.isArray(arr) ? arr : []);
    } catch { setIds([]); }
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link href="/" className="text-blue-600 text-sm">← 回首頁</Link>
      <h1 className="text-2xl font-bold mt-3">⭐ 收藏清單</h1>
      <p className="text-slate-500 text-sm mt-1">收藏儲存在瀏覽器 localStorage，共 {ids.length} 筆</p>

      {ids.length === 0 && (
        <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded">
          尚未收藏任何單字。在關卡中點 ☆ 即可加入。
        </div>
      )}

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ids.map(id => {
          // 預期格式: 編號-單字, 例 "JOJO-1A-mother" 或單純 word
          return (
            <li key={id} className="border rounded px-3 py-2 bg-white flex justify-between">
              <span className="font-medium">{id.split('-').slice(-1)[0]}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
