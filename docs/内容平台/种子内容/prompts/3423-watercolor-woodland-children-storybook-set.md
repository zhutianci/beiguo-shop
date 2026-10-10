---
title: "ai绘本生成提示词：水彩森林小孩系列插画，晕染水色 + 雀斑大眼的童话人物（Nano Banana）"
slug: watercolor-woodland-children-storybook-set
model: nano-banana
topics: [illustration, comic, character]
modelLabel: Nano Banana Pro
aspectRatio: "9:16"
needsRefImage: false
useCase: "给儿童绘本、成长手册、班级文化墙做一组风格统一的人物插画：雀斑大眼的小孩在森林里看书、写字、采花，水彩晕染、颜料向下滴落，四周留白，可以一张一张生成成套。"
prompt: |
  一张童趣的[水彩插画]，属于"森林里的孩子"系列，画幅 9:16。
  - 人物：一个年幼的、脸上有雀斑、眼睛大而有神的孩子——[黑色乱发的小男孩盘腿坐在草地上看书]；
  - 场景：[茂盛的林间]，周围是野花、蕨叶和树影；
  - 画法：鲜亮、互相渗化的水彩色块，柔和的墨线勾边，颜料在画面底部自然晕开并向下滴落几道，四周保留不规则的纸张留白；
  - 气氛：梦幻、温柔、有故事感；
  - 同系列的其他画面可以依次替换为：穿彩色连帽衫的男孩；[青绿色头发的女孩坐在树桩上用羽毛笔写字]；金色麻花辫的女孩把[野花和浆果]采进篮子里。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Minahil42298354/status/2054812494749745503
  author: "@Minahil42298354"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；画风、场景、道具、单张的人物与动作设为变量；把原文\"一组四个场景\"改写为\"每次生成其中一个场景\"，并列出四个场景供替换；按示例图补充了颜料晕染滴落、四周留白的特点"
images:
  - 3423-watercolor-woodland-children-storybook-set-1.jpg
  - 3423-watercolor-woodland-children-storybook-set-2.jpg
imageCredit:
  by: "@Minahil42298354"
  url: https://youmind.com/nano-banana-pro-prompts?id=19997
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：每次只生成一个孩子、一个动作，系列感靠固定"画法"那一段来保证。人物那一句可以换成"扎羊角辫的女孩蹲着看蜗牛""戴眼镜的男孩举着放大镜"；[茂盛的林间] 可换成"海边礁石""秋天的果园"；[水彩插画] 可以换成"彩铅插画""蜡笔画"，但晕染滴落的效果会消失。

示例图第一张：一个黑色乱发、脸颊有雀斑的小男孩盘腿坐在草地上，捧着一本翻开的书抬头微笑，身后是黄绿色的水彩晕染，画面底部紫色和青色的颜料向下淌成几道水痕。第二张：青绿色头发的女孩坐在树桩上，低头用羽毛笔在本子上写字，周围是深浅不一的绿色水渍，同样四周留白。

**常见问题**：
- 几张图里的孩子画风不统一：把"画法"那一段原样保留，只改人物一句；也可以把第一张图作为参考图上传。
- 水彩感不够、像数字厚涂：加"能看到纸纹和水渍边缘，颜色透明"。
- 画面被填满没有留白：强调"图像只占纸面中间，四周是不规则的白边"。

**适合**：儿童绘本、成长纪念册、教室布置、亲子公众号配图。

### 英文原版

```text
A whimsical collection of {argument name="art style" default="watercolor illustrations"} featuring young, freckled children with expressive eyes in a {argument name="setting" default="lush woodland setting"}. The style uses vibrant, bleeding watercolor washes, soft ink outlines, and a dreamy atmosphere. Key scenes include a boy in a colorful hoodie, a boy sitting cross-legged reading a book, a girl with teal hair writing with a quill on a tree stump, and a girl with golden braids gathering {argument name="props" default="wildflowers and berries"} into a basket.
```

> 改编自 [@Minahil42298354](https://x.com/Minahil42298354/status/2054812494749745503) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
