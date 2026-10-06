---
title: nano banana 户型图转 3D 提示词：平面图一键变等轴测 3D 效果图
slug: floor-plan-3d
model: nano-banana
topics: [interior]
needsRefImage: true
useCase: 买房、租房、装修前拿到一张 CAD 户型图看不出空间感时，上传平面图，生成照片级的等轴测 3D 户型鸟瞰图，家具布局一目了然。
prompt: |
  把这张住宅平面图转换成照片级真实感的等轴测（isometric）3D 渲染图，从斜上方俯视整套房子，去掉屋顶。
  严格按照平面图的墙体位置、房间划分、门窗位置和比例建模，不要增加或删除房间。
  按图中标注布置家具：客厅、餐厅、卧室、厨房、卫生间的家具与平面图一致。
  室内风格：[现代简约，原木色地板 + 米白墙面]，柔和的自然光，干净的白色背景。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/op7418/status/1961329148271513695
  author: "@op7418"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 在仓库中文版基础上补充"去掉屋顶、严格按墙体和比例、不增删房间"的约束，新增室内风格变量
images:
  - 159-floor-plan-3d-1.jpg
  - 159-floor-plan-3d-2.jpg
imageCredit:
  by: "@op7418"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case61
  license: Apache-2.0
verify:
  - 用一张手机拍的纸质户型图实测，检查房间数量和位置是否对得上
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传户型图（CAD 截图、售楼处户型图、手机拍的图纸都可以），示例第 1 张是 3D 结果，第 2 张是输入的平面图。[现代简约……] 可以换成"奶油风""新中式""日式原木""工业风"，一次生成几种风格对比。

**常见问题**：
- 房间位置错乱：户型图越清晰越好；拍照的图纸先裁正、去掉阴影。也可以先追问"列出你识别到的房间和位置"，确认无误再生成。
- 比例不准：这是效果示意图，不能代替测量；家具尺寸以实测为准。
- 想看单个房间：接着追问"生成客厅的人视角效果图"，再配合 198 号"空房间放家具"使用。

**适合**：看房比较、装修沟通、租房分享；不适合作为施工依据。

### 英文原版

```
Convert this residential floor plan into an isometric, photo-realistic 3D rendering of the house.
```

> 改编自 [@op7418](https://x.com/op7418/status/1961329148271513695) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
