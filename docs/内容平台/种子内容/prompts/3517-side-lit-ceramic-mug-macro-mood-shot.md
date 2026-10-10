---
title: "ai产品图提示词：手作陶瓷杯侧光微距静物，换台面和氛围就是一组系列图（Nano Banana）"
slug: side-lit-ceramic-mug-macro-mood-shot
model: nano-banana
topics: [ecommerce, photography]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "给手作陶器、杯具、香薰这类小件器物拍\"有情绪的静物照\"：一个低角度的微距镜头、一束侧光，换不同的台面和氛围就能得到同一产品的一组系列图，适合店铺主图和品牌画册。"
prompt: |
  生成一张照片级写实的器物微距静物照，杂志画册的质感，画幅 1:1。
  - 产品：[手作陶瓷马克杯]，米色釉面带细小的铁斑和不均匀的流釉，杯口一圈深色边，位于画面中央略偏下，杯把朝右。
  - 台面：放在[深色亚麻布]上，台面的纹理清晰可见。
  - 氛围：[杯口升起一缕热气]。
  - 光线：一束来自侧面的硬朗侧光，照亮杯子的一侧，另一侧自然落入阴影，杯把边缘有一条细细的轮廓高光，台面上投下长长的影子；背景压暗，没有其他物体。
  - 镜头：略低于杯口的平视机位，微距镜头，浅景深，焦点落在杯身的釉面纹理上。
  - 画面里不要任何文字、标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/SRKDAN/status/2042422343721427236
  author: "@SRKDAN"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文只有一行关键词，按示例图补充了机位、景深、釉面质感和背景处理；产品、氛围、台面三个变量保留；示例图是原作者用不同氛围与台面生成的四张图拼在一起"
images:
  - 3517-side-lit-ceramic-mug-macro-mood-shot-1.jpg
imageCredit:
  by: "@SRKDAN"
  url: https://youmind.com/nano-banana-pro-prompts?id=13360
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：三个变量各换一次就是一张新图。产品可换成"粗陶花瓶""玻璃香薰蜡烛""木柄手冲壶"；台面可换"做旧的木桌""深蓝色的粗糙石板""黑色板岩""浅色褶皱亚麻布"；氛围可换"暖橙色的背景光晕""顶上一束冷白色的聚光""清晨柔和的窗光"。做系列图时保持产品描述一字不改，只换后两项，杯子的样子才会一致。

示例图是四张拼在一起的方图，同一只带斑点的米色陶杯：左上放在木桌上、背后是暖橙色的雾气；右上放在蓝色的粗糙石面上，杯子的颜色偏深；左下在黑色板岩上，顶上打着一束冷光；右下放在浅色的褶皱亚麻布上，光线最柔和。

**常见问题**：
- 每张图杯子长得不一样：把釉色、斑点、杯把形状写具体，或者上传一张产品照让模型照着画。
- 光线太平：强调"单侧硬光、明暗对比强、背景比主体暗两档"。
- 热气画成一团浓烟：写"极淡的一缕水汽，几乎看不见"。

**适合**：手作器物、家居小物、咖啡茶具的电商主图和品牌画册；需要严格还原实物时，以实拍为准。

### 英文原版

```text
{argument name="product" default="Ceramic mug"}, side lit, {argument name="atmosphere" default="steam rising"}, {argument name="surface" default="dark linen surface"}, editorial macro, no text, photorealistic
```

> 改编自 [@SRKDAN](https://x.com/SRKDAN/status/2042422343721427236) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
