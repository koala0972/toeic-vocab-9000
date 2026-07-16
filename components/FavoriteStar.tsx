'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getFavorites,
  setFavorites,
  getLang,
  setLang,
  migrateFromLocalStorage,
  type FavoriteEntry,
} from '@/lib/storage';
import { t, type LangCode } from '@/lib/i18n';

// Re-export 型別，讓舊 import (從 components/FavoriteStar 拿) 還能用
export type { FavoriteEntry } from '@/lib/storage';

interface Props {
  id: string;
  word: string;
  level: number;
  idx: number;
  onToggle?: (id: string) => boolean;
}

const READY_EVENT = 'vkv-data-changed';

export function FavoriteStar({ id, word, level, idx, onToggle }: Props) {
  const [fav, setFav] = useState(false);
  const [lang, setLangState] = useState<LangCode>('zh-TW');

  const refresh = useCallback(async () => {
    const [favs, l] = await Promise.all([getFavorites(), getLang()]);
    setFav(favs.some(e => e.id === id));
    if (l) setLangState(l as LangCode);
  }, [id]);

  useEffect(() => {
    void migrateFromLocalStorage().then(refresh);
    window.addEventListener(READY_EVENT, refresh);
    return () => window.removeEventListener(READY_EVENT, refresh);
  }, [refresh]);

  const click = async () => {
    const list = await getFavorites();
    const exists = list.some(e => e.id === id);
    let next: FavoriteEntry[];
    if (exists) {
      next = list.filter(e => e.id !== id);
    } else {
      next = [...list, { id, word, level, idx }];
    }
    await setFavorites(next);
    setFav(!exists);
    window.dispatchEvent(new Event(READY_EVENT));
    onToggle?.(id);
  };

  return (
    <button
      onClick={click}
      className={`text-2xl select-none leading-none ${fav ? 'text-amber-400' : 'text-slate-300'}`}
      aria-label="favorite"
      title={fav ? t(lang, 'unfavorite') : t(lang, 'favorite')}
    >
      {fav ? '★' : '☆'}
    </button>
  );
}

export async function isFavorited(id: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.some(e => e.id === id);
}

export async function getAllFavorites(): Promise<FavoriteEntry[]> {
  return await getFavorites();
}

// 保留工具 setLang 給其他模組用
export { setLang };
