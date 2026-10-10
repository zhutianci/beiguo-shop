---
title: "写真头像提示词：照片 + 炭笔速写混合的逆光毛线帽人像（杂志插画感）（gpt-image-2）"
slug: sketch-mixed-media-beanie-portrait
model: gpt-image-2
topics: [portrait, illustration]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张写实照片与炭笔速写混合的编辑风人像：戴粗针织毛线帽和细框眼镜的年轻女性，金色逆光勾出轮廓，四周是炭笔般的速写笔触，适合社交头像、杂志插画风写真和个人主页配图；也可以上传本人照片。"
prompt: |
  生成一张细节丰富的竖版 4:5 艺术编辑风肖像：[一位年轻女性]，胸部以上，居中，直视镜头，带一点放松的微笑。
  她有[深棕色及肩微乱层次发，带空气刘海]，温暖自然的肤色、精致的五官，戴细细的黑色圆框眼镜。
  恰好 3 件可见的配饰 / 服装：1）一顶宽大的粗罗纹针织毛线帽，颜色是[灰褐色]；2）一件宽松的黑色长袖罗纹毛衣，袖子柔软地堆起；3）一条短银链项链。
  姿势：肩膀略微侧转，手臂向前放在画面下缘附近，头轻轻歪着，神情平静亲近。
  使用梦幻的黄金时段逆光，从右上方照来，在头发、帽子、肩膀和毛衣边缘形成发光的轮廓光，脸上是温暖的琥珀色高光和柔和阴影。
  呈现为写实摄影与绘画式编辑插画的混合：面部细节清晰、眼睛和嘴唇自然、毛线纹理可见、皮肤纹理细腻，人物轮廓周围有富有表现力的炭笔般速写笔触。
  背景是有纹理的灰色纸面，带松散的炭笔排线和暖色光晕。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AiwithLariab/status/2095736426071797911
  author: "Laraib Fatima‎"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；人物、发型、帽子颜色改为变量，补全原文被截断的背景描述"
images:
  - 3175-sketch-mixed-media-beanie-portrait-1.jpg
imageCredit:
  by: "Laraib Fatima‎"
  url: https://youmind.com/gpt-image-2-prompts?id=33442
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：人物、发型和帽子颜色可以按你的需要改；想把自己做成这种风格，上传一张本人的半身照，把第一句改成"参考上传照片中的人物（保持五官、脸型和发型）"（请只用本人照片）。毛线帽可以换成"贝雷帽""渔夫帽"，配饰数量保持 3 件左右画面最干净。

示例图是一张竖版人像：戴灰褐色粗针织帽和细框眼镜的年轻女子，深棕色碎发，穿黑色毛衣、戴银链，微微歪头笑，右上方的金色逆光勾亮了头发和帽沿，背景和衣服边缘是粗犷的炭笔排线。

**常见问题**：
- 全图都是照片，没有速写感：强调"轮廓外 20% 的区域是炭笔速写笔触"。
- 全图都是素描：强调"面部必须是写实照片质感"。
- 逆光太暗看不清脸：写"脸部有柔和的正面补光"。

**适合**：社交头像、杂志插画风写真、个人主页配图、作者介绍图。

### 英文原版

```text
Create a highly detailed vertical 4:5 artistic editorial portrait of {argument name="character name" default="a young woman"} from the chest up, centered and looking directly at the viewer with a soft relaxed smile. She has {argument name="hair color" default="dark brown shoulder-length slightly messy layered hair with wispy bangs"}, warm natural skin, delicate facial features, and round thin black wire-frame eyeglasses. Dress her in exactly 3 visible accessories/clothing elements: 1) an oversized chunky ribbed knitted beanie in {argument name="beanie color" default="heather taupe gray"}, 2) a loose black long-sleeve ribbed knit sweater with softly bunched sleeves, and 3) a short silver chain necklace. Pose her with shoulders slightly angled, arms forward near the bottom edge, head gently tilted, calm intimate expression. Use dreamy golden-hour backlighting from the upper right, creating a glowing rim light around the hair, beanie, shoulders, and sweater edges, with warm amber highlights and soft shadows on the face. Render as a hybrid of realistic photography and painterly editorial illustration: crisp facial detail, natural eyes and lips, visible knit texture, subtle skin texture, and expressive charcoal-like sketch strokes around the silhouette. Background is a textured gray plaster wall with abstract scratched graphite marks and warm gold paint smears, especially on the right side, blending into the subject edges. Add loose black hand-drawn contour scribbles around the hat, hair, sleeves, and shoulders for an art-magazine mixed-media look. Shallow depth of field, soft cinematic contrast, high detail, warm muted palette, no text, no watermark, no extra people.
```

> 改编自 [Laraib Fatima‎](https://x.com/AiwithLariab/status/2095736426071797911) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
