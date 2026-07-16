/**
 * 本機端 IndexedDB 抽象層
 * - 取代 localStorage：資料更耐用（不易被清除），容量更大（數 MB vs 5MB）
 * - 提供一條與「帳號雲端同步」完全無關的 API，之後只需把 storage 介面換成 Supabase/PocketBase
 *   等的實作即可，呼叫端完全不需改。
 * - 第一次載入時會自動把舊 localStorage 裡的 progress/favorites/lang/rate 一次遷移過來。
 *
 * Schema:
 *   kv: { key: string, value: any }   primary key: key
 *
 * Keys:
 *   - 'progress':   Record<number, number>        // 關卡進度 (level -> highest idx visited)
 *   - 'favorites':  FavoriteEntry[]                // 收藏清單
 *   - 'lang':       string                         // 'zh-TW' / 等
 *   - 'rate':       number                         // 0.5 / 0.7 / 1.0
 *   - 'lastBackupAt': string                       // ISO8601，使用者最後匯出 JSON 的時間
 */

const DB_NAME = 'toeic-vocab';
const DB_VERSION = 1;
const STORE = 'kv';

export type ProgressMap = Record<number, number>;

export interface FavoriteEntry {
  id: string;        // e.g. "A1-001-001"
  word: string;
  level: number;
  idx: number;
}

/**
 * 開啟 DB，必要時升級 schema。
 * 用 Promise 包好讓呼叫端 await。
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    let result: T | undefined;
    const req = fn(store);
    if (req instanceof IDBRequest) {
      req.onsuccess = () => { result = req.result as T; };
      req.onerror = () => reject(req.error);
    } else {
      Promise.resolve(req).then(r => { result = r; });
    }
    transaction.oncomplete = () => resolve(result as T);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function put<T>(key: string, value: T): Promise<void> {
  return tx('readwrite', s => s.put({ key, value })).then(() => undefined);
}

function get<T>(key: string): Promise<T | undefined> {
  return tx<T | undefined>('readonly', s => s.get(key) as IDBRequest<T | undefined>);
}

function del(key: string): Promise<void> {
  return tx('readwrite', s => s.delete(key)).then(() => undefined);
}

/** 取得整個 store 內容（key→value 物件）。給 backup/import 用。 */
export async function getAllKV(): Promise<Record<string, unknown>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result ?? []) as Array<{ key: string; value: unknown }>;
      const map: Record<string, unknown> = {};
      for (const row of rows) map[row.key] = row.value;
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 一次寫多組 key/value，給 backup import 用。覆寫已有鍵。 */
export async function setAllKV(data: Record<string, unknown>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      store.put({ key, value });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ─────────────── 高階 API（業務端使用） ───────────────

export async function getProgress(): Promise<ProgressMap> {
  const v = await get<ProgressMap>('progress');
  return v ?? {};
}

export async function setProgress(p: ProgressMap): Promise<void> {
  await put('progress', p);
}

/** 全域時序 serialization：避免 read-modify-write race condition
 * (同個 idx 變動多次 fire and forget 會讀到舊值並覆蓋新值) */
let writeQueue: Promise<unknown> = Promise.resolve();

/** 包裝 function 讓一次只跑一個，順序執行 */
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn);
  // 不管成功失敗都要繼續下一個
  writeQueue = next.catch(() => undefined);
  return next;
}

export async function setLevelProgress(level: number, idx: number): Promise<void> {
  await serialize(async () => {
    const cur = await getProgress();
    if ((cur[level] ?? 0) >= idx) return; // 已更前，no-op
    cur[level] = idx;
    await setProgress(cur);
  });
}

export async function getFavorites(): Promise<FavoriteEntry[]> {
  const v = await get<FavoriteEntry[]>('favorites');
  return v ?? [];
}

export async function setFavorites(list: FavoriteEntry[]): Promise<void> {
  await put('favorites', list);
}

export async function getLang(): Promise<string | null> {
  return (await get<string>('lang')) ?? null;
}

export async function setLang(v: string): Promise<void> {
  await put('lang', v);
}

export async function getRate(): Promise<number> {
  return (await get<number>('rate')) ?? 1.0;
}

export async function setRate(v: number): Promise<void> {
  await put('rate', v);
}

export async function getLastBackupAt(): Promise<string | null> {
  return (await get<string>('lastBackupAt')) ?? null;
}

export async function setLastBackupAt(iso: string): Promise<void> {
  await put('lastBackupAt', iso);
}

// ─────────────── localStorage 一次性遷移 ───────────────

const LEGACY_KEYS = ['lang', 'rate', 'progress', 'favorites'] as const;

let migratePromise: Promise<void> | null = null;

/**
 * 把舊 localStorage 資料搬進 IndexedDB。
 * - 用模組級 Promise 確保一次性，多次呼叫只跑一次。
 * - 讀到資料後才刪 localStorage，避免遷移中崩潰就掉資料。
 */
export function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (migratePromise) return migratePromise;
  migratePromise = (async () => {
    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        const value = JSON.parse(raw);
        if (key === 'favorites') {
          // 舊格式：array of strings → object
          const migrated = (value as unknown[]).map((item: unknown) => {
            if (typeof item === 'string') {
              const parts = item.split('-');
              return {
                id: item,
                word: item,
                level: parseInt(parts[1] ?? '0', 10),
                idx: parseInt(parts[2] ?? '0', 10) - 1,
              } satisfies FavoriteEntry;
            }
            return item as FavoriteEntry;
          });
          await put('favorites', migrated);
        } else if (key === 'rate') {
          // rate 在舊 localStorage 是字串
          await put('rate', typeof value === 'number' ? value : parseFloat(value as string));
        } else {
          await put(key, value);
        }
        localStorage.removeItem(key);
      } catch {
        // 解析失敗→略過，不刪
      }
    }
  })();
  return migratePromise;
}
