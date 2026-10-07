---
title: "电商海报提示词：一张产品图批量生成 8 种风格方案（小红书 / 淘宝 / 抖音）（gpt-image-2）"
slug: batch-product-poster-directions
model: gpt-image-2
topics: [ecommerce, poster]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张产品图，让模型一次性给出 8 个风格完全不同的商业海报方案（极简白、露营、日式、暗调质感、夏日清爽、文艺复古、早餐场景、生活方式），用于电商提案前的方向探索。"
prompt: |
  请根据这张产品图，生成 [8] 个不同的产品海报方案。
  产品名称：[填写产品名称]
  使用场景：[填写产品用途]
  画幅：3:4。投放平台：小红书 / 淘宝 / 微信 / 抖音。
  要求：
  1. 准确保留产品的外观、包装、颜色和核心识别点。
  2. 每张使用不同的场景氛围、构图和视觉风格。
  3. 每张都要像一张独立完成的商业海报，而不只是换个背景。
  4. 适合社媒营销，视觉焦点清楚、有氛围。
  风格方向可以包括：极简白、露营、日式、暗调质感、夏日清新、文艺复古、早餐场景、生活方式。
  画面要求：不同的产品摆放角度、不同的场景组合、不同的光线氛围、不同的构图节奏，整体完成度高，适合电商提案。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/derek_wall90176/status/2080480065998192970
  author: "Derek Wen｜德里克文"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明整理为中文提示词；产品名、使用场景、输出数量改为变量"
images:
  - 3057-batch-product-poster-directions-1.jpg
  - 3057-batch-product-poster-directions-2.jpg
imageCredit:
  by: "Derek Wen｜德里克文"
  url: https://youmind.com/gpt-image-2-prompts?id=29595
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张清晰的产品图（白底或干净背景），填写产品名称和使用场景，例如"[NFC 苹果汁]""[早餐、露营、下午茶]"。[8] 可以改小，一次生成 4 张成功率更高。风格方向可以按品牌调性删改，比如母婴产品去掉"暗调质感"，换成"柔和奶油风"。

示例图是作者把这套方法的结果做成的两张说明图：一张"风格方向"——同一瓶苹果汁分别放在极简白、露营、日式、暗调、夏日、早餐等场景里的拼贴；另一张"批量提案"——中央产品瓶，四周 6 个不同风格方案的小图和标签。实际使用时，模型会逐张输出独立海报。

**常见问题**：
- 产品被改形、标签变了：强调"产品外观与参考图完全一致，只改场景"，并检查每一张。
- 8 张风格太接近：给每张指定一个风格，如"第 1 张：极简白棚拍；第 2 张：露营草地……"。
- 一次输出不了 8 张：分两轮，每轮 4 张。

**适合**：电商提案方向探索、新品上市视觉、小红书 / 淘宝主图备选、品牌社媒内容规划。

### 原版提示词

```text
Please generate 8 different product poster schemes based on this product image. Product Name: [{argument name="product name" default="fill in product name"}]. Usage Scenario: [{argument name="usage scenario" default="fill in product usage"}]. Output Quantity: {argument name="output quantity" default="8 images"}. Aspect Ratio: 3:4. Platforms: [Xiaohongshu / Taobao / WeChat / Douyin]. Requirements: 1. Keep the product's appearance, packaging, colors, and core identification points accurate. 2. Each image should use different scene atmospheres, compositions, and visual styles. 3. Each image must look like an independently completed commercial poster, not just a background swap. 4. Suitable for social media marketing with clear visual focus and atmosphere. Style directions can include: minimalist white, camping, Japanese, dark-toned texture, summer fresh, artistic retro, breakfast scene, lifestyle. Image requirements: different product placement angles, different scene combinations, different lighting atmospheres, different compositional rhythms, and high overall completion suitable for e-commerce proposals.
```

> 改编自 [Derek Wen｜德里克文](https://x.com/derek_wall90176/status/2080480065998192970) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
