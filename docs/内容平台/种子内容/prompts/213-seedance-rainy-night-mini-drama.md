---
title: seedance 提示词：AI 短剧雨夜虐恋分镜（15 秒三镜头 · 台词口型）
slug: seedance-rainy-night-mini-drama
model: seedance
topics: [short-drama]
modelLabel: Seedance 2.0
aspectRatio: "9:16"
needsRefImage: false
useCase: 生成竖屏短剧最常见的"雨夜拉扯—真相—相拥"高潮片段，15 秒三镜头带台词，适合做短剧预告、情感号素材，或作为写 AI 短剧分镜的模板。
prompt: |
  【风格】国产爆款短剧风格，极快的剪辑节奏，高颜值滤镜，情绪爆发，浪漫又揪心的雨夜。
  【时长】15 秒，竖屏 9:16。
  【人物】深情的男主（[黑色大衣]、湿发、眼眶发红）VS 倔强心碎的女主（[白色连衣裙]、满脸泪水）。
  [00:00-00:05] 镜头一｜快切组合：雨夜街头。女主决绝地转身离开（背影）。男主冲上来抓住她的手腕（特写）。女主猛地回头，眼神里是又爱又恨的痛。
  【台词口型】女主哭喊："[放手！我们结束了！]"
  [00:05-00:10] 镜头二｜真相爆发（强烈特写）：男主死死不松手，雨水顺着两人的脸往下流。他急切地从怀里掏出[一枚戒指]，举到她眼前，手指在发抖。
  【台词口型】男主大喊："[你看清楚！我从来没骗过你！]"
  [00:10-00:15] 镜头三｜情绪决堤（高潮）：女主看到他手里东西的那一刻，瞳孔震颤（大特写），捂住嘴，防线崩溃。下一秒，男主一把将她拉进怀里紧紧抱住，像要把她揉进骨头里。镜头快速绕着相拥的两人旋转。
  【台词口型】女主低头抽泣（无台词 / 呜咽）。
  【声音】大雨声、远处的车流声，镜头三加入悲伤的钢琴和弦乐。
negativePrompt: null
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020687040853975223
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: 由仓库英文版回译为中文；服装、关键道具、台词改为变量；补充画幅和【声音】一段
imageBrief: 仓库只附了视频，没有封面图。请用两张 AI 生成的虚拟演员形象作参考生成 1 条，截取"抓手腕""掏戒指""相拥旋转"三帧作展示图。
verify:
  - 实测中文台词的口型是否同步、发音是否清楚
  - 抓手腕、拥抱时是否出现多余手臂或肢体穿插
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：每 5 秒一个情绪节拍：冲突 → 真相 → 释放。短剧的高潮片段基本都是这个结构，换剧情时只改人物、道具和台词。

**台词怎么写**：每个镜头最多一句、10 个字以内，并写清"谁说"；台词越长，口型越容易对不上。镜头三刻意不给台词，用表情和音乐收尾，成功率更高。

**怎么填变量**：[一枚戒指] 可换"[一份体检报告]""[一张旧照片]"，换道具就换了剧情；服装颜色建议一深一浅，雨夜里更好区分两个人。

**常见失败与调整**：
- 快切时两个人的脸互相"串"了：先用图像模型生成两人的定妆照，作为参考图上传，并写"男主参考图片 1，女主参考图片 2"。
- 旋转镜头把人转变形：把"快速绕着旋转"改成"缓慢环绕半圈"。
- 雨太大看不清脸：加"雨丝清晰但不遮挡面部"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020687040853975223) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
【Style】Popular Chinese web drama style (Mini-Drama Style), extreme fast-cut rhythm, high attractiveness filter, emotional outburst, romantic and heart-wrenching rainy night.
【Duration】15 seconds
【Characters】Deeply affectionate tycoon male lead (black coat, wet hair, red-rimmed eyes) VS stubbornly broken-hearted female lead (white dress, face full of tears).
[00:00-00:05] Shot 1: Rapid cut combination (Rapid Cuts).
Rainy street. Female lead decisively turns to leave (back view). Male lead rushes up and grabs her wrist (close-up). Female lead suddenly turns back, eyes showing pain filled with love and hate.
【Dialogue lip-sync guidance】Female lead cries out: "Let go! We're done!"
[00:05-00:10] Shot 2: Truth explosion (Intense Close-ups).
Male lead refuses to let go, rainwater streaming down both their faces. Male lead urgently pulls out a ring (or a document) from his chest, raises it in front of her, fingers trembling.
【Dialogue lip-sync guidance】Male lead shouts: "Look carefully! I never deceived you!"
[00:10-00:15] Shot 3: Emotional dam burst (Climax).
At the moment the female lead sees the object in her hand, her pupils shake (extreme close-up), covers her mouth, defenses collapse. The next second, the male lead suddenly pulls her into his arms and holds her tightly, as if trying to merge her into his bones. The camera quickly rotates and circles around the two embracing.
【Dialogue lip-sync guidance】Female lead sobs with her head down (silent/whimpering).
```
