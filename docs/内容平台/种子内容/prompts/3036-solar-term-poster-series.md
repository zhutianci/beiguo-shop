---
title: "节气海报提示词：一个节气连出 10 张不同版式的国风插画海报（小暑示例）（gpt-image-2）"
slug: solar-term-poster-series
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给一个二十四节气连续生成 10 张风格统一但插画、金句和版式各不相同的横版海报，适合公众号节气推文、品牌节气海报和朋友圈配图。"
prompt: |
  以[小暑]为主题，连续生成 10 张图，每张都有不同的插画逻辑、金句逻辑和配色版式逻辑，但整体风格统一。
  统一风格：16:9 横版，米白宣纸底，淡雅的水彩工笔插画（与节气相关的植物、器物、食物、景物），大量留白；节气名用竖排宋体大字，配拼音或英文小字和一枚红色小印章；配色清淡（竹青、浅绿、淡赭、西瓜红点缀）。
  每张必备：节气名 + 一个四字小标题（如"竹风纳凉""溪涧生凉""晒伏闲日""瓜甜风轻"）+ 一两句有画面感的金句 + 底部一行节气信息（节气时间、农历日期、气候特点、生活建议）。
  每张换一个插画主题和一种版式：标题在左 / 在右 / 居中竖排 / 上下分栏轮流变化，插画主体位置也随之变化。
  先生成第 1 张，满意后继续生成后面的，保持同一视觉语言。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2072714953103122560
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有一句话，本站在保留原意（10 张、插画 / 金句 / 配色版式各有逻辑）的基础上，按示例图补充了统一风格与每张必备元素；节气改为变量"
images:
  - 3036-solar-term-poster-series-1.jpg
  - 3036-solar-term-poster-series-2.jpg
  - 3036-solar-term-poster-series-3.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=27552
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[小暑] 换成任意节气，如"白露""霜降""冬至"，配色描述也要改成对应季节（冬至写"雪白、黛青、朱红点缀"）。不需要 10 张时直接写"连续生成 4 张"。四字小标题可以自己指定，也可以让模型自由发挥。

示例图是这套小暑系列中的三张：竹风纳凉（竹叶和蒲扇、左上竖排"小暑"）、溪涧生凉（溪石与蕨草、中间大留白）、晒伏闲日（竹匾里晒的书和干花），都是米白底水彩插画，竖排宋体节气名配红色小印章，右侧金句，底部一行节气信息。

**常见问题**：
- 农历日期、节气时间写错：节气日期每年不同，发布前请按当年日历核对。
- 后几张风格跑偏：续写时把"统一风格"那段原样再贴一次。
- 竖排小字有错字：金句控制在 20 字以内。

**适合**：公众号 / 品牌节气推文、朋友圈节气海报、文创日历。

### 原版提示词

```text
Generate 10 images in a sequence, each featuring a different {argument name="theme" default="Slight Heat"} theme, illustration logic, golden quote logic, as well as color and layout logic.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2072714953103122560) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
