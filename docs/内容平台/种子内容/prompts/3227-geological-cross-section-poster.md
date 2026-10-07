---
title: 科研绘图提示词：峡谷地层剖面图，砂岩 / 页岩 / 石灰岩分层 + 断层岩脉 + 化石与地下水
slug: geological-cross-section-poster
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做地理 / 地质课件、自然科普展板、研学手册插图时，生成一张上半部是峡谷实景、下半部是地层剖面的示意海报：岩层分色标注，有断层、岩脉、含水层、化石层和深度刻度。
prompt: |
  制作一张细致的地质剖面海报，展示切穿一个虚构[峡谷盆地]的层状地层。
  - 配色：自然科学色系——砂岩米色、氧化铁红、页岩灰、石灰岩奶油色、玄武岩炭黑，地表有低饱和的绿色植被；
  - 内容：清晰区分的岩层、一条断层、一个含水层、含化石的地层、一条火山侵入岩脉；
  - 文字："[地质剖面图]"、"[Solterra Basin]"、"[Scale 0-500 m]"，岩层标签"[Sandstone]"、Shale、Limestone、Coal Seam、Aquifer、Basalt Dike；
  - 左侧竖向刻度：0 m、100 m、250 m、500 m；
  - 小注释"Marine fossils"和"Groundwater flow"，配箭头；
  - 地表上方露出峡谷实景，与下方剖面自然衔接；
  - 构图高度易读、有教育性、图示整洁：线条干净、标签位置正确、注释密度均衡，达到出版级科学插画的清晰度。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-scientific-and-educational.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；地形、标题、地名、比例尺、首个岩层标签、画幅设为变量；按示例图补充"地表露出峡谷实景"的描述
images:
  - 3227-geological-cross-section-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/scientific-educational/geological-strata-cross-section.png
  license: MIT
verify:
  - 示例图是英文版；岩层顺序和构造关系是示意，教学使用前需按教材核对
  - 换成中文标签出一次，看岩层名是否写对
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[峡谷盆地] 可以换成"喀斯特溶洞山区""海岸悬崖""冲积平原"，岩层列表跟着调整（溶洞区可以加"溶洞""钟乳石"）；标题和地名写中文如"[地质剖面图]""[青禾盆地]"；岩层标签也可以全部改成中文"砂岩、页岩、石灰岩、煤层、含水层、玄武岩脉"。示例图是英文横版：上方是红色峡谷和远处河流，下方剖面从上到下是砂岩、页岩、石灰岩、黑色煤层、蓝色含水层（带"Groundwater flow"箭头）和含贝壳鱼骨的化石层，左侧一条斜向断层、右侧一条黑色玄武岩脉直通地表，最左边是 0～500 m 的深度刻度。

**常见问题与调整**：
- 岩层太多太乱：限定"不超过 6 层，每层厚度明显不同"。
- 断层两侧没错开：加"断层两侧岩层上下错位约一层厚度"。
- 中文标签模糊：每个标签用白底小牌，字数不超过四个字。
- 想做立体版：改成"三维块状剖面图，能看到地表和两个切面"。

**适合**：地理 / 地质课件、自然科普展板、研学手册插图；剖面为示意，不代表真实地质勘探数据。

### 英文原版

```
Produce a detailed geological cross-section poster of layered earth strata cutting through a fictional canyon basin. Use a natural scientific palette of sandstone beige, iron oxide red, shale gray, limestone cream, basalt charcoal, and muted green vegetation above ground. Show clearly differentiated layers, a fault line, an aquifer, fossil-bearing beds, and a volcanic intrusion. Add crisp in-image text: "Geological Cross-Section", "Solterra Basin", "Scale 0-500 m", and labels "Sandstone", "Shale", "Limestone", "Coal Seam", "Aquifer", and "Basalt Dike". Include a vertical scale with "0 m", "100 m", "250 m", and "500 m". Add small annotations "Marine fossils" and "Groundwater flow" with arrows. The composition should be highly legible, educational, and neatly diagrammed, with clean linework, correct label placement, balanced annotation density, and publication-quality scientific illustration clarity.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
