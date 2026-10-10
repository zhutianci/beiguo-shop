---
title: "ai手办提示词：Q 版潮流穿搭收藏玩偶，机能风外套 + 墨镜小人的产品级棚拍（gpt-image-2）"
slug: chibi-streetwear-vinyl-toy-product-photo
model: gpt-image-2
topics: [figurine, fashion, character]
aspectRatio: "4:5"
needsRefImage: false
useCase: "把一套穿搭或一个虚拟形象做成\"潮玩公仔\"的样子：大头小身的搪胶玩偶站在黑色圆台上，衣服的拉链、口袋、鞋底纹路都刻画到位，背景是虚化的展示柜，像潮玩店的新品图。"
prompt: |
  生成一张高端潮流收藏玩偶的产品照：一个 Q 版男性公仔站在哑光黑色圆形展示底座上，定位是[酷酷的都市潮流形象]。竖版 4:5。
  - 公仔：大头小身、搪胶玩具的真实比例；白皙皮肤，眉毛锋利，表情严肃平静；[黑色]的刺猬头短发，耳朵略外扩；戴一副黑色方框墨镜，镜片是半透明的深色；
  - 服饰（恰好 8 件）：1 件[钴蓝色]机能外套（黑色滚边、拉链和袖标）；1 件深炭灰连帽卫衣打底；1 件黑色战术胸挂（正面两个小包）；1 条带侧袋和织带的黑色工装束脚裤；1 个挂在腰间的黑色小挂包；1 双黑袜；1 双蓝黑灰配色的厚底越野跑鞋（鞋底纹路清晰）；1 副墨镜；
  - 姿势：直立，双手插兜，双脚分开，自信的街头站姿；
  - 做工：发丝的雕刻感、布料般的柔软褶皱、细小的拉链、扣具、缝线、袋盖和鞋底纹理，墨镜上有微微的高光；
  - 拍摄：像高端收藏品的产品照，现代灰色展示间，浅景深，背景是虚化的层架和装框的玩具海报，后方架子上有 1 个虚化的小公仔；柔和的顶光加正面补光，中性灰色调，真实的投影，全身居中；
  - 服饰上不出现任何品牌 Logo 和文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/YangOnchain/status/2087773052994253081
  author: "@YangOnchain"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；角色定位、发色、8 件服饰配件、主色设为可替换内容（服饰清单整体保留为示例）；保留\"恰好 8 件单品\"\"背景架子上 1 个虚化的小公仔\"等数量约束"
images:
  - 3439-chibi-streetwear-vinyl-toy-product-photo-1.jpg
imageCredit:
  by: "@YangOnchain"
  url: https://youmind.com/gpt-image-2-prompts?id=31443
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[酷酷的都市潮流形象] 可以换成"背着滑板的校园少年""穿汉服混搭球鞋的女孩"（把"男性"也一并改掉）；发色随意；8 件服饰可以整段替换成你自己的一套穿搭，件数写准更容易还原；[钴蓝色] 是整套的点睛色，换成"荧光橙""草绿"会完全变样。

示例图：灰色展示间里，一个大头公仔站在黑色圆台上，黑色短发、黑墨镜，穿蓝色机能外套、黑色胸挂和工装裤，脚上是蓝灰色厚底跑鞋，双手插兜；背景的架子和相框都被虚化，架子上隐约有另一个小公仔。

**常见问题**：
- 做成了真人照片或动漫插画：把"搪胶玩具质感、可见分模线和涂装"写在最前面。
- 衣服上冒出真实品牌标志：保留最后一条约束。
- 想用自己的形象：可以上传照片并加"按照片中人物的发型和穿搭制作"，但请只用本人的照片。

**适合**：穿搭博主的趣味封面、虚拟形象周边概念图、潮玩设计提案、生日礼物创意图。

### 英文原版

```text
Create a premium collectible streetwear art-toy product photo of a chibi male figure standing on a matte black circular display base, styled as {argument name="character name" default="a cool urban fashion avatar"}. The figure has an oversized head and small body, realistic vinyl-toy proportions, fair skin, sharp brows, a serious neutral expression, spiky textured {argument name="hair color" default="black"} hair, slightly protruding ears, and rectangular black sunglasses with translucent dark lenses. Show exactly 8 visible outfit/accessory items: 1 vivid cobalt-blue tech jacket with black trim, zipper details and sleeve patch; 1 dark charcoal hoodie underneath; 1 black tactical chest harness/vest with two front pouch pockets; 1 pair of black cargo jogger pants with side pockets and straps; 1 small black hanging utility pouch clipped at the hip; 1 pair of black socks; 1 pair of chunky blue-black-gray trail sneakers with detailed soles; and 1 pair of black rectangular sunglasses. Pose the toy upright with both hands in pockets, feet apart, confident street-style stance. Use hyper-detailed toy craftsmanship: sculpted hair strands, soft fabric-like folds, tiny zippers, buckles, seams, pocket flaps, shoe tread texture, and subtle glossy highlights on sunglasses. Photograph it like a high-end collectible product in a modern gray display room, shallow depth of field, blurred shelves and framed toy posters in the background, one small blurred figurine on the rear shelf, soft studio lighting from above and front, clean neutral gray tones, realistic shadows, centered full-body composition, vertical 4:5 frame. Color palette should emphasize {argument name="accent color" default="electric blue and black"}. Avoid logos, text, watermarks, extra characters in focus, or changing the outfit structure.
```

> 改编自 [@YangOnchain](https://x.com/YangOnchain/status/2087773052994253081) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
