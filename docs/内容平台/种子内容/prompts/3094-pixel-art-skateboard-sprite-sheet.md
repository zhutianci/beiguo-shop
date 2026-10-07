---
title: "AI像素画生成提示词：滑板少女 16 帧像素精灵表（复古游戏风，可做动图）（gpt-image-2）"
slug: pixel-art-skateboard-sprite-sheet
model: gpt-image-2
topics: [game-art]
aspectRatio: "1:1"
needsRefImage: false
useCase: "不需要参考图，直接用文字生成一张 4×4 的复古像素风角色精灵表：同一个街头风女孩完成一套滑板动作，16 帧按顺序排列，可以切成 GIF 动图或用作游戏素材。"
prompt: |
  生成一张干净的 4×4 像素风精灵表：[一个时髦的街头女孩]在玩滑板，适合做成 GIF 动画。
  画布：正方形，白色或透明背景，不要边框、文字和水印。恰好 16 个独立的全身精灵，均匀排成 4 列 4 行，每个精灵互相隔开、比例一致、留白充足。
  画风：高质量复古像素画，清晰的块状边缘，有限的调色板，柔和的赛璐璐明暗，可爱的 Q 版比例，表情生动，头发有动感，像电子游戏角色精灵表。
  角色：年轻的街头风女孩，[凌乱的金色长发]随风飘动，小蓝眼睛、蜜桃色皮肤、银色圈形耳环、粗银链项链，宽大的深橄榄色飞行员夹克、黑色短上衣、宽松黑裤和白色运动鞋。所有帧的比例和服装保持一致。
  滑板：黑色板面、浅木色边、米色小轮子和像素风支架；随动作改变角度，但设计保持一致。
  16 个动作（从左到右、从上到下）：
  1. 站在滑板上向前滑行，头发向左飘；2. 开始在板上下蹲，膝盖弯曲，一只手放低；3. 深蹲准备做动作，身体前倾；4. 极低的下蹲，表情专注，一只手靠近滑板；
  5. 滑板微微上翘，蹲姿保持平衡；6. 起跳，前脚抬起，头发飞扬；7. 空中动作，滑板斜着，双臂张开保持平衡；8. 更高的空中动作，滑板倾斜很大，调皮地吐舌头；
  9. 跳到最高点，双臂大张、吐舌头，滑板斜穿在身下；10. 从空中落下，滑板接近水平，手臂伸展；11. 落地下蹲，滑板略斜，表情专注；12. 落地后稳住，低姿态双臂张开；
  13. 低姿态滑行落地，轮子旁有小动线；14. 边滑边从蹲姿站起，侧面；15. 直立巡航，侧面，表情放松；16. 背影巡航，露出后背和飘动的头发。
  限制：16 个精灵是同一个角色、同一比例，网格整齐，不加道具和背景场景，能读成一段连续动画。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/aerialaliastgst/status/2097496668778455170
  author: "AA - AerialAlias🇯🇵"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；角色名、发色改为变量；保留 16 帧逐帧动作描述"
images:
  - 3094-pixel-art-skateboard-sprite-sheet-1.jpg
imageCredit:
  by: "AA - AerialAlias🇯🇵"
  url: https://youmind.com/gpt-image-2-prompts?id=34034
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一个时髦的街头女孩] 和 [凌乱的金色长发] 可以换成你的角色，例如"一个戴棒球帽的男孩 / 黑色短发""一只穿卫衣的柴犬"；换成别的运动时，把 16 个动作改写成对应的分解动作（篮球上篮、跳绳、挥拍），保持"准备—发力—最高点—落地—收势"的节奏。

示例图是白底上 4×4 排列的像素女孩：金色长发、橄榄色夹克、黑色宽裤，从滑行、下蹲、起跳、空中吐舌头到落地、侧面巡航、背影，16 帧比例一致。

**常见问题**：
- 帧与帧角色不一致：在开头加"同一个角色，服装和配色完全一致"。
- 有的帧被裁掉：写"每个精灵四周都留白，不要贴边"。
- 想要更"像素"：加"64×64 低分辨率像素风，放大显示，无抗锯齿"。

**适合**：GIF 动图、独立游戏角色素材、像素风表情包、动画分镜参考。

### 英文原版

```text
Goal: Create a clean 4x4 pixel-art sprite sheet of {argument name="character name" default="a stylish street girl"} skateboarding, suitable for animating into a GIF.

Canvas: Square canvas, white or transparent background, no borders, no text, no watermark. Arrange exactly 16 separate full-body sprites in an evenly spaced 4 columns by 4 rows grid, each sprite isolated with consistent scale and generous white space.

Visual style: High-quality retro pixel art with crisp blocky edges, limited palette, soft cel shading, cute chibi proportions, expressive face, dynamic hair motion, and a video-game character sprite-sheet feel.

Character details: A young streetwear girl with {argument name="hair color" default="long messy blonde hair"} blowing with motion, small blue eyes, peach skin, silver hoop earrings, chunky silver chain necklace, oversized dark olive bomber jacket, black cropped top, baggy black pants, and white sneakers. Keep her proportions and outfit consistent across all frames.

Skateboard details: A black skateboard with a tan wooden edge, small beige wheels, and pixelated trucks. The board angle changes with the trick, but the design remains consistent.

Sprite count and poses: Include exactly 16 sprites, ordered left to right, top to bottom:
1. Standing upright on the skateboard, rolling forward, hair streaming left.
2. Beginning to crouch on the board, knees bent, one hand low.
3. Deep crouch preparing for a trick, body leaning forward.
4. Very low crouch, face focused, one hand near the board.
5. Rolling with board slightly tilted upward, crouched and balanced.
6. Popping the board upward, front foot lifting, hair flying.
7. Midair trick with board angled diagonally, arms out for balance.
8. Higher midair trick, board steeply angled, tongue sticking out playfully.
9. Peak jump pose, arms wide, tongue out, board crossing diagonally beneath her.
10. Descending from the trick, board nearly level, arms extended.
11. Landing crouch, board angled slightly, focused expression.
12. Stabilizing after landing, low stance with arms out.
13. Low rolling landing with small motion marks beside the wheels.
14. Rising from crouch while rolling forward, side profile.
15. Upright cruising pose, side profile, relaxed expression.
16. Rear-view cruising pose, showing her back and flowing hair.

Constraints: Keep all 16 sprites the same character and scale, preserve a tidy grid layout, avoid extra props, avoid background scenery, and make the sheet readable as an animation sequence.
```

> 改编自 [AA - AerialAlias🇯🇵](https://x.com/aerialaliastgst/status/2097496668778455170) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
