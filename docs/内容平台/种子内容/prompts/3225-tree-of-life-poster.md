---
title: 科研绘图提示词：博物画风放射状"生命之树"系统发育图，细菌 / 古菌 / 真核三大域
slug: tree-of-life-poster
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做生物进化科普、课件封面、自然博物馆风格展板时，生成一张象牙白底的放射状生命之树：中心是共同祖先，三大分支向外展开，枝头画着对应的生物，带图例和说明文字。
prompt: |
  生成一张优雅的科学海报，把[生命之树]呈现为象牙白背景上的放射状系统发育图。
  - 风格：精细的植物博物画与科学图示结合的线描，配色克制：[苔藓绿、深青、琥珀、梅紫、炭灰]；
  - 结构：从中心根部向外分支，根部清晰标注"[Common Ancestor]"；
  - 主要分支：Bacteria、Archaea、Eukaryota；外层分支包括 Plants、Fungi、Animals、Protists、Cyanobacteria，枝头画出对应的代表生物；
  - 顶部标题"[Tree of Life]"，副标题"[Radial Phylogeny]"；
  - 加一个小比例说明"仅为大致分支关系"，以及一个分支颜色图例；
  - 标签易读、分支几何均衡、层级清楚、教育性强；
  - 整体像博物馆科学展板：结构化、精神上准确、视觉丰富，文字锐利、细节精致。
  画幅[16:9]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-scientific-and-educational.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；主题、配色、根部标签、标题、副标题、画幅设为变量；补充了"枝头画代表生物"和图例的描述
images:
  - 3225-tree-of-life-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/scientific-educational/tree-of-life-phylogeny-poster.png
  license: MIT
verify:
  - 示例图是英文版；分支关系是简化示意，用于教学时需按教材核对
  - 换成"猫科动物演化树""汉字演变树"出一次，看放射结构是否保持
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[生命之树] 可以换成"恐龙演化树""犬种起源树""印欧语系谱系图"，分支名称跟着改；配色可以换成"墨黑单色"做成版画风；根部标签和标题都可以写中文，如"[最近共同祖先]""[生命之树]"。示例图是英文横版：中心圆形标签写着 Last Universal Common Ancestor，左侧黄绿色分支是 Bacteria 和 Cyanobacteria，挂着各种细菌形态，右侧是 Plants、Fungi、Animals、Protists，枝头有蕨类、蘑菇、蝴蝶、章鱼、鸟和兔子，下方是 Archaea；左下角有分支图例，右下角是指南针和"Approximate branching only"小字。

**常见问题与调整**：
- 枝干太乱：加"每个主分支颜色统一，分支数量不超过 8 条"。
- 生物画得不像：在分支后写清代表生物，如"Animals：章鱼、鸟、兔子"。
- 中文标签出错：每个标签控制在四个字以内，例如"真核生物""古菌"。
- 想要深色版：改成"深墨绿背景，金色细线"，适合做壁纸。

**适合**：生物进化科普、课件封面、博物馆风格展板与装饰画；分支关系为简化示意，不能当学术分类依据。

### 英文原版

```
Generate an elegant scientific poster visualizing a stylized tree of life as a radial phylogeny diagram on an ivory background. Use fine botanical-meets-scientific linework with a restrained palette of moss green, deep teal, amber, plum, and charcoal. The diagram should branch outward from a central root labeled with crisp in-image text "Last Universal Common Ancestor". Main clades should be labeled "Bacteria", "Archaea", and "Eukaryota", with outer branches including "Plants", "Fungi", "Animals", "Protists", and "Cyanobacteria". Add a title at the top reading "Tree of Life" and a subtitle "Simplified Radial Phylogeny". Include a small scale note "Approximate branching only". Keep labels readable and branch geometry balanced, with clean hierarchy and educational clarity. The overall design should feel like a museum-science graphic: structured, accurate in spirit, visually rich, and rendered with crisp text and refined detail.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
