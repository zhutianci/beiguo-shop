---
title: nano banana 一键修图提示词：平淡照片自动调色、提亮、重新构图
slug: auto-photo-enhance
model: nano-banana
topics: [photo-edit, photography]
needsRefImage: true
useCase: 手机随手拍的风景、街景、旅行照发灰发平时，上传原图让 nano banana 自动拉对比、提色彩、改光线并裁掉干扰元素，几秒得到"修过"的成片。
prompt: |
  这张照片太平淡了，请把它修得更出彩：
  1. 提高对比度，让暗部更通透、亮部不过曝；
  2. 提升色彩饱和度，整体色调偏[暖色黄昏]；
  3. 改善光线，让画面层次更丰富，主体更突出；
  4. 可以重新裁剪构图，删掉[路人、杂物、电线]等影响构图的细节。
  保持照片的真实感，不要变成插画或过度 HDR，画幅保持[原图比例]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1960528616573558864
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并拆成 4 条可执行的修图要求；新增色调、要删除的元素、画幅三个变量；补充"保持真实感、不要过度 HDR"的约束
images:
  - 151-auto-photo-enhance-1.jpg
  - 151-auto-photo-enhance-2.jpg
imageCredit:
  by: "@op7418"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case7
  license: Apache-2.0
verify:
  - 用 3 张不同场景（风景 / 室内 / 人像）的手机照实测，看是否会改变人物长相
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张原图，直接发送提示词即可。示例图第 1 张是修图结果，第 2 张是原图。[暖色黄昏] 可以换成"清透冷调""胶片感""日系低饱和"；如果不想让它裁剪，把第 4 条改成"不要裁剪，保持原构图"。

**常见问题**：
- 修得太"假"：把"提升饱和度"改成"轻微提升饱和度"，并加一句"像专业摄影师用 Lightroom 精修，而不是套滤镜"。
- 人像照片脸变了：在末尾补"人物五官和身材完全不变"。
- 想多出几版对比：追问"再给我一版更克制、更接近原片的"。

**适合**：旅行风景、街拍、美食、宠物照的快速出片；**不适合**：需要逐像素精确控制的商业精修。

### 英文原版

```
This photo is very boring and plain. Enhance it! Increase the contrast, boost the colors, and improve the lighting to make it richer,You can crop and delete details that affect the composition.
```

> 改编自 [@op7418](https://x.com/op7418/status/1960528616573558864) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
