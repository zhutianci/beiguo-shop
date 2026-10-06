---
title: AI电商产品图提示词：悬浮棚拍的科技产品主图（gpt-image-2）
slug: product-studio-hero-shot
model: gpt-image-2
topics: [ecommerce, photography]
aspectRatio: "1:1"
needsRefImage: false
useCase: 给耳机、音箱、键盘等数码产品生成干净高级的悬浮棚拍主图，适合电商首图、官网 Banner、众筹页面。
prompt: |
  为[品牌名]生成一张[产品：头戴式耳机]的高端棚拍产品图，设计语言参考[品牌风格：简约工业风]。
  产品悬浮在浅灰到柔白渐变的干净背景中，极简高级的科技感。产品要显得利落、现代、精致，带有[强调色：红色]的细微发光点缀。
  角度：[四分之三前侧角度，能同时看到两侧耳罩]，清楚展示工业设计细节。
  在产品本体上干净地印出[品牌名]。
  光线：柔和、可控的杂志级布光，清晰的高光、柔和的阴影，加一道[强调色]的轮廓光或微光。
  强调材质的真实感和干净的几何形体，背景保持留白。
  不要额外道具、不要人物、不要文字叠加、不要包装盒，产品是唯一主角。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/PrometheanAIX/status/2049141839882522707
  author: "@PrometheanAIX"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文；把原文写死的"耳罩"角度改为可替换的展示角度；产品、品牌、风格、强调色均为变量
images:
  - 110-product-studio-hero-shot-1.jpg
imageCredit:
  by: "@PrometheanAIX"
  url: https://x.com/PrometheanAIX/status/2049141839882522707
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 产品上的品牌文字是否拼写正确
  - 换成键盘、音箱等其他品类是否同样稳定
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[产品] 写清品类和关键结构，例如"带旋钮的复古蓝牙音箱"；[角度] 要配合品类改，耳机写"四分之三前侧"，键盘写"45 度俯视"；[品牌名] 用自己的品牌，不要用别人的商标。

**常见问题**：
- 产品长得和实物不一样：这条是"概念图"用法；要还原自家实物，请先上传产品照片，并在开头加"严格按照上传的产品外观"。
- 文字印错：品牌名用 2–6 个字母的英文最稳；中文名建议后期自己加。
- 发光太强像游戏外设：把"发光点缀"改成"细微的金属反光"。

**迭代**：同一张图追问"背景改成深灰色、其他不变"，就能出一套深浅两版。

### 英文原版

```text
Create a premium product studio image of a [PRODUCT] for [BRAND], designed in line with [BRAND REFERENCE]. Show the [PRODUCT] floating against a clean light gray to soft white gradient background with a minimal high-end tech aesthetic. The [PRODUCT] should feel sleek, modern, refined, and premium, with subtle illuminated accents in [LIGHTING COLOR]. Use a three-quarter front angle so both earcups are visible, with detailed industrial design elements. Include the [BRAND] name cleanly on the product. Lighting should be soft, controlled, and editorial, with crisp highlights, soft shadows, and a subtle colored rim light or glow in [LIGHTING COLOR]. Emphasize material realism and clean geometric forms. Keep the background uncluttered and minimal. No extra props, no people, no text overlays, no packaging, and no distracting elements. Focus entirely on the [PRODUCT] as the hero product.
```

> 改编自 [@PrometheanAIX](https://x.com/PrometheanAIX/status/2049141839882522707) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
