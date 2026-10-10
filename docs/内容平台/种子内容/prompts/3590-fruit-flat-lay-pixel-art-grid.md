---
title: "ai美食图提示词：水果俯拍平铺像素画，红青苹果拼出 2026（Nano Banana）"
slug: fruit-flat-lay-pixel-art-grid
model: nano-banana
topics: [food, poster]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "用真实水果的俯拍照\"拼\"出像素画：一种水果铺满整张图当底色，另一种对比色水果嵌在里面组成数字和图案，适合做新年海报、生鲜店活动图、节日朋友圈配图。"
prompt: |
  专业的俯拍平铺摄影，镜头严格垂直向下 90 度，纯白背景，画幅 2:3 竖版。影棚柔光均匀明亮，没有明显阴影和暗角。
  - 主体：用[新鲜的青苹果]紧密、整齐地排成一个网格矩阵，铺满整个画面；横向[27]列，纵向排满；
  - 像素图案：在网格里用颜色对比强烈的[红苹果]替换掉一部分位置，一颗水果就是一个像素，拼出清晰的像素画；
  - 上半部分：用对比水果拼出像素化的[2026]，采用等宽像素字体，每个字符占相同的列数，字符之间空一列；
  - 下半部分：用对比水果拼出一个[奔跑的马]的像素剪影，轮廓简洁、一眼能认出来；
  - 排列要求：所有水果大小一致、朝向一致（果柄朝同一方向），横平竖直，彼此紧挨，不留空位；每一颗都完整，画面边缘的水果也不被裁切；
  - 质感：两种水果都是真实的、表面光滑带自然反光，能看清细腻的果皮纹理；除了颜色，大小和形状没有差别；
  - 整体：像素图案边缘清晰、对比鲜明，把传统静物摄影和数字像素画结合在一起；
  - 不要文字标注、水印和其他道具。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/ttmouse/status/2006653606800556045
  author: "@ttmouse"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原帖的英文提示词译为中文，把\"场景 / 秩序 / 结构 / 材质 / 张力\"几段重复的描述合并成一份清单；底色水果、对比水果、列数、上半部文字、下半部图案设为变量；默认水果按示例图由柠檬和青柠改为青苹果和红苹果；删去抽象的\"张力来源\"段落"
images:
  - 3590-fruit-flat-lay-pixel-art-grid-1.jpg
imageCredit:
  by: "@ttmouse"
  url: https://youmind.com/nano-banana-pro-prompts?id=4341
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[新鲜的青苹果] 是铺底的水果，[红苹果] 是拼图案的对比水果，两者颜色差越大越好，形状大小要接近，例如"黄柠檬配青柠""绿葡萄配紫葡萄""白鸡蛋配红皮鸡蛋"；[27] 是横向列数，列数越多图案越精细，但单颗水果越小，20~30 之间比较稳；[2026] 换成 2~4 个数字或大写字母，汉字笔画太多不适合；[奔跑的马] 换成轮廓简单的图案，如"爱心""圣诞树""小兔子"。

示例图是竖幅：上千颗青苹果果柄朝上排成整齐的方阵，上半部分用红苹果拼出像素数字 2026，下半部分是一匹抬头奔跑的红色小马剪影，背景纯白、几乎没有阴影，远看像一张红绿两色的像素画，近看每颗都是真实的苹果。

**常见问题**：
- 数字或图案认不出来：减少列数、把图案换成更简单的形状，并加"图案周围至少留两列底色"。
- 水果排歪了或大小不一：强调"严格的行列对齐，像打印的点阵"。
- 图案不够准：模型很难精确控制上千个格子，可以先单独让它画一张同样列数的黑白像素草图，再作为参考图上传。

**适合**：新年和节日海报、生鲜水果店活动图、社交平台创意配图。不适合需要精确点阵的二维码或复杂 Logo。

### 原版提示词

```text
# Scene and World
Professional top-down flat-lay photography, strictly 90-degree vertical overhead God's perspective;
Pure white background;
Studio soft lighting, uniform and clear light, no shadows, no vignetting

# Focus and Order
Absolute Subject: A grid matrix formed by tightly and neatly arranged [{argument name="background item" default="fresh yellow lemons"}] (the background item), filling the entire frame;
Grid Specification: {argument name="grid columns" default="27"} columns horizontally, and several rows vertically, forming a complete matrix;
Form of Expression: Using [{argument name="contrast item" default="green limes"}] (the contrast item) with stark color contrast embedded to form a clear pixel art pattern;
Visual Logic: The upper half of the frame is the pixelated "{argument name="text content" default="2026"}" formed by the contrast item, and the lower half is the pixelated silhouette of the {argument name="graphic content" default="running horse"} formed by the contrast item;
Arrangement Constraint: All objects are exactly the same size, uniformly oriented (stems pointing the same way), tightly and seamlessly fitted together, absolutely no blank areas allowed

# Form and Structure
Upper composition: Pixelated "{text content}" using the contrast item, employing a monospace font where each character occupies the same number of columns;
Lower composition: Pixelated silhouette of the {graphic content} using the contrast item;
Perfect overhead 90-degree flat-lay perspective, camera lens axis strictly perpendicular to the ground;
Every object is whole, objects at the edge of the frame are not cropped, presenting a neat grid array;
Pixel art pattern is clearly discernible, edges are sharp;
Dense grid layout of {grid columns} columns × multiple rows, objects tightly filled, no gaps whatsoever

# Material and Language
Main Material: Real [{background item}] (smooth surface, natural reflection, fine texture, all objects uniformly oriented);
Contrast Material: Real [{contrast item}] (full color, fine surface texture, real details, all objects uniformly oriented);
Background: Pure white plane;
All objects are uniform in size, shape, and orientation, with no size differences or deformation

# Source of Tension
Natural objects transformed into digital pixel art;
Combination of traditional still life photography and modern pixel patterns;
Strong color contrast between [{background item}] and [{contrast item}] creates clear pattern recognition;
8K quality, high resolution, commercial advertising photography style;
Objects are absolutely regular in arrangement, pixel pattern is highly readable

# Technical Constraints (Ensuring Stability)
- Strictly 90-degree overhead angle, no perspective distortion
- Objects at the edge of the frame must be complete, not cropped
- The diameter of every object must be exactly the same, as if made from the same mold
- All objects must be uniformly oriented, stems or tops pointing consistently
- Clear grid structure: {grid columns} columns horizontally, and corresponding rows vertically, forming a strict rectangular grid
- Grid arrangement must be neat, aligned horizontally and vertically, with each cell the same size
- Objects must be tightly and seamlessly joined, absolutely no blank areas or gaps allowed
- Edges of the pixel pattern must be sharp and crisp
- Light is uniform, no local overexposure or underexposure
- Each character uses a monospace pixel font, all characters occupy the same number of columns
- Each object acts as one pixel unit, must be exactly the same size and uniformly oriented
```

> 改编自 [@ttmouse](https://x.com/ttmouse/status/2006653606800556045) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
