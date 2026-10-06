---
title: veo 3 提示词：香薰蜡烛氛围广告（深夜书房 · 划火柴点烛的明暗光影）
slug: veo-candle-library-ambient
model: veo
topics: [product-video, cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 8 秒的家居香氛广告：火柴划燃点亮烛芯、镜头沿皮面精装书架后退、琥珀色烛罐里蜡液融化、一缕烟散进暗处。适合香薰蜡烛、扩香、家居品牌的详情页视频和社媒氛围短片。
prompt: |
  约[8]秒的高级家居香氛广告，16:9 横屏。主角是一只[琥珀色玻璃罐香薰蜡烛]，场景是一间昏暗的木质护墙板书房。
  0–2 秒：火柴划燃的微距特写，硫磺火星迸开，火焰在慢动作里点着烛芯，一缕烟卷曲着升起。
  2–4 秒：镜头缓缓后退，沿着一排皮面精装书的书脊移动，跳动的烛光掠过烫金书名，焦点始终停在点燃的烛罐上。
  4–6 秒：一段轻柔的视差推轨，从琥珀色玻璃罐旁滑过，表面的蜡液慢慢融化成一汪，罐身上压印的[品牌标识]被烛光从里面照亮。
  6–8 秒：缓慢推近到主视觉画面，一缕慵懒的烟丝向上飘，消散在四周的暗影里。
  烛罐、标签、压印和火焰的形状与质感全程保持一致，火焰不闪烁跳帧。
  画面：烛光下的强明暗对比，融化的蜡与旧皮革的质感。
  声音：火柴划燃的"嚓"声，烛芯轻微的噼啪声，低低的室内底噪。
negativePrompt: null
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#candle-midnight-library
  author: awesome-ad-video-prompts contributors
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；时长、产品、品牌标识改为变量；声音描述补充了划火柴声
images:
  - 541-veo-candle-library-ambient-1.jpg
imageCredit:
  by: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/candle-midnight-library.png
  license: CC BY 4.0
verify:
  - 在 Veo 3 实测 3 次：火柴点烛的手部动作是否自然，火焰是否闪烁跳帧
  - 罐身压印的标识是否变成乱码（大概率需要后期叠加）
  - 示例图是仓库提供的关键帧图（书房桌上点燃的琥珀色烛罐，已转 JPG 压缩），不是 Veo 成片截图
---
**时长与镜头**：四段是"点燃 → 环境 → 产品 → 余韵"，节奏很慢，靠光影和声音撑气氛，正适合 Veo 的原生音效。8 秒左右刚好；想要更短，删掉 2–4 秒的书架段，但这样会少了"这是什么样的生活"的信息。

**怎么填变量**：[琥珀色玻璃罐香薰蜡烛] 写清罐子颜色和形状；场景可以按香型换："[雨夜的窗边]"配木质调，"[铺着亚麻床品的卧室]"配白茶调，"[浴缸边]"配花香调，书架那段换成对应环境的物件即可。

**常见失败与调整**：
- 火焰抖动、忽大忽小：加"火焰稳定、缓慢摇曳，没有闪烁"。
- 画面太暗看不清产品：保留明暗对比，但加"烛罐始终是画面最亮的区域"。
- 标识乱码：删掉"压印的品牌标识"，后期加字。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Premium home-fragrance commercial for a [brand] amber-noir candle in a dim, wood-paneled library. 0-2s: macro of a match striking, sulfur sparking, the flame catching the wick in slow motion as a curl of smoke lifts. 2-4s: camera eases back along a shelf of leather-bound spines, warm flame-light flickering across gilded titles, shallow focus pinned on the lit vessel. 4-6s: a gentle parallax dolly past the amber glass jar, molten wax pooling at the surface, the embossed brand mark glowing from within the container. 6-8s: slow push to a hero shot, a lazy ribbon of smoke drifting up and dissolving into the surrounding shadow. The jar, label, embossing, and flame keep consistent shape and finish — no flicker-glitch, drift, deformation, or artifacts. Candlelit chiaroscuro, melted-wax and aged-leather texture, faint wick crackle over a low room tone.
```
