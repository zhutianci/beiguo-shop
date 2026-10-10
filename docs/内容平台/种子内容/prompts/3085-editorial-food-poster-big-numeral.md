---
title: "美食海报提示词：大号数字 + 建筑感蒸汽的杂志风菜品海报（饺子示例）（gpt-image-2）"
slug: editorial-food-poster-big-numeral
model: gpt-image-2
topics: [food, poster]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张高级杂志风的菜品海报：深色石台上一盘菜，热气被塑造成层层叠叠的半透明几何\"建筑\"，背后是巨大的半透明数字，只露出厨师的手，底部窄长的英文菜名，适合餐厅系列海报、菜单封面和品牌社媒。"
prompt: |
  4:5 竖版杂志风美食海报：一盘手工蒸饺放在深色锤纹陶盘上，下面是炭灰色石材台面。构图居中，极具建筑感。
  一柱高高的热气从饺子正上方升起，成为画面中最主要的图形元素。热气不是柔软蓬松的蒸汽，而是被塑造成层叠的半透明薄片、几何折面、竖向平面和互相重叠的玻璃般结构，像一座由热量建成的纪念碑。
  画面只出现厨师的手和前臂：一只手从左上方自然伸入，穿着干净的象牙白厨师袖，轻轻往饺子上撒新鲜的微型菜苗；另一只手从右下方伸入，扶着一个圆形竹蒸笼的边缘，暗示菜刚端上桌。不要出现脸或完整人物。
  背景是平整哑光的炭灰色厨房墙面，细节极少；远处只放一件功能物件：一只暖色拉丝铜锅，柔和虚化。
  配色克制：炭黑、暖象牙白、石灰、低调铜色、柔和竹棕和清新草绿。戏剧化的定向餐厅光，在饺子上打出雕塑般的高光，真实的湿润感、柔和阴影和可见的热气。
  在升腾的热气后面放一个巨大的半透明数字"[03]"，被蒸汽建筑部分遮挡，融入构图而不是浮在上面。
  底部用窄长的压缩型编辑字体写"[DUMPLINGS]"，字距宽松；四周边缘加几行极小的辅助文字，营造美食杂志的精致感。
  极简、高级、有触感、静奢；美食摄影融合瑞士编辑设计和建筑海报构图。热量、精准、仪式、静止。不要杂乱、卡通风格和过多道具。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/miratechtool/status/2102276163317965292
  author: "Mira"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；数字和菜名改为变量，并补充做成系列（01、02、03）的说明"
images:
  - 3085-editorial-food-poster-big-numeral-1.jpg
  - 3085-editorial-food-poster-big-numeral-2.jpg
imageCredit:
  by: "Mira"
  url: https://youmind.com/gpt-image-2-prompts?id=35156
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[03] 和 [DUMPLINGS] 分别是序号和菜名，做系列海报时依次写"01 / RAMEN""02 / RISOTTO""03 / DUMPLINGS"，并把"一盘手工蒸饺""竹蒸笼""微型菜苗"换成对应的菜、器皿和装饰（拉面写"粗陶碗里的豚骨拉面，撒葱花"）。英文菜名也可以换成中文，但窄长字体的效果会弱一些。

示例图第一张就是这条提示词：深色石台上一盘饺子，一只手撒菜苗、另一只手扶着竹蒸笼，热气化成一束层叠的半透明竖向光片，后面巨大的"03"，底部窄长的"DUMPLINGS"；第二张是作者用同一模板做的"01 RAMEN"拉面版。

**常见问题**：
- 蒸汽还是普通的烟：强调"像玻璃片一样的几何折面，不是蓬松的烟雾"。
- 出现了人脸：保留"只出现手和前臂"。
- 数字太抢眼：写"数字半透明、颜色接近背景"。

**适合**：餐厅系列海报、菜单封面、品牌社媒、美食杂志风视觉。

### 英文原版

```text
Vertical 4:5 editorial food poster featuring a single plate of handmade steamed dumplings arranged on a dark hammered ceramic dish over a charcoal stone countertop. The composition is centered and highly architectural.

A tall column of hot vapor rises directly above the dumplings and becomes the dominant graphic element. Instead of soft, fluffy steam, shape the vapor into layered translucent sheets, geometric folds, vertical planes, and overlapping glass-like structures, creating the feeling of an architectural monument built from heat.

Only the chef’s hands and forearms are visible. One arm enters naturally from the upper left in a clean ivory chef sleeve, delicately dropping fresh microgreens onto the dumplings. A second hand enters from the lower right, holding the edge of a round bamboo steamer, suggesting the dish has just been served. No face or full human figure.

The background is a flattened matte charcoal kitchen wall with minimal detail. Include only one functional object in the distance: a warm brushed-copper saucepan, softly out of focus.

Use a restrained palette of charcoal black, warm ivory, stone gray, muted copper, soft bamboo brown, and fresh herbal green. Dramatic directional restaurant lighting creates sculptural highlights on the dumplings, realistic moisture, gentle shadows, and visible heat.

Place an enormous translucent numeral “{argument name="number" default="03"}” behind the rising vapor, partially obscured by the steam architecture and integrated into the composition rather than floating over it.

At the bottom, set the word “{argument name="title" default="DUMPLINGS"}” in tall, narrow condensed editorial typography with generous letter spacing. Add very small secondary type around the edges for a refined culinary-magazine feel.

Minimal, premium, tactile, quiet luxury, food photography blended with Swiss editorial design and architectural poster composition. Heat, precision, ritual, stillness. No clutter, no cartoon styling, no excessive props. 4:5.
```

> 改编自 [Mira](https://x.com/miratechtool/status/2102276163317965292) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
