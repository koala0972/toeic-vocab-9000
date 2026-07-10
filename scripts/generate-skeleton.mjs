// 離線單字骨架產生器 v2
// 從下載的公開 wordlist (Oxford 3000 + COCA top5000 + common4000) 讀字
// 產出 900 關 × 10 字 = 9000 題 JSON 骨架
//
// 用法: node scripts/generate-skeleton.mjs
// 不覆蓋已手寫的關 (無 _skeleton 標記的檔案)

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'tmp_gen');

// ═══════════════════════════════════════════════════════════
// 1. 讀取所有 wordlist 來源, 合併去重
// ═══════════════════════════════════════════════════════════

function loadWordlist(path, opts = {}) {
  const { csv = false, skipHeader = 0, wordCol = 0 } = opts;
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
    // 過濾: 只留純英文字 (含 hyphen), 長度 >= 2
    if (w && /^[a-z][a-z'-]+$/.test(w) && w.length >= 2) {
      words.push(w);
    }
  }
  return words;
}

const oxford3000 = loadWordlist(join(TMP, 'oxford3000.txt'));
const common4000 = loadWordlist(join(TMP, 'common4000.csv'), { skipHeader: 1 });
const top5000raw = loadWordlist(join(TMP, 'top5000.csv'), { csv: true, skipHeader: 1, wordCol: 1 });
const google10k = loadWordlist(join(TMP, 'google10000.txt'));

// 合併去重, 保留首次出現的順序
// Oxford 先 (CEFR 分級最準) → common4000 → COCA → google10k tail 補到 9000
const allWordsSet = new Set();
const allWordsOrdered = [];
for (const w of [...oxford3000, ...common4000, ...top5000raw, ...google10k]) {
  if (!allWordsSet.has(w)) {
    allWordsSet.add(w);
    allWordsOrdered.push(w);
  }
}

console.log(`Oxford 3000: ${oxford3000.length} 字`);
console.log(`Common 4000: ${common4000.length} 字`);
console.log(`COCA top 5000: ${top5000raw.length} 字`);
console.log(`Google 10k: ${google10k.length} 字`);
console.log(`合併去重: ${allWordsOrdered.length} 字`);

// ═══════════════════════════════════════════════════════════
// 2. 按頻率排序切三級 (前 ~3000 basic, 中 ~3000 inter, 後 ~3000 adv)
//    Oxford 3000 前段 → basic; common4000 補 → inter; top5000 尾 → adv
// ═══════════════════════════════════════════════════════════

// 保留來源順序作為難度代理 (越早出現 = 頻率越高 = 越基礎)
const BASIC_RANGE = allWordsOrdered.slice(0, 3000);
const INTER_RANGE = allWordsOrdered.slice(3000, 6000);
const ADV_RANGE   = allWordsOrdered.slice(6000, 9000);

// 如果字庫不夠 9000, 用 top5000 的高頻段補 (重複但標 placeholder)
console.log(`Basic pool: ${BASIC_RANGE.length}`);
console.log(`Intermediate pool: ${INTER_RANGE.length}`);
console.log(`Advanced pool: ${ADV_RANGE.length}`);

// ═══════════════════════════════════════════════════════════
// 3. 詞性推測 + 模板例句 + 模板翻譯
// ═══════════════════════════════════════════════════════════

function guessPOS(word) {
  const w = word.toLowerCase();
  if (w.endsWith('tion') || w.endsWith('ment') || w.endsWith('ness') || w.endsWith('ity') || w.endsWith('ship') || w.endsWith('hood') || w.endsWith('ance') || w.endsWith('ence') || w.endsWith('ism') || w.endsWith('ist')) return ['noun'];
  if (w.endsWith('ly')) return ['adverb'];
  if (w.endsWith('ful') || w.endsWith('less') || w.endsWith('ous') || w.endsWith('ive') || w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || w.endsWith('ic')) return ['adjective'];
  if (w.endsWith('ize') || w.endsWith('ise') || w.endsWith('ify') || w.endsWith('en')) return ['verb'];
  if (w.endsWith('ing')) return ['verb'];
  if (w.endsWith('ed')) return ['verb'];
  return ['noun'];
}

function templateExample(word, pos) {
  if (pos.includes('verb')) return `I need to ${word} this morning.`;
  if (pos.includes('adjective')) return `This is a very ${word} thing.`;
  if (pos.includes('adverb')) return `She speaks ${word} in the meeting.`;
  return `The ${word} is very useful.`;
}

function templateTranslation(word) {
  return { lang_word: '（待補）', definition: `英文單字 "${word}" 的中文釋義（待 LLM 補完）` };
}

// ═══════════════════════════════════════════════════════════
// 4. CEFR / 多益分數對照
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

function buildEntry(word, level, tier, cefr, indexInLevel) {
  const pos = guessPOS(word);
  return {
    id: `${cefr}-${String(level).padStart(3,'0')}-${String(indexInLevel).padStart(3,'0')}`,
    level, tier, cefr,
    toeic_score_min: toeicForLevel(level),
    word,
    phonetic: '',
    pos,
    conjugations: {},
    domain: 'general',
    translations: [{ lang: 'zh-TW', ...templateTranslation(word) }],
    examples: [{ en: templateExample(word, pos), highlight: [word], translations: { 'zh-TW': '（待補翻譯）' } }],
    synonyms: [], antonyms: [], phrases: [],
    _skeleton: true,
  };
}

// ═══════════════════════════════════════════════════════════
// 5. 主產生邏輯 — 不覆蓋手寫關, 跨 tier 去重
// ═══════════════════════════════════════════════════════════

function generateTier(tierName, wordPool, levelStart, levelEnd) {
  const dir = join(ROOT, 'data', 'levels', tierName);
  mkdirSync(dir, { recursive: true });

  // 找已存在手寫關 (不覆蓋)
  const existingFiles = new Set();
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    try {
      const content = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (!content._skeleton) existingFiles.add(parseInt(f.replace('.json',''), 10));
    } catch {}
  }

  // 跨 tier 去重: 掃所有 tier 收已用字
  const usedWords = new Set();
  for (const otherTier of ['basic','intermediate','advanced']) {
    const otherDir = join(ROOT, 'data', 'levels', otherTier);
    if (!existsSync(otherDir)) continue;
    for (const f of readdirSync(otherDir)) {
      if (!/^\d+\.json$/.test(f)) continue;
      try {
        const content = JSON.parse(readFileSync(join(otherDir, f), 'utf-8'));
        for (const w of content.words ?? []) usedWords.add(w.word.toLowerCase());
      } catch {}
    }
  }

  // 從 pool 取未用過的字
  const freshWords = wordPool.filter(w => !usedWords.has(w.toLowerCase()));
  let wordIdx = 0, generated = 0, skipped = 0;

  for (let level = levelStart; level <= levelEnd; level++) {
    if (existingFiles.has(level)) { skipped++; continue; }
    const cefr = cefrForLevel(level, tierName);
    const words = [];
    for (let i = 0; i < 10; i++) {
      if (wordIdx >= freshWords.length) {
        // 字庫用完 — 不寫假字, 用高頻字重複(標記 _duplicate)
        const recycled = freshWords[wordIdx % freshWords.length] ?? 'unknown';
        const entry = buildEntry(recycled, level, tierName, cefr, i + 1);
        entry._duplicate = true;
        words.push(entry);
      } else {
        words.push(buildEntry(freshWords[wordIdx], level, tierName, cefr, i + 1));
        wordIdx++;
      }
    }
    const data = { level, tier: tierName, cefr, _skeleton: true, words };
    writeFileSync(join(dir, `${level}.json`), JSON.stringify(data, null, 2), 'utf-8');
    generated++;
  }
  return { generated, skipped, wordsUsed: wordIdx, poolSize: freshWords.length };
}

// ═══════════════════════════════════════════════════════════
// 6. 跑!
// ═══════════════════════════════════════════════════════════

// 先清掉舊骨架 (保留手寫)
for (const tier of ['basic','intermediate','advanced']) {
  const dir = join(ROOT, 'data', 'levels', tier);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    try {
      const content = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (content._skeleton) {
        unlinkSync(join(dir, f));
      }
    } catch {}
  }
}

console.log('═══ 骨架產生器 v2 ═══');
const r1 = generateTier('basic', BASIC_RANGE, 1, 300);
console.log(`Basic: ${r1.generated} 關 (跳 ${r1.skipped}), 用 ${r1.wordsUsed}/${r1.poolSize} 字`);
const r2 = generateTier('intermediate', INTER_RANGE, 301, 600);
console.log(`Intermediate: ${r2.generated} 關 (跳 ${r2.skipped}), 用 ${r2.wordsUsed}/${r2.poolSize} 字`);
const r3 = generateTier('advanced', ADV_RANGE, 601, 900);
console.log(`Advanced: ${r3.generated} 關 (跳 ${r3.skipped}), 用 ${r3.wordsUsed}/${r3.poolSize} 字`);

// 統計 placeholder / duplicate
let skeletonCount = 0, duplicateCount = 0;
for (const tier of ['basic','intermediate','advanced']) {
  const dir = join(ROOT, 'data', 'levels', tier);
  for (const f of readdirSync(dir)) {
    if (!/^\d+\.json$/.test(f)) continue;
    try {
      const content = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
      if (content._skeleton) skeletonCount++;
      for (const w of content.words ?? []) if (w._duplicate) duplicateCount++;
    } catch {}
  }
}
console.log(`═══ 完成 ═══`);
console.log(`骨架關: ${skeletonCount}, 重複字(字庫不足): ${duplicateCount}`);
