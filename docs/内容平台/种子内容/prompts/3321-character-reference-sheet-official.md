---
title: 角色设定提示词：上传一张角色图，自动排出官方设定集式三视图 + 表情 + 装备拆解（gpt-image-2）
slug: character-reference-sheet-official
model: gpt-image-2
topics: [character, game-art]
needsRefImage: true
aspectRatio: "3:2"
useCase: 手里已经有一张原创角色图，想整理成游戏 / 动画公司那种"官方设定资料"时用，一次得到三视图、表情差分、服装装备拆解、色板和世界观说明的整版设定表。
prompt: |
  以我上传的这张角色图（含背景）为依据，制作一份类似官方设定资料的[角色设定表]。
  - 三视图：正面、侧面、背面全身立绘，比例和服装细节三面一致；
  - 表情差分：在底部排一行[6]个头像，分别是[平静、专注、开心、生气、惊讶、疲惫]；
  - 服装与装备拆解：把[外套徽章、腰包、眼镜、靴子]等部件单独放大，配简短标注；
  - 色板：列出头发、外套、点缀色、肤色、鞋子等主色块；
  - 世界观说明：在右侧放一小段文字，介绍角色所在的[近未来都市]背景，配一张小场景图；
  - 角色名与基本信息放在左上角：[角色名]、年龄、身高、职业；
  - 整体排版整齐有秩序，白色背景，插画风格，画幅[3:2]横版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-character-design.md
  author: "@MANISH1027512"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文；把表情数量、表情种类、拆解部件、世界观、角色名设为变量；补充三视图一致、信息区位置和横版画幅等约束
images:
  - 3321-character-reference-sheet-official-1.jpg
imageCredit:
  by: "@MANISH1027512"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/character-design/character-sheet.png
  license: MIT
verify:
  - 原始出处：原帖：https://x.com/MANISH1027512，核对原帖仍可访问、作者未另行声明保留权利
  - 用一张原创角色图跑一次，看三视图的服装细节是否三面一致、表情是否真的有差别
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：先上传一张你自己的原创角色图，越清楚越好。[角色设定表] 可以写成"游戏角色设定表""虚拟主播立绘设定"；[近未来都市] 换成角色的世界观，比如"架空古风王朝""海底殖民城市""魔法学院"；拆解部件按角色实际装备改，古风角色可以写"发冠、腰佩、袖箭、长靴"。示例图是一位银发赛博工程师的设定表：左侧正 / 侧 / 背三视图，中间放大了臂章、工具腰带、护目镜和机械靴，底部一排 6 个表情，右侧是带城市插图的世界观说明。示例图文字是英文，用中文提示词时可要求"标注文字用中文"。

**常见问题与调整**：
- 三视图服装对不上：追问"背面图的外套图案、口袋位置必须和正面一致，按正面重画背面"。
- 文字太多太小看不清：减少标注，改成"每个部件只写 2～4 个字的名称"。
- 想加武器或坐骑：在拆解区追加"[武器名]单独一格，标注长度和材质"。
- 风格被改了：强调"人物画风、发色、瞳色严格照上传图，不要重新设计"。

**适合**：原创角色整理设定、同人或独立游戏立项资料、给画师的委托参考；不适合直接上传他人作品或知名 IP 角色来生成。

### 英文原版

```
Based on this character and background, please create a character reference sheet similar to official setting materials.
- Includes three-view drawings: front view, side view, and back view
- Add variations of the character's facial expressions
- Break down and display detailed parts of the clothing and equipment
- Add a color palette
- Include a brief explanation of the worldview setting
- Overall, use an organized layout (white background, illustration style)
```

> 改编自 [@MANISH1027512](https://x.com/MANISH1027512) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。
