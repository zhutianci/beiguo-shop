---
title: "Logo周边提示词：6 款不同主题的刺绣布章平铺样机（复古 / 露营 / 像素 / 霓虹）（gpt-image-2）"
slug: embroidered-patch-set-mockup
model: gpt-image-2
topics: [logo, ecommerce]
aspectRatio: "16:9"
needsRefImage: false
useCase: "输入品牌名，生成一张亚麻布上平铺的 6 款刺绣布章样机：复古相机、国家公园、像素街机、水彩艺术、花卉、霓虹合成波六种主题，适合品牌周边设计、徽章提案和文创产品图。"
prompt: |
  生成一张写实的产品平铺图：恰好 6 枚刺绣布章放在褶皱的中性亚麻布背景上，展示"[MUSE IMAGE]"和"[MUSE VIDEO]"两个品牌词的不同徽章设计。布章要有触感、像真的缝出来的：凸起的绣线、锁边、轻微阴影、形状各异，整齐排成 3 列 × 2 行。
  画布：横版约 16:9，正上方俯拍；柔和自然光，米色亚麻纹理，清晰的刺绣细节，不要手和包装。
  6 枚布章：
  1. 左上：圆形复古相机布章，暖橙色太阳光芒背景，粗金色绣边，复古相机图案，顶部弧形大字品牌词 1，底部小丝带"ANALOG • EST. [1978]"，点缀小星星和闪电；
  2. 中上：盾形国家公园布章，山脉、松林和蜿蜒河流，青绿与奶白边框，顶部横幅品牌词 2，下方弧形丝带"NATIONAL PARK • EXPLORE • DISCOVER"，底部小横幅"EST. 2024"；
  3. 右上：方形像素街机布章，藏青、青、粉、紫的粗像素边框，中间一台像素相机，顶部品牌词 1，底部"LEVEL 01 • PIXEL MODE"；
  4. 左下：圆形水彩艺术布章，白色锁边，颜料飞溅、花、画笔和调色盘，手写体弧形品牌词 2，底部"CREATE • INSPIRE • PLAY"；
  5. 中下：华丽的椭圆花卉布章，扇贝形奶白边，粉色花朵和绿叶的精致刺绣，中间衬线体品牌词 1，小字"BLOOM & CREATE"；
  6. 右下：黑色六边形霓虹合成波布章，发光紫色边框，复古夕阳、线框网格、棕榈树、山峰和星星，顶部霓虹字品牌词 2，底部"SYNTHWAVE • RETRO"。
  视觉风格：超写实刺绣布章样机，高分辨率绣线质感，清晰的针脚，边缘微微凸起，细微的布料阴影，饱和但有品位的颜色。
  文字要求：所有可见文字都是干净的刺绣字；恰好 6 枚布章，不要多余徽章、标签、水印或物件。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/yousefrol/status/2074561226839921127
  author: "Yousef Rol"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；两个品牌词与年份改为变量，保留 6 款布章的主题和版式描述"
images:
  - 3108-embroidered-patch-set-mockup-1.jpg
imageCredit:
  by: "Yousef Rol"
  url: https://youmind.com/gpt-image-2-prompts?id=27960
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[MUSE IMAGE] 和 [MUSE VIDEO] 换成你的品牌名或社团名（一个也行，两处写同一个），[1978] 换成成立年份。6 种主题可以替换成更贴合你品牌的（咖啡、骑行、校园、电竞），保持"形状 + 背景图案 + 顶部品牌名 + 底部小字"的写法即可。

示例图是米色亚麻布上的 6 枚布章：橙色太阳光芒的复古相机圆章、绿色山林河流的盾形章、粉紫像素相机方章、水彩调色盘圆章、粉色花环椭圆章、黑紫霓虹夕阳六边形章，绣线和锁边质感很真实。

**常见问题**：
- 品牌字拼错：品牌名越短越好，最好一个单词；生成后逐个检查。
- 不像刺绣、像印刷：强调"凸起的绣线、可见针脚、锁边"。
- 用于生产：效果图只做方向参考，打样需要按刺绣工艺重新制版。

**适合**：品牌周边设计、徽章 / 布章提案、文创产品主图、社团纪念品。

### 英文原版

```text
Goal: Create a realistic product-style flat lay of exactly 6 embroidered patches on a neutral wrinkled linen fabric background, showcasing different badge designs for {argument name="brand name" default="Muse Image"} and {argument name="alternate brand name" default="Muse Video"}. The patches should look tactile and sewn, with raised thread, stitched borders, slight shadows, and varied shapes, arranged in a clean 3-column by 2-row grid.

Canvas: Wide horizontal image, approximately 16:9, photographed from directly above. Use soft natural lighting, beige woven fabric texture, crisp embroidery detail, and no hands or packaging.

Layout: Include exactly 6 discrete patches:
1. Top left: round vintage camera patch with warm orange sunburst background, thick golden embroidered border, retro camera illustration, large curved text “MUSE IMAGE” at the top, small text ribbon “ANALOG • EST. 1978” at the bottom, small star and lightning accents.
2. Top center: shield-shaped outdoor national park patch with mountains, pine forest, and winding river, teal and cream border, top banner text “MUSE VIDEO,” lower curved ribbon text “NATIONAL PARK • EXPLORE • DISCOVER,” and small bottom banner “EST. 2024.”
3. Top right: square pixel-art arcade patch with chunky pixel border in navy, cyan, pink, and purple, a pixelated camera in the center, top text “MUSE IMAGE,” and bottom text “LEVEL 01 • PIXEL MODE.”
4. Bottom left: circular watercolor art patch with white stitched edge, paint splashes, flower, brush, and painter palette, handwritten curved top text “MUSE VIDEO,” and bottom text “CREATE • INSPIRE • PLAY.”
5. Bottom center: ornate floral oval patch with scalloped cream border, pink flowers, green leaves, delicate garden embroidery, central serif text “MUSE IMAGE,” and small text “BLOOM & CREATE.”
6. Bottom right: black hexagonal neon synthwave patch with glowing purple border, retro sunset, wireframe grid, palm tree, mountain peaks, stars, top neon text “MUSE VIDEO,” and bottom text “SYNTHWAVE • RETRO.”

Visual style: Hyper-realistic embroidered patch mockup, high-resolution thread texture, visible stitching, slightly raised edges, subtle fabric shadows, saturated but tasteful colors. Each patch should have a distinct theme: vintage analog photography, national park exploration, pixel arcade camera, creative watercolor art, floral craft, and neon retro synthwave.

Text constraints: Render all visible text as clean embroidered lettering. Keep exactly 6 patches and no additional badges, labels, watermarks, or extra objects. Customize the main brand words using {argument name="primary patch text" default="MUSE IMAGE"}, {argument name="secondary patch text" default="MUSE VIDEO"}, and the vintage date using {argument name="vintage year" default="1978"}.
```

> 改编自 [Yousef Rol](https://x.com/yousefrol/status/2074561226839921127) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
