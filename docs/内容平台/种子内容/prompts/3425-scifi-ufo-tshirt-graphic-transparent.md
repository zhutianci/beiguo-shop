---
title: "T恤设计提示词：可直接印制的印花图案，3D 飞碟 + 霓虹光束 + 金属大字的科幻主题（gpt-image-2）"
slug: scifi-ufo-tshirt-graphic-transparent
model: gpt-image-2
topics: [fashion, ecommerce, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给 T 恤、卫衣、帆布袋设计一张可直接印制的主题图案：一个醒目的 3D 主体（如飞碟）加一行未来感大字，边缘干净、无背景，适合做文创周边和按需印刷的印花稿。"
prompt: |
  一张[流行文化科幻主题]的高品质 T 恤印花图案，主体独立、完全透明无背景，居中放在正方形画布上，画幅 1:1。
  - 主体：一个[醒目的 3D 飞碟]，光滑的金属镀铬机身，底部是发光的青色灯带，向下投出一道明亮的霓虹洋红色锥形光束；
  - 点缀：飞碟下方有一个很小的人形剪影，仰头望着它，简单到一眼能看懂；周围有几颗漂浮的小星星和细细的轨道环碎片，增加一点宇宙感但不杂乱；
  - 文字：只有一处文字——大标题"[FIRST CONTACT]"，用一种粗壮的未来感展示字体，超大、清晰易读，放在飞碟正下方；
  - 不要小字、副标题和多余的词，不要场景、边框、光晕和任何背景元素；
  - 边缘锐利干净，像矢量图一样，适合服装数码直喷印刷，高分辨率，专业 3D 渲染质感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/92digitalartArt/status/2057141494729830591
  author: "@92digitalartArt"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主题、主体物、标题文字设为变量；保留\"只有一行大字、没有小字和背景\"的约束；补充了示例图右侧\"上身效果\"是原作者另行展示的说明"
images:
  - 3425-scifi-ufo-tshirt-graphic-transparent-1.jpg
imageCredit:
  by: "@92digitalartArt"
  url: https://youmind.com/gpt-image-2-prompts?id=21671
  license: CC BY 4.0
verify:
  - "模型不一定能输出真正的透明通道，印制前检查背景是否需要另行抠除"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[流行文化科幻主题] 可以换成"复古露营主题""赛博朋克猫咪主题"；[醒目的 3D 飞碟] 换成你的主体，如"戴耳机的宇航员头盔""喷火的小恐龙"，后面两句的材质和光效也跟着改；标题文字建议用 1～3 个英文单词或 2～4 个汉字，字越少印出来越好看。

示例图左半边是图案本身：黑底上一架银色飞碟，底部青色灯光，向下打出粉紫色光束，光束里站着一个小小的人影，下方是金属质感的大字"FIRST CONTACT"；右半边是原作者展示的上身效果——图案印在一件黑色 T 恤胸前。

**常见问题**：
- 背景不是透明而是黑色 / 棋盘格：让它输出"纯色背景（与衣服同色）"，再用抠图工具处理。
- 图案细节太多、印出来糊：删掉星星和轨道环，只留主体和标题。
- 出现多余小字：保留"只有一处文字"那一条并放到最前面。

**适合**：T 恤 / 卫衣 / 帆布袋印花、社团文化衫、周边设计初稿。售卖前请确认图案不含他人受保护的形象或商标。

### 英文原版

```text
A {argument name="theme" default="premium pop nerd culture t-shirt graphic"} isolated on full transparency with no background, centered in a square canvas, featuring a {argument name="hero object" default="bold 3D flying saucer"} as the hero object, designed with a sleek metallic chrome body, glowing cyan underside lights, and a luminous neon magenta beam projecting downward in a clean dramatic cone; beneath the UFO, a tiny silhouetted human figure looks upward in awe, kept simple and minimal for readability, while small floating stars and thin orbital ring fragments add just enough cosmic energy without clutter; the only text should be the {argument name="text title" default="large title “FIRST CONTACT”"} in a single bold futuristic display font, oversized, highly legible, and placed prominently below the UFO; no tiny text, no subtitles, no extra words, no scenery, no frame, no halo, no background elements, crisp sharp vector-clean edges, optimized for direct-to-garment printing and merch sales, high-resolution 4000x4000 px, professional 3D render quality, isolated on complete transparency, 1:1 square ratio.
```

> 改编自 [@92digitalartArt](https://x.com/92digitalartArt/status/2057141494729830591) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
