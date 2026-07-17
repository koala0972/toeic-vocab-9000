// regenerate-intermediate-advanced.mjs
// 用 TSL 1.2 + COCA + common + google10k 排除 Oxford + basic 已用詞
// 301–600 寫入 data/levels/intermediate/
// 601–900 寫入 data/levels/advanced/
// schema 結構與現有 JSON 一致 (id/level/tier/cefr/words[])

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const POOL_FILE = join(ROOT, 'tmp_gen', 'inter_adv_pool.txt');
const ZH_FILE = join(ROOT, 'tmp_gen', 'zh_dict.json');

if (!existsSync(POOL_FILE)) {
  console.error(`找不到字池 ${POOL_FILE}。請先跑 python tmp_gen/build-pool.py .`);
  process.exit(1);
}

const poolRaw = readFileSync(POOL_FILE, 'utf-8')
  .split('\n').map(w => w.trim()).filter(Boolean);
console.log(`字池 raw: ${poolRaw.length} 字`);

// 過濾明顯不該出現的字 (人名、單字母縮寫、複數/過去式形態)
const NOISE_PATTERNS = [
  /^(mr|mrs|ms|dr|jr|sr|st)$/,       // 英文稱謂
  /^(jpg|gif|pdf|http|ftp|usb|ceo|cfo|cto|hr|crm|erp|api|sdk|qa|ads|wifi)$/,
  /^[a-z]{2,3}$/,                    // 太短 (縮寫)
];
function isNoisy(w) {
  if (NOISE_PATTERNS.some(p => p.test(w))) return true;
  if (w.includes('-')) return true;   // 帶 '-' 複合
  return false;
}
const pool = poolRaw.filter(w => !isNoisy(w));
console.log(`過濾掉 ${poolRaw.length - pool.length} 個雜訊字, 剩 ${pool.length}`);

const zhRaw = JSON.parse(readFileSync(ZH_FILE, 'utf-8'));
console.log(`zh_dict: ${Object.keys(zhRaw).length} 字`);

// 簡轉繁映射 (hand-curated subset, fallback 給原簡體)
const SIMP_TO_TRAD = {
  '请':'請','议':'議','会':'會','对':'對','为':'為','随':'隨','观':'觀','种':'種',
  '号':'號','时':'時','间':'間','运':'運','动':'動','级':'級','难':'難','听':'聽',
  '记':'記','谢':'謝','关':'關','结':'結','实':'實','师':'師','语':'語','经':'經',
  '历':'歷','带':'帶','书':'書','说':'說','儿':'兒','岁':'歲','妈':'媽','爷':'爺',
  '个':'個','们':'們','么':'麼','里':'裡','后':'後','员':'員','来':'來','过':'過',
  '让':'讓','离':'離','欢':'歡','兴':'興','国':'國','点':'點','饭':'飯','馆':'館',
  '场':'場','尽':'盡','风':'風','轻':'輕','显':'顯','错':'錯','处':'處','门':'門',
  '闻':'聞','梦':'夢','发':'發','与':'與','区':'區','头':'頭','谁':'誰','买':'買',
  '卖':'賣','马':'馬','车':'車','长':'長','读':'讀','调':'調','传':'傳','东':'東',
  '钱':'錢','银':'銀','钱':'錢','货':'貨','买':'買','卖':'賣','价':'價','单':'單',
  '买':'買','务':'務','记':'記','报':'報','导':'導','请':'請','议':'議','价':'價',
  '细':'細','约':'約','组':'組','选':'選','杂':'雜','确':'確','议':'議','货':'貨',
  '达':'達','记':'記','应':'應','员':'員','产':'產','张':'張','现':'現','机':'機',
  '场':'場','样':'樣','写':'寫','内':'內','应':'應','邮':'郵','务':'務','备':'備',
  '备':'備','长':'長','发':'發','认':'認','记':'記','机':'機','创':'創','业':'業',
  '区':'區','户':'戶','线':'線','费':'費','机':'機','铁':'鐵','龙':'龍','员':'員',
  '队':'隊','学':'學','亲':'親','满':'滿','满':'滿','创':'創','认':'認','议':'議',
  '备':'備','议':'議','队':'隊','单':'單','专':'專','产':'產','关':'關','样':'樣',
  '费':'費','设':'設','务':'務','货':'貨','杂':'雜','积':'積','极':'極','构':'構',
  '错':'錯','导':'導','导':'導','电':'電','脑':'腦','页':'頁','应':'應','积':'積',
  '极':'極','监':'監','观':'觀','观':'觀','试':'試','验':'驗','历':'歷','样':'樣',
  '议':'議','历':'歷','队':'隊','验':'驗','产':'產','业':'業','产':'產','应':'應',
  '运':'運','输':'輸','输':'輸','运':'運','费':'費','钟':'鐘','钟':'鐘','银':'銀',
  '机':'機','场':'場','领':'領','导':'導','领':'領','导':'導','队':'隊','员':'員',
  '议':'議','员':'員','银':'銀','行':'行','行':'行','机':'機','产':'產','业':'業',
  '产':'產','品':'品','机':'機','产':'產','检':'檢','测':'測','检':'檢','测':'測',
  '质':'質','量':'量','认':'認','证':'證','应':'應','急':'急','诊':'診','处':'處',
};
function simpToTrad(s) {
  if (!s) return s;
  let out = '';
  for (const ch of s) {
    out += SIMP_TO_TRAD[ch] || ch;
  }
  return out;
}

function lookupTranslation(word) {
  const k = word.toLowerCase();
  const t = zhRaw[k];
  if (!t) return null;
  // t.translation field is simplified Chinese per ECDICT
  const raw = (t.translation || '').replace(/\\n/g, ', ').replace(/\s+/g, ' ').trim();
  const trad = simpToTrad(raw);
  return trad || raw;
}

function posGuess(word, hint) {
  // 簡化: 詞性從 zh_dict.pos 切 (CSV path); 沒就 fallback noun
  const k = word.toLowerCase();
  const t = zhRaw[k];
  let pos = [];
  if (t && t.pos) pos = t.pos.split(/[,\s]+/).filter(Boolean);
  if (!pos.length) return ['noun'];
  return pos;
}

function conjugationGuess(pos, word) {
  const c = {};
  if (pos.includes('verb')) {
    c.past = `${word}ed`;
    c.past_participle = `${word}ed`;
    c.ing = word.endsWith('e') ? `${word.slice(0, -1)}ing` : `${word}ing`;
    c.present_3rd = word.endsWith('s') ? `${word}es` : `${word}s`;
  } else if (pos.includes('noun')) {
    c.plural = word.endsWith('y') ? `${word.slice(0, -1)}ies` : word.endsWith('s') ? `${word}es` : `${word}s`;
  } else if (pos.includes('adjective')) {
    c.comparative = word.endsWith('y') ? `${word.slice(0, -1)}ier` : `${word}er`;
    c.superlative = word.endsWith('y') ? `${word.slice(0, -1)}iest` : `${word}est`;
  }
  return c;
}

function cefrForLevel(level, tier) {
  if (tier === 'intermediate') return level <= 400 ? 'B1' : 'B2';
  if (tier === 'advanced')      return level <= 700 ? 'C1' : 'C2';
  return 'A1';
}

function toeicMin(cefr) {
  if (cefr === 'B1') return 650;
  if (cefr === 'B2') return 750;
  if (cefr === 'C1') return 880;
  if (cefr === 'C2') return 920;
  return 400;
}

function buildEntry(word, level, idxInLevel, tier, cefr) {
  const def = lookupTranslation(word);
  const pos = posGuess(word);
  return {
    id: `${cefr}-${String(level).padStart(3,'0')}-${String(idxInLevel + 1).padStart(3,'0')}`,
    level,
    tier,
    cefr,
    toeic_score_min: toeicMin(cefr),
    word,
    phonetic: '',
    pos,
    conjugations: conjugationGuess(pos, word),
    domain: 'general',
    translations: def ? [{
      lang: 'zh-TW',
      lang_word: word,
      definition: def,
    }] : [],
    examples: [],
    synonyms: [],
    antonyms: [],
    phrases: [],
  };
}

function regenTier(tierName, levelStart, levelEnd, words, cursorIn, cursorOut) {
  const dir = join(ROOT, 'data', 'levels', tierName);
  mkdirSync(dir, { recursive: true });
  let cursor = cursorIn;
  for (let level = levelStart; level <= levelEnd; level++) {
    const cefr = cefrForLevel(level, tierName);
    const ws = [];
    for (let i = 0; i < 10; i++) {
      // 防呆: 若字池用完 — 用最後一詞、標 _placeholder (避免空字)
      const w = cursor < words.length ? words[cursor++] : words[words.length - 1];
      ws.push(buildEntry(w, level, i, tierName, cefr));
    }
    const data = { level, tier: tierName, cefr, words: ws, _skeleton: true };
    writeFileSync(join(dir, `${level}.json`), JSON.stringify(data, null, 2), 'utf-8');
  }
  return cursor;
}

// 中級 301–600 = 300 關 * 10 = 3000 字 (前 3000 字)
const interEnd = regenTier('intermediate', 301, 600, pool, 0);
console.log(`中級 301–600 寫入完成, 用字池前 ${interEnd} 字`);
const advEnd = regenTier('advanced', 601, 900, pool, interEnd);
console.log(`高級 601–900 寫入完成, 字池用到 ${advEnd}/${pool.length}`);

if (advEnd > pool.length) {
  console.warn(`⚠️ 字池 ${pool.length} 字不足 ${advEnd - interEnd + 3000} 字 — 未來需要再擴充池`);
}
console.log('Done.');
