---
title: nano banana 试妆提示词：把参考图的妆容"画"到自己脸上（虚拟试妆）
slug: makeup-transfer
model: nano-banana
topics: [portrait, photo-edit]
needsRefImage: true
useCase: 看到喜欢的妆容（仿妆教程、彩妆广告、舞台妆）想知道自己化上是什么样子，上传自己的照片 + 妆容参考图，一键试妆。
prompt: |
  图 1 是我的照片，图 2 是妆容参考。
  把图 2 的妆容完整地化到图 1 人物脸上：包括[眼影、眼线、腮红、唇色]以及脸上的彩绘装饰。
  保持图 1 人物的五官、脸型、肤色底子、发型、姿势和背景不变，只改变妆容。
  妆面要贴合面部结构，有真实的粉质 / 光泽质感，不要像贴纸。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1962778069242126824
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"为图一人物化上图二的妆，还保持图一的姿势"；本站扩写为分项妆容变量，并补充保持五官与真实质感的约束
images:
  - 154-makeup-transfer-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case36
  license: Apache-2.0
verify:
  - 用素颜照 + 日常淡妆参考图实测，检查五官是否被改动
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：先传自己的照片（图 1），再传妆容参考图（图 2）。示例图左边是原图、中间小图是妆容参考、右边是结果。[眼影、眼线、腮红、唇色] 可以按需删减，比如只想试口红就改成"只把唇色换成图 2 的唇色"。

**常见问题**：
- 五官被"整容"：在末尾加"严格保持图 1 的五官比例，不要美颜、不要瘦脸"。
- 妆太浓：追问"把妆容浓度降低到 60%，更日常一点"。
- 参考图是侧脸：尽量选正脸、光线均匀的妆容参考图，效果最稳定。

**适合**：仿妆预览、拍照 / 婚礼前试妆、美妆博主出对比图；只使用自己或已获授权的人物照片。

### 英文原版

```
Apply the makeup from Image 2 to the character in Image 1, while maintaining the pose from Image 1.
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1962778069242126824) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
