---
title: "线稿上色提示词：铅笔线稿变手绘水彩水粉动漫插画（咖啡馆示例）（gpt-image-2）"
slug: lineart-to-watercolor-anime-cafe
model: gpt-image-2
topics: [illustration, comic]
aspectRatio: "4:5"
needsRefImage: true
useCase: "手上有一张铅笔稿或线稿，想快速看到上色后的样子：上传线稿，保持构图和线条不变，铺上温暖的手绘水彩 / 水粉色彩，加窗边阳光和笔触肌理，得到一张完成度较高的动漫插画。"
prompt: |
  把我上传的线稿当作精确的底图来上色，画成一幅细节丰富的手绘水彩 / 水粉质感动漫插画。
  - 线稿不动：原图的构图、透视、人物姿势，以及[咖啡馆]场景里的家具、书架、窗户、植物、食物和每一处线条细节都完整保留，不增加也不删掉任何物体；
  - 质感：把灰阶铅笔稿的观感换成温暖自然的颜色，带看得见笔触的手绘颜料肌理；
  - 配色：整体是[温馨的复古咖啡馆色调]，木头用蜂蜜棕，衣服是[奶油色与金色的和风长袍]，头发是[浅金色]，书脊用蓝色和其他几种彩色，枝叶用绿色，瓶里的小花用黄色，吊灯发暖光，桌上是咖啡和点心的颜色；
  - 光影：用柔和的[窗边阳光]拉开前后纵深，玻璃和瓷器上有轻柔的高光，阴影一层层叠上去；
  - 细节：在保住原线稿纤细线条的前提下，再加入精细的色彩点缀；
  - 人物的脸照着线稿原样上色，五官不要改动。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/nolno_noa/status/2051003823620243836
  author: "@nolno_noa"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；场景、整体色调、服装颜色、发色、光源改为变量；原文的\"和服面料\"按示例图写成\"和风长袍\"；删去原文\"保留脸部遮挡色块\"一句（示例图人物面部完整），改为\"脸按线稿原样上色\"。"
images:
  - 3476-lineart-to-watercolor-anime-cafe-1.jpg
imageCredit:
  by: "@nolno_noa"
  url: https://youmind.com/gpt-image-2-prompts?id=18216
  license: CC BY 4.0
verify:
  - "示例图只有上色成图、没有线稿原图；人物手中书的封面有一个十字形纹饰，请确认是否可接受"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张干净的线稿或铅笔稿（扫描件、拍照都行，线条越清楚越好）。[咖啡馆] 换成线稿里的场景，如"教室""海边小屋"；配色一行按你的画来写：先定整体色调，再点名衣服和头发的颜色，其余物件给出两三种主要颜色即可；[窗边阳光] 可换"傍晚的暖色灯光""阴天的柔光"。

示例图只有上色后的成图：俯视视角，一位浅灰金色丸子头的少女穿着白金刺绣的连帽长袍，坐在圆木桌旁托腮看书；桌上有咖啡、奶罐、一块奶油蛋糕和一瓶黄色小花，周围是摆满蓝色、红色书脊的书架、玻璃罩里的蛋糕、吊灯和绿植，窗外一片绿意。颜料感很厚，笔触明显，比一般水彩更接近厚涂。

**常见问题**：
- 线稿被改动、多了东西：重申"不改线条、不增删物体，只在线稿上铺色"。
- 颜色太艳：加"低饱和、带一点纸张底色"。
- 想要更通透的水彩：写"薄涂、留白、颜色边缘有水渍晕染"，并删掉"水粉"。

**适合**：给自己的线稿、草图快速试色，或做成完成度较高的插画小样。请只上传自己画的或有权使用的线稿。

### 英文原版

```text
Using REFERENCE_0 as the exact line-art base, colorize the illustration into a richly detailed hand-painted watercolor/gouache anime illustration. Preserve the original composition, perspective, character pose, café setting, furniture, bookshelves, window, plants, food, and all line details, but replace the grayscale pencil look with warm natural colors and painterly texture. Use a cozy vintage café palette: honey-brown wood, cream and gold kimono fabric, blonde hair, blue and multicolored books, green foliage, yellow flowers, warm pendant lights, coffee and pastries. Keep the masked face area as a flat plain rectangle with no facial features. Add depth through soft sunlight from the window, gentle highlights on glass and porcelain, layered shadows, visible brush strokes, and high-detail color accents while maintaining the delicate original linework.
```

> 改编自 [@nolno_noa](https://x.com/nolno_noa/status/2051003823620243836) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
