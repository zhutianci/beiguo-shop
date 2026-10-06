---
title: seedance 2.0 提示词：拉开天空的拉链（超现实特效短片 · 15 秒三镜头反转）
slug: seedance-sky-zipper-surreal
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成一条"蓝天上出现拉链 → 巨手拉开露出赛博朋克城市 → 原来世界只是巨人桌上的玻璃球"的超现实奇观短片，适合做脑洞类账号的爆款素材、AI 视频作品集里的特效展示。
prompt: |
  【风格】超现实、巨物恐惧、史诗级视觉奇观，好莱坞特效质感，光影极其写实。
  【时长】15 秒，16:9 横屏，三个镜头。
  【场景】晴朗的[金色麦田]上空（也可换成城市天际线）。
  [00:00-00:05] 镜头一｜平静的假象：万里无云的蓝天，阳光明媚，有鸟飞过。镜头缓缓上摇，一派岁月静好。突然，天上闪过一道巨大的银色金属反光——那是一条横贯地平线的"拉链"。
  [00:05-00:10] 镜头二｜拉开天空：一只巨大的半透明"神之手"捏住拉链头，伴随轰鸣，慢慢把蓝天拉开。拉链打开时，"蓝天"像布料一样起皱、垂落。拉链后面不是宇宙，而是一座满是霓虹灯、飞行汽车和巨型机械结构的[赛博朋克未来城市]。
  [00:10-00:15] 镜头三｜两个世界的对视：天上只剩一角蓝天还挂着，原来我们生活的世界只是一个被罩起来的"生态箱"。结尾镜头急速拉远，揭示整片麦田其实只是巨人桌上的一个玻璃微缩景观球，巨人正凑近观察我们。
  【声音】鸟鸣和风吹麦浪声；拉链拉开时巨大的金属摩擦轰鸣；拉远到玻璃球时，声音突然变闷，只剩低沉的室内环境声。
negativePrompt: null
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020727853281628276
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: 由仓库英文版回译为中文；场景和拉链后的世界改为变量；原文"或一只巨大的机械眼"的备选结局删去；补充画幅与【声音】一段
images:
  - 536-seedance-sky-zipper-surreal-1.jpg
imageCredit:
  by: "@johnAGI168"
  url: https://github.com/ZeroLu/awesome-seedance#71-surrealism-and-megalophobia-style
  license: MIT
verify:
  - 示例图是从仓库附带的成片视频（github.com/user-attachments/assets/ccf43991-7f39-4550-8845-4aff2cec3ed4）第 7.6 秒抽取的一帧（镜头二：半透明巨手拉开天空、露出赛博朋克城市），不是封面图
  - 在 Seedance 2.0 实测 3 次：拉链是否真的"拉开"天空而不是飘在天上，结尾玻璃球能否在 5 秒内出现
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：三段式"日常 → 奇观 → 再拉远一层"是脑洞短片最稳的结构：第三段的再次反转决定了完播率。若模型在 15 秒内塞不下玻璃球结尾，可以把镜头三单独生成：以镜头二最后一帧作首帧，写"镜头急速拉远，整片麦田缩进一个玻璃球里"。

**怎么填变量**：[金色麦田] 换成"[海边小镇]""[学校操场]"更有代入感；[赛博朋克未来城市] 换成"[深海世界]""[恐龙时代的丛林]""[一片纯白的空房间]"，每换一个就是一条新视频。拉链也可以换成"天空像墙纸一样被撕开一角"。

**常见失败与调整**：
- 拉链像一根柱子立在地上：写明"拉链是水平横贯天空的，链牙沿地平线方向排列"。
- 巨手太实，像真人手：保留"半透明""发光边缘"。
- 结尾巨人的脸太吓人或太清晰：改成"只看到巨人模糊的眼睛和桌面的灯光"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020727853281628276) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Surrealism, megalophobia, epic visual spectacle, Hollywood special effects quality, extremely realistic lighting and shadow rendering.
【Duration】15 seconds
【Scene】Above a clear city skyline, or an open wheat field.
[00:00-00:05] Shot 1: Calm illusion (The Calm).
The scene shows a cloudless, absolutely beautiful blue sky, sunny and bright, with birds flying by. The camera slowly tilts upward, giving a feeling of peaceful times.
Key detail: Suddenly, a giant, silver metallic gleam appears in the sky—it's a **"zipper"** spanning across the horizon.
[00:05-00:10] Shot 2: Unzipping the zipper (The Unzipping).
A **giant, translucent God's hand** grasps the zipper pull, slowly unzipping the blue sky with a tremendous roar (audio effect).
Action: As the zipper opens, the "blue sky" wrinkles and falls like fabric.
Visual spectacle: Behind the zipper is **not the universe**, but a **cyberpunk future world filled with neon lights, flying cars, and giant mechanical structures** (or a giant mechanical eye staring at us).
[00:10-00:15] Shot 3: Gaze between two worlds (The Revelation).
Only a corner of blue sky remains hanging in the sky. It turns out our living world was just an "eco-box" covered up.
Ending: The camera rapidly pulls back to reveal that our entire world (city/wheat field) is actually just a **glass miniature landscape ball** on a giant's table. The giant is leaning in close to observe us.
```
