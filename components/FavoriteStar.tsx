'use client';

import { useEffect, useState } from 'react';
import { t, type LangCode } from '@/lib/i18n';

export interface FavoriteEntry {
  id: string;
  word: string;
  level: number;
  idx: number;
}

interface Props {
  id: string;
  word: string;
  level: number;
  idx: number;
  onToggle?: (id: string) => boolean;
}

function readFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem('favorites') ?? '[]');
    // Migrate: if old format (array of strings), convert to objects
    if (raw.length > 0 && typeof raw[0] === 'string') {
      const migrated = raw.map((id: string) => {
        const parts = id.split('-');
        return { id, word: id, level: parseInt(parts[1] ?? '0', 10), idx: parseInt(parts[2] ?? '0', 10) - 1 };
      });
      localStorage.setItem('favorites', JSON.stringify(migrated));
      return migrated;
    }
    return raw;
  } catch {
    return [];
  }
}

function writeFavorites(list: FavoriteEntry[]) {
  localStorage.setItem('favorites', JSON.stringify(list));
}

export function FavoriteStar({ id, word, level, idx, onToggle }: Props) {
  const [fav, setFav] = useState(false);
  const [lang, setLang] = useState<LangCode>('zh-TW');

  useEffect(() => {
    setFav(readFavorites().some(e => e.id === id));
    const s = localStorage.getItem('lang') as LangCode | null;
    if (s) setLang(s);
  }, [id]);

  const click = () => {
    const list = readFavorites();
    const exists = list.some(e => e.id === id);
    let nowOn = false;
    if (exists) {
      writeFavorites(list.filter(e => e.id !== id));
      nowOn = false;
    } else {
      list.push({ id, word, level, idx });
      writeFavorites(list);
      nowOn = true;
    }
    setFav(nowOn);
    onToggle?.(id);
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
  return readFavorites().some(e => e.id === id);
}

export function getAllFavorites(): FavoriteEntry[] {
  return readFavorites();
}
