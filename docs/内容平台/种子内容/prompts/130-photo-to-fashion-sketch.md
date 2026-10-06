---
title: 照片转手绘提示词：粉底墨绿线条的日韩生活速写插画（gpt-image-2）
slug: photo-to-fashion-sketch
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "4:5"
needsRefImage: true
useCase: 把和朋友的合照、街拍转成粉色底 + 墨绿线条的日韩文具风手绘速写，适合头像、朋友圈和小红书封面。
prompt: |
  把我上传的照片转成一张可爱的手绘时尚插画，同时保留原图的场景和构图。
  保留同样的人物、人数、姿势、身体位置、表情、衣服、配饰、发型、物品、饮料和整体取景，不要增加或删除重要元素。
  把写实照片转成极简的日韩生活速写插画：用松弛但笃定的[深墨绿色]墨线，带细微的手绘不完美。简化五官，但保留每个人可辨认的发型、眼镜、耳机、衣服轮廓和姿势。
  背景是柔和的[浅粉色]，插画主要用[深墨绿色]墨线绘制。把写实的纹理、阴影、车辆、建筑、路面和环境替换成简化的表现性线条和少量交叉排线，同时保留足够的环境细节，让原来的地点和构图仍可辨认。
  风格：可爱的杂志插画，日本文具美学，时尚速写，日常漫画风，不完美的笔触，干净的留白，极少细节，淡淡的复古感，手作感。
  配色：以[浅粉色]背景 + [深墨绿色]线稿为主，必要时只加极少的辅助色。不要照片感、不要 3D、不要光滑的数字厚涂。
  重要：保留原图的构图、透视、机位、姿势、比例、衣服、配饰和关键物品；结果要像插画师把这张照片直接画了一遍，而不是重新设计了一个场景。
  输出：干净的竖版插画，构图平衡，高分辨率，精致的手绘质感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Sairah_0/status/2100779368318701669
  author: Sairah
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并去掉重复的简短版本；背景色和线条色改为变量
images:
  - 130-photo-to-fashion-sketch-1.jpg
imageCredit:
  by: Sairah
  url: https://youmind.com/gpt-image-2-prompts?id=34934
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 人数与姿势是否和原照片一致
  - 换成"米黄底 + 深蓝线"等配色是否同样好看
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[浅粉色] 和 [深墨绿色] 是一组撞色，可以换成"米黄底 + 深蓝线""浅蓝底 + 砖红线"，记得每处都要同步改（提示词里出现了好几次）。

**常见问题**：
- 画成了彩色插画：重复"只用一种线条颜色"，并删掉"必要时加辅助色"。
- 人数不对、有人被画丢：照片里人物最好不超过 3 个，且不要有大面积遮挡。
- 背景细节太多：加"背景只保留最能说明地点的 2–3 个物件"。

**适合**：街拍、闺蜜合照、情侣照、带宠物出门的照片；纯风景照效果一般。

### 英文原版

```text
Transform the uploaded photo into a charming hand-drawn fashion illustration while preserving the original scene and composition.

Keep the same people, number of people, pose, body positioning, facial expressions, clothing, accessories, hairstyles, objects, drinks, and overall framing from the reference photo. Do not add or remove important elements.

Convert the realistic photograph into a minimal Japanese/Korean-inspired lifestyle sketch illustration, using loose but confident dark green ink linework with subtle hand-drawn imperfections. Simplify facial features while keeping each person’s recognizable hairstyle, glasses, headphones, clothing silhouette, and pose.

Use a soft pastel pink background with the illustration drawn primarily in deep forest-green ink. Replace realistic textures, shadows, vehicles, buildings, pavement, and surroundings with simplified expressive linework and selective cross-hatching. Keep enough environmental details to make the original location and composition recognizable.

Style: cute editorial illustration, Japanese stationery aesthetic, fashion sketch, casual slice-of-life manga drawing, imperfect pen strokes, clean negative space, minimal detailing, subtle vintage feel, handmade appearance.

Color treatment: predominantly pastel pink background + dark green line art, with very minimal secondary tones if needed. No photorealism, no 3D rendering, no glossy digital painting.

Important: preserve the original image’s composition, perspective, camera angle, poses, proportions, clothing, accessories, and key objects. The result should look like the exact photograph was redrawn by an illustrator, rather than redesigned into a different scene.

Output: clean vertical illustration, aesthetically balanced, high-resolution, polished hand-drawn finish.

Short version for image models:

Turn this photo into a cute hand-drawn Japanese lifestyle/fashion sketch. Preserve the exact people, poses, expressions, clothing, hairstyles, accessories, drinks, composition, camera angle and important background elements. Redraw everything with loose imperfect dark forest-green ink linework on a soft pastel pink background, using minimal cross-hatching and simplified details. Charming editorial stationery aesthetic, casual manga-inspired illustration, handmade pen texture, clean negative space, elegant and whimsical. Do not change the composition or add/remove subjects; make it look like the original photo was directly illustrated by hand.
```

> 改编自 [Sairah](https://x.com/Sairah_0/status/2100779368318701669) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
