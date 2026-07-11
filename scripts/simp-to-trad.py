#!/usr/bin/env python3
# 用 opencc 轉簡體→繁體 (如果安裝), 否則基本逐字表替換
import os
try:
    import opencc
    converter = opencc.OpenCC('s2t')
    HAS_OPENCC = True
except ImportError:
    HAS_OPENCC = False
    converter = None

# 簡單字對照表(補 opencc 沒裝)
SIMP_TO_TRAD = {}  # 改用 opencc

import json, glob

if not HAS_OPENCC:
    # fallback map
    MAP = {
        '请': '請', '议': '議', '会': '會', '对': '對', '为': '為',
        '吗': '嗎', '响': '響', '样': '樣', '号': '號',
        '时': '時', '间': '間', '运': '運', '动': '動', '级': '級',
        '难': '難', '听': '聽', '记': '記', '谢': '謝', '关': '關',
        '结': '結', '实': '實', '师': '師', '语': '語', '经': '經',
        '历': '歷', '带': '帶', '书': '書', '说': '說', '儿': '兒',
        '岁': '歲', '妈': '媽', '爷': '爺', '个': '個', '们': '們',
        '么': '麼', '里': '裡', '后': '後', '员': '員', '来': '來',
        '过': '過', '让': '讓', '离': '離', '欢': '歡', '兴': '興',
        '国': '國', '种': '種', '点': '點', '饭': '飯', '馆': '館',
        '场': '場', '尽': '盡', '风': '風', '轻': '輕', '显': '顯',
        '错': '錯', '处': '處', '门': '門', '闻': '聞', '梦': '夢',
        '发': '發', '与': '與', '区': '區', '头': '頭', '谁': '誰',
        '买': '買', '卖': '賣', '马': '馬', '车': '車', '长': '長',
    }
    def conv(s):
        if not s: return s
        for sc, tc in MAP.items():
            s = s.replace(sc, tc)
        return s
else:
    def conv(s):
        if not s: return s
        try:
          return converter.convert(s)
        except Exception:
          return s

count = 0
for tier in ['basic', 'intermediate', 'advanced']:
    for f in sorted(glob.glob(f'data/levels/{tier}/*.json')):
        data = json.load(open(f, encoding='utf-8'))
        changed = False
        for w in data.get('words', []):
            for tr in w.get('translations', []):
                for k in ('definition', 'lang_word'):
                    if k in tr:
                        new = conv(tr[k])
                        if new != tr[k]:
                            tr[k] = new
                            changed = True
            for ex in w.get('examples', []):
                if 'translations' in ex:
                    for lang in list(ex['translations'].keys()):
                        new = conv(ex['translations'][lang])
                        if new != ex['translations'][lang]:
                            ex['translations'][lang] = new
                            changed = True
        if changed:
            json.dump(data, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
            count += 1
print(f'Modified {count} files (opencc={HAS_OPENCC})')
