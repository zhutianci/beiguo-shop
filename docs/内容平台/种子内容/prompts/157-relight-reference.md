---
title: nano banana 打光提示词：用一张光影参考图，给人像重新打光
slug: relight-reference
model: nano-banana
topics: [photography, portrait, photo-edit]
needsRefImage: true
useCase: 人像照光线平、没氛围时，上传原图和一张"光影参考"（石膏像、3D 灰模、明暗示意图都行），让人物换成参考图里的布光效果。
prompt: |
  图 1 是人物照片，图 2 是光影参考。
  按照图 2 的光影分布给图 1 的人物重新打光：图 2 中深色的区域是阴影，浅色的区域是受光面。
  光源方向、明暗交界线位置、阴影软硬程度都尽量与图 2 一致，营造[伦勃朗光]般的立体感。
  只参考图 2 的光影，不参考图 2 的外貌。人物的长相、发型、服装、姿势不变，背景可随光线一起变暗或变亮，保持照片真实质感。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1961779457372602725
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为"图一人物变成图二光影，深色为暗"；本站扩写了光源方向、明暗交界线、阴影软硬等要点，新增布光风格变量，并加上"不参考外貌"的约束
images:
  - 157-relight-reference-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case44
  license: Apache-2.0
verify:
  - 用一张带人脸的剧照作光影参考实测，看是否会把参考图人物的长相带过来
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：图 1 传人像，图 2 传光影参考。示例中左上是光影参考（半明半暗的素描头像）、左下是原图、右侧是重新打光后的结果。光影参考最好是"只有明暗、没有具体人物特征"的图。

**常见问题**：
- 长相被换成参考图里的脸：参考图人脸特征太明显时容易串，换成灰模，或者把"只参考光影"这句放到提示词最前面。
- 光太硬：把 [伦勃朗光] 换成"柔和的窗光""侧逆光""蝴蝶光"。
- 想要彩色光：追问"受光面改成暖橙色，阴影偏青蓝色"。

**适合**：头像精修、作品集人像、海报主视觉；学布光时也可以用它快速对比不同光位的效果。

### 英文原版

```
Change the character from Image 1 to the lighting from Image 2, with dark areas as shadows
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1961779457372602725) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
