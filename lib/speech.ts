'use client';

// Web Speech API 工具 - 統一介面，方便日後換成 Google TTS
// 目前免費、零設定

export type LangCode = 'zh-TW' | 'ja' | 'ko' | 'en';

let voicesCache: SpeechSynthesisVoice[] | null = null;

export const SUPPORTED_LANGS: LangCode[] = ['zh-TW', 'ja', 'ko', 'en'];

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    if (voicesCache) return resolve(voicesCache);
    let handled = false;
    const tryLoad = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        voicesCache = v;
        if (!handled) { handled = true; resolve(v); }
      }
    };
    tryLoad();
    if (!handled) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0 && !handled) {
          handled = true;
          voicesCache = v;
          resolve(v);
        }
      };
      // 安全網: 2s 仍未觸發就回空陣列
      setTimeout(() => { if (!handled) { handled = true; resolve([]); } }, 2000);
    }
  });
}

export function pickBestVoice(voices: SpeechSynthesisVoice[], lang: LangCode): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  // 偏好: en-US (這套系統多益以美式英文為主)
  const prefer = {
    'en': ['en-US', 'en-GB'],
    'zh-TW': ['zh-TW', 'zh-Hant', 'zh-CN', 'zh'],
    'ja': ['ja-JP', 'ja'],
    'ko': ['ko-KR', 'ko'],
  }[lang];
  for (const prefix of prefer ?? []) {
    const v = voices.find(x => x.lang === prefix || x.lang?.startsWith(prefix));
    if (v) return v;
  }
  return voices.find(v => v.lang?.startsWith(lang.split('-')[0])) ?? null;
}

export interface SpeakOpts {
  lang: LangCode;
  text: string;
  rate?: number;      // 0.7 / 1.0 / 1.3
  pitch?: number;
}

let currentUtter: SpeechSynthesisUtterance | null = null;

export async function speak(opts: SpeakOpts): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  // 取消殘留
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  const voices = await getVoices();
  const chosen = pickBestVoice(voices, opts.lang);
  const u = new SpeechSynthesisUtterance(opts.text);
  if (chosen) u.voice = chosen;
  u.lang = chosen?.lang ?? opts.lang;
  u.rate = opts.rate ?? 1.0;
  u.pitch = opts.pitch ?? 1.0;
  currentUtter = u;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  currentUtter = null;
}
