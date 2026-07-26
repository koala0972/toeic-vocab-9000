'use client';

import type { VocabularyEntry } from '@/lib/types';
import type { LangCode } from '@/lib/lang';
import { speakWithDuration, stopSpeak } from '@/lib/speech';

/**
 * 「重覆播放」: 依序朗讀單字的所有內容, 循環播放.
 *
 * 順序:
 *   1. 中文解釋 (tr.lang_word + tr.definition 合併)
 *   2. 英文單字 (entry.word)
 *   3. 每個例句的中文翻譯 → 英文原句
 *
 * 停頓規則:
 *   - 中文念完不停, 直接接英文
 *   - 英文念完停「英文播放時長」讓使用者跟著唸
 *
 * 控制:
 *   - start() 開始循環, stop() 停止 + cancel 語音
 *   - 同一時間只能有一個循環 (自動停上一個)
 *   - 觸發 stop() 後 isRunning 立即 false
 */

type RepeatHanlder = (running: boolean) => void;

interface Segment {
  lang: LangCode;
  text: string;
  /** true = 英文/外語, 念完要停 = 自身時長; false = 中文, 不停 */
  pauseAfterSelf: boolean;
}

let runningRef: { stop: boolean; handler?: RepeatHanlder } | null = null;

function buildSegments(entry: VocabularyEntry, lang: Exclude<LangCode, 'en'>): Segment[] {
  const segs: Segment[] = [];

  // 1. 英文單字先念, 念完停
  if (entry.word) {
    segs.push({ lang: 'en', text: entry.word, pauseAfterSelf: true });
  }

  // 2. 中文解釋: lang_word + definition, 不停
  const tr = entry.translations.find(t => t.lang === lang)
          ?? entry.translations.find(t => t.lang === 'zh-TW');
  if (tr) {
    const zhText = tr.lang_word && tr.lang_word !== entry.word
      ? `${tr.lang_word}。${tr.definition}`
      : tr.definition;
    if (zhText.trim()) {
      segs.push({ lang, text: zhText, pauseAfterSelf: false });
    }
  }

  // 3. 每個例句: 中文翻譯 (不停) → 英文 (停)
  for (const ex of entry.examples ?? []) {
    const zh = ex.translations[lang] ?? ex.translations['zh-TW'] ?? '';
    if (zh.trim()) {
      segs.push({ lang, text: zh, pauseAfterSelf: false });
    }
    if (ex.en.trim()) {
      segs.push({ lang: 'en', text: ex.en, pauseAfterSelf: true });
    }
  }

  return segs;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 啟動重覆播放. 回傳一個 stop 函數, 呼叫後立即終止.
 * 如果已有循環在跑, 會先停掉前一個.
 */
export function startRepeatPlay(
  entry: VocabularyEntry,
  lang: Exclude<LangCode, 'en'>,
  rate: number,
  onStateChange?: RepeatHanlder,
): () => void {
  // 停掉前一個
  if (runningRef) {
    runningRef.stop = true;
    runningRef.handler?.(false);
    runningRef = null;
  }
  stopSpeak();

  const state = { stop: false, handler: onStateChange };
  runningRef = state;
  onStateChange?.(true);

  const segments = buildSegments(entry, lang);
  if (segments.length === 0) {
    state.stop = true;
    runningRef = null;
    onStateChange?.(false);
    return () => {};
  }

  // 非阻塞跑循環
  void (async () => {
    while (!state.stop) {
      for (const seg of segments) {
        if (state.stop) break;
        const dur = await speakWithDuration({
          lang: seg.lang,
          text: seg.text,
          rate,
        });
        if (state.stop) break;
        // 中文不停 (pauseAfterSelf=false), 英文停 = 英文時長
        if (seg.pauseAfterSelf && dur > 0) {
          await sleep(dur);
        }
      }
    }
    stopSpeak();
    runningRef = null;
    onStateChange?.(false);
  })();

  return () => {
    state.stop = true;
    stopSpeak();
    if (runningRef === state) runningRef = null;
    onStateChange?.(false);
  };
}

/** 是否正在跑 */
export function isRepeatPlaying(): boolean {
  return runningRef !== null && !runningRef.stop;
}

/** 強制停止 */
export function stopRepeatPlay() {
  if (runningRef) {
    runningRef.stop = true;
    runningRef.handler?.(false);
    runningRef = null;
  }
  stopSpeak();
}
