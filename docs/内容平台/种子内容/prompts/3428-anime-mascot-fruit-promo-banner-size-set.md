---
title: "电商提示词：一套多尺寸促销横幅，动漫看板娘 + 水果特写的店铺活动图合集（gpt-image-2）"
slug: anime-mascot-fruit-promo-banner-size-set
model: gpt-image-2
topics: [ecommerce, poster, illustration]
aspectRatio: "3:2"
needsRefImage: false
useCase: "店铺做一次活动需要大横幅、竖幅、通栏、小方图和圆形图标时，一张图里先把整套物料的样子定下来：同一个看板娘角色、同一套配色和标题，在 7 种尺寸里各排一版，方便统一风格后再逐张细化。"
prompt: |
  生成一张"促销横幅设计合集"图：同一场[草莓促销]活动的一整套网店物料排在一张画布上，画幅 3:2。动漫插画风，明亮、欢快、商业平面设计感，配色为[粉彩粉与鲜红]。
  - 看板娘：[棕色侧马尾、戴兔耳的动漫女孩]，穿粉蓝色外套，在各个版位里保持同一形象；
  - 商品：[新鲜红草莓]，颗粒饱满、带水珠；
  - 版位安排：
    1. 左上：大横幅——看板娘眨眼拿着一颗草莓，旁边一大篮草莓；主标题"[草莓满满]"，配两三句短副标题和 3 个圆角卖点标签；
    2. 右侧：竖幅——看板娘吃草莓，下方堆着草莓；同一主标题，副标题"[又甜又多汁！]"，底部 3 个卖点标签；
    3. 中间：通栏长横幅——看板娘闭眼吃草莓，两侧是草莓；
    4. 底部一排：两张小方图（一张角色、一张切开的草莓特写）、一张小横幅、4 个圆形图标（草莓篮、半颗草莓、整颗草莓、角色头像），每个图标下配 4 个字左右的卖点；
  - 卖点标签统一用这三句："[清晨现摘]""[香甜多汁]""[大小任选]"；
  - 各版位之间留白分隔，标题字体统一为圆润可爱的粗体，文字清晰可读。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/takadtmnu/status/2046280850501964271
  author: "@takadtmnu"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为 JSON 格式（文案为日文），改写为分条的中文描述；配色、角色、商品、主标题、副标题和卖点标签设为变量并换成中文示例文案；把逐块罗列的日文文案精简为\"每个版位放什么\"的说明"
images:
  - 3428-anime-mascot-fruit-promo-banner-size-set-1.jpg
imageCredit:
  by: "@takadtmnu"
  url: https://youmind.com/gpt-image-2-prompts?id=14212
  license: CC BY 4.0
verify:
  - "示例图为日文文案；中文文案较多时小横幅上的字容易糊，核对后可删减"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[草莓促销] 和商品换成你的活动与产品，如"芒果季""新米上市"；看板娘写清发型、配饰和服装三点即可，换成"戴草帽的短发男孩"也行；主标题 4 个字左右；三句卖点各 4 个字，越短越清楚；配色跟着产品走，芒果用"奶黄与橙色"。

示例图是日文版：左上是大横幅，兔耳女孩眨着眼举着草莓，旁边是一篮红草莓和粉色大字标题；右侧是竖幅，女孩咬着草莓、下方一堆草莓；中间一条通栏；底部依次是两张小方图、一张小横幅和四个圆形图标，全部是粉红色调，标题和卖点标签的样式一致。

**常见问题**：
- 小版位里的字糊成一团：减少文案，小方图只保留主标题；或者拿这张图当风格参考，再逐个版位单独生成。
- 角色在不同版位里长得不一样：加"所有版位里是同一个角色，发型服装完全一致"。
- 版位数量不对：把"共 7 类版位"和每类的数量写在最前面。

**适合**：电商活动物料定调、社群团购海报、农产品上新预告、给设计师的风格参考稿。促销文案里的功效与产地等说法请自行核实后再用。

### 英文原版

```text
{
  "type": "promotional banner design set",
  "theme": "strawberry advertisement campaign",
  "style": "anime illustration, bright, cheerful, commercial graphic design",
  "color_palette": "{argument name=\"primary color theme\" default=\"pastel pink and vibrant red\"}",
  "character": "{argument name=\"character description\" default=\"anime girl with brown side ponytail and bunny ears, wearing a pastel blue and pink jacket\"}",
  "product": "{argument name=\"product\" default=\"fresh red strawberries\"}",
  "layout": {
    "sections": [
      {
        "type": "large landscape banner",
        "position": "top left",
        "visuals": "character winking and holding a strawberry next to a large basket of strawberries",
        "main_text": "{argument name=\"main headline\" default=\"いちごたっぷり\"}",
        "sub_text": ["笑顔あふれる、甘〜いひととき♪", "とびきりおいしい！", "ひと粒で、しあわせ広がる♡", "あまっ♡", "旬のおいしさをお届け！"],
        "badges": {
          "count": 3,
          "labels": ["あま〜くてジューシー！", "いろんなサイズを楽しめる♪", "新鮮朝採れ！"]
        }
      },
      {
        "type": "vertical banner",
        "position": "right",
        "visuals": "character eating a strawberry with a pile of strawberries below",
        "main_text": "いちごたっぷり",
        "sub_text": ["旬のいちごをお届け！", "{argument name=\"secondary headline\" default=\"あま〜くて、ジューシー！\"}", "とろけるおいしさ〜♡"],
        "badges": {
          "count": 3,
          "labels": ["朝採れ新鮮！", "いろんなサイズを楽しめる♪", "甘くてジューシー！"]
        }
      },
      {
        "type": "wide horizontal banner",
        "position": "middle",
        "visuals": "character with closed eyes eating a strawberry, flanked by strawberries",
        "main_text": "いちごたっぷり！",
        "sub_text": ["あまくて、ジューシーな幸せ♡", "旬の美味しさをお届けします！", "おいし〜っ♡"]
      },
      {
        "type": "small square banner",
        "position": "bottom left",
        "visuals": "character smiling holding strawberry",
        "text": ["いちごたっぷり", "あま〜くてジューシー！"]
      },
      {
        "type": "small square banner",
        "position": "bottom mid-left",
        "visuals": "pile of strawberries with one cut in half",
        "text": ["旬のいちご！", "あまくてとろけるおいしさ♡"]
      },
      {
        "type": "small horizontal banner",
        "position": "bottom mid-right",
        "visuals": "character holding strawberry",
        "text": ["いちごたっぷり", "朝採れ新鮮！", "あまくてジューシー！"]
      },
      {
        "type": "circular icons",
        "position": "bottom right",
        "count": 4,
        "items": [
          { "visual": "basket of strawberries", "label": "朝採れ新鮮！" },
          { "visual": "half strawberry", "label": "あまくてジューシー！" },
          { "visual": "whole strawberry", "label": "いろんなサイズ！" },
          { "visual": "character face", "label": "とろけるおいしさ♡" }
        ]
      }
    ]
  }
}
```

> 改编自 [@takadtmnu](https://x.com/takadtmnu/status/2046280850501964271) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
