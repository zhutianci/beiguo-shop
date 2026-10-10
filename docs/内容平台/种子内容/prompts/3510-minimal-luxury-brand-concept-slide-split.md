---
title: "ppt提示词：极简高级感品牌理念页，左半留白排字 + 右半清水混凝土光影人像（gpt-image-2）"
slug: minimal-luxury-brand-concept-slide-split
model: gpt-image-2
topics: [ppt, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做品牌提案、设计汇报里的\"理念页\"或章节封面：左半边是大量留白和几行拉开字距的细体字，右半边是一张安静的建筑光影照片，黑白灰的克制配色，高级品牌画册的感觉。"
prompt: |
  生成一张 16:9 宽屏的极简奢侈品牌理念幻灯片，左右对开的杂志式版面，字很少，配一张电影感的建筑照片。
  - 画布：左半边是干净的白色，右半边是一张顶天立地的照片；配色克制——白、炭灰、近黑的深藏青、冷灰和柔和的日光。
  - 左半边（留白排字区）：
    - 最左侧靠近边缘有一条细竖线，中间断开，断口处竖排一个小小的品牌名"[BRAND]"；
    - 靠上位置是字距拉得很开的细体大写标题"[CONCEPT]"；
    - 中部是一个由恰好 2 个深藏青色方块组成的抽象小标志，右边跟着字距很开的大字"[KEY MESSAGE]"；
    - 标志下方一条短横线，再往下两行很小的说明文字："[Short statement line]"和"[Supporting line]"；
    - 其余全部留白。
  - 右半边（照片区）：清水混凝土的室内空间，一位穿深色长外套、头发挽起的人物背对或侧对镜头，静静站在落地窗前，阳光斜斜地穿过空间，在墙面和地面上投下柔和的光束和影子，窗外是虚化的绿植。
  - 气质：安静、克制、有建筑感，像高端品牌画册的一页；文字清晰锐利；不要水印和页码。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/furoku/status/2058185946030571925
  author: "@furoku"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；品牌名、大标题、核心信息、两行说明文字改为变量；保留\"左右各 50%\"\"标志由恰好 2 个深色方块组成\"等版式约束"
images:
  - 3510-minimal-luxury-brand-concept-slide-split-1.jpg
imageCredit:
  by: "@furoku"
  url: https://youmind.com/gpt-image-2-prompts?id=22164
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[BRAND] 填品牌名（竖排小字，英文最稳）；[CONCEPT] 是章节名，可换成"VISION""STORY"或 2～4 个汉字；[KEY MESSAGE] 填这一页最想让人记住的一句话，英文建议 3 个单词以内、中文 8 个字以内；两行小字是补充说明。右侧照片的场景也可以换，如"晨雾里的茶园与采茶人背影""展厅里的一件雕塑"，保持低饱和和大面积阴影就不会跑偏。

示例图左边是白底：左缘一条断开的细竖线夹着竖排的"BRAND"，上方是"CONCEPT"，中间是两个深色方块组成的小标志和"KEY MESSAGE"，下面一条短线和两行小字；右边是混凝土墙面的室内，一位穿黑色长衣的女性侧身站在窗前，光线从右侧斜射进来。

**常见问题**：
- 左侧被塞进多余的装饰或图标：强调"左半边除指定文字外全部留白"。
- 中文字距太挤没有高级感：写"字距拉开、细体、字号偏小"。
- 照片太亮太艳：加"低饱和、冷灰色调、高光不过曝"。

**适合**：品牌提案、室内与建筑设计汇报、发布会主视觉的理念页和章节过渡页。

### 英文原版

```text
Goal: Create a minimalist luxury brand concept presentation cover slide for {argument name="brand name" default="BRAND"}, using a split editorial layout with sparse typography and a cinematic architectural photo.

Canvas: 16:9 widescreen slide, clean white background on the left half and a full-height photographic image on the right half. Use a refined monochrome palette: white, charcoal, deep navy-black, cool gray, and soft daylight.

Layout: Divide the slide vertically at the center. The left 50% is a white design area with generous negative space; the right 50% is a photo panel. On the far left, place one thin vertical line near the margin, broken into two segments with the vertical word “BRAND” centered between them. Near the top-left area, set the large spaced-out headline “CONCEPT”. In the middle-left area, place a small abstract geometric logo made from exactly 2 dark navy square/rectangular blocks, followed by the large spaced-out title “KEY MESSAGE”. Under the logo/title row, add one short horizontal rule, then exactly 2 small supporting text lines: “Short statement line” and “Supporting statement line”.

Text content: Use {argument name="main headline" default="CONCEPT"} as the top headline, {argument name="key message text" default="KEY MESSAGE"} as the central title, and the two supporting lines {argument name="supporting copy" default="Short statement line / Supporting statement line"}. All typography should be uppercase or title-like where shown, with wide letter spacing, thin modern sans-serif font, dark navy-black color, and precise alignment.

Photo panel: The right half should show a quiet, high-end architectural interior with concrete walls, tall floor-to-ceiling windows, soft natural light, and strong diagonal shadows. Include exactly 1 human figure: {argument name="photo subject" default="a woman in a long black coat, seen in side profile, standing calmly and looking out the window"}. The figure should be positioned slightly right of center in the photo panel, elegant and contemplative, with a low bun hairstyle and minimal detail.

Visual style: Premium Japanese/Scandinavian editorial design, calm, spacious, museum-like, understated corporate branding, cinematic realism on the photo side, sharp typography on the white side.

Constraints: Keep the composition uncluttered. Use exactly 1 vertical brand label, exactly 1 headline, exactly 1 abstract logo, exactly 1 central title, exactly 1 horizontal rule, exactly 2 supporting text lines, and exactly 1 person in the photo. No extra icons, no mockup borders, no watermark.
```

> 改编自 [@furoku](https://x.com/furoku/status/2058185946030571925) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
