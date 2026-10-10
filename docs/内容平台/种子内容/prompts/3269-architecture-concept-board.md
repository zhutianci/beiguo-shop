---
title: 建筑效果图提示词：追光可动廊架概念展板，太阳轨迹图→机械关节→实景渲染（gpt-image-2）
slug: architecture-concept-board
model: gpt-image-2
topics: [infographic, interior]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做建筑 / 产品设计的概念推演展板时，用"灵感来源→机构原理→形体抽象→最终装置"的四步叙事，生成一张上有太阳轨迹图、边上有关节细节、下方是写实渲染的横版展板。
prompt: |
  16:9 横版"自主动态建筑"概念展板：借用[卫星天线阵列]的追光机械原理，塑造一座可自适应、高端的[智能可动庭院廊架]。
  - 推演顺序：从[赤道太阳轨迹图]到[多轴转动关节线框图]，再到可编程百叶的形体抽象，最后是建成的建筑装置；
  - 由模型推断智能电机的集成方式和随天气响应的材料，材料使用[光伏镀膜茶色玻璃]和[哑光青铜色铝型材]；
  - 加入延时阴影投影图（同一天不同时刻的阴影变化）；
  - 美学风格：[当代豪宅庭院]；
  - 版式：顶部是太阳轨迹图表，两侧边栏是机械铰链 / 关节细节和环境传感器说明，中间一排四步推演小图，下方是惊艳的写实建筑渲染；
  - 光线：[黄金时刻的阳光投下精致的几何阴影]。
  左上角写项目标题"[项目名称]"和一行副标题。画幅[16:9]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2055773537257034007
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；把原文模板中的方括号占位和末尾的"input"示例合并成带默认值的中文变量；去掉原文中的机构项目名和"科技富豪庄园"等表述；补充项目标题变量
images:
  - 3269-architecture-concept-board-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/ui_case148/output.jpg
  license: CC0 1.0
verify:
  - 示例图标注是英文（"HELIO-TRACK PAVILION"），并出现了一个真实地名，展示说明不要把它当作真实项目
  - 换成"仿生荷叶雨棚"等其他灵感来源出一次，看四步推演是否仍成立
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：这条是"灵感来源 → 建筑"的模板，最关键的是前两个变量：[卫星天线阵列] 换成任何有运动原理的东西，例如"向日葵追光""含羞草叶片开合""鸟类翅膀折叠"；[智能可动庭院廊架] 换成你要设计的对象，如"可开合屋顶""会呼吸的立面遮阳"。两个材料、光线、美学风格按方案改。示例图是英文版：左上标题"HELIO-TRACK PAVILION"，顶部一张太阳轨迹弧线图和一张天球图，左栏是四个机械关节小图，中间一排四步推演（天线阵列→百叶抽象→装置），下半部是黄昏时分泳池边的玻璃百叶廊架实景渲染，右栏是传感器、天气响应和材料色板。

**常见问题与调整**：
- 推演步骤之间没关系：把四步写成编号，并加"每一步都由上一步演化而来，形体逐渐接近最终装置"。
- 渲染图太小：写"下方渲染图占展板一半高度"。
- 标注太多看不清：删掉传感器边栏，只保留关节细节。
- 想做竖版作品集页：画幅改 3:4，推演改成从上到下排列。

**适合**：建筑 / 产品设计课程作业、概念方案汇报、作品集排版参考；不适合当作结构可行性依据。

### 英文原版

```
16:9 autonomous kinetic architecture, the heliotropic tracking mechanics of [aerospace/solar tracking array] shaping an adaptive, luxury [outdoor architectural structure], sequence from [astronomical/solar path diagrams] to [robotic kinematic wireframes] to a programmable louvre abstraction to the final architectural installation, ai to infer smart-motor integration and weather-responsive materials utilizing [material 1] and [material 2], featuring time-lapse shadow projection diagrams, [aesthetic style] aesthetic, presentation layout: solar path charts at the top, robotic hinge details in the margins, stunning photorealistic architectural render below, [lighting style].  input: [deep space network satellite dish array], [smart kinetic patio pergola], [equatorial solar trajectory mapping], [multi-axis pivoting joint schematics], [photovoltaic-coated tinted glass], [extruded matte bronze aluminum], [contemporary silicon valley billionaire estate], [golden hour sunlight casting intricate geometric shadows]
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2055773537257034007) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
