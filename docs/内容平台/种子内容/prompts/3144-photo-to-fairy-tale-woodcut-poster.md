---
title: "照片转版画提示词：上半实拍、下半格林童话木刻风插画的海报（gpt-image-2）"
slug: photo-to-fairy-tale-woodcut-poster
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张照片（宠物、物品、街景），生成上下各半的竖版海报：上半是调过色的原照片，下半把主体压缩成简拙的童话木刻插画，深色画框包住主体，配圆润手写小字，适合宠物纪念、创意海报和绘本风周边。"
prompt: |
  用我上传的照片做一张 3:4 的上下分割海报。
  上半：原照片，做杂志感调色。
  下半：格林童话木刻风的手绘插画。把主体压缩成简单、钝圆的剪影，比例略微夸张；用一个取自原场景的深色"容器"或画框把主体包起来；强调平面叙事视角和绘本式的层级关系。
  配色分三层：大面积的深色结构色、透气的浅色，以及少量高饱和的"情绪色"作为叙事焦点。
  质感像丝网印刷和色粉笔，带颗粒和墨色误差。
  文字用圆润的手写体，作为图形里的小注释（比如一个小标题和一行短句）。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2089987808664719723
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文，并补充了画面细节的示例"
images:
  - 3144-photo-to-fairy-tale-woodcut-poster-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=32028
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这条没有方括号变量，效果取决于上传的照片：主体单一、轮廓清楚的照片最合适（趴着的猫、桌上的一件物品、一盏灯）。想指定手写小字，就加一句"小注释写：Sunny Place / 阳光正好"。

示例图是一只橘猫趴在地上、背上落着一块窗格形的阳光：上半是原照片；下半是深棕色拱形画框里的木刻风橘猫，背上的光斑变成几块亮黄色方块，画框外有小树枝、小花和一盏吊灯，左下角手写"Sunny Place"。

**常见问题**：
- 下半变成普通卡通：强调"木刻 / 丝网版画质感，有颗粒和套色误差"。
- 主体太复杂画不好：先用单个主体的照片。
- 想要横版：改成"16:9 左右分割，左边照片、右边版画"。

**适合**：宠物纪念海报、创意社媒图、绘本风周边、装饰画。

### 原版提示词

```text
Create 3:4 split posters from uploaded photos. Top half: original photo with editorial grading. Bottom half: Grimm's Fairy Tale woodcut-style hand-drawn illustration. The subject is compressed into simple, blunt silhouettes with slightly exaggerated proportions. The layout uses a dark-toned 'container' or frame derived from the original scene to wrap the subject. Emphasizes flat narrative perspective and storybook hierarchies. Color palette has three layers: large dark structural colors, breathable light colors, and small high-saturation 'emotional' colors for narrative focus. Textures resemble silk-screen printing and pastel with grit and ink errors. Typography is rounded and hand-written, functioning as small annotations within the graphic.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2089987808664719723) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
