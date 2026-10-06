---
title: 室内效果图提示词：日式极简客厅写实渲染（可换北欧 / 奶油风）
slug: japanese-minimalist-living-room
model: gpt-image-2
topics: [interior, photography]
aspectRatio: "3:2"
needsRefImage: false
useCase: 不用会 3D 软件，也能生成杂志级的室内效果图，适合装修前找风格、做软装提案、给家人展示想要的样子。
prompt: |
  用照片级建筑可视化风格，渲染一间宁静的[日式极简客厅]，平视视角，28mm 镜头感。
  空间要素：[浅橡木地板、障子风格推拉门]、[低矮组合沙发、内嵌壁龛]、[亚麻质感]，柔和的晨光从左侧照进来。
  配色克制：[暖米色、浅橡木、炭灰、低饱和苔绿、米纸白]。
  一块小小的装框平面图板上写着精细的文字"[房间 6.4 m × 4.8 m]"和"[AURAE House]"。
  加入一张矮茶几、一只陶瓷花瓶、一盆盆景般的植物，以及色温 3000K 的间接灯带。
  构图平静均衡，留白充足；阴影真实，材质表现准确，杂志级室内渲染。
  优先保证照片写实、建筑细节、边缘清晰和有品位的极简，而不是风格化的幻想场景。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-architecture-interior
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；风格、空间要素、配色和画面内文字改为变量
imageBrief: 按默认变量生成 1 张 3:2 效果图；再把风格换成"奶油风"、配色换成"奶白、燕麦、浅木"生成 1 张对比。
images:
  - 134-japanese-minimalist-living-room-1.jpg
imageCredit:
  by: "wuyoscar/GPT-Image2-Skill"
  url: https://github.com/wuyoscar/GPT-Image2-Skill
  license: MIT
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 平面图板上的文字是否清晰正确
  - 换成"中古风""北欧风"是否同样写实
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：换风格时，[空间要素] 和 [配色] 要一起换，比如北欧风写"白墙、浅木地板、灰色布艺沙发、羊毛地毯、藤编灯"，配色写"白、浅木、浅灰、雾蓝"。房间尺寸写你家的真实尺寸，模型会大致按比例摆家具。

**常见问题**：
- 像样板间广告、不真实：保留最后一句"照片写实，而不是风格化的幻想场景"。
- 图里的文字乱码：不需要的话直接删掉"平面图板"那句，画面更干净。
- 和自家户型不符：这条是"纯文字生成"；想基于自家房间改造，请用 132 号（上传照片生成情绪板）。

**迭代**：追问"同一角度，换成傍晚开灯的效果"，可以看灯光方案。

### 英文原版

```text
Render a serene Japanese minimalist living room interior in photorealistic architectural visualization style, viewed from eye level with a 28 mm lens feel. The space should feature light oak flooring, shoji-inspired sliding panels, low modular seating, a recessed tokonoma niche, linen textures, and soft morning light entering from the left. Use a restrained palette of warm beige, pale oak, charcoal, muted moss green, and rice-paper white. Include subtle in-image text on a small framed floor plan board that reads "Room 6.4 m x 4.8 m" and "AURAE House". Add a low tea table, one ceramic vase, a bonsai-like plant, and indirect cove lighting at 3000 K. Composition should be calm and balanced with strong negative space, realistic shadows, accurate material behavior, and magazine-quality interior rendering. Prioritize photorealism, architectural detail, crisp edges, and tasteful minimalism rather than stylized fantasy.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Architecture & Interior」中的示例提示词（Japanese Minimalist Living Room），Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)。示例图为 PNG 且超过 1.2MB，未收录。
