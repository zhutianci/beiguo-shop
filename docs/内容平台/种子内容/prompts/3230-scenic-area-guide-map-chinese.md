---
title: 信息图提示词：中文景区游览导览图，水墨山峰 + 索道步道 + 海拔剖面 + 安全提示（华山示例）
slug: scenic-area-guide-map-chinese
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做景区攻略配图、旅行账号路线图、研学手册插图时，输入一个山岳景区，生成一张水墨插画风的中文导览图：山峰、索道、步道、观景台、服务设施和安全提示都标好。
prompt: |
  为[华山]设计一张精致的中文景区游客导览图，标题用清晰的中文"[华山游览导览图]"，副标题"[山岳风景名胜区]"。
  - 风格：横版高端插画地图，适合游客中心宣传册；
  - 画面：险峻的山脊、索道线路、登山步道、景点节点和安全图标；
  - 标签清晰可读："[北峰]"、"西峰"、"南峰"、"东峰"、"中峰"、"游客中心"、"索道"、"栈道"、"观景台"、"卫生间"、"急救点"；
  - 元素：小图例、不同颜色的路线、海拔提示、指北针，以及一个简短提示"[请量力而行 注意安全]"；
  - 配色：水墨山色灰、松绿、日出金、朱砂红路线标记，干净的黑色中文字体；
  - 要实用、美观、有中国文化气质，适合做景区导览展板；不要伪造的官方印章，不要赞助商 logo。
  画幅[3:2] 横版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-events-and-experience.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；景区名、标题、副标题、首个景点、安全提示、画幅设为变量；原文副标题中的官方等级称号改为通用说法，去掉像素尺寸参数
images:
  - 3230-scenic-area-guide-map-chinese-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/events-experience/huashan-5a-scenic-wayfinding-map.png
  license: MIT
verify:
  - 示例图副标题含官方景区等级称号，且海拔、路线是模型生成的，展示时注明"AI 示意图，非官方导览"
  - 换成"黄山""泰山"出一次，看中文景点名是否写对
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[华山] 换成任何山岳或景区，如"黄山""峨眉山""张家界"；景点标签 [北峰] 那一行一定要换成该景区真实的景点名，如黄山写"光明顶、迎客松、西海大峡谷、玉屏索道"，否则模型会乱编；标题和副标题跟着改；安全提示可以写"[雨天路滑 请勿攀爬护栏]"。示例图是仓库作者的出图：左上大字"华山游览导览图"和一段简介，水墨山峰上分布着北峰、西峰、中峰、东峰、南峰的红色标签和海拔数字，红、橙、绿虚线是不同路线，两侧画着索道缆车，底部是游客中心，左下有图例和海拔剖面小图，右下是"请量力而行 注意安全"提示和登山者剪影。

**常见问题与调整**：
- 景点名乱编：把所有要出现的景点名逐个写进提示词，并加"只使用以上地名"。
- 海拔数字不准：去掉海拔，或自己查好数据后逐个写上。
- 中文字体歪斜：加"标题用书法体，其余标签用端正的黑体"。
- 想做竖版手机攻略图：画幅改 3:4，加"下方留一栏写推荐路线和用时"。

**适合**：景区攻略配图、旅行账号路线图、研学手册插图；位置和海拔为示意，不能替代景区官方导览图，出行请以景区公布信息为准。

### 英文原版

```
Design a polished Chinese 5A scenic-area visitor navigation map for Huashan, titled with crisp Chinese text "华山游览导览图" and subtitle "国家5A级旅游景区". Landscape 3:2 orientation (1536×1024), premium illustrated map style for a visitor center brochure. Show dramatic mountain ridges, cable car routes, trail paths, scenic nodes, and safety icons. Include readable labels: "北峰", "西峰", "南峰", "东峰", "中峰", "游客中心", "索道", "栈道", "观景台", "卫生间", "急救点". Add a small legend, route colors, elevation hints, north arrow, and a compact note "请量力而行 注意安全". Palette: ink-wash mountain gray, pine green, sunrise gold, cinnabar red route marks, and clean black Chinese typography. Make it practical, beautiful, culturally Chinese, and suitable for a tourism wayfinding panel; no fake official seals, no sponsor logos.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
