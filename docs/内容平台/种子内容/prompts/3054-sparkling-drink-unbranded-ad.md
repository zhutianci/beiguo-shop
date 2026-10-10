---
title: "饮料广告图提示词：柚子气泡水罐装 + 瓶装的冰爽广告大片（无品牌版）（gpt-image-2）"
slug: sparkling-drink-unbranded-ad
model: gpt-image-2
topics: [ecommerce, food]
aspectRatio: "1:1"
needsRefImage: false
useCase: "用一句短提示词生成高端快消饮料广告图：易拉罐和玻璃瓶立在冰台上，水珠、柑橘皮卷和气泡，全程无品牌、无文字，适合饮料新品提案、电商主图底图和海报背景。"
prompt: |
  高端快消品广告，一款原创无品牌的[柚子气泡饮]：一只造型简洁的易拉罐和一只透明玻璃瓶，立在冰块堆成的半透明台座上。
  罐身和瓶身挂满冷凝水珠，周围飞舞着卷曲的柑橘皮，杯中和空中有细密的碳酸气泡，旁边一杯加冰的饮料。
  明亮的天光从上方斜射下来，浅蓝灰背景，奢华的商业修图质感。
  画面里不要任何可读文字、Logo 和人物。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/komorimedia/status/2082151840758829392
  author: "小森映像"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为英文关键词串，本站译为中文并略作扩写（加入光线与构图）；饮料类型改为变量"
images:
  - 3054-sparkling-drink-unbranded-ad-1.jpg
imageCredit:
  by: "小森映像"
  url: https://youmind.com/gpt-image-2-prompts?id=30121
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[柚子气泡饮] 换成你的饮品类型，如"白桃乌龙茶饮""青柠苏打水""冷萃咖啡"，道具会自动跟着变（白桃配桃子切片，咖啡配咖啡豆）。想放自己的产品，上传产品图并写"罐身外观完全按参考图"；需要品牌名时，出图后再在设计软件里排字，比让模型写字更稳。

示例图是方形广告图：一只白底黄绿色块的易拉罐和一只玻璃瓶立在冰台上，旁边一杯冒泡的冰饮，柚子和卷曲的黄色果皮飞在空中，上方一束斜光，背景浅蓝灰。

**常见问题**：
- 罐身出现乱码文字：重复"不要任何可读文字"，并写"罐身只有抽象色块图案"。
- 画面太空：加"前景散落冰块和半个柚子"。
- 太像 3D 渲染：加"真实摄影质感，轻微镜头景深"。

**适合**：饮料新品提案、电商主图底图、海报与社媒广告背景。

### 原版提示词

```text
premium FMCG advertisement, original unbranded {argument name="drink type" default="yuzu sparkling drink"}, sleek can and clear bottle, icy translucent platform, condensation droplets, citrus peel curls, carbonated bubbles, luxury commercial retouching, no readable text, no logo, no humans.
```

> 改编自 [小森映像](https://x.com/komorimedia/status/2082151840758829392) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
