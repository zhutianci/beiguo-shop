---
title: 信息图提示词：时代立方体 2x2 对比图（把一个时代压缩进剖面微缩方块 + 年代标题与要点）
slug: era-cube-history-grid
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做历史课件、科普账号"一图看懂某某演变"、企业发展史或技术变迁对比时用，四个年代各压进一个剖面立方体，旁边配大号年代标题和要点列表，视觉统一、复杂度逐级递增。
prompt: |
  2x2 网格，主题是[人类文明]，选四个差异巨大的年代分别做一个"时代立方体"：[公元前8000年]、[公元476年]、[1492年]、[2024年]。
  每个立方体按下面的规则生成：
  1. 推断时代特征：所处时期或阶段、主要材料、关键工具或器物、社会 / 技术 / 文化背景、建成环境或自然环境、必要时加入代表性人物；
  2. 压缩进立方体：大件物体构成立方体的边框，中等物体搭建内部的剖面场景，小物件填满空隙；顶面、侧面和正面都要可见；所有内容严格限定在一个长方体体积内；
  3. 配文字模块：大号年代标签、一行简短副标题、一组紧凑的要点列表；除非我提供，否则不要编造具体数据；
  4. 四个年代重复同样的视觉语法，按时间顺序让复杂度递增或转变。
  白色背景，立方体放在每格右侧，文字放在左侧；画幅[4:3]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2062903770087084107
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文是伪代码式的步骤结构，改写成自然中文分步说明；主题和四个年代设为变量；按示例图补充了白底和图文左右布局；删去作者的开场感想
images:
  - 3346-era-cube-history-grid-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/comparison_case91/output.jpg
  license: CC0 1.0
verify:
  - 要点列表由模型生成，用于课件前需人工核对史实
  - 换成"交通工具演变""通信方式演变"出一次，看立方体语法是否保持
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[人类文明] 换成你要讲的主题，比如"中国城市生活""交通工具""通信方式""我们公司的十年"；四个年代按主题挑差异最大的节点，例如通信可以写"烽火时代、1840年、1990年、2025年"。示例图是一张白底 2x2 英文图：左上 8000 BCE 是带茅屋和动物的土石立方体，右上 476 CE 是城堡式石砌立方体，左下 1492 CE 是顶上停着帆船、里面摆满地球仪和航海图的木质立方体，右下 2024 CE 是顶部有高楼、风车和无人机，内部是服务器和屏幕的黑色立方体；每格左侧有大号年份、副标题和六条带图标的要点。

**常见问题与调整**：
- 要点内容不准确：自己写好每个年代的 4～6 条要点，在提示词里直接给出，模型就不会乱编。
- 立方体塞得太满看不清：加"每个立方体内部只分三层，每层一个主要场景"。
- 中文要点错字：要点控制在每条 4～6 个字，或先出英文版再替换文字。
- 想要竖版长图：改成"1x4 纵向排列"，画幅 9:16。

**适合**：历史 / 科普课件、"一图看懂"类社媒内容、企业发展史展板；文字要点需人工核对后再用于教学或正式出版。

### 英文原版

```
I love these cube prompts for visualizing different eras. Pretty short but GPT Image 2 figures it out

2x2 grid, do this for different years of vastly different eras:  ERA_TO_CUBE_SOLVER  INPUT ::= [TOPIC], [ERA]  STEP_1 :: infer era identity - time period or stage - dominant materials - key tools or artifacts - social/technical/cultural context - built environment or natural environment - representative agents or figures if relevant  STEP_2 :: compress into cube - large objects define cuboid edges - medium objects build internal scenes - small objects fill gaps - top, side, and front faces remain visible - everything stays inside a strict rectangular volume  STEP_3 :: create module text - large era label - short subtitle - compact bullet list - no fixed facts unless supplied  STEP_4 :: repeat across eras - preserve identical visual grammar - increase or transform complexity chronologically
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2062903770087084107) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
