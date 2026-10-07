---
title: 角色设定提示词：上传照片变 3D Q 版人物穿搭图鉴，单品拆解+色板+转面+姿势（gpt-image-2）
slug: chibi-outfit-infographic
model: gpt-image-2
topics: [fashion, character]
needsRefImage: true
aspectRatio: "3:4"
useCase: 想把自己 / 原创角色做成可爱的 Q 版形象并配一套专属穿搭时，上传一张参考图，生成白底 lookbook 式图鉴：中间全身 Q 版主图，四周是单品拆解、面料、配饰特写、色板、转面和姿势。
prompt: |
  根据上传的参考图制作一张时尚穿搭信息图。参考图主要用来理解角色的身份、发型、五官、色彩印象、性格和整体气质。
  - 角色：把人物转换成精致的 3D Q 版形象——大头小身、灵动的大眼睛、柔软可爱的比例；保留可识别的特征（发型、发色、瞳色、五官印象、整体气场）；
  - 穿搭：不要照搬参考图里的衣服，而是为这个角色设计一套全新的原创搭配，契合它的性格、配色和氛围，风格方向是[温柔甜美]；可包含精心挑选的上衣、下装、鞋子、配饰、材质和廓形；
  - 版式：画面中央是全身主姿势，四周是杂志式标注模块——穿搭概念"[穿搭主题名]"、单品拆解、面料小样、搭配要点、配饰特写、色板、小尺寸转面图和姿势参考；
  - 风格：干净的白色背景，柔和的光线，高级 lookbook 排版，细节丰富的 3D 渲染，可爱又精致。
  画幅[3:4]竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/chi_vc_/status/2061619597821022407
  author: "@chi_vc_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；补充了"风格方向"和"穿搭主题名"两个变量；保留"不照搬原图衣服、重新设计"的核心要求；补充了常见问题与改法
images:
  - 3259-chibi-outfit-infographic-1.jpg
imageCredit:
  by: "@chi_vc_"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case322/output.jpg
  license: CC0 1.0
verify:
  - 示例图标注为英文（标题"SOFT DREAM"），页面需注明；中文主题名出一次看标题是否清楚
  - 提醒用户只上传本人或已获授权的照片
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：先上传一张清楚的正面或半身照（自拍、原创角色立绘都可以）。[温柔甜美] 换成你想要的方向，例如"酷飒街头""学院风""户外机能"；[穿搭主题名] 写一个短名字，如"春日野餐""雨天通勤"。示例图标题是"SOFT DREAM"：中间是棕色短发、粉色大眼的 3D Q 版女孩，穿粉色麻花针织开衫、格纹短裙、白袜和乐福鞋，背米白小包；右边是开衫、衬衫、裙子、包、鞋的单品拆解，左边是概念、色板和四种面料小样，底部有四个姿势和一排转面图。

**常见问题与调整**：
- 不像本人：加"保留参考图的发型轮廓、刘海形状和发色，眼睛颜色一致"。
- 衣服照搬了原图：再强调"不要使用参考图中的任何衣服"。
- 模块太多字太小：删掉"姿势参考"或"转面图"，留 5 个模块。
- 想要 2D 风格：把"3D 渲染"改成"日系平涂插画，干净线稿"。

**适合**：个人头像 / 原创角色周边设计、穿搭类社媒内容、给角色做设定参考；不适合用他人照片未经同意生成。

### 英文原版

```
Create a fashion infographic based on the reference image. Use the reference image mainly to understand the character’s identity, hairstyle, facial features, color impression, personality, and overall mood.

Transform the character into a polished 3D chibi character with a large head, small body, expressive eyes, and soft cute proportions. Keep the character’s recognizable features, such as hairstyle, hair color, eye color, facial impression, and overall aura, while designing a new original outfit that naturally suits the character’s atmosphere.

Do not simply copy the clothing from the reference image. Instead, create a coordinated fashion style that feels appropriate for this character’s personality, color palette, and visual mood. The outfit may include thoughtfully chosen clothing, shoes, accessories, textures, and silhouettes that enhance the character’s charm.

Show a full-body main pose in the center, surrounded by editorial callouts: outfit concept, clothing item breakdown, fabric texture swatches, styling points, accessory close-ups, color palette, and a small pose guide. Use a clean white background, soft lighting, premium lookbook layout, ultra-detailed 3D rendering, stylish fashion editorial design, cute but refined.
```

> 改编自 [@chi_vc_](https://x.com/chi_vc_/status/2061619597821022407) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
