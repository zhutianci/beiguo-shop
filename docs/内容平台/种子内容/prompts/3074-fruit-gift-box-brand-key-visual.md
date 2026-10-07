---
title: "水果礼盒主视觉提示词：榴莲礼盒新品发布 KV（热带奢华、聚光灯质感）（gpt-image-2）"
slug: fruit-gift-box-brand-key-visual
model: gpt-image-2
topics: [food, ecommerce]
aspectRatio: "3:4"
needsRefImage: false
useCase: "为生鲜水果或食品礼盒生成可直接落地的品牌主视觉（KV）：主体居中放大、热带礼品场景、单向戏剧聚光、留好标题和 Logo 区，适合新品发布海报、礼盒宣传和电商活动头图。"
prompt: |
  一张[3:4]竖版的品牌主视觉，用作新品发布海报和新品传播的主画面。
  主体是生鲜水果品类的[榴莲礼盒]，整体基调是浓郁的热带奢华感。
  构图：竖向居中聚焦，主体在中间放大，四周保留克制的空间感。背景是高端热带水果礼品场景，用柔软材质的台面建立品牌空间层次。
  重点表现榴莲带刺的外壳结构和果肉的绵密质感，用戏剧化的单向聚光灯和受控的反光，勾勒主体轮廓、材质反光和品牌情绪。
  色彩体系：[金榴莲黄、奶白、深棕绿]（如 #C9A347、#F4EEDF、#5B5847）。
  文字系统包括标题 + 副标题 + Logo 区，文字安全区放在顶部标题区，确保标题、标语和 Logo 留有清晰边距（例如标题"榴金盛启"、副标题"热带奢礼，鲜启新章"）。
  最终要像一张真实、可落地的品牌 KV，而不是普通电商主图或详情页拼贴，避免过多参数贴纸。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2085566048565338146
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；画幅、主体、配色改为变量；补充默认标题文字示例"
images:
  - 3074-fruit-gift-box-brand-key-visual-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=30604
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[榴莲礼盒] 换成你的产品，如"车厘子礼盒""阳山水蜜桃礼盒""大闸蟹礼盒"，色彩体系按产品改（车厘子写"深酒红、奶白、墨绿"）。标题和副标题可以直接写进提示词，模型会放在顶部安全区；品牌 Logo 建议后期自己贴。

示例图是暖金色调的竖版 KV：画面中央一个打开的八角形礼盒里放着一颗切开露出金黄果肉的榴莲，墨绿丝带，背景是虚化的热带叶片和一束顶光，上方是"果序鲜礼"小 Logo、金色书法大字"榴金盛启"和副标题。

**常见问题**：
- 画成了电商白底图：强调"品牌 KV，有场景和光影氛围，不是白底主图"。
- 标题压住主体：保留"文字安全区在顶部"。
- 果肉质感不真实：加"微距细节，绵密果肉，表面细微光泽"。

**适合**：水果 / 生鲜礼盒新品发布、节日礼盒宣传、电商活动头图、品牌社媒。

### 原版提示词

```text
A {argument name="ratio" default="3:4"} vertical brand key visual for a new product launch poster, designed as the main visual for new product communication. The subject is a {argument name="subject" default="durian gift box"} in the fresh fruit category, with an overall tone of strong tropical luxury. The composition uses a vertical centered focus, with the subject enlarged in the middle and a restrained sense of space surrounding it. The background is a high-end tropical fruit gift setting, incorporating soft-material platforms to establish spatial layers for the brand. The focus is on the spiked shell structure and the dense texture of the fruit pulp, using dramatic unidirectional spotlights and controlled reflections to establish the subject's silhouette, material reflection, and brand mood. The color system uses {argument name="color scheme" default="Golden Durian Yellow #C9A347 + Milk White #F4EEDF + Dark Brown-Green #5B5847"}. The typography system includes title + subtitle + logo area, with the text safety zone placed at the top title area to ensure clear margins for the title, slogan, and logo. The overall result should be a genuine, deployable brand key visual, rather than a typical e-commerce main image or detail page collage, avoiding excessive parameter stickers.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2085566048565338146) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
