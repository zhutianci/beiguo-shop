---
title: AI海报提示词：极简高端饮品主视觉海报（瓶身 + 冰杯 + 冷凝水珠，可换任意产品）
slug: beverage-product-poster
model: gpt-image-2
topics: [ecommerce, poster]
needsRefImage: false
aspectRatio: "2:3"
useCase: 给饮料、茶饮、咖啡等新品做电商主图或地铁灯箱风格的竖版海报时用，得到干净留白、棚拍质感、带品牌字的高级感产品海报。
prompt: |
  为一款名叫"[产品名]"的[冷萃乌龙茶]设计高端商业海报。
  - 风格极简，画面干净，[瓶子和一杯冰茶]居中作为主角；
  - 柔和的棚拍光，材质真实，瓶身有精致的冷凝水珠；
  - 大面积留白，高级品牌视觉语言，电影感的光影；
  - 包装和海报上的字体精致考究：顶部大字是产品名，下方一行小字写"[一句卖点]"；
  - 细节极致，整体像奢侈饮品广告，可以投放在地铁灯箱或时尚杂志上；
  - 竖版画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-product-and-food.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；原文虚构的产品名换成变量，产品品类、主体组合、卖点文案、画幅设为变量；补充文字层级说明
images:
  - 3325-beverage-product-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/product-food/aurora-oolong-poster.png
  license: MIT
verify:
  - 原始出处：原帖：https://www.xiaohongshu.com/explore/69e7878300000000230050bb，核对原帖仍可访问、作者未另行声明保留权利
  - 用中文产品名出一次，检查瓶身和标题中文是否清晰无错字
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[产品名] 填你的品牌或产品名，建议 2～6 个字；[冷萃乌龙茶] 换成品类，比如"燕麦拿铁""气泡苏打水""精酿啤酒"；[瓶子和一杯冰茶] 按产品形态改成"易拉罐和气泡杯""咖啡袋和手冲杯"。示例图是一张暖灰背景的竖版海报：顶部是大号衬线英文产品名，右侧一只黑标深棕色玻璃瓶，瓶身挂满水珠，左边一杯加冰的琥珀色茶，底部几行小字卖点。示例图是英文版，换成中文名时字体风格可能变化。

**常见问题与调整**：
- 文字太多太挤：只保留"产品名 + 一句卖点"，其余说明删掉。
- 包装和你的实物不一样：先上传实物照片，加"瓶身外观严格按上传图"。
- 背景太单调：加"背景有一束斜射的窗光和淡淡的茶叶剪影"。
- 想做横版 banner：画幅改 16:9，主体放右侧，左侧留给文字。

**适合**：饮品新品主图、灯箱 / 电梯海报、小红书种草封面；用于商品宣传时，实物要与图片一致。

### 英文原版

```
Design a high-end commercial poster for a product called "Aurora Oolong Cold Brew". Minimalist style, clean frame, centered hero bottle and tea glass, soft studio lighting, realistic material textures, elegant condensation details, generous negative space, premium brand visual language, cinematic light and shadow, refined packaging typography, and ultra-detailed finish. Make it feel like a luxury beverage campaign that could run in a subway lightbox or fashion magazine.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
