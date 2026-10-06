---
title: seedance 提示词：运动鞋广告视频（草地踢球慢动作 + 鞋款微距特写）
slug: seedance-football-boots-ad
model: seedance
topics: [product-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传鞋款和穿搭参考图，生成"空旷球场—系鞋带微距—带球跟拍—慢动作射门—产品收尾"的 15 秒时尚运动广告，球鞋、运动服饰都能套用。
prompt: |
  用我上传的参考图生成一条 15 秒的时尚运动鞋广告：参考图中的[金色金属质感足球鞋]、[白色及膝长袜]和[复古女性足球穿搭]全程保持一致，鞋子的款式、颜色、纹理和比例不得改变。
  环境：一片巨大、空旷的户外足球场，天然绿草，地平线完全开阔，天空是梦幻的[粉蓝色晚霞]。没有体育场、观众、建筑、看台和围栏。
  0–3 秒：电影感远景，一位年轻成年女球员独自站在草场中央，一只脚轻踩在足球上。镜头缓慢推近，阳光在球鞋上反射。
  3–6 秒：切到球鞋的戏剧性特写：鞋子踏进草地，鞋钉自然压入草皮，她系紧鞋带。微距运镜展示金属质感、走线、鞋底和鞋钉，球鞋是画面主角。
  6–10 秒：她在开阔的草场上快速带球，低机位跟拍她的脚和球鞋，变向、加速、控球，衣摆随动作自然摆动。
  10–13 秒：她助跑后大力射门，电影级慢动作捕捉鞋面触球的瞬间，草屑自然飞溅，足球飞向远处。
  13–15 秒：产品收尾，足球滚停在球鞋旁，她站在远处背景里，暖阳照亮鞋面，镜头缓慢推向球鞋，以清晰的产品特写结束。
  风格：奢华运动时尚大片，梦幻杂志感，自然光，真实的踢球动作和草地物理，浅景深，轻微胶片质感，照片级写实。
  球鞋全程保持一致；脚部不变形，没有多余肢体，足球不扭曲，不要 CGI 感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/soulful__ai/status/2106321511212544372
  author: "@soulful__ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并适度压缩；鞋款、袜子、穿搭、天空颜色改为变量；结尾两段约束合并为一句
images:
  - 204-seedance-football-boots-ad-1.jpg
imageCredit:
  by: "@soulful__ai"
  url: https://x.com/soulful__ai/status/2106321511212544372
  license: CC BY 4.0
verify:
  - 实测带球、射门时脚部和鞋钉是否崩坏，记录成功率
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：五段时间码对应"人—鞋—动作—高潮—产品"，适合 15 秒。只有 10 秒时，删掉 6–10 秒的带球段，直接接射门慢动作。

**怎么填变量**：换成跑鞋时，把"带球""射门"改成"[沿跑道加速冲刺]""[跨过水坑的慢动作]"；换成篮球鞋改"[运球急停跳投]"。参考图最好是鞋子的侧面白底图加一张全身穿搭图。

**常见失败与调整**：
- 快速带球时脚和球糊成一团：降低动作难度，写"轻推足球向前慢跑"；高速动作交给慢动作镜头。
- 背景冒出看台、观众：保留"没有体育场、观众……"这一整句否定，比单纯写"空旷"有效。
- 鞋子颜色前后不一致：参考图不要有强烈偏色，并删掉会改变色调的"晚霞"描述，改成"晴朗的午后"。

> 改编自 [@soulful__ai](https://x.com/soulful__ai/status/2106321511212544372) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a 15-second high-fashion football shoe advertisement using the uploaded reference images for the gold metallic football cleats, white knee-high socks, and vintage feminine football styling. Keep the footwear design, colors, textures, and proportions consistent throughout the entire video.

Environment: An enormous open outdoor football field, covered in lush natural green grass, with a completely open horizon and a beautiful dreamy pastel blue-and-pink sky. The field should feel spacious and untouched. No stadium, no spectators, no buildings, no bleachers, no indoor environment, no close fences.

0–3 sec: Wide cinematic shot of a young adult female footballer standing alone in the middle of the vast open field. She wears the same elegant vintage-inspired outfit from the reference images with white knee-high socks and the gold metallic football cleats. She gently places one foot on a football. Camera slowly moves toward her while sunlight reflects beautifully off the cleats.

3–6 sec: Cut to dramatic close-up shots of the gold cleats. Her foot steps firmly onto the grass, the studs press naturally into the turf, and she tightens the laces. Macro camera movement reveals the metallic texture, stitching, sole, and studs. Make the shoes the visual hero.

6–10 sec: She starts playing football across the completely open field, dribbling the ball quickly and confidently. Use a low-angle tracking camera focused on her feet and cleats as she changes direction, accelerates, and controls the ball. Her flowing outfit moves naturally with her movement.

10–13 sec: She takes a powerful run-up and strikes the football with the gold cleat. Capture the kick in cinematic slow motion, showing the shoe making contact with the ball, grass particles flying naturally, and the ball launching across the open field.

13–15 sec: Premium hero shot. The football rolls to a stop beside her gold cleats. She stands confidently in the background on the vast green field as warm sunlight catches the metallic shoes. Camera slowly pushes toward the cleats and ends on a sharp product-focused close-up.

Visual style: luxury sports fashion campaign, dreamy editorial photography, cinematic natural lighting, realistic football movement, realistic grass physics, elegant feminine styling, dynamic camera movement, macro shoe details, shallow depth of field, premium commercial quality, photorealistic, subtle film texture.

Important: Keep the gold football cleats identical throughout the video. No changing shoe design, no distorted feet, no extra limbs, no warped football, no artificial CGI appearance. The entire video takes place outdoors on one vast open football field.
```
