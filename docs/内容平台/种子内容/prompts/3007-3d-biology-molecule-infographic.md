---
title: "生物科普信息图提示词：3D 分子结构图（DNA 双螺旋碱基配对标注）（gpt-image-2）"
slug: 3d-biology-molecule-infographic
model: gpt-image-2
topics: [infographic, ppt]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成教科书级的 3D 分子结构插图并带准确标注，示例是 DNA 双螺旋与四种碱基配对，适合生物课件、科普文章和 PPT 配图。"
prompt: |
  生成一张精致的 3D 科学教育信息图，标题 "[DNA Nucleotides]"，展示 DNA 双螺旋的近景和带标注的核苷酸碱基与分子结构。
  画布：4:3 横版，明亮的白色实验室风格背景，四周是浅蓝、淡紫、薄荷绿的分子团，带柔和景深。整体是干净的高清教科书 / 医学可视化风格：真实的光滑半透明球棍模型，柔和阴影，浅景深。
  版式：标题居中置顶，深海军蓝粗体大字；下方是中蓝色小字副标题 "A close-up view of the [DNA double helix]"。一条大的 DNA 双螺旋从左前景经过中央延伸到右侧，另有一条橙色单链从右下前景斜穿而过。中间的碱基配对区域保持开阔，方便放标注。
  主体细节：DNA 用球棍模型结合半透明珠串状骨架表现。糖—磷酸骨架是两条扭转的链，由半透明蓝灰色小球、橙金色连接杆和小红色原子组成。中央恰好 4 个碱基：左上绿色腺嘌呤 Adenine (A)、右上紫色胸腺嘧啶 Thymine (T)、左下蓝色鸟嘌呤 Guanine (G)、右下橙色胞嘧啶 Cytosine (C)。A 与 T 之间用两排淡蓝虚线表示氢键，G 与 C 之间用三排淡蓝虚线。碱基是扁平的芳香环结构，带彩色原子小球和白色氢原子。
  标注：恰好 7 个标注，细黑引线：绿色 "Adenine (A)"、紫色 "Thymine (T)"、蓝色 "Guanine (G)"、橙色 "Cytosine (C)" 分别指向对应碱基；黑色 "Sugar-phosphate backbone" 指向右侧骨架；黑色 "Hydrogen bonds" 指向氢键虚线；橙色 "Emerging RNA" 指向前景的橙色单链。使用清晰的无衬线字体，不要拥挤。
  风格：超精细 3D 科学渲染，光滑半透明分子珠，真实折射，柔和背景虚化，专业生物教材信息图，兼顾清晰和电影感纵深。
  限制：只用上面 4 个碱基标注和 3 个结构标注，不加多余标签、图标、图例、水印或边框；所有文字清晰、拼写正确。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/gnostic_snakes/status/2086280356227907785
  author: "wren"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；标题、副标题改为变量；保留 7 个标注的精确位置与颜色约束，压缩重复的风格描述"
images:
  - 3007-3d-biology-molecule-infographic-1.jpg
imageCredit:
  by: "wren"
  url: https://youmind.com/gpt-image-2-prompts?id=30931
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：标题和副标题可以换成中文，如"DNA 的碱基配对 / DNA 双螺旋近景"，标注同步改成"腺嘌呤 (A)""氢键"等。换别的分子或细胞结构时（如"ATP 分子""细胞膜磷脂双分子层"），保留"背景 + 版式 + 标注数量限制"的写法，把主体细节和 7 个标注换掉。

示例图与描述一致：白底中央是绿、紫、蓝、橙四个碱基两两配对，淡蓝虚线氢键清楚，两侧是半透明蓝灰珠串骨架，右下一条橙色链标"Emerging RNA"，四周虚化的彩色分子团，7 个英文标注都拼写正确。

**常见问题**：
- 氢键数量画错：在提示词里保留"A–T 两条、G–C 三条"这类明确数字。
- 标注跑位：每个标注都写清"什么颜色、指向哪里"。
- 科学细节：示例的化学结构是示意图，正式教材使用前请对照课本检查环结构。

**适合**：生物课件、科普公众号、考研 / 高中生物笔记配图、PPT 插图。

### 英文原版

```text
Goal: Create a polished 3D scientific educational infographic titled {argument name="headline text" default="DNA Nucleotides"}, showing a close-up view of a DNA double helix with labeled nucleotide bases and molecular structure.

Canvas: Landscape 4:3 composition, bright white laboratory-style background with soft depth-of-field molecular clusters in pale blue, lavender, mint, and purple around the edges. Use a clean, high-resolution textbook/medical visualization style with realistic glossy translucent spheres and rods, soft shadows, and shallow depth of field.

Layout: Center the title at the top in large dark navy bold type, with the subtitle {argument name="subtitle text" default="A close-up view of the DNA double helix"} directly beneath in smaller medium-blue type. Fill the frame with a large twisting DNA double helix running from the left foreground through the center to the right side, with a second orange strand crossing diagonally through the lower right foreground. Keep the central base-pair region open and readable for labels.

Subject details: Render the DNA as a molecular ball-and-stick model combined with translucent bead-like backbone surfaces. The sugar-phosphate backbone should be two twisting chains made of semi-transparent bluish-gray spheres with orange/gold connector rods and small red atoms. In the center, show exactly 4 labeled nucleotide bases: Adenine (A) in green at upper left center, Thymine (T) in purple at upper right center, Guanine (G) in blue at lower left center, and Cytosine (C) in orange at lower right center. Adenine pairs with Thymine across the top using dotted pale blue hydrogen bonds, and Guanine pairs with Cytosine below using three dotted pale blue hydrogen-bond rows. Molecular rings should be flat aromatic ring structures with small colored atom spheres and white hydrogen atoms.

Text content and labels: Include exactly 7 callout labels with thin black pointer lines: “Adenine (A)” in green pointing to the green upper-left base; “Thymine (T)” in purple pointing to the purple upper-right base; “Guanine (G)” in blue pointing to the blue lower-left base; “Cytosine (C)” in orange pointing to the orange lower-right base; “Sugar-phosphate backbone” in black pointing to the right-side helical backbone; “Hydrogen bonds” in black pointing to the dotted bond lines between base pairs; and “Emerging RNA” in orange pointing to the orange strand crossing the lower foreground. Use crisp sans-serif typography and avoid crowding.

Visual style: Hyper-detailed scientific 3D render, glossy translucent molecular beads, realistic refraction, soft bokeh background, professional biology textbook infographic, balanced educational clarity and cinematic depth.

Constraints: Use exactly the 4 nucleotide labels and exactly the 3 structural labels listed above; do not add extra labels, icons, captions, legends, watermarks, or borders. Keep all text sharp and correctly spelled.
```

> 改编自 [wren](https://x.com/gnostic_snakes/status/2086280356227907785) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
