'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FavoriteEntry } from '@/components/FavoriteStar';

export default function FavoritesPage() {
  const [favs, setFavs] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('favorites') ?? '[]');
      // Migrate old string format → object format
      if (raw.length > 0 && typeof raw[0] === 'string') {
        const migrated = raw.map((id: string) => {
          const parts = id.split('-');
          return { id, word: id, level: parseInt(parts[1] ?? '0', 10), idx: parseInt(parts[2] ?? '0', 10) - 1 };
        });
        localStorage.setItem('favorites', JSON.stringify(migrated));
        setFavs(migrated);
      } else {
        setFavs(raw);
      }
    } catch { setFavs([]); }
  }, []);

  const removeFav = (id: string) => {
    const updated = favs.filter(f => f.id !== id);
    setFavs(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link href="/" className="text-blue-600 text-sm">← 回首頁</Link>
      <h1 className="text-2xl font-bold mt-3">⭐ 收藏清單</h1>
      <p className="text-slate-500 text-sm mt-1">共 {favs.length} 個收藏單字</p>

      {favs.length === 0 && (
        <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded">
          尚未收藏任何單字。在關卡中點 ☆ 即可加入。
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {favs.map(f => (
          <li key={f.id} className="border rounded-lg px-4 py-3 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => removeFav(f.id)}
                className="text-xl text-amber-500 hover:text-amber-600"
                title="取消收藏"
              >
                ★
              </button>
              <div>
                <span className="font-semibold text-lg">{f.word}</span>
                <span className="ml-2 text-xs text-slate-500">關卡 {f.level} · 第 {f.idx + 1} 題</span>
              </div>
            </div>
            <Link
              href={`/level/${f.level}?idx=${f.idx}`}
              className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              去看 →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
