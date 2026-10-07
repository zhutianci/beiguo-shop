---
title: "知识科普信息图提示词：白卡片网格的概念讲解图（HTTP 协议示例）（gpt-image-2）"
slug: concept-explainer-card-infographic
model: gpt-image-2
topics: [infographic, ppt]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入一个知识点，自动按\"概念 / 对比 / 流程 / 系统 / 技能\"选择结构，生成一张浅色背景、白色圆角卡片网格的中文科普信息图，适合技术概念、学科知识点和入门讲解。"
prompt: |
  生成一张干净的中文科普信息图海报，讲解"[HTTP 协议]"。
  整体风格：现代极简 UI，背景是柔和的浅色（如奶油色 #FAF7F2 或浅灰蓝），配色克制舒适，适合长时间阅读。
  核心要求：根据主题本身的信息结构自然组织内容模块，不强制固定的模块数量和顺序，逻辑清晰优先于形式对称。
  版式（自适应）：网格布局（自动选择 2 列 / 3 列 / 不规则分布）；卡片数量随内容调整，通常 5～9 张；信息量大的模块放大，简单模块缩小或合并。
  卡片：白色卡片（#FFFFFF），圆角 + 轻微阴影，间距和对齐统一。
  每个模块包含：统一风格的简单插画或图标、清晰的标题、1～3 句核心说明，必要时给出例子 / 对比 / 小结。
  按主题选择结构：概念类 → 定义 + 原理 + 特点 + 例子；对比类 → A vs B；流程类 → 步骤 / 流程图；系统类 → 组成 + 关系；技能类 → 方法 + 技巧 + 常见错误。
  视觉层级：标题 > 模块标题 > 正文 > 辅助信息，重要信息用颜色或图标强调。
  配色：主色按主题选择（科技 = 蓝、学习 = 绿、警示 = 橙），辅色 1～2 种，避免高饱和和花哨。
  风格：大量留白、有呼吸感，图标统一（线性或扁平），可读性优先，教育导向明确；可以加入对比块、流程箭头、结构图，最后用一个"核心总结"模块收尾。全部使用简体中文。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/knowledgefxg/status/2048376335576510847
  author: "知识分享官"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文结构说明整理为中文提示词；主题改为变量；合并重复的版式与风格要求"
images:
  - 3020-concept-explainer-card-infographic-1.jpg
imageCredit:
  by: "知识分享官"
  url: https://youmind.com/gpt-image-2-prompts?id=16270
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[HTTP 协议] 换成任何想讲清楚的知识点，如"复利""光合作用""RAG 检索增强生成""劳动合同试用期"。主题越具体越好，"Python 装饰器"比"Python"更容易排出好看的结构。需要特定内容时，可以在主题后面附上你想要的 5～8 个要点。

示例图是浅色底的"HTTP 协议"信息图：顶部蓝色大标题和浏览器 + 盾牌插画，下面 8 张编号白卡片——什么是 HTTP、工作原理（客户端—服务器示意）、核心特点、请求结构示例、响应结构示例、常见状态码（1xx～5xx 彩色标签）、常见用途和核心总结。

**常见问题**：
- 代码 / 示例文字出错：请求报文、公式这类精确内容一定要核对，必要时在提示词里写好原文。
- 卡片太多太挤：限定"最多 6 张卡片"。
- 做成横版 PPT：把画幅改成 16:9，并写"3 列网格"。

**适合**：技术科普、学科知识点讲解、课程讲义、小红书 / 公众号知识卡片。

### 原版提示词

```text
A clean educational infographic poster explaining "{argument name="topic" default="Topic"}".

[Overall Style]
Modern minimalist UI style, background in soft light colors (e.g., cream #FAF7F2 / light gray-blue), restrained and comfortable color palette suitable for long reading sessions.

[Core Requirements (Key)]
Naturally organize content modules based on the information structure of the "topic". Do not force a fixed number or order of modules; prioritize clear logical information over formal symmetry.

[Layout (Adaptive)]
- Use grid layout (auto-select 2 columns / 3 columns / irregular distribution)
- Card count adjusts based on content (usually 5–9)
- High information density modules can be enlarged (higher visual weight)
- Simple modules can be shrunk or merged

[Card Design]
- White cards (#FFFFFF)
- Rounded corners + subtle shadows (soft layering)
- Maintain uniform spacing and alignment

[Each Information Module Includes]
- Simple illustrations (unified style)
- Clear headings (strong hierarchy)
- 1–3 core explanatory sentences (avoid wordiness)
- Examples / comparisons / summaries provided where necessary

[Content Organization Principles (Emphasis)]
Auto-select appropriate structure based on theme, e.g.:
- Concept type → definition + principle + characteristics + example
- Contrast type → A vs B (comparative structure)
- Process type → steps / flowcharts
- System type → components + relationships
- Skill type → methods + tips + common mistakes

[Visual Hierarchy]
- Title > Module Title > Main Text > Supporting Information
- Important info can be highlighted with color or icons

[Color Suggestions]
- Primary color: Choose based on theme (Tech=Blue, Learning=Green, Warning=Orange)
- Secondary colors: 1–2 types suffice
- Avoid high saturation and flashiness

[Style Requirements]
- Generous negative space, strong sense of "breathability"
- Unified icons (linear or flat)
- High readability as priority
- Clear educational orientation

[Extra Optimization (Optional)]
- Can include: comparison blocks / process arrows / structure diagrams
- Can have a "Core Summary" module as a visual finale.
```

> 改编自 [知识分享官](https://x.com/knowledgefxg/status/2048376335576510847) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
