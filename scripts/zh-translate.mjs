// 把 zh_dict.json 的中文翻譯寫入所有 vocabulary JSON
// 用法: node scripts/zh-translate.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'tmp_gen');

// 載入字典
const ZH_DICT = JSON.parse(readFileSync(join(TMP, 'zh_dict.json'), 'utf-8'));
console.log(`字典載入: ${Object.keys(ZH_DICT).length} 字`);

// 從 ECDICT 之 nt "vt. 放棄" 格式抽取主要中文釋義:
// 拆 `vt. xxx\\nn. yyy` -> "vt. xxx, n. yyy" (單行)
// 取第一行條目當翻譯 (vt./n./adj. 等)
function parseEcdictTranslation(trans) {
  if (!trans) return null;
  // 把 \n 換行替換成 , 不分行
  const flat = trans.replace(/\\n/g, ', ').replace(/\s+/g, ' ').trim();
  // 移除 [网络] 等備註
  flat.replace(/\[网络\] /g, '').replace(/\[医\] /g, '');
  return flat;
}

// 把字典寫入單字 entry (強制替換)
function apply(dict, entry) {
  if (!entry?.word) return false;
  const key = entry.word.toLowerCase();
  const data = dict[key];
  if (!data) return false;

  const translation = parseEcdictTranslation(data.translation);
  if (!translation) return false;

  if (!entry.translations) entry.translations = [];
  const langIdx = entry.translations.findIndex(t => t.lang === 'zh-TW');
  const newTr = {
    lang: 'zh-TW',
    lang_word: data.word,
    definition: translation,
  };
  if (langIdx >= 0) {
    entry.translations[langIdx] = newTr;
  } else {
    entry.translations.unshift(newTr);
  }

  if (data.phonetic && !entry.phonetic) {
    entry.phonetic = data.phonetic;
  }
  return true;
}

// Apply 到整個 tier
function upgradeTier(tierName) {
  const dir = join(ROOT, 'data', 'levels', tierName);
  let updated = 0, missing = 0, total = 0;
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    const path = join(dir, f);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    for (const w of data.words ?? []) {
      total++;
      if (apply(ZH_DICT, w)) updated++;
      else missing++;
    }
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  }
  return { updated, missing, total };
}

const r1 = upgradeTier('basic');
console.log(`Basic: ${r1.updated}/${r1.total} 字更新, ${r1.missing} 找不到`);
const r2 = upgradeTier('intermediate');
console.log(`Intermediate: ${r2.updated}/${r2.total} 字更新, ${r2.missing} 找不到`);
const r3 = upgradeTier('advanced');
console.log(`Advanced: ${r3.updated}/${r3.total} 字更新, ${r3.missing} 找不到`);

const totalUp = r1.updated + r2.updated + r3.updated;
const totalMiss = r1.missing + r2.missing + r3.missing;
const totalAll = r1.total + r2.total + r3.total;
console.log(`═══ 完成: ${totalUp}/${totalAll} (${(totalUp/totalAll*100).toFixed(1)}%) 更新, ${totalMiss} 找不到 ═══`);
