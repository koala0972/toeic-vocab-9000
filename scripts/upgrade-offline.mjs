// 離線單字升級版 (v3) - 用 Oxford 3000 完整資料 + 模板補完中高級
//
// 取代 generate-skeleton.mjs: 從「招位元 → 模板句」升級成「真實定義 → 真例句」
// 對 Oxford 3000: 直接用 ciwga 抓到的英文定義 + 例句 + 同反義詞
// 對其他 6000 字: 用 pos 自動推斷，包含「種種樣」
//
// 用法: node scripts/upgrade-offline.mjs
// 行為: 對所有 _skeleton 關重新產生內容, 不覆盖手寫關

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'tmp_gen');

// ═══════════════════════════════════════════════════════════
// 1. 載入 Oxford 3000 完整 CSV (有定義/例句/同反義詞/詞組)
// ═══════════════════════════════════════════════════════════

function parseCsv(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;
    const row = {};
    header.forEach((h, j) => row[h] = cells[j] ?? '');
    rows.push(row);
  }
  return rows;
}

// 簡單 CSV parser: 支援引號包住的 cell 含逗號
function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

const OXFORD_ROWS = parseCsv(join(TMP, 'oxford_defs.csv'));
console.log(`Oxford 3000 loaded: ${OXFORD_ROWS.length} rows`);

// 建 word → row map (lowercase key)
const OXFORD_MAP = new Map();
for (const r of OXFORD_ROWS) {
  const w = r.Word?.trim().toLowerCase();
  if (w) OXFORD_MAP.set(w, r);
}

// ═══════════════════════════════════════════════════════════
// 2. 載入全部字匯 (Oxford + COCA + Google 10k), 防重複
// ═══════════════════════════════════════════════════════════

function loadWordlist(path, opts = {}) {
  const { csv = false, skipHeader = 0, wordCol = 0 } = opts;
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const words = [];
  for (let i = skipHeader; i < lines.length; i++) {
    let w;
    if (csv) {
      const cols = lines[i].split(',');
      w = cols[wordCol]?.trim()?.toLowerCase();
    } else {
      w = lines[i].trim().toLowerCase();
    }
    if (w && /^[a-z][a-z'-]+$/.test(w) && w.length >= 2) {
      words.push(w);
    }
  }
  return words;
}

const oxfordList = loadWordlist(join(TMP, 'oxford3000.txt'));
const common4000 = loadWordlist(join(TMP, 'common4000.csv'), { skipHeader: 1 });
const top5000raw = loadWordlist(join(TMP, 'top5000.csv'), { csv: true, skipHeader: 1, wordCol: 1 });
const google10k = loadWordlist(join(TMP, 'google10000.txt'));

const allWordsSet = new Set();
const allWordsOrdered = [];
for (const w of [...oxfordList, ...common4000, ...top5000raw, ...google10k]) {
  if (!allWordsSet.has(w)) {
    allWordsSet.add(w);
    allWordsOrdered.push(w);
  }
}

// 基礎池: Oxford 3000 (最權威, A1-A2)
// 中級池: COCA top5k + Google 10k tail (B1-B2)
// 高級池: Google 10k ultra-low frequency (C1-C2)
const BASIC_RANGE  = OXFORD_ROWS.map(r => r.Word.trim().toLowerCase()).filter(w => /^[a-z][a-z'-]+$/.test(w) && w.length >= 2);
// 中 / 高 池: 從 google + top5000 中抽 (Oxford 之外的字)
const OTHER_WORDS = allWordsOrdered.filter(w => !OXFORD_MAP.has(w));
const INTER_RANGE = OTHER_WORDS.slice(0, 3000);
const ADV_RANGE   = OTHER_WORDS.slice(3000, 6000);

console.log(`字匯池: basic=${BASIC_RANGE.length}, inter=${INTER_RANGE.length}, adv=${ADV_RANGE.length}`);
console.log(`Oxford 3000 內: ${OXFORD_MAP.size} 字有完整資料`);

// ═══════════════════════════════════════════════════════════
// 3. 詞性推斷 + 簡易模板 + 英文定義→中文佔位
// ═══════════════════════════════════════════════════════════

function guessPOS(word, fallback) {
  if (fallback) return [{ pos: fallback.pos, conj: fallback.conjugations }];
  const w = word.toLowerCase();
  if (w.endsWith('tion') || w.endsWith('ment') || w.endsWith('ness') || w.endsWith('ity') || w.endsWith('ship') || w.endsWith('hood') || w.endsWith('ance') || w.endsWith('ence') || w.endsWith('ism') || w.endsWith('ist')) return ['noun'];
  if (w.endsWith('ly')) return ['adverb'];
  if (w.endsWith('ful') || w.endsWith('less') || w.endsWith('ous') || w.endsWith('ive') || w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || w.endsWith('ic')) return ['adjective'];
  if (w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ify') || w.endsWith('en') || w.endsWith('ate')) return ['verb'];
  return ['noun'];
}

function conjugationGuess(pos, word) {
  const c = {};
  if (pos.includes('verb')) {
    // 簡易規則: 預設 (未精準處理不規則動詞, 例外另行表)
    c.past_tense = word + 'ed';
    c.past_participle = word + 'ed';
    c.present_participle = word.endsWith('e') ? word.slice(0, -1) + 'ing' : word + 'ing';
    c.third_person = word.endsWith('s') ? word + 'es' : word + 's';
  } else if (pos.includes('noun')) {
    c.plural = word.endsWith('y') ? word.slice(0, -1) + 'ies' : word.endsWith('s') ? word + 'es' : word + 's';
  } else if (pos.includes('adjective')) {
    c.comparative = (word.endsWith('y') ? word.slice(0, -1) + 'ier' : word + 'er');
    c.superlative = (word.endsWith('y') ? word.slice(0, -1) + 'iest' : word + 'est');
  }
  return c;
}

// 中文定義的簡易 toolbar: "動詞 = 做", "名詞 = 物", "形容詞 = 的" etc.
// 對 Oxford 有定義: 翻成中文會用 Google 翻譯 wrapper (但離線不能, 所以取詞短定義第一句)
// 對非 Oxford: 用 part-of-speech-based 中文 placeholder

// 取詞類型→中文名
const POS_TO_ZH = {
  noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞',
  preposition: '介係詞', conjunction: '連接詞', pronoun: '代名詞',
  interjection: '感嘆詞', determiner: '限定詞',
};

// 例句生成 - 隨機輪替模板 (不全部用同一句)
const TEMPLATES_VERB = [
  (w) => `She needs to ${w} before tomorrow.`,
  (w) => `I ${w} every morning.`,
  (w) => `He ${w}s the report to his manager.`,
  (w) => `They are planning to ${w} soon.`,
  (w) => `We should ${w} this carefully.`,
];
const TEMPLATES_NOUN = [
  (w) => `The ${w} is on the table.`,
  (w) => `This is an important ${w}.`,
  (w) => `We need a new ${w}.`,
  (w) => `His job requires a strong ${w}.`,
  (w) => `Please hand me the ${w}.`,
];
const TEMPLATES_ADJ = [
  (w) => `The view is very ${w}.`,
  (w) => `She is a ${w} person.`,
  (w) => `This task seems ${w}.`,
  (w) => `His report was ${w}.`,
  (w) => `The food tasted ${w}.`,
];
const TEMPLATES_ADV = [
  (w) => `She speaks ${w} in meetings.`,
  (w) => `He works ${w} on weekends.`,
  (w) => `The plan was ${w} executed.`,
];
const TEMPLATES_OTHER = [(w) => `${w.charAt(0).toUpperCase() + w.slice(1)} is used in formal writing.`];

let templateIdx = 0;
function pickTemplate(word, pos) {
  let arr = TEMPLATES_OTHER;
  if (pos.includes('verb')) arr = TEMPLATES_VERB;
  else if (pos.includes('noun')) arr = TEMPLATES_NOUN;
  else if (pos.includes('adjective')) arr = TEMPLATES_ADJ;
  else if (pos.includes('adverb')) arr = TEMPLATES_ADV;
  const fn = arr[templateIdx % arr.length];
  templateIdx++;
  return fn(word);
}

// 從 Oxford CSV 讀出的欄位 (English def) → 簡短中文定義
// 選法: 取 "Oxford def 第一句" + POS 標記, 且以「英文定義" 保留為英文
//
// 簡單中文翻译 toolbar: 透過 "定義前 5 字" 看是否是登樣常見型
// 例 "Cease to support or look after (someone)" → "不再支持/照顧(某人)"
//
// 為了離線不依賴 API: 我們留英文定義作為 primary, 中文定義 fallback 是中文佔位 ("待 LLM 補上")

function buildOxfordTranslation(row, pos) {
  const eng = row.Definition?.trim() || '';
  const trunc = eng.length > 80 ? eng.slice(0, 80) + '...' : eng;
  const posZh = pos.map(p => POS_TO_ZH[p] ?? p).join('/');
  return [{
    lang: 'zh-TW',
    lang_word: `(${posZh})`,
    definition: trunc,  // 暫使用英文定義 (離線沒 LLM 没法中文)
  }];
}

function buildOxfordExamples(row, word, pos) {
  const ex_en = row['Example Sentence']?.trim() || '';
  const examples = [];
  if (ex_en) {
    // Oxford 原例句 - 主例
    examples.push({
      en: ex_en,
      highlight: [word],
      translations: { 'zh-TW': `${'oxford 例句尚未翻譯(離線)'}` },
    });
  }
  // 補充一個模板例句 (輪替不重複)
  if (pos.length > 0) {
    const tplEn = pickTemplate(word, pos);
    // 避免跟 Oxford 例句重複
    if (tplEn !== ex_en) {
      examples.push({
        en: tplEn,
        highlight: [word],
        translations: { 'zh-TW': `(自動產例句 - 待 LLM 翻譯)` },
      });
    }
  }
  return examples;
}

function buildSkeletonTranslation(word, pos) {
  const posZh = pos.map(p => POS_TO_ZH[p] ?? p).join('/');
  return [{
    lang: 'zh-TW',
    lang_word: `(${posZh}, 待 LLM 補完)`,
    definition: `該字屬於 ${posZh}，沒有 Oxford 3000 完整定調。LLM 升級後可改成完整中文釋義。`,
  }];
}

function buildSkeletonExample(word, pos) {
  const en = pickTemplate(word, pos);
  return [{
    en,
    highlight: [word],
    translations: { 'zh-TW': `(自動產例句 - 待 LLM 翻譯)` },
  }];
}

// ═══════════════════════════════════════════════════════════
// 4. CEFR / 多益分數
// ═══════════════════════════════════════════════════════════
function cefrForLevel(level, tier) {
  if (tier === 'basic') return level <= 100 ? 'A1' : 'A2';
  if (tier === 'intermediate') return level <= 400 ? 'B1' : 'B2';
  return level <= 700 ? 'C1' : 'C2';
}
function toeicForLevel(level) {
  if (level <= 100) return 200;
  if (level <= 200) return 400;
  if (level <= 300) return 500;
  if (level <= 400) return 650;
  if (level <= 500) return 750;
  if (level <= 600) return 850;
  if (level <= 700) return 880;
  if (level <= 800) return 920;
  return 960;
}

// ═══════════════════════════════════════════════════════════
// 5. 主關卡升級
// ═══════════════════════════════════════════════════════════

function upgradeEntry(word, level, tier, idxInLevel) {
  const oxfordRow = OXFORD_MAP.get(word.toLowerCase());

  let pos = [];
  let translations, examples, phonetic;
  let synonyms = [], antonyms = [], phrases = [];
  let conjugations = {};

  if (oxfordRow) {
    // 有 Oxford 資料: 使用之
    pos = oxfordRow['Part of Speech']?.split(/[,\s;]+/).filter(Boolean) || [];
    if (pos.length === 0) pos = guessPOS(word);
    translations = buildOxfordTranslation(oxfordRow, pos);
    examples = buildOxfordExamples(oxfordRow, word, pos);
    phonetic = ''; // Oxford CSV 沒 KK, 留空
    synonyms = oxfordRow.Synonyms?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none') || [];
    antonyms = oxfordRow.Antonyms?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none') || [];
    phrases = oxfordRow.Collocations?.split(/[,\s;]+/).filter(Boolean).filter(s => s !== 'none') || [];
    conjugations = conjugationGuess(pos, word);
  } else {
    // 骨架: 用 pos 推斷 + 模板例句
    pos = guessPOS(word);
    translations = buildSkeletonTranslation(word, pos);
    examples = buildSkeletonExample(word, pos);
    phonetic = ''; // Oxford CSV 沒 KK, 留空
    conjugations = conjugationGuess(pos, word);
  }

  // 截 words.length 到 >0
  if (examples.length === 0) {
    examples = buildSkeletonExample(word, pos);
  }

  return {
    id: `${cefrForLevel(level, tier)}-${String(level).padStart(3,'0')}-${String(idxInLevel + 1).padStart(3,'0')}`,
    level,
    tier,
    cefr: cefrForLevel(level, tier),
    toeic_score_min: toeicForLevel(level),
    word,
    phonetic: phonetic || '',
    pos,
    conjugations,
    domain: 'general',
    translations,
    examples,
    synonyms: synonyms.slice(0, 5),
    antonyms: antonyms.slice(0, 5),
    phrases: phrases.slice(0, 5),
  };
}

// ═══════════════════════════════════════════════════════════
// 6. 主程序
// ═══════════════════════════════════════════════════════════

function upgradeTier(tierName, wordPool, levelStart, levelEnd) {
  const dir = join(ROOT, 'data', 'levels', tierName);
  mkdirSync(dir, { recursive: true });

  // 找手寫關: Level 1-5 是手寫高品質, Level 6 是「手寫 + 升級」也算手寫
  // 判定條件: lang_word 是真中文 (不是 placeholder/待 LLM/英文定義)
  function isRealChinese(s) {
    if (!s) return false;
    if (s.startsWith('(') && s.includes('待')) return false;
    if (s.length < 2) return false;
    if (/^[\u3000-\u9fff]+[、，,。]?$/.test(s)) return true;  // 純中文 (含標點)
    // 多字/含英文定義則算半手寫: 若含中文字也算
    return /[\u4e00-\u9fff]/.test(s);
  }
  function isLevelManual(words) {
    // 全 10 個 word 都 "lang_word 含" 真中文且 examples.translations 含真中文 → 視為手寫
    if (!Array.isArray(words) || words.length < 1) return false;
    let realCount = 0;
    for (const w of words) {
      const langWord = w?.translations?.[0]?.lang_word ?? '';
      const exTr = w?.examples?.[0]?.translations?.['zh-TW'] ?? '';
      if (isRealChinese(langWord) && isRealChinese(exTr)) realCount++;
    }
    return realCount === words.length;
  }
  const manualLevels = new Set();
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    try {
      const c = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (isLevelManual(c.words)) {
        manualLevels.add(parseInt(f.replace('.json',''), 10));
      }
    } catch {}
  }
  console.log(`  ${tierName}: ${manualLevels.size} 手寫關不覆蓋`);

  // 保留「已有順序」: 從已存在的 JSON 取 word list (同樣保留 id/level/idx)
  // 跨 tier 不重複
  const usedWords = new Set();
  for (const tier of ['basic', 'intermediate', 'advanced']) {
    if (!existsSync(join(ROOT, 'data', 'levels', tier))) continue;
    for (const f of readdirSync(join(ROOT, 'data', 'levels', tier))) {
      if (!/^\d+\.json$/.test(f)) continue;
      try {
        const c = JSON.parse(readFileSync(join(ROOT, 'data', 'levels', tier, f), 'utf-8'));
        for (const w of c.words ?? []) usedWords.add(w.word.toLowerCase());
      } catch {}
    }
  }

  // 對已存在的每個關卡, 取它的現有 words, 在位置 i 上重新升級 (但跳過手寫關)
  let upgraded = 0, skipped = manualLevels.size;
  let oxfordHits = 0, skeletonHits = 0;

  for (let level = levelStart; level <= levelEnd; level++) {
    if (manualLevels.has(level)) continue;
    const levelPath = join(dir, `${level}.json`);
    if (!existsSync(levelPath)) continue;  // 不創造關 (避免重新計數)

    // 讀既有 words 順序 (每個 word 仍屬本關, 保持範型)
    const existing = JSON.parse(readFileSync(levelPath, 'utf-8'));
    const existingWords = existing.words ?? [];

    const newWords = existingWords.map((w, i) => {
      const word = w.word.toLowerCase();
      if (word.startsWith('placeholder_') || word.startsWith('_')) {
        // 跳過 placeholder
        return w;
      }
      const entry = upgradeEntry(word, level, tierName, i);
      if (OXFORD_MAP.has(word)) oxfordHits++;
      else skeletonHits++;
      return entry;
    });

    const data = {
      level,
      tier: tierName,
      cefr: cefrForLevel(level, tierName),
      words: newWords,
    };
    writeFileSync(join(dir, `${level}.json`), JSON.stringify(data, null, 2), 'utf-8');
    upgraded++;
  }
  return { upgraded, skipped, oxfordHits, skeletonHits };
}

console.log('═══ 升級離線版 v3 ═══');
const r1 = upgradeTier('basic', BASIC_RANGE, 1, 300);
console.log(`Basic: ${r1.upgraded} 關升級（跳 ${r1.skipped} 手寫）`);
console.log(`  其中 Oxford: ${r1.oxfordHits} 字, Skeleton: ${r1.skeletonHits} 字`);

const r2 = upgradeTier('intermediate', INTER_RANGE, 301, 600);
console.log(`Intermediate: ${r2.upgraded} 關升級（跳 ${r2.skipped} 手寫）`);
console.log(`  其中 Oxford: ${r2.oxfordHits} 字, Skeleton: ${r2.skeletonHits} 字`);

const r3 = upgradeTier('advanced', ADV_RANGE, 601, 900);
console.log(`Advanced: ${r3.upgraded} 關升級（跳 ${r3.skipped} 手寫）`);
console.log(`  其中 Oxford: ${r3.oxfordHits} 字, Skeleton: ${r3.skeletonHits} 字`);

const totalOps = (r1.oxfordHits ?? 0) + (r2.oxfordHits ?? 0) + (r3.oxfordHits ?? 0);
const totalSk = (r1.skeletonHits ?? 0) + (r2.skeletonHits ?? 0) + (r3.skeletonHits ?? 0);
const totalAll = totalOps + totalSk;
console.log('═══ 完成 ═══');
console.log(`Oxford 覆蓋率: ${totalOps}/${totalAll} = ${(totalOps / Math.max(1, totalAll) * 100).toFixed(1)}%`);
