---
title: 科研绘图提示词：两级运载火箭剖视结构图（贮箱、发动机、引线标注 + 比例尺）
slug: rocket-cutaway-diagram
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做航天科普、课堂讲义、机械结构说明时，需要一张"切开看内部"的竖版工程剖视图，用它能得到引线规整、部件标注清楚、带比例尺的技术插图。
prompt: |
  生成一张高度精细的竖版剖视插图，主体是一枚虚构的两级运载火箭"[火箭名称]"，干净的白色技术背景。
  - 从整流罩顶端画到底部发动机，纵向剖开，露出内部贮箱、航电设备、有效载荷整流罩、级间段、涡轮泵和推力结构；
  - 配色克制：白、枪灰、橙色、浅蓝，少量安全红点缀；
  - 引线精确，标注锐利；
  - 画面文字："[火箭名称]""[有效载荷 8400 千克]""[全高 62.4 米]""一级 煤油 / 液氧""二级 甲烷 / 液氧"；
  - 内部部件标注："有效载荷舱""制导计算机""液氧箱""燃料箱""氦气瓶""9 台发动机组"；
  - 侧边一条比例尺："0 米""20 米""40 米""60 米"；
  - 优先保证工程图式的准确构图、干净的字体、可信的硬件细节和极其锐利的标注；
  - 竖版画幅[9:16]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-technical-illustration.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；虚构火箭名、载荷与高度参数设为变量，标注改为中文版；删去末尾的模型名，补充竖版画幅
images:
  - 3330-rocket-cutaway-diagram-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/technical-illustration/rocket-cutaway-launch-vehicle.png
  license: MIT
verify:
  - 中文标注版出一次，检查部件名称有无错字、引线是否指向正确部位
  - 提醒用户这是虚构火箭的示意图，结构参数不能当真实工程数据
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[火箭名称] 写一个虚构型号，例如"星河-3""青鸟一号"；载荷和高度参数随意设定，但建议保持合理量级。这套写法也能换主体：把"两级运载火箭"改成"潜水艇""高铁动车头""咖啡机"，再把内部部件名称换掉即可。示例图是一枚白色细长火箭的剖视图：左上大号"ASTER-9"标题和载荷、高度两行参数，左侧用蓝色和橙色括号标出二级与一级，火箭内部能看到浅蓝色液氧箱和橙色燃料箱，右侧整齐排列引线标注，最右边一条 0～60 米刻度尺，左下有图例和直径表。示例图是英文版。

**常见问题与调整**：
- 引线乱指：减少标注到 6～8 个，加"引线全部水平引出到右侧，对齐成一列"。
- 中文标注错字：把部件名改成更常见的词，或先出英文版再自己替换文字。
- 太像写实照片：加"技术手册插画风格，线条清晰，平涂上色"。
- 想要横版海报：画幅改 16:9，火箭横放，标注改为上下两侧。

**适合**：航天 / 机械科普图、课堂讲义、展板示意图；不适合当作真实型号的工程资料。

### 英文原版

```
Generate a highly detailed vertical cutaway illustration of a fictional two-stage launch vehicle named Aster-9 on a clean white technical background. Show the full rocket from nose cone to engines, sliced to reveal internal tanks, avionics, payload fairing, interstage, turbopumps, and thrust structure. Use a restrained palette of white, gunmetal, orange, pale blue, and safety red accents. Add precise leader lines and crisp labels. Include in-image text: "ASTER-9", "Payload 8,400 kg", "Height 62.4 m", "Stage 1 RP-1 / LOX", and "Stage 2 Methalox". Label internal parts such as "Payload Bay", "Guidance Computer", "LOX Tank", "Fuel Tank", "Helium COPV", and "Engine Cluster x9". Add a small scale marker with "0 m", "20 m", "40 m", and "60 m". Prioritize accurate engineering-diagram composition, clean typography, believable hardware detail, and razor-sharp annotations optimized for gpt-image-2.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
