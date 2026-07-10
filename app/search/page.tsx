'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { VoiceButton } from '@/components/VoiceButton';
import type { VocabularyEntry } from '@/lib/types';
import type { LangCode } from '@/lib/lang';

interface SearchableEntry extends VocabularyEntry {
  _level: number;
  _idx: number;
}

const SUPPORTED_LANGS: LangCode[] = ['zh-TW', 'ja', 'ko'];

export default function SearchPage() {
  const [entries, setEntries] = useState<SearchableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [lang, setLang] = useState<LangCode>('zh-TW');

  useEffect(() => {
    setLoading(true);
    // 用 /api/levels/index 取所有 id, 太慢 → 改呼叫一個輕量 manifest
    fetch('/api/manifest')
      .then(r => r.json())
      .then((j) => {
        const all = j.entries as Array<[number, string, number]>;  // [level, word, idxInLevel]
        setEntries(all.map(([lvl, w, idx]) => ({
          id: `${lvl}-${w}`, _level: lvl, _idx: idx, level: lvl,
          // 之後可改用 /api/levels/[n]/[i] 拿 detail
          word: w, phonetic: '', pos: [], conjugations: {}, translations: [],
          examples: [], synonyms: [], antonyms: [], phrases: [],
          cefr: 'A1', toeic_score_min: 0, tier: 'basic', domain: '',
        } as any)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = localStorage.getItem('lang') as LangCode | null;
    if (s) setLang(s);
  }, []);

  const filtered = useMemo(() => {
    if (!q) return [];
    const want = q.toLowerCase();
    const matches = entries.filter(e => {
      if (activeTab !== 'all') {
        if (activeTab === 'basic' && e._level > 300) return false;
        if (activeTab === 'intermediate' && (e._level <= 300 || e._level > 600)) return false;
        if (activeTab === 'advanced'    && e._level <= 600) return false;
      }
      return e.word.toLowerCase().includes(want);
    });
    return matches.slice(0, 50);
  }, [entries, q, activeTab]);

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Link href="/" className="text-blue-600 text-sm">← 回首頁</Link>
      <h1 className="text-2xl font-bold mt-3">🔍 搜尋單字</h1>

      <div className="mt-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="輸入英文單字…"
          className="w-full px-4 py-3 border rounded-xl text-lg focus:bg-white bg-white"
          autoFocus
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {(['all','basic','intermediate','advanced'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1 rounded border ${activeTab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'}`}
          >
            {t === 'all' ? '全部' : t === 'basic' ? '基礎' : t === 'intermediate' ? '中級' : '高級'}
          </button>
        ))}
      </div>

      {loading && <div className="mt-6 text-slate-500">準備搜尋索引…</div>}

      <div className="mt-6">
        {!q && <div className="text-slate-400 text-sm">輸入字串以開始搜尋</div>}
        {q && filtered.length === 0 && !loading && (
          <div className="text-slate-500 text-sm">找不到符合的字</div>
        )}
        <ul className="space-y-2">
          {filtered.map(e => (
            <li key={e.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{e.word}</span>
                  <span className="ml-2 text-xs text-slate-500">關卡 {e._level}</span>
                </div>
                <div className="flex gap-2">
                  <VoiceButton lang={lang} text={e.word} rate={1.0} langForTTS="en" />
                  <Link
                    href={`/level/${e._level}?idx=${e._idx}`}
                    className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200"
                  >
                    去關卡
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
