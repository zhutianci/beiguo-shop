---
title: nano banana 论文流程图提示词：根据一篇论文 / 文档生成学术风格示意图
slug: paper-to-diagram
model: nano-banana
topics: [infographic, ppt]
modelLabel: Nano Banana Pro
needsRefImage: false
aspectRatio: "16:9"
useCase: 写综述、做组会汇报、给论文配图时，给出论文引用（或直接上传 PDF），让 Nano Banana Pro 读懂内容后画出"Figure 1"风格的流程示意图，带分阶段标注和图注。
prompt: |
  根据论文 [作者, 年份, 论文标题, 期刊] 的内容，画一张学术论文风格的示意图，展示[论文中提出的方法 / 过程]的完整流程。
  要求：
  - 按[4]个阶段从左到右排列，每个阶段有编号小标题（Stage 1、Stage 2……）和简短说明；
  - 用箭头表示流程和因果关系，关键对象用简洁的示意插图表示；
  - 白色背景，配色克制（黑、灰 + 1 种强调色），字体为无衬线体，像期刊插图；
  - 顶部写图标题"Figure 1. ……"，底部写一到两句图注，概括整个过程；
  - 图中术语与论文保持一致，不要编造论文中没有的步骤。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/anderssandberg/status/1992259420118724677
  author: "@anderssandberg"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只是一句"图示为根据某论文构建戴森群的过程"；本站改写为通用模板，补充阶段划分、箭头、学术配色、图标题与图注、"不要编造步骤"等要求
images:
  - 179-paper-to-diagram-1.jpg
imageCredit:
  by: "@anderssandberg"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case4
  license: Apache-2.0
verify:
  - 用一篇冷门论文（模型不太可能背过）上传 PDF 实测，看流程是否忠实于原文
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：知名论文可以只给引用信息；冷门论文、自己的论文**一定要上传 PDF 或粘贴摘要和方法部分**，否则模型会凭印象"编"。示例图是原作者用自己 2013 年关于戴森群的论文生成的流程图，可以看到阶段划分、箭头和图注都比较规范。

**常见问题**：
- 步骤和论文对不上：先追问"用文字列出你理解的论文流程"，确认无误后再出图。
- 小字看不清：减少每个阶段的文字，只保留关键词，细节放图注。
- 期刊投稿：AI 生成的图通常需要按期刊政策声明，正式投稿前请在 Illustrator / PPT 里重绘或至少核对每个文字。

**适合**：组会 PPT、综述配图、科普文章、课程讲义。

### 英文原版

```
The diagram illustrates the process of constructing a Dyson swarm based on the paper Armstrong, S., & Sandberg, A. (2013). Eternity in six hours: Intergalactic spreading of intelligent life and sharpening the Fermi paradox. Acta Astronautica, 89, 1-13.
```

> 改编自 [@anderssandberg](https://x.com/anderssandberg/status/1992259420118724677) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
