---
title: 俯拍写真提示词：90 度顶视角棚拍人像（大面积留白、杂志感）
slug: top-down-studio-portrait
model: gpt-image-2
topics: [portrait, photography]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张照片，生成从正上方俯拍、人物仰头看镜头的极简棚拍写真，适合个人主页头图、杂志风海报底图。
prompt: |
  超广角、90 度正上方俯拍的影棚人像：人物站在地面上，抬头直视镜头。严格保持参考图人物的五官、比例、皮肤质感和表情，不要改变发色和发型结构。
  构图：全身入镜，人物四周留出大面积空白，形成强烈的孤立感和图形感。
  人物：[戴圆形粗框眼镜]，穿[深棕色灯芯绒短袖衬衫]，里面是[浅米色质感毛衣]。皮肤自然有纹理，不过度磨皮；表情投入、略带好奇。
  背景：极简影棚地面，柔和的灰色渐变，边缘偏暗、人物正下方偏亮。
  光线：来自上方的柔和均匀顶光，阴影只用来勾勒五官和衣服褶皱，不要强烈反差。
  相机：ISO 150–200，光圈 f/1.2–1.4，快门 1/200 秒，高分辨率细节。
  调色：中性现代色调，对比柔和，干净利落。
  氛围：极简、现代、沉静，主体突出。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2069568331821318277
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；眼镜与服装改为变量；补充"人物站在地面上抬头"的空间说明
images:
  - 106-top-down-studio-portrait-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2069568331821318277
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 俯视透视下头身比例是否自然
  - 人脸是否与参考照一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[戴圆形粗框眼镜] 不戴眼镜就删掉；服装建议选和灰色背景有明度差的颜色（深棕、墨绿、酒红），从上往下看轮廓才清楚。

**常见问题**：
- 角度不够"顶"、变成普通平视：开头"90 度正上方俯拍"不要删，可再加"相机悬在人物头顶正上方约 3 米"。
- 头太大、腿太短：这是超广角俯拍的正常透视；想自然一点就把"超广角"改成"标准焦距"。
- 背景出现杂物：补"地面上除了人物和影子什么都没有"。

**适合 / 不适合**：适合单人、服装有质感的照片；多人合影和坐姿照片效果不稳定。

### 英文原版

```text
Full prompt: 

Ultra-wide angle, 90-degree top-down aerial studio portrait of a woman looking straight up at the camera. Strict identity preservation from reference image, do not alter face, proportions, skin texture, or expression.

Composition: full-body framing, large negative space surrounding the subject, dramatic isolation and graphic impact.

Subject: woman with round thick-framed stylish glasses. Wearing a deep dark brown short-sleeve button-up shirt in corduroy or textured fabric, with a light beige off-white textured sweater underneath. Natural hairstyle with visible texture and volume, do not alter hair color or structure. Natural realistic skin tone, visible texture, not over-smoothed. Expression: engaging, slightly curious or inquisitive.

Background: minimalist studio backdrop, soft gray gradient, darker at edges, lighter at center directly beneath the subject.

Lighting: soft uniform overhead lighting from above, subtle shadows defining facial features and clothing folds, even illumination, no harsh contrast.

Camera: ISO 150-200, aperture f/1.28, shutter speed 1/200s, high-resolution ultra-detailed.

Color grading: neutral modern tones, soft balanced contrast, clean contemporary look.

Mood: minimalist, modern, contemplative. Strong subject isolation and visual clarity.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2069568331821318277) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
