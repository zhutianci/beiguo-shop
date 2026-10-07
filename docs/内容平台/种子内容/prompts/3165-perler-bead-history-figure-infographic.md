---
title: "拼豆风信息图提示词：拼豆像素质感的历史人物知识海报（曹操示例）（gpt-image-2）"
slug: perler-bead-history-figure-infographic
model: gpt-image-2
topics: [infographic, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "输入一个主题和 8 个知识点，生成一张\"拼豆 / 熔珠像素阵列\"风格的横版信息图海报：主体用单色拼豆大面积从画面边缘涌入，浅色拼豆底留出文字窗口，8 个编号知识节点散布四周，适合历史人物、文化主题科普和展陈海报。"
prompt: |
  生成一张 16:9 横版信息图海报。
  主题：[曹操]
  必须包含的知识点：（在这里列出 8 条知识点）
  视觉风格：这是一张"拼豆 / 熔珠 / 像素珠阵列"风格的结构化平面信息图海报。画面由大量规则排列的圆形塑料小珠组成，每颗珠子边界清晰、中心微凹、间距均匀、低饱和塑料质感、网格秩序稳定。整体保持正视平面版式，像一张用拼豆做的公共文化信息图，而不是玩具摄影、3D 模型、卡通插画或普通像素画。
  核心构图：把主体压缩成大面积的单色拼豆图像，主体从画面边缘涌入、越过版面边界被裁切，像一块更大的拼豆图像碎片闯进页面。主体占据主要视觉重量但不完整呈现，观者通过轮廓、方向、缺失区域、珠子疏密和局部纹理来还原主题。
  主体形态：外缘呈现低分辨率的珠子阶梯、块状断裂、硬切缺口、像素锯齿轮廓和缺珠截面；禁止平滑轮廓、完整图标外形和写实细节。主体内部只用同一结构色的不同明度，形成低对比的图像碎片、网点噪声、扫描颗粒和档案质感。
  背景与留白：背景是高亮度的浅色珠阵（接近未印刷的纸、浅奶白塑料板或灰白珠阵），主动切入主体，形成大片空白、蜿蜒通道、安静的文字窗口和知识点容器。
  色彩：严格三层功能配色——浅色背景场 60%～70%（旧纸白、浅米、冷灰白）；主体结构色 25%～35%（按主题选择，冷峻主题用深蓝 / 墨绿，温暖主题用赭红 / 焦橙）；高对比信息色 3%～6%（红、黑或亮蓝，用于标题、编号和重点标注）。
  信息系统：把 8 个知识点变成拼豆信息节点（编号标签、注释框、图例块、坐标线等），沿空白窗口、色块边界和主体缝隙分布，文字大小层级清楚。
  字体：窄体现代无衬线或等宽元数据字体；文字放在空白窗口和底部信息条里，不要压在主体中心。
  材质：所有视觉元素都由珠子构成，哑光塑料质感，带轻微的制造误差、细微颗粒和小磨损；结构色区域可以有网点般的疏密变化和专色叠印感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/EchoTaylor0210/status/2059953881652887652
  author: "Diandian"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文结构说明的英文写法改写为中文；主题默认值改为\"曹操\"（与示例图一致），8 个知识点改为变量"
images:
  - 3165-perler-bead-history-figure-infographic-1.jpg
imageCredit:
  by: "Diandian"
  url: https://youmind.com/gpt-image-2-prompts?id=23021
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[曹操] 换成任何人物、历史事件或文化主题（"苏轼""丝绸之路""敦煌壁画"）；8 个知识点建议自己写好（每条 10～20 字，如"官渡之战：以少胜多击败袁绍"），比让模型自由发挥准确得多。主体颜色模型会按主题选，也可以在"主体结构色"里直接指定。

示例图是一张米白拼豆底的横版海报：左侧大面积深蓝色拼豆拼出的曹操侧脸，从画面边缘涌入、边缘呈锯齿状；右上方红色大字"曹操"和副标题，周围 8 个编号小方块写着人物生平、军事成就、文学成就等，底部一条时间轴。

**常见问题**：
- 史实错误：模型生成的知识点要逐条核对，最好直接提供文本。
- 不像拼豆像普通像素：强调"圆形珠子、中心微凹、珠间有缝隙"。
- 主体太完整：保留"主体被画面边缘裁切、不完整"。

**适合**：历史 / 语文课件、文化科普海报、展陈设计、读书笔记封面。

### 原版提示词

```text
Generate a 16:9 horizontal infographic poster.

Subject: {argument name="subject" default="Pan Jinlian"}

Required Knowledge Points:
[Point 1] through [Point 8]

Visual Style Definition:
This is a structural flat infographic poster in the style of "Perler beads / fuse beads / pixel bead array." The image is composed of a large number of regularly arranged circular plastic beads, each with clear circular boundaries, a slight center indentation, uniform spacing, low-saturation plastic texture, and a stable grid order. The overall composition must maintain a front-view flat layout, resembling a public cultural infographic poster made of beads, rather than toy photography, 3D models, cartoon illustrations, or ordinary pixel art.

Core Composition:
Compress the subject into a large-scale monochromatic bead image field. The subject must surge in from the edges of the frame, crossing page boundaries and being cropped as if a larger bead media image fragment is entering the page. The subject occupies the main visual weight but is not fully presented; viewers must reconstruct the theme through silhouette, direction, missing areas, bead density, and local texture.

Subject Morphology:
The outer edges of the subject exhibit low-resolution bead steps, block fractures, hard-cut gaps, pixelated jagged outlines, missing bead cross-sections, and rough boundaries after sampling. Forbid smooth silhouettes, complete icon outlines, or realistic details. Use only different brightness levels of the same subject structural color within the body to form low-contrast image fragments, halftone noise, scan grains, material afterimages, archival textures, and local density variations.

Background and Negative Space:
The background uses a high-brightness light-colored bead field, close to unprinted paper, light creamy white plastic board, or pale grey-white bead arrays. The background is not a decorative base color but actively cuts back into the subject, forming large voids, winding channels, quiet text windows, reading pause areas, and knowledge point containers. White space must provide a sense of breath while cutting the subject's structure.

Color System:
Adopt a strict three-layer functional color scheme:
1. Light Background Field (60%–70%): Colors like old paper white, light beige, or cold grey-white for breathing and text windows.
2. Subject Structural Color (25%–35%): Defines the subject and mood. Choose based on the subject (e.g., deep blue/dark green for cold themes; ocher red/burnt orange for warm themes).
3. High-Contrast Information Color (3%–6%): Sharp colors like red, black, or bright blue for titles, numbering, and key annotations.

Infographic System:
Transform knowledge points 1 to 8 into bead information nodes (numbered labels, annotation boxes, legend blocks, coordinate lines, etc.). Nodes should be scattered along white space windows, color field boundaries, and subject gaps. Ensure a clear hierarchy of text sizes.

Typography:
Use narrow modern sans-serif fonts or monospace metadata fonts. Text must be arranged in white space windows and bottom information bars, never pressing against the center of the subject.

Bead Material:
All visual elements are made of beads. Surfaces have a matte plastic texture with slight manufacturing irregularities, faint grains, and minor wear. Structural color areas can show halftone-style density changes and a specialty overprint feel.
```

> 改编自 [Diandian](https://x.com/EchoTaylor0210/status/2059953881652887652) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
