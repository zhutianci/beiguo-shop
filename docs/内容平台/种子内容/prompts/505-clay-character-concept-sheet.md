---
title: 角色设定图提示词：黏土定格动画风原创角色设定集（动作主图 + 正背面 + 表情 + 配色）
slug: clay-character-concept-sheet
model: gpt-image-2
topics: [character, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: 只写一段角色描述，就生成一张像动画公司"美术设定集"的横版展示板：大幅动作主图、正背面、三种表情、两处道具特写和名字 / 年龄 / 配色信息栏，适合原创 IP 提案、绘本角色和桌游人物卡。
prompt: |
  根据以下输入，制作一张高级、非对称排版的角色概念设定展示板：
  【画风】[定格动画黏土风]，带黏土、毛毡、皮革的丰富手作质感，温暖的电影感棚拍光。
  【角色】[中世纪流浪炼金术士兼地图师]，有点古怪但很可爱。
  服装与道具：[打补丁的宽大羊毛大衣]、旧皮背心，腰带上挂着[几瓶发光药水和羊皮纸卷]，戴宽檐旅行帽和[圆形黄铜眼镜]，背一个包铜边的旧皮挎包。
  外貌与性格：[姜黄色乱胡子]，手捏感的造型，眼神好奇、笑容友善，比例夸张俏皮。
  版式：16:9 横版，浅灰或暖白背景，细技术边框；整体像一本精致的制作美术设定集，排版干净，不要杂乱、不要水印、不要 Logo。画风只作用于角色和视觉元素，版面本身保持简洁。
  缺少的信息（名字、身份、简短背景、配色）请根据角色描述自行补全。
  三栏布局：
  1. 左侧 40%：主角高光区，一张大幅全身动态动作姿势，体现性格、气场和轮廓。
  2. 中间 35%：技术三视图区，只放正面和背面两个放松站姿的全身图，背后衬极淡的蓝图网格线。
  3. 右侧 25%：细节区，上面是三张表情特写（平静、专注、神气的坏笑），下面是两张服装材质或标志性道具的特写。
  4. 底部横条：简洁的文字信息栏，写名字、身份、年龄、核心主题，旁边放 5–6 个无标注的几何色块，展示角色主色。
  所有区域里的角色和服装必须完全一致；主图是视觉重心，整体开阔、专业，不要密集重复的格子。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/itsPixieVerse/status/2067750004178215241
  author: "@itsPixieVerse"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文；把原示例的画风与角色描述拆成画风、身份、服装道具、外貌几处短变量；合并重复的版式约束，保留四区布局与比例
images:
  - 505-clay-character-concept-sheet-1.jpg
imageCredit:
  by: "@itsPixieVerse"
  url: https://x.com/itsPixieVerse/status/2067750004178215241
  license: CC0 1.0
verify:
  - 底部信息栏改成中文时是否清晰；名字等补全内容是否合理
  - 换成"水彩绘本风""3D 卡通风"等画风时版式是否保持四区结构
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**和普通"三视图"有什么不同**：三视图重在给建模、画师看结构；这一条是"提案展示板"，多了大幅动作主图、表情和信息栏，更适合拿去给人看、发作品集。

**怎么填变量**：[定格动画黏土风] 可换成"温暖的水彩绘本风""日式赛璐璐动画风"，后面那句材质描述也要跟着改；【角色】写身份，服装道具和外貌两行按你的角色逐项替换，越具体越好。想指定名字和年龄，直接加一行"名字：××，年龄：××"，模型就不会乱编。

**常见问题**：
- 正背面和主图不像同一个人：在描述末尾加"所有视图严格同一角色，服装纹样和配饰位置一致"。
- 表情区变成六七个：保留"只放三张"的数量词，数量写得越死越稳。
- 信息栏乱码：英文最稳；中文建议只写名字和身份两项。

示例图为原作者生成，仅供参考。

### 英文原版

```text
Create a high-end, asymmetric editorial CHARACTER CONCEPT SHOWCASE from these inputs:

[STYLE]: stylized 3D stop-motion claymation style with rich tactile textures of clay, felt, and leather, and warm cinematic studio lighting
[SUBJECT_DESCRIPTION]: A charming and slightly eccentric traveling medieval alchemist and cartographer. He wears a heavy, oversized patched wool coat over a worn leather tunic, multiple small glowing potion vials and rolled-up parchment scrolls strapped to his utility belt, a wide-brimmed traveler's hat, and thick round brass spectacles. He has a messy, hand-sculpted ginger beard, warm curious eyes, and a friendly smile. He carries an ancient, brass-trimmed leather satchel. His design features exaggerated, whimsical proportions and a cozy, rustic medieval aesthetic.

Create the layout in a clean 16:9 widescreen format on a neutral studio gray or warm off-white background with a minimal technical border. The design must look like a premium production visual bible, using clean typography, no clutter, no watermarks, and no logos. Apply [STYLE] only to the character and visual elements, keeping the presentation layout clean, structured, and minimal.

Infer all missing details from the subject description, including name, role, brief background specs, and a cohesive color palette.

Use this tri-fold layout:

1. HERO SPOTLIGHT (Left 40% of the board)
- Show one large, highly detailed full-body dynamic action pose of the subject.
- This pose should showcase the character's primary personality, attitude, and silhouette.

2. TECHNICAL TURNAROUND (Center 35% of the board)
- Show exactly two clean full-body views: Front View and Back View.
- The subject should be in a relaxed, neutral stance.
- Place these views over very subtle vertical and horizontal grid lines resembling a technical schematic blueprint.

3. KEY DETAILS (Right 25% of the board)
- EXPRESSION TRIO: Exactly 3 large, highly expressive close-up headshots showing core emotional states: Calm/Neutral, Highly Focused/Intense, and a Dynamic/Expressive emotion (like a smirk or fierce grin).
- GEAR CALLOUTS: Exactly 2 clean, isolated close-up panels showing primary wardrobe textures, signature accessories, or weapons/gear.

4. SPECS & COLOR BANNER (Bottom Edge)
- A minimalist, horizontal typography block listing Name, Role, Age, and Core Theme.
- Adjacent to the text, display 5 to 6 clean geometric color swatches showing the character's primary color palette with no labels.

Ensure complete character and costume consistency across all sections. The Hero Spotlight must visually anchor the sheet, offering a clean, open, and professional layout that avoids dense, repetitive, or cluttered grids.
```

> 改编自 [@itsPixieVerse](https://x.com/itsPixieVerse/status/2067750004178215241) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
