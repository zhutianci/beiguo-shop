---
title: AI电商提示词：上传一张产品图生成 9 宫格广告大片
slug: nine-frame-product-campaign
model: gpt-image-2
topics: [ecommerce, poster]
aspectRatio: "3:4"
needsRefImage: true
useCase: 只有一张白底产品图时，一次生成 9 种不同创意场景的广告图，用于详情页、小红书九宫格或投放素材选题。
prompt: |
  以我上传的产品为主角，生成一张 3×3 九宫格（整体 3:4）的高端商业广告图。
  九格各是一个独立创意，但产品在每格里都必须完全一致：
  1. 主视觉静物：大胆、有标志性的陈列；
  2. 极致微距：展示表面质感和材质细节；
  3. 液体或粒子动态环绕产品；
  4. 极简雕塑感陈设，配抽象几何体；
  5. 悬浮元素，传达轻盈和未来感；
  6. 强调触感真实的感官特写；
  7. 从产品自身配色延展出的色彩场景；
  8. 用[成分或零部件]做象征性的抽象表达；
  9. 写实与想象结合的超现实场景，但保持克制高级。
  产品规则：100% 还原产品的形状、比例、标签、字体、颜色和品牌标识，不变形、不重新设计；产品与背景分离干净。
  光线与质感：柔和可控的棚拍光，细腻高光，真实阴影，锐利对焦，高动态范围，杂志级奢华质感。
  氛围：精致、现代、超写实、令人向往；适合品牌官网、社交九宫格和户外大屏。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2069628865044254934
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；第 8 格的"成分 / 零部件"改为变量；其余结构保持不变
imageBrief: 用一款本站可展示的自有或无品牌产品（如素色马克杯、无 Logo 香水瓶）白底图作输入，输出 1 张九宫格；附原图对比。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 九格中产品标签文字是否被改动
  - 换不同品类（饮料、护肤、数码）各测一次
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：上传一张清晰的白底或简单背景产品图，产品正面朝前、标签可读。[成分或零部件] 写你的卖点，例如护肤品写"玫瑰花瓣和水珠"，耳机写"声波和振膜"。

**常见问题**：
- 某几格产品长歪了 / 标签变了：九格越多越容易走样，可以改成 2×2 四宫格，或在出图后追问"第 5 格的产品与原图不一致，重画这一格"。
- 风格太统一、没区别：把九个创意改得更具体，比如第 3 格写"橙汁飞溅环绕"。
- 用别人家的产品图：请只用自己有权使用的产品图片和商标。

**迭代**：挑出最好的一格，追问"把第 2 格单独生成为 1:1 高清大图"。

### 英文原版

```text
Generate a 3×3 image grid (3:4 aspect ratio) for a luxury commercial campaign centered on the uploaded product.

Each of the nine frames should deliver a unique visual concept while keeping the product visually identical throughout.

The nine concepts:
1. Hero still life with a bold, iconic arrangement
2. Extreme macro revealing surface texture and material detail
3. Liquid or particle dynamics wrapping around the product
4. Minimalist sculptural staging with abstract geometry
5. Floating elements that convey lightness and forward-thinking design
6. Close-up sensory shot focused on tactile realism
7. Color-concept scene drawn from the product's own palette
8. Symbolic ingredient or component abstraction
9. Surreal but refined blend of realism and imagination

Product rules: maintain 100% fidelity to the product's shape, proportions, label, type, color, and branding. No distortion or redesign. Clean product-to-background separation.

Lighting and finish: soft controlled studio lighting, subtle highlights, realistic shadows, ultra-sharp focus, high dynamic range, editorial luxury aesthetic.

Mood: polished, modern, hyperreal, aspirational. Built for brand sites, social grids, and digital billboards.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2069628865044254934) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
