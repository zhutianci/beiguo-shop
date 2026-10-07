---
title: "旅行海报提示词：上半写实风景、下半蓝线条插画的双联旅行海报（gpt-image-2）"
slug: photo-and-line-illustration-travel-poster
model: gpt-image-2
topics: [poster, photo-edit]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一张上下两联的旅行海报：上半是写实的风景摄影，下半是同一场景的极简插画（深蓝手绘线条 + 金黄 / 主题色点缀 + 大圆日），适合旅行账号、文旅宣传和装饰画；也可以上传自己的旅行照片做上半部分。"
prompt: |
  生成一张上下两联的旅行海报（可参考我上传的照片）。
  上半：一张令人惊叹的写实风景——[一列黄色观光列车驶过湖上高架桥]，周围是浓密的金黄秋叶、湛蓝天空、柔和白云和温暖阳光，湖面清晰倒映出整列火车、桥和树。细节丰富、色彩鲜明、电影感旅行摄影、真实光线、焦点锐利。
  下半：把同一场景转成优雅的极简旅行插画：用干净的[深海军蓝]手绘线条画出主体，配[暖金黄]点缀；主体后面一个大大的金色圆日，四角用风格化的秋叶和枝条框住，点缀细小的装饰星星和细横线，背景是米白色。保留照片里可辨认的主体造型和构图，同时赋予它精致的编辑海报美感。
  风格：高端旅行杂志、精致的旅游海报，构图干净，配色和谐，细节丰富，留白平衡，写实到插画的转换，竖版 4:5，不要文字、Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Taaruk_/status/2105579029885759656
  author: "Taaruk"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；把具体场景（黄色观光列车）改为变量，并补充上传自己照片时的写法"
images:
  - 3149-photo-and-line-illustration-travel-poster-1.jpg
  - 3149-photo-and-line-illustration-travel-poster-2.jpg
imageCredit:
  by: "Taaruk"
  url: https://youmind.com/gpt-image-2-prompts?id=35807
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：方括号里的场景换成你的目的地，例如"[圣托里尼的蓝顶教堂和海湾]""[西湖断桥和荷花]""[雪山下的木屋]"；线条色和点缀色跟着场景走（圣托里尼用"钴蓝线条 + 玫红点缀"）。用自己拍的照片时，上传照片并写"上半保留我上传的照片，下半按它画插画"。

示例图两张：一张上半是金黄秋林间湖面上驶过的黄色观光列车和完美倒影，下半是米白底上深蓝线条画的同一列火车、高架桥和一轮金色大圆日；另一张是圣托里尼：上半蓝顶白房子、三角梅和海湾，下半是蓝线条插画配粉色花朵和蓝色圆日。

**常见问题**：
- 上下两半不像同一个场景：强调"下半必须是上半同一场景的插画版，主体造型一致"。
- 下半太复杂：写"只用一种线条色和一种点缀色"。
- 出现文字：保留"不要文字"，标题后期自己排。

**适合**：旅行账号封面、文旅宣传海报、装饰画、明信片。

### 英文原版

```text
Create a two-panel travel poster inspired by the reference images.
Top panel: a breathtaking photorealistic autumn landscape featuring a modern yellow sightseeing train traveling across a long elevated railway bridge over a perfectly calm lake. Surround the scene with dense golden-yellow autumn trees, vivid blue sky, soft white clouds, warm sunlight, and a crystal-clear reflection of the entire train, bridge, and foliage in the water. Highly detailed, vibrant colors, cinematic travel photography, realistic lighting, sharp focus.

Bottom panel: transform the same scene into an elegant minimalist travel illustration. Show the yellow train crossing the elevated bridge, drawn with clean navy-blue hand-drawn linework and warm golden-yellow accents. Add a large golden sun/circle behind the train, stylized autumn leaves and branches framing the corners, subtle decorative stars and fine horizontal lines, and an off-white cream background. Preserve the recognizable train shape and composition from the photograph while giving it a refined editorial poster aesthetic.

Style: premium travel magazine, sophisticated tourism poster, clean composition, harmonious color palette, highly detailed, balanced negative space, realistic-to-illustration transformation, vertical 4:5 layout, no text, no logos, no watermark.
```

> 改编自 [Taaruk](https://x.com/Taaruk_/status/2105579029885759656) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
