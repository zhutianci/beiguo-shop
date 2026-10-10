---
title: "ai创意产品图提示词：把一堆软萌玩具塞进真空压缩袋，黑底影棚特写（Nano Banana）"
slug: vacuum-sealed-bag-squished-toys-product-shot
model: nano-banana
topics: [ecommerce, figurine, photography]
modelLabel: Nano Banana Pro
aspectRatio: "4:5"
needsRefImage: false
useCase: "一个很有网感的创意拍法：长方形的透明真空袋里塞满同一种小物件，有的贴着袋面清清楚楚，有的被挤得变形，黑色背景加柔光箱打光。适合做潮玩、周边、零食的趣味主图和社媒封面。"
prompt: |
  生成一张影棚产品摄影：一只长方形的透明真空压缩袋，立在画面中央，里面紧紧塞满了[柔软的猫咪造型捏捏玩具]。
  - 袋内：玩具有[橘色、灰色虎斑、奶牛花和奶油色]几种，表情各不相同；靠近袋面的几只清晰可见，脸和爪子被压在塑料膜上；更深处的被挤得变形、互相叠压，缝隙里露出粉色和蓝色的布料。
  - 袋子：塑料膜因为抽真空而紧贴内容物，表面有细密的褶皱、微妙的反光和高光；四边是热封的压痕，上角有一个小小的抽气阀。
  - 背景：[纯黑色背景]，袋子下方的台面有一点柔和的倒影。
  - 光线：戏剧性的柔光箱打光，强调塑料膜的质感和内容物的层次与体积。
  - 画质：细节丰富、对焦锐利；画幅 4:5 竖版；不要文字、标志和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/heathergreen/status/2066868393676808452
  author: "@heathergreen"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；袋内物品、背景两个变量保留，新增\"物品配色\"变量；按示例图补充了封口压痕和袋面气阀等细节"
images:
  - 3518-vacuum-sealed-bag-squished-toys-product-shot-1.jpg
imageCredit:
  by: "@heathergreen"
  url: https://youmind.com/nano-banana-pro-prompts?id=25871
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[柔软的猫咪造型捏捏玩具] 换成任何"小而多"的东西，例如"彩色小熊软糖""毛绒小恐龙挂件""各种口味的马卡龙"；配色一栏列 3～4 种颜色或花纹，品种多一点画面才热闹；背景可以换成"纯白色背景""荧光粉色背景"，浅色背景下塑料膜的反光会弱一些。

示例图是黑色背景前的一只透明真空袋，里面挤着十几只卡通小猫玩具：橘猫、灰色虎斑猫、黑白奶牛猫和米色的猫，前排几只笑脸清晰地贴在袋面上，后面的被压扁挤在一起，缝隙里露出粉色和蓝色；袋子表面满是褶皱和高光，右上角有一个圆形气阀。

**常见问题**：
- 看不出是真空袋，像普通塑料袋：强调"抽真空后塑料膜紧紧吸附在物体表面、形成清晰的轮廓压痕"。
- 物品是知名卡通形象：写"原创造型，不要出现任何已有的卡通角色"。
- 反光太强看不清里面：加"高光只出现在袋子边缘和褶皱处"。

**适合**：潮玩和周边的趣味主图、零食礼包的创意海报、社媒封面；袋内造型请用原创形象。

### 英文原版

```text
a rectangular shaped vacuum sealed transparent plastic bag, studio product shot, filled tightly with {argument name="object" default="soft squishy neoprene kitten-shaped toys"}, on a {argument name="background" default="solid black background"}, some kitten toys clearly visible and pressed against the plastic while others are distorted and squished deeper inside the bag, subtle reflections and highlights on the plastic surface, high detail, sharp focus, dramatic softbox lighting emphasizing textures and depth
```

> 改编自 [@heathergreen](https://x.com/heathergreen/status/2066868393676808452) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
