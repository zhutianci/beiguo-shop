---
title: "照片转蜡笔画提示词：把合照变成童趣蜡笔绘本插画（粉彩、涂抹质感）（gpt-image-2）"
slug: photo-to-crayon-picture-book-drawing
model: gpt-image-2
topics: [illustration]
aspectRatio: "4:3"
needsRefImage: true
useCase: "上传一张合照或生活照，转成像孩子用蜡笔画的温柔绘本插画：圆润线条、自由混用的粉彩颜色、蜡笔的粗糙涂抹质感，适合做闺蜜 / 家庭纪念、头像和相册封面。"
prompt: |
  把这张参考照片变成一幅温柔、带点稚拙的[绘本风]插画，像出自孩子之手的蜡笔画。
  人物的脸、手和衣服细节用柔和圆润的线条勾勒，不要过多细节。
  用色不拘泥于真实颜色，自由使用明亮的[粉彩色调]：粉、薄荷绿、柠檬黄、薰衣草紫和浅蓝随意混合，用孩子般的想象力重新诠释画面。
  线条略显稚拙，颜色呈现蜡笔特有的粗糙纹理、不均匀、涂抹和晕染。
  构图自然，像一个孩子用画笔装点珍贵的回忆。
  整体画面柔和地融进[童趣蜡笔画的梦幻世界]。
  这是一张怀旧、可爱、略带感伤、值得珍藏进相册的画。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/zhongying14/status/2052671345595441301
  author: "麻酱AI实验室"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；风格、色调、氛围改为变量"
images:
  - 3143-photo-to-crayon-picture-book-drawing-1.jpg
imageCredit:
  by: "麻酱AI实验室"
  url: https://youmind.com/gpt-image-2-prompts?id=19057
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张光线清楚的照片（合照、旅行照、宠物照都可以，请只上传你有权使用的照片）；[绘本风] 可以换成"儿童日记画风"；[粉彩色调] 可以换成"暖色调""彩虹色"；氛围可以写"夏日海边的童年回忆"。人物越少，蜡笔画越可爱。

示例图是一张蜡笔绘本风的合照：四个穿制服的女生在校园里挽着手对镜头笑，背景是教学楼、樱花树和自行车棚，颜色是粉、黄、蓝、紫的蜡笔涂抹，线条圆润稚拙。

**常见问题**：
- 画得太精致不像小孩画：强调"线条稚拙、颜色涂出边界"。
- 人物数量变了：加"保持照片里的人数和站位"。
- 想要更像儿童真迹：加"在白纸上，旁边有铅笔写的歪歪扭扭的日期"。

**适合**：闺蜜 / 家庭纪念、头像、相册封面、亲子手账。

### 原版提示词

```text
Transform this reference photo into a gentle, slightly naive {argument name="style" default="picture book style"} illustration, as if drawn by a child's hand using crayons. The facial, hand, and clothing details of the characters are outlined with soft, rounded lines, avoiding excessive detail. The use of color is not limited to traditional colors but freely uses bright {argument name="color tones" default="pastel tones"}. Pink, mint green, lemon yellow, lavender purple, and light blue are mixed randomly, reinterpreting the image with childlike imagination. The lines are slightly naive, and the colors exhibit the characteristic rough texture, unevenness, smudging, and staining of crayons. The layout is natural, as if a child were decorating precious memories with a brush. The overall image softly blends into a {argument name="atmosphere" default="dreamy world of childlike crayon drawings"}. This is a nostalgic, cute, and slightly sentimental photo worth treasuring in an album.
```

> 改编自 [麻酱AI实验室](https://x.com/zhongying14/status/2052671345595441301) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
