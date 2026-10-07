---
title: 角色设定提示词：原创英雄完整设定稿，三视图+动作+表情+面具+装备+色板（gpt-image-2）
slug: hero-character-design-sheet
model: gpt-image-2
topics: [game-art, character]
needsRefImage: false
aspectRatio: "3:4"
useCase: 设计原创英雄 / 反派 / 生物角色，需要一张能直接给分镜和 AI 视频当参考的完整设定稿时使用：填好身份、能力和配色，得到多视图、动作、表情和装备细节齐全的一页设定。
prompt: |
  为一个原创的[英雄]角色制作一张细节丰富的全彩角色设定稿。
  风格：风格化的电影级角色设计，高品质动画长片质感，形体清晰易读，剪影强烈，配色大胆，带一点漫画的能量感，精致且可直接用于制作。
  角色身份：
  - 名字 / 身份：[角色名与身份]
  - 年龄 / 种族 / 体型：[年龄、种族、体型]
  - 性格原型：[性格原型]
  - 能力 / 技能 / 特殊装备：[核心能力或装备]
  主体设计：剪影独特好记，服装语言清楚（可识别的形状、强烈的色块、功能性细节）；必须是原创设计，不要基于任何现有作品角色，不要现有标志或超级英雄符号。
  服装 / 盔甲：[服装或盔甲描述]，包括手套 / 腕部装置、靴子、腰带装备、护甲片、布料褶皱，需要时加发光元素、工具或武器。
  配色：主色[主色]、辅色[辅色]、点缀色[点缀色]，对比强烈，便于动画和视频保持一致。
  版面布局（同一张干净的设定稿上）：正面全身、侧面全身、背面全身、四分之三角度动作姿势、面部 / 面具表情特写、手部 / 手套 / 装备细节、特殊能力或武器细节。
  动作姿势要体现角色的主要移动方式：[奔跑/跳跃/飞行/格斗]。
  装备 / 能力细节：展示标志性装备或能力如何运作，例如磁力抓钩、能量护手、动能靴、发光能量核心、机械翅膀。
  背景：干净的浅色中性背景，极简平面设计，不要复杂环境，只允许少量清楚易读的小标注。
  质量：细节丰富、渲染锐利，所有视图比例一致、脸和身体结构一致、服装连贯，可作为分镜和 AI 视频生成的参考图。
  画幅[3:4]竖版（也可改 16:9 横版）。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/0kncn/status/2063734037928452120
  author: "@0kncn"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并压缩为分段要点；保留原文的身份、服装、配色、动作等占位符为中文变量；画幅按示例图改为竖版并注明可改回原文的 16:9；去掉重复的质量描述
images:
  - 3262-hero-character-design-sheet-1.jpg
imageCredit:
  by: "@0kncn"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case352/output.jpg
  license: CC0 1.0
verify:
  - 原文要求 16:9 横版，但示例图是竖版，页面需说明两种画幅都可用
  - 示例图标注是英文（角色名"NEON LYNX"），中文标注版出一次看小字是否可读
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：先把身份四项想清楚，比如"[角色名与身份]"写"夜猫·城市夜巡者"、"[核心能力或装备]"写"磁力抓钩 + 回声定位"；[英雄] 可改"反派""机械生物"；配色三项用色名或色值都行，例如"墨绿 / 黑 / 亮橙"。示例图是竖版设定稿：左上角是涂鸦感大字"NEON LYNX"，顶部三个全身像（正、侧、背）穿墨绿黑色紧身战衣、戴猫耳头盔；中间左边一张城市背景下甩出抓钩的动作图，右边三个面具表情；下方是面具细节、手套与抓钩装备拆解和一排色板。

**常见问题与调整**：
- 各视图比例不一致：加"三个全身视图头顶和脚底对齐同一水平线"。
- 角色像某个知名英雄：换掉面具 / 胸标的形状描述，并强调"原创，不要蜘蛛、蝙蝠等已有英雄符号"。
- 标注文字乱码：写"只保留角色名和视图标签，其他说明文字不要"。
- 要做系列角色：第一张满意后追问"保持同样版式和画风，设计他的搭档[角色名]"。

**适合**：原创游戏 / 动画 / 漫画角色设定、AI 视频角色一致性参考；不适合用来复刻受版权保护的已有角色。

### 英文原版

```
Create a highly detailed full-color character design sheet in 16:9 horizontal format for an original [CHARACTER TYPE / HERO / CREATURE / VILLAIN].

STYLE:
stylized cinematic character design,
high-quality animated feature look,
clean readable shapes,
strong silhouette,
premium concept art presentation,
bold graphic color palette,
comic-book inspired energy,
polished but production-ready design,
clear anatomy and costume readability.
CHARACTER IDENTITY:
[CHARACTER NAME / ROLE]
[AGE / SPECIES / BODY TYPE]
[PERSONALITY ARCHETYPE]
[POWER / SKILL / SPECIAL EQUIPMENT]
MAIN DESIGN:
The character should have a distinctive, memorable silhouette.
Use a clear costume language with recognizable shapes, strong color blocking, and functional details.
The design must feel original, not based on any existing franchise character.
No copyrighted logos, no recognizable existing superhero symbols, no direct imitation of known characters.
OUTFIT / ARMOR:
[DESCRIBE COSTUME OR ARMOR]
Include practical design details:
gloves / wrist devices
boots / shoes
belt gear
armor plates
fabric folds
glowing elements if needed

utility tools or weapons if needed
COLOR PALETTE:
[MAIN COLOR]
[SECONDARY COLOR]
[ACCENT COLOR]
Use a bold cinematic palette with strong contrast.
The colors should be clear enough for animation and video generation consistency.
CHARACTER SHEET LAYOUT:
Show the same character in multiple views on one clean sheet:
front view full body
side view full body

back view full body
three-quarter action pose
close-up face / mask expression
hand / glove / equipment detail
special ability or weapon detail

POSES:
Use confident readable poses.
The action pose should show the character’s main movement style:
[RUNNING / JUMPING / FLYING / SWINGING / FIGHTING / CASTING POWER / USING EQUIPMENT]
EQUIPMENT / POWER DETAIL:
Show how the character’s signature equipment or power works.
Example:
magnetic grappling cables,
energy gauntlets,
kinetic boots,
utility belt,
glowing power core,
mechanical wings,
elemental weapon,
or custom ability system.
BACKGROUND:
clean light neutral background,
minimal graphic design,
no complex environment,
no text-heavy poster design,
small visual notes allowed only if clean and readable.

QUALITY:
high detail,
sharp clean rendering,
consistent proportions across all views,
same face and body structure in every pose,
clear costume continuity,
production-ready character sheet,
suitable as a reference image for storyboard and AI video generation.
```

> 改编自 [@0kncn](https://x.com/0kncn/status/2063734037928452120) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
