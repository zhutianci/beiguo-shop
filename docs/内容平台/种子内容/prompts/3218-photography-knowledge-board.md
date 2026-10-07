---
title: 信息图提示词：手机摄影知识板，胶片风格 / 滤镜预设 / 构图 / 常见错误一张图看懂
slug: photography-knowledge-board
model: gpt-image-2
topics: [infographic, photography]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做摄影入门课件、手机摄影账号的干货长图、摄影社团招新海报时，生成一张多栏知识板：每种风格都用对应风格的小样照片展示，信息密集但好扫读。
prompt: |
  用 35mm 胶片风格做一张图表，主题是"[手机摄影]知识板"，面向想认真追求摄影爱好的新手，讲清各种拍摄风格、预设以及需要知道的要点。
  做成内容丰富的多栏参考板，带编号的分区包括：
  - [胶片风格]、数码预设、人像拍法、街头摄影风格；
  - 色温、颗粒、对比度、闪光灯、构图取景；
  - 常见错误、最终提醒。
  每种风格和预设都要用它本身的效果来呈现小样照片，而不是统一成一种风格。
  版面信息密集、教育性强、设计精美、易于扫读；配色以[深炭灰底 + 米黄文字 + 红色警示栏]为主。
  画幅[3:2]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://x.com/Vtrivedy10/status/2046771959157887014
  author: "@Vtrivedy10"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并把分区整理成要点；手机品牌名改为通用的"手机摄影"变量，首个分区和配色设为变量；配色描述按示例图补充
images:
  - 3218-photography-knowledge-board-1.jpg
imageCredit:
  by: "@Vtrivedy10"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/infographics-field-guides/camera-styles-infographic.png
  license: MIT
verify:
  - 确认原帖仍可访问、作者未另行声明保留权利
  - 示例图标题含手机品牌名，胶片栏出现真实胶卷品牌名，展示时确认无商标顾虑
  - 示例图是英文版，换中文版时检查小字是否清晰；图中摄影知识需人工校对后再当教材
---
**怎么填变量**：[手机摄影] 可以换成"微单入门""胶片相机""无人机航拍""美食摄影"，分区跟着主题调整，比如美食摄影改成"光位、餐具、俯拍 / 45° / 平拍、调色、常见错误"；[胶片风格] 换成你想重点讲的模块；配色可以改成"白底 + 黑字 + 黄色重点"更像课件。示例图是英文版：深灰底的"IPHONE PHOTOGRAPHY KNOWLEDGE BOARD"，左侧是胶片风格栏和人像、街头小样照片，中间是数码预设、色温条、颗粒、对比度、闪光灯和构图示意，右侧有"要知道的十件事"和红色的"常见错误"栏。

**常见问题与调整**：
- 中文小字糊成一片：减少分区到 6 个，每个分区只写标题和一句说明。
- 小样照片风格一样：强调"每张小样照片的色调、颗粒、对比都必须明显不同"。
- 想要竖版长图：画幅改 2:3 或 9:16，分区改成"从上到下单列排列"。
- 内容不准确：先自己列好要点，在提示词里逐条写出，让模型只负责排版。

**适合**：摄影入门课件、干货分享长图、社团招新海报；图中知识点由模型生成，发布前需要人工校对。

### 英文原版

```
Make me an image in 35 mm film style of a diagram showing the knowledge of camera styles, presets, and what to know about them as an aspiring iPhone photographer that wants to pursue their passion. Build it as a rich multi-panel reference board with labeled sections for film looks, digital presets, portrait approaches, street photography styles, color temperature, grain, contrast, flash, framing, and common mistakes. Each camera and preset style should appear in its actual style instead of being rendered uniformly in one style. Make it visually dense, highly educational, beautifully designed, and easy to scan.
```

> 改编自 [@Vtrivedy10](https://x.com/Vtrivedy10/status/2046771959157887014) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
