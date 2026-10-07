---
title: "多机位提示词：一张照片生成同一场景 6 个机位的组图（俯拍 / 过肩 / 特写）（gpt-image-2）"
slug: one-photo-to-6-camera-angles-grid
model: gpt-image-2
topics: [photography]
aspectRatio: "3:2"
needsRefImage: true
useCase: "上传一张场景照片（访谈、播客、会议、产品陈列），生成 3×2 的六宫格：同一瞬间从 6 个机位拍摄——原始全景、正上方俯拍、两个反打过肩、低角度三分之四和面部特写，人物、道具、光线完全一致，适合视频分镜、拍摄预演和社媒组图。"
prompt: |
  以我上传的图片作为唯一依据，生成一张 3 列 × 2 行的六宫格图片：同一个场景的 6 张照片，像 6 台相机在同一瞬间从房间不同位置拍摄。
  锁定原图的一切：同样的人（脸、发型、肤色、眼镜、衣服和身材比例），同样的家具、道具、墙面、招牌（文字相同）、灯光布置和调色，同样的时间。不增、不删、不移动任何东西——每格之间只改变机位、镜头和取景。所有物体在房间里的位置不变，空间关系在各个角度之间保持一致。
  第 1 格（左上）：主全景——与原图相同的取景和机位，平视，35mm，完整场景可见。
  第 2 格（中上）：正上方俯拍——相机装在场景中心正上方垂直向下，24mm，像天花板摄像头一样看到家具、道具和人物的布局。
  第 3 格（右上）：从原图左侧人物身后拍的过肩镜头，看向右侧人物，50mm f/2.0，近处肩膀虚化，远处人物清晰。
  第 4 格（左下）：反打过肩——从右侧人物身后看向左侧人物，50mm f/2.0，近处肩膀虚化，远处人物清晰。
  第 5 格（中下）：低角度三分之四镜头——相机放在场景左前角接近地面的位置，微微仰拍，28mm，表现向后墙延伸的纵深。
  第 6 格（右下）：主要人物面部和上半身的特写，85mm f/1.8，平视，浅景深，背景柔和虚化，皮肤质感自然，眼中有眼神光。
  如果场景里只有一个人，过肩镜头改为从左侧和右侧拍的三分之四侧面；如果没有人，第 3、4、6 格以主要物体或家具组为主体。
  网格规则：6 格大小相同，中间是细细的白色间隔，没有边框、文字标签、数字、说明和水印。6 格摄影风格完全一致：照片级写实、同样的白平衡、曝光、调色、细微胶片颗粒，光线方向与原图一致，每格都像真实相机拍摄。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/meAsifAi/status/2095934699306893404
  author: "M. Asif"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；保留 6 个机位的镜头参数和\"锁定场景\"的约束"
images:
  - 3135-one-photo-to-6-camera-angles-grid-1.jpg
imageCredit:
  by: "M. Asif"
  url: https://youmind.com/gpt-image-2-prompts?id=33472
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这条没有方括号变量，关键是上传的照片：人物和道具都清楚、空间关系明确的照片效果最好（两人对谈、桌边会议、店铺一角）。请只上传你有权使用的照片，不要用他人的肖像。想要别的机位组合，可以把某一格换成"背后远景""手部特写""门口视角"。

示例图是一张六宫格：两人坐在扶手椅上录播客，背后墙上一块"[PODCAST NAME]"牌子；依次是全景、正上方俯拍、从男生肩后看女生、从女生肩后看男生、低角度全景和男生的近景特写，六格的人物、衣服、灯光都保持一致。

**常见问题**：
- 人物在不同格里长得不一样：这是最难的部分，可以减少到 4 格，或者把特写换成中景。
- 俯拍角度不对：强调"相机正对地面，90 度垂直向下"。
- 招牌文字变化：写"招牌文字逐字保留"，或者在原图里先遮掉文字。

**适合**：视频 / 播客拍摄预演、分镜参考、社媒多图组图、空间布置展示。

### 英文原版

```text
Using the attached image as the single source of truth, create ONE image that is a clean 3-column by 2-row grid of six photographs of the EXACT same scene, captured from six different camera positions, as if six cameras were placed around the room at the same instant.

Lock everything from the attached image: the same people with the same faces, hair, skin tone, glasses, clothing and body proportions; the same furniture, props, walls, signage with the same text, lighting setup and color grade; the same time of day. Nothing is added, removed, or rearranged — only the camera position, lens and framing change between panels. Every object stays in the same physical place in the room, so the spatial relationships remain consistent from angle to angle.

Panel 1 (top-left): Wide master shot — the same framing and camera position as the attached image, eye-level, 35mm lens, the full scene visible.

Panel 2 (top-center): High-angle top-down shot — camera mounted directly above the center of the scene looking straight down at the floor, 24mm lens, showing the layout of the furniture, props and people from above, like a ceiling camera.

Panel 3 (top-right): Over-the-shoulder shot from behind the subject on the LEFT of the original image, looking across at the subject on the RIGHT, 50mm lens at f/2.0, the near shoulder soft in the foreground, the far subject sharp.

Panel 4 (bottom-left): Reverse over-the-shoulder shot from behind the subject on the RIGHT of the original image, looking across at the subject on the LEFT, 50mm lens at f/2.0, near shoulder soft, far subject sharp.

Panel 5 (bottom-center): Low-angle three-quarter shot — camera placed low near floor height at the front-left corner of the scene, tilted slightly upward, 28mm lens, showing the scene with depth toward the back wall.

Panel 6 (bottom-right): Tight close-up on the main subject's face and upper body, 85mm lens at f/1.8, eye-level, shallow depth of field, background softly blurred, natural skin texture, catchlights in the eyes.

If the scene contains only one person, apply the over-the-shoulder panels as a three-quarter side angle from the left and from the right of that person instead. If the scene contains no people, treat the main object or furniture group as the subject for panels 3, 4 and 6.

Grid rules: six equal-sized panels, thin clean white gutters between them, no borders, no text labels, no numbers, no captions, no watermarks inside the image. All six panels share identical photographic style: photorealistic, same white balance, same exposure, same color grade, same subtle film grain, consistent lighting direction as in the attached image. Sharp, professional, real-camera look in every panel.
```

> 改编自 [M. Asif](https://x.com/meAsifAi/status/2095934699306893404) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
