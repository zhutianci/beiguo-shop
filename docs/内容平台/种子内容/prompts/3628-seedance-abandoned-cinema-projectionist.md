---
title: seedance 提示词：拆迁中的老电影院（老放映员看最后一场 · 漂白胶片质感长镜头）
slug: seedance-abandoned-cinema-projectionist
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 有文艺片质感的情绪长镜头：一座正在拆除的社区老影院里，老放映员独自坐在废墟中看最后一部电影，镜头从门口沿过道推进再绕到他身后露出银幕。适合短片开场、怀旧主题视频、电影感练习。
prompt: |
  在一座正在拆除的[社区老电影院]里，一位年迈的放映员独自坐在破败观众厅的正中央，看着这座建筑消失前放映的最后一部电影。
  四周是一排排落满灰尘的丝绒座椅，部分天花板已经塌落，日光从墙上的一个大洞照进来，窗外能看到施工机械。
  放映机还在运转，光束穿过浓厚的灰尘。
  镜头从破损的入口缓缓沿着过道向放映员推进，然后绕到他身后，露出投在残破银幕上的画面。
  画面质感：写实的真人电影摄影，漂白效果（留银）冲洗工艺，褪色的酒红和金色几乎被压成灰色，深黑，明亮的银色高光，强烈反差，粗重的 35mm 胶片颗粒，细微的划痕和曝光起伏。
  情绪克制，不煽情。
  时长约[10]秒，16:9。
negativePrompt: 煽情特写，泪流满面，鲜艳色彩，卡通，文字，字幕，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/AllaAisling/status/2106515375559217226
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；场所和时长改为变量；补充画幅"
images:
  - 3628-seedance-abandoned-cinema-projectionist-1.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://x.com/AllaAisling/status/2106515375559217226
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录"推进后绕到身后"的复合运镜是否执行
  - 银幕上投出的画面是否出现乱码文字
  - 确认原帖仍可访问
---
**时长与镜头**：这是一个连续长镜头，没有剪辑：入口 → 沿过道推进 → 绕到人物身后 → 露出银幕。建议 10–12 秒，太短运镜会显得急。如果平台只能选 5 秒，就只保留"沿过道推进到人物背后"，把绕行和银幕留给第二条。

**为什么好用**：这条提示词的价值在"画面质感"那一段——漂白（bleach bypass）是真实的胶片冲洗工艺，写出"留银、低饱和、高反差、粗颗粒、划痕"这些具体特征，比写"电影感""复古"有效得多。这一段可以单独拿出来，套到任何你想要冷峻、怀旧质感的场景里。

**怎么填变量**：[社区老电影院] 换成"关闭的老照相馆""停运的绿皮火车车厢""拆迁中的老理发店"，人物相应换成"老摄影师""老列车员""老理发师"，"最后一场电影"换成那个场所的"最后一次"。

**常见失败与调整**：
- 色彩还是很鲜艳：加"几乎黑白，只保留一点点暗红"。
- 放映员转过头对镜头表演：写"他始终背对或侧对镜头，一动不动"。
- 银幕上出现清晰的电影画面或文字：写"银幕上只是一片晃动的光影"。

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2106515375559217226) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Inside an abandoned neighborhood cinema being demolished, an elderly projectionist sits alone in the middle of the ruined auditorium watching the final film before the building disappears. Rows of dusty velvet seats surround him, sections of the ceiling are missing, daylight enters through a huge hole in the wall, construction machinery visible outside. The projector continues running, its beam cutting through thick clouds of dust. The camera slowly travels from the ruined entrance down the aisle toward the projectionist, then circles behind him to reveal the projected image across the damaged screen. Realistic live-action cinematography, bleach-bypass film processing, faded burgundy and gold reduced almost to gray, deep blacks, brilliant silver highlights, severe contrast, heavy 35mm grain, subtle scratches and exposure variation, emotionally restrained, no melodrama.
```
