---
title: 科研绘图提示词：温带气旋天气图示意，冷锋 / 暖锋 / 锢囚锋 + 低压中心 + 图例说明
slug: weather-front-diagram
model: gpt-image-2
topics: [infographic, ppt]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做地理课件、气象科普文章配图、天气知识短视频封面时，生成一张俯视的温带气旋示意图：等压线、云带、冷暖锋符号、风向箭头、降水区和底部说明栏都齐全。
prompt: |
  制作一张精致的气象信息图，从俯视的天气图视角展示一个[温带气旋系统]。
  - 配色：冷色调，海洋蓝、云白、风暴灰、深红、钴蓝；等值线平滑、符号清晰；
  - 内容：等压线、云带、暖锋和冷锋、风向箭头、降水区域；
  - 文字标注："[温带气旋]"、"[Low Pressure 984 hPa]"、"Warm Front"、"Cold Front"、"Occluded Front"；
  - 加三个城市标签作为参照："[Northport]"、"Elmside"、"Cedar Bay"；
  - 图例："Rain"、"Snow"、"Thunderstorm"；
  - 在不同气团中标出温度："8 C"、"14 C"、"21 C"；
  - 底部可加一排说明栏，分别解释各类锋面和低压系统；
  - 构图有教育性、可直接出版：标签锐利、层级清楚、符合天气图绘制惯例，适合教科书或科学展板。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-scientific-and-educational.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；天气系统、标题、气压值、城市名、画幅设为变量；按示例图补充了底部说明栏
images:
  - 3226-weather-front-diagram-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/scientific-educational/weather-systems-fronts-diagram.png
  license: MIT
verify:
  - 示例图是英文版；锋面符号方向、等压线数值是否符合气象惯例需懂行的人核对
  - 换成"台风结构""季风示意"出一次，看符号是否仍规范
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[温带气旋系统] 可以换成"台风（热带气旋）结构""冬季寒潮南下""梅雨锋"，标注文字跟着改；标题写中文如"[温带气旋]"，气压值 [Low Pressure 984 hPa] 可改成"[低压 984 百帕]"；城市名可以换成你所在地区的城市，但示意图里位置不一定准确。示例图是英文横版：中间是螺旋状白色云团和红色"L"低压中心（984 hPa），蓝色三角的冷锋向左下延伸，红色半圆的暖锋向右下，紫色锢囚锋在上方，云带里有雨、雪和闪电图标，标出 8 C、14 C、21 C，右上是天气图例，底部四格分别解释冷锋、暖锋、锢囚锋和低压系统。

**常见问题与调整**：
- 锋面符号画反：明确"冷锋是蓝色三角朝向暖空气一侧，暖锋是红色半圆朝向冷空气一侧"。
- 中文说明出错：底部说明栏每格只写一句话，不超过 20 字。
- 画面太花哨像游戏：改成"教科书线稿风，白底，只用三四种颜色"。
- 想讲动态过程：追问"画成 1×3 三联图，表示气旋形成、成熟、消亡三个阶段"。

**适合**：地理课件、气象科普配图、天气知识短视频封面；示意图不代表真实天气，不能用于预报。

### 英文原版

```
Create a polished meteorology infographic showing a mid-latitude cyclone system from a top-down synoptic view. Use a cool palette of ocean blue, cloud white, storm gray, crimson, and cobalt, with smooth contour lines and crisp symbols. Include pressure isobars, cloud bands, warm and cold fronts, arrows for wind direction, and rainfall zones. Add clear in-image text: "Mid-Latitude Cyclone", "Low Pressure 984 hPa", "Warm Front", "Cold Front", and "Occluded Front". Include city labels "Northport", "Elmside", and "Cedar Bay" for context, plus a legend reading "Rain", "Snow", and "Thunderstorm". Show temperature markers "8 C", "14 C", and "21 C" in different air masses. The composition should be educational and publication-ready, with sharp labels, clean hierarchy, accurate diagram conventions, and strong visual readability suitable for a textbook or science exhibit panel.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
