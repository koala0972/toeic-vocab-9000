'use client';

import { useEffect, useState } from 'react';
import { t, type LangCode } from '@/lib/i18n';

interface Props {
  ids: string[];                       // 完整 vocabulary id, 例 ["A1-001-001", ...]
  onToggle: (id: string) => boolean;   // 回傳新狀態 true/false
}

function readFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem('favorites') ?? '[]'));
  } catch {
    return new Set();
  }
}

function writeFavorites(set: Set<string>) {
  localStorage.setItem('favorites', JSON.stringify(Array.from(set)));
}

export function FavoriteStar({ ids, onToggle }: Props) {
  const [fav, setFav] = useState(false);
  const [lang, setLang] = useState<LangCode>('zh-TW');
  const id = ids[0];

  useEffect(() => {
    setFav(readFavorites().has(id));
    const s = localStorage.getItem('lang') as LangCode | null;
    if (s) setLang(s);
  }, [id]);

  const click = () => {
    const f = readFavorites();
    let nowOn = false;
    if (f.has(id)) { f.delete(id); nowOn = false; }
    else           { f.add(id);    nowOn = true;  }
    writeFavorites(f);
    setFav(nowOn);
    onToggle(id);
  };

  return (
    <button
      onClick={click}
      className="text-2xl select-none leading-none"
      aria-label="favorite"
      title={fav ? t(lang, 'unfavorite') : t(lang, 'favorite')}
    >
      {fav ? '★' : '☆'}
    </button>
  );
}

export function isFavorited(id: string): boolean {
  return readFavorites().has(id);
}

export function getAllFavorites(): string[] {
  return Array.from(readFavorites());
}
