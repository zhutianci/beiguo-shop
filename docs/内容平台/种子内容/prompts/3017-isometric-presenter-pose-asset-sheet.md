---
title: "PPT人物素材提示词：同一职场人物 13 个等轴测演讲姿势合集（gpt-image-2）"
slug: isometric-presenter-pose-asset-sheet
model: gpt-image-2
topics: [ppt, character]
aspectRatio: "16:9"
needsRefImage: false
useCase: "一次生成同一个职场人物在演讲、走路、看图表、用电脑等 13 种姿势的等轴测矢量素材表，白底无文字，可以直接抠出来用在 PPT、网页和企业宣传图里。"
prompt: |
  生成一套等轴测矢量插画素材：同一位[职业女性演讲者]在多种演讲和办公情境中的姿势，像一张干净的姿势素材库，白色背景。
  画布：16:9 横版，纯白或极浅灰背景，不要边框、标题、说明文字和水印；每个人物脚下有一个柔和的椭圆灰色投影。
  视觉风格：精致的现代等轴测人物插画，半扁平矢量风，带细微渐变和柔和明暗。人物面部简化、无五官细节，外貌为[浅肤色、棕发低盘发]，服装为[深海军蓝西装、白衬衫、黑高跟鞋]。所有姿势比例一致、服装相同。
  版式：恰好 13 个独立的全身人物，分两排排列，间距宽松；上排 7 个，下排 6 个；每个人物朝向略有不同的等轴测角度，互不重叠。
  13 个姿势：
  1）正面站立，一手张开做欢迎手势；
  2）背影，用指示棒指向墙上展示板（有饼图和折线）；
  3）站立，手持小物件或遥控器向一侧示意；
  4）一手拿遥控器，另一手做手势；
  5）走路，腋下夹灰色文件夹；
  6）走路，手拿线圈笔记本或报告；
  7）站立，像在和人交谈一样比划；
  8）站立，竖起一根食指强调观点；
  9）站立，举起一张带图表的报告；
  10）双臂抱胸，自信站立；
  11）坐在灰色椅子上用打开的笔记本电脑，同时做手势；
  12）俯身指着地上的文件或图表；
  13）身体微倾，一手叉腰、另一手竖起食指。
  道具风格符合[企业商务演示]主题。整体干净、极简、可直接用于演示文稿。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/kumiko_shiraki/status/2058835474551349313
  author: "しらき@パワポ図解"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；人物类型、外貌、服装、主题改为变量；保留 13 个姿势的完整清单"
images:
  - 3017-isometric-presenter-pose-asset-sheet-1.jpg
imageCredit:
  by: "しらき@パワポ図解"
  url: https://youmind.com/gpt-image-2-prompts?id=22633
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[职业女性演讲者] 可以换成"男性工程师""穿白大褂的医生""穿围裙的老师"；外貌和服装两个变量要和人物类型配套（例如医生写"白大褂、浅蓝刷手服、白色运动鞋"）；[企业商务演示] 换成"医疗健康讲座""课堂教学"，道具会跟着变化。

示例图是白底上两排深蓝西装、棕色盘发的女性人物，上排 7 个、下排 6 个：欢迎手势、用指示棒指饼图展板、拿遥控器、夹着文件夹走路、抱臂、坐着用笔记本电脑、俯身看地上的图表等，风格统一、无面部细节，脚下都有灰色投影。

**常见问题**：
- 姿势数量不对或有重复：可以减到 8～9 个，成功率更高。
- 人物不一致（发型、衣服变了）：在开头加"所有人物必须是同一个人，服装完全一致"。
- 要透明背景：生成后用抠图工具处理，或在 API 里设置透明背景输出。

**适合**：PPT 配图、企业官网插画、培训课件、公众号流程图人物素材。

### 英文原版

```text
Goal: Create an isometric vector illustration set of the same {argument name="character type" default="professional businesswoman presenter"} in many presentation and office situations, arranged like a clean pose library on a white background.

Canvas: Wide horizontal 16:9 canvas, bright white or very light gray background, no borders, no title, no captions, no watermark. Use soft oval gray floor shadows under each figure.

Visual style: Polished modern isometric people illustration, semi-flat vector style with subtle gradients and soft shading. The character has a simplified faceless face, light skin, brown hair tied in a low bun, navy business suit, white blouse, cropped trousers, and black high heels. Keep proportions consistent across all poses and use the same outfit throughout.

Layout: Arrange exactly 13 separate full-body figures in two rows with generous spacing, like a presentation asset sheet. Top row contains 7 figures; bottom row contains 6 figures. All figures face slightly different isometric angles and remain isolated with no overlapping.

Pose count and details: Include exactly 13 discrete poses: 1) standing presenter facing forward with one hand open in a welcoming gesture, 2) rear-view presenter pointing with a stick at a wall presentation board showing a pie chart and lines, 3) standing presenter holding a small object or remote and gesturing to the side, 4) standing presenter holding a remote in one hand and gesturing with the other, 5) walking businesswoman carrying a gray folder under one arm, 6) walking businesswoman holding a spiral notebook or report, 7) standing businesswoman gesturing as if speaking to someone, 8) standing figure raising one index finger to make a point, 9) standing figure holding up a spiral report sheet with chart lines, 10) standing figure with arms crossed confidently, 11) seated figure on a gray chair using an open laptop while gesturing, 12) leaning forward and pointing to papers or charts on the floor, 13) standing figure leaning slightly with one hand on hip and the other index finger raised.

Subject customization: Keep the character recognizable as the same person in every pose, but allow the overall character to be changed to {argument name="character appearance" default="light-skinned woman with brown hair in a low bun"}. Use {argument name="outfit" default="dark navy suit, white blouse, black heels"}. Optional props should match a {argument name="presentation theme" default="corporate business presentation"}. Keep the illustration clean, minimal, and presentation-ready.
```

> 改编自 [しらき@パワポ図解](https://x.com/kumiko_shiraki/status/2058835474551349313) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
