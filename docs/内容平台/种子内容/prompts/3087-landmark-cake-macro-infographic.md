---
title: "创意美食图提示词：把世界地标做成切开的法式慕斯蛋糕（微距 + 配料标注）（gpt-image-2）"
slug: landmark-cake-macro-infographic
model: gpt-image-2
topics: [food]
aspectRatio: "16:9"
needsRefImage: false
useCase: "把建筑地标\"设计\"成一块法式慕斯蛋糕，背景是整座蛋糕地标，前景一块切片放在金勺上，带微距配料标注，2×2 四宫格一次出 4 个地标，适合甜品创意、旅行主题内容和社媒趣味图。"
prompt: |
  2×2 四宫格，16:9，为[4 个世界奇迹]各做一格，口味由你根据地标来搭配。
  每一格是"微距美食摄影 + 平面信息图叠加"：
  - 主体：把[地标建筑]做成一个法式慕斯蛋糕（Entremet），口味为[与地标相配的口味]；
  - 背景：整座地标蛋糕，略微虚化（焦外光斑）；
  - 前景：一块楔形切片被一把金色甜品勺拉到前面，焦点极其锐利；
  - 质感：光亮的镜面淋面、多孔的蓬松海绵、酥脆的沙布列底座之间形成强烈对比，与口味相匹配；
  - 标注：细细的矢量引线直接指向切片上的微小碎屑和气孔；加几个小圆形"微观视图"插图，展示配料的极近特写；
  - 每格左上角写地标名称，右侧一列小字列出各层口味。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Gdgtify/status/2091877938014941255
  author: "Gadgetify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是英文 + JSON 结构，本站改写为中文自然语言提示词；地标和口味改为变量"
images:
  - 3087-landmark-cake-macro-infographic-1.jpg
imageCredit:
  by: "Gadgetify"
  url: https://youmind.com/gpt-image-2-prompts?id=32530
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[4 个世界奇迹] 可以换成"4 座中国古建筑（天坛、黄鹤楼、布达拉宫、应县木塔）""4 座城市地标"；只做一个时，把第一句改成"单张 16:9"，并写明 [地标建筑] 和 [与地标相配的口味]，例如"[天坛]＋[抹茶、红豆、桂花]"。

示例图是四宫格：泰姬陵（白色蛋糕穹顶，粉绿开心果切片）、佩特拉古城（红色岩壁蛋糕，覆盆子切片）、奇琴伊察金字塔（巧克力阶梯蛋糕）、马丘比丘（抹茶绿山形蛋糕），每格前景一块分层切片在金勺上，左右两侧是配料小圆图和口味标注小字。

**常见问题**：
- 地标不像：写出地标的关键造型（"白色洋葱形穹顶 + 四座尖塔"）。
- 切片层次乱：写"切片可见 4～5 层，层次分明"。
- 标注小字乱码：标注只是装饰，想要可读就减少到每格 3 条。

**适合**：甜品店创意内容、旅行主题社媒、美食账号趣味图、烘焙课程灵感板。

### 英文原版

```text
2x2 grid, 16:9, do this for 4 wonders of the world, ai picks the rest for flavor profile ..: {   "Scene_Type": "Macro Food Photography with Graphic Design Overlay",   "Subject_Cake": "{argument name="landmark" default="[ARCHITECTURAL_LANDMARK]"} engineered as an Entremet",   "Flavor_Base": "{argument name="flavor" default="[FLAVOR_PROFILE]"}",   "Composition": {     "Background": "The main {argument name="landmark" default="[ARCHITECTURAL_LANDMARK]"} cake, slightly out of focus (bokeh).",     "Foreground": "A single wedge/slice pulled forward on a gold dessert spoon, in hyper-sharp focus.",     "Textures": "AI_INFER(High contrast between glossy mirror glazes, porous aerated sponge, and crumbly sablé base matching the flavor)."   },   "Infographic_Data": {     "Macro_Callouts": "Thin vector lines pointing directly to the microscopic crumbs and bubbles on the slice.",     "Data_Widgets": "AI_INFER(Small circular 'Micro View' inserts showing extreme close-ups of the ingredients)."   } }
```

> 改编自 [Gadgetify](https://x.com/Gdgtify/status/2091877938014941255) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
