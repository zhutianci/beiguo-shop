---
title: nano banana 周边设计提示词：上传一个角色，生成马克杯、T 恤、帽子等全套周边
slug: character-merch
model: nano-banana
topics: [ecommerce, character]
needsRefImage: true
useCase: 有自己的原创角色、品牌吉祥物或宠物形象，想快速看看做成周边（杯子、T 恤、帽子、贴纸、立牌）的样子，用于提案、众筹或店铺上新预览。
prompt: |
  用这张图里的角色设计一套周边商品，并拍成一张商品陈列照：
  - 商品包括：[马克杯、T 恤、棒球帽、亚克力立牌、贴纸]；
  - 每件商品上的角色形象、配色和特征与原图一致，可以使用不同表情或姿势；
  - 商品上可以加简短的标语文字：[ROCK ON]；
  - 商品整齐摆放在[木质桌面]上，背景是与角色相关的场景，柔和的自然光，真实的商业产品摄影质感。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/0xFramer/status/1964992117324886349
  author: "@0xFramer"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为一句"用这个角色图像创建商品"；本站扩写为商品清单、标语、陈列场景三个变量，并补充角色一致性要求
images:
  - 161-character-merch-1.jpg
  - 161-character-merch-2.jpg
imageCredit:
  by: "@0xFramer"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case68
  license: Apache-2.0
verify:
  - 用一张宠物照片作输入实测，看各件商品上的形象是否一致
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传角色图（原创角色、品牌吉祥物、宠物照片都行）。示例第 1 张是生成的周边陈列，第 2 张是输入的角色图。[马克杯……] 可以按你的品类改，比如"帆布袋、手机壳、钥匙扣"；不需要文字就删掉标语那一行。

**常见问题**：
- 某件商品上的角色"走样"：商品越多越容易不一致，建议一次 3～5 件；或者追问"单独生成马克杯的特写"。
- 文字拼错：标语尽量短，英文比中文稳定。
- 想要白底单品图：把陈列改成"每件商品单独放在纯白背景上，排成 2×3 网格"。

**注意**：只用自己拥有版权的角色；用知名动漫、游戏角色做周边属于侵权，仅能个人学习交流，不得售卖。

### 英文原版

```
Create merchandise using this character image.
```

> 改编自 [@0xFramer](https://x.com/0xFramer/status/1964992117324886349) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
