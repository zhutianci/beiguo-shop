---
title: "ai穿搭提示词：上传全身照生成泼墨涂鸦风套装三视图设计稿，正侧背同一人（gpt-image-2）"
slug: street-art-outfit-three-view-design-sheet
model: gpt-image-2
topics: [fashion, character, photo-edit]
aspectRatio: "1:1"
needsRefImage: true
useCase: "做服装系列设计稿或虚拟形象穿搭展示时用：上传一张人物全身照，生成一张方形的三视图版面——左边大幅正面，右边上下两格侧面和背面，同一个人穿同一套泼墨涂鸦风的外套、连帽衫和工装裤，带标题、色卡和视图编号。"
prompt: |
  请以我上传的这张人物全身照作为唯一的人物参考，生成一张 1:1 方形的服装三视图设计稿，可以直接作为时装设计展示页分享。
  - 人物：正面、侧面、背面必须是同一个人，保持参考图的五官、发型、发色、年龄、肤色和身材比例，不要重新设计、不要过度美化或改变体型；性别沿用参考图。
  - 渲染方式：[写实时装摄影]。只有三个人物形象跟随这个风格变化，画布、背景、分格、标题和标注不变。
  - 固定服装：一套男女同款的街头涂鸦风套装，以[白色]为主色，上面是[黑色、鲜红色和少量橙色]的大胆抽象笔触，外套、连帽衫和工装裤用同一套图案语言。
    - 外套：白底宽松拉链夹克，黑色罗纹袖口和下摆，不对称的粗黑笔刷痕迹、墨点飞溅、锐利的红色颜料和橙色滴痕；
    - 连帽衫：白底，从外套敞开处和帽子上能看到同样的黑、红、橙笔刷与滴痕；
    - 裤子与鞋：白底宽松工装裤，带大口袋和黑色织带，同样的不对称抽象涂鸦；黑白配色的厚底老爹鞋。
  - 版式：方形画面左侧约 60% 是大幅正面全身；右侧约 40% 上下分两格，上格是侧面全身、下格是背面全身；细黑线分格，边距对齐；背景是接近白色的浅中性灰。
  - 文字：左上角固定两行粗体标题"STREET-ART COORDINATED SET"（可换成你的系列名），标题下方一排四个小色块和配色说明；三个视图分别标"01 FRONT""02 SIDE""03 BACK"；左下角一个小墨点图案和三行小字说明。
  - 质感：面料的厚度、垂坠、缝线和阴影真实可信，图案在三个角度上位置连贯。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ai_lifehack55/status/2088508636603756989
  author: "@ai_lifehack55"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文作者发布的英文结构化原文改写为分条中文；渲染方式、主色、点缀色保留为变量，并注明标题文字可替换；删去重复的约束说明，保留版式比例、固定标签和三件单品的设计语言"
images:
  - 3493-street-art-outfit-three-view-design-sheet-1.jpg
imageCredit:
  by: "@ai_lifehack55"
  url: https://youmind.com/gpt-image-2-prompts?id=31506
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张从头到脚完整、站姿自然的全身照（只用于确定人物长相和身材）。[写实时装摄影] 可以换成"高质量动漫画风"，人物会变成动漫形象而版式不变；[白色] 和点缀色决定整套衣服的配色，例如"黑色"配"荧光绿和银色"；标题可换成你的系列名，英文大写最稳。想换一套完全不同的衣服，把"固定服装"三条改写成你的设计即可。

示例图是一张方形版面：左侧大图里一位黑色齐肩短发的女生正面站立，穿白底泼墨套装，胸前是一大块红色圆形笔触，外套、裤子上是黑色刷痕和红橙色滴溅，脚上是黑白厚底鞋；右侧两格是同一人的侧面和背面；左上角是"STREET-ART COORDINATED SET"标题和黑、白、红、橙四个色块，三个视图分别标着 01 FRONT、02 SIDE、03 BACK。

**常见问题**：
- 三个角度的图案对不上：加一句"背面与侧面的图案是正面图案的自然延续"。
- 人物换了一张脸：把"以参考图为唯一人物参考"放到最前面，并减少对人物的额外描述。
- 标注文字错位：只保留标题和三个视图编号，删掉左下角小字。

**适合**：服装设计作品集、潮牌系列提案、虚拟形象换装展示；请只上传你本人或已获对方同意的照片。

### 日文原版

```text
# CUSTOM_STREET_ART_THREE_VIEW_SHEET

## [Purpose]
Using the single full-body image of a person attached to this instruction as the sole character reference, create one high-quality square three-view design sheet for sharing, featuring a fixed street art style setup outfit. The emphasis is on it functioning as a professional fashion design piece that works as a three-view character verification sheet.

## [Input]
Style: {argument name="style" default="Photorealistic"}
Gender is naturally inherited from the attached person image.

## [Absolute Constraints]
Aspect ratio is 1:1 square. Background is a light neutral gray close to white. The sheet density, page design, layout, and outfit design are fixed; only the person and their rendering style are variable. The switch between [Photorealistic / Anime] applies only to the three character depictions, not the canvas, background, panel structure, titles, or UI elements.

## [Character Reference]
Use the attached full-body image as the sole reference to ensure FRONT/SIDE/BACK are the same person. Maintain facial features, eyes, nose, mouth, hair style, hair color, age, skin tone, and body proportions. Do not redesign, beautify excessively, or alter the body type.

## [Rendering]
Photorealistic: High-quality fashion photography. Natural skin/hair, fabric thickness, drape, seams, and shadows.
Anime: High-quality anime expression maintaining the reference person's proportions and features. Clear patterns and silhouettes.

## [Fixed Outfit]
A unisex street art coordinated set using {argument name="primary color" default="white"} as the main color with bold abstract art in {argument name="accent colors" default="black, vivid red, and limited orange"}. Outer jacket, inner hoodie, and cargo pants share the same design language.

### Outer Jacket
White base oversized zip-up. Features black ribbing, asymmetrical rough black brush strokes, ink splashes, sharp red paint, and orange drips.

### Inner Hoodie
White base hooded sweatshirt. Must include matching black, red, and orange brush and drip patterns visible from the jacket opening and on the hood.

### Cargo Pants / Shoes
White-based wide cargo pants with asymmetrical abstract paint. Shoes are black and white platform volume sneakers.

## [Layout]
Divide the square into a large FRONT area on the left (approx. 60%) and two stacked panels on the right for 02 SIDE and 03 BACK (approx. 40%). Use thin black borders and aligned margins.

## [Graphics]
Fixed 2-line title in the top left: **STREET-ART COORDINATED SET**. Fixed view labels: 01 FRONT, 02 SIDE, 03 BACK.
```

> 改编自 [@ai_lifehack55](https://x.com/ai_lifehack55/status/2088508636603756989) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
