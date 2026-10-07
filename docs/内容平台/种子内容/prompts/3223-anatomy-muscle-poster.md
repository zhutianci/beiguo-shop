---
title: 科研绘图提示词：人体肌肉系统前后视图教学挂图，带肌肉名标注和身高刻度
slug: anatomy-muscle-poster
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做健身科普图、体育 / 生物课教学挂图、康复训练说明配图时，生成一张米色底的人体肌肉前后视图海报：主要肌群有引线标注，带图例和身高参照，不血腥不恐怖。
prompt: |
  制作一张干净的教学用解剖海报，在浅奶油色背景上展示[人体肌肉系统]的正面和背面视图。
  - 风格：学术但精致，线条精确；肌群用柔和的红色和赭色，骨骼用冷灰色，标注用细的炭灰色字；
  - 标题：居中写"[Muscular System]"，副标题"[Front and Back Views]"；
  - 标注关键结构：[三角肌]、胸大肌、腹直肌、股二头肌、腓肠肌、斜方肌；
  - 加一个简短的比例说明"成人身高参照 175 cm"，以及一个小图例"浅层 / 深层"；
  - 底部可加几条肌肉功能的简短说明；
  - 构图左右对称，看起来科学准确，适合挂在教室墙上；
  - 标注正确、字体清晰、层级分明、阴影细腻，出版级的教学清晰度，不要血腥或过度写实。
  画幅[9:16]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-scientific-and-educational.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；主题系统、标题、副标题、首个标注、画幅设为变量；肌肉名改为中文，补充了底部功能说明和常见问题
images:
  - 3223-anatomy-muscle-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/scientific-educational/human-anatomy-muscular-poster.png
  license: MIT
verify:
  - 示例图是英文版；肌肉位置和标注是否准确需要懂解剖的人核对，不能直接当教材
  - 换成"人体骨骼系统""消化系统"各出一次，看是否同样干净不血腥
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[人体肌肉系统] 可以换成"人体骨骼系统""心脏结构""植物细胞结构"，标注列表跟着改成对应部位；标题和副标题可以写中文，如"[人体肌肉系统]""[正面与背面视图]"；[三角肌] 所在的标注列表建议保留 6 个左右，太多容易写错。示例图是英文竖版：顶部"Human Muscular System / Anterior and Posterior Views"，左边正面、右边背面两个红褐色肌肉人体，引线标出 Deltoid、Pectoralis Major、Trapezius、Biceps Femoris 等，右侧有到 180 的身高刻度并标出 175，底部是六条肌肉功能说明。

**常见问题与调整**：
- 中文肌肉名出错：每个标注只写名称，不写拉丁名和说明。
- 太写实让人不适：加"插画风，不显示皮肤切口，不出现血液"。
- 想做健身动作说明：改成"标出深蹲时主要发力的肌群，用橙色高亮"。
- 两个视图大小不一：强调"正面和背面人体同样高度、并排对齐"。

**适合**：健身科普图、生物 / 体育课挂图、康复训练说明配图；图中解剖细节需专业人士核对，不能替代医学教材。

### 英文原版

```
Create a clean educational anatomy poster showing the human muscular system in anterior and posterior views on a pale cream background. Use an academic but visually refined style with precise linework, muted reds and umbers for muscle groups, cool gray bones, and thin charcoal labels. Include a centered title with crisp in-image text "Human Muscular System" and a subtitle "Anterior and Posterior Views". Label key structures such as "Deltoid", "Pectoralis Major", "Rectus Abdominis", "Biceps Femoris", "Gastrocnemius", and "Trapezius". Add a compact scale note reading "Adult height reference 175 cm" and a small legend with "Superficial" and "Deep". Keep the composition symmetrical, scientifically accurate in appearance, and suitable for a classroom wall chart. Prioritize correct labels, crisp typography, clean hierarchy, subtle shading, and publication-quality educational clarity without gore or excessive realism.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
