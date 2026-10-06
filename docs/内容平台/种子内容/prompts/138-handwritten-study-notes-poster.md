---
title: 学习笔记信息图提示词：手写风知识点海报（studygram 手账风）
slug: handwritten-study-notes-poster
model: gpt-image-2
topics: [infographic]
aspectRatio: "3:4"
needsRefImage: false
useCase: 把一个知识点、学习方法或复习提纲做成"手写笔记本 + 便利贴 + 荧光笔"风格的信息图，适合学习博主、老师和自用复习卡。
prompt: |
  一张好看的手写风学习信息图海报，设计得像一页整理得很漂亮的电子笔记本。主题："[高效学习的 6 个方法]"。
  配色：柔和粉彩，淡粉、天蓝、薄荷绿、薰衣草紫和浅黄色高亮。背景是真实的方格笔记纸纹理，带细微阴影和纸张颗粒。
  版式像高质量的学习笔记：用顺滑的黑色和蓝色墨水手写风字体书写；内容分成间距舒适的要点、编号小节和用小方框突出的关键信息。重点词用粉色、黄色、浅蓝色荧光笔划出。
  内容要点：[制定计划、主动回忆、番茄钟]、[费曼技巧、定期复习、照顾好自己]，每点配 1–2 行简短说明。
  装饰：页边有可爱的手绘涂鸦——星星、箭头、爱心、笑脸、回形针、便利贴，以及简单图标（书、笔、灯泡、清单）；便利贴自然地叠放在页面上，略微倾斜，带柔和阴影。
  整体温馨、好看、井井有条，像小红书上的爆款学习笔记。柔和光线、轻柔阴影、元素克制，保证可读性。
  超高细节，俯拍平铺视角，现代文具美学，浅景深，真实纸张质感。
  所有文字用[简体中文]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/YaZoraiz/status/2054264025178079718
  author: "@YaZoraiz"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；补充了原文缺少的"主题"和"内容要点"两个变量，并指定文字语言
images:
  - 138-handwritten-study-notes-poster-1.jpg
imageCredit:
  by: "@YaZoraiz"
  url: https://x.com/YaZoraiz/status/2054264025178079718
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文手写字是否有错字、是否可读
  - 要点数量增加到 8 条以上时版面是否崩
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[高效学习的 6 个方法] 换成你的主题，例如"二次函数知识点总结""雅思口语 Part 2 高频话题"；[内容要点] 按逗号分隔写 4–6 条，每条 2–6 个字最稳。

**常见问题**：
- 中文手写字有错：文字越多错得越多。要点控制在 6 条以内，说明文字尽量短；也可以把语言改成"英文"做英语学习卡，正确率更高。
- 内容不准确：AI 会自己补"说明文字"，学科知识类内容务必逐条核对，错误的知识点比没有更糟。
- 太花哨看不清：减少涂鸦和便利贴数量。

**迭代**：先让 ChatGPT 帮你把知识点压缩成 6 条短句，再填进来生成图片。

### 英文原版

```text
Aesthetic handwritten study infographic poster designed like a beautifully organized digital-notebook page, soft pastel color palette with gentle tones of baby pink, sky blue, mint green, lavender, and soft yellow highlights. The background is a realistic notebook paper grid texture with subtle shadows and paper grain for authenticity.
The layout is clean and structured like high-quality study notes, featuring neatly written handwritten-style typography in smooth black ink and blue pen. Content is arranged in well-spaced bullet points, numbered sections, and small boxed highlights for key information. Important words are emphasized using pastel highlighter strokes in pink, yellow, and light blue.

Decorative elements include cute hand-drawn doodles in the margins such as stars, arrows, hearts, smiley faces, paper clips, sticky notes, and simple icons (books, pens, lightbulb,checklist). Sticky notes are layered naturally on the page with soft shadows, slightly tilted for a realistic collage effect.

The composition feels cozy, aesthetic, and highly organized—like a Pinterest viral study aesthetic or an Instagram “studygram” post. Soft lighting, gentle shadows, and minimal clutter ensure readability while maintaining visual charm. The design feels calming, motivating, and academically inspiring.

Ultra-detailed, 4K resolution, top-down flat lay perspective, modern stationery aesthetic, soft depth of field, realistic paper texture, high-end digital illustration style.
```

> 改编自 [@YaZoraiz](https://x.com/YaZoraiz/status/2054264025178079718) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
