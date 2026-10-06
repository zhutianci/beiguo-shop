---
title: 室内设计情绪板提示词：上传房间照片生成效果图 + 材质色卡（gpt-image-2）
slug: interior-mood-board
model: gpt-image-2
topics: [interior, infographic]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张房间照片或参考图，生成"上方效果图 + 下方材质样板、色卡和设计说明"的专业情绪板，适合装修沟通、设计提案。
prompt: |
  你是一名专业的室内设计情绪板（Mood Board）设计师。请基于我上传的[卫生间]室内照片，生成一张竖版 3:4 的高端室内设计情绪板。
  整体参考专业设计公司的提案图，呈现[现代侘寂]风格，空间氛围[安静、温暖、克制]。
  上半部分：一张高分辨率、照片级真实的[卫生间]效果图。空间结构、家具语言、材质关系、色彩搭配和光影氛围要与我上传的照片保持一致，同时提升为更完整、更精致的设计提案效果。重点体现：[独立浴缸与悬浮浴室柜]、[微水泥、胡桃木、拉丝黄铜]、[暖灰与沙色]、[暖色洗墙灯]。
  下半部分：展示与上方空间严格对应的材质与软装样本，包括材料样板、面料样本、色卡、饰面样本，以及与空间相关的木材、石材、金属、玻璃、织物或涂料样本。所有样本必须与上方空间一致，准确反映方案的核心材质与色彩逻辑。
  右下角：一个"设计说明 / 色彩方案"信息框，统一展示主色、辅助色、点缀色、核心材质、饰面说明和风格关键词。
  每个样本配清晰的[中文]标签（材质名、颜色名、饰面名或面料类型），标签简洁、专业、排版规整，不喧宾夺主。
  版式：专业室内设计公司级别，极简、整洁、有秩序，视觉层级清晰，留白克制；写实渲染，超高细节。
  避免：杂乱拼贴、廉价海报感、材质与空间不匹配、错误透视、低质字体、装饰过多、卡通感、过饱和色彩、信息层级混乱。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/GeekCatX/status/2052949583563784620
  author: "@GeekCatX"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 中文原文精简并把英文占位符改为中文变量（空间类型、风格、氛围、家具、材质、色彩、灯光、标签语言），给出卫生间示例值
images:
  - 132-interior-mood-board-1.jpg
imageCredit:
  by: "@GeekCatX"
  url: https://x.com/GeekCatX/status/2052949583563784620
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 下方色卡与上方效果图的材质 / 颜色是否真正对应
  - 中文标签是否有错字
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：先填空间类型（客厅、卧室、厨房、卫生间），再填风格和氛围，最后填"家具 / 材质 / 色彩 / 灯光"四项，四项要彼此搭配，例如"奶油风客厅：云朵沙发、羊毛地毯、奶白与燕麦色、筒灯无主灯"。标签语言写"中文"或"中英双语"。

**常见问题**：
- 效果图和原照片户型对不上：上传的照片要能看清墙、窗、门的位置；可补"保留原有门窗位置和层高"。
- 色卡是随便编的：强调"每个样本都要在上方效果图里出现过"。
- 当作施工依据：这只是氛围参考，材料型号和尺寸要以设计师和实际产品为准。

**迭代**：同一照片换 2–3 种风格出图，方便和家人、设计师对比讨论。

### 原版提示词

```text
GPT Image 2 室内设计情绪板生成器

提示词：
（室内设计情绪板生成器 / Interior Design Mood Board Generator）
你是一名专业的室内设计 Mood Board 创作者。请基于用户提供的 [Space Type] 室内设计照片，生成一张 竖版 3:4 的高端室内设计情绪板。整体视觉参考专业室内设计提案图，呈现 [Style Keywords] 的审美特征，画面应具备 [Mood Keywords] 的空间氛围，并符合 [Branding Tone] 的高级设计表达。
场景类型（Space Type）：[Space Type]
画面布局要求
上半部分：呈现一张高分辨率、照片级真实感的 [Space Type] 室内设计效果图。

该效果图需要在空间结构、家具语言、材质关系、色彩搭配、光影氛围上与用户输入照片保持一致，同时提升为更完整、更精致、更具设计提案感的视觉呈现。

重点体现：[Key Furniture Elements]、[Material Keywords]、[Color Palette]、[Lighting Style]。
下半部分：展示与上方空间设计严格对应的材质与软装样本，包括：
材料样板
面料样本
色卡
饰面样本
与该空间相关的木材、石材、金属、玻璃、织物、皮革或涂料样本

所有样本必须与上方空间保持一致，并准确反映该设计方案中的核心材质与色彩逻辑。
右下角：设置一个 Design Legend / Color Palette 信息框，统一展示本方案的：
主色
辅助色
点缀色
核心材质
饰面说明
风格关键词
风格与输出要求
专业室内设计公司级别的 Mood Board 版式
极简、整洁、克制、有秩序的排版
明确的视觉层级与留白控制
材质、色彩、面料、饰面与上方空间完全匹配
标签清晰、现代、简洁，具有高级编辑设计感
整体气质需符合 [Style Keywords]
呈现 [Render Quality]
竖版 3:4 构图
4K Ultra HD
超高细节
写实渲染
直接用于图像生成
标签要求
每个材质或色彩样本配有清晰标签，标签内容围绕以下信息组织：

[Label Language] 的材质名称、颜色名称、饰面名称或织物类型。

标签风格应简洁、专业、排版规整，不喧宾夺主。
主题定义
[Space Type] Interior Design Mood Board

风格方向：[Style Name]

关键词：[Style Keywords], [Material Keywords], [Color Palette], [Mood Keywords]
负面约束
避免杂乱拼贴、避免廉价海报风、避免材质与空间不匹配、避免错误透视、避免低质字体、避免装饰元素过多、避免卡通感、避免过饱和色彩、避免信息层
```

> 改编自 [@GeekCatX](https://x.com/GeekCatX/status/2052949583563784620) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
