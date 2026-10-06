---
title: 街拍提示词：雨天路口凸面反光镜里的闪光灯自拍（gpt-image-2）
slug: convex-mirror-selfie
model: gpt-image-2
topics: [portrait, photography]
aspectRatio: "9:16"
needsRefImage: true
useCase: 上传一张人像，生成"在路口凸面镜前用手机闪光灯自拍"的鱼眼街拍，适合做个人头像或氛围感竖图。
prompt: |
  我会上传一张人像，只用它确定人物的五官、脸型、发型、发色、肤色和身材比例；不要照搬原图的衣服、背景、姿势、光线和画质。
  生成一张超写实的户外凸面镜自拍，9:16 竖版。人物站在路边一面红色边框的大号圆形交通凸面镜前，用装饰过手机壳的手机开闪光灯自拍，手机挡住一部分脸。
  穿搭：上身[深色宽松拉链卫衣]配[白色短款印花 T 恤]，下身[宽松牛仔裤]和[白色运动鞋]。
  背景：[雨后傍晚的十字路口]，湿漉漉的柏油路、斑马线、行道树、灰蓝色天空、远处昏黄的路灯，一辆模糊驶过的电动车。
  镜面有灰尘和水渍，闪光灯在镜面上形成强烈反光，带真实的鱼眼畸变；像随手拍的手机照片，皮肤质感自然。
  不要：动漫、CG、3D 渲染、娃娃脸、塑料皮肤、过度磨皮、畸形的手、多余手指、重复的人、过曝的脸、重度美颜滤镜、影棚光、干净完美的镜子、文字、Logo、水印、界面元素。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Shinning1010/status/2056168101545386430
  author: "@Shinning1010"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文与负面提示词译为中文并合并；穿搭与背景场景改为变量
images:
  - 105-convex-mirror-selfie-1.jpg
imageCredit:
  by: "@Shinning1010"
  url: https://x.com/Shinning1010/status/2056168101545386430
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 镜面鱼眼畸变下人脸是否仍像参考照
  - 手部与手机是否出现畸形
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：穿搭写 3–4 件单品即可；背景可以换成"晴天午后的老街拐角""夜晚便利店门口"，但保留"路口 + 凸面镜"这一核心。参考照最好是清晰的正脸或微侧脸。

**常见问题**：
- 人物直接站在街上、看不出是镜子里：补一句"整个画面就是镜面里的倒影，镜子的红色边框在画面边缘清晰可见"。
- 脸被手机全挡住：改成"手机只挡住下巴"。
- 太精致像海报：负面提示词里的"影棚光、干净完美的镜子"一定保留。

**迭代**：换背景比换人物更稳，先固定人物，再逐个尝试雨天、雪天、黄昏。

### 英文原版

```text
Upload one portrait as the identity reference. Use it only for the subject’s facial identity, face shape, hairstyle, hair color, skin tone, and natural body proportions. Do not copy the original portrait’s clothes, background, pose, lighting, or image quality.

Create a hyper-realistic outdoor convex traffic mirror selfie, 9:16 vertical composition. The subject stands in front of a large round roadside safety mirror with a red rim, taking a flash selfie with a decorated phone case, phone partially covering the face. Use the uploaded portrait only for identity and hairstyle. Keep a casual youthful outfit: dark oversized zip hoodie, cropped white graphic tee, loose jeans, white sneakers. Rainy dusk street intersection background, wet asphalt, zebra crossing, trees, soft blue-gray sky, faint streetlights, one blurred passing scooter, dirty mirror surface with dust and water spots, strong camera flash glare, realistic fisheye distortion, candid smartphone snapshot, natural skin texture, real-life street photography, no watermark.

Negative Prompt:
anime, cartoon, CGI, 3D render, doll face, plastic skin, over-smoothed skin, fake eyes, bad anatomy, distorted hands, extra fingers, broken phone, duplicate person, messy face, unreadable facial features, overexposed face, low resolution, heavy beauty filter, studio lighting, clean perfect mirror, text, logo, watermark, UI elements, poster design, artificial background
```

> 改编自 [@Shinning1010](https://x.com/Shinning1010/status/2056168101545386430) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
