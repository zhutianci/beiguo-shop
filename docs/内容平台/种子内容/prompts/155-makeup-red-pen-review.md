---
title: nano banana 妆容分析提示词：AI 用红笔在照片上圈出可以改进的地方
slug: makeup-red-pen-review
model: nano-banana
topics: [portrait]
needsRefImage: true
useCase: 化完妆拍一张正脸照，让 AI 像化妆老师一样用红笔在照片上直接圈画、写批注，指出眉形、底妆、腮红等哪里还能改进。
prompt: |
  你是一位专业化妆师。请分析这张人像照片的妆容，直接在照片上用红色马克笔做批注：
  - 用红圈圈出可以改进的部位（如眉形、眼妆、底妆、腮红、修容、唇妆）；
  - 每个圈旁边用简短的[中文]手写字写出问题和改进建议；
  - 可以用红色箭头、虚线示意更合适的眉峰位置或腮红范围。
  保持原照片内容不变，只叠加红笔批注，字迹清晰可读，不要遮挡五官。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/ZHO_ZHO_ZHO/status/1962784384693739621
  author: "@ZHO_ZHO_ZHO"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为一句"分析这张图片，用红笔标出可以改进的地方"；本站加上化妆师角色、批注部位清单、批注语言变量和"不遮挡五官"的约束
images:
  - 155-makeup-red-pen-review-1.jpg
  - 155-makeup-red-pen-review-2.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case37
  license: Apache-2.0
verify:
  - 实测中文批注是否会出现错字、乱码
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张光线均匀的正脸妆后照。示例第 1 张是 AI 批注结果，第 2 张是原图。[中文] 可以改成"英文"——图像模型写英文通常比写中文准确，中文批注偶尔会有错字，重要建议可以再让它用文字列一遍。

**常见问题**：
- 批注太多、太乱：加"最多标注 5 处最关键的问题"。
- 只想看某一项：把清单改成"只分析眉形"或"只分析底妆"。
- 想看改好之后的样子：追问"按这些建议，生成一张修改后的妆容效果图"，就能和 154 号"试妆"提示词连起来用。

**延伸**：同样的写法也能点评穿搭、海报、摄影作品，把"化妆师"换成对应的专业角色即可（见 175 号"照片红笔批注"）。

### 英文原版

```
Analyze this image. Use red pen to denote where you can improve
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/1962784384693739621) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
