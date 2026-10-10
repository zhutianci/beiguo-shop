---
title: "科普信息图提示词：雷暴云剖面图（分层标注 + 数据卡片）（gpt-image-2）"
slug: thunderstorm-cross-section-infographic
model: gpt-image-2
topics: [infographic]
aspectRatio: "2:3"
needsRefImage: false
useCase: "生成一张\"某种自然现象的解剖图\"：竖版剖面插画 + 箭头 + 分层标注 + 右侧数据卡片，示例是积雨云 / 雷暴的内部结构，换成龙卷风、台风、火山也适用。"
prompt: |
  生成一张扁平设计风格的科普信息图，标题 "Anatomy of a [Thunderstorm]"，副标题 "A cross-section of a cumulonimbus cloud"，2:3 竖版，浅蓝天空背景。
  画面中央是一朵高耸的积雨云的剖面：顶部是铁砧状云顶，云内用红色箭头表示上升气流、蓝色箭头表示下沉气流，云中散布冰晶、过冷水滴、霰和冰雹的小图标，云底是雨幕和一道闪电，地面是一条绿色地平线。
  左侧是一条海拔刻度尺（0～50,000 英尺），沿云体从下到上用引线标注各层：入流层、低层上升气流、中层混合区、上层上升气流、上冲云顶、铁砧云。
  右侧上方是"云内发生了什么"图例卡片（冰晶、过冷水、霰、冰雹，各配图标和一句说明）；下方是"典型数据"卡片（高度、云顶温度、上升 / 下沉气流速度、降雨强度、闪电次数）。
  底部用箭头标出入流和出流（阵风锋），以及"西—东"约 10～20 英里的水平尺度；最下面一行用两句话总结雷暴形成的原理。
  风格：干净的教科书式扁平插画，清晰的无衬线字体，配色以天蓝、白、红、蓝为主，信息层级分明，文字准确。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/TraffAlex/status/2090895540745572706
  author: "AlexAImaginator"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有一句话的信息图描述加一段与示例无关的摄影提示词；本站只保留信息图部分，按示例图补全了版式、标注层级和数据卡片的描述，译为中文，主题改为变量"
images:
  - 3005-thunderstorm-cross-section-infographic-1.jpg
imageCredit:
  by: "AlexAImaginator"
  url: https://youmind.com/gpt-image-2-prompts?id=32232
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[Thunderstorm] 换成别的现象，同时把剖面主体和标注层改掉，例如"Tornado（龙卷风）：漏斗云、旋转上升气流、碎片云""Volcano（火山）：岩浆房、火山通道、火山灰柱"。需要中文版就把标题和所有标注写成中文，并把数据卡片精简到 3～4 项。

示例图是蓝天背景下的积雨云剖面，左侧海拔刻度和六层标注，红蓝箭头表示气流，云内有冰晶、霰、冰雹图标，云底一道闪电，右侧两张白底卡片分别是图例和典型数据，底部一行英文总结。

**常见问题**：
- 数据不准确：示例里的数字由模型生成，用于正式科普前要对照教材或气象资料逐项核对，必要时在提示词里直接写好每个数值。
- 标注过多挤在一起：把左侧标注减到 4 层。
- 风格变成写实照片：强调"扁平矢量插画，不要照片质感"。

**适合**：地理 / 科学课课件、科普公众号配图、儿童百科插页。

### 英文原版

```text
1. "Anatomy of a {argument name="storm type" default="Thunderstorm"}" — a labeled cross-section of a cumulonimbus with arrows, layers and data callouts, clean flat design.

2. Photorealistic photography of a towering cumulonimbus storm, captured with a 70-200mm lens at f/8. dramatic golden hour light illuminates towering ice crystals and rain shafts, revealing the storm's internal vertical structure. sharp detail highlights the anvil head's fibrous texture and the base's dark, heavy precipitation core featuring in a photorealistic photography style, under neon glow, gritty heavy atmosphere atmosphere, extreme close-up. no AI-style warping natural skin texture with pores and creases deep layered shadows no morphing hands or faces real physics fluid cloth simulation.
```

> 改编自 [AlexAImaginator](https://x.com/TraffAlex/status/2090895540745572706) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
