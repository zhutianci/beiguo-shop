---
title: "照片转治愈插画提示词：左边风景照、右边羊毛毡极简小画的对比图（gpt-image-2）"
slug: nature-photo-to-felt-minimal-diptych
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "16:9"
needsRefImage: false
useCase: "生成一张左右对比的治愈系横图：左边是写实的自然风景照，右边是同一场景的羊毛毡手作极简插画，米白纸大量留白，下方一行手写短句，适合小红书治愈图、手账和明信片。"
prompt: |
  生成一张左右两联的横版对比图：一张真实的自然照片被转化成极简的羊毛毡插画。
  画布：16:9 宽幅，从正中竖直一分为二，分界干净笔直。
  左半：金色时刻的森林草地写实照片。前景恰好 5 只鹿：最左 1 只在走、左中 1 只低头吃草、中间 1 只吃草、中右 1 只站着的小鹿、最右 1 只站着的大鹿。草地上挂着露水，暖黄阳光和柔和晨雾；背景是浓密的深色常绿树林剪影，右上方还有枝叶。强烈的阳光从右上方斜穿树林，宁静的电影感氛围。
  右半：同一场景的柔软手作羊毛毡重新诠释，放在暖米白有纹理的纸张背景上，大量留白。毛毡场景水平居中，位于中上部：恰好 5 只小毛毡鹿，排列与左边对应（最左站立、左中吃草、中间一只橙棕色在吃草、中右站立的小鹿、最右站立的大鹿），站在一条细细的毛茸茸浅绿毛毡草地上。上方一个简单的圆形毛毡太阳和 2 缕柔和的横向毛毡云。毛毡草地下方是一行纤细的灰棕色手写字"[A kinder morning ♡]"。
  视觉风格：温暖治愈、大量留白、羊毛毡的温馨质感、柔和边缘、低调大地色、平静诗意。左边像有氛围的摄影，右边像有可见纤维的手作毛毡小画。
  限制：保持左右分割，每边恰好 5 只鹿，不要多余动物、边框、水印和说明以外的文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2098125338484342869
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；短句改为变量，并补充换成其他场景时如何改写"
images:
  - 3154-nature-photo-to-felt-minimal-diptych-1.jpg
  - 3154-nature-photo-to-felt-minimal-diptych-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=34333
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[A kinder morning ♡] 是右下的手写短句，可以写中文"[温柔的早晨 ♡]"。换场景时把左右两段一起改：例如"海上日落和一排飞过的大雁"（作者的另一张示例就是这个，配"Same sky, brighter tomorrows."）、"雪地里的一只小狐狸""湖边的小木屋"，数量对应写清楚。也可以上传自己的风景照，写"左半使用我上传的照片"。

示例图两张：一张左边是晨雾金光里的五只鹿，右边米白纸上五只小小的毛毡鹿站在一条绿草上，头顶一个黄色太阳和两缕云，下方手写"A kinder morning ♡"；另一张左边是巨大的橙红落日和一排飞过的大雁，右边是毛毡质感的红日、雁群和水面倒影。

**常见问题**：
- 右边不像毛毡、像水彩：强调"羊毛毡纤维、毛茸茸的边缘"。
- 右边画得太大：写"毛毡小画只占右半宽度的一半，四周大量留白"。
- 左右对不上：保留数量和位置的一一对应描述。

**适合**：小红书治愈图、手账素材、明信片、公众号配图。

### 英文原版

```text
Goal: Create a two-panel horizontal comparison image showing a real-life nature photo transformed into a minimalist needle-felt illustration.

Canvas: Wide 16:9 canvas split vertically into two equal halves with a clean straight division down the center.

Left panel: A realistic golden-hour forest meadow photograph. Show exactly 5 deer in the foreground: 1 deer walking at far left, 1 deer grazing left-center, 1 deer grazing center, 1 small deer standing upright center-right, and 1 larger deer standing at far right. The meadow is covered in dewy green grass, with warm yellow sunlight and soft morning mist. In the background, dark evergreen trees form a dense forest silhouette, with additional leafy branches at the upper right. Strong sunbeams stream diagonally through the trees from the upper right, creating a serene cinematic atmosphere.

Right panel: A soft handmade needle-felt wool reinterpretation of the same scene on a warm off-white textured paper background with generous blank space. Center the felt scene horizontally in the upper-middle area. Show exactly 5 small felt deer matching the left panel arrangement: 1 standing deer at far left, 1 grazing deer left-center, 1 orange-brown grazing deer center, 1 small upright deer center-right, and 1 larger standing deer at far right. Place them on a thin strip of fuzzy pale green felt grass. Above them, include a simple round felt sun and 2 soft horizontal felt cloud wisps. Under the felt grass, add handwritten text reading {argument name="caption text" default="A kinder morning ♡"} in a delicate gray-brown script.

Visual style: Combine warm healing aesthetics, generous white space, cozy wool-felt texture, soft edges, muted earthy colors, and a calm poetic mood. The left side should look photographic and atmospheric; the right side should look like a handcrafted felt illustration with visible fibers and a minimal composition.

Constraints: Keep the split-screen layout, exactly 5 deer on each side, no extra animals, no border, no watermark, no additional text beyond the caption.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2098125338484342869) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
