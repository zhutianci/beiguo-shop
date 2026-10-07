---
title: "游戏角色序列帧提示词：参考角色生成 4×4 共 16 帧动作精灵表（可做 GIF）（gpt-image-2）"
slug: character-sprite-sheet-4x4-animation
model: gpt-image-2
topics: [game-art, character]
aspectRatio: "1:1"
needsRefImage: true
useCase: "上传一张角色立绘，指定一个动作（奔跑、跳跃、摔倒、攻击），生成 4×4 共 16 帧、尺寸位置严格统一的游戏动画精灵表，可以直接切图做 GIF 或导入游戏引擎。"
prompt: |
  参考这个角色，为游戏制作一张 2D 动画精灵表（sprite sheet），动作内容是"[奔跑后摔倒]"。
  用 4×4 网格共 16 帧表现一个连续动作。
  【规格】
  - 正方形画布，4 列 × 4 行，共 16 帧；
  - 16 个格子大小完全相同；
  - 每格上下左右至少留 10px 边距；
  - 不要边框、网格线、数字、文字、符号或界面元素；
  - 背景是所有帧统一的纯白色；
  - 帧按时间顺序从左上到右、从上一行到下一行排列。
  【最重要：尺寸和位置固定】
  - 16 帧的角色缩放比例完全一致，不要放大或缩小；
  - 地面基线固定在同一高度；
  - 角色中心位置在帧与帧之间不要明显移动，只按动作需要改变姿势。
  【最重要：完全放进格子里】
  - 头发、衣服、四肢、武器、饰品、特效、残影和粒子都必须在格子内；
  - 不要超出格子边界，不要侵入 10px 安全边距；
  - 即使动作很大，也不要靠缩小角色来调整；必要时把特效或挥臂幅度收小。
  【绘制策略】
  - 轮廓清晰，像 2D 游戏精灵一样一眼可读；
  - 帧与帧之间动作自然衔接；
  - 优先保证作为动画素材的连贯性，而不是单张插画的好看；
  - 每帧的细节密度、线条、上色和明暗保持统一。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/SSSS_CRYPTOMAN/status/2097797456117539136
  author: "SSSS.CRYPTOMAN⚡️AI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文日文提示词的英文译本改写为中文；动作改为变量；保留尺寸、边距、基线等全部约束"
images:
  - 3093-character-sprite-sheet-4x4-animation-1.jpg
  - 3093-character-sprite-sheet-4x4-animation-2.jpg
imageCredit:
  by: "SSSS.CRYPTOMAN⚡️AI"
  url: https://youmind.com/gpt-image-2-prompts?id=34141
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张角色的正面或侧面全身立绘（白底最好），[奔跑后摔倒] 换成你需要的动作，例如"待机呼吸""挥剑攻击三连""二段跳""受击后退"。动作越具体（分几个阶段），16 帧越连贯。

示例图第一张是生成的精灵表：绿发猫耳少女从奔跑、加速、踉跄、扑倒到趴在地上起不来，16 帧大小一致、白底无格线；第二张是作者上传的角色参考立绘（输入图）。

**常见问题**：
- 角色忽大忽小、位置乱跳：这是最常见的问题，保留"最重要"的两组约束，并可以加"每帧角色的脚底都落在格子底部往上 10% 的位置"。
- 动作超出格子：把"挥臂幅度收小"写得更明确。
- 切成 GIF：用任意切图工具按 4×4 均分，每帧 80～120ms 即可。

**适合**：独立游戏角色动画、表情包 GIF、像素 / 二次元动画素材、游戏原型。

### 日文原版

```text
Referencing this character, create a 2D animation sprite sheet for a game. The content is "{argument name="action" default="fill in action"}". 

Represent one continuous action across a total of 16 frames in a 4x4 grid.

[Sprite Sheet Specifications] - Square canvas - 4 columns x 4 rows, total 16 frames - All 16 cells are exactly the same size - Ensure at least 10px margins on top, bottom, left, and right of each cell - No borders, grid lines, numbers, text, symbols, or UI required - Background is a single solid white color unified across all frames - Arrange frames in chronological order from top-left to right, and top row to bottom row.

[Most Important: Fixed Size and Position] - Unify character scale across all 16 frames - No zooming in or out - Fix the ground baseline at the same height - Ensure the character's center position does not move significantly between frames - Change poses only as needed for movement.

[Most Important: Fit Entirely Within Cells] - Everything including hair, clothes, limbs, weapons, accessories, effects, afterglow, and particles must fit inside each cell - Do not exceed cell boundaries - Do not violate the 10px margin safety area - Even if the action is large, do not adjust by shrinking the character - If necessary, keep effects or arm swings moderate to fit within the cell.

[Drawing Strategy] - Clear silhouette readable as a 2D game sprite - Movement that connects naturally between frames - Prioritize continuity without breaking as animation material rather than a single illustration - Unify detail density, lines, coloring, and shading for each frame.
```

> 改编自 [SSSS.CRYPTOMAN⚡️AI](https://x.com/SSSS_CRYPTOMAN/status/2097797456117539136) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
