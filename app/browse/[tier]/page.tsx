'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TIERS, TOTAL_LEVELS } from '@/lib/levels-config';
import type { LangCode } from '@/lib/lang';

type TierName = 'basic' | 'intermediate' | 'advanced';

export default function BrowseTierPage() {
  const params = useParams<{ tier: string }>();
  const tierName = (params.tier as TierName) ?? 'basic';
  const config = TIERS.find(t => t.name === tierName);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // 取得各 tier 已升級/未升級資訊 (透過 manifest 計算)
  const [manifest, setManifest] = useState<{ entries: [number, string, number][]; total_words: number } | null>(null);

  useEffect(() => {
    fetch('/api/manifest')
      .then(r => r.json())
      .then(setManifest)
      .catch(() => setManifest({ total_words: 0, entries: [] }));
  }, []);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('progress') ?? '{}');
      setProgress(p);
    } catch { setProgress({}); }
  }, []);

  // 依每個 level 顯示升級狀態：已升級 = 該關的 word 陣列內任意一個非 _duplicate
  const levelStatus = useMemo(() => {
    if (!manifest) return new Map<number, 'upgraded' | 'skeleton'>();
    const tierLevels = config ? Array.from({ length: config.levels[1] - config.levels[0] + 1 }, (_, i) => config.levels[0] + i) : [];
    const map = new Map<number, 'upgraded' | 'skeleton'>();
    // 簡化：先用 progress 的 completed 狀態作為升級指標 (不足, 之後可改讀檔)
    for (const lvl of tierLevels) {
      map.set(lvl, 'skeleton');
    }
    return map;
  }, [manifest, config]);

  if (!config) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <Link href="/" className="text-blue-600 text-sm">← 回首頁</Link>
        <h1 className="text-2xl font-bold mt-3">找不到此級數</h1>
      </main>
    );
  }

  const levelFrom = config.levels[0];
  const levelTo = config.levels[1];
  const total = levelTo - levelFrom + 1;

  // 篩選關卡清單
  const filteredLevels = useMemo(() => {
    const all = Array.from({ length: total }, (_, i) => levelFrom + i);
    return all.filter(lvl => {
      const q = search.trim();
      if (q) {
        // 搜尋關卡號碼 (如 "1", "50", "300")
        const n = parseInt(q, 10);
        if (isNaN(n) || `${lvl}`.indexOf(q) === -1) return false;
      }
      if (!showCompleted) {
        const visited = (progress[lvl] ?? 0) > 0;
        if (visited) return false;
      }
      return true;
    });
  }, [levelFrom, total, search, showCompleted, progress]);

  const tierCompleted = Object.entries(progress)
    .filter(([lv, v]) => v >= 10 && Number(lv) >= levelFrom && Number(lv) <= levelTo)
    .length;
  const tierPct = Math.round((tierCompleted / total) * 100);

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-blue-600 text-sm">← 首頁</Link>
        <div className="flex gap-3 items-center text-sm">
          <Link
            href={`/level/${levelFrom}`}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            從第一關開始 →
          </Link>
        </div>
      </div>

      <h1 className="text-3xl font-bold">{config.zhName}級</h1>
      <p className="text-slate-500 mt-1 text-sm">
        關卡 {levelFrom} ~ {levelTo} · 共 {total} 關 · CEFR {config.cefrRange[0]}–{config.cefrRange[1]} · 多益 {config.toeicRange[0]}–{config.toeicRange[1]} 分
      </p>
      <div className="mt-2 text-slate-500 text-sm">{config.description}</div>

      {/* 進度列 */}
      <div className="mt-4 p-3 bg-white border rounded-lg">
        <div className="flex justify-between text-sm">
          <span>完成進度</span>
          <span className="font-semibold text-blue-600">{tierCompleted}/{total} ({tierPct}%)</span>
        </div>
        <div className="h-2 bg-slate-200 rounded mt-2 overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${tierPct}%` }} />
        </div>
      </div>

      {/* 篩選列 */}
      <div className="mt-6 flex gap-3 items-center flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="跳到關卡號碼…（如 50）"
          className="px-3 py-1.5 border rounded text-sm w-48"
        />
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={e => setShowCompleted(e.target.checked)}
          />
          顯示已拜訪
        </label>
        <div className="text-xs text-slate-400 ml-auto">
          顯示 {filteredLevels.length}/{total} 關
        </div>
      </div>

      {/* 關卡網格 */}
      <div className="mt-4 grid grid-cols-5 sm:grid-cols-10 gap-2">
        {filteredLevels.map(lvl => {
          const visited = (progress[lvl] ?? 0) > 0;
          const completed = (progress[lvl] ?? 0) >= 10;
          let cls = 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
          if (completed) cls = 'bg-emerald-100 border-emerald-300 text-emerald-800';
          else if (visited) cls = 'bg-amber-50 border-amber-300 text-amber-800';
          return (
            <Link
              key={lvl}
              href={`/level/${lvl}`}
              className={`px-2 py-2 rounded border text-sm font-semibold text-center transition ${cls}`}
              title={`關卡 ${lvl}${completed ? ' ✅' : visited ? ' ◐' : ''}`}
            >
              {lvl}
            </Link>
          );
        })}
      </div>

      {filteredLevels.length === 0 && (
        <div className="mt-6 text-center text-slate-500 text-sm">沒有符合條件的關卡</div>
      )}

      {/* 級數切換 */}
      <div className="mt-10 border-t pt-4">
        <div className="text-sm text-slate-500 mb-2">切換到其他級數</div>
        <div className="flex gap-2">
          {TIERS.map(t => (
            <Link
              key={t.name}
              href={`/browse/${t.name}`}
              className={`px-3 py-1 rounded border text-sm ${
                t.name === tierName
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.zhName}級
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
