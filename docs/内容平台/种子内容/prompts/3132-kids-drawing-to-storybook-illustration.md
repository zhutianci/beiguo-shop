---
title: "儿童画变插画提示词：把孩子的蜡笔涂鸦变成精致的绘本插画（保留原构图）（gpt-image-2）"
slug: kids-drawing-to-storybook-illustration
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "3:4"
needsRefImage: true
useCase: "拍下孩子的蜡笔 / 马克笔画上传，让模型保留孩子的奇思妙想和构图，把粗糙的线条重画成柔和水彩 + 动漫风的成品绘本插画，适合做亲子纪念、绘本封面和孩子作品集。"
prompt: |
  以我上传的孩子画作作为主要构图和创意来源，把它变成一张商业品质的儿童动漫插画，同时保留原画充满想象力的布局。
  转化方式：把粗糙的马克笔 / 蜡笔线条整理成柔和的水彩 + 动漫渲染，修正比例，增加纵深、明暗和可爱的细节，但保留手作绘本的感觉。让主角更可爱、更有表情，比如大大的动漫眼睛。
  保留并细化原画中所有可见的元素和它们的数量与位置（例如：几朵云、太阳在哪个角落、山丘上的小房子和树、池塘里有几条鱼、角落里探头的小人），不要增加原画里没有的主要元素，也不要删掉孩子画的任何东西。
  主角是[一个微笑的小女孩]，穿[粉色]裙子。
  风格：明亮的粉彩儿童绘本动漫风，柔和的[暖奶油色纸张]背景，干净的轮廓，绘画般的水彩质感，温暖的阳光，开心奇妙的氛围，竖版构图。
  构图贴近原画，但看起来像一张完成度很高的专业插画；不要写实照片风格、水印和额外文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Gordon_2077/status/2095872735016882315
  author: "Knight King"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文针对两张特定参考图逐项描述了画面元素，本站改写为通用的\"保留原画元素\"写法，并把原示例中的元素作为举例；角色、裙子颜色、画风、背景色改为变量"
images:
  - 3132-kids-drawing-to-storybook-illustration-1.jpg
imageCredit:
  by: "Knight King"
  url: https://youmind.com/gpt-image-2-prompts?id=33555
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：拍孩子画作时尽量正对、光线均匀，画纸铺满画面。[一个微笑的小女孩] 和 [粉色] 按画里的主角写（"一个戴帽子的小男孩""一只小狗"）；画风可以换成"蜡笔质感的温暖绘本风""3D 卡通风"。如果孩子画里有字（名字、日期），想保留就写"保留画中的文字"。

示例图是改造后的成品：一个扎双辫、穿粉裙子（胸前绿色爱心）的小女孩，双手握着两根紫色伞柄，把一座长满青草的圆顶小山当伞举在头顶，山上有小房子、一棵歪树、一个小池塘，右边探出一个小人，天上三朵蓝色小云，右上角橙色太阳——这些都来自孩子原画里的元素。

**常见问题**：
- 模型"自作主张"加了东西：重复"不增不减，只重画"。
- 画得太成人化：强调"保留孩子的天真构图和比例，只让线条和上色更精致"。
- 孩子照片隐私：只上传画作，不要上传带孩子正脸的照片。

**适合**：亲子纪念、儿童绘本封面、孩子作品集、生日礼物。

### 英文原版

```text
Goal: Using REFERENCE_0 as the main composition and child-drawing concept, transform it into a polished commercial-quality children’s anime illustration while preserving the original imaginative layout: a smiling girl holding a giant grassy hill like an umbrella, with a tiny world on top. Use REFERENCE_1 only as context for the warm, innocent childlike imagination, but do not include its title text or its separate family figures.

Transformation: Clean up the rough marker/crayon lines into soft watercolor-and-anime rendering, improve proportions, add depth, shading, and charming details, while keeping the handmade storybook feeling. Make the girl cuter and more expressive, with large anime eyes, neat black pigtails, a pink dress with a green heart, and purple curved umbrella handles in both hands.

Preserve and refine these visible elements from REFERENCE_0: exactly 3 blue clouds, 1 orange sun in the upper-right corner, 1 grassy dome hill, 1 small house on top of the hill, 1 leaning tree on the left side of the hill, 1 small pond on the right side of the hill containing exactly 2 fish, 1 tiny child figure sliding or peeking from the right edge of the hill, scattered grass tufts and small purple flowers, and the girl underneath holding the hill.

Style: bright pastel children’s-book anime, soft cream paper background, clean outlines, painterly watercolor texture, warm sunlight, cheerful whimsical mood, vertical portrait composition. Keep the composition close to the reference drawing, but make it look like finished professional illustration art.

Optional customization: make the main subject {argument name="character name" default="a smiling little girl"}; use {argument name="dress color" default="pink"}; keep the heart on the dress {argument name="heart color" default="green"}; render in {argument name="art style" default="soft watercolor anime children’s-book style"}; use a {argument name="background color" default="warm cream paper"} background.

Constraints: no Chinese title text, no extra characters from REFERENCE_1, no realistic photo style, no watermark, no added text.
```

> 改编自 [Knight King](https://x.com/Gordon_2077/status/2095872735016882315) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
