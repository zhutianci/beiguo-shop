---
title: AI做PPT提示词：gpt-image-2 生成风格统一的 PPT 配图
slug: ppt-illustration
model: gpt-image-2
topics: [ppt]
aspectRatio: "16:9"
needsRefImage: false
useCase: 给每一页 PPT 生成一张留白充足、风格统一的扁平插画配图，标题和正文自己在 PPT 里加。
prompt: |
  为一份主题是"[PPT主题]"的演示文稿生成一张 16:9 横版配图，用于第[3]页，这一页讲的是"[本页要点]"。
  风格：扁平矢量插画，线条简洁，[蓝色和橙色]为主色，大面积留白，背景为纯色[浅米色]。
  构图：插画集中在画面[右侧]约 60% 的区域，另一侧留出干净的空白，方便我在 PPT 里加标题和文字。
  内容：用一个直观的场景或比喻表现"[本页要点]"，最多 3 个主要元素。
  画面里不要出现任何文字、数字、Logo 或水印。
  这份 PPT 后面的配图都沿用完全相同的画风、配色和线条粗细。
negativePrompt: null
source: null
imageBrief: 以"新员工入职培训"为 [PPT主题]，生成 3 张连续页配图：第 2 页"公司介绍"、第 3 页"报销流程"、第 4 页"安全规范"，用来展示风格一致性；再把 3 张放进一页 PPT 截图展示实际效果。
images:
  - 14-ppt-illustration-1.jpg
imageCredit:
  by: wuyoscar
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/722460e/README.md
  license: MIT（wuyoscar/GPT-Image2-Skill）
verify:
  - 在 gpt-image-2 上实测：同一对话连续生成 3 张，记录风格是否一致
  - 写了"不要出现文字"后，画面里是否仍会冒出乱码文字
  - gpt-image-2 是否支持 16:9 输出（以 OpenAI 官方帮助文档为准）
---
**怎么填变量**：[本页要点] 用一句话说清这一页讲什么，例如"报销需要先审批再付款"；[右侧] 可改"左侧""下方"，取决于你的 PPT 版式；主色最好和公司或学校的模板一致。

**为什么不让 AI 写字**：图里的中文小字仍可能出错，标题和要点在 PPT 里自己打更稳，也方便后期修改。

**常见失败与调整**：
- 几张图风格不一：在同一个对话里连续生成；第一张满意后说"下一张按上一张的风格"。
- 画面太满：把"最多 3 个主要元素"改为"只画 1 个主体"。
- 抽象概念画不出来：先让 ChatGPT 帮你把要点想成一个具体比喻，再填进来。

**适合 / 不适合**：适合培训、汇报、课件；数据图表请用 PPT 自带的图表功能，不要让 AI 画。

> 示例图来自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill/blob/722460e/README.md)（MIT），是作者用 gpt-image-2 生成的扁平插画风格示例（方图），用来参考画风；按本提示词生成时会是 16:9、单侧留白的版式。
