---
title: "照片转可爱插画提示词：上半桌面实拍、下半文具拟人水彩插画（gpt-image-2）"
slug: desk-photo-to-kawaii-illustration
model: gpt-image-2
topics: [photography, illustration]
aspectRatio: "4:5"
needsRefImage: true
useCase: "上半是一张清新的文具桌面俯拍照片，下半把照片里的物品画成有表情的拟人水彩插画并配手写短句，可以上传自己的桌面照片，适合手账、文具店宣传和小红书封面。"
prompt: |
  生成一张竖版 4:5 的上下两联图，上下各占一半，对比"写实桌面照片"和"同样物品的可爱插画"。
  上半（写实照片）：参考我上传的照片（没有上传就按下面的物品生成），白色桌面上的高角度平铺俯拍，左侧有斑驳的柔和阳光阴影。物品：一张写着白色衬线字"Focus."的薄荷绿便利贴、一张蓝米色马卡龙小照片、三枚散落的铜色螺旋回形针、一支拔了笔帽的浅蓝马克笔、一支金色笔尖的灰绿自动铅笔、一支金色笔尖的浅蓝圆珠笔、一支浅蓝荧光笔、左侧露出的青绿色信封边和左下角的横线便笺纸角。
  下半（可爱插画）：奶油色背景上的手绘水彩风插画，把上面的物品画成拟人角色，都有简单的开心表情（两个黑点眼睛、粉色腮红、微笑）：一叠两层马卡龙、一张写着"Focus."并抱着小爱心的便利贴、一支直立的绿色马克笔、一支躺着的蓝色荧光笔、一张横线纸、一枚铜色回形针，周围点缀黄色小星星。
  两处中文手写字：右上"[现在，专注于美好的事]"配一个小爱心；左下"[小小的今天，组成美好的日子]"，下面一条绿色下划线。
  风格：上半清爽、明亮、通透的摄影；下半柔和粉彩、细线条、俏皮的水彩插画。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong/status/2104962263367221257
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；改为可上传自己的照片使用，物品清单作为默认示例保留；原文的韩文手写短句改为中文变量"
images:
  - 3032-desk-photo-to-kawaii-illustration-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=35690
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张自己的桌面、文具或零食俯拍照片，模型会把下半部分换成照片里的物品；两句手写字换成你想说的话，控制在 12 字以内效果最好，例如"[今天也要好好学习]""[喝杯咖啡再出发]"。

示例图上半是白桌面上的薄荷绿便利贴、马卡龙小照片、铜色螺旋回形针和几支浅蓝 / 灰绿的笔，阳光斑驳；下半是奶油底上抱着爱心的"Focus."便利贴、马卡龙、马克笔和荧光笔小人，都带腮红笑脸，配两句手写字（示例图里是韩文，本站已改为中文）。

**常见问题**：
- 下半物品和上半对不上：加"下半只画上半出现过的物品"。
- 手写字有错字：缩短句子，或者只保留一句。
- 插画太复杂：强调"每个角色只有两点眼、腮红和微笑"。

**适合**：手账素材、文具 / 零食店宣传图、小红书封面、学习打卡图。

### 英文原版

```text
Goal: Create a vertical two-panel image contrasting a realistic top-down desk photo with a cute kawaii illustration of the same items.

Canvas: Vertical 4:5 aspect ratio, split horizontally into two equal sections.

Top Section (Realistic Photo): A high-angle flat-lay photograph on a clean white surface. Soft dappled sunlight shadows fall across the scene from the left. Items include: a mint green sticky note square labeled "Focus." in white serif text; a small square photo of a blue and beige macaron; three copper wire spiral paper clips scattered around; a light blue marker pen with cap off; a sage green mechanical pencil with gold tip; a light blue ballpoint pen with gold tip; a light blue highlighter; a teal envelope or folder edge on the left; and a lined notepad corner at the bottom left.

Bottom Section (Kawaii Illustration): A hand-drawn watercolor-style illustration on a cream background featuring anthropomorphic versions of the items above. The characters have simple happy faces (two black dot eyes, pink blush circles, smiling mouths). Elements include: a stack of two macarons (blue top, beige bottom) with a face; a sage green sticky note character labeled "Focus." holding a tiny heart; a tall green marker character standing upright; a lying down blue highlighter character; a lined paper sheet; a copper spiral clip; and yellow sparkle stars. Handwritten Korean text appears in two places: upper right says "지금, 좋은 것에 집중해요." (Now, focus on good things.) with a heart symbol; lower left says "작은 오늘이 좋은 하루를 만들어요." (Small todays make a good day.) underlined in green.

Visual Style: The top is crisp, bright, and airy photography. The bottom is soft, pastel-colored, whimsical watercolor art with thin outlines.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong/status/2104962263367221257) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
