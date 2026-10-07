---
title: seedance 提示词：后印象派旋涡星空油画动起来（厚涂笔触 · 15 秒油画动画）
slug: seedance-swirling-impasto-night-sky-animation
model: seedance
topics: [cinematic, motion-graphics]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 把"厚涂油画"风格做成会流动的动画：深蓝夜空里星云像河流一样旋转，左边一棵像黑色火焰的柏树，山谷小镇的窗户亮着暖黄的光，整个画面沿笔触方向缓缓流动。适合艺术类账号、音乐可视化、展览宣传和视频背景。
prompt: |
  【风格】后印象派油画，厚重的颜料质感（厚涂法），标志性的旋涡笔触，梦幻感，高饱和的蓝黄对比。
  【时长】15 秒动画，16:9。
  【画面内容】这是一个完全由厚重油彩构成、会动的世界。
  天空：深蓝色的夜空中，巨大的黄色星体和一弯新月被放射状的短笔触环绕，星云像奔涌的河流一样在空中疯狂旋转。
  前景：左边是一棵巨大的[柏树]，扭曲得像燃烧的黑色火焰，直冲天空。
  背景：山谷里一座沉睡的[小镇]，房屋的窗户透出温暖的、用圆形笔触画出的黄色灯光。
  整个画面沿着笔触的方向缓缓流动、呼吸。镜头极其缓慢地向前推进。
negativePrompt: 写实照片，平滑数码渲染，人物，文字，签名，水印
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020778466405159207
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: "英文原文译为中文；标题中的画家姓名改为风格描述（后印象派、厚涂、旋涡笔触）；补充\"镜头缓慢推进\"；前景树木与小镇改为变量"
imageBrief: 仓库没有可单独提取的封面。站长生成后截取开场、星云旋转、推进到小镇三帧。
verify:
  - Seedance 2.0 实测 3 次，记录笔触流动是否保持油画质感而不是变成平滑动画
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒，一个缓慢推进的长镜头，几乎没有"剧情"，动起来的是笔触本身：星云旋转、柏树像火焰摇曳、窗光闪烁。这类"让名画风格流动起来"的视频，关键是写出"整个画面沿笔触方向流动、呼吸"，否则模型会生成一张几乎不动的画。

**怎么填变量**：[柏树] 和 [小镇] 可以换成"一座灯塔和海湾""一片向日葵田和农舍""一座城市的天际线"，保留"厚涂、旋涡笔触、蓝黄对比"就是同一种风格。想做竖屏手机壁纸或音乐可视化，把画幅改成 9:16，并写"可无缝循环"。

**版权提示**：后印象派画家的作品早已进入公有领域，风格可以自由使用；但不要直接上传或复刻某幅受版权保护的现代作品。

**常见失败与调整**：
- 动得太少像静态图：加"每一笔颜料都在缓缓流动，像河水一样"。
- 变成写实夜景：保留"厚重油彩构成的世界"，负面提示词写"写实照片"。
- 画面里冒出签名：负面提示词写"签名"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020778466405159207) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Van Gogh Post-Impressionism oil painting, thick paint texture (Heavy Impasto), signature swirling brushstrokes, dreamy feel, high saturation blue-yellow contrast.
【Duration】15 second animation
[Visual Content] This is a completely dynamic world made of thick oil paint.
Sky: In the deep blue night sky, huge yellow celestial bodies and crescent moon are surrounded by radiating short brushstrokes, nebulae swirling wildly in the air like rushing rivers (Swirling motion).
Foreground: On the left is a huge cypress tree, twisted like burning black flames, shooting up to the sky.
Background: A sleeping town in the valley, windows of houses emit warm, circularly painted yellow light. The entire scene slowly flows and breathes following the direction of brushstrokes.
```
