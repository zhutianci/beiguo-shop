---
title: nano banana Logo 立体化提示词：用材质球给平面 Logo 赋予 3D 材质（C4D 质感）
slug: logo-material-3d
model: nano-banana
topics: [logo]
needsRefImage: true
useCase: 品牌 Logo、字标只有平面版本，想要一张有质感的 3D 立体展示图（木纹、金属、玻璃、皮革……）用于封面、海报或社媒头图。
prompt: |
  图 1 是一个平面 Logo，图 2 是材质球。
  把图 2 的材质完整地应用到图 1 的 Logo 上，做成有厚度的 3D 立体物体：
  - Logo 的字形、轮廓和比例与图 1 完全一致，不增加、不删减笔画；
  - 材质的纹理、颜色、反光程度与图 2 一致；
  - 以 C4D / Octane 渲染风格呈现，轻微的[正面 15° 俯视]角度，有柔和的投影；
  - [深灰色]纯色背景，画面居中，画幅 [16:9]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1964995347505352794
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并扩写：补充字形不变、材质一致等约束，新增视角、背景色、画幅变量
images:
  - 171-logo-material-3d-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case60
  license: Apache-2.0
verify:
  - 用中文字标实测，检查笔画是否被改
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：图 1 传 Logo（黑白或单色、背景干净最好），图 2 传材质球——可以是 3D 软件里的材质球截图，也可以直接用一张材质照片（木板、拉丝金属、毛毡、大理石）。示例左侧是两张输入（字标 + 木编材质球），右侧是结果。

**常见问题**：
- 字母 / 笔画被改：加"逐笔保持图 1 的字形"；复杂中文 Logo 出错率更高，可以多生成几次。
- 材质太"假"：在提示词里补材质的物理特征，比如"拉丝不锈钢，有细密的横向拉丝纹和冷色反光"。
- 想要动态感：追问"让 Logo 悬浮并轻微倾斜，背景加景深"。

**适合**：品牌提案、视频封面、社媒头图、活动主视觉；只对自己有权使用的 Logo 操作。

### 英文原版

```
Apply the material from Image 2 to the logo in Image 1, present it as a 3D object, render in a C4D-like style, with a solid-color background.
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1964995347505352794) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
