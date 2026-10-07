---
title: 像素风提示词：10×10 复古小汽车精灵图，一张出 100 辆 16 位风格车辆
slug: pixel-car-sprite-sheet
model: gpt-image-2
topics: [game-art]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做像素小游戏原型、复古风格贴纸 / 周边图案、游戏美术练习时，一次生成一整张 10 行 10 列的像素车辆精灵图，视角和阴影统一，车型和颜色各不相同。
prompt: |
  一张 10×10 的像素风精灵图，内容是复古电子游戏里的[小汽车]，16 位时代美学。
  - 布局：10 行 × 10 列的小车辆精灵，排在干净的[浅灰色]网格背景上，每格 64×64 像素；
  - 种类：轿车、跑车、肌肉车、SUV、皮卡、厢式货车、出租车、警车、敞篷车、改装老爷车等，颜色覆盖完整彩虹色系；
  - 统一性：所有精灵采用一致的 3/4 俯视角度，阴影方向一致；
  - 像素：边缘锐利，不要抗锯齿，每个精灵限制在约 16 种颜色；
  - 风格参考 16 位主机时代的赛车游戏传统。
  画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-pixel-art.md
  author: "@RoundtableSpace"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并按布局 / 种类 / 统一性 / 像素要求拆成要点；主体类型、背景色、画幅设为变量；去掉游戏主机品牌名；补充了常见问题与改法
images:
  - 3212-pixel-car-sprite-sheet-1.jpg
imageCredit:
  by: "@RoundtableSpace"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/pixel-art/pixel-sprite-cars.png
  license: MIT
verify:
  - 原始出处：原帖：https://x.com/RoundtableSpace，核对原帖仍可访问、作者未另行声明保留权利
  - 生成结果往往不是严格 64 像素网格，如需当游戏素材要提醒用户自行切图对齐
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[小汽车] 可以换成"太空飞船""奇幻武器""小怪物""中式小吃"，种类那一行跟着改成对应清单；[浅灰色] 背景换成"纯白"或"深蓝"方便抠图。示例图是原作者的出图：浅灰底上整整齐齐排着 100 辆小车，都是同一个斜俯视角度，有红色跑车、白蓝警车、黄色出租车、厢式货车、皮卡、敞篷车和改装热棒车，颜色从红到紫都有。

**常见问题与调整**：
- 行列数不对：强调"严格 10 行 10 列，共 100 个，每格大小相同、间距相同"。
- 视角不一致：加"所有车辆车头朝右下方，角度完全相同"。
- 像素太细像矢量图：加"低分辨率像素块清晰可见，不要平滑渐变"。
- 想要更少更大：改成"4×4 共 16 个，每格 128×128 像素"，细节会更清楚。

**适合**：像素游戏原型占位素材、复古风贴纸与周边图案、像素美术练习参考；不适合直接当商用游戏的最终切图。

### 英文原版

```
A 10x10 pixel art sprite sheet of retro video game cars, 16-bit era aesthetic. Ten rows by ten columns of small vehicle sprites on a clean light-grey grid background, each cell 64x64 pixels. Variety across sprites: sedans, sports cars, muscle cars, SUVs, pickup trucks, vans, taxi cabs, police cruisers, convertibles, and hot rods, in a full rainbow of colors. All sprites rendered in a consistent 3/4 top-down perspective with matching shading, crisp pixel edges, no anti-aliasing, palette limited to ~16 tones per sprite, SNES / Super Nintendo cart-racing game tradition.
```

> 改编自 [@RoundtableSpace](https://x.com/RoundtableSpace) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
