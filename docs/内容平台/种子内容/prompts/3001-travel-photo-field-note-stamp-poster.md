---
title: "旅行照片做成手账海报提示词：左边原图、右边橡皮章与打字机笔记（gpt-image-2）"
slug: travel-photo-field-note-stamp-poster
model: gpt-image-2
topics: [poster, photo-edit]
aspectRatio: "4:3"
needsRefImage: true
useCase: "上传旅行照片，左侧原样保留照片，右侧是旧纸上的手工橡皮章图案和打字机字体的\"旅行田野笔记\"，做成有收藏感的横版旅行海报。"
prompt: |
  为我上传的每一张照片各生成一张独立的 [4:3 横版海报]，一张照片对应一张图，不要拼贴。
  左侧 58%：忠实保留原照片——主体、建筑、地形、人物、植物、构图、光线、阴影、质感和自然色彩都不变，只做轻微的杂志感调色和细腻胶片颗粒。不要变形、重画、替换或移动任何内容。
  右侧 42%：带细微纤维和颗粒的暖白色旧纸，哑光质感、轻微磨损，留出大量空白；左右之间不要有明显分割线。
  分析照片，只取最有辨识度的地点元素（建筑、山、道路、海岸线、树、天际线等），做一枚小小的多色橡皮章图案，去掉人群、车辆和杂乱细节。印章放在右侧中下部，高度只占右侧的 [30%～38%]。
  用 2～4 种取自照片的低饱和专色。每一层都要像真的手工盖上去：雕刻纹理、压力不均、干墨、露出纸纹、边缘断裂、颗粒状墨迹，以及 1～2 毫米的轻微套色错位。不要光滑的矢量图形，也不要画成完整的风景插画。
  在右上方加几行小号打字机字体的田野笔记：
  [地点英文名]
  No. 编号
  3 个简短的英文关键词
  年份
  Date: [日期]
  文字克制、准确、带一点不完美。
  风格：安静、有触感、写实，像建筑师或旅行作家收藏的旅行笔记。
  避免：明显分割线、圆形印章、邮票齿孔、火漆、贴纸拼贴、旅游模板、Logo、卡通 / 3D 风格、光泽渐变、过度饱和、文字过多、改动原照片。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MissDelulu9/status/2094291717503795452
  author: "Eesha"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；画幅、印章高度、地点和日期改为变量；合并重复的禁止项，补充每张照片单独出图的说明"
images:
  - 3001-travel-photo-field-note-stamp-poster-1.jpg
  - 3001-travel-photo-field-note-stamp-poster-2.jpg
imageCredit:
  by: "Eesha"
  url: https://youmind.com/gpt-image-2-prompts?id=33011
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：一次可以上传多张照片，模型会逐张出图。[地点英文名] 写成"Positano, Italy"这种格式；[日期] 写拍摄日期，如"27 May 2025"。想要中文笔记，把"英文"改成"中文"并写"打字机风格的中文宋体"，但中文的打字机味会弱一些。印章太大就把比例改成 25%。

示例图是两张：意大利波西塔诺海岸和奥地利哈尔施塔特湖畔小镇，左边原照片几乎不变，右边米色纸上是红、蓝、绿套色的小镇橡皮章，上方 5 行打字机字体的地点、编号、关键词和日期。

**常见问题**：
- 原照片被重画、颜色变了：重复"左侧照片保持原样，不要重绘"，或先只上传一张照片。
- 印章像矢量图标：加"可见的雕刻刀痕、干墨飞白、套色错位"。
- 出现了分割线或圆形邮戳：在避免项里保留这两条，必要时再强调一次。

**适合**：旅行照片整理、旅行手账、公众号游记配图、可打印的旅行纪念卡。

### 英文原版

```text
Create a separate {argument name="aspect ratio" default="4:3 landscape poster"} for each uploaded photo, one photo per output, no collage.

Left 58%: Preserve the original photo faithfully,subject identity, architecture, terrain, people, plants, composition, lighting, shadows, textures, and natural colors. Only subtle editorial color grading and fine film grain. No distortion, redrawing, replacement, or shifting.

Right 42%: Warm off-white aged paper with subtle fibers, grain, matte texture, light wear, and generous blank whitespace. No visible dividing line.

Analyze the photo and create a small multi-color rubber stamp using only the most recognizable location elements—architecture, mountains, roads, shoreline, trees, skyline, etc. Remove crowds, vehicles, repetitive details, and clutter. Place the stamp in the lower-middle of the right side, using only {argument name="stamp height" default="30–38%"} of its height.

Use 2–4 muted spot inks inspired by the photo. Make each layer look genuinely hand-stamped with carved texture, uneven pressure, dry ink, paper show-through, fractured edges, granular ink, and subtle 1–2 mm misregistration. Avoid smooth vector graphics or full landscape illustrations.

Add small typewriter-style field-note text:

{argument name="location" default="Location English name"}

No. Number

3 short English keywords

Gregorian year

Date: {argument name="date" default="[Enter date here]"}

Keep typography restrained, accurate, and slightly imperfect.

Style: quiet, tactile, realistic, collectible travel field notes by an architect/travel writer.

Avoid: obvious divider lines, circular seals, postage perforations, wax seals, sticker collages, tourist templates, logos, cartoon/3D styles, glossy gradients, oversaturation, excessive text, clutter, or altering the original photo.
```

> 改编自 [Eesha](https://x.com/MissDelulu9/status/2094291717503795452) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
