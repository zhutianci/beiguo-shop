---
title: "儿童绘本插画提示词：粗描边丙烯风小熊猫（可换任意动物）（gpt-image-2）"
slug: bold-picture-book-animal-illustration
model: gpt-image-2
topics: [illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成一张大胆鲜艳的儿童绘本风动物插画：超粗黑描边、平涂色块、丙烯颜料笔触，小熊猫占满画面走过简单的森林，适合儿童绘本、早教卡片、T 恤图案和墙面装饰画。"
prompt: |
  生成一张明亮俏皮的卡通插画：一只[小熊猫]从左往右走过一片简单的森林，大胆的儿童绘本风格，粗黑描边、平面造型、可见的丙烯或水粉笔触。横版 4:3。
  小熊猫占据大部分画面：超大的圆脑袋、非常大的黑白圆眼睛、小小的微笑嘴巴、内侧奶白中间深色的尖耳朵、橙红色的毛、奶白色的脸颊斑和眉毛、深红棕色的腿和脸部花纹，一条巨大蓬松的环纹尾巴向右弯曲，橙色和深棕色条纹交替。
  背景：饱和的[亮青蓝]天空、[暖金橙]色的地面小路、绿色草边和简单的块状景物。天空中恰好 2 朵粗黑描边的蓬松白云，左右边缘各恰好 1 棵棕色树干、棱角分明绿色树冠的风格化树，左下和右下各恰好 1 丛绿色前景灌木。
  构图开心、图形化、充满童趣；不要写实、细腻毛发、渐变、文字、水印和多余动物。
  使用[非常粗的黑色描边]和[有纹理的丙烯颜料]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/shunchi_uu/status/2096827340718485925
  author: "しゅんち(小柴俊太郎)@神戸AI漫画家"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；动物、描边粗细、天空和地面颜色、画材改为变量"
images:
  - 3131-bold-picture-book-animal-illustration-1.jpg
imageCredit:
  by: "しゅんち(小柴俊太郎)@神戸AI漫画家"
  url: https://youmind.com/gpt-image-2-prompts?id=33711
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[小熊猫] 换成任意动物（"大熊猫""柴犬""考拉""小狐狸"），把外形描述那一段改成该动物的特征；天空和地面颜色可以换成"粉紫色天空 + 薄荷绿地面"做梦幻版；画材可以换成"蜡笔""剪纸拼贴"。做一套动物卡片时固定背景和画风，只换动物。

示例图是横版插画：一只橙红色的小熊猫几乎占满画面，大圆眼睛、尖耳朵、条纹大尾巴，脚下是金橙色地面，青蓝色天空里两朵粗描边白云，左右各一棵方块状的绿树，下方两丛锯齿状的灌木，笔触质感明显。

**常见问题**：
- 画出了细腻毛发：保留"不要细腻毛发、平涂色块"。
- 描边不够粗：写"描边粗到像马克笔画的"。
- 动物比例不可爱：强调"超大头、超大眼睛、短腿"。

**适合**：儿童绘本、早教卡片、T 恤 / 帆布包图案、儿童房装饰画。

### 英文原版

```text
Create a bright, playful cartoon illustration of {argument name="animal" default="red panda"} walking left to right through a simple forest scene, drawn in a bold children’s picture-book style with thick black outlines, flat shapes, and visible acrylic or gouache brush texture. Use a horizontal 4:3 canvas. The red panda should fill most of the frame, with an oversized rounded head, very large circular black-and-white eyes, small smiling mouth, pointed ears with cream interiors and dark centers, orange-red fur, cream cheek patches and eyebrows, dark reddish-brown legs and facial markings, and a huge fluffy ringed tail curving to the right with alternating orange and dark brown stripes. Background: saturated cyan-blue sky, warm yellow-orange ground path, green grassy edges, and simple blocky scenery. Include exactly 2 white puffy clouds with thick black outlines in the sky, exactly 2 stylized trees at the left and right edges with brown trunks and angular green canopies, and exactly 2 green foreground bushes at the bottom left and bottom right. Keep the composition cheerful, graphic, and childlike; avoid realism, fine fur detail, gradients, text, watermark, or extra animals. Use {argument name="outline thickness" default="very thick black outlines"}, {argument name="sky color" default="bright cyan blue"}, {argument name="ground color" default="warm golden orange"}, and {argument name="art medium" default="textured acrylic paint"}.
```

> 改编自 [しゅんち(小柴俊太郎)@神戸AI漫画家](https://x.com/shunchi_uu/status/2096827340718485925) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
