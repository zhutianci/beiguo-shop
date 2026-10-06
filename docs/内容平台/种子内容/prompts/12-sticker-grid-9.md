---
title: AI表情包提示词：同一角色 9 宫格表情包 / 贴纸（gpt-image-2）
slug: sticker-grid-9
model: gpt-image-2
topics: [sticker, comic]
aspectRatio: "1:1"
needsRefImage: false
useCase: 一次生成同一个角色的 9 个不同动作或表情，切开后可做表情包、手账贴纸、条漫素材。
prompt: |
  一张 3×3 九宫格拼图，共 9 个贴纸风格的插画小格，每格都是同一个角色：[卷发扎丸子头的女生]。柔和的日系动漫插画风，暖色粉彩配色（[腮红粉、奶油白、暖棕和浅青]）。每格白色背景，点缀小闪光和爱心。
  9 格分别是她在做不同的事：
  1 左上：[在厨房做饭]
  2 中上：[窝在椅子里看书]
  3 右上：[画画]
  4 左中：[种花]
  5 正中：[做瑜伽拉伸]
  6 右中：[抱着小狗]
  7 左下：[写手账]
  8 中下：[弹吉他]
  9 右下：[背包旅行]
  所有格子里角色的发型、五官和配色保持一致。线条柔和，肤色温暖，大眼睛，表情丰富，类似韩式条漫贴纸风格。每格干净白底，整齐排成 3×3，格与格之间留出均匀的白色间隔。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/RuzainaMeer/status/2071097968846057649
  author: "@RuzainaMeer"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；角色外貌、配色和 9 格动作改为变量；删去原文每格里的服装细节描述；新增"格间留白"便于切图
imageBrief: 生成 2 张：默认 9 个日常动作一版；9 格改成表情（开心、生气、委屈、比心、晚安、收到、加油、无语、哭哭）一版。角色为原创形象，不得模仿已有动漫角色。
images:
  - 12-sticker-grid-9-1.jpg
imageCredit:
  by: "@RuzainaMeer"
  url: https://x.com/RuzainaMeer/status/2071097968846057649
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录 9 格角色一致性和格子是否整齐
  - 改成表情版后，若在格子里加中文短字，错字率如何
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：角色外貌写 2–3 个最显眼的特征（发型、发色、配饰）就够了；9 个动作可以全部换成表情，例如"开心""委屈""比心"，就是一套表情包。

**常见失败与调整**：
- 9 个格子里不像同一个人：先单独生成一张满意的角色立绘，再上传它，并写"角色以上传图为准"。
- 格子数量不对：开头再强调"恰好 9 格，3 行 3 列"。
- 想加文字：每格最多 4 个字，生成后逐格核对。

**适合 / 不适合**：适合原创角色、自家宠物拟人；用知名动漫角色只能仅供学习交流，商用请注意版权。上架表情平台有尺寸与审核要求，以平台规则为准。

> 改编自 [@RuzainaMeer](https://x.com/RuzainaMeer/status/2071097968846057649) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
