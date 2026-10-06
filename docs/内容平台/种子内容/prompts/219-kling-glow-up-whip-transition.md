---
title: 可灵提示词：甩镜变装视频（疲惫素颜到精致妆容 · 美妆前后对比）
slug: kling-glow-up-whip-transition
model: kling
topics: [product-video, short-drama]
aspectRatio: "9:16"
needsRefImage: true
useCase: 生成 8 秒竖屏"甩镜头一秒变装"视频：前半段疲惫灰暗，甩镜后变成金色光线下的精致造型，适合美妆、发型、穿搭类产品的前后对比广告和变装短视频。
prompt: |
  以我上传的人物照为准，生成一条竖屏、约[8]秒、感觉像一镜到底的自拍视频，在一次甩镜中从灰暗切换到光彩照人。
  0–3 秒｜之前：一位疲惫的女生瘫坐在杂乱的书桌前，头顶是平淡的日光灯，画面偏灰绿、发暗，碎发翘起，素颜，环境里有低低的房间嗡鸣声。她把一个[粉饼盒]举向镜头，镜头向左猛地甩出去，带着运动模糊。
  3–7 秒｜之后：模糊散开，还是同一个女生，此时被[金色黄昏的窗光]从背后照亮，皮肤透亮，头发蓬松有型，换上[精致的穿搭]，画面色彩饱满；她"啪"地合上粉饼盒，自信地勾起嘴角。
  7–8 秒：她凑近镜头，快速眨一下眼。
  卡点节奏，合盖时一声清脆的"咔哒"，转场时一声上扬的"嗖"。
  [粉饼盒]的形状、盖面图案和颜色前后一致；人脸不能变成另一个人，不变形、不漂移、没有伪影。
negativePrompt: 换成另一张脸，五官变化，脸部变形，多余的手指，粉饼盒变形，画面闪烁，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#glow-up-transformation-whip
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站补充"以上传的人物照为准"和负面提示词；道具、光线、穿搭和时长改为变量
images:
  - 219-kling-glow-up-whip-transition-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/glow-up-transformation-whip.png
  license: CC BY 4.0
verify:
  - 在可灵实测：甩镜前后是否还是同一张脸（这是本条最容易失败的地方）
  - 可灵对真人照片作为首帧的限制和审核规则（以官方说明为准）
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：前 3 秒"之前"，中间一个甩镜，后 4–5 秒"之后"。在可灵选 5 秒时，把"之前"压到 2 秒、删掉最后的眨眼；选 10 秒时可以在"之后"加一个转身展示穿搭的动作。

**最稳的做法（首尾帧）**：用同一个人的两张照片——一张素颜居家、一张化好妆——分别作首帧和尾帧，提示词只写"中间甩镜头转场"。只用一张照片时，模型要"想象"变装后的样子，脸最容易变。

**怎么填变量**：[粉饼盒] 换成你要推的产品（口红、卷发棒、香水）；[精致的穿搭] 写具体，如"白衬衫配珍珠耳环"。

**常见失败与调整**：
- 变装后像换了一个人：用首尾帧；或把"换上精致穿搭"删掉，只改光线和妆容。
- 甩镜不够快，变成慢慢溶解：写"0.3 秒内的快速甩镜，带强烈运动模糊"。

**提醒**：只用本人或已获授权的照片；广告中前后对比要真实，不要夸大产品效果。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Single continuous-feel selfie shot, vertical, that snaps from drab to radiant on a whip-pan. 0-3s — BEFORE: a tired woman slumps at a cluttered desk under flat fluorescent light, dull grey-green color grade, flyaway hair, no makeup, low ambient room hum. She lifts a [product] compact toward the lens and the camera whip-pans hard left with motion blur. 3-7s — AFTER: the blur resolves on the same woman, now backlit by warm golden-hour window light, glowing skin, soft volumized hair, a styled outfit, rich saturated grade; she snaps the compact shut with a confident smirk. 7-8s: she leans in and gives a quick wink to camera. Beat-synced energy, a satisfying compact-click and a rising swoosh on the transition. The compact keeps the same shape, lid art, and color before and after — no morphing of the face into a different person, no deformation, drift, or artifacts.
```
