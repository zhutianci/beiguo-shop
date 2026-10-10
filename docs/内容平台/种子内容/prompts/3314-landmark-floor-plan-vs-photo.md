---
title: 建筑效果图提示词：古建筑左右对比图，左边平面 + 剖面蓝图、右边黄金时刻实景鸟瞰
slug: landmark-floor-plan-vs-photo
model: nano-banana
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做建筑史 / 世界遗产科普视频封面、历史课件、博物馆展板时，输入一个著名建筑，生成左右分屏对比图：左半是带标注的平面图和剖面图，右半是同一建筑的写实航拍照，直观展示"图纸 vs 真身"。
prompt: |
  一张 16:9 宽屏的左右分屏对比图，左右两半界限清晰。
  左半：[古罗马斗兽场]的建筑平面图和剖面图，现代极简的建筑表现风格。
  - 俯视正投影平面图，显示主要结构布局、内部分区、通行流线和主要空间，并附标注文字；
  - 下方附一张剖面图，表现竖向层次和内部结构，标出材料和结构支撑；
  - 配色为中性米色和[暖灰色]，线条干净，阴影柔和，蓝图般的技术准确感。
  右半：同一建筑的超写实航拍外景照片。
  - 从斜上方约 45 度俯视（不是正上方），完整呈现建筑全貌和周边环境；
  - 真实的风化纹理和岁月痕迹，[黄金时刻]的阳光投下清晰阴影，空气中有淡淡薄雾，凸显历史感和宏伟尺度。
  两半在视觉上对齐，像博物馆展陈一样，体现"工程图纸与真实建筑"的对照；左右整体保持一致的暖色调。
  避免：卡通风格、细节粗糙、构图杂乱、现代元素、比例失真、光线刺眼、颜色夸张、水印、CG 感、正上方俯视、过于崭新。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/TechieBySA/status/2018029876356239823
  author: "@TechieBySA"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并压缩为左半 / 右半 / 整体三段，合并原文重复的风格、光线和镜头说明；地标、辅助色、光线时段设为变量；原文负面提示词并入末尾"避免"一句
images:
  - 3314-landmark-floor-plan-vs-photo-1.jpg
imageCredit:
  by: "@TechieBySA"
  url: https://images.meigen.ai/tweets/2018029876356239823/0.jpg
  license: CC BY 4.0
verify:
  - 左半平面图和剖面图是模型的示意绘制，结构细节不一定准确，页面提醒不能当作学术资料
  - 换成"天坛祈年殿""应县木塔"测一次，看对中国古建的还原度
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[古罗马斗兽场] 换成任何结构有特点的著名建筑，比如"天坛祈年殿""埃及金字塔""故宫太和殿""赵州桥"；[暖灰色] 是图纸辅助色，想要经典蓝图感可改成"深蓝底白线"；[黄金时刻] 可换"清晨薄雾""雪后晴天"。示例图左半是米色纸上的椭圆形平面图，一圈圈看台和中央场地都有小字标注，下方是一条长剖面图；右半是夕阳下斗兽场的斜上方航拍，残缺的外墙、拱廊和内部看台清晰可见，周围有道路、柏树和远山。

**常见问题与调整**：
- 右半变成正上方俯视：再强调"斜上方 45 度，能看到建筑立面"。
- 左右不是同一个建筑：加"左右两边是同一座建筑，外形轮廓一一对应"。
- 标注文字乱码：改成"标注用短英文单词或编号"，再在后期替换成中文。
- 想做竖版：改成"上下分屏，上半图纸、下半实景"，画幅 3:4。

**适合**：建筑史科普封面、历史 / 地理课件、展板设计；不适合作为测绘或学术研究的依据。

### 英文原版

```
Split composition image, left and right halves clearly divided in 16:9 widescreen format.
Left Half:
Highly detailed architectural floor plan and cross-section illustration of [LANDMARK] in a modern minimalist style. Top-down view showing main structural layout, internal divisions, circulation paths, key chambers or spaces with labels. Material callouts, structural support systems, and architectural details clearly marked. Neutral beige and warm gray color palette, clean linework, soft shadows, subtle textures. Professional architectural-presentation style. Include detailed cross-sectional diagram showing vertical layers and internal structure. Blueprint aesthetic with technical accuracy and labeled sections.
Right Half:
Ultra-realistic aerial exterior photograph of [LANDMARK] captured from above and to the side (elevated isometric perspective, not straight overhead). Shows the complete structure with authentic weathered textures, aged materials, surrounding landscape, dramatic golden-hour sunlight creating sharp shadows, atmospheric haze suggesting historical significance. The perspective reveals both external grandeur and internal scale simultaneously. Warm golden-light lighting, realistic patina and wear patterns, authentic architectural proportions. Feels like an aerial photograph capturing the monument’s true majesty and scale.
Both halves align visually, clearly showing architectural engineering blueprint vs. the actual monumental structure in its archaeological or historical reality.
Style & Mood:
•Architectural blueprint visualization meets historical aerial photography
•Engineering precision and historical significance
•Educational, museum-exhibit presentation
•Engineering schematic-to-reality comparison
•Grandeur emphasizing scale and architectural sophistication
Lighting & Color:
•Left: Flat, even lighting, neutral blueprint tones, technical aesthetic
•Right: Golden-hour natural light, dramatic shadows, warm tones, atmospheric depth
•Consistent warm palette between both halves
Camera & Technical Details:
•Left: Top-down orthographic + detailed cross-sectional architectural view with labeled sections
•Right: Elevated aerial perspective (45-degree isometric angle), capturing full structure from above-and-to-the-side
•High resolution, sharp architectural details on left; photorealistic weathered textures on right
Negative Prompt:
Cartoon style, low detail, cluttered composition, modern elements, unrealistic proportions, harsh lighting, exaggerated colors, text overlays, watermarks, CGI look, sterile rendering, straight-down overhead view, no atmospheric quality, overly pristine condition
```

> 改编自 [@TechieBySA](https://x.com/TechieBySA/status/2018029876356239823) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
