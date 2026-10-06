---
title: 可灵提示词：美食广告视频（蜂蜜淋在吐司上的慢动作特写）
slug: kling-honey-toast-food
model: kling
topics: [product-video, ecommerce]
aspectRatio: "1:1"
needsRefImage: false
useCase: 生成 6 秒方形的食物质感特写：蜂蜜拉丝、淋落、在黄油上晕开，适合蜂蜜、果酱、酱料、烘焙店的主图视频和社交媒体广告。
prompt: |
  美食棚拍，1:1，时长约[6]秒，镜头从正上方俯拍缓缓过渡到四分之三角度，[手工酸种吐司]放在带裂纹釉的陶瓷盘上。
  0–2 秒：一根木质蜂蜜棒从一罐[天然原蜜]里提起，一条完整不断的金色蜜丝在蜂蜜棒和罐子之间拉得紧绷。
  2–4 秒：蜂蜜淋落在正在融化的黄油上，汇成一小片，慢动作的同心涟漪向外扩散，烤面包的碎屑闪着光，一小撮[海盐片]像火花一样落下。
  4–6 秒：一只手把吐司微微倾斜，蜂蜜流到面包边缘，聚成一颗颤动的蜜滴，悬着不落。
  镜头带着轻微的手持呼吸感环绕约 30 度，浅景深。柔和的北窗自然光，蜂蜜色的反光板补光，低对比的哑光质感。
  蜂蜜始终是一条连续的黏稠蜜丝；面包碎屑数量和纹理前后一致，不扭曲、不融化变形、不漂移。
  声音：干脆的咀嚼感脆响，蜂蜜缓缓拉丝的声音，安静的厨房。
negativePrompt: 蜂蜜断裂成颗粒，液体像水一样稀，面包变形，多出来的手，画面闪烁，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#honey-drizzle-on-toast
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；原文为通用视频模型提示词，本站补充负面提示词；面包、蜂蜜、点缀物和时长改为变量
images:
  - 218-kling-honey-toast-food-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/honey-drizzle-on-toast.png
  license: CC BY 4.0
verify:
  - 在可灵实测 3 次，记录蜂蜜黏稠感是否真实（是否像水一样流）
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是可灵成片截图
---
**时长与镜头**：三段对应"拉丝—淋落—悬停"，正好是液体类美食最诱人的三个瞬间。可灵选 5 秒时直接用；选 10 秒时在最后加"吐司被切开，切面拉出蜜丝"。

**怎么填变量**：换成果酱写"[草莓果酱从勺子上缓缓滑落]"；换成巧克力酱写"[热巧克力酱淋在冰淇淋球上]"。关键是写清液体的黏稠度——"连续不断""缓慢""拉丝"。

**用图生视频更稳**：先用图像模型（或自己拍）一张吐司静物照作首帧，提示词里删掉场景描述，只保留三段动作和镜头运动。

**常见失败与调整**：
- 蜂蜜像水一样哗哗流：加"像糖浆一样黏稠，流速很慢"。
- 手指数量不对：删掉 4–6 秒的"一只手"，改成"盘子缓缓倾斜"。
- 画面太暗：把"低对比哑光"改成"明亮通透"，电商主图通常要亮一点。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Studio shot easing from flat overhead to three-quarter, artisan sourdough toast on cracked glazed ceramic. 0-2s: a wooden honey dipper lifts from a jar of [brand] raw honey, an unbroken golden thread stretching taut between dipper and jar; 2-4s: the drizzle lands and pools across melting butter, slow-motion concentric ripples spreading, toasted crumbs catching light while a pinch of flaky sea salt falls like sparks; 4-6s: a hand tilts the slice, honey creeps to the crust edge and gathers into one trembling drop that hangs without falling. Camera arcs 30 degrees on a subtle handheld breath, shallow depth. Soft north-window daylight, honey-gold bounce card, low matte contrast. The honey reads as a single continuous viscous strand, crumb count and bread texture stay fixed across frames, no warping, melt-glitch, drift, or artifacts. Implied sound: dry crunch, the slow stretch of honey, a quiet kitchen.
```
