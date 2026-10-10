---
title: "海报提示词：旅行照片变\"橡皮章旅行手记\"，左边原片、右边旧纸上一枚多色印章（gpt-image-2）"
slug: travel-photo-rubber-stamp-field-notes
model: gpt-image-2
topics: [poster, photo-edit, illustration]
aspectRatio: "4:3"
needsRefImage: true
useCase: "把旅行风景照做成有收藏感的手记海报：左边保留原照片，右边是大面积留白的旧纸，只盖一枚把地标压缩成简笔的多色橡皮章，下面几行打字机小字写地名、编号和关键词。适合发朋友圈、做旅行相册内页。"
prompt: |
  请把我上传的照片做成一张"橡皮章旅行手记海报"，横版 4:3，每张照片单独输出、不要拼图。画面分左右两区，但不要画出明显的分割线。
  - 左侧约占 58%：忠实保留原照片——主体、地形、建筑、植物、空间关系、自然光线和原本的色彩气氛都不变，只做克制的、艺术出版物级别的调色，加极轻微的胶片颗粒；可以为适应版面自然裁切，但不要拉伸、变形、移动或重画主体；
  - 右侧约占 42%：暖白色的旧纸，有细微纤维和哑光质感，保留大面积空白，让留白成为版面的一部分；
  - 橡皮章：从原照片里提炼最有辨识度的主体轮廓和结构关系，压缩成一枚小小的多色橡皮章图案，只保留让人一眼认出地点的最少信息，删掉人群、车辆、密集的窗户和无关背景；印章位于右侧纸面的中下部，只占右侧高度的三分之一左右，四周留足空白；
  - 套色：从原照片提取[2～4 种]专色油墨，优先低饱和的炭黑、墨绿、砖红、赭黄、灰蓝；每个颜色都像是单独手工盖上去的——有刻刀痕迹、断续的边缘、缺墨、墨色不匀，套色之间有 1～2 毫米的轻微错位，边缘不要数码般光滑；
  - 落款：印章下方用很小的打字机字体写四行：[地名英文]、No. [编号]、[三个关键词]、[年份]。
  - 不要把印章放大成一整幅插画，不要加 Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/lovimg_com/status/2095357522148508079
  author: "@lovimg_com"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "中文思路的英文长提示词，改写为精简的分条中文；合并了按场景分类的提炼规则；落款文字的格式整理为变量；保留左右约 58% / 42% 的版面比例、印章只占右侧三分之一高度、套色错位与缺墨质感等关键约束"
images:
  - 3434-travel-photo-rubber-stamp-field-notes-1.jpg
  - 3434-travel-photo-rubber-stamp-field-notes-2.jpg
imageCredit:
  by: "@lovimg_com"
  url: https://youmind.com/gpt-image-2-prompts?id=33330
  license: CC BY 4.0
verify:
  - "需要上传自己拍的风景 / 建筑照片；示例图中的地标照片由原作者提供"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张主体明确的风景或建筑照片效果最好；[2～4 种] 是印章的颜色数量，想更素就写"2 种"；落款四项可以直接写死，例如"LIJIANG / No. 07 / 雪山 石桥 流水 / 2026"，不写的话模型会根据照片自己生成。多张照片请一张一张做，编号依次递增就是一套。

示例图第一张：左边是黄昏时分松树掩映下的古罗马斗兽场照片，右边米色旧纸的中下部盖着一枚墨绿与砖褐双色的小印章，把松树和斗兽场简化成了几块刻痕分明的色块，下面是四行小字。第二张：左边是水边的红砖钟楼，右边的印章只保留了钟楼和一排房子的轮廓，砖红与灰色套印略有错位。

**常见问题**：
- 左侧照片被重画、细节变了：把"忠实保留原照片，不重画"放到第一条。
- 印章太大太细致：强调"印章只有邮票大小，线条粗、信息少"。
- 没有套色错位和缺墨感：加"像真的刻出来盖上去的，不是滤镜或矢量图"。

**适合**：旅行相册与手账、朋友圈九宫格、明信片设计、民宿与旅行博主的系列封面。

### 原版提示词

```text
Please turn each photo I upload into an independent "Rubber Stamp Travel Field Notes Poster," outputting each photo separately without multi-image collage. The overall layout uses a 4:3 horizontal composition, dividing the screen into left and right areas, but without drawing obvious dividing lines. The left side occupies about 58% of the frame, faithfully preserving the original photo. Accurately maintain the identity of the subject, terrain, buildings, plants, people, spatial relationships, natural lighting, real textures, and original color atmosphere, applying only restrained art-publication-level photographic color grading and adding extremely slight fine film grain. Natural cropping is allowed to fit the layout, but do not stretch, distort, move, replace, or redraw the subject. The right side occupies about 42%, using warm off-white old paper as a background. The paper has subtle fibers, natural grains, slight signs of use, and a matte feel, while retaining large areas of unprinted paper white space, making the void an important part of the layout. Analyze the original photo to extract the most recognizable subject outlines, architectural structures, terrain trends, plant postures, roads, shorelines, or other key visual relationships, compressing them into a small multi-color rubber stamp image. Do not copy everything from the photo item by item. Retain only the minimum information necessary for someone to recognize the original location, subject, and scene relationships at a glance. Delete crowds, vehicles, dense windows, repetitive buildings, fine vegetation, decorative components, and irrelevant backgrounds. The stamp is located in the lower-middle part of the right paper area, occupying only about 30%-38% of the height of the right area, with sufficient white space reserved around it. The stamp cannot be enlarged into a common illustration, full landscape painting, or brand logo. Decide the organization of the stamp based on the original image's composition: - Iconic buildings: Keep the most recognizable outer outlines, roofs, domes, arches, towers, or main structures. - Mountain settlements: Compress buildings into a few stepped color blocks arranged along the terrain. - Coastal scenery: Keep the mountain trends, settlement levels, shorelines, and a few intermittent water ripples. - Urban vistas: Keep the main skyline, one landmark building, and one or two layers of distant mountains. - Natural landscapes: Keep the main mountain bodies, trees, shores, or road directional relationships. - Foreground obstructions: If important to the original narrative, keep them as foreground stamp outlines. Extract 2-4 spot ink colors from the original photo. Prioritize desaturated colors like carbon black, dark green, brick red, ochre yellow, grey-blue, and grey-brown, but do not force a fixed palette. Retain the most recognizable color character of the original photo, allowing only a small area of color for visual emphasis. Each color should appear as if individually hand-stamped: authentic rubber stamp carving textures, hand-cut marks, uneven hatching, outline gaps, broken edges, dry ink shortage, paper transparency, grainy ink, uneven pressure, partial ghosting, and a slight color registration offset of about 1-2 mm. Natural misalignment between different color layers is allowed; edges should not be digitally smooth. The imprint should look like a rubber stamp truly carved and pressed onto old paper, not a filtered photo, smooth vector illustration, or line-art logo. Generate text based on the location, theme, and visual imagery in the photo: Location name in English, No. serial number, three short English keywords, AD year. Place the text below the stamp or in the adjacent white space, using small, restrained, slightly...
```

> 改编自 [@lovimg_com](https://x.com/lovimg_com/status/2095357522148508079) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
