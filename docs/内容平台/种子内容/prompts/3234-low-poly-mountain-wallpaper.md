---
title: 壁纸提示词：低多边形雪山日落桌面壁纸，几何切面光影 + 条纹天空 + 三角松林
slug: low-poly-mountain-wallpaper
model: gpt-image-2
topics: [wallpaper, illustration]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做电脑桌面壁纸、PPT 背景、科技风海报底图时，生成一张完全由平涂多边形组成的雪山日落风景：没有曲线和渐变，靠切面角度表现明暗，干净又有数学感。
prompt: |
  一幅完全由锐利、平涂的几何多边形构成的风格化风景插画。
  - 主体：日落时分的一列[雪顶山脉]；
  - 规则：每个面都是三角形或四边形，没有曲线和渐变；
  - 光影：由多边形的朝向决定明暗，形成分明的受光面和背光面；
  - 配色：从山谷里的[深靛蓝]过渡到山峰上的火红和金色；
  - 前景：一片低多边形松林，用简单的绿色四面体表示；
  - 天空：一条条水平色带，太阳由同心的黄色圆环组成，也是低多边形；
  - 质感：让人想起早期 3D 电子游戏的美学，但呈现为现代高分辨率的精致效果；
  - 氛围：干净、数字化，在数学般的简洁里透出一种奇妙的宁静。
  画幅[3:2]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-more-illustration-styles.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；山景主体、暗部主色、画幅设为变量；补充了常见问题与改法
images:
  - 3234-low-poly-mountain-wallpaper-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/more-illustration-styles/low-poly-mountain-voyage.png
  license: MIT
verify:
  - 换成 16:9 和 9:16 各出一次，看是否适合电脑和手机壁纸
  - 示例图山顶积雪呈金黄色而非白色，确认是否需要在提示词里强调"雪顶为白色"
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[雪顶山脉] 可以换成"海边悬崖与灯塔""沙漠中的金字塔群""城市天际线"；[深靛蓝] 换成"墨绿""暗紫"，再把山峰的颜色改成"粉橙""冰蓝"，就是另一套日出或冬夜配色。示例图是仓库作者的横版出图：天空由深蓝、紫、红、橙、黄的水平条纹组成，右侧太阳是一圈圈黄色多边形，中央主峰被夕阳照成金橙色，往下渐变成紫蓝色的山谷，前景是一排排绿色三角形松树。

**常见问题与调整**：
- 出现渐变或圆滑曲线：强调"严格平涂色块，相邻面颜色明显不同，不允许任何渐变"。
- 面太碎像噪点：加"多边形数量适中，主峰由 30 个左右大三角面组成"。
- 想当手机壁纸：画幅改 9:16，加"山峰放在画面下半部，上方留出天空放时间"。
- 想要夜景：改成"月夜，深蓝紫天空，白色低多边形月亮和几颗星星"。

**适合**：电脑 / 手机壁纸、PPT 与网页背景、科技风海报底图；不适合需要写实地形的场景。

### 英文原版

```
A stylized landscape illustration composed entirely of sharp, flat-shaded geometric polygons. The subject is a range of snow-capped mountains at sunset. Every surface is a triangle or quadrilateral, with no curves or gradients. The lighting is calculated by the angle of the polygons, creating distinct facets of light and shadow. The color palette transitions from 'Deep Indigo' in the valleys to 'Fiery Crimson' and 'Gold' on the mountain peaks. In the foreground, a low-poly pine forest is represented by simple green tetrahedrons. The sky is a series of horizontal bands of color, with a low-poly sun made of concentric yellow circles. The overall look is reminiscent of early 3D video game aesthetics but with a modern, high-resolution finish. The mood is clean, digital, and strangely peaceful in its mathematical simplicity.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
