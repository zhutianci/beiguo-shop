---
title: "旅行照片转建筑档案卡提示词：博物馆标本卡风格地标海报（gpt-image-2）"
slug: photo-to-architecture-specimen-card
model: gpt-image-2
topics: [infographic, poster, photo-edit]
aspectRatio: "4:3"
needsRefImage: true
useCase: "把一张地标旅行照片改造成\"建筑测绘档案 + 博物馆标本卡\"风格的横版海报：主体是精细钢笔线稿，配一小块原色照片细节、等高线地图和编号标注，适合旅行纪念、建筑科普和公众号头图。"
prompt: |
  以我上传的照片为主要参考，生成一张 4:3 横版的[建筑档案标本卡]，灵感来自博物馆档案、建筑测绘图和老式科学文献。
  保留[照片中的地点]的辨识度，但呈现方式要像一份精心整理的建筑研究档案，而不是普通的旅游海报：
  - 把主要地标画成大幅单色钢笔线稿（或单色剪影），细节精细；
  - 在右上角放一小块保留原色的照片局部，展示这个地方最有特点的一个细节，旁边配 4 个取自照片的小色块；
  - 建筑背后铺一层简化的等高线地形图；
  - 加上细小的编号参考点、尺寸标注、箭头、标高线和建筑注释符号，底部放剖面图或高程剖面；
  - 背景是带细微颗粒和瑕疵的米色旧纸。
  配色：[黑、暖米色、橄榄绿加一种点缀色]。
  文字要小巧、典雅、像档案：左上角写地点名称、国家、年份、"No. 019"和 3 个描述关键词。
  加入丝网印刷、绘图墨水、铅笔痕和旧纸的细微不完美感；留出大量空白，整体是博物馆图录式的高级感。
  避免：明信片版式、圆形邮戳、旅游宣传元素、过多文字、卡通风格、光泽效果、3D 渲染、细节过满。
  整体气质：建筑档案 × 博物馆标本 × 老测绘文件 × 当代编辑设计。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Naiknelofar788/status/2094626691234816034
  author: "simeon-sanai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；风格、地点、配色改为变量；把要点列表整理成分组说明，补充\"标题、国家、年份、编号\"的排版位置"
images:
  - 3000-photo-to-architecture-specimen-card-1.jpg
  - 3000-photo-to-architecture-specimen-card-2.jpg
  - 3000-photo-to-architecture-specimen-card-3.jpg
imageCredit:
  by: "simeon-sanai"
  url: https://youmind.com/gpt-image-2-prompts?id=33203
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张地标清晰、主体完整的照片（正面或 3/4 角度最好）。[建筑档案标本卡] 可以换成"植物标本卡""古董器物档案"等同类风格；[照片中的地点] 一般不用改，想强调某个建筑时写成具体名称，如"西安钟楼"；配色可以换成"墨蓝、灰白、砖红点缀"。

示例图是同一提示词做的三张：长城、比萨斜塔、悉尼歌剧院，都是米色旧纸上的大幅钢笔线稿，右上角一块原色照片细节加色卡，四周是等高线、编号 01–03 的引线标注和底部剖面图，左上角是英文地名与"No. 019"。

**常见问题**：
- 画成了普通旅游海报：强调"主体必须是单色线稿，只有右上角一小块是彩色照片"。
- 标注文字糊成一片：注释本来就是装饰，想要可读就把关键词减到 3 个、注释减到 3 条。
- 想要中文标题：把"地点名称"直接写成中文，如"长城 · 中国"，其余英文小字可保留。

**适合**：旅行纪念海报、建筑 / 地理科普配图、公众号与小红书封面、明信片周边。

### 英文原版

```text
Use the uploaded photo as the primary reference. Create a sophisticated 4:3 landscape {argument name="style" default="architectural specimen card inspired by museum archives, architectural surveys, and vintage scientific documentation"}. Keep the {argument name="location" default="original location"} recognizable, but transform the presentation into a curated architectural study rather than a normal travel poster. * Place the main landmark as a large monochrome architectural cutout or finely detailed ink drawing. * Add a smaller original-color photographic fragment showing one distinctive detail of the location. * Include a simplified topographic contour map behind the architecture. * Add tiny numbered reference points, measurement marks, arrows, elevation lines, and architectural annotation symbols. * Use an aged cream paper background with subtle grain and imperfections. * Palette: {argument name="palette" default="black, warm beige, muted olive, and one restrained accent color extracted from the landmark"}. * Typography should be small, elegant, and archival: location name, country, year, No. 019, and 3 descriptive keywords. * Create subtle imperfections resembling screen printing, drafting ink, pencil marks, and old paper. * Keep generous negative space and a sophisticated museum-catalog aesthetic. Important: Avoid postcard layouts, circular stamps, tourist graphics, excessive text, cartoon styling, glossy effects, 3D rendering, and overly detailed illustrations. Overall mood: architectural archive × museum specimen × old survey document × contemporary editorial design.
```

> 改编自 [simeon-sanai](https://x.com/Naiknelofar788/status/2094626691234816034) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
