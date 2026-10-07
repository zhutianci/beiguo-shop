---
title: "语文课件PPT封面提示词：书法大字 + 版画插画的国风封面（苏轼示例）（gpt-image-2）"
slug: chinese-culture-ppt-cover-calligraphy
model: gpt-image-2
topics: [ppt, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给语文、历史、传统文化类课件做国风封面：用粗笔书法大字当画面骨架，配扁平版画风的人物或意象、印章和竖排诗句，示例是\"苏轼的一生\"和\"爱莲说\"。"
prompt: |
  主题：[苏轼的一生]
  用途：[语文课件的 PPT 封面]，16:9 横版。
  用主题的核心文字（人名、篇名）写成粗重的书法大字，形成巨大的视觉锚点：让字形像竖向的建筑骨架一样撑起画面，与主体图像在尺度上碰撞、重叠，局部越出边界。
  把主体（人物或核心意象）概括为夸张放大的扁平剪影，用锐利的留白线、有限但有层次的色块和清晰边界来组织画面。环境为主体服务：围绕主体形成前景、中景、远景，同时在画面中央保留一块可以呼吸的空白区。
  采用不对称构图：高密度的主体在一侧形成强烈裁切，次要元素越过中轴伸进留白；底部用一个更宽的形体稳住画面。视线从高对比的大字出发，经过画面事件，自然落到下方的信息区。
  配色：深沉低饱和的主题色承担结构重量，温暖的近白色打开空间，同色系里更亮或更暖的颜色点出主题事件（如一轮红日）；文字用近黑色保证可读。
  让与主题相关的手写体或印章式文化符号成为情感锚点，与主体并置；小号的标题、说明、诗句和落款作为低调的编辑注释，竖排穿插在色块、图像和留白之间。
  整体：克制、生动、有叙事张力的编辑视觉，获奖课件级别；不要出现序号和代码式的排版。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2097326027194478693
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是一段抽象的版式理论（中文原意的英文写法），本站改写为可直接使用的中文提示词，补充了画幅、留白和文字层级的具体要求；主题、用途改为变量"
images:
  - 3012-chinese-culture-ppt-cover-calligraphy-1.jpg
  - 3012-chinese-culture-ppt-cover-calligraphy-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=33956
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[苏轼的一生] 换成课文或人物，如"李白与月""岳阳楼记""爱莲说"；[语文课件的 PPT 封面] 也可以换成"读书会海报""公众号头图"。原作者一次生成了 10 张不同主题，想要一套风格统一的课件，把"配色"那一段固定下来（例如"米白底、墨蓝、赭红"）。

示例图第一张：左侧巨大的"苏轼"墨色书法字，旁边"的一生"，一位长袍文人立于山石上远眺，远处红日、远山与帆船，右侧竖排"一蓑烟雨任平生"等诗句和红色小印章；第二张是"爱莲说"：粉色荷花与墨绿荷叶的版画风，右侧竖排原文和"周敦颐"落款。

**常见问题**：
- 书法字写错或缺笔：人名、篇名尽量用 2～4 个常用字；出错就让它重画大字部分。
- 竖排诗句有错字：诗句是装饰，正式使用前请逐字核对，必要时在提示词里写出完整诗句。
- 画面太满：强调"中央保留大面积留白"。

**适合**：语文 / 历史课件封面、传统文化讲座、读书会海报、公众号头图。

### 原版提示词

```text
@Create Image
Form a massive visual anchor with a strong brush weight using the core text or symbols of the theme. Let the letterforms act as a vertical architectural skeleton of the frame, colliding in scale, overlapping, and partially crossing boundaries with the main image. Summarize the main subject as an exaggerated, enlarged flat silhouette, organizing the image with sharp white-out lines, limited but layered color blocks, and clear boundaries. Let the environment support the form, creating a foreground-midground-background relationship around the subject while maintaining a central breathing zone. Use an asymmetric composition where the high-density main form creates a strong crop along one edge, while the secondary subject crosses the central axis into the white space. The bottom is stabilized by a wider supporting shape. The reading flow moves naturally from high-contrast anchors through image events down to the lower information zone. Use deep, low-saturation theme colors for structural weight, warm near-whites to open up space, and brighter or warmer focal colors within the same palette to mark theme events. Use near-black text for maximum readability. Let hand-written or seal-like cultural symbols related to the theme become emotional anchors juxtaposed with the subject. Fine titles, descriptions, poems, and signatures serve as low-register editorial annotations, adapted to the text system's structure. Form a multi-part rhythm of main character skeletons and secondary character breathing through scale, density, direction, and weight, allowing text to actively intersperse with color blocks, images, and white space, creating a restrained, vivid, and narratively tense editorial visual.

Subject: {argument name="subject" default="The Life of Su Shi"}
Purpose: {argument name="purpose" default="PPT cover for courseware"}.
Total 10 images.
Note: No serial numbers or coding logic, award-winning courseware level.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2097326027194478693) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
