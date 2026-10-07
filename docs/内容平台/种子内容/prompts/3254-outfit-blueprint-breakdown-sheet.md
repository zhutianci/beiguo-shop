---
title: AI穿搭提示词：时尚穿搭拆解图，模特主图+单品标注+色板面料+风格建议（gpt-image-2）
slug: outfit-blueprint-breakdown-sheet
model: gpt-image-2
topics: [fashion, infographic]
needsRefImage: false
aspectRatio: "3:4"
useCase: 做穿搭博主图文、服装店铺搭配推荐、造型课件时，生成一张杂志式"穿搭蓝图"：中间是模特半身照，四周是单品编号拆解、色板、面料、配饰特写和搭配建议。
prompt: |
  一张"时尚穿搭蓝图"拆解海报：一位时髦的年轻女性站在[明亮的橙色墙面]旁，半身时装大片视角，周围布满穿搭标注和造型说明。
  - 模特造型：[黑色长直发]，柔和的精致妆容，银色垂坠耳环，叠戴的银项链；[深棕色短款抹胸]，外搭[宽松的薄荷绿西装外套]，肩线挺括，同色系高腰阔腿裤，外套上挂一条精致银链；姿态放松自信，一只手插兜；
  - 四周的信息模块：单品编号拆解（耳环、项链、外套、上衣、裤子、配饰）、色板（每个颜色标名称）、面料与质感说明、剪裁版型笔记、珠宝细节拆解、配饰特写、姿势分析、光线说明；
  - 底部：搭配建议（鞋、包、彩妆）、适合场合、要点总结；
  - 风格：[韩系街头时尚]，杂志编辑摄影，阳光反光有电影感，排版像专业的服装概念板，细节丰富。
  画幅[3:4]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://twitter.com/ZephyraLeigh/status/2056770705677775247
  author: "@ZephyraLeigh"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；背景墙、发型、上衣、外套、风格设为变量；把原文笼统的"信息图元素"细化成可见的模块清单（参照示例图）；删掉像素尺寸和 8k 参数
images:
  - 3254-outfit-blueprint-breakdown-sheet-1.jpg
imageCredit:
  by: "@ZephyraLeigh"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/portrait_case198/output.jpg
  license: CC0 1.0
verify:
  - 示例图标注全是英文小字，中文版出一次看模块文字是否可读
  - 人物为 AI 生成，展示时注意不要与真实人物关联
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：模特造型几项可以整套换，比如"[宽松的薄荷绿西装外套]"换成"燕麦色针织开衫"、"[深棕色短款抹胸]"换成"白色圆领 T 恤"；[韩系街头时尚] 可换"法式慵懒""日系通勤""新中式"；背景墙换成"[灰色水泥墙]"会更冷静。示例图左上角是英文大标题"FASHION BLUEPRINT SHEET"，中间模特穿薄荷绿西装套装和棕色抹胸、手插兜靠着橙墙，左侧是色板、面料、剪裁小图，右侧是珠宝拆解、配饰特写、光线和姿势分析，底部一排鞋包彩妆搭配建议。

**常见问题与调整**：
- 模块太多字太小：减到 5～6 个模块，并写"每个模块不超过 3 行字"。
- 色板和衣服颜色对不上：在提示词里写明色值或颜色名，如"薄荷绿 #A8D5BA"。
- 想用自己的照片：上传全身照，开头写"以上传照片中的人物和衣服为主图，保持不变"。
- 男装版：把模特和单品换成男装，模块保留不变。

**适合**：穿搭博主图文、服装店搭配推荐、造型课件；用于售卖时，衣服颜色和版型要与实物一致。

### 英文原版

```
Fashion blueprint sheet of a stylish young woman posing beside a bright orange wall, half-body fashion editorial view with detailed outfit annotations and luxury styling callouts. Long sleek dark hair, soft glam makeup, silver drop earrings, layered silver necklaces, fitted dark brown cropped tube top, oversized pastel mint-green blazer with structured shoulders, matching high-waisted wide-leg trousers, elegant silver chain detail attached to blazer, relaxed confident pose with one hand in pocket.

Surrounding the model are fashion infographic elements, jewelry breakdowns, fabric texture descriptions, tailoring notes, pose analysis, accessory close-ups, cinematic sunlight reflections, modern Korean street-fashion aesthetic, editorial photography style, ultra detailed, professional fashion concept sheet, 8k, 1744x2336
```

> 改编自 [@ZephyraLeigh](https://twitter.com/ZephyraLeigh/status/2056770705677775247) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
