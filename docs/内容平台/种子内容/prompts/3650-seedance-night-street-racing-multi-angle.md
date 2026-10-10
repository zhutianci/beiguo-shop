---
title: seedance 提示词：深夜街头飙车（车内特写—过肩—车外跟拍—贴地低机位 · 速度坡度转场）
slug: seedance-night-street-racing-multi-angle
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 汽车类动作片段和速度感练习：深夜霓虹街道，车手握紧方向盘、按下加速按钮、车子猛冲出去，镜头在车内特写、过肩、车外侧面跟拍和贴地低机位之间用甩镜和变速无缝切换。适合汽车品牌片、赛车游戏宣传、短片动作段落。
prompt: |
  电影感的深夜街头竞速段落，一位专注的车手坐在一辆高性能[跑车]里，紧握方向盘，眼神高度集中，城市灯光倒映在挡风玻璃上，突然加速前张力不断积累，约 12 秒，16:9。
  运镜：快速多角度系统，无缝衔接——车内特写 → 过肩镜头 → 车外跟拍 → 贴地低机位；超强动感，甩镜 + 速度坡度变速转场 + 用运动模糊掩盖剪辑点，制造连续流动的错觉。
  0–2 秒：车内特写车手，手握紧挡杆，轻微的呼吸，仪表盘灯光发亮。
  2–4 秒：过肩镜头，前方道路伸进霓虹闪烁的城市，引擎振动不断增强。
  4–6 秒：极近特写，手指按下[加速按钮]，瞬间点火反应。
  6–8 秒：爆发式加速，镜头猛地切到车外侧面跟拍，车子以暴力般的速度冲出去。
  8–10 秒：贴近沥青的超低机位，车轮以极高的速度旋转，环境飞速掠过。
  10–12 秒：在狭窄街道上高速追逐，急转弯，镜头在不同角度之间甩切，倒影和光轨强化速度感。
  环境：密集的城市夜景，湿沥青倒映霓虹，隧道，路灯拖出光线，高速都市氛围。
  超写实，写实光影，强烈运动模糊，高反差霓虹倒影，电影景深，极致的速度感，流畅转场，不扭曲、不拉伸。
negativePrompt: 车身扭曲，车轮变形，画面拉伸，品牌标志，车牌文字，人物换脸，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/CharaspowerAI/status/2039651574297792688
  author: "@CharaspowerAI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；车型和按钮改为变量；删去原文对某电影系列的风格引用"
imageBrief: 来源缩略图出现手套品牌标志，未采用。站长生成后截取"按下按钮""车外跟拍""贴地车轮"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录多角度切换时车辆外观是否一致
  - 注意平台对"危险驾驶"内容的审核，必要时改为封闭赛道场景
  - 确认原帖仍可访问
---
**时长与镜头**：约 12 秒六个镜头，每 2 秒切一次角度。这条最值得学的是运镜那一行：先列出镜头顺序（车内 → 过肩 → 车外 → 贴地），再写转场手段（甩镜、速度坡度变速、运动模糊掩盖剪辑点）——这样模型生成的是"一气呵成的快剪"，而不是几段互不相干的画面。

**怎么填变量**：[跑车] 换成"电动超跑""复古肌肉车""赛道方程式"；[加速按钮] 可以换成"启动按钮""换挡拨片"。考虑到平台对危险驾驶内容的审核，用于发布时建议把场景改成"封闭赛道"或"夜间赛车场"。

**常见失败与调整**：
- 车子每个镜头外观不同：写"同一辆深灰色跑车"，或上传车辆参考图。
- 车内外切换太突兀：保留"用运动模糊掩盖剪辑点"，并缩短到 4 个镜头。
- 车牌和招牌上出现乱码：负面提示词点名"车牌文字"。

> 改编自 [@CharaspowerAI](https://x.com/CharaspowerAI/status/2039651574297792688) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
cinematic street racing sequence at night, a focused driver inside a high-performance car grips the steering wheel, intense eye focus, city lights reflecting on windshield, tension building before sudden acceleration

camera: rapid multi-angle system with seamless transitions, interior close-up → over-the-shoulder → exterior tracking → low ground shots, ultra dynamic camera movement, whip pans + speed ramp transitions + motion blur masking cuts, continuous flow illusion

(0-2s) interior close-up on driver, hand tightens on gear shift, subtle breathing, dashboard lights glowing
(2-4s) over-the-shoulder shot, road ahead stretching into neon-lit city, engine vibration building
(4-6s) extreme close-up on finger pressing NOS button, instant ignition reaction
(6-8s) explosive acceleration, camera snaps to exterior side tracking shot, car launches forward with violent speed surge
(8-10s) ultra low ground shot near asphalt, wheels spinning at extreme velocity, environment streaking past
(10-12s) high-speed chase through tight streets, sharp turns, camera whip pans between angles, reflections and light trails enhancing speed

Dense urban night environment, wet asphalt reflecting neon lights, tunnel passages, street lights streaking, high-speed city atmosphere
Ultra realistic, fast and furious inspired energy, photorealistic lighting, intense motion blur, high contrast neon reflections, cinematic depth of field, extreme sense of speed, fluid transitions, no distortion, no stretching
```
