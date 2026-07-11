// 重新生成 intermediate (301-600) 和 advanced (601-900) 池
// 從 ECDICT 取「Oxford 3000 之外的字」最高頻 6000 個

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ⬇️ 確保 readFileSync included
const _ = readFileSync;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, 'tmp_gen');

const ZH_DICT = JSON.parse(readFileSync(join(TMP, 'zh_dict.json'), 'utf-8'));
console.log(`字典: ${Object.keys(ZH_DICT).length} 字`);

// Oxford 3000 用的單字
const OXFORD = new Set();
const oxRaw = readFileSync(join(TMP, 'oxford3000.txt'), 'utf-8');
for (const w of oxRaw.split(/\r?\n/)) {
  const t = w.trim().toLowerCase();
  if (/^[a-z][a-z'-]+$/.test(t)) OXFORD.add(t);
}

// 字源
const allWords = Object.keys(ZH_DICT);
const nonOxfordWords = allWords.filter(w => !OXFORD.has(w));
// 排序: 平均 frq 較低 (= 較常用)
const sorted = nonOxfordWords.sort((a, b) => (ZH_DICT[a].frq || 0) - (ZH_DICT[b].frq || 0));
const INTER_WORDS = sorted.slice(0, 3000);
const ADV_WORDS = sorted.slice(3000, 6000);
console.log(`中級: ${INTER_WORDS.length} 字, 高級: ${ADV_WORDS.length} 字`);

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

function buildEntry(word, level, idxInLevel, cefr) {
  const t = ZH_DICT[word.toLowerCase()];
  const pos = t?.pos ? t.pos.split(/[,\s]+/).filter(Boolean) : ['noun'];
  const translation = t?.translation?.replace(/\\n/g, ', ').replace(/\s+/g, ' ').trim() || '';
  return {
    id: `${cefr}-${String(level).padStart(3,'0')}-${String(idxInLevel + 1).padStart(3,'0')}`,
    level,
    tier: cefr.startsWith('A') ? 'basic' : cefr.startsWith('B') ? 'intermediate' : 'advanced',
    cefr,
    toeic_score_min: cefr.startsWith('A1') ? 200 : cefr.startsWith('A2') ? 400 : cefr.startsWith('B1') ? 650 : cefr.startsWith('B2') ? 750 : cefr.startsWith('C1') ? 880 : 920,
    word,
    phonetic: t?.phonetic || '',
    pos,
    conjugations: conjugationGuess(pos, word),
    domain: 'general',
    translations: translation ? [{
      lang: 'zh-TW',
      lang_word: word,  // 用 word 當占位, 之後 UID 唯一
      definition: translation,
    }] : [],
    examples: [],  // LLM 之後補
    synonyms: [],
    antonyms: [],
    phrases: [],
  };
}

// 重新生成
function regenTier(tierName, levelStart, levelEnd, words) {
  const dir = join(ROOT, 'data', 'levels', tierName);
  mkdirSync(dir, { recursive: true });
  let wordIdx = 0;
  let inserted = 0;
  for (let level = levelStart; level <= levelEnd; level++) {
    let cefr;
    if (tierName === 'basic') {
      cefr = level <= 100 ? 'A1' : 'A2';
    } else if (tierName === 'intermediate') {
      cefr = level <= 400 ? 'B1' : 'B2';
    } else {
      cefr = level <= 700 ? 'C1' : 'C2';
    }
    const data = { level, tier: tierName, cefr, words: [] };
    for (let i = 0; i < 10; i++) {
      const w = wordIdx < words.length ? words[wordIdx++] : `placeholder_L${level}_${i}`;
      data.words.push(buildEntry(w, level, i, cefr));
    }
    writeFileSync(join(dir, `${level}.json`), JSON.stringify(data, null, 2), 'utf-8');
    inserted++;
  }
  console.log(`  ${tierName}: ${inserted} 關重生成, 用 ${wordIdx} 字`);
}

regenTier('intermediate', 301, 600, INTER_WORDS);
regenTier('advanced', 601, 900, ADV_WORDS);
console.log('All done');
