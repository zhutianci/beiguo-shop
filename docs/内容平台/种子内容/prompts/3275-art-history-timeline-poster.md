---
title: 信息图提示词：超现实主义艺术史时间线海报，融化的钟表变成时间轴（gpt-image-2）
slug: art-history-timeline-poster
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做美术史课件、艺术流派科普、展览导览海报时，把某个流派的发展年表画进一幅该流派风格的画里：时间轴本身就是画中物体，年份节点各配一个象征物，四周是展签式的知识板块。
prompt: |
  一张 16:9 横版的[超现实主义]历史时间线信息图海报，画面本身就采用该流派的风格。
  - 场景：梦境般的荒漠，一只拉长的[融化钟表]变成一条蜿蜒的历史时间轴横贯画面；周围有漂浮的门、被拉长的影子、悬空的抽屉、开裂的石像和不可能的倒影，融合成一个象征性的世界；
  - 时间轴：从左往右斜向延伸，像一条梦境走廊；关键年份放在精致的小标签里，例如[1917、1924、1929、1936]、1940s、1960s，每个年份连着一个奇特的象征物，如眼睛、鸡蛋、电话、鸟笼、面孔、蜡烛，用细腻的错觉写实手法绘制；
  - 背景：温暖的暮色渐变，沙米色、淡金色、褪色的蓝和阴影紫交织，云像画出来的烟雾，地平线不自然地弯曲；
  - 标题：顶部居中、大号戏剧性衬线字"[流派名称]"，下方小字副标题"[副标题]"；
  - 知识板块：不对称地分布在画面四周，每块像略微扭曲的博物馆展签，分别是[起源、宣言、代表艺术家、影响]，以及梦境逻辑和代表作两块，右下角加一个"你知道吗？"小框，写几条原创小知识；
  - 整体：怪诞、诗意、信息丰富、画面华丽，一眼就是该流派的气质；不要复制任何现存艺术作品，不要 logo，不要现代 UI。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/92digitalartArt/status/2064012013357928462
  author: "@92digitalartArt"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；删掉原文中的画家姓名，改为流派风格描述；流派、时间轴主体、年份、标题、副标题、知识板块设为变量
images:
  - 3275-art-history-timeline-poster-1.jpg
imageCredit:
  by: "@92digitalartArt"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case359/output.jpg
  license: CC0 1.0
verify:
  - 示例图里出现了真实艺术家姓名列表和一句署名引言，展示时注意这些文字由模型生成、可能有误
  - 年份与事件对应关系需核对后再用于教学
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：先选流派，再选一个最有代表性的"物体"当时间轴：[超现实主义] + [融化钟表]；换成"印象派"可以用"一条被阳光照亮的河流"，"浮世绘"可以用"一道翻卷的海浪"，"包豪斯"可以用"一条红黄蓝的几何轨道"。年份写你核对过的关键节点，知识板块按需增减。示例图是英文版：顶部大字"SURREALISM"和副标题"TIMELINE OF THE SUBCONSCIOUS"，一只长长的融化钟表从左下蜿蜒到右上，上面站着眼球、鸡蛋、电话、鸟笼、面具和蜡烛，对应 1917 到 1960s 的年份卡片，四周是 ORIGINS、MANIFESTO、KEY ARTISTS、LEGACY 等羊皮纸展签，右下有"DID YOU KNOW?"框。

**常见问题与调整**：
- 年份顺序乱：写"年份从左到右严格递增，均匀分布在时间轴上"。
- 展签文字太多糊掉：每块展签只写标题 + 一行字，或只保留 4 块。
- 想用中文：标题和展签标题改中文，正文小字仍可能不清，建议后期排字。
- 风格不够像该流派：在场景里多写两三个该流派标志性的视觉元素。

**适合**：美术史课件、艺术流派科普、展览导览海报；不适合未经核对直接作为史料，也不要用来仿冒具体艺术家的作品。

### 英文原版

```
A surrealist historical timeline infographic poster in 16:9 horizontal format inspired by Salvador Dalí, featuring a dreamlike desert landscape where a long melting clock transforms into a winding historical timeline path across the composition, with floating doors, stretched shadows, levitating drawers, cracked stone statues, and impossible reflections merging into one symbolic world; the timeline should run diagonally from left to right like a dream corridor, with key surrealism dates placed inside small elegant labels, including 1917, 1924, 1929, 1936, 1940s and 1960s, each date connected to a strange symbolic object such as an eye, an egg, a telephone, a bird cage, a face, or a candle, all drawn with refined illusionistic detail; the background should be a warm twilight gradient blending sand beige, pale gold, faded blue and shadowy violet, with clouds that look like painted smoke and a horizon that bends unnaturally; the title should be placed at the top center in large dramatic serif typography reading SURREALISM, with the subtitle TIMELINE OF THE SUBCONSCIOUS beneath it in smaller elegant text; fact panels should be placed asymmetrically around the dreamscape, each one framed like a museum label but slightly distorted, with short sections labeled ORIGINS, MANIFESTO, KEY ARTISTS, DREAM LOGIC, FAMOUS WORKS, and LEGACY, plus a small DID YOU KNOW? box near the lower right with five original facts; the entire image should feel uncanny, poetic, intellectually rich, visually luxurious, and unmistakably surrealist, with no copied artwork, no logos, no modern UI, 16:9 horizontal ratio
```

> 改编自 [@92digitalartArt](https://x.com/92digitalartArt/status/2064012013357928462) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
