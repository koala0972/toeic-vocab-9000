#!/usr/bin/env node
// 升級骨架關卡: 找下一批 _skeleton:true 的關, 用 LLM 補完內容
// 用法: node scripts/upgrade-skeleton.mjs [count]
// 預設每次升級 10 關 (100 字)

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COUNT = parseInt(process.argv[2] ?? '10', 10);

// 找下一批要升級的骨架關
function findSkeletonLevels() {
  const result = [];
  for (const tier of ['basic', 'intermediate', 'advanced']) {
    const dir = join(ROOT, 'data', 'levels', tier);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/^\d+\.json$/.test(f)) continue;
      try {
        const content = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
        if (content._skeleton === true) {
          result.push({ tier, level: parseInt(f.replace('.json', ''), 10), path: join(dir, f), data: content });
        }
      } catch {}
    }
  }
  // 按關卡順序排
  result.sort((a, b) => a.level - b.level);
  return result;
}

const skeletons = findSkeletonLevels();
const batch = skeletons.slice(0, COUNT);

if (batch.length === 0) {
  console.log('✅ 所有關卡已升級完畢！沒有骨架關了。');
  process.exit(0);
}

console.log(`找到 ${skeletons.length} 個骨架關, 本次升級 ${batch.length} 關:`);
batch.forEach(b => console.log(`  - Level ${b.level} (${b.tier})`));

// 輸出這批要升級的單字列表給 LLM prompt 用
const wordsToUpgrade = [];
for (const b of batch) {
  for (const w of b.data.words) {
    if (w._duplicate) continue;
    wordsToUpgrade.push({ level: b.level, tier: b.tier, word: w.word, id: w.id, filePath: b.path });
  }
}

console.log(`\n共 ${wordsToUpgrade.length} 個單字待升級`);
console.log('\n=== LLM PROMPT (給 cron agent 用) ===');
console.log(`你是一個英文單字字典編輯器。請為以下 ${wordsToUpgrade.length} 個英文單字產生完整的學習內容。

對每個單字，產生以下欄位（JSON 格式）:
1. phonetic: KK 音標 (例如 "həˈloʊ")
2. pos: 詞性陣列 (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection/determiner)
3. conjugations: 詞性變化物件 (動詞: past_tense, past_participle, present_participle, third_person; 名詞: plural; 形容詞: comparative, superlative)
4. translations: [{ lang: "zh-TW", lang_word: "中文翻譯", definition: "完整中文釋義" }]
5. examples: [{ en: "英文例句", highlight: ["要反白的字"], translations: { "zh-TW": "中文翻譯" } }] (1-2 個例句)
6. synonyms: 同義詞 (0-3 個)
7. antonyms: 反義詞 (0-3 個)
8. phrases: 相關片語 (0-3 個)

規則:
- 單字不要重複使用相同的例句模板
- 翻譯要自然口語, 不要機械翻譯感
- 詞性變化要正確 (不規則動詞如 go/went/gone 要特別注意)
- 例句要符合多益商務/生活情境
- highlight 填入例句中出現的主單字或其衍生形式

待升級單字列表:
${JSON.stringify(wordsToUpgrade.map(w => w.word), null, 2)}

請輸出完整 JSON 陣列, 每個元素包含 word + 上述所有欄位。`);
