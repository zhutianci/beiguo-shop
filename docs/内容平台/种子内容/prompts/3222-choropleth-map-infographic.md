---
title: 数据可视化 AI 提示词：分级设色地图信息图，虚构区域各地块产量一图对比
slug: choropleth-map-infographic
model: gpt-image-2
topics: [infographic, ppt]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做地理课件、区域分析报告配图、游戏或小说的虚构地图时，生成一张手绘地图质感的分级设色图：十几个分区按数值深浅上色，配图例、指北针、比例尺和最高 / 最低值标注。
prompt: |
  制作一张精致的分级设色地图（choropleth）信息图，区域是一个虚构的农业区"[Solterra Basin]"，展示各地块的[收获产量]。
  - 风格：极简制图风，米白背景，带淡淡的地形提示；顺序色阶从[浅沙色到深绿色]；
  - 地图：14 个边界清晰的分区，标签干净，右侧放图例；
  - 文字：区域名 + "[Harvest Yield]"作为标题，年份"[2025]"，图例标题"[tons / hectare]"；
  - 分区名示例：North Vale、Riverbend、Copper Plain、East Orchard、Cinder Ridge 等；
  - 图例数值：1.2、2.4、3.6、4.8、6.0；
  - 加一个紧凑的注释框："Highest yield: East Orchard 5.8"和"Lowest yield: Dry Steppe 1.4"；
  - 字体干净、地图几何形状可信、构图平衡、制图细节细腻，达到出版级信息图的清晰度。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-data-visualization.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；区域名、指标、色阶、标题、年份、单位、画幅设为变量；补充了常见问题与改法
images:
  - 3222-choropleth-map-infographic-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/data-visualization/geographic-choropleth-harvest-yield.png
  license: MIT
verify:
  - 不要用它画真实行政区地图（边界不准确且可能有政治敏感），页面上建议注明仅适用虚构区域
  - 换成中文分区名出一次，看 14 个标签是否都写对
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[Solterra Basin] 换成你的虚构区域名，如"[青禾盆地]""[北境王国]"；[收获产量] 可以换成"人口密度""门店销售额""降雨量"；色阶 [浅沙色到深绿色] 换成"浅黄到深红"适合表示热度。标题、年份和单位跟着指标一起改。示例图是仓库作者的出图：米白纸面上一块被河流穿过的盆地，分成 14 个绿色深浅不同的分区，深绿色的 East Orchard 5.8 最突出，浅黄的 Dry Steppe 1.4 最低；右侧是"Solterra Basin Harvest Yield 2025"标题和五档图例，左上有指北针，左下有比例尺。

**常见问题与调整**：
- 颜色深浅和数字对不上：在提示词里逐个写"分区名 + 数值 + 颜色档位"。
- 想做游戏 / 小说地图：把数值去掉，改成"按势力范围上色，每个势力一种颜色"。
- 标签太多太挤：减少到 8 个分区，或"只给最高和最低的分区标数字"。
- 想要中文版：所有地名和图例写中文，并加"文字为简体中文，字体端正"。

**适合**：地理课件、虚构世界地图、区域分析报告示意图；不适合绘制真实国家或行政区划地图。

### 英文原版

```
Produce a polished geographic choropleth map infographic of a fictional agricultural region called the Solterra Basin, showing harvest yield by district. Use a minimalist cartographic style on an off-white background with muted terrain hints and a sequential palette from pale sand to deep green. The map should include 14 clearly separated districts with clean borders, crisp labels, and a right-side legend. Include in-image text: "Solterra Basin Harvest Yield", "2025", and legend title "tons / hectare". Label districts with names such as "North Vale", "Riverbend", "Copper Plain", "East Orchard", and "Cinder Ridge". Include legend values "1.2", "2.4", "3.6", "4.8", and "6.0". Add a compact annotation box reading "Highest yield: East Orchard 5.8" and "Lowest yield: Dry Steppe 1.4". Prioritize clean typography, accurate map-like geometry, balanced composition, subtle cartographic detail, and publication-grade infographic clarity.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
