---
title: nano banana 表情包提示词：用自己的形象 + 一张姿势参考图，批量生成整套表情包
slug: pose-emoji-pack
model: nano-banana
topics: [sticker, character]
needsRefImage: true
useCase: 想把自己、宠物或原创角色做成微信表情包，手上有一张"别人的表情包合集"做动作参考时，让 nano banana 按参考里的每个姿势，换成你的形象重画一整套。
prompt: |
  图 1 是表情包的姿势参考（一套多格表情），图 2 是我的形象。
  用图 2 的形象，参照图 1 里每一格的姿势和动作，生成[9]个表情包，排成[3×3]网格：
  - 形象的长相、发型、服装、配色在每一格中保持一致，只改变动作和表情；
  - 每格下方配一句简短的[中文]文字，如[收到、好的、哈哈哈、在忙、晚安]，字体粗、带白色描边；
  - 画风统一为[Q 版卡通]，每个表情有白色描边，背景为纯白，方便裁切成单张表情。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/vista8/status/1966164427243458977
  author: "@vista8"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"用图2形象，参图一的各种姿势生成 x 个表情包"；本站补充网格排版、形象一致性、配字、描边与背景等要求，并把数量、画风、文字设为变量
imageBrief: 用站长自己的原创角色或宠物照片作图 2、用一张自己画的火柴人多格姿势图作图 1，生成 1 张 3×3 表情包；附两张输入图对比。
images:
  - 178-pose-emoji-pack-1.jpg
  - 178-pose-emoji-pack-2.jpg
imageCredit:
  by: "@vista8"
  url: https://x.com/vista8/status/1966164427243458977
  license: Apache-2.0
verify:
  - 实测 9 格里形象是否一致、中文配字是否有错字
  - 仓库示例图中的角色形象与知名 IP 较像，未使用；需站长自己生成示例图
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：图 1 传姿势参考（可以是一套现成表情包，或者自己画的火柴人多格动作），图 2 传你的形象（自拍、宠物、原创角色）。[9]、[3×3] 可改成 [16]、[4×4]；配字按你常用的聊天用语改。

**常见问题**：
- 形象不一致：格数越多越难保持，建议先做 9 格；不一致的格子可以单独追问"重画第 5 格，形象严格参照图 2"。
- 姿势参考的形象"串"进来了：加一句"只参考图 1 的动作，不参考图 1 的角色外貌"。
- 要上传到微信表情开放平台：单张需按平台要求的尺寸和格式重新导出，并且只能用你拥有版权的形象。

**注意**：不要拿别人的表情包形象直接"换皮"商用；参考图只借用动作。另见 18 号"自定义描边贴纸"、190 号"自拍 3D 贴纸"。

### 英文原版

```
Using the character from Image 2, generate [x] emoji stickers based on various poses from Image 1.
```

> 改编自 [@vista8](https://x.com/vista8/status/1966164427243458977) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
