# TOEIC 多益單字學習網站

繁體中文學習 (可切換日文/韓文) · 9,000 題 · 900 關 · 中英反白互動 · Web Speech 語音播放

## 設計

| 項目 | 規格 |
|---|---|
| 架構 | Next.js 14 (App Router) + TypeScript + Tailwind |
| 資料儲存 | GitHub repo `data/levels/<tier>/<n>.json` (靜態 JSON, Vercel CDN cache) |
| 學習進度 / 收藏 | localStorage (MVP) → 之後 Supabase |
| 語音 | Web Speech API (`SpeechSynthesisUtterance`) |
| 語速 | 0.7 / 1.0 / 1.3 三段 |

## 難度分級依據（不憑空想像）

| 級數 | 關卡範圍 | CEFR | 對應多益 | 詞彙來源 |
|---|---|---|---|---|
| **基礎** | 1-300 | A1-A2 | 0-600 | Oxford 3000 / 教育部 1200 / Longman 3000 |
| **中級** | 301-600 | B1-B2 | 600-850 | TOEIC 官方 1500 / BNC top 3000 / COCA 商務 |
| **高級** | 601-900 | C1-C2 | 850-990 | COCA top 5000 tail / AWL / Cambridge C1-C2 |

— 詞頻來源：B1+ 詞依 **Longman Communication 3000**，B2+ 依 **BNC/COCA**，C1+ 依 **Cambridge wordlist**。

## 主要功能（MVP）

- **單字卡**：CEFR + 多益分數標示 + 詞性變化整合 (`run` 內含 `ran`/`running`)
- **中英反白**：點英文 token → 中文翻譯對應詞反白；反向亦然
- **語音按鈕**：`🔊` 播放整句，`▶️` 播放單字；語速 0.7/1.0/1.3x 可調
- **同/反義詞標記**：多益高頻題型
- **片語**：phrasal verbs 直接展開
- **搜尋單字**：跨 900 關，含分級篩選
- **收藏清單**：localStorage 暫存（未來 Supabase）
- **學習進度**：本機儲存，未跨裝置（未來 Supabase）
- **鍵盤快捷鍵**：`Space` 播放、`←/→` 切題、`A` 顯示/隱藏翻譯、`F` 收藏
- **學習方多語系**：`zh-TW` / `ja` / `ko` 切換 (預留結構)

## 不做的事

- ❌ 測驗／考試／星等評分 (使用者明確表示不要)
- ❌ 錯題本 (使用者明確表示不要)
- ❌ 預錄音檔 / Google TTS (先用 Web Speech API，之後免費額度滿了再考慮)
- ❌ 自動學習方語言偵測 (介面顯式切換)
- ❌ 題目隨機抽樣 (循序學)

## 部署

```bash
npm install
npm run build
vercel --prod
```

## 結構

```
app/
  page.tsx                       # 首頁(三大級卡片 + 進度)
  level/[n]/page.tsx             # 關卡頁
  search/page.tsx                # 搜尋頁
  favorites/page.tsx             # 收藏頁
  api/
    levels/route.ts              # GET /api/levels          (總覽)
    levels/[n]/route.ts          # GET /api/levels/[n]      (該關 JSON)
    manifest/route.ts            # GET /api/manifest        (搜尋索引)
components/
  WordCard.tsx                   # 單字卡 + 中英反白核心 UI
  VoiceButton.tsx                # 語音播放按鈕
  FavoriteStar.tsx               # 收藏星星
lib/
  types.ts                       # VocabularyEntry 資料型別
  levels-config.ts               # 分級規則 + 來源依據
  i18n.ts                        # 介面文字多語系
  speech.ts                      # Web Speech 封裝
  highlight.ts                   # 中英反白 token 工具
data/levels/
  basic/{1..300}.json            # 基礎關 1-300
  intermediate/{301..600}.json   # 中級關 301-600
  advanced/{601..900}.json       # 高級關 601-900
```

## TODO 之後迭代

- [ ] 批量產 9,000 單字例句
- [ ] 聽寫模式 (`/dictation/[n]`)
- [ ] Supabase：跨裝置進度同步
- [ ] Google OAuth 登入
- [ ] Google AdSense / Affiliate 文案
- [ ] Google TTS（Web Speech 品質不足時）
