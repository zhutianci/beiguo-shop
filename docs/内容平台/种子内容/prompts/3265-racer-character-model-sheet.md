---
title: 游戏UI提示词：赛车手角色模型表，身份栏+三视图+五种表情+夹克材质与座驾参数（gpt-image-2）
slug: racer-character-model-sheet
model: gpt-image-2
topics: [game-art, character]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做游戏 / 动画角色的完整模型表时使用：左边身份信息，中间正侧背三视图，右边材质特写和装备 / 座驾图纸，底部一排表情，画风是 2.5D 手绘厚涂，适合角色提案和美术设定集。
prompt: |
  一张完整的角色模型设计表，整页放在纯白背景上，没有渐变、没有环境、没有写实照片元素。
  - 身份模块（左侧）：超粗的极简大字写角色名"[角色名]"，旁边是干净的等宽字体信息栏：年龄 [年龄]，定位 [地下赛道传奇、漂移专家]，背景描述 [一两句人物故事]（例如：前逃亡车手，对赛道几何过目不忘，每场比赛前都要缠手带）；
  - 三视图模块（居中）：同一角色的正面、侧面、背面全身正交视图。角色是[一位高挑、下颌线锋利的年轻女性]，[及肩的浓密脏辫]，用旧皮绳松松扎在颈后，点缀金色发珠；穿[牛血红复古赛车皮夹克]（褪色皮革、短款飞行夹克版型、羊毛翻领、手缝虚构赞助商布贴），内搭炭灰色罗纹紧身上衣，[深靛蓝帆布高腰阔腿工装裤]（膝部加固、腰间挂登山扣和钥匙），双手缠着磨毛的象牙白手带，脚穿磨旧的哑光黑厚底钢头靴；站姿平静，重心落在一条腿上，双臂自然下垂。比例风格化：修长、骨骼感强、手指偏长；
  - 装备模块（右侧）：几个方形特写面板——夹克龟裂皮纹和羊毛领纤维的手绘材质特写；[定制方向盘]的蓝图式线稿；以及[她的改装座驾]的参数清单和侧面图；
  - 表情模块（底部）：一排 5 个对齐的头像——平静、坏笑、专注、震惊、愤怒；
  - 画风：2.5D 手绘厚涂，3D 只作为底层结构，抖动的油性铅笔描边、线宽变化明显，厚重油画笔触与画布颗粒，阶梯式赛璐璐阴影，过渡阴影里有印刷网点，衣褶上有墨线笔触，哑光高级的色块。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/itsPixieVerse/status/2063062387394216112
  author: "@itsPixieVerse"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并按原文的五个模块整理；删掉原文中的动画作品名改为画风描述；角色名、年龄、定位、外貌、服装、装备、座驾设为变量；精简了表情描述和车辆参数细节
images:
  - 3265-racer-character-model-sheet-1.jpg
imageCredit:
  by: "@itsPixieVerse"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/comparison_case90/output.jpg
  license: CC0 1.0
verify:
  - 示例图中的车外形接近某款真实量产车，页面不要标注具体车型名
  - 示例图标注全是英文小字（角色名"REINA VOSS"），中文版出一次看信息栏是否可读
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：整张表的骨架不变，只换角色：[角色名] 写一个原创名字；外貌和服装几项一起改，比如"[一位清瘦的少年]""[银白短发]""[黑色机车皮衣]"；[定制方向盘] 和 [她的改装座驾] 换成角色的标志装备，如"改装弓弩""蒸汽摩托"。示例图是英文版：左边大字"REINA VOSS"和一列信息，中间三视图里的女车手穿深红皮夹克、宽腿工装裤、厚底靴，背面印着赛车队字样；右边是皮革和羊毛领特写、一个方向盘线稿和一辆黑色改装跑车的侧面与参数；底部五个表情头像。

**常见问题与调整**：
- 三视图不一致：加"三个视图的服装细节、发型、配饰位置完全一致"。
- 画风太写实或太像 3D：强调"手绘厚涂，明显的笔触和描边，不要光滑的 3D 渲染"。
- 信息太多糊成一片：去掉座驾模块，只保留身份、三视图、表情。
- 换成其他职业：把"赛车手"换成"雇佣兵""机械师"，装备模块跟着换。

**适合**：游戏 / 动画角色提案、美术设定集、原创角色展示；不适合直接用作 3D 建模的精确正交参考。

### 英文原版

（原文较长，此处节选）

```
[layout_setup]: A comprehensive, full-page character model design sheet layout strictly on a pristine solid white background with no gradients, no environmental art, and no photorealistic elements whatsoever. [identity_module]: On the left side, large ultra-bold minimalist design typography spelling 'REINA VOSS' next to clean monospace text columns detailing character age 24, classification traits as underground circuit legend and drift specialist, tactical description blocks reading former getaway wheelman turned undefeated canyon queen with a photographic memory for road geometry and an obsessive ritual of wrapping her knuckles before every race. [turnaround_module]: Centered prominently on the sheet is a full-body orthographic turnaround lineup showing identical front view, side profile view, and back view of a tall, sharp-jawed young woman with deep terracotta skin and dense voluminous shoulder-length locs gathered loosely at the nape with a worn leather cord, a few golden cuff beads threaded throughout, wearing a cropped vintage racing-inspired bomber jacket in faded oxblood leather with oversized wool-lined collar and hand-stitched sponsor patches from defunct fictional brands, layered over a ribbed charcoal compression top, high-waisted wide-leg mechanic trousers in dark indigo canvas with reinforced knee panels and dangling carabiner key rings clipped to a canvas utility belt slung low on one hip, hands wrapped in fraying ivory hand-wrap tape extending past the wrists, and chunky platform steel-toe boots in scuffed matte black with thick ridged rubber soles and asymmetric buckle straps, showing a poised calm stance with weight shifted to one leg and arms relaxed at her sides, designed where 3D is only the base structure, maintaining highly stylized elongated lanky proportions with sharp chiseled skeletal structures and exaggerated long fingers. [gear_module]: On the right side, an array of close-up callout square panels highlighting macro texture painting details of the cracked aged oxblood leather grain and frayed wool collar fibers of her bomber jacket, blueprint-style vector schematic line drawings of her custom titanium steering wheel with thumb-trigger nitrous activation and ergonomic suede grip wrapping, and technical lists detailing her modified 1997 coupe specifications including sequential twin-turbo inline six, hydraulic handbrake integration, roll cage geometry, and a cracked rearview mirror she refuses to replace for superstitious reasons. [expression_module]: Running along the bottom quadrant, a perfectly aligned horizontal row of 5 isolated headshot expressions ...
```

> 改编自 [@itsPixieVerse](https://x.com/itsPixieVerse/status/2063062387394216112) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
