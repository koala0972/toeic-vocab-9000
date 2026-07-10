'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { WordCard } from '@/components/WordCard';
import { VoiceButton } from '@/components/VoiceButton';
import type { VocabularyEntry } from '@/lib/types';
import type { LangCode } from '@/lib/lang';
import { speak, stopSpeak } from '@/lib/speech';

type LevelPageLang = Exclude<LangCode, 'en'>;

interface LevelData {
  level: number;
  words: VocabularyEntry[];
}

export default function LevelPage() {
  const params = useParams<{ n: string }>();
  const searchParams = useSearchParams();
  const n = parseInt(params.n, 10);
  const initialIdx = parseInt(searchParams.get('idx') ?? '0', 10);
  const [data, setData] = useState<LevelData | null>(null);
  const [error, setError] = useState<string>('');
  const [idx, setIdx] = useState(initialIdx || 0);
  const [lang, setLang] = useState<LevelPageLang>('zh-TW');
  const [rate, setRate] = useState<number>(1.0);
  const [showAnswer, setShowAnswer] = useState(true);

  // 載入關卡資料
  useEffect(() => {
    if (!n || isNaN(n)) return;
    setData(null); setError('');
    // 保留 URL 帶來的 idx, 但 data 載入後才生效
    const urlIdx = parseInt(searchParams.get('idx') ?? '0', 10);
    setIdx(isNaN(urlIdx) ? 0 : urlIdx);
    fetch(`/api/levels/${n}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) {
          setError(j?.message ?? `HTTP error`);
          return;
        }
        setData(j);
      })
      .catch(e => setError(String(e)));
  }, [n]);

  // 學習方語言
  useEffect(() => {
    const saved = localStorage.getItem('lang') as LevelPageLang | null;
    if (saved) setLang(saved);
    const r = parseFloat(localStorage.getItem('rate') ?? '1.0');
    if (!isNaN(r)) setRate(r);
  }, []);

  // 記錄關卡進度 (用 localStorage 一時先)
  useEffect(() => {
    if (!data || idx <= 0) return;
    try {
      const p = JSON.parse(localStorage.getItem('progress') ?? '{}');
      p[data.level] = Math.max(p[data.level] ?? 0, idx);
      localStorage.setItem('progress', JSON.stringify(p));
    } catch {}
  }, [idx, data?.level]);

  const setLangPersist = (l: LevelPageLang) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };
  const setRatePersist = (r: number) => {
    setRate(r);
    localStorage.setItem('rate', r.toString());
  };

  const goNext = useCallback(() => {
    if (!data) return;
    setIdx((i) => (i + 1 < data.words.length ? i + 1 : i));
    // 到最後一題不自動跳關 (由按鈕觸發)
  }, [data]);

  const goNextOrLevel = useCallback(() => {
    if (!data) return;
    if (idx + 1 < data.words.length) {
      setIdx(idx + 1);
    } else {
      // 最後一題 → 跳下一關
      const next = n + 1;
      if (next <= 900) window.location.href = `/level/${next}`;
    }
  }, [data, idx, n]);
  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
  }, []);
  const toggleAnswer = useCallback(() => setShowAnswer(s => !s), []);

  const speakCurrent = useCallback(async () => {
    if (!data) return;
    const entry = data.words[idx];
    await speak({ lang: 'en', text: entry.word, rate });
  }, [data, idx, rate]);

  // 鍵盤快捷鍵
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); speakCurrent(); }
      else if (e.code === 'ArrowRight') goNextOrLevel();
      else if (e.code === 'ArrowLeft') {
        if (idx > 0) setIdx(idx - 1);
        else if (n > 1) window.location.href = `/level/${n - 1}`;
      }
      else if (e.key.toLowerCase() === 'a') toggleAnswer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speakCurrent, goNextOrLevel, toggleAnswer]);

  useEffect(() => () => stopSpeak(), []);

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <Link href="/" className="text-blue-600 text-sm">← 回首頁</Link>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
          <div className="font-semibold text-amber-800">關卡尚未產生</div>
          <div className="text-slate-700 mt-2 text-sm">{error}</div>
          <div className="text-xs text-slate-500 mt-3">關卡編號: {n}</div>
        </div>
      </main>
    );
  }

  if (!data) return <main className="max-w-2xl mx-auto p-6">載入中…</main>;

  const entry = data.words[idx];
  const prevLevel = n > 1 ? n - 1 : null;
  const nextLevel = n < 900 ? n + 1 : null;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">← 首頁</Link>
        <div className="flex gap-3 items-center">
          <span className="text-slate-500">語速</span>
          {[0.5, 0.7, 1.0].map(r => (
            <button
              key={r}
              onClick={() => setRatePersist(r)}
              className={`px-2 py-0.5 rounded border text-xs ${rate === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'}`}
            >
              {r.toFixed(1)}x
            </button>
          ))}
          <span className="ml-3 text-slate-500">語言</span>
          <button
            onClick={() => setLangPersist('zh-TW')}
            className={`px-2 py-0.5 rounded border text-xs flex items-center gap-1 ${lang === 'zh-TW' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'}`}
          >
            🇹🇼 繁中
          </button>
        </div>
      </div>

      <div className="mb-3 flex justify-between items-center text-sm text-slate-600">
        <div>關卡 {n} · 第 <b>{idx + 1}</b>/{data.words.length} 題</div>
        <div className="flex gap-2">
          {prevLevel && <Link href={`/level/${prevLevel}`} className="text-blue-600 hover:underline">← {prevLevel}</Link>}
          {nextLevel && <Link href={`/level/${nextLevel}`} className="text-blue-600 hover:underline">{nextLevel} →</Link>}
        </div>
      </div>

      <div className="mb-3 h-1.5 bg-slate-200 rounded overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${((idx + 1) / data.words.length) * 100}%` }}
        />
      </div>

      {/* 當前單字卡 */}
      <WordCard
        entry={data.words[idx]}
        lang={lang}
        rate={rate}
        idx={idx}
        showAnswer={showAnswer}
        onToggleAnswer={toggleAnswer}
      />

      {/* 整個關卡字的快速導覽 (十個字全部列出) */}
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">本關全部單字</h3>
        <div className="grid grid-cols-5 gap-2">
          {data.words.map((w, i) => (
            <button
              key={w.id}
              onClick={() => setIdx(i)}
              className={
                'px-2 py-2 rounded text-xs sm:text-sm font-semibold border ' +
                (i === idx
                  ? 'bg-blue-600 text-white border-blue-600'
                  : i < idx
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white border-slate-300 hover:bg-slate-50')
              }
              title={w.word}
            >
              {w.word}
            </button>
          ))}
        </div>
      </section>

      {/* 上一/下一題 */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => {
            if (idx > 0) setIdx(idx - 1);
            else if (n > 1) window.location.href = `/level/${n - 1}`;
          }}
          className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
        >
          ← 上一題
        </button>
        <button onClick={() => speakCurrent()} className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">
          🔊 再聽一次
        </button>
        <button onClick={goNextOrLevel} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          {idx + 1 < data.words.length ? '下一題 →' : '下一關 →'}
        </button>
      </div>

      {/* 主題: 學習進度存 localStorage, 之後可改 Supabase */}
      <p className="mt-6 text-xs text-slate-400 text-center">
        學習進度儲存於本機瀏覽器 (之後可接 Supabase 跨裝置同步)
      </p>
    </main>
  );
}
