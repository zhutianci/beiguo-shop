---
title: 壁纸提示词：用卫星俯瞰地貌拼出字母（雪原、河网、沙丘、火山熔岩，九联竖条排版）
slug: satellite-letter-typography
model: gpt-image-2
topics: [poster, wallpaper]
needsRefImage: false
aspectRatio: "16:9"
useCase: 想把品牌名、账号名或一个英文单词做成"大地写字"的创意横幅、桌面壁纸或社媒头图时用，每个字母由一种真实地形自然形成，视觉冲击强。
prompt: |
  超写实的轨道卫星俯视图，现代编辑风排版：白色背景上并排排列[9]个竖条画框，合起来拼出"[MADPENCIL]"。
  每个画框只放一个字母，字母完全由真实的地球地形和自然地貌形成，不要叠加文字：
  - 第 1 格：锯齿状山脊和深谷组成尖锐的字母，阴影强烈、岩石质感；
  - 第 2 格：热带密林中蜿蜒的河流勾出字母，水与树冠对比鲜明；
  - 第 3 格：被风塑造的沙漠沙丘形成圆润字母，暖土色、柔和过渡；
  - 第 4 格：拼布般的几何农田组成字母，网格整齐；
  - 第 5 格：冰川和冰盖刻出字母，纯白与深冰蓝、带裂纹；
  - 第 6 格：辫状河网形成字母，分叉的河道自然流动；
  - 第 7 格：弯曲的海岸线勾出字母，能看到浪花和泥沙；
  - 第 8 格：狭窄的峡谷或笔直水道形成极简字母，竖线强烈；
  - 第 9 格：火山地貌，凝固的熔岩流组成字母，深色玄武岩带发光熔岩；
  整体要求：正上方卫星视角，真实卫星影像质感，地形细节极其丰富，各格光线和比例一致，云量很少，高对比、锐利，轻微大气雾感，真彩调色，画框间距干净，像画廊陈列；视觉统一但每格是不同的地貌，字母清晰可读又与地形有机融合；
  画幅[16:9]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2065224886734438454
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；字母数量和拼出的单词设为变量，九种地貌改为按格序描述以便换词；删去机构名、8K 和话题标签
images:
  - 3343-satellite-letter-typography-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case383/output.jpg
  license: CC0 1.0
verify:
  - 换一个 4～6 个字母的短单词出一次，检查字母是否拼对、顺序是否正确
  - 示例图比例约 2:1，确认页面展示时不被裁切
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[MADPENCIL] 换成你要拼的英文单词，[9] 改成对应的字母数，并删减或调整下面的地貌格子，比如拼"HELLO"就保留 5 格，可以选"雪山、河网、沙丘、海岸、火山"。字母越少，每个字母越清楚。示例图是白底上一排九个竖条：依次是灰色山脊的 M、雨林河流的 A、沙丘弧线的 D、绿色农田的 P、雪白冰原的 E、灰色辫状河网的 N、蓝色海湾的 C、峡谷水道的 I 和红色熔岩的 L。

**常见问题与调整**：
- 字母拼错或顺序乱：减少字母数，并在每格描述里直接写明"第 1 格是字母 H"。
- 字母看不出来：加"字母轮廓占画框高度的 80%，与周围地形明暗反差大"。
- 想拼中文：中文笔画复杂，效果不稳定，建议改用拼音首字母或数字年份（如"2026"）。
- 做手机壁纸：改成竖版 9:16，字母从上到下排列成一列。

**适合**：品牌名创意横幅、桌面壁纸、地理 / 科普类账号头图；不适合拼写较长的句子。

### 英文原版

```
Ultra-realistic overhead satellite view from orbit, a crisp modern editorial layout featuring 9 vertical panels arranged side by side on a white background, together spelling "MADPENCIL", each panel containing a single letter formed entirely from real Earth terrain and natural topography, no text overlays:

Panel 1 (M): jagged mountain ridges and deep ravines composing a sharp angular "M", dramatic shadows, rocky surface
Panel 2 (A): a meandering river through thick tropical forest shaping an "A", vivid contrast between water and canopy
Panel 3 (D): vast desert sand dunes sculpted by wind into a smooth "D", warm earthy tones, gentle gradients
Panel 4 (P): patchwork cropland and geometric farm fields arranged into a structured "P", clean grid patterns
Panel 5 (E): glacial formations and ice sheets carving a crisp "E", pure whites and deep icy blues, cracked textures
Panel 6 (N): a braided floodplain river system forming "N", branching channels and natural flow patterns
Panel 7 (C): a curved coastline and ocean meeting point shaping "C", wave breaks and sediment visible
Panel 8 (I): a narrow slot canyon or straight waterway forming a minimal "I", strong vertical line
Panel 9 (L): volcanic landscape with hardened lava flows forming an "L", dark basalt with glowing lava accents

straight-down satellite perspective, NASA Earth imagery aesthetic, hyper-detailed terrain, realistic geography, consistent lighting and scale across panels, minimal cloud cover, high contrast, sharp resolution, subtle atmospheric haze, true-color grading, ultra high resolution 8K, clean panel spacing, gallery-style composition, visually unified but each panel a distinct biome, letters legible yet organically merged with the landscape

#AIart #GPTImage2
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2065224886734438454) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
