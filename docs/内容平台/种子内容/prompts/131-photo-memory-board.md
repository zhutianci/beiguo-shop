---
title: 照片拼贴海报提示词：上半张实拍 + 下半张手绘回忆手账（gpt-image-2）
slug: photo-memory-board
model: gpt-image-2
topics: [illustration, poster]
aspectRatio: "3:4"
needsRefImage: true
useCase: 上传一张生活照，生成"上半部分原照片 + 下半部分彩铅水彩手绘拼贴"的回忆海报，适合纪念日、旅行和 Vlog 封面。
prompt: |
  以我上传的照片为主要视觉参考，把它变成一张高级的"真实瞬间 + 手绘回忆板"杂志风海报。
  竖版 3:4，水平分成上下相等的两部分。
  上半部分 —— 写实照片：保留原图中的人物、脸、身份、发型、衣服、姿势、身材比例、物品和环境。保持高度写实：自然的皮肤纹理、真实光线、柔和的电影感景深、轻微暖调、优雅的生活方式摄影质感。不要无故改变人物身份或穿搭。
  下半部分 —— 手绘回忆拼贴：把上方照片中的重要元素转成迷人的手绘时尚 / 生活手账插画。用精致的彩铅 + 水彩速写重画人物，以及关键物品、衣服、配饰、花、食物饮料、家具、建筑、书、画作等照片中可辨认的细节。
  把这些插画元素自然地散布在温暖的象牙白纹理纸上：细腻的铅笔轮廓、淡淡的水彩、不完美的手绘笔触、柔和的粉彩点缀、浅粉 / 浅蓝 / 浅绿的速写痕迹、小爱心、小涂鸦和低调的装饰。插画要优雅、简约、怀旧、有手作感，而不是卡通。
  在插画区上方加一个手写英文花体小标题"[little moments]"，符合原照片的氛围；底部加一行很小的手写装饰文字"[a little memory]"。
  插画区要像私人的视觉日记 / 时尚杂志剪贴簿 / 回忆手账，同时每一个手绘元素都要和原照片对应。
  风格：精致的杂志剪贴簿，彩铅插画，细腻水彩，复古纸张质感，温馨生活方式，柔和粉彩，细微的不完美，构图优雅。
  构图：间距干净，留白平衡，不杂乱；写实上半部分与手绘下半部分自然衔接。
  重要：保持原照片可辨认，保留人物身份和主要细节；不要加入无关物品；避免过多文字、Logo、边框、贴纸或卡通渲染。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Sairah_0/status/2106287796042232218
  author: Sairah
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；两处手写文字改为变量；其余结构保留
images:
  - 131-photo-memory-board-1.jpg
  - 131-photo-memory-board-2.jpg
imageCredit:
  by: Sairah
  url: https://youmind.com/gpt-image-2-prompts?id=35852
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 下半部分手绘元素是否都能在上半照片中找到对应
  - 上半照片人物是否被改动
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[little moments] 和 [a little memory] 是手写小字，建议用简短英文（slow morning、weekend、our trip），中文手写字在这种画风里容易写错。想写中文就控制在 4 个字以内。

**常见问题**：
- 上半照片被"重画"：把"保持高度写实，不要改变人物身份"放到第一句。
- 下半部分元素太多太挤：加"只挑 5–7 个最有代表性的物件来画"。
- 画面像拼接得很生硬：保留"自然衔接"，也可加"两部分之间用一条撕纸边过渡"。

**适合**：有明确主体和若干小物件的照片（咖啡、花、包、书）；空旷风景照下半部分会没东西可画。

### 英文原版

```text
Use the uploaded reference photo as the primary visual reference and transform it into a premium “real-life moment + illustrated memory board” editorial poster.

Create a vertical 3:4 composition divided horizontally into two equal sections.

TOP HALF — REALISTIC PHOTO:
Preserve the original subject, face, identity, hairstyle, clothing, pose, body proportions, objects, and environment from the reference image. Keep the scene highly photorealistic with natural skin texture, realistic lighting, soft cinematic depth of field, subtle warm tones, and an elegant lifestyle/editorial photography aesthetic. Do not change the person’s identity or outfit unnecessarily.

BOTTOM HALF — HAND-DRAWN MEMORY COLLAGE:
Convert the important visual elements from the top photograph into a charming hand-drawn fashion/lifestyle scrapbook illustration. Recreate the subject as a delicate colored-pencil and watercolor sketch, along with the key objects, clothing, accessories, flowers, food/drinks, furniture, architecture, books, artwork, or other recognizable details from the scene.

Arrange these illustrated elements organically across a warm ivory/off-white textured paper background. Use delicate pencil outlines, subtle watercolor washes, imperfect hand-drawn strokes, soft pastel accents, light pink/blue/green sketch marks, tiny hearts, doodles, and understated decorative elements. Keep the illustrations elegant, minimal, nostalgic, and handmade rather than cartoonish.

Add a small handwritten cursive title near the top of the illustrated section that reflects the mood of the original photo, such as “little moments,” “slow morning,” “a little memory,” or another context-appropriate phrase. Add very small handwritten decorative text near the bottom.

The illustrated section should feel like a personal visual diary / fashion magazine scrapbook / memory journal, while still clearly connecting every illustrated element to the original photograph.

Style: sophisticated editorial scrapbook, colored-pencil illustration, delicate watercolor, vintage paper texture, cozy lifestyle aesthetic, soft pastel palette, subtle imperfections, elegant composition, premium Pinterest/editorial design, nostalgic and artistic.

Composition: clean spacing, balanced negative space, no clutter, seamless transition between the realistic photograph and illustrated memory section, realistic top half + hand-drawn bottom half, high detail, natural proportions.

Important: Keep the original photo recognizable and preserve the subject’s identity and major visual details. Do not introduce unrelated objects. Avoid excessive text, logos, borders, stickers, or cartoon-style rendering.
```

> 改编自 [Sairah](https://x.com/Sairah_0/status/2106287796042232218) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
