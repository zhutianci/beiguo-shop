---
title: "ai游戏素材生成提示词：主题棋盘微缩模型模板，把棋子换成任意风格的建筑零件（Nano Banana）"
slug: themed-chess-set-diorama-nixie-tube
model: nano-banana
topics: [game-art, figurine]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "一个\"棋类 × 主题\"的万能模板：指定一种棋和一种主题，生成整副棋盘和棋子都由该主题的零件组装而成的可玩微缩模型。适合做桌游概念设计、周边提案和趣味创意图。"
prompt: |
  生成一张超精细的可玩微缩模型照片，画幅 1:1：一副[国际象棋]，棋盘和所有棋子都完全由[辉光管与蒸汽朋克电子元件]的零件组装而成。
  - 形态：棋子的造型仍然一眼认得出是哪个子（王、后、车、马、象、兵），但每一个都由该主题的微缩部件构成——例如玻璃真空管做身体、黄铜底座、铜线圈和齿轮做装饰，管内亮着橙色的数字或字母；兵是一排小号的发光管，各自显示不同的数字。
  - 棋盘：格子依然整齐分明，保持规整的网格——一种格子是拉丝黄铜板，另一种是带散热栅格和电路走线的深色格；棋盘边缘能看到电路板和铜管。
  - 材质：把该主题的真实材质用到棋具上（玻璃、黄铜、铜、焊点、电路板），取代常见的木头和塑料；发光部件真的在发光。
  - 环境：棋盘放在[凌乱的电子工作台]上，周围虚化处有钳子、电路板和零件。
  - 光线与镜头：从上方打下的戏剧性桌面灯光，斜向俯拍，微距浅景深，焦点在中间几枚大子上；不要文字水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2028486990371737916
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文是带权重标记的模板写法，这里改写为自然的中文分条；棋类与主题两个变量保留，并按示例图把默认值换成\"辉光管蒸汽朋克\"，新增环境变量；去掉了权重语法"
images:
  - 3555-themed-chess-set-diorama-nixie-tube-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://youmind.com/nano-banana-pro-prompts?id=11280
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[国际象棋] 可换"中国象棋""围棋""双陆棋""跳棋"；主题可换"赛博朋克霓虹城市""哥特大教堂""乐高风积木小镇""青花瓷与榫卯木作"——写主题时点出两三种标志性零件或材质，棋子才有东西可"拼"；环境跟着主题走，例如青花瓷主题放在"铺着宣纸的茶桌上"。

示例图是一副蒸汽朋克风的国际象棋：棋子都是带黄铜底座的玻璃真空管，里面亮着橙色的数字，前排的兵分别显示 1 到 8，后排能认出城堡形的车、弯成马头形的线圈管、戴王冠的后和顶着十字的王；棋盘由黄铜方板和带栅格的深色电路格交替组成，背景是散着钳子和电路板的工作台。

**常见问题**：
- 棋子认不出是什么子：强调"保留每种棋子的经典轮廓，只替换材质和细节"。
- 棋盘格子乱掉：写"8×8 规整网格，两种格子交替排列"。
- 中国象棋的棋子文字出错：改成"棋子顶面用符号或图案区分，不写汉字"。

**适合**：桌游与周边的概念设计、主题活动的主视觉、趣味创意图和壁纸。

### 英文原版

```text
Anchor:   `[{argument name="board game" default="Chess Set / Backgammon"}] :: [{argument name="architectural theme" default="Cyberpunk Neon City / Gothic Cathedrals"}]::3`
    Morphology:   `Hyper-detailed playable diorama, [Board Game] board and pieces constructed entirely via the assemblage of [Architectural Theme] components, pawns and tiles formed from miniature constituent parts of [Architectural Theme], tabletop structural engineering::3`
    Material Physics:   `Material properties of [Architectural Theme] applied to game pieces, illuminated windows, realistic city textures replacing wood/plastic, perfect grid layout maintained within the chaos::3`
    Illumination:   `Top-down dramatic table lighting, glowing elements from within the [Architectural Theme], deep ambient occlusion in the miniature streets::2`
    Render Stack:   `Tilt-shift tabletop photography, macro lens, f/4, 8k, extreme depth of field, photorealistic miniatures::1`
    Negative:   `[Standard Staunton chess pieces, flat cardboard, people playing, giant hands, messy, disorganized, 2D]:: -1`
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2028486990371737916) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
