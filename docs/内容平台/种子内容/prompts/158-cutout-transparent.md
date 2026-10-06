---
title: nano banana 抠图提示词：一句话把主体抠出来放到透明背景
slug: cutout-transparent
model: nano-banana
topics: [photo-edit, ecommerce]
needsRefImage: true
useCase: 需要把画面里的人物、商品或某个角色单独抠出来做海报、贴图、商品主图时，上传原图，让 nano banana 提取指定主体并去掉背景。
prompt: |
  从这张图中提取[四个武士]，完整保留主体的轮廓、发丝、衣服边缘和手持物品，不要裁掉任何部分。
  去掉其余所有背景，把主体放在透明背景上（如果无法输出透明通道，就放在纯白背景上）。
  主体的颜色、质感和细节与原图保持一致，边缘干净自然，没有残留的背景色块。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/nglprz/status/1961494974555394068
  author: "@nglprz"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并扩写：补充保留边缘细节、不裁切、无法透明时退回纯白底等要求
images:
  - 158-cutout-transparent-1.jpg
  - 158-cutout-transparent-2.jpg
imageCredit:
  by: "@nglprz"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case49
  license: Apache-2.0
verify:
  - 下载结果后检查是否真的有透明通道（很多情况下是"画出来的棋盘格"而不是真正透明）
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传原图，把 [四个武士] 换成你要抠的对象，例如"左边那只橘猫""桌上的香水瓶"。示例第 1 张是结果，第 2 张是原图（一幅插画）。

**常见坑**：
- **"透明背景"可能是假的**：图像模型经常把灰白棋盘格当成图案画出来，下载后放进 PPT / PS 一看才发现不透明。稳妥的做法是让它输出纯白或纯绿背景，再用 PS、Canva、remove.bg 等工具一键去底。
- 发丝、毛边被吃掉：加"保留每一根发丝 / 毛发的细节"。
- 主体被"重画"：加"不要重绘主体，只去掉背景"。

**适合**：电商白底图、海报素材、贴纸素材、PPT 配图的前期处理。

### 英文原版

```
extract the [samurai] and put transparent background
```

> 改编自 [@nglprz](https://x.com/nglprz/status/1961494974555394068) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
