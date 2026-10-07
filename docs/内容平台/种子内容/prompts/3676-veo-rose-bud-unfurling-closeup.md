---
title: veo 3 提示词：玫瑰花苞缓缓绽放特写（固定机位 · 渐变演化 · 花店与节日视频素材）
slug: veo-rose-bud-unfurling-closeup
model: veo
topics: [cinematic, product-video]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 一朵紧闭的红玫瑰花苞在镜头里缓缓、优雅地绽放，露出层层花瓣。适合花店、节日营销（情人节、母亲节）、护肤和香水品牌的"绽放"意象镜头，以及视频开场和转场。
prompt: |
  一朵[红玫瑰]花苞的特写，花瓣紧紧闭合，竖屏 9:16，约 8 秒。
  机位保持静止，在整个镜头里，花朵缓慢而优雅地舒展开，露出鲜艳的内层花瓣。
  这种演化是细腻的，变化清晰但循序渐进。
  画面：深色背景，柔和的侧光勾出花瓣边缘，花瓣上挂着几颗细小的露珠，浅景深。
  声音：几乎无声，只有极轻的环境声。
negativePrompt: 花朵变形，花瓣数量突变，镜头移动，背景杂乱，文字，水印
source:
  repo: Google Cloud 文档：Veo 视频生成提示词指南
  url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文并补充了背景、光线、露珠和声音；花的品种设为变量；画幅改为竖屏"
imageBrief: 站长生成 1 条，截取花苞、半开、盛开三帧。
verify:
  - Veo 3.1 实测 3 次：绽放过程是否连续自然、花瓣是否保持玫瑰的形态
---
**时长与镜头**：8 秒、固定特写，全部变化都在花朵本身。Google 指南把它作为"演化（evolution）"类时间元素的示例，并提醒：短视频里的演化要"细腻"，一个 8 秒镜头里写"花苞缓缓张开"比写"从种子长成大树"可靠得多。

**怎么用**：花开是广告里经典的"绽放"隐喻——护肤品可以接在"肌肤焕亮"的画面前，香水可以接在"香气散开"前，节日营销可以做开场。竖屏 9:16 适合手机端，横屏做背景可改 16:9。

**怎么填变量**：[红玫瑰] 换成"白色栀子花""粉色牡丹""昙花（夜晚背景）"；想要更梦幻，可以把背景换成"淡粉色渐变"，把光线换成"逆光，花瓣边缘透光"。

**常见失败与调整**：
- 绽放得太快像爆开：保留"缓慢而优雅""循序渐进"。
- 花瓣越开越多、不像玫瑰：写"花朵始终是同一朵玫瑰，形状自然"。
- 背景出现其他花：写"画面里只有这一朵花，背景纯净"。

> 改编自 Google Cloud 官方文档《[Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A close-up of a single red rose bud, its petals tightly closed. The camera remains static as the flower slowly and gracefully unfurls over the course of the shot, revealing its vibrant inner layers. The evolution is subtle, showing a clear but gradual change
```
