---
title: 仿生设计家具提示词：从灵感到成品的设计概念展板（鸟巢椅示例）
slug: biomimetic-furniture-concept-board
model: gpt-image-2
topics: [interior, infographic]
aspectRatio: "4:3"
needsRefImage: false
useCase: 做家具 / 产品设计作业、作品集或提案时，一张图展示"自然灵感 → 结构图解 → 形态抽象 → 最终成品"的完整推导过程，上半部分是过程草图，下半部分是成品场景渲染。
prompt: |
  一张设计概念展板：以[鸟巢的编织方式]为灵感，设计一把[雕塑感休闲椅]。
  上半部分是四个阶段的推导过程，从左到右依次为：
  1. 灵感来源：[鸟巢]的参考照片；
  2. 结构原理：[编织手法]的构造线稿图解，每个小图配英文短标签；
  3. 形态抽象：从[巢形]逐步抽象出座椅轮廓的线稿；
  4. 形态发展：几个不同造型的小型渲染方案。
  下半部分是最终成品的大幅渲染：[交错编织的框架]构成座面和靠背，[天然纤维软包]配柔软坐垫，摆在[温暖的极简客厅]里；左侧用小图标列出 4–5 条设计亮点。
  色调：[大地暖色]，表面精致有质感，整体是可持续的低调奢华风；温暖的自然光。
  顶部写展板标题"[NESTED IN NATURE]"和一行副标题，排版干净、留白充足，像设计学院的毕业展板。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2069779689074561192
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；灵感来源、产品品类、结构与材质、成品场景、色调、标题改为变量；把原文的"四阶段"展开为逐格说明，补充成品场景与设计亮点栏
images:
  - 511-biomimetic-furniture-concept-board-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2069779689074561192
  license: CC0 1.0
verify:
  - 换成"蜂巢 → 书架""贝壳 → 台灯"等其他仿生组合时，四阶段推导是否合理
  - 标题和标签改成中文时的清晰度
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：核心是"一个自然原型 + 一个产品"，两者在结构上要说得通：蜂巢六边形 → 模块书架、贝壳螺旋 → 台灯灯罩、树枝分叉 → 衣帽架、荷叶 → 茶几。把 [编织手法]、[巢形] 换成对应的结构关键词，成品场景写成会摆放它的空间。

**常见问题**：
- 推导步骤和成品对不上：在第 4 步后加一句"最终成品必须延续第 2、3 步的结构特征"。
- 上半部分太挤：把第 4 步删掉，只保留三阶段。
- 标签乱码：保留英文短标签，标题可以改中文。

**适合**：工业设计 / 家具设计课程作业、作品集、产品提案封面。注意：模型生成的结构图解是视觉示意，不代表可直接生产的工程方案。示例图为原作者生成，仅供参考。

### 英文原版

```text
Design concept board: bird nest weaving methods as the inspiration for a sculptural lounge chair. Four-stage sequence from nest-building reference photos to construction diagrams, then organic form abstraction, then the finished product. Interlocking woven frame forms the seat and backrest. Natural fiber upholstery with soft cushioning. Earthy warm tones with a polished, refined surface. Sustainable luxury aesthetic. Presentation layout with process sketches in the top half, final rendered chair in the bottom half. Warm natural lighting.

AR 4:3
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2069779689074561192) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
