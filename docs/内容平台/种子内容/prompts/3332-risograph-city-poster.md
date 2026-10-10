---
title: AI海报提示词：双色孔版印刷（Riso）风城市街景海报，荧光粉 + 青蓝套色错位
slug: risograph-city-poster
model: gpt-image-2
topics: [poster, illustration]
needsRefImage: false
aspectRatio: "2:3"
useCase: 想做独立杂志、音乐演出、文创市集那种 lo-fi 手工印刷感海报时用，得到只有两种油墨、带网点颗粒和套印错位的城市街景竖版海报。
prompt: |
  一张城市街景插画，模仿双色孔版印刷（Riso）的效果。
  - 只用两种油墨：[荧光粉]和[青蓝]，两色叠印的地方形成深海军蓝；
  - 带有孔版印刷特有的颗粒感和手工质感，能看到半调网点，两种颜色故意有轻微的套印错位；
  - 主体：高反差的[城市街道]，有外挂消防梯和电线杆、电线；
  - 明暗只靠网点疏密来表现，整体粗粝、低保真；
  - 构图用平面色块和大胆的剪影：粉色铺天空，青蓝色画建筑阴影；
  - 气质独立、文艺，带着对手工自印小志（zine）文化的怀旧；
  - 画面一角印着"[SHIFT]"字样，字体扭曲、油墨很重；
  - 竖版画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-more-illustration-styles.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；两种油墨颜色、街景主体、角落文字、画幅设为变量；补充竖版画幅
images:
  - 3332-risograph-city-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/more-illustration-styles/risograph-urban-landscape.png
  license: MIT
verify:
  - 示例图里出现了真实街名路牌和一张带城市名的墙面海报，商用前确认是否需要去掉，可在提示词里加"路牌和墙面不要出现可读文字"
  - 换成"老城区骑楼""菜市场门口"出一次，看双色网点效果是否保持
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[荧光粉] 和 [青蓝] 是两种油墨，经典组合还有"橙红 + 钴蓝""明黄 + 墨绿"；[城市街道] 可以换成"老城区骑楼""菜市场门口""地铁站出口"；[SHIFT] 是角落的大字，换成活动名或刊物名，中文也行，但建议 2～4 个字。示例图是一张粉色天空的竖版海报：右边一排老砖楼挂满消防梯，左边一根电线杆拉出很多电线，整体只有粉和青两色，网点颗粒明显，左下角是粉色的"SHIFT"粗字。

**常见问题与调整**：
- 颜色不止两种：强调"严格只有两种油墨，叠色处是唯一的第三色"。
- 太干净像数码插画：加"明显的网点、纸张纤维、边缘套印偏移 2～3 毫米"。
- 角落文字被画成路牌：明确"文字是印刷在海报上的标题，不是场景里的招牌"。
- 想做演出海报：在底部加"一行小字：[日期] [场地]"，并留出文字区。

**适合**：独立刊物封面、演出 / 市集海报、文创明信片；不适合需要写实感或品牌严肃感的商业广告。

### 英文原版

```
An urban landscape illustration created in the style of a two-color Risograph print. The palette is limited to 'Fluorescent Pink' and 'Teal Blue', with a dark navy created where the two inks overlap. The image has the characteristic grainy, tactile texture of Riso printing, with visible halftones and a slight, intentional 'misregistration' where the colors don't perfectly align. The subject is a high-contrast view of a city street with fire escapes and power lines. The lighting is represented through the density of the dot patterns, creating a gritty, lo-fi aesthetic. The composition uses flat shapes and bold silhouettes, with the pink ink used for the sky and the teal for the building shadows. The mood is indie, artistic, and nostalgic for DIY zine culture. The text 'SHIFT' is printed in the bottom corner in a distorted, ink-heavy typeface.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
