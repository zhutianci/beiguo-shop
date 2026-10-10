---
title: UI设计提示词：记账理财 App 首页手机样机，余额卡+周支出柱状图+交易列表（gpt-image-2）
slug: finance-app-ui-mockup
model: gpt-image-2
topics: [product-design]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做 App 概念稿、产品路演 PPT、作品集封面时，一句话生成一张正面手机样机里的完整理财首页，层级清楚、数字和按钮文字都能读。
prompt: |
  设计一张精致的移动端[理财记账 App]首页样机，展示在一部正面放置的竖屏手机里，背景是柔和的米白色，手机带轻微投影。
  - 配色：[深海军蓝、薄荷绿、暖灰和白色]，整体冷静干净；
  - 顶部：应用名"[应用名]"、问候语"[早上好，小林]"、总余额"[总余额 ¥86,480.36]"；
  - 三个汇总卡片："[收入 +¥12,000]""[支出 -¥5,830]""[储蓄率 32%]"，各配一个小图标；
  - 中部：本周支出柱状图，横轴"周一 周二 周三 周四 周五 周六 周日"，其中一天用薄荷绿高亮；
  - 下部：最近交易列表，例如"[地铁月卡 ¥180]""[轻食沙拉 ¥42]""[房租 ¥4,200]"，每行带分类图标和日期；
  - 底部导航："首页""卡片""预算""我的"。
  字体清晰、间距干净、圆角卡片、图标对齐精确，像可交付的真实 App 设计稿，画幅[2:3]竖版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ui-ux-mockups.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；应用名、问候语、金额、交易项改为人民币示例并设为变量；删掉像素尺寸参数；补充了常见问题与改法
images:
  - 3247-finance-app-ui-mockup-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/uiux-mockups/mobile-budgeting-app-neobank.png
  license: MIT
verify:
  - 示例图是英文美元版，中文人民币版建议出一次，看金额小数点和中文标签是否清楚
  - 手机外形接近常见全面屏机型，展示时确认没有出现任何手机品牌标识
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[应用名] 写你的产品名（虚构的更安全）；金额和交易项换成你的场景，如"[地铁月卡 ¥180]"换成"外卖 ¥36""健身房 ¥299"；配色换成"[暖橙、奶白、深棕]"就变成更温暖的风格。示例图是英文美元版：顶部"AURAE"字样和问候语，大号余额数字，三张收入 / 支出 / 储蓄小卡，柱状图里周五那根是薄荷绿，下方三条交易记录，底部四个导航图标。

**常见问题与调整**：
- 数字小数点或逗号错位：金额写短一点，并加"所有数字等宽字体，右对齐"。
- 界面太空或太挤：指定"首页只放 5 个模块"，或追问"去掉柱状图，换成环形预算进度"。
- 想要多屏展示：改成"三部手机并排，分别显示首页、预算页、账单详情页"，画幅换 16:9。
- 要暗色模式：加"深色模式，背景 #111，卡片深灰，强调色薄荷绿"。

**适合**：App 概念稿、路演 PPT、设计作品集封面；不适合直接当作可开发的标注稿，细节仍需在设计工具里重做。

### 英文原版

```
Design a polished mobile finance app UI mockup for a fictional neobank called AURAE, shown on a 1290x2796 smartphone screen, front-facing, with a soft off-white background and subtle shadow. Use a calm palette of deep navy, mint green, warm gray, and white. Create a complete home screen with crisp typography, clean spacing, rounded cards, and precise icon alignment. Include a top header with the in-image text "AURAE", "Good morning, Lina", and "Total balance $12,480.36". Add three summary chips labeled "Income +$4,200", "Spent -$1,830", and "Saved 32%". Show a weekly spending bar chart labeled "Mon Tue Wed Thu Fri Sat Sun" and a recent transactions list with "Metro Pass $18.50", "Green Bowl $14.20", and "Rent $1,240.00". Include a bottom nav with "Home", "Cards", "Budget", and "Profile". Prioritize crisp UI hierarchy, realistic mobile app styling, sharp labels, and production-quality mockup presentation.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
