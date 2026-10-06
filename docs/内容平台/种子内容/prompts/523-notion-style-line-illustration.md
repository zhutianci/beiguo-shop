---
title: Notion 风格插画提示词（nano banana）：黑白极简线条人物插图（文章配图 / 头像 / PPT）
slug: notion-style-line-illustration
model: nano-banana
topics: [illustration, ppt]
needsRefImage: false
aspectRatio: "3:2"
useCase: 给公众号文章、产品官网、PPT、知识卡片配一张干净的黑白小插图时，一句话生成 Notion 风格的极简线条人物：大面积留白、动作夸张有趣、风格统一，换动作就能批量出一整套。
prompt: |
  一张简洁的黑白插画：一个[戴眼镜的长发女生]，穿着[宽松外套和阔腿裤]，正在[单膝蹲下举起手机自拍、另一只手比耶]，表情[开心]。
  风格要求：Notion 风格的极简编辑插画，干净的线稿，扁平单色（只有黑和白，大块纯黑填充衣服或头发），形状简单，带一点手绘的随性感，细节极少，姿态夸张有表现力；
  纯白背景，人物居中，四周留足空白，版式干净现代，角色气质轻松俏皮。
  不要彩色、不要渐变、不要阴影纹理、不要文字。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/azed_ai/status/2043284009116160473
  author: "@azed_ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；把 [subject] [outfit] [doing action] [facial expression] 四个占位符填入与示例图一致的中文示例；补充构图留白和"不要彩色 / 渐变 / 文字"的约束
images:
  - 523-notion-style-line-illustration-1.jpg
  - 523-notion-style-line-illustration-2.jpg
imageCredit:
  by: "@azed_ai"
  url: https://x.com/azed_ai/status/2043284009116160473
  license: CC BY 4.0
verify:
  - 连续换 3 个动作生成，检查线条粗细和人物比例是否保持一致（能否做成一套）
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：四个方括号分别是"人物 / 穿着 / 动作 / 表情"。动作写得越具体越有趣，例如"抱着一摞文件小跑、表情惊慌""坐在懒人沙发上用笔记本电脑""举着放大镜看一张图表"。示例图是原作者用同一句式生成的两张：蹲下自拍的女生、拎着购物袋狂奔的男生。

**做一整套风格统一的配图**：第一张满意后，追问"保持完全相同的画风、线条粗细和人物比例，再画：[人物在白板前讲解]"，比每次新开对话更统一。需要横版 Banner 时把画幅改成 16:9，并写"人物在左侧，右侧留白放标题"。

**常见问题**：
- 出现灰色阴影或彩色：重复强调"只用纯黑和纯白"。
- 线条太精细不像 Notion 风：加"线条更少、更粗、更随意，像几笔画成"。
- 想做头像：改成"胸像，人物占画面 70%"。

**适合**：公众号 / 博客文章配图、SaaS 产品空状态插图、PPT 章节页、知识卡片。

### 英文原版

```
A simple black-and-white illustration of a [subject] in [outfit], [doing action], with a [facial expression] expression, in a Notion-style minimalist editorial aesthetic, clean line art, flat monochrome design, simple shapes, subtle hand-drawn feel, minimal detail, expressive posture, clean white background, neat modern layout, soft playful character style
```

> 改编自 [@azed_ai](https://x.com/azed_ai/status/2043284009116160473) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（Copyright (c) 2026 MeiGen.ai）。
