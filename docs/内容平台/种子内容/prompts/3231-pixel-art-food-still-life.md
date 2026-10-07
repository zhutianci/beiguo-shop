---
title: 像素风提示词：怀旧像素松饼早餐静物，枫糖浆 + 莓果 + 冒热气的咖啡
slug: pixel-art-food-still-life
model: gpt-image-2
topics: [food, illustration]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做像素风头像、美食账号封面、复古游戏风周边或桌面小挂画时，生成一张温馨的像素美食静物：食物质感诱人，但依然是干净可读的像素画。
prompt: |
  创作一幅怀旧的像素风[早餐]静物画。
  - 主体：一摞高高的蓬松金黄[松饼]，淋着亮晶晶的枫糖浆，顶上放着草莓和蓝莓，像素化的热气缓缓升起；
  - 场景：盘子放在[粉彩色桌布]上，背景里有一杯冒着热气的咖啡；
  - 色彩：丰富的早餐暖色调；
  - 光线：讲究的光影，表现出美味的质感细节；
  - 风格：始终保持干净、清晰可读的像素画风格，像素块可见。
  画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-pixel-art.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；餐别、主食物、桌布、画幅设为变量；补充"像素块可见"的约束和常见问题
images:
  - 3231-pixel-art-food-still-life-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/pixel-art/pixel-breakfast.png
  license: MIT
verify:
  - 原始出处：原帖：https://www.reddit.com/r/midjourney/comments/1jmodcx/animated_pixel_art_food_prompts_included/，核对原帖仍可访问、作者未另行声明保留权利
  - 示例图墙上多了一幅提示词里没写的英文十字绣挂画，展示时可在正文说明这是模型自由发挥
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[早餐] 可以换成"深夜食堂""下午茶""年夜饭"；[松饼] 换成"一碗热汤面""小笼包蒸笼""草莓奶油蛋糕"，记得同时改配料描述；[粉彩色桌布] 换成"木质餐桌""格子野餐布"。示例图是仓库作者的出图：方形像素画里，白瓷盘上叠着六层松饼，枫糖浆顺着边缘流下，顶上是草莓、蓝莓和一块黄油，左边一只印着蓝色爱心的咖啡杯冒着热气，背景是开着花的窗户，右上墙上还挂着一幅写有"GOOD MORNING!"的十字绣。

**常见问题与调整**：
- 太精细不像像素画：加"低分辨率像素，约 128×128 像素放大显示，不要平滑渐变"。
- 背景元素乱加：加"背景只有简单的墙面和窗户，不出现文字"。
- 想做成动图素材：追问"保持构图不变，画出热气上升的三帧连续画面"。
- 想要深色夜宵风：改成"深夜昏黄台灯光，深蓝色背景"。

**适合**：像素风头像与封面、美食账号插图、复古风周边图案；不适合当作真实菜品展示图。

### 英文原版

```
Create a nostalgic pixel-art breakfast still life. Show a tall stack of fluffy golden pancakes drizzled with glossy maple syrup, topped with strawberries and blueberries, with pixelated steam rising into the air. The plate sits on a pastel tablecloth and a hot cup of coffee rests in the background. Use rich breakfast colors, careful lighting, and delicious texture detail while staying true to clean, readable pixel art.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
