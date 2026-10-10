---
title: "AI包装设计提示词：外卖包装系统设计提案板（纸袋 / 杯 / 餐盒 / 贴纸全套）（gpt-image-2）"
slug: takeaway-packaging-system-proposal
model: gpt-image-2
topics: [ecommerce, logo]
aspectRatio: "4:3"
needsRefImage: false
useCase: "输入品类、品牌名和风格，生成一张横版的外卖包装系统提案板：展开图与结构、实物场景照、细节与材质、色卡和组装说明，适合咖啡店、茶饮、轻食、烘焙品牌的包装提案。"
prompt: |
  生成一张横版 4:3 高清写实的品牌包装设计提案板，主题是[咖啡]外卖包装系统。
  品牌名：[DAYBEAN]
  标语：[fresh coffee to go]
  系统标题：TAKEAWAY PACKAGING SYSTEM
  风格：[自然、手作、极简]
  主色调：[牛皮纸棕与深咖色]
  提案板分区：
  01 展开图与结构：纸袋、杯子、杯套、餐盒、封口贴的平面展开线稿；
  02 应用场景：一组实物摄影小图（手提纸袋、外带杯、桌上摆放）；
  03 细节与材质：Logo 标识、色卡、纸张质感样本、印刷工艺说明；
  04 组装与功能：杯托、提手、封口等结构的使用示意。
  右上方一张大幅主视觉照片：整套包装摆在木桌上，自然光。
  四周点缀手写体注释和箭头，整体像 Behance 上的专业包装作品集，米白纸张底色，排版整齐、留白充足，不要真实品牌。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MrLarus/status/2071855388790550839
  author: "Larus Canus"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有字段模板，本站译为中文并按示例图补充了提案板的分区内容；品类、品牌名、标语、风格、主色改为变量"
images:
  - 3079-takeaway-packaging-system-proposal-1.jpg
  - 3079-takeaway-packaging-system-proposal-2.jpg
imageCredit:
  by: "Larus Canus"
  url: https://youmind.com/gpt-image-2-prompts?id=27262
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[咖啡] 换成你的品类（茶饮、轻食沙拉、烘焙面包、中式快餐），品牌名、标语、风格、主色一起改。作者用同一模板做了一系列：DAYBEAN 咖啡（牛皮纸棕）、竹间茶（米白 + 竹叶绿、中文品牌名）、GREEN YARD 轻食、OVEN MOOD 烘焙。中文品牌名直接写中文即可，例如"[竹间茶]"。

示例图两张：DAYBEAN 咖啡外卖包装提案（左侧纸袋、杯子、杯套的展开图，右上整套牛皮纸包装和咖啡的实拍，下方一排应用场景和细节小图、色卡）；竹间茶的同款提案板（米白纸袋、竹叶图案、透明茶饮杯）。

**常见问题**：
- 小字和标注是乱码：提案板里的注释只作装饰，正式提案需替换成真实说明。
- 包装尺寸、结构不真实：效果图只用于风格方向，落地需要按刀版图制作。
- 品牌名拼错：英文名控制在一个单词以内。

**适合**：咖啡 / 茶饮 / 轻食 / 烘焙品牌的包装提案、设计作品集、开店前的视觉规划。

### 原版提示词

```text
Generate a horizontal 4:3 high-definition realistic brand packaging design proposal board with the theme of {argument name="product category" default="product category"} takeaway packaging system. \n\nBrand Name: {argument name="brand name" default="Brand Name"} \nslogan: {argument name="slogan" default="Brand Slogan"} \nSystem Title: [TAKEAWAY PACKAGING SYSTEM] \nStyle: [Style Keywords] \nMain Color: [Main Color Tone]
```

> 改编自 [Larus Canus](https://x.com/MrLarus/status/2071855388790550839) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
