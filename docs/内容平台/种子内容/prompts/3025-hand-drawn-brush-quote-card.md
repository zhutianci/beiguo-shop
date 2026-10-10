---
title: "手绘知识卡片提示词：毛笔草书标题 + 涂鸦插画的观点卡（9:16）（gpt-image-2）"
slug: hand-drawn-brush-quote-card
model: gpt-image-2
topics: [infographic, poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "输入一句观点或心得，生成一张米色纸底、红黑毛笔大标题、分 2～4 段要点并配手绘小插画的竖版知识卡片，适合小红书、朋友圈和公众号金句图。"
prompt: |
  生成一张手绘风格的知识卡片，9:16 竖版。主题明确，背景是带纸张纹理的米色或米白色，整体是简单、亲切的手绘美感。
  卡片顶部用红黑对比的大号毛笔行草字写标题，形成视觉焦点。
  正文全部用中文手写行书，整体分成 2～4 个清晰的部分，每部分用简短精炼的中文短句表达核心观点；字体保持行书的流畅节奏，既清楚可读又有艺术气息。
  卡片上点缀简单有趣的手绘插画或图标，比如小人物、象征性的小符号，增加趣味、引发共鸣。
  注意整体视觉平衡，留出足够空白，画面简洁清楚、易读易懂。
  主题："[做IP拼的是长期复利]，坚持每天出摊、持续去做，一定会有结果，因为 99% 的人坚持不下来。"
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/alanlovelq/status/2046984469048066237
  author: "阿兰AI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文说明的英文写法，本站改写为中文；主题改为变量并缩短默认值"
images:
  - 3025-hand-drawn-brush-quote-card-1.jpg
imageCredit:
  by: "阿兰AI"
  url: https://youmind.com/gpt-image-2-prompts?id=14777
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：方括号里是核心观点（会成为大标题），后半句是展开说明，模型会自动拆成标题和 2～4 个要点。观点最好有"结论 + 理由"的结构，例如"[读书是为了改变自己]，不是为了记住每一句话……""[副业先做小再做大]……"。

示例图是米色纸底的竖版卡片，顶部红黑毛笔大字"做IP，拼的是长期复利"，下面四段编号要点（长期复利、每日出摊、持续输出、坚持到最后），每段旁边一个手绘小插画（小摊位、小人、上升曲线），底部一行小字收尾。

**常见问题**：
- 手写字出现错字：要点写得越短越好，每段不超过 15 个字。
- 画面太花：插画限定为"每段一个小图标"。
- 想要统一系列：固定"米色纸底 + 红黑毛笔标题 + 黑色手写正文"的描述，只换主题。

**适合**：小红书知识卡片、朋友圈金句图、公众号文末总结、读书笔记。

### 原版提示词

```text
Create a hand-drawn style infographic card with a 9:16 vertical ratio. The card has a clear theme, the background is beige or off-white with paper texture, and the overall design reflects a simple and friendly hand-drawn aesthetic. At the top of the card, a large red and black contrasting brush cursive font highlights the title to attract the visual focus. The text content is all in Chinese cursive, and the overall layout is divided into 2 to 4 clear sections, each expressing core points with short and refined Chinese phrases. The font maintains the smooth rhythm of cursive script, which is both clear and readable and full of artistic atmosphere. Simple and interesting hand-drawn illustrations or icons, such as characters or symbolic signs, are dotted on the card to enhance visual appeal and trigger readers' thinking and resonance. Pay attention to visual balance in the overall layout, reserve enough blank space to ensure the image is concise and clear, easy to read and understand. The theme is: "{argument name="theme" default="Building an IP is long-term compound interest; stick to setting up your stall every day and keep doing it, there will definitely be results because 99% can't persist."} "
```

> 改编自 [阿兰AI](https://x.com/alanlovelq/status/2046984469048066237) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
