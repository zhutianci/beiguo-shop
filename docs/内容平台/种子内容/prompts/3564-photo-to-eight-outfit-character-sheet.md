---
title: "ai角色设定图提示词：上传照片生成同一人物 8 套日常穿搭设定表（gpt-image-2）"
slug: photo-to-eight-outfit-character-sheet
model: gpt-image-2
topics: [character, fashion, illustration]
aspectRatio: "16:9"
needsRefImage: true
useCase: "上传一张人物照片，得到一张白底的 2×4 角色设定表：同一个人换 8 套日常穿搭，每格表情和姿势都不同，细线平涂的动画设定稿风格。"
prompt: |
  把上传的照片作为唯一的人物参考，制作一张专业的角色设定表：同一个人重复出现 8 次，排成[2 行 4 列]的整齐网格，背景为[纯白色]。
  一致性：不要画成不同的人。8 格都要保留照片里人物的身份特征——脸型、五官印象、发型、年龄感、体型、肤色、自然的体态和整体气质。
  每格内容：一个全身站姿，比例一致、大小一致。8 格之间只改变服装、表情、姿势和小配饰。
  服装：[休闲的韩系街头穿搭]，[夏季]款式，从这些单品里搭配——轻薄外套、短袖衬衫、宽松 T 恤、短裤、阔腿长裤、运动鞋、双肩包、帆布托特包、棒球帽和极简小饰品。每一套都要真实、好看、适合日常出门。
  表情和姿势：每格不同且自然，例如平静、微笑、惊讶、自信、害羞、俏皮、若有所思、有点不耐烦；姿势放松，不夸张。
  风格：2020 年代动画前期的角色设定稿，受日系漫画影响的手绘插画，细而干净的线条，轮廓清晰但带一点手绘的不完美感，服装细节丰富，低饱和的复古平涂配色，轻微纸张纹理，时尚杂志的气质。
  只用平涂色块：不要厚重阴影，不要柔和渐变，不要写实光影，不要戏剧化投影，不要照片质感。
  构图干净、均衡、专业，像动画前期制作用的角色表，不加文字和标注。画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Kashberg_0/status/2069741023149142416
  author: "@Kashberg_0"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分段；网格、背景、穿搭风格、季节、画幅设为变量；合并了重复的\"保持同一人\"描述；补充\"不加文字和标注\"。只收录了 1080px 的整表图，另两张单格小图尺寸不足 500px 未用。"
images:
  - 3564-photo-to-eight-outfit-character-sheet-1.jpg
imageCredit:
  by: "@Kashberg_0"
  url: https://youmind.com/gpt-image-2-prompts?id=26648
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张脸部清晰、最好带全身或半身的照片（用自己的，或已取得本人同意的）。[2 行 4 列] 是网格，想少一点可写"2 行 3 列"，同时把正文里的"8"改成 6；[纯白色] 是背景；[休闲的韩系街头穿搭] 是整体风格，可换"日系城市男孩风""通勤简约风""户外机能风"；[夏季] 换成别的季节后，记得把单品清单换成毛衣、大衣、靴子等。

示例图是白底上两排共 8 个全身立绘：同一位黑色长发的女生，分别穿蓝衬衫配白阔腿裤、白 T 配牛仔短裤、灰色运动裤、条纹 T 恤等，手里换着托特包、双肩包、冰咖啡和棒球帽，表情有微笑、惊讶、比耶、抱臂；线条很细，颜色是低饱和的平涂，没有文字。

**常见问题**：
- 后几格的脸越画越不像：加"每一格的脸型、刘海和发长与第一格完全相同"，或者减到 6 格。
- 出现阴影和渐变：把"只用平涂色块"那一段挪到最前面。
- 几套衣服撞款：直接列出 8 套搭配，一行一套。

**适合**：穿搭博主的一周穿搭图、原创角色的私服设定、漫画主角的日常服参考；不适合需要写实照片效果的场景。

### 英文原版

```text
Use the uploaded photo as the only character reference and create a professional 2x4 character design sheet. The image must show the same person from the uploaded photo repeated in 8 variations. Do not create different people. Preserve the character’s identity, facial impression, hairstyle, face shape, age impression, body type, skin tone, natural posture, and overall personality across all panels. Arrange the character in a clean {argument name="layout" default="2x4 grid layout"} on a {argument name="background" default="pure white background"}. Each panel should show a full-body standing pose with consistent proportions and the same recognizable character design. Create 8 different variations of the same character, changing only the outfit, expression, pose, and small accessories. Use {argument name="fashion style" default="casual modern Korean street fashion"} with summer styling: lightweight jacket, short-sleeve shirt, oversized T-shirt, shorts, loose pants, sneakers, backpack, tote bag, cap, or minimal accessories. Keep all outfits realistic, stylish, and suitable for everyday urban life. Each variation should have a different natural expression and pose, such as calm, smiling, surprised, confident, shy, playful, thoughtful, or slightly annoyed. Poses should feel relaxed and natural, not exaggerated. Style: 2020s animation character design sheet, Japanese manga-influenced illustration, hand-drawn sketch, thin clean linework, crisp outlines, subtle imperfect contours, high-detail fashion illustration, muted retro flat color palette, subtle paper texture, editorial fashion mood. Use flat colors only. No heavy shading, no soft gradients, no realistic lighting, no dramatic shadows, no photorealism. Keep the composition clean, balanced, and professional, like an animation pre-production character sheet. Aspect ratio: 16:9 horizontal.
```

> 改编自 [@Kashberg_0](https://x.com/Kashberg_0/status/2069741023149142416) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
