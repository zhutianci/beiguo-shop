---
title: nano banana 换装提示词：上传人物照 + 衣服图，一键试穿（姿势背景不变）
slug: outfit-swap
model: nano-banana
topics: [photo-edit, ecommerce, portrait]
needsRefImage: true
useCase: 网店上新没模特、或者想看自己穿某件衣服的效果时，上传一张人物照和一张衣服平铺图 / 商品图，生成人物穿上这件衣服的照片。
prompt: |
  图 1 是人物照片，图 2 是目标服装。
  把图 1 中人物身上的[上衣]替换成图 2 里的服装。
  要求：
  - 人物的长相、发型、姿势、表情、背景和画面真实感全部保持不变；
  - 新衣服要合身、自然，布料褶皱随身体姿态变化，光线和阴影与原图一致；
  - 完整保留图 2 服装的颜色、图案、印花和面料质感，不要重新设计；
  - 只换衣服，不改变人物身份，也不改变环境。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/skirano/status/1960343968320737397
  author: "@skirano"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；明确图 1 / 图 2 的分工；新增"要替换的部位"变量；补充"保留服装图案与面料、不要重新设计"的约束
images:
  - 152-outfit-swap-1.jpg
  - 152-outfit-swap-2.jpg
imageCredit:
  by: "@skirano"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case22
  license: Apache-2.0
verify:
  - 用一件带复杂印花的衬衫实测，检查图案是否被保留
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：先上传人物照（图 1），再上传衣服图（图 2），顺序不能反。示例第 1 张是结果，第 2 张是输入（人物原图 + 衬衫商品图）。[上衣] 可换成"外套""连衣裙""整套衣服"。

**常见问题**：
- 衣服图案被"简化"：加一句"服装上的每个图案元素都要和图 2 一模一样"。衣服图最好是正面平铺、背景干净的图。
- 下半身也被改了：写清"裤子和鞋子保持原样"。
- 版型不合适（太紧 / 太宽松）：追问"衣服改成宽松版型 / 修身版型"。

**适合**：电商模特图、穿搭预览、换季上新；**注意**：只用自己或已获授权的人物照片，不要拿他人照片做换装。

### 英文原版

```
Replace the person's clothing in the input image with the target clothing shown in the reference image. Keep the person's pose, facial expression, background, and overall realism unchanged. Make the new outfit look natural, well-fitted, and consistent with lighting and shadows. Do not alter the person's identity or the environment — only change the clothes.
```

> 改编自 [@skirano](https://x.com/skirano/status/1960343968320737397) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
