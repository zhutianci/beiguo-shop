---
title: nano banana 产品设定图提示词：一张产品照生成多视角 + 特写 + 包装的"产品参考板"
slug: product-reference-sheet
model: nano-banana
topics: [ecommerce, infographic]
modelLabel: Nano Banana Pro
needsRefImage: true
useCase: 用 AI 给同一个产品做图 / 视频前，先生成一张"产品设定板"（概览、各角度、细节特写、包装结构）当作后续出图的统一参考，避免每张图产品长得不一样；也可以直接用作详情页或提案页。
prompt: |
  分析上传的产品，生成一张高分辨率、照片级真实的专业广告参考板（reference sheet），包含以下四个区块：
  1. 产品概览：名称、品类、材质、尺寸、主要卖点、品牌色（文字信息以我提供的为准：[品名 / 规格 / 卖点]）；
  2. 主视角：正面、背面、侧面、四分之三角度，以及有必要时的使用状态视角；
  3. 细节特写：Logo / 标签、纹理 / 材质、关键部件、包装细节等识别特征；
  4. 包装 / 结构：相关的包装或结构视图。
  背景为干净的白色 / 中性棚拍背景，高端商业产品摄影，柔和可控的光线，真实材质，锐利细节，细腻投影，专业的编辑网格排版。
  整张图要作为后续 AI 出图、出视频的"视觉连续性圣经"：每个视角都必须是同一个实物，绝对一致；不要重新设计、不要增加款式变体、不要改动品牌或比例。
  字体干净，区块标题清晰，细分隔线，间距均衡，具有精致的制作设计美感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/OlatundeAI/status/2101379401703116870
  author: "@OlatundeAI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；新增"产品文字信息以用户提供为准"的变量，避免模型编造规格；其余结构保持原样
images:
  - 194-product-reference-sheet-1.jpg
imageCredit:
  by: "@OlatundeAI"
  url: https://x.com/OlatundeAI/status/2101379401703116870
  license: CC BY 4.0
verify:
  - 用一款中文包装的零食实测，检查各视角包装文字是否一致
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张或多张产品实拍图（多角度更好），在 [品名 / 规格 / 卖点] 处写上真实信息，例如"[山茶花面霜 / 50ml / 保湿修护]"。示例图是一款冰淇淋盒装产品生成的参考板，四个区块清晰可见。

**为什么值得先做这一步**：AI 连续出多张产品图时，最大的问题是"每张长得不一样"。先生成这张参考板，后面每次出图都把它一起上传，并写"产品严格以参考板为准"，一致性会好很多。

**常见问题**：
- 背面 / 底部是猜的：没拍到的面模型只能推测，正式使用前请核对或补拍上传。
- 规格数字乱写：文字信息务必自己提供；不需要的项可以删掉。
- 太挤：把四个区块拆成两张图分别生成。

**适合**：电商详情页、AI 视频前期设定、品牌提案、给设计外包的需求说明。

### 英文原版

```
Analyze the product and create a high-resolution, photorealistic, professional advertising reference sheet containing these four sections, on a clean white/neutral studio background, premium commercial product photography, soft controlled lighting, realistic materials, sharp details, subtle shadows, and a professional editorial grid.
1. PRODUCT OVERVIEW; name, category, materials, dimensions/size, key features, and brand colors.
2. PRODUCT USAGE/HERO VIEWS - front, back, side, 3/4, and functional/use view where relevant.
3. PRODUCT CLOSE-UPS - logo/label, texture/material, key components, packaging details, and other important identifying features.
4. PACKAGING / CONSTRUCTION - relevant packaging or structural views where applicable. 
The entire sheet must function as a visual continuity bible for AI image/video production. Every product view must depict the exact same physical product with absolute consistency. Do not redesign, add variants, alter branding, or change proportions. Use cean typography, clear section labels, thin dividers, balanced spacing, sophisticated production-design aesthetic.
```

> 改编自 [@OlatundeAI](https://x.com/OlatundeAI/status/2101379401703116870) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
