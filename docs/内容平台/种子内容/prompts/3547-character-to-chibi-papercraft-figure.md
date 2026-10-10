---
title: "ai手办提示词：把角色图变成 Q 版纸模小人，厚卡纸折叠拼接的纸艺手办（Nano Banana）"
slug: character-to-chibi-papercraft-figure
model: nano-banana
topics: [figurine, photo-edit, character]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: true
useCase: "上传一张角色图或人物插画，生成它的 Q 版纸模（papercraft）成品照：两三头身，头发、衣服都是一片片卡纸剪出来叠成的，能看到折线和纸的厚度。适合做角色周边提案、头像和手工课的成品参考。"
prompt: |
  先看我上传的这张图，把里面角色的脸、发型发色、衣服、配饰和姿势都记下来；然后把这个角色做成一个 Q 版（SD）的纸模小人，给我一张它已经拼装好的成品照。
  - 比例：[2～3 头身]，头大身体小，手脚简化成方方的块面。
  - 材质：整个小人完全由厚卡纸剪裁、折叠、粘贴而成——头发是一缕缕剪开的纸片层层叠出来的，衣服的花纹是印在纸上或用不同颜色的纸拼贴的，围巾、眼镜等配饰也都是纸做的；能清楚看到纸的厚度、折线、切口和层与层之间的小阴影。
  - 脸：大眼睛，简单的小嘴，腮红用一小片粉色纸或淡淡的印色表现；保留原角色最有辨识度的特征（发色、眼镜、标志性配饰）。
  - 姿势：自然站立，正面略微侧身。
  - 拍摄：放在[暖米色]的无缝背景前，柔和的影棚光，脚下有一小片柔和的投影；浅景深，像一张手作成品的商品照。
  - 画面上不能有公司名称、标志、任何文字或水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/lovart_jp/status/2016074165443559465
  author: "@lovart_jp"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文作者发布的英文结构化原文改写为中文；原文要求同时输出\"展开图纸\"和\"成品\"两张图，这里只保留与示例图对应的成品一张，并在说明里给出生成展开图的追加语句；头身比、背景色改为变量"
images:
  - 3547-character-to-chibi-papercraft-figure-1.jpg
imageCredit:
  by: "@lovart_jp"
  url: https://youmind.com/nano-banana-pro-prompts?id=7978
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张角色清楚、最好是全身或半身的图片（原创角色、自己的插画或本人照片均可）。[2～3 头身] 可改成"1.5 头身"更圆更萌；[暖米色] 换成和角色主色相近的浅色。想要配套的图纸，可以在出图后追加一句："再生成一张它的纸模展开图：各部件平铺印在厚纸上，带虚线折线、粘贴边和编号，俯拍，旁边放剪刀和胶水。"

示例图是米色背景前的一个纸模小人：粉色的长卷发由一片片纸条叠成，戴一副棕色的大圆眼镜，围着粉色围巾，穿薄荷绿的毛衣和同色裤子、靴子，毛衣上是浅色的折线花纹；手脚是方块状的，能看到纸的折边，右下角有生成工具自带的四角星标记。

**常见问题**：
- 做成了光滑的黏土或塑料手办：强调"所有部件都是平面的纸折出来的，边缘是直线切口"。
- 不像原角色：把发色、发型和 2～3 个标志性配饰直接写进提示词。
- 纸片太碎太乱：写"部件数量适中，造型简洁"。

**适合**：角色周边和文创提案、社交头像、手工课和亲子活动的成品参考；用他人的角色或照片前请先取得许可。

### 日文原版

```text
[AI Instruction: Image → SD Papercraft Conversion]

Analyze the [Input Image].

Extraction: Read the facial features, hairstyle, hair color, clothing, accessories, and pose of the person/character from the [Input Image].
SD Conversion: Convert into a Super Deformed (SD) character papercraft, 2-3 heads tall.
Output: Generate two images.
[Image 1: Unfolded Template/Parts]
The unfolded state of the papercraft. Colorful parts printed on thick paper. Unfolded templates for the head, face, hair, torso, arms, legs, accessories, etc. Fold lines (dotted lines), glue tabs, and numbers are visible. Scissors, cutters, glue, and a cutting mat are scattered in the background. Overhead view composition. Do not display any company names or logos.

[Image 2: Finished Product]
The assembled three-dimensional papercraft. SD character, 2-3 heads tall. Hairstyle, hair color, clothing, and accessories are reproduced based on the input image. Paper texture, folds, rounded corners, and a handmade warmth. Composition and lighting suitable for product promotion photography.

[Caution]
Do not include any real company names, brand logos, or trademarks.

[Atmosphere]
Quality similar to photos in craft magazines or handmade works. Soft studio lighting, clean background. High resolution.
```

> 改编自 [@lovart_jp](https://x.com/lovart_jp/status/2016074165443559465) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
