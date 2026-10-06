---
title: 贴纸拼贴提示词：产品照变成手账风贴纸拼贴图（小红书封面）
slug: sticker-collage-photo
model: gpt-image-2
topics: [sticker, photo-edit]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张产品或饮品照片，保持主体不变，周围加上便利贴、胶带、手绘涂鸦和贴纸标签，适合小红书封面、门店种草图。
prompt: |
  编辑这张图片，同时保留原来的主体、构图和背景。
  把画面变成"贴纸现实"拼贴风：
  - 加入看起来像真实贴纸、剪纸和用胶带贴上去的便签纸的元素，层层叠在照片上；
  - 位置略有错落、彼此交叠，营造自然的手账剪贴簿感。
  混合手绘涂鸦和贴纸式图形，例如小图标、形状和标签；标签文字写：[每日能量]、[抹茶控]、[本周最爱]。
  加入细微的纸张纹理、撕纸边缘和胶带细节，增强真实感。
  确保[产品]仍是画面的视觉焦点，拼贴元素围绕它展开。
  构图要丰富有层次，但依然好看、不杂乱。
  最终效果像一张被改造成创意剪贴簿的真实照片。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/oggii_0/status/2056061748806090940
  author: "@oggii_0"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；补充标签文字和主体两个变量；示例标签改为中文
imageBrief: 用一张自拍的饮品或桌面产品照作输入（无他人品牌标识），生成 1 张；附原图对比。原帖示例图带第三方水印，未收录。
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文贴纸文字是否有错字
  - 主体产品是否被遮挡或改动
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：标签文字是点睛之笔，写 3 条以内、每条 4–6 个字，内容可以是卖点（"0 蔗糖"）、情绪（"续命水"）或活动（"第二杯半价"）。[产品] 写清楚主体是什么，避免模型把注意力放到背景。

**常见问题**：
- 贴纸太多盖住产品：加"拼贴元素只出现在画面四周，中间三分之一保持干净"。
- 中文贴纸写错：减少文字贴纸，多用图形贴纸（星星、爱心、云朵）。
- 风格太幼稚：把"手绘涂鸦"改成"极简线条图标"，配色写"大地色系"。

**适合**：饮品、甜点、文具、护肤品等小物件；人像照片也能用，把"产品"换成"人物"即可。

### 英文原版

```text
Edit this image while preserving the original subject, composition, and background.

Transform the scene into a “sticker reality” collage:

* Add elements that look like physical stickers, paper cutouts, and taped notes layered over the image
* Use slight misalignment and overlapping placement to create a natural scrapbook feel

Incorporate hand-drawn doodles mixed with sticker-like graphics such as icons, shapes, and labels.

Add subtle paper textures, torn edges, and tape details to enhance realism.

Ensure the product remains the main focal point while the collage elements build around it.

Balance the composition so it feels rich and layered but still visually pleasing, not cluttered.

The final result should feel like a real photo transformed into a creative scrapbook composition.
```

> 改编自 [@oggii_0](https://x.com/oggii_0/status/2056061748806090940) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
