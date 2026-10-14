# -*- coding: utf-8 -*-
"""教程配图生成器（本站自制示意图，不是截图）。

用法：python make_card.py spec.json out.png
spec.json 形如：
  {"type": "steps",   "title": "...", "sub": "可选的一行说明", "items": [{"t": "步骤标题", "d": "一两句说明"}, ...]}
  {"type": "compare", "title": "...", "cols": ["项目", "Free", "Plus"], "rows": [["模型", "…", "…"], ...], "note": "可选脚注"}
  {"type": "decide",  "title": "...", "items": [{"if": "看到什么 / 什么情况", "then": "怎么办"}, ...]}
  {"type": "check",   "title": "...", "items": ["要点一", "要点二", ...]}
通用可选字段："source": "资料来源：OpenAI 帮助中心"、"date": "2026-10-13"

约束（生成器会报错而不是出丑图）：title ≤ 28 字；steps / decide / check 3–8 项；compare 2–5 列、2–9 行；
单元格 / 说明文字别超过 60 字。宽 1200px，高度自适应。
"""
import json
import sys
from PIL import Image, ImageDraw, ImageFont

W = 1200
PAD = 56
BG = (250, 250, 247)
INK = (28, 30, 33)
MUTED = (104, 110, 118)
LINE = (224, 224, 218)
CARD = (255, 255, 255)
ACCENT = (16, 122, 96)
ACCENT_SOFT = (226, 243, 237)
WARM = (176, 98, 22)
WARM_SOFT = (252, 240, 222)
REG = "C:/Windows/Fonts/msyh.ttc"
BOLD = "C:/Windows/Fonts/msyhbd.ttc"


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)


def wrap(draw, text, fnt, maxw):
    """按像素宽度折行；英文单词尽量不拆开。"""
    lines, cur = [], ""
    tokens, buf = [], ""
    for ch in text:
        if ch.isascii() and (ch.isalnum() or ch in "._-/+%$#@&'"):
            buf += ch
        else:
            if buf:
                tokens.append(buf)
                buf = ""
            tokens.append(ch)
    if buf:
        tokens.append(buf)
    for tk in tokens:
        if tk == "\n":
            lines.append(cur)
            cur = ""
            continue
        # 收尾标点不放行首：宁可这一行略微超出
        if draw.textlength(cur + tk, font=fnt) <= maxw or (cur and tk in "，。、；：！？）」』】》,.;:!?)%"):
            cur += tk
        else:
            if cur.strip():
                lines.append(cur.rstrip())
            cur = tk.lstrip()
            while draw.textlength(cur, font=fnt) > maxw and len(cur) > 1:  # 超长英文串硬拆
                k = len(cur)
                while k > 1 and draw.textlength(cur[:k], font=fnt) > maxw:
                    k -= 1
                lines.append(cur[:k])
                cur = cur[k:]
    if cur.strip():
        lines.append(cur.rstrip())
    # 末行只剩一两个字时，从上一行挪两个字下来，避免孤字
    if len(lines) >= 2 and len(lines[-1]) <= 2 and len(lines[-2]) >= 8 and not lines[-2][-3:].isascii():
        lines[-1] = lines[-2][-2:] + lines[-1]
        lines[-2] = lines[-2][:-2]
    return lines or [""]


def text_block(draw, x, y, text, fnt, maxw, fill, gap=10, measure=False):
    lines = wrap(draw, text, fnt, maxw)
    lh = fnt.size + gap
    if not measure:
        for i, ln in enumerate(lines):
            draw.text((x, y + i * lh), ln, font=fnt, fill=fill)
    return len(lines) * lh - gap


def check(cond, msg):
    if not cond:
        sys.exit("spec 不合格：" + msg)


def render(spec, measure_only=False, height=2000):
    img = Image.new("RGB", (W, height), BG)
    d = ImageDraw.Draw(img)
    f_title, f_sub = font(40, True), font(24)
    f_h, f_b, f_small = font(27, True), font(24), font(20)
    y = PAD
    # 标题
    d.rectangle([PAD, y + 6, PAD + 8, y + 46], fill=ACCENT)
    y += text_block(d, PAD + 26, y, spec["title"], f_title, W - 2 * PAD - 26, INK, gap=14) + 14
    if spec.get("sub"):
        y += text_block(d, PAD + 26, y, spec["sub"], f_sub, W - 2 * PAD - 26, MUTED) + 8
    y += 22
    kind = spec["type"]
    inner = W - 2 * PAD

    if kind in ("steps", "check"):
        items = spec["items"]
        for i, it in enumerate(items):
            t = it["t"] if isinstance(it, dict) else it
            desc = it.get("d", "") if isinstance(it, dict) else ""
            tx = PAD + 96
            tw = inner - 96 - 32
            h = text_block(d, 0, 0, t, f_h, tw, INK, measure=True)
            if desc:
                h += 12 + text_block(d, 0, 0, desc, f_b, tw, MUTED, measure=True)
            box_h = max(h + 52, 96)
            d.rounded_rectangle([PAD, y, W - PAD, y + box_h], radius=18, fill=CARD, outline=LINE, width=2)
            cx, cy = PAD + 48, y + box_h // 2
            if kind == "steps":
                d.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=ACCENT)
                num = str(i + 1)
                nw = d.textlength(num, font=f_h)
                d.text((cx - nw / 2, cy - f_h.size / 2 - 4), num, font=f_h, fill=(255, 255, 255))
            else:
                d.rounded_rectangle([cx - 22, cy - 22, cx + 22, cy + 22], radius=8, fill=ACCENT_SOFT)
                d.line([cx - 11, cy + 1, cx - 3, cy + 10, cx + 12, cy - 9], fill=ACCENT, width=5, joint="curve")
            ty = y + (box_h - h) // 2
            used = text_block(d, tx, ty, t, f_h, tw, INK)
            if desc:
                text_block(d, tx, ty + used + 12, desc, f_b, tw, MUTED)
            y += box_h + 16

    elif kind == "decide":
        lw = int(inner * 0.40)
        for it in spec["items"]:
            a, b = it["if"], it["then"]
            aw, bw = lw - 56, inner - lw - 96
            h = max(text_block(d, 0, 0, a, f_h, aw, INK, measure=True), text_block(d, 0, 0, b, f_b, bw, INK, measure=True))
            box_h = max(h + 52, 100)
            d.rounded_rectangle([PAD, y, PAD + lw, y + box_h], radius=18, fill=WARM_SOFT)
            d.rounded_rectangle([PAD + lw + 44, y, W - PAD, y + box_h], radius=18, fill=CARD, outline=LINE, width=2)
            ax = PAD + lw + 10
            ay = y + box_h // 2
            d.line([ax, ay, ax + 24, ay], fill=WARM, width=4)
            d.polygon([(ax + 22, ay - 9), (ax + 34, ay), (ax + 22, ay + 9)], fill=WARM)
            ah = text_block(d, 0, 0, a, f_h, aw, INK, measure=True)
            text_block(d, PAD + 28, y + (box_h - ah) // 2, a, f_h, aw, WARM)
            bh = text_block(d, 0, 0, b, f_b, bw, INK, measure=True)
            text_block(d, PAD + lw + 72, y + (box_h - bh) // 2, b, f_b, bw, INK)
            y += box_h + 16

    elif kind == "compare":
        cols, rows = spec["cols"], spec["rows"]
        n = len(cols)
        first = int(inner * (0.26 if n >= 4 else 0.24))
        cw = [first] + [(inner - first) // (n - 1)] * (n - 1)
        xs = [PAD]
        for w in cw[:-1]:
            xs.append(xs[-1] + w)
        hh = max(text_block(d, 0, 0, c, f_h, cw[i] - 36, INK, measure=True) for i, c in enumerate(cols)) + 40
        top = y
        d.rounded_rectangle([PAD, y, W - PAD, y + hh + 20], radius=18, fill=ACCENT)
        for i, c in enumerate(cols):
            ch = text_block(d, 0, 0, c, f_h, cw[i] - 36, INK, measure=True)
            text_block(d, xs[i] + 18, y + (hh - ch) // 2, c, f_h, cw[i] - 36, (255, 255, 255))
        y += hh
        for r, row in enumerate(rows):
            check(len(row) == n, f"compare 第 {r + 1} 行应有 {n} 格")
            rh = max(text_block(d, 0, 0, cell, f_h if i == 0 else f_b, cw[i] - 36, INK, measure=True) for i, cell in enumerate(row)) + 40
            last = r == len(rows) - 1
            fill = CARD if r % 2 == 0 else (246, 247, 243)
            if last:
                d.rounded_rectangle([PAD, y, W - PAD, y + rh], radius=18, fill=fill)
                d.rectangle([PAD, y, W - PAD, y + 20], fill=fill)
            else:
                d.rectangle([PAD, y, W - PAD, y + rh], fill=fill)
            for i, cell in enumerate(row):
                f = f_h if i == 0 else f_b
                chh = text_block(d, 0, 0, cell, f, cw[i] - 36, INK, measure=True)
                text_block(d, xs[i] + 18, y + (rh - chh) // 2, cell, f, cw[i] - 36, INK if i else ACCENT)
            y += rh
        d.rounded_rectangle([PAD, top, W - PAD, y], radius=18, outline=LINE, width=2)
        y += 16
        if spec.get("note"):
            y += text_block(d, PAD + 4, y + 4, spec["note"], f_small, inner - 8, MUTED) + 16
    else:
        sys.exit("未知 type：" + str(kind))

    # 页脚
    y += 10
    d.line([PAD, y, W - PAD, y], fill=LINE, width=2)
    y += 18
    foot = "bigolab.com · 本站整理的示意图，不是软件截图"
    right = " · ".join(x for x in [spec.get("source", ""), ("资料核对于 " + spec["date"]) if spec.get("date") else ""] if x)
    d.text((PAD, y), foot, font=f_small, fill=MUTED)
    if right:
        rw = d.textlength(right, font=f_small)
        if PAD + d.textlength(foot, font=f_small) + 40 + rw <= W - PAD:
            d.text((W - PAD - rw, y), right, font=f_small, fill=MUTED)
        else:
            y += f_small.size + 10
            d.text((PAD, y), right, font=f_small, fill=MUTED)
    y += f_small.size + PAD - 12
    return img, y


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]
    check(spec.get("type") in ("steps", "compare", "decide", "check"), "type 只能是 steps / compare / decide / check")
    check(0 < len(spec.get("title", "")) <= 28, "title 必填且不超过 28 字")
    if spec["type"] == "compare":
        check(2 <= len(spec["cols"]) <= 5, "compare 需要 2–5 列")
        check(2 <= len(spec["rows"]) <= 9, "compare 需要 2–9 行")
        flat = [c for r in spec["rows"] for c in r] + spec["cols"]
    else:
        check(3 <= len(spec["items"]) <= 8, "items 需要 3–8 项")
        flat = []
        for it in spec["items"]:
            flat += list(it.values()) if isinstance(it, dict) else [it]
    check(all(isinstance(c, str) and len(c) <= 60 for c in flat), "每格 / 每条文字不超过 60 字")
    _, h = render(spec, height=200)
    img, h = render(spec, height=max(h, 200) + 2600)
    img = img.crop((0, 0, W, h))
    img = img.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE)
    img.save(out, optimize=True)
    import os
    print(f"{out} {W}x{h} {os.path.getsize(out) // 1024}KB")


if __name__ == "__main__":
    main()
