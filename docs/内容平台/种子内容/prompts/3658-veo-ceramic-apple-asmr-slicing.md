---
title: veo 3 提示词：切陶瓷苹果 ASMR 视频（不可能的切割 · 微距 + 刮擦敲击声）
slug: veo-ceramic-apple-asmr-slicing
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "9:16"
needsRefImage: false
useCase: 短视频平台流行的"切割不可能物体"ASMR：双手在木砧板上切开一个闪亮的陶瓷苹果，微距细节配清脆的刮擦和敲击声。适合解压号、ASMR 账号和展示 Veo 同期音效能力。
prompt: |
  特写：一双手在木质砧板上切一个闪亮的[陶瓷苹果]，竖屏 9:16，约 8 秒。
  0–3 秒：刀刃缓缓压进苹果表面，釉面反射着柔和的顶光，切口处露出[雪白的瓷胎]，细小的瓷屑落在砧板上。
  3–6 秒：苹果被切成两半，再切成整齐的薄片，每一片的断面都光滑如镜，薄片轻轻倒下，相互碰出清脆的声响。
  6–8 秒：微距特写，刀尖把一片瓷片轻轻推开，停在画面中央。
  画面：极致的微观细节，浅景深，干净的深色背景。
  ASMR 音频：细微的刮擦声，清脆的敲击声，陶瓷相碰的叮当声；没有背景音乐，没有人声。
negativePrompt: 背景音乐，人声，手指畸形，刀穿过手指，切口不整齐，文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/ceramic_apple_asmr_slicing.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "原文只有两句英文，本站扩写为带时间码的三段，补充了切口内部、薄片倒下和收尾镜头；切割物与内部材质改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"刀刃压进""切成薄片""推开瓷片"三帧。
verify:
  - Veo 实测 3 次：切割声与画面是否同步
  - 手部与刀的穿模情况
---
**时长与镜头**：8 秒三段：下刀 → 切片倒下 → 微距收尾。原作只有一句画面 + 一句声音，本站补了时间码和细节，便于控制节奏。ASMR 视频的关键是"声音描述要单独成句、写得具体"（Veo 官方也建议音频用单独的句子描述）：刮擦、敲击、叮当，各自对应一个画面动作。

**怎么填变量**：[陶瓷苹果] 换成"玻璃草莓""水晶橙子""金属蛋糕""肥皂做的寿司"——"日常食物 × 不可能的材质"就是这类视频的爆款公式；[雪白的瓷胎] 随材质换成"晶莹的玻璃断面""层层叠叠的彩色肥皂"。

**常见失败与调整**：
- 苹果被切开后露出真苹果果肉：在第一段就写清"内部是实心的白色陶瓷"。
- 刀穿过手指：写"手指始终在刀刃后方，远离切口"。
- 出现背景音乐：保留"没有背景音乐"并放进负面提示词。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```
Close-up of hands slicing a shiny ceramic apple on a wooden cutting board. Microscopic detail, crisp ASMR sound of the knife scraping and tapping.
ASMR AUDIO: subtle scraping, tapping, ceramic sounds.
```
