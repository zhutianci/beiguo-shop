---
title: nano banana 包装盒提示词：上传刀版图（模切线），自动折成 3D 盒子效果图
slug: dieline-box-render
model: nano-banana
topics: [ecommerce]
modelLabel: Nano Banana Pro
needsRefImage: true
useCase: 包装设计师只有平面刀版 / 展开图，想快速看折好后的立体盒子效果，或给客户提案、做电商预售图时，上传刀版图即可。
prompt: |
  把我上传的刀版图（模切线展开图）组装成一个完美折叠的 3D [纸盒]：
  - 每个面板的位置准确，边缘利落，折痕清晰，文字不变形；
  - 盒子上的所有图案、文字、配色与刀版图上的印刷内容完全一致；
  - 盒子竖立放置，以精致的[四分之三]角度展示，能同时看到正面、侧面和顶面；
  - 极简的高端摄影棚环境：柔和的[中性灰]背景、漫射光、细腻的阴影，不加任何其他道具；
  - 超写实细节，真实的色彩，[哑光卡纸]质感，高端杂志级的视觉效果。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/Salmaaboukarr/status/1994017531699278056
  author: "@Salmaaboukarr"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 在仓库中文译文基础上整理为分项清单；新增盒型、展示角度、背景色、纸张材质变量；补充"能同时看到三个面"的说明
images:
  - 182-dieline-box-render-1.jpg
  - 182-dieline-box-render-2.jpg
imageCredit:
  by: "@Salmaaboukarr"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case40
  license: Apache-2.0
verify:
  - 用一张异形盒（天地盖 / 抽屉盒）的刀版图实测
  - 仓库只收录了中文译文，英文原文需打开原帖核对
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传刀版图（PDF 导出成图片即可，出血线、模切线、折线最好用不同颜色区分）。示例第 1 张是折好的面霜包装盒效果，第 2 张是输入的刀版展开图。[纸盒] 可以写具体盒型，如"插底盒""飞机盒""天地盖礼盒"。

**常见问题**：
- 面板位置折错：刀版越规整越好；复杂结构可以在提示词里说明"正面是印有产品名的那一面"。
- 小字变形：成分表等小字仅作示意，打样以设计文件为准。
- 想要场景图：把背景改成"放在浴室大理石台面上，旁边有绿植和毛巾"。

**适合**：包装提案、电商预售主图、作品集展示；正式生产前仍需实物打样确认结构。

### 原版（仓库收录的中文译文）

```
将模切线组装成一个完美折叠的3D盒子，确保面板位置精准、边缘清晰、文字无变形。所有图案均需与模切线上的印刷完全一致。在简约的高端摄影棚环境中，以柔和的中性背景、漫射光和微妙的阴影渲染盒子，无需任何额外道具。以精致的四分之三角度展示盒子竖立的形态。呈现超逼真的细节、真实的色彩、哑光纸板质感、清晰的折痕，以及高端的编辑美感。
```

> 改编自 [@Salmaaboukarr](https://x.com/Salmaaboukarr/status/1994017531699278056) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
