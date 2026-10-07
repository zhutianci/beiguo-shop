---
title: 游戏UI提示词：奇幻 RPG 冒险小队过巨型石桥的游戏截图式主视觉（带任务提示 HUD）
slug: fantasy-rpg-bridge-key-art
model: gpt-image-2
topics: [game-art, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做原创奇幻游戏的概念宣传图、跑团 / 小说封面、游戏策划提案时，生成一张"小队背影 + 远方光之城 + 轻量 HUD"的 3A 风截图，既像宣传画又有可玩感。
prompt: |
  创作一张原创的史诗奇幻 RPG 主视觉截图。
  - 主体：一支小小的冒险队伍在日出时分穿过一座巨大古老的石桥，走向远处[山巅上发光的城市]；
  - 角色：一名游侠领头，一名法师提着灯笼，一名矮人模样的铁匠扛着锤子，旗帜在风中猎猎作响；
  - 环境：桥下是辽阔山谷和瀑布，金色云海，风化的石砌结构，电影级的宏大尺度；
  - 界面：画面中有低调的 HUD——[任务标记]和指南针，以及角色血条和技能图标；
  - 质感：盔甲与环境细节丰富，3A 奇幻冒险基调，振奋人心。
  画幅[16:9] 横版，高细节。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-gaming.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并按主体 / 角色 / 环境 / 界面拆成要点；目的地、HUD 元素、画幅设为变量；补充了血条技能图标等界面描述和常见问题
images:
  - 3207-fantasy-rpg-bridge-key-art-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/gaming/epic-fellowship-bridge.png
  license: MIT
verify:
  - 原文要求 16:9，示例图实际接近 3:2，确认出图比例
  - 示例图 HUD 文字为英文，换中文任务文字时检查是否错字
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[山巅上发光的城市] 可以换成"悬浮在云中的浮空岛""火山口里的矮人要塞""被冰封的古代神殿"；[任务标记] 可以写成具体任务文字，如"[任务：前往光之城]"，但短句更容易写对。角色组合也能直接改，比如"一名女骑士、一名吟游诗人、一只狼"。示例图是仓库作者的出图：四名旅人背对镜头走在石桥上，最近的是扛锤子的矮人和披斗篷的游侠，深蓝旗帜飘扬，远处山峰上是层层白色城堡，右侧太阳升起、瀑布落入云海；右上角有任务面板，左下是血条，右下是一排技能图标。

**常见问题与调整**：
- 像普通插画没有游戏感：加"第三人称越肩视角，画面边缘有完整的游戏 UI"。
- HUD 太多挡画面：改成"只保留右上角任务提示和底部血条，其余 UI 隐藏"。
- 角色太小看不清：加"前景角色占画面高度的三分之一，盔甲纹理清晰"。
- 要做系列宣传图：追问"同一队伍和美术风格，换成在城门前与守卫对峙的场景"。

**适合**：原创游戏概念宣传、跑团 / 网文封面、游戏策划提案；不适合冒充已上线游戏的真实截图。

### 英文原版

```
Create an original epic fantasy RPG key-art screenshot. A small fellowship of travelers crosses a colossal ancient stone bridge toward a luminous mountain city at sunrise. One ranger leads, a mage carries a lantern, a dwarf-like smith bears a hammer, and banners whip in the wind. Vast valley below, waterfalls, golden clouds, weathered masonry, cinematic scale, subtle HUD quest marker and compass, richly detailed armor and environment, AAA fantasy adventure tone, 16:9 landscape, highly detailed and uplifting.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
