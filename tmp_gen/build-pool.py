#!/usr/bin/env python3
"""Pool builder — 從 TSL1.2/COCA/Common/Google 排除 basic+oxford 已用詞,輸出有序池"""
import os, re, csv, json, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'

def is_clean(w):
    if len(w) < 3: return False
    if w.startswith("'"): return False
    return True

# basic already used
basic = set()
for f in sorted(os.listdir(f'{ROOT}/data/levels/basic')):
    if not re.match(r'^\d+\.json$', f): continue
    try:
        d = json.load(open(f'{ROOT}/data/levels/basic/{f}', encoding='utf-8'))
        for w in d.get('words', []):
            basic.add(w['word'].lower())
    except Exception: pass

# oxford3000
oxford = set()
with open(f'{ROOT}/tmp_gen/oxford3000.txt', encoding='utf-8') as f:
    for line in f:
        w = line.strip().lower()
        if re.match(r'^[a-z][a-z\'-]+$', w):
            oxford.add(w)

# common4000
common = []
with open(f'{ROOT}/tmp_gen/common4000.csv', encoding='latin-1') as f:
    next(f)
    for line in f:
        w = line.strip().lower()
        if is_clean(w) and re.match(r'^[a-z][a-z\'-]+$', w):
            common.append(w)

# coca5000
coca = []
with open(f'{ROOT}/tmp_gen/top5000.csv', encoding='latin-1') as f:
    next(f)
    for line in f:
        parts = line.strip().split(',')
        if len(parts) >= 2:
            w = parts[1].strip().lower()
            if is_clean(w) and re.match(r'^[a-z][a-z\'-]+$', w):
                coca.append(w)

# TSL ranked by SFI
tsl = []
with open(f'{ROOT}/tmp_gen/tsl_12_stats.csv', encoding='latin-1') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            tsl.append((row['Word'].strip().lower(), int(row['TSL Rank'])))
        except Exception: pass
tsl.sort(key=lambda kv: kv[1])

# google 10k
g10k = []
with open(f'{ROOT}/tmp_gen/google10000.txt', encoding='latin-1') as f:
    for line in f:
        w = line.strip().lower()
        if is_clean(w) and re.match(r'^[a-z][a-z\'-]+$', w):
            g10k.append(w)

# assemble
seen = set(basic) | oxford
tsl_pool = [w for w, r in tsl if w not in seen]
seen |= set(tsl_pool)
coca_pool = [w for w in coca if w not in seen]
seen |= set(coca_pool)
common_pool = [w for w in common if w not in seen]
seen |= set(common_pool)
g10k_pool = [w for w in g10k if w not in seen]
seen |= set(g10k_pool)

print(f'basic used   : {len(basic)}')
print(f'oxford 3000  : {len(oxford)}')
print(f'TSL fresh    : {len(tsl_pool)}')
print(f'COCA fresh   : {len(coca_pool)}')
print(f'Common fresh : {len(common_pool)}')
print(f'Google10k    : {len(g10k_pool)}')
print(f'TOTAL pool   : {len(tsl_pool)+len(coca_pool)+len(common_pool)+len(g10k_pool)}')

pool = tsl_pool + coca_pool + common_pool + g10k_pool
out = f'{ROOT}/tmp_gen/inter_adv_pool.txt'
with open(out, 'w', encoding='utf-8') as f:
    f.write('\n'.join(pool))
print(f'Wrote {len(pool)} words to {out}')
print('first 15:', pool[:15])
print('last 5:', pool[-5:])
