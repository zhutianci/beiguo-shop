---
title: "知识架构图提示词：方法论体系海报（3+3+4 模块 + 闭环箭头）（gpt-image-2）"
slug: knowledge-system-framework-poster
model: gpt-image-2
topics: [infographic]
aspectRatio: "9:16"
needsRefImage: false
useCase: "把一段方法论、课程大纲或个人成长体系自动整理成知识博主风格的竖版架构图：网格纸背景、超大标题、渐变关键词条、10 个黑框白底模块和蓝色闭环箭头。"
prompt: |
  请生成一张高级中文知识架构信息图，9:16 竖版。视觉语言固定为：浅奶白色网格纸背景 + 封面级超大粗体标题 + 高饱和蓝—紫—洋红渐变关键词胶囊条 + 白底黑框结构模块 + 模块内彩色小胶囊标签 + 蓝色箭头闭环连接。它不是普通流程图或科技 UI 面板，而是像高质量知识博主的课程封面、知识付费体系图、方法论架构海报。整体克制、干净、高度有序，但局部彩色标签要足够醒目，让画面比普通黑白架构图更丰富。
  1. 背景：浅奶白网格纸，网格线极细、浅灰；不要渐变、深色背景、重阴影、玻璃拟态、拟物和科技 HUD。黑白骨架，颜色只用于关键词条、小标签、强调块和蓝色箭头。
  2. 顶部：一行居中的小字描述句（从内容中提炼）；超大粗体中文主标题"[如何在一天内彻底改变你的人生]"（全图最大、最有冲击力）；一条横向高饱和渐变关键词胶囊条，含 3 个核心关键词，用白色圆点分隔。
  3. 主体：三层结构，3 + 3 + 4 共 10 个白底黑框小圆角模块。每个模块包含中文标题、英文副标题、2～4 句短句和彩色小胶囊标签。
  4. 内容自动编排：把内容自动整理为第一层"战略 / 认知"、第二层"行动 / 执行"、第三层"输入 / 输出 / 品牌"。用彩色标签表示分类、来源、方法、工具等；内容不够时保持 3+3+4 结构，合理概括。
  5. 色彩：亮色只来自标签，不来自背景；至少 5 个模块带高饱和小胶囊标签（蓝、紫、洋红、橙、绿、青）。
  6. 箭头：中高饱和蓝色箭头，表示从上到下再返回顶部的闭环流程。
  7. 文字层级：主标题最粗最大 > 渐变条文字 > 模块标题 > 正文。
  8. 禁止：渐变 / 深色背景、大色块卡片、玻璃拟态、复杂插画、PPT 或思维导图样式、灰色箭头。
  内容：[在这里用自然语言写你的内容]
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/GeekCatX/status/2058939042746753184
  author: "知识猫图解"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文说明整理为中文提示词；标题和内容改为变量；精简重复的验收与禁止条款"
images:
  - 3024-knowledge-system-framework-poster-1.jpg
imageCredit:
  by: "知识猫图解"
  url: https://youmind.com/gpt-image-2-prompts?id=22553
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题换成你的主题，如"自媒体从 0 到 1 的完整路径""考研一年复习体系"；[在这里用自然语言写你的内容] 处直接粘贴你的笔记或大纲，几百字以内效果最好，模型会自动拆成 10 个模块。内容越结构化（分点列出），模块里的文字越准确。

示例图是奶白网格纸上的竖版图：顶部小字说明、黑色超大标题"如何在一天内彻底改变你的人生"、蓝紫渐变的"认知重启 · 高效行动 · 成果闭环"胶囊条，下面 3+3+4 共 10 个黑框模块（人生愿景、核心类别、关键结果、阶段项目、待办事项、每日行动等），模块里有彩色小标签，蓝色箭头串成闭环。

**常见问题**：
- 模块数不对：把"3 + 3 + 4"写在提示词开头再强调一次。
- 小字错别字：每个模块正文控制在 2 句，标签 2～4 字。
- 变成了思维导图：保留"禁止思维导图样式"，并强调"方形模块 + 箭头"。

**适合**：知识博主课程封面、方法论分享、个人成长体系、团队工作流说明图。

### 原版提示词

```text
Please generate a high-end Chinese knowledge architecture infographic with a vertical 9:16 composition. The overall visual language is fixed as: light cream-white grid paper background + cover-level oversized bold title + high-saturation blue-purple-magenta gradient keyword capsule bar + white-base black-bordered structural modules + colorful small capsule labels inside modules + blue arrow closed-loop connections. This is not an ordinary flowchart or a tech UI panel. Please generate a high-end infographic similar to a high-quality knowledge blogger's course cover, knowledge payment system diagram, or methodology architecture poster. The overall style must be restrained, clean, and highly orderly, but local colorful labels must be striking enough to make the image richer and more layered than an ordinary black-and-white architecture diagram. 1. Fixed Visual Style: Background: Use a light cream-white grid paper background with very fine, light gray grid lines. No gradients, dark backgrounds, heavy shadows, glassmorphism, skeuomorphism, tech HUD, or cyber UI. General Vibe: Minimalist, restrained, rational, and orderly structure. Black and white skeleton with colors used only for keyword bars, small labels, emphasis blocks, and blue arrows. 2. Top Title Area Layout: Top description sentence (small centered text extracted from content), Oversized bold Chinese main title (the largest visual element with high visual impact), and a Horizontal high-saturation gradient keyword capsule bar (blue to purple to magenta transition with 3 core keywords separated by white dots). 3. Main Module Structure Rules: 3-layer structure (3 + 3 + 4 modules). Total of 10 white-base modules with black borders and small rounded corners. Each module contains a Chinese title, English sub-title, 2-4 short sentences, and colorful small capsule labels. 4. Content Automatic Arrangement Rules: Automatically extract and organize content into Strategy/Cognition (Layer 1), Action/Execution (Layer 2), and Input/Output/Brand (Layer 3). Use colorful labels for categories, sources, methods, tools, etc. If content is insufficient, maintain the 3+3+4 structure with reasonable generalizations. 5. Module Internal Color Accents: Vibrant colors must come from labels, not background colors. At least 5 modules must include high-saturation small capsule labels from the pool of blue, purple, magenta, orange, green, and cyan. 6. Blue Arrow Loop Rules: Use medium-high saturation blue arrows to show the flow from top to bottom and returning to create a closed loop. 7. Text Hierarchy: Clear weighting from the main title (thickest/largest) to the gradient bar text, module titles, and then body text. 8. Final Acceptance Criteria: Ensure grid background, top description, oversized title, gradient keyword bar, 3+3+4 module structure, colorful labels, and blue closed-loop arrows are all present and satisfy the style requirements. 9. Prohibitions: No gradient/dark backgrounds, no large color cards, no glassmorphism, no complex illustrations, no PPT or mind map styles, and no gray arrows. 10. User Variables: Top Title (Fill in main title here) and Content (Fill in natural language content here to be automatically processed).
```

> 改编自 [知识猫图解](https://x.com/GeekCatX/status/2058939042746753184) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
