---
title: "ai美甲设计提示词：按主题生成高级感美甲特写，每个指甲一种呼应的款式（gpt-image-2）"
slug: themed-gel-nail-art-closeup-photo
model: gpt-image-2
topics: [fashion, photography, ecommerce]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给一个主题词（昆虫、水母、青花瓷、圣诞……），生成一张写实的手部美甲特写：每个指甲围绕主题做不同但统一的设计，背景虚化并与主题呼应，适合美甲师找款式灵感、做作品集和社媒配图。"
prompt: |
  请生成一张写实的手部美甲特写照片，主题灵感：[金绿色甲虫与昆虫翅膀]。
  - 主体：一只保养得很好的女性的手，手指自然优雅地微微弯曲；指甲是[中长杏仁形]，做的是高级感的光疗甲，围绕主题设计，整体干净、精致，有时尚杂志的质感。
  - 款式：每个指甲的设计都不同但彼此呼应——有的是[墨绿色猫眼]底色，有的是手绘图案（如一只小金甲虫、翅膀的脉络纹路），有的是纯色底加金箔或金属描边，有的是通透的贝壳光泽；点缀可以用亮片、金属箔、细金线。款式要专业、成熟，不要廉价感，也不要幼稚的卡通感。
  - 画面里可以有一个与主题呼应的小物件，例如前景一只金绿色的甲虫停在带水珠的叶片上，但不能抢过指甲。
  - 光线与摄影：柔和的自然光，没有生硬的阴影；浅景深，焦点落在指甲的细节和光泽上；高端美妆大片风格，皮肤纹理真实。
  - 背景：柔和虚化、与主题同色系的背景（深绿与金色光斑），不分散注意力。
  - 整体：照片级写实，光疗甲的亮面质感清晰；不要卡通或插画风，手指数量和形态自然，不要变形，不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/GeekCatX/status/2053870919714812413
  author: "@GeekCatX"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "仓库收录的英文版译为中文并整理为分条；主题保留为变量，新增甲型与主色两个变量；示例图用的主题是\"甲虫\"，默认值按示例图改写"
images:
  - 3494-themed-gel-nail-art-closeup-photo-1.jpg
imageCredit:
  by: "@GeekCatX"
  url: https://youmind.com/gpt-image-2-prompts?id=19657
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[金绿色甲虫与昆虫翅膀] 是主题词，换成"水母""青花瓷""极光""奶油草莓蛋糕"都可以，后面的款式示例和背景颜色也相应改一下；[中长杏仁形] 可换成"短方圆""长尖形""中长梯形"；[墨绿色猫眼] 是主色和质地，可换成"裸粉色果冻胶""奶白色磨砂"。

示例图是一只手的近景：指甲是杏仁形，分别做了墨绿猫眼带金边、金线勾勒的彩色翅脉、黑底上的金色小甲虫、黑金晕染和一枚贝壳白的珠光款；左下角一只金绿色的甲虫趴在挂着水珠的叶子上，背景是深绿色和金色的虚化光斑，手指上有一枚细金戒指。

**常见问题**：
- 手指多一根或关节扭曲：加"只出现一只手、五根手指、姿势放松"，必要时改成"只拍四根手指的局部"。
- 款式太花、互相打架：限定"全部款式只用两种主色加金色点缀"。
- 像贴纸不像真甲：强调"光疗甲的厚度和弧面高光、甲缘干净"。

**适合**：美甲师的款式提案、美甲店社媒配图、节日限定款灵感。生成图里的细节未必都能手工实现，给客人看之前先自己评估可做性。

### 原版提示词

```text
Please generate a realistic close-up of hand nail art, with the theme inspiration: {argument name="theme" default="jellyfish"}.

The main subject is a close-up of a meticulously cared-for female hand. The nails feature high-end gel designs, centered around {argument name="theme" default="jellyfish"}, presenting an elegant, clean, refined visual effect characteristic of fashion magazines. Emphasize the detail of the nail art, the glossy texture, and the consistency with the theme's atmosphere.

Composition and Subject Requirements:
The focus is on the hand and nail close-up. Finger gestures are natural and elegant, conveying a sense of luxury. Each nail is designed around the theme, using combinations like hand-painted elements, solid bases with glitter/foil accents, and varied but cohesive styles. Designs should include premium base gel, delicate painting, and matching decorations like sequins or metallic foil. The style must be professional and sophisticated, not cheap or juvenile.

Lighting and Photography:
Soft natural light, no harsh shadows, shallow depth of field, and sharp focus on nail details and gloss. High-end beauty editorial style, professional commercial photography, realistic skin textures, and 4K ultra HD clarity.

Background:
A soft, blurred background that echoes the {argument name="theme" default="jellyfish"} without distracting from the main subject.

Overall Style:
Photorealistic, glossy gel finish, elegant, and clean. Avoid cartoon/illustration styles, distorted fingers, or low-quality textures.

Aspect Ratio: {argument name="aspect ratio" default="3:4"}
```

> 改编自 [@GeekCatX](https://x.com/GeekCatX/status/2053870919714812413) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
