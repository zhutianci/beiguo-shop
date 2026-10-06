---
title: 羊毛毡提示词：照片里的人 / 宠物变成手工羊毛毡小玩偶（gpt-image-2）
slug: needle-felt-miniature
model: gpt-image-2
topics: [figurine, photo-edit]
aspectRatio: "1:1"
needsRefImage: true
useCase: 上传人物或宠物照片，生成毛茸茸的手工羊毛毡玩偶微距照，适合做头像、纪念卡片、毛毡定制的效果预览。
prompt: |
  把我上传照片里的[主体]变成一个手工戳戳乐羊毛毡小玩偶。
  材质：天然羊毛条，能看到针戳的纹理、毛茸茸的表面和手工接缝；眼睛是小黑珠子或简单的毛毡圆点。
  造型：头稍大、四肢简化，可爱有趣。保留原图的配色，但用羊毛质感让颜色更柔和。衣服变成简化的毛毡版本，带小布扣和缝线细节；配饰也做成迷你毛毡道具。
  场景：[原图中的场景]也用毛毡做成小道具。
  相机：微距特写，柔和的影棚光，温暖高光和柔和阴影；背景是干净、虚化的中性色手作工作台，浅景深（f/2.8）。
  高清细节，照片级的羊毛纹理，有温暖治愈的角色魅力。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2066206049464660301
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；"主体"和场景改为变量；把原文"Pixar 风格魅力"改为通用描述
images:
  - 124-needle-felt-miniature-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2066206049464660301
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 宠物照片的毛色、花纹是否被保留
  - 多人合照是否会漏人
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[主体] 写"我家的橘猫""照片里的小女孩"等；[原图中的场景] 可写"小船和海浪""沙发和抱枕"，示例图就是一只黑猫坐在毛毡小船上。

**常见问题**：
- 像普通毛绒玩具、不像羊毛毡：强调"表面有针戳留下的细小凹坑和翘起的纤维"。
- 宠物花纹变了：在第一句后加"严格保留毛色和花纹的位置"。
- 人物不像本人：羊毛毡本来就高度简化，保留发型、衣服颜色和标志性配饰（眼镜、帽子）最有辨识度。

**适合**：宠物、小朋友、情侣合照（2 人以内）；定制实物前可先用这张图和手作店沟通效果。

### 英文原版

```text
Transform the subject into a handcrafted needle-felted wool miniature. Material: organic roving wool with visible needle-punch textures, soft fuzzy surface, and handcrafted seams. Eyes are tiny black bead eyes or simple felted circles.

Style rules: slightly oversized head with simplified limbs and a cute, charming aesthetic. Retain the original colors from the source image but soften them with wool texture. Clothing becomes simplified felt versions of the original outfits with tiny fabric buttons and stitched details. Accessories are recreated as miniature felted props.

Camera: macro photography, close-up shot. Soft studio lighting with warm highlights and gentle shadows. Clean, out-of-focus bokeh background in a neutral craft studio setting. Shallow depth of field (f/2.8). High fidelity, 8k resolution, photorealistic wool texture, Pixar-like character charm.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2066206049464660301) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
