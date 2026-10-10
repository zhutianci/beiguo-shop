---
title: 角色设定提示词：赛博朋克城区世界观设定板（街景大图 + 角色特写 + 等距地图 + 道具）
slug: cyberpunk-worldbuilding-board
model: gpt-image-2
topics: [game-art, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做原创游戏、小说或短片的世界观提案时，用一张杂志排版的横版设定板同时交代城区氛围、主要角色、地图路线和标志性道具。
prompt: |
  创建一张赛博朋克风的角色与城区设定板，采用高级杂志排版，横版 16:9。
  - 标题文字："[城区名称]"；
  - 设定板分成五个不对称的版块：
    1. 一张大幅电影感街景：雨夜里湿漉漉的[高架夜市]；
    2. 两张原创成年[赛博朋克快递员]的近景肖像，身上有发光的[兰花纹身]；
    3. 一张小的等距地图，画出小巷和无人机航线；
    4. 一张道具版块：加密通行证、机械义体手套、自动售货机贴纸；
  - 色彩：层叠的霓虹洋红、青色、酸性绿，湿沥青的倒影，全息招牌；
  - 画面信息密但好读，有杂志式页边距和小标签，统一的复古未来动漫 / 赛博朋克画风；
  - 只用原创角色，不涉及任何已有 IP，不出现露骨内容；
  - 画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-retro-and-cyberpunk.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并按版块拆成要点；城区名称、主场景、角色职业、标志元素、画幅设为变量
images:
  - 3335-cyberpunk-worldbuilding-board-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/retro-cyberpunk/neon-orchid-district-board.png
  license: MIT
verify:
  - 示例图招牌上有日文和中文混排的小字，检查是否存在错字或无意义字符
  - 换一个世界观（如"蒸汽朋克港口"）出一次，看五版块排版是否稳定
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[城区名称] 写你的原创地名，比如"霓虹兰区""九龙下层""第七环城"；[高架夜市] 是主街景，可换成"地下赛车场""海上浮岛码头"；[赛博朋克快递员] 换成角色职业，如"义体医生""黑客乐手"；[兰花纹身] 是贯穿全图的标志元素，换成"锦鲤""电路纹""莲花"都行。示例图是一张黑底霓虹粉的横版设定板：左边大图是雨夜高架下撑伞的人群和"蘭区夜市"招牌，中上两张男女角色近景，右上一张多层等距地图，右下展示通行证、机械手套和霓虹贴纸。

**常见问题与调整**：
- 版块挤在一起看不清：减少到四个版块，或画幅改为 21:9 加宽。
- 文字乱码太多：加"只保留标题和版块编号，其他标签用图标代替"。
- 角色风格不统一：追问"两位角色使用同一画风，线条粗细和上色方式一致"。
- 想把角色单独展开：用这张图的角色继续追问"为左侧角色单独出一张三视图设定表"。

**适合**：原创世界观提案、游戏 / 小说立项资料、概念美术作品集；不适合模仿已有影视或游戏 IP。

### 英文原版

```
Create a cyberpunk character-and-city design board in a premium magazine-layout format, landscape 16:9. Title text: "NEON ORCHID DISTRICT". The board is divided into five asymmetric panels: one large cinematic street scene of a rain-soaked elevated night market, two close-up portrait panels of original adult cyberpunk couriers with glowing orchid tattoos, one small isometric map panel showing alleys and drone routes, and one artifact panel showing encrypted transit passes, cybernetic gloves, and vending-machine stickers. Use layered neon magenta, cyan, acid green, wet asphalt reflections, holographic signage, dense but readable composition, editorial margins, small labels, and a cohesive retro-future anime/cyberpunk style. Original characters only, no existing IP, no explicit content.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
