---
title: nano banana 产品九宫格提示词：一张产品图生成 9 个机位的品牌摄影组图
slug: product-9-grid-storyboard
model: nano-banana
topics: [ecommerce, photography]
needsRefImage: true
aspectRatio: "4:5"
useCase: 品牌上新、作品集、详情页需要一组风格统一的产品图（正面、特写、场景、使用、俯拍阵列、悬浮……），上传一张产品图，一次生成 3×3 九宫格分镜，当作拍摄方案或直接用作社媒组图。
prompt: |
  只生成一张图：一个干净的 3×3 分镜网格，9 个大小相同的画面，整体画幅 [4:5]。
  以上传图片中的产品为唯一参考：9 个画面里的产品、包装设计、品牌标识、材质、颜色、比例完全一致，标签、Logo 和比例不得改变，每一格都能清楚认出产品。
  这是一套用于品牌作品集的高端设计感样机展示，重点是造型、构图、材质和视觉节奏，而不是生活化叙事。
  第 1 格：正面主图，干净的棚拍布景，中性背景，构图平衡、沉稳自信。
  第 2 格：产品中部特写，聚焦表面纹理、材质和印刷细节。
  第 3 格：产品放在与品牌和品类相契合的环境中，布景灵感来自产品的设计元素和配色。
  第 4 格：产品被使用或互动的画面，中性背景，手部和互动元素克制，风格与包装一致。
  第 5 格：等轴测俯视构图，多个产品以精确的几何秩序排列，角度一致、间距均匀、有图形感。
  第 6 格：产品略微倾斜地悬浮在与产品配色相呼应的背景上，角度有意为之、自然漂浮。
  第 7 格：对标签、边缘、纹理或材质表现的极致微距特写。
  第 8 格：一个出人意料但极具美感的布景，大胆、编辑感强、视觉冲击力强，仍以棚拍为主。
  第 9 格：宽景构图，产品在精致的设计感布景中被使用，道具干净克制，与整组风格统一。
  摄影与风格：超高品质的棚拍质感，真实相机效果；各格机位和景别不同；景深可控、布光精准、材质和反射准确；9 格的布光逻辑、配色、情绪和视觉语言保持一致，是一组完整的系列。
  输出：干净的 3×3 网格，无边框、无文字、无图注、无水印。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Dari_Designs/status/2013268963266904438
  author: "@Dari_Designs"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文，逐格保留原有分镜设计；删去原文中重复的比例占位符，只保留整体画幅一个变量
images:
  - 192-product-9-grid-storyboard-1.jpg
imageCredit:
  by: "@Dari_Designs"
  url: https://x.com/Dari_Designs/status/2013268963266904438
  license: CC BY 4.0
verify:
  - 用一款圆柱形瓶装产品和一款方盒产品各实测一次，检查 9 格中的标签是否一致
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张清晰的产品图（正面、背景干净），直接发送。示例图是一款红蓝花朵包装的瓶装产品生成的九宫格。九个画面的描述可以按需要替换，比如把第 8 格改成"产品放在[冰川裂缝]里"，或把第 4 格改成"模特手持产品的半身照"。

**常见问题**：
- 某一格产品"走样"：九宫格每格分辨率较低，细节难以完全一致；挑出满意的格子后，追问"把第 3 格单独放大生成一张 4:5 高清图"。
- 文字 / Logo 糊：小字在九宫格里几乎无法保证，正式物料以单张高清图为准。
- 风格太"艺术"：把第 8 格删掉，换成"白底电商主图"，更适合详情页。

**适合**：新品拍摄方案（先用 AI 出分镜再实拍）、作品集、社媒九宫格、电商详情页素材。

### 英文原版

```
Create ONE final image. 

A clean 3×3 [ratio] storyboard grid with nine equal [ratio] sized panels on [4:5] ratio. 

Use the reference image as the base product reference. Keep the same product, packaging design, branding, materials, colors, proportions and overall identity across all nine panels exactly as the reference. The product must remain clearly recognizable in every frame. The label, logo and proportions must stay exactly the same.

This storyboard is a high-end designer mockup presentation for a branding portfolio. The focus is on form, composition, materiality and visual rhythm rather than realism or lifestyle narrative. The overall look should feel curated, editorial and design-driven.

FRAME 1:
Front-facing hero shot of the product in a clean studio setup. Neutral background, balanced composition, calm and confident presentation of the product.

FRAME 2:
Close-up shot with the focus centered on the middle of the product. Focusing on surface texture, materials and print details.

FRAME 3:
Shows the reference product placed in an environment that naturally fits the brand and product category. Studio setting inspired by the product design elements and colours. 

FRAME 4:
Product shown in use or interaction on a neutral studio background. Hands and interaction elements are minimal and restrained, the look matches the style of the package. 

FRAME 5:
Isometric composition showing multiple products arranged in a precise geometric order from the top isometric angle. All products are placed at the same isometric top angle, evenly spaced, clean, structured and graphic.

FRAME 6:
Product levitating slightly tilted on a neutral background that matches the reference image color palette. Floating position is angled and intentional, the product is floating naturally in space.

FRAME 7:
is an extreme close-up focusing on a specific detail of the label, edge, texture or material behavior.

FRAME 8:
The product in an unexpected yet aesthetically strong setting that feels bold, editorial and visually striking.
Unexpected but highly stylized setting. Studio-based, and designer-driven. Bold composition that elevates the brand.

FRAME 9:
Wide composition showing the product in use, placed within a refined designer setup. Clean props, controlled styling, cohesive with the rest of the series.

CAMERA & STYLE:
Ultra high-quality studio imagery with a real camera look. Different camera angles and framings across frames. Controlled depth of field, precise lighting, accurate materials and reflections. Lighting logic, color palette, mood and visual language must remain consistent across all nine panels as one cohesive series.

OUTPUT:
A clean 3×3 grid with no borders, no text, no captions and no watermarks.
```

> 改编自 [@Dari_Designs](https://x.com/Dari_Designs/status/2013268963266904438) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
