// 9,000 題生成設定 - 集中管理，方便日後查
// 這是「真實依據」表，不是憑空寫

export const TOTAL_LEVELS = 900;            // 9,000 / 10
export const WORDS_PER_LEVEL = 10;
export const TOTAL_WORDS = TOTAL_LEVELS * WORDS_PER_LEVEL;  // 9000

export interface TierConfig {
  name: 'basic' | 'intermediate' | 'advanced';
  zhName: string;
  levels: [number, number];        // 關卡編號區間 (inclusive)
  cefrRange: [CEFR, CEFR];         // CEFR 區間
  toeicRange: [number, number];    // 對應多益分數 (L+R)
  sourceLists: string[];           // 詞庫依據 (公開資料來源)
  description: string;
}

export type CEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const TIERS: TierConfig[] = [
  {
    name: 'basic',
    zhName: '初級',
    levels: [1, 300],
    cefrRange: ['A1', 'A2'],
    toeicRange: [0, 600],
    sourceLists: [
      'Oxford 3000 (A1-A2 most frequent English words)',
      '教育部 1200 英文基礎詞彙',
      'Longman Communication 3000 B1+ words',
    ],
    description: '日常會話、生活基礎、學校常見字',
  },
  {
    name: 'intermediate',
    zhName: '中級',
    levels: [301, 600],
    cefrRange: ['B1', 'B2'],
    toeicRange: [600, 850],
    sourceLists: [
      'TOEIC Official Vocabulary List (1500 high-frequency)',
      'BNC Top 3000 (British National Corpus)',
      'COCA Top 5000 (incl. business English)',
    ],
    description: '商務書信、會議、旅行、處理日常業務',
  },
  {
    name: 'advanced',
    zhName: '高級',
    levels: [601, 900],
    cefrRange: ['C1', 'C2'],
    toeicRange: [850, 990],
    sourceLists: [
      'COCA Top 5000 tail (general academic)',
      'AWL Academic Word List',
      'Cambridge C1/C2 wordlists',
      'Business English advanced (finance, law, science)',
    ],
    description: '學術論文、商談進階、財經法律專業',
  },
];

// 各關卡設定：CEFR 進度對照
// 基礎 1-100=A1, 101-200=A2, 201-300=A1-A2 複習
// 中級 301-400=B1, 401-500=B1-B2 進階, 501-600=B2
// 高級 601-700=C1, 701-800=C1-C2 進階, 801-900=C2+ 專業
export function levelToCEFR(level: number): CEFR {
  if (level <= 100) return 'A1';
  if (level <= 200) return 'A2';
  if (level <= 300) return 'A2';
  if (level <= 400) return 'B1';
  if (level <= 500) return 'B1';
  if (level <= 600) return 'B2';
  if (level <= 700) return 'C1';
  if (level <= 800) return 'C1';
  return 'C2';
}

export function levelToTier(level: number): 'basic' | 'intermediate' | 'advanced' {
  if (level <= 300) return 'basic';
  if (level <= 600) return 'intermediate';
  return 'advanced';
}

export function levelToToeicScore(level: number): number {
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
