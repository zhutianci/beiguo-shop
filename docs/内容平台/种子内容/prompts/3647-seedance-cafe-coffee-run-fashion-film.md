---
title: seedance 提示词：咖啡馆穿搭短片（背后跟拍入店—坐下喝咖啡细节特写—起身离开 · 角色设定图锁定）
slug: seedance-cafe-coffee-run-fashion-film
model: seedance
topics: [cinematic, image-to-video, fashion]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张人物设定图（脸 + 全身穿搭），生成 15 秒"走进咖啡馆—坐下喝咖啡—起身离开"的生活方式时尚短片，适合服装品牌上新、穿搭博主、饰品（耳环、发夹、包）细节展示。
prompt: |
  格式：16:9 横屏，15 秒，写实真人，电影感生活方式时尚短片。
  人物一致性：以 @图片1 的角色设定图为唯一人物参考。女生的脸、五官比例、[长卷发]、发型、发夹、金色耳环、体型、[酒红色细条纹衬衫]、阔腿深色牛仔裤和白色球鞋在每个镜头都完全一致，不改服装、发型、年龄和外貌。
  镜头 1（0–5 秒）：午后暖阳下一间温馨的乡村风咖啡馆。女生背着小肩包自然地走进来，镜头在腰部高度从背后跟拍，她的长卷发随步伐轻轻摆动；她走向窗边一张洒满阳光的小木桌。运镜：平滑的手持跟拍，浅景深。
  镜头 2（5–10 秒）：她舒服地坐下，跷起腿，拿起一只白色陶瓷咖啡杯，放松地喝一口。切到亲密的细节特写：金色耳环、握着杯子的手指、条纹衬衫、飘动的头发。运镜：轻微推进，真实的手持微动，暖阳洒在她的脸和头发上。
  镜头 3（10–15 秒）：侧脸镜头，她安静地望向窗外，好像看到了什么，露出一个自然的浅笑，然后起身走向门口。最后一个镜头从背后跟拍她走进温暖的日光里，头发自然摆动。
  视觉风格：柔和的女性生活方式美学，温馨的欧式咖啡馆氛围，暖米色和棕色环境，自然光，真实皮肤质感，细致发丝，细微胶片颗粒，真实不做作的表情，低调的时尚大片感。
  不要夸张摆拍，不要刻意慢动作，不要字幕和水印。
negativePrompt: 服装变化，发型变化，人物换脸，夸张摆拍，手指畸形，杯子穿模，字幕，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/Caden_Flux/status/2102920998165110878
  author: "@Caden_Flux"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；发型和上衣改为变量；\"角色设定图\"改为 @图片1 写法"
images:
  - 3647-seedance-cafe-coffee-run-fashion-film-1.jpg
imageCredit:
  by: "@Caden_Flux"
  url: https://x.com/Caden_Flux/status/2102920998165110878
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录三个镜头之间服装细节（条纹、耳环）的一致性
  - 参考图请使用虚构人物或已获授权的模特照片
  - 确认原帖仍可访问
---
**时长与镜头**：15 秒三个镜头，每个 5 秒：背后跟拍入店 → 坐下喝咖啡 + 细节特写 → 侧脸、起身、背后跟拍离开。首尾都是背影跟拍，中间才给脸和细节——这是时尚短片常见的"藏脸"手法，既有氛围，也降低了人脸一致性的难度。

**怎么用**：@图片1 最好是一张"角色设定图"：同一张图里有正脸、侧脸和全身穿搭（可以先用图像模型生成）。提示词里把要展示的单品一件件点名（耳环、发夹、衬衫条纹、牛仔裤、球鞋），细节特写镜头就会去拍它们。服装品牌可以把镜头 2 的特写对象换成自家主推单品。

**怎么填变量**：[长卷发] [酒红色细条纹衬衫] 按设定图里的真实穿搭写；场景"咖啡馆"可以换成"书店""花店""美术馆"。

**常见失败与调整**：
- 坐下后衣服换了颜色：在每个镜头开头加一句"同样的酒红色条纹衬衫"。
- 跷腿时腿部畸形：改成"双腿自然并拢坐着"。
- 动作变成慢动作走秀：保留"不要刻意慢动作"。

> 改编自 [@Caden_Flux](https://x.com/Caden_Flux/status/2102920998165110878) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
FORMAT: 16:9 landscape, 15 seconds, photorealistic live-action, cinematic lifestyle fashion film.

CHARACTER CONSISTENCY:
Use the uploaded character sheet as the master character reference. Keep the girl’s face, facial proportions, long wavy brown hair, hairstyle, hair clip, gold earrings, body proportions, burgundy pinstriped fitted shirt, wide-leg dark denim, and white sneakers exactly consistent throughout every shot. Do not change her outfit, hairstyle, age, or appearance.
SHOT 1 — 0:00–0:05

A cozy rustic café in warm afternoon sunlight. The girl enters naturally carrying a small shoulder bag. Camera follows her from behind at waist height as her long wavy brown hair moves gently while she walks. She approaches a small wooden table near a sunlit window.

Camera: smooth handheld tracking shot, natural movement, shallow depth of field.

SHOT 2 — 0:05–0:10

She sits comfortably, crosses one leg over the other, picks up a simple white ceramic coffee cup, and takes a relaxed sip. Cut to intimate close-ups of her gold earrings, fingers around the cup, burgundy striped shirt, and flowing hair.

Camera: subtle push-in, realistic handheld micro-movement, warm sunlight across her face and hair.

SHOT 3 — 0:10–0:15

Side-profile shot as she looks peacefully toward the café window. She notices something outside, gives a tiny natural smile, then stands and walks toward the door. Final shot follows her from behind as she exits into warm daylight, her hair moving naturally.

VISUAL STYLE

Soft feminine lifestyle aesthetic, cozy European café atmosphere, warm beige and brown surroundings, natural sunlight, realistic skin texture, detailed hair strands, subtle film grain, authentic candid expressions, understated fashion editorial feeling.

IMPORTANT: No exaggerated posing, no slow motion, no beauty-filter effect, no outfit changes, no face changes, no additional accessories, no cartoon/CGI appearance. Keep the performance natural and effortless.

16:9 LANDSCAPE • 15 SECONDS • PHOTOREALISTIC • CINEMATIC • NATURAL CAMERA MOVEMENT
```
