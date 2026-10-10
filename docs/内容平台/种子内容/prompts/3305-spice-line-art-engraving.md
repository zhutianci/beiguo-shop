---
title: 即梦提示词：中式香料铜版画线稿，八角桂皮花椒等黑白雕刻风插图（包装设计 AI 素材）
slug: spice-line-art-engraving
model: jimeng
topics: [illustration, food]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做调味品 / 火锅底料包装、餐厅菜单装饰、中式厨房主题海报时，生成一组白底黑线的香料铜版画线稿：粗线勾外形、细线刻纹理，复古又干净，方便后期抠图排版。
prompt: |
  [九]种中式烹饪常用的调味香料（如[八角、桂皮、花椒、丁香、香叶、生姜]等），线描插画，凹版版画线稿风格。
  - 外轮廓用 [0.8mm] 的粗线勾勒，表面纹理用 [0.2mm] 的细线刻画；
  - 保留铜版雕刻的排线和刻痕质感；
  - 每种香料单独摆放、互不重叠，整齐分布在画面中；
  - 纯白背景，只用黑色线条，不上色。
  画幅 4:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-108-line-art-of-traditional-chinese-seasoning-herbs
  author: "@liu10102525"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 仓库收录的是英文版，本站改写为中文；数量、香料种类、粗细线宽设为变量；补充"单独摆放不重叠、只用黑线不上色"的约束
images:
  - 3305-spice-line-art-engraving-1.jpg
imageCredit:
  by: "@liu10102525"
  url: https://cms-assets.youmind.com/media/1765360433911_ehmj82_1765340299572-6opt91-0217653402821028547934892c4038781a87d514f9a9196c3270d_0-600x450.jpg
  license: CC BY 4.0
verify:
  - 示例图实际画了约 10 种香料（有一种重复出现），数量不一定与提示词一致，可在即梦里指定名称后再测
  - 用在包装上前，确认每种香料画得是否准确，避免把豆蔻、草果等认错
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[九] 是数量，建议 6～12 种；[八角、桂皮、花椒、丁香、香叶、生姜] 写出具体名称会比让模型自己挑更准确，也可以换成别的主题，比如"六种中药材：枸杞、当归、黄芪、党参、红枣、甘草"或"八种茶叶与茶具"。[0.8mm] 和 [0.2mm] 控制线条粗细对比，想更粗犷可改成 1.2mm / 0.3mm。示例图是白底黑线的雕刻风插图：上排是一堆豆蔻、一颗八角和两根卷起的桂皮，中排是一把花椒、几颗丁香和两片干姜片，下排是一片香叶、一小撮丁香、一颗草果状果实和一块生姜，排线细密，很像老式铜版画。

**常见问题与调整**：
- 线条太细太灰：加"线条对比强烈，暗部排线密集，亮部大面积留白"。
- 出现上色：再强调"纯黑白，不要任何灰色填充或彩色"。
- 香料重复：在提示词里写全每种香料的名称，并加"每种只出现一次"。
- 想做包装图案：追问"把这些香料排成可无缝拼接的四方连续图案"。

**适合**：调味品 / 火锅底料包装、菜单装饰、中式厨房海报、文创图案；不适合用作药材或香料的识别图鉴。

### 英文原版

```
Nine common Chinese seasoning herbs used in cooking, line drawing, intaglio print line art. Use {argument name="thick line width" default="0.8mm"} thick lines for the outer contour and {argument name="thin line width" default="0.2mm"} thin lines to depict the surface texture, retaining the traces of copperplate engraving, on a pure white background.
```

> 改编自 [@liu10102525](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-108-line-art-of-traditional-chinese-seasoning-herbs) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。
