#!/usr/bin/env python3
# 從 JSON 移除 phonetic 欄位
import json, glob

count = 0
for tier in ['basic', 'intermediate', 'advanced']:
    for f in sorted(glob.glob(f'data/levels/{tier}/*.json')):
        d = json.load(open(f, encoding='utf-8'))
        changed = False
        # 移除 words 內每個 entry 的 phonetic
        for w in d.get('words', []):
            if 'phonetic' in w:
                del w['phonetic']
                changed = True
        if d.get('phonetic') is not None:
            del d['phonetic']
            changed = True
        if changed:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
            count += 1
print(f'Modified {count} files')
