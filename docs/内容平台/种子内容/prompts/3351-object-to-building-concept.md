---
title: 建筑效果图提示词：把日常物件变成地标建筑的 2x2 概念图（怀表车站、书本图书馆、方块公寓）
slug: object-to-building-concept
model: nano-banana
topics: [illustration, interior]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做建筑 / 设计课的创意发散练习、科普账号的脑洞内容、或给空间提案找"仿生 / 仿物"灵感时用，模型会先分析物件的体量和表面，再自动匹配一种建筑类型，出四张黄金时刻外观渲染。
prompt: |
  把随机物件变成建筑。
  2x2 网格，对[4]个不同的[随机日常物件]各做一次。核心概念：把物件变成一座真实可能存在的地标建筑。
  第一步，分析物件（体量与结构）：
  - 体量：整块 / 碎片化 / 堆叠 / 纤细；
  - 表面：反光 / 多孔 / 层叠 / 有图案；
  - 机制：静态 / 可动 / 模块化。
  第二步，自动选择建筑类型：
  - 整块 + 石质感 → 博物馆；
  - 反光 + 流线型 → 摩天楼；
  - 模块化 + 堆叠 → 住宅综合体；
  - 多孔 + 有机形态 → 植物温室；
  - 可动 + 机械感 → 交通枢纽。
  第三步，执行：黄金时刻的建筑外观渲染，加入人物作为尺度参照，材质真实可信，电影感广角镜头；画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Gdgtify/status/2105051745303114040
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文，把"如果……则……"的规则写法改成分步说明；物件数量和物件类型设为变量，补充画幅
images:
  - 3351-object-to-building-concept-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://cms-assets.youmind.com/media/1790836512083_wy8lhe_HTRW_GWWEAAnc7S.jpg
  license: CC BY 4.0
verify:
  - 指定具体物件（如"茶壶、算盘、灯笼、饺子"）出一次，看建筑类型匹配是否合理
  - 示例图中有一栋楼外观类似知名益智玩具，商用前确认是否需要替换
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
**怎么填变量**：[随机日常物件] 可以留着让模型自己挑，也可以直接指定，比如"茶壶、算盘、灯笼、饺子"或"耳机、订书机、雨伞、松果"；[4] 改成 1 就是单张大图，改成 9 并把网格改成 3x3 就是九宫格。示例图是 2x2 四联：左上是一座以金色怀表为正立面的火车站，前面有站台和人群；右上是白色镂空网格状的有机穹顶温室；左下是彩色方块堆叠成的住宅楼；右下是几本巨大的旧书叠成的建筑，前面广场上有小小的行人。

**常见问题与调整**：
- 看起来只是"放大的物件"不像建筑：加"必须有门窗、楼层、入口和结构细节，能看出人可以进去使用"。
- 建筑类型匹配不合理：直接指定"把茶壶做成茶文化博物馆"。
- 想做夜景版：把"黄金时刻"改成"蓝调时刻，室内灯光亮起"。
- 想要设计说明：追问"为每座建筑配一行中文名称和一句设计理念"。

**适合**：建筑 / 设计课创意练习、脑洞科普内容、空间提案灵感板；生成的是概念图，不代表结构上可以直接建造。

### 英文原版

```
Turning random objects into buildings.

2x2 grid, do this for 4 different random objects. Concept: Turn objects into a landmark building that could exist.

1. ANALYZE INPUT (Massing & Structure):

Mass: (Monolithic/Fragmented/Stacked/Spindly)

Surface: (Reflective/Porous/Layered/Patterned)

Mechanism: (Static/Kinetic/Modular)

2. AUTO-SELECT BUILDING TYPE:

IF Monolithic + Stone-like → Museum

IF Reflective + Aerodynamic → Skyscraper

IF Modular + Stacked → Housing complex

IF Porous + Organic → Botanical conservatory

IF Kinetic + Mechanical → Transit hub

3. EXECUTE:
Golden-hour exterior render, people for scale, plausible materials, cinematic wide lens.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2105051745303114040) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。
