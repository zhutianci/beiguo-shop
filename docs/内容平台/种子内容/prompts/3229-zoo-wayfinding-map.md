---
title: 信息图提示词：手绘风动物园导览地图，分区路线 + 编号地标 + 图例 + 无障碍标识
slug: zoo-wayfinding-map
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做动物园、主题乐园、校园、农场的导览图草案或活动宣传单时，生成一张亲切的插画式导航地图：彩色步道、编号景点、可爱动物图标、图例、指北针和无障碍设施都画齐。
prompt: |
  为一座虚构的现代城市动物园"[RIVERGATE ZOO]"设计一张精致的游客导览地图。
  - 风格：友好的插画式导航地图，步道和分区清晰，标签易读，配可爱的动物图标和实用的游客标识；
  - 文字标注："[RIVERGATE ZOO]"、"Main Gate"、"[Panda Forest]"、"Savanna Loop"、"Aviary"、"Reptile House"、"Kids Farm"、"Cafe"、"Restrooms"、"First Aid"、"Exit"；
  - 元素：按颜色区分的步行路线、编号地标、小图例、指北针、无障碍图标、柔和的植物细节；
  - 配色：暖奶油色纸张、动物园绿、天蓝、珊瑚红、琥珀，炭灰色标签字；
  - 要有魅力、实用、像真正的地图，而不是普通海报；不要虚构的赞助商 logo，不要密密麻麻的小字。
  画幅[3:2] 横版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-events-and-experience.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；园区名、首个展区名、画幅设为变量；去掉像素尺寸参数；补充了常见问题与改法
images:
  - 3229-zoo-wayfinding-map-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/events-experience/zoo-visitor-wayfinding-map.png
  license: MIT
verify:
  - 示例图是英文版；换中文地名出一次，看十几个标签是否都写对
  - 生成的地图只是示意，真实园区导览需按实际平面图绘制
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[RIVERGATE ZOO] 换成你的园区名，中文如"[青山动物园]""[开心农场]"；[Panda Forest] 等展区名可以全部换成中文，比如"熊猫馆、长颈鹿草原、鸟语林、爬行馆、萌宠农场"；同样的结构也能套到"大学校园导览""亲子农场""音乐节场地图"上，把动物图标换成建筑或舞台即可。示例图是英文横版：左上大字"RIVERGATE ZOO"，河流环绕着园区，编号 1～5 分别是熊猫林、鸟舍玻璃穹顶、爬行馆、中央长颈鹿和犀牛草原、儿童农场，下方是主入口拱门、咖啡馆和卫生间急救点，左侧是路线图例和无障碍说明，右侧是景点简介，右上有指北针。

**常见问题与调整**：
- 中文标签出错：展区名控制在四个字以内，并加"所有标签为简体中文，字体端正"。
- 路线看不清：加"三条路线分别用红、蓝、绿虚线，宽度一致"。
- 画面太满：减少到 5 个展区，"留出足够的草地空白"。
- 想印刷成折页：画幅改 2:1，加"右侧留一栏放开放时间和须知"。

**适合**：园区导览草案、活动宣传单、亲子 / 研学手册插图；正式导览图需按真实平面图和无障碍设施位置重新核对。

### 英文原版

```
Design a polished visitor wayfinding map for a fictional modern city zoo named "RIVERGATE ZOO". Landscape 3:2 orientation (1536×1024), friendly illustrated navigation-map style, clean paths and zones, readable labels, cute animal icons, and practical visitor signage. Include crisp in-image text: "RIVERGATE ZOO", "Main Gate", "Panda Forest", "Savanna Loop", "Aviary", "Reptile House", "Kids Farm", "Cafe", "Restrooms", "First Aid", and "Exit". Show color-coded walking routes, numbered landmarks, small legend, north arrow, accessibility icons, and soft botanical details. Palette: warm cream paper, zoo green, sky blue, coral, amber, and charcoal labels. Make it charming, useful, and map-like rather than a generic poster; avoid fake sponsor logos and cluttered microtext.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
