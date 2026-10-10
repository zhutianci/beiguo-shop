---
title: "读书笔记信息图提示词：一本书一张图的拆书海报（中等信息密度）（gpt-image-2）"
slug: book-summary-infographic-poster
model: gpt-image-2
topics: [infographic]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入一本书的书名，生成一张中文拆书信息图：书名作者与一句话洞察、核心观点、重点卡片、结构图、书中片段、金句和读后行动，适合读书博主、读书会和学习笔记。"
prompt: |
  生成一张中等信息密度的拆书信息图海报，主题是《[书名]》。
  第 0 步（关键预判）：生成前先判断这本书属于哪一类（可多选），并据此调整内容逻辑：
  - 认知成长（思维 / 自我提升）
  - 商业财富（赚钱 / 职业 / 投资）
  - 心理情感（关系 / 内心 / 人性）
  - 小说故事（叙事 / 人物 / 隐喻）
  整体风格：现代极简 UI + 轻复古插画。柔和浅色背景（奶油色 / 米色 / 浅灰），低饱和配色（深绿 / 深蓝 / 棕色）。关键词：安静、扎实、好读。
  核心原则：不用固定的模块标题，不强求结构完整，按书的类型自然组织信息。
  内容模块：
  1. 开头：书名、作者、一句话洞察；
  2. 核心理解："这本书真正想说的是……"；
  3. 重点：按类型调整的关键收获；
  4. 视觉结构：决策路径、杠杆系统或人物关系图（按类型选一种）；
  5. 例子 / 片段：书中令人印象深刻的场景或案例；
  6. 金句：有意义的句子；
  7. 行动：读完后可以做的几件具体小事。
  设计细节：自适应网格布局，卡片式信息，图文比约 6:4，插画风格统一，层级清晰。
  语气：像一个读懂了这本书的人在讲给你听，有洞察和感悟，而不是干巴巴的摘要。全部使用简体中文。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/alanlovelq/status/2049634316410630146
  author: "阿兰AI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文结构说明整理为中文提示词；书名改为变量；保留\"先判断书的类型再组织内容\"的关键步骤，删去重复的风格关键词"
images:
  - 3019-book-summary-infographic-poster-1.jpg
  - 3019-book-summary-infographic-poster-2.jpg
imageCredit:
  by: "阿兰AI"
  url: https://youmind.com/gpt-image-2-prompts?id=17085
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[书名] 写书的中文名，最好加作者（如"原子习惯，詹姆斯·克利尔"），模型对知名书籍的内容掌握更好；冷门书建议在后面附上你自己的读书摘要，让它只负责排版。"第 0 步"的类型判断很关键，小说会画人物关系图，商业书会画决策路径。

示例图是两张：《原子习惯》（多米诺骨牌主视觉、四大定律卡片、"提示—渴望—回应—奖励"循环图、1% 复利曲线）和《小狗钱钱》（女孩和金毛插画、财富成长循环、行动清单），都是米色底、深绿深棕配色、卡片式排版。

**常见问题**：
- 书中内容有误、金句是编的：信息图里的引用请核对原书后再发布，尤其是"金句"模块。
- 字太小：把模块减到 5 个，或者要求"每张卡片不超过 3 行"。
- 想要统一的系列：固定配色和插画风格描述，只换书名。

**适合**：读书博主笔记、读书会分享、学生读后感配图、公众号书单。

### 原版提示词

```text
Generate a [medium information density] book summary infographic poster with the theme "{argument name="book title" default="Book Title"}".

---

Step 0 (Critical Pre-assessment)

Before starting generation, determine which category this book belongs to (multiple choice possible):
* Cognitive Growth (Thinking / Self-improvement)
* Business / Wealth (Earning / Career / Investment)
* Psychology / Emotion (Relationships / Inner Self / Human Nature)
* Novel / Story (Narrative / Character / Metaphor)

Adjust content logic based on category.

[Overall Style]
Modern Minimalist UI + Light Vintage Illustration style. Soft light backgrounds (Cream / Beige / Light Gray). Low saturation palette (Deep Green / Deep Blue / Brown).
Keywords: Quiet, Substantial, Readable.

[Core Principles]
Do not use fixed module titles. Do not force structural completeness. Organize information naturally based on book type.

[Content Modules]
1. Opening: Book Title, Author, One-sentence insight.
2. Core Understanding: "What this book is really saying is..."
3. Highlights: Key takeaways adjusted by category.
4. Visual Structure: Decision paths, leverage systems, or character maps.
5. Examples/Fragments: Memorable scenes or cases.
6. Quotes: Meaningful sentences.
7. Actions: Practical steps to take after reading.

[Design Details]
Adaptive grid layout, card-based info, 6:4 image-to-text ratio, unified illustration style, clear hierarchy.

[Tone of Voice]
Should sound like a human explaining the book with insight and realization, not like a dry summary.
```

> 改编自 [阿兰AI](https://x.com/alanlovelq/status/2049634316410630146) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
