---
title: "Logo提示词：用你的名字生成一份完整的品牌 VI 手册（A4，字母特殊设计）（gpt-image-2）"
slug: personal-name-logo-vi-manual
model: gpt-image-2
topics: [logo]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入名字（网名、品牌名）、想特殊设计的字母风格和配色，一句话生成一页 A4 比例的完整 Logo VI 手册：主标志、标志释义、结构网格、标准色、字体、辅助图形和应用示例，适合个人品牌、自媒体和小团队。"
prompt: |
  我的网名是"[ShyNloc]"，严格按照我的大小写。
  其中字母 N 用[折纸风格]做特殊设计。配色：[黑色和橙色]。
  设计要大胆、前卫、有锋芒。
  做一份精致、专业、完整的 Logo VI 手册，A4 纸张比例，包含：主标志、标志释义、结构与比例网格、标准色（含色值）、品牌字体、辅助图形、应用示例（名片、工牌、手提袋等）。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/shynloc/status/2050961762212876370
  author: "ShyNloc"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文短句的英文写法改写为中文；名字、字母风格、配色改为变量，补充 VI 手册的常见章节"
images:
  - 3111-personal-name-logo-vi-manual-1.jpg
imageCredit:
  by: "ShyNloc"
  url: https://youmind.com/gpt-image-2-prompts?id=18072
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[ShyNloc] 换成你的名字或品牌名，注意写清大小写；"字母 N"改成你想突出的那个字母，[折纸风格] 可以换成"像素风""书法笔触""霓虹灯管""几何切割"；[黑色和橙色] 换成你的品牌色。中文名字也可以，写"其中'X'字用 XX 风格特殊设计"。

示例图是一页 A4 比例的 VI 手册：顶部黑条"ShyNloc Logo VI Manual / 01"，主标志里的 N 是橙色折纸造型，下面依次是标志释义（N = AI 的拆解）、结构网格与折纸步骤、黑 / 橙 / 白标准色卡、字体展示、斜切辅助图形，以及名片、信纸、工牌等应用示例。

**常见问题**：
- 名字拼写或大小写被改：开头强调"严格按我的大小写，逐字准确"。
- 手册里的小字是乱码：VI 手册的说明文字只作版式示意，正式手册需要设计师重排。
- 正式注册商标：AI 生成的标志需做商标近似查询，并由设计师矢量化。

**适合**：个人品牌 / 自媒体 Logo、小团队 VI 初稿、设计作品集、品牌提案。

### 原版提示词

```text
My internet name is [{argument name="name" default="ShyNloc"}], strictly following my capitalization. The letter N should be specially designed in [{argument name="style" default="origami style"}]. Color combination: [{argument name="colors" default="black and orange"}]. The design should be bold, avant-garde, and cutting-edge. Create a sophisticated, refined, and professional complete logo VI manual in A4 paper proportions.
```

> 改编自 [ShyNloc](https://x.com/shynloc/status/2050961762212876370) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
