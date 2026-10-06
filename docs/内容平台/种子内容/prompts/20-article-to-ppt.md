---
title: nano banana pro 做PPT提示词：把一篇文章变成整套暖色学术风 PPT
slug: article-to-ppt
model: nano-banana
topics: [ppt]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: 粘贴一篇文章，先出大纲再逐页生成风格统一的 PPT 页面图，适合快速做讲解草稿、读书分享。
prompt: |
  请根据下面这篇文章，做一套[中学生]都能看懂的中文 PPT。
  第一步：先写出 PPT 大纲，规划每一页的内容。
  第二步：按大纲逐页生成 PPT 页面图片，一页一张图，不要把整套 PPT 拼成一张大图，所有页面风格保持一致。
  风格要求（暖色学术人文风）：
  - 背景：暖米色 / 奶油色（#F3F0E9），带高级纸张质感；
  - 字体：标题用优雅的衬线体，正文用现代无衬线体；
  - 配色：主色为赤陶红（#D67052）和芥末黄（#F0B857），深海军蓝点缀，不用霓虹色和纯黑；
  - 视觉元素：网格版式；插图为抽象、有机的黑色手绘线条，放在赤陶红色块上；关键信息用卡片布局；
  - 图表：扁平极简的柱状图，突出数据对比，去掉多余边框。
  文章内容：
  [在这里粘贴文章]
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1993159387796718006
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 去掉原文中以某 AI 公司品牌命名的风格描述，改称"暖色学术人文风"；受众改为变量；整理为"两步 + 分条"格式；色值保持原文
imageBrief: 用一篇站长自己写的、约 800 字的短文（例如本站一篇教程的摘要）作输入，生成至少 4 页：封面、目录、内容页、带柱状图的数据页；把 4 页拼成一张预览图展示。
verify:
  - 在 Gemini 应用中选 Nano Banana Pro 实测：能否一次对话里按大纲连续生成多张页面图，最多几页后会中断
  - 页面中文标题与正文的错字率，柱状图数据是否与文章一致
  - Gemini 免费版与付费版能否使用 Nano Banana Pro、额度差别（以 Google 官方说明为准）
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[中学生] 换成你的听众，例如"非技术同事""家长"；[在这里粘贴文章] 替换为全文，太长的文章建议先让模型总结成 1500 字以内再做。

**常见失败与调整**：
- 页数多了中途停下：分批生成，每次 3–5 页，并说"沿用前面页面的风格"。
- 页面里的字有错：生成的是图片，不能直接改字。重要场合建议只用它出版式和插图，文字在 PPT 软件里重新打。
- 数据图表不准：模型可能画错数值，涉及数据的页面必须人工核对。

**适合 / 不适合**：适合快速出草稿、读书分享、课堂讲解；不适合需要反复修改的正式汇报。色值可以按你的学校或公司配色替换。

> 改编自 [@op7418](https://x.com/op7418/status/1993159387796718006) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
