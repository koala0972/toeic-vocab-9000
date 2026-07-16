'use client';

import { useEffect, useRef, useState } from 'react';
import {
  downloadBackup,
  importBackupFromFile,
  getLastBackupAt,
  type ImportSummary,
} from '@/lib/backup';

function fmtDate(iso: string | null): string {
  if (!iso) return '尚未備份';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '尚未備份';
  // 例如: 2026-07-16 09:12
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DataManager() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLastBackupAt().then(setLastBackup);
  }, []);

  const onExport = async () => {
    try {
      setBusy('export');
      setMsg(null);
      await downloadBackup();
      // 重新讀回時間，因為 downloadBackup() 內已經寫進 IndexedDB
      const t = await getLastBackupAt();
      setLastBackup(t);
      setMsg({ kind: 'ok', text: '已下載備份檔' });
    } catch (e) {
      setMsg({ kind: 'err', text: `匯出失敗: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const onImport = async (mode: 'merge' | 'replace') => {
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setMsg({ kind: 'err', text: '請先選擇備份檔' });
      return;
    }
    try {
      setBusy('import');
      setMsg(null);
      const { summary } = await importBackupFromFile(f, mode);
      const lines: string[] = [];
      if (summary.progress.added || summary.progress.updated) {
        lines.push(`進度: +${summary.progress.added} 關新資料, ${summary.progress.updated} 關更新`);
      }
      if (summary.favorites.added || summary.favorites.kept) {
        lines.push(`收藏: +${summary.favorites.added} 個新, ${summary.favorites.kept} 個已存在`);
      }
      if (mode === 'replace') lines.push('(取代模式)');
      setMsg({ kind: 'ok', text: `匯入完成 — ${lines.join(' · ')}` });
      // 觸發全頁重讀資料
      window.dispatchEvent(new Event('vkv-data-changed'));
    } catch (e) {
      setMsg({ kind: 'err', text: `匯入失敗: ${(e as Error).message}` });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <details className="mt-4 border rounded-lg bg-slate-50 open:bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 select-none">
        🗂️ 資料管理 <span className="ml-2 text-xs text-slate-500 font-normal">上次備份: {fmtDate(lastBackup)}</span>
      </summary>
      <div className="px-4 pb-4 pt-2 text-sm space-y-3">
        <div className="text-slate-600 text-xs">
          學習進度與收藏儲存在本機瀏覽器。建議定期匯出備份；換裝置或清快取時可匯入還原。
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={onExport}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {busy === 'export' ? '下載中…' : '⬇️ 匯出備份 (JSON)'}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="text-xs"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => onImport('merge')}
            className="px-3 py-1.5 rounded bg-white border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === 'import' ? '處理中…' : '⬆️ 匯入 (合併)'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => onImport('replace')}
            className="px-3 py-1.5 rounded bg-white border border-amber-300 text-amber-800 text-sm hover:bg-amber-50 disabled:opacity-50"
            title="完全取代目前資料"
          >
            {busy === 'import' ? '處理中…' : '↺ 匯入 (取代)'}
          </button>
        </div>

        {msg && (
          <div
            className={`text-xs px-3 py-2 rounded ${
              msg.kind === 'ok'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-800'
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>
    </details>
  );
}
