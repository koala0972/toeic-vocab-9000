/**
 * 備份 ↔ 還原工具
 * - 完全與儲存實作解耦：只 import storage 介面，不碰 IndexedDB API
 * - 匯出：把 `{ progress, favorites, lang, rate, lastBackupAt }` 包成 JSON Blob 給瀏覽器下載
 * - 匯入：
 *    - merge 模式 (預設)：合併，不覆蓋未提及的鍵；同鍵且較舊時間戳的 progress 不覆蓋
 *    - replace 模式：完全取代
 * - 任何外部使用者同步 (未來 Supabase 等) 只要呼叫同一個 export/import 函式
 */

import {
  getAllKV,
  getFavorites,
  getLastBackupAt,
  getLang,
  getProgress,
  getRate,
  setAllKV,
  setFavorites,
  setLastBackupAt,
  setLang,
  setLevelProgress,
  setProgress,
  setRate,
} from './storage';

export const BACKUP_VERSION = 1;
export const BACKUP_MIME = 'application/json';

export interface BackupShape {
  schema: 'toeic-vocab-backup';
  version: number;
  exportedAt: string;        // ISO8601
  app: { name: string; version: string };
  data: {
    progress?: Record<number, number>;
    favorites?: unknown[];    // raw, validated at import time
    lang?: string;
    rate?: number;
  };
}

/** 把目前所有 user data 包成一個備份物件。同步函式——記憶體內的快照，不鎖 DB。 */
export async function buildBackup(): Promise<BackupShape> {
  const [progress, favorites, lang, rate] = await Promise.all([
    getProgress(),
    getFavorites(),
    getLang(),
    getRate(),
  ]);
  return {
    schema: 'toeic-vocab-backup',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: { name: 'toeic-vocab', version: '0.1' },
    data: { progress, favorites, lang: lang ?? undefined, rate: rate ?? 1.0 },
  };
}

/** 觸發瀏覽器下載備份檔。檔名 `toeic-backup-{date}.json`。 */
export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: BACKUP_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `toeic-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 讓瀏覽器有時間真的觸發下載再回收
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  await setLastBackupAt(backup.exportedAt);
}

/** 解析使用者上傳的 JSON，順便做基本結構驗證。 */
export function parseBackup(text: string): BackupShape {
  let obj: unknown;
  try { obj = JSON.parse(text); } catch {
    throw new Error('不是有效的 JSON 檔案');
  }
  if (!obj || typeof obj !== 'object') throw new Error('檔案內容不是 JSON 物件');
  const b = obj as Partial<BackupShape>;
  if (b.schema !== 'toeic-vocab-backup') throw new Error('檔案格式不符（不是 toeic-vocab 備份）');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error(`備份版本過新 (${b.version})，請更新 App`);
  }
  if (!b.data || typeof b.data !== 'object') throw new Error('備份缺少 data 區塊');
  return b as BackupShape;
}

export interface ImportSummary {
  progress: { added: number; updated: number };
  favorites: { added: number; kept: number };
  lang: boolean;
  rate: boolean;
}

/**
 * 把備份寫進當前儲存。
 * @param mode 'merge'（預設）：合併，不覆蓋本地已有且較新的資料
 *             'replace'：完全取代
 */
export async function importBackup(
  backup: BackupShape,
  mode: 'merge' | 'replace' = 'merge',
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    progress: { added: 0, updated: 0 },
    favorites: { added: 0, kept: 0 },
    lang: false,
    rate: false,
  };

  // progress
  if (backup.data.progress) {
    if (mode === 'replace') {
      await setProgress(backup.data.progress);
      summary.progress.added = Object.keys(backup.data.progress).length;
    } else {
      const cur = await getProgress();
      for (const [k, v] of Object.entries(backup.data.progress)) {
        const level = Number(k);
        if (cur[level] === undefined) {
          await setLevelProgress(level, v as number);
          summary.progress.added += 1;
        } else if (v as number > cur[level]) {
          await setLevelProgress(level, v as number);
          summary.progress.updated += 1;
        }
      }
    }
  }

  // favorites — 依 id 去重
  if (backup.data.favorites) {
    const cur = await getFavorites();
    const curIds = new Set(cur.map(f => f.id));
    const incoming = backup.data.favorites as Array<{ id: string }>;
    if (mode === 'replace') {
      await setFavorites(incoming as never);
      summary.favorites.added = incoming.length;
    } else {
      const merged = [...cur];
      for (const f of incoming) {
        if (!curIds.has(f.id)) {
          merged.push(f as never);
          curIds.add(f.id);
          summary.favorites.added += 1;
        } else {
          summary.favorites.kept += 1;
        }
      }
      await setFavorites(merged);
    }
  }

  // lang / rate
  if (typeof backup.data.lang === 'string') {
    await setLang(backup.data.lang);
    summary.lang = true;
  }
  if (typeof backup.data.rate === 'number') {
    await setRate(backup.data.rate);
    summary.rate = true;
  }

  return summary;
}

/** 從 File 物件一次到位（UI 給 event.target.files[0] 就好） */
export async function importBackupFromFile(
  file: File,
  mode: 'merge' | 'replace' = 'merge',
): Promise<{ summary: ImportSummary; backup: BackupShape }> {
  const text = await file.text();
  const backup = parseBackup(text);
  const summary = await importBackup(backup, mode);
  return { summary, backup };
}

// ─────────────── 給未來雲端同步 (block A) 用的 API ───────────────

/**
 * 把「當前完整狀態」打包成 KV 物件。雲端 sync 用：push 時直接拿這個送上去。
 * 之後無論接到 Supabase / PocketBase / 自架 API，都是同一個 shape。
 */
export async function snapshotAllKV(): Promise<Record<string, unknown>> {
  return await getAllKV();
}

/** 雲端 pull 後，把整包塞回本地（採 merge，較新或較大值優先）。 */
export async function applyRemoteKV(remote: Record<string, unknown>): Promise<void> {
  await setAllKV(remote);
}

/** 讀取最後備份時間（給 UI 顯示）。 */
export { getLastBackupAt };
