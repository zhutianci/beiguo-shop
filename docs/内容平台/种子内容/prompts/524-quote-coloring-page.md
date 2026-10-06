---
title: 涂色画生成提示词（nano banana）：一句话做可打印的涂色卡 / 填色画（大号泡泡字 + 可爱涂鸦）
slug: quote-coloring-page
model: nano-banana
topics: [illustration, poster]
needsRefImage: false
aspectRatio: "1:1"
useCase: 给孩子准备涂色纸、做解压涂色卡、给手账 / 社群活动做可打印的填色画时，输入一句话，生成中间是大号空心泡泡字、四周塞满可爱小涂鸦的黑白线稿，打印出来就能涂。
prompt: |
  一张黑白线稿涂色画：画面中央是大号、粗体、空心泡泡字体的文字"[今天也很努力]"，字母内部留白方便涂色，可以点缀小爱心或小星星。
  文字四周密密地围绕着各种可爱又俏皮的小元素：[星星、猫咪、云朵、雏菊、蛋糕、奶茶]，以及会笑的小爱心、闪闪发光的星芒和小漩涡。
  要求：
  - 全部是清晰、闭合的黑色线条，线条粗细均匀，所有区域都是可以涂色的空白；
  - 不要任何灰色、阴影、渐变或彩色；
  - 构图饱满、热闹，但每个图形之间有清楚的边界，适合打印后用彩笔填色；
  - 纯白背景，[1:1] 正方形。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/heathergreen/status/2091812770274492604
  author: "@heathergreen"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；文字内容和装饰元素清单设为变量（示例改为中文短句）；补充"线条闭合、无灰度、适合打印"的涂色画专用约束和画幅
images:
  - 524-quote-coloring-page-1.jpg
imageCredit:
  by: "@heathergreen"
  url: https://x.com/heathergreen/status/2091812770274492604
  license: CC BY 4.0
verify:
  - 实测中文泡泡字（4–6 个字）能否写对；示例图是英文句子"DOING MY BEST RESULTS MAY VARY"
  - 打印一张 A4 检查线条是否足够清晰、是否有未闭合区域
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把 [今天也很努力] 换成你想要的话，装饰元素按主题改，例如生日主题"蛋糕、气球、礼物盒、彩带"，海洋主题"小鱼、海星、贝壳、气泡"，节日主题"灯笼、月饼、兔子"。示例图是原作者生成的英文版：中间是四行空心大字，四周塞满笑脸星星、猫咪、珍珠奶茶和纸杯蛋糕。

**打印小技巧**：生成后追问"转成纯黑白、加粗线条、去掉所有灰色"，打印时选"黑白 + 高质量"，A4 纸效果最好；给低龄孩子用时加一句"图形更大、更少、线条更粗"。

**常见问题**：
- 中文字写错或笔画糊在一起：字数控制在 4–6 个，或改成英文 / 拼音；也可以只要四周的涂鸦，文字留空自己写。
- 出现灰色阴影：重复"只有黑色线条和白色空白"。
- 太密不好涂：把"密密地围绕"改成"适量围绕，留出较大的涂色区域"。

**适合**：亲子涂色、幼儿园 / 早教活动、解压涂色卡、手账素材、社群打卡活动。

### 英文原版

```
A black and white line drawing features the text "{argument name="quote" default="DOING MY BEST RESULTS MAY VARY"}" in large, bold, bubble-style lettering. The text is surrounded by various cute and whimsical elements, including smiling stars, a cat face, clouds, daisies, hearts, cupcakes, a boba tea, and sparkly starbursts. The overall composition is dense and playful, designed as a coloring page.
```

> 改编自 [@heathergreen](https://x.com/heathergreen/status/2091812770274492604) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
