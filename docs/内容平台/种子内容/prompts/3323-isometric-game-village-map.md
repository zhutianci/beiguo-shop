---
title: 游戏UI提示词：等距视角奇幻村庄策略地图（茅草屋 + 喷泉广场 + 码头，带图例）
slug: isometric-game-village-map
model: gpt-image-2
topics: [game-art, illustration]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做独立游戏关卡原型、桌游 / 跑团地图、策略游戏宣传图时用，生成网格清晰、角度标准的等距村庄地图，房屋、道路和高差一目了然。
prompt: |
  生成一张色彩明快的等距视角[奇幻村庄]地图，采用干净的网格布局，每格[3x3 米]。
  - 建筑与道路：[木屋配茅草屋顶]，鹅卵石小路，中央是一座石砌喷泉广场；
  - 地形高差：地图一角抬升成约 2 米高的草坡，用石阶连接低处地面；
  - 角度严格保持等距视角，能直接当游戏地图使用；
  - 光线：温暖的阳光斜照，屋顶上投下清晰的光束和长影；
  - 像手工打磨的策略游戏地图：格子逻辑清楚、环境细节可爱、色彩丰富但有节制；
  - 可在角落加一个小图例，说明地面、台阶、水域、树木等符号；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-isometric.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；场景主题、网格尺寸、建筑样式、画幅设为变量；按示例图补充了角落图例的可选要求
images:
  - 3323-isometric-game-village-map-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/isometric/isometric-fantasy-village.png
  license: MIT
verify:
  - 原始出处：原帖：https://www.reddit.com/r/midjourney/comments/1hkqr4x/isometric_maps_prompts_included/，核对原帖仍可访问、作者未另行声明保留权利
  - 换成"沙漠绿洲集市""雪山矮人要塞"各出一次，看网格和等距角度是否稳定
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[奇幻村庄] 可以换成"江南水乡小镇""沙漠绿洲集市""海盗港口"；[木屋配茅草屋顶] 跟着主题换，比如"白墙黛瓦""土坯房配布篷"；[3x3 米] 是网格尺寸，跑团地图常用"1.5 米一格"。示例图是一张方形等距地图：中间圆形喷泉广场，周围十来栋茅草屋，右上抬高的草坡上有石阶和风车，左下是水面和木码头，左上角有英文图例，左下角有罗盘。

**常见问题与调整**：
- 视角不是标准等距：加"严格 2:1 等距投影，所有建筑朝向一致，不要透视变形"。
- 网格看不出来：追问"在地面上叠加淡淡的格子线"。
- 图例文字是英文：要求"图例文字用中文"，或去掉图例后自己排版。
- 想做多张同风格关卡：第一张满意后说"保持同样画风和网格尺寸，换成[森林营地]"。

**适合**：游戏原型、桌游 / 跑团地图、像素以外的策略游戏宣传图；不适合当作直接可用的切片素材，正式开发还需美术重绘或拆分。

### 英文原版

```
Create a vibrant isometric fantasy village map with a clean grid-based layout using 3x3 meter tiles. Include wooden houses with thatched roofs, cobblestone paths, and a central stone fountain. One corner of the map rises into a small grassy hill about 2 meters high with stairs connecting to the lower ground. Keep the isometric angle precise and game-ready. Warm sunlight sends clear rays and long shadows across the rooftops. Make the scene readable like a handcrafted strategy-game map, with crisp tile logic, charming environmental detail, and rich but controlled color.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
