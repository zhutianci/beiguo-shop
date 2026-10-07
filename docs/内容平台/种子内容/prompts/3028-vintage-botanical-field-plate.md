---
title: "复古植物图鉴提示词：19 世纪水彩植物标本海报（带编号标注）（gpt-image-2）"
slug: vintage-botanical-field-plate
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "2:3"
needsRefImage: false
useCase: "生成一张 19 世纪科学图鉴风的植物海报：米色纸上一株连根的水彩植物，茎叶花有编号小标注，页边铅笔笔记，适合装饰画、植物科普和文创明信片。"
prompt: |
  一张印在米色纸上的科学植物图鉴海报。
  画面中央是一株放大的[勿忘我]，用水彩绘制，连根一起完整呈现；茎和花瓣上有细小的编号标注，旁边列出对应的部位名称。
  顶部用意大利斜体衬线字写标题"[FORGET-ME-NOT]"，下面一行副标题"A FIELD PLATE"。
  底部写"[PLATE VII · 1887]"。
  页边空白处有铅笔手写笔记（学名、科属、生长环境等）。
  配色：米色、靛蓝、绿色。画幅 2:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/TraffAlex/status/2095583733264879803
  author: "AlexAImaginator"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；植物、图版编号改为变量，并补充把标题改成对应植物名的说明"
images:
  - 3028-vintage-botanical-field-plate-1.jpg
  - 3028-vintage-botanical-field-plate-2.jpg
imageCredit:
  by: "AlexAImaginator"
  url: https://youmind.com/gpt-image-2-prompts?id=33434
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[勿忘我] 和 [FORGET-ME-NOT] 要一起换，例如"[薰衣草]／[LAVENDER]""[银杏]／[GINKGO]""[山茶花]／[CAMELLIA]"；配色也跟着植物改（薰衣草用"米色、紫色、灰绿"）。[PLATE VII · 1887] 是图版编号和年份，可以改成你的系列编号，做一套时依次写 PLATE I、II、III。

示例图是两张：第一张是一株完整的蓝色勿忘我，右侧 1～8 编号的部位名称，左侧铅笔写着学名和生长环境，左下角一个放大的花冠线稿；第二张是单朵大花特写版，花瓣、萼片、叶、根分别用引线写了英文说明。

**常见问题**：
- 植物画得不像：写出这种植物的关键特征（花瓣数、叶形），例如"五瓣蓝花、黄色花心、披针形叶"。
- 标注文字乱：标注本身是装饰，正式科普请自己核对部位名称。
- 想要中文版：标题写中文"勿忘我"，页边笔记写中文小楷，但古典图鉴的味道会弱一些。

**适合**：装饰画、植物科普、文创明信片 / 书签、手账素材。

### 英文原版

```text
A scientific botanical poster on cream paper. A single oversized {argument name="flower" default="forget-me-not"} painted in watercolor, roots and all, with tiny numbered labels on stem and petal. Title in italic serif at the top: "FORGET-ME-NOT". Subtitle: "A FIELD PLATE". Bottom: "{argument name="plate number" default="PLATE VII · 1887"}". Pencil notes in the margin. Cream, indigo, green, 2:3 aspect ratio.
```

> 改编自 [AlexAImaginator](https://x.com/TraffAlex/status/2095583733264879803) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
