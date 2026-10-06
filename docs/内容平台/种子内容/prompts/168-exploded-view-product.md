---
title: nano banana 产品爆炸图提示词：相机、耳机等数码产品拆解分层展示
slug: exploded-view-product
model: nano-banana
topics: [infographic, ecommerce]
needsRefImage: false
useCase: 做产品详情页、科普文章、拆机测评封面时，生成一张"零件悬浮分层"的爆炸图，直观展示产品内部结构和工艺。
prompt: |
  一台[数码单反相机]的爆炸分解图（exploded view）：所有零件沿同一条轴线依次悬浮展开，包括[镜头组、滤镜、图像传感器、电路板]、[快门组件、取景器、按钮、螺丝和外壳]。
  零件排列整齐、间距均匀，保持正确的装配顺序和相对位置，能看出它们是怎么组装在一起的。
  保留产品的[红色点缀]配色细节。
  纯白背景，柔和的棚拍光和细腻的投影，超写实产品渲染，画幅 [16:9]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/AIimagined/status/1961431851245211958
  author: "@AIimagined"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文；把产品、零件清单、配色细节变成变量；补充"沿轴线排列、保持装配顺序"的构图要求和背景、光线、画幅
images:
  - 168-exploded-view-product-1.jpg
imageCredit:
  by: "@AIimagined"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case47
  license: Apache-2.0
verify:
  - 换成"无线耳机""机械键盘"各实测一次
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把 [数码单反相机] 换成你的产品，并在零件清单里写上它真实存在的主要零件，越贴近真实结构越可信。也可以上传自己产品的照片，在开头加"参考上传图片中的产品外观"。

**常见问题**：
- 零件是"编"的：模型会补出看起来合理但并不存在的零件，用于宣传时请让工程师核对，或者把清单写得更完整。
- 太乱：加"零件数量控制在 15 个以内，只展示主要部件"。
- 想要标注：追问"给每个零件加细线引出的中文标签"，就变成了信息图（另见 185 号"技术注释信息图"）。

**适合**：详情页卖点图、拆机科普、课程封面；不适合作为维修或装配说明。

### 英文原版

```
Exploded view of a DSLR showing all its accessories and internal components such as lens, filter,  internal components, lens, sensor, screws, buttons, viewfinder, housing, and circuit board. Maintain red accents of the DSLR
```

> 改编自 [@AIimagined](https://x.com/AIimagined/status/1961431851245211958) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
