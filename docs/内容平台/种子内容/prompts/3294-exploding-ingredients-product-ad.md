---
title: 电商主图提示词：上传产品图，原料向四周爆炸飞散的促销主图（撞色背景、无文字）
slug: exploding-ingredients-product-ad
model: nano-banana
topics: [food, ecommerce]
needsRefImage: true
aspectRatio: "1:1"
useCase: 给饮品、甜品、零食、护肤品做促销主图时，上传一张产品图，生成产品居中、新鲜原料从四周炸开飞舞的动感广告图，用来强调"新鲜、真材实料"。
prompt: |
  把上传图中的[产品]放在一个有戏剧张力的现代场景中拍摄：
  - 产品居中、稳定、清晰，是绝对的视觉主角；
  - 产品的主要原料（[草莓、香蕉片、薄荷叶]）以爆炸式的动态向外飞散，新鲜、原始、带水润光泽，暗示产品的新鲜度和营养；
  - 加入少量动感元素，如[飞溅的酱汁和彩色糖针]，定格在空中；
  - 背景使用品牌的关键颜色：[粉色墙面配黄色台面]的撞色；
  - 明亮的硬朗棚拍光，阴影清晰，色彩饱和；
  - 促销广告镜头质感，画面中不要出现任何文字。
  画幅 1:1。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/icreatelife/status/1962724040205803773
  author: "@icreatelife"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为中文，本站拆成要点并补充"产品居中清晰、动感元素定格、硬朗棚拍光"等约束；产品、原料、动感元素、背景色设为变量
images:
  - 3294-exploding-ingredients-product-ad-1.jpg
imageCredit:
  by: "@icreatelife"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case30
  license: Apache-2.0
verify:
  - 仓库只收录了结果图，没有原始产品图，示例展示时说明需上传自己的产品照
  - 换成瓶装饮料、护肤品各测一次，确认产品包装文字不被改坏
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：上传一张清晰的产品图，[产品] 写一句描述，如"一瓶橙汁""一盒坚果礼盒""一支面霜"。[草莓、香蕉片、薄荷叶] 换成真实原料：橙汁写"橙子切片、果肉粒、水珠"，坚果写"腰果、巴旦木、蔓越莓干"，面霜写"芦荟、花瓣、水滴"。[飞溅的酱汁和彩色糖针] 可改成"飞溅的果汁"或"细碎的花瓣"。[粉色墙面配黄色台面] 换成自家品牌色。示例图里一只粉色冰淇淋杯装着粉、蓝、黄三球冰淇淋，几根木勺斜插着，草莓、香蕉片、薄荷叶和彩色糖针向四周炸开，粉色牛奶状液体飞溅，背景上半是粉墙、下半是黄色台面。

**常见问题与调整**：
- 产品被改了样子：加"产品包装、形状和文字与上传图完全一致，只改变场景"。
- 原料太多盖住产品：限定"原料只分布在产品四周，不遮挡产品正面"。
- 画面出现文字：再强调"无任何文字、标志或水印"。
- 想要高级感：把撞色换成"深色背景、单一侧光、原料慢速飞散"。

**适合**：电商主图、外卖平台菜品图、社媒新品预告；用于商品宣传时，原料和实物要与图片一致。

### 原版提示词（仓库收录的原文）

```
在具有戏剧性的现代场景中拍摄该产品，并伴随着爆炸性的向外动态排列，主要成分新鲜和原始在产品周围飞舞，表明其新鲜度和营养价值。促销广告镜头，没有文字，强调产品，以关键品牌颜色作为背景。
```

> 改编自 [@icreatelife](https://x.com/icreatelife/status/1962724040205803773) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
