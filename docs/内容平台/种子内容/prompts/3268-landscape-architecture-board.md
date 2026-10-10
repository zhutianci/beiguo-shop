---
title: 建筑效果图提示词：景观设计竞赛展板，生态分析图+湿地鸟瞰+土壤水文剖面（gpt-image-2）
slug: landscape-architecture-board
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "3:4"
useCase: 风景园林 / 城乡规划专业做课程作业、竞赛提案或作品集排版时，生成一张三段式竖版展板：上部生态分析图，中部写实鸟瞰渲染，底部连续剖面，整体安静、科学又有诗意。
prompt: |
  生成一张 3:4 竖版、竞赛级的景观设计展板，把写实鸟瞰渲染和精致的建筑图解语言结合起来，风格像高水平国际景观竞赛的提交图。
  氛围：安静、有空气感、可再生、生态、科学而有诗意。
  版式分三段：
  1. 顶部分析区：简化的生态地图，柔和透明的色彩叠加；白色和浅灰的极细线；表现[水流与生态网络]、游览路线、栖息地分区和景观连通性的图解；虚线表示流动；极少的注释和柔和的生态图标；像浮在渲染图上方的叠层；浅粉彩、高透明度、留白干净；
  2. 中部鸟瞰渲染（主图）：[湿地生态修复景观]的鸟瞰视角——湿地、池塘、流动的水系、植被斑块、生态草沟、再生地形；略微去饱和的绿、棕和低饱和水蓝；远处有轻微雾气带出纵深；少量人和生态活动：步道、飞鸟、小尺度的互动；地形过渡平滑，光线安静有电影感；整体带一点纸张纹理；
  3. 底部连续剖面：贯穿地形与生态系统的剖切——土壤分层、水文、地下水流动、植物根系、生态修复过程、净水系统；白色或浅色细线，低饱和色调；箭头表示水流和生态流向；精致的制图质感，与上方无缝衔接。
  图解语言：极细且精准的线条，边缘略柔（不要生硬的矢量感），标注极少，科学记号干净，生态符号柔和。
  配色：底色是去饱和的绿、土棕和低饱和水蓝；叠层用浅绿、柔青、浅米色和半透明粉彩；避免高饱和点缀色、强对比、亮红色。
  质感：柔和的空气感渲染，轻微环境雾，漫射光，细微的纸纹或印刷展板质感。
  顶部写项目标题"[项目标题]"和一行副标题。画幅[3:4]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2054654236705845670
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并保留原文的三段结构；分析内容、景观类型、项目标题、画幅设为变量；参照示例图补充了顶部标题；删掉话题标签
images:
  - 3268-landscape-architecture-board-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/ui_case145/output.jpg
  license: CC0 1.0
verify:
  - 示例图标题和注释是英文（"REWILDING HORIZONS"），中文标题版出一次看小字
  - 页面需提示"展板中的分析图和剖面只是视觉示意，不代表真实场地数据"，提醒学生交作业时注明 AI 辅助
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[湿地生态修复景观] 换成你的题目，例如"城市滨河公园""矿坑生态修复""山地梯田村落"；顶部分析内容跟着题目改，比如滨河公园写"[洪水淹没线、慢行系统、亲水节点]"；[项目标题] 写方案名。示例图是竖版三段展板：顶部标题"REWILDING HORIZONS"，下面一排浅色的区位、水文、生态网络分析图和一组小图标；中间大幅鸟瞰是蜿蜒的河道、大小水塘和环形栈道，远处有薄雾；底部是土层剖面，画出地下水流和植物根系，最下面一排五个小图标说明。

**常见问题与调整**：
- 分析图太花哨抢主图：强调"顶部分析图高透明、低饱和，只占画面四分之一"。
- 剖面和鸟瞰对不上：加"剖面线对应鸟瞰图中的同一条河道"。
- 想要白底展板：把整体改成"白色展板底，渲染图带白色边框"。
- 需要横版 A1：画幅改 4:3 或 3:2，三段改为左分析、中鸟瞰、右剖面。

**适合**：风景园林课程作业概念图、竞赛提案氛围、作品集排版参考；不适合当作真实场地分析或施工依据。

### 英文原版

```
Generate a 3:4 vertical, competition-grade landscape architecture presentation board. The board blends photorealistic aerial rendering with refined architectural diagram language, in the style of a high-end international landscape competition submission. Mood: calm, atmospheric, regenerative, ecological, scientific yet poetic. Layout (three stacked zones): 1. Top zone: analytical ecological diagrams and mapping overlays. 2. Middle zone: a large aerial landscape rendering as the primary focal image. 3. Bottom zone: a continuous sectional cut through the ecological landscape system. Top analytical zone: • Simplified ecological maps with soft, transparent color overlays. • Ultra-thin linework in white and pale gray. • Diagrams of water flow, circulation systems, ecological networks, habitat zones, and landscape connectivity. • Dashed lines for movement and flow. • Minimal annotations and soft ecological icons. • Floating overlay effect sitting above the rendering. • Very light pastel tones, high transparency, clean spacing, no dense clutter. Middle aerial rendering: • Bird's-eye view of an ecological restoration landscape. • Wetlands, ponds, flowing water systems, vegetation patches, bioswales, regenerative terrain. • Soft, slightly desaturated palette of greens, browns, and muted water blues. • Atmospheric depth with subtle haze in the distance. • Gentle human and ecological activity: walking paths, birds, small environmental interactions. • Wide landscape depth, smooth terrain transitions, calm cinematic environmental lighting. • Soft paper-texture finish integrated into the rendering. Bottom sectional cut: • Continuous section through terrain and ecological systems. • Soil layers, hydrology, groundwater movement, vegetation roots, ecological restoration processes, water filtration systems. • Thin white or pale linework, muted tones, minimal color. • Arrows indicating water movement and ecological flow. • Elegant architectural drafting quality, seamlessly merged into the board. Diagram language: extremely thin and precise linework, slightly softened edges (no harsh vector look), minimal labels, clean scientific notation, soft ecological symbols, balanced between scientific clarity and poetic visualization. Color system: • Base: desaturated greens, earthy browns, muted blue water tones. • Overlay: pale green, soft cyan, light beige, translucent pastel layers. • Avoid saturated accents, harsh contrast, bright reds, or overly graphic colors. Texture and atmosphere: soft atmospheric rendering, slight environmental haze, diffused lighting, subtle paper-grain or printed board texture, refined competition-board aesthetic. Format: 3:4 vertical architectural competition board composition. #AIart #GPTImage2
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2054654236705845670) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
