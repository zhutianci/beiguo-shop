---
title: seedance 提示词：沙暴追击车队史诗大片（IMAX 70mm 质感 · 远景尺度—驾驶舱惊慌—飞越沙丘）
slug: seedance-desert-sandstorm-convoy-epic
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 史诗科幻 / 灾难片的大场面：几英里高的沙暴吞没沙漠，小小的装甲车队拼命逃离，驾驶舱里剧烈晃动，最后领头车冲上沙丘慢动作腾空、撞击瞬间切黑。适合电影感练习、预告片和视频开头。
prompt: |
  风格：IMAX 70mm 胶片质感，粗粝写实，宏大尺度，低饱和。时长：15 秒，16:9。
  0–5 秒｜大远景（尺度）：一场几英里高的巨型沙暴吞没广袤的沙漠，一支渺小的[装甲车队]正拼命逃离。自然与人类的尺度对比令人震撼，低沉压迫的配乐不断逼近。
  5–10 秒｜驾驶舱（慌乱）：领头车内，驾驶员大喊："[冲！快冲！]"镜头剧烈晃动，沙子猛砸挡风玻璃，逼近的沙墙遮住了太阳。
  10–15 秒｜飞跃（高潮）：领头车撞上一座巨大的沙丘，腾空而起（慢动作），在黑暗的沙暴前形成剪影，闪电在沙云中劈下，碎屑从镜头前飞过。撞击瞬间切黑。
negativePrompt: 车辆变形，车轮数量错误，卡通，鲜艳色彩，字幕，文字，水印
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020794007291404726
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: "英文原文译为中文；删去原文中的导演和作曲家姓名，改为具体的画面与配乐描述；原文要求的英文字幕删去；车队改为变量"
imageBrief: 仓库没有可单独提取的封面。站长生成后截取"沙墙与车队远景""驾驶舱沙砸玻璃""沙丘腾空剪影"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录远景中沙暴与车队的尺度对比是否震撼
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒三段，每段 5 秒，三种完全不同的景别：大远景（尺度） → 车内近景（情绪） → 中远景慢动作（高潮）。这是预告片最常用的"远—近—远"节奏，每段括号里写一个关键词（尺度 / 慌乱 / 高潮），帮模型抓住每段要表达的东西。

**怎么改得更好**：原文写的是"某导演风格""某作曲家风格的配乐"，本站改成了可执行的画面描述："IMAX 70mm 胶片、粗粝写实、低饱和"和"低沉压迫的配乐"。用具体的视觉特征代替人名，既不依赖模型是否认识这些名字，也避开了风格模仿的争议。

**怎么填变量**：[装甲车队] 换成"一队骆驼商队""越野摩托车手""一辆老式绿皮火车"；台词 [冲！快冲！] 可以改成任何 2–5 字的喊话。沙暴也可以换成"雪崩""火山灰云""巨型海啸"。

**常见失败与调整**：
- 车队太小看不见：写"车队的车灯在沙尘中清晰可见"。
- 腾空后物理不对（像飘起来）：写"沉重地腾空，车身前倾"。
- 切黑没出现：写"最后一帧纯黑，持续半秒"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020794007291404726) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
Style: IMAX 70mm Film, Denis Villeneuve Style, Gritty Realism, Epic Scale, Desaturated.
Duration: 15s.
[00-05s] Extreme Wide Shot (The Scale). A colossal sandstorm, miles high, swallows a vast desert landscape. A tiny convoy of armored military vehicles races away from it. The scale of nature vs man is terrifying. Hans Zimmer style tension.
[05-10s] Cockpit Cam (The Panic). Inside the lead rover. The pilot screams "GO! GO!" (Subtitle: MAX POWER!). Camera shakes violently. Sand blasts the windshield. The sun is blocked out by the approaching wall of dust.
[10-15s] The Jump (The Climax). The rover hits a massive dune and launches into the air (Slow Motion). Silhouette against the dark storm. Lightning strikes within the dust cloud. Debris flies past the lens. Cut to black on impact.
```
