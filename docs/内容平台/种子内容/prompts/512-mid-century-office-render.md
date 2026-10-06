---
title: 办公室装修效果图提示词：中古风写实渲染（可换工作室 / 书房 / 前台）
slug: mid-century-office-render
model: gpt-image-2
topics: [interior, photography]
aspectRatio: "3:2"
needsRefImage: false
useCase: 装修或选办公室前，先用文字生成一张写实的办公空间效果图，确定风格、材质和配色方向；也适合设计公司做提案氛围图、联合办公空间做宣传图。
prompt: |
  渲染一间精致的[中古现代风]创意办公室，写实室内效果图风格。
  材质：[胡桃木]定制柜体、[黄铜]点缀、[橄榄绿]软包座椅、[水磨石]地面、[烟灰色玻璃]隔断，大窗洒进[傍晚斜阳]。
  配色：[胡桃棕、橄榄绿、奶油白、黄铜金]和低饱和陶土色。
  画面包含：居中的一张[主管办公桌]、整面嵌入式书架、一个休息角，以及墙上的一块计划看板；看板上用细小清晰的字写"[Studio North]""[Q3 Review]""[14:30]"。
  加入真实的小物件：[绘图工具、书、陶瓷台灯、黑胶唱机]，但整体要经过精心挑选、不杂乱。
  机位：杂志感视角，约 32mm 焦段，透视线平衡，自然景深。
  重点表现材质触感、可信的光线、干净的几何形体，达到专业建筑可视化的品质；不要出现人物、品牌 Logo 或水印。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-architecture-interior
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；风格、各项材质、光线、配色、主家具、看板文字和小物件改为变量；补充"不要人物、Logo、水印"的约束
images:
  - 512-mid-century-office-render-1.jpg
imageCredit:
  by: "wuyoscar/GPT-Image2-Skill"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/architecture-interior/mid-century-modern-office-studio.png
  license: MIT
verify:
  - 看板上的小字是否清晰；换成中文字时错字多不多
  - 换成"现代极简""工业风""新中式"时是否同样写实
  - 示例图书架上有一张装饰性人像小画框，确认不像任何真实人物
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：风格和材质要配套写——工业风配"水泥墙、黑钢、旧木"，新中式配"胡桃木格栅、宣纸灯、青砖"，奶油风配"微水泥、白橡木、弧形沙发"。[主管办公桌] 可以换成"开放式长条工位""接待前台""会议桌"，就能出不同功能区。看板文字换成你的公司名或留空（删掉那一句）。

**常见问题**：
- 空间比例失真、家具浮空：加"家具贴地、有接触阴影，层高约 3 米"。
- 东西太满：把小物件减到 2 件，并强调"大面积留白"。
- 想按自家户型出图：上传现场照片，在开头加"保持照片中的墙体、门窗和梁柱位置不变，只替换装修和家具"。

**适合**：办公室装修前的风格比选、工作室 / 书房改造参考、空间宣传图。效果图仅供参考，施工以设计师图纸为准。

### 英文原版

```text
Render a sophisticated mid-century modern creative office in photorealistic interior style, with walnut millwork, brass accents, olive upholstery, terrazzo flooring, smoked glass partitions, and large windows casting late-afternoon light. Use a rich palette of walnut brown, olive green, cream, brass gold, and muted terracotta. The composition should show a central executive desk, built-in shelving, a lounge corner, and a wall-mounted planning board. On the board, include subtle in-image text "Studio North", "Q3 Review", and "14:30". Add realistic accessories like drafting tools, books, ceramic lamps, and a record player, but keep the scene curated and uncluttered. Camera angle should feel editorial, around 32 mm, with balanced perspective lines and realistic depth of field. Prioritize tactile materials, believable lighting, clean geometry, and polished architectural-visualization quality.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Architecture & Interior」中的示例提示词（Mid-Century Modern Office），Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)；示例图同样来自该仓库。
