---
title: 数据可视化 AI 提示词：公司年度预算矩形树图，部门占比 + 子项拆分 + 总额侧栏
slug: treemap-budget-infographic
model: gpt-image-2
topics: [infographic, ppt]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做年度预算汇报 PPT、财务科普配图或数据可视化练习时，生成一张配色克制的矩形树图：大块是部门占比，小块是子项，右侧放总预算图例，一眼看出钱花在哪。
prompt: |
  设计一张现代风格的矩形树图（treemap）信息图，展示虚构公司"[LUMEN BIO]"在[2026 财年]的预算分配。
  - 背景：浅中性色；配色克制，用[森林绿、灰蓝、琥珀、赤陶、薰衣草灰]，炭灰色描边；
  - 构图：干净的矩形树图，分组清晰，字体锐利；
  - 标题区：公司名 + "[Budget Allocation]"，下方小字"[FY 2026]"；
  - 主要区块标注：R&D 38%、Manufacturing 22%、Clinical 14%、Operations 10%、Marketing 7%、IT 5%、Legal 4%（可按需替换为[你的部门与占比]）；
  - 部分区块内再细分小标签，如 Prototypes、Reagents、QA、Cloud、Field Trials；
  - 侧边紧凑图例写"Total Budget [$84.0M]"；
  - 边缘精确、标注密度均衡、层级清楚、文字渲染锐利。
  画幅[3:2]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-data-visualization.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；公司名、财年、配色、标题、部门占比、总额、画幅设为变量；补充了常见问题与改法
images:
  - 3221-treemap-budget-infographic-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/data-visualization/treemap-startup-budget-allocation.png
  license: MIT
verify:
  - 区块面积是否与百分比成比例需人工检查，模型常画不准
  - 换成中文部门名出一次，看小区块里的文字是否清晰
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[LUMEN BIO] 换成你的公司或项目名，如"[星河科技]"；[你的部门与占比] 直接写成"研发 40%、市场 25%、运营 20%、行政 15%"，部门控制在 7 个以内更容易画准；总额 [$84.0M] 换成"[1200 万元]"。也可以把主题换成"家庭年度开支""App 用户来源占比"。示例图是仓库作者的出图：左上角是"LUMEN BIO Budget Allocation FY 2026"标题，左侧最大的深绿块是 R&D 38%，下面再分 Prototypes、Reagents、QA，旁边是蓝色 Manufacturing 22%、琥珀色 Clinical 14%、赤陶色 Operations 10%、紫灰色 Marketing 7%，右侧白色侧栏写着 Total Budget $84.0M 和各部门图例。

**常见问题与调整**：
- 面积和百分比对不上：模型不会精确计算，正式汇报建议先用表格软件生成树图，再让 AI 美化。
- 小块文字挤不下：加"占比小于 5% 的区块只写名称，不写金额"。
- 想换成中文：把所有标签写成中文，并加"所有文字为简体中文"。
- 要配 PPT 深色模板：改成"深色背景，区块用高饱和色，白色文字"。

**适合**：预算汇报 PPT、财务科普配图、数据可视化风格参考；图中数值为示意，正式材料请以真实数据重新核对面积比例。

### 英文原版

```
Design a modern treemap infographic showing a fictional company budget allocation for LUMEN BIO in fiscal year 2026. Use a light neutral background and a controlled palette of forest green, desaturated blue, amber, terracotta, lavender-gray, and charcoal outlines. The composition should be a clean rectangular treemap with strong visual grouping and crisp typography. Include a header with the in-image text "LUMEN BIO Budget Allocation" and "FY 2026". Major blocks should be labeled "R&D 38%", "Manufacturing 22%", "Clinical 14%", "Operations 10%", "Marketing 7%", "IT 5%", and "Legal 4%". Within some blocks, add smaller labels like "Prototypes", "Reagents", "QA", "Cloud", and "Field Trials". Include a compact side legend reading "Total Budget $84.0M". Ensure the chart has precise edges, balanced annotation density, clean hierarchy, and sharp text rendering suitable for a technical gallery prompt.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
