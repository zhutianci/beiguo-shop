"""
离线生成全站品牌素材（开发机上跑一次，产物提交进 public/，运行时零成本）。

    python scripts/gen-brand-assets.py

源图：docs/brand/bigo-logo-source.webp（站长 2026-09-26 提供的定稿 logo，1254x1254，自带透明通道）。
换 logo 时只换这张源图、重跑本脚本，不要手工改 public/ 里的产物。

【为什么不直接用源图】源图外圈有一层近白的半透明光晕（按白底设计的柔光）。
放在白底上看不出来，放到本站深色页头 / 页脚上就成了一圈灰白的雾，
甜甜圈内圈、轨道环、像素方块边上都是毛边——上一版手工抠图被站长指出「边缘很多不清楚」就是这个。
深色场景用的素材因此要「去雾」：
  · 物体本身的边缘很利落（透明度 2 个像素内从 ~80 升到 ~220），光晕是 10~130 的大片低透明度，
    按透明度 140→200 做一次线性重映射就能把雾整层去掉、保留物体；
  · 源图 1254px，产物最大 640px，缩小本身就给边缘做了抗锯齿（按预乘 alpha 缩放，避免暗边）；
  · 边缘半透明像素的颜色用内部不透明像素向外「渗色」校正，杜绝白边。
浅色场景（苹果桌面图标的白底）保留原图光晕，那是设计本意。

【深色版字标】「bigo tech」是深藏青色，放在深色页脚上看不见：深色版把它改成白色，
「bigolab.com」与副标题提亮 35%，保留原本的蓝紫色相。

产物：
  public/logo-mark.png           256x256  页头站标（40px 显示，2x/3x 屏够用）、邮件、退订页。去雾、透明底
  public/logo-square.png         512x512  浏览器图标、JSON-LD publisher.logo、友链站标、微信取图兜底（≥300x300）。去雾、透明底
  public/apple-touch-icon.png    180x180  iOS 桌面图标。白底 + 原图光晕（iOS 会把透明底渲染成黑色）
  public/favicon.ico             16/32/48 浏览器默认请求 /favicon.ico 时的兜底
  public/logo-full.png           640x628  页脚完整字标（深色版：白字）。去雾、透明底
  public/logo-full-light.png     640x628  浅色场景用的完整字标（原色，保留光晕）
  public/og-default.png          1200x630 站点默认分享图
  public/news-og/<slug>.png      1200x630 资讯六个分类的分享图（取代 scripts/gen-og-image.js 的像素字版本）

依赖：Pillow（开发机）、numpy。字体取 Windows 自带的 Segoe UI（只画拉丁字母），取不到时退回 Pillow 默认字体。
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'docs', 'brand', 'bigo-logo-source.webp')
PUB = os.path.join(ROOT, 'public')

# 源图里的分区（1254x1254 坐标，按透明度行投影量出来的）：图形在上，字标在下
MARK_BOTTOM = 790      # 图形（甜甜圈 + 轨道 + 像素方块）下沿以下就是文字
WORD_TOP, WORD_BOTTOM = 790, 1045      # 「bigo tech」（g 的下伸部到 1032）
TAG_TOP = 1045                         # 「bigolab.com」两侧装饰线 + 「AI RECHARGE PLATFORM」

ALPHA_LO, ALPHA_HI = 140.0, 200.0      # 去雾：≤140 视为光晕，≥200 视为物体


def load_source():
    im = Image.open(SRC).convert('RGBA')
    if im.size != (1254, 1254):
        print(f'[warn] 源图尺寸 {im.size}，分区坐标按 1254x1254 写的，换了尺寸要重新量')
    return np.asarray(im).astype(np.float32)


def bleed_colors(rgb, alpha, solid_thr=235.0, iters=6):
    """把不透明像素的颜色向外渗到半透明边缘：边缘像素颜色 = 邻近实心像素的平均色，杜绝白边 / 灰边。"""
    solid = alpha >= solid_thr
    out = rgb.copy()
    filled = solid.copy()
    acc_rgb = np.where(solid[..., None], rgb, 0.0)
    for _ in range(iters):
        s = np.zeros_like(acc_rgb)
        n = np.zeros(alpha.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                s += np.roll(np.roll(acc_rgb, dy, 0), dx, 1)
                n += np.roll(np.roll(filled.astype(np.float32), dy, 0), dx, 1)
        grow = (~filled) & (n > 0)
        acc_rgb[grow] = s[grow] / n[grow][:, None]
        filled |= grow
    edge = (~solid) & filled
    out[edge] = acc_rgb[edge]
    return out


def defog(a):
    """去掉近白光晕，返回新的 RGBA（float）。"""
    rgb, al = a[..., :3], a[..., 3]
    new_al = np.clip((al - ALPHA_LO) / (ALPHA_HI - ALPHA_LO), 0, 1) * 255.0
    rgb2 = bleed_colors(rgb, al)
    out = np.dstack([rgb2, new_al])
    out[new_al == 0, :3] = 0
    return out


def to_dark_wordmark(a):
    """深色版：字标深藏青 → 白色；域名与副标题提亮。只动文字区，图形不动。"""
    out = a.copy()
    rgb = out[..., :3]
    word = np.zeros(a.shape[:2], bool)
    word[WORD_TOP:WORD_BOTTOM, :] = True
    word &= out[..., 3] > 0
    # 原稿的「o」是藏青 → 亮蓝的渐变，「i」上是亮蓝圆点：不能一刀切（藏青改白、蓝色不动会把渐变切成两截）。
    # 按亮度平滑映射：藏青（最大通道 ≈48）→ 白；越接近亮蓝，越保留同色相的饱和蓝（把颜色拉到最大通道 255）。
    maxc = rgb.max(axis=2)
    t = np.clip((maxc - 70.0) / (220.0 - 70.0), 0, 1)[..., None]
    vivid = rgb * (255.0 / np.maximum(maxc, 1.0))[..., None]
    rgb[word] = (255.0 * (1 - t) + vivid * t)[word]
    tag = np.zeros(a.shape[:2], bool)
    tag[TAG_TOP:, :] = True
    tag &= out[..., 3] > 0
    rgb[tag] = rgb[tag] + (255.0 - rgb[tag]) * 0.35
    return out


def to_image(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def bbox_of(a, top=0, bottom=None, thr=8):
    al = a[top:bottom, :, 3]
    ys, xs = np.where(al > thr)
    return xs.min(), ys.min() + top, xs.max() + 1, ys.max() + 1 + top


def fit(im, size, pad_ratio=0.06, bg=None):
    """内容按长边等比放进 size 方框（或 (w, h)），四周留 pad，按预乘 alpha 缩放。"""
    w, h = (size, size) if isinstance(size, int) else size
    pad = int(round(min(w, h) * pad_ratio))
    box_w, box_h = w - 2 * pad, h - 2 * pad
    s = min(box_w / im.width, box_h / im.height)
    nw, nh = max(1, round(im.width * s)), max(1, round(im.height * s))
    small = im.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (w, h), (bg + (255,)) if bg else (0, 0, 0, 0))
    canvas.alpha_composite(small, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def font(size, bold=True):
    names = ['segoeuib.ttf', 'arialbd.ttf'] if bold else ['segoeui.ttf', 'arial.ttf']
    for n in names:
        p = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', n)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    print('[warn] 找不到 Segoe UI / Arial，退回 Pillow 默认字体（分享图上的英文会变小变糙）')
    return ImageFont.load_default()


def gradient(w, h, c0, c1):
    """左上 → 右下的对角线渐变（沿用 gen-og-image.js 的配色思路）"""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    t = (x / w * 0.6 + y / h * 0.4)[..., None]
    arr = np.array(c0, np.float32) * (1 - t) + np.array(c1, np.float32) * t
    return Image.fromarray(arr.astype(np.uint8), 'RGB').convert('RGBA')


BRAND_FROM = (15, 23, 42)       # slate-900
BRAND_TO = (12, 74, 110)        # primary-900
ACCENT = (56, 189, 248)         # primary-400
CATEGORY_OG = [                 # 与 lib/news/format.ts ogImageForCategory() 的 slug 一致（SKILL.md §4 固定 6 类）
    ('ai-models', 'MODELS', (46, 16, 101), (167, 139, 250)),
    ('ai-products', 'PRODUCTS', (8, 51, 68), (34, 211, 238)),
    ('industry', 'INDUSTRY', (69, 26, 3), (251, 191, 36)),
    ('paper', 'PAPERS', (6, 44, 38), (52, 211, 153)),
    ('tool', 'TOOLS', (30, 27, 75), (129, 140, 248)),
    ('opinion', 'OPINION', (80, 7, 36), (244, 114, 182)),
]


def build_og(full_dark, mark, wordmark, word=None, to=BRAND_TO, accent=ACCENT):
    c = gradient(1200, 630, BRAND_FROM, to)
    d = ImageDraw.Draw(c, 'RGBA')   # RGBA 模式才会按 alpha 混合，半透明文字与细线不会被直接写成不透明
    d.rectangle([0, 0, 1200, 7], fill=accent + (255,))
    if word is None:
        # 默认分享图：完整字标居中，底图只放品牌（标题由 og:title 承载）
        logo = fit(full_dark, (1200, 560), pad_ratio=0.02)
        c.alpha_composite(logo, (0, 40))
    else:
        # 分类图：左上图形 + bigo tech，中部分类词（每类一个强调色），底部域名
        m = fit(mark, 132, pad_ratio=0.0)
        c.alpha_composite(m, (92, 96))
        # 字标直接截 logo 里的「bigo tech」（深色版），不用系统字体重打：字形与站标完全一致
        wh = 80
        ww = round(wordmark.width * wh / wordmark.height)
        wm = wordmark.convert('RGBa').resize((ww, wh), Image.LANCZOS).convert('RGBA')
        c.alpha_composite(wm, (252, 112))    # 左对齐在图形右侧，与图形留出 ~28px 间距
        d.text((248, 196), 'AI INDUSTRY DIGEST', font=font(24, bold=False), fill=accent + (255,))
        size = 150 if len(word) <= 7 else 128
        d.text((92, 262), word, font=font(size), fill=accent + (255,))
        d.rectangle([96, 470, 1104, 471], fill=(255, 255, 255, 40))
        d.text((96, 506), 'BIGOLAB.COM', font=font(34, bold=False), fill=(255, 255, 255, 205))
        for i in range(3):
            x = 1040 + i * 26
            d.ellipse([x, 522, x + 16, 538], fill=accent + (int(255 * (0.9 - i * 0.25)),))
    return c.convert('RGB')


def main():
    a = load_source()
    clean = defog(a)
    dark = to_dark_wordmark(clean)

    mark_box = bbox_of(clean, 0, MARK_BOTTOM)
    full_box = bbox_of(clean)
    mark_clean = to_image(clean).crop(mark_box)
    mark_orig = to_image(a).crop(bbox_of(a, 0, MARK_BOTTOM, thr=30))

    fit(mark_clean, 256, 0.04).save(os.path.join(PUB, 'logo-mark.png'), optimize=True)
    fit(mark_clean, 512, 0.06).save(os.path.join(PUB, 'logo-square.png'), optimize=True)
    fit(mark_orig, 180, 0.10, bg=(255, 255, 255)).convert('RGB').save(os.path.join(PUB, 'apple-touch-icon.png'), optimize=True)
    ico_src = fit(mark_clean, 256, 0.02)
    ico_src.save(os.path.join(PUB, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])

    full_dark = to_image(dark).crop(full_box)
    fit(full_dark, (640, 628), 0.03).save(os.path.join(PUB, 'logo-full.png'), optimize=True)
    fit(to_image(a).crop(bbox_of(a, thr=30)), (640, 628), 0.03).save(os.path.join(PUB, 'logo-full-light.png'), optimize=True)

    wordmark_dark = to_image(dark).crop(bbox_of(dark, WORD_TOP, WORD_BOTTOM))
    build_og(full_dark, mark_clean, wordmark_dark).save(os.path.join(PUB, 'og-default.png'), optimize=True)
    os.makedirs(os.path.join(PUB, 'news-og'), exist_ok=True)
    for slug, word, to, accent in CATEGORY_OG:
        build_og(full_dark, mark_clean, wordmark_dark, word, to, accent).save(os.path.join(PUB, 'news-og', slug + '.png'), optimize=True)

    print('生成完成：logo-mark / logo-square / apple-touch-icon / favicon.ico / logo-full / logo-full-light / og-default / news-og ×6')


if __name__ == '__main__':
    sys.exit(main())
