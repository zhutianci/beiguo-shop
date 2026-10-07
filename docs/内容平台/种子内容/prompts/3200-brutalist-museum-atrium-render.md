---
title: 建筑效果图提示词：清水混凝土博物馆中庭写实渲染（gpt-image-2，可换展厅 / 商场中庭）
slug: brutalist-museum-atrium-render
model: gpt-image-2
topics: [interior, photography]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做公建方案汇报、建筑课程作业概念图、展陈空间提案时，一句话生成"清水混凝土 + 天窗光 + 长坡道"的写实中庭效果图，连导视牌文字都能准确出现在画面里。
prompt: |
  生成一张写实的建筑室内效果图：一座体量宏大的[粗野主义博物馆中庭]，墙面是带木模板纹理的清水混凝土，顶部有戏剧性的条形天窗，空间里有长长的坡道和巨大的几何挑空。
  - 视角：略低、偏广角，强调垂直方向的尺度和光影；
  - 配色：冷灰混凝土、黑色钢构、淡砂岩色，苍白的日光，加少量[铁锈红]导视色块；
  - 画面中出现清晰可读的导视文字："[Gallery A]"、"[Level 02]"、"[Atrium 18.0 m]"；
  - 加入几个很小的人物作为尺度参照，但建筑始终是主角；
  - 空间里有悬挑连廊、中央雕塑台座，抛光混凝土地面映出天光；
  - 构图要有电影感但建筑上严谨：材质真实、光线准确、对比克制、景深自然、几何干净、标识锐利。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-architecture-and-interior.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；空间类型、点缀色、导视文字、画幅设为变量；补充了常见问题与改法
images:
  - 3200-brutalist-museum-atrium-render-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/architecture-interior/brutalist-concrete-museum-atrium.png
  license: MIT
verify:
  - 换成"商场中庭""图书馆阅览大厅"各出一次，看导视文字是否仍然清晰
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[粗野主义博物馆中庭] 可以换成任何大空间——"美术馆入口大厅""高校图书馆中庭""商业综合体共享中庭"；[铁锈红] 是导视点缀色，换成"明黄""克莱因蓝"会让画面气质完全不同。导视文字建议保留 2～3 个短英文或数字，中文标识也能出，但字数越少越准。示例图是仓库作者的出图：混凝土墙上"Gallery A"和"Atrium 18.0m"都清晰可读，天窗光从右上斜射下来，坡道和连廊把纵深拉开，几个小人点出尺度。

**常见问题与调整**：
- 画面太"干净"像 CG：加"墙面有轻微水渍和模板接缝""地面有人走过的反光痕迹"。
- 人物太大抢戏：强调"人物高度不超过画面高度的十分之一"。
- 想要夜景版：把日光改成"黄昏后室内暖色洗墙灯，天窗外是深蓝天空"。
- 汇报要多张统一风格：第一张满意后追问"保持同样材质和光线，换成从二层连廊俯视的视角"。

**适合**：建筑 / 室内专业作业概念图、方案汇报氛围图、展陈设计提案；不适合直接当施工图或精确尺寸依据。

### 英文原版

```
Create a photorealistic interior render of a monumental brutalist museum atrium with exposed board-formed concrete, dramatic skylights, long ramps, and massive geometric voids. Viewpoint is slightly low and wide, emphasizing vertical scale and shadow. Use a palette of cool gray concrete, black steel, muted sandstone, pale daylight, and a few rust-colored wayfinding accents. Include sparse signage with crisp in-image text: "Gallery A", "Level 02", and "Atrium 18.0 m". Add a few small human figures for scale, but keep the architecture dominant. The space should include suspended walkways, a central sculpture plinth, and reflected light from polished concrete floors. Composition must feel cinematic yet architecturally precise, with realistic material textures, accurate lighting, controlled contrast, and gallery-quality rendering. Prioritize believable spatial depth, clean geometry, subtle atmospheric perspective, and sharp signage.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 画廊收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
</content>
</invoke>
