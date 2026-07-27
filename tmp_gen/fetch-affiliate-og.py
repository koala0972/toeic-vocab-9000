#!/usr/bin/env python3
"""
抓取 8 個聯盟品牌的 og:image + og:title, 存到 public/affiliates/.
短連結會經過 HTTP redirect, requests 自動跟.
"""
import os
import re
import urllib.request
import urllib.parse
import json
import ssl
from pathlib import Path

ROOT = 'D:/Hermes/english-learning'
AFF_DIR = f'{ROOT}/public/affiliates'
os.makedirs(AFF_DIR, exist_ok=True)

# (id, brand_name, short_url)
BRANDS = [
    ('ivy-bar',       'IVY BAR 學英文吧',    'https://linkgo.one/s/F77Hk'),
    ('jiantan',       '巨匠美語',           'https://afflink.one/s/aiCcB'),
    ('51talk',        '51Talk',              'https://onelink.one/s/vV7rM'),
    ('oikid',         'OiKID',               'https://onelink.one/s/MsAO5'),
    ('voicetube',     'VoiceTube Vclass',    'https://afflink.one/s/kr9iK'),
    ('yingdai',       '英代外語',           'https://onelink.one/s/tFfFc'),
    ('d-plus',        'D+ Language Plus',     'https://linkgo.one/s/q4ucw'),
    ('preply',        'Preply',              'https://afflink.one/s/m1pOj'),
]

# SSL context that doesn't verify (some sites have cert issues)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(url, timeout=15, max_redirects=10):
    """Follow redirects, return (final_url, html_bytes, headers)."""
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    })
    for _ in range(max_redirects):
        try:
            resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
            return resp.geturl(), resp.read(), resp.headers
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get('Location')
                if not loc: break
                url = urllib.parse.urljoin(url, loc)
                req = urllib.request.Request(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
                })
                continue
            raise
        except Exception as e:
            print(f'  fetch error: {e}')
            return None, None, None
    return None, None, None

def parse_meta(html_bytes):
    """Extract og:title and og:image from HTML."""
    if not html_bytes:
        return None, None, None, None
    try:
        html = html_bytes.decode('utf-8', errors='ignore')
    except Exception:
        html = html_bytes.decode('latin-1', errors='ignore')

    # og:title
    m = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']', html, re.I)
    og_title = m.group(1) if m else None

    # og:image
    m = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html, re.I)
    og_image = m.group(1) if m else None

    # twitter:image fallback
    if not og_image:
        m = re.search(r'<meta\s+name=["\']twitter:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)
        if m: og_image = m.group(1)

    # og:image:secure_url
    if not og_image:
        m = re.search(r'<meta\s+property=["\']og:image:secure_url["\']\s+content=["\']([^"\']+)["\']', html, re.I)
        if m: og_image = m.group(1)

    # <title> fallback for og_title
    if not og_title:
        m = re.search(r'<title>([^<]+)</title>', html, re.I)
        if m: og_title = m.group(1).strip()

    # Fallback images: (a) favicon / apple-touch-icon, (b) first big <img>
    favicon = None
    for pat in [
        r'<link\s+rel=["\']apple-touch-icon[^"\']*["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link\s+rel=["\']icon["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link\s+rel=["\']shortcut icon["\'][^>]*href=["\']([^"\']+)["\']',
    ]:
        m = re.search(pat, html, re.I)
        if m:
            favicon = m.group(1)
            break

    # First large-ish <img> (logo-ish in header)
    first_img = None
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
    for src in imgs:
        # Skip tiny ones (logos often have 'logo' in name or are PNG)
        if any(s in src.lower() for s in ['logo', 'brand', 'header', 'site-image', 'wp-content/uploads']):
            first_img = src
            break
    if not first_img and imgs:
        first_img = imgs[0]

    return og_title, og_image, favicon, first_img

def download_image(url, dest_path, timeout=15):
    """Download binary image to dest_path."""
    try:
        # Encode non-ASCII chars in URL path
        parsed = urllib.parse.urlsplit(url)
        path = urllib.parse.quote(parsed.path, safe='/:')
        url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
        })
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        data = resp.read()
        if len(data) < 100:
            print(f'  image too small: {len(data)} bytes')
            return False
        with open(dest_path, 'wb') as f:
            f.write(data)
        return True
    except Exception as e:
        print(f'  download_image error: {e}')
        return False

def main():
    results = []
    for idx, (bid, brand_name, short_url) in enumerate(BRANDS):
        print(f'\n[{idx+1}/{len(BRANDS)}] {brand_name} ({bid})')
        print(f'  short: {short_url}')

        final_url, html, headers = fetch(short_url)
        if not final_url:
            print('  FAILED: no final URL')
            results.append({
                'id': bid, 'name': brand_name, 'short_url': short_url,
                'final_url': None, 'og_title': None, 'og_image': None,
                'image_path': None, 'status': 'fetch_failed',
            })
            continue

        print(f'  final: {final_url}')

        og_title, og_image, favicon, first_img = parse_meta(html)
        print(f'  og:title: {og_title}')
        print(f'  og:image: {og_image}')
        if not og_image:
            print(f'  favicon: {favicon}')
            print(f'  first_img: {first_img}')

        image_path = None
        # Try og:image, then first_img, then favicon
        candidates = []
        if og_image: candidates.append(('og', og_image))
        if first_img: candidates.append(('first_img', first_img))
        if favicon: candidates.append(('favicon', favicon))

        for src_kind, src in candidates:
            img_url = urllib.parse.urljoin(final_url, src)
            img_dest = f'{AFF_DIR}/{bid}.png'
            if download_image(img_url, img_dest):
                image_path = f'/affiliates/{bid}.png'
                sz = os.path.getsize(img_dest)
                print(f'  saved ({src_kind}): {image_path} ({sz} bytes)')
                break
            else:
                print(f'  image download failed ({src_kind})')

        results.append({
            'id': bid,
            'name': brand_name,
            'short_url': short_url,
            'final_url': final_url,
            'og_title': og_title,
            'og_image': og_image,
            'favicon': favicon,
            'first_img': first_img,
            'image_path': image_path,
            'status': 'ok' if image_path else 'no_image',
        })

    # Save JSON summary
    out = f'{ROOT}/tmp_gen/affiliate-og.json'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'\n=== Summary written to {out} ===')
    successful = [r for r in results if r['image_path']]
    print(f'Successfully grabbed: {len(successful)}/{len(BRANDS)}')
    for r in results:
        status = '✓' if r['image_path'] else '✗'
        print(f"  {status} {r['id']:12s} — {r['name']}")

if __name__ == '__main__':
    main()
