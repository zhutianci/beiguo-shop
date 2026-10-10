---
title: "课件PPT封面提示词：水彩植物 + 新文人排版的学术风封面（蓝莓示例）（gpt-image-2）"
slug: watercolor-courseware-cover-slide
model: gpt-image-2
topics: [ppt]
aspectRatio: "16:9"
needsRefImage: false
useCase: "用淡雅的水彩植物插画和中式编辑排版做一页学术风课件封面，左侧宋体竖叠大标题，四周是金色细线标注和竖排引文，适合科普、植物、食物主题的课程与讲座。"
prompt: |
  生成一页优雅的 16:9 宽屏 PPT 课件封面，主题是[蓝莓的前世今生]，融合中式编辑排版与柔和的水彩植物插画。
  画布：横版演示页，暖米白手工纸背景，带细纤维、淡淡污渍和极少的墨点。
  版式：
  - 左侧三分之一是深蓝灰色的中文大标题"[蓝莓的前世今生]"，分两行竖向叠放，行距宽松，使用精致的宋体 / 明朝体衬线字；
  - 标题上方一行小号全大写"PPT COURSEWARE"，前面一个金色小圆图标；
  - 标题下方一条细金线和一行小号衬线大写英文副标题"THE PAST AND PRESENT OF [BLUEBERRIES]"；
  - 左下角是大号衬线数字年份"[2026]"，下面一条细横线，再下面是用竖线分隔的六个中文小分类："起源 | 演化 | 传播 | 栽培 | 科学 | 生活"。
  主画面：画面中恰好 6 个蓝莓相关的水彩元素——中上部 1 颗大而柔和的蓝莓（带深色星形萼片）、它左下方 1 片斜放的半透明蓝色叶子、左下 1 颗小蓝莓（标注 origin）、中右下 1 对模糊的蓝莓、右侧 1 个圆形蓝莓切面（淡色果肉和小籽点，标注 cut）、右下 1 团模糊的小蓝莓晕染。所有果实都是低饱和的靛蓝、烟蓝和灰蓝，边缘是羽化的水彩晕染。
  技术标注：加入细金色和蓝灰色图解符号——小十字、点状引导线、小圆圈、靶心环和细引线；恰好 3 个数字标签："01"在中上蓝莓旁、"02"在中右那对蓝莓旁、"01"作为右下角页码。
  右侧边缘：一列窄窄的竖排中文小字"[一颗小小的蓝色果实，如何与人类相遇]"，旁边是更小的竖排英文装饰文字。
  视觉风格：极简高级的学术演示设计，新文人美学，植物科学笔记感，大量留白，柔和的水墨水彩，低饱和的海军蓝和灰色，克制的古金色点缀；字体清晰、果实有手绘感。不要人物、不要照片质感的水果、不要鲜艳颜色、不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2056620564048224765
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主题、中文标题、英文副标题、年份、竖排引文改为变量；修正原文\"五个分类标签\"实际列了六个的问题，统一为六个"
images:
  - 3018-watercolor-courseware-cover-slide-1.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=21566
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：把主题、中文标题、英文副标题和竖排引文一起换掉，例如"茶叶的前世今生 / THE STORY OF TEA"，再把 6 个水彩元素改成茶叶、茶花、茶汤切面等，配色改成"淡绿、灰绿、古金"。年份和六个分类词按课程内容调整。

示例图是米白纸上的封面：左侧深蓝灰宋体"蓝莓的 / 前世今生"，下面细金线和英文副标题，左下大号"2026"和一排分类词；中右是几颗晕染开的靛蓝水彩蓝莓和一片蓝叶、一个切面，周围金色细线、小十字和"01""02"标注，右侧竖排小字。

**常见问题**：
- 水果画得太写实：强调"水彩晕染、羽化边缘，不要照片质感"。
- 竖排小字有错字：引文控制在 20 字以内。
- 想做配套内页：保留纸张、配色、金色细线标注的描述，把左侧大标题换成"章节标题 + 3 条要点"。

**适合**：科普 / 植物 / 饮食主题课件、讲座封面、读书分享会、学术汇报首页。

### 英文原版

```text
Goal: Create an elegant widescreen PPT courseware cover slide about {argument name="topic" default="the past and present of blueberries"}, blending Chinese editorial typography with soft watercolor botanical illustration.

Canvas: 16:9 landscape presentation slide, warm off-white handmade paper texture background with subtle fibers, faint stains, and minimal ink speckles.

Layout: Left third is dominated by a large Chinese title in dark blue-gray: {argument name="Chinese title" default="蓝莓的\n前世今生"}. Place the title in two stacked lines with generous spacing, using a refined Song/Ming-style serif font. Above it, small uppercase text reads “PPT COURSEWARE” preceded by a tiny gold circular icon. Under the title, add a short thin gold line and the English subtitle in small serif capitals: {argument name="English subtitle" default="THE PAST AND PRESENT OF BLUEBERRIES"}. Bottom left shows the year {argument name="year" default="2026"} in large serif numerals, with a thin horizontal line beneath, then five small Chinese category labels separated by vertical dividers: “起源 | 演化 | 传播 | 栽培 | 科学 | 生活”.

Main imagery: Use exactly 6 visible blueberry-related watercolor elements across the slide: 1 large soft blue blueberry bloom near the upper center with a dark star-shaped calyx, 1 translucent blue leaf angled diagonally below-left of it, 1 small blueberry bloom near lower left labeled “origin”, 1 clustered pair of blurry blueberries near lower middle-right with one visible calyx, 1 circular blueberry cross-section on the right labeled “cut” with pale pulp and small seed dots, and 1 small fuzzy blueberry wash near the lower right. Keep all fruit elements desaturated indigo, smoky blue, and gray-blue, with feathered watercolor edges.

Technical annotation details: Add fine gold and blue-gray diagram marks: tiny crosses, dotted guide lines, small circles, target rings, and thin leader lines. Include exactly 3 small numeric labels: “01” near the upper-center blueberry, “02” near the middle-right cluster, and “01” as a page number at the bottom right. Add the labels “origin” and “cut” in very small serif text.

Right margin: Add a narrow vertical text column on the far right with small Chinese copy: {argument name="vertical quote" default="一颗小小的蓝色果实，如何跨越时间与空间，与人类的文明相遇、相知、相伴。"}. Beside or below it, add very small vertical English text in uppercase, decorative and partially editorial, about blueberries traversing time and space.

Visual style: Minimal premium academic presentation design, Chinese new-literati aesthetic, botanical science notes, high negative space, soft ink-wash watercolor, muted navy-blue and gray palette with restrained antique-gold accents, crisp typography but organic painted fruit. No people, no photorealistic fruit, no bright colors, no watermark.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2056620564048224765) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
