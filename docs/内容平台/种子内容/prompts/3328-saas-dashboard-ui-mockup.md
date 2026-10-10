---
title: UI设计提示词：桌面端 SaaS 运营仪表盘高保真样机（KPI 卡 + 折线图 + 告警 + 数据表）
slug: saas-dashboard-ui-mockup
model: gpt-image-2
topics: [product-design, ppt]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做产品提案、路演 PPT、需求评审时需要一张"看起来像真产品"的后台仪表盘截图，用它可以快速得到布局规整、数字和标签都清楚的桌面端界面样机。
prompt: |
  生成一张高端桌面端 SaaS 数据分析仪表盘样机，产品是虚构平台"[产品名]"，16:10 显示器画布。
  - 配色偏冷：石板灰、钴蓝、青绿、浅灰和白色，带细微的毛玻璃面板，网格对齐严格；
  - 布局：左侧导航栏、顶部筛选栏、一排 KPI 卡片、折线图、数据表和告警面板；
  - 字体锐利、标签准确，画面中出现："[产品名]""[运营总览]""近 30 天"；
  - KPI 卡片：[可用率 99.982%]、[工单 184]、[延迟 42 ms]、[转化率 6.4%]；
  - 折线图横轴从"4 月 1 日"到"4 月 30 日"；一个环形图，标题"流量来源"；
  - 数据表列名："站点""状态""区域""负载"；
  - 告警标签："3 个严重""12 个警告"；
  - 整体真实、可直接放进汇报，层级清晰、间距精确、留白均衡，界面渲染极其锐利；
  - 画幅[3:2]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ui-ux-mockups.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；虚构产品名、页面标题、四个 KPI 设为变量，界面文字改为中文版；删去具体像素尺寸
images:
  - 3328-saas-dashboard-ui-mockup-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/uiux-mockups/desktop-analytics-dashboard-operations.png
  license: MIT
verify:
  - 中文界面版出一次，检查导航、表头和 KPI 文字是否有错字
  - 换成电商后台 / 教务系统主题各出一次，看布局是否仍然规整
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[产品名] 写你的产品或项目名；[运营总览] 换成页面名，比如"销售看板""门店数据中心"；四个 KPI 按业务改，电商可以写"GMV 128 万""订单 3,420""客单价 376""复购率 18%"，教育产品写"在读学员""完课率""续费率""满意度"。示例图是白底蓝色调的英文仪表盘：左边深蓝侧栏有 Overview、Monitoring 等菜单，顶部四张 KPI 卡带小走势线，中间一张 4 月份的可用率折线图，右侧红黄两条告警和一张流量来源环形图，下方是五行站点状态表。示例图是英文版。

**常见问题与调整**：
- 文字太小糊成一片：减少表格行数，加"表格只要 4 行，字号放大"。
- 想要深色模式：把配色改成"深灰背景、青绿高亮"，并加"暗色主题"。
- 想要移动端：画幅改 9:16，布局改成"顶部 KPI 横滑卡片 + 下方折线图 + 告警列表"。
- 生成后还要改：把它当视觉参考交给设计师，或追问"保持布局，只把主色换成[品牌色]"。

**适合**：路演 / 提案 PPT 的产品示意图、需求文档的界面草图；不适合直接当可开发的设计稿，组件尺寸和数据都需要设计师重新落地。

### 英文原版

```
Create a high-end desktop SaaS analytics dashboard mockup for a fictional platform named HELIX OPS, displayed on a 16:10 monitor canvas at 1600x1000. Use a cool palette of slate, cobalt blue, teal, pale gray, and white, with subtle glass panels and tight grid alignment. The layout should include a left sidebar, top filter bar, KPI cards, line charts, data table, and alert panel. Use crisp typography and correct labels. Include in-image text: "HELIX OPS", "Operations Overview", "Last 30 Days", "Uptime 99.982%", "Tickets 184", "Latency 42 ms", and "Conversion 6.4%". Show a line chart labeled "Apr 1" through "Apr 30", a donut chart titled "Traffic Sources", and a table with columns "Site", "Status", "Region", and "Load". Add alert pills reading "3 Critical" and "12 Warning". Composition should feel realistic and presentation-ready, with clean hierarchy, precise spacing, balanced negative space, and ultra-sharp dashboard UI rendering.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
