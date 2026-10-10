---
title: "宠物表情包提示词：一张猫咪照片生成 6 个软萌 3D 表情贴纸（gpt-image-2）"
slug: pet-photo-to-3d-sticker-pack
model: gpt-image-2
topics: [sticker]
aspectRatio: "3:2"
needsRefImage: true
useCase: "上传一张自家猫狗的照片，保留毛色和长相，生成 6 个半写实 3D 卡通风格的表情包姿势（端坐、偷看、举爪、睡觉、扑跳、打招呼），适合做宠物专属微信表情包和周边。"
prompt: |
  以参考照片里的小猫为形象，在纯白背景上生成一张干净的微信风格表情包预览图。
  把真实照片变成柔软、半写实的可爱 3D / 卡通小灰猫：毛茸茸、圆滚滚的比例，温柔有表现力的肢体语言；保留小猫整体的灰色毛色、小耳朵、娃娃脸和柔弱的样子。
  版式：恰好 6 个独立的贴纸姿势，3×2 网格，间距宽松，没有边框。
  6 个姿势：
  1. 正面端坐，两只前爪并拢，尾巴卷在身边；
  2. 趴低身体往前偷看，眼睛睁得圆圆的，又调皮又胆小；
  3. 端坐举起一只爪子，露出粉黑相间的肉垫；
  4. 蜷成一团安静地睡觉，闭着眼，尾巴绕着身体；
  5. 两只前爪向前扑跳起来，带小动作线和淡淡的椭圆影子；
  6. 后腿站立，两只前爪向外举起，露出肉垫，开心地打招呼。
  不要任何文字。整张图精致可爱、角色设计一致，适合作为完整的表情包预览。
  共 [6] 个贴纸，背景[纯白]，画风[柔和半写实 3D 卡通]，形象来自[参考照片里的小灰猫]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/nanxi0412/status/2066472112001544508
  author: "南溪"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；贴纸数量、背景色、画风、角色改为变量；删去原文\"在部分贴纸脸上加灰色方块\"的奇怪要求（示例图中也没有）"
images:
  - 3105-pet-photo-to-3d-sticker-pack-1.jpg
imageCredit:
  by: "南溪"
  url: https://youmind.com/gpt-image-2-prompts?id=25811
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张光线好、正面清楚的宠物照片（毛色和花纹要看得清）；[参考照片里的小灰猫] 改成你家宠物的描述，如"参考照片里的橘白柯基"；[6] 可以改成 9 或 12，姿势清单相应增加（"吃饭""翻肚皮""生气炸毛"）。想配字时，在每个姿势后写"上方配字：XX"。

示例图是白底上 3×2 排列的 6 只毛茸茸小灰猫：端坐、趴着偷看、举起一只露出肉垫的爪子、蜷成一团睡觉、向前扑跳、站起来举爪打招呼，眼睛圆圆的，毛发质感柔软。

**常见问题**：
- 不像自家宠物：在提示词里补充特征（"左耳有白斑""蓝眼睛"）。
- 姿势之间体型不一：加"6 个姿势体型、毛色完全一致"。
- 上架表情平台：需要切成单张、按平台尺寸导出并做透明底。

**适合**：宠物专属表情包、宠物周边（贴纸、钥匙扣）、宠物店社媒、纪念礼物。

### 英文原版

```text
Using REFERENCE_0 as the kitten identity, create a clean WeChat-style sticker-pack preview sheet on a plain white background. Transform the real photo into a soft, semi-realistic cute 3D/cartoon gray kitten with plush fur, round proportions, and gentle expressive body language, while preserving the kitten’s overall gray color, small ears, baby face, and soft fragile look.

Layout: Arrange exactly 6 separate sticker poses in a 3-by-2 grid with generous white spacing and no borders.

Sticker poses, exactly 6:
1. Sitting upright facing forward, paws together, tail curled beside the body.
2. Crouching low and peeking forward with wide eyes, playful and timid.
3. Sitting upright with one paw raised high, showing pink-and-dark paw pads.
4. Curled up sleeping peacefully, eyes closed, tail wrapped around body.
5. Jumping upward with both paws forward, small motion lines and a faint oval shadow underneath.
6. Standing on hind legs with both paws raised outward, showing paw pads, cheerful greeting pose.

Add a solid medium-gray square placeholder over the face area of poses 1, 3, 5, and 6 only, as if censoring or reserving space for future text/expressions. Do not add any text. Keep the sheet polished, adorable, consistent in character design, and suitable for a finished sticker/emoticon set preview. Use {argument name="sticker count" default="6"} stickers, with {argument name="background color" default="plain white"}, in a {argument name="art style" default="soft semi-realistic cute 3D cartoon"} style, based on {argument name="character" default="the gray kitten from the reference photo"}.
```

> 改编自 [南溪](https://x.com/nanxi0412/status/2066472112001544508) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
