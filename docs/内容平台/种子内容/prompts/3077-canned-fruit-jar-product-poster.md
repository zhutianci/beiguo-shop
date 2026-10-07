---
title: "食品包装海报提示词：玻璃罐黄桃罐头高级感广告图（品牌名 + 卖点标签）（gpt-image-2）"
slug: canned-fruit-jar-product-poster
model: gpt-image-2
topics: [food, ecommerce]
aspectRatio: "3:4"
needsRefImage: false
useCase: "为水果罐头、果酱、蜂蜜、腌菜等玻璃罐装食品生成一张明亮清透的竖版广告海报：罐子居中、叉子挑起一块果肉、顶部品牌名、下方大字品名和两个卖点标签。"
prompt: |
  高端写实的水果甜品海报，主题是[黄桃罐头]。
  一只透明玻璃罐放在浅金和奶油色背景的中央，罐里的黄桃果肉饱满厚实，糖水清澈透亮，玻璃表面挂着细密的冷凝水珠。
  前景一把银色叉子轻轻挑起一块黄桃，周围只有少量新鲜黄桃片、水痕和柔和的夏日光线。
  整体明亮但克制，像高端水果罐头广告：真实的玻璃折射、真实的果肉纹理、真实的液体层次，3:4 竖版。
  在海报上加入中英文文字：
  品牌名：[桃见]
  产品名：[黄桃罐头]
  英文副标题：YELLOW PEACH IN SYRUP
  标语：[把夏天的甜，认真封存起来]
  短标签：果肉厚实 / 清甜多汁
  排版：品牌名和英文放在顶部，产品名放在下方主视觉区，标语和短标签较小，版面清爽，像高端水果海报。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2083099780494893510
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；产品名、品牌名、标语改为变量"
images:
  - 3077-canned-fruit-jar-product-poster-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=30377
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[黄桃罐头] 在主题和产品名两处出现，换成"草莓果酱""槐花蜂蜜""糖渍金桔"等，画面描述里的"黄桃果肉、糖水、黄桃片"也要同步改成对应的东西；品牌名、标语、短标签按你的产品写，英文副标题跟着改。

示例图是暖金色调的竖版海报：中央一只挂着水珠的玻璃罐，装满金黄的黄桃块，一把银叉从右上方挑起一块，周围散落几片黄桃，顶部是"桃见"和"YELLOW PEACH IN SYRUP"，下方是棕色宋体大字"黄桃罐头"、标语和"果肉厚实 / 清甜多汁"两个小标签。

**常见问题**：
- 糖水浑浊：强调"糖水清澈透亮，可以透光"。
- 叉子和果肉位置怪：写"叉子从右上方伸入，挑起的果肉在罐口上方"。
- 文字太多：短标签最多两个，每个 4 个字。

**适合**：水果罐头 / 果酱 / 蜂蜜等罐装食品主图、电商详情页首屏、新品海报。

### 原版提示词

```text
High-end realistic fruit dessert poster, themed with {argument name="product name" default="canned yellow peaches"}. A transparent glass jar is placed in the center of a light gold and cream background. The peach flesh in the jar is plump and thick, the syrup is clear and translucent, and fine condensation water droplets hang on the glass surface. In the foreground, a slice of yellow peach is gently picked up by a silver fork, surrounded only by a small amount of fresh yellow peach slices, water marks, and soft summer light. The overall look is bright but restrained, like a high-end fruit canning advertisement, with real glass refraction, real fruit flesh texture, and real liquid layers, vertical 3:4.

Add Chinese and English poster text to the poster, the content is:
Brand name: {argument name="brand name" default="Taojian"}
Product name: {argument name="product name" default="Canned Yellow Peach"}
English subtitle: YELLOW PEACH IN SYRUP
Slogan: {argument name="slogan" default="Carefully preserve the sweetness of summer"}
Short tags: Thick flesh / Sweet and juicy

Layout requirements: The brand name and English are placed at the top, the product name is in the main visual area below, the slogan and short tags are smaller, the layout is refreshing, like a high-end fruit poster.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2083099780494893510) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
