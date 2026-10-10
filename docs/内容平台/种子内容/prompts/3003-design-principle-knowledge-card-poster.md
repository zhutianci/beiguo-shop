---
title: "设计知识卡片海报提示词：黑底几何\"分散构图\"教学图（gpt-image-2）"
slug: design-principle-knowledge-card-poster
model: gpt-image-2
topics: [infographic, poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "用黑底、彩色几何图形和引线标注，做一张讲解某个设计概念的竖版知识卡片，示例讲的是\"分散构图\"，换成\"对称构图\"\"留白\"等主题即可做成一套设计课海报。"
prompt: |
  生成一张竖版教学知识卡片海报，讲解 [分散构图]，黑底、现代平面设计风格。
  画布：3:4 竖版，黑色背景带细微纸纹，高对比，大量留白，干净的瑞士 / 现代编辑排版。
  标题区：左上角放超大的两行中文标题 [分散构图]，第一行米白色，第二行薰衣草紫。下方是全大写的紫色英文副标题"SCATTERED COMPOSITION"（换主题时改成对应英文），再下面一条短紫色横线和一段左对齐的中文说明："将视觉元素有意分散在画面各处，形成[多个视觉焦点]，营造开放、轻盈与多向的视觉体验。"
  图形：用不对称间距在画面中散布恰好 15 个几何元素——右上 1 个大黄圆、右中 1 个中号紫圆、中部 1 个小橙圆、左下 1 个青绿方块、右中 1 个小粉方块、中下偏左 1 个小紫圆、右下 1 个大米白空心圆环、5 个白色加号、中下 1 个黄色加号、右上 1 个紫色 3×3 点阵、中下偏左 1 个米白 3×3 点阵。
  标注：恰好 3 条虚线引线，末端带小圆点：01 指向黄圆，黄色标签"视觉焦点 01"，白字"大面积色块吸引视线，建立主要焦点。"；02 指向紫圆，紫色标签"视觉焦点 02"，白字"中等元素与留白结合，引导视线自然停留。"；03 指向橙圆，橙色标签"视觉焦点 03"，白字"小面积高对比元素，成为次级视觉锚点。"
  技巧区：左下角放一个紫色灯泡小图标、紫色标签"技巧提示"和正文"通过大小、色彩、形状、方向的变化，在分散中建立联系，在留白中制造节奏。"，下方一条细线。
  图例：右下角大圆环旁放 4 行图例：黄色点阵"变化 VARIATION"、紫色波浪线"节奏 RHYTHM"、青绿加号"呼吸 BREATH"、粉色方框"开放 OPENNESS"。
  风格：极简中文设计信息图，粗体字，平面矢量图形，哑光质感，配色只用黑、米白、薰衣草紫、黄、橙红、青绿、粉。
  要求：文字清晰可读，严格保持图形数量，不加多余插画，不要照片感，不要水印和 Logo。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2092968240582664483
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主题、标题、说明文字改为变量；保留图形数量与标注结构的精确约束"
images:
  - 3003-design-principle-knowledge-card-poster-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32838
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[分散构图] 是主题，英文副标题同步改，换成"对称构图 / SYMMETRY""三分法 / RULE OF THIRDS""留白 / NEGATIVE SPACE"即可；说明文字要同步换成对应概念的一句话定义。换主题时，图形的摆放最好也跟着改：讲对称就把图形改成左右镜像，讲三分法就加一组九宫格辅助线。

示例图与提示词高度一致：黑底左上是米白 + 紫色的"分散构图"大字，右侧黄、紫、橙三个圆用虚线引出三段说明，左下"技巧提示"，右下圆环旁是四行图例，中文全部正确。

**常见问题**：
- 图形数量对不上：数量约束越多越容易出错，可以删掉加号和点阵的数量要求，只保留 3 个焦点圆。
- 中文小字出现错字：把每段说明控制在 20 字以内，或者出图后单独重画该区域。
- 想做成一套：固定配色和版式描述，只替换主题和三段说明。

**适合**：设计课讲义、小红书设计知识卡、公众号配图、PPT 章节页。

### 英文原版

```text
Goal: Create a vertical educational knowledge-card poster explaining {argument name="headline text" default="分散构图"} with a dark, modern graphic-design style, about scattered composition in visual layout.

Canvas: Portrait 3:4 poster, black background with subtle paper grain, high contrast, generous empty space, clean Swiss/modern editorial layout.

Main title area: Place a very large two-line Chinese headline in the upper left. The first line is off-white, the second line is lavender-purple. Under it, add the English subtitle “SCATTERED COMPOSITION” in uppercase lavender. Below the subtitle, add a short lavender horizontal rule and a left-aligned Chinese explanatory paragraph: “将视觉元素有意分散在画面各处，形成多个视觉焦点，营造开放、轻盈与多向的视觉体验。”

Visual structure: Scatter geometric elements across the poster, using asymmetrical spacing and multiple focal points. Include exactly 15 main graphic elements: 1 large yellow circle near the upper right, 1 medium purple circle at the center-right, 1 small orange circle near the middle, 1 teal square in the lower-left quadrant, 1 small pink square at the right-center, 1 small purple circle near the lower center-left, 1 large off-white hollow ring in the lower-right quadrant, 5 white plus signs distributed around the page, 1 yellow plus sign near the lower center, 1 purple 3-by-3 dot grid near the upper right, and 1 off-white 3-by-3 dot grid near the lower center-left.

Callouts: Add exactly 3 dotted leader-line annotations with small endpoint dots. Callout 01 points to the large yellow circle and uses yellow label text: “视觉焦点 01”, followed by white body text: “大面积色块吸引视线，建立主要焦点。” Callout 02 points to the medium purple circle and uses purple label text: “视觉焦点 02”, followed by white body text: “中等元素与留白结合，引导视线自然停留。” Callout 03 points to the small orange circle and uses orange label text: “视觉焦点 03”, followed by white body text: “小面积高对比元素，成为次级视觉锚点。”

Tip section: In the lower left, add a small purple lightbulb icon, the label “技巧提示” in purple, and the body text “通过大小、色彩、形状、方向的变化，在分散中建立联系，在留白中制造节奏。” Add a thin off-white underline below this block.

Legend: In the lower right, beside the large hollow ring, create a compact legend with exactly 4 rows. Row 1 has a yellow 3-by-3 dot icon, Chinese label “变化”, and English label “VARIATION”. Row 2 has a purple wavy-line icon, Chinese label “节奏”, and English label “RHYTHM”. Row 3 has a teal plus icon, Chinese label “呼吸”, and English label “BREATH”. Row 4 has a pink outlined square icon, Chinese label “开放”, and English label “OPENNESS”.

Visual style: Minimalist Chinese design infographic, bold typography, flat vector shapes, matte texture, sharp edges, dotted connector lines, color palette of black, off-white, lavender purple, yellow, orange-red, teal, and pink. Use strong negative space and no borders.

Constraints: Keep the poster text legible, maintain the exact counts of graphic elements, avoid extra illustrations, avoid photorealism, avoid watermark or logo.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2092968240582664483) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
