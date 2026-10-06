---
title: 职业头像提示词：一张照片生成 4 宫格头像（正脸 / 特写 / 侧脸）
slug: headshot-4-grid
model: gpt-image-2
topics: [id-photo, portrait]
aspectRatio: "1:1"
needsRefImage: true
useCase: 上传一张清晰照片，一次得到 4 个角度的干净背景头像，方便挑一张做简历、工牌、社交平台头像。
prompt: |
  以我上传的照片为人物参考，保持五官、脸型、发型、[眼镜]和胡须等特征完全一致，生成一张 2×2 四宫格的人像摄影作品。
  背景：干净的[浅灰色]纯色背景，四格统一。
  左上：正脸半身像，直视镜头，表情平和自然；
  右上：眼部特写，看得清虹膜和皮肤纹理；
  左下：镜头略低的角度，表情含蓄，柔和的阴影；
  右下：侧脸，自然看向画面外。
  光线：柔和的漫射自然光，暖中性色调，浅景深。
  皮肤真实，保留毛孔和雀斑，轻度修图；85mm 镜头，高端杂志人像风格，构图干净。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Taaruk_/status/2050429694890389779
  author: "@Taaruk_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文是描述一位虚构男性的四宫格，改为"以上传照片为参考"；眼镜、背景色改为变量；保留四格分工
images:
  - 108-headshot-4-grid-1.jpg
imageCredit:
  by: "@Taaruk_"
  url: https://x.com/Taaruk_/status/2050429694890389779
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 四格是否像同一个人
  - 左上正脸能否直接裁出来当头像用
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[眼镜] 不戴就删掉；[浅灰色] 可以换成白色、浅蓝、米色。想要更正式，在最后加"穿深色西装外套、白衬衫"。

**常见问题**：
- 四格人物不一致：参考照要清晰正脸；在开头加"四格必须是同一个人"。
- 眼部特写太诡异：把右上改成"微笑的正脸近景"。
- 拿来直接当证件照：四宫格适合挑头像；正式证件照有尺寸和底色要求，请用本站证件照提示词另行生成。

**迭代**：挑出最满意的一格，再追问"把左上这张单独生成为 1:1 头像，背景改成白色"。

### 英文原版

```text
GPT IMAGE 2 ON CHATGPT Prompt: Editorial portrait photography arranged in a 2x2 grid layout featuring the same man with round tortoiseshell glasses, natural look, light beard, soft neutral background. Top-left: front-facing portrait with direct eye contact, calm expression. Top-right: extreme macro close-up of eye behind glasses, ultra-detailed iris and skin texture. Bottom-left: slightly lower angle portrait, subtle expression, soft shadows. Bottom-right: side profile portrait, natural pose, looking away. Soft diffused natural lighting, warm neutral tones, shallow depth of field, ultra-realistic skin texture with visible pores and freckles, minimal retouching, 85mm lens, high-end editorial photography style, clean composition, 4K
```

> 改编自 [@Taaruk_](https://x.com/Taaruk_/status/2050429694890389779) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
