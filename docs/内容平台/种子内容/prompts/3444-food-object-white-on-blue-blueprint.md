---
title: "信息图提示词：把点心画成工程蓝图，蓝底白线三视图 + 尺寸标注的趣味图解（玛德琳示例）（gpt-image-2）"
slug: food-object-white-on-blue-blueprint
model: gpt-image-2
topics: [infographic, food, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给甜品店、烘焙课、美食账号做一张有趣的\"技术图纸\"：把一块点心当成工业零件，画出俯视、侧视、正视和局部细节四个视图，配尺寸线、规格栏、比例尺和备注，蓝底白线、一本正经。"
prompt: |
  把[一块玛德琳蛋糕]画成一张干净的工程蓝图，而不是照片。竖版 3:4 的工程图纸版式：深蓝色网格背景，细白色线条，双线边框，尺寸箭头、标注和示意轮廓，保留它[贝壳般的椭圆外形]。
  - 标题：左上角大字"[MADELEINE]"，副标题"TECHNICAL BLUEPRINT"；
  - 规格栏：标题下方恰好 4 行——TYPE（类型）：[小贝壳蛋糕]；ORIGIN（产地）：[法国]；SHAPE（形状）：椭圆 / 贝壳形；UNITS（单位）：毫米；
  - 视图：恰好 4 个技术视图——右上是最大的俯视图，其下居中是侧视图，左下是正视图，右下是一个带框的局部放大图，展示贝壳纹路；用白色轮廓线和虚线表示内部纹理，每个视图下方有名称标签；
  - 尺寸：俯视图宽 [75]、高 [45]，侧视图高 [22]，正视图宽 45、高 22，带尺寸线和数字；左下角一把比例尺，刻度 0～50 毫米；
  - 备注：右下角备注框恰好 2 条——"1. 所有尺寸均为近似值。""2. 实际比例可能因做法而异。"；
  - 风格：不要画成写实的食物照片，完全转成蓝底白线的技术示意图；线条清晰精确，轮廓略带手绘感；没有多余物体、阴影和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/gomagometti/status/2058522695613268129
  author: "@gomagometti"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主体、标题、规格栏内容、尺寸数字设为变量；原文要求上传参考照片，这里改为可直接用文字指定主体（也可上传照片）；保留\"恰好 4 个视图、4 行规格、2 条备注\"的结构"
images:
  - 3444-food-object-white-on-blue-blueprint-1.jpg
imageCredit:
  by: "@gomagometti"
  url: https://youmind.com/gpt-image-2-prompts?id=22405
  license: CC BY 4.0
verify:
  - "图中的尺寸为示意数值；如需准确尺寸请自行测量后替换"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：主体可以换成"一只可颂""一个小笼包""一块月饼"，外形描述、标题和规格栏跟着改，例如月饼写"圆形带花纹的饼""MOONCAKE""中式酥皮点心 / 中国"；尺寸数字填你的实际测量值或大概数；标签想用中文，把"TECHNICAL BLUEPRINT"等英文改成中文即可。也可以直接上传一张点心照片，并在开头加"以上传照片为对象"。

示例图：深蓝色网格纸上，左上角写着"MADELEINE / TECHNICAL BLUEPRINT"和四行规格，右上是带贝壳纹虚线的俯视图并标着 75 和 45，中间是扁扁的侧视图标着 22，左下是正视图，右下方框里是纹路的局部放大，底部有比例尺和两条备注。

**常见问题**：
- 画成了蓝色滤镜的食物照片：把"完全转成线稿示意图、不要写实照片"放到第一句。
- 视图数量或位置不对：保留"恰好 4 个视图"并逐个写明位置。
- 尺寸数字乱：数字越少越稳，只标长、宽、高三个即可。

**适合**：甜品店趣味海报、烘焙课程封面、美食账号系列图、礼盒内页卡片。

### 英文原版

```text
Using the provided reference image as the subject, transform the madeleine into a clean technical blueprint drawing rather than a photo. Create a vertical engineering-sheet layout on a dark blue grid background with thin white linework, a double border, measurement arrows, labels, and schematic outlines that preserve the madeleine’s shell-like oval form.

Goal: Produce a blueprint titled {argument name="title text" default="MADELEINE"} with the subtitle {argument name="subtitle text" default="TECHNICAL BLUEPRINT"}.

Layout: Include exactly 4 technical drawing panels derived from the reference pastry: 1 large top view at the upper right, 1 side view centered below it, 1 front view at the lower left, and 1 boxed detail inset at the lower right showing the shell rib pattern. Use white contour lines and dashed internal rib lines.

Technical text: Add a specification block at upper left with exactly 4 rows: TYPE: {argument name="type label" default="Small Shell Cake"}, ORIGIN: {argument name="origin label" default="France"}, SHAPE: Ovoid / Shell, UNITS: Millimeters.

Measurements: Add dimension lines and numeric labels matching a blueprint: top view width 75 and height 45, side view height 22, front view width 45 and height 22. Add a bottom-left scale ruler labeled SCALE with marks 0, 10, 20, 30, 40, 50 mm.

Additional elements: Add the inset label “DETAIL A” and “SHELL RIB PATTERN”. Add a notes box at the bottom right with exactly 2 notes: “1. All dimensions are approximate.” and “2. Typical madeleine proportions may vary.”

Style constraints: Do not render the pastry as a realistic food photo; convert it fully into a white-on-blue technical schematic. Keep the blueprint crisp, precise, lightly hand-drawn at the outline edges, with no extra objects, no shadows, and no watermark.
```

> 改编自 [@gomagometti](https://x.com/gomagometti/status/2058522695613268129) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
