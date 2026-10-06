---
title: 产品三视图提示词：家具三视图 + 材质拆解展示图（桌椅柜都能做）
slug: furniture-product-sheet
model: gpt-image-2
topics: [interior, ecommerce]
aspectRatio: "3:2"
needsRefImage: false
useCase: 给餐桌、书桌、边柜、椅子等家具做一张左右分栏的产品说明图：左边俯视 / 侧视 / 正视三个角度，右边桌面、腿、框架的材质小样和标签，适合家具详情页、设计方案汇报和定制沟通。
prompt: |
  为一张[长方形实木餐桌]制作高质量的写实 3D 产品展示图，左右分栏布局，画幅[3:2]，浅灰或白色背景。
  左侧 —— 产品视角：
  - 俯视图：完整的[桌面]形状、表面纹理和边缘细节；
  - 侧视图：[桌腿]造型、整体高度和[桌面]厚度；
  - 正视图：宽度、对称性和[桌腿]的排列。
  三个视图光线一致，带轻微真实阴影。
  右侧 —— 材质拆解：
  - [桌面]：[实木 / 多层实木]，配一块近距离木纹小样和简洁的无衬线标签；
  - [桌腿]：[抛光橡木或金属]，配材质小样和统一格式的标签；
  - [框架]：[哑光黑色钢材]，配一小块金属质感小样和极简注释。
  左右两部分用一条竖向分隔线或轻微的背景色差分开。材质保持自然色，背景和线条用灰阶。
  标签和分区标题使用[简体中文]，字体现代易读，每个标签写在对应小样旁边、不要错位。
  输出高分辨率，适合产品说明页、室内设计目录或家具展示。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2064499654725902349
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；家具品类、三个部件名称、各部件材质、画幅和标签语言改为变量；补充"标签写在对应小样旁边、不要错位"的约束；删去原帖中的链接与话题标签
images:
  - 510-furniture-product-sheet-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2064499654725902349
  license: CC0 1.0
verify:
  - 中文标签是否对应正确的小样；示例图中有个别英文标签拼错、"Top-down"标在了侧视图上，需在说明中提示
  - 换成椅子、边柜时三视图是否仍然准确
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：先确定品类，再把三个部件名换成这个品类的结构：椅子写"座面 / 椅腿 / 靠背"，边柜写"柜体 / 柜门 / 柜脚"。材质写得越具体越好，例如"北美黑胡桃木""岩板""拉丝不锈钢"。如果有自己产品的照片，上传后在开头加"严格按照上传图片中的家具外观"。

**常见问题**：
- 标签错位或拼错（示例图里"Top-down"就标错了位置）：标签改为中文，并在每条材质后写清"标签放在该小样正下方"；仍不准就后期自己加字。
- 三视图比例不一致：加一句"三个视图使用相同比例尺，并标注长、宽、高尺寸 [180×90×75 cm]"。
- 背景太空：可以在左下角加"一张该家具摆在[北欧风餐厅]里的小场景图"。

**适合**：家具店详情页、定制家具沟通稿、室内设计方案里的软装清单。示例图为原作者生成，仅供参考。

### 英文原版

```text
Create a high-quality realistic 3D product showcase for a table, using a split-view layout (3:2 or 4:3 aspect ratio) on a neutral light gray or white background.

Left side — Table Perspectives:
- Top-down view: full tabletop shape, surface texture, and edge details
- Side view: leg design, table height, and tabletop thickness
- Front view: width, symmetry, and leg alignment
Use consistent lighting with subtle shadows for realism.

Right side — Material Breakdown:
- Tabletop: solid or engineered wood, with a close-up wood texture swatch and clean sans-serif label
- Legs: polished oak wood or metal, with a material texture swatch and consistent labeling
- Frame: matte black steel, with a small metallic texture swatch and minimalist annotation

Separate the two sections with a vertical dividing line or subtle split background. Use natural tones for materials and grayscale for backgrounds and lines. Modern readable font for labels and section titles. Output as a high-resolution image suitable for a product sheet, interior design catalog, or furniture showcase.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2064499654725902349) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
