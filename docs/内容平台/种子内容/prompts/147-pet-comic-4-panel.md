---
title: 四格漫画提示词：主人出门后宠物的"双面生活"（OpenAI 官方示例改编）
slug: pet-comic-4-panel
model: gpt-image-2
topics: [comic]
aspectRatio: "2:3"
needsRefImage: false
useCase: 用"起承转合"四格讲一个宠物小故事，适合宠物号日更、表情包素材和练习分镜写法。
prompt: |
  创作一个竖版的短篇漫画，4 个大小相同的分格。
  第 1 格：主人从前门出门。[一只橘猫]出现在主人身后的窗户里，在玻璃后显得小小的，眼睛睁得很大，爪子高高地贴在玻璃上，屋里一下子安静下来。
  第 2 格：门"咔哒"一声关上，寂静被打破。[橘猫]慢慢转身看向空荡荡的屋子，姿态变了，眼神里闪着"机会来了"的光。
  第 3 格：屋子变了样。[橘猫]大字摊开躺在沙发上，好像这是它的地盘，旁边散落着[零食碎屑]，阳光像聚光灯一样斜照进房间。
  第 4 格：门开了。[橘猫]端端正正地坐在门口，警觉而镇定，好像什么都没发生过。
  画风：[温暖的日系绘本风]，分格边框清晰，不加对话文字。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb
  author: OpenAI Cookbook
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；宠物、零食与画风改为变量；补充"不加对话文字"和画风说明
imageBrief: 按默认变量生成 1 张竖版四格；再把宠物换成"柯基"、画风换成"黑白日漫网点风"生成 1 张。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 四格中的宠物是否为同一只（花色、体型一致）
  - 分格是否整齐、等大
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[一只橘猫] 写清品种和花色，最好上传一张自家宠物照片并加"宠物以上传照片为准"；四格里的宠物称呼要一致。[温暖的日系绘本风] 可换成"美式卡通""黑白日漫网点风""水彩绘本"。

**写好四格的诀窍**：这条官方示例的结构值得学——第 1 格建立情境，第 2 格转折（门关上），第 3 格放大反差，第 4 格反转收尾。照这个结构可以写出无数个故事，例如"主人在减肥 / 宠物偷吃零食"。

**常见问题**：
- 分格大小不一：保留"4 个大小相同的分格"。
- 想加对话：每格最多一句短台词，并写清"台词放在对话气泡里"；中文台词要逐字核对。

### 英文原版

```text
Create a short vertical comic-style reel with 4 equal-sized panels.
Panel 1: The owner leaves through the front door. The pet is framed in the window behind them, small against the glass, eyes wide, paws pressed high, the house suddenly quiet.
Panel 2: The door clicks shut. Silence breaks. The pet slowly turns toward the empty house, posture shifting, eyes sharp with possibility.
Panel 3: The house transformed. The pet sprawls across the couch like it owns the place, crumbs nearby, sunlight cutting across the room like a spotlight.
Panel 4: The door opens. The pet is seated perfectly by the entrance, alert and composed, as if nothing happened.
```

> 改编自 [OpenAI Cookbook《GPT Image prompting guide》](https://github.com/openai/openai-cookbook/blob/main/examples/multimodal/image-gen-models-prompting-guide.ipynb) 中的官方示例（openai-cookbook 仓库为 MIT License），经 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 原文收录（Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)）。示例图为 PNG 且超过 1.2MB，未收录。
