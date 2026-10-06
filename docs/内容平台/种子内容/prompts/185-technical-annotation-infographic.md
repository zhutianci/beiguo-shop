---
title: nano banana 技术注释信息图提示词：实物照片 + 黑色工程手绘标注（博物馆说明牌风格）
slug: technical-annotation-infographic
model: nano-banana
topics: [infographic, ecommerce]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做数码产品科普、详情页卖点图、知识类社媒封面时，生成"写实产品 + 黑色针管笔工程标注"的信息图，标出部件、尺寸、材料和工作原理，质感像博物馆展品说明。
prompt: |
  为[无线耳机充电盒]制作一张信息图：写实照片级的物体，上面直接叠加技术注释。
  用黑色针管笔 / 建筑草图风格的线条和文字，背景为纯白摄影棚，内容包括：
  - 关键部件标签；
  - 内部剖面或爆炸视图的轮廓线；
  - 尺寸、规格和比例标记；
  - 材料说明和数量；
  - 表示功能、受力或流向（气流、声音、电流）的箭头；
  - 必要时加入简单的原理图或剖面图。
  在一个角落里放一个手绘的技术注释框，写上标题"[无线耳机充电盒]"。
  版式要求：真实物体在标注下方清晰可见；标注有手绘感但专业精确；构图干净、留白均衡；整体像博物馆展品说明或工程手册。
  配色只用白底和黑色线条文字，不加其他颜色。1:1，超清晰，无水印。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/TechieBySA/status/2013316513701216688
  author: "@TechieBySA"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文，物体名称设为变量并给出示例；删去"社媒优化"等与画面无关的表述；保留原有结构
images:
  - 185-technical-annotation-infographic-1.jpg
imageCredit:
  by: "@TechieBySA"
  url: https://x.com/TechieBySA/status/2013316513701216688
  license: CC BY 4.0
verify:
  - 实测中文标注是否清晰；中文错字多时改用英文标注
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：把两处 [无线耳机充电盒] 换成同一个物体即可，数码产品、厨房电器、乐器、自行车、甚至一杯咖啡都能做。示例图是原作者做的 iPhone、相机、耳机、键盘四联图。如果有自己产品的实拍图，可以上传并在开头加"使用上传图片中的产品"。

**常见问题**：
- 标注的参数是编的：模型会生成"看起来合理"的尺寸和材料，商用前一定要替换成真实参数，或在提示词里直接写出关键参数。
- 中文小字容易错：标注改成"英文"或"中英双语"更稳。
- 想加一点颜色：把最后一句改成"只用一种强调色（如橙色）标出最关键的 3 个部件"。

**适合**：产品详情页、科普账号、课程封面、工业设计作品集。

### 英文原版

```
Create an infographic image of [OBJECT], combining a realistic photograph or photoreal render of the object with technical annotation overlays placed directly on top.

Use black ink–style line drawings and text (technical pen / architectural sketch look) on a pure white studio background, including:
•Key component labels
•Internal cutaway or exploded-view outlines
•Measurements, dimensions, and scale markers
•Material callouts and quantities
•Arrows indicating function, force, or flow (air, sound, power, pressure)
•Simple schematic or sectional diagrams where relevant

Place the title [OBJECT] inside a hand-drawn technical annotation box in one corner.

Style & layout rules:
•The real object remains clearly visible beneath the annotations
•Annotations feel sketched, technical, and architectural
•Clean composition with balanced negative space
•Educational, museum-exhibit / engineering-manual vibe

Visual style:
Minimal technical illustration aesthetic, black linework over realistic imagery, precise but slightly hand-drawn feel.

Color palette:
White background, black annotation lines and text only. No colors.

Output:
1080×1080, ultra-crisp, social-feed optimized, no watermark.
```

> 改编自 [@TechieBySA](https://x.com/TechieBySA/status/2013316513701216688) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
