#!/usr/bin/env python3
"""
Affiliate One banner 掃描 - 每 tick 跑一個 page (避 rate limit 2/10min).
讀進度 tmp_gen/affiliate-one-progress.json, 只抓新頁, 寫回同檔.
每 tick 由 cron 觸發, 完成 / 完成時 print 找到的新 URL.
"""
import json
import os
import sys
import urllib.request

API_KEY = '7b3bce244fe3d483c15fde0c736600d0'
PROGRESS_FILE = 'D:/Hermes/english-learning/tmp_gen/affiliate-one-progress.json'

TARGETS = {
    '51talk':    ['51Talk', '51TALK'],
    'oikid':     ['OiKID', 'OIKID'],
    'voicetube': ['VoiceTube', 'voicetube'],
    'yingdai':   ['英代', 'EGL', 'egl.com'],
    'd-plus':    ['大新', 'dahhsin', 'DH+', 'D+ Language'],
    'ivy-bar':   ['IVY BAR', 'iVY BAR', 'ivy bar'],
    'jiantan':   ['巨匠', 'soeasy', 'SoEASY'],
}

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'next_page': 1, 'found': {}, 'done': False, 'pages_scanned': 0}

def save_progress(progress):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
def get_page(page):
    url = f'https://api.pub.affiliates.one/api/v2/affiliates/offers.json?api_key={API_KEY}&page={page}'
    req = urllib.request.Request(url)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read().decode('utf-8'))

def has_any(name, tlist):
    nl = name.lower()
    return any(t.lower() in nl for t in tlist)

def main():
    """連續掃, 碰 429 自己 sleep 11 分鐘."""
    while True:
        progress = load_progress()
        if progress.get('done'):
            print('SCAN DONE:')
            for bid, info in progress['found'].items():
                print(f'  {bid}: {info["brand_image_url"]}')
            return

        if all(k in progress['found'] for k in TARGETS):
            progress['done'] = True
            save_progress(progress)
            print('ALL 7 FOUND - DONE')
            return

        page = progress['next_page']
        try:
            data = get_page(page)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f'[{page}] rate-limited, sleep 11 min...')
                import time
                time.sleep(665)
                continue
            raise

        offers = data.get('data', [])
        progress['pages_scanned'] += 1
        new_finds = 0
        for o in offers:
            name = o.get('name', '')
            bid = None
            for k, tlist in TARGETS.items():
                if k in progress['found']: continue
                if has_any(name, tlist):
                    bid = k; break
            if bid:
                progress['found'][bid] = {
                    'offer_id': o.get('id'),
                    'name': name,
                    'preview_url': o.get('preview_url'),
                    'brand_image_url': o.get('brand_image_url'),
                    'commission_range': o.get('commission_range'),
                }
                new_finds += 1
                print(f'  ✓ FOUND {bid} (offer {o.get("id")}): {name}')
                print(f'    img: {o.get("brand_image_url")}')

        progress['next_page'] = page + 1

        if len(offers) < 50:
            progress['done'] = True
            print(f'PAGE {page} returned {len(offers)} offers (end of list)')
        elif all(k in progress['found'] for k in TARGETS):
            progress['done'] = True
            print('All targets found this tick')

        save_progress(progress)

        found_count = len(progress['found'])
        total = len(TARGETS)
        print(f'PROGRESS: {found_count}/{total} brands found, scanned page {page}')
        if found_count < total and not progress['done']:
            print(f'Next page: {progress["next_page"]} (sleep 11 min)')
            import time
            time.sleep(665)
        else:
            return

if __name__ == '__main__':
    main()
