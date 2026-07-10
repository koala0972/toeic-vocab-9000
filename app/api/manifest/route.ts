// 批次產生所有 (level, word) 索引快取, 提供 /api/manifest
// 第一次啟動時若 cache 過期就重新掃 data 資料夾, 之後直接回傳
// 對 900 檔案(每檔 10 字)來說, 讀檔只要 < 50 ms

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';

const CACHE_PATH = join(process.cwd(), 'data', '.manifest-cache.json');
const DATA_ROOT = join(process.cwd(), 'data', 'levels');
const MAX_AGE_MS = 60 * 60 * 1000; // 1 小時

interface Manifest {
  generated_at: number;
  total_words: number;
  entries: Array<[number, string, number]>;  // [level, word, idxInLevel]  (compact)
}

async function build(): Promise<Manifest> {
  const entries: Array<[number, string, number]> = [];
  for (const tier of ['basic', 'intermediate', 'advanced']) {
    const dir = join(DATA_ROOT, tier);
    try {
      const files = (await readdir(dir)).filter(f => /^\d+\.json$/.test(f)).sort();
      for (const f of files) {
        const lvl = parseInt(f.replace('.json', ''), 10);
        const data = JSON.parse(await readFile(join(dir, f), 'utf-8'));
        for (let i = 0; i < (data.words ?? []).length; i++) {
          entries.push([lvl, data.words[i].word, i]);
        }
      }
    } catch (e) {
      // dir 不存在就略過(尚未產該級)
    }
  }
  return {
    generated_at: Date.now(),
    total_words: entries.length,
    entries,
  };
}

let cached: Manifest | null = null;

async function get(): Promise<Manifest> {
  if (cached) return cached;
  // 嘗試從檔案 cache 讀
  try {
    const s = await stat(CACHE_PATH);
    if (!isNaN(Date.parse(s.mtime.toString())) && Date.now() - s.mtimeMs < MAX_AGE_MS) {
      cached = JSON.parse(await readFile(CACHE_PATH, 'utf-8'));
      return cached!;
    }
  } catch {}
  // 重建
  cached = await build();
  try {
    await writeFile(CACHE_PATH, JSON.stringify(cached));
  } catch {}
  return cached;
}

export async function GET() {
  try {
    const m = await get();
    return new Response(JSON.stringify(m), {
      headers: { 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'manifest_fail', message: e?.message }), {
      status: 500,
    });
  }
}

export const dynamic = 'force-static';
