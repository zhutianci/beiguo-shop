---
title: nano banana 文字转图标提示词：把纯文字说明图一键变成象形图标（Pictogram）
slug: text-diagram-pictogram
model: nano-banana
topics: [infographic, ppt]
needsRefImage: true
useCase: PPT 页面、指示牌、活动流程图里全是文字不好看时，上传文字版截图，让 nano banana 给每个词配上统一风格的象形图标。
prompt: |
  把这张只有文字的说明图转换成象形图标（pictogram）版本：
  - 为图中的每一个词语设计一个简洁的[黑色单色]象形图标，图标放在文字上方；
  - 保留原来的文字，位置和排列顺序与原图一致；
  - 所有图标风格统一：[线宽一致的扁平剪影]，类似公共场所导视系统；
  - 白色背景，整体干净、易读，适合放进 PPT。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/nobisiro_2023/status/1968677481486914022
  author: "@nobisiro_2023"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为一句"将此说明图转换为象形图"；本站补充保留文字、图标位置、风格统一、配色变量等要求
images:
  - 174-text-diagram-pictogram-1.png
  - 174-text-diagram-pictogram-2.png
imageCredit:
  by: "@nobisiro_2023"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case106
  license: Apache-2.0
verify:
  - 用一张 8 个词以上的中文流程图实测，看是否漏词
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：截一张只有文字的图上传（Word / PPT 截图都行）。示例第 1 张是结果，第 2 张是输入：日文的"祭典、散步、烟花、公园、购物"五个词，被配上了对应的图标。

**常见问题**：
- 文字被改错：中文多字词容易出错，可以要求"图标下方的文字可以省略"，出图后自己在 PPT 里加文字，最稳。
- 图标风格不统一：在 [线宽一致的扁平剪影] 里写得更具体，如"2px 圆角线条图标，类似 iOS 系统图标"。
- 想要彩色：把 [黑色单色] 改成"品牌主色 #1E6FFF 单色"或"马卡龙多色"。

**适合**：PPT 美化、活动流程、门店导视、儿童识字卡。

### 英文原版

```
Convert this explanatory diagram into pictograms.
```

> 改编自 [@nobisiro_2023](https://x.com/nobisiro_2023/status/1968677481486914022) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
