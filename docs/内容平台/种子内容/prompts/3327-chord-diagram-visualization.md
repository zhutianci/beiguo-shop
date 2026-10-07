---
title: 信息图提示词：数据新闻风弦图（区域流向 + 半透明飘带 + 刻度图例）
slug: chord-diagram-visualization
model: gpt-image-2
topics: [infographic, ppt]
needsRefImage: false
aspectRatio: "1:1"
useCase: 想给"人口迁移、贸易往来、资金或能源流向"这类主题配一张好看的弦图示意时用，得到象牙白底、几何精准、标签清楚的出版物风格方图。
prompt: |
  生成一张出版物质量的弦图，展示虚构的[2025 年区域能源流向]。
  - 明亮的象牙白背景，圆环居中构图；
  - 配色和谐：钴蓝、青绿、赭黄、珊瑚红、梅紫、石墨灰；
  - 看起来数学上精确：干净的外圈弧段、半透明的飘带、清晰易读的标签；
  - 顶部标题："[区域能源交换]"，副标题："[单位：太瓦时，2025]"；
  - 外圈分段标注：[北部、南部、东部、西部、沿海、电网储备]；
  - 右上角小图例：[水电、光伏、风电、储能]；
  - 圆环外侧有细小刻度："0""50""100""150"；
  - 用飘带粗细表示流量大小，但整体保持清爽、优雅、好读；
  - 优先保证标签清晰、层级分明、几何准确、留白均衡，走精致的数据新闻风格，而不是普通信息图模板；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-data-visualization.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；主题、标题、副标题、分段名、图例设为变量，画面文字改为中文版；补充方形画幅
images:
  - 3327-chord-diagram-visualization-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/data-visualization/chord-diagram-energy-flows.png
  license: MIT
verify:
  - 中文分段名出一次，检查文字是否沿圆环正确排布、无错字
  - 提醒用户飘带粗细只是示意，不对应真实数据
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[2025 年区域能源流向] 换成你的主题，例如"各省人口流动""五大部门预算往来""城市间航班客流"；外圈分段写 4～8 个对象，名字尽量短；图例按流动的种类改，比如"就业、求学、探亲"。示例图是一张米白底的英文弦图：顶部大标题和"TWh, 2025"副标题，外圈六段分别是蓝、青、紫、青绿、橙、红，每段旁边配一个小图标（山、楼、电池、海浪、太阳、风车），中间是交错的半透明飘带，右上角有四色图例。示例图是英文版。

**常见问题与调整**：
- 飘带太多太乱：减少分段数到 4～5 个，加"只画最主要的 10 条流向"。
- 刻度和数字对不上：弦图里的数字是装饰，可要求"去掉刻度数字，只保留分段名"。
- 想用于深色 PPT：背景改"深海军蓝"，飘带改为"发光半透明"。
- 分段名称被挤歪：要求"分段名水平书写，放在圆环外侧并配小图标"。

**适合**：报告封面、数据新闻配图、课程讲义示意图；不适合用来展示真实统计结果，正式数据请用专业图表工具绘制。

### 英文原版

```
Create a publication-quality chord diagram visualizing fictional regional energy flows in 2025. Use a bright ivory background with a centered circular composition and a harmonious palette of cobalt, teal, ochre, coral, plum, and graphite. The diagram should feel mathematically precise, with clean arcs, semi-transparent ribbons, and highly legible labels. Add a title block with the in-image text "Regional Energy Exchange" and subtitle "TWh, 2025". Label outer segments "North", "South", "East", "West", "Coastal", and "Grid Reserve". Include a small legend reading "Hydro", "Solar", "Wind", and "Storage". Place tiny numeric ticks around the ring at "0", "50", "100", and "150". Use ribbon thickness to imply volume, but keep the composition readable and elegant. Prioritize crisp labels, clear hierarchy, accurate geometry, balanced white space, and a refined data-journalism aesthetic rather than generic infographic styling.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
