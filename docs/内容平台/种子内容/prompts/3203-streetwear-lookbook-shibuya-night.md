---
title: AI穿搭提示词：雨夜街头机能风 Lookbook，钴蓝反光羽绒服 + 黑色工装裤全身照
slug: streetwear-lookbook-shibuya-night
model: gpt-image-2
topics: [fashion, photography]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做潮牌上新预览、穿搭账号封面、服装设计作业效果图时，生成一张霓虹雨夜十字路口的街头 Lookbook 全身照，衣服颜色、款式、背景城市都能替换。
prompt: |
  一张全身 Lookbook 时尚摄影：模特站在黄昏时分[雨后湿漉漉的城市十字路口]正中央。
  - 服装：一件宽松多口袋的机能羽绒服，颜色[电光钴蓝]，带银色反光条细节；搭配哑光黑阔腿工装裤和厚底运动鞋；
  - 构图：清晰的中远景，35mm 镜头，竖版杂志版式；
  - 背景：周围的霓虹招牌虚化成粉色和青色的柔和光斑；
  - 光线：来自周围电子大屏的戏剧化定向光，在羽绒服面料上形成高反差高光；
  - 氛围：都市、快节奏，带细微的胶片颗粒感（类似 Portra 400）；
  - 画面一角用极简无衬线字体低调地压印文字"[NEO-URBAN]"；
  - 画面中不出现任何品牌 logo。
  画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-fashion-editorial.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并按服装 / 构图 / 光线拆成要点；具体地名改为通用场景变量，服装主色、角标文字、画幅设为变量；补充了常见问题与改法
images:
  - 3203-streetwear-lookbook-shibuya-night-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/fashion-editorial/streetwear-tokyo-lookbook.png
  license: MIT
verify:
  - 示例图背景里有真实商场招牌数字和日文广告屏（含人像），展示时确认无商标 / 肖像顾虑
  - 换成"上海夜晚街头""成都春熙路风格的步行街"出一次，看背景是否仍有霓虹氛围
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[雨后湿漉漉的城市十字路口] 可以换成"霓虹小巷""高架桥下的停车场""夜晚地铁站出口"；[电光钴蓝] 换成"荧光橙""军绿""奶油白"就是另一套配色。角标文字可写自家系列名，如"[2026 秋冬]"。示例图是仓库作者的出图：一位年轻男模双手插兜站在湿地面的斑马线上，穿亮蓝色带银条的羽绒服和黑色工装裤，背后是日文广告屏和高楼霓虹，右上角有很淡的"NEO-URBAN"字样。

**常见问题与调整**：
- 背景出现真实商标或店名：加"所有招牌只有虚化光斑，不出现可辨认的文字"。
- 想换女模或不同体型：直接写"[一位短发女性模特，身高 170 左右]"，其余不变。
- 衣服细节糊：加"上身面料纹理、口袋拉链和反光条清晰可见，焦点在服装"。
- 要做系列图：第一张满意后追问"同一模特、同一场景，换成侧身走路的抓拍"。

**适合**：潮牌概念预览、穿搭内容封面、服装设计灵感板；用于商品宣传时，请确保最终实物与图片描述一致。

### 英文原版

```
Full-body lookbook photography of a model standing in the center of a rain-slicked Shibuya crossing at twilight. The model wears an oversized, multi-pocketed technical puffer jacket in 'Electric Cobalt' with reflective silver detailing, paired with wide-leg cargo trousers in matte black and chunky platform sneakers. The composition is a sharp medium-wide shot using a 35mm lens, capturing the vibrant neon signs of the background blurred into a soft bokeh of pinks and cyans. Lighting is dramatic and directional, sourced from the surrounding digital billboards, creating high-contrast highlights on the jacket's texture. The mood is urban and fast-paced, with a subtle film grain characteristic of Portra 400. The image features a clean vertical layout suitable for a fashion magazine, with the text 'NEO-URBAN' subtly embossed in the corner in a minimalist sans-serif font. No brand logos are visible.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。
