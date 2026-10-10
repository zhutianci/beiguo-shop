---
title: 可灵提示词：咖啡前后对比广告（隔夜冷咖啡 → 现冲一杯热气腾腾 · 竖屏 6 秒）
slug: kling-coffee-cold-to-fresh-pour
model: kling
topics: [product-video, food]
aspectRatio: "9:16"
needsRefImage: true
useCase: 咖啡豆、挂耳、咖啡机、速溶的"复活"式前后对比：先是早上 7 点桌上那杯冷掉的隔夜咖啡，手一拿走，新鲜的一杯冲下来，热气和暖光一起出现。
prompt: |
  以我上传的马克杯图为准，生成一条约 6 秒的竖屏 9:16 视频。
  早上 7 点的办公桌，一杯昨天剩下的冷咖啡放在平淡的灰色办公室光线下——表面结了一层暗淡的膜，没有热气，毫无生气。
  0–2 秒：缓慢推近那层浑浊的表面，画面不调色、没有生气，灰尘静静悬在空气里。
  2–4 秒：一只手把这杯冷咖啡拿出画面，一股新鲜的[手冲咖啡]从上方冲下，微距：深色水柱打进杯里，泡沫涌起、翻卷，金色的窗光斜扫过来。
  4–6 秒：热气在体积光的逆光中盘旋，油脂在杯中慢慢旋转，前景虚化处是清晰的烘焙咖啡豆；调色转为温暖、饱和、诱人。
  液体的物理表现始终真实，杯子的形状、杯沿和把手完全不变：不扭曲、不融化、液面不跳变。
  声音：安静的注水声，然后是满足的第一口。
negativePrompt: 杯子变形，把手消失，液面跳变，液体断流，热气过多像烟雾，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#coffee-bloom-resurrection
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的马克杯图为准\"和负面提示词；原文的品牌改为\"手冲咖啡\"变量"
images:
  - 3617-kling-coffee-cold-to-fresh-pour-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/coffee-bloom-resurrection.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：冷咖啡被拿走、新咖啡冲入时杯子是否变成另一只
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：灰暗推近 → 拿走 + 注入 → 暖色热气。和普通咖啡广告的区别在于"前 2 秒故意拍得难看"：不调色、平光、静止，这样后面暖色一出来，对比感就是卖点。可灵 5 秒档把第一段压到 1.5 秒；10 秒档可以在结尾加"一只手握住杯子端起来"。

**怎么填变量**：[手冲咖啡] 换成"意式浓缩""冷萃倒入冰块""热茶"。做咖啡机广告时把注入改成"咖啡机出液口流下双股咖啡"，首帧上传咖啡机和杯子同框的图。

**常见失败与调整**：
- 拿走旧杯、放下新杯变成了"换杯子"：直接写"同一只杯子，冷咖啡被倒掉，重新冲入"。
- 热气多到像着火：写"几缕细细的热气"。
- 水柱断断续续：写"一股连续不断的水柱"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
7am desk, 9:16. A cold mug of yesterday's coffee sits in flat gray office light — a dull skin on the surface, no steam, no life. [0-2s] slow dolly-in on that scummy surface, ungraded and lifeless, dust hanging in the still air. [2-4s] a hand lifts the dead mug out of frame and a fresh pour from [brand] streams down in macro: the dark jet hits the cup, the bloom rises and folds, golden window light raking across it. [4-6s] steam curls in volumetric backlight, crema swirling in a tight slow rotation, roasted beans crisp in foreground bokeh; the grade pushes warm, saturated, appetizing. Liquid physics stay consistent throughout, the cup keeps its exact shape, rim, and handle — no warping, melting, level-drift, or surface artifacts. Implied sound: a quiet pour, the first satisfied sip.
```
