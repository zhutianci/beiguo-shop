---
title: Midjourney 角色一致性怎么做：Edit 模型参考图、--oref 与 --cref 的区别
slug: midjourney-character-consistency
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: Midjourney 怎么让同一个角色出现在多张图里？V8 起官方用 Edit 模型取代了 Omni Reference（--oref）和 Character Reference（--cref）。本文讲清三者关系、Edit 模型的具体用法和提高一致性的技巧。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
  - https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://updates.midjourney.com/edit-model-for-v8/
  - https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds
  - https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo
---

## 适用于谁

- 搜「Midjourney 角色一致性」「midjourney oref vs cref」「cref 怎么用」，想让同一个角色在不同场景、不同动作里保持长相的人；
- 做绘本、漫画分镜、IP 形象、品牌吉祥物的创作者；
- 跟着旧教程写 `--cref`，发现在新版本里不好使的人。

本文根据 Midjourney 官方文档与官方更新公告整理，资料核对于 2026-10-07；网页版为英文界面，按钮名以实际为准。

## 结论先说

1. **三代方案**：V6 时代用 `--cref`（Character Reference）→ V7 用 `--oref`（Omni Reference，一张参考图）→ **V8.1 / V8.2 用 Edit 模型（最多 4 张参考图）**。官方说明 Edit 模型取代了 Omni Reference、Character Reference 和 Retexture。
2. **现在怎么做**：把角色图拖进 Imagine 栏的 **Attach to prompt** 格子，再写场景描述或直接写指令（如「let's see this character from behind」）。
3. **一致性靠组合**：参考图 + 固定的角色文字描述 + 风格参考 / 个性化，比单靠一张图稳得多；`--seed` 不能用来锁角色。

![Edit 模型示例：左边一张参考图，生成了两张保持同一角色特征的新图（官方示例）](seed:g317-edit-model-header.jpg)
*图片来源：[Midjourney 官方文档 · Edit Model](https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model)*

## 三种方式的区别

| | Character Reference | Omni Reference | Edit 模型 |
| --- | --- | --- | --- |
| 写法 | `--cref` | `--oref`，权重 `--ow` | 网页版拖进 Attach to prompt；Discord 用 `--edit` 加图片地址 |
| 适用版本 | 旧版本（V6 时代） | 仅 V7 | V8.1、V8.2 |
| 参考图数量 | — | 1 张 | 最多 4 张 |
| 能否用文字指令改图 | 否 | 否 | 能（如「把这辆车改成红色」） |
| 现状 | 已被取代 | V8 中由 Edit 模型取代 | 官方推荐 |

如果你确实要用旧方式，需要把版本切回对应的旧版本；新项目建议直接用 Edit 模型。

## 步骤：用 Edit 模型保持角色一致

### 1. 准备一张清楚的角色图

最好是正面或 3/4 侧面、光线均匀、背景简单、全身或半身清楚的图。可以是你在 Midjourney 里生成的「定妆图」，也可以是自己有权使用的图片。官方要求：上传外部图片时你必须拥有相应权利，不得把真实人物的照片用于侮辱、色情化等用途。

### 2. 把图放进 Attach to prompt

点 Imagine 栏左侧的图片图标，打开图片面板，把角色图拖到 **Attach to prompt** 格子里。最多可以放 4 张，悬停点 X 可移除；点锁形图标可以把图固定住，连续出多组图时不用重复拖。

![Imagine 栏的 Attach to prompt 格子：提示可以「编辑或组合图片」，下方是上传与图库区（英文界面）](seed:g317-imagine-bar-attach.jpg)
*图片来源：[Midjourney 官方文档 · Edit Model](https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model)*

也可以从已有作品进入：点开一张你生成的图，在 Creation Actions 里点 **Quick Edit**（把图加到 Imagine 栏）或 **Open Editor**（进编辑器做局部修改）。

### 3. 写提示词：描述式或指令式都行

官方说明 Edit 模型支持两种写法，可以按需要混用：

- **描述式**（传统写法）：描述你想要的完整画面
  `the same girl reading in a sunlit library, watercolor illustration --ar 3:2`
- **指令式**（类似对话）：直接告诉它怎么改
  `let's see this character from behind`、`make this character wear a red winter coat`

几个官方给出的用法：

- **换视角**：「let's see this image from the front / from behind」；
- **多角色同框**：放入多张角色图，写「a boy meeting a monster in the wilderness」；
- **组合元素**：角色图 + 坐骑图 + 道具图一起放，写出它们的关系；
- **换画风**：「hand drawn pencil sketch of this image」，可配合 `--sref`、情绪板或个性化。

### 4. 画幅与 Raw

- Edit 模型会**自动匹配第一张参考图的宽高比**，你在设置里的默认画幅不会自动生效；要换比例就在提示词里写 `--ar`。
- 想让文字描述更有分量、减少 Midjourney 自带的美化，加 `--raw`。

## 提高一致性的技巧

1. **固定一段角色描述**：发型、发色、瞳色、服装、标志性配饰写成一段，每次原样复用，只改动作和场景。
2. **多角色混淆时，合成一张参考图**：官方建议，如果几个角色的特征互相串了，可以先把他们放进同一张参考图里再用。
3. **小细节别指望完全一致**：官方在 Omni Reference 说明里提醒，雀斑、衣服上的 logo 这类细节可能对不上，最后可以用编辑器局部修。
4. **画风另外控制**：用 `--sref` 或个性化档案统一画风，在提示词里也写出风格词，官方说这样能更稳定地「激活」风格。
5. **别依赖 seed**：官方说明 seed 只决定初始噪声，不能保存角色或风格。

## 常见问题

**Q：Edit 模型和 Omni Reference 哪个更贵？**
按官方 GPU 速度说明，V8 的 Edit 模型 SD 出图约 1 分钟 GPU 时间、HD 约 2.3 分钟；V7 的 Omni Reference 约 2 分钟。实际消耗以账户显示为准。

**Q：Edit 模型有哪些限制？**
官方列出：目前不兼容 `--tile`，Edit 模型生成的图暂不兼容 Remix。V7 的 Omni Reference 按官方页面，与草稿模式、对话模式和 `--q 4` 等不兼容，生成的图也不能直接用 Vary Region、Pan、Zoom Out 修改。

**Q：`--ow` 还要设吗？**
只在 V7 用 Omni Reference 时需要：取值 1–1000，默认 100，官方建议一般不超过 400。Edit 模型没有这个参数。

**Q：可以用明星照片做参考吗？**
不建议。Midjourney 条款要求你对上传的图片拥有权利，社区准则禁止滥用真实人物形象；商用还涉及肖像权。用原创角色最稳妥。

## 参考资料

- Midjourney 官方文档：Edit Model — https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
- Midjourney 官方文档：Omni Reference — https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference
- Midjourney 官方文档：Version — https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Midjourney 官方更新：Edit Model for V8 — https://updates.midjourney.com/edit-model-for-v8/
- Midjourney 官方文档：Seeds — https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds
- Midjourney 官方文档：GPU Speed — https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo
