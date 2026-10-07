---
title: 游戏UI提示词：横屏手游 MOBA 战斗界面，摇杆 + 技能按钮 + 小地图一次画全
slug: mobile-moba-gameplay-hud
model: gpt-image-2
topics: [game-art]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做原创手游的界面概念稿、游戏 UI 课程作业、立项演示时，生成一张像真实录屏的横屏 MOBA 战斗截图：左下摇杆、右下技能键、顶部比分和计时、左上小地图都齐全。
prompt: |
  创作一张原创的横屏手游 MOBA / 动作 RPG 战斗截图，借鉴对线竞技类游戏的形式，但不照搬任何现有游戏。
  - 场景：黄昏金色时刻的明亮[奇幻竞技场]，三名风格化英雄在中央河道桥和发光水晶目标附近交战；
  - 镜头：略高的斜 45° 第三人称战斗视角，能看清兵线、小兵、技能特效、草丛、防御塔轮廓，远处有一个首领目标坑；
  - 界面：
    - 左下角半透明虚拟摇杆；
    - 右下角四个圆形技能按钮，带冷却数字，大招按钮发光、充能 87%；
    - 顶部中央比分条"[12 - 11]"、对局时间"[08:42]"、双方血条；
    - 左上角小地图，旁边是道具快捷栏，金币数"[3,420]"；
    - 边距符合手机安全区，图标清晰；
  - 美术：高品质二次元奇幻 3D 手游，[青绿 / 金 / 紫]高饱和配色，UI 锐利易读，技能特效动感，材质细节丰富，文字清晰；
  - 要有真实录屏的感觉，不是海报，也不是 UI 展示板；不出现任何真实游戏 logo。
  画幅[16:9] 横屏。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-gaming.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并把界面元素整理成分点清单；场景、比分、时间、金币数、主配色、画幅设为变量；补充了常见问题与改法
images:
  - 3208-mobile-moba-gameplay-hud-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/gaming/mobile-moba-arena-hud.png
  license: MIT
verify:
  - 原文要求 16:9，示例图实际接近 3:2，确认出图比例
  - 示例图技能名和装备名为英文，换中文界面时检查文字是否清晰无错字
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[奇幻竞技场] 可以换成"赛博朋克城市街区""东方仙侠山门""海底遗迹"；[青绿 / 金 / 紫] 换成"赤红 / 黑 / 金"就是更硬核的风格。比分、时间、金币这几个数字随便改，保持短数字最容易画对。示例图是仓库作者的出图：三名英雄在石桥边交战，蓝色和红色技能光效交错，后方是紫色水晶目标；左上角小地图下有两件装备卡，左下是圆形摇杆，右下是 Blink、AoE、Damage 等技能键，大招按钮显示 87%，顶部比分 12 - 11、时间 08:42，右上金币 3,420。

**常见问题与调整**：
- 界面像官方宣传海报：强调"这是玩家手机录屏，不要标题字，不要角色立绘"。
- 技能按钮位置乱：明确"右下角四个技能按钮呈扇形排列围绕大招键"。
- 想要竖屏版本：画幅改 9:16，摇杆和技能键改为"屏幕下方左右两侧"。
- 换成中文界面：把技能名写成"[闪现][回城][治疗]"等两字短词。

**适合**：原创手游 UI 概念稿、游戏 UI 设计练习、立项演示；不适合当作真实游戏截图或冒充已上线产品。

### 英文原版

```
Create an original landscape mobile MOBA / action-RPG gameplay screenshot, inspired by competitive lane-battle games but not copying any existing franchise. 16:9 landscape, polished mobile game HUD. Scene: a bright fantasy arena at golden-hour dusk, three stylized heroes clash near a central river bridge and glowing crystal objective. Camera: slightly elevated isometric third-person gameplay view, readable battlefield lanes, minions, spell effects, terrain brush, turret silhouettes, and a boss-objective pit in the distance. HUD design: bottom-left translucent virtual joystick, bottom-right four circular ability buttons with cooldown numbers, ultimate button glowing but 87% charged, top-center score bar reading "12 - 11", match timer "08:42", team health bars, mini-map in the top-left, item quick slots, gold counter "3,420", clean mobile-safe margins, crisp icons, no real game logos. Art direction: premium anime-fantasy 3D mobile game, saturated teal / gold / violet palette, sharp readable UI, dynamic spell VFX, high-detail materials, readable text, screen-capture feel, not a poster, not a mockup board.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
