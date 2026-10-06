---
title: 海报样机提示词：把设计稿一键放进地铁灯箱实景（gpt-image-2 改图）
slug: poster-to-metro-lightbox
model: gpt-image-2
topics: [photo-edit, poster]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传自己做好的海报，生成它挂在地铁站灯箱里的实景效果图，用于给客户提案、作品集展示。
prompt: |
  把我上传的海报变成一张真实的[地铁站灯箱]样机图，尽可能保留海报原有的画面和中文排版。
  海报装在一个竖向发光广告框里，前面有一层光滑的玻璃，挂在干净的地铁站台墙面上。
  加入细微的玻璃反光、拉丝金属边框、地砖、柔和的站台顶光，以及远处几位虚化的通勤乘客。
  海报要摆正、清晰可读、占画面主体；不要重新设计海报，不要改动主要文字，不要添加虚构的品牌 Logo。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-edit-endpoint-showcase
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；场景改为变量；明确"上传自己的海报"作为输入
imageBrief: 用本站 122 号提示词生成的海报作输入，分别生成"地铁灯箱"和"商场门口立式海报架"两张样机图。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 海报上的文字在样机图中是否被改动
  - 透视是否正、边框是否完整
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[地铁站灯箱] 可以换成"公交站候车亭广告牌""商场门口的立式海报架""咖啡店墙上的木框画""楼宇电梯里的广告屏"，一张设计稿就能出整套提案样机。

**常见问题**：
- 海报里的字被"重写"变形：这是改图最常见的问题。把"不要改动主要文字"放在第一句，或者让海报在画面中占得更大。
- 海报被拉伸：上传的海报比例要和灯箱比例接近（竖版海报配竖版灯箱）。
- 乘客太清楚、抢画面：保留"远处、虚化"。

**提醒**：样机图只用于展示效果；如果画面里出现真实地铁线路标识，商用前请注意相关规定。

### 英文原版

```text
Transform the provided tea poster into a realistic metro-station lightbox mockup while preserving the poster artwork and Chinese typography as much as possible. Show the poster behind glossy glass in a vertical illuminated advertising frame on a clean subway platform wall. Add subtle reflections, brushed metal frame, floor tiles, soft overhead transit lighting, and a few blurred commuters in the distance. Keep the poster straight, legible, and dominant; do not redesign the poster, do not change its main text, and do not add fake brand logos.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Edit Endpoint Showcase」中的改图示例（海报 → 地铁灯箱），Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)。示例图为 PNG 且超过 1.2MB，未收录。
