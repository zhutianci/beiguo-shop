---
title: "咖啡店海报提示词：白底极简单品海报（大字品名 + 价格，日式咖啡馆风）（gpt-image-2）"
slug: minimalist-cafe-product-price-poster
model: gpt-image-2
topics: [food, poster]
aspectRatio: "4:5"
needsRefImage: true
useCase: "上传一张甜品、饮品或面包的照片，输入品名和价格，生成白底黑字的瑞士风极简单品海报，适合咖啡店、烘焙店的菜单墙、外卖头图和社媒上新图。"
prompt: |
  生成一张 4:5 的极简咖啡馆单品海报，纯白背景、黑色字体。
  以我上传的产品照片为主要参考；如果没有上传照片，就根据产品名"[蜂蜜蛋糕]"生成一张写实的产品图。
  用超大的全大写英文显示产品名，价格严格按我输入的"[$6.50]"显示，只生成简短的英文宣传短句。
  画面中央只有一件产品，带柔和自然的投影；干净的瑞士风编辑排版，宽边距，整体是[现代日式咖啡馆]美学。
  不要编造画面里看不到或无法推断的配料、品牌和卖点。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/kingofdairyque/status/2083045196212625545
  author: "Simply Ray"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；品名、价格、美学风格改为变量；补充中文店铺的用法"
images:
  - 3053-minimalist-cafe-product-price-poster-1.jpg
  - 3053-minimalist-cafe-product-price-poster-2.jpg
imageCredit:
  by: "Simply Ray"
  url: https://youmind.com/gpt-image-2-prompts?id=30360
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传你自己的产品照片（白底或干净背景最好），填写 [蜂蜜蛋糕] 和 [$6.50]；价格写成你店里的格式，如"¥28"。想要中文海报，把"全大写英文"改成"超大的中文粗黑体"，并写"宣传短句用中文，不超过 8 个字"。[现代日式咖啡馆] 也可以改成"北欧极简""法式小酒馆"。

示例图两张：HONEY CAKE（白瓷盘上的多层蜂蜜蛋糕配草莓蓝莓，左上超大黑色标题、价格 $6.50、右上"FRESH DESSERT"框、底部几行卖点）和 CHEESE SYRNIKI（同一版式，换成乳酪煎饼配酸奶油和覆盆子），版式完全一致。

**常见问题**：
- 价格被改写：强调"价格严格按输入显示，不要改动货币符号和数字"。
- 自动加了不存在的配料说明：保留最后一句"不要编造配料"。
- 做成一套菜单：固定版式描述，每次只换照片、品名和价格。

**适合**：咖啡店 / 烘焙店菜单墙、外卖平台头图、社媒上新图、店内桌卡。

### 英文原版

```text
Create a minimalist 4:5 café product poster with a pure white background and black typography. Use the attached product photo as the main reference, or generate a realistic product image from the {argument name="product name" default="product name"} if no photo is provided. Display the product name in large uppercase English text, the {argument name="price" default="price"} exactly as entered, and generate short English promotional phrases only. Keep one centered product with soft natural shadows, a clean Swiss-style editorial layout, wide margins, and a {argument name="aesthetic" default="modern Japanese café"} aesthetic. Do not invent ingredients, brands, or features that are not visible or implied.
```

> 改编自 [Simply Ray](https://x.com/kingofdairyque/status/2083045196212625545) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
