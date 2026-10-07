---
title: 信息图提示词：三段式桑基图，数据来源→处理→去向的彩色流带示意（gpt-image-2）
slug: sankey-data-pipeline-figure
model: gpt-image-2
topics: [research-figure, infographic]
needsRefImage: false
aspectRatio: "16:9"
useCase: 讲"数据从哪来、经过哪些处理、最后流向哪里"时，生成一张左中右三段、流带粗细表示数量的桑基图示意，适合技术分享、年报或方案 PPT。
prompt: |
  生成一张横版 16:9 的桑基图：[大模型预训练数据配比与下游划分]，分三段，用半透明彩色流带连接。
  - 左段（8 个来源块，高度与数量成正比）：[网页抓取 5400 亿]（暗海军蓝，最大）、[论文 1800 亿]（灰青）、代码 1600 亿（石板灰）、百科 400 亿（陶土红）、问答社区 300 亿（暖铜色）、公版图书 250 亿（浅橄榄）、专利 180 亿（浅蓝）、精选新闻与论坛 150 亿（灰青）；
  - 中段（3 个处理块，上下排列）："[去重]""[质量过滤]""[隐私信息清洗]"，每块下方一行小字写方法；
  - 右段（3 个最终去向）："[预训练集 1.4 万亿]"（最大）、"[指令微调池 120 亿]"、"[偏好数据池 30 亿]"；
  - 流带沿用来源块的颜色，中间位置标注流量数字；底部一条图例。
  总标题"[预训练数据配比与下游划分]"，副标题"去重与质量过滤后的数量；流带粗细与流量成正比"。米白底，扁平柔和配色，文字清晰，画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-research-paper-figures.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并按三段拆分；去掉原文中的网站与平台名称，来源、处理步骤、去向、标题设为变量；补充了常见问题与改法
images:
  - 3246-sankey-data-pipeline-figure-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/research-paper-figures/data-sankey.png
  license: MIT
verify:
  - 页面需提示"流带粗细不一定严格按数字比例，正式数据图请用图表工具绘制"
  - 示例图是英文版且出现了具体网站 / 平台名称，展示说明里不要把这些名称当作推荐
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：三段内容可以完全换掉，比如做"公司预算流向"：左段写"[营收来源]"，中段写"研发 / 市场 / 运营"，右段写"利润 / 再投资"；做"用户转化"：左段写各渠道访客，中段写"注册 / 激活"，右段写"付费 / 流失"。数字写成"5400 亿"这类短格式更容易被正确画出来。示例图是英文版：左边八个彩色色块，中间三个白色处理框，右边一大块浅青"Pretraining set"和两块橙色小块，流带在中间交织，底部有图例。

**常见问题与调整**：
- 流带粗细和数字对不上：把来源控制在 5 个以内，并加"流带粗细严格与数字成比例"。
- 中文标签被流带遮住：加"所有标签放在色块内部，流带上只标数字"。
- 颜色太乱：限定"只用 3 种主色的深浅变化"。
- 需要精确数据：用这张定配色和版式，再用图表工具按真实数据画。

**适合**：技术分享、年度报告、业务流程讲解 PPT 的示意图；不适合当作精确统计结果发布。

### 英文原版

```
Landscape 16:9 sankey diagram of a pretraining data mixture, three stages with translucent colored ribbons.

LEFT (8 source blocks, heights proportional to tokens): "Common Crawl (web) 540B" (muted navy, largest), "arXiv papers 180B" (dusty teal), "GitHub code 160B" (slate gray), "Wikipedia 40B" (soft terracotta), "StackExchange QA 30B" (warm copper), "Books (public domain) 25B" (pale olive), "Patents 18B" (pale navy), "Curated news & forums 15B" (dusty teal).

MIDDLE (3 processing blocks, stacked): "Deduplicated (MinHash + exact)", "Quality-filtered (classifier + heuristics)", "PII-scrubbed (regex + NER)".

RIGHT (3 final splits): "Pretraining set 1.4T tokens" (largest), "Instruction-tune pool 12B tokens", "RLHF preference pool 3B tokens".

Flow ribbons inherit source color with mid-labels showing token counts ("85B", "320B", "44B"). Legend strip at bottom.

Title: "LLM pretraining data mixture and downstream splits". Subtitle: "token counts after deduplication and quality filtering; ribbon thickness ∝ token flow."
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
