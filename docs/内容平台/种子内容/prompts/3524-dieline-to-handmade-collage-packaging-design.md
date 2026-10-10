---
title: "ai包装设计提示词：上传刀版图生成手工拼贴风包装展开图，粗黑体大字 + 黑白剪影（gpt-image-2）"
slug: dieline-to-handmade-collage-packaging-design
model: gpt-image-2
topics: [ecommerce, illustration, poster]
aspectRatio: "16:9"
needsRefImage: true
useCase: "手里已经有包装盒的刀版图（展开图），想快速看一版有设计感的包装方案：把产品名告诉模型，它会沿着刀版的每个面排好主视觉、侧面卖点、背面说明，风格是手工拼贴——粗黑体大字、黑白剪影小人和主题色块。"
prompt: |
  我上传的图片是一张包装盒的刀版图，要装的产品是：[柠檬清爽饮料]。请不要改动刀版的外轮廓、折线和每个面的位置，直接在这张展开图上做一套手工拼贴风的包装设计；成品仍是带刀线和折线的平面展开图。
  - 整体风格：有手工拼贴感的信息视觉。观者第一眼看到的是一条强烈而安静的文字中轴——字体用粗壮、简洁的黑体，像方块一样排布，四周留白充足。
  - 图形：把主题内容转化成几组粗粝的黑白人物剪影和由主题衍生的色块；剪影小人分布在文字两侧，以触碰、托举、悬停、遮挡的方式和主题物互动（例如爬梯子摘柠檬、举起杯子、坐在柠檬片上），像一场搬运、摆放和观察的小仪式。
  - 色块与质感：主色是[柠檬黄和嫩绿]，加黑色和米白色纸底；色块边缘像剪刀剪出来或手撕的，带纸张颗粒和轻微的印刷错位；点缀一些圆点、短线和小花形。
  - 正面主展面：竖排或分行的大字"[柠檬清爽饮料]"，下面一行小字副标题，底部标注"净含量：[500mL]"。
  - 侧面：三个小图标配三句短卖点（如清爽口感、柠檬风味、冰饮更佳）。
  - 背面：英文品名、一小段产品介绍、配料表、营养成分表、贮存条件、生产信息和条形码的位置；这些内容用示意性的占位文字，不要编造真实的厂名、地址和电话。
  - 顶盖和底盖：只放小面积的图案和一句短语。
  - 中文一律用简体字，几处大字要清楚、不能写错。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2072700281192915107
  author: "@xiaoxiaodong01"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "仓库收录的英文版译为中文并精简为分条；产品名保留为变量，新增主色、正面大字、净含量三个变量；背面配料表和营养成分的示例数字改为要求用占位内容"
images:
  - 3524-dieline-to-handmade-collage-packaging-design-1.jpg
imageCredit:
  by: "@xiaoxiaodong01"
  url: https://youmind.com/gpt-image-2-prompts?id=27446
  license: CC BY 4.0
verify:
  - "示例图背面的营养成分表、条形码和厂址均为示意内容；\"降火\"一类的功能性说法不宜直接用于真实食品包装，正文已提醒"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先上传你的刀版图（白底、线条清楚的展开图最好，模切线和折线用不同颜色或线型区分）。[柠檬清爽饮料] 在提示词里出现两次，换成你的产品名时两处都改；主色写两种与产品相关的颜色；净含量按实际规格填。产品换了以后，把括号里的互动示例也换成对应的动作，例如茶叶写"采茶、捧杯、闻香"。

示例图是一张横向的纸盒展开图，带蓝色刀线和红色折线：正面是三行粗黑的中文大字，旁边是爬梯子摘柠檬的黑色剪影小人、黄色的柠檬和绿色的色块；左侧窄面是三组小图标和卖点；右侧背面是英文品名、产品介绍、配料与营养成分表和条形码；上下盖片上是小柠檬和叶子图案。

**常见问题**：
- 设计跑出了刀版的范围或刀线消失：强调"刀线和折线原样保留，所有图文都在各个面的安全区内"。
- 背面小字乱码：这是常态，背面只当版式参考，正式文字要自己重排并核对。
- 剪影小人太多太乱：限定"全盒不超过 5 个人物剪影"。

**适合**：包装提案前期找方向、给设计师看的风格参考。食品包装上的营养成分、配料、功能性说法（如示例图里的"降火"）都有法规要求，不能直接照搬生成结果。

### 原版提示词

```text
This is my dieline image, my product is: {argument name="product name" default="Lemon cooling drink"}

I want you to refer to the following prompt style to generate packaging: Generate an information visual with a handmade collage feel around any subject. The viewer should first see a strong and quiet central text axis, with fonts using thick, simple, block-like arrangements with ample white space, like white structures precisely embedded in the background; the theme content is translated into several groups of rough black-and-white silhouettes and theme-derived color blocks, with silhouettes distributed on both sides of the text in relationships of touching, holding, hovering, and blocking, forming a visual ritual like moving, placing, and observing the theme. The main graphics use edges like rubbing, woodcut, dry brush, and paper cutting. The black structure bears weight and direction, and the white structure creates breath and contrast. A small amount of theme color blocks with lines or textures serve as the core symbols being held up, scattered in size with clear gaps between each other. The background maintains a large area of bright, transparent, and clean high-brightness field, with colors extracted from the theme's own material, emotion, and context: {argument name="color scheme" default="the base color is responsible for the light and airy feeling, the dark color for the skeleton and tension, and the medium saturation theme color for the emotion"}. A very small number of small dots or short lines serve as beats and visual pauses; the overall color relationship is bright and refreshing, restrained but full of vitality, avoiding muddiness, staleness, and gloom. The information hierarchy should be as clear as an exhibition visual system, with the main title being the largest and most orderly, and secondary information like date, description, and signature narrowed into edge vertical arrangements or small font modules, forming a rhythm where images and text hold each other back; the final effect should be like a modern art promotional visual organized from silhouettes, paper pieces, rubbing textures, and geometric white space, with both handmade traces and maintaining a clean, clear, and readable look.
```

> 改编自 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01/status/2072700281192915107) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
