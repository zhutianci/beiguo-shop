---
title: 电商详情页提示词：蓝调黄昏梳妆台香水静物（烛光 + 窗外夜色 + 大理石反光）
slug: fragrance-vanity-lifestyle
model: gpt-image-2
topics: [ecommerce, photography]
needsRefImage: false
aspectRatio: "2:3"
useCase: 给香水、香氛蜡烛、首饰等偏"夜晚仪式感"的产品做详情页或杂志风竖版海报时用，得到烛光暖色与窗外冷蓝夜色交织的高级静物照。
prompt: |
  生成一张竖版高端美妆生活方式杂志图，主题是精品[香水的夜晚仪式]。
  - 场景：卧室窗边一张温润的大理石梳妆台，时间是蓝调时分；
  - 台面物品：[两只雕塑感香水瓶]、一条丝带、珍珠发簪、一张小手写便签、一杯水晶杯装的气泡水，几朵带露水的[白色花朵]；
  - 风格：静奢、柔美、现代、令人向往，但要自然，不要过度摆拍；
  - 配色：香槟金、暖象牙白、灰玫瑰粉、柔和的淡紫阴影、透明玻璃高光；
  - 光线：烛光与窗外冷色的傍晚天光混合，大理石上有光泽反射，浅景深，高端产品摄影的真实感；
  - 构图：竖版杂志静物，优雅留白；
  - 不要品牌 logo，不要像任何真人，不杂乱，除便签上一行小字"[EVENING RITUAL]"外不出现文字；
  - 竖版画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-beauty-and-lifestyle.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；主题、主体产品、花材、便签文字、画幅设为变量；补充竖版画幅
images:
  - 3334-fragrance-vanity-lifestyle-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/beauty-lifestyle/fragrance-evening-ritual-vanity.png
  license: MIT
verify:
  - 示例图香水瓶造型接近常见经典款，商用前确认不会被误认为某品牌产品
  - 上传自家香水瓶照片再生成一次，看瓶身是否保持一致
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[香水的夜晚仪式] 可以换成"香薰蜡烛的睡前时光""珠宝的晚宴前准备"；[两只雕塑感香水瓶] 换成你的主体产品，如"一只磨砂香薰蜡烛罐""一对珍珠耳环和首饰盒"；[白色花朵] 可以换成"白牡丹""一枝晚香玉"；便签文字建议保持短英文或换成 2～4 个中文字。示例图里是窗边的白色大理石台面：左边一大朵白牡丹和一支点燃的玻璃蜡烛，中间两只淡粉色香水瓶，前面一张写着"EVENING RITUAL"的便签和一条玫瑰粉丝带，右边一只水晶杯，窗外是蓝紫色黄昏和亮着灯的城市楼房。

**常见问题与调整**：
- 想放自家产品：先上传产品照片，加"香水瓶严格使用上传图中的瓶型和颜色"。
- 画面太暗：加"烛光更亮，台面整体曝光提高一档"。
- 窗外抢戏：改成"窗外虚化成一片蓝紫色光斑"。
- 便签文字变形：直接要求"便签空白，没有文字"，后期再加字。

**适合**：香水 / 香氛 / 首饰的详情页氛围图、节日礼盒主视觉、杂志风社媒图；用于商品宣传时，实物要与图片一致。

### 英文原版

```
Create a portrait-oriented premium beauty and lifestyle editorial image for a boutique fragrance evening ritual. Scene: a warm marble vanity beside a softly lit bedroom window at blue hour, with two sculptural perfume bottles, a silk ribbon, pearl hair pins, a small handwritten note, a crystal glass of sparkling water, and a few dewy white flowers. Styling should feel quiet-luxury, feminine, modern, and aspirational, but natural rather than overproduced. Use a palette of champagne gold, warm ivory, dusty rose, soft lavender shadows, and clear glass highlights. Lighting: candle glow mixed with cool evening window light, glossy reflections on marble, shallow depth of field, premium product-photography realism. Composition: vertical magazine still life, elegant negative space, no brand logos, no real-person likeness, no clutter, no text except a tiny tasteful note reading "EVENING RITUAL".
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
