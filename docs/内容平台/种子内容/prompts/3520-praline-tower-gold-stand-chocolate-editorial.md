---
title: "ai美食图提示词：手工夹心巧克力叠成塔，金色展台 + 深青色背景的高级感广告（Nano Banana）"
slug: praline-tower-gold-stand-chocolate-editorial
model: nano-banana
topics: [ecommerce, food, photography]
modelLabel: Nano Banana Pro
aspectRatio: "9:16"
needsRefImage: false
useCase: "给巧克力、糕点、月饼这类\"切开有内馅\"的甜品做一张奢侈品画报式的主图：几块切开的夹心巧克力错落叠成一座小塔，每层露出不同的流心，立在拉丝金属展台上，深色背景里飘着金粉。"
prompt: |
  生成一张超写实的美食摄影，奢侈品画报风格，微距级的细节，画幅 9:16 竖版。
  - 主体：一座由各式夹心巧克力错落叠成的小塔，位于画面正中；每一块都被切开，露出不同的内馅，叠放得随意自然、略有错位，不是整齐的方块。
  - 内馅（从上到下）：[百香果馅，能看到果籽]；[海盐焦糖，有自然流淌的纹路]；[咖啡甘纳许，表面是顺滑的波纹]；[覆盆子果冻，自然地淌出一小滩]；最底层是不规则成团的[榛子碎]。
  - 点缀：层与层的交接处各放一颗[金色金属质感的坚果]，每层一颗、造型各不相同。
  - 展台：一个[拉丝金]的圆柱形展台，表面有细腻的反光。
  - 背景：[深青色到午夜蓝]的渐变，空中悬浮着稀疏的细小金粉。
  - 光线：戏剧性的侧光，从左侧约 35 度打来；内馅有真实的透光和折射，层与层之间有明暗交替的阴影。
  - 质感：巧克力外壳的光泽、切面的粗糙和流心的黏稠都要真实；不要文字、标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Nas_tech_AI/status/2011592765570785538
  author: "@Nas_tech_AI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是一组多图 JSON（塔、平铺等），这里取与示例图对应的第 1 张\"夹心巧克力塔\"改写为分条中文；内馅清单、点缀物、展台材质、背景色改为变量；合并了灯光与质感的重复条目"
images:
  - 3520-praline-tower-gold-stand-chocolate-editorial-1.jpg
imageCredit:
  by: "@Nas_tech_AI"
  url: https://youmind.com/nano-banana-pro-prompts?id=6179
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：内馅五层可以按你的产品线替换，每层写"口味 + 一个看得见的质地特征"（如"抹茶生巧，粉质哑光""开心果酱，带碎粒"）；点缀物可换成"金箔片""烘干的玫瑰花瓣"；展台和背景决定气质——"白色大理石展台 + 奶油色背景"更清新，"黑色石材 + 酒红背景"更节日。

示例图是深青色背景前的一座巧克力塔：最上面一块露出金黄的百香果馅，往下依次是焦糖、咖啡色的甘纳许和深红的覆盆子流心，底部是一堆裹着巧克力的榛子；层间夹着几颗镂空花纹的金色坚果；整座塔立在一个拉丝金的圆台上，周围飘着细小的金色颗粒。

**常见问题**：
- 叠得太整齐像积木：强调"手工感、每块大小和角度略有不同"。
- 流心看起来像塑料：加"半透明、有拉丝和滴落、表面有细小气泡"。
- 塔太高出画：减到 4 层，或把画幅改成 4:5。

**适合**：巧克力、甜品、节日礼盒的电商主图和新品海报。

### 英文原版

```text
"style": "ultra-realistic food photography, luxury editorial, macro-detail, natural textures",
  "images": [
    {
      "id": "image_1",
      "subject": "assorted praline tower",
      "composition": "staggered vertical tower, center frame, loose organic stacking",
      "details": {
        "fillings": [
          "hazelnut chunks irregularly clumped at base",
          "raspberry gel naturally puddled",
          "salted caramel with realistic flow lines",
          "coffee ganache with smooth wave texture",
          "passionfruit filling with visible pulp specks"
        ],
        "accent": "one unique metallic gold nut per filling type placed at layer transitions",
        "stand": "brushed gold stand with subtle reflections"
      },
      "lighting": {
        "type": "dramatic side lighting",
        "angle": "35 degrees left",
        "effects": "authentic filling refractions, layered shadow play"
      },
      "background": "{argument name="background color" default="teal-to-navy"} gradient with suspended gold motes",
      "mood": "luxurious, indulgent, artisanal depth"
    },
    {
      "id": "image_2",
      "subject": "ruby chocolate tablet",
      "composition": "floating hexagonal segments above black textured paper liner",
      "details": {
        "surface": "hand-tempered imperfections, translucent ruby pink",
        "inclusions": "embedded fruit flecks visible through chocolate",
        "motion": "ruby cacao nibs falling in gravity-realistic arc from one segment"
      },
      "lighting": {
        "key": "top-down at 12 o'clock",
        "rim": "soft pink rim light at 3 o'clock",
        "effects": "authentic shadows, enhanced translucency"
      },
      "background": "black-to-warm pink radial gradient with subtle sparkle specks",
      "mood": "modern, vibrant, floating tension"
    },
    {
      "id": "image_3",
      "subject": "white chocolate bonbons",
      "composition": "organic cluster on clear glass stand",
      "details": {
        "marbling": [
          "central bonbon with irregular orange passionfruit veins",
          "surrounding bonbons with pink raspberry swirls",
          "green matcha flecks with varied density"
        ],
        "cutaway": "one bonbon sliced vertically showing gel core with real fruit speckles",
        "props": "dried fruit flecks scattered below (orange zest curls, raspberry seeds)"
      },
      "lighting": {
        "key": "soft high-key front light at 10 degrees",
        "rim": "rear rim light at 35 degrees",
        "effects": "enhanced marbling contrast and glass refractions"
      },
      "background": "soft taupe with fruit-toned bokeh",
      "mood": "elegant, fresh, handcrafted"
    },
    {
      "id": "image_5",
      "subject": "dark chocolate pistachio bar",
      "composition": "vertical bar centered on polished black granite slab",
      "details": {
        "cross_section": "precision side cut revealing layered pista
```

> 改编自 [@Nas_tech_AI](https://x.com/Nas_tech_AI/status/2011592765570785538) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
