---
title: 科研绘图提示词：科学概念字体海报，用 DNA 双螺旋、分子键、时空网格拼出单词（gpt-image-2）
slug: science-word-typography-poster
model: gpt-image-2
topics: [infographic, poster]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做科普讲座标题页、理科课件封面、实验室 / 社团海报时，输入一个科学概念词，生成黑板粉笔或蓝图风格的字体海报：每个字母都由该概念的分子结构或物理图示构成，四周配公式和小图解。
prompt: |
  主体：单词"[科学概念]"，每个字母都由与这个概念相关的分子结构、化学键或物理图示构成，所有字母完整可读。
  - 字形示例：DNA——字母由双螺旋的梯级和骨架曲线构成；CARBON——字母由苯环六边形和键线搭成；GRAVITY——字母向一个质量点弯曲拉伸，下方笔画像被引力透镜拉长；ELECTRICITY——字母由电路符号和导线构成；
  - 材质：科学黑板质感——深色底上的白色粉笔或马克笔线条；或者蓝图底色配白色图解线稿，二选一：[黑板 / 蓝图]；
  - 周边：标题上方一行英文或中文的短句点题（如"[生命的蓝图]"），下方和两侧配几个相关的小图解、公式和图例，排版像科学杂志封面或大学讲座海报；
  - 光线：平整、均匀、学院感，像投影在讲座屏幕上；
  - 不要：写实的分子三维渲染、立体阴影、按标准配色的彩色原子球、真实的实验室照片。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2057297076032262574
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文；把原文"锚点 / 形态 / 材质 / 光照 / 渲染 / 负面"的权重结构改写成自然语言要点，删掉权重数字；参照示例图补充了 ELECTRICITY 字形和周边公式图解；概念词、底色、点题短句设为变量
images:
  - 3274-science-word-typography-poster-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case303/output.jpg
  license: CC0 1.0
verify:
  - 示例图是四个单词的 2×2 合集（原帖分别生成），单次一般只出一个，页面需说明
  - 示例图周边的公式和数值由模型生成，可能有错误，用于教学前需核对
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[科学概念] 填一个英文单词效果最稳，例如"ATOM""LIGHT""NEURON""ENTROPY"；想做中文版可以试"光""熵"这类一两个字的词，并写明"汉字笔画由光线折射图构成"。[黑板 / 蓝图] 选一种底色。示例图是 2×2 合集：左上蓝图底上用双螺旋拼成的"DNA"，下方有碱基配对说明和基因序列；右上黑底白线用六边形和分子结构拼成"CARBON"，配石墨烯、富勒烯小图；左下"GRAVITY"字母被弯曲的时空网格拉向一个质量点；右下"ELECTRICITY"由电路符号组成，配欧姆定律、交流波形和电路图例。

**常见问题与调整**：
- 字母认不出来：加"字母轮廓优先清晰，结构图案只作为笔画的填充"。
- 变成彩色三维分子：重复"只用单色线稿，平面，无阴影"。
- 周边公式写错：只保留标题和一两个简单图例，或把正确公式直接写进提示词。
- 想做竖版海报：画幅改 3:4，单词竖排或拆成两行。

**适合**：科普讲座标题页、理科课件封面、实验室 / 社团海报；不适合直接当作严谨的科学图解。

### 英文原版

```
Anchor: The word "[SCIENTIFIC CONCEPT (e.g.,  CARBON / DNA / GRAVITY)]" :: where each  letter is constructed from the molecular  structure, atomic bonds, or physical  diagrams associated with that concept ::4  Morphology: DNA — letters formed from  double helix ladder rungs and backbone  curves. CARBON — letters built from  benzene ring hexagons and bond lines.  GRAVITY — letters curve and stretch  as if pulled toward a point mass,  lower strokes elongated by gravitational  lensing. All fully readable ::3  Material Physics: Scientific whiteboard  aesthetic — white chalk or marker on  dark ground. Or blueprint blue with  white diagrammatic linework ::3  Illumination: Flat, even, academic —  as if projected on a lecture screen ::2  Render Stack: Science magazine cover,  university poster, Ted Talk title card ::1  Negative: [photorealistic molecular  renders, 3D shading, color-coded  atoms in standard CPK colors,  realistic laboratory imagery] :: -1
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2057297076032262574) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。
