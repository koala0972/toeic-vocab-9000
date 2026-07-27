#!/usr/bin/env python3
"""
查 Affiliate One API 找使用者提供的 8 家品牌圖.
"""
import json
import urllib.request

API_KEY = '7b3bce244fe3d483c15fde0c736600d0'

# 全部 offers (分頁抓)
URL_TEMPLATE = f'https://api.pub.affiliates.one/api/v2/affiliates/offers.json?api_key={API_KEY}&page={{}}'

# 使用者實際找的 8 家品牌關鍵字
TARGETS = {
    'ivy-bar':    ['IVY BAR', 'iVY BAR', 'ivy bar'],
    'jiantan':    ['巨匠', 'soeasy', 'SoEASY'],
    '51talk':     ['51Talk', '51TALK'],
    'oikid':      ['OiKID', 'OIKID'],
    'voicetube':  ['VoiceTube', 'voicetube'],
    'yingdai':    ['英代', 'egl.com', 'EGL'],
    'd-plus':     ['大新', 'dahhsin', 'DH+', 'D+'],
    'preply':     ['Preply', 'preply'],
}

def get_page(page=1):
    url = URL_TEMPLATE.format(page)
    req = urllib.request.Request(url)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read().decode('utf-8'))

def brand_matches(name, brand_targets):
    name_lower = name.lower()
    for t in brand_targets:
        if t.lower() in name_lower:
            return True
    return False

found = {}
pages_checked = 0
try:
    for page in range(1, 20):
        data = get_page(page)
        pages_checked += 1
        offers = data.get('data', [])
        print(f'page {page}: {len(offers)} offers')
        for o in offers:
            id_ = o.get('id')
            name = o.get('name', '')
            desc = (o.get('short_description') or '') + ' ' + (o.get('brand_background') or '')
            for bid, targets in TARGETS.items():
                if bid in found: continue
                if brand_matches(name, targets) or brand_matches(desc, targets):
                    found[bid] = {
                        'offer_id': id_,
                        'name': name,
                        'preview_url': o.get('preview_url'),
                        'brand_image_url': o.get('brand_image_url'),
                        'short_description': o.get('short_description'),
                        'commission_range': o.get('commission_range'),
                    }
                    print(f'  ✓ found: {bid} (offer {id_}) {name}')
                    print(f'    img: {o.get("brand_image_url")}')
        if len(offers) < 50:
            break
        if all(k in found for k in TARGETS):
            break
except Exception as e:
    print(f'stopping on: {e}')

print(f'\n=== 抓到 {len(found)}/8 品牌 ===')
for bid, info in found.items():
    print(f"  {bid:12s} | {info['name'][:40]:40s} | {info['brand_image_url']}")
print(f'\n掃了 {pages_checked} 頁')

# 寫入 json
with open('tmp_gen/affiliate-one-found.json', 'w', encoding='utf-8') as f:
    json.dump(found, f, ensure_ascii=False, indent=2)
print('saved tmp_gen/affiliate-one-found.json')
