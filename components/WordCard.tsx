'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { VoiceButton } from './VoiceButton';
import { FavoriteStar } from './FavoriteStar';
import {
  highlightChinese,
  findHighlightIndices,
  tokenizeSentence,
} from '@/lib/highlight';
import { t } from '@/lib/i18n';
import type { LangCode } from '@/lib/lang';
import type { VocabularyEntry } from '@/lib/types';

interface Props {
  entry: VocabularyEntry;
  lang: Exclude<LangCode, 'en'>;
  rate: number;
  idx: number;
  onViewed?: () => void;
  showAnswer: boolean;
  onToggleAnswer: () => void;
}

// 用單字搜尋頁跳轉
function WordLink({ word }: { word: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(word)}`}
      className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:underline"
      title={`搜尋 "${word}"`}
    >
      {word}
    </Link>
  );
}

function AntonymLink({ word }: { word: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(word)}`}
      className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 hover:underline"
      title={`搜尋 "${word}"`}
    >
      {word}
    </Link>
  );
}

function PhraseLink({ phrase }: { phrase: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(phrase)}`}
      className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200 hover:underline"
      title={`搜尋 "${phrase}"`}
    >
      {phrase}
    </Link>
  );
}

export function WordCard({ entry, lang, rate, idx, onViewed, showAnswer, onToggleAnswer }: Props) {
  const tr = entry.translations.find(t => t.lang === lang)
          ?? entry.translations.find(t => t.lang === 'zh-TW')!;
  const langWordList = useMemo(() => [tr.lang_word], [tr.lang_word]);

  // 例句高亮索引
  const [activeExIdx, setActiveExIdx] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  useEffect(() => { onViewed?.(); }, []);

  // 點英文 token: 同 set 的中文翻譯字反白
  const handleTokenClick = (idx: number, tok: string) => {
    setSelectedWord(prev => (prev === tok ? null : tok));
    setActiveExIdx(idx);
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5">
      {/* 標題列 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-bold tracking-tight">{entry.word}</h2>
            <FavoriteStar id={entry.id} word={entry.word} level={entry.level} idx={idx} onToggle={() => false} />
          </div>
          <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-3">
            <span>CEFR {entry.cefr}</span>
            <span>多益 ≥ {entry.toeic_score_min}</span>
            <span>{entry.domain.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <VoiceButton lang={lang} text={entry.word} rate={rate} />
        </div>
      </div>

      {/* 詞性整合(同一個單字內多詞性) */}
      <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
        {entry.pos.map(p => (
          <span key={p} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {p}
          </span>
        ))}
        {Object.entries(entry.conjugations).map(([k, v]) => (
          <span key={k} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-xs">
            {k.replace(/_/g, ' ')}: <b>{v}</b>
          </span>
        ))}
      </div>

      {/* 中英文意義切換 */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">{t(lang, 'definition')}</div>
          <button
            onClick={onToggleAnswer}
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
          >
            {showAnswer ? t(lang, 'hideAnswer') : t(lang, 'showAnswer')}
          </button>
        </div>
        {showAnswer ? (
          <div className="mt-2 text-lg">
            <span className="font-semibold text-slate-900">{tr.lang_word}</span>
            <span className="text-slate-600"> — {tr.definition}</span>
          </div>
        ) : (
          <div className="mt-2 text-slate-400 italic">— — — — — (點右上顯示)</div>
        )}
      </div>

      {/* 同反義詞與片語 */}
      {(entry.synonyms.length || entry.antonyms.length || entry.phrases.length) ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {entry.synonyms.length > 0 && (
            <div>
              <div className="text-slate-500">{t(lang, 'synonyms')}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.synonyms.map(s => <WordLink key={s} word={s} />)}
              </div>
            </div>
          )}
          {entry.antonyms.length > 0 && (
            <div>
              <div className="text-slate-500">{t(lang, 'antonyms')}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.antonyms.map(a => <AntonymLink key={a} word={a} />)}
              </div>
            </div>
          )}
          {entry.phrases.length > 0 && (
            <div>
              <div className="text-slate-500">{t(lang, 'phrases')}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.phrases.map(p => <PhraseLink key={p} phrase={p} />)}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* 例句列表 - 點英文→反白中文；點中文反白→反白英文 */}
      {entry.examples.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-slate-500 mb-2">{t(lang, 'example')}</div>
          <div className="space-y-3">
            {entry.examples.map((ex, i) => {
              // 計算反白: 若使用者選了英文 token, 用自己 highlight array 取代
              const highlightForRender = selectedWord ? [selectedWord] : ex.highlight;
              const tokens = tokenizeSentence(ex.en);
              const hlIndices = findHighlightIndices(tokens, highlightForRender);
              const trText = ex.translations[lang] ?? ex.translations['zh-TW'] ?? '';
              const zhHTML = selectedWord
                // 中文一側沒有該英文詞的對應, 只單純渲染(預設反白主單字)
                ? highlightChinese(trText, langWordList)
                : highlightChinese(trText, langWordList);
              return (
                <div key={i} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-start gap-2">
                    <p className={`leading-relaxed text-base ${selectedWord ? 'text-blue-700' : ''}`}>
                      {tokens.map((tok, ti) => (
                        <span
                          key={ti}
                          className={
                            'word-token' +
                            (hlIndices.has(ti) ? ' highlighted' : '') +
                            (selectedWord === tok.text ? ' selected' : '')
                          }
                          onClick={tok.isWord ? () => handleTokenClick(ti, tok.text) : undefined}
                        >
                          {tok.text}
                        </span>
                      ))}
                    </p>
                    <VoiceButton lang={lang} text={ex.en} rate={rate} langForTTS="en" />
                  </div>
                  {showAnswer && (
                    <div className="mt-2 text-slate-700 leading-relaxed border-t pt-2">
                      <span
                        dangerouslySetInnerHTML={{ __html: zhHTML }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.tagName === 'SPAN' && target.dataset.zhWord) {
                            // 反向: 點中文 → 反白英文
                            setSelectedWord(target.dataset.zhWord);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2 text-xs text-slate-500 border-t pt-3">
        <span>快捷鍵:</span>
        <kbd className="px-1 border rounded">Space</kbd> 播放/暫停
        <kbd className="px-1 border rounded">→</kbd> 下一題
        <kbd className="px-1 border rounded">←</kbd> 上一題
        <kbd className="px-1 border rounded">A</kbd> 顯示/隱藏翻譯
        <kbd className="px-1 border rounded">F</kbd> 收藏
      </div>
    </div>
  );
}
