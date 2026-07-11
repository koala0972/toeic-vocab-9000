// 重新生成 basic 池 - 用 Oxford 3000
// 保留手寫關 Level 1-5
// 用 Oxford 3000 重新填 Learnable 6-300

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'tmp_gen');

// Oxford 3000 + 完整定義 (CSV)
function parseCsv(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const r = {};
    header.forEach((h, j) => r[h] = cells[j] ?? '');
    return r;
  });
}
function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && (i === 0 || line[i-1] !== '\\')) inQ = !inQ;
    else if (c === ',' && !inQ) { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

const OXFORD = parseCsv(join(TMP, 'oxford_defs.csv'));
console.log(`Oxford 3000: ${OXFORD.length} rows`);

const POS_TO_ZH = {
  noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞',
  preposition: '介係詞', conjunction: '連接詞', pronoun: '代名詞',
  interjection: '感嘆詞', determiner: '限定詞',
};

function conjugationGuess(pos, word) {
  const c = {};
  if (pos.includes('verb')) {
    c.past_tense = word + 'ed';
    c.past_participle = word + 'ed';
    c.present_participle = word.endsWith('e') ? word.slice(0, -1) + 'ing' : word + 'ing';
    c.third_person = word.endsWith('s') ? word + 'es' : word + 's';
  } else if (pos.includes('noun')) {
    c.plural = word.endsWith('y') ? word.slice(0, -1) + 'ies' : word.endsWith('s') ? word + 'es' : word + 's';
  } else if (pos.includes('adjective')) {
    c.comparative = word.endsWith('y') ? word.slice(0, -1) + 'ier' : word + 'er';
    c.superlative = word.endsWith('y') ? word.slice(0, -1) + 'iest' : word + 'est';
  }
  return c;
}

function buildEntry(word, level, idxInLevel) {
  // 找 Oxford row
  const row = OXFORD.find(r => r.Word?.trim().toLowerCase() === word.toLowerCase());
  const pos = row?.['Part of Speech']?.split(/[,\s;]+/).filter(Boolean) || [];
  if (pos.length === 0) pos.push('noun');

  const eng_def = row?.Definition?.trim() || '';
  const eng_def_trunc = eng_def.length > 80 ? eng_def.slice(0, 80) + '...' : eng_def;
  const ex_en = row?.['Example Sentence']?.trim() || `The ${word} is very useful.`;

  const translations = row ? [{
    lang: 'zh-TW',
    lang_word: `(${pos.map(p => POS_TO_ZH[p] ?? p).join('/')})`,
    definition: eng_def_trunc,  // 英文定義當佔位, 之後 LLM 翻譯
  }] : [{
    lang: 'zh-TW',
    lang_word: `(未收錄於 Oxford 3000)`,
    definition: `該字不屬於 Oxford 3000，可能是 google autocomplete 等資料來源。`,
  }];

  const examples = [{
    en: ex_en,
    highlight: [word],
    translations: { 'zh-TW': `(尚未翻譯 - 之後 LLM 補)` },
  }];

  const synonyms = [];
  const antonyms = [];
  const phrases = [];
  if (row) {
    synonyms.push(...(row.Synonyms?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none' && s !== 'NA') ?? []));
    antonyms.push(...(row.Antonyms?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none' && s !== 'NA') ?? []));
    phrases.push(...(row.Collocations?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none' && s !== 'NA') ?? []));
  }

  // CEFR
  let cefr = 'A1';
  if (level > 100 && level <= 200) cefr = 'A2';
  else if (level > 200) cefr = 'A2';

  let toeic_score_min = 200;
  if (level > 200) toeic_score_min = 500;

  return {
    id: `${cefr}-${String(level).padStart(3,'0')}-${String(idxInLevel + 1).padStart(3,'0')}`,
    level,
    tier: 'basic',
    cefr,
    toeic_score_min,
    word,
    phonetic: '',
    pos,
    conjugations: conjugationGuess(pos, word),
    domain: 'general',
    translations,
    examples,
    synonyms: synonyms.slice(0, 5),
    antonyms: antonyms.slice(0, 5),
    phrases: phrases.slice(0, 5),
  };
}

// Process: 對每個 Oxford 字, 逐個 level
// 收集 manual level (Level 1-5)
const BASIC_DIR = join(ROOT, 'data', 'levels', 'basic');
mkdirSync(BASIC_DIR, { recursive: true });
const manualLevels = new Set();
for (const f of readdirSync(BASIC_DIR)) {
  if (!/^\d+\.json$/.test(f)) continue;
  const lvl = parseInt(f.replace('.json',''), 10);
  if (lvl >= 1 && lvl <= 5 && existsSync(join(BASIC_DIR, f))) manualLevels.add(lvl);
}
console.log(`手寫保護關: ${Array.from(manualLevels).join(',')}`);

// Oxford 3000 順序作為難度依據 (Oxford 網站自己排序, 由常用→不常用)
const OXFORD_WORDS = OXFORD.map(r => r.Word?.trim().toLowerCase()).filter(w => /^[a-z][a-z'-]+$/.test(w) && w.length >= 2);
console.log(`Oxford 淨化後: ${OXFORD_WORDS.length} 字`);

// 填關 6-300 (295 關 × 10 字 = 2950, 從 OXFORD_WORDS 前 2950 取)
const slots = [];
for (let lvl = 6; lvl <= 300; lvl++) {
  if (manualLevels.has(lvl)) continue;
  for (let i = 0; i < 10; i++) {
    slots.push({ level: lvl, idxInLevel: i });
  }
}
console.log(`要填的 slot 數: ${slots.length}, Oxford 字: ${OXFORD_WORDS.length}`);
const usableWords = OXFORD_WORDS.slice(0, Math.min(slots.length, OXFORD_WORDS.length));

if (usableWords.length < slots.length) {
  console.warn(`⚠️ Oxford 字不夠填滿: 缺 ${slots.length - OXFORD_WORDS.length} 個 placeholder`);
}

let wordIdx = 0;
for (const slot of slots) {
  const w = wordIdx < usableWords.length ? usableWords[wordIdx++] : `placeholder_L${slot.level}_${slot.idxInLevel}`;
  const entry = buildEntry(w, slot.level, slot.idxInLevel);
  const filePath = join(BASIC_DIR, `${slot.level}.json`);

  // 讀 / 寫
  let data;
  if (existsSync(filePath)) {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } else {
    data = { level: slot.level, tier: 'basic', cefr: entry.cefr, words: [] };
  }
  // 寫回
  data.words = data.words || [];
  while (data.words.length <= slot.idxInLevel) data.words.push(null);
  data.words[slot.idxInLevel] = entry;
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

console.log('基本 tier 重新生成完畢');

let count = 0;
for (const f of readdirSync(BASIC_DIR)) {
  if (/^\d+\.json$/.test(f)) count++;
}
console.log(`基本關檔案數: ${count}`);
