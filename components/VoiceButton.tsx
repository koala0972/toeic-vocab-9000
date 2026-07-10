'use client';

import { useState } from 'react';
import { speak } from '@/lib/speech';
import { t } from '@/lib/i18n';
import type { LangCode } from '@/lib/lang';

interface Props {
  lang: LangCode;        // 學習方介面語言 zh-TW/ja/ko (決定按鈕文字)
  text: string;
  rate?: number;
  langForTTS?: LangCode; // 預設 en (因為要唸英文)
  className?: string;
  label?: boolean;
}

export function VoiceButton({ lang, text, rate = 1.0, langForTTS, className, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const tl = (lang === 'en' ? 'zh-TW' : lang) as Parameters<typeof t>[0];

  const onClick = async () => {
    setPlaying(true);
    try {
      await speak({ lang: langForTTS ?? 'en', text, rate });
    } finally {
      setTimeout(() => setPlaying(false), Math.max(800, text.length * 60));
    }
  };

  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1 px-3 py-1 rounded-md border transition ' +
        (playing
          ? 'bg-orange-100 border-orange-300 text-orange-700'
          : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700') +
        (className ? ' ' + className : '')
      }
      aria-label="play"
    >
      <span className="text-base">{playing ? '🔊' : '▶️'}</span>
      {label && <span className="text-sm">{playing ? t(tl, 'playing') : t(tl, 'play')}</span>}
    </button>
  );
}
