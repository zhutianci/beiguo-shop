---
title: 科研绘图提示词：RAG 检索增强生成六步流程图，离线 / 在线分区（gpt-image-2）
slug: rag-pipeline-figure
model: gpt-image-2
topics: [research-figure, ppt]
needsRefImage: false
aspectRatio: "16:9"
useCase: 讲解 RAG 原理、做知识库产品方案或技术分享 PPT 时，生成一张从左到右六个阶段、带编号和虚线分区的系统流程图，一眼看懂"查询—检索—生成"。
prompt: |
  生成一张横版 16:9 的学术系统流程图，主题是[RAG 检索增强生成]，从左到右分 6 个带编号的阶段：
  (1) "用户提问"框，里面放示例问题"[某药物有哪些副作用？]"，旁边一个小人剪影；
  (2) 六边形"[向量编码器]"，下方小字"稠密向量 d=768"；
  (3) 数据库圆柱"向量库"，标注"[索引：120 万个文本块]"；从 (2) 到 (3) 的箭头标"kNN, k=5"；
  (4) "检索到的段落"：5 张叠放的文档缩略图，说明"top-k 文本块 + 元数据"；
  (5) 六边形中枢"[冻结的大模型]"；一条长弧线箭头从 (1) 直接连到这里，标"原始问题"；(4) 到 (5) 的箭头标"检索上下文"；
  (6) "有依据的回答"，回答里带行内引用标记"cite: doc#47"（外面套方括号），说明"附来源引用"。
  用虚线框把 (2)(3) 圈起来标"离线——只建一次"，把 (4)(5) 圈起来标"在线——每次查询"。
  总标题"[检索增强生成流程]"，副标题写[论文出处]。白底、细线、柔和配色，文字清晰，画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-research-paper-figures.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并按阶段拆分；主题、示例问题、编码器、索引规模、模型、标题、出处设为变量；去掉原文副标题中的作者署名改为变量；补充了常见问题与改法
images:
  - 3244-rag-pipeline-figure-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/research-paper-figures/rag-pipeline.png
  license: MIT
verify:
  - 示例图回答框里有模型编的"药物副作用"示例文字，展示时注明仅为示意、非医学信息
  - 示例图是英文版，中文版建议出一次核对小字
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[RAG 检索增强生成] 可以换成别的多阶段系统，如"多智能体协作流程""推荐系统召回—排序"，阶段描述跟着改；[某药物有哪些副作用？] 换成你业务里的真实问题，如"公司年假怎么算？"；[冻结的大模型] 可写具体部署方式。示例图是英文版：左边小人头像和问题气泡，中间六边形编码器和数据库圆柱被"OFFLINE"虚线框圈住，五张文档卡片叠在一起，右边"Frozen LLM"和橙色回答框，底部有"ONLINE"虚线框。

**常见问题与调整**：
- 编号顺序乱：在每个阶段名前写死"①②③"，并加"严格从左到右单行排列"。
- 箭头标注跑位：减少标注文字，只保留"kNN""检索上下文"两处。
- 做产品方案想更商务：改成"扁平图标风，品牌色[主色]，去掉论文副标题"。
- 中文挤：把画幅放宽到 21:9，或把第 4 阶段的文档数量降到 3 张。

**适合**：技术分享 PPT、知识库产品方案、课程讲义配图；不适合未经核对直接用于正式论文。

### 英文原版

```
Landscape 16:9 academic systems diagram of a RAG pipeline, 6-stage left-to-right flow.

(1) "User query" box with placeholder text "What are the side effects of drug X?" and a small user silhouette.
(2) Hexagonal "Embedding encoder (BERT-style)", caption "dense vector d=768".
(3) Stylised database cylinder "Vector store" with "Index: 1.2M chunks"; arrow from (2) labeled "kNN, k=5".
(4) "Retrieved passages" — stack of 5 doc thumbnails; caption "top-k chunks + metadata".
(5) Hexagonal hub "Frozen LLM"; long curved arrow from (1) labeled "original query" also lands here; arrow from (4) labeled "retrieved context".
(6) "Grounded answer" with inline marker "[cite: doc#47]"; caption "with source citations".

Dashed outline around (2)-(3) labeled "OFFLINE — built once". Dashed outline around (4)-(5) labeled "ONLINE — per query".

Title: "Retrieval-Augmented Generation pipeline". Subtitle: "Lewis et al., 2020".
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
