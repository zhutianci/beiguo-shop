---
title: 新中式茶饮新品海报提示词：中文价格与活动文案精准排版（gpt-image-2）
slug: new-chinese-tea-launch-poster
model: gpt-image-2
topics: [poster, ecommerce]
aspectRatio: "3:4"
needsRefImage: false
useCase: 给奶茶店、咖啡店、烘焙店的新品上市做一张带价格、活动、口味说明的新中式海报，重点测试中文小字排版。
prompt: |
  设计一张 3:4 竖版的[新中式茶饮]新品上市海报。新中式视觉，轻奢、克制；配色为[墨绿、米白和金色]，带宣纸纹理、优雅留白、山水点缀和现代版式。
  主体：一杯诱人的[冷泡茶]，配[茶叶、柑橘片、冰块]和少许金箔。
  海报必须准确显示以下中文文案（逐字一致）：
  "[山川茶事]" / "[山柚观音]" / "冷泡系列" / "新品上市"
  "[一口清醒，半城入夏]" / "限定尝鲜价"
  "中杯 [16] 元" / "大杯 [19] 元"
  "门店活动" / "[第二杯半价]" / "[加 3 元升级轻乳版]"
  "推荐风味" / "[观音茶底 / 西柚果香 / 轻乳回甘]"
  "活动时间 [10月10日] 至 [10月31日]" / "扫码点单" / "[SHANCHUAN TEA]"
  底部小字："图片仅供参考，请以门店实际售卖为准"
  保持清晰的促销信息层级，但整体要高级，不要廉价、过度电商感。特别注意小字、数字、价格、信息模块和中文字体的美感。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill#gallery-edit-endpoint-showcase
  author: wuyoscar
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 英文原文译为中文；品类、配色、主体、全部文案与价格、日期改为变量；删去一条活动以降低小字数量
imageBrief: 按默认变量生成 1 张；再把品类换成"秋季栗子拿铁"、配色换成"焦糖棕 + 奶油白"生成 1 张，逐字核对文案正确率。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 逐字核对每一处中文文案和价格数字，记录错字数量
  - 底部免责小字是否可读
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：把方括号里的店名、产品名、文案、价格和活动时间全部换成你自己的。文案总量是成败关键：主标题 + 副标题 + 价格 + 1–2 条活动最稳，每多一行小字，出错概率就高一分。

**常见问题**：
- 个别字写错：gpt-image-2 的中文排版能力较强，但仍可能有错字。生成后**逐字核对**，错了就追问"只把'××'改成'××'，其他不变"。
- 版面太挤、像传单：删掉次要信息，或加"信息只占画面三分之一，其余留白"。
- 价格与门店实际不符：海报上的价格、活动必须与门店实际一致，避免消费纠纷。

**适合**：茶饮、咖啡、烘焙、餐饮新品；电商大促类密集信息海报建议拆成多张。

### 英文原版

```text
Design a 3:4 vertical poster for a new Chinese trendy tea launch. Use a New Chinese visual style that feels light-luxury and restrained. The palette should be dark green, off-white, and gold, with rice-paper texture, elegant negative space, landscape accents, and modern layout design.
Main subject:
a visually appealing cold-brew tea with tea leaves, citrus, ice cubes, and touches of gold foil.
The poster must accurately display the following exact Chinese copy:
"山川茶事" / "山柚观音" / "冷泡系列" / "新品上市"
"一口清醒，半城入夏" / "限定尝鲜价"
"中杯 16 元" / "大杯 19 元"
"门店活动" / "第二杯半价" / "加 3 元升级轻乳版" / "每日前 100 名赠限定杯套"
"推荐风味" / "观音茶底 / 西柚果香 / 轻乳云顶 / 冰感回甘"
"活动时间 4月20日 至 5月10日" / "扫码点单" / "SHANCHUAN TEA"
Fine print: "图片仅供参考，请以门店实际售卖为准"
Maintain a clear promotional hierarchy while keeping the overall feeling sophisticated rather than cheap or overly e-commerce-like. Pay special attention to small text, numbers, prices, info modules, and Chinese typography aesthetics.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 图库「Edit Endpoint Showcase」中的茶饮海报示例提示词，Copyright (c) 2026 Wuyoscar，[MIT License](https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE)。示例图为 PNG 且超过 1.2MB，未收录。
