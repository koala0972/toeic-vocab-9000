#!/usr/bin/env python3
"""
跟 Impact 連結 redirect 拿真實官網 URL, 再抓 og:image 更新本地 logo.
- 5 家有 t= 參數: 直接 parse t= 即真實官網
- 3 家無 t = 需跟 Impact click 連結 redirect (會 302 到真實 URL)
"""
import os
import re
import urllib.request
import urllib.parse
import ssl
import json

ROOT = 'D:/Hermes/english-learning'
AFF_DIR = f'{ROOT}/public/affiliates'

# 從 impact-affiliates.json 讀回
with open(f'{ROOT}/tmp_gen/impact-affiliates.json', 'r', encoding='utf-8') as f:
    brands = json.load(f)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_final_url(click_url, timeout=20):
    """跟 redirect 拿真實 URL (不取 body, 省流量)"""
    req = urllib.request.Request(click_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    })
    try:
        # 用 no body fetch (HEAD 不行因為某些 server 擋, 改 GET 但 read 很小)
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return resp.geturl()
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            return e.headers.get('Location')
        print(f'  HTTP error {e.code}')
        return None
    except Exception as e:
        print(f'  fetch error: {e}')
        return None

def parse_t(click_url):
    """從 query string 解 t= 參數"""
    parsed = urllib.parse.urlsplit(click_url)
    qs = urllib.parse.parse_qs(parsed.query)
    return qs.get('t', [None])[0]

def parse_meta(html_bytes):
    if not html_bytes:
        return None, None, None, None
    try:
        html = html_bytes.decode('utf-8', errors='ignore')
    except Exception:
        html = html_bytes.decode('latin-1', errors='ignore')

    m = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']', html, re.I)
    og_title = m.group(1) if m else None

    m = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html, re.I)
    og_image = m.group(1) if m else None

    if not og_image:
        m = re.search(r'<meta\s+name=["\']twitter:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)
        if m: og_image = m.group(1)
    if not og_image:
        m = re.search(r'<meta\s+property=["\']og:image:secure_url["\']\s+content=["\']([^"\']+)["\']', html, re.I)
        if m: og_image = m.group(1)

    if not og_title:
        m = re.search(r'<title>([^<]+)</title>', html, re.I)
        if m: og_title = m.group(1).strip()

    favicon = None
    for pat in [
        r'<link\s+rel=["\']apple-touch-icon[^"\']*["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link\s+rel=["\']icon["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link\s+rel=["\']shortcut icon["\'][^>]*href=["\']([^"\']+)["\']',
    ]:
        m = re.search(pat, html, re.I)
        if m:
            favicon = m.group(1); break

    first_img = None
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
    for src in imgs:
        if any(s in src.lower() for s in ['logo', 'brand', 'header', 'site-image', 'wp-content/uploads']):
            first_img = src; break
    if not first_img and imgs:
        first_img = imgs[0]

    return og_title, og_image, favicon, first_img

def download_image(url, dest_path, timeout=15):
    try:
        parsed = urllib.parse.urlsplit(url)
        path = urllib.parse.quote(parsed.path, safe='/:')
        url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
        })
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        data = resp.read()
        if len(data) < 100:
            return False
        with open(dest_path, 'wb') as f: f.write(data)
        return True
    except Exception as e:
        print(f'  download error: {e}')
        return False

def fetch_html(url, timeout=15):
    try:
        parsed = urllib.parse.urlsplit(url)
        path = urllib.parse.quote(parsed.path, safe='/:')
        url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
        })
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return resp.geturl(), resp.read()
    except Exception as e:
        print(f'  fetch_html error: {e}')
        return None, None

def main():
    results = []
    for i, b in enumerate(brands):
        bid = b['id']
        click = b['click_url']
        print(f'\n[{i+1}/{len(brands)}] {bid}')

        # 1. 先試 t= 參數
        real_url = parse_t(click)
        if real_url:
            print(f'  t= {real_url}')
        else:
            # 跟 redirect
            print(f'  無 t=, 跟 redirect...')
            real_url = fetch_final_url(click)
            print(f'  redirect → {real_url}')

        if not real_url:
            print(f'  cannot resolve real URL, skip')
            results.append({**b, 'real_url': None, 'new_image_path': b['image_path']})
            continue

        # 2. 抓 html
        final, html = fetch_html(real_url)
        if not html:
            print(f'  fetch_html failed')
            results.append({**b, 'real_url': real_url, 'new_image_path': b['image_path']})
            continue

        og_title, og_image, favicon, first_img = parse_meta(html)
        print(f'  og:title: {og_title}')
        print(f'  og:image: {og_image}')
        if not og_image:
            print(f'  favicon: {favicon}')
            print(f'  first_img: {first_img}')

        # 3. 下載候選
        candidates = []
        if og_image: candidates.append(('og', og_image))
        if first_img: candidates.append(('first_img', first_img))
        if favicon: candidates.append(('favicon', favicon))

        new_path = b['image_path']
        base_url = final or real_url
        for src_kind, src in candidates:
            img_url = urllib.parse.urljoin(base_url, src)
            img_dest = f'{AFF_DIR}/{bid}.png'
            if download_image(img_url, img_dest):
                new_path = f'/affiliates/{bid}.png'
                sz = os.path.getsize(img_dest)
                print(f'  saved ({src_kind}): {new_path} ({sz} bytes)')
                break
            else:
                print(f'  download failed ({src_kind})')

        results.append({**b, 'real_url': real_url, 'new_image_path': new_path,
                        'og_title': og_title, 'og_image': og_image,
                        'favicon': favicon, 'first_img': first_img})

    with open(f'{ROOT}/tmp_gen/affiliate-og.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'\n=== 寫入 tmp_gen/affiliate-og.json ===')
    for r in results:
        new = 'NEW' if r.get('new_image_path') and r.get('og_image') else 'keep'
        print(f"  {r['id']:12s} | {new} | {r.get('og_title','?')[:40]}")

if __name__ == '__main__':
    main()
