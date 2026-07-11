// 單字資料結構: 整個 9,000 題都遵循這個規格
// 重要設計: 詞性變化整合在 word 內，不分多筆

export type LangCode = 'zh-TW' | 'ja' | 'ko' | 'en';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'interjection'
  | 'determiner'
  | 'phrasal-verb';

export interface Translation {
  lang: LangCode;          // 學習方語言
  definition: string;      // 在該語言中的完整說明
  lang_word: string;       // 該語言的單字本身 (中:「哈囉」日:「こんにちは」)
}

export interface Example {
  en: string;              // 英文例句
  highlight: string[];     // 例句中要反白的英文子詞 (主單字或衍生)
  translations: { [key in Exclude<LangCode, 'en'>]?: string };  // 翻譯 dict
}

export interface VocabularyEntry {
  id: string;              // 例: "A1-001-001"  (級-關-題)
  level: number;           // 1-900 (300 per tier)
  tier: 'basic' | 'intermediate' | 'advanced';
  cefr: CEFRLevel;
  toeic_score_min: number; // 對應多益分數下限
  domain: string;          // 主題分類, 例: "daily_greeting", "office_business"

  word: string;            // 主單字 (詞形原形)

  pos: PartOfSpeech[];     // 一個單字可有多詞性
  conjugations: {          // 詞性變化整合在此 (不另開題)
    [k: string]: string;   // ex: { past_tense: "ran", past_participle: "run", plural: "runs" }
  };

  translations: Translation[];  // 多語系，目前先填 zh-TW

  examples: Example[];     // 2-3 個例句
  synonyms: string[];
  antonyms: string[];
  phrases: string[];       // 片語 (phrasal verbs 如 "take over")
}
