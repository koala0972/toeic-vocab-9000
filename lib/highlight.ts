// 中英反白工具

export function tokenizeSentence(en: string): Array<{ text: string; isWord: boolean }> {
  const tokens: Array<{ text: string; isWord: boolean }> = [];
  // 拆 token: 含字母、apostrophe、hyphen 算字; 其餘標點空白各自一塊
  const re = /([A-Za-z][A-Za-z'\-]*)|([^A-Za-z]+)/g;
  let m;
  while ((m = re.exec(en)) !== null) {
    if (m[1] !== undefined) tokens.push({ text: m[1], isWord: true });
    else tokens.push({ text: m[2], isWord: false });
  }
  return tokens;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s.,!?;:'"]/g, '');
}

// 找出 highlight 對應 token 索引 (處理詞形變化)
export function findHighlightIndices(
  tokens: Array<{ text: string; isWord: boolean }>,
  highlights: string[]
): Set<number> {
  const normHighlights = highlights.map(normalize).filter(Boolean);
  const result = new Set<number>();
  tokens.forEach((tok, i) => {
    if (!tok.isWord) return;
    const tn = normalize(tok.text);
    if (normHighlights.includes(tn)) {
      result.add(i);
    } else {
      for (const h of normHighlights) {
        if (h && (tn.startsWith(h) || tn.includes(h))) {
          result.add(i);
          break;
        }
      }
    }
  });
  return result;
}

// 將中文翻譯 string 中的對應中文詞 (lang_word) 加上 <span>
// 詞長太短(<2) 不標，避免亂標
export function highlightChinese(
  translation: string,
  langWords: string[]
): string {
  if (!translation || langWords.length === 0) return translation;
  const words = Array.from(new Set(langWords.filter(w => w.length >= 2 && translation.includes(w))));
  if (words.length === 0) return translation;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${words.map(esc).join('|')})`, 'g');
  return translation.replace(re, '<span class="word-token highlighted" data-zh-word="$1">$1</span>');
}
