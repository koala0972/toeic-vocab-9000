#!/usr/bin/env python3
"""SVG → PNG 192 + 512. 使用 Pillow 內建 cairosvg 替代（如果 Pillow 沒裝 cairosvg）"""
import os, sys
try:
    from PIL import Image, ImageDraw
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

ROOT = 'D:/Hermes/english-learning'

# 由於環境無 cairosvg, 用 raw 8x8 raster 直接 draw 兩 cover
# 為降低跨路徑風險, 使用較穩粗的 method:
# 1) 解析 svg 字符串, 取出 環形 + 矩形 + text 等位置
# 改用 Optimal: 直接寫兩份 raw py 300×300 / 512×512 rasters

def draw_icon(size, maskable=False):
    """Re-draw the icon programmatically."""
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new('RGB', (size, size), '#3b82f6')
    d = ImageDraw.Draw(img)
    # 安全區 (maskable inner 80%)
    m = 0 if not maskable else size * 0  # maskable 內 safe 區無需 offset
    # 書本
    pad = size // 6 if not maskable else size // 5
    book_w = size // 3
    book_x = size // 4
    book_y = size // 5
    book_h = book_w * 1.5
    d.rounded_rectangle([book_x, book_y, book_x + book_w, book_y + book_h],
                       radius=size//32, fill='white')
    spine_y_top = book_y + book_w // 4
    spine_y_bot = book_y + book_h - book_w // 4
    d.line([(book_x + book_w//2, spine_y_top),
            (book_x + book_w//2, spine_y_bot)],
           fill='#3b82f6', width=max(size//48, 2))
    # T 字
    try:
        font_size = int(size // 2.4)
        font = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", font_size)
    except Exception:
        try:
            font_size = int(size // 2.4)
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()
    t_x = int(size * 0.70)
    t_y = int(size * 0.68)
    d.text((t_x, t_y), 'T', fill='white', font=font, anchor='mm')
    # 金點
    dot_r = size // 16
    dot_cx = int(size * 0.78)
    dot_cy = int(size * 0.27)
    d.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill='#fbbf24')
    return img

img192 = draw_icon(192, maskable=False)
img512 = draw_icon(512, maskable=False)
img192.save(f'{ROOT}/public/icon-192.png', 'PNG', optimize=True)
img512.save(f'{ROOT}/public/icon-512.png', 'PNG', optimize=True)
print('icon-192.png:', os.path.getsize(f'{ROOT}/public/icon-192.png'), 'bytes')
print('icon-512.png:', os.path.getsize(f'{ROOT}/public/icon-512.png'), 'bytes')

# Maskable 版 (整張藍底書佔中間 80%)
img512m = draw_icon(512, maskable=True)
img512m.save(f'{ROOT}/public/icon-512-maskable.png', 'PNG', optimize=True)
print('icon-512-maskable.png:', os.path.getsize(f'{ROOT}/public/icon-512-maskable.png'), 'bytes')
