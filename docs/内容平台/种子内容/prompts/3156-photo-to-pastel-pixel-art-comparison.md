---
title: "AI像素画生成提示词：风景照片转粉彩治愈系像素画（左右对比图）（gpt-image-2）"
slug: photo-to-pastel-pixel-art-comparison
model: gpt-image-2
topics: [photo-edit, game-art]
aspectRatio: "16:9"
needsRefImage: false
useCase: "生成一张左右对比图：左边是写实的海边风景照，右边是同一场景的低分辨率粉彩像素画，配小爱心、星星和像素小字，适合做像素风头像 / 壁纸、治愈系社媒图和像素画教学。"
prompt: |
  生成一张干净的前后对比图：一张真实的海边照片被转化成柔和治愈色的像素画。场景是[阳光下的海边公路]，路边有橙色的凸面反光镜，蓝色大海，远处是雪山。（如果我上传了照片，就用我的照片作为左边的原图。）
  版式：恰好 2 个竖向面板左右并排——左边是写实照片原图，右边是像素画重构，正中分割，没有边框。
  左边：明亮饱和的写实海岸风景：蓝天、大朵白云、碧绿的海、远处的雪山、低矮的混凝土海堤和橙色的反光镜杆。2 面可见的凸面镜：左中边缘 1 面完整的圆镜，最左边缘 1 面被裁掉一半的圆镜。
  右边：把左边重新诠释成低分辨率像素画，大方块像素，粉彩蓝、奶油、蜜桃、薰衣草和薄荷绿色调，通透的留白，平静治愈的配色。中下偏左一根橙色杆子上恰好 2 面完整的圆形凸面镜，大海、山、云、海堤和小小的水面高光都简化成像素块。
  只在右边加装饰像素细节：点状网点方块、小小的粉彩方块点缀、一个小闪光 / 星星图标，以及右上方竖排的恰好 3 个小爱心。右边左下角加像素小字"[WIND FROM THE SEA]"。
  宽幅横版画布，右边像素边缘清晰，明亮日光，不要人物和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2094701775270170941
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；场景主体和像素小字改为变量；原文\"以参考图为版式参考\"改为可直接文生图，也可上传自己的照片"
images:
  - 3156-photo-to-pastel-pixel-art-comparison-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=33264
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：场景主体换成你喜欢的风景（"樱花树下的电车站""雨后的城市天台""海边的白色灯塔"），左右两段里的具体物件也跟着改；[WIND FROM THE SEA] 换成一句短英文。用自己的照片时上传并保留括号里那句话，左边就会直接用你的照片。

示例图左边是蓝天白云下的海边：橙色杆子上的圆形反光镜、碧蓝的海和远处雪山；右边是同一画面的粉彩像素版——浅蓝、奶油、淡紫的方块像素云和海，杆子上两面圆镜，右上角三个小爱心，左下角像素小字。

**常见问题**：
- 像素不够"块"：写"像素块大小约为画面宽度的 1/80，边缘锐利无抗锯齿"。
- 颜色太艳：强调"粉彩治愈色，低饱和"。
- 只要像素图：删掉左边面板，画幅改 1:1，就是一张像素风壁纸 / 头像。

**适合**：像素风壁纸与头像、治愈系社媒图、像素画教学、游戏场景灵感。

### 英文原版

```text
Using the provided reference image as a layout and style guide, create a clean before/after comparison showing a real coastal photo transformed into soft healing-color pixel art. Change the subject to {argument name="scene subject" default="a sunny seaside road with orange roadside convex traffic mirrors, blue ocean, and snowy mountains in the distance"}. Layout: use exactly 2 vertical panels side by side — the left panel is the realistic photo source, and the right panel is the pixel-art reconstruction. Keep the split at the center with no border.

Left panel: make it a bright, saturated real-photo coastal landscape with blue sky, large white clouds, turquoise sea, distant snow-covered mountains, a low concrete seawall, and orange roadside mirror poles. Include 2 visible convex mirrors: 1 full round mirror near the left-center edge and 1 partial cropped round mirror at the far left edge.

Right panel: reinterpret the left panel as low-resolution pixel art with large square blocks, pastel blue, cream, peach, lavender, and mint tones, airy negative space, and a calm therapeutic palette. Include exactly 2 full circular convex mirrors on one orange pole near the lower center-left, with the ocean, mountains, clouds, seawall, and small water highlights simplified into pixel blocks.

Add decorative pixel details only on the right panel: dotted halftone squares, tiny pastel square accents, a small sparkle/star icon, and exactly 3 small heart icons stacked vertically near the upper-right area. Add small pixel text at the lower-left of the right panel reading {argument name="caption text" default="WIND FROM\nTHE SEA\nCARRIES LIGHT."}. Use a wide horizontal canvas, crisp pixel edges on the right, bright daylight, no people, no watermark.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2094701775270170941) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
