#!/usr/bin/env python3
"""
Resize 原始 JPG icon → PNG:
- icon-192.png       (regular any + apple-touch)
- icon-512.png       (PWA any, hi-res)
- icon-512-maskable.png (maskable: 內容在中間 80% safe zone)
- icon-1024.png      (maskable + app store 用，Capacitor 會用)
"""
from PIL import Image, ImageOps
import os

ROOT = 'D:/Hermes/english-learning'
src = f'{ROOT}/tmp_gen/original-icon.jpg'

# 1) 開啓 (JPG → RGB), 偵測黑邊並裁掉
raw = Image.open(src).convert('RGB')
print('Source:', raw.size, raw.mode)

# 簡單黑邊偵測: 找最上/最下/最左/最右 的「非黑色」邊界
def detect_inner_bbox(img):
    """找非黑(非近黑)範圍的 bbox"""
    w, h = img.size
    # 非黑色 threshold (R+G+B < 30)
    def is_black(p):
        return sum(p) < 30
    # top
    top = 0
    for y in range(h):
        # 每行取多個 sample, 若一半非黑, 停在這
        samples = [img.getpixel((x, y)) for x in range(0, w, w//8 or 1)]
        black_count = sum(1 for s in samples if is_black(s))
        if black_count < len(samples) // 2:
            top = y; break
    bottom = h - 1
    for y in range(h - 1, -1, -1):
        samples = [img.getpixel((x, y)) for x in range(0, w, w//8 or 1)]
        black_count = sum(1 for s in samples if is_black(s))
        if black_count < len(samples) // 2:
            bottom = y; break
    left = 0
    for x in range(w):
        samples = [img.getpixel((x, y)) for y in range(0, h, h//8 or 1)]
        black_count = sum(1 for s in samples if is_black(s))
        if black_count < len(samples) // 2:
            left = x; break
    right = w - 1
    for x in range(w - 1, -1, -1):
        samples = [img.getpixel((x, y)) for y in range(0, h, h//8 or 1)]
        black_count = sum(1 for s in samples if is_black(s))
        if black_count < len(samples) // 2:
            right = x; break
    return (left, top, right + 1, bottom + 1)

bbox = detect_inner_bbox(raw)
print('Inner bbox:', bbox)
img_rgb = raw.crop(bbox)
print('Cropped:', img_rgb.size)

# 採樣 中央內 取紫色 (給 maskable 背景用)
purple_sample = img_rgb.getpixel((img_rgb.width // 2, 30))
print('Purple sample:', purple_sample)
top_pixel = purple_sample
top_bg = '#%02x%02x%02x' % top_pixel
print('BG (maskable):', top_bg)

# 轉 RGBA 用於 icon
img = img_rgb.convert('RGBA')

# 2) 192 (PWA standard)
img192 = img.resize((192, 192), Image.LANCZOS)
img192.save(f'{ROOT}/public/icon-192.png', 'PNG', optimize=True)
print('Wrote icon-192.png:', os.path.getsize(f'{ROOT}/public/icon-192.png'), 'bytes')

# 3) 512 (PWA hi-res)
img512 = img.resize((512, 512), Image.LANCZOS)
img512.save(f'{ROOT}/public/icon-512.png', 'PNG', optimize=True)
print('Wrote icon-512.png:', os.path.getsize(f'{ROOT}/public/icon-512.png'), 'bytes')

# 4) 512 maskable — 紫色底 + 原內容縮成中央 80%
canvas_maskable = Image.new('RGB', (512, 512), top_pixel)
inner = int(512 * 0.80)
inner_img = img_rgb.resize((inner, inner), Image.LANCZOS)
offset = (512 - inner) // 2
canvas_maskable.paste(inner_img, (offset, offset))
canvas_maskable.save(f'{ROOT}/public/icon-512-maskable.png', 'PNG', optimize=True)
print('Wrote icon-512-maskable.png:', os.path.getsize(f'{ROOT}/public/icon-512-maskable.png'), 'bytes')

# 5) 1024 (app store + Capacitor 用)
img1024 = img.resize((1024, 1024), Image.LANCZOS)
img1024.save(f'{ROOT}/public/icon-1024.png', 'PNG', optimize=True)
print('Wrote icon-1024.png:', os.path.getsize(f'{ROOT}/public/icon-1024.png'), 'bytes')

print('Done.')
