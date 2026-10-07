---
title: "鸡尾酒教程图提示词：一杯特调的调制步骤图 + 概念海报（蓝色眼泪示例）（gpt-image-2）"
slug: cocktail-recipe-diagram-and-poster
model: gpt-image-2
topics: [food, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "输入一款鸡尾酒或饮品名称，让模型同时设计配方、步骤图和一张概念宣传海报（横版），适合酒吧 / 咖啡店新品、饮品课程讲义和社媒内容。"
prompt: |
  帮我为一款[蓝色眼泪]鸡尾酒生成一张调制教学图和一张概念宣传海报（配料和流程可以自由发挥，但要清楚、可复现），风格是[奢华酒廊海报风]，横版。
  教学图包含：标题和一句风味描述、配方（每种材料和用量）、所需器具、6 个左右带编号小图的制作步骤，以及一条出品提示。
  概念海报包含：大号中文酒名、英文名、一句文案、成品酒的大幅特写和几项关键配料的小图标。
  两张图保持同一套配色和字体。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/cellinlab/status/2049460927121244510
  author: "Cell 细胞"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文短句的英文写法，本站改写为中文并补充了步骤图应包含的模块；饮品名、风格改为变量"
images:
  - 3090-cocktail-recipe-diagram-and-poster-1.jpg
  - 3090-cocktail-recipe-diagram-and-poster-2.jpg
imageCredit:
  by: "Cell 细胞"
  url: https://youmind.com/gpt-image-2-prompts?id=17077
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[蓝色眼泪] 换成任何饮品，可以是经典款（"莫吉托""长岛冰茶"）、无酒精特调（"桂花乌龙气泡饮"），也可以是你自创的名字；[奢华酒廊海报风] 可以换成"夏日海岛风""日式居酒屋风"。经典款建议把标准配方写进提示词，避免模型自由发挥出不靠谱的比例。

示例图两张：一张"蓝色眼泪鸡尾酒·流程教学图"——深蓝底，左上配方表（金酒、荔枝糖浆、柠檬汁、苏打水、冰球等）、右上器具，中间 6 个编号步骤小图，右侧一大杯冒着蓝色冰球的成品；另一张是概念海报，大字"蓝色眼泪"和英文"Blue Tears Signature Cocktail"，配一句"清澈入喉，蓝意缓慢坠落"和配料图标。

**常见问题**：
- 配方比例离谱：模型编的配方不一定好喝，正式出品请调酒师确认。
- 两张风格不一致：分两次生成时，第二次写"沿用上一张的配色和字体"。
- 饮酒提示：面向公众发布含酒精饮品内容时，建议加"理性饮酒、未成年人禁止饮酒"之类的提示。

**适合**：酒吧 / 咖啡店新品物料、饮品课程讲义、社媒饮品教程、菜单配图。

### 原版提示词

```text
Try to help me generate an instructional diagram and a conceptual promotional poster for mixing a {argument name="drink" default="Blue Tears"} cocktail (use your imagination for ingredients and process, but make it clear and reproducible), in a {argument name="style" default="luxury lounge poster style"}, horizontal orientation.
```

> 改编自 [Cell 细胞](https://x.com/cellinlab/status/2049460927121244510) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
