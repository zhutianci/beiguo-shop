---
title: PPT配图提示词：3D 哑光质感的信息图幻灯片（gpt-image-2）
slug: 3d-matte-slide
model: gpt-image-2
topics: [ppt, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: 让 AI 先比较几种可视化方案、再用 3D 哑光物件表达概念，生成一页高级感的 PPT 配图 / 信息图，适合汇报、课件和公众号头图。
prompt: |
  你是一名信息编辑、图表设计师兼 3D 美术指导。
  任务：为一页主题为"[中国古代书写载体的演变]"的幻灯片生成 16:9 配图。
  - 先根据内容构思 3 种可视化方案并比较，采用最直观的一种；
  - 用与主题相关的实物或材质来讲解：例如古典文学用书本、竹简、纸张；制造业用零件或组装过程；
  - 采用优雅的哑光材质、柔和光线和自然的纵深，用 3D 表现来传达顺序、关系和变化。
  画面要点：[甲骨 → 竹简 → 帛书 → 纸本]，按时间从左到右排列，每个物件下方一个简洁的[中文]标签。
  留出顶部约 20% 的空白给幻灯片标题，不要在图中写长段文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/akira_papa_IT/status/2097832162586407176
  author: あきらパパ【生成AI活用エンジニア&３児のパパ】
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 日文原帖的英文版译为中文；补充了原文缺少的主题、画面要点、标签语言和"为标题留白"等可替换项
images:
  - 149-3d-matte-slide-1.png
imageCredit:
  by: あきらパパ【生成AI活用エンジニア&３児のパパ】
  url: https://youmind.com/gpt-image-2-prompts?id=34148
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 时间顺序和物件是否正确
  - 标签中文是否正确、是否给标题留出空白
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[主题] 写这一页 PPT 要讲的一件事；[画面要点] 写 3–5 个按顺序或按关系排列的对象，用箭头"→"表示顺序、用"vs"表示对比。示例图对应的是"日本古典文学"主题，用书本和竹简表现。

**常见问题**：
- 图中塞满文字：保留"不要写长段文字"，标题和要点之后在 PPT 里自己加，排版更可控。
- 物件不准确（朝代、器物画错）：AI 会想当然，历史、科学类内容请自己核对。
- 整套 PPT 风格不统一：每页都用同一句"优雅的哑光材质、柔和光线"，并固定背景色，例如"浅米色背景"。

**迭代**：先让模型"只描述 3 种方案、不出图"，你挑一个再让它生成，效果更可控。

### 英文原版

```text
You are an information editor, diagram designer, and 3D art director.
- Compare 3 visual proposals matching the content, and adopt the most intuitive option.
- Explain using objects or materials specific to the subject. Use books, bamboo slips, or paper for classical literature; parts or assembly for manufacturing.
- Elegant matte materials, soft lighting, and natural depth. Use 3D representations to convey sequence, relationships, and changes.
```

> 改编自 [あきらパパ【生成AI活用エンジニア&３児のパパ】](https://x.com/akira_papa_IT/status/2097832162586407176) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
