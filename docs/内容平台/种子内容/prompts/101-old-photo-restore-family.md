---
title: AI老照片修复提示词：破损褪色的老照片修复成清晰彩色照（gpt-image-2）
slug: old-photo-restore-family
model: gpt-image-2
topics: [old-photo, photo-edit]
needsRefImage: true
useCase: 家里划痕、折痕、霉斑严重的黑白老照片，修成像刚冲印出来的彩色照片，适合给长辈做纪念、做相册。
prompt: |
  把我上传的这张破损老照片修复成一张干净、清晰的彩色照片。
  修复要求：
  1. 去掉所有划痕、折痕、霉斑、污渍、药膜脱落和纸张磨损，合理补全缺失的部分；
  2. 严格保持原照片的构图、人物数量、姿势、表情、发型和服装，不要换脸、不要美颜、不要改变人物年龄；
  3. 按照[1960 年代]的服装与室内环境合理上色：肤色自然，衣服和背景颜色真实、克制；
  4. 保留老照片该有的质感：轻微胶片颗粒、柔和的焦点、温暖的怀旧色调，看起来像被专业修复过的老相片，而不是现代数码照；
  5. 背景里的[窗帘和窗框]按原图还原，看不清的地方合理补全，但不要添加原图没有的物品。
  输出与原图相同的比例，不加文字、不加边框。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/gdb/status/2048184797374325031
  author: "@gdb"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 原文是对"修复后照片"的描述，改写为可直接使用的"上传老照片 → 修复上色"指令；年代与背景细节改为变量；补充了不换脸、不添加物品、保留老照片质感的约束
images:
  - 101-old-photo-restore-family-2.jpg
  - 101-old-photo-restore-family-1.jpg
imageCredit:
  by: "@gdb"
  url: https://x.com/gdb/status/2048184797374325031
  license: CC0 1.0
verify:
  - 用 3 张破损程度不同的老照片实测，记录人脸是否被改成"另一个人"
  - 上色是否偏艳、是否出现现代服饰
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么用**：先把老照片拍正、拍清楚（手机正对照片、关掉闪光灯避免反光），整张上传。[1960 年代] 填照片大概的拍摄年代，模型会据此推断衣服和家具的颜色；[窗帘和窗框] 换成你照片背景里实际有的东西。

**常见问题**：
- 脸被"修"成了另一个人：第 2 条不要删，必要时再加一句"面部五官以原图为准，宁可略模糊也不要重画"。
- 颜色太艳、像现代照片：在第 4 条后补"整体饱和度降低一些，偏暖黄"。
- 人脸缺了一大块：AI 只能脑补，结果未必像本人，修完请让家里长辈确认。

**迭代**：一次只改一处，例如"其他不变，只把上衣颜色改成深蓝色"。

**示例图说明**：第 1 张是原帖中的破损原图（作者对成人面部做了遮挡），第 2 张是修复后的效果。

### 英文原版

原帖展示的是修复前后对比；下面是收录仓库根据修复后效果整理的描述性提示词。

```text
A restored vintage family snapshot, photographed indoors in soft natural light, showing a {argument name="adult subject" default="young mother"} seated and holding a {argument name="child subject" default="toddler"} on her lap in a close, centered waist-up portrait. The adult has short softly curled auburn hair in a voluminous 1960s-inspired bob, wears a sleeveless black dress and a thin gold necklace, and wraps both arms protectively around the child. The child has fine light blond hair and wears a plain white long-sleeve outfit. Compose the image with a warm nostalgic color cast, gentle film softness, subtle grain, and the look of a carefully repaired old printed photograph. Place them in front of a cream-colored curtain patterned with small brown teddy bear motifs, with a softly blurred interior window frame visible along the top background. Preserve realistic skin tones, natural posture, and the intimate family-photo feeling, as if an old damaged photograph has been professionally reimagined and restored. Square crop, centered composition, shallow depth of field, authentic analog photo texture, no modern styling, no text.
```

> 改编自 [@gdb](https://x.com/gdb/status/2048184797374325031) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
