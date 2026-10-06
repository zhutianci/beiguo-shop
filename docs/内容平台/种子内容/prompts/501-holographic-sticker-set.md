---
title: AI贴纸设计提示词：镭射全息模切贴纸套装（gpt-image-2）
slug: holographic-sticker-set
model: gpt-image-2
topics: [sticker, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: 给社团、品牌活动、小店周边设计一整套主题统一的模切贴纸，带镭射全息反光和白色描边，出图可直接当贴纸设计稿或商品展示图。
prompt: |
  设计一套[5]枚高品质的模切贴纸，主题是[太空探险俱乐部]，平铺摆放在[深色碳纤维纹理]背景上，俯拍展示。
  中间是一枚圆形主徽章：[宇航员头盔]图案，下方用粗体未来感字体写"[EXPLORE]"。
  周围的贴纸分别是：[复古火箭]、[带光环的行星]、[闪电]、[星云]。
  画风：新传统贴纸风（Neo-Traditional），粗白色描边、饱和鲜艳的颜色；部分区域加镭射全息覆膜，随光线泛出彩虹色光泽。
  配色以[电光紫、青色、霓虹黄]为主，全套保持统一。
  光线：明亮的高光让贴纸呈现立体、略带光泽的塑料质感；每枚贴纸有轻微投影，边角像要从桌面上翘起来一样。
  贴纸之间留出间距，互不遮挡；除主徽章上的文字外，不要出现其他文字、Logo 或水印。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-more-illustration-styles
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；贴纸数量、主题、主徽章图案与文字、其余贴纸图案、背景和配色改为变量；补充"贴纸互不遮挡、不要额外文字"的约束
images:
  - 501-holographic-sticker-set-1.jpg
imageCredit:
  by: "wuyoscar/GPT-Image2-Skill"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/more-illustration-styles/holographic-sticker-badge.png
  license: MIT
verify:
  - 主徽章上的英文是否拼写正确；换成中文字时错字多不多
  - 换成"咖啡店""猫咪""校园社团"等主题时，全息反光和白描边是否保持
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[太空探险俱乐部] 换成你的主题，例如"露营社""奶茶店周年庆""考研加油"；主徽章放最能代表主题的图案和一个短词，其余 4 枚写成具体物件（"马克杯""帐篷""小猫爪"），越具体越不容易画成一团。配色固定 2–3 个主色，整套才统一。

**常见问题**：
- 全息效果太弱：把"部分区域"改成"徽章文字和外圈"，并加"强烈的彩虹镭射反光"。
- 贴纸挤在一起：把数量改成 4 枚，或明确"2 行排列、四周留白"。
- 想要可直接打印的平面稿：把背景改成"纯白背景、无透视、无投影"，再追问"给每枚贴纸单独出一张透明底版本"。

**适合**：社团周边、品牌活动赠品、小红书 / 闲鱼贴纸商品图、手账素材。示例图为原仓库按默认主题生成的效果，仅供参考。

### 英文原版

```text
A collection of five high-quality die-cut sticker designs arranged on a dark carbon-fiber background. The central sticker is a circular badge featuring a stylized astronaut helmet with the text 'EXPLORE' in a bold, futuristic font. The other stickers include a retro-style rocket, a planet with rings, and a lightning bolt. The art style is 'Neo-Traditional Sticker,' with thick white borders and vibrant, saturated colors. A 'holographic' texture overlay is applied to certain areas, creating a rainbow-sheen effect that shifts with the light. The lighting features bright specular highlights to give the stickers a 3D, plastic, and slightly glossy feel. The colors are 'Electric Purple', 'Cyan', and 'Neon Yellow'. Each sticker has a subtle drop shadow to make it appear as if it's peeling slightly off the surface.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「More Illustration Styles」中的示例提示词（Sticker Design: Cyber-Explorer Club），Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)；示例图同样来自该仓库。
