---
title: 信息图提示词：濒危动物中文科普海报，写实主体 + 栖息地地图 + 食性威胁标注（大熊猫示例）
slug: endangered-animal-chinese-infographic
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做自然科普公众号长图、生物课展板、动物保护主题海报时，生成一张中文信息图：中间是写实动物主体，四周用标注、地图、图标和色块讲清特征、栖息地、食性和面临的威胁。
prompt: |
  制作一张视觉丰富的中文信息图，主题是一种濒危动物：[大熊猫]。
  - 内容：介绍它的栖息地、食性、独特特征、保护等级、面临的威胁和保护行动；
  - 呈现方式：用带标注的图像和结构化的引线说明来表达信息，而不是千篇一律的分段文字；
  - 风格：大胆的图形插画风——画面中心是一只细节丰富、照片级写实的动物作为视觉焦点，四周配示意图、标注和精炼的文字；
  - 版面：干净的背景，写实与强烈的图形元素（形状、图标、色块）分层组合；
  - 配色：以[竹林绿 + 米白]为主色；
  - 所有文字为简体中文，清晰可读；数据请使用[公开资料中的数据]。
  整体信息密集、有质感、像专业作者出品。画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://x.com/billtheinvestor/status/2047153211560399009
  author: "@billtheinvestor"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；原文"先上网找一种动物"改为直接指定动物变量；补充了保护等级、保护行动、配色和数据来源的约束
images:
  - 3219-endangered-animal-chinese-infographic-1.jpg
imageCredit:
  by: "@billtheinvestor"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/infographics-field-guides/endangered-animal-chinese-infographic.png
  license: MIT
verify:
  - 确认原帖仍可访问、作者未另行声明保留权利
  - 示例图右下角有一个二维码图案，展示前确认它不能扫出任何链接（或打码）
  - 图中种群数量、海拔等数字由模型生成，发布时需按权威资料核对
---
**怎么填变量**：[大熊猫] 可以换成"雪豹""中华白海豚""朱鹮""川金丝猴""东北虎"等；配色 [竹林绿 + 米白] 跟着动物栖息地改，比如雪豹用"雪山灰蓝 + 白"、中华白海豚用"海蓝 + 浅粉"；[公开资料中的数据] 最好直接替换成你核对过的具体数字，例如"野生种群约 1800 只"。示例图是原作者的出图：顶部大字"大熊猫"配红色"国宝"印章，中间是一只正面走来的写实大熊猫，左侧是伪拇指、强壮臼齿等特征圆形特写，右侧有保护等级、栖息地地图，下方是食性饼图、生活习性、面临的威胁照片和"我们能做什么"清单，角落有一个二维码。

**常见问题与调整**：
- 中文数字乱写：在提示词里把关键数字逐条写出，让模型照抄。
- 文字太多显得挤：减少到 5 个模块，"每个模块标题 + 两行说明"。
- 动物主体不够写实：加"主体是高清野生动物摄影质感，毛发细节清晰"。
- 不要二维码：加"不要出现二维码或条形码"。

**适合**：自然科普长图、生物课 / 环保主题展板、动物保护宣传海报；数据需人工核对，不适合直接当学术资料引用。

### 英文原版

```
Create a visually rich infographic in Chinese about an endangered animal. Start by finding one online, research its habitat, diet, and unique traits. Present information through annotated visuals and structured callouts, not generic sections. Style it like a bold graphic illustration: a detailed, photorealistic central animal as the focal point, supported by diagrams, callouts, and concise text elements. Use clean backgrounds and a mix of photorealism with strong graphic elements (shapes, icons, color blocking) in a layered composition. Make it dense, tactile, and professionally authored.
```

> 改编自 [@billtheinvestor](https://x.com/billtheinvestor/status/2047153211560399009) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
