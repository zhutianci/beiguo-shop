---
title: "ai穿搭插画提示词：黑白水墨线描时装肖像，结构辅助线 + 大留白的杂志画风（Nano Banana）"
slug: monochrome-ink-fashion-portrait-kimono-blossom
model: nano-banana
topics: [fashion, illustration, portrait]
modelLabel: Nano Banana Pro
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张只有黑、白、灰的时装插画肖像：流畅的手绘墨线、保留在画面里的结构辅助线、大块留白和少量浓黑的重笔，像时装杂志里的手绘插页。适合做头像、穿搭和美妆内容的封面、品牌的插画风海报。"
prompt: |
  画一幅高度风格化的[黑白时装插画]肖像，画幅 4:5 竖版。
  - 人物与服装：[一位把头发松松挽起的女子]，穿[黑底白花的和服]，微微侧头，目光看向镜头；手里拿着[一小枝樱花]，周围飘着几片花瓣。
  - 技法：[有表现力的黑白墨线肖像画法]——流畅的有机轮廓线，与几条穿过面部的几何结构辅助线自然地叠在一起；松动的写意笔触和眼睛、眉毛、嘴唇、发丝处精确的墨线细节并存；草稿细线保留在画面里，成为构图的一部分。
  - 头发：用大幅度的流动笔触和层层叠叠的墨线曲线来画，有动感，不对称地框住脸。
  - 皮肤：平滑的灰阶色块加细微的渐变过渡，同时保持手绘墨线插画的样子，不要照片感。
  - 眼与唇：眼睛细节丰富、有神，睫毛清晰，带反光高光；嘴唇用半写实的明暗和细腻的线条质感塑造。
  - 对比：五官周围用浓重的黑色笔触，与大面积干净的留白相平衡；服装的黑色大色块上留出白色的花形。
  - 配色：极干净的灰阶，柔和的影调加锐利的深色重点，没有任何彩色。
  - 背景：[纯浅灰色或米白色]，留白充足、不杂乱。
  - 气质：现代时装速写、漫画感的杂志插画和极简水墨的融合；高对比、优雅、克制；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/HustleXR/status/2097509829753651228
  author: "@HustleXR"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；风格、技法、背景三个变量保留并改写，新增人物、服装、手持物三个变量（按示例图填入默认值）；精简了重复的形容词"
images:
  - 3570-monochrome-ink-fashion-portrait-kimono-blossom-1.jpg
  - 3570-monochrome-ink-fashion-portrait-kimono-blossom-2.jpg
imageCredit:
  by: "@HustleXR"
  url: https://youmind.com/nano-banana-pro-prompts?id=34122
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：人物和服装是两个变量，分别写"谁"和"穿什么"，如"短发的女子"配"宽肩黑西装"、"戴贝雷帽的男子"配"高领毛衣"；手持物可换"一把油纸伞""一杯咖啡"或删掉；想加一点颜色，把配色一条改成"全画黑白，只有嘴唇是红色"。风格和技法两个变量一般不用动。

第一张示例图是一位挽着头发的女子的近景，脸上能看到几条淡淡的结构辅助线，头发是飞扬的墨线；她穿着黑色的和服，上面是留白画出的大朵樱花，右手举着一小枝花，背景是浅灰色，飘着几片线描的花瓣。第二张是同一画法的另一幅：女子撑着一把油纸伞回头，和服同样是黑底白花，背景有几笔淡墨的建筑。

**常见问题**：
- 画成了普通的黑白照片：强调"手绘墨线、可见的草稿线、平涂灰阶"。
- 线条太满没有留白：写"背景和衣服的三分之一保持纯白"。
- 脸部比例失真：去掉"拉长的比例"之类的要求，加"五官比例自然"。

**适合**：社交头像、穿搭与美妆内容的封面、品牌活动的插画海报、手账和明信片图案。

### 英文原版

```text
Highly stylized {argument name="style" default="monochrome fashion illustration"}, expressive {argument name="technique" default="black-and-white ink portrait style"}, ultra-clean grayscale palette with soft tonal shading and sharp dark accents, elegant feminine facial construction, elongated proportions, minimalistic luxury editorial aesthetic. Use flowing organic contour lines mixed with geometric construction lines crossing the face naturally. Combine loose gestural strokes with precise ink detailing around the eyes, eyebrows, lips, and hair strands. Hair rendered with sweeping fluid brush lines and layered ink curves, creating dynamic movement and asymmetrical framing. Skin shading uses smooth cel-shaded grayscale planes with subtle gradient transitions, while maintaining a hand-drawn ink illustration appearance. Thin sketch lines remain visible as part of the composition. Eyes highly detailed and luminous with crisp eyelashes and reflective highlights. Lips softly sculpted with semi-realistic shading and delicate line texture. Use selective contrast: bold black strokes around facial features balanced against large clean white negative spaces. Overall composition resembles a fusion of modern fashion sketch, manga-inspired editorial art, and minimalist ink wash illustration. {argument name="background" default="Background kept plain light gray or off-white"} with uncluttered negative space. High contrast, elegant, refined, cinematic, expressive line-art aesthetic.
```

> 改编自 [@HustleXR](https://x.com/HustleXR/status/2097509829753651228) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
