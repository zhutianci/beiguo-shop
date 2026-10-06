---
title: veo 3 提示词：雨夜城市夜跑运动广告（贴地跟拍 + 无人机航拍 · 同期脚步声）
slug: veo-rainy-city-night-run
model: veo
topics: [cinematic, product-video]
modelLabel: Veo 3
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成 6 秒竖屏运动品牌氛围短片：贴地跟拍跑鞋踩水、甩镜到侧脸呼白气、无人机俯拍孤独身影、收在坚定的特写。适合跑鞋、运动服、运动 App 的品牌片和投流素材，也能当"电影感夜景"运镜练习。
prompt: |
  竖屏 9:16，约[6]秒的运动品牌氛围短片：一名跑者在被雨淋湿、空无一人的市中心，追赶最后一点蓝调天光。
  0–2 秒：低机位跟拍，镜头贴着离黑色沥青大约十几厘米的高度掠过，橙色路灯的倒影在[跑鞋]下拉成长条，鞋子以稳定的步频踩进浅水洼，水珠划出慢动作的弧线。
  2–3 秒：一记甩镜切到侧面：冷空气里呼出白气，[防风外套]在肩头抖动，背后的玻璃大楼泛着钴蓝色的光。
  3–5 秒：无人机升起，从头顶划过一道弧线，跑者缩成一个孤零零的身影，长长的影子落在大道的中线上。
  5–6 秒：切回胸部以上的特写，下颌收紧，嘴角一丝笑意，汗水反射着路灯。
  跑鞋的轮廓、鞋带和配色在每个镜头里保持一致，没有变形、重影或融化。
  声音：脉冲般的低音合成器，湿地面上有节奏的脚步声，远处车流的低鸣。
  氛围：坚定、自由、充满动感。调色：电影感的青色暗部、琥珀色高光、强对比。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#rain-slick-city-run-at-dusk
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；"六英寸"换算为约十几厘米；时长、跑鞋、外套改为变量；去掉原文的品牌占位符
images:
  - 540-veo-rainy-city-night-run-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/rain-slick-city-run-at-dusk.png
  license: CC BY 4.0
verify:
  - 在 Veo 3 实测 3 次：所用入口（Gemini / Flow / API）是否支持竖屏 9:16、单条时长是多少（以官方说明为准）
  - 4 个镜头在一条里能否都出现，甩镜和无人机镜头是否被合并
  - 示例图是仓库提供的关键帧图（雨夜大道上的跑者背影，已转 JPG 压缩），不是 Veo 成片截图
---
**时长与镜头**：6 秒里塞了四个镜头：贴地 → 侧面 → 俯拍 → 特写，景别一直在跳，节奏感来自这种跳跃。如果入口生成的单条比 6 秒长，多出的时间可以加在无人机那段，让孤独感停留久一点；如果模型把四个镜头合成一个长镜头，就把每段开头写成"切到："。

**怎么填变量**：[跑鞋] 写清颜色和材质，如"白色网面跑鞋"，换成运动服品牌就把第一段改成"贴着湿地面跟拍跑者的腿和[紧身裤]"。场景换成"[清晨的江边步道]""[下雪的公园]"，调色跟着改成暖金或冷白。

**常见失败与调整**：
- 鞋子在跟拍时变形或换颜色：减少跟拍时长，或把第一段改成"慢动作"。
- 特写的脸太"AI 网红"：加"普通人的长相，皮肤有真实纹理和汗水"。
- 音乐盖住脚步声：把声音描述改成"以脚步声和呼吸声为主，音乐很轻"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
A lone athlete chasing the last blue light through a wet, emptied downtown. 0-2s: a low tracking shot skims six inches above black asphalt, smeared orange streetlamp reflections streaking under [brand] running shoes as they strike shallow puddles in a steady cadence, droplets kicking up in slow arcs. 2-3s: a hard whip-pan to a side profile — breath pluming in cold air, a windbreaker rippling at the shoulders, glass towers glowing cobalt behind. 3-5s: a drone lifts and arcs overhead, the runner shrinking to a single figure casting a long shadow down the center line of an avenue. 5-6s: cut back to a confident chest-up close-up, jaw set, a faint half-smile, sweat catching the streetlight. Shoes keep a consistent silhouette, lacing, and colorway across every shot; no warping, ghosting, melting, or artifacts. Audio: pulsing low synth, rhythmic footfalls on wet ground, distant traffic hum. Mood: determined, free, kinetic. Palette: cinematic teal shadows, amber highlights, deep contrast.
```
