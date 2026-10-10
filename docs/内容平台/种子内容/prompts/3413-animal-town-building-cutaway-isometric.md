---
title: "ai绘本生成提示词：小动物小镇建筑剖面插画，等轴测切开一栋楼看里面的日常（Nano Banana）"
slug: animal-town-building-cutaway-isometric
model: nano-banana
topics: [illustration, game-art]
modelLabel: Nano Banana Pro
aspectRatio: "3:4"
needsRefImage: false
useCase: "做绘本跨页、找不同 / 场景认知图、游戏场景概念时，生成一张\"切开一栋楼\"的 2.5D 等轴测插画：两三层房间各有用途，拟人小动物在里面干活、吃饭、逛店，周围是街区屋顶。"
prompt: |
  一张细节丰富的等轴测 2.5D 建筑剖面插画，主题是热闹的[巧克力工坊与咖啡馆]，竖版 3:4。
  - 构图：画的是街区里一栋多层小楼的局部，画面铺满到边缘，像是一个更大的世界里的一角；
  - 剖面：用干净的剖切面露出建筑内部，上下叠着两到三层，用楼梯相连；布局简单有序，每个区域里的物件不多，每样东西都看得清；
  - 角色：全部是小巧可爱的拟人小动物（如[狐狸、獾、猫头鹰]），像人一样按场景合理地生活和工作；
  - 房间：每个房间都有与主题相关的明确用途，家具和工具被自然地使用；建筑是干净的墙面、瓷砖、木头和金属结构，管道、通风口和机器整齐地嵌在里面；门口有一块写着店名"[Cocoa & Critters]"的招牌；
  - 环境：剖面墙外能看到周围的房子、屋顶、窗户和街道，交代环境但不拥挤；
  - 画风：构图均衡、间距舒适、层次清楚，线条利落，色彩鲜明但克制；
  - 不要出现人类，不要过度拥挤和杂乱，不要小到看不清的细节，不要孤零零漂浮的建筑和纯色背景。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/0xbisc/status/2030190500721184923
  author: "@0xbisc"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；场景主题设为变量并给出示例值；把原文的负面提示词合并进正文的\"不要\"部分；删去重复的清晰度描述"
images:
  - 3413-animal-town-building-cutaway-isometric-1.jpg
  - 3413-animal-town-building-cutaway-isometric-2.jpg
imageCredit:
  by: "@0xbisc"
  url: https://youmind.com/nano-banana-pro-prompts?id=11700
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[巧克力工坊与咖啡馆] 换成任何场景，如"面包房""邮局""钟表维修铺""小学教室"；动物写 2～3 种即可，模型会自己安排角色；店名招牌可以写中文，4 个字以内更稳。想给孩子做"找一找"游戏，可以加"画面里藏着 5 只小老鼠"。

示例图第一张是暖棕色调的巧克力工坊：一楼是传送带和大锅，狐狸、獾、猫头鹰在生产线上忙活，二楼是有柜台和小圆桌的咖啡馆，招牌写着"Cocoa & Critters"，屋顶烟囱冒着烟；第二张是换了主题的古董店"Treasure Trove"：一楼是玻璃柜台，夹层是工作台，顶层是书架和地图，可以看出同一套提示词换主题的效果。

**常见问题**：
- 房间太多太碎：写明"只有两层、每层两个房间"。
- 出现了人类：把"不要出现人类"提到第一句。
- 招牌文字错误：店名用简短英文或 2～4 个汉字，出图后核对。

**适合**：绘本跨页、儿童认知挂图、游戏场景概念、店铺开业趣味海报。

### 英文原版

```text
Highly detailed isometric 2.5D architectural slice illustration of a lively {argument name="scene name" default="[SCENE NAME]"}, shown as a cropped section of a multi-story building integrated within a surrounding neighborhood. The scene fills the frame edge-to-edge and feels like part of a larger living world. The building interior is revealed through a clean sectional cutaway with two or three stacked levels connected by stairs. The layout is simple, organized and easy to read with limited objects in each area so every element is clearly visible. All characters are small cute anthropomorphic animals behaving like people and living daily life logically according to the scene. Each room has a clear purpose related to the scene theme, with furniture and tools used naturally. Architecture uses clean walls, tiled surfaces, wood and metal structures with pipes, vents and machines integrated neatly. Outside the cutaway walls the surrounding environment is visible with nearby buildings, rooftops, windows and streets, creating context without overcrowding the composition. Balanced composition, comfortable spacing, clear visual hierarchy, crisp line art, sharp details, vibrant but controlled colors, high clarity so every object and character is easy to see.

Negative Prompt: humans, people, overcrowded scene, dense environment, too many objects, messy layout, cluttered composition, tiny unreadable details, blurry, low detail, washed colors, pastel washed colors, isolated floating building, plain background
```

> 改编自 [@0xbisc](https://x.com/0xbisc/status/2030190500721184923) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
