---
title: "信息图提示词：幼儿认知单词卡，整体与局部对照（玉米—玉米粒、石榴—石榴籽）（gpt-image-2）"
slug: preschool-fruit-part-vocabulary-card
model: gpt-image-2
topics: [infographic, illustration]
aspectRatio: "4:5"
needsRefImage: false
useCase: "给幼儿园、早教课、亲子英语做成套的认知卡：左边是一个大大的真实水果或蔬菜，右边是它的一部分，中间一条虚线箭头和一个指着看的小火柴人，上下各一个大号单词，干净的浅蓝白配色。"
prompt: |
  为学龄前 / 幼儿园小朋友制作一张干净、亲切的认知单词海报，像一张简洁的视觉学习卡。竖版 4:5。
  - 左侧：一个大大的、写实照片质感的[玉米]，放在圆角的浅蓝色底板里，是画面的主角；
  - 右侧：同一种食物的[一颗玉米粒]，放在较小的圆角底板里；
  - 连接：两者之间用一条俏皮的虚线弧形箭头相连，旁边一个极简的火柴人小朋友，伸手指向那个小的局部；
  - 文字：顶部用很大的粗体大写字母写"[CORN]"，小图下方用大号粗体大写字母写"[KERNEL]"；文字是简洁的蓝色；
  - 背景：柔和的白色和很浅的粉蓝色，圆角图片面板，留白干净；
  - 风格：明亮、有教育感、现代、不杂乱，幼儿一眼能看懂，像高品质的幼儿园认知卡；柔和的光线，标签清晰，没有多余装饰。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Naiknelofar788/status/2092993830220120231
  author: "@Naiknelofar788"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主体、局部、两个标签设为变量并给出示例值；补充了中文标签或双语标签的写法"
images:
  - 3443-preschool-fruit-part-vocabulary-card-1.jpg
  - 3443-preschool-fruit-part-vocabulary-card-2.jpg
imageCredit:
  by: "@Naiknelofar788"
  url: https://youmind.com/gpt-image-2-prompts?id=32775
  license: CC BY 4.0
verify:
  - "\"局部\"的英文名称（如 kernel、aril）请自行核对后再用于教学"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[玉米] 和 [一颗玉米粒] 是"整体—局部"的一对，可以换成"橙子—一瓣橙子""西瓜—一块西瓜""花生—花生仁"；两个标签对应改，想要中文卡片就写"玉米""玉米粒"，想要双语就写"CORN 玉米"。一套卡片固定其他描述、只换这四个变量，风格会很统一。

示例图第一张：浅蓝白的背景，顶部是蓝色大字"CORN"，左边是一根带绿色苞叶的黄玉米，右下是一颗放大的玉米粒，中间一条蓝色虚线箭头和一个指着玉米粒的火柴人，玉米粒下面写着"KERNEL"。第二张是同一模板的石榴版："POMEGRANATE"和"ARIL"，右边是一小块露出红色籽粒的石榴。

**常见问题**：
- 单词拼错：英文单词越长越容易错，出图后逐字母核对。
- 局部画得和整体一样大：写明"右侧小图面积约为左侧的三分之一"。
- 画面里多出装饰图案：保留"没有多余装饰"。

**适合**：幼儿认知卡、早教课件、亲子英语打卡图、幼儿园墙面布置。用于教学前请核对名称是否准确。

### 英文原版

```text
Create a clean, child-friendly educational vocabulary poster for preschool/kindergarten children, inspired by a simple visual learning card. Feature {argument name="fruit" default="[FRUIT]"} as the main large realistic object on the left, and show a {argument name="slice" default="[PART / SLICE / SEGMENT]"} of the same fruit on the right. Connect the two with a playful dotted curved arrow and a tiny simple stick-figure child pointing toward the smaller part. Add the word “{argument name="label" default="[FRUIT NAME]"}” in large bold uppercase letters at the top and “{argument name="sublabel" default="[PART NAME]"}” in large bold uppercase letters underneath the smaller image. Use a soft white and very light pastel-blue background, rounded image panels, clean spacing, realistic fruit photography, simple blue typography, and minimal playful illustrations. The overall design should feel bright, educational, modern, uncluttered, and easy for young children to understand, like a premium preschool vocabulary learning card. Vertical 4:5 composition, high resolution, soft lighting, clear labels, no unnecessary decorations.
```

> 改编自 [@Naiknelofar788](https://x.com/Naiknelofar788/status/2092993830220120231) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
