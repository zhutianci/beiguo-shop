---
title: 游戏角色设计提示词（nano banana）：同一角色从新手到精英的四阶段进化图
slug: character-tier-evolution
model: nano-banana
topics: [character, illustration]
needsRefImage: true
useCase: 做游戏角色养成、等级皮肤、IP 吉祥物成长线时，上传一个角色，一次生成"新手 / 进阶 / 高级 / 精英"四个版本并排对比，用来定装备升级路线或做宣传图。
prompt: |
  游戏设定插画。以上传图片中的角色为基础，设计这个角色的四个成长阶段：新手、进阶、高级、精英。
  - 四个版本从左到右按等级排列，每个版本放在一张独立的卡片框里，卡片上方写阶段名，下方写角色名"[角色名]"；
  - 角色的脸型、毛色 / 发色、体型和标志性特征始终一致，一眼能认出是同一个角色；
  - 每升一级，装备明显升级：从[简单的工装和扳手]逐步变成[全身机甲和发光武器]，配件和特效越来越多；
  - 背景统一为[深蓝色科技电路纹理]，卡片配色统一，像游戏里的角色图鉴界面；
  - 画风：[Q版卡通 2D 游戏插画]，线条干净，色彩饱和。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/KanaWorks_AI/status/1993191807157768597
  author: "@KanaWorks_AI"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；把原文一句话的要求扩写为排列方式、角色一致性、装备升级路线、背景和画风 5 条，并新增装备起点 / 终点、背景、画风变量
images:
  - 518-character-tier-evolution-1.jpg
imageCredit:
  by: "@KanaWorks_AI"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case21
  license: Apache-2.0
verify:
  - 示例图第一排小角色衣服上有一行很小的作者名字样（模型生成），确认是否介意展示
  - 实测中文角色名能否正确写在卡片上
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张角色图（自己画的、AI 生成的都行），把 [角色名] 换成角色名字，再按设定改装备路线。示例图是一只柯基机械师"VEX"：从工装背心、扳手，到机械臂、无人机，再到全身机甲和能量护盾，四个阶段一眼就能看出成长感（示例里模型多画了一排三阶段版本，属于正常的随机发挥）。

**变量怎么填**：
- 装备路线按职业写更有画面感，例如法师"粗布长袍和木杖 → 星辰法袍和悬浮法典"，骑士"皮甲和短剑 → 金色全身板甲和光翼"。
- 不想要卡片界面，把第一条改成"四个角色站成一排，地面有等级标尺"。

**常见问题**：
- 后面几个阶段长得不像同一个角色：在开头加"严格保持参考图里的脸和配色"，或者先用 177 号六视图提示词做一张角色设定图，再拿设定图来跑这条。
- 只出了三个：明确写"必须正好四个版本"。

**适合**：游戏策划提案、角色皮肤规划、吉祥物成长故事、小说角色"前期 / 后期"对比图。请勿上传他人受版权保护的知名角色。

### 英文原版

```
Game design illustration. Based on the reference image, create four versions of the character: beginner, intermediate, advanced, and elite. Each version should have a unique appearance and be arranged in order. Character name: [ A ]
```

> 改编自 [@KanaWorks_AI](https://x.com/KanaWorks_AI/status/1993191807157768597) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
