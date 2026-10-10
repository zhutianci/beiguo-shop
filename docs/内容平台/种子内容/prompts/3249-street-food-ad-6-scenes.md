---
title: 电商详情页提示词：烤肉卷饼六宫格商业美食大片，酱汁飞溅+食材悬浮爆炸（gpt-image-2）
slug: street-food-ad-6-scenes
model: gpt-image-2
topics: [food, ecommerce]
needsRefImage: false
aspectRatio: "3:4"
useCase: 做餐饮外卖主图、菜单海报、详情页首屏时，一次生成六张不同背景色的"高速摄影"美食广告图：切片飞散、酱汁淋下、食材解构悬浮，各张风格统一。
prompt: |
  8K 超写实商业美食摄影，3:4 竖版，一张图里分成 6 个场景（3 行 × 2 列），每个场景用各自的纯色或渐变背景，主角是[烤肉卷饼]：
  1. 肉片爆散：[牛羊肉混合烤肉]切成薄如纸的肉片在半空螺旋飞散，白色[蒜香酱]和红色[辣椒酱]飞溅，香菜叶漂浮。背景深绯红。
  2. 卷饼悬浮：一个卷饼从中间切开竖直悬浮，截面露出肉、生菜、番茄、洋葱的层次，白酱优雅淋下，香料颗粒飘散。背景暖陶土橙。
  3. 淋酱特写：一堆边缘焦脆的刚切肉片，浓稠白酱从上方倒下、定格在半空，红辣酱细细淋在旁边，下方是番茄片和香菜，热气升腾。背景炭黑。
  4. 解构悬浮：烤过的薄饼块、肉片、番茄片、生菜、洋葱圈分别悬浮在不同高度，用光亮的酱汁丝带艺术地连接，空气中有极细的香料粉。背景灰鼠尾草绿。
  5. 烤肉柱特写：竖立旋转的烤肉柱极近特写，一把大刀定格在切片瞬间，刚切下的肉片落下，焦粒和调料飞溅，切口冒热气。背景浓郁金琥珀色。
  6. 俯拍餐盘爆炸：俯视角度，所有食材呈圆形向上爆开——肉片、薯条、烤彩椒和番茄、香菜、[漆树粉]、柠檬角、酱汁飞沫，部分元素在旋转。背景深酒红带暗角。
  整体：受控的影棚布光，突出肉的纹理和焦痕，浅到中等景深，对比丰富，暖色调、自然油亮、诱人的调色。画面中不要文字、logo、人物、手、卡通风或塑料感食物。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2063094917774086510
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并逐场景整理；主食材、肉类、两种酱、香料设为变量；明确"3 行 × 2 列"的拼图布局；补充了常见问题与改法
images:
  - 3249-street-food-ad-6-scenes-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/ecommerce_case164/output.jpg
  license: CC0 1.0
verify:
  - 示例图右下角有一个生成平台的小星形标记，展示前确认是否需要裁掉
  - 换成"肉夹馍""煎饼果子"各出一次，看六个场景是否仍能对应
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[烤肉卷饼] 换成你卖的单品，六个场景里的食材跟着换，比如"肉夹馍"就写腊汁肉、青椒、白吉馍；"麻辣烫"可以改成食材从碗里爆开、红油淋下。[蒜香酱][辣椒酱] 换成"芝麻酱""红油"等本地酱料。示例图是 3 行 2 列的六宫格：左上是插在钎子上的烤肉柱、肉片和白酱绕着飞，右上一个包得满满的卷饼立在橙色背景上，中间左边白酱和红酱从上方淋到肉堆，右边食材分层悬浮，左下大刀正在切肉柱，右下薯条、肉片、柠檬从盘子里炸开。

**常见问题与调整**：
- 六张背景色太接近：把每格的背景色写成对比明显的色系，避免两格都是红。
- 食物像塑料：加"表面有自然油光和焦痕，肉纤维清晰"，并删掉"8K"之类的堆词。
- 只要单张主图：只保留一个场景，画幅改 1:1 或 4:5 做外卖平台主图。
- 想加卖点文字：先出无字图，再追问"在第 2 格上方留白，加一行标题'[招牌卷饼]'"。

**适合**：外卖平台主图、餐厅菜单和灯箱海报、详情页首屏；用于售卖宣传时，实物分量和配料要与图片一致。

### 英文原版

```
prompt:

8K UHD hyper-realistic commercial food photography, 3:4 aspect ratio. 6 scenes, each on its own solid or gradient background:

Scene 1, Döner slice explosion: Traditional Turkish döner (beef and lamb mix), paper-thin ribbons spiraling outward mid-air, white garlic sauce and red chili sauce splashing, fresh parsley leaves floating. Deep crimson red background.

Scene 2, Dürüm wrap floating: Premium dürüm cut in half and floating vertically, cross-section revealing döner meat, lettuce, tomatoes, onions layered inside, white garlic yogurt sauce drizzling elegantly, subtle spice particles drifting. Warm terracotta orange background.

Scene 3, Sauce pour drama: Mound of freshly sliced döner with crispy charred edges, thick creamy garlic yogurt sauce pouring from above frozen mid-flow, spicy red chili sauce drizzling alongside in thin crimson streams, sliced tomatoes and parsley below, heat vapor rising. Dark charcoal black background.

Scene 4, Deconstructed composition: Toasted lavash bread pieces, döner slices, tomato slices, lettuce leaves, and onion rings all suspended separately at varying heights, glossy sauce ribbons connecting elements artistically, ultra-fine spice dust in the air. Muted sage green background.

Scene 5, Rotating spit close-up: Extreme close-up of vertical döner tower on spit, large döner knife frozen mid-slice, fresh slice falling away, charred bits and seasoning particles in air, heat vapor rising from the fresh cut. Rich golden amber background.

Scene 6, Overhead plate explosion: Top-down view, all ingredients bursting upward in circular pattern, döner slices, french fries, grilled peppers and tomatoes, fresh parsley, sumac, lemon wedges, sauce droplets spraying, elements at varying heights with some rotating. Deep burgundy red background with vignette.

Global: controlled studio lighting emphasizing meat texture and char marks, shallow to medium depth of field, rich contrast, warm savory tones, natural shine, appetizing color grading. No text, logos, people, hands, cartoon style, or plastic-looking food.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2063094917774086510) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
