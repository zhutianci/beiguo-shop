---
title: 数据可视化 AI 提示词：12 城市气候小多图，温度折线 + 降水柱状一页对比
slug: small-multiples-climate-chart
model: gpt-image-2
topics: [infographic, ppt]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做 PPT 配图、地理课件、报告封面或数据可视化练习时，生成一张白底、坐标统一的 4×3 小多图海报，每格是一座城市的月度温度折线和降水柱状图，适合展示"对比"这类版式。
prompt: |
  制作一张干净的编辑风数据可视化海报：4×3 的小多图网格，展示 12 座[虚构城市]的月度气候图。
  - 版面：白色背景，留白充足；配色克制，用[藏青、铁锈红、天蓝、橄榄绿、炭灰]；
  - 每个小图：一条温度折线 + 降水柱状图，坐标轴保持一致，标签非常清晰；
  - 标题区："[Climate Profiles]"，副标题"[12 Cities, 2025]"；
  - 各格城市名：[Northport]、Solmere、Aster Bay、Ridgefall、Halcyon、Verdin、Glass Harbor、Red Mesa、Moonfield、Lake Arden、Cinder Point、Juniper；
  - 月份标签"J F M A M J J A S O N D"，坐标轴标签"Temp °C"和"Rain mm"；
  - 图例数值"0""10""20""30""100"；
  - 整体高度结构化、科学清晰、优雅，字体锐利、刻度对齐，达到出版级图表渲染。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-data-visualization.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；城市类型、配色、标题、副标题、首个城市名、画幅设为变量；补充了常见问题与改法
images:
  - 3220-small-multiples-climate-chart-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/data-visualization/small-multiples-climate-grid.png
  license: MIT
verify:
  - 生成的折线和柱子是示意数据，不对应真实气候，展示时注明"虚构数据"
  - 换成中文城市名和中文坐标轴出一次，看 12 个小标题是否都写对
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[虚构城市] 可以换成"12 个省会城市""6 个门店 × 2 年"，城市名那一行跟着改；也可以把主题整体换掉，比如"12 个月份的销售额折线 + 订单量柱状"。标题和副标题换成中文如"[全年气候概览]""[12 座城市]"。示例图是仓库作者的出图：白底藏青色大标题"Annual Climate Profiles"，下面 4 列 3 行共 12 个小图，每格是红色带点的温度折线和蓝色降水柱，城市名从 Northport 到 Juniper，底部有统一图例，右下角小字标明数据来源为虚构。

**常见问题与调整**：
- 坐标刻度各格不一样：强调"所有小图使用完全相同的纵轴范围和刻度"。
- 数字或字母写错：减少文字，"每格只保留城市名，坐标轴标签只在第一列显示"。
- 想用真实数据：模型画不准具体数值，建议用表格软件画好图，再让 AI 只做排版和美化。
- 要深色版：改成"深藏青背景，浅色线条，适合深色 PPT 模板"。

**适合**：PPT 配图、地理课件、数据可视化风格参考；图中数值是示意，不能当真实统计数据使用。

### 英文原版

```
Produce a clean editorial data visualization poster showing a 4x3 small-multiples grid of monthly climate charts for 12 fictional cities. Use a white background, generous margins, and a restrained palette of navy, rust, sky blue, olive, and charcoal. Each mini-panel should contain a temperature line and precipitation bars with consistent axes and ultra-legible labels. Include a title block with the in-image text "Annual Climate Profiles" and subtitle "12 Cities, 2025". Label panels "Northport", "Solmere", "Aster Bay", "Ridgefall", "Halcyon", "Verdin", "Glass Harbor", "Red Mesa", "Moonfield", "Lake Arden", "Cinder Point", and "Juniper". Use month labels "J F M A M J J A S O N D" and axis labels "Temp °C" and "Rain mm". Add numeric legend values "0", "10", "20", "30", and "100". Keep the composition highly structured, scientifically clear, and visually elegant, with crisp typography, aligned scales, and publication-grade chart rendering.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
