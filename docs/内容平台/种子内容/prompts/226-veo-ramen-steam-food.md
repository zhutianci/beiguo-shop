---
title: veo 3 提示词：美食视频（拉面热气特写 · 居酒屋氛围）
slug: veo-ramen-steam-food
model: veo
topics: [product-video, cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 8 秒电影感的热汤面美食镜头：热气升腾、筷子挑面、辣油晕开，最后对焦到产品包装，带咕嘟声和吸面声，适合面馆、预制菜、调料品牌的广告。
prompt: |
  氛围感的[居酒屋]桌面，一盏纸灯笼下放着一碗黑色漆碗装的[豚骨拉面]，16:9，8 秒。
  0–2 秒：热气缓缓升起，卷成一缕缕的气柱；汤面上闪着金色的油珠，切开的溏心蛋泛着橙色的光。
  2–3.5 秒：筷子挑起一团面，汤汁顺着面条细细滴落，海苔和葱花轻轻颤动。
  3.5–5.5 秒：汤勺划过汤面，拖出一道[红色辣油]，在汤面上晕开。
  5.5–8 秒：镜头穿过升腾的热气向前推进，停在碗边的[一包调料包]上，焦点转到它的包装上。
  缓慢的电影感推轨，50mm 镜头，从容的焦点转移。暖钨丝灯主光，琥珀色的环境灯，四周接近全黑。
  鸡蛋、面条和碗的形状始终一致；热气自然流动，不闪烁、不循环、不变形、没有伪影。
  声音：汤轻轻咕嘟的声音，一声吸面声，灯笼的低低嗡鸣；没有背景音乐和人声。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#ramen-steam-ritual
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；场景、面食种类、辣油、结尾产品改为变量；补充"没有背景音乐和人声"
images:
  - 226-veo-ramen-steam-food-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/ramen-steam-ritual.png
  license: CC BY 4.0
verify:
  - 在 Veo 3 实测 3 次，记录"吸面声"等音效是否与画面同步
  - 筷子挑面时是否出现多余的手或筷子
  - 示例图是仓库提供的关键帧图（已转为 JPG 压缩），不是 Veo 成片截图
---
**时长与镜头**：时间码精确到 0.5 秒，是为了在 8 秒里塞进 4 个"馋人"瞬间：热气、挑面、淋油、产品。整条只有一个"缓慢推轨"的运镜，画面稳，美食才显得高级。

**怎么填变量**：换成中式汤面，把场景改成"[老街面馆]"，面换成"[红烧牛肉面]"，辣油换成"[一勺油泼辣子]"；做火锅、麻辣烫也可以套用，把"挑面"换成"夹起一片毛肚"。结尾的 [一包调料包] 换成你的产品，没有产品就改成"停在碗的特写上"。

**常见失败与调整**：
- 筷子穿过面条、手指不对：把挑面段改成"面条在汤里轻轻散开"，减少手的出镜。
- 热气像烟雾一样太浓：写"半透明的热气，不遮挡食物"。
- 包装上的字乱码：结尾改成虚化的包装，清晰版后期叠加。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Moody izakaya tabletop, a black lacquer bowl of tonkotsu ramen beneath a hanging paper lantern. 0-2s: steam climbs in slow curling columns, the broth surface glistening with golden fat pearls, a halved soft egg glowing orange; 2-3.5s: chopsticks raise a noodle nest, broth falling in fine strands while nori and scallion quiver; 3.5-5.5s: a ladle drags a stroke of chili oil that blooms red across the surface; 5.5-8s: the camera glides forward through the rising steam and settles on a [brand] sachet resting beside the bowl, rack-focusing onto its logo. Slow cinematic dolly-in, 50mm, deliberate focus pull. Warm tungsten key, amber practicals, rich near-black surround. Egg, noodles, and bowl keep consistent geometry, steam advects naturally with no flicker, looping, deformation, or artifacts. Implied sound: gentle bubbling, a single slurp, lantern hum.
```
