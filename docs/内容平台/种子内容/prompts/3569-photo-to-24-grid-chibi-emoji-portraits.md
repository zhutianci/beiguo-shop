---
title: "ai表情包制作提示词：参考图人物变 24 格 Q 版头像表情，手写短语 + 彩色底块（Nano Banana）"
slug: photo-to-24-grid-chibi-emoji-portraits
model: nano-banana
topics: [sticker, portrait, photo-edit]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: true
useCase: "上传一张人物或角色的参考图，一次生成 4×6 共 24 个半身 Q 版头像表情：每格一个表情加一句手写体的聊天短语，底色是不同的马卡龙色块，帽子、耳机等头部配饰会按参考图还原。适合做个人或团队的专属表情包。"
prompt: |
  请根据[参考图里的人物]，画一组色彩丰富、手绘风格的聊天软件贴纸式半身 Q 版头像表情。
  - 还原：保留参考图人物的发型和脸部特征，头上的配饰（帽子、发带、耳机、眼镜等）要画准确；必须是重新绘制的原创形象，不要直接复制或描摹参考图。
  - 排布：按 [4 行 6 列] 的网格排成 24 格，每格一个半身头像，放在一块圆角的马卡龙色底块上，相邻格子的底色不同，格与格之间留白均匀。
  - 表情与文字：24 格表情各不相同，覆盖打招呼、大笑、可爱、饿了、同意、拒绝、耍酷、惊讶、犯困、生气、难过、得意、疑问、灵光一现、等等、再见等常用情绪；每格配一句对应的聊天短语或网络梗，用[简体中文]手写体写在头像上方或一侧，每句不超过 4 个字。
  - 画法：粗细均匀的深色描边，平涂上色，脸颊两团腮红，表情夸张清楚，在很小的尺寸下也能看懂。
  - 输出：4K 分辨率，画幅 [16:9]；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/dotey/status/1993042754008686712
  author: "@dotey"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；参考对象、网格、画幅三个变量保留，新增\"短语语言\"变量；按示例图补充了彩色圆角底块和表情清单的写法；原条目另外几张示例图含真人照片，未采用"
images:
  - 3569-photo-to-24-grid-chibi-emoji-portraits-1.jpg
imageCredit:
  by: "@dotey"
  url: https://pbs.twimg.com/media/G6i09XKXsAAzHUd.jpg
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张脸部清楚的参考图（本人照片、宠物、原创角色均可）。[参考图里的人物] 可以写得更具体，如"参考图里戴渔夫帽的男生"；网格可改成"3 行 4 列"做 12 格，格子越少每个表情越精细；[简体中文] 可换成"英文""日文"；想指定短语，就把 24 句直接列在"表情与文字"一条后面。

示例图是 4 行 6 列的表情表：每格一个圆脸、小眼睛、带腮红的男孩半身像，戴着各种头饰——棒球帽、毛线帽、小皇冠、耳机、墨镜、派对帽、眼罩；底色是粉、黄、绿、蓝、紫交替的圆角色块，上面用手写英文写着 HI!、LOL、COOL!、OMG、SAD、IDEA!、BYE 等短语。

**常见问题**：
- 24 格里有重复的表情：把想要的 24 种情绪逐条列出来。
- 中文手写字出错：每句控制在 2～3 个字，或先生成无字版再自己加字。
- 人物不像：在提示词里补充两三个最明显的特征（发型、眼镜、痣的位置）。

**适合**：个人、情侣或团队的专属聊天表情，社群运营的头像包。请只上传你本人或已获对方同意的照片；上架平台前按平台的尺寸与审核规范切图。

### 英文原版

```text
Create a set of colorful, hand-drawn LINE-style half-body chibi emoji portraits based on the {argument name="reference_characters_en" default="characters shown in the reference image"}, making sure their head accessories are depicted accurately.

Arrange the portraits in a {argument name="grid_layout_en" default="4x6"} grid, featuring common chat phrases or relevant humorous memes.
Use handwritten-style fonts for the text.
The output must be original—do not directly copy the reference image.
The final image should be 4K resolution with a {argument name="aspect_ratio_en" default="16:9"} aspect ratio.
```

> 改编自 [@dotey](https://x.com/dotey/status/1993042754008686712) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
