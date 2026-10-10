---
title: "ai像素画生成提示词：黄昏公路旁的汽车旅馆，复古蒸汽波像素壁纸（gpt-image-2）"
slug: pixel-art-sunset-roadside-motel-wallpaper
model: gpt-image-2
topics: [wallpaper, game-art]
aspectRatio: "3:2"
needsRefImage: false
useCase: "想要一张怀旧又安静的横版像素风景时用：日落时分的公路路口、高架招牌、电线杆和一辆旧轿车，像 90 年代主机 RPG 的背景图，适合做电脑壁纸、歌单封面或独立游戏的场景概念图。"
prompt: |
  一张 3:2 横版像素风景画，风格参考 1990 年代主机日式 RPG 的背景：日落时分安静的公路旁汽车旅馆。像素颗粒清晰、像是手工逐格摆放，色板有限而低饱和，不做抗锯齿，带一点复古蒸汽波的气氛。
  - 前景：柏油路口，白色斑马线，路面有裂纹；画面右侧停着一辆[洋红粉色]的老式双门轿车，车身被画面边缘裁掉一部分；
  - 招牌：轿车上方有一块高高架起的黄色大广告牌，用淡淡的方块字母写着[MOTEL]，立在高杆上，带深色的像素阴影和支架；车前有两块小路牌，一块窄牌带红色符号，一块是斜纹牌；
  - 中部：靠近画面中央立着一根高电线杆，顶端有横担和垂下的电线；
  - 中景：干枯的米色草地、低矮的旅馆平房、栅栏，以及一排深色常绿树；画面左侧恰好 2 棵显眼的松树，最左边一棵很高，旁边一棵稍矮；
  - 远景：层层叠叠的蓝绿色山脉，中间一座大山峰；天空是[粉色晚霞带灰色薄雾]，飘着大朵金奶油色的云；
  - 配色：[低饱和的粉彩黄、粉、灰绿和灰]；
  - 限制：纯风景，没有人物，没有游戏界面，没有水印，全图保持可见的方形像素结构。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/setsunawave/status/2074264837350375658
  author: "@setsunawave"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成前景 / 中景 / 远景；招牌文字、天空色调、车身颜色、整体配色设为变量；删去重复的风格描述"
images:
  - 3580-pixel-art-sunset-roadside-motel-wallpaper-1.jpg
imageCredit:
  by: "@setsunawave"
  url: https://youmind.com/gpt-image-2-prompts?id=27834
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[MOTEL] 是招牌上的字，建议保持 3~6 个大写英文字母，像素字体写中文容易糊，想用中文就控制在两个字以内；[洋红粉色] 是车身颜色；[粉色晚霞带灰色薄雾] 决定整张图的时间感，换成"深蓝夜空和一轮满月""清晨的淡青色天空"就是另一种气氛；[低饱和的粉彩黄、粉、灰绿和灰] 是整体色板，颜色别超过五种。

示例图是横版：右侧高架的黄色招牌上隐约是 MOTEL 几个字，下面停着一辆粉紫色旧轿车，车前两块小路牌；中间一根高电线杆，左边两棵深色松树；远处是蓝灰色的山，天空从粉色过渡到灰色，堆着大朵淡黄色的云。整张图能看到清楚的像素格和抖动网点。

**常见问题**：
- 出来的是"模糊的假像素"：加"低分辨率原图按整数倍放大，每个像素都是清晰的方块"。
- 颜色太艳：把色板那一项改成具体的 4 种颜色，并加"整体低对比"。
- 招牌字看不清：把"淡淡的"改成"清晰的"，字母数减少。

**适合**：电脑壁纸、歌单 / 播客封面、独立游戏场景概念图。和库里的等距像素 RPG 截图不同，这条是没有界面的纯风景。

### 英文原版

```text
Create a 3:2 wide pixel-art landscape in the style of a 1990s console JRPG background: a quiet roadside motel scene at sunset with crisp hand-placed pixels, a limited muted palette, no anti-aliasing, and subtle retrowave / vaporwave atmosphere. The foreground shows an asphalt road intersection with a white zebra crossing and cracked pavement. On the right, place a pink retro two-door sedan parked beside the road, partly cropped by the edge of the frame. Above it, a large elevated yellow billboard sign reads {argument name="billboard text" default="MOTEL"} in faint block letters, mounted on a tall pole with dark pixel shadows and braces. Near the center, include one tall utility pole with a small transformer crossbar and dangling wires. Add two small roadside signs in front of the car: one narrow sign with a red symbol and one diagonal stripe sign. The midground contains dry beige grass, low motel-like buildings, fences, and a dense row of dark evergreen trees. The left side has exactly 2 prominent pine trees: one very tall tree at the far left edge and one smaller tree just right of it. The background features layered blue-green mountains with a large central peak, set under a pink-to-gray sky filled with large golden cream clouds. Use {argument name="sky color mood" default="pink sunset with gray haze"}, {argument name="car color" default="magenta pink"}, {argument name="overall palette" default="muted pastel vaporwave yellows, pinks, sage greens, and dusty grays"}, and {argument name="art style" default="crisp 16-bit pixel art, retro JRPG game sprite background, lo-fi synthwave, no anti-aliasing"}. Keep the image purely environmental with no people, no modern UI, no watermark, and maintain visible square pixel structure throughout.
```

> 改编自 [@setsunawave](https://x.com/setsunawave/status/2074264837350375658) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
