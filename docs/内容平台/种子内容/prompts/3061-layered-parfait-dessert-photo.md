---
title: "AI美食图提示词：粉色桃子荔枝玫瑰芭菲杯（甜品菜单 / 下午茶海报）（gpt-image-2）"
slug: layered-parfait-dessert-photo
model: gpt-image-2
topics: [food]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成一张春日粉嫩风的甜品摄影：高脚郁金香杯里分层的果冻、奶油、果酱，顶部玫瑰造型雪葩和剥皮荔枝，大理石台面和虚化的花束，适合甜品店菜单、下午茶套餐和节日上新海报。"
prompt: |
  生成一张柔美优雅的美食摄影：一杯[桃子荔枝玫瑰芭菲]装在高挑的透明郁金香形芭菲杯里，居中放在带细灰纹的浅白色大理石台面上。
  芭菲从下到上恰好 5 层：半透明珊瑚粉果冻、厚厚的象牙色奶油、大块粉色桃子果酱、又一层厚奶油、杯口下方一层覆盆子红酱汁。
  顶部恰好 7 种主要装饰：一大朵桃色玫瑰造型的雪葩或慕斯（撒着细金箔）、三颗剥皮的亮泽荔枝、一小堆深粉色酥粒、两朵粉色食用小花。
  配色是精致的[腮红粉与象牙白]马卡龙色：腮红粉、桃色、象牙白、珊瑚色。
  周围是梦幻的浅景深：左上一束虚化的粉色花束，左边缘一朵桃粉色玫瑰形甜点或花，右侧恰好 2 颗粉色圆形糖果，前景和右侧台面上恰好 3 片散落的花瓣。
  光线自然、漫射、高调，玻璃杯和荔枝上有柔和高光，奢华的春日甜品造型，真实质感。
  [略高的四分之三视角]，背景是[柔和虚化的花朵与大理石台面]；不要人物、文字、Logo、餐具，不要生硬阴影。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/NanakatoAi/status/2075037099296972884
  author: "菜々花"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；甜品种类、机位、配色、背景改为变量；保留分层与配料数量约束"
images:
  - 3061-layered-parfait-dessert-photo-1.jpg
imageCredit:
  by: "菜々花"
  url: https://youmind.com/gpt-image-2-prompts?id=28172
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[桃子荔枝玫瑰芭菲] 换成"芒果百香果芭菲""抹茶红豆芭菲""蓝莓巧克力芭菲"时，要把 5 层的内容和顶部装饰一起改，配色也随之换（抹茶写"抹茶绿与奶油白"）。机位可选"正侧面平视"做菜单图，或"俯视 45 度"做社媒图。

示例图与描述一致：大理石台上一只郁金香杯，粉色果冻、奶油、桃子果酱一层层分明，顶部一朵桃色玫瑰形雪葩、几颗剥皮荔枝和粉色小花，左上角虚化的粉色花束和一朵玫瑰，右侧两颗粉色球形点心，台面散落花瓣。

**常见问题**：
- 分层糊成一片：写"每层边界清晰，厚度相近"。
- 装饰堆太高、杯子变形：减少顶部装饰到 4～5 样。
- 想做暗调版本：把"高调、马卡龙色"改成"暗调、深色背景、侧逆光"，作者也做过黑底蓝莓巧克力版的同类图。

**适合**：甜品店菜单、下午茶套餐图、节日 / 春季上新海报、美食账号。

### 英文原版

```text
Create a soft, elegant food photography image of a {argument name="dessert type" default="peach and lychee rose parfait"} in a tall clear fluted parfait glass, centered on a pale white marble tabletop with subtle gray veining. The parfait has exactly 5 visible layered bands from bottom to top: translucent coral-pink jelly, thick ivory cream, chunky pink peach compote, another thick ivory cream band, and a raspberry-red sauce band just below the rim. On top, include exactly 7 main toppings: one large peach-colored rose-shaped sorbet or mousse swirl with delicate gold flakes, three glossy peeled lychees with small orange centers, one mound of dark pink crumble, and two small pink edible blossoms. Use a refined pastel palette of blush pink, peach, ivory, and coral. Surround the glass with a dreamy shallow-depth-of-field setting: a blurred bouquet of pink flowers in the upper left, one peach-pink rose-like dessert or flower at the left edge, exactly 2 round pink confection balls on the right, and exactly 3 loose petals on the tabletop in the foreground and right side. Lighting should be natural, diffused, and high-key, with gentle highlights on the glass and lychees, a luxurious spring dessert styling, realistic textures, no people, no text, no logo, no utensils, and no harsh shadows. Use {argument name="camera angle" default="slightly elevated three-quarter view"}, {argument name="color palette" default="pastel blush pink and ivory"}, and {argument name="background style" default="softly blurred floral marble tabletop"}.
```

> 改编自 [菜々花](https://x.com/NanakatoAi/status/2075037099296972884) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
