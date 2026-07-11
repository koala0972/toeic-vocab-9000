#!/usr/bin/env node
// 套用 LLM 產生的單字內容到 level JSON 檔
// 用法: node scripts/apply-upgrade.mjs <json-file-with-upgrades>
// 升級內容 JSON 格式: { "batch_id": "...", "tier": "basic", "upgrades": [ { word, phonetic, pos, conjugations, translations, examples, synonyms, antonyms, phrases, domain? }, ... ] }
// 腳本會去找對應 tier/level 的檔案並更新。
// 若 upgrade 物件包含 "level", 用 level 欄位定位檔案。

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('用法: node apply-upgrade.mjs <upgrades.json>');
  process.exit(1);
}

let text = readFileSync(inputPath, 'utf-8').trim();
// 處理可能的 markdown code fence
const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
if (m) text = m[1];

// 接受兩種格式: 1) 陣列直接放 2) {upgrades:[...]} 包裹
let upgrades;
try {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) upgrades = parsed;
  else if (parsed.upgrades) upgrades = parsed.upgrades;
  else if (parsed.words) upgrades = parsed.words;
  else { console.error('找不到 upgrades/words 陣列'); process.exit(1); }
} catch (e) {
  console.error('JSON 解析失敗:', e.message);
  process.exit(1);
}

console.log(`讀到 ${upgrades.length} 個升級項目`);

// 載入所有骨架關, 建立 word -> filePath 映射
const wordToFile = new Map();
for (const tier of ['basic', 'intermediate', 'advanced']) {
  const dir = join(ROOT, 'data', 'levels', tier);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    const fullPath = join(dir, f);
    try {
      const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
      if (data._skeleton === true) {
        for (const w of data.words) {
          if (w._duplicate) continue;
          if (!wordToFile.has(w.word)) {
            wordToFile.set(w.word, { fullPath, id: w.id });
          }
        }
      }
    } catch {}
  }
}

console.log(`找到 ${wordToFile.size} 個待升級單字的位置`);

let updated = 0;
let missing = 0;
const fileChanges = new Map(); // fullPath -> { data }

function applyUpgradeToWord(w, up) {
  if (up.phonetic) w.phonetic = up.phonetic;
  if (up.pos && Array.isArray(up.pos)) w.pos = up.pos;
  if (up.conjugations && typeof up.conjugations === 'object') w.conjugations = up.conjugations;
  if (up.translations && Array.isArray(up.translations)) w.translations = up.translations;
  if (up.examples && Array.isArray(up.examples)) w.examples = up.examples;
  if (up.synonyms && Array.isArray(up.synonyms)) w.synonyms = up.synonyms;
  if (up.antonyms && Array.isArray(up.antonyms)) w.antonyms = up.antonyms;
  if (up.phrases && Array.isArray(up.phrases)) w.phrases = up.phrases;
  if (up.domain && !w.domain) w.domain = up.domain;
  delete w._skeleton;
}

for (const up of upgrades) {
  const word = up.word;
  if (!word) { missing++; continue; }
  const loc = wordToFile.get(word);
  if (!loc) {
    // 可能已升級或不存在
    missing++;
    continue;
  }
  if (!fileChanges.has(loc.fullPath)) {
    const data = JSON.parse(readFileSync(loc.fullPath, 'utf-8'));
    fileChanges.set(loc.fullPath, data);
  }
  const data = fileChanges.get(loc.fullPath);
  const w = data.words.find(x => x.id === loc.id);
  if (!w) { missing++; continue; }
  applyUpgradeToWord(w, up);
  updated++;
  wordToFile.delete(word); // 避免重複套用
}

// 檢查是否所有骨架關都已清完, 有的話移除 _skeleton
for (const [fullPath, data] of fileChanges) {
  const allDone = data.words.every(w => !w._skeleton);
  if (allDone) delete data._skeleton;
}

// 寫回
for (const [fullPath, data] of fileChanges) {
  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

console.log(`✅ 已更新 ${updated} 個單字, ${missing} 個未匹配 (可能不存在或重複)`);
console.log(`修改了 ${fileChanges.size} 個檔案`);
