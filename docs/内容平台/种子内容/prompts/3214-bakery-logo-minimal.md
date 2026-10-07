---
title: logo设计提示词：社区面包店扁平徽标，麦穗 + 面包 + 田野小屋的温暖极简风
slug: bakery-logo-minimal
model: gpt-image-2
topics: [logo]
needsRefImage: false
aspectRatio: "1:1"
useCase: 给面包店、咖啡馆、烘焙工作室等小店起草 logo 方向时，输入店名和业态，生成一张白底居中、扁平矢量感、放大缩小都清楚的原创徽标草图。
prompt: |
  为一家名叫"[Field & Flour]"的[社区面包店]设计一个原创、不侵权的 logo。
  - 气质：温暖、简洁、经典耐看；
  - 造型：干净的矢量感图形，轮廓有力，正负空间平衡；
  - 简洁优先于细节，保证缩小到很小和放大都清晰可辨；
  - 扁平设计，线条极少，除非必要不用渐变；
  - 主要元素可以围绕[麦穗和面包]展开；
  - 纯色背景，只交付一个居中的 logo，四周留足空白，不加水印。
  画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-official-openai-cookbook-examples.md
  author: "OpenAI"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；店名、业态、主图形元素、画幅设为变量；补充了"围绕主元素展开"的提示和常见问题
images:
  - 3214-bakery-logo-minimal-1.jpg
imageCredit:
  by: "OpenAI"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/official-openai-cookbook/logo-bakery.png
  license: MIT
verify:
  - 原始出处：原帖：https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb，核对原帖仍可访问、作者未另行声明保留权利
  - 用中文店名出一次，看字体是否端正、无错字
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[Field & Flour] 换成你的店名，中文如"[麦田小厨]""[老街烘焙]"都行，越短越好写对；[社区面包店] 换成"精品咖啡馆""手工甜品工作室""社区菜市场"；[麦穗和面包] 换成和业态相关的图形，如"咖啡豆和杯子""蛋糕和樱桃"。示例图是 OpenAI 示例中的出图：一个圆环里有金色麦穗、绿色田野和小屋，底部压着一只烤得金黄的面包，下方是深棕色衬线字"Field & Flour"和小字"LOCAL BAKERY"，两侧点缀小叶子。

**常见问题与调整**：
- 细节太多缩小看不清：加"只保留两个图形元素，最小 32 像素也能认出"。
- 想要几个方向对比：追问"同一店名再给三个不同方向：纯文字、图形 + 文字、圆形徽章"。
- 颜色太多：限定"只用两种颜色：[深棕]和[麦黄]"。
- 需要横版招牌：改成"图形在左、店名在右的横向组合"，画幅 3:1。

**适合**：小店品牌早期草图、命名讨论时的视觉参考；正式使用前建议请设计师矢量化重绘，并自行查询商标是否冲突。

### 英文原版

```
Create an original, non-infringing logo for a company called Field & Flour, a local bakery.
The logo should feel warm, simple, and timeless. Use clean, vector-like shapes, a strong silhouette, and balanced negative space.
Favor simplicity over detail so it reads clearly at small and large sizes. Flat design, minimal strokes, no gradients unless essential.
Plain background. Deliver a single centered logo with generous padding. No watermark.
```

> 改编自 [OpenAI Cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
