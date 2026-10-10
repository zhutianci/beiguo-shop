---
title: "漫画背景提示词：把房间草图变成网点黑白漫画背景原稿（gpt-image-2）"
slug: rough-sketch-to-manga-background
model: gpt-image-2
topics: [comic]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张手画的房间 / 场景透视草图（可以有红色标注），让模型保持一点透视构图，重画成干净线稿、网点、排线完整的黑白漫画背景，放在漫画原稿纸上，适合漫画作者赶稿、分镜参考和背景素材。"
prompt: |
  以我上传的参考图作为漫画背景的粗略布局，把草图转成一张精致的黑白漫画分格背景。
  保持同样的一点透视构图和草图里的所有物件（例如：前景两侧两张床、中间一块地垫通向凹进去的门、左墙挂钟、放书的架子、靠在左床边的吉他、右墙的海报 / 布告板区域、右侧的盆栽和小箱子）。
  把松散的红色标注和粗糙的构造线替换成干净的完成线稿：准确的透视、细致的房间物件、网点阴影、交叉排线、网点渐变和整齐的漫画质感。
  加入草图里没有但合理的细节：门口一带的木地板、床上皱起的被褥褶皱、床上和地上的小纸张和书、钉着便条的软木板、右侧的购物袋 / 垃圾桶，以及门洞周围细微的墙面阴影。
  把成品呈现为一页竖版漫画原稿上的单格，居中放在淡紫色的原稿纸边框里，带裁切标记和页面参考线。
  不要保留任何可读的标注或红色手写字；结果应该像一张专业的黑白漫画背景，只差最后的人工修饰。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/poibot_tec/status/2095830290652635542
  author: "ぽいtec"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文针对特定草图逐项列出的物件改写为\"保留草图中的物件\"并作为示例保留"
images:
  - 3134-rough-sketch-to-manga-background-1.jpg
imageCredit:
  by: "ぽいtec"
  url: https://youmind.com/gpt-image-2-prompts?id=33546
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传你的草图即可，透视线和物件位置画得越清楚越好，可以用红笔标出"这里是门""这里放吉他"。提示词里"例如"后面的物件清单是原作者草图里的内容，换成你草图里的物件效果更准。不想要原稿纸边框，就删掉倒数第二段，直接输出背景图。

示例图是一页淡紫色漫画原稿纸，中间一格黑白网点背景：一点透视的宿舍房间，左右两张床，中间地垫通向一扇门，左墙挂钟和书架、左床边靠着吉他，右墙软木板钉着便条，右侧有盆栽和袋子，排线和网点很完整。

**常见问题**：
- 透视跑偏：在提示词里写明"消失点在门的中央"。
- 留下了红色标注：重复"不要保留任何标注文字"。
- 网点太脏：写"网点只用于大面积阴影，线稿保持干净"。

**适合**：漫画作者赶稿、分镜 / 背景参考、网点素材练习、漫画教学。

### 英文原版

```text
Using REFERENCE_0 as a rough manga background layout, convert the sketch into a polished black-and-white manga panel background. Keep the same one-point perspective composition: two beds framing the foreground, a central floor mat leading to a recessed door, a wall clock on the left, a shelf with books, a guitar leaning on the left bed, a poster/bulletin-board area on the right wall, and a potted plant plus small boxes/items on the right. Replace the loose red annotations and rough construction lines with clean finished line art, accurate perspective, detailed room objects, screentone shading, crosshatching, halftone gradients, and tidy manga-style textures. Add believable details not present in the sketch: wood plank flooring in the doorway area, rumpled bedding folds, small papers/books on the beds and floor, a corkboard with pinned notes, a shopping bag/bin near the right side, and subtle wall shadows around the doorway. Present the finished art as a single vertical manga page panel centered on a pale lavender manuscript-paper border with crop marks and page guide lines. No readable labels or red handwriting should remain; the result should look like a professional monochrome comic background ready for final human touch-up.
```

> 改编自 [ぽいtec](https://x.com/poibot_tec/status/2095830290652635542) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
