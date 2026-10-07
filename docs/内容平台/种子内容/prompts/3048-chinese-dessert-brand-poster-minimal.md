---
title: "中式甜品海报提示词：冰糖炖雪梨极简留白海报（玻璃炖盅 + 宋体文案）（gpt-image-2）"
slug: chinese-dessert-brand-poster-minimal
model: gpt-image-2
topics: [food, poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "生成一张参数精确控制的中式甜品品牌海报：秋日窗台上的玻璃炖盅、透明汤勺舀起一块雪梨、左上大片留白放宋体文案，适合甜品店、养生饮品和茶饮品牌的新品海报。"
prompt: |
  一把透明玻璃勺从炖盅里舀起一块晶莹的雪梨，清澈的糖水沿勺尖形成一小段回流。
  为原创滋补甜品品牌"[梨水慢炖]"设计一张 3:4 竖版的冰糖炖雪梨海报。场景只在秋日清晨一张暖白色石材窗台上。
  一个直径约 15 厘米的透明耐热玻璃炖盅放在画面中心偏右，玻璃盖平放在左后方。炖盅七分满，装着清澈的浅金色糖水，里面恰好 8 块雪梨、6 块透明冰糖、3 朵干桂花。玻璃勺从右侧舀起一块梨，停在盅口上方约 4 厘米，糖水回流约 3 厘米。
  炖盅中心位于画面水平 62%、垂直 64% 处，约占画面宽度的 38%。画面左侧（水平 7%～42%、垂直 9%～47%）保留为暖白色文字区。
  前景只有半个切面朝上的新鲜雪梨，背景是柔和的白色纱帘；不要加红枣、枸杞或银耳。
  机位：90mm 微距镜头，从左前方约 14 度角拍摄，距离约 72 厘米，镜头高于炖盅中部 12 厘米。焦点锁定勺中梨肉的纤维、糖水的透明度和玻璃盅边缘，盖子仍可辨认。
  光线：左后方一块约 5500K 的大窗形柔光穿透糖水和梨肉，右前方暖白反光板勾出玻璃轮廓；两缕极淡的热气飘向窗边。
  配色：52% 暖白背景、18% 透明浅金糖水、20% 梨肉乳白、5% 玻璃灰、5% 深棕文字。梨肉柔软微透但保持块状；糖水清澈、低黏度，不是浓稠果酱或奶汤。
  文字只有：品牌名"[梨水慢炖]"、品名"[冰糖炖雪梨]"、主文案"[梨香慢炖，甜意清清落下]"、英文副标题"ROCK SUGAR STEWED PEAR"。左侧主文案用深棕色细宋体分三行，品牌名在顶部，品名和英文在左下。
  锁定：一个炖盅、一个盖、8 块梨、6 块冰糖、3 朵桂花、一把玻璃勺、左后方窗光；不要加药材、第二个炖盅、过多冷凝水、浓重蒸汽或漂浮的梨块。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2086806314068725943
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文描述的英文写法改写为中文；品牌名、品名、主文案改为变量；保留数量、机位、光线和配色比例的精确约束"
images:
  - 3048-chinese-dessert-brand-poster-minimal-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=31098
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：品牌名、品名、主文案三处换成你的产品，例如"[山楂小铺]／[冰糖葫芦]／[一口酸甜，满是冬天]"；换甜品时，把炖盅里的内容、数量和"不要加什么"一起改（如"银耳莲子羹：一朵银耳、8 颗莲子、5 颗红枣"）。这条提示词的特点是把位置、数量、光线、配色都写成了数字，改的时候尽量保留这种写法。

示例图是暖白色调的竖版海报：右侧一只透明玻璃炖盅装着浅金糖水和梨块，一把玻璃勺舀起一块梨、糖水往下滴，左后方放着玻璃盖，前景半个雪梨，左上角是"梨水慢炖"品牌名和三行竖向宋体"梨香慢炖，甜意清清落下"，左下"冰糖炖雪梨 ROCK SUGAR STEWED PEAR"。

**常见问题**：
- 数量不准：模型对 6、8 这类数字未必每次都准，海报效果不受影响时可以放宽。
- 糖水像奶汤：强调"清澈、低黏度、能透光"。
- 字体变成黑体：写明"细宋体，深棕色"。

**适合**：甜品店 / 糖水铺新品海报、养生饮品、茶饮品牌秋冬上新、外卖店铺头图。

### 原版提示词

```text
A transparent glass spoon scoops a piece of translucent snow pear from a stewing pot, with clear syrup forming a small backflow along the tip of the spoon. Design a 3:4 vertical rock sugar stewed pear poster for an original nourishing dessert brand "{argument name="brand name" default="Pear Stewed Slowly"}". The scene is set exclusively on a warm white stone window sill on an autumn morning. A 15cm diameter transparent heat-resistant glass stewing pot is placed slightly to the right of the center, with the glass lid lying flat to the back left. The pot is 70% full of clear light-gold syrup, precisely containing eight pieces of cut snow pear, six pieces of transparent rock sugar, and three dried osmanthus flowers. A transparent glass spoon scoops a piece of pear from the right, stopping about 4cm above the rim of the pot, with the syrup backflow controlled at 3cm. The center of the pot is at 62% horizontal and 64% vertical, occupying about 38% of the frame width. The area from 7% to 42% horizontal and 9% to 47% vertical on the left remains a warm white text zone. The foreground contains only half a fresh snow pear with the cut side facing up, while the background features a soft white sheer curtain; do not add red dates, wolfberries, or tremella. The camera is 12cm above the middle of the pot, using a 90mm macro lens shooting from the front left at a 14-degree angle from a distance of 72cm. The focus is locked on the pear fibers in the spoon, the transparency of the syrup, and the edge of the glass pot, with the lid remaining recognizable. A large window-shaped soft light of about 5500K from the back left penetrates the syrup and pear meat, while a warm white reflector at the front right restores the glass contours. Two strands of very faint steam rise towards the window. The color scheme is 52% warm white background, 18% transparent light-gold syrup, 20% pear milk white, 5% glass gray, and 5% dark brown text. Pear meat should be soft and slightly translucent but retain its chunk shape; syrup should be clear and low-viscosity, not a thick jam or milky soup. Text is limited to brand name "{argument name="brand name" default="Pear Stewed Slowly"}", product name "{argument name="product name" default="Rock Sugar Stewed Pear"}", main copy "{argument name="main copy" default="Pear fragrance stewed slowly, sweetness falls clearly"}", and English sub-title "ROCK SUGAR STEWED PEAR". The main text on the left uses a dark brown fine Song font in three lines, brand name at the top, product name and English at bottom left. Lock one pot, one lid, eight pear chunks, six rock sugar pieces, three osmanthus flowers, one glass spoon, and back-left window light; do not add herbs, a second pot, excessive condensation, thick steam, or floating pear chunks.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2086806314068725943) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
