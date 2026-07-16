'use client';

import { TIERS, TOTAL_LEVELS, WORDS_PER_LEVEL } from '@/lib/levels-config';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import {
  getProgress,
  getLang,
  setLang,
  migrateFromLocalStorage,
} from '@/lib/storage';
import { DataManager } from '@/components/DataManager';

const SUPPORTED_LANGS = [
  { code: 'zh-TW', label: '🇹🇼 繁體中文' },
];

const READY_EVENT = 'vkv-data-changed';

export default function Home() {
  const [lang, setLangState] = useState<string>('zh-TW');
  const [progress, setProgress] = useState<Record<number, number>>({});

  const refresh = useCallback(async () => {
    const [p, l] = await Promise.all([getProgress(), getLang()]);
    setProgress(p);
    if (l) setLangState(l);
  }, []);

  useEffect(() => {
    void migrateFromLocalStorage().then(refresh);
    window.addEventListener(READY_EVENT, refresh);
    return () => window.removeEventListener(READY_EVENT, refresh);
  }, [refresh]);

  const pickLang = async (l: string) => {
    setLangState(l);
    await setLang(l);
  };

  const completedCount = Object.values(progress).filter(v => v >= 10).length;
  const visitedCount   = Object.keys(progress).length;
  const pct = Math.round((completedCount / TOTAL_LEVELS) * 100);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">📚 TOEIC 多益單字 9000</h1>
        <p className="text-slate-600 mt-2">
          {TOTAL_LEVELS} 關 × {WORDS_PER_LEVEL} 個單字 = {TOTAL_LEVELS * WORDS_PER_LEVEL} 題 · 以多益題庫為基礎由淺入深
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-slate-500">學習方語言</span>
          <div className="flex gap-2">
            {SUPPORTED_LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => pickLang(l.code)}
                className={`px-3 py-1 rounded text-sm border ${
                  lang === l.code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-white border rounded-lg">
          <div className="text-sm text-slate-500">學習進度</div>
          <div className="text-lg font-semibold">
            {completedCount} / {TOTAL_LEVELS} 關完成 ({pct}%)
          </div>
          <div className="h-2 bg-slate-200 rounded mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            瀏覽過 {visitedCount} 關 · 資料存於本機瀏覽器 (IndexedDB)
          </div>
        </div>

        <div className="mt-3 flex gap-3 text-sm">
          <Link href="/search" className="text-blue-600 hover:underline">搜尋單字</Link>
          <Link href="/favorites" className="text-blue-600 hover:underline">收藏清單</Link>
        </div>

        <DataManager />
      </header>

      <div className="grid gap-4">
        {TIERS.map(t => {
          const tierCompleted = Object.entries(progress)
            .filter(([lv, v]) => v >= 10 && Number(lv) >= t.levels[0] && Number(lv) <= t.levels[1])
            .length;
          const tierTotal = t.levels[1] - t.levels[0] + 1;
          const tierPct = Math.round((tierCompleted / tierTotal) * 100);
          return (
            <Link
              key={t.name}
              href={`/browse/${t.name}`}
              className="block p-5 bg-white border rounded-xl hover:shadow-md hover:border-blue-300 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{t.zhName}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    關卡 {t.levels[0]} ~ {t.levels[1]} · CEFR {t.cefrRange[0]}–{t.cefrRange[1]} · 多益 {t.toeicRange[0]}–{t.toeicRange[1]} 分
                  </div>
                  <div className="text-xs text-slate-400 mt-2">{t.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{tierCompleted}/{tierTotal}</div>
                  <div className="text-xs text-slate-500">{tierPct}%</div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 rounded mt-3 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${tierPct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <footer className="mt-10 text-xs text-slate-400 text-center">
        v0.2 · IndexedDB 本機儲存 + JSON 備份匯出/匯入
      </footer>
    </main>
  );
}
