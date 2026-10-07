---
title: 科研绘图提示词：深蓝底霓虹配色元素周期表海报，按光谱分组上色（可当桌面壁纸）
slug: periodic-table-poster-neon
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做化学课件封面、实验室 / 教室装饰海报、理科生桌面壁纸时，生成一张深色背景、发光色块的元素周期表：结构完整，带族号周期号和侧边图例。
prompt: |
  设计一张别具一格的元素周期表海报变体：每个元素格按[虚构的发射光谱家族]上色，同时保持干净的科学版式。
  - 背景：[深藏青色]；颜色明亮但克制，用青色、品红、琥珀、青柠绿和银白；
  - 结构：准确排列周期表，周期和族清晰，镧系和锕系单独成行；
  - 标题："[Periodic Table]"，副标题"[Spectral Variant]"；
  - 确保代表性元素格清晰可见，如 H 1、He 2、C 6、Fe 26、Ag 47、U 92；
  - 侧边图例：Alkali、Transition、Metalloid、Noble Gas、Actinide；
  - 加上族号 1～18 和周期号 1～7；
  - 整体有教育性、现代感、高度易读：字体精确、格子对齐、发光效果均衡、表格结构准确。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-scientific-and-educational.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；分组方式、背景色、标题、副标题、画幅设为变量；补充了常见问题与改法
images:
  - 3224-periodic-table-poster-neon-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/scientific-educational/periodic-table-spectral-variant.png
  license: MIT
verify:
  - 元素符号、原子序数和原子量需逐格抽查，模型常有个别错误；配色分组是虚构的，不能当教学分类
  - 换成中文元素名版本出一次，看小字是否可读
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[虚构的发射光谱家族] 换成"标准元素分类（碱金属、过渡金属、卤素、稀有气体等）"就是一张正经教学表；[深藏青色] 换成"纯黑""深紫"会更有赛博感，换成"米白"就是传统印刷风。标题可写中文"[元素周期表]"。示例图是英文横版：深蓝底上一张完整周期表，碱金属列是青色、过渡金属是品红、右侧 p 区是琥珀色、稀有气体是绿色，镧系锕系单独两行，左侧是五个发光边框的分类图例，顶部白色衬线大标题。

**常见问题与调整**：
- 元素错位或重复：加"严格按标准周期表 118 个元素排列，每格包含符号、序数、名称"。
- 发光太强看不清字：改成"只有格子边框微微发光，格内文字为白色实心"。
- 想做竖版手机壁纸：画幅改 9:16，改成"周期表旋转 90°"，或只保留主族元素。
- 要中文版：写"每格显示中文元素名和元素符号，所有说明为简体中文"。

**适合**：化学课件封面、教室 / 实验室装饰海报、桌面壁纸；用于教学前需逐格核对数据。

### 英文原版

```
Design a distinctive periodic table poster variant where each element tile is colored by fictional emission-spectrum families while preserving clean scientific layout. Use a dark navy background with luminous but disciplined colors: cyan, magenta, amber, lime, and silver-white. Arrange the periodic table accurately with clear periods and groups, including separate lanthanide and actinide rows. Add a crisp title reading "Periodic Table of the Elements" and subtitle "Spectral Classification Variant". Ensure visible labels for representative tiles such as "H 1", "He 2", "C 6", "Fe 26", "Ag 47", and "U 92". Include side legends titled "Alkali", "Transition", "Metalloid", "Noble Gas", and "Actinide". Add small group numbers "1" through "18" and period numbers "1" through "7". The result should feel educational, modern, and highly legible, with precise typography, clean cell alignment, balanced glow effects, and accurate table structure.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
