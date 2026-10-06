---
title: 人物关系图生成提示词（nano banana）：小说 / 剧本 / 游戏角色关系图（好感度、冲突、信任）
slug: character-relationship-chart
model: nano-banana
topics: [character, comic, infographic]
needsRefImage: false
aspectRatio: "5:4"
useCase: 写小说、做剧本杀、策划恋爱 / 校园题材游戏时，一句话生成带头像、关系箭头、好感度等级和冲突标记的人物关系图，用于设定集、宣传图或给团队讲清人物线。
prompt: |
  为一款[校园恋爱喜剧游戏]制作一张人物关系图，共[7]个角色。
  - 主角放在正中央，其他角色围绕排布，每人一个圆形头像框，下方是名字标签和一句身份说明（如"青梅竹马""神秘学姐"）；
  - 用不同颜色的双向箭头表示关系：粉色=好感、绿色=信任、蓝色=观察 / 怀疑，箭头旁标注好感度等级（Lv.1–Lv.5）和一个关键词；
  - 角色之间的矛盾用闪电爆炸图标标出，写上冲突点（如"误会""吵架"）；
  - 可以加一只宠物或吉祥物，用虚线和小脚印表示它和别人的关系；
  - 右下角放图例（好感度 / 对立 / 信任），整张图像游戏里的"关系手帐"界面，画风为[日系动漫]，配色柔和，所有文字使用[简体中文]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/KanaWorks_AI/status/1993223720954155229
  author: "@KanaWorks_AI"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；把原文的"角色名、关系箭头、好感度、冲突点"展开为布局、箭头配色、冲突标记、图例等具体要求，新增题材、人数、画风、文字语言变量
images:
  - 519-character-relationship-chart-1.jpg
imageCredit:
  by: "@KanaWorks_AI"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case19
  license: Apache-2.0
verify:
  - 实测"简体中文"时角色名和关系词的错字率；错字多的话建议角色名用 2 个字
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把 [校园恋爱喜剧游戏] 换成你的题材，例如"民国悬疑剧本杀""仙侠小说""职场群像剧"，人数建议 5–8 个，太多会挤。示例图是原作者生成的日文版恋爱游戏关系图：中间是男主，四位女主、好友和一只猫围成一圈，好感度、误会、吵架都标得清清楚楚。

**让关系更准确**：模型会自己编关系。如果你已经有设定，在提示词后面逐条写出来效果最好，例如：
"林夏（青梅竹马）→ 主角：好感 Lv.5；林夏 ↔ 苏晚：误会；周野（好友）→ 主角：信任"。

**常见问题**：
- 中文字写错：把每个角色名和关系词写在提示词里，越具体越不容易错；实在不行先出无字版，再自己排字。
- 箭头乱成一团：减少人数，或改成"主角在中心，只画主角与其他人的关系"。
- 想要写实风：把画风改成"电影海报风写实头像"，但不要使用真实明星的脸。

**适合**：小说设定集、剧本杀角色卡、游戏策划案、追剧笔记。

### 英文原版

```
[Japanese Dating Sim Game] Character Relationship Chart. Includes character names, relationship arrows, affection levels, conflict points. [Romantic Comedy Style]. Total 7 characters.
```

> 改编自 [@KanaWorks_AI](https://x.com/KanaWorks_AI/status/1993223720954155229) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
