---
title: "ai老照片修复提示词：模糊宠物照高清修复，毛发胡须根根分明（gpt-image-2）"
slug: blurry-pet-photo-restoration
model: gpt-image-2
topics: [old-photo, photography]
aspectRatio: "1:1"
needsRefImage: true
useCase: "手机里的宠物旧照模糊、有噪点或被压缩过，想修清楚用于打印和做相册：上传原图，保持姿势、花纹、构图和背景不变，只还原眼睛、毛发、胡须等细节。"
prompt: |
  请修复并放大我上传的这张宠物旧照，输出一张超高清、细节真实的成片，画面内容以原图为准。
  - 100% 保留照片里[小猫]的长相特征、姿势、取景、毛色花纹和整体构图，不要换角度、不要重新摆姿势；
  - 去除模糊、噪点、马赛克和压缩痕迹，同时还原真实的细节：清澈有光泽的眼睛、一根根分明的毛发、胡须、耳朵内侧的纹理、鼻头细节、自然的阴影，以及[前景柔软的织物]；
  - 保持原来的[纯蓝色背景]和[米色前景]不变，只把它们处理得干净、平滑、像影棚拍摄的质感；
  - 成片要照片级真实：对比度适中偏高，光线自然，焦点清晰地落在[小猫]的脸上；
  - 不要添加任何物体、文字、水印，不要改变风格，不要把它画成插画或 3D。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/zrebroia/status/2070212758289711340
  author: "@zrebroia"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主体、背景、前景改为变量（原文写死为小猫、蓝色背景、米色前景）；\"8K\"等画质堆砌词精简为\"超高清\"；新增\"不要画成插画或 3D\"的约束。"
images:
  - 3475-blurry-pet-photo-restoration-1.jpg
imageCredit:
  by: "@zrebroia"
  url: https://youmind.com/gpt-image-2-prompts?id=26809
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张模糊、有噪点或被压缩过的宠物照片。[小猫] 换成照片里的主体，如"柯基""垂耳兔""鹦鹉"；[纯蓝色背景]、[米色前景]、[前景柔软的织物] 按你的照片如实改写，例如"客厅沙发背景""木地板前景"；照片里没有前景遮挡物，就把相关两处删掉。把背景写清楚，是为了让模型不要擅自换场景。

示例图只有修复后的成图：一只白底、头顶和耳朵带灰褐色斑块的小猫，从一块虚化的米色织物后面探出头，正面看向镜头；眼睛清澈有反光，胡须和耳边的绒毛根根分明，背景是干净的纯蓝色。

**常见问题**：
- 花纹或眼睛颜色被改了：补一句"毛色斑块的位置和眼睛颜色与原图完全一致"。
- 毛发锐得像假的：加"不要过度锐化，保留自然的柔焦过渡"。
- 原图太小太糊：模型只能按常识补细节，结果是"合理的想象"，未必和真实的它一模一样。

**适合**：把糊掉的宠物旧照修清楚，用于打印、做相册或纪念品。人物老照片的修复要另外强调"五官不变、不美颜"，不建议直接套用这一条。

### 英文原版

```text
Using the provided reference image, upscale and restore it into an ultra-premium 8K cinematic-quality photograph. Preserve 100% of the kitten’s identity, pose, framing, color pattern, and overall composition. Remove blur, noise, pixelation, and compression artifacts while recovering realistic microdetails: sharp glossy eyes, individual fur strands, whiskers, ear texture, nose detail, natural shadows, and the soft fabric foreground. Keep the same simple blue background and beige foreground, but make them clean, smooth, and studio-quality. Make the result photorealistic with high contrast, natural lighting, crisp focus on the kitten’s face, and no added objects, text, watermark, or style change.
```

> 改编自 [@zrebroia](https://x.com/zrebroia/status/2070212758289711340) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
