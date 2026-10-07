---
title: 即梦提示词：手冲咖啡 6 步图标教程长图，线性图标 + 一句话说明（可换任何教程）
slug: pour-over-coffee-step-guide
model: jimeng
topics: [food, infographic]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做咖啡店桌卡、生活方式博客配图、小红书教程图时，生成一张极简竖版步骤图：每一步一个线性图标加一句短说明，从上到下一目了然。
prompt: |
  一张简洁的分步视觉教程，标题是"[如何用手冲方式冲一杯好咖啡]"。
  - 共 [6] 个步骤，从上到下排列，每步包含：大号序号、一个干净的线性图标、加粗的步骤名和一句简短说明；
  - 步骤内容：[烧水、磨豆、润湿滤纸、闷蒸、注水、享用]，每步说明不超过 10 个字（如"水温约 93℃""中细研磨"）；
  - 步骤之间用细分隔线隔开；
  - 风格极简，以图标为主，配色温暖（[橙棕色]图标和序号，米白背景，深色文字）；
  - 适合生活方式博客或咖啡馆使用，顺序清晰、易于照做。
  竖版长图，比例约 1:2。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-45-pour-over-coffee-guide
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；标题、步骤数、步骤内容、主色设为变量；按示例图补充了序号、分隔线、说明字数限制和配色
images:
  - 3297-pour-over-coffee-step-guide-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765360020018_utsoub_569c26ce3c8be204cf2719b1245fa0d66c9364713f37e088e9c7f89b24103f68-600x1200.png
  license: CC BY 4.0
verify:
  - 原文比例为 1:2，即梦没有该比例时用 9:16，确认版面不被挤压
  - 示例图是英文版，用中文步骤实测一次；水温等数值上线前人工核对
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[如何用手冲方式冲一杯好咖啡] 换成任何教程标题，比如"冷萃咖啡怎么做""三分钟泡一杯好茶""新手洗白鞋步骤"；[6] 控制步骤数，5～8 步最合适；[烧水、磨豆、润湿滤纸、闷蒸、注水、享用] 换成对应步骤名，泡茶就写"温杯、投茶、醒茶、注水、出汤、品饮"。[橙棕色] 是图标主色，茶类可以换"青绿色"。示例图是英文版竖长图：顶部三行黑色大标题，下面 6 行，每行左边一个橙色大序号和橙色线性图标（手冲壶、滤杯、水壶、分享壶、杯子），右边是加粗步骤名和一行说明，第一步写着水温，第四步写着闷蒸 30 秒。

**常见问题与调整**：
- 图标风格不统一：加"所有图标同一线宽、同一颜色、同一视角"。
- 中文说明出错字：每步说明压到 6～8 个字，数字用阿拉伯数字。
- 想更有氛围：背景改成"浅木纹纸质感，右下角一杯冒热气的咖啡插画"。
- 要横版海报：改成"6 步从左到右两行排列"，画幅 16:9。

**适合**：咖啡店 / 茶饮店桌卡、生活方式博客、教程类小红书图；不适合需要精确参数的专业培训资料。

### 英文原版

```
A simple, step-by-step visual guide on “How to Brew the Perfect Cup of Coffee using a Pour-Over Method.” The infographic should have 6–8 steps, each with a clean icon and a short, clear instruction (e.g., “1. Boil Water,” “2. Grind Beans”). The style should be minimalist and icon-based, with a warm color palette. This is for a lifestyle blog or cafe, requiring clear, sequential visual instruction. –ar 1:2
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-45-pour-over-coffee-guide) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
