---
title: AI海报提示词：浮世绘木刻版画重绘现代街景（手机变发光卷轴、地铁变木制百足车、机器人变铠甲巨像）
slug: ukiyoe-future-city
model: nano-banana
topics: [illustration, poster]
needsRefImage: false
aspectRatio: "3:4"
useCase: 想把一个现代场景（十字路口、地铁站、商场）用江户浮世绘的方式"穿越"重绘时用，得到带木纹、套色错位和印章的竖版版画海报，适合做文创、国潮 / 和风海报或创意社媒图。
prompt: |
  一幅日本江户时代的浮世绘木刻版画，整体感觉像传统浮世绘大师用古老的眼光重新想象现代科技，带超现实感。
  - 场景：[繁忙的十字路口]；
  - 江户化改造规则：人物都穿江户时代的和服，却在做现代的事；所有科技都变成超现实的江户版本：
    · 智能手机 → 发光的、画着插画的纸卷轴，人们正专注地读着；
    · 地铁站和列车 → 巨大的、分节的[木制百足车]，在人群中缓缓爬行；
    · 摩天大楼 → 无尽高耸、直插云霄的木塔；
    · 机器人和机甲 → 身披铠甲的巨型木刻[武士巨像]；
  - 构图：扁平化透视，粗犷的手刻墨线；背景是高度程式化的浮世绘浪花纹和翻卷的云，地平线远处能看到一座[雪山]；
  - 必须像实体版画，而不是数字绘画：
    · 质感：明显的木纹和粗糙的纸张纤维；
    · 印刷瑕疵：颜料洇开，模拟手工压印的套色轻微错位；
    · 配色：严格限定传统矿物颜料，以普鲁士蓝、朱红、低饱和土黄为主；
    · 光线：柔和、平面、没有阴影，没有数码渐变；
  - 竖版 3:4 海报，加上描述场景的竖排书法题字"[题字内容]"，一角盖一枚传统红色落款印章。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/VoxcatAI/status/1995497350543110411
  author: "@VoxcatAI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；场景、交通工具、巨像、远景山、题字设为变量；删去原文点名的两位历史画家和具体地名，改为风格描述
images:
  - 3350-ukiyoe-future-city-1.jpg
imageCredit:
  by: "@VoxcatAI"
  url: https://cms-assets.youmind.com/media/1764915832381_renotr_G7FuPlzbYAAsuo2.jpg
  license: CC BY 4.0
verify:
  - 示例图题字为日文汉字，用中文题字出一次，检查竖排书法是否清晰
  - 换成国内场景（如"早高峰的地铁站"）出一次，看改造规则是否仍生效
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
**怎么填变量**：[繁忙的十字路口] 换成任何现代场景，比如"早高峰的地铁站""外卖骑手穿梭的商业街""机场候机厅"；[木制百足车] 是交通工具的变体，可换"纸灯笼飞艇""木轮蒸汽轿子"；[武士巨像] 换成"石狮巨像""木雕力士"；[雪山] 换成你想要的远景地标；[题字内容] 写一句描述场景的短句。示例图是一张竖版浮世绘：左边是层层叠叠的木塔和挂灯笼的街道，中间一辆冒着白汽的木制百足车，右侧一尊举着巨棒的铠甲巨像，前景两个戴斗笠的人在看发光的卷轴，远处是雪山和弯月，右侧有竖排日文题字和红色印章。

**常见问题与调整**：
- 太像数码插画：再强调"木纹清晰、纸纤维明显、颜色有套印偏移"。
- 颜色太多：限定"只用靛蓝、朱红、土黄和墨黑四色"。
- 想要中国风版本：把"江户浮世绘"改成"明清木版年画"，服饰改成"汉服"，题字改为中文。
- 题字乱码：缩短到 4～8 个字，或要求"不写题字，只盖印章"。

**适合**：文创海报、和风 / 国潮创意图、社媒"古今穿越"系列内容；不适合需要严格还原历史服饰考据的场合。

### 英文原版

```
A Japanese Edo-period Ukiyo-e woodblock print. The overall feeling is a surreal collaboration between masters like Hokusai and Hiroshige, reimagining modern technology through an ancient lens.

**The scene:** {argument name="modern scene" default="a busy Shibuya scramble crossing"}

**Edo transformation logic:**
Characters wear Edo-era kimono but perform modern actions. All technology is transformed into surreal Edo equivalents:
* Smartphones are glowing, illustrated paper scrolls being read intently.
* Metro stations and trains are giant articulated wooden centipede carriages shuffling through crowds.
* Skyscrapers are reimagined as endless, towering wooden pagodas reaching into dramatic clouds.
* Robots and mecha appear as giant, armored woodblock golems.

The composition uses a flattened perspective with large, bold, hand-carved ink outlines. The background features heavily stylized Ukiyo-e wave patterns and dramatic, swirling clouds, with a distant Mt. Fuji visible on the horizon.

The image must look like a physical print, not a digital painting.
* Texture: strong visible wood grain texture and rough paper fibers throughout the piece.
* Printing imperfections: pigment bleeding is evident. Simulate hand-pressed plates with slight color misalignment for authenticity.
* Color palette: strictly limited to traditional mineral pigments, with dominant use of Prussian blue, vermilion red, and muted yellow ochre.
* Lighting: soft, flat, shadow-free lighting with no digital gradients.

Aspect ratio is 3:4 vertical poster. Include vertical Japanese calligraphy describing the scene and a traditional red artist seal stamp in a corner.
```

> 改编自 [@VoxcatAI](https://x.com/VoxcatAI/status/1995497350543110411) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
