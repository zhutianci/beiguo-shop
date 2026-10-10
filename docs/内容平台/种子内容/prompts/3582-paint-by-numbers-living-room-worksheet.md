---
title: "数字填色画提示词：可打印的客厅数字油画线稿，带 14 色图例（gpt-image-2）"
slug: paint-by-numbers-living-room-worksheet
model: gpt-image-2
topics: [illustration, infographic]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给孩子或课堂做一张可以打印的数字填色练习纸：上面是标好编号的黑白线稿场景，下面是\"编号—颜色\"对照图例，照着编号涂色就能完成一幅画。"
prompt: |
  制作一张可打印的数字填色练习纸：A4 竖版，白底，四周一圈细黑边框。上方约 70% 是画面，下方约 30% 是说明和颜色图例。全图是干净的黑色线稿，线条像矢量图一样清晰，除了图例里的小色块，其余地方不上色、不加阴影。
  - 画面：简洁圆润的卡通风格，画一间温馨的[客厅]。正中站着[一个大眼睛、戴头盔的卡通小人]，短袖上衣、长裤、光脚；左边一张带两块靠背垫和一个小抱枕的沙发，沙发上方挂一幅小风景画；右边一张带抽屉的边几，上面放台灯，后面一盆大叶绿植；最右侧一台架在三脚架上的相机对着主角；背景有墙和右侧的大窗，木地板上有木板拼缝，前景铺一张长方形大地毯；
  - 编号：在每一块封闭区域的中间写一个黑色数字，只用 1 到 14；同一种颜色的区域用同一个数字，数字清楚、不压线；
  - 图例：画面下方用一条横线隔开，居中写粗体标题[填色说明]，下面一行小字[按编号给对应区域涂上颜色]；再往下把 14 个条目排成三列，分别 5、5、4 个，每个条目是"数字 + 小色块 + 颜色名"：1 米色、2 浅灰、3 黄色、4 黑色、5 白色、6 蓝色、7 棕褐、8 棕色、9 天蓝、10 绿色、11 奶油色、12 青绿、13 木棕、14 浅杏色；
  - 限制：不要水印，不要多余装饰；画面里的每个数字都必须能在图例里找到对应颜色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/NingKrysta45057/status/2057426499033055629
  author: "@NingKrysta45057"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；主角、场景、标题、说明文字设为变量；标题和 14 个颜色名由英文改为中文；保留了\"每个区域居中标号、图例三列 5+5+4\"等版式约束，删去逐件家具的重复数量描述"
images:
  - 3582-paint-by-numbers-living-room-worksheet-1.jpg
imageCredit:
  by: "@NingKrysta45057"
  url: https://youmind.com/gpt-image-2-prompts?id=21941
  license: CC BY 4.0
verify:
  - "示例图中央的卡通小人（大圆眼、头盔、黄色皮肤）没有认出对应哪部动画，请站长再看一眼是否像某个已有角色；示例图里的标题和颜色名是英文"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[客厅] 换成任意场景，如"海底世界""农场""太空站"，后面那几句家具描述要跟着换成对应的 5~6 样物件；[一个大眼睛、戴头盔的卡通小人] 换成自己原创的主角，如"背书包的小兔子"，不要写现成动画里的角色名；[填色说明] 和 [按编号给对应区域涂上颜色] 是图例标题与说明文字。给低龄孩子用可以把 14 色减到 8 色，并把图例里的条目同步删掉。

示例图是一张 A4 比例的黑白线稿：客厅中央站着一个大圆眼、表情发愁的卡通小人，左边沙发和挂画，右边台灯、大叶盆栽和一台三脚架相机，每块区域里都标着 1~14 的数字；下方图例是三列色块配颜色名，标题和颜色名在示例图里是英文。

**常见问题**：
- 有的区域没标号或标号压线：加"区域划分要大而完整，避免细碎小块，数字字号统一"。
- 图例颜色和编号对不上：出图后逐个核对，错的那几项单独让模型"只修改图例第几项"。
- 线稿带灰色阴影：加"纯黑白，线宽一致，没有灰度"。

**适合**：亲子手工、幼儿园和小学美术课、活动打卡物料。打印前建议自己先按图例涂一遍，确认没有漏号。

### 英文原版

```text
Goal: Create a printable paint-by-numbers worksheet showing a cartoon living room scene with a child-like character standing in the center, designed as clean black-and-white line art with numbered regions and a color legend.

Canvas: A4 portrait page at 300 DPI, white background, thin black outer border, crisp vector-like outlines, no shading except the tiny color swatches in the legend. The main illustration fills the upper roughly 70% of the page, and the instruction/color-key panel fills the bottom roughly 30%.

Main illustration layout: Draw a cozy living room in simple rounded cartoon style. Center: one standing cartoon character with large round eyes, small dot nose, worried wavy mouth, hood or helmet-like hair/head covering, short-sleeve shirt, slim arms, long pants, and bare feet. Left: one sofa with two seat/back cushions, one armrest visible on each side, and one small throw pillow. Above the sofa: one framed wall picture containing a small landscape with hills, sky, and one tree. Right of the character: one side table with a lamp on top and one drawer; behind/right is one tall potted plant with exactly 10 visible leaves. Far right: one camera on a tripod aimed at the character, with a screen/body, lens/buttons, and exactly three tripod legs. Background includes a wall, a large window on the right with vertical panes, a floor with wood plank lines, and a large rectangular rug in the foreground.

Numbered paint areas: Place black numbers inside the line-art regions throughout the scene, using numbers 1 through 14. Use many repeated numbers on matching surfaces. Keep the numbers legible and centered in their shapes. Match the apparent assignments: 1 for beige wall areas, 2 for light gray head/hood areas, 3 for yellow skin/limbs, 4 for black camera/tripod details, 5 for white shirt and camera screen, 6 for blue sofa, 7 for tan pillow, 8 for brown picture frame, 9 for sky blue window/picture sky, 10 for green plant/tree leaves, 11 for cream lamp/rug interior, 12 for teal rug border, 13 for wood-brown floor/table/plank areas, and 14 for beige plant pot.

Bottom instruction panel: Add a horizontal divider line above the legend. Center a bold title reading {argument name="instruction title" default="Instructions"}. Under it, add smaller text reading {argument name="instruction subtitle" default="Paint the areas with the matching colors."}. Below, arrange exactly 14 color legend entries in three neat columns. Each entry has a number, a small filled color square, and an English color label. The 14 entries must be: 1 Beige, 2 Light Gray, 3 Yellow, 4 Black, 5 White, 6 Blue, 7 Tan, 8 Brown, 9 Sky Blue, 10 Green, 11 Cream, 12 Teal, 13 Wood Brown, 14 Beige (Pot).

Style constraints: Make it look like a polished printable worksheet for children, with smooth uniform black outlines, rounded friendly shapes, lots of enclosed regions suitable for coloring, no gradients, no realistic textures, no extra text, no watermark. Subject can be customized as {argument name="central character" default="a worried cartoon child-like figure"}, setting as {argument name="room setting" default="cozy living room"}, and palette as {argument name="color palette" default="14-color paint-by-numbers palette"}.
```

> 改编自 [@NingKrysta45057](https://x.com/NingKrysta45057/status/2057426499033055629) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
