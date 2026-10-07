---
title: 科研绘图提示词：Transformer 编码器-解码器结构图，论文排版风（gpt-image-2）
slug: transformer-architecture-figure
model: gpt-image-2
topics: [research-figure, ppt]
needsRefImage: false
aspectRatio: "16:9"
useCase: 写论文综述、做组会 PPT 或技术分享时，生成一张左右双栏、模块标签清楚的模型结构示意图，可以当作底稿再用绘图软件精修。
prompt: |
  生成一张横版 16:9 的学术概念图，主题是[Transformer 编码器-解码器结构]，风格接近[顶会论文终稿]插图：白底、细线、柔和配色。
  画面左右两栏，中间用虚线分隔。
  - 左栏标题"[ENCODER (×N)]"，自下而上依次是："输入词元"→"输入嵌入"→"+ 位置编码"→一个虚线框"编码器层"，框内有"多头自注意力""Add & Norm""前馈网络""Add & Norm"，每个子层旁有细的弧形残差箭头；
  - 右栏标题"[DECODER (×N)]"，自下而上："输出词元（右移一位）"→"输出嵌入"→"+ 位置编码"→虚线框"解码器层"，框内有"带掩码的多头自注意力""Add & Norm""多头交叉注意力"（从编码器顶部引一条水平箭头过来，标注"keys, values"）、"Add & Norm""前馈网络""Add & Norm"；解码器上方是"Linear""Softmax""输出概率"。
  - 总标题："[Transformer：多头注意力的编码器-解码器]"，副标题写[论文出处]。
  模块用圆角矩形，不同类型模块用不同浅色填充，文字清晰可读，画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-research-paper-figures.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；模型名、栏标题、总标题、出处、画幅设为变量；去掉原文副标题中的作者署名改为变量；补充了常见问题与改法
images:
  - 3243-transformer-architecture-figure-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/research-paper-figures/transformer-arch.png
  license: MIT
verify:
  - 示例图是英文标签版，正文已提醒；中文标签版建议出一次看小字是否准确
  - 页面需提示"生成的结构图要逐个核对模块和箭头，投稿前用矢量软件重绘"
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[Transformer 编码器-解码器结构] 可换成你要讲的结构，同时把下面的模块列表一起改，例如"ResNet 残差块""U-Net 编码解码""Vision Transformer 图像分块"；[顶会论文终稿] 可写"期刊黑白印刷""技术博客扁平风"；[论文出处] 写原论文简称和年份即可。示例图是英文标签版：左边蓝色"ENCODER (×N)"、右边绿色"DECODER (×N)"，每个子层是浅色圆角块，残差箭头和"keys, values"交叉箭头都画出来了，标题和副标题在最上方。

**常见问题与调整**：
- 箭头连错或多出模块：把模块列表写成编号清单，并加"只画列出的模块，不要额外添加"。
- 中文标签挤在一起：改短标签，如"自注意力""前馈"，或保留英文标签。
- 想要黑白印刷版：加"灰度配色，只用线型和灰度区分模块"。
- 想要竖版放进 PPT 一侧：画幅改成 3:4，两栏改为上下排列。

**适合**：组会 / 课程 PPT、技术博客配图、论文草图底稿；不适合未经核对直接作为正式投稿插图。

### 英文原版

```
Landscape 16:9 academic concept figure of the Transformer encoder-decoder architecture, NeurIPS camera-ready style. Two vertical column stacks side-by-side with a dashed divider.

LEFT column header: "ENCODER (×N)". Blocks bottom-to-top: "Input tokens" → "Input Embedding" → "+ Positional Encoding" → dashed "Encoder layer" containing "Multi-Head Self-Attention", "Add & Norm", "Feed-Forward", "Add & Norm", with thin curved residual arrows around each sublayer.

RIGHT column header: "DECODER (×N)". Blocks bottom-to-top: "Output tokens (shifted right)" → "Output Embedding" → "+ Positional Encoding" → dashed "Decoder layer" containing "Masked Multi-Head Self-Attention", "Add & Norm", "Multi-Head Cross-Attention" (horizontal arrow from encoder top labeled "keys, values"), "Add & Norm", "Feed-Forward", "Add & Norm". Above decoder: "Linear", "Softmax", "Output probabilities".

Title: "Transformer: encoder–decoder with multi-head attention". Subtitle: "Vaswani et al., 2017".
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
